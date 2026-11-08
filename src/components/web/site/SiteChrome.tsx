import { router, usePathname } from 'expo-router';
import { Menu, X } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, Platform, Pressable, Text, useWindowDimensions, View } from 'react-native';

export const NAVY = '#0B1E40';
export const RED = '#DC1F26';
export const TEAL = '#0D7C66';
export const INK = '#1B2540';
export const MUTED = '#5B6478';
export const LINE = '#E5E9F2';
export const MAX = 1120;

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

/** Top navigation shared by every public page. `overlay` floats white over the landing hero. */
export function SiteNav({ overlay = false }: { overlay?: boolean }) {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const pad = width >= 768 ? 32 : 20;
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const fg = overlay ? '#FFFFFF' : NAVY;
  const sub = overlay ? 'rgba(255,255,255,0.92)' : MUTED;

  return (
    <View
      style={{
        zIndex: 20,
        ...(overlay
          ? { position: 'absolute' as const, top: 0, left: 0, right: 0 }
          : { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: LINE, ...(Platform.OS === 'web' ? ({ position: 'sticky', top: 0 } as any) : null) }),
      }}
    >
      <View
        style={{
          width: '100%',
          maxWidth: 1360,
          alignSelf: 'center',
          paddingHorizontal: pad,
          height: 76,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Pressable accessibilityRole="link" accessibilityLabel="Siyashesha home" onPress={() => router.navigate('/')}>
          <Text style={{ fontFamily: 'BebasNeue_400Regular', fontSize: 28, letterSpacing: 2, color: overlay ? '#FFFFFF' : RED }}>SIYASHESHA</Text>
        </Pressable>

        {wide ? (
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {NAV_LINKS.map((l) => {
              const active = pathname === l.href;
              return (
                <Pressable
                  key={l.href}
                  accessibilityRole="link"
                  onPress={() => router.navigate(l.href as any)}
                  style={{ paddingHorizontal: 18, height: 40, justifyContent: 'center' }}
                >
                  <Text style={{ fontFamily: sans(active ? 600 : 500), fontSize: 16, color: active ? fg : sub }}>{l.label}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {wide ? (
            <Pressable accessibilityRole="button" onPress={goSignIn} style={{ paddingHorizontal: 16, height: 44, justifyContent: 'center' }}>
              <Text style={{ fontFamily: sans(500), fontSize: 16, color: fg }}>Log in</Text>
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={() => goSignUp()}
            style={{ paddingHorizontal: 20, height: 44, borderRadius: 999, backgroundColor: overlay ? '#FFFFFF' : NAVY, justifyContent: 'center' }}
          >
            <Text style={{ fontFamily: sans(600), fontSize: 15, color: overlay ? NAVY : '#FFFFFF' }}>
              {wide ? 'Create passport' : 'Start'}
            </Text>
          </Pressable>
          {!wide ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Menu" onPress={() => setOpen((v) => !v)} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
              {open ? <X size={22} color={fg} /> : <Menu size={22} color={fg} />}
            </Pressable>
          ) : null}
        </View>
      </View>

      {!wide && open ? (
        <View style={{ backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: LINE, paddingHorizontal: pad, paddingBottom: 12 }}>
          {[...NAV_LINKS, { href: '/sign-in', label: 'Log in' }].map((l) => (
            <Pressable
              key={l.href}
              accessibilityRole="link"
              onPress={() => {
                setOpen(false);
                router.navigate(l.href as any);
              }}
              style={{ height: 48, justifyContent: 'center' }}
            >
              <Text style={{ fontFamily: sans(500), fontSize: 17, color: INK }}>{l.label}</Text>
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
    <View style={{ backgroundColor: '#F8FAFC', borderTopWidth: 1, borderTopColor: LINE }}>
      <View style={{ width: '100%', maxWidth: MAX, alignSelf: 'center', paddingHorizontal: pad, paddingTop: 56, paddingBottom: 40 }}>
        <View style={{ flexDirection: wide ? 'row' : 'column', gap: wide ? 64 : 32 }}>
          <View style={{ flex: wide ? 1.3 : undefined, gap: 10 }}>
            <Text style={{ fontFamily: 'BebasNeue_400Regular', fontSize: 26, letterSpacing: 1, color: RED }}>SIYASHESHA</Text>
            <Text style={{ fontFamily: sans(400), fontSize: 14, lineHeight: 22, color: MUTED, maxWidth: 320 }}>
              A patient-held health passport for your records and emergency information.
            </Text>
            <Pressable onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}>
              <Text style={{ fontFamily: sans(500), fontSize: 14, color: NAVY }}>{SUPPORT_EMAIL}</Text>
            </Pressable>
          </View>
          {footerColumns.map((col) => (
            <View key={col.title} style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontFamily: sans(600), fontSize: 13, color: INK, marginBottom: 6 }}>{col.title}</Text>
              {col.links.map((l) => (
                <Pressable
                  key={l.label}
                  accessibilityRole="link"
                  onPress={() => (l.href ? router.navigate(l.href as any) : void Linking.openURL(`mailto:${l.mail}`))}
                  style={{ paddingVertical: 5 }}
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
