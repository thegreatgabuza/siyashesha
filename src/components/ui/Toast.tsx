import { CheckCircle2, Info, TriangleAlert } from 'lucide-react-native';
import { createContext, useContext, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccent } from '@/hooks/useAccent';

type ToastKind = 'success' | 'info' | 'warning';

interface ToastState {
  id: number;
  message: string;
  kind: ToastKind;
}

interface ToastContextValue {
  show: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const icons: Record<ToastKind, any> = {
  success: CheckCircle2,
  info: Info,
  warning: TriangleAlert,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { accent } = useAccent();
  const tint: Record<ToastKind, string> = {
    success: '#16A34A',
    info: accent,
    warning: '#DC1F26',
  };
  const [toast, setToast] = useState<ToastState | null>(null);
  const progress = useSharedValue(0);
  const insets = useSafeAreaInsets();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = (message: string, kind: ToastKind = 'success') => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setToast({ id: Date.now(), message, kind });
    progress.value = 0;
    progress.value = withSpring(1, { damping: 16, stiffness: 180 });
    timeoutRef.current = setTimeout(() => {
      progress.value = withTiming(0, { duration: 200 });
      setTimeout(() => setToast(null), 220);
    }, 2400);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 24 }],
  }));

  const Icon = toast ? icons[toast.kind] : CheckCircle2;

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast ? (
        <Animated.View
          style={[{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + 96 }, animatedStyle]}
          pointerEvents="none"
        >
          <View
            className="flex-row items-center gap-3 self-center rounded-3xl bg-ink px-5 py-3.5 shadow-lg dark:bg-canvasdark-card"
            style={{ maxWidth: 420 }}
          >
            <Icon size={18} color={tint[toast.kind]} />
            <Text className="flex-1 font-sans-medium text-[14px] text-white">{toast.message}</Text>
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}
