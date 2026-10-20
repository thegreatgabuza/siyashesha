import { useCallback } from 'react';

import { useAppStore } from '@/store/useAppStore';
import { getText } from './translations';

export function useI18n() {
  const language = useAppStore((s) => s.language);
  const t = useCallback(
    (key: string, vars?: Record<string, string>) => getText(language, key, vars),
    [language]
  );
  return { t, language };
}
