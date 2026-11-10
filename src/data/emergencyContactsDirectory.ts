export interface EmergencyServiceContact {
  id: string;
  name: string;
  number: string;
  cleanNumber: string;
  category: 'national' | 'rescue' | 'mental_health' | 'gbv_vulnerable' | 'health_regional';
  categoryLabel: string;
  purpose: string;
  isSpeedDial?: boolean;
  isPrivate?: boolean;
  tollFree?: boolean;
  hours?: string;
  smsNumber?: string;
  pleaseCallMeCode?: string;
  badge?: string;
}

export const NATIONAL_SPEED_DIALS: EmergencyServiceContact[] = [
  {
    id: 'speed-112',
    name: 'All Emergencies (Mobile)',
    number: '112',
    cleanNumber: '112',
    category: 'national',
    categoryLabel: 'National Emergency',
    purpose: 'Police, ambulance or fire emergency routing from any mobile phone in South Africa. Toll-free.',
    isSpeedDial: true,
    tollFree: true,
    hours: '24/7',
    badge: 'Mobile Priority',
  },
  {
    id: 'speed-10177',
    name: 'Public Ambulance / EMS',
    number: '10177',
    cleanNumber: '10177',
    category: 'national',
    categoryLabel: 'National Emergency',
    purpose: 'Emergency public ambulance dispatch, paramedics and municipal fire response.',
    isSpeedDial: true,
    tollFree: true,
    hours: '24/7',
    badge: 'Dispatch',
  },
  {
    id: 'speed-10111',
    name: 'SAPS Police Emergency',
    number: '10111',
    cleanNumber: '10111',
    category: 'national',
    categoryLabel: 'National Emergency',
    purpose: 'Immediate threats, crime in progress and urgent police assistance.',
    isSpeedDial: true,
    tollFree: true,
    hours: '24/7',
    badge: 'Police',
  },
];

export const emergencyServiceContacts: EmergencyServiceContact[] = [
  {
    "id": "em-112",
    "name": "All Emergencies (Mobile)",
    "number": "112",
    "cleanNumber": "112",
    "category": "national",
    "categoryLabel": "National Emergency",
    "purpose": "Police, ambulance or fire emergency routing from any mobile phone in South Africa. Toll-free.",
    "isSpeedDial": true,
    "tollFree": true,
    "hours": "24/7",
    "badge": "Mobile Priority"
  },
  {
    "id": "em-10177",
    "name": "Public Ambulance / EMS & Fire",
    "number": "10177",
    "cleanNumber": "10177",
    "category": "national",
    "categoryLabel": "National Emergency",
    "purpose": "Emergency public ambulance dispatch, paramedics and municipal fire response.",
    "isSpeedDial": true,
    "tollFree": true,
    "hours": "24/7",
    "badge": "Dispatch"
  },
  {
    "id": "em-10111",
    "name": "SAPS Police Flying Squad",
    "number": "10111",
    "cleanNumber": "10111",
    "category": "national",
    "categoryLabel": "National Emergency",
    "purpose": "Immediate threats, crime in progress and urgent police assistance.",
    "isSpeedDial": true,
    "tollFree": true,
    "hours": "24/7",
    "badge": "Police"
  },
  {
    "id": "em-fire-10177",
    "name": "National Fire & Rescue Route",
    "number": "10177",
    "cleanNumber": "10177",
    "category": "national",
    "categoryLabel": "National Emergency",
    "purpose": "National routing for fire and rescue assistance; local municipal fire numbers vary.",
    "tollFree": true,
    "hours": "24/7",
    "badge": "Rescue"
  },
  {
    "id": "em-crimestop",
    "name": "SAPS Crime Stop",
    "number": "08600 10111",
    "cleanNumber": "0860010111",
    "category": "national",
    "categoryLabel": "National Emergency",
    "purpose": "Anonymous crime reporting; not an emergency dispatch line.",
    "hours": "24/7",
    "badge": "Tip-off"
  },
  {
    "id": "em-er24",
    "name": "ER24 Emergency Medical Services",
    "number": "084 124",
    "cleanNumber": "084124",
    "category": "rescue",
    "categoryLabel": "Medical & Rescue",
    "purpose": "Private emergency medical response and trauma paramedics nationwide. Medical aid or fees may apply.",
    "isPrivate": true,
    "hours": "24/7",
    "badge": "Private EMS"
  },
  {
    "id": "em-netcare911",
    "name": "Netcare 911 Emergency Response",
    "number": "082 911",
    "cleanNumber": "082911",
    "category": "rescue",
    "categoryLabel": "Medical & Rescue",
    "purpose": "Private emergency medical assistance, intensive care ambulances and aeromedical evacuation.",
    "isPrivate": true,
    "hours": "24/7",
    "badge": "Private EMS"
  },
  {
    "id": "em-poison",
    "name": "Poison Information Helpline",
    "number": "0861 555 777",
    "cleanNumber": "0861555777",
    "category": "rescue",
    "categoryLabel": "Medical & Rescue",
    "purpose": "Specialist clinical advice on acute poisoning, chemical toxicity, snakebite and suspected overdose.",
    "hours": "24/7",
    "badge": "Clinical Advice"
  },
  {
    "id": "em-nsri",
    "name": "NSRI Sea Rescue Emergency Operations",
    "number": "087 094 9774",
    "cleanNumber": "0870949774",
    "category": "rescue",
    "categoryLabel": "Medical & Rescue",
    "purpose": "National coastal sea rescue, drowning emergencies and inland water rescue coordination.",
    "hours": "24/7",
    "badge": "Water Rescue"
  },
  {
    "id": "em-wsar",
    "name": "Wilderness Search and Rescue (WSAR)",
    "number": "021 937 0300",
    "cleanNumber": "0219370300",
    "category": "rescue",
    "categoryLabel": "Medical & Rescue",
    "purpose": "Mountain, hiking and wilderness rescue coordination, especially in the Western Cape.",
    "hours": "24/7",
    "badge": "Mountain Rescue"
  },
  {
    "id": "em-sadag-suicide",
    "name": "SADAG Suicide Crisis Helpline",
    "number": "0800 567 567",
    "cleanNumber": "0800567567",
    "category": "mental_health",
    "categoryLabel": "Mental Health & Crisis",
    "purpose": "24/7 suicide crisis counselling, intervention and immediate psychological support.",
    "tollFree": true,
    "hours": "24/7",
    "badge": "Toll-Free 24/7"
  },
  {
    "id": "em-cipla-mental",
    "name": "Cipla Mental Health Helpline",
    "number": "0800 456 789",
    "cleanNumber": "0800456789",
    "category": "mental_health",
    "categoryLabel": "Mental Health & Crisis",
    "purpose": "Free emotional crisis counselling, depression support and mental health referral.",
    "tollFree": true,
    "hours": "24/7",
    "badge": "Toll-Free 24/7"
  },
  {
    "id": "em-lifeline",
    "name": "LifeLine National Crisis Line",
    "number": "0861 322 322",
    "cleanNumber": "0861322322",
    "category": "mental_health",
    "categoryLabel": "Mental Health & Crisis",
    "purpose": "Emotional wellness, trauma counselling and compassionate crisis listening.",
    "hours": "24/7",
    "badge": "National Crisis"
  },
  {
    "id": "em-substance-abuse",
    "name": "Substance Abuse Helpline (DSD / SADAG)",
    "number": "0800 12 13 14",
    "cleanNumber": "0800121314",
    "category": "mental_health",
    "categoryLabel": "Mental Health & Crisis",
    "purpose": "Substance abuse guidance, addiction intervention and rehab support. SMS 32312.",
    "tollFree": true,
    "smsNumber": "32312",
    "hours": "24/7",
    "badge": "SMS 32312"
  },
  {
    "id": "em-hwcn",
    "name": "Healthcare Workers Care Network",
    "number": "0800 21 21 21",
    "cleanNumber": "0800212121",
    "category": "mental_health",
    "categoryLabel": "Mental Health & Crisis",
    "purpose": "Dedicated mental health and burnout support for doctors, nurses and healthcare personnel. SMS 43001.",
    "tollFree": true,
    "smsNumber": "43001",
    "hours": "24/7",
    "badge": "For Clinicians"
  },
  {
    "id": "em-npower",
    "name": "NPOwer SA Helpline",
    "number": "0800 515 515",
    "cleanNumber": "0800515515",
    "category": "mental_health",
    "categoryLabel": "Mental Health & Crisis",
    "purpose": "Psychosocial support for nonprofit and community workers across South Africa. SMS 43010.",
    "tollFree": true,
    "smsNumber": "43010",
    "hours": "24/7",
    "badge": "Toll-Free"
  },
  {
    "id": "em-adcock-depression",
    "name": "Adcock Ingram Depression & Anxiety Helpline",
    "number": "0800 70 80 90",
    "cleanNumber": "0800708090",
    "category": "mental_health",
    "categoryLabel": "Mental Health & Crisis",
    "purpose": "Support for anxiety, major depressive episodes and clinical mood disorders.",
    "tollFree": true,
    "hours": "08:00 - 20:00",
    "badge": "Toll-Free"
  },
  {
    "id": "em-dr-reddy",
    "name": "Dr Reddy's Mental Health Helpline",
    "number": "0800 21 22 23",
    "cleanNumber": "0800212223",
    "category": "mental_health",
    "categoryLabel": "Mental Health & Crisis",
    "purpose": "Mental health counselling, psychological guidance and medication support.",
    "tollFree": true,
    "hours": "24/7",
    "badge": "Toll-Free"
  },
  {
    "id": "em-adhd",
    "name": "ADHD Helpline",
    "number": "0800 55 44 33",
    "cleanNumber": "0800554433",
    "category": "mental_health",
    "categoryLabel": "Mental Health & Crisis",
    "purpose": "Information, resources and management advice for ADHD children and adults.",
    "tollFree": true,
    "hours": "08:00 - 20:00",
    "badge": "Toll-Free"
  },
  {
    "id": "em-police-trauma",
    "name": "Police & Trauma Helpline",
    "number": "0800 20 50 26",
    "cleanNumber": "0800205026",
    "category": "mental_health",
    "categoryLabel": "Mental Health & Crisis",
    "purpose": "Post-traumatic stress debriefing, psychological trauma recovery and emergency worker support.",
    "tollFree": true,
    "hours": "24/7",
    "badge": "Trauma Support"
  },
  {
    "id": "em-gbv-centre",
    "name": "Gender-Based Violence Command Centre",
    "number": "0800 428 428",
    "cleanNumber": "0800428428",
    "category": "gbv_vulnerable",
    "categoryLabel": "GBV & Vulnerable Groups",
    "purpose": "Immediate crisis response, social worker dispatch and safe shelter referral for GBV victims. Please Call Me *120*7867#.",
    "tollFree": true,
    "pleaseCallMeCode": "*120*7867#",
    "hours": "24/7",
    "badge": "Toll-Free 24/7"
  },
  {
    "id": "em-stop-gbv",
    "name": "STOP Gender Violence Helpline",
    "number": "0800 150 150",
    "cleanNumber": "0800150150",
    "category": "gbv_vulnerable",
    "categoryLabel": "GBV & Vulnerable Groups",
    "purpose": "Confidential counselling, legal information and shelter referral for survivors of gender violence.",
    "tollFree": true,
    "hours": "24/7",
    "badge": "Toll-Free 24/7"
  },
  {
    "id": "em-childline",
    "name": "Childline South Africa",
    "number": "116",
    "cleanNumber": "116",
    "category": "gbv_vulnerable",
    "categoryLabel": "GBV & Vulnerable Groups",
    "purpose": "Dedicated toll-free helpline for children in danger, child abuse reporting and youth counselling.",
    "isSpeedDial": true,
    "tollFree": true,
    "hours": "24/7",
    "badge": "Toll-Free 116"
  },
  {
    "id": "em-elder-abuse",
    "name": "Halt Elder Abuse Line",
    "number": "0800 003 081",
    "cleanNumber": "0800003081",
    "category": "gbv_vulnerable",
    "categoryLabel": "GBV & Vulnerable Groups",
    "purpose": "Protection and reporting of physical, emotional, or financial elder abuse and neglect.",
    "tollFree": true,
    "hours": "Office hours",
    "badge": "Toll-Free"
  },
  {
    "id": "em-trafficking",
    "name": "Human Trafficking Reporting Hotline",
    "number": "08000 737 283",
    "cleanNumber": "08000737283",
    "category": "gbv_vulnerable",
    "categoryLabel": "GBV & Vulnerable Groups",
    "purpose": "Government-listed hotline to report suspected human trafficking and request emergency rescue.",
    "tollFree": true,
    "hours": "24/7",
    "badge": "Tip-off & Rescue"
  },
  {
    "id": "em-shelter-movement",
    "name": "National Shelter Movement of South Africa",
    "number": "0800 001 005",
    "cleanNumber": "0800001005",
    "category": "gbv_vulnerable",
    "categoryLabel": "GBV & Vulnerable Groups",
    "purpose": "Placement and safe shelter assistance for women and children escaping domestic abuse.",
    "tollFree": true,
    "hours": "24/7",
    "badge": "Safe Shelter"
  },
  {
    "id": "em-aids-helpline",
    "name": "National AIDS Helpline",
    "number": "0800 012 322",
    "cleanNumber": "0800012322",
    "category": "health_regional",
    "categoryLabel": "Health & Regional",
    "purpose": "HIV/AIDS clinical information, PEP/PrEP guidance, antiretroviral adherence and testing site referral.",
    "tollFree": true,
    "hours": "24/7",
    "badge": "Toll-Free 24/7"
  },
  {
    "id": "em-cpt-emergency",
    "name": "City of Cape Town General Emergency",
    "number": "107",
    "cleanNumber": "107",
    "category": "health_regional",
    "categoryLabel": "Health & Regional",
    "purpose": "Municipal emergency dispatch within City of Cape Town: dial 107 from landline or 021 480 7700 from mobile.",
    "hours": "24/7",
    "badge": "Cape Town 107"
  },
  {
    "id": "em-wc-disaster",
    "name": "Western Cape Disaster Risk Management",
    "number": "080 911 4357",
    "cleanNumber": "0809114357",
    "category": "health_regional",
    "categoryLabel": "Health & Regional",
    "purpose": "Provincial disaster management, flood, severe storm and environmental emergency coordination.",
    "tollFree": true,
    "hours": "24/7",
    "badge": "Western Cape"
  },
  {
    "id": "em-safe-schools",
    "name": "Western Cape Safe Schools",
    "number": "0800 454 647",
    "cleanNumber": "0800454647",
    "category": "health_regional",
    "categoryLabel": "Health & Regional",
    "purpose": "School safety incident reporting, trauma counselling and anti-bullying assistance.",
    "tollFree": true,
    "hours": "08:00 - 16:00",
    "badge": "Toll-Free"
  }
];

export const EMERGENCY_CATEGORIES = [
  { key: 'all', label: 'All Helplines (30)' },
  { key: 'national', label: 'National 🚨' },
  { key: 'rescue', label: 'Medical & Rescue 🚑' },
  { key: 'mental_health', label: 'Mental Health 🧠' },
  { key: 'gbv_vulnerable', label: 'GBV & Children 🛡️' },
  { key: 'health_regional', label: 'Health & Regional ℹ️' },
] as const;

export function filterEmergencyContacts(
  query: string = '',
  category: string = 'all'
): EmergencyServiceContact[] {
  const cleanQ = query.trim().toLowerCase();
  const cleanCat = category.trim().toLowerCase();

  return emergencyServiceContacts.filter((c) => {
    if (cleanCat !== 'all' && c.category !== cleanCat) {
      return false;
    }
    if (!cleanQ) return true;
    return (
      c.name.toLowerCase().includes(cleanQ) ||
      c.number.toLowerCase().includes(cleanQ) ||
      c.cleanNumber.toLowerCase().includes(cleanQ) ||
      c.purpose.toLowerCase().includes(cleanQ) ||
      c.categoryLabel.toLowerCase().includes(cleanQ) ||
      (c.badge && c.badge.toLowerCase().includes(cleanQ))
    );
  });
}
