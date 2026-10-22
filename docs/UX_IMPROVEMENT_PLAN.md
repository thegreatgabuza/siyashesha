# Siyashesha Health Passport: UX improvement plan

Status: implemented on `app-foundation` (see §8 for what was verified and what is still open). This is an audit of the current build and the plan to raise it to a calm, premium, trustworthy health product **without** rebuilding it. Stack, routes, features and brand stay as they are.

## Guiding idea

Premium in a health app means **restraint, clarity and warmth**. Delight comes from material (glass, sheen, depth), physics (springs, flips, count-ups) and haptics, never from decoration. One rule overrides every other: **nothing animates in a way that delays the emergency card.**

---

## 1. Audit

### Global

| # | Problem | Where | Cause |
|---|---------|-------|-------|
| G1 | Content is cut off behind the floating nav on most sub-screens | Emergency, Sharing, Timeline, Records detail, Notifications, Language, Medications, Settings, Profile | `Screen` already scrolls, and the screens nest a second `ScrollView` inside it with `paddingBottom: 48`. The bar is ~90px plus the safe area. The fixed `bottomInset={120}` also ignores the device's inset. |
| G2 | Two token systems (`theme.ts` and `recordsTokens.ts`), plus about 90 hard-coded hex values across screens | everywhere | No single source of truth |
| G3 | There is no type scale. Sizes 9 to 44px are picked ad hoc, and fixed `text-[11px]` labels fall under the 12px floor | everywhere | — |
| G4 | Touch targets are 36 to 44px in places (chips, "See all", reminder rows) | Home, Assistant, Records | Target is ≥ 48px |
| G5 | The blue floating gear over the avatar is **not app code**. It is Expo Go's developer-tools button. The app header had no gear. | Expo Go only | Turn it off in the Expo Go dev menu ("Show tools button"). It never appears in development or production builds. App settings now live in the avatar menu and the More tab. |
| G6 | Unknown values are shown as raw input ("Not sure"), which is vague on a safety-critical field | Home, More, Profile, ICE card, QR payload | Onboarding writes the chip label straight into `bloodGroup` |
| G7 | Some motion ignores the OS "reduce motion" setting | TabBar, Toast | — |
| G8 | Only a few labels are translated (`home.*`, `tabs.*`). Labels with `numberOfLines={1}` and `adjustsFontSizeToFit` shrink long isiZulu, Afrikaans and Setswana labels until they are unreadable. | TabBar, StampBadge | — |

### Home (`src/app/(tabs)/index.tsx`)

| # | Problem | Fix |
|---|---------|-----|
| H1 | Stray gear over the avatar | Expo Go's tools button (G5). Header is now logo + bell + avatar. The avatar opens a menu with Profile, Settings and Sign out. |
| H2 | The vault shows 12 documents, but "Upload a first record" stays locked | Progress came from **stamps** that are only awarded during onboarding, while the counts come from **live data**. Progress is now derived from store data in `derivePassportProgress()` and can never contradict the screen. |
| H3 | Stamp labels wrap and truncate ("Emergen cy profil…") | 58px circles with 9px text are replaced by a horizontal stepper with short labels (Started · Emergency · Medication · Record · Biometrics) and a progress ring |
| H4 | "0% adherence · 0-day streak" looks like failure | Adherence shows only when the 7-day window has logged doses. Otherwise a neutral state ("No doses logged yet" / "No medications scheduled · Add one"). The 0% also came from seed data written relative to the first launch day and never refreshed. |
| H5 | The "Not sure" pill on the passport card | Blood-group chip: **Blood group · Unknown** + "Add" prompt (`lib/bloodGroup.ts`) |
| H6 | Emergency readiness looks like a list row | Elevated card with a clear status (Ready / Needs attention + what's missing), blood group and allergy chips, and a one-tap ICE card + QR. The passport card also flips to the ICE view. |
| H7 | The nav overlaps the content | Frosted glass nav, measured safe-area inset shared via `useTabBarInset()` |
| H8 | The Assistant is buried in More | "Ask Siyashesha" glass input on Home + an Assistant tab |
| H9 | Everything has equal weight | Fixed order: greeting → passport card → emergency readiness → today → next best action → recent activity. The eight-tile quick-action grid is removed (its routes stay reachable from cards, the nav and More). |
| H10 | The hero number is the document count | Document count becomes a secondary stat on the card |

### Navigation (`TabBar.tsx`, `(tabs)/_layout.tsx`)

- Solid navy slab with no material. The active state is a faint tint that doesn't animate between tabs.
- Tabs are Home, Records, Calendar, Diary, More. The Assistant is not first-class.
- Labels are shrunk to fit rather than allowed to breathe.

**Plan:** Home · Records · Assistant · Calendar · More. Diary is folded under Calendar (a Calendar/Diary segmented switch). Its routes stay intact: `diary` is hidden from the bar but routable, and highlights the Calendar tab. The bar is a liquid-glass surface (`GlassView` where available, `BlurView` otherwise, a solid surface for reduce-transparency/web fallback) with a spring "blob" indicator that slides and stretches between tabs.

### Records

- Good bones: search, category chips, month grouping, swipe actions, skeleton.
- Records are shown as icon tiles, not visual objects. There is no catalog or overview mode.
- `recordsTokens.ts` duplicates the theme.
- The FAB sits at a hard-coded `insets.bottom + 92`, which collides with the new bar height.

**Plan:**
- `RecordThumb`: a studio-style document preview. A paper sheet in a unified frame, with a soft shadow, a category tint from the brand palette, a faux letterhead/lines and the category glyph.
- Pinch-to-zoom-out (or the grid button) switches to the **Catalog**: a month-grouped timeline of large tiles, animated with spring layout transitions.
- All 11 categories (+ All = 12 filters) become scrollable chips with counts. Search stays instant.

### Emergency / ICE (`more/emergency.tsx`)

- The red gradient card puts text in 12px rows, and the QR code is small (120px).
- Unknown blood group is printed as "Not sure".
- Nested scroll (G1).

**Plan:**
- Status header (Ready / Needs attention).
- A large-type "critical strip" (blood group, allergies) readable at arm's length.
- 200px QR on white, call-contact as the primary action, export secondary.
- Field visibility toggles below.
- No entrance animation on this screen at all: the card renders instantly.

### Assistant

- Generic WhatsApp clone. The navy header and the "• • •" typing text look unfinished.
- The greeting hard-codes "Jessica".
- Replies are walls of text, and the HbA1c answer is a sentence.

**Plan:**
- Greet by the profile's first name.
- Numbered shortcuts kept as calm glass chips.
- Streaming word-by-word text with a shimmer sweep on the in-progress line.
- Rich inline cards: medication list with next dose, HbA1c result card with trend, emergency summary, records summary.
- Conversations are grouped per day, with a day pager ("Today", "Yesterday"…) in the header.

### Sharing, Settings, More, Calendar, Diary, Profile

- Nested scroll + bottom cut-off (G1). Ad hoc colours. Small labels.
- Settings is reachable only from More.

**Plan:**
- Token pass and correct insets.
- Settings and Profile reachable from the avatar menu.
- The More screen drops the duplicated profile hero in favour of a compact identity row plus grouped lists.

---

## 2. Design system (`src/design/tokens.ts`)

- **Colour**:
  - navy scale anchored on the logo navy `#0B2559`, with `#0B1E40` as the deep hero surface;
  - one red accent `#DC1F26` (emergency and safety, wordmark, name accent only);
  - green only for complete or healthy states;
  - cool-slate canvas `#F8FAFC`, white cards.
  - No blues outside the navy scale.
- **Type scale** (Inter): display 40/44 bold, title 28/32, headline 20/26, body 16/22, callout 14/20, footnote 13/18, label 12/16 caps with +1.2 tracking. All text scales with the system font size (no `allowFontScaling={false}`). Layout flexes instead of clamping.
- **Spacing**: 4-pt grid (4, 8, 12, 16, 20, 24, 32, 40, 56).
- **Radii**: 10 / 14 / 20 / 28 / pill. The passport card uses the ID-1 card ratio (1.586:1) with a 24px radius.
- **Elevation**: three levels of soft, navy-tinted shadows.
- **Motion**:
  - `snappy` (taps), `bouncy` (entrances, flips), `gentle` (layout) springs;
  - a 40ms entrance stagger.
  - Every animation checks `useReducedMotion()` and falls back to a fade or nothing.

## 3. Motion and material

| Effect | Implementation | Reduce-motion fallback |
|---|---|---|
| Passport sheen ("shader") | Slow, looping diagonal `LinearGradient` light band, driven by Reanimated. It is offset by the device tilt via `useAnimatedSensor(ROTATION)`, so the highlight follows the phone. | Static highlight |
| Card flip to ICE | `rotateY` with a spring, `backfaceVisibility` hidden, haptic on flip | Instant cross-fade |
| Glass nav and Ask bar | `expo-glass-effect` `GlassView` when `isLiquidGlassAvailable()`, otherwise `expo-blur` | Solid translucent surface |
| Staggered Home entrance | `FadeInDown.springify()` with index delay. **The passport card is never delayed.** | None |
| Count-ups, progress-ring fill | Reanimated derived values, SVG `strokeDashoffset` | Final value |
| Pull to refresh | Branded passport-stamp spinner above the content | Native indicator |
| Haptics | Tab change, dose taken (success), step complete, flip | — |

A GPU shader (`@shopify/react-native-skia`) was considered for the sheen. It is not added in this pass: it is a heavy native dependency, and the gradient band reads the same at this size. It is a drop-in upgrade later.

**Shared-element transitions:** Reanimated 4's `sharedTransitionTag` needs the `ENABLE_SHARED_ELEMENT_TRANSITIONS` static flag and a native rebuild (it doesn't work in Expo Go). List ↔ catalog uses in-screen spring layout transitions instead. List → detail uses a spring "lift" of the document thumbnail. Turning on true shared elements is a one-line flag in a development build.

## 4. Data integrity rules

1. Progress steps derive from live data:
   - Started = has a name;
   - Emergency = readiness is Ready;
   - Medication = ≥ 1 active medication;
   - Record = ≥ 1 record;
   - Biometrics = biometric lock on.
2. Emergency **Ready** = known blood group + allergies stated + an emergency contact with a phone number. Anything missing is listed by name.
3. Unknown values always read **Unknown**. Empty allergy lists read **No allergies recorded**, never "None" (absence of a record is not absence of an allergy).
4. Adherence shows only when the 7-day window contains logged doses for scheduled medications.
5. Translations never touch doses or units. Medication strings are not run through `t()`.

## 5. Implementation order (one commit each)

1. Plan + tokens + core primitives (`PressableScale`, `Glass`, `CountUp`, `ProgressRing`, `Chip`, `useTabBarInset`, motion presets)
2. Home
3. Navigation (glass bar, Assistant tab, Diary under Calendar, inset fix across screens)
4. Records (thumbnails, catalog, pinch, transitions)
5. Emergency / ICE
6. Assistant
7. Sharing + Settings + More (token pass, avatar menu)

## 6. Verification

There is no Android SDK or iOS simulator on the development machine (Windows). Interactions are verified on **Expo web** in Chrome (react-native-web + Reanimated): layout, flips, staggered entrances, catalog, assistant streaming, long-string languages. Native-only material is verified to *fall back* correctly on web (glass → blur/solid, gyro tilt → static). The native glass and gyro paths still need a pass on a device in Expo Go or a development build. That pass is listed as an open item.

## 7. Open items

- [ ] **On-device pass.** Native paths still need checking on a device in Expo Go or a development build: liquid glass (iOS 26+), gyro tilt on the passport card, haptics, the Android RefreshControl colours and keyboard behaviour in the Assistant composer.
- [ ] **Dark mode on device.** Tokens and screens have dark values. Web never applies NativeWind's `dark` class, so dark mode wasn't visible in the web pass.
- [ ] **Translations.** The new copy (readiness, Today, Assistant cards, catalog) is English, with English fallback in the other six languages. Only `tabs.assistant` was added in all seven. Layouts were checked in isiZulu at 320px. Medication names, doses and units are never passed through `t()`.
- [ ] **Remaining screens.** Diary, Calendar day, Timeline, Notifications, Medications and Upload got the inset and scroll fixes but not a full token pass. They still use NativeWind classes with older colours.
- [ ] **Pre-existing nested-button warning.** `DiaryRow` puts a pressable inside a pressable inside `Swipeable`. React warns about it on web.
- [ ] **Optional.** Enable Reanimated shared-element transitions in a development build. Skia shader for the passport sheen.

## 8. Verification log

Run on Expo web in headless Chrome, driven through the DevTools protocol (mobile emulation, 390×844 and 320×640, touch on):

| Check | Result |
|---|---|
| Typecheck (`tsc --noEmit`) and lint (`expo lint`) after every commit | Clean |
| Web export (`expo export -p web`), all routes | Builds |
| Home order, live progress (12 records → Record step done) | ✓ |
| Passport card flip (tap) to ICE side with QR; finger tilt + sheen | ✓ |
| "Not sure" blood group → Unknown (dashed) on Home, ICE, chips; readiness lists what's missing | ✓ |
| Avatar menu (Profile, Settings, Language, Sign out) | ✓ |
| Glass tab bar, active pill morph, Calendar ↔ Diary switch keeps the Calendar tab lit | ✓ |
| Records list thumbnails, catalog toggle, detail "lift" | ✓ (pinch needs a touch device) |
| Assistant: shortcut → streaming reply → HbA1c and dose cards; dose tap updates Home | ✓ |
| Sub-screens no longer double the top inset or hide content under the bar | ✓ |
| isiZulu at 320px with reduce motion: no truncation, no animation | ✓ (after the narrow-width fix) |

Bugs found and fixed during verification:
- NativeWind drops function `style` props on `Pressable` with `className`, so card and FAB backgrounds vanished.
- The absolute blur layer in `Glass` painted over its own content on web.
- Token colours followed the OS scheme while NativeWind rendered light.
- Header and card overflowed at 320px.
