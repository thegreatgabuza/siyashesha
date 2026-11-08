import Head from 'expo-router/head';
import { Linking, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { INK, LINE, MAX, MUTED, NAVY, RED, SiteFooter, SiteNav, sans } from './SiteChrome';

/** Shell for a standalone public page: nav, title block, content column, footer. */
export function SitePage({
  title,
  eyebrow,
  intro,
  description,
  children,
  narrow = false,
  scrollRef,
}: {
  title: string;
  eyebrow?: string;
  intro?: string;
  description?: string;
  children: React.ReactNode;
  narrow?: boolean;
  scrollRef?: (r: any) => void;
}) {
  const { width } = useWindowDimensions();
  const wide = width >= 768;
  const pad = wide ? 32 : 20;
  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <Head>
        <title>{`${title} · Siyashesha Health Passport`}</title>
        <meta name="description" content={description ?? intro ?? 'Siyashesha Health Passport'} />
      </Head>
      <SiteNav />
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}>
        <View style={{ backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: LINE }}>
          <Animated.View
            entering={FadeInDown.duration(600)}
            style={{ width: '100%', maxWidth: MAX, alignSelf: 'center', paddingHorizontal: pad, paddingTop: wide ? 72 : 40, paddingBottom: wide ? 64 : 36 }}
          >
            {eyebrow ? <Text style={{ fontFamily: sans(600), fontSize: 14, color: '#0D7C66' }}>{eyebrow}</Text> : null}
            <Text style={{ fontFamily: sans(500), fontSize: wide ? 52 : 34, lineHeight: wide ? 58 : 40, letterSpacing: wide ? -1.6 : -1, color: NAVY, marginTop: 8, maxWidth: 780 }}>
              {title}
            </Text>
            {intro ? (
              <Text style={{ fontFamily: sans(400), fontSize: wide ? 19 : 16, lineHeight: wide ? 30 : 25, color: MUTED, marginTop: 16, maxWidth: 680 }}>{intro}</Text>
            ) : null}
          </Animated.View>
        </View>
        <View style={{ width: '100%', maxWidth: narrow ? 800 : MAX, alignSelf: 'center', paddingHorizontal: pad, paddingVertical: wide ? 64 : 40 }}>
          {children}
        </View>
        <SiteFooter />
      </ScrollView>
    </View>
  );
}

export function H2({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <Text nativeID={id} style={{ fontFamily: sans(600), fontSize: 22, lineHeight: 30, letterSpacing: -0.4, color: NAVY, marginTop: 40, marginBottom: 10 }}>
      {children}
    </Text>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return <Text style={{ fontFamily: sans(400), fontSize: 16, lineHeight: 26, color: INK, marginBottom: 12 }}>{children}</Text>;
}

export function Bullets({ items }: { items: React.ReactNode[] }) {
  return (
    <View style={{ gap: 8, marginBottom: 12 }}>
      {items.map((it, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 12 }}>
          <Text style={{ fontFamily: sans(400), fontSize: 16, lineHeight: 26, color: MUTED }}>•</Text>
          <Text style={{ flex: 1, fontFamily: sans(400), fontSize: 16, lineHeight: 26, color: INK }}>{it}</Text>
        </View>
      ))}
    </View>
  );
}

export function MailLink({ email, subject }: { email: string; subject?: string }) {
  return (
    <Text
      accessibilityRole="link"
      onPress={() => void Linking.openURL(`mailto:${email}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`)}
      style={{ fontFamily: sans(600), color: NAVY, textDecorationLine: 'underline' }}
    >
      {email}
    </Text>
  );
}

export function Callout({ tone = 'info', title, children }: { tone?: 'info' | 'danger'; title: string; children: React.ReactNode }) {
  const danger = tone === 'danger';
  return (
    <View
      style={{
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: danger ? '#F5C2C4' : LINE,
        backgroundColor: danger ? '#FEF2F2' : '#F8FAFC',
        marginVertical: 12,
      }}
    >
      <Text style={{ fontFamily: sans(600), fontSize: 15, color: danger ? RED : NAVY, marginBottom: 6 }}>{title}</Text>
      <Text style={{ fontFamily: sans(400), fontSize: 15, lineHeight: 24, color: INK }}>{children}</Text>
    </View>
  );
}

export function CtaButton({ label, onPress, secondary }: { label: string; onPress: () => void; secondary?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        height: 48,
        paddingHorizontal: 24,
        borderRadius: 999,
        justifyContent: 'center',
        alignSelf: 'flex-start',
        backgroundColor: secondary ? 'transparent' : NAVY,
        borderWidth: secondary ? 1 : 0,
        borderColor: LINE,
      }}
    >
      <Text style={{ fontFamily: sans(600), fontSize: 15, color: secondary ? NAVY : '#FFFFFF' }}>{label}</Text>
    </Pressable>
  );
}
