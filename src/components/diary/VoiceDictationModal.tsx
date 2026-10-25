import {
  Mic,
  MicOff,
  RotateCcw,
  Sparkles,
  Volume2,
  X,
} from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/ui/PressableScale';
import { Txt } from '@/components/ui/Txt';
import { elevation, fonts, radii } from '@/design/tokens';
import { useTokens } from '@/design/useTokens';
import { impactFeedback, tapFeedback } from '@/lib/feedback';
import {
  CLINICAL_VOICE_TEMPLATES,
  isSpeechRecognitionSupported,
  startVoiceDictation,
  stopVoiceDictation,
} from '@/lib/voiceDictation';

interface VoiceDictationModalProps {
  visible: boolean;
  onClose: () => void;
  onInsertText: (text: string, mode: 'append' | 'replace') => void;
  onAttachVoiceNote?: (name: string, duration: string) => void;
  existingBody?: string;
}

const SUPPORTED_LANGUAGES = [
  { code: 'en-ZA', label: 'English (ZA)' },
  { code: 'zu-ZA', label: 'isiZulu' },
  { code: 'af-ZA', label: 'Afrikaans' },
];

export function VoiceDictationModal({
  visible,
  onClose,
  onInsertText,
  onAttachVoiceNote,
  existingBody = '',
}: VoiceDictationModalProps) {
  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <VoiceDictationSheet
        onClose={onClose}
        onInsertText={onInsertText}
        onAttachVoiceNote={onAttachVoiceNote}
        existingBody={existingBody}
      />
    </Modal>
  );
}

function VoiceDictationSheet({
  onClose,
  onInsertText,
  onAttachVoiceNote,
  existingBody,
}: Omit<VoiceDictationModalProps, 'visible'>) {
  const t = useTokens();
  const insets = useSafeAreaInsets();
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState('en-ZA');
  const [speechSupported] = useState(() => isSpeechRecognitionSupported());

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopListeningRef = useRef<(() => void) | null>(null);

  // Reanimated pulse for listening ring
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.6);

  useEffect(() => {
    if (isListening) {
      pulseScale.value = withRepeat(
        withSequence(withTiming(1.35, { duration: 900 }), withTiming(1, { duration: 900 })),
        -1,
        true
      );
      pulseOpacity.value = withRepeat(
        withSequence(withTiming(0.15, { duration: 900 }), withTiming(0.7, { duration: 900 })),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 300 });
      pulseOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [isListening, pulseOpacity, pulseScale]);

  const animatedWaveStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const startListening = () => {
    impactFeedback('medium');
    setIsListening(true);
    setElapsedSeconds(0);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsedSeconds((sec) => sec + 1);
    }, 1000);

    if (speechSupported) {
      const stopFn = startVoiceDictation({
        lang: selectedLanguage,
        onResult: (text) => {
          setTranscript(text);
        },
        onError: () => {
          setIsListening(false);
        },
        onEnd: () => {
          setIsListening(false);
        },
      });
      stopListeningRef.current = stopFn;
    }
  };

  const stopListening = () => {
    impactFeedback('light');
    setIsListening(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (stopListeningRef.current) {
      stopListeningRef.current();
      stopListeningRef.current = null;
    }
    stopVoiceDictation();
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopVoiceDictation();
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleApplyTemplate = (text: string) => {
    tapFeedback();
    setTranscript((prev) => (prev ? `${prev}\n${text}` : text));
  };

  const handleInsert = (mode: 'append' | 'replace') => {
    if (!transcript.trim()) return;
    impactFeedback('medium');
    onInsertText(transcript.trim(), mode);
    stopListening();
    onClose();
  };

  const handleSaveVoiceAttachment = () => {
    if (!onAttachVoiceNote) return;
    impactFeedback('medium');
    const dur = formatTime(Math.max(elapsedSeconds, 1));
    const nowLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    onAttachVoiceNote(`Voice Note (${nowLabel})`, dur);
    if (transcript.trim()) {
      onInsertText(transcript.trim(), 'append');
    }
    stopListening();
    onClose();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        style={{
          backgroundColor: t.surface,
          borderTopLeftRadius: radii.xl,
          borderTopRightRadius: radii.xl,
          maxHeight: '90%',
          paddingBottom: insets.bottom + 14,
        }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingTop: 18,
            paddingBottom: 14,
            borderBottomWidth: 1,
            borderBottomColor: t.border,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: radii.md,
                backgroundColor: 'rgba(220, 31, 38, 0.12)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Mic size={20} color="#DC1F26" />
            </View>
            <View>
              <Txt variant="headline">Voice Dictation</Txt>
              <Txt variant="footnote" tone="muted">
                {isListening ? 'Listening... Speak clearly' : 'Tap microphone to start dictating'}
              </Txt>
            </View>
          </View>
          <PressableScale
            accessibilityLabel="Close"
            onPress={() => {
              stopListening();
              onClose();
            }}
            style={{
              width: 36,
              height: 36,
              borderRadius: radii.pill,
              backgroundColor: t.surfaceMuted,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} color={t.text} />
          </PressableScale>
        </View>

        <ScrollView
          style={{ flex: 1, paddingHorizontal: 20 }}
          contentContainerStyle={{ paddingVertical: 18, gap: 18 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Animated Microphone & Timer Controller */}
          <View style={{ alignItems: 'center', paddingVertical: 12 }}>
            <View style={{ width: 110, height: 110, alignItems: 'center', justifyContent: 'center' }}>
              {/* Outer pulsing ring */}
              <Animated.View
                style={[
                  {
                    position: 'absolute',
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    backgroundColor: 'rgba(220, 31, 38, 0.25)',
                  },
                  animatedWaveStyle,
                ]}
              />

              {/* Main Microphone Button */}
              <PressableScale
                onPress={isListening ? stopListening : startListening}
                style={[
                  {
                    width: 74,
                    height: 74,
                    borderRadius: 37,
                    backgroundColor: isListening ? '#DC1F26' : t.surfaceMuted,
                    borderWidth: 2,
                    borderColor: isListening ? '#DC1F26' : t.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                  elevation[2],
                ]}
              >
                {isListening ? (
                  <Mic size={34} color="#FFFFFF" />
                ) : (
                  <MicOff size={30} color={t.textMuted} />
                )}
              </PressableScale>
            </View>

            {/* Elapsed Time & Listening Badge */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: isListening ? '#DC1F26' : t.textMuted,
                }}
              />
              <Txt variant="callout" style={{ fontFamily: fonts.bold, fontSize: 16 }}>
                {formatTime(elapsedSeconds)}
              </Txt>
              <Txt variant="footnote" tone="muted">
                {isListening ? '· Tap to Pause' : '· Tap to Resume'}
              </Txt>
            </View>

            {/* Language Selector Chips */}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = selectedLanguage === lang.code;
                return (
                  <PressableScale
                    key={lang.code}
                    onPress={() => {
                      tapFeedback();
                      setSelectedLanguage(lang.code);
                    }}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: radii.pill,
                      backgroundColor: isSelected ? 'rgba(14, 116, 144, 0.12)' : t.surfaceMuted,
                      borderWidth: 1,
                      borderColor: isSelected ? t.accent : t.border,
                    }}
                  >
                    <Txt
                      variant="footnote"
                      style={{
                        fontFamily: isSelected ? fonts.semibold : fonts.regular,
                        color: isSelected ? t.accent : t.textMuted,
                        fontSize: 11,
                      }}
                    >
                      {lang.label}
                    </Txt>
                  </PressableScale>
                );
              })}
            </View>
          </View>

          {/* Live Transcript Area */}
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Txt variant="label" tone="muted">
                TRANSCRIBED NOTE TEXT
              </Txt>
              {transcript.length > 0 && (
                <PressableScale
                  onPress={() => setTranscript('')}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                >
                  <RotateCcw size={12} color={t.textMuted} />
                  <Txt variant="footnote" tone="muted" style={{ fontSize: 12 }}>
                    Clear
                  </Txt>
                </PressableScale>
              )}
            </View>

            <TextInput
              value={transcript}
              onChangeText={setTranscript}
              placeholder={
                speechSupported
                  ? 'Start speaking... Your voice will appear here in real time.'
                  : 'Speak naturally, tap a prompt below, or use the microphone key on your device keyboard.'
              }
              placeholderTextColor={t.textMuted}
              multiline
              textAlignVertical="top"
              style={{
                fontSize: 15,
                lineHeight: 22,
                color: t.text,
                backgroundColor: t.surfaceMuted,
                borderRadius: radii.lg,
                padding: 14,
                borderWidth: 1,
                borderColor: t.border,
                minHeight: 120,
              }}
            />
          </View>

          {/* Quick Structured Clinical Prompts */}
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Sparkles size={14} color={t.accent} />
              <Txt variant="label" tone="muted">
                QUICK CLINICAL PROMPTS
              </Txt>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {CLINICAL_VOICE_TEMPLATES.map((tmpl) => (
                <PressableScale
                  key={tmpl.title}
                  onPress={() => handleApplyTemplate(tmpl.text)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: radii.md,
                    backgroundColor: t.surfaceMuted,
                    borderWidth: 1,
                    borderColor: t.border,
                  }}
                >
                  <Txt variant="footnote" style={{ fontFamily: fonts.medium, fontSize: 12 }}>
                    + {tmpl.title}
                  </Txt>
                </PressableScale>
              ))}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={{ gap: 10, marginTop: 8 }}>
            <PressableScale
              disabled={!transcript.trim()}
              onPress={() => handleInsert(existingBody?.trim() ? 'append' : 'replace')}
              style={[
                {
                  height: 48,
                  borderRadius: radii.pill,
                  backgroundColor: transcript.trim() ? '#16A34A' : t.surfaceMuted,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                transcript.trim() ? elevation[2] : null,
              ]}
            >
              <Txt
                variant="callout"
                style={{
                  fontFamily: fonts.semibold,
                  color: transcript.trim() ? '#FFFFFF' : t.textMuted,
                }}
              >
                {existingBody?.trim() ? 'Append to My Note' : 'Insert into Note'}
              </Txt>
            </PressableScale>

            {onAttachVoiceNote && (
              <PressableScale
                onPress={handleSaveVoiceAttachment}
                style={{
                  height: 44,
                  borderRadius: radii.pill,
                  backgroundColor: t.surfaceMuted,
                  borderWidth: 1,
                  borderColor: t.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 8,
                }}
              >
                <Volume2 size={16} color={t.accent} />
                <Txt variant="footnote" color={t.accent} style={{ fontFamily: fonts.semibold }}>
                  Save Voice Note Attachment ({formatTime(elapsedSeconds)})
                </Txt>
              </PressableScale>
            )}
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
