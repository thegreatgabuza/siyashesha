import React, { useState } from 'react';
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  Heart,
  Lock,
  QrCode,
  ShieldAlert,
  ShieldCheck,
  Users,
} from 'lucide-react-native';

import {
  INK,
  LINE,
  MAX,
  MUTED,
  NAVY,
  RED,
  SECONDARY,
  SURFACE,
  TEAL,
  SiteFooter,
  SiteNav,
  goSignUp,
  sans,
} from './site/SiteChrome';

const OFFICIAL_LANGUAGES = [
  'English',
  'isiZulu',
  'isiXhosa',
  'Afrikaans',
  'Sepedi',
  'Setswana',
  'Sesotho',
];

export function LandingPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const [email, setEmail] = useState('');
  const [activeTab, setActiveTab] = useState<'ice' | 'passport'>('ice');

  const handleStart = () => {
    if (email.trim()) {
      router.push({ pathname: '/(auth)/sign-up', params: { email: email.trim() } } as any);
    } else {
      goSignUp();
    }
  };

  return (
    <View style={styles.root}>
      <SiteNav />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} bounces={false}>
        {/* ========================================================================= */}
        {/* HERO SECTION - Architectural Dawn with Asymmetric Split Content           */}
        {/* ========================================================================= */}
        <View style={styles.heroWrapper}>
          <ImageBackground
            source={require('@/assets/images/landing-hero.jpg')}
            style={styles.heroBackground}
            imageStyle={styles.heroBackgroundImage}
            resizeMode="cover"
          >
            <View style={styles.heroOverlay}>
              <View style={[styles.heroContainer, isDesktop ? styles.heroRow : styles.heroColumn]}>
                {/* Hero Left: Narrative & Action */}
                <View style={[styles.heroTextPane, isDesktop && { flex: 1.15, paddingRight: 40 }]}>
                  <View style={styles.heroBadge}>
                    <View style={styles.badgePulseDot} />
                    <Text style={[styles.heroBadgeText, { fontFamily: sans(500) }]}>
                      South African Patient-Held Health Record
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.heroTitle,
                      isDesktop ? styles.heroTitleDesktop : styles.heroTitleMobile,
                      { fontFamily: sans(700) },
                    ]}
                  >
                    Your health passport.{'\n'}Ready in every emergency.
                  </Text>

                  <Text style={[styles.heroSubtitle, { fontFamily: sans(400) }]}>
                    Siyashesha gives you and your family an offline-first medical ID, critical ICE
                    card, and POPIA-compliant health vault accessible by paramedics and doctors across
                    South Africa.
                  </Text>

                  {/* Clean action box with nested 10px radius */}
                  <View style={[styles.heroActionBox, !isDesktop && styles.heroActionBoxMobile]}>
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="Enter your email address"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={[styles.heroInput, { fontFamily: sans(400) }]}
                    />
                    <Pressable
                      onPress={handleStart}
                      style={({ hovered }: any) => [
                        styles.heroPrimaryBtn,
                        hovered && styles.heroPrimaryBtnHovered,
                      ]}
                    >
                      <Text style={[styles.heroPrimaryBtnText, { fontFamily: sans(600) }]}>
                        Create Free Passport
                      </Text>
                      <ArrowRight size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
                    </Pressable>
                  </View>

                  {/* Micro reassurance */}
                  <View style={styles.heroAssuranceRow}>
                    <View style={styles.assuranceItem}>
                      <CheckCircle2 size={15} color="#34D399" />
                      <Text style={[styles.assuranceText, { fontFamily: sans(400) }]}>
                        Free forever tier
                      </Text>
                    </View>
                    <View style={styles.assuranceItem}>
                      <ShieldCheck size={15} color="#38BDF8" />
                      <Text style={[styles.assuranceText, { fontFamily: sans(400) }]}>
                        POPIA Act 4 compliant
                      </Text>
                    </View>
                    <View style={styles.assuranceItem}>
                      <Clock size={15} color="#FBBF24" />
                      <Text style={[styles.assuranceText, { fontFamily: sans(400) }]}>
                        Offline 112 access
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Hero Right: Interactive Health Passport & ICE Specimen */}
                <View style={[styles.heroSpecimenPane, isDesktop && { flex: 0.95 }]}>
                  <View style={styles.specimenCard}>
                    {/* Specimen Header & Mode Switcher */}
                    <View style={styles.specimenHeader}>
                      <View style={styles.specimenTitleGroup}>
                        <View style={styles.specimenEmblem}>
                          <ShieldAlert size={15} color={RED} />
                        </View>
                        <View>
                          <Text style={[styles.specimenBrand, { fontFamily: sans(700) }]}>
                            SIYASHESHA VAULT
                          </Text>
                          <Text style={[styles.specimenSub, { fontFamily: sans(400) }]}>
                            Patient-Held Health Credential
                          </Text>
                        </View>
                      </View>

                      {/* Pill tab switcher */}
                      <View style={styles.specimenTabs}>
                        <Pressable
                          onPress={() => setActiveTab('ice')}
                          style={[styles.specimenTab, activeTab === 'ice' && styles.specimenTabActive]}
                        >
                          <Text
                            style={[
                              styles.specimenTabText,
                              activeTab === 'ice' && styles.specimenTabTextActive,
                              { fontFamily: sans(activeTab === 'ice' ? 600 : 500) },
                            ]}
                          >
                            ICE Card
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => setActiveTab('passport')}
                          style={[
                            styles.specimenTab,
                            activeTab === 'passport' && styles.specimenTabActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.specimenTabText,
                              activeTab === 'passport' && styles.specimenTabTextActive,
                              { fontFamily: sans(activeTab === 'passport' ? 600 : 500) },
                            ]}
                          >
                            Vault View
                          </Text>
                        </Pressable>
                      </View>
                    </View>

                    {/* Specimen Body */}
                    {activeTab === 'ice' ? (
                      <View style={styles.iceBody}>
                        {/* Emergency Banner */}
                        <View style={styles.iceAlertBanner}>
                          <View style={styles.iceAlertIcon}>
                            <AlertCircle size={16} color={RED} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.iceAlertTitle, { fontFamily: sans(700) }]}>
                              IN CASE OF EMERGENCY (ICE)
                            </Text>
                            <Text style={[styles.iceAlertDesc, { fontFamily: sans(400) }]}>
                              Paramedic fast-scan without screen unlock
                            </Text>
                          </View>
                          <View style={styles.bloodTypeBadge}>
                            <Text style={[styles.bloodTypeLabel, { fontFamily: sans(500) }]}>
                              BLOOD
                            </Text>
                            <Text style={[styles.bloodTypeValue, { fontFamily: sans(700) }]}>
                              O Rh+
                            </Text>
                          </View>
                        </View>

                        {/* Patient Identity Specimen */}
                        <View style={styles.patientMetaRow}>
                          <View style={styles.avatarPlaceholder}>
                            <Heart size={20} color={NAVY} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.patientName, { fontFamily: sans(700) }]}>
                              Thabo Ndlovu
                            </Text>
                            <Text style={[styles.patientDetail, { fontFamily: sans(400) }]}>
                              DOB: 14 Sep 1988 · ID: 880914****082 · Gauteng, SA
                            </Text>
                          </View>
                          <View style={styles.statusPill}>
                            <View style={styles.statusPillDot} />
                            <Text style={[styles.statusPillText, { fontFamily: sans(600) }]}>
                              ACTIVE
                            </Text>
                          </View>
                        </View>

                        {/* Critical Fields Grid */}
                        <View style={styles.specimenFieldsGrid}>
                          <View style={styles.specimenFieldCard}>
                            <Text style={[styles.fieldLabel, { fontFamily: sans(600) }]}>
                              CRITICAL ALLERGIES
                            </Text>
                            <Text style={[styles.fieldValueAlert, { fontFamily: sans(600) }]}>
                              Penicillin, NSAIDs (Anaphylaxis risk)
                            </Text>
                          </View>

                          <View style={styles.specimenFieldCard}>
                            <Text style={[styles.fieldLabel, { fontFamily: sans(600) }]}>
                              CHRONIC CONDITIONS
                            </Text>
                            <Text style={[styles.fieldValue, { fontFamily: sans(600) }]}>
                              Type 1 Diabetes (Insulin Dependent), Mild Asthma
                            </Text>
                          </View>

                          <View style={styles.specimenFieldCard}>
                            <Text style={[styles.fieldLabel, { fontFamily: sans(600) }]}>
                              PRIMARY EMERGENCY CONTACT (NEXT OF KIN)
                            </Text>
                            <Text style={[styles.fieldValue, { fontFamily: sans(600) }]}>
                              Zanele Ndlovu (Spouse) · +27 82 555 0192
                            </Text>
                          </View>

                          <View style={styles.specimenFieldCard}>
                            <Text style={[styles.fieldLabel, { fontFamily: sans(600) }]}>
                              FACILITY / HOSPITAL PREFERENCE
                            </Text>
                            <Text style={[styles.fieldValue, { fontFamily: sans(600) }]}>
                              Charlotte Maxeke JHB / Netcare Milpark
                            </Text>
                          </View>
                        </View>

                        {/* Offline QR simulation footer */}
                        <View style={styles.specimenFooter}>
                          <View style={styles.qrCodeBox}>
                            <QrCode size={30} color={INK} />
                          </View>
                          <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={[styles.qrTitle, { fontFamily: sans(600) }]}>
                              Offline QR Token #ZA-8809
                            </Text>
                            <Text style={[styles.qrSubtitle, { fontFamily: sans(400) }]}>
                              Readable by EMS scanners without internet
                            </Text>
                          </View>
                          <View style={styles.verifiedStamp}>
                            <ShieldCheck size={14} color={TEAL} />
                            <Text style={[styles.verifiedStampText, { fontFamily: sans(600) }]}>
                              ENCRYPTED
                            </Text>
                          </View>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.passportBody}>
                        <View style={styles.passportSummaryBox}>
                          <Text style={[styles.summaryBoxTitle, { fontFamily: sans(600) }]}>
                            Patient Health Dossier
                          </Text>
                          <Text style={[styles.summaryBoxText, { fontFamily: sans(400) }]}>
                            Standardized against RSA National Department of Health primary clinical
                            standards and private hospital discharge records.
                          </Text>
                        </View>

                        <View style={styles.dossierRow}>
                          <View style={styles.dossierStatCard}>
                            <Text style={[styles.dossierStatNum, { fontFamily: sans(700) }]}>14</Text>
                            <Text style={[styles.dossierStatLabel, { fontFamily: sans(400) }]}>
                              Immunizations
                            </Text>
                          </View>
                          <View style={styles.dossierStatCard}>
                            <Text style={[styles.dossierStatNum, { fontFamily: sans(700) }]}>3</Text>
                            <Text style={[styles.dossierStatLabel, { fontFamily: sans(400) }]}>
                              Active Scripts
                            </Text>
                          </View>
                          <View style={styles.dossierStatCard}>
                            <Text style={[styles.dossierStatNum, { fontFamily: sans(700) }]}>6</Text>
                            <Text style={[styles.dossierStatLabel, { fontFamily: sans(400) }]}>
                              Lab Panels
                            </Text>
                          </View>
                          <View style={styles.dossierStatCard}>
                            <Text style={[styles.dossierStatNum, { fontFamily: sans(700) }]}>4</Text>
                            <Text style={[styles.dossierStatLabel, { fontFamily: sans(400) }]}>
                              Dependents
                            </Text>
                          </View>
                        </View>

                        <View style={styles.recentTimeline}>
                          <Text style={[styles.timelineHeader, { fontFamily: sans(600) }]}>
                            RECENT CLINICAL RECORDS
                          </Text>
                          <View style={styles.timelineItem}>
                            <Activity size={14} color={NAVY} style={{ marginRight: 8 }} />
                            <Text style={[styles.timelineText, { fontFamily: sans(400) }]}>
                              HbA1c Lab Panel (Pathcare) — 6.4% (Normal target)
                            </Text>
                          </View>
                          <View style={styles.timelineItem}>
                            <FileText size={14} color={NAVY} style={{ marginRight: 8 }} />
                            <Text style={[styles.timelineText, { fontFamily: sans(400) }]}>
                              Tetanus Booster — Life Healthcare Hospital
                            </Text>
                          </View>
                          <View style={styles.timelineItem}>
                            <Lock size={14} color={NAVY} style={{ marginRight: 8 }} />
                            <Text style={[styles.timelineText, { fontFamily: sans(400) }]}>
                              15-Minute Doctor PIN generated for Dr. M. Sibeko
                            </Text>
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </View>
          </ImageBackground>
        </View>

        {/* ========================================================================= */}
        {/* QUIET LANGUAGE COMPLIANCE STRIP                                           */}
        {/* ========================================================================= */}
        <View style={styles.languagesStrip}>
          <View style={styles.languagesContainer}>
            <Text style={[styles.languagesLead, { fontFamily: sans(600) }]}>
              Built for all South Africans:
            </Text>
            <View style={styles.languageBadges}>
              {OFFICIAL_LANGUAGES.map((lang, index) => (
                <View key={lang} style={styles.languageBadgeItem}>
                  <Text style={[styles.languageBadgeText, { fontFamily: sans(500) }]}>{lang}</Text>
                  {index < OFFICIAL_LANGUAGES.length - 1 && (
                    <Text style={styles.languageDivider}>•</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ========================================================================= */}
        {/* CLINICAL CAPABILITIES BENTO GRID (Pass 3 & 4: Spacing & Nested Radii)     */}
        {/* ========================================================================= */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionEyebrow, { fontFamily: sans(600) }]}>
              SYSTEM ARCHITECTURE
            </Text>
            <Text style={[styles.sectionHeading, { fontFamily: sans(700) }]}>
              Engineered for South African medical realities
            </Text>
            <Text style={[styles.sectionSubheading, { fontFamily: sans(400) }]}>
              No lost green clinic cards or inaccessible hospital files. Everything essential is kept
              securely on your phone, ready when seconds matter.
            </Text>
          </View>

          <View style={[styles.bentoGrid, isDesktop ? styles.bentoGridDesktop : styles.bentoGridMobile]}>
            {/* Card 1 */}
            <View style={[styles.bentoCard, isDesktop && styles.bentoCardSpan2]}>
              <View style={[styles.bentoCardIcon, { backgroundColor: '#FEE2E2' }]}>
                <ShieldAlert size={20} color={RED} />
              </View>
              <Text style={[styles.bentoCardTitle, { fontFamily: sans(700) }]}>
                Offline ICE Emergency Card
              </Text>
              <Text style={[styles.bentoCardDescription, { fontFamily: sans(400) }]}>
                In a road accident or medical crisis, mobile data drops and screens lock. Your
                Siyashesha ICE card can be exported to your lockscreen wallpaper or Apple &amp; Google
                Wallet, allowing first responders to verify blood type, severe allergies, and emergency
                contacts in seconds.
              </Text>
              <View style={styles.bentoSpecimenRow}>
                <View style={styles.miniSpecimenBadge}>
                  <Text style={[styles.miniSpecimenLabel, { fontFamily: sans(500) }]}>
                    Access Time: &lt;150ms
                  </Text>
                </View>
                <View style={styles.miniSpecimenBadge}>
                  <Text style={[styles.miniSpecimenLabel, { fontFamily: sans(500) }]}>
                    Zero Mobile Data Required
                  </Text>
                </View>
                <View style={styles.miniSpecimenBadge}>
                  <Text style={[styles.miniSpecimenLabel, { fontFamily: sans(500) }]}>
                    112 / Netcare / ER24 Compatible
                  </Text>
                </View>
              </View>
            </View>

            {/* Card 2 */}
            <View style={[styles.bentoCard, isDesktop && styles.bentoCardSpan1]}>
              <View style={[styles.bentoCardIcon, { backgroundColor: '#F0FDFA' }]}>
                <ShieldCheck size={20} color={TEAL} />
              </View>
              <Text style={[styles.bentoCardTitle, { fontFamily: sans(700) }]}>
                POPIA Act &amp; Section 14
              </Text>
              <Text style={[styles.bentoCardDescription, { fontFamily: sans(400) }]}>
                Strict adherence to the South African Protection of Personal Information Act. You own
                your health data. We never sell records to medical aid schemes or underwriters.
              </Text>
            </View>

            {/* Card 3 */}
            <View style={[styles.bentoCard, isDesktop && styles.bentoCardSpan1]}>
              <View style={[styles.bentoCardIcon, { backgroundColor: '#EFF6FF' }]}>
                <Users size={20} color={NAVY} />
              </View>
              <Text style={[styles.bentoCardTitle, { fontFamily: sans(700) }]}>
                Family &amp; Dependent Vaults
              </Text>
              <Text style={[styles.bentoCardDescription, { fontFamily: sans(400) }]}>
                Manage your children&apos;s clinic road-to-health cards, childhood immunizations, and your
                elderly parents&apos; chronic medication schedules together in one unified family account.
              </Text>
            </View>

            {/* Card 4 */}
            <View style={[styles.bentoCard, isDesktop && styles.bentoCardSpan2]}>
              <View style={[styles.bentoCardIcon, { backgroundColor: '#F3F4F6' }]}>
                <FileText size={20} color={INK} />
              </View>
              <Text style={[styles.bentoCardTitle, { fontFamily: sans(700) }]}>
                Temporary Doctor PIN &amp; Clinic Share
              </Text>
              <Text style={[styles.bentoCardDescription, { fontFamily: sans(400) }]}>
                When visiting a specialist, hospital emergency room, or primary healthcare clinic,
                generate an auto-expiring 15-minute PIN. The doctor views your allergies, past surgical
                history, and lab panels on any browser with zero installation.
              </Text>
              <View style={styles.bentoSpecimenRow}>
                <View style={styles.miniSpecimenBadge}>
                  <Text style={[styles.miniSpecimenLabel, { fontFamily: sans(500) }]}>
                    AES-256 Cloud Vault
                  </Text>
                </View>
                <View style={styles.miniSpecimenBadge}>
                  <Text style={[styles.miniSpecimenLabel, { fontFamily: sans(500) }]}>
                    Auto-Expiring Access
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ========================================================================= */}
        {/* HOW IT WORKS                                                              */}
        {/* ========================================================================= */}
        <View style={styles.howItWorksWrapper}>
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionEyebrow, { fontFamily: sans(600) }]}>HOW IT WORKS</Text>
              <Text style={[styles.sectionHeading, { fontFamily: sans(700) }]}>
                Three steps to lifetime medical peace of mind
              </Text>
            </View>

            <View style={[styles.stepsRow, !isDesktop && styles.stepsColumn]}>
              <View style={styles.stepCard}>
                <View style={styles.stepNumberBadge}>
                  <Text style={[styles.stepNumberText, { fontFamily: sans(700) }]}>01</Text>
                </View>
                <Text style={[styles.stepTitle, { fontFamily: sans(700) }]}>
                  Create your profile
                </Text>
                <Text style={[styles.stepDescription, { fontFamily: sans(400) }]}>
                  Enter your blood group, critical allergies, chronic medications, and emergency
                  contacts. Upload paper clinic cards or past hospital discharge summaries.
                </Text>
              </View>

              <View style={styles.stepCard}>
                <View style={styles.stepNumberBadge}>
                  <Text style={[styles.stepNumberText, { fontFamily: sans(700) }]}>02</Text>
                </View>
                <Text style={[styles.stepTitle, { fontFamily: sans(700) }]}>
                  Activate offline ICE
                </Text>
                <Text style={[styles.stepDescription, { fontFamily: sans(400) }]}>
                  Export your offline Emergency Lockscreen card or save to Apple/Google Wallet. The
                  high-contrast QR code is scannable by any standard smartphone camera.
                </Text>
              </View>

              <View style={styles.stepCard}>
                <View style={styles.stepNumberBadge}>
                  <Text style={[styles.stepNumberText, { fontFamily: sans(700) }]}>03</Text>
                </View>
                <Text style={[styles.stepTitle, { fontFamily: sans(700) }]}>
                  Share securely in care
                </Text>
                <Text style={[styles.stepDescription, { fontFamily: sans(400) }]}>
                  When visiting a new clinic or GP, present your secure share PIN. You retain full
                  control over who sees your health record and when access expires.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ========================================================================= */}
        {/* TRANSPARENT PRICING SECTION                                               */}
        {/* ========================================================================= */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionEyebrow, { fontFamily: sans(600) }]}>
              TRANSPARENT PRICING
            </Text>
            <Text style={[styles.sectionHeading, { fontFamily: sans(700) }]}>
              Accessible healthcare tools for every family
            </Text>
            <Text style={[styles.sectionSubheading, { fontFamily: sans(400) }]}>
              Essential emergency features will always remain free. Upgrade only if you need
              unlimited lab document storage or multi-member family management.
            </Text>
          </View>

          <View style={[styles.pricingRow, !isDesktop && styles.pricingColumn]}>
            {/* Plan 1: Free Forever */}
            <View style={styles.pricingCard}>
              <Text style={[styles.pricingTierName, { fontFamily: sans(700) }]}>Essential ICE</Text>
              <Text style={[styles.pricingTierDesc, { fontFamily: sans(400) }]}>
                Life-saving emergency basics for every South African citizen
              </Text>
              <View style={styles.pricingPriceRow}>
                <Text style={[styles.pricingCurrency, { fontFamily: sans(700) }]}>R</Text>
                <Text style={[styles.pricingAmount, { fontFamily: sans(700) }]}>0</Text>
                <Text style={[styles.pricingPeriod, { fontFamily: sans(400) }]}>/ forever</Text>
              </View>

              <View style={styles.pricingFeaturesList}>
                <View style={styles.pricingFeatureItem}>
                  <Check size={16} color={TEAL} />
                  <Text style={[styles.pricingFeatureText, { fontFamily: sans(400) }]}>
                    Offline emergency lockscreen card
                  </Text>
                </View>
                <View style={styles.pricingFeatureItem}>
                  <Check size={16} color={TEAL} />
                  <Text style={[styles.pricingFeatureText, { fontFamily: sans(400) }]}>
                    Blood group &amp; critical allergy alerts
                  </Text>
                </View>
                <View style={styles.pricingFeatureItem}>
                  <Check size={16} color={TEAL} />
                  <Text style={[styles.pricingFeatureText, { fontFamily: sans(400) }]}>
                    2 verified Next of Kin emergency contacts
                  </Text>
                </View>
                <View style={styles.pricingFeatureItem}>
                  <Check size={16} color={TEAL} />
                  <Text style={[styles.pricingFeatureText, { fontFamily: sans(400) }]}>
                    Standard paramedic fast-scan QR token
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={() => goSignUp()}
                style={({ hovered }: any) => [
                  styles.pricingOutlineBtn,
                  hovered && styles.pricingOutlineBtnHovered,
                ]}
              >
                <Text style={[styles.pricingOutlineBtnText, { fontFamily: sans(600) }]}>
                  Get Started Free
                </Text>
              </Pressable>
            </View>

            {/* Plan 2: Individual Plus */}
            <View style={[styles.pricingCard, styles.pricingCardFeatured]}>
              <View style={styles.featuredBadge}>
                <Text style={[styles.featuredBadgeText, { fontFamily: sans(700) }]}>
                  MOST POPULAR
                </Text>
              </View>
              <Text style={[styles.pricingTierName, { fontFamily: sans(700) }]}>
                Individual Plus
              </Text>
              <Text style={[styles.pricingTierDesc, { fontFamily: sans(400) }]}>
                Complete personal medical vault &amp; doctor sharing
              </Text>
              <View style={styles.pricingPriceRow}>
                <Text style={[styles.pricingCurrency, { fontFamily: sans(700) }]}>R</Text>
                <Text style={[styles.pricingAmount, { fontFamily: sans(700) }]}>19.99</Text>
                <Text style={[styles.pricingPeriod, { fontFamily: sans(400) }]}>/ month</Text>
              </View>

              <View style={styles.pricingFeaturesList}>
                <View style={styles.pricingFeatureItem}>
                  <Check size={16} color={TEAL} />
                  <Text style={[styles.pricingFeatureText, { fontFamily: sans(400) }]}>
                    Everything in Essential ICE
                  </Text>
                </View>
                <View style={styles.pricingFeatureItem}>
                  <Check size={16} color={TEAL} />
                  <Text style={[styles.pricingFeatureText, { fontFamily: sans(400) }]}>
                    Unlimited prescription &amp; lab document vault
                  </Text>
                </View>
                <View style={styles.pricingFeatureItem}>
                  <Check size={16} color={TEAL} />
                  <Text style={[styles.pricingFeatureText, { fontFamily: sans(400) }]}>
                    Expiring PIN links for consulting doctors
                  </Text>
                </View>
                <View style={styles.pricingFeatureItem}>
                  <Check size={16} color={TEAL} />
                  <Text style={[styles.pricingFeatureText, { fontFamily: sans(400) }]}>
                    Apple Wallet &amp; Google Wallet pass sync
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={() => goSignUp()}
                style={({ hovered }: any) => [
                  styles.pricingFilledBtn,
                  hovered && styles.pricingFilledBtnHovered,
                ]}
              >
                <Text style={[styles.pricingFilledBtnText, { fontFamily: sans(600) }]}>
                  Start 14-Day Free Trial
                </Text>
              </Pressable>
            </View>

            {/* Plan 3: Family Vault */}
            <View style={styles.pricingCard}>
              <Text style={[styles.pricingTierName, { fontFamily: sans(700) }]}>Family Vault</Text>
              <Text style={[styles.pricingTierDesc, { fontFamily: sans(400) }]}>
                Covers parents, children, and elderly dependents
              </Text>
              <View style={styles.pricingPriceRow}>
                <Text style={[styles.pricingCurrency, { fontFamily: sans(700) }]}>R</Text>
                <Text style={[styles.pricingAmount, { fontFamily: sans(700) }]}>49.99</Text>
                <Text style={[styles.pricingPeriod, { fontFamily: sans(400) }]}>/ month</Text>
              </View>

              <View style={styles.pricingFeaturesList}>
                <View style={styles.pricingFeatureItem}>
                  <Check size={16} color={TEAL} />
                  <Text style={[styles.pricingFeatureText, { fontFamily: sans(400) }]}>
                    Up to 6 family members &amp; dependents
                  </Text>
                </View>
                <View style={styles.pricingFeatureItem}>
                  <Check size={16} color={TEAL} />
                  <Text style={[styles.pricingFeatureText, { fontFamily: sans(400) }]}>
                    Child immunization schedule tracker
                  </Text>
                </View>
                <View style={styles.pricingFeatureItem}>
                  <Check size={16} color={TEAL} />
                  <Text style={[styles.pricingFeatureText, { fontFamily: sans(400) }]}>
                    Elderly parent chronic medication alerts
                  </Text>
                </View>
                <View style={styles.pricingFeatureItem}>
                  <Check size={16} color={TEAL} />
                  <Text style={[styles.pricingFeatureText, { fontFamily: sans(400) }]}>
                    Multi-guardian emergency ICE management
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={() => goSignUp()}
                style={({ hovered }: any) => [
                  styles.pricingOutlineBtn,
                  hovered && styles.pricingOutlineBtnHovered,
                ]}
              >
                <Text style={[styles.pricingOutlineBtnText, { fontFamily: sans(600) }]}>
                  Choose Family Plan
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* ========================================================================= */}
        {/* CLOSING CALL TO ACTION - Deep Navy Panel                                  */}
        {/* ========================================================================= */}
        <View style={styles.ctaWrapper}>
          <View style={styles.ctaCard}>
            <View style={styles.ctaEmblem}>
              <ShieldCheck size={28} color="#FFFFFF" />
            </View>
            <Text style={[styles.ctaTitle, { fontFamily: sans(700) }]}>
              Be prepared before an emergency strikes
            </Text>
            <Text style={[styles.ctaSubtitle, { fontFamily: sans(400) }]}>
              Join thousands of South African families who carry their critical medical information
              safely in their pocket. Free setup takes less than 3 minutes.
            </Text>
            <View style={styles.ctaActions}>
              <Pressable
                onPress={() => goSignUp()}
                style={({ hovered }: any) => [
                  styles.ctaPrimaryBtn,
                  hovered && styles.ctaPrimaryBtnHovered,
                ]}
              >
                <Text style={[styles.ctaPrimaryBtnText, { fontFamily: sans(600) }]}>
                  Create Free Account
                </Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/features' as any)}
                style={({ hovered }: any) => [
                  styles.ctaSecondaryBtn,
                  hovered && styles.ctaSecondaryBtnHovered,
                ]}
              >
                <Text style={[styles.ctaSecondaryBtnText, { fontFamily: sans(500) }]}>
                  Explore All Features
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        <SiteFooter />
      </ScrollView>
    </View>
  );
}

export default LandingPage;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: SURFACE,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 0,
  },

  // HERO
  heroWrapper: {
    width: '100%',
    minHeight: 640,
    backgroundColor: NAVY,
    overflow: 'hidden',
  },
  heroBackground: {
    width: '100%',
    height: '100%',
  },
  heroBackgroundImage: {
    opacity: 0.38,
  },
  heroOverlay: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(11, 30, 64, 0.76)',
    paddingVertical: 56,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContainer: {
    maxWidth: MAX,
    width: '100%',
    alignItems: 'center',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroColumn: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 40,
  },
  heroTextPane: {
    justifyContent: 'center',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  badgePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
    marginRight: 8,
  },
  heroBadgeText: {
    fontSize: 12,
    color: '#E5E7EB',
    letterSpacing: 0.2,
  },
  heroTitle: {
    color: '#FFFFFF',
    lineHeight: 1.15,
    letterSpacing: -0.8,
    marginBottom: 16,
  },
  heroTitleDesktop: {
    fontSize: 48,
    lineHeight: 56,
  },
  heroTitleMobile: {
    fontSize: 32,
    lineHeight: 40,
  },
  heroSubtitle: {
    fontSize: 16,
    lineHeight: 26,
    color: '#D1D5DB',
    marginBottom: 28,
    maxWidth: 540,
  },
  heroActionBox: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 6,
    borderRadius: 10,
    maxWidth: 480,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },
  heroActionBoxMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
    padding: 8,
    gap: 8,
  },
  heroInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: INK,
    outlineStyle: 'none' as any,
  },
  heroPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: NAVY,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    cursor: 'pointer' as any,
  },
  heroPrimaryBtnHovered: {
    backgroundColor: '#1E3A8A',
  },
  heroPrimaryBtnText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  heroAssuranceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    alignItems: 'center',
  },
  assuranceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  assuranceText: {
    fontSize: 12,
    color: '#E5E7EB',
  },

  // HERO SPECIMEN
  heroSpecimenPane: {
    width: '100%',
    alignItems: 'center',
  },
  specimenCard: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 12,
    overflow: 'hidden',
  },
  specimenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  specimenTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  specimenEmblem: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  specimenBrand: {
    fontSize: 12,
    color: INK,
    letterSpacing: 0.5,
  },
  specimenSub: {
    fontSize: 10,
    color: SECONDARY,
  },
  specimenTabs: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    padding: 3,
    borderRadius: 8,
  },
  specimenTab: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  specimenTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  specimenTabText: {
    fontSize: 11,
    color: SECONDARY,
  },
  specimenTabTextActive: {
    color: INK,
  },
  iceBody: {
    padding: 20,
    gap: 14,
  },
  iceAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 12,
    gap: 10,
  },
  iceAlertIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iceAlertTitle: {
    fontSize: 11,
    color: RED,
    letterSpacing: 0.3,
  },
  iceAlertDesc: {
    fontSize: 11,
    color: SECONDARY,
  },
  bloodTypeBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  bloodTypeLabel: {
    fontSize: 9,
    color: SECONDARY,
    letterSpacing: 0.5,
  },
  bloodTypeValue: {
    fontSize: 13,
    color: RED,
  },
  patientMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientName: {
    fontSize: 16,
    color: INK,
  },
  patientDetail: {
    fontSize: 12,
    color: SECONDARY,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 5,
  },
  statusPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusPillText: {
    fontSize: 10,
    color: '#065F46',
  },
  specimenFieldsGrid: {
    gap: 8,
  },
  specimenFieldCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: LINE,
  },
  fieldLabel: {
    fontSize: 10,
    color: MUTED,
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 12,
    color: INK,
  },
  fieldValueAlert: {
    fontSize: 12,
    color: RED,
  },
  specimenFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: LINE,
  },
  qrCodeBox: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: LINE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrTitle: {
    fontSize: 12,
    color: INK,
  },
  qrSubtitle: {
    fontSize: 11,
    color: SECONDARY,
    marginTop: 1,
  },
  verifiedStamp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  verifiedStampText: {
    fontSize: 10,
    color: TEAL,
  },

  // PASSPORT SPECIMEN BODY
  passportBody: {
    padding: 20,
    gap: 16,
  },
  passportSummaryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: LINE,
  },
  summaryBoxTitle: {
    fontSize: 13,
    color: NAVY,
    marginBottom: 4,
  },
  summaryBoxText: {
    fontSize: 12,
    color: SECONDARY,
    lineHeight: 18,
  },
  dossierRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dossierStatCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: LINE,
  },
  dossierStatNum: {
    fontSize: 18,
    color: NAVY,
  },
  dossierStatLabel: {
    fontSize: 10,
    color: SECONDARY,
    marginTop: 2,
  },
  recentTimeline: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: LINE,
    padding: 12,
    gap: 8,
  },
  timelineHeader: {
    fontSize: 10,
    color: MUTED,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  timelineText: {
    fontSize: 11,
    color: INK,
    flex: 1,
  },

  // LANGUAGES STRIP
  languagesStrip: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: LINE,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  languagesContainer: {
    maxWidth: MAX,
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  languagesLead: {
    fontSize: 12,
    color: SECONDARY,
  },
  languageBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  languageBadgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  languageBadgeText: {
    fontSize: 12,
    color: INK,
  },
  languageDivider: {
    fontSize: 10,
    color: '#D1D5DB',
  },

  // COMMON SECTIONS
  sectionContainer: {
    maxWidth: MAX,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 72,
  },
  sectionHeader: {
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: 48,
  },
  sectionEyebrow: {
    fontSize: 12,
    color: RED,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  sectionHeading: {
    fontSize: 32,
    lineHeight: 40,
    color: INK,
    textAlign: 'center',
    marginBottom: 12,
  },
  sectionSubheading: {
    fontSize: 16,
    lineHeight: 24,
    color: SECONDARY,
    textAlign: 'center',
    maxWidth: 640,
  },

  // BENTO GRID
  bentoGrid: {
    gap: 20,
  },
  bentoGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  bentoGridMobile: {
    flexDirection: 'column',
  },
  bentoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 28,
    borderWidth: 1,
    borderColor: LINE,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  bentoCardSpan1: {
    width: 'calc(33.333% - 14px)' as any,
  },
  bentoCardSpan2: {
    width: 'calc(66.666% - 14px)' as any,
  },
  bentoCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  bentoCardTitle: {
    fontSize: 18,
    lineHeight: 24,
    color: INK,
    marginBottom: 10,
  },
  bentoCardDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: SECONDARY,
    marginBottom: 16,
  },
  bentoSpecimenRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  miniSpecimenBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  miniSpecimenLabel: {
    fontSize: 11,
    color: SECONDARY,
  },

  // HOW IT WORKS
  howItWorksWrapper: {
    backgroundColor: '#F3F4F6',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: LINE,
  },
  stepsRow: {
    flexDirection: 'row',
    gap: 24,
  },
  stepsColumn: {
    flexDirection: 'column',
    gap: 20,
  },
  stepCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 28,
    borderWidth: 1,
    borderColor: LINE,
  },
  stepNumberBadge: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  stepNumberText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  stepTitle: {
    fontSize: 18,
    color: INK,
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: SECONDARY,
  },

  // PRICING
  pricingRow: {
    flexDirection: 'row',
    gap: 24,
    alignItems: 'stretch',
  },
  pricingColumn: {
    flexDirection: 'column',
    gap: 20,
  },
  pricingCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
    borderColor: LINE,
    position: 'relative',
  },
  pricingCardFeatured: {
    borderColor: NAVY,
    borderWidth: 2,
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
  },
  featuredBadge: {
    position: 'absolute',
    top: -12,
    right: 24,
    backgroundColor: NAVY,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  featuredBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  pricingTierName: {
    fontSize: 20,
    color: INK,
    marginBottom: 6,
  },
  pricingTierDesc: {
    fontSize: 13,
    color: SECONDARY,
    minHeight: 38,
  },
  pricingPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 20,
  },
  pricingCurrency: {
    fontSize: 18,
    color: INK,
    marginRight: 2,
  },
  pricingAmount: {
    fontSize: 36,
    color: INK,
  },
  pricingPeriod: {
    fontSize: 14,
    color: SECONDARY,
    marginLeft: 6,
  },
  pricingFeaturesList: {
    gap: 12,
    marginBottom: 28,
  },
  pricingFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pricingFeatureText: {
    fontSize: 13,
    color: SECONDARY,
    flex: 1,
  },
  pricingOutlineBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
  pricingOutlineBtnHovered: {
    backgroundColor: '#F3F4F6',
  },
  pricingOutlineBtnText: {
    fontSize: 14,
    color: NAVY,
  },
  pricingFilledBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
  pricingFilledBtnHovered: {
    backgroundColor: '#1E3A8A',
  },
  pricingFilledBtnText: {
    fontSize: 14,
    color: '#FFFFFF',
  },

  // CTA
  ctaWrapper: {
    maxWidth: MAX,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingBottom: 72,
  },
  ctaCard: {
    backgroundColor: NAVY,
    borderRadius: 20,
    paddingVertical: 48,
    paddingHorizontal: 32,
    alignItems: 'center',
    textAlign: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  ctaEmblem: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  ctaTitle: {
    fontSize: 30,
    lineHeight: 38,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    maxWidth: 600,
  },
  ctaSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#D1D5DB',
    textAlign: 'center',
    maxWidth: 540,
    marginBottom: 28,
  },
  ctaActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'center',
  },
  ctaPrimaryBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    cursor: 'pointer' as any,
  },
  ctaPrimaryBtnHovered: {
    backgroundColor: '#F3F4F6',
  },
  ctaPrimaryBtnText: {
    fontSize: 14,
    color: NAVY,
  },
  ctaSecondaryBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    cursor: 'pointer' as any,
  },
  ctaSecondaryBtnHovered: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  ctaSecondaryBtnText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
});
