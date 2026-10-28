# Siyashesha Health Passport

**Your health. Your records. Wherever you go.**

A patient-owned health record and emergency profile app for the South African healthcare
landscape, built with Expo and React Native so it runs directly in Expo Go on iOS and Android.

## Running the app

```bash
npm install
npx expo start
```

Scan the QR code shown in the terminal with the **Expo Go** app (iOS or Android) to open
Siyashesha on your phone. No backend, account or API key is required — all data is seeded
locally and persists on-device between sessions via `AsyncStorage`.

To sign in, enter your email address to receive a secure 6-digit one-time code via Clerk,
or tap **1-Tap Demo Sign In** to immediately open the pre-seeded clinical passport for Jessica Tebatso.

## What's inside

- **Expo Router** file-based navigation under `src/app`, with a floating pill tab bar
  (`src/components/TabBar.tsx`) across Home, Records, Calendar, Diary and More.
- **NativeWind (Tailwind for React Native)** for styling, themed in `tailwind.config.js` and
  `src/constants/theme.ts`, with a light/dark/system appearance toggle in Settings.
- **Zustand + AsyncStorage** (`src/store/useAppStore.ts`) as the single source of truth for
  everything the patient can edit: records, medications taken, diary notes, emergency-card
  visibility, sharing links, language and settings.
- **Seed data** in `src/data/*.ts` describing the demo patient, Jessica Tebatso, and her
  South African clinical history (Lancet labs, a public clinic, a private GP and a specialist).
- **Health Awareness Days** content (`src/data/healthDays.ts`) and illustrations
  (`assets/health-days/`) sourced from `reference/health-day-icons-src`.
- **POPIA & HIPAA Data Rights & Erasure**: Machine-readable JSON archive (DSAR) export with SHA-256 digital seal, certified clinical summary PDF, and biometric-gated permanent account erasure destroying local files, enclave keys, and Supabase cloud records.
- **Multilingual Voice Dictation**: Speech-to-text journaling in My Diary supporting English, isiZulu, and Afrikaans with Gemini AI audio transcription and Web Speech API fallback.

## Project structure

```
src/
  app/            Expo Router screens (one file = one route)
  components/     Shared UI (buttons, cards, the tab bar, calendar day cell, etc.)
  data/           Typed seed data — swap for real API calls when a backend exists
  store/          Zustand store (persisted) — the app's only mutable state
  i18n/           Language dictionary and the useI18n() hook
  lib/            Small helpers (dates, adherence maths, PDF export, translation safety)
assets/
  health-days/    The 20 WHO health-day illustrations used in the Calendar
  images/         App icon, splash and favicon, generated from the Siyashesha logo
reference/        Source spec, screenshots and original assets (not shipped in the app)
```

## Wiring in a real backend later

Every screen reads from and writes to `useAppStore` rather than touching `src/data/*.ts`
directly, so swapping the local seed data and AsyncStorage persistence for real API calls means
replacing the store's actions (`addRecord`, `createShare`, `updatePatientProfile`, etc.) without
having to change any screen. Authentication is already connected to Clerk email OTP with 1-tap demo access, while full cloud sync and dynamic AI translation are natural extensions.

## Useful commands

```bash
npx expo start            # start the dev server
npx tsc --noEmit           # typecheck
npx expo lint              # lint
npx expo-doctor            # verify native module / config compatibility with Expo Go
```
