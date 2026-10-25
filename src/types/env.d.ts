declare namespace NodeJS {
  interface ProcessEnv {
    readonly EXPO_PUBLIC_APP_ENV?: 'development' | 'staging' | 'production';
    readonly EXPO_PUBLIC_API_URL?: string;
    readonly EXPO_PUBLIC_USE_MOCK_DATA?: string;
    readonly EXPO_PUBLIC_EMERGENCY_PORTAL_URL?: string;
    readonly EXPO_PUBLIC_AI_ASSISTANT_PROVIDER?: 'mock' | 'gemini' | 'openai';
    readonly EXPO_PUBLIC_AI_ASSISTANT_API_KEY?: string;
    readonly EXPO_PUBLIC_ENABLE_ANALYTICS?: string;
  }
}
