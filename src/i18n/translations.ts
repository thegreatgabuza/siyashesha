export type LanguageCode = 'en' | 'zu' | 'af' | 'tn' | 'sw' | 'fr' | 'de';

export const languageNames: Record<LanguageCode, string> = {
  en: 'English',
  zu: 'isiZulu',
  af: 'Afrikaans',
  tn: 'Setswana',
  sw: 'Kiswahili',
  fr: 'Français',
  de: 'Deutsch',
};

type Dict = Record<string, string>;

const en: Dict = {
  'tabs.home': 'Home',
  'tabs.records': 'Records',
  'tabs.assistant': 'Assistant',
  'tabs.calendar': 'Calendar',
  'tabs.diary': 'Diary',
  'tabs.more': 'More',

  'home.greeting': 'Good to see you, {name}',
  'home.hi': 'Hi {name},',
  'home.welcomeBack': 'Welcome back.',
  'home.subtitle': 'Here is your health summary for today.',
  'home.documentsStored': 'Documents stored',
  'home.vaultCaption': 'Documents in your vault',
  'home.activeMedications': 'Active medications',
  'home.nextAppointment': 'Next appointment',
  'home.emergencyReady': 'Emergency ready',
  'home.upload': 'Upload',
  'home.share': 'Share',
  'home.emergency': 'Emergency',
  'home.todaysReminders': "Today's reminders",
  'home.recentActivity': 'Recent activity',
  'home.healthDayToday': "Today's Health Awareness Day",
  'home.healthDayUpcoming': 'Upcoming Health Awareness Day',
  'home.seeAll': 'See all',
  'home.viewTimeline': 'View Timeline',
  'home.careTeam': 'Care team',
  'home.onSchedule': 'On schedule today',

  'common.emergency': 'Emergency',
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.done': 'Done',
};

const zu: Dict = {
  'tabs.home': 'Ikhaya',
  'tabs.records': 'Amarekhodi',
  'tabs.assistant': 'Umsizi',
  'tabs.calendar': 'Ikhalenda',
  'tabs.diary': 'Idayari',
  'tabs.more': 'Okunye',

  'home.greeting': 'Siyakujabulela ukukubona, {name}',
  'home.hi': 'Sawubona {name},',
  'home.welcomeBack': 'Siyakwamukela futhi.',
  'home.subtitle': 'Nalu isifinyezo sempilo yakho yanamuhla.',
  'home.documentsStored': 'Amadokhumenti alondoloziwe',
  'home.vaultCaption': 'Amadokhumenti esitoreni sakho',
  'home.activeMedications': 'Imithi okusebenza kuyo',
  'home.nextAppointment': 'Isinqumo esilandelayo',
  'home.emergencyReady': 'Kulungele isimo esiphuthumayo',
  'home.upload': 'Layisha',
  'home.share': 'Yabelana',
  'home.emergency': 'Isimo esiphuthumayo',
  'home.todaysReminders': 'Izikhumbuzo zanamuhla',
  'home.recentActivity': 'Umsebenzi wakamuva',
  'home.healthDayToday': 'Usuku Lokuqwashisa Ngempilo Lwanamuhla',
  'home.healthDayUpcoming': 'Usuku Lokuqwashisa Ngempilo Oluzayo',
  'home.seeAll': 'Bona konke',
  'home.viewTimeline': 'Buka Umlando',
  'home.careTeam': 'Iqembu lokunakekela',
  'home.onSchedule': 'Kuhamba kahle namuhla',

  'common.emergency': 'Isimo esiphuthumayo',
  'common.cancel': 'Khansela',
  'common.save': 'Londoloza',
  'common.done': 'Kuqediwe',
};

const af: Dict = {
  'tabs.home': 'Tuis',
  'tabs.records': 'Rekords',
  'tabs.assistant': 'Assistent',
  'tabs.calendar': 'Kalender',
  'tabs.diary': 'Dagboek',
  'tabs.more': 'Meer',

  'home.greeting': 'Goed om jou te sien, {name}',
  'home.hi': 'Hallo {name},',
  'home.welcomeBack': 'Welkom terug.',
  'home.subtitle': 'Hier is jou gesondheidsopsomming vir vandag.',
  'home.documentsStored': 'Dokumente gestoor',
  'home.vaultCaption': 'Dokumente in jou kluis',
  'home.activeMedications': 'Aktiewe medikasie',
  'home.nextAppointment': 'Volgende afspraak',
  'home.emergencyReady': 'Noodgereed',
  'home.upload': 'Laai op',
  'home.share': 'Deel',
  'home.emergency': 'Nood',
  'home.todaysReminders': "Vandag se herinneringe",
  'home.recentActivity': 'Onlangse aktiwiteit',
  'home.healthDayToday': 'Vandag se Gesondheidsbewusheidsdag',
  'home.healthDayUpcoming': 'Komende Gesondheidsbewusheidsdag',
  'home.seeAll': 'Sien alles',
  'home.viewTimeline': 'Bekyk Tydlyn',
  'home.careTeam': 'Sorgspan',
  'home.onSchedule': 'Op skedule vandag',

  'common.emergency': 'Nood',
  'common.cancel': 'Kanselleer',
  'common.save': 'Stoor',
  'common.done': 'Klaar',
};

// Setswana, Kiswahili, French and German: translated where provided, otherwise
// the lookup falls back to English automatically (see getText below).
const tn: Dict = {
  'tabs.home': 'Legae',
  'tabs.records': 'Direkoto',
  'tabs.assistant': 'Mothusi',
  'tabs.calendar': 'Khalendara',
  'tabs.diary': 'Buka ya letsatsi',
  'tabs.more': 'Tse dingwe',
  'common.emergency': 'Tshoganyetso',
};

const sw: Dict = {
  'tabs.home': 'Nyumbani',
  'tabs.records': 'Rekodi',
  'tabs.assistant': 'Msaidizi',
  'tabs.calendar': 'Kalenda',
  'tabs.diary': 'Shajara',
  'tabs.more': 'Zaidi',
  'common.emergency': 'Dharura',
};

const fr: Dict = {
  'tabs.home': 'Accueil',
  'tabs.records': 'Dossiers',
  'tabs.assistant': 'Assistant',
  'tabs.calendar': 'Calendrier',
  'tabs.diary': 'Journal',
  'tabs.more': 'Plus',
  'common.emergency': 'Urgence',
};

const de: Dict = {
  'tabs.home': 'Start',
  'tabs.records': 'Akten',
  'tabs.assistant': 'Assistent',
  'tabs.calendar': 'Kalender',
  'tabs.diary': 'Tagebuch',
  'tabs.more': 'Mehr',
  'common.emergency': 'Notfall',
};

export const dictionaries: Record<LanguageCode, Dict> = { en, zu, af, tn, sw, fr, de };

export function getText(lang: LanguageCode, key: string, vars?: Record<string, string>): string {
  const raw = dictionaries[lang]?.[key] ?? dictionaries.en[key] ?? key;
  if (!vars) return raw;
  return Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, v), raw);
}
