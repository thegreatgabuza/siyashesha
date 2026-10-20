export type HealthPassportTarget =
  | 'records'
  | 'medications'
  | 'timeline'
  | 'emergency'
  | 'calendar'
  | 'sharing';

export interface HealthDaySection {
  heading: string;
  body: string;
}

export interface HealthDayCard {
  id: string;
  order: number;
  icon: string;
  dateLabel: string;
  month: number;
  day: number;
  endMonth?: number;
  endDay?: number;
  title: string;
  sections: HealthDaySection[];
  passport: { text: string; target: HealthPassportTarget };
}

export const healthDays: HealthDayCard[] = [
  {
    id: 'ntd',
    order: 1,
    icon: '01_ntd',
    dateLabel: '30 January',
    month: 1,
    day: 30,
    title: 'World Neglected Tropical Diseases Day',
    sections: [
      {
        heading: 'How the day began',
        body: 'The date recalls 30 January 2012, when major international commitments drew attention to neglected tropical diseases. The World Health Assembly formally recognised the day in 2021.',
      },
      {
        heading: 'What are they?',
        body: 'Neglected tropical diseases are a group of conditions that disproportionately affect people with limited access to healthcare, clean water and sanitation. They include illnesses such as schistosomiasis, scabies and soil-transmitted worm infections.',
      },
      {
        heading: 'Signs and management',
        body: 'Symptoms and treatment differ greatly between diseases. An unexplained persistent rash, itching, swelling or abdominal problem should be assessed rather than treated as though all tropical diseases are the same. A healthcare professional may arrange tests and prescribe disease-specific treatment.',
      },
      {
        heading: 'Prevention',
        body: 'Depending on the illness, prevention may involve safe water, sanitation, footwear, insect control or community treatment programmes.',
      },
    ],
    passport: {
      text: 'Save the diagnosis, test results and treatment record so future healthcare providers know what was found and treated.',
      target: 'records',
    },
  },
  {
    id: 'hearing',
    order: 2,
    icon: '02_hearing',
    dateLabel: '3 March',
    month: 3,
    day: 3,
    title: 'World Hearing Day',
    sections: [
      {
        heading: 'How the day began',
        body: 'An international meeting established an ear-care awareness day in 2007. The date 3/3 was chosen because the two 3s resemble two ears. The observance later became World Hearing Day.',
      },
      {
        heading: 'What is hearing loss?',
        body: 'Hearing loss means reduced ability to hear sounds or understand speech. It may affect one or both ears and develop gradually or suddenly.',
      },
      {
        heading: 'Signs and management',
        body: 'Signs include asking people to repeat themselves, turning up the volume or struggling to follow conversations. Assessment may include an ear examination and hearing test. Treatment depends on the cause and may include treating an ear problem, hearing aids or other hearing support. Sudden hearing loss needs urgent medical assessment.',
      },
      {
        heading: 'Prevention',
        body: 'Limit exposure to loud noise and use hearing protection when needed.',
      },
    ],
    passport: {
      text: 'Keep hearing tests, specialist letters and hearing-aid information together.',
      target: 'records',
    },
  },
  {
    id: 'tb',
    order: 3,
    icon: '03_tb',
    dateLabel: '24 March',
    month: 3,
    day: 24,
    title: 'World Tuberculosis Day',
    sections: [
      {
        heading: 'How the day began',
        body: 'On 24 March 1882, Dr Robert Koch announced his discovery of the bacterium that causes tuberculosis. The day marks a turning point in understanding and diagnosing TB.',
      },
      {
        heading: 'What is TB?',
        body: 'Tuberculosis is a bacterial infection that most often affects the lungs. Infectious lung TB can spread through the air.',
      },
      {
        heading: 'Signs and management',
        body: 'A persistent cough, fever, night sweats and unexplained weight loss are reasons to seek testing. TB is usually treated with a combination of medicines taken according to a prescribed plan, with follow-up to check progress. Close contacts may need assessment. Do not stop treatment without speaking to your healthcare team.',
      },
      {
        heading: 'Prevention',
        body: 'Early diagnosis and treatment reduce spread. People at higher risk may be offered preventive treatment after assessment.',
      },
    ],
    passport: {
      text: 'Store TB results, medication details and follow-up dates. Use reminders to support your prescribed treatment schedule.',
      target: 'medications',
    },
  },
  {
    id: 'world-health-day',
    order: 4,
    icon: '04_health',
    dateLabel: '7 April',
    month: 4,
    day: 7,
    title: 'World Health Day',
    sections: [
      {
        heading: 'How the day began',
        body: 'WHO’s founding constitution came into force on 7 April 1948. World Health Day has been observed since 1950, with a different health focus each year.',
      },
      {
        heading: 'What is it about?',
        body: 'World Health Day brings attention to a health priority and encourages action by communities, healthcare workers and governments.',
      },
      {
        heading: 'What can you do?',
        body: 'Review whether you are due for a check-up, vaccination, screening test or follow-up for a long-term condition. A healthcare professional can advise which services fit your age and health needs.',
      },
    ],
    passport: {
      text: 'Check your Health Timeline. Add a missing document and confirm that your medicines, allergies and emergency contact are current.',
      target: 'timeline',
    },
  },
  {
    id: 'chagas',
    order: 5,
    icon: '05_chagas',
    dateLabel: '14 April',
    month: 4,
    day: 14,
    title: 'World Chagas Disease Day',
    sections: [
      {
        heading: 'How the day began',
        body: 'On 14 April 1909, Dr Carlos Chagas diagnosed the first known patient, a girl named Berenice. The World Health Assembly established the awareness day in 2019.',
      },
      {
        heading: 'What is Chagas disease?',
        body: 'It is an infection caused by the parasite Trypanosoma cruzi. It occurs mainly in Latin America. Some people have no early symptoms, but untreated infection can later affect the heart or digestive system.',
      },
      {
        heading: 'Signs and management',
        body: 'People who have lived in an affected area, or whose mother had Chagas disease, can ask whether testing is appropriate. Antiparasitic treatment is particularly important in early infection; some people also need monitoring or treatment for complications. A clinician decides on treatment after considering the individual case.',
      },
      {
        heading: 'Prevention',
        body: 'Prevention in affected areas includes reducing contact with the insects that transmit the parasite and maintaining safe blood and pregnancy screening services.',
      },
    ],
    passport: {
      text: 'Keep relevant travel history, test results and specialist letters in one place.',
      target: 'records',
    },
  },
  {
    id: 'immunization-week',
    order: 6,
    icon: '06_immunization',
    dateLabel: '24–30 April',
    month: 4,
    day: 24,
    endMonth: 4,
    endDay: 30,
    title: 'World Immunization Week',
    sections: [
      {
        heading: 'How the week began',
        body: 'Vaccination weeks started in the Americas in 2003. In 2012, all six WHO regions observed an immunization week at the same time for the first time.',
      },
      {
        heading: 'What is immunization?',
        body: 'Vaccination prepares the immune system to recognise particular infections and helps prevent illness and complications.',
      },
      {
        heading: 'Prevention and management',
        body: 'Vaccine recommendations depend on age, health conditions, pregnancy, previous doses and travel. If a dose was missed, ask a healthcare professional about a catch-up plan. Report a concerning reaction after vaccination to the service that gave it.',
      },
    ],
    passport: {
      text: 'Upload your vaccination card, check that recorded doses are correct and set reminders for confirmed future appointments.',
      target: 'calendar',
    },
  },
  {
    id: 'malaria',
    order: 7,
    icon: '07_malaria',
    dateLabel: '25 April',
    month: 4,
    day: 25,
    title: 'World Malaria Day',
    sections: [
      {
        heading: 'How the day began',
        body: 'African countries marked Africa Malaria Day on 25 April. WHO member countries made it a worldwide observance in 2007, and the first World Malaria Day followed in 2008.',
      },
      {
        heading: 'What is malaria?',
        body: 'Malaria is caused by parasites transmitted through the bites of infected mosquitoes. It can become severe quickly.',
      },
      {
        heading: 'Signs and management',
        body: 'Fever, chills, headache or body aches during or after travel to a malaria-risk area require prompt assessment. Tell the healthcare professional where you travelled. Malaria is diagnosed with a test and treated with an appropriate antimalarial medicine; severe illness needs urgent hospital care.',
      },
      {
        heading: 'Prevention',
        body: 'Before travelling, ask about mosquito-bite prevention and whether preventive medicine is recommended for your destination.',
      },
    ],
    passport: {
      text: 'Save travel-related prescriptions, malaria test results and treatment records.',
      target: 'records',
    },
  },
  {
    id: 'hand-hygiene',
    order: 8,
    icon: '08_hands',
    dateLabel: '5 May',
    month: 5,
    day: 5,
    title: 'World Hand Hygiene Day',
    sections: [
      {
        heading: 'How the day began',
        body: 'WHO launched its SAVE LIVES: Clean Your Hands campaign in 2009 to improve hand hygiene in healthcare. Its annual 5 May activities became World Hand Hygiene Day.',
      },
      {
        heading: 'Why does it matter?',
        body: 'Germs carried on hands can spread infections between people and into wounds or healthcare settings.',
      },
      {
        heading: 'Prevention and management',
        body: 'Wash hands with soap and water, especially after using the toilet and before preparing or eating food. Alcohol-based hand rub is useful in many situations when hands are not visibly dirty. If you are caring for a wound, follow the specific hygiene instructions given by your healthcare team.',
      },
    ],
    passport: {
      text: 'Save wound-care or discharge instructions so you can check them at home.',
      target: 'records',
    },
  },
  {
    id: 'no-tobacco',
    order: 9,
    icon: '09_tobacco',
    dateLabel: '31 May',
    month: 5,
    day: 31,
    title: 'World No Tobacco Day',
    sections: [
      {
        heading: 'How the day began',
        body: 'WHO member countries called for a world day without smoking in 1987 and subsequently established 31 May as the annual World No Tobacco Day.',
      },
      {
        heading: 'Why is tobacco harmful?',
        body: 'Tobacco increases the risk of cancer, heart and lung disease and stroke. Nicotine dependence can make quitting difficult. Second-hand smoke also harms people nearby.',
      },
      {
        heading: 'Prevention and management',
        body: 'Avoid starting tobacco use and protect others from smoke. If you use tobacco, a healthcare professional can help you make a quit plan and discuss behavioural support and suitable treatment. Needing several attempts is common; support can be adjusted.',
      },
    ],
    passport: {
      text: 'Record your quit goal, prescribed treatment and follow-up appointments.',
      target: 'medications',
    },
  },
  {
    id: 'blood-donor',
    order: 10,
    icon: '10_blood',
    dateLabel: '14 June',
    month: 6,
    day: 14,
    title: 'World Blood Donor Day',
    sections: [
      {
        heading: 'How the day began',
        body: 'First observed in 2004, the day falls on the birthday of Karl Landsteiner, whose discovery of blood groups helped make transfusions safer. The first international launch was held in Johannesburg.',
      },
      {
        heading: 'Why is donated blood needed?',
        body: 'Patients may need blood after major bleeding, during surgery or for conditions such as severe anaemia. Blood services test and process donations before use.',
      },
      {
        heading: 'What can you do?',
        body: 'If you wish to donate, an authorised blood service can assess your eligibility. If you have received a transfusion before, tell your healthcare team during future care.',
      },
    ],
    passport: {
      text: 'Keep previous transfusion records and a confirmed blood-group result if you have one. A saved blood group never replaces the safety testing done before transfusion.',
      target: 'emergency',
    },
  },
  {
    id: 'drowning-prevention',
    order: 11,
    icon: '11_drowning',
    dateLabel: '25 July',
    month: 7,
    day: 25,
    title: 'World Drowning Prevention Day',
    sections: [
      {
        heading: 'How the day began',
        body: 'The United Nations General Assembly established the day in 2021 to encourage coordinated action against preventable drowning deaths.',
      },
      {
        heading: 'What is drowning?',
        body: 'Drowning occurs when breathing is impaired after being submerged or immersed in water. It can happen quickly and quietly.',
      },
      {
        heading: 'Prevention and response',
        body: 'Closely supervise children around water and follow local water-safety guidance. If someone is not breathing normally after being rescued, call emergency services and begin CPR if you are trained or can follow emergency-dispatch instructions. Breathing problems after a water incident need urgent care.',
      },
    ],
    passport: {
      text: 'Check that your Emergency Profile and emergency contact are up to date.',
      target: 'emergency',
    },
  },
  {
    id: 'hepatitis',
    order: 12,
    icon: '12_hepatitis',
    dateLabel: '28 July',
    month: 7,
    day: 28,
    title: 'World Hepatitis Day',
    sections: [
      {
        heading: 'How the day began',
        body: 'The World Health Assembly adopted 28 July as World Hepatitis Day in 2010. It is the birthday of Dr Baruch Blumberg, who discovered hepatitis B and helped develop its test and vaccine.',
      },
      {
        heading: 'What is hepatitis?',
        body: 'Hepatitis is inflammation of the liver. Hepatitis B and C are viral infections that can become chronic and damage the liver, sometimes without obvious early symptoms.',
      },
      {
        heading: 'Prevention and management',
        body: 'Hepatitis B vaccination helps prevent infection. Testing identifies hepatitis B or C. Hepatitis C can usually be cured with antiviral treatment; hepatitis B may require monitoring and, for some people, antiviral medicine. A healthcare professional will advise on testing, treatment and follow-up.',
      },
    ],
    passport: {
      text: 'Keep vaccination records, test results, prescriptions and liver follow-up results together.',
      target: 'records',
    },
  },
  {
    id: 'suicide-prevention',
    order: 13,
    icon: '13_suicide',
    dateLabel: '10 September',
    month: 9,
    day: 10,
    title: 'World Suicide Prevention Day',
    sections: [
      {
        heading: 'How the day began',
        body: 'The International Association for Suicide Prevention and WHO established the day in 2003 to raise awareness, reduce stigma and encourage action.',
      },
      {
        heading: 'What is the concern?',
        body: 'Suicidal thoughts can arise during intense distress and should always be taken seriously. A person may need immediate safety support as well as ongoing mental healthcare.',
      },
      {
        heading: 'Prevention and management',
        body: 'If you are worried about yourself, tell someone you trust and seek professional help. If you are worried about another person, listen without judgement and help them reach care. If someone is in immediate danger, contact local emergency services and stay with them if it is safe.',
      },
    ],
    passport: {
      text: 'You may choose to store a care plan, treatment details and support contacts. Check privacy settings before sharing sensitive records.',
      target: 'records',
    },
  },
  {
    id: 'patient-safety',
    order: 14,
    icon: '14_patient_safety',
    dateLabel: '17 September',
    month: 9,
    day: 17,
    title: 'World Patient Safety Day',
    sections: [
      {
        heading: 'How the day began',
        body: 'The World Health Assembly established the day in 2019 after recognising avoidable harm in healthcare as a global priority.',
      },
      {
        heading: 'What is patient safety?',
        body: 'Patient safety means reducing preventable harm during healthcare. Accurate information, clear communication and appropriate checks all help.',
      },
      {
        heading: 'Prevention and management',
        body: 'Tell your healthcare team about medicines, allergies and previous conditions. Ask what a test or treatment is for, how to take a new medicine and which symptoms mean you should return for help. Speak up if something in your record appears wrong.',
      },
    ],
    passport: {
      text: 'Review extracted information before confirming it. Check your medication and allergy lists, then share relevant records with your healthcare professional when needed.',
      target: 'medications',
    },
  },
  {
    id: 'mental-health',
    order: 15,
    icon: '15_mental',
    dateLabel: '10 October',
    month: 10,
    day: 10,
    title: 'World Mental Health Day',
    sections: [
      {
        heading: 'How the day began',
        body: 'The World Federation for Mental Health first observed the day in 1992 to bring mental health into public discussion and encourage action worldwide.',
      },
      {
        heading: 'What is mental health?',
        body: 'Mental health affects how we think, feel, cope and connect with others. Mental health conditions can affect anyone and deserve the same attention as physical conditions.',
      },
      {
        heading: 'Signs and management',
        body: 'Persistent low mood, anxiety, changes in sleep or difficulty with daily activities may be reasons to seek support. Care may involve counselling or other talking therapies, practical support and, for some conditions, medication. A healthcare professional can help make a plan suited to you.',
      },
    ],
    passport: {
      text: 'Keep a care plan, prescriptions and follow-up dates together, and choose carefully when to share them.',
      target: 'records',
    },
  },
  {
    id: 'diabetes',
    order: 16,
    icon: '16_diabetes',
    dateLabel: '14 November',
    month: 11,
    day: 14,
    title: 'World Diabetes Day',
    sections: [
      {
        heading: 'How the day began',
        body: 'The International Diabetes Federation established the day with WHO’s support in 1991. It falls on the birthday of Frederick Banting, who helped discover insulin, and became an official UN day in 2006.',
      },
      {
        heading: 'What is diabetes?',
        body: 'Diabetes is a condition in which blood glucose remains too high. Over time, it can affect the heart, eyes, kidneys, nerves and blood vessels.',
      },
      {
        heading: 'Signs and management',
        body: 'Frequent urination, thirst, tiredness or unexplained weight loss can occur, although some people notice no symptoms. Diagnosis requires testing. Management may include changes in food choices and activity, medication or insulin, and regular checks planned with a healthcare team.',
      },
    ],
    passport: {
      text: 'Track HbA1c and other results, medicines, eye and foot checks, and follow-up appointments.',
      target: 'timeline',
    },
  },
  {
    id: 'prematurity',
    order: 17,
    icon: '17_prematurity',
    dateLabel: '15 November',
    month: 11,
    day: 15,
    title: 'World Prematurity Day',
    sections: [
      {
        heading: 'How the day began',
        body: 'Parent organisations launched the day in 2008. It was traditionally observed on 17 November. WHO added it to its official calendar in 2025 and moved its observance to 15 November to avoid an overlap with another health day.',
      },
      {
        heading: 'What is prematurity?',
        body: 'A baby born before 37 completed weeks of pregnancy is premature. Babies born early may need additional support with breathing, feeding, warmth and growth.',
      },
      {
        heading: 'Management and follow-up',
        body: 'Care depends on the baby’s needs and may include neonatal unit care, feeding support and developmental follow-up. After discharge, follow the baby’s individual care plan. Seek urgent medical advice if the baby has difficulty breathing, feeds poorly or is unusually difficult to wake.',
      },
    ],
    passport: {
      text: 'Keep the neonatal discharge summary, growth record, medicines, vaccination record and follow-up dates together.',
      target: 'records',
    },
  },
  {
    id: 'cervical-cancer',
    order: 18,
    icon: '18_cervical',
    dateLabel: '17 November',
    month: 11,
    day: 17,
    title: 'World Cervical Cancer Elimination Day',
    sections: [
      {
        heading: 'How the day began',
        body: 'WHO launched its global cervical cancer elimination strategy on 17 November 2020. Annual activities grew from that commitment, and the World Health Assembly formally designated the day in 2025.',
      },
      {
        heading: 'What is cervical cancer?',
        body: 'It develops in the cervix and is usually linked to persistent infection with certain types of human papillomavirus, or HPV. Early cell changes often cause no symptoms.',
      },
      {
        heading: 'Prevention and management',
        body: 'HPV vaccination and cervical screening can prevent many cases. Screening can find changes that can be treated before they become cancer. Unusual bleeding, including bleeding after sex, needs assessment even if a previous screen was normal. Treatment for cervical cancer depends on its stage and may include surgery, radiotherapy or medicines.',
      },
    ],
    passport: {
      text: 'Save HPV vaccination dates, screening results, follow-up plans and specialist letters.',
      target: 'records',
    },
  },
  {
    id: 'amr-awareness',
    order: 19,
    icon: '19_amr',
    dateLabel: '18–24 November',
    month: 11,
    day: 18,
    endMonth: 11,
    endDay: 24,
    title: 'World AMR Awareness Week',
    sections: [
      {
        heading: 'How the week began',
        body: 'WHO held the first World Antibiotic Awareness Week in 2015. Its focus later widened beyond antibiotics, and in 2023 it was renamed World AMR Awareness Week.',
      },
      {
        heading: 'What is antimicrobial resistance?',
        body: 'It occurs when germs change and no longer respond well to medicines used to treat them. This can make infections more difficult to treat.',
      },
      {
        heading: 'Prevention and management',
        body: 'Use antibiotics only when prescribed for you; they do not treat viral illnesses such as most colds. Take prescribed medicines exactly as directed, ask if instructions are unclear, and do not share or reuse leftovers. Resistant infections require professional assessment and may need tests to guide treatment.',
      },
    ],
    passport: {
      text: 'Keep prescriptions, medicine allergies and any documented resistant-infection results available for your healthcare team.',
      target: 'medications',
    },
  },
  {
    id: 'aids',
    order: 20,
    icon: '20_aids',
    dateLabel: '1 December',
    month: 12,
    day: 1,
    title: 'World AIDS Day',
    sections: [
      {
        heading: 'How the day began',
        body: 'First observed in 1988, World AIDS Day was created to raise awareness, support people living with HIV and unite communities in the response.',
      },
      {
        heading: 'What are HIV and AIDS?',
        body: 'HIV is a virus that affects the immune system. AIDS is the most advanced stage of HIV infection. With effective treatment, people living with HIV can lead long and healthy lives.',
      },
      {
        heading: 'Prevention and management',
        body: 'Testing helps people access care early. Prevention options include condoms and, for eligible people, pre-exposure prophylaxis (PrEP). After a possible recent exposure, seek urgent advice about post-exposure prophylaxis (PEP). HIV is managed with antiretroviral treatment and regular follow-up.',
      },
    ],
    passport: {
      text: 'Keep test results, prescriptions and follow-up dates together if you choose. Review precisely which records a sharing link will reveal before sending it.',
      target: 'sharing',
    },
  },
];

export function getHealthDayByIcon(icon: string) {
  return healthDays.find((d) => d.icon === icon);
}

/** Returns the next upcoming health day on or after `fromDate`, wrapping to next year. */
export function getNextHealthDay(fromDate: Date = new Date()): HealthDayCard {
  const month = fromDate.getMonth() + 1;
  const day = fromDate.getDate();
  const sorted = [...healthDays].sort((a, b) => a.month - b.month || a.day - b.day);
  const upcoming = sorted.find((d) => d.month > month || (d.month === month && d.day >= day));
  return upcoming ?? sorted[0];
}

export function isHealthDayToday(card: HealthDayCard, date: Date = new Date()): boolean {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  if (card.endMonth && card.endDay) {
    if (card.month === card.endMonth) {
      return month === card.month && day >= card.day && day <= card.endDay;
    }
    const afterStart = month > card.month || (month === card.month && day >= card.day);
    const beforeEnd = month < card.endMonth || (month === card.endMonth && day <= card.endDay);
    return afterStart && beforeEnd;
  }
  return card.month === month && card.day === day;
}
