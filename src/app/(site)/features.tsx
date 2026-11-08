import { CalendarDays, FileText, Languages, QrCode, Share2, ShieldAlert, Sparkles, Pill } from 'lucide-react-native';
import { Text, useWindowDimensions, View } from 'react-native';

import { CtaButton, SitePage } from '@/components/web/site/SitePage';
import { LINE, MUTED, NAVY, RED, TEAL, goSignUp, sans } from '@/components/web/site/SiteChrome';

const features = [
  { icon: ShieldAlert, color: RED, title: 'Emergency ICE card', body: 'Blood group, allergies, chronic conditions and emergency contacts on a QR card. Paramedics can open it from your lock screen or a web link without logging in. You choose which fields are visible.' },
  { icon: FileText, color: NAVY, title: 'Record vault', body: 'Scan or upload lab results, prescriptions, imaging and discharge letters. Siyashesha reads them into dated, searchable entries, and keeps the original file attached.' },
  { icon: Share2, color: NAVY, title: 'Clinician sharing', body: 'Share selected records with a doctor through a PIN-protected link that expires after 24 hours to 30 days. Every share is logged, and you can revoke it at any time.' },
  { icon: Pill, color: NAVY, title: 'Medications and reminders', body: 'Track what you take and when. Get reminders, mark doses as taken or skipped, and see adherence over time.' },
  { icon: CalendarDays, color: NAVY, title: 'Calendar and diary', body: 'Keep appointments in one place and write down what your doctor said while it is fresh. Voice dictation is optional.' },
  { icon: Sparkles, color: TEAL, title: 'Health assistant (Pro)', body: 'Plain-language explanations of your documents and results. It only runs after you give consent, and it is an information tool, not medical advice.' },
  { icon: QrCode, color: NAVY, title: 'Works across devices', body: 'Your passport syncs between the iOS app, the Android app and the web, protected by your account.' },
  { icon: Languages, color: TEAL, title: 'Seven languages', body: 'English, isiZulu, Afrikaans, Setswana, Kiswahili, Français and Deutsch.' },
];

export default function FeaturesPage() {
  const { width } = useWindowDimensions();
  const cols = width >= 900 ? 2 : 1;
  return (
    <SitePage
      eyebrow="Features"
      title="Everything in one passport"
      intro="Keep your records organised, and your emergency information one scan away."
      description="Siyashesha Health Passport features: emergency ICE card, record vault, clinician sharing, medication reminders, calendar, diary and a consented health assistant."
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <View
              key={f.title}
              style={{ flexBasis: cols === 2 ? '48.8%' : '100%', flexGrow: 1, padding: 28, borderRadius: 20, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: LINE }}
            >
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: LINE, alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={20} color={f.color} />
              </View>
              <Text style={{ fontFamily: sans(600), fontSize: 19, color: NAVY, marginTop: 20 }}>{f.title}</Text>
              <Text style={{ fontFamily: sans(400), fontSize: 15, lineHeight: 23, color: MUTED, marginTop: 8 }}>{f.body}</Text>
            </View>
          );
        })}
      </View>
      <View style={{ marginTop: 48 }}>
        <CtaButton label="Create your passport" onPress={() => goSignUp()} />
      </View>
    </SitePage>
  );
}
