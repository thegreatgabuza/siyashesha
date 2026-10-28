import { CalendarDays, FileText, Home, MoreHorizontal, Sparkles } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useReducedMotion, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Glass } from '@/components/ui/Glass';
import { Txt } from '@/components/ui/Txt';
import { elevation, fonts, navy, springs } from '@/design/tokens';
import { TAB_BAR_GAP, TAB_BAR_HEIGHT } from '@/hooks/useTabBarInset';
import { useI18n } from '@/i18n/useI18n';
import { tapFeedback } from '@/lib/feedback';

/** The five tabs shown in the bar, in order. Diary is routable but lives under Calendar. */
const tabs = [
  { name: 'index', icon: Home, label: 'tabs.home' },
  { name: 'records', icon: FileText, label: 'tabs.records' },
  { name: 'assistant', icon: Sparkles, label: 'tabs.assistant' },
  { name: 'calendar', icon: CalendarDays, label: 'tabs.calendar' },
  { name: 'more', icon: MoreHorizontal, label: 'tabs.more' },
] as const;

/** Routes that light up another tab. */
const parentTab: Record<string, string> = { diary: 'calendar' };

const MAX_BAR_WIDTH = 520;

// expo-router vendors its own react-navigation types internally, which don't
// structurally match the public @react-navigation/bottom-tabs package types,
// so this prop shape is kept minimal and local to what the component uses.
interface TabBarProps {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation?: {
    emit: (event: { type: string; target: string; canPreventDefault: boolean }) => {
      defaultPrevented: boolean;
    };
    navigate: (name: string) => void;
  };
  emitter?: {
    emit: (event: { type: string; target: string; canPreventDefault: boolean }) => {
      defaultPrevented: boolean;
    };
  };
  navigateToTab?: (name: string) => void;
}

/**
 * Floating navy glass bar. The active tab swells into a pill and shows its label; the others
 * settle back to icons. Labels only appear on the roomy active pill, so long translations
 * never get squeezed. Hidden while the keyboard is open.
 */
export function TabBar({ state, navigation, emitter, navigateToTab }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { t } = useI18n();
  const [keyboard, setKeyboard] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboard(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboard(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  if (keyboard) return null;

  const focusedName = state.routes[state.index]?.name;
  const activeName = parentTab[focusedName] ?? focusedName;

  return (
    <View
      style={{ position: 'absolute', left: 0, right: 0, bottom: Math.max(insets.bottom, 8) + TAB_BAR_GAP }}
      pointerEvents="box-none"
    >
      <View style={[{ width: Math.min(width - 24, MAX_BAR_WIDTH), alignSelf: 'center', borderRadius: TAB_BAR_HEIGHT / 2 }, elevation[3]]}>
        <Glass
          tint="rgba(11,30,64,0.86)"
          intensity={80}
          style={{
            height: TAB_BAR_HEIGHT,
            borderRadius: TAB_BAR_HEIGHT / 2,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 6,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.10)',
          }}
        >
          {tabs.map((tab) => {
            const route = state.routes.find((r) => r.name === tab.name);
            if (!route) return null;
            const isFocused = activeName === tab.name;
            const label = t(tab.label);
            return (
              <TabItem
                key={tab.name}
                label={label}
                Icon={tab.icon}
                isFocused={isFocused}
                onPress={() => {
                  tapFeedback();
                  const emitFn = navigation?.emit ?? emitter?.emit;
                  const event = emitFn?.({ type: 'tabPress', target: route.key, canPreventDefault: true }) ?? { defaultPrevented: false };
                  if ((!isFocused || focusedName !== tab.name) && !event.defaultPrevented) {
                    if (navigateToTab) {
                      navigateToTab(route.key);
                    } else if (navigation) {
                      navigation.navigate(route.name);
                    }
                  }
                }}
              />
            );
          })}
        </Glass>
      </View>
    </View>
  );
}

function TabItem({ label, Icon, isFocused, onPress }: { label: string; Icon: any; isFocused: boolean; onPress: () => void }) {
  const reduced = useReducedMotion();

  const container = useAnimatedStyle(() => {
    const targetGrow = isFocused ? 2.1 : 1;
    return {
      flexGrow: reduced ? targetGrow : withSpring(targetGrow, springs.bouncy),
    };
  });

  const pill = useAnimatedStyle(() => {
    const targetOpacity = isFocused ? 1 : 0;
    const targetScaleX = isFocused ? 1 : 0.4;
    const targetScaleY = isFocused ? 1 : 0.7;
    return {
      opacity: reduced ? targetOpacity : withSpring(targetOpacity, springs.bouncy),
      transform: [
        { scaleX: reduced ? targetScaleX : withSpring(targetScaleX, springs.bouncy) },
        { scaleY: reduced ? targetScaleY : withSpring(targetScaleY, springs.bouncy) },
      ],
    };
  });

  return (
    <Animated.View style={[{ flexBasis: 0, height: TAB_BAR_HEIGHT - 12 }, container]}>
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: isFocused }}
        accessibilityLabel={`${label} tab`}
        onPress={onPress}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
      >
        <Animated.View
          pointerEvents="none"
          style={[{ position: 'absolute', top: 0, bottom: 0, left: 2, right: 2, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.95)' }, pill]}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8 }}>
          <Icon size={21} color={isFocused ? navy[700] : 'rgba(255,255,255,0.78)'} strokeWidth={isFocused ? 2.3 : 1.9} />
          {isFocused ? (
            <Animated.View entering={reduced ? undefined : FadeIn.duration(180).delay(60)} style={{ flexShrink: 1 }}>
              <Txt numberOfLines={1} maxFontSizeMultiplier={1.3} variant="footnote" color={navy[700]} style={{ fontFamily: fonts.semibold }}>
                {label}
              </Txt>
            </Animated.View>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}
