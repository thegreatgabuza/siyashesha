import { router } from 'expo-router';
import { Download, Phone, ShieldAlert } from 'lucide-react-native';
import { useMemo } from 'react';
import { Linking, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { GradientBackground } from '@/components/ui/GradientBackground';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useToast } from '@/components/ui/Toast';
import { emergencyFieldDefs } from '@/data/emergencyProfile';
import { activeMedications } from '@/data/medications';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { baseDocumentStyles, printAndShareHtml } from '@/lib/pdf';
import { useAppStore } from '@/store/useAppStore';

export default function EmergencyProfileScreen() {
  const toast = useToast();
  const visibility = useAppStore((s) => s.emergencyVisibility);
  const setVisible = useAppStore((s) => s.setEmergencyVisible);
  const logAudit = useAppStore((s) => s.logAudit);
  const patient = useAppStore((s) => s.patientProfile);

  const cardValues: Record<string, string> = useMemo(
    () => ({
      fullName: `${patient.firstName} ${patient.lastName}`,
      dateOfBirth: patient.dateOfBirth,
      bloodGroup: patient.bloodGroup,
      allergies: patient.allergies.map((a) => `${a.substance} — ${a.reaction}`).join('; '),
      chronicConditions: patient.chronicConditions.join('; '),
      currentMedications: activeMedications.map((m) => `${m.name} ${m.strength}`).join(', ') || 'None recorded',
      previousProcedures: patient.previousProcedures.join('; ') || 'None recorded',
      medicalDevices: patient.medicalDevices.join('; ') || 'None recorded',
    }),
    [patient]
  );

  const qrValue = useMemo(() => {
    const visibleFields = emergencyFieldDefs
      .filter((f) => visibility[f.key])
      .reduce((acc, f) => ({ ...acc, [f.label]: cardValues[f.key] }), {} as Record<string, string>);
    return JSON.stringify({
      app: 'Siyashesha Health Passport',
      emergencyContact: `${patient.emergencyContact.name} (${patient.emergencyContact.relationship}) ${patient.emergencyContact.phone}`,
      ...visibleFields,
    });
  }, [visibility, patient, cardValues]);

  const handleExport = async () => {
    try {
      const rows = emergencyFieldDefs
        .filter((f) => visibility[f.key])
        .map((f) => `<div class="row"><span>${f.label}</span><strong>${cardValues[f.key]}</strong></div>`)
        .join('');
      const html = `
        <html><head>${baseDocumentStyles()}</head><body>
          <span class="badge">EMERGENCY ICE CARD</span>
          <h1>${patient.firstName} ${patient.lastName}</h1>
          <div class="muted">Siyashesha Health Passport</div>
          ${rows}
          <div class="row"><span>Emergency Contact</span><strong>${patient.emergencyContact.name} (${patient.emergencyContact.relationship}) · ${patient.emergencyContact.phone}</strong></div>
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

  return (
    <Screen bottomInset={120}>
      <ScreenHeader title="Emergency Profile" onBack={() => router.back()} />
      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 48 }}>
        <View className="overflow-hidden rounded-[32px]">
          <GradientBackground variant="emergency">
            <View className="p-5">
              <View className="mb-3 flex-row items-center gap-2">
                <ShieldAlert size={18} color="#FFFFFF" />
                <Text className="font-sans-bold text-[13px] uppercase tracking-wide text-white">
                  Emergency ICE Card
                </Text>
              </View>
              <Text className="mb-4 font-sans-bold text-[22px] text-white">
                {patient.firstName} {patient.lastName}
              </Text>
              <View className="gap-2">
                {emergencyFieldDefs
                  .filter((f) => visibility[f.key])
                  .map((f) => (
                    <View key={f.key} className="flex-row justify-between gap-3">
                      <Text className="font-sans text-[12px] text-white/80">{f.label}</Text>
                      <Text className="flex-1 text-right font-sans-semibold text-[12px] text-white" numberOfLines={2}>
                        {cardValues[f.key]}
                      </Text>
                    </View>
                  ))}
                <View className="mt-1 flex-row justify-between gap-3 border-t border-white/25 pt-2">
                  <Text className="font-sans text-[12px] text-white/80">Emergency Contact</Text>
                  <Text className="flex-1 text-right font-sans-semibold text-[12px] text-white">
                    {patient.emergencyContact.name} ({patient.emergencyContact.relationship})
                    {'\n'}
                    {patient.emergencyContact.phone}
                  </Text>
                </View>
              </View>

              <View className="mt-5 items-center self-center rounded-2xl bg-white p-3">
                <QRCode value={qrValue} size={120} color="#0B2559" backgroundColor="#FFFFFF" />
              </View>
            </View>
          </GradientBackground>
        </View>

        <View className="mt-4 flex-row gap-2">
          <PrimaryButton label="Export card (PDF)" tone="emergency" icon={<Download size={16} color="#FFFFFF" />} onPress={handleExport} />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Call emergency contact ${patient.emergencyContact.name}`}
          onPress={() => Linking.openURL(`tel:${patient.emergencyContact.phone.replace(/\s/g, '')}`)}
          className="mt-3 min-h-[44px] flex-row items-center justify-center gap-2 rounded-full border border-emergency-500 py-3"
        >
          <Phone size={16} color="#DC1F26" />
          <Text className="font-sans-semibold text-[14px] text-emergency-500">
            Call {patient.emergencyContact.name}
          </Text>
        </Pressable>

        <View className="pt-7">
          <SectionHeader title="What first responders can see" />
        </View>
        <View className="rounded-3xl border border-slate-200 bg-white dark:border-canvasdark-card dark:bg-canvasdark-card">
          {emergencyFieldDefs.map((field, i) => (
            <View
              key={field.key}
              className={`flex-row items-center justify-between px-4 py-3.5 ${
                i > 0 ? 'border-t border-slate-100 dark:border-canvasdark' : ''
              }`}
            >
              <Text className="flex-1 font-sans-medium text-[14px] text-ink dark:text-slate-50">
                {field.label}
              </Text>
              <Switch
                value={visibility[field.key]}
                onValueChange={(v) => setVisible(field.key, v)}
                trackColor={{ true: '#DC1F26', false: '#E3E8F0' }}
                accessibilityLabel={`Show ${field.label} on emergency card`}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
