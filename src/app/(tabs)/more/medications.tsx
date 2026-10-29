import dayjs from 'dayjs';
import { safeBack } from '@/lib/navigation';
import {
  Archive,
  BookOpen,
  Clock,
  Edit2,
  Flame,
  Pill as PillIcon,
  Plus,
  RefreshCw,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Switch, View } from 'react-native';

import { MedicationModal } from '@/components/medications/MedicationModal';
import { ClinicalCitationsModal } from '@/components/security/ClinicalCitationsModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pill } from '@/components/ui/Pill';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ScreenScroll } from '@/components/ui/ScreenScroll';
import { useToast } from '@/components/ui/Toast';
import { Txt } from '@/components/ui/Txt';
import { type Medication } from '@/data/medications';
import { elevation, fonts, radii } from '@/design/tokens';
import { useTokens } from '@/design/useTokens';
import { computeAdherence } from '@/lib/adherence';
import { tapFeedback } from '@/lib/feedback';
import { syncReminders } from '@/lib/reminders';
import { useAppStore } from '@/store/useAppStore';

export default function MedicationsScreen() {
  const t = useTokens();
  const toast = useToast();

  const medications = useAppStore((s) => s.medications);
  const addMedication = useAppStore((s) => s.addMedication);
  const updateMedication = useAppStore((s) => s.updateMedication);
  const deleteMedication = useAppStore((s) => s.deleteMedication);
  const toggleMedicationStatus = useAppStore((s) => s.toggleMedicationStatus);

  const takenLog = useAppStore((s) => s.takenLog);
  const reminderEnabled = useAppStore((s) => s.medicationReminderEnabled);
  const setReminderEnabled = useAppStore((s) => s.setMedicationReminderEnabled);
  const userMedications = useAppStore((s) => s.userMedications);

  const [tab, setTab] = useState<'active' | 'past'>('active');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<Medication | undefined>();
  const [citationsOpen, setCitationsOpen] = useState(false);

  const activeList = useMemo(() => medications.filter((m) => m.status === 'active'), [medications]);
  const pastList = useMemo(() => medications.filter((m) => m.status === 'past'), [medications]);

  const adherence = useMemo(() => computeAdherence(takenLog, 7, medications), [takenLog, medications]);
  const remindersOn = activeList.filter((m) => reminderEnabled[m.id] ?? true).length;

  const openNewMedModal = () => {
    setSelectedMedication(undefined);
    setModalVisible(true);
  };

  const openEditMedModal = (med: Medication) => {
    setSelectedMedication(med);
    setModalVisible(true);
  };

  const handleSaveMedication = (data: Omit<Medication, 'id'>) => {
    if (selectedMedication) {
      updateMedication(selectedMedication.id, data);
      toast.show('Prescription updated', 'success');
    } else {
      addMedication(data);
      toast.show('Medication added to your regimen', 'success');
    }
    syncReminders().catch(() => {});
  };

  const handleDeleteMedication = (id: string) => {
    deleteMedication(id);
    syncReminders().catch(() => {});
    toast.show('Medication removed', 'info');
  };

  const handleToggleStatus = (id: string) => {
    toggleMedicationStatus(id);
    syncReminders().catch(() => {});
    const target = medications.find((m) => m.id === id);
    const willBePast = target?.status === 'active';
    toast.show(
      willBePast ? 'Medication moved to past treatments' : 'Medication restored to active regimen',
      'info'
    );
  };

  return (
    <Screen headerOwnsTopInset scroll={false}>
      <ScreenHeader
        title="Medications"
        onBack={() => safeBack('/(tabs)/more')}
        right={
          <PressableScale
            accessibilityLabel="Add medication"
            onPress={openNewMedModal}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              backgroundColor: '#16A34A',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: radii.pill,
            }}
          >
            <Plus size={15} color="#FFFFFF" />
            <Txt variant="footnote" style={{ fontFamily: fonts.semibold, color: '#FFFFFF' }}>
              Add
            </Txt>
          </PressableScale>
        }
      />

      <ScreenScroll className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Adherence Hero Card */}
        <View style={[{ marginBottom: 20, borderRadius: radii.xl, backgroundColor: t.surface, padding: 20, borderWidth: 1, borderColor: t.border }, elevation[2]]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Txt variant="footnote" tone="muted">
              Adherence · last 7 days
            </Txt>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                borderRadius: radii.pill,
                backgroundColor: 'rgba(234, 88, 12, 0.12)',
                paddingHorizontal: 10,
                paddingVertical: 3,
              }}
            >
              <Flame size={13} color="#EA580C" />
              <Txt variant="footnote" style={{ fontFamily: fonts.semibold, color: '#EA580C', fontSize: 11 }}>
                {adherence.streak}-day streak
              </Txt>
            </View>
          </View>

          <View style={{ alignItems: 'center', paddingVertical: 18 }}>
            <Txt variant="display" style={{ fontSize: 44, lineHeight: 48, fontFamily: fonts.bold }}>
              {adherence.percent}%
            </Txt>
            <Txt variant="footnote" tone="muted" style={{ marginTop: 4 }}>
              of scheduled doses taken
            </Txt>
          </View>

          <View
            style={{
              flexDirection: 'row',
              borderRadius: radii.lg,
              backgroundColor: t.surfaceMuted,
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}
          >
            <View style={{ flex: 1 }}>
              <Txt variant="footnote" tone="muted" style={{ fontSize: 11 }}>
                Active
              </Txt>
              <Txt variant="bodyStrong" style={{ marginTop: 2 }}>
                {activeList.length}
              </Txt>
            </View>
            <View style={{ flex: 1 }}>
              <Txt variant="footnote" tone="muted" style={{ fontSize: 11 }}>
                Past
              </Txt>
              <Txt variant="bodyStrong" style={{ marginTop: 2 }}>
                {pastList.length}
              </Txt>
            </View>
            <View style={{ flex: 1 }}>
              <Txt variant="footnote" tone="muted" style={{ fontSize: 11 }}>
                Reminders on
              </Txt>
              <Txt variant="bodyStrong" color="#16A34A" style={{ marginTop: 2 }}>
                {remindersOn}
              </Txt>
            </View>
          </View>
        </View>

        {/* Tab Switcher & Quick Add Button */}
        <View style={{ marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pill
              label={`Active (${activeList.length})`}
              selected={tab === 'active'}
              onPress={() => setTab('active')}
            />
            <Pill
              label={`Past (${pastList.length})`}
              selected={tab === 'past'}
              onPress={() => setTab('past')}
            />
          </View>

          <PressableScale
            onPress={openNewMedModal}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: radii.md,
              backgroundColor: 'rgba(22, 163, 74, 0.1)',
            }}
          >
            <Plus size={14} color="#16A34A" />
            <Txt variant="footnote" style={{ fontFamily: fonts.semibold, color: '#16A34A' }}>
              Add Prescription
            </Txt>
          </PressableScale>
        </View>

        {/* Active Regimen Tab */}
        {tab === 'active' ? (
          <View style={{ gap: 12 }}>
            {/* User-added quick meds from onboarding if any */}
            {userMedications.map((med) => (
              <View
                key={med.id}
                style={[
                  {
                    borderRadius: radii.lg,
                    borderWidth: 1,
                    borderColor: t.border,
                    backgroundColor: t.surface,
                    padding: 16,
                  },
                  elevation[1],
                ]}
              >
                <Txt variant="bodyStrong">
                  {med.name} {med.dose}
                </Txt>
                <Txt variant="footnote" tone="muted" style={{ marginTop: 2 }}>
                  {med.time} · Added during setup
                </Txt>
              </View>
            ))}

            {activeList.length === 0 && userMedications.length === 0 ? (
              <EmptyState
                icon={<PillIcon size={44} color={t.textMuted} />}
                title="No active medications"
                subtitle="Keep all your prescriptions, chronic treatments, and dosages organized in one place."
                action={
                  <PressableScale
                    onPress={openNewMedModal}
                    style={{
                      marginTop: 8,
                      backgroundColor: '#16A34A',
                      paddingHorizontal: 20,
                      paddingVertical: 10,
                      borderRadius: radii.pill,
                    }}
                  >
                    <Txt variant="callout" style={{ fontFamily: fonts.semibold, color: '#FFFFFF' }}>
                      Add Medication
                    </Txt>
                  </PressableScale>
                }
              />
            ) : (
              activeList.map((med) => {
                const isReminderOn = reminderEnabled[med.id] ?? true;
                return (
                  <View
                    key={med.id}
                    style={[
                      {
                        borderRadius: radii.xl,
                        borderWidth: 1,
                        borderColor: t.border,
                        backgroundColor: t.surface,
                        padding: 16,
                        gap: 12,
                      },
                      elevation[1],
                    ]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                      <View style={{ flexDirection: 'row', gap: 12, flex: 1 }}>
                        <View
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: radii.md,
                            backgroundColor: 'rgba(22, 163, 74, 0.12)',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <PillIcon size={20} color="#16A34A" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Txt variant="headline" numberOfLines={1}>
                            {med.name}
                          </Txt>
                          <Txt variant="bodyStrong" color="#16A34A" style={{ marginTop: 1 }}>
                            {med.strength}
                          </Txt>
                          <Txt variant="footnote" tone="muted" style={{ marginTop: 3 }}>
                            {med.indication} · {med.route}, {med.frequency}
                          </Txt>
                        </View>
                      </View>

                      <Switch
                        thumbColor="#FFFFFF"
                        value={isReminderOn}
                        onValueChange={(v) => {
                          tapFeedback();
                          setReminderEnabled(med.id, v);
                          syncReminders().catch(() => {});
                          toast.show(
                            v ? `Reminders on for ${med.name}` : `Reminders off for ${med.name}`,
                            'info'
                          );
                        }}
                        trackColor={{ true: '#16A34A', false: t.border }}
                        accessibilityLabel={`Reminders for ${med.name}`}
                      />
                    </View>

                    {/* Directions & Times */}
                    <View
                      style={{
                        borderRadius: radii.md,
                        backgroundColor: t.surfaceMuted,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        gap: 4,
                      }}
                    >
                      <Txt variant="footnote" style={{ fontFamily: fonts.medium }}>
                        {med.directions}
                      </Txt>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Clock size={12} color={t.textMuted} />
                        <Txt variant="footnote" tone="muted" style={{ fontSize: 11 }}>
                          {med.times.map((time) => dayjs(`2000-01-01T${time}`).format('h:mm A')).join(' · ')}
                        </Txt>
                      </View>
                    </View>

                    {/* Footer / Prescriber & Actions */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: 4,
                        borderTopWidth: 1,
                        borderTopColor: t.border,
                      }}
                    >
                      <Txt variant="footnote" tone="muted" numberOfLines={1} style={{ fontSize: 11, flex: 1, paddingRight: 8 }}>
                        {med.prescriber} · {med.facility}
                      </Txt>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <PressableScale
                          accessibilityLabel={`Move ${med.name} to past`}
                          onPress={() => handleToggleStatus(med.id)}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                            paddingHorizontal: 8,
                            paddingVertical: 5,
                            borderRadius: radii.sm,
                            backgroundColor: t.surfaceMuted,
                          }}
                        >
                          <Archive size={12} color={t.textMuted} />
                          <Txt variant="footnote" tone="muted" style={{ fontSize: 11 }}>
                            Discontinue
                          </Txt>
                        </PressableScale>

                        <PressableScale
                          accessibilityLabel={`Edit ${med.name}`}
                          onPress={() => openEditMedModal(med)}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                            borderRadius: radii.sm,
                            backgroundColor: 'rgba(14, 116, 144, 0.08)',
                          }}
                        >
                          <Edit2 size={12} color={t.accent} />
                          <Txt variant="footnote" color={t.accent} style={{ fontFamily: fonts.medium, fontSize: 11 }}>
                            Edit
                          </Txt>
                        </PressableScale>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        ) : (
          /* Past / Discontinued Tab */
          <View style={{ gap: 12 }}>
            {pastList.length === 0 ? (
              <EmptyState
                icon={<Archive size={44} color={t.textMuted} />}
                title="No past medications"
                subtitle="When you complete a treatment course or discontinue a medicine, it will appear here for historical reference."
              />
            ) : (
              pastList.map((med) => (
                <View
                  key={med.id}
                  style={[
                    {
                      borderRadius: radii.xl,
                      borderWidth: 1,
                      borderColor: t.border,
                      backgroundColor: t.surface,
                      padding: 16,
                      opacity: 0.88,
                      gap: 10,
                    },
                    elevation[1],
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Txt variant="headline">
                        {med.name} <Txt variant="body" tone="muted">({med.strength})</Txt>
                      </Txt>
                      <Txt variant="footnote" tone="muted" style={{ marginTop: 2 }}>
                        {med.indication} · {dayjs(med.startDate).format('MMM YYYY')} –{' '}
                        {med.endDate ? dayjs(med.endDate).format('MMM YYYY') : 'Discontinued'}
                      </Txt>
                    </View>

                    <PressableScale
                      accessibilityLabel={`Reactivate ${med.name}`}
                      onPress={() => handleToggleStatus(med.id)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: radii.pill,
                        backgroundColor: 'rgba(22, 163, 74, 0.1)',
                      }}
                    >
                      <RefreshCw size={12} color="#16A34A" />
                      <Txt variant="footnote" style={{ fontFamily: fonts.semibold, color: '#16A34A', fontSize: 11 }}>
                        Reactivate
                      </Txt>
                    </PressableScale>
                  </View>

                  {med.note && (
                    <View
                      style={{
                        borderRadius: radii.md,
                        backgroundColor: t.surfaceMuted,
                        padding: 10,
                      }}
                    >
                      <Txt variant="footnote" tone="muted" style={{ fontStyle: 'italic', fontSize: 12 }}>
                        {med.note}
                      </Txt>
                    </View>
                  )}

                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: 6,
                      borderTopWidth: 1,
                      borderTopColor: t.border,
                    }}
                  >
                    <Txt variant="footnote" tone="muted" style={{ fontSize: 11 }}>
                      {med.prescriber} · {med.facility}
                    </Txt>

                    <PressableScale
                      accessibilityLabel={`Edit ${med.name}`}
                      onPress={() => openEditMedModal(med)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                      }}
                    >
                      <Edit2 size={12} color={t.accent} />
                      <Txt variant="footnote" color={t.accent} style={{ fontFamily: fonts.medium, fontSize: 11 }}>
                        Edit Details
                      </Txt>
                    </PressableScale>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Apple Guideline 1.4.1 Medical Disclaimer & Clinical Citations Footer */}
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="View Clinical Disclaimer and Medical Citations"
          onPress={() => setCitationsOpen(true)}
          style={{
            marginTop: 20,
            padding: 14,
            borderRadius: radii.lg,
            backgroundColor: t.surface,
            borderWidth: 1,
            borderColor: t.border,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <BookOpen size={16} color={t.accent} />
          <View style={{ flex: 1 }}>
            <Txt variant="footnote" style={{ fontFamily: fonts.semibold }}>
              Medical Disclaimer & Clinical References (SA NDoH STG/EML, SAHPRA & WHO)
            </Txt>
            <Txt variant="footnote" tone="muted" style={{ fontSize: 11, marginTop: 2 }}>
              Always consult your prescribing doctor or clinic sister before changing any dose or medication schedule. Tap to view clinical sources.
            </Txt>
          </View>
        </PressableScale>
      </ScreenScroll>

      {/* Medication Creation & Editing Modal */}
      <MedicationModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveMedication}
        onDelete={handleDeleteMedication}
        onToggleStatus={handleToggleStatus}
        existingMedication={selectedMedication}
      />
      <ClinicalCitationsModal visible={citationsOpen} onClose={() => setCitationsOpen(false)} />
    </Screen>
  );
}
