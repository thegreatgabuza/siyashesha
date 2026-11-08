import { LinearGradient } from 'expo-linear-gradient';
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
import { useEffect, useState } from 'react';
import {
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { INK, LINE, MAX, MUTED, NAVY, RED, TEAL, SiteFooter, SiteNav, goSignIn, goSignUp, sans } from '@/components/web/site/SiteChrome';

const LANGUAGES = ['English', 'isiZulu', 'Afrikaans', 'Setswana', 'Kiswahili', 'Fran�ais', 'Deutsch'];

/** Fades and lifts its children in the first time they scroll into view (web). */
function Reveal({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: any }) {
  const p = useSharedValue(Platform.OS === 'web' ? 0 : 1);
  const [node, setNode] = useState<any>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || !node || typeof IntersectionObserver === 'undefined') {
      p.value = 1;
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          p.value = withDelay(delay, withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }));
          io.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [node, delay, p]);

  const anim = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ translateY: (1 - p.value) * 28 }],
  }));

  return (
    <Animated.View ref={setNode} style={[anim, style]}>
      {children}
    </Animated.View>
  );
}

function Button({
  label,
  onPress,
  variant = 'primary',
  trailing,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'glass' | 'white';
  trailing?: boolean;
}) {
  const bg =
    variant === 'primary' ? NAVY : variant === 'white' ? '#FFFFFF' : variant === 'glass' ? 'rgba(255,255,255,0.16)' : 'transparent';
  const fg = variant === 'primary' || variant === 'glass' ? '#FFFFFF' : NAVY;
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
        borderRadius: 999,
        backgroundColor: bg,
        borderWidth: variant === 'ghost' ? 1 : variant === 'glass' ? 1 : 0,
        borderColor: variant === 'glass' ? 'rgba(255,255,255,0.28)' : LINE,
        opacity: pressed ? 0.85 : 1,
        transform: [{ scale: hovered ? 1.03 : 1 }],
        ...(Platform.OS === 'web' ? ({ transition: 'transform 160ms ease, opacity 160ms ease' } as any) : null),
      })}
    >
      <Text style={{ fontFamily: sans(600), fontSize: 15, color: fg }}>{label}</Text>
      {trailing ? <ArrowRight size={16} color={fg} /> : null}
    </Pressable>
  );
}

/** Web landing page: the first thing a signed-out visitor sees. */
export default function LandingPage() {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const pad = width >= 768 ? 32 : 20;
  const [email, setEmail] = useState('');

  // Slow Ken Burns drift on the hero photo and a gentle float on the card.
  const zoom = useSharedValue(1);
  const float = useSharedValue(0);
  useEffect(() => {
    zoom.value = withRepeat(withTiming(1.07, { duration: 18000, easing: Easing.inOut(Easing.quad) }), -1, true);
    float.value = withRepeat(withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [zoom, float]);
  const zoomStyle = useAnimatedStyle(() => ({ transform: [{ scale: zoom.value }] }));
  const floatStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -8 + float.value * 16 }] }));

  const heroH = wide ? 920 : 860;

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Announcement */}
        <Pressable
          onPress={() => router.navigate('/features')}
          style={{ height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FDFDFC', borderBottomWidth: 1, borderBottomColor: LINE }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16 }}>
            <Text numberOfLines={1} style={{ fontFamily: sans(500), fontSize: 14, color: INK }}>
              Introducing PIN-protected clinician share links
            </Text>
            <ArrowRight size={14} color={INK} />
          </View>
        </Pressable>

        {/* Hero */}
        <View style={{ height: heroH, overflow: 'hidden', backgroundColor: '#6C7AA0' }}>
          <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, zoomStyle]}>
            <ImageBackground
              source={require('../../../assets/images/landing-hero.jpg')}
              resizeMode="cover"
              style={{ width: '100%', height: '100%' }}
            />
          </Animated.View>
          <LinearGradient
            colors={['rgba(11,30,64,0.45)', 'rgba(11,30,64,0.05)', 'rgba(11,30,64,0.0)']}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 440 }}
            pointerEvents="none"
          />

          <SiteNav overlay />

          {/* Copy + capture */}
          <View style={{ alignItems: 'center', paddingHorizontal: pad, paddingTop: wide ? 56 : 32 }}>
            <Animated.Text
              entering={FadeInDown.delay(100).duration(800)}
              style={{
                fontFamily: sans(500),
                fontSize: wide ? 72 : 40,
                lineHeight: wide ? 78 : 46,
                letterSpacing: wide ? -2 : -1,
                color: '#FFFFFF',
                textAlign: 'center',
                maxWidth: 860,
                ...(Platform.OS === 'web' ? ({ textShadow: '0 2px 24px rgba(11,30,64,0.35)' } as any) : null),
              }}
            >
              Radically better health records
            </Animated.Text>
            <Animated.Text
              entering={FadeInDown.delay(250).duration(800)}
              style={{ fontFamily: sans(400), fontSize: wide ? 22 : 17, lineHeight: wide ? 32 : 26, color: 'rgba(255,255,255,0.92)', textAlign: 'center', maxWidth: 620, marginTop: 20 }}
            >
              One private passport for your records and emergency card. Set up in minutes, readable by paramedics in seconds.
            </Animated.Text>

            <Animated.View
              entering={FadeInDown.delay(400).duration(800)}
              style={{ flexDirection: wide ? 'row' : 'column', alignItems: 'center', gap: 12, marginTop: 36, width: '100%', justifyContent: 'center' }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  width: '100%',
                  maxWidth: 520,
                  padding: 6,
                  paddingLeft: 22,
                  borderRadius: 999,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.3)',
                  ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(14px)' } as any) : null),
                }}
              >
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor="rgba(255,255,255,0.75)"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  onSubmitEditing={() => goSignUp(email.trim())}
                  accessibilityLabel="Email address"
                  style={{ flex: 1, height: 44, fontFamily: sans(400), fontSize: 16, color: '#FFFFFF', outlineStyle: 'none' } as any}
                />
                <Pressable
                  accessibilityRole="button"
                  onPress={() => goSignUp(email.trim())}
                  style={({ hovered }: any) => ({
                    height: 48,
                    paddingHorizontal: 24,
                    borderRadius: 999,
                    backgroundColor: hovered ? '#122B5C' : NAVY,
                    justifyContent: 'center',
                  })}
                >
                  <Text style={{ fontFamily: sans(600), fontSize: 15, color: '#FFFFFF' }}>Create passport</Text>
                </Pressable>
              </View>
              <Button label="See how it works" variant="glass" onPress={() => router.navigate('/features')} />
            </Animated.View>
          </View>

          {/* Floating passport card */}
          <Animated.View
            entering={FadeInDown.delay(700).duration(900)}
            style={{ position: 'absolute', left: 0, right: 0, bottom: wide ? 56 : 32, alignItems: 'center', paddingHorizontal: pad }}
          >
            <Animated.View style={[{ width: '100%', maxWidth: 400 }, floatStyle]}>
              <PassportSpecimen />
            </Animated.View>
          </Animated.View>
        </View>

        {/* Language marquee */}
        <Marquee />

        {/* Features */}
        <View style={{ backgroundColor: '#FFFFFF' }}>
          <View style={{ width: '100%', maxWidth: MAX, alignSelf: 'center', paddingHorizontal: pad, paddingVertical: wide ? 104 : 64 }}>
            <Reveal>
              <Text style={{ fontFamily: sans(500), fontSize: wide ? 44 : 30, lineHeight: wide ? 50 : 36, letterSpacing: -1.2, color: NAVY, maxWidth: 640 }}>
                Built for the worst day, and every ordinary one.
              </Text>
            </Reveal>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 48 }}>
              <Feature wide={wide} span={2} delay={0} icon={<ShieldAlert size={20} color={RED} />} title="Emergency ICE card" body="Blood group, allergies, chronic conditions and emergency contacts on a QR card that opens from the lock screen or the web, no login needed." />
              <Feature wide={wide} delay={100} icon={<FileText size={20} color={NAVY} />} title="Record vault" body="Scan or upload lab results, scripts and imaging. We read them into searchable, dated entries." />
              <Feature wide={wide} delay={0} icon={<Share2 size={20} color={NAVY} />} title="Clinician sharing" body="Share selected records for 24 hours to 30 days, protected by a PIN. Revoke any time." />
              <Feature wide={wide} delay={100} icon={<CalendarDays size={20} color={NAVY} />} title="Medication and calendar" body="Dose reminders, appointments and a diary of what your doctor said." />
              <Feature wide={wide} delay={200} icon={<Languages size={20} color={TEAL} />} title="Seven languages" body="English, isiZulu, Afrikaans, Setswana, Kiswahili, Français and Deutsch." />
            </View>
          </View>
        </View>

        {/* Security */}
        <View style={{ backgroundColor: '#F8FAFC', borderTopWidth: 1, borderBottomWidth: 1, borderColor: LINE }}>
          <View style={{ width: '100%', maxWidth: MAX, alignSelf: 'center', paddingHorizontal: pad, paddingVertical: wide ? 104 : 64, flexDirection: wide ? 'row' : 'column', gap: wide ? 64 : 28 }}>
            <Reveal style={{ flex: 1 }}>
              <Text style={{ fontFamily: sans(500), fontSize: wide ? 44 : 30, letterSpacing: -1.2, color: NAVY }}>You own your data.</Text>
              <Text style={{ fontFamily: sans(400), fontSize: 17, lineHeight: 27, color: MUTED, marginTop: 14 }}>
                Records sync to your private cloud vault. AI features only run after you consent, and you can export or erase everything from Settings under POPIA.
              </Text>
            </Reveal>
            <View style={{ flex: 1, gap: 16 }}>
              {['Email one-time code sign-in', 'Row-level security on every table', 'PIN-protected, expiring doctor links', 'Export or erase all data in-app'].map((t, i) => (
                <Reveal key={t} delay={i * 90}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#E6F4F1', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={14} color={TEAL} strokeWidth={3} />
                    </View>
                    <Text style={{ fontFamily: sans(500), fontSize: 16, color: INK }}>{t}</Text>
                  </View>
                </Reveal>
              ))}
            </View>
          </View>
        </View>

        {/* Pricing */}
        <View style={{ backgroundColor: '#FFFFFF' }}>
          <View style={{ width: '100%', maxWidth: MAX, alignSelf: 'center', paddingHorizontal: pad, paddingVertical: wide ? 104 : 64 }}>
            <Reveal>
              <Text style={{ fontFamily: sans(500), fontSize: wide ? 44 : 30, letterSpacing: -1.2, color: NAVY }}>Simple pricing</Text>
              <Text style={{ fontFamily: sans(400), fontSize: 17, color: MUTED, marginTop: 10 }}>The emergency card is always free. Upgrade for unlimited records and the assistant.</Text>
            </Reveal>
            <View style={{ flexDirection: wide ? 'row' : 'column', gap: 16, marginTop: 44 }}>
              <Plan delay={0} name="Free" price="R0" note="Emergency card, 10 records" />
              <Plan delay={90} name="Monthly Pro" price="R19.99" note="per month" />
              <Plan delay={180} name="Annual Pro" price="R149.99" note="per year, 7-day free trial" featured />
              <Plan delay={270} name="Lifetime" price="R299.99" note="once-off founder pass" />
            </View>
          </View>
        </View>

        {/* Closing CTA */}
        <View style={{ backgroundColor: NAVY }}>
          <Reveal style={{ width: '100%', maxWidth: MAX, alignSelf: 'center', paddingHorizontal: pad, paddingVertical: wide ? 96 : 64, alignItems: 'center' }}>
            <Text style={{ fontFamily: sans(500), fontSize: wide ? 48 : 32, lineHeight: wide ? 54 : 38, letterSpacing: -1.4, color: '#FFFFFF', textAlign: 'center', maxWidth: 700 }}>
              Have your health story ready before you need it.
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Button label="Get started free" variant="white" trailing onPress={() => goSignUp()} />
              <Button label="Log in" variant="glass" onPress={goSignIn} />
            </View>
          </Reveal>
        </View>

        <SiteFooter />
      </ScrollView>
    </View>
  );
}

/** Endless horizontal ticker of supported languages. */
function Marquee() {
  const x = useSharedValue(0);
  const [w, setW] = useState(0);
  useEffect(() => {
    if (!w) return;
    x.value = 0;
    x.value = withRepeat(withTiming(-w, { duration: w * 28, easing: Easing.linear }), -1, false);
  }, [w, x]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const row = (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {LANGUAGES.map((l) => (
        <View key={l} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 28 }}>
          <Text style={{ fontFamily: sans(500), fontSize: 18, color: MUTED }}>{l}</Text>
          <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#C3CAD9', marginLeft: 56 }} />
        </View>
      ))}
    </View>
  );
  return (
    <View style={{ paddingVertical: 28, overflow: 'hidden', borderBottomWidth: 1, borderBottomColor: LINE }}>
      <Animated.View style={[{ flexDirection: 'row', width: 'max-content' as any }, style]}>
        <View onLayout={(e) => setW(e.nativeEvent.layout.width)}>{row}</View>
        {row}
        {row}
      </Animated.View>
    </View>
  );
}

function Feature({
  icon,
  title,
  body,
  span = 1,
  wide,
  delay = 0,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  span?: 1 | 2;
  wide: boolean;
  delay?: number;
}) {
  const basis = wide ? (span === 2 ? '65.5%' : '31.5%') : '100%';
  const [hover, setHover] = useState(false);
  return (
    <Reveal delay={delay} style={{ flexBasis: basis as any, flexGrow: 1 }}>
      <Pressable
        onHoverIn={() => setHover(true)}
        onHoverOut={() => setHover(false)}
        style={{
          padding: 28,
          borderRadius: 20,
          backgroundColor: '#F8FAFC',
          borderWidth: 1,
          borderColor: hover ? '#C9D2E6' : LINE,
          minHeight: 200,
          transform: [{ translateY: hover ? -4 : 0 }],
          ...(Platform.OS === 'web' ? ({ transition: 'transform 200ms ease, border-color 200ms ease' } as any) : null),
        }}
      >
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: LINE, alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </View>
        <Text style={{ fontFamily: sans(600), fontSize: 19, color: NAVY, marginTop: 20 }}>{title}</Text>
        <Text style={{ fontFamily: sans(400), fontSize: 15, lineHeight: 23, color: MUTED, marginTop: 8 }}>{body}</Text>
      </Pressable>
    </Reveal>
  );
}

function Plan({ name, price, note, featured, delay = 0 }: { name: string; price: string; note: string; featured?: boolean; delay?: number }) {
  return (
    <Reveal delay={delay} style={{ flex: 1 }}>
      <View
        style={{
          padding: 28,
          borderRadius: 20,
          backgroundColor: featured ? NAVY : '#FFFFFF',
          borderWidth: 1,
          borderColor: featured ? NAVY : LINE,
        }}
      >
        <Text style={{ fontFamily: sans(600), fontSize: 14, color: featured ? '#C7D2EA' : MUTED }}>{name}</Text>
        <Text style={{ fontFamily: sans(500), fontSize: 36, letterSpacing: -1, color: featured ? '#FFFFFF' : NAVY, marginTop: 10 }}>{price}</Text>
        <Text style={{ fontFamily: sans(400), fontSize: 13, color: featured ? '#C7D2EA' : MUTED, marginTop: 4 }}>{note}</Text>
      </View>
    </Reveal>
  );
}

/** Illustrative passport card. Fields are placeholders, not real patient data. */
function PassportSpecimen() {
  const [flipped, setFlipped] = useState(false);
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withSequence(withTiming(1, { duration: 900 }), withTiming(0.35, { duration: 900 })), -1);
  }, [pulse]);
  const dot = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Flip passport card to see the emergency side"
      onPress={() => setFlipped((v) => !v)}
    >
      <View
        style={{
          borderRadius: 24,
          backgroundColor: flipped ? '#FFFFFF' : NAVY,
          borderWidth: 1,
          borderColor: flipped ? '#F5C2C4' : 'rgba(255,255,255,0.18)',
          padding: 28,
          minHeight: 232,
          ...(Platform.OS === 'web' ? ({ boxShadow: '0 32px 64px -24px rgba(11,30,64,0.55)', transition: 'background-color 300ms ease' } as any) : null),
        }}
      >
        {!flipped ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: 'BebasNeue_400Regular', fontSize: 26, letterSpacing: 1, color: '#FFFFFF' }}>HEALTH PASSPORT</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Animated.View style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#34D399' }, dot]} />
                <Text style={{ fontFamily: sans(500), fontSize: 12, color: '#9FB0D3' }}>Synced</Text>
              </View>
            </View>
            <Text style={{ fontFamily: sans(500), fontSize: 12, color: '#9FB0D3', marginTop: 2 }}>Sample card</Text>
            <View style={{ flexDirection: 'row', gap: 24, marginTop: 32 }}>
              <Field label="Name" value="Your name" />
              <Field label="Blood group" value="—" />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 32 }}>
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
