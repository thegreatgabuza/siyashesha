import { BookOpen, ExternalLink, ShieldAlert, Stethoscope, X } from 'lucide-react-native';
import { Linking, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { tapFeedback } from '@/lib/feedback';

export interface ClinicalReference {
  id: string;
  organization: string;
  title: string;
  summary: string;
  url: string;
}

export const CLINICAL_REFERENCES: ClinicalReference[] = [
  {
    id: 'sa-ndoh-stg',
    organization: 'South African National Department of Health (NDoH)',
    title: 'Standard Treatment Guidelines & Essential Medicines List (STGs & EML)',
    summary:
      'Official South African primary healthcare and hospital clinical guidelines for chronic conditions including Type 2 Diabetes Mellitus, Hypertension, and Dyslipidaemia.',
    url: 'https://www.health.gov.za/nhi-edp-stgs-eml/',
  },
  {
    id: 'sahpra',
    organization: 'South African Health Products Regulatory Authority (SAHPRA)',
    title: 'Registered Medicines & Patient Information Leaflets (PIL)',
    summary:
      'Authoritative regulatory repository for registered prescription medicines, dosage schedules, contraindications, and safety alerts in South Africa.',
    url: 'https://www.sahpra.org.za/',
  },
  {
    id: 'who-ncd',
    organization: 'World Health Organization (WHO)',
    title: 'Clinical Fact Sheets: Diabetes, Hypertension & Cardiovascular Health',
    summary:
      'Evidence-based global diagnostic thresholds (including HbA1c monitoring targets and blood pressure guidelines) and chronic care self-management standards.',
    url: 'https://www.who.int/news-room/fact-sheets/detail/diabetes',
  },
  {
    id: 'medlineplus',
    organization: 'U.S. National Library of Medicine (NIH / MedlinePlus)',
    title: 'Laboratory Test Reference & Drug Information Encyclopedia',
    summary:
      'Peer-reviewed patient education explaining HbA1c, lipid panels, kidney function tests, and oral antihyperglycemic and antihypertensive medications.',
    url: 'https://medlineplus.gov/lab-tests/',
  },
];

interface ClinicalCitationsModalProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Apple App Store Guideline 1.4.1 Compliance Modal:
 * Displays the mandatory medical disclaimer reminding users to consult a physician
 * before making any medical decisions, alongside clickable links to authoritative
 * clinical citations and government health guidelines.
 */
export function ClinicalCitationsModal({ visible, onClose }: ClinicalCitationsModalProps) {
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  const openCitation = (url: string) => {
    tapFeedback();
    Linking.openURL(url).catch(() => {});
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-slate-950/60">
        <View
          className="max-h-[90%] rounded-t-[32px] bg-white px-5 pt-5 dark:bg-canvasdark-card"
          style={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between border-b border-slate-200/80 pb-4 dark:border-slate-800">
            <View className="flex-row items-center gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-500/20">
                <Stethoscope size={20} color="#059669" />
              </View>
              <View>
                <Text className="font-sans-bold text-[17px] text-ink dark:text-slate-50">
                  Clinical Disclaimer & Sources
                </Text>
                <Text className="font-sans text-[12px] text-ink-muted dark:text-slate-400">
                  Medical References & Guideline 1.4.1 Notice
                </Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close clinical sources"
              onPress={onClose}
              className="h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
            >
              <X size={18} color="#5B6478" />
            </Pressable>
          </View>

          <ScrollView className="mt-4" showsVerticalScrollIndicator={false}>
            {/* Mandatory Guideline 1.4.1 Physician Consultation Reminder */}
            <View className="rounded-2xl border border-amber-500/30 bg-amber-50/80 p-4 dark:border-amber-500/25 dark:bg-amber-950/30">
              <View className="flex-row items-center gap-2">
                <ShieldAlert size={18} color="#D97706" />
                <Text className="font-sans-bold text-[13px] text-amber-900 dark:text-amber-200">
                  Important Medical Disclaimer
                </Text>
              </View>
              <Text className="mt-1.5 font-sans text-[12px] leading-[18px] text-amber-950/85 dark:text-amber-100/85">
                Siyashesha Health Passport is an informational record-keeping and educational tool, not a medical device. It does not provide medical diagnosis, clinical advice, or treatment recommendations. Always seek the advice of a doctor or qualified healthcare professional in addition to using this app and before making any medical decisions or changing your medication regimen.
              </Text>
            </View>

            {/* Verifiable Citations & Sources */}
            <View className="mt-4 gap-3 pb-4">
              <View className="flex-row items-center gap-2">
                <BookOpen size={15} color="#0B2559" />
                <Text className="font-sans-bold text-[12px] uppercase tracking-[0.8px] text-ink-muted dark:text-slate-400">
                  Clinical Guidelines & Verifiable Citations
                </Text>
              </View>

              {CLINICAL_REFERENCES.map((ref) => (
                <Pressable
                  key={ref.id}
                  accessibilityRole="link"
                  accessibilityLabel={`${ref.organization}: ${ref.title}`}
                  onPress={() => openCitation(ref.url)}
                  className="rounded-2xl border border-slate-200/90 bg-slate-50 p-4 dark:border-slate-800 dark:bg-canvasdark"
                >
                  <View className="flex-row items-start justify-between gap-2">
                    <Text className="flex-1 font-sans-bold text-[11px] uppercase tracking-[0.5px] text-brand-700 dark:text-brand-300">
                      {ref.organization}
                    </Text>
                    <ExternalLink size={14} color="#0284C7" />
                  </View>
                  <Text className="mt-1 font-sans-bold text-[14px] text-ink dark:text-slate-100">
                    {ref.title}
                  </Text>
                  <Text className="mt-1 font-sans text-[12px] leading-[17px] text-ink-muted dark:text-slate-400">
                    {ref.summary}
                  </Text>
                  <Text className="mt-2 font-sans-semibold text-[11px] underline text-sky-600 dark:text-sky-400">
                    {ref.url}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
