import dayjs from 'dayjs';
import { useLocalSearchParams } from 'expo-router';
import { ArrowUp, ChevronLeft, ChevronRight, Lock, Sparkles, ShieldCheck } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnswerCard } from '@/components/assistant/AnswerCards';
import { StreamingText } from '@/components/assistant/StreamingText';
import { Glass } from '@/components/ui/Glass';
import { PressableScale } from '@/components/ui/PressableScale';
import { Txt } from '@/components/ui/Txt';
import { elevation, fonts, radii, springs } from '@/design/tokens';
import { useTokens } from '@/design/useTokens';
import { assistantGreeting, quickCommands, type AssistantMessage } from '@/data/assistant';
import { useAboveTabBar } from '@/hooks/useTabBarInset';
import { askAssistant } from '@/lib/assistantEngine';
import { todayKey } from '@/lib/date';
import { tapFeedback } from '@/lib/feedback';
import { useAppStore } from '@/store/useAppStore';

function makeId() {
  return `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function dayLabel(key: string) {
  const d = dayjs(key);
  if (d.isSame(dayjs(), 'day')) return 'Today';
  if (d.isSame(dayjs().subtract(1, 'day'), 'day')) return 'Yesterday';
  return d.format('ddd D MMM');
}

/**
 * Siyashesha Assistant. Powered by Google Gemini 3.8 Flash with full clinical context,
 * clinical safety guardrails, rich cards, and automatic on-device offline fallback.
 */
export default function AssistantScreen() {
  const t = useTokens();
  const insets = useSafeAreaInsets();
  const aboveTabBar = useAboveTabBar(10);
  const reduced = useReducedMotion();
  const params = useLocalSearchParams<{ q?: string }>();
  const patient = useAppStore((s) => s.patientProfile);
  const recordCount = useAppStore((s) => s.records.length);
  const threads = useAppStore((s) => s.assistantThreads);
  const addMessage = useAppStore((s) => s.addAssistantMessage);

  const today = todayKey();
  const days = useMemo(() => {
    const keys = Object.keys(threads).filter((k) => threads[k]?.length);
    if (!keys.includes(today)) keys.push(today);
    return keys.sort();
  }, [threads, today]);
  const [dayIndex, setDayIndex] = useState<number | null>(null);
  const activeIndex = dayIndex ?? days.length - 1;
  const activeDay = days[activeIndex] ?? today;
  const isToday = activeDay === today;
  const messages = threads[activeDay] ?? [];
  const greeting = assistantGreeting(patient.preferredName || patient.firstName || '');

  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  // Only replies created in this session stream in; history renders at once.
  const [fresh, setFresh] = useState<ReadonlySet<string>>(() => new Set());
  const [cardsShown, setCardsShown] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const handledQ = useRef<string | undefined>(undefined);

  const scrollToEnd = () => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: !reduced }), 60);

  const send = async (raw: string) => {
    const value = raw.trim();
    if (!value || thinking) return;
    tapFeedback();
    setDayIndex(null);
    const userMsg: AssistantMessage = { id: makeId(), sender: 'user', text: value, timestamp: new Date().toISOString() };
    addMessage(today, userMsg);
    setInput('');
    setThinking(true);
    scrollToEnd();

    try {
      const reply = await askAssistant(value, {
        recordCount,
        history: [...(threads[today] ?? []), userMsg],
      });
      const assistantMsg: AssistantMessage = {
        id: makeId(),
        sender: 'assistant',
        text: reply.text,
        card: reply.card,
        timestamp: new Date().toISOString(),
      };
      setFresh((f) => new Set(f).add(assistantMsg.id));
      setThinking(false);
      addMessage(today, assistantMsg);
      scrollToEnd();
    } catch {
      const fallbackMsg: AssistantMessage = {
        id: makeId(),
        sender: 'assistant',
        text: "I'm not sure about that yet, but your clinician or clinic sister can help. You can also pick a numbered shortcut or ask about your records, medications, or emergency profile.",
        timestamp: new Date().toISOString(),
      };
      setFresh((f) => new Set(f).add(fallbackMsg.id));
      setThinking(false);
      addMessage(today, fallbackMsg);
      scrollToEnd();
    }
  };

  // A question handed over from Home's Ask bar.
  useEffect(() => {
    if (params.q && handledQ.current !== params.q) {
      handledQ.current = params.q;
      send(params.q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.q]);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: t.canvas }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header with model badge and day pager */}
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.interactive, alignItems: 'center', justifyContent: 'center' }}>
          <Sparkles size={18} color={t.scheme === 'dark' ? '#0B1024' : '#FFFFFF'} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Txt variant="bodyStrong">Siyashesha AI</Txt>
            <View style={{ backgroundColor: t.interactiveSoft, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radii.pill, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <ShieldCheck size={11} color={t.interactive} />
              <Txt variant="footnote" color={t.interactive} style={{ fontFamily: fonts.semibold, fontSize: 10 }}>
                Gemini 3.8 Flash
              </Txt>
            </View>
          </View>
          <Txt variant="footnote" tone="muted" style={{ fontSize: 12 }}>
            {thinking ? 'Gemini is thinking…' : 'Clinical safety guardrails active'}
          </Txt>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <PressableScale
            accessibilityLabel="Previous day's conversation"
            disabled={activeIndex === 0}
            onPress={() => setDayIndex(activeIndex - 1)}
            haptic="selection"
            style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', opacity: activeIndex === 0 ? 0.35 : 1 }}
          >
            <ChevronLeft size={20} color={t.text} />
          </PressableScale>
          <Txt variant="callout" style={{ minWidth: 68, textAlign: 'center', fontFamily: fonts.medium }}>
            {dayLabel(activeDay)}
          </Txt>
          <PressableScale
            accessibilityLabel="Next day's conversation"
            disabled={activeIndex === days.length - 1}
            onPress={() => setDayIndex(activeIndex + 1)}
            haptic="selection"
            style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', opacity: activeIndex === days.length - 1 ? 0.35 : 1 }}
          >
            <ChevronRight size={20} color={t.text} />
          </PressableScale>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        key={activeDay}
        onContentSizeChange={scrollToEnd}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: aboveTabBar + 72, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting and numbered shortcuts */}
        <Animated.View entering={reduced ? undefined : FadeIn.duration(300)} style={{ gap: 14 }}>
          <Txt variant="title">{isToday ? greeting.title : dayjs(activeDay).format('dddd D MMMM')}</Txt>
          {isToday ? (
            <>
              <Txt variant="body" tone="muted">
                {greeting.body}
              </Txt>
              <View style={{ gap: 8 }}>
                {quickCommands.map((c, i) => (
                  <Animated.View key={c.number} entering={reduced ? undefined : FadeInDown.delay(80 + i * 45).springify().damping(springs.gentle.damping)}>
                    <PressableScale
                      accessibilityLabel={`${c.number}. ${c.label}`}
                      onPress={() => send(String(c.number))}
                      scaleTo={0.98}
                      style={[{ minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 14, borderRadius: radii.md, backgroundColor: t.surface }, elevation[1]]}
                    >
                      <View style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: t.interactiveSoft, alignItems: 'center', justifyContent: 'center' }}>
                        <Txt variant="footnote" color={t.interactive} style={{ fontFamily: fonts.bold }}>
                          {c.number}
                        </Txt>
                      </View>
                      <Txt variant="callout" style={{ flex: 1, fontFamily: fonts.medium }}>
                        {c.label}
                      </Txt>
                      <Txt variant="footnote" tone="muted">
                        Tap or reply {c.number}
                      </Txt>
                    </PressableScale>
                  </Animated.View>
                ))}
              </View>
            </>
          ) : null}
        </Animated.View>

        {/* Message history */}
        {messages.map((m) =>
          m.sender === 'user' ? (
            <Animated.View
              key={m.id}
              entering={reduced ? undefined : FadeInDown.duration(200)}
              style={{
                alignSelf: 'flex-end',
                maxWidth: '82%',
                backgroundColor: t.interactive,
                borderRadius: radii.lg,
                borderBottomRightRadius: radii.xs,
                paddingHorizontal: 16,
                paddingVertical: 12,
              }}
            >
              <Txt variant="body" color={t.scheme === 'dark' ? '#0B1024' : '#FFFFFF'}>
                {m.text}
              </Txt>
              <Txt variant="footnote" color={t.scheme === 'dark' ? '#0B1024' : '#FFFFFF'} style={{ opacity: 0.75, textAlign: 'right', marginTop: 4, fontSize: 11 }}>
                {dayjs(m.timestamp).format('h:mm A')}
              </Txt>
            </Animated.View>
          ) : (
            <View key={m.id} style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: t.interactiveSoft, alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                <Sparkles size={13} color={t.interactive} />
              </View>
              <View style={{ flex: 1 }}>
                <StreamingText
                  text={m.text}
                  animate={fresh.has(m.id)}
                  onDone={() => {
                    setCardsShown((c) => (c[m.id] ? c : { ...c, [m.id]: true }));
                    scrollToEnd();
                  }}
                />
                {m.card && (cardsShown[m.id] || !fresh.has(m.id)) ? <AnswerCard card={m.card} /> : null}
              </View>
            </View>
          )
        )}

        {thinking ? <Thinking /> : null}

        {!isToday && messages.length === 0 ? (
          <Txt variant="callout" tone="muted">
            No conversation on this day.
          </Txt>
        ) : null}

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 4 }}>
          <Lock size={12} color={t.textMuted} />
          <Txt variant="footnote" tone="muted" style={{ fontSize: 11, textAlign: 'center', flexShrink: 1 }}>
            Powered by Gemini 3.8 Flash & Local Vault · Guardrails active · Educational guidance only
          </Txt>
        </View>
      </ScrollView>

      {/* Composer, floating above the tab bar */}
      <View style={{ position: 'absolute', left: 16, right: 16, bottom: aboveTabBar }} pointerEvents="box-none">
        <Glass
          style={[
            { minHeight: 56, borderRadius: 28, flexDirection: 'row', alignItems: 'center', paddingLeft: 18, paddingRight: 6, borderWidth: 1, borderColor: t.hairline },
            elevation[2],
          ]}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={isToday ? 'Ask clinical assistant, or type a number' : 'Go to today to ask'}
            editable={isToday}
            placeholderTextColor={t.textMuted}
            returnKeyType="send"
            onSubmitEditing={() => send(input)}
            accessibilityLabel="Message Siyashesha Clinical AI"
            style={{ flex: 1, minHeight: 48, fontFamily: fonts.regular, fontSize: 16, color: t.text }}
          />
          <PressableScale
            accessibilityLabel="Send message"
            disabled={!input.trim() || thinking}
            onPress={() => send(input)}
            scaleTo={0.9}
            style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: input.trim() && !thinking ? t.interactive : t.border }}
          >
            <ArrowUp size={20} color={t.scheme === 'dark' ? '#0B1024' : '#FFFFFF'} />
          </PressableScale>
        </Glass>
      </View>
    </KeyboardAvoidingView>
  );
}

/** Three soft dots that breathe in sequence while a reply is prepared. */
function Thinking() {
  const t = useTokens();
  return (
    <View accessibilityLabel="Siyashesha is thinking" style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
      <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: t.interactiveSoft, alignItems: 'center', justifyContent: 'center' }}>
        <Sparkles size={13} color={t.interactive} />
      </View>
      <View style={{ flexDirection: 'row', gap: 5 }}>
        {[0, 1, 2].map((i) => (
          <Dot key={i} delay={i * 140} color={t.textMuted} />
        ))}
      </View>
    </View>
  );
}

function Dot({ delay, color }: { delay: number; color: string }) {
  const reduced = useReducedMotion();
  const v = useSharedValue(0.3);
  useEffect(() => {
    if (reduced) return;
    v.value = withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: 380 }), withTiming(0.3, { duration: 380 })), -1));
  }, [delay, reduced, v]);
  const style = useAnimatedStyle(() => ({ opacity: v.value, transform: [{ translateY: (1 - v.value) * 2 }] }));
  return <Animated.View style={[{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }, style]} />;
}
