import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus, Platform, View } from 'react-native';

import { BiometricLockShield } from '@/components/security/BiometricLockShield';
import { useAppStore } from '@/store/useAppStore';

const INACTIVITY_LOCK_TIMEOUT_MS = 15000; // 15 seconds in background triggers lock

interface BiometricGateProps {
  children: React.ReactNode;
}

export function BiometricGate({ children }: BiometricGateProps) {
  const isSignedIn = useAppStore((s) => s.isSignedIn);
  const biometricLock = useAppStore((s) => s.biometricLock);
  const isAppLocked = useAppStore((s) => s.isAppLocked);
  const lockApp = useAppStore((s) => s.lockApp);
  const setAppLocked = useAppStore((s) => s.setAppLocked);

  const backgroundTimestampRef = useRef<number | null>(null);
  const isInitialLaunchRef = useRef(true);

  // Initial cold-start lock
  useEffect(() => {
    if (isInitialLaunchRef.current) {
      isInitialLaunchRef.current = false;
      if (isSignedIn && biometricLock) {
        setAppLocked(true);
      }
    }
  }, [isSignedIn, biometricLock, setAppLocked]);

  // AppState background/foreground monitoring
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        backgroundTimestampRef.current = Date.now();
      } else if (nextAppState === 'active') {
        const lastBg = backgroundTimestampRef.current;
        backgroundTimestampRef.current = null;

        if (lastBg && Date.now() - lastBg > INACTIVITY_LOCK_TIMEOUT_MS) {
          if (isSignedIn && biometricLock) {
            lockApp();
          }
        }
      }
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, [isSignedIn, biometricLock, lockApp]);

  const shouldShield = isSignedIn && biometricLock && isAppLocked;

  return (
    <View style={{ flex: 1 }}>
      {children}
      {shouldShield ? <BiometricLockShield /> : null}
    </View>
  );
}
