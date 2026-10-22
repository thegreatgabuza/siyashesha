import { useEffect, useState } from 'react';
import { useReducedMotion } from 'react-native-reanimated';

import { Txt } from './Txt';

/** A number that counts up to its value on mount and whenever it changes. */
export function CountUp({
  value,
  suffix = '',
  duration = 900,
  ...txt
}: { value: number; suffix?: string; duration?: number } & React.ComponentProps<typeof Txt>) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(reduced ? value : 0);

  useEffect(() => {
    if (reduced) return;
    let frame = 0;
    const start = Date.now();
    const tick = () => {
      const p = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(value * eased));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration, reduced]);

  return (
    <Txt {...txt} accessibilityLabel={`${value}${suffix}`}>
      {reduced ? value : shown}
      {suffix}
    </Txt>
  );
}
