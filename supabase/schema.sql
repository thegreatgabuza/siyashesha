-- Siyashesha Health Passport: Hardened Tenant-Isolated Supabase Schema & Storage Configuration
-- Fully protected with Row-Level Security, Search Path Safety, and Cryptographic JWT Verification.

-- ==============================================================================
-- 0. Cryptographically Verified User Identity Function (Clerk JWT / Supabase Auth)
-- Rejects unverified client headers to prevent tenant impersonation.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.requesting_user_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT NULLIF(
    COALESCE(
      (auth.jwt() ->> 'sub'),
      (auth.uid())::text
    ),
    ''
  );
$$;

REVOKE EXECUTE ON FUNCTION public.requesting_user_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.requesting_user_id() TO anon, authenticated, service_role;

-- ==============================================================================
-- 0.1 Automated updated_at Timestamp Trigger Function
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$;

-- ==============================================================================
-- 1. Private Storage Bucket: medical-records (public = false)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'medical-records',
  'medical-records',
  false,
  52428800, -- 50MB
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

-- Drop legacy permissive storage policies
DROP POLICY IF EXISTS "Public & Anon Read Access for medical-records" ON storage.objects;
DROP POLICY IF EXISTS "Public & Anon Insert Access for medical-records" ON storage.objects;
DROP POLICY IF EXISTS "Public & Anon Update Access for medical-records" ON storage.objects;
DROP POLICY IF EXISTS "Public & Anon Delete Access for medical-records" ON storage.objects;
DROP POLICY IF EXISTS "Owner read access for medical-records" ON storage.objects;
DROP POLICY IF EXISTS "Owner insert access for medical-records" ON storage.objects;
DROP POLICY IF EXISTS "Owner update access for medical-records" ON storage.objects;
DROP POLICY IF EXISTS "Owner delete access for medical-records" ON storage.objects;

-- Strict Owner-Scoped Storage RLS Policies (files must reside under <user_id>/...)
CREATE POLICY "Owner read access for medical-records"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'medical-records'
  AND public.requesting_user_id() IS NOT NULL
  AND (storage.foldername(name))[1] = public.requesting_user_id()
);

CREATE POLICY "Owner insert access for medical-records"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'medical-records'
  AND public.requesting_user_id() IS NOT NULL
  AND (storage.foldername(name))[1] = public.requesting_user_id()
);

CREATE POLICY "Owner update access for medical-records"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'medical-records'
  AND public.requesting_user_id() IS NOT NULL
  AND (storage.foldername(name))[1] = public.requesting_user_id()
)
WITH CHECK (
  bucket_id = 'medical-records'
  AND public.requesting_user_id() IS NOT NULL
  AND (storage.foldername(name))[1] = public.requesting_user_id()
);

CREATE POLICY "Owner delete access for medical-records"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'medical-records'
  AND public.requesting_user_id() IS NOT NULL
  AND (storage.foldername(name))[1] = public.requesting_user_id()
);

-- ==============================================================================
-- 2. Medical Records Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.medical_records (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT public.requesting_user_id(),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  facility TEXT NOT NULL,
  doctor TEXT,
  diagnosis TEXT,
  follow_up TEXT,
  event_date TEXT NOT NULL,
  uploaded_at TEXT NOT NULL,
  source_type TEXT NOT NULL,
  document_type TEXT NOT NULL,
  status TEXT NOT NULL,
  clinical_notes TEXT,
  fields JSONB DEFAULT '[]'::jsonb,
  original_file_uri TEXT,
  original_file_name TEXT,
  original_file_mime TEXT,
  remote_url TEXT,
  storage_path TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.medical_records ADD COLUMN IF NOT EXISTS user_id TEXT DEFAULT public.requesting_user_id();
CREATE INDEX IF NOT EXISTS idx_medical_records_user_id ON public.medical_records(user_id);

ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon and auth read on medical_records" ON public.medical_records;
DROP POLICY IF EXISTS "Allow anon and auth insert on medical_records" ON public.medical_records;
DROP POLICY IF EXISTS "Allow anon and auth update on medical_records" ON public.medical_records;
DROP POLICY IF EXISTS "Allow anon and auth delete on medical_records" ON public.medical_records;
DROP POLICY IF EXISTS "Owner access on medical_records" ON public.medical_records;

CREATE POLICY "Owner access on medical_records"
ON public.medical_records FOR ALL
USING (public.requesting_user_id() IS NOT NULL AND user_id = public.requesting_user_id())
WITH CHECK (public.requesting_user_id() IS NOT NULL AND user_id = public.requesting_user_id());

DROP TRIGGER IF EXISTS trg_medical_records_updated_at ON public.medical_records;
CREATE TRIGGER trg_medical_records_updated_at
BEFORE UPDATE ON public.medical_records
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 3. Patient Profiles Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.patient_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT public.requesting_user_id(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  preferred_name TEXT,
  date_of_birth TEXT NOT NULL,
  national_id TEXT,
  blood_group TEXT,
  allergies JSONB DEFAULT '[]'::jsonb,
  conditions JSONB DEFAULT '[]'::jsonb,
  emergency_contacts JSONB DEFAULT '[]'::jsonb,
  primary_facility TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.patient_profiles ADD COLUMN IF NOT EXISTS user_id TEXT DEFAULT public.requesting_user_id();
CREATE INDEX IF NOT EXISTS idx_patient_profiles_user_id ON public.patient_profiles(user_id);

ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_profiles FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access on patient_profiles" ON public.patient_profiles;
DROP POLICY IF EXISTS "Owner access on patient_profiles" ON public.patient_profiles;

CREATE POLICY "Owner access on patient_profiles"
ON public.patient_profiles FOR ALL
USING (public.requesting_user_id() IS NOT NULL AND user_id = public.requesting_user_id())
WITH CHECK (public.requesting_user_id() IS NOT NULL AND user_id = public.requesting_user_id());

DROP TRIGGER IF EXISTS trg_patient_profiles_updated_at ON public.patient_profiles;
CREATE TRIGGER trg_patient_profiles_updated_at
BEFORE UPDATE ON public.patient_profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 4. Medications Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.medications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT public.requesting_user_id(),
  name TEXT NOT NULL,
  dose TEXT NOT NULL,
  frequency TEXT NOT NULL,
  times JSONB DEFAULT '[]'::jsonb,
  instructions TEXT,
  purpose TEXT,
  prescribed_by TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.medications ADD COLUMN IF NOT EXISTS user_id TEXT DEFAULT public.requesting_user_id();
CREATE INDEX IF NOT EXISTS idx_medications_user_id ON public.medications(user_id);

ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access on medications" ON public.medications;
DROP POLICY IF EXISTS "Owner access on medications" ON public.medications;

CREATE POLICY "Owner access on medications"
ON public.medications FOR ALL
USING (public.requesting_user_id() IS NOT NULL AND user_id = public.requesting_user_id())
WITH CHECK (public.requesting_user_id() IS NOT NULL AND user_id = public.requesting_user_id());

-- ==============================================================================
-- 5. Appointments Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.appointments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT public.requesting_user_id(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  facility TEXT NOT NULL,
  provider TEXT,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  status TEXT DEFAULT 'confirmed',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS user_id TEXT DEFAULT public.requesting_user_id();
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON public.appointments(user_id);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access on appointments" ON public.appointments;
DROP POLICY IF EXISTS "Owner access on appointments" ON public.appointments;

CREATE POLICY "Owner access on appointments"
ON public.appointments FOR ALL
USING (public.requesting_user_id() IS NOT NULL AND user_id = public.requesting_user_id())
WITH CHECK (public.requesting_user_id() IS NOT NULL AND user_id = public.requesting_user_id());

-- ==============================================================================
-- 6. Diary Notes Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.diary_notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT public.requesting_user_id(),
  date TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  tags JSONB DEFAULT '[]'::jsonb,
  mood TEXT,
  audio_uri TEXT,
  audio_duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.diary_notes ADD COLUMN IF NOT EXISTS user_id TEXT DEFAULT public.requesting_user_id();
CREATE INDEX IF NOT EXISTS idx_diary_notes_user_id ON public.diary_notes(user_id);

ALTER TABLE public.diary_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diary_notes FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access on diary_notes" ON public.diary_notes;
DROP POLICY IF EXISTS "Owner access on diary_notes" ON public.diary_notes;

CREATE POLICY "Owner access on diary_notes"
ON public.diary_notes FOR ALL
USING (public.requesting_user_id() IS NOT NULL AND user_id = public.requesting_user_id())
WITH CHECK (public.requesting_user_id() IS NOT NULL AND user_id = public.requesting_user_id());

-- ==============================================================================
-- 7. Push Notification Tokens Table (Spec §4.6 & §8.2)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.push_notification_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT public.requesting_user_id(),
  patient_id TEXT NOT NULL,
  expo_push_token TEXT NOT NULL,
  device_os TEXT,
  device_name TEXT,
  app_version TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.push_notification_tokens ADD COLUMN IF NOT EXISTS user_id TEXT DEFAULT public.requesting_user_id();
CREATE INDEX IF NOT EXISTS idx_push_notification_tokens_user_id ON public.push_notification_tokens(user_id);

ALTER TABLE public.push_notification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_notification_tokens FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access on push_notification_tokens" ON public.push_notification_tokens;
DROP POLICY IF EXISTS "Owner access on push_notification_tokens" ON public.push_notification_tokens;

CREATE POLICY "Owner access on push_notification_tokens"
ON public.push_notification_tokens FOR ALL
USING (public.requesting_user_id() IS NOT NULL AND user_id = public.requesting_user_id())
WITH CHECK (public.requesting_user_id() IS NOT NULL AND user_id = public.requesting_user_id());

DROP TRIGGER IF EXISTS trg_push_notification_tokens_updated_at ON public.push_notification_tokens;
CREATE TRIGGER trg_push_notification_tokens_updated_at
BEFORE UPDATE ON public.push_notification_tokens
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 8. Scheduled Reminders Server Sync Table (Spec §4.6 & §8.2)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.scheduled_reminders_sync (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT public.requesting_user_id(),
  patient_id TEXT NOT NULL,
  reminder_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  scheduled_time TEXT NOT NULL,
  recurrence TEXT DEFAULT 'daily',
  status TEXT DEFAULT 'active',
  metadata JSONB DEFAULT '{}'::jsonb,
  synced_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.scheduled_reminders_sync ADD COLUMN IF NOT EXISTS user_id TEXT DEFAULT public.requesting_user_id();
CREATE INDEX IF NOT EXISTS idx_scheduled_reminders_sync_user_id ON public.scheduled_reminders_sync(user_id);

ALTER TABLE public.scheduled_reminders_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_reminders_sync FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access on scheduled_reminders_sync" ON public.scheduled_reminders_sync;
DROP POLICY IF EXISTS "Owner access on scheduled_reminders_sync" ON public.scheduled_reminders_sync;

CREATE POLICY "Owner access on scheduled_reminders_sync"
ON public.scheduled_reminders_sync FOR ALL
USING (public.requesting_user_id() IS NOT NULL AND user_id = public.requesting_user_id())
WITH CHECK (public.requesting_user_id() IS NOT NULL AND user_id = public.requesting_user_id());

-- ==============================================================================
-- 9. Clinician / Doctor Shared Links Table & PIN Verification RPC
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.shared_links (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT public.requesting_user_id(),
  share_code TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_facility TEXT NOT NULL,
  record_ids JSONB DEFAULT '[]'::jsonb,
  diary_note_ids JSONB DEFAULT '[]'::jsonb,
  duration_id TEXT NOT NULL,
  pin TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_shared_links_user_id ON public.shared_links(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_links_share_code ON public.shared_links(share_code);

ALTER TABLE public.shared_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_links FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner access on shared_links" ON public.shared_links;

CREATE POLICY "Owner access on shared_links"
ON public.shared_links FOR ALL
USING (public.requesting_user_id() IS NOT NULL AND user_id = public.requesting_user_id())
WITH CHECK (public.requesting_user_id() IS NOT NULL AND user_id = public.requesting_user_id());

DROP TRIGGER IF EXISTS trg_shared_links_updated_at ON public.shared_links;
CREATE TRIGGER trg_shared_links_updated_at
BEFORE UPDATE ON public.shared_links
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Brute-force protection ledger for verify_shared_link (locked out after 5 failed attempts for 15 minutes)
CREATE TABLE IF NOT EXISTS public.shared_link_attempts (
  share_code TEXT PRIMARY KEY,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  last_failed_at TIMESTAMPTZ,
  locked_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.shared_link_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_link_attempts FORCE ROW LEVEL SECURITY;

-- Security Definer RPC allowing a clinician with the share_code and 4-digit PIN
-- to retrieve ONLY the authorized snapshot if the link is active, not locked, and not expired.
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
-- 10. Verified Healthcare Practitioners Directory & Anti-Self-Verification Trigger
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
-- 11. Cross-Device Doctor Bookings & Atomic Slot Uniqueness
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

-- Prevent cross-device double-booking of an active time slot at the database level
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

-- Automatically bind doctor_user_id & doctor_email from doctors registry on insert
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

-- Privacy-preserving slot availability check (returns booked HH:mm slots without patient PHI)
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
-- 12. Server-Verified Subscriptions & Single-Use Trial Entitlements
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

-- Idempotent one-time 7-day Annual Pro trial RPC (prevents client replay/extending trials)
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
-- 13. Server-Side API Rate Limiting Ledger (Used by Edge Functions via service_role)
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
