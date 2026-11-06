import { CheckCircle2, ShieldCheck, Sparkles, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Pill } from '@/components/ui/Pill';
import type { MedicalRecord } from '@/data/records';
import { languageNames, type LanguageCode } from '@/i18n/translations';
import { tapFeedback } from '@/lib/feedback';
import {
  translateRecordNotes,
  translateRecordNotesWithGemini,
  translationSafetyNotice,
} from '@/lib/translate';
import { useAccent } from '@/hooks/useAccent';
import { useAppStore } from '@/store/useAppStore';

type ViewMode = 'side-by-side' | 'translated' | 'original';

const availableLanguages: LanguageCode[] = ['zu', 'af', 'tn', 'sw', 'fr', 'de'];

export function TranslationSheet({
  visible,
  onClose,
  record,
  defaultLanguage,
}: {
  visible: boolean;
  onClose: () => void;
  record: MedicalRecord;
  defaultLanguage: LanguageCode;
}) {
  const { accent } = useAccent();
  const insets = useSafeAreaInsets();
  const aiConsentGranted = useAppStore((s) => s.aiConsentGranted);
  const setAiConsentGranted = useAppStore((s) => s.setAiConsentGranted);
  const [mode, setMode] = useState<ViewMode>('side-by-side');
  const [lang, setLang] = useState<LanguageCode>(
    availableLanguages.includes(defaultLanguage) ? defaultLanguage : 'zu'
  );
  const [resolvedMap, setResolvedMap] = useState<Record<string, string | null>>({});

  const requestKey = `${record.id}:${lang}`;
  const syncCached = translateRecordNotes(record, lang);
  const hasResolved = Object.prototype.hasOwnProperty.call(resolvedMap, requestKey);
  const translated = syncCached ?? (hasResolved ? resolvedMap[requestKey] : null);
  const needsConsent = !syncCached && !aiConsentGranted;
  const loading = visible && !syncCached && aiConsentGranted && !hasResolved;

  useEffect(() => {
    if (!visible || syncCached || !aiConsentGranted || hasResolved) return;
    let cancelled = false;
    translateRecordNotesWithGemini(record, lang)
      .then((res) => {
        if (!cancelled) {
          setResolvedMap((prev) => ({ ...prev, [requestKey]: res }));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResolvedMap((prev) => ({ ...prev, [requestKey]: null }));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [visible, record, lang, requestKey, syncCached, aiConsentGranted, hasResolved]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View
          className="max-h-[88%] rounded-t-[28px] bg-white dark:bg-canvasdark"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          <View className="flex-row items-center justify-between px-5 pt-5">
            <Text className="font-sans-bold text-[17px] text-ink dark:text-slate-50">
              Translate document
            </Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close translation" onPress={onClose}>
              <X size={22} color="#5B6478" />
            </Pressable>
          </View>

          <ScrollView className="px-5 pt-4" contentContainerStyle={{ paddingBottom: 12 }}>
            <View className="mb-4 flex-row items-start gap-2 rounded-2xl bg-brand-50 p-3.5 dark:bg-brand-500/10">
              <ShieldCheck size={16} color={accent} style={{ marginTop: 1 }} />
              <Text className="flex-1 font-sans text-[12px] leading-[18px] text-ink-soft dark:text-slate-300">
                {translationSafetyNotice}
              </Text>
            </View>

            <View className="mb-4 flex-row gap-2">
              <Pill label="Side-by-Side" selected={mode === 'side-by-side'} onPress={() => setMode('side-by-side')} />
              <Pill label="Translation" selected={mode === 'translated'} onPress={() => setMode('translated')} />
              <Pill label="Original" selected={mode === 'original'} onPress={() => setMode('original')} />
            </View>

            <View className="mb-4 flex-row flex-wrap gap-2">
              {availableLanguages.map((code) => (
                <Pill key={code} label={languageNames[code]} selected={lang === code} onPress={() => setLang(code)} />
              ))}
            </View>

            {mode !== 'translated' ? (
              <View className="mb-4">
                <Text className="mb-1.5 font-sans-semibold text-[12px] uppercase tracking-wide text-ink-muted dark:text-slate-400">
                  Original (English)
                </Text>
                <Text className="font-sans text-[14px] leading-[22px] text-ink dark:text-slate-100">
                  {record.clinicalNotes}
                </Text>
              </View>
            ) : null}

            {mode !== 'original' ? (
              <View>
                <View className="mb-1.5 flex-row items-center gap-1.5">
                  <Sparkles size={12} color={accent} />
                  <Text className="font-sans-semibold text-[12px] uppercase tracking-wide text-ink-muted dark:text-slate-400">
                    {languageNames[lang]}
                  </Text>
                </View>
                {needsConsent ? (
                  <View className="mt-1 gap-2.5 rounded-2xl border border-sky-200 bg-sky-50/80 p-3.5 dark:border-sky-500/30 dark:bg-sky-950/30">
                    <Text className="font-sans-bold text-[13px] text-ink dark:text-slate-100">
                      AI Translation Privacy & Permission (Guideline 5.1.2(i))
                    </Text>
                    <Text className="font-sans text-[12px] leading-[17px] text-ink-muted dark:text-slate-300">
                      To translate this record into {languageNames[lang]}, its clinical notes are securely processed by Google LLC (Google Gemini API) while preserving medication names, dosages, and lab numbers verbatim.
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Continue and allow Google Gemini AI translation"
                      onPress={() => {
                        tapFeedback();
                        setAiConsentGranted(true);
                      }}
                      className="flex-row items-center justify-center gap-2 rounded-xl bg-ink py-2.5 dark:bg-brand-500"
                    >
                      <CheckCircle2 size={15} color="#FFFFFF" />
                      <Text className="font-sans-bold text-[13px] text-white">
                        Continue — Allow Google Gemini AI
                      </Text>
                    </Pressable>
                  </View>
                ) : loading ? (
                  <View className="flex-row items-center gap-2.5 py-3">
                    <ActivityIndicator size="small" color={accent} />
                    <Text className="font-sans text-[13px] text-ink-muted dark:text-slate-400">
                      Translating medical notes into {languageNames[lang]}…
                    </Text>
                  </View>
                ) : (
                  <Text className="font-sans text-[14px] leading-[22px] text-ink dark:text-slate-100">
                    {translated ?? `Could not translate into ${languageNames[lang]} while offline. Please check your connection or read the original above.`}
                  </Text>
                )}
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
