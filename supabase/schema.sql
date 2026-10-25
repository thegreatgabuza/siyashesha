-- Siyashesha Health Passport: Supabase Schema & Storage Configuration
-- Execute this script in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- ==============================================================================
-- 1. Storage Bucket: medical-records
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'medical-records',
  'medical-records',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf', 'text/plain']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800;

-- Storage RLS Policies for medical-records bucket
DROP POLICY IF EXISTS "Public & Anon Read Access for medical-records" ON storage.objects;
CREATE POLICY "Public & Anon Read Access for medical-records"
ON storage.objects FOR SELECT
USING (bucket_id = 'medical-records');

DROP POLICY IF EXISTS "Public & Anon Insert Access for medical-records" ON storage.objects;
CREATE POLICY "Public & Anon Insert Access for medical-records"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'medical-records');

DROP POLICY IF EXISTS "Public & Anon Update Access for medical-records" ON storage.objects;
CREATE POLICY "Public & Anon Update Access for medical-records"
ON storage.objects FOR UPDATE
USING (bucket_id = 'medical-records');

DROP POLICY IF EXISTS "Public & Anon Delete Access for medical-records" ON storage.objects;
CREATE POLICY "Public & Anon Delete Access for medical-records"
ON storage.objects FOR DELETE
USING (bucket_id = 'medical-records');

-- ==============================================================================
-- 2. Medical Records Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.medical_records (
  id TEXT PRIMARY KEY,
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

ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon and auth read on medical_records" ON public.medical_records;
CREATE POLICY "Allow anon and auth read on medical_records"
ON public.medical_records FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anon and auth insert on medical_records" ON public.medical_records;
CREATE POLICY "Allow anon and auth insert on medical_records"
ON public.medical_records FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon and auth update on medical_records" ON public.medical_records;
CREATE POLICY "Allow anon and auth update on medical_records"
ON public.medical_records FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow anon and auth delete on medical_records" ON public.medical_records;
CREATE POLICY "Allow anon and auth delete on medical_records"
ON public.medical_records FOR DELETE USING (true);

-- ==============================================================================
-- 3. Patient Profiles Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.patient_profiles (
  id TEXT PRIMARY KEY,
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

ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access on patient_profiles" ON public.patient_profiles;
CREATE POLICY "Allow all access on patient_profiles"
ON public.patient_profiles FOR ALL USING (true);

-- ==============================================================================
-- 4. Medications Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.medications (
  id TEXT PRIMARY KEY,
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

ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access on medications" ON public.medications;
CREATE POLICY "Allow all access on medications"
ON public.medications FOR ALL USING (true);

-- ==============================================================================
-- 5. Appointments Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.appointments (
  id TEXT PRIMARY KEY,
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

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access on appointments" ON public.appointments;
CREATE POLICY "Allow all access on appointments"
ON public.appointments FOR ALL USING (true);

-- ==============================================================================
-- 6. Diary Notes Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.diary_notes (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  tags JSONB DEFAULT '[]'::jsonb,
  mood TEXT,
  audio_uri TEXT,
  audio_duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.diary_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access on diary_notes" ON public.diary_notes;
CREATE POLICY "Allow all access on diary_notes"
ON public.diary_notes FOR ALL USING (true);
