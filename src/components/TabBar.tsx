import * as Haptics from 'expo-haptics';
import { BookHeart, CalendarDays, FileText, Home, MoreHorizontal } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
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
  const { t } = useI18n();

  return (
    <View
      style={{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + 10 }}
      pointerEvents="box-none"
    >
      <View className="flex-row items-center justify-between rounded-full bg-ink px-2 py-2 dark:bg-canvasdark-card" style={shadow}>
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
    transform: [{ scale: withSpring(isFocused ? 1 : 0.94, { damping: 14 }) }],
  }));

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      className="min-h-[44px] flex-1 items-center justify-center py-1.5"
    >
      <Animated.View
        style={animatedStyle}
        className={`flex-row items-center gap-1.5 rounded-full px-3 py-2 ${
          isFocused ? 'bg-white/15' : ''
        }`}
      >
        <Icon size={20} color={isFocused ? '#FFFFFF' : 'rgba(255,255,255,0.55)'} />
        {isFocused ? (
          <Text className="font-sans-semibold text-[12px] text-white">{label}</Text>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

const shadow = {
  shadowColor: '#000000',
  shadowOpacity: 0.25,
  shadowRadius: 20,
  shadowOffset: { width: 0, height: 10 },
  elevation: 12,
};
