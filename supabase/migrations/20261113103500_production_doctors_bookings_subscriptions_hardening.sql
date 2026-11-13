-- Migration: Production hardening for shared link brute-force protection,
-- cross-device doctors & bookings sync, server-verified subscriptions, and API rate limits.

-- ==============================================================================
-- 1. Brute-Force Protection Ledger for verify_shared_link
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.shared_link_attempts (
  share_code TEXT PRIMARY KEY,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  last_failed_at TIMESTAMPTZ,
  locked_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.shared_link_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_link_attempts FORCE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.verify_shared_link(
  p_share_code TEXT,
  p_pin TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_code TEXT;
  v_row public.shared_links%ROWTYPE;
  v_attempt public.shared_link_attempts%ROWTYPE;
  v_new_failures INTEGER;
BEGIN
  v_code := TRIM(COALESCE(p_share_code, ''));
  IF v_code = '' OR LENGTH(TRIM(COALESCE(p_pin, ''))) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Share code and 4-digit PIN are required.');
  END IF;

  SELECT *
  INTO v_row
  FROM public.shared_links
  WHERE share_code = v_code OR id = v_code
  LIMIT 1;

  v_code := COALESCE(v_row.share_code, v_code);

  SELECT *
  INTO v_attempt
  FROM public.shared_link_attempts
  WHERE share_code = v_code;

  IF FOUND AND v_attempt.locked_until IS NOT NULL AND v_attempt.locked_until > TIMEZONE('utc'::text, NOW()) THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'Too many incorrect PIN attempts. Access temporarily locked for 15 minutes.'
    );
  END IF;

  IF v_row.id IS NULL THEN
    v_new_failures := CASE
      WHEN v_attempt.last_failed_at IS NOT NULL AND v_attempt.last_failed_at > TIMEZONE('utc'::text, NOW()) - INTERVAL '15 minutes'
      THEN COALESCE(v_attempt.failed_attempts, 0) + 1
      ELSE 1
    END;
    INSERT INTO public.shared_link_attempts (share_code, failed_attempts, last_failed_at, locked_until, updated_at)
    VALUES (
      v_code,
      v_new_failures,
      TIMEZONE('utc'::text, NOW()),
      CASE WHEN v_new_failures >= 5 THEN TIMEZONE('utc'::text, NOW()) + INTERVAL '15 minutes' ELSE NULL END,
      TIMEZONE('utc'::text, NOW())
    )
    ON CONFLICT (share_code) DO UPDATE SET
      failed_attempts = EXCLUDED.failed_attempts,
      last_failed_at = EXCLUDED.last_failed_at,
      locked_until = EXCLUDED.locked_until,
      updated_at = EXCLUDED.updated_at;

    RETURN jsonb_build_object('ok', false, 'error', 'Share link not found.');
  END IF;

  IF v_row.status = 'revoked' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'This share link has been revoked by the patient.');
  END IF;

  IF v_row.status = 'expired' OR v_row.expires_at <= TIMEZONE('utc'::text, NOW()) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'This share link has expired.');
  END IF;

  IF TRIM(v_row.pin) <> TRIM(p_pin) THEN
    v_new_failures := CASE
      WHEN v_attempt.last_failed_at IS NOT NULL AND v_attempt.last_failed_at > TIMEZONE('utc'::text, NOW()) - INTERVAL '15 minutes'
      THEN COALESCE(v_attempt.failed_attempts, 0) + 1
      ELSE 1
    END;
    INSERT INTO public.shared_link_attempts (share_code, failed_attempts, last_failed_at, locked_until, updated_at)
    VALUES (
      v_code,
      v_new_failures,
      TIMEZONE('utc'::text, NOW()),
      CASE WHEN v_new_failures >= 5 THEN TIMEZONE('utc'::text, NOW()) + INTERVAL '15 minutes' ELSE NULL END,
      TIMEZONE('utc'::text, NOW())
    )
    ON CONFLICT (share_code) DO UPDATE SET
      failed_attempts = EXCLUDED.failed_attempts,
      last_failed_at = EXCLUDED.last_failed_at,
      locked_until = EXCLUDED.locked_until,
      updated_at = EXCLUDED.updated_at;

    RETURN jsonb_build_object('ok', false, 'error', 'Incorrect 4-digit access PIN.');
  END IF;

  DELETE FROM public.shared_link_attempts WHERE share_code = v_code;

  RETURN jsonb_build_object(
    'ok', true,
    'id', v_row.share_code,
    'recipientName', v_row.recipient_name,
    'recipientFacility', v_row.recipient_facility,
    'recordIds', v_row.record_ids,
    'diaryNoteIds', v_row.diary_note_ids,
    'durationId', v_row.duration_id,
    'createdAt', v_row.created_at,
    'expiresAt', v_row.expires_at,
    'status', v_row.status,
    'payload', v_row.payload
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.verify_shared_link(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_shared_link(TEXT, TEXT) TO anon, authenticated, service_role;

-- ==============================================================================
-- 2. Healthcare Practitioners Directory
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.doctors (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT public.requesting_user_id(),
  title TEXT NOT NULL,
  full_name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  hpcsa_number TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verified_at TIMESTAMPTZ,
  practice_name TEXT NOT NULL,
  practice_address TEXT NOT NULL,
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  bio TEXT NOT NULL,
  qualifications JSONB NOT NULL DEFAULT '[]'::jsonb,
  avatar_url TEXT,
  rating NUMERIC(3,2) NOT NULL DEFAULT 5.0,
  reviews_count INTEGER NOT NULL DEFAULT 0,
  consultation_modes JSONB NOT NULL DEFAULT '["in_person","video"]'::jsonb,
  availability JSONB NOT NULL DEFAULT '{}'::jsonb,
  services JSONB NOT NULL DEFAULT '[]'::jsonb,
  medical_aids JSONB NOT NULL DEFAULT '[]'::jsonb,
  patient_highlight TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON public.doctors(user_id);
CREATE INDEX IF NOT EXISTS idx_doctors_email_lower ON public.doctors((LOWER(email)));
CREATE INDEX IF NOT EXISTS idx_doctors_specialty ON public.doctors(specialty);
CREATE INDEX IF NOT EXISTS idx_doctors_city ON public.doctors(city);

ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public directory read on doctors" ON public.doctors;
DROP POLICY IF EXISTS "Doctor owner insert on doctors" ON public.doctors;
DROP POLICY IF EXISTS "Doctor owner update on doctors" ON public.doctors;
DROP POLICY IF EXISTS "Doctor owner delete on doctors" ON public.doctors;

CREATE POLICY "Public directory read on doctors"
ON public.doctors FOR SELECT
USING (true);

CREATE POLICY "Doctor owner insert on doctors"
ON public.doctors FOR INSERT
WITH CHECK (public.requesting_user_id() IS NOT NULL AND user_id = public.requesting_user_id());

CREATE POLICY "Doctor owner update on doctors"
ON public.doctors FOR UPDATE
USING (public.requesting_user_id() IS NOT NULL AND user_id = public.requesting_user_id())
WITH CHECK (public.requesting_user_id() IS NOT NULL AND user_id = public.requesting_user_id());

CREATE POLICY "Doctor owner delete on doctors"
ON public.doctors FOR DELETE
USING (public.requesting_user_id() IS NOT NULL AND user_id = public.requesting_user_id());

CREATE OR REPLACE FUNCTION public.protect_doctor_verification_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF current_setting('role', true) <> 'service_role' THEN
    IF TG_OP = 'INSERT' THEN
      NEW.verification_status := 'pending';
      NEW.verified_at := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
      NEW.verification_status := OLD.verification_status;
      NEW.verified_at := OLD.verified_at;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_doctors_protect_verification ON public.doctors;
CREATE TRIGGER trg_doctors_protect_verification
BEFORE INSERT OR UPDATE ON public.doctors
FOR EACH ROW
EXECUTE FUNCTION public.protect_doctor_verification_status();

DROP TRIGGER IF EXISTS trg_doctors_updated_at ON public.doctors;
CREATE TRIGGER trg_doctors_updated_at
BEFORE UPDATE ON public.doctors
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 3. Cross-Device Doctor Bookings & Slot Uniqueness
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.doctor_bookings (
  id TEXT PRIMARY KEY,
  doctor_id TEXT NOT NULL,
  doctor_user_id TEXT,
  doctor_email TEXT,
  patient_user_id TEXT NOT NULL DEFAULT public.requesting_user_id(),
  doctor_name TEXT NOT NULL,
  doctor_specialty TEXT NOT NULL,
  practice_name TEXT NOT NULL,
  practice_address TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  patient_email TEXT NOT NULL,
  service_id TEXT NOT NULL,
  service_name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  price_zar INTEGER NOT NULL,
  booking_date TEXT NOT NULL,
  booking_time TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('in_person', 'video')),
  notes TEXT,
  patient_summary JSONB DEFAULT '{}'::jsonb,
  consultation_notes JSONB,
  prescriptions JSONB DEFAULT '[]'::jsonb,
  sick_certificate JSONB,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'completed', 'cancelled')),
  linked_appointment_id TEXT,
  telehealth_room_token TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_doctor_bookings_doctor_id ON public.doctor_bookings(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_bookings_doctor_user_id ON public.doctor_bookings(doctor_user_id);
CREATE INDEX IF NOT EXISTS idx_doctor_bookings_patient_user_id ON public.doctor_bookings(patient_user_id);
CREATE INDEX IF NOT EXISTS idx_doctor_bookings_date ON public.doctor_bookings(doctor_id, booking_date);

CREATE UNIQUE INDEX IF NOT EXISTS idx_doctor_bookings_active_slot
ON public.doctor_bookings(doctor_id, booking_date, booking_time)
WHERE status <> 'cancelled';

ALTER TABLE public.doctor_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_bookings FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Booking participants read" ON public.doctor_bookings;
DROP POLICY IF EXISTS "Patient insert booking" ON public.doctor_bookings;
DROP POLICY IF EXISTS "Booking participants update" ON public.doctor_bookings;
DROP POLICY IF EXISTS "Patient delete booking" ON public.doctor_bookings;

CREATE POLICY "Booking participants read"
ON public.doctor_bookings FOR SELECT
USING (
  public.requesting_user_id() IS NOT NULL
  AND (
    patient_user_id = public.requesting_user_id()
    OR doctor_user_id = public.requesting_user_id()
    OR EXISTS (
      SELECT 1 FROM public.doctors d
      WHERE d.id = doctor_bookings.doctor_id
        AND d.user_id = public.requesting_user_id()
    )
  )
);

CREATE POLICY "Patient insert booking"
ON public.doctor_bookings FOR INSERT
WITH CHECK (
  public.requesting_user_id() IS NOT NULL
  AND patient_user_id = public.requesting_user_id()
);

CREATE POLICY "Booking participants update"
ON public.doctor_bookings FOR UPDATE
USING (
  public.requesting_user_id() IS NOT NULL
  AND (
    patient_user_id = public.requesting_user_id()
    OR doctor_user_id = public.requesting_user_id()
    OR EXISTS (
      SELECT 1 FROM public.doctors d
      WHERE d.id = doctor_bookings.doctor_id
        AND d.user_id = public.requesting_user_id()
    )
  )
)
WITH CHECK (
  public.requesting_user_id() IS NOT NULL
  AND (
    patient_user_id = public.requesting_user_id()
    OR doctor_user_id = public.requesting_user_id()
    OR EXISTS (
      SELECT 1 FROM public.doctors d
      WHERE d.id = doctor_bookings.doctor_id
        AND d.user_id = public.requesting_user_id()
    )
  )
);

CREATE POLICY "Patient delete booking"
ON public.doctor_bookings FOR DELETE
USING (
  public.requesting_user_id() IS NOT NULL
  AND patient_user_id = public.requesting_user_id()
);

CREATE OR REPLACE FUNCTION public.bind_doctor_booking_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_doc_user_id TEXT;
  v_doc_email TEXT;
BEGIN
  SELECT user_id, email
  INTO v_doc_user_id, v_doc_email
  FROM public.doctors
  WHERE id = NEW.doctor_id
  LIMIT 1;

  IF v_doc_user_id IS NOT NULL THEN
    NEW.doctor_user_id := v_doc_user_id;
  END IF;
  IF v_doc_email IS NOT NULL THEN
    NEW.doctor_email := v_doc_email;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_doctor_bookings_bind_owner ON public.doctor_bookings;
CREATE TRIGGER trg_doctor_bookings_bind_owner
BEFORE INSERT ON public.doctor_bookings
FOR EACH ROW
EXECUTE FUNCTION public.bind_doctor_booking_owner();

DROP TRIGGER IF EXISTS trg_doctor_bookings_updated_at ON public.doctor_bookings;
CREATE TRIGGER trg_doctor_bookings_updated_at
BEFORE UPDATE ON public.doctor_bookings
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.get_doctor_booked_slots(
  p_doctor_id TEXT,
  p_date TEXT
)
RETURNS TABLE(booking_time TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT b.booking_time
  FROM public.doctor_bookings b
  WHERE b.doctor_id = p_doctor_id
    AND b.booking_date = p_date
    AND b.status <> 'cancelled';
$$;

REVOKE EXECUTE ON FUNCTION public.get_doctor_booked_slots(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_doctor_booked_slots(TEXT, TEXT) TO anon, authenticated, service_role;

-- ==============================================================================
-- 4. Server-Verified Subscriptions & Single-Use Trial Entitlements
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  user_id TEXT PRIMARY KEY DEFAULT public.requesting_user_id(),
  plan TEXT NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'monthly_premium', 'annual_premium', 'lifetime_premium')),
  source TEXT NOT NULL DEFAULT 'free'
    CHECK (source IN ('free', 'trial', 'apple_app_store', 'google_play')),
  product_id TEXT,
  transaction_id TEXT,
  original_transaction_id TEXT,
  trial_started_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  verification_status TEXT NOT NULL DEFAULT 'none'
    CHECK (verification_status IN ('none', 'trial', 'verified', 'unverified_pending', 'expired', 'revoked')),
  raw_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner read subscriptions" ON public.subscriptions;
CREATE POLICY "Owner read subscriptions"
ON public.subscriptions FOR SELECT
USING (public.requesting_user_id() IS NOT NULL AND user_id = public.requesting_user_id());

DROP TRIGGER IF EXISTS trg_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER trg_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.start_free_annual_trial()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id TEXT;
  v_existing public.subscriptions%ROWTYPE;
  v_trial_end TIMESTAMPTZ;
BEGIN
  v_user_id := public.requesting_user_id();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Authentication required to activate a trial.');
  END IF;

  SELECT * INTO v_existing FROM public.subscriptions WHERE user_id = v_user_id;

  IF FOUND AND v_existing.trial_started_at IS NOT NULL THEN
    RETURN jsonb_build_object(
      'ok', v_existing.trial_ends_at > TIMEZONE('utc'::text, NOW()),
      'alreadyClaimed', true,
      'plan', v_existing.plan,
      'trialEndsAt', v_existing.trial_ends_at,
      'verificationStatus', v_existing.verification_status
    );
  END IF;

  v_trial_end := TIMEZONE('utc'::text, NOW()) + INTERVAL '7 days';

  INSERT INTO public.subscriptions (
    user_id, plan, source, product_id, trial_started_at, trial_ends_at, verified_at, verification_status
  ) VALUES (
    v_user_id,
    'annual_premium',
    'trial',
    'za.co.siyashesha.healthpassport.annual_premium',
    TIMEZONE('utc'::text, NOW()),
    v_trial_end,
    TIMEZONE('utc'::text, NOW()),
    'trial'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    plan = 'annual_premium',
    source = 'trial',
    product_id = 'za.co.siyashesha.healthpassport.annual_premium',
    trial_started_at = TIMEZONE('utc'::text, NOW()),
    trial_ends_at = v_trial_end,
    verified_at = TIMEZONE('utc'::text, NOW()),
    verification_status = 'trial';

  RETURN jsonb_build_object(
    'ok', true,
    'alreadyClaimed', false,
    'plan', 'annual_premium',
    'trialEndsAt', v_trial_end,
    'verificationStatus', 'trial'
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.start_free_annual_trial() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_free_annual_trial() TO authenticated, service_role;

-- ==============================================================================
-- 5. Server-Side API Rate Limiting Ledger
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  rate_key TEXT PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_rate_limits FORCE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.check_api_rate_limit(
  p_key TEXT,
  p_max_requests INTEGER DEFAULT 30,
  p_window_seconds INTEGER DEFAULT 600
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_now TIMESTAMPTZ := TIMEZONE('utc'::text, NOW());
  v_window INTERVAL := MAKE_INTERVAL(secs => GREATEST(p_window_seconds, 1));
  v_row public.api_rate_limits%ROWTYPE;
BEGIN
  SELECT * INTO v_row FROM public.api_rate_limits WHERE rate_key = p_key FOR UPDATE;

  IF NOT FOUND OR v_row.window_start + v_window <= v_now THEN
    INSERT INTO public.api_rate_limits (rate_key, window_start, request_count, updated_at)
    VALUES (p_key, v_now, 1, v_now)
    ON CONFLICT (rate_key) DO UPDATE SET
      window_start = v_now,
      request_count = 1,
      updated_at = v_now;
    RETURN jsonb_build_object('allowed', true, 'remaining', GREATEST(p_max_requests - 1, 0));
  END IF;

  IF v_row.request_count >= p_max_requests THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'remaining', 0,
      'retryAfterSeconds', GREATEST(CEIL(EXTRACT(EPOCH FROM (v_row.window_start + v_window - v_now)))::INTEGER, 1)
    );
  END IF;

  UPDATE public.api_rate_limits
  SET request_count = request_count + 1, updated_at = v_now
  WHERE rate_key = p_key;

  RETURN jsonb_build_object('allowed', true, 'remaining', GREATEST(p_max_requests - (v_row.request_count + 1), 0));
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_api_rate_limit(TEXT, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_api_rate_limit(TEXT, INTEGER, INTEGER) TO service_role;
