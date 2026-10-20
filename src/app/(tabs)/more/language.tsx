import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useToast } from '@/components/ui/Toast';
import { dictionaries, languageNames, type LanguageCode } from '@/i18n/translations';
import { useAppStore } from '@/store/useAppStore';

const languages: LanguageCode[] = ['en', 'zu', 'af', 'tn', 'sw', 'fr', 'de'];

export default function LanguageScreen() {
  const toast = useToast();
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);

  return (
    <Screen bottomInset={60}>
      <ScreenHeader title="Language" onBack={() => router.back()} />
      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 48 }}>
        <Text className="mb-4 font-sans text-[13px] text-ink-muted dark:text-slate-400">
          Choose the language used across Siyashesha. The tab bar and home screen update
          immediately — isiZulu and Afrikaans are fully translated today.
        </Text>
        <View className="rounded-3xl border border-slate-200 bg-white dark:border-canvasdark-card dark:bg-canvasdark-card">
          {languages.map((code, i) => {
            const preview = dictionaries[code]['tabs.home'] ?? dictionaries.en['tabs.home'];
            return (
              <Pressable
                key={code}
                accessibilityRole="radio"
                accessibilityState={{ selected: language === code }}
                accessibilityLabel={languageNames[code]}
                onPress={() => {
                  setLanguage(code);
                  toast.show(`Language changed to ${languageNames[code]}`, 'success');
                }}
                className={`flex-row items-center justify-between px-4 py-4 ${
                  i > 0 ? 'border-t border-slate-100 dark:border-canvasdark' : ''
                }`}
              >
                <View>
                  <Text className="font-sans-semibold text-[15px] text-ink dark:text-slate-50">
                    {languageNames[code]}
                  </Text>
                  <Text className="font-sans text-[12px] text-ink-muted dark:text-slate-400">
                    Home → {preview}
                  </Text>
                </View>
                {language === code ? (
                  <View className="h-6 w-6 items-center justify-center rounded-full bg-brand-500">
                    <Check size={14} color="#FFFFFF" />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}
