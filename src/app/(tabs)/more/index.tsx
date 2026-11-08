import { router } from 'expo-router';
import {
  BellRing,
  ChevronRight,
  Clock,
  CreditCard,
  Globe,
  LogOut,
  Pill as PillIcon,
  Settings as SettingsIcon,
  Share2,
  ShieldAlert,
  Trash2,
  UserRound,
  FileText,
  Flame,
  PhoneCall,
} from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Linking, View } from 'react-native';

import { AccountDeletionModal } from '@/components/security/AccountDeletionModal';
import { DsarExportModal } from '@/components/security/DsarExportModal';
import { LegalDocumentModal, type LegalDocKind } from '@/components/security/LegalDocumentModal';
import { Avatar } from '@/components/ui/Avatar';
import { BrandLockup } from '@/components/ui/BrandLockup';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Txt } from '@/components/ui/Txt';
import { activeMedications } from '@/data/medications';
import { elevation, fonts, radii } from '@/design/tokens';
import { useTokens } from '@/design/useTokens';
import { useAccent } from '@/hooks/useAccent';
import { languageNames } from '@/i18n/translations';
import { bloodGroupLabel } from '@/lib/bloodGroup';
import { useSafeClerk } from '@/lib/clerkAvatar';
import { FREE_RECORD_LIMIT, getPlanEntitlements } from '@/lib/subscription';
import { useAppStore } from '@/store/useAppStore';

interface MenuItem {
  id: string;
  label: string;
  subtitle?: string;
  icon: any;
  route?: string;
  onPress?: () => void;
  tint: string;
  badge?: string;
  badgeTone?: 'success' | 'muted' | 'brand';
  destructive?: boolean;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export default function MoreScreen() {
  const { accent } = useAccent();
  const t = useTokens();
  const patient = useAppStore((s) => s.patientProfile);
  const recordCount = useAppStore((s) => s.records.length);
  const medications = useAppStore((s) => s.medications);
  const activeMedCount = (medications ?? activeMedications).filter((m) => m.status === 'active').length;
  const language = useAppStore((s) => s.language);
  const subscriptionPlan = useAppStore((s) => s.subscriptionPlan);
  const entitlements = getPlanEntitlements(subscriptionPlan);
  const signOut = useAppStore((s) => s.signOut);
  const { signOut: clerkSignOut } = useSafeClerk();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [dsarVisible, setDsarVisible] = useState(false);
  const [legalDoc, setLegalDoc] = useState<LegalDocKind>(null);

  const contactSupport = () => {
    Alert.alert(
      'Contact Support & Report an Issue',
      'Need help with your Health Passport, subscription, or want to report a safety/content issue? Our clinical support team responds within 24 hours.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Email Support',
          onPress: () =>
            Linking.openURL(
              'mailto:support@siyashesha.co.za?subject=Siyashesha%20Health%20Passport%20Support'
            ).catch(() => {}),
        },
        {
          text: 'Report Safety Issue',
          onPress: () =>
            Linking.openURL(
              'mailto:safety@siyashesha.co.za?subject=Siyashesha%20Safety%20%2F%20AI%20Report'
            ).catch(() => {}),
        },
      ]
    );
  };

  const planSummary =
    subscriptionPlan === 'annual_premium'
      ? { subtitle: 'Annual Pro (R149.99/yr) · Active', badge: 'Annual Pro' }
      : subscriptionPlan === 'monthly_premium'
      ? { subtitle: 'Monthly Pro (R19.99/mo) · Active', badge: 'R19.99/mo' }
      : subscriptionPlan === 'lifetime_premium'
      ? { subtitle: 'Lifetime Founder Pass (R299.99) · Active', badge: 'Lifetime' }
      : { subtitle: 'Free Basic Plan (R0) · Upgrade anytime', badge: 'Free' };

  const confirmSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your health passport? You will need to verify your email to sign back in.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await clerkSignOut();
            } catch (err) {
              console.warn('[Clerk] Sign out:', err);
            }
            signOut();
            router.replace('/(auth)/sign-in');
          },
        },
      ]
    );
  };

  const callEmergency = () => {
    Alert.alert(
      'Emergency Dispatch (112)',
      'Would you like to dial 112 national emergency dispatch now?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call 112', onPress: () => Linking.openURL('tel:112') },
      ]
    );
  };

  const sections: MenuSection[] = [
    {
      title: 'Account & Coverage',
      items: [
        {
          id: 'profile',
          label: 'Personal Profile',
          subtitle: `${patient.firstName} ${patient.lastName} · ID ···${patient.idNumber.slice(-4)}`,
          icon: UserRound,
          route: '/more/profile',
          tint: '#0284C7',
        },
        {
          id: 'billing',
          label: 'Subscription & Billing',
          subtitle: planSummary.subtitle,
          icon: CreditCard,
          route: '/more/billing',
          tint: '#0E7490',
          badge: planSummary.badge,
          badgeTone: subscriptionPlan === 'free' ? 'muted' : 'success',
        },
        {
          id: 'emergency',
          label: 'Emergency Profile (ICE)',
          subtitle: `Blood group ${bloodGroupLabel(patient.bloodGroup)} · Allergies`,
          icon: ShieldAlert,
          route: '/more/emergency',
          tint: '#DC1F26',
        },
      ],
    },
    {
      title: 'Health & Records',
      items: [
        {
          id: 'medications',
          label: 'Active Medications',
          subtitle: `${activeMedCount} active prescriptions & schedules`,
          icon: PillIcon,
          route: '/more/medications',
          tint: '#16A34A',
          badge: `${activeMedCount}`,
          badgeTone: 'muted',
        },
        {
          id: 'timeline',
          label: 'Health Timeline',
          subtitle: 'Visits, consultations & clinical milestones',
          icon: Clock,
          route: '/more/timeline',
          tint: '#D97706',
        },
        {
          id: 'vault',
          label: 'Records Vault',
          subtitle: entitlements.isPro
            ? `${recordCount} lab reports, imaging & discharge summaries (Unlimited)`
            : `${recordCount} / ${FREE_RECORD_LIMIT} free records used`,
          icon: FileText,
          route: '/records',
          tint: '#0D9488',
          badge: entitlements.isPro ? `${recordCount}` : `${recordCount}/${FREE_RECORD_LIMIT}`,
          badgeTone: !entitlements.isPro && recordCount >= FREE_RECORD_LIMIT ? 'muted' : 'muted',
        },
      ],
    },
    {
      title: 'Security & Preferences',
      items: [
        {
          id: 'settings',
          label: 'Settings & Security',
          subtitle: 'Biometrics, PIN, dark mode & password',
          icon: SettingsIcon,
          route: '/more/settings',
          tint: '#475569',
        },
        {
          id: 'sharing',
          label: 'Doctor & Clinician Sharing',
          subtitle: 'Active access links & doctor scan QR',
          icon: Share2,
          route: '/more/sharing',
          tint: accent,
        },
        {
          id: 'notifications',
          label: 'Notifications',
          subtitle: 'Medication alerts & appointment reminders',
          icon: BellRing,
          route: '/more/notifications',
          tint: '#7C3AED',
        },
        {
          id: 'language',
          label: 'Language',
          subtitle: languageNames[language] || 'English',
          icon: Globe,
          route: '/more/language',
          tint: '#2563EB',
          badge: languageNames[language] || 'English',
          badgeTone: 'muted',
        },
      ],
    },
    {
      title: 'Legal, Privacy & Support',
      items: [
        {
          id: 'privacy_policy',
          label: 'Privacy Policy (POPIA)',
          subtitle: 'Data protection, AI consent & static web policy',
          icon: ShieldAlert,
          onPress: () => setLegalDoc('privacy'),
          tint: '#0284C7',
        },
        {
          id: 'terms_eula',
          label: 'Terms of Use (EULA)',
          subtitle: 'Subscription terms & Apple Standard EULA',
          icon: FileText,
          onPress: () => setLegalDoc('terms'),
          tint: '#0B2559',
        },
        {
          id: 'contact_support',
          label: 'Contact Support & Report Issue',
          subtitle: 'Report content, AI responses, or billing questions',
          icon: Globe,
          onPress: contactSupport,
          tint: '#0D7C66',
        },
      ],
    },
    {
      title: 'Support & Session',
      items: [
        {
          id: 'emergency_dial',
          label: 'Emergency Dispatch (112)',
          subtitle: 'National emergency services & Netcare 911',
          icon: PhoneCall,
          onPress: callEmergency,
          tint: '#DC1F26',
        },
        {
          id: 'sign_out',
          label: 'Sign Out',
          subtitle: 'Log out of your health passport on this device',
          icon: LogOut,
          onPress: confirmSignOut,
          tint: '#EF4444',
          destructive: true,
        },
        {
          id: 'delete_account',
          label: 'Delete Account & Erase Data',
          subtitle: 'Permanently delete your account & all health records',
          icon: Trash2,
          onPress: () => setDeleteModalVisible(true),
          tint: '#DC1F26',
          destructive: true,
        },
      ],
    },
  ];

  return (
    <Screen contentClassName="px-5">
      {/* Brand header */}
      <View style={{ paddingTop: 16, paddingBottom: 4 }}>
        <BrandLockup />
      </View>

      {/* Screen Title */}
      <View style={{ paddingTop: 12, paddingBottom: 16 }}>
        <Txt variant="footnote" tone="muted">
          Health Passport & Account
        </Txt>
        <Txt variant="title">More</Txt>
      </View>

      {/* Profile Summary Card - First Class Entry into Profile */}
      <PressableScale
        accessibilityLabel={`${patient.firstName} ${patient.lastName}. View profile`}
        onPress={() => router.push('/more/profile')}
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            padding: 16,
            borderRadius: radii.xl,
            backgroundColor: t.surface,
          },
          elevation[1],
        ]}
      >
        <Avatar name={patient.preferredName || patient.firstName || '?'} size={50} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Txt variant="bodyStrong">
              {patient.firstName} {patient.lastName}
            </Txt>
            {entitlements.hasFounderBadge ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 3,
                  backgroundColor: '#DC1F26',
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                  borderRadius: radii.pill,
                }}
              >
                <Flame size={10} color="#FBBF24" />
                <Txt variant="label" color="#FFFFFF" style={{ fontSize: 9, fontFamily: fonts.bold }}>
                  FOUNDER
                </Txt>
              </View>
            ) : null}
          </View>
          <Txt variant="footnote" tone="muted" style={{ marginTop: 2 }}>
            National Health ID ···{patient.idNumber.slice(-4)}
          </Txt>
        </View>
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: radii.pill,
            backgroundColor: t.surfaceMuted,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Txt variant="footnote" style={{ fontFamily: fonts.medium }}>
            View profile
          </Txt>
          <ChevronRight size={14} color={t.textMuted} />
        </View>
      </PressableScale>

      {/* Menu Sections List */}
      {sections.map((section) => (
        <View key={section.title} style={{ marginTop: 26 }}>
          <SectionHeader title={section.title} />
          <View
            style={[
              {
                borderRadius: radii.xl,
                backgroundColor: t.surface,
                overflow: 'hidden',
              },
              elevation[1],
            ]}
          >
            {section.items.map((item, index) => {
              const Icon = item.icon;
              return (
                <PressableScale
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  onPress={() => {
                    if (item.onPress) {
                      item.onPress();
                    } else if (item.route) {
                      router.push(item.route as any);
                    }
                  }}
                  style={[
                    {
                      minHeight: 64,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 14,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                    },
                    index > 0 ? { borderTopWidth: 1, borderTopColor: t.border } : {},
                  ]}
                >
                  <View
                    style={{
                      height: 40,
                      width: 40,
                      borderRadius: radii.md,
                      backgroundColor: `${item.tint}18`,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={20} color={item.tint} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Txt
                      variant="bodyStrong"
                      color={item.destructive ? '#DC2626' : undefined}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Txt>
                    {item.subtitle ? (
                      <Txt variant="footnote" tone="muted" numberOfLines={1} style={{ marginTop: 2 }}>
                        {item.subtitle}
                      </Txt>
                    ) : null}
                  </View>

                  {item.badge ? (
                    <View
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: radii.pill,
                        backgroundColor:
                          item.badgeTone === 'success'
                            ? 'rgba(22, 163, 74, 0.12)'
                            : t.surfaceMuted,
                      }}
                    >
                      <Txt
                        variant="footnote"
                        color={item.badgeTone === 'success' ? '#16A34A' : t.textMuted}
                        style={{ fontFamily: fonts.medium }}
                      >
                        {item.badge}
                      </Txt>
                    </View>
                  ) : null}

                  <ChevronRight size={18} color={t.textMuted} />
                </PressableScale>
              );
            })}
          </View>
        </View>
      ))}

      {/* App Version Info */}
      <View style={{ alignItems: 'center', paddingVertical: 32 }}>
        <Txt variant="footnote" tone="muted">
          Siyashesha Health Passport · Version 1.0.0
        </Txt>
        <Txt variant="footnote" tone="muted" style={{ marginTop: 4 }}>
          Protected by End-to-End Encryption & POPIA Compliance
        </Txt>
      </View>

      <DsarExportModal visible={dsarVisible} onClose={() => setDsarVisible(false)} />
      <AccountDeletionModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        onOpenDsarExport={() => setDsarVisible(true)}
      />
      <LegalDocumentModal visibleDoc={legalDoc} onClose={() => setLegalDoc(null)} />
    </Screen>
  );
}
