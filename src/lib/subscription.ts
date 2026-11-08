import { router } from 'expo-router';
import { Alert } from 'react-native';

import type { SubscriptionPlanId } from '@/store/useAppStore';

export const FREE_RECORD_LIMIT = 10;

export interface PlanEntitlements {
  planId: SubscriptionPlanId;
  isPro: boolean;
  isAnnualOrLifetime: boolean;
  isFounder: boolean;
  /** Maximum medical records allowed in vault (10 on Free Basic, Infinity on Pro). */
  maxRecords: number;
  /** Unlimited encrypted health documents & smart OCR auto-extraction (Monthly Pro, Annual Pro, Lifetime). */
  canUseSmartOcr: boolean;
  /** Siyashesha Clinical Assistant with plain-language lab explanations (Monthly Pro, Annual Pro, Lifetime). */
  canUseClinicalAssistant: boolean;
  /** Doctor & clinic time-limited PIN-protected QR sharing (Monthly Pro, Annual Pro, Lifetime). */
  canShareWithDoctorPin: boolean;
  /** Offline biometric cryptographic passport access via Secure Enclave (Monthly Pro, Annual Pro, Lifetime). */
  canUseBiometricLock: boolean;
  /** Advanced timeline lab trend charts & provider/event filters (Free includes basic clinical visit timeline). */
  canUseAdvancedTimeline: boolean;
  /** Standard PDF & CSV record exports (Monthly Pro, Annual Pro, Lifetime). */
  canExportRecords: boolean;
  /** Full annual health record PDF & DSAR archive export (Annual Pro & Lifetime Founder Pass). */
  canExportFullAnnualPdfAndDsar: boolean;
  /** Founder member badge on health passport (Lifetime Founder Pass). */
  hasFounderBadge: boolean;
}

export function getPlanEntitlements(plan: SubscriptionPlanId): PlanEntitlements {
  const isPro = plan !== 'free';
  const isAnnualOrLifetime = plan === 'annual_premium' || plan === 'lifetime_premium';
  const isFounder = plan === 'lifetime_premium';

  return {
    planId: plan,
    isPro,
    isAnnualOrLifetime,
    isFounder,
    maxRecords: isPro ? Number.POSITIVE_INFINITY : FREE_RECORD_LIMIT,
    canUseSmartOcr: isPro,
    canUseClinicalAssistant: isPro,
    canShareWithDoctorPin: isPro,
    canUseBiometricLock: isPro,
    canUseAdvancedTimeline: isPro,
    canExportRecords: isPro,
    canExportFullAnnualPdfAndDsar: isAnnualOrLifetime,
    hasFounderBadge: isFounder,
  };
}

export function getPlanShortBadge(plan: SubscriptionPlanId): {
  label: string;
  color: string;
  bgColor: string;
} {
  switch (plan) {
    case 'lifetime_premium':
      return {
        label: 'FOUNDER PASS',
        color: '#FFFFFF',
        bgColor: '#DC1F26',
      };
    case 'annual_premium':
      return {
        label: 'ANNUAL PRO',
        color: '#4ADE80',
        bgColor: 'rgba(22, 163, 74, 0.22)',
      };
    case 'monthly_premium':
      return {
        label: 'MONTHLY PRO',
        color: '#38BDF8',
        bgColor: 'rgba(56, 189, 248, 0.2)',
      };
    default:
      return {
        label: 'FREE BASIC',
        color: '#CBD5E1',
        bgColor: 'rgba(255, 255, 255, 0.12)',
      };
  }
}

export function promptPlanUpgrade(options: {
  title: string;
  message: string;
  ctaLabel?: string;
  onBeforeNavigate?: () => void;
}): void {
  Alert.alert(options.title, options.message, [
    { text: 'Not Now', style: 'cancel' },
    {
      text: options.ctaLabel ?? 'View Plans',
      onPress: () => {
        options.onBeforeNavigate?.();
        router.push('/(tabs)/more/billing');
      },
    },
  ]);
}
