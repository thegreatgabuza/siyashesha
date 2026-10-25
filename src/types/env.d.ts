declare namespace NodeJS {
  interface ProcessEnv {
    readonly EXPO_PUBLIC_APP_ENV?: 'development' | 'staging' | 'production';
    readonly EXPO_PUBLIC_API_URL?: string;
    readonly EXPO_PUBLIC_USE_MOCK_DATA?: string;
    readonly EXPO_PUBLIC_EMERGENCY_PORTAL_URL?: string;

    // Clerk Authentication
    readonly EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY?: string;

    // Supabase (Database & Storage)
    readonly EXPO_PUBLIC_SUPABASE_URL?: string;
    readonly EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
    readonly EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET?: string;

    // Google Gemini API
    readonly EXPO_PUBLIC_GEMINI_API_KEY?: string;
    readonly EXPO_PUBLIC_AI_ASSISTANT_PROVIDER?: 'mock' | 'gemini' | 'openai';
    readonly EXPO_PUBLIC_GEMINI_MODEL?: string;

    // Analytics & Error Tracking
    readonly EXPO_PUBLIC_ENABLE_ANALYTICS?: string;
  }
}
