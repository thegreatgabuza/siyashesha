import { router } from 'expo-router';
import {
  ArrowRight,
  CalendarDays,
  Check,
  FileText,
  Languages,
  Lock,
  QrCode,
  ShieldAlert,
  Share2,
} from 'lucide-react-native';
import { useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';

import { LegalDocumentModal, type LegalDocKind } from '@/components/security/LegalDocumentModal';

const NAVY = '#0B1E40';
const RED = '#DC1F26';
const TEAL = '#0D7C66';
const INK = '#1B2540';
const MUTED = '#5B6478';
const LINE = '#E5E9F2';
const MAX = 1120;

const sans = (w: 400 | 500 | 600 | 700 = 400) =>
  ({ 400: 'Inter_400Regular', 500: 'Inter_500Medium', 600: 'Inter_600SemiBold', 700: 'Inter_700Bold' })[w];

function goSignUp() {
  router.push({ pathname: '/sign-in', params: { mode: 'signup' } } as any);
}
function goSignIn() {
  router.push('/sign-in');
}

function Button({
  label,
  onPress,
  variant = 'primary',
  trailing,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'light';
  trailing?: boolean;
}) {
  const bg = variant === 'primary' ? NAVY : variant === 'light' ? '#FFFFFF' : 'transparent';
  const fg = variant === 'primary' ? '#FFFFFF' : NAVY;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ hovered, pressed }: any) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        height: 48,
        paddingHorizontal: 22,
        borderRadius: 12,
        backgroundColor: bg,
        borderWidth: variant === 'primary' ? 0 : 1,
        borderColor: LINE,
        opacity: pressed ? 0.85 : hovered && variant === 'primary' ? 0.92 : 1,
      })}
    >
      <Text style={{ fontFamily: sans(600), fontSize: 15, color: fg }}>{label}</Text>
      {trailing ? <ArrowRight size={16} color={fg} /> : null}
    </Pressable>
  );
}

/** Web landing page: the first thing an unauthenticated visitor sees. */
export default function LandingPage() {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const pad = width >= 768 ? 32 : 20;
  const [legalDoc, setLegalDoc] = useState<LegalDocKind>(null);
  const [scroller, setScroller] = useState<any>(null);
  const [nav] = useState(() => ({ y: {} as Record<string, number> }));
  const mark = (k: string) => (e: any) => {
    nav.y[k] = e.nativeEvent.layout.y;
  };
  const jump = (k: string) =>
    scroller?.scrollTo({ y: Math.max((nav.y[k] ?? 0) - 68, 0), animated: true });

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <ScrollView ref={setScroller} showsVerticalScrollIndicator={false}>
        {/* Nav */}
        <View style={{ borderBottomWidth: 1, borderBottomColor: LINE, position: 'sticky' as any, top: 0, zIndex: 10, backgroundColor: '#FFFFFF' }}>
          <View
            style={{
              width: '100%',
              maxWidth: MAX,
              alignSelf: 'center',
              paddingHorizontal: pad,
              height: 68,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View>
              <Text style={{ fontFamily: 'BebasNeue_400Regular', fontSize: 28, letterSpacing: 1, color: RED }}>SIYASHESHA</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {wide
                ? (['features', 'security', 'pricing'] as const).map((k) => (
                    <Pressable key={k} accessibilityRole="link" onPress={() => jump(k)} style={{ paddingHorizontal: 14, height: 40, justifyContent: 'center' }}>
                      <Text style={{ fontFamily: sans(500), fontSize: 14, color: MUTED }}>{k[0].toUpperCase() + k.slice(1)}</Text>
                    </Pressable>
                  ))
                : null}
              <Pressable accessibilityRole="button" onPress={goSignIn} style={{ paddingHorizontal: 14, height: 40, justifyContent: 'center' }}>
                <Text style={{ fontFamily: sans(600), fontSize: 14, color: INK }}>Sign in</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={goSignUp}
                style={{ paddingHorizontal: 16, height: 40, borderRadius: 10, backgroundColor: NAVY, justifyContent: 'center' }}
              >
                <Text style={{ fontFamily: sans(600), fontSize: 14, color: '#FFFFFF' }}>Create passport</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Hero */}
        <View
          style={{
            width: '100%',
            maxWidth: MAX,
            alignSelf: 'center',
            paddingHorizontal: pad,
            paddingTop: wide ? 88 : 48,
            paddingBottom: wide ? 96 : 56,
            flexDirection: wide ? 'row' : 'column',
            alignItems: wide ? 'center' : 'stretch',
            gap: wide ? 64 : 40,
          }}
        >
          <View style={{ flex: wide ? 1.1 : undefined }}>
            <Text style={{ fontFamily: sans(600), fontSize: 14, color: TEAL }}>Patient-held health records</Text>
            <Text
              style={{
                fontFamily: sans(700),
                fontSize: wide ? 52 : 36,
                lineHeight: wide ? 58 : 42,
                letterSpacing: -1,
                color: NAVY,
                marginTop: 12,
              }}
            >
              Your records and emergency card, in one health passport.
            </Text>
            <Text style={{ fontFamily: sans(400), fontSize: 18, lineHeight: 28, color: MUTED, marginTop: 20, maxWidth: 520 }}>
              Keep lab results, prescriptions and scans in one private vault. Paramedics see your blood group, allergies and
              emergency contacts in seconds, without a login.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 32 }}>
              <Button label="Get started free" onPress={goSignUp} trailing />
              <Button label="Sign in" onPress={goSignIn} variant="ghost" />
            </View>
            <Text style={{ fontFamily: sans(400), fontSize: 13, color: MUTED, marginTop: 16 }}>
              Free forever for your emergency card. POPIA aligned.
            </Text>
          </View>

          <View style={{ flex: wide ? 0.9 : undefined, alignItems: 'center' }}>
            <PassportSpecimen />
          </View>
        </View>

        {/* Features */}
        <View onLayout={mark('features')} style={{ backgroundColor: '#F8FAFC', borderTopWidth: 1, borderBottomWidth: 1, borderColor: LINE }}>
          <View
            style={{ width: '100%', maxWidth: MAX, alignSelf: 'center', paddingHorizontal: pad, paddingVertical: wide ? 88 : 56 }}
          >
            <Text style={{ fontFamily: sans(700), fontSize: wide ? 36 : 28, letterSpacing: -0.6, color: NAVY, maxWidth: 560 }}>
              Everything you need when care is urgent, and when it isn’t.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 40 }}>
              <Feature
                wide={wide}
                span={2}
                icon={<ShieldAlert size={20} color={RED} />}
                title="Emergency ICE card"
                body="Blood group, allergies, chronic conditions and emergency contacts on a QR card that works from the lock screen and the web."
              />
              <Feature
                wide={wide}
                icon={<FileText size={20} color={NAVY} />}
                title="Record vault"
                body="Scan or upload lab results, scripts and imaging. We read them into searchable, dated entries."
              />
              <Feature
                wide={wide}
                icon={<Share2 size={20} color={NAVY} />}
                title="Clinician sharing"
                body="Share selected records with a doctor for 24 hours to 30 days, protected by a PIN. Revoke any time."
              />
              <Feature
                wide={wide}
                icon={<CalendarDays size={20} color={NAVY} />}
                title="Medication and calendar"
                body="Dose reminders, appointments and a diary of what your doctor said."
              />
              <Feature
                wide={wide}
                span={2}
                icon={<Languages size={20} color={TEAL} />}
                title="Seven languages"
                body="English, isiZulu, Afrikaans, Setswana, Kiswahili, Français and Deutsch."
              />
            </View>
          </View>
        </View>

        {/* Security */}
        <View
          onLayout={mark('security')}
          style={{
            width: '100%',
            maxWidth: MAX,
            alignSelf: 'center',
            paddingHorizontal: pad,
            paddingVertical: wide ? 88 : 56,
            flexDirection: wide ? 'row' : 'column',
            gap: wide ? 64 : 24,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: sans(700), fontSize: wide ? 36 : 28, letterSpacing: -0.6, color: NAVY }}>
              You own your data.
            </Text>
            <Text style={{ fontFamily: sans(400), fontSize: 16, lineHeight: 26, color: MUTED, marginTop: 12 }}>
              Records sync to your private cloud vault. AI features only run after you consent, and you can export or erase
              everything from Settings under POPIA.
            </Text>
          </View>
          <View style={{ flex: 1, gap: 14 }}>
            {[
              'Email one-time code sign-in',
              'Row-level security on every table',
              'PIN-protected, expiring doctor links',
              'Export or erase all data in-app',
            ].map((t) => (
              <View key={t} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#E6F4F1', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={13} color={TEAL} strokeWidth={3} />
                </View>
                <Text style={{ fontFamily: sans(500), fontSize: 15, color: INK }}>{t}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Pricing */}
        <View onLayout={mark('pricing')} style={{ backgroundColor: '#F8FAFC', borderTopWidth: 1, borderBottomWidth: 1, borderColor: LINE }}>
          <View
            style={{ width: '100%', maxWidth: MAX, alignSelf: 'center', paddingHorizontal: pad, paddingVertical: wide ? 88 : 56 }}
          >
            <Text style={{ fontFamily: sans(700), fontSize: wide ? 36 : 28, letterSpacing: -0.6, color: NAVY }}>Simple pricing</Text>
            <Text style={{ fontFamily: sans(400), fontSize: 16, color: MUTED, marginTop: 8 }}>
              The emergency card is always free. Upgrade for unlimited records and the assistant.
            </Text>
            <View style={{ flexDirection: wide ? 'row' : 'column', gap: 16, marginTop: 40 }}>
              <Plan name="Free" price="R0" note="Emergency card, 10 records" />
              <Plan name="Monthly Pro" price="R19.99" note="per month" />
              <Plan name="Annual Pro" price="R149.99" note="per year, 7-day free trial" featured />
              <Plan name="Lifetime" price="R299.99" note="once-off founder pass" />
            </View>
            <View style={{ marginTop: 32, alignItems: 'flex-start' }}>
              <Button label="Create your passport" onPress={goSignUp} trailing />
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={{ width: '100%', maxWidth: MAX, alignSelf: 'center', paddingHorizontal: pad, paddingVertical: 40, gap: 16 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 20, alignItems: 'center' }}>
            <Text style={{ fontFamily: 'BebasNeue_400Regular', fontSize: 22, letterSpacing: 1, color: RED }}>SIYASHESHA</Text>
            <Pressable onPress={() => setLegalDoc('privacy')}>
              <Text style={{ fontFamily: sans(500), fontSize: 13, color: MUTED }}>Privacy policy (POPIA)</Text>
            </Pressable>
            <Pressable onPress={() => setLegalDoc('terms')}>
              <Text style={{ fontFamily: sans(500), fontSize: 13, color: MUTED }}>Terms of use</Text>
            </Pressable>
            <Pressable onPress={() => void Linking.openURL('mailto:support@siyashesha.co.za')}>
              <Text style={{ fontFamily: sans(500), fontSize: 13, color: MUTED }}>Support</Text>
            </Pressable>
          </View>
          <Text style={{ fontFamily: sans(400), fontSize: 12, lineHeight: 18, color: MUTED, maxWidth: 720 }}>
            Siyashesha is a patient-held record organiser, not a medical device. It does not diagnose or treat. In an emergency
            call 112 or your local emergency number.
          </Text>
        </View>
      </ScrollView>
      <LegalDocumentModal visibleDoc={legalDoc} onClose={() => setLegalDoc(null)} />
    </View>
  );
}

function Feature({
  icon,
  title,
  body,
  span = 1,
  wide,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  span?: 1 | 2;
  wide: boolean;
}) {
  // 3-column bento on wide screens; full width on narrow ones.
  const basis = wide ? (span === 2 ? '65.5%' : '31.5%') : '100%';
  return (
    <View
      style={{
        flexBasis: basis as any,
        flexGrow: 1,
        padding: 24,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: LINE,
      }}
    >
      <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#F1F4F9', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </View>
      <Text style={{ fontFamily: sans(600), fontSize: 18, color: NAVY, marginTop: 16 }}>{title}</Text>
      <Text style={{ fontFamily: sans(400), fontSize: 14, lineHeight: 22, color: MUTED, marginTop: 6 }}>{body}</Text>
    </View>
  );
}

function Plan({ name, price, note, featured }: { name: string; price: string; note: string; featured?: boolean }) {
  return (
    <View
      style={{
        flex: 1,
        padding: 24,
        borderRadius: 16,
        backgroundColor: featured ? NAVY : '#FFFFFF',
        borderWidth: 1,
        borderColor: featured ? NAVY : LINE,
      }}
    >
      <Text style={{ fontFamily: sans(600), fontSize: 14, color: featured ? '#C7D2EA' : MUTED }}>{name}</Text>
      <Text style={{ fontFamily: sans(700), fontSize: 32, letterSpacing: -0.6, color: featured ? '#FFFFFF' : NAVY, marginTop: 8 }}>{price}</Text>
      <Text style={{ fontFamily: sans(400), fontSize: 13, color: featured ? '#C7D2EA' : MUTED, marginTop: 4 }}>{note}</Text>
    </View>
  );
}

/** Illustrative passport card. Fields are placeholders, not real patient data. */
function PassportSpecimen() {
  const [flipped, setFlipped] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Flip passport card to see the emergency side"
      onPress={() => setFlipped((v) => !v)}
      style={{ width: '100%', maxWidth: 400 }}
    >
      <View
        style={{
          borderRadius: 24,
          backgroundColor: flipped ? '#FFFFFF' : NAVY,
          borderWidth: 1,
          borderColor: flipped ? '#F5C2C4' : NAVY,
          padding: 28,
          minHeight: 244,
          ...(Platform.OS === 'web' ? ({ boxShadow: '0 24px 48px -24px rgba(11,30,64,0.35)' } as any) : null),
        }}
      >
        {!flipped ? (
          <>
            <Text style={{ fontFamily: 'BebasNeue_400Regular', fontSize: 26, letterSpacing: 1, color: '#FFFFFF' }}>HEALTH PASSPORT</Text>
            <Text style={{ fontFamily: sans(500), fontSize: 12, color: '#9FB0D3', marginTop: 2 }}>Sample card</Text>
            <View style={{ flexDirection: 'row', gap: 24, marginTop: 36 }}>
              <Field label="Name" value="Your name" />
              <Field label="Blood group" value="—" />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 36 }}>
              <Lock size={14} color="#9FB0D3" />
              <Text style={{ fontFamily: sans(500), fontSize: 12, color: '#9FB0D3' }}>Tap to see the emergency side</Text>
            </View>
          </>
        ) : (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ShieldAlert size={18} color={RED} />
              <Text style={{ fontFamily: sans(700), fontSize: 15, color: RED }}>Emergency ICE</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24 }}>
              <View style={{ gap: 14 }}>
                <Field label="Allergies" value="Listed here" dark />
                <Field label="Emergency contact" value="Listed here" dark />
              </View>
              <QrCode size={84} color={NAVY} />
            </View>
            <Text style={{ fontFamily: sans(500), fontSize: 12, color: MUTED, marginTop: 24 }}>Scan to open, no login needed</Text>
          </>
        )}
      </View>
    </Pressable>
  );
}

function Field({ label, value, dark }: { label: string; value: string; dark?: boolean }) {
  return (
    <View>
      <Text style={{ fontFamily: sans(500), fontSize: 11, color: dark ? MUTED : '#9FB0D3' }}>{label}</Text>
      <Text style={{ fontFamily: sans(600), fontSize: 16, color: dark ? NAVY : '#FFFFFF', marginTop: 2 }}>{value}</Text>
    </View>
  );
}
