import { router, usePathname } from 'expo-router';
import { Menu, ShieldAlert, X } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, Platform, Pressable, Text, useWindowDimensions, View } from 'react-native';

export const NAVY = '#0B1E40';
export const RED = '#DC1F26';
export const TEAL = '#0D7C66';
export const INK = '#111827';
export const MUTED = '#6B7487';
export const SECONDARY = '#4B5565';
export const LINE = 'rgba(17, 24, 39, 0.08)';
export const SURFACE = '#FAF9F6';
export const CARD_BG = '#FFFFFF';
export const RAISED = '#F3F1EC';
export const MAX = 1160;

export const sans = (w: 400 | 500 | 600 | 700 = 400) =>
  ({ 400: 'Inter_400Regular', 500: 'Inter_500Medium', 600: 'Inter_600SemiBold', 700: 'Inter_700Bold' })[w];

export const NAV_LINKS = [
  { href: '/features', label: 'Features' },
  { href: '/security', label: 'Security' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/support', label: 'Support' },
] as const;

export const SUPPORT_EMAIL = 'support@siyashesha.co.za';
export const PRIVACY_EMAIL = 'privacy@siyashesha.co.za';

export function goSignUp(email?: string) {
  router.push({ pathname: '/sign-in', params: { mode: 'signup', ...(email ? { email } : {}) } } as any);
}
export function goSignIn() {
  router.push('/sign-in');
}

/** Top navigation shared by every public page. Clean, quiet chrome with a 4px grid. */
export function SiteNav({ overlay = false }: { overlay?: boolean }) {
  const { width } = useWindowDimensions();
  const wide = width >= 860;
  const pad = width >= 768 ? 32 : 20;
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <View
      style={{
        zIndex: 20,
        backgroundColor: overlay ? 'transparent' : '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: LINE,
        ...(Platform.OS === 'web' && !overlay ? ({ position: 'sticky', top: 0 } as any) : null),
      }}
    >
      <View
        style={{
          width: '100%',
          maxWidth: MAX,
          alignSelf: 'center',
          paddingHorizontal: pad,
          height: 64,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Brand Lockup */}
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Siyashesha home"
          onPress={() => router.navigate('/')}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
        >
          <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: RED, alignItems: 'center', justifyContent: 'center' }}>
            <ShieldAlert size={16} color="#FFFFFF" strokeWidth={2.2} />
          </View>
          <View>
            <Text style={{ fontFamily: sans(700), fontSize: 16, letterSpacing: 0.5, color: NAVY }}>SIYASHESHA</Text>
            <Text style={{ fontFamily: sans(500), fontSize: 10, letterSpacing: 0.3, color: MUTED }}>Health Passport</Text>
          </View>
        </Pressable>

        {/* Links */}
        {wide ? (
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {NAV_LINKS.map((l) => {
              const active = pathname === l.href;
              return (
                <Pressable
                  key={l.href}
                  accessibilityRole="link"
                  onPress={() => router.navigate(l.href as any)}
                  style={({ hovered }: any) => ({
                    paddingHorizontal: 14,
                    height: 36,
                    borderRadius: 8,
                    justifyContent: 'center',
                    backgroundColor: active ? RAISED : hovered ? 'rgba(17,24,39,0.04)' : 'transparent',
                  })}
                >
                  <Text style={{ fontFamily: sans(active ? 600 : 500), fontSize: 14, color: active ? INK : SECONDARY }}>
                    {l.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {/* Actions */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {wide ? (
            <Pressable
              accessibilityRole="button"
              onPress={goSignIn}
              style={({ hovered }: any) => ({
                paddingHorizontal: 14,
                height: 38,
                borderRadius: 8,
                justifyContent: 'center',
                backgroundColor: hovered ? 'rgba(17,24,39,0.04)' : 'transparent',
              })}
            >
              <Text style={{ fontFamily: sans(500), fontSize: 14, color: INK }}>Sign in</Text>
            </Pressable>
          ) : null}

          <Pressable
            accessibilityRole="button"
            onPress={() => goSignUp()}
            style={({ pressed, hovered }: any) => ({
              paddingHorizontal: 16,
              height: 38,
              borderRadius: 8,
              backgroundColor: hovered ? '#152C5B' : NAVY,
              justifyContent: 'center',
              opacity: pressed ? 0.92 : 1,
            })}
          >
            <Text style={{ fontFamily: sans(600), fontSize: 14, color: '#FFFFFF' }}>Create passport</Text>
          </Pressable>

          {!wide ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Menu"
              onPress={() => setOpen((v) => !v)}
              style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}
            >
              {open ? <X size={20} color={INK} /> : <Menu size={20} color={INK} />}
            </Pressable>
          ) : null}
        </View>
      </View>

      {!wide && open ? (
        <View style={{ backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: LINE, paddingHorizontal: pad, paddingVertical: 8 }}>
          {[...NAV_LINKS, { href: '/sign-in', label: 'Sign in' }].map((l) => (
            <Pressable
              key={l.href}
              accessibilityRole="link"
              onPress={() => {
                setOpen(false);
                router.navigate(l.href as any);
              }}
              style={{ height: 44, justifyContent: 'center' }}
            >
              <Text style={{ fontFamily: sans(500), fontSize: 15, color: INK }}>{l.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const footerColumns: { title: string; links: { label: string; href?: string; mail?: string }[] }[] = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '/features' },
      { label: 'Security', href: '/security' },
      { label: 'Pricing', href: '/pricing' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help and contact', href: '/support' },
      { label: 'Delete your account', href: '/delete-account' },
      { label: 'Report a safety issue', mail: 'safety@siyashesha.co.za' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy policy (POPIA)', href: '/privacy' },
      { label: 'Terms of use', href: '/terms' },
      { label: 'Medical disclaimer', href: '/terms' },
    ],
  },
];

export function SiteFooter() {
  const { width } = useWindowDimensions();
  const wide = width >= 768;
  const pad = wide ? 32 : 20;
  return (
    <View style={{ backgroundColor: '#FAF9F6', borderTopWidth: 1, borderTopColor: LINE }}>
      <View style={{ width: '100%', maxWidth: MAX, alignSelf: 'center', paddingHorizontal: pad, paddingTop: 56, paddingBottom: 40 }}>
        <View style={{ flexDirection: wide ? 'row' : 'column', gap: wide ? 64 : 32 }}>
          <View style={{ flex: wide ? 1.4 : undefined, gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: RED, alignItems: 'center', justifyContent: 'center' }}>
                <ShieldAlert size={15} color="#FFFFFF" strokeWidth={2.2} />
              </View>
              <Text style={{ fontFamily: sans(700), fontSize: 15, letterSpacing: 0.5, color: NAVY }}>SIYASHESHA</Text>
            </View>
            <Text style={{ fontFamily: sans(400), fontSize: 14, lineHeight: 22, color: MUTED, maxWidth: 340 }}>
              A patient-held health passport and offline emergency ICE card for South African patients and families.
            </Text>
            <Pressable onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}>
              <Text style={{ fontFamily: sans(500), fontSize: 14, color: NAVY }}>{SUPPORT_EMAIL}</Text>
            </Pressable>
          </View>
          {footerColumns.map((col) => (
            <View key={col.title} style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontFamily: sans(600), fontSize: 13, color: INK, marginBottom: 8 }}>{col.title}</Text>
              {col.links.map((l) => (
                <Pressable
                  key={l.label}
                  accessibilityRole="link"
                  onPress={() => (l.href ? router.navigate(l.href as any) : void Linking.openURL(`mailto:${l.mail}`))}
                  style={{ paddingVertical: 4 }}
                >
                  <Text style={{ fontFamily: sans(400), fontSize: 14, color: MUTED }}>{l.label}</Text>
                </Pressable>
              ))}
            </View>
          ))}
        </View>

        <View style={{ marginTop: 40, paddingTop: 24, borderTopWidth: 1, borderTopColor: LINE, gap: 8 }}>
          <Text style={{ fontFamily: sans(400), fontSize: 12, lineHeight: 18, color: MUTED, maxWidth: 760 }}>
            Siyashesha is a patient-held record organiser. It is not a medical device and does not diagnose, treat or replace
            professional medical advice. In an emergency call 112 (or 10177 in South Africa) immediately.
          </Text>
          <Text style={{ fontFamily: sans(400), fontSize: 12, color: MUTED }}>
            © {new Date().getFullYear()} Siyashesha. All rights reserved. Apple and App Store are trademarks of Apple Inc. Google Play is a trademark of Google LLC.
          </Text>
        </View>
      </View>
    </View>
  );
}
