import * as Haptics from 'expo-haptics';
import { BookHeart, CalendarDays, FileText, Home, MoreHorizontal } from 'lucide-react-native';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useI18n } from '@/i18n/useI18n';

const icons: Record<string, any> = {
  index: Home,
  records: FileText,
  calendar: CalendarDays,
  diary: BookHeart,
  more: MoreHorizontal,
};

const labelKeys: Record<string, string> = {
  index: 'tabs.home',
  records: 'tabs.records',
  calendar: 'tabs.calendar',
  diary: 'tabs.diary',
  more: 'tabs.more',
};

// Bar is capped on tablets and desktops so it doesn't stretch across the screen.
const MAX_BAR_WIDTH = 560;

// expo-router vendors its own react-navigation types internally, which don't
// structurally match the public @react-navigation/bottom-tabs package types,
// so this prop shape is kept minimal and local to what the component uses.
interface TabBarProps {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: {
    emit: (event: { type: string; target: string; canPreventDefault: boolean }) => {
      defaultPrevented: boolean;
    };
    navigate: (name: string) => void;
  };
}

export function TabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { t } = useI18n();

  return (
    <View
      style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + 10 }}
      pointerEvents="box-none"
    >
      <View
        className="flex-row items-center rounded-3xl bg-ink px-1.5 py-1.5 dark:bg-canvasdark-card"
        style={[shadow, { width: Math.min(width - 32, MAX_BAR_WIDTH), alignSelf: 'center' }]}
      >
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const Icon = icons[route.name] ?? Home;
          const label = t(labelKeys[route.name] ?? 'tabs.home');

          const onPress = () => {
            Haptics.selectionAsync();
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TabItem
              key={route.key}
              label={label}
              Icon={Icon}
              isFocused={isFocused}
              onPress={onPress}
              accessibilityLabel={`${label} tab`}
            />
          );
        })}
      </View>
    </View>
  );
}

function TabItem({
  label,
  Icon,
  isFocused,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  Icon: any;
  isFocused: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(isFocused ? 1 : 0.96, { damping: 14 }) }],
  }));

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      className="min-h-[52px] flex-1 items-center justify-center"
    >
      <Animated.View
        style={animatedStyle}
        className={`w-full items-center justify-center gap-1 rounded-2xl px-1 py-1.5 ${
          isFocused ? 'bg-[#8FB0DA]/25' : ''
        }`}
      >
        <Icon size={20} color={isFocused ? '#FFFFFF' : '#8FA0C2'} />
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
          className={`text-[11px] ${isFocused ? 'font-sans-bold text-white' : 'font-sans-medium text-[#8FA0C2]'}`}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const shadow = {
  shadowColor: '#0B2559',
  shadowOpacity: 0.25,
  shadowRadius: 20,
  shadowOffset: { width: 0, height: 10 },
  elevation: 12,
};
