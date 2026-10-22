import dayjs from 'dayjs';
import { router } from 'expo-router';
import { AlertCircle, CheckCircle2, ChevronRight, Download, Phone, ShieldAlert } from 'lucide-react-native';
import { Linking, Switch, useWindowDimensions, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ScreenScroll } from '@/components/ui/ScreenScroll';
import { useToast } from '@/components/ui/Toast';
import { Txt } from '@/components/ui/Txt';
import { elevation, fonts, navy, radii, red } from '@/design/tokens';
import { useTokens } from '@/design/useTokens';
import { emergencyFieldDefs } from '@/data/emergencyProfile';
import { useEmergencyCard } from '@/hooks/useEmergencyCard';
import { impactFeedback } from '@/lib/feedback';
import { baseDocumentStyles, printAndShareHtml } from '@/lib/pdf';
import { useAppStore } from '@/store/useAppStore';

/**
 * The ICE card. Built to be read at arm's length by a stranger in a hurry: the critical facts in
 * large type at the top, a big QR code, and calling the emergency contact as the first action.
 * Nothing on this screen animates in, so it is usable the instant it opens.
 */
export default function EmergencyProfileScreen() {
  const t = useTokens();
  const toast = useToast();
  const { width } = useWindowDimensions();
  const visibility = useAppStore((s) => s.emergencyVisibility);
  const setVisible = useAppStore((s) => s.setEmergencyVisible);
  const logAudit = useAppStore((s) => s.logAudit);
  const ice = useEmergencyCard();
  const { patient, values, readiness } = ice;
  const qrSize = Math.min(width - 120, 220);

  const call = () => {
    impactFeedback('medium');
    Linking.openURL(`tel:${ice.contact.phone.replace(/\s/g, '')}`);
  };

  const handleExport = async () => {
    try {
      const rows = ice.visibleFields.map((f) => `<div class="row"><span>${f.label}</span><strong>${values[f.key]}</strong></div>`).join('');
      const contact = ice.hasContact ? `${ice.contact.name} (${ice.contact.relationship}) · ${ice.contact.phone}` : 'Unknown';
      const html = `
        <html><head>${baseDocumentStyles()}</head><body>
          <span class="badge">EMERGENCY ICE CARD</span>
          <h1>${values.fullName}</h1>
          <div class="muted">Siyashesha Health Passport</div>
          ${rows}
          <div class="row"><span>Emergency Contact</span><strong>${contact}</strong></div>
          <div class="notice">For first responders: this card reflects only the fields the patient has chosen to share. It does not replace a full clinical assessment.</div>
        </body></html>
      `;
      await printAndShareHtml(html, 'Emergency ICE Card');
      logAudit('export', 'Exported Emergency ICE card as PDF');
      toast.show('Emergency card ready to share', 'success');
    } catch {
      toast.show('Could not export the card. Please try again.', 'warning');
    }
  };

  const show = (key: keyof typeof visibility) => visibility[key];

  return (
    <Screen headerOwnsTopInset scroll={false}>
      <ScreenHeader title="Emergency card" subtitle="In case of emergency (ICE)" onBack={() => router.back()} />
      <ScreenScroll className="flex-1 px-5" contentContainerStyle={{ gap: 16, paddingTop: 4 }}>
        {/* Status */}
        <PressableScale
          accessibilityLabel={readiness.ready ? 'Emergency card ready' : `Needs attention. Missing ${readiness.gaps.map((g) => g.label).join(', ')}. Add details`}
          disabled={readiness.ready}
          onPress={() => router.push('/more/profile')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            padding: 14,
            borderRadius: radii.md,
            backgroundColor: readiness.ready ? t.successSoft : t.accentSoft,
          }}
        >
          {readiness.ready ? <CheckCircle2 size={20} color={t.successText} /> : <AlertCircle size={20} color={t.accentText} />}
          <View style={{ flex: 1 }}>
            <Txt variant="bodyStrong" color={readiness.ready ? t.successText : t.accentText}>
              {readiness.ready ? 'Ready for first responders' : 'Needs attention'}
            </Txt>
            {!readiness.ready ? (
              <Txt variant="footnote" color={t.accentText}>
                Missing: {readiness.gaps.map((g) => g.label).join(', ')}
              </Txt>
            ) : null}
          </View>
          {!readiness.ready ? <ChevronRight size={18} color={t.accentText} /> : null}
        </PressableScale>

        {/* The card */}
        <View style={[{ backgroundColor: '#FFFFFF', borderRadius: radii.xl, overflow: 'hidden' }, elevation[3]]}>
          <View style={{ backgroundColor: red[500], paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ShieldAlert size={18} color="#FFFFFF" />
            <Txt variant="label" tone="onNavy" style={{ flex: 1 }}>
              Emergency medical information
            </Txt>
          </View>

          <View style={{ padding: 20, gap: 18 }}>
            {show('fullName') ? (
              <View>
                <Txt variant="title" color={navy[700]}>
                  {values.fullName}
                </Txt>
                {show('dateOfBirth') && patient.dateOfBirth ? (
                  <Txt variant="callout" color={navy[400]}>
                    Born {dayjs(patient.dateOfBirth).format('D MMMM YYYY')}
                  </Txt>
                ) : null}
              </View>
            ) : null}

            {/* Critical strip: the two facts that change treatment first */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {show('bloodGroup') ? (
                <View style={{ flex: 1, padding: 14, borderRadius: radii.md, backgroundColor: navy[50], borderWidth: ice.bloodGroupKnown ? 0 : 1.5, borderStyle: 'dashed', borderColor: navy[300] }}>
                  <Txt variant="label" color={navy[400]}>
                    Blood group
                  </Txt>
                  <Txt
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={{ fontFamily: fonts.bold, fontSize: ice.bloodGroupKnown ? 30 : 20, lineHeight: ice.bloodGroupKnown ? 36 : 28, color: navy[700] }}
                  >
                    {ice.bloodGroup}
                  </Txt>
                </View>
              ) : null}
              {show('allergies') ? (
                <View style={{ flex: 1.4, padding: 14, borderRadius: radii.md, backgroundColor: ice.allergyList.length ? red[50] : navy[50] }}>
                  <Txt variant="label" color={ice.allergyList.length ? red[600] : navy[400]}>
                    Allergies
                  </Txt>
                  <Txt style={{ fontFamily: fonts.bold, fontSize: 18, lineHeight: 23, color: ice.allergyList.length ? red[600] : navy[700] }}>
                    {ice.allergyList.length ? ice.allergyList.join(', ') : 'No allergies recorded'}
                  </Txt>
                </View>
              ) : null}
            </View>

            {(['chronicConditions', 'currentMedications', 'previousProcedures', 'medicalDevices'] as const)
              .filter(show)
              .map((key) => (
                <View key={key} style={{ gap: 2 }}>
                  <Txt variant="label" color={navy[400]}>
                    {emergencyFieldDefs.find((f) => f.key === key)?.label}
                  </Txt>
                  {/* Medication names, doses and units are shown exactly as recorded. */}
                  <Txt variant="body" color={navy[700]}>
                    {values[key]}
                  </Txt>
                </View>
              ))}

            <View style={{ height: 1, backgroundColor: navy[100] }} />

            <View style={{ alignItems: 'center', gap: 8 }}>
              <View style={{ padding: 10, borderRadius: radii.md, borderWidth: 1, borderColor: navy[100], backgroundColor: '#FFFFFF' }}>
                <QRCode value={ice.qrValue} size={qrSize} color={navy[700]} backgroundColor="#FFFFFF" ecl="M" />
              </View>
              <Txt variant="footnote" color={navy[400]} style={{ textAlign: 'center' }}>
                Scan for the fields shown on this card
              </Txt>
            </View>

            <View style={{ gap: 2 }}>
              <Txt variant="label" color={navy[400]}>
                Emergency contact
              </Txt>
              <Txt variant="bodyStrong" color={navy[700]}>
                {ice.hasContact ? `${ice.contact.name}${ice.contact.relationship && ice.contact.relationship !== 'Not recorded' ? ` (${ice.contact.relationship})` : ''}` : 'Unknown'}
              </Txt>
              {ice.hasContact ? (
                <Txt variant="body" color={navy[700]} style={{ fontVariant: ['tabular-nums'] }}>
                  {ice.contact.phone}
                </Txt>
              ) : null}
            </View>
          </View>
        </View>

        {/* Actions */}
        {ice.hasContact ? (
          <PressableScale
            accessibilityLabel={`Call emergency contact ${ice.contact.name}`}
            onPress={call}
            style={{ minHeight: 56, borderRadius: radii.pill, backgroundColor: red[500], flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 20 }}
          >
            <Phone size={20} color="#FFFFFF" />
            <Txt variant="bodyStrong" tone="onNavy">
              Call {ice.contact.name}
            </Txt>
          </PressableScale>
        ) : null}
        <PressableScale
          accessibilityLabel="Export the emergency card as a PDF"
          haptic="selection"
          onPress={handleExport}
          style={{ minHeight: 52, borderRadius: radii.pill, borderWidth: 1, borderColor: t.border, backgroundColor: t.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          <Download size={18} color={t.interactive} />
          <Txt variant="callout" color={t.interactive} style={{ fontFamily: fonts.semibold }}>
            Export card (PDF)
          </Txt>
        </PressableScale>

        {/* Visibility */}
        <View style={{ marginTop: 12, gap: 10 }}>
          <Txt variant="label" tone="muted" style={{ paddingHorizontal: 2 }}>
            What first responders can see
          </Txt>
          <View style={[{ backgroundColor: t.surface, borderRadius: radii.lg }, elevation[1]]}>
            {emergencyFieldDefs.map((field, i) => (
              <View
                key={field.key}
                style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, borderTopWidth: i ? 1 : 0, borderTopColor: t.border }}
              >
                <Txt variant="callout" style={{ flex: 1 }}>
                  {field.label}
                </Txt>
                <Switch
                  value={visibility[field.key]}
                  onValueChange={(v) => setVisible(field.key, v)}
                  trackColor={{ true: navy[500], false: t.border }}
                  thumbColor="#FFFFFF"
                  accessibilityLabel={`Show ${field.label} on emergency card`}
                />
              </View>
            ))}
          </View>
        </View>
      </ScreenScroll>
    </Screen>
  );
}
