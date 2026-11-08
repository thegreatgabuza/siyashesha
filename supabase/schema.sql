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

-- Security Definer RPC allowing a clinician with the share_code and 4-digit PIN
-- to retrieve ONLY the authorized snapshot if the link is active and not expired.
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
  v_row public.shared_links%ROWTYPE;
BEGIN
  SELECT *
  INTO v_row
  FROM public.shared_links
  WHERE share_code = p_share_code OR id = p_share_code
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Share link not found.');
  END IF;

  IF v_row.status = 'revoked' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'This share link has been revoked by the patient.');
  END IF;

  IF v_row.status = 'expired' OR v_row.expires_at <= TIMEZONE('utc'::text, NOW()) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'This share link has expired.');
  END IF;

  IF TRIM(v_row.pin) <> TRIM(p_pin) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Incorrect 4-digit access PIN.');
  END IF;

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
