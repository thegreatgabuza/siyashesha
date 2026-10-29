import { router } from 'expo-router';
import { AlertCircle, CheckCircle2, ChevronRight, Phone, QrCode } from 'lucide-react-native';
import { Linking, View } from 'react-native';

import { Chip } from '@/components/ui/Chip';
import { PressableScale } from '@/components/ui/PressableScale';
import { Txt } from '@/components/ui/Txt';
import { elevation, fonts, radii } from '@/design/tokens';
import { useTokens } from '@/design/useTokens';
import { useEmergencyCard } from '@/hooks/useEmergencyCard';
import { impactFeedback } from '@/lib/feedback';

/**
 * The most important card on Home. A plain status first (Ready or Needs attention, with what is
 * missing by name), then the facts a first responder scans for, all emergency contacts with 1-tap
 * calling, and one tap to the ICE card.
 */
export function EmergencyReadinessCard() {
  const t = useTokens();
  const ice = useEmergencyCard();
  const { ready, gaps } = ice.readiness;
  const contacts = ice.contacts ?? [];

  const callNumber = (phone: string) => {
    if (!phone.trim()) return;
    impactFeedback('medium');
    Linking.openURL(`tel:${phone.replace(/\s/g, '')}`);
  };

  return (
    <View style={[{ backgroundColor: t.surface, borderRadius: radii.lg, overflow: 'hidden' }, elevation[2]]}>
      {/* Status band */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: 18,
          paddingVertical: 12,
          backgroundColor: ready ? t.successSoft : t.accentSoft,
        }}
      >
        {ready ? <CheckCircle2 size={18} color={t.successText} /> : <AlertCircle size={18} color={t.accentText} />}
        <View style={{ flex: 1 }}>
          <Txt variant="label" color={ready ? t.successText : t.accentText}>
            Emergency readiness
          </Txt>
          <Txt variant="bodyStrong" color={ready ? t.successText : t.accentText}>
            {ready ? 'Ready' : 'Needs attention'}
          </Txt>
        </View>
      </View>

      <View style={{ padding: 18, gap: 14 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Chip label="Blood group" value={ice.bloodGroup} tone={ice.bloodGroupKnown ? 'neutral' : 'missing'} />
          {ice.allergyList.length > 0 ? (
            ice.allergyList.map((a) => <Chip key={a} label="Allergy" value={a} tone="accent" />)
          ) : (
            <Chip value="No allergies recorded" tone="missing" />
          )}
          {contacts.length > 0 ? (
            contacts.map((c, idx) => (
              <Chip
                key={`${c.name}-${idx}`}
                label={contacts.length > 1 ? `ICE #${idx + 1}` : 'Contact'}
                value={c.name.split(' ')[0] || 'Contact'}
                tone="neutral"
              />
            ))
          ) : (
            <Chip label="Contact" value="Unknown" tone="missing" />
          )}
        </View>

        {/* Emergency Contacts List (shows 1, 2, or more emergency contacts directly on Home) */}
        {contacts.length > 0 ? (
          <View style={{ gap: 8 }}>
            <Txt variant="label" tone="muted" style={{ fontSize: 10 }}>
              {contacts.length === 1 ? 'Emergency Contact (ICE)' : `Emergency Contacts (${contacts.length})`}
            </Txt>
            {contacts.map((c, idx) => (
              <View
                key={`${c.name}-${c.phone}-${idx}`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: radii.md,
                  backgroundColor: t.surfaceMuted,
                  borderWidth: 1,
                  borderColor: t.border,
                }}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <Txt variant="callout" style={{ fontFamily: fonts.bold }}>
                      {c.name}
                    </Txt>
                    {c.relationship && c.relationship !== 'Not recorded' ? (
                      <View
                        style={{
                          paddingHorizontal: 7,
                          paddingVertical: 1.5,
                          borderRadius: radii.pill,
                          backgroundColor: t.surface,
                          borderWidth: 1,
                          borderColor: t.border,
                        }}
                      >
                        <Txt variant="footnote" tone="muted" style={{ fontSize: 10, fontFamily: fonts.semibold }}>
                          {c.relationship}
                        </Txt>
                      </View>
                    ) : null}
                  </View>
                  {c.phone ? (
                    <Txt variant="footnote" tone="muted" style={{ marginTop: 2, fontVariant: ['tabular-nums'] }}>
                      {c.phone}
                    </Txt>
                  ) : null}
                </View>

                {c.phone ? (
                  <PressableScale
                    accessibilityRole="button"
                    accessibilityLabel={`Call emergency contact ${c.name}`}
                    onPress={() => callNumber(c.phone)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: radii.pill,
                      backgroundColor: t.surface,
                      borderWidth: 1,
                      borderColor: t.border,
                    }}
                  >
                    <Phone size={14} color={t.interactive} />
                    <Txt variant="footnote" color={t.interactive} style={{ fontFamily: fonts.bold }}>
                      Call
                    </Txt>
                  </PressableScale>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        {!ready ? (
          <PressableScale
            accessibilityLabel={`Add missing details: ${gaps.map((g) => g.label).join(', ')}`}
            onPress={() => router.push('/more/profile')}
            haptic="selection"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 }}
          >
            <Txt variant="callout" tone="muted" style={{ flex: 1 }}>
              Missing:{' '}
              <Txt variant="callout" style={{ fontFamily: fonts.semibold }}>
                {gaps.map((g) => g.label).join(', ')}
              </Txt>
            </Txt>
            <Txt variant="callout" color={t.interactive} style={{ fontFamily: fonts.semibold }}>
              Add
            </Txt>
            <ChevronRight size={16} color={t.interactive} />
          </PressableScale>
        ) : null}

        <PressableScale
          accessibilityLabel="Show ICE card and QR code"
          onPress={() => router.push('/more/emergency')}
          haptic="impact"
          style={{
            minHeight: 52,
            borderRadius: radii.md,
            backgroundColor: t.surfaceMuted,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingHorizontal: 14,
          }}
        >
          <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center' }}>
            <QrCode size={18} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Txt variant="callout" style={{ fontFamily: fonts.semibold }}>
              ICE card & QR code
            </Txt>
            <Txt variant="footnote" tone="muted">
              Show this to a first responder
            </Txt>
          </View>
          <ChevronRight size={18} color={t.textMuted} />
        </PressableScale>
      </View>
    </View>
  );
}
