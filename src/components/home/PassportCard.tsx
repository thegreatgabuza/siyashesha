import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ChevronRight, Phone, RotateCcw, ShieldAlert } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Image as RNImage, Linking, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  interpolate,
  SensorType,
  useAnimatedSensor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import QRCode from 'react-native-qrcode-svg';
import { scheduleOnRN } from 'react-native-worklets';

import { Txt } from '@/components/ui/Txt';
import { elevation, fonts, gradients, motion, navy, radii, red, springs, type } from '@/design/tokens';
import { useTokens } from '@/design/useTokens';
import { useEmergencyCard } from '@/hooks/useEmergencyCard';
import { impactFeedback } from '@/lib/feedback';

/** ID-1 card proportion, the same as a bank card or driving licence. */
const CARD_RATIO = 1.586;
const MAX_WIDTH = 440;

/**
 * The health passport as a physical object. Navy card with a slow light sheen that follows the
 * phone's tilt (and the finger, where there is no gyro). Tap to flip to the ICE emergency side
 * with the QR code. Reduce motion swaps the flip for an instant change and freezes the sheen.
 */
export function PassportCard({ recordCount }: { recordCount: number }) {
  const { width } = useWindowDimensions();
  const cardW = Math.min(width - 40, MAX_WIDTH);
  const cardH = Math.max(cardW / CARD_RATIO, 210);
  const narrow = cardW < 330;
  const reduced = useReducedMotion();
  const ice = useEmergencyCard();
  const t = useTokens();
  const [flipped, setFlipped] = useState(false);

  // 0 = front, 1 = back.
  const flip = useSharedValue(0);
  // Finger tilt, -1 to 1 on each axis.
  const touchX = useSharedValue(0);
  const touchY = useSharedValue(0);
  const sheen = useSharedValue(0);
  const rotation = useAnimatedSensor(SensorType.ROTATION, { interval: 32 });

  useEffect(() => {
    if (reduced) return;
    sheen.value = withRepeat(withTiming(1, { duration: motion.sheenLoopMs, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [reduced, sheen]);

  const toggle = () => {
    impactFeedback();
    const next = !flipped;
    setFlipped(next);
    flip.value = reduced ? (next ? 1 : 0) : withSpring(next ? 1 : 0, springs.flip);
  };

  const pan = Gesture.Pan()
    .minDistance(4)
    .onUpdate((e) => {
      touchX.value = Math.max(-1, Math.min(1, e.translationX / (cardW / 2)));
      touchY.value = Math.max(-1, Math.min(1, e.translationY / (cardH / 2)));
    })
    .onFinalize(() => {
      touchX.value = withSpring(0, springs.bouncy);
      touchY.value = withSpring(0, springs.bouncy);
    });
  const tap = Gesture.Tap()
    .maxDuration(400)
    .onEnd((_e, ok) => {
      if (ok) scheduleOnRN(toggle);
    });
  const gesture = Gesture.Exclusive(pan, tap);

  // Combined tilt from the gyro (gentle) and the finger (stronger), clamped to a few degrees.
  const tiltStyle = useAnimatedStyle(() => {
    const s = rotation.sensor.value;
    const gx = reduced ? 0 : Math.max(-1, Math.min(1, (s?.roll ?? 0) / 0.6));
    const gy = reduced ? 0 : Math.max(-1, Math.min(1, ((s?.pitch ?? 0) - 0.6) / 0.6));
    const tx = reduced ? 0 : touchX.value + gx * 0.5;
    const ty = reduced ? 0 : touchY.value + gy * 0.3;
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${tx * 6}deg` }, { rotateX: `${-ty * 6}deg` }],
    };
  });

  const frontStyle = useAnimatedStyle(() => {
    const deg = interpolate(flip.value, [0, 1], [0, 180]);
    return {
      opacity: flip.value < 0.5 ? 1 : 0,
      transform: [{ perspective: 1200 }, { rotateY: `${deg}deg` }],
    };
  });
  const backStyle = useAnimatedStyle(() => {
    const deg = interpolate(flip.value, [0, 1], [180, 360]);
    return {
      opacity: flip.value >= 0.5 ? 1 : 0,
      transform: [{ perspective: 1200 }, { rotateY: `${deg}deg` }],
    };
  });

  // The light band drifts across the card and leans with the tilt.
  const sheenStyle = useAnimatedStyle(() => {
    const s = rotation.sensor.value;
    const lean = reduced ? 0 : (s?.roll ?? 0) * 0.4 + touchX.value * 0.35;
    const x = interpolate(sheen.value + lean, [-0.5, 1.5], [-cardW * 1.1, cardW * 1.1]);
    return { transform: [{ translateX: reduced ? cardW * 0.15 : x }, { rotate: '18deg' }] };
  });

  const p = ice.patient;
  const idTail = p.idNumber ? p.idNumber.slice(-4) : '';

  return (
    <View style={{ alignItems: 'center' }}>
      <GestureDetector gesture={gesture}>
        <Animated.View
          accessible
          accessibilityRole="button"
          accessibilityLabel={
            flipped
              ? `Emergency card. Blood group ${ice.bloodGroup}. Allergies ${ice.values.allergies}. Double tap to show the passport side.`
              : `Health passport for ${p.firstName} ${p.lastName}. Blood group ${ice.bloodGroup}. Double tap to show the emergency card and QR code.`
          }
          accessibilityActions={[{ name: 'activate' }]}
          onAccessibilityAction={toggle}
          style={[{ width: cardW, height: cardH, borderRadius: radii.lg }, elevation[3], tiltStyle]}
        >
          {/* Front: identity */}
          <Animated.View style={[styles.face, { borderRadius: radii.lg }, frontStyle]} pointerEvents={flipped ? 'none' : 'auto'}>
            <LinearGradient colors={gradients.passport} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            <Guilloche w={cardW} h={cardH} />
            <Animated.View pointerEvents="none" style={[styles.sheen, { height: cardH * 2.2, top: -cardH * 0.6, width: cardW * 0.42 }, sheenStyle]}>
              <LinearGradient colors={gradients.sheen} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
            </Animated.View>

            <View style={styles.inner}>
              <View style={styles.row}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
                  <RNImage source={require('../../../assets/images/splash-icon.png')} style={{ width: 26, height: 26 }} resizeMode="contain" />
                  <View>
                    <Txt style={{ fontFamily: fonts.display, fontSize: 17, lineHeight: 18, color: '#FF4D53', letterSpacing: 0.5 }}>SIYASHESHA</Txt>
                    <Txt variant="label" tone="onNavyMuted" style={{ fontSize: 9, lineHeight: 11, letterSpacing: 2 }}>
                      Health Passport
                    </Txt>
                  </View>
                </View>
                <BloodChip known={ice.bloodGroupKnown} value={ice.bloodGroup} short={narrow} />
              </View>

              <View style={{ gap: 2 }}>
                <Txt variant="label" tone="onNavyMuted" style={{ fontSize: 10 }}>
                  Passport holder
                </Txt>
                <Txt variant="headline" tone="onNavy" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                  {p.firstName} {p.lastName}
                </Txt>
              </View>

              <View style={[styles.row, { alignItems: 'flex-end' }]}>
                <Embossed text={narrow ? `••••  •${idTail}` : `••••  ••••  •${idTail}`} />
                <View style={{ alignItems: 'flex-end' }}>
                  <Txt variant="footnote" tone="onNavy" style={{ fontFamily: fonts.bold }}>
                    {recordCount}
                  </Txt>
                  <Txt variant="label" tone="onNavyMuted" style={{ fontSize: 9, letterSpacing: 1.4 }}>
                    {recordCount === 1 ? 'Document' : 'Documents'}
                  </Txt>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Back: ICE emergency view */}
          <Animated.View style={[styles.face, { borderRadius: radii.lg, backgroundColor: '#FFFFFF' }, backStyle]} pointerEvents={flipped ? 'auto' : 'none'}>
            <View style={{ height: 6, backgroundColor: red[500] }} />
            <View style={[styles.inner, { flexDirection: 'row', gap: 14, paddingTop: 12 }]}>
              <View style={{ flex: 1, justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <ShieldAlert size={14} color={red[500]} />
                  <Txt variant="label" color={red[600]} style={{ fontSize: 10 }}>
                    In case of emergency
                  </Txt>
                </View>
                <IceLine label="Blood group" value={ice.bloodGroup} critical={!ice.bloodGroupKnown} />
                <IceLine label="Allergies" value={ice.allergyList.join(', ') || 'No allergies recorded'} critical={ice.allergyList.length > 0} lines={2} />
                <IceLine label="Contact" value={ice.hasContact ? `${ice.contact.name}
${ice.contact.phone}` : 'Unknown'} lines={2} />
              </View>
              <View style={{ alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <View style={{ padding: 6, borderRadius: 12, borderWidth: 1, borderColor: navy[100] }}>
                  <QRCode value={ice.qrValue} size={Math.min(cardH - 78, 128)} color={navy[700]} backgroundColor="#FFFFFF" ecl="M" />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <RotateCcw size={11} color={navy[300]} />
                  <Txt variant="footnote" color={navy[400]} style={{ fontSize: 11 }}>
                    Tap to flip
                  </Txt>
                </View>
              </View>
            </View>
          </Animated.View>
        </Animated.View>
      </GestureDetector>

      {/* One-tap paths that never depend on the flip */}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 14, width: cardW }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open emergency ICE card and QR code"
          onPress={() => router.push('/more/emergency')}
          style={({ pressed }) => [styles.action, { backgroundColor: red[500], opacity: pressed ? 0.88 : 1 }]}
        >
          <ShieldAlert size={18} color="#FFFFFF" />
          <Txt variant="callout" tone="onNavy" style={{ fontFamily: fonts.semibold, flexShrink: 1 }}>
            ICE card & QR
          </Txt>
        </Pressable>
        {ice.hasContact ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Call emergency contact ${ice.contact.name}`}
            onPress={() => Linking.openURL(`tel:${ice.contact.phone.replace(/\s/g, '')}`)}
            style={({ pressed }) => [styles.action, styles.actionGhost, { backgroundColor: t.surface, borderColor: t.border, opacity: pressed ? 0.7 : 1 }]}
          >
            <Phone size={17} color={t.interactive} />
            <Txt variant="callout" style={{ fontFamily: fonts.semibold, flexShrink: 1 }} numberOfLines={1}>
              Call {ice.contact.name.split(' ')[0]}
            </Txt>
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add an emergency contact"
            onPress={() => router.push('/more/profile')}
            style={({ pressed }) => [styles.action, styles.actionGhost, { backgroundColor: t.surface, borderColor: t.border, opacity: pressed ? 0.7 : 1 }]}
          >
            <Txt variant="callout" style={{ fontFamily: fonts.semibold }}>
              Add contact
            </Txt>
            <ChevronRight size={16} color={t.interactive} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

/**
 * Blood group on the card front. Unknown is an outlined chip, never a filled value. Not pressable
 * itself (the whole card flips); the readiness card below carries the "Add" path.
 */
function BloodChip({ known, value, short }: { known: boolean; value: string; short?: boolean }) {
  return (
    <View
      style={{
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: radii.pill,
        backgroundColor: known ? 'rgba(255,255,255,0.14)' : 'transparent',
        borderWidth: 1,
        borderColor: known ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.55)',
        borderStyle: known ? 'solid' : 'dashed',
      }}
    >
      <Txt variant="footnote" tone="onNavyMuted" style={{ fontSize: 12 }}>
        {short ? 'Blood' : 'Blood group'} ·{' '}
        <Txt variant="footnote" tone="onNavy" style={{ fontFamily: fonts.bold, fontSize: 12 }}>
          {value}
        </Txt>
      </Txt>
    </View>
  );
}

function IceLine({ label, value, critical, lines = 1 }: { label: string; value: string; critical?: boolean; lines?: number }) {
  return (
    <View>
      <Txt variant="label" color={navy[300]} style={{ fontSize: 9, letterSpacing: 1.2 }}>
        {label}
      </Txt>
      <Txt variant="callout" numberOfLines={lines} color={critical ? red[600] : navy[700]} style={{ fontFamily: fonts.bold, fontSize: 14, lineHeight: 18 }}>
        {value}
      </Txt>
    </View>
  );
}

/** Raised-print look: a dark shadow below and a faint highlight above the glyphs. */
function Embossed({ text }: { text: string }) {
  return (
    <View accessibilityLabel={`ID number ending ${text.slice(-4)}`}>
      <Txt
        style={[
          type.mono,
          {
            color: 'rgba(255,255,255,0.86)',
            textShadowColor: 'rgba(0,0,0,0.45)',
            textShadowOffset: { width: 0, height: 1.5 },
            textShadowRadius: 0.5,
          },
        ]}
      >
        {text}
      </Txt>
    </View>
  );
}

/** Fine security-print lines in the card background. */
function Guilloche({ w, h }: { w: number; h: number }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {[0, 1, 2, 3].map((i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            right: -w * 0.25 - i * 18,
            top: -h * 0.35 - i * 18,
            width: w * 0.8 + i * 36,
            height: w * 0.8 + i * 36,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: `rgba(255,255,255,${0.07 - i * 0.012})`,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  face: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
  },
  inner: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sheen: {
    position: 'absolute',
    left: 0,
  },
  action: {
    flex: 1,
    minHeight: 48,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  actionGhost: {
    borderWidth: 1,
  },
});
