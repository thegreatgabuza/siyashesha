import { safeBack } from '@/lib/navigation';
import { Check } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { heroShadow } from '@/components/ui/HeroAction';
import { Screen } from '@/components/ui/Screen';
import { ScreenScroll } from '@/components/ui/ScreenScroll';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useToast } from '@/components/ui/Toast';
import { dictionaries, languageNames, type LanguageCode } from '@/i18n/translations';
import { useI18n } from '@/i18n/useI18n';
import { useAppStore } from '@/store/useAppStore';

const languages: LanguageCode[] = ['en', 'zu', 'af', 'tn', 'sw', 'fr', 'de'];

export default function LanguageScreen() {
  const toast = useToast();
  const { t: tr } = useI18n();
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);

  return (
    <Screen headerOwnsTopInset scroll={false}>
      <ScreenHeader title={tr('language.title')} onBack={() => safeBack('/(tabs)/more')} />
      <ScreenScroll className="flex-1 px-5">
        <View className="mt-2 rounded-[32px] bg-ink p-5 dark:bg-canvasdark-card" style={heroShadow}>
          <View className="flex-row items-center justify-between">
            <Text className="font-sans-semibold text-[13px] text-white/70">{tr('language.currentLanguage')}</Text>
            <View className="rounded-full bg-white/15 px-3 py-1">
              <Text className="font-sans-semibold text-[11px] text-white">{tr('language.available', { count: String(languages.length) })}</Text>
            </View>
          </View>
          <Text className="mt-4 font-sans-bold text-[28px] leading-[32px] text-white">{languageNames[language]}</Text>
          <Text className="mt-3 font-sans text-[12px] leading-[17px] text-white/60">
            {tr('language.description')}
          </Text>
        </View>
        <View className="pt-6">
          <SectionHeader title={tr('language.chooseLanguage')} />
        </View>
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
                  <View className="h-6 w-6 items-center justify-center rounded-full bg-brand-500 dark:bg-brand-400">
                    <Check size={14} color="#FFFFFF" />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </ScreenScroll>
    </Screen>
  );
}
