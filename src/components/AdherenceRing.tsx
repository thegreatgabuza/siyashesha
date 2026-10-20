import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export function AdherenceRing({ percent, size = 92 }: { percent: number; size?: number }) {
  const strokeWidth = 9;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);
  const color = percent >= 80 ? '#0D9488' : percent >= 50 ? '#A58FE6' : '#DC2626';

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E3E8F0"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text className="font-sans-bold text-[20px] text-ink dark:text-slate-50">{percent}%</Text>
    </View>
  );
}
