import { ShieldCheck, X } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Pill } from '@/components/ui/Pill';
import type { MedicalRecord } from '@/data/records';
import { languageNames, type LanguageCode } from '@/i18n/translations';
import { isFullyTranslated, translateRecordNotes, translationSafetyNotice } from '@/lib/translate';
import { useAccent } from '@/hooks/useAccent';

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
  const [mode, setMode] = useState<ViewMode>('side-by-side');
  const [lang, setLang] = useState<LanguageCode>(
    availableLanguages.includes(defaultLanguage) ? defaultLanguage : 'zu'
  );

  const translated = translateRecordNotes(record, lang);
  const fullyTranslated = isFullyTranslated(lang);

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

            {!fullyTranslated ? (
              <Text className="mb-3 font-sans text-[11px] text-ink-muted dark:text-slate-500">
                Full translations are available in isiZulu and Afrikaans only. Other languages are not translated yet.
              </Text>
            ) : null}

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
                <Text className="mb-1.5 font-sans-semibold text-[12px] uppercase tracking-wide text-ink-muted dark:text-slate-400">
                  {languageNames[lang]}
                </Text>
                <Text className="font-sans text-[14px] leading-[22px] text-ink dark:text-slate-100">
                  {translated ?? `Not translated into ${languageNames[lang]} yet. Read the original above.`}
                </Text>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
