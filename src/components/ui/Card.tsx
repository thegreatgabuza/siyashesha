import { Platform, View, type ViewProps } from 'react-native';

export function Card({ children, className, style, ...rest }: ViewProps & { className?: string }) {
  return (
    <View
      className={`rounded-3xl border border-slate-200 bg-surface p-4 dark:border-canvasdark-card dark:bg-canvasdark-card ${className ?? ''}`}
      style={[Platform.OS === 'android' ? { elevation: 2 } : shadowStyle, style]}
      {...rest}
    >
      {children}
    </View>
  );
}

const shadowStyle = {
  shadowColor: '#0B2559',
  shadowOpacity: 0.08,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 6 },
};
