-- Siyashesha Health Passport: Tenant-Isolated Supabase Schema & Storage Configuration
-- Execute this script in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- ==============================================================================
-- 0. Requesting User Identity Function (Clerk JWT / Supabase Auth / Scoped Header)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.requesting_user_id()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(
    COALESCE(
      auth.jwt() ->> 'sub',
      auth.uid()::text,
      (current_setting('request.headers', true)::json ->> 'x-siyashesha-user-id')
    ),
    ''
  );
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
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf', 'text/plain']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800;

-- Drop legacy permissive storage policies
DROP POLICY IF EXISTS "Public & Anon Read Access for medical-records" ON storage.objects;
DROP POLICY IF EXISTS "Public & Anon Insert Access for medical-records" ON storage.objects;
DROP POLICY IF EXISTS "Public & Anon Update Access for medical-records" ON storage.objects;
DROP POLICY IF EXISTS "Public & Anon Delete Access for medical-records" ON storage.objects;

-- Strict Owner-Scoped Storage RLS Policies (files must reside under <user_id>/...)
DROP POLICY IF EXISTS "Owner read access for medical-records" ON storage.objects;
CREATE POLICY "Owner read access for medical-records"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'medical-records'
  AND public.requesting_user_id() IS NOT NULL
  AND (storage.foldername(name))[1] = public.requesting_user_id()
);

DROP POLICY IF EXISTS "Owner insert access for medical-records" ON storage.objects;
CREATE POLICY "Owner insert access for medical-records"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'medical-records'
  AND public.requesting_user_id() IS NOT NULL
  AND (storage.foldername(name))[1] = public.requesting_user_id()
);

DROP POLICY IF EXISTS "Owner update access for medical-records" ON storage.objects;
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

DROP POLICY IF EXISTS "Owner delete access for medical-records" ON storage.objects;
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

DROP POLICY IF EXISTS "Allow anon and auth read on medical_records" ON public.medical_records;
DROP POLICY IF EXISTS "Allow anon and auth insert on medical_records" ON public.medical_records;
DROP POLICY IF EXISTS "Allow anon and auth update on medical_records" ON public.medical_records;
DROP POLICY IF EXISTS "Allow anon and auth delete on medical_records" ON public.medical_records;
DROP POLICY IF EXISTS "Owner access on medical_records" ON public.medical_records;

CREATE POLICY "Owner access on medical_records"
ON public.medical_records FOR ALL
USING (public.requesting_user_id() IS NOT NULL AND user_id = public.requesting_user_id())
WITH CHECK (public.requesting_user_id() IS NOT NULL AND user_id = public.requesting_user_id());

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

DROP POLICY IF EXISTS "Allow all access on patient_profiles" ON public.patient_profiles;
DROP POLICY IF EXISTS "Owner access on patient_profiles" ON public.patient_profiles;

CREATE POLICY "Owner access on patient_profiles"
ON public.patient_profiles FOR ALL
USING (public.requesting_user_id() IS NOT NULL AND user_id = public.requesting_user_id())
WITH CHECK (public.requesting_user_id() IS NOT NULL AND user_id = public.requesting_user_id());

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

DROP POLICY IF EXISTS "Allow all access on push_notification_tokens" ON public.push_notification_tokens;
DROP POLICY IF EXISTS "Owner access on push_notification_tokens" ON public.push_notification_tokens;

CREATE POLICY "Owner access on push_notification_tokens"
ON public.push_notification_tokens FOR ALL
USING (public.requesting_user_id() IS NOT NULL AND user_id = public.requesting_user_id())
WITH CHECK (public.requesting_user_id() IS NOT NULL AND user_id = public.requesting_user_id());

-- ==============================================================================
-- 8. Scheduled Reminders Server Sync Table (Spec §4.6 & §8.2)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.scheduled_reminders_sync (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT public.requesting_user_id(),
  patient_id TEXT NOT NULL,
  reminder_type TEXT NOT NULL, -- 'medication' | 'missed_dose' | 'appointment' | 'health_day' | 'checkin'
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

DROP POLICY IF EXISTS "Allow all access on scheduled_reminders_sync" ON public.scheduled_reminders_sync;
DROP POLICY IF EXISTS "Owner access on scheduled_reminders_sync" ON public.scheduled_reminders_sync;

CREATE POLICY "Owner access on scheduled_reminders_sync"
ON public.scheduled_reminders_sync FOR ALL
USING (public.requesting_user_id() IS NOT NULL AND user_id = public.requesting_user_id())
WITH CHECK (public.requesting_user_id() IS NOT NULL AND user_id = public.requesting_user_id());
