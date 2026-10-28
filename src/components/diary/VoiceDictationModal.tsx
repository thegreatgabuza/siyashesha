import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import {
  Mic,
  MicOff,
  RotateCcw,
  Volume2,
  X,
} from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
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
import { useToast } from '@/components/ui/Toast';
import { elevation, fonts, radii } from '@/design/tokens';
import { useTokens } from '@/design/useTokens';
import { impactFeedback, tapFeedback } from '@/lib/feedback';
import { transcribeAudioWithGemini } from '@/lib/audioTranscription';
import {
  CLINICAL_VOICE_TEMPLATES,
  isWebSpeechSupported,
  startVoiceDictation,
  stopVoiceDictation,
} from '@/lib/voiceDictation';

interface VoiceDictationModalProps {
  visible: boolean;
  onClose: () => void;
  onInsertText: (text: string, mode: 'append' | 'replace') => void;
  onAttachVoiceNote?: (name: string, duration: string, uri?: string) => void;
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
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
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
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState('en-ZA');
  const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null);

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopListeningRef = useRef<(() => void) | null>(null);
  const isUsingAudioRecorderRef = useRef(false);
  const baseTranscriptRef = useRef('');
  const latestTranscriptRef = useRef('');

  const updateTranscript = (next: string | ((prev: string) => string)) => {
    setTranscript((prev) => {
      const resolved = typeof next === 'function' ? next(prev) : next;
      latestTranscriptRef.current = resolved;
      return resolved;
    });
  };

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

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startAudioRecording = async (): Promise<boolean> => {
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        toast.show('Microphone permission is required for voice dictation.', 'warning');
        setIsListening(false);
        clearTimer();
        return false;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      try {
        await audioRecorder.prepareToRecordAsync();
      } catch (prepErr) {
        const status = audioRecorder.getStatus();
        if (!status?.canRecord) {
          throw prepErr;
        }
      }

      audioRecorder.record();
      isUsingAudioRecorderRef.current = true;
      return true;
    } catch (recErr) {
      console.error('Audio recorder error:', recErr);
      toast.show('Could not start microphone recording. Check microphone permissions.', 'warning');
      setIsListening(false);
      clearTimer();
      isUsingAudioRecorderRef.current = false;
      return false;
    }
  };

  const startListening = async () => {
    if (isListening || isTranscribing) return;
    impactFeedback('medium');
    baseTranscriptRef.current = latestTranscriptRef.current.trim();
    setIsListening(true);
    setElapsedSeconds(0);

    clearTimer();
    timerRef.current = setInterval(() => {
      setElapsedSeconds((sec) => sec + 1);
    }, 1000);

    const isWeb = Platform.OS === 'web';
    const webSpeechActive = isWeb && isWebSpeechSupported();

    if (webSpeechActive) {
      const stopFn = startVoiceDictation({
        lang: selectedLanguage,
        onResult: (text) => {
          const base = baseTranscriptRef.current;
          updateTranscript(base ? `${base}\n${text}` : text);
        },
        onError: (err) => {
          console.warn('Web Speech error:', err);
          if (err.includes('not-allowed') || err.includes('permission')) {
            toast.show('Microphone access was blocked by the browser.', 'warning');
            setIsListening(false);
            clearTimer();
            return;
          }
          // Fall back to audio recorder + transcription
          void startAudioRecording();
        },
        onEnd: () => {
          if (!isUsingAudioRecorderRef.current) {
            setIsListening(false);
            clearTimer();
          }
        },
      });
      stopListeningRef.current = stopFn;
    } else {
      await startAudioRecording();
    }
  };

  const stopListening = async (): Promise<{ uri: string | null; text: string }> => {
    impactFeedback('light');
    setIsListening(false);
    clearTimer();

    if (stopListeningRef.current) {
      stopListeningRef.current();
      stopListeningRef.current = null;
    }
    stopVoiceDictation();

    let recorderActive = isUsingAudioRecorderRef.current;
    try {
      if (audioRecorder.isRecording || audioRecorder.getStatus()?.isRecording) {
        recorderActive = true;
      }
    } catch {
      // Ignore status check error if already released
    }

    if (recorderActive) {
      isUsingAudioRecorderRef.current = false;
      try {
        let preStopUri: string | null = null;
        try {
          preStopUri = audioRecorder.uri || audioRecorder.getStatus()?.url || null;
        } catch {
          // Ignore
        }

        const stopResult: any = await audioRecorder.stop();
        const uri: string | null =
          stopResult?.url ||
          audioRecorder.uri ||
          audioRecorder.getStatus()?.url ||
          preStopUri ||
          null;

        await setAudioModeAsync({
          allowsRecording: false,
          playsInSilentMode: true,
        }).catch(() => {});

        if (uri) {
          setRecordedAudioUri(uri);
          setIsTranscribing(true);
          try {
            const transcribed = await transcribeAudioWithGemini(uri, selectedLanguage);
            if (transcribed) {
              const base = latestTranscriptRef.current.trim();
              const combined = base ? `${base}\n${transcribed}` : transcribed;
              updateTranscript(combined);
              impactFeedback('medium');
              toast.show('Voice note transcribed', 'success');
              return { uri, text: combined };
            }
          } catch (transcribeErr: any) {
            console.warn('Audio transcription error:', transcribeErr);
            toast.show(
              'Voice note recorded! Could not auto-transcribe right now — you can save the voice note or type below.',
              'warning'
            );
          } finally {
            setIsTranscribing(false);
          }
          return { uri, text: latestTranscriptRef.current };
        } else {
          toast.show('No audio was captured. Please try speaking again.', 'warning');
        }
      } catch (stopErr) {
        console.error('Failed to stop audio recording:', stopErr);
        setIsTranscribing(false);
      }
    }

    return { uri: recordedAudioUri, text: latestTranscriptRef.current };
  };

  useEffect(() => {
    return () => {
      clearTimer();
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
    updateTranscript((prev) => (prev.trim() ? `${prev.trim()}\n${text}` : text));
  };

  const handlePrimaryAction = async () => {
    if (isListening && !latestTranscriptRef.current.trim()) {
      await stopListening();
      return;
    }

    let finalText = latestTranscriptRef.current.trim();
    if (isListening) {
      const result = await stopListening();
      finalText = result.text.trim();
    }
    if (!finalText) return;

    impactFeedback('medium');
    onInsertText(finalText, existingBody?.trim() ? 'append' : 'replace');
    onClose();
  };

  const handleSaveVoiceAttachment = async () => {
    if (!onAttachVoiceNote) return;
    impactFeedback('medium');
    const dur = formatTime(Math.max(elapsedSeconds, 1));
    let finalUri = recordedAudioUri;
    let finalText = latestTranscriptRef.current.trim();

    if (isListening) {
      const result = await stopListening();
      finalUri = result.uri || finalUri;
      finalText = result.text.trim();
    }

    const nowLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    onAttachVoiceNote(`Voice Note (${nowLabel})`, dur, finalUri || undefined);
    if (finalText) {
      onInsertText(finalText, existingBody?.trim() ? 'append' : 'replace');
    }
    onClose();
  };

  const handleClose = () => {
    void stopListening();
    onClose();
  };

  const hasTranscript = transcript.trim().length > 0;
  const canPressPrimary = (hasTranscript || isListening) && !isTranscribing;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15, 23, 42, 0.55)' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Backdrop press to dismiss */}
      <Pressable
        accessibilityLabel="Dismiss voice dictation"
        onPress={handleClose}
        style={{ flex: 1 }}
      />

      <View
        style={{
          backgroundColor: t.surface,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          maxHeight: '88%',
          paddingBottom: Math.max(insets.bottom, 16),
          borderTopWidth: 1,
          borderColor: t.border,
        }}
      >
        {/* Drag Handle */}
        <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 4 }}>
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: t.border,
            }}
          />
        </View>

        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 14,
            borderBottomWidth: 1,
            borderBottomColor: t.border,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: radii.md,
                backgroundColor: 'rgba(220, 31, 38, 0.12)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Mic size={20} color="#DC1F26" />
            </View>
            <View style={{ flex: 1 }}>
              <Txt variant="headline">Voice Dictation</Txt>
              <Txt variant="footnote" tone="muted">
                {isListening
                  ? 'Listening… Speak clearly in your language'
                  : isTranscribing
                  ? 'Transcribing your voice note…'
                  : 'Tap the microphone below to start speaking'}
              </Txt>
            </View>
          </View>
          <PressableScale
            accessibilityLabel="Close"
            onPress={handleClose}
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
          style={{ flexShrink: 1, paddingHorizontal: 20 }}
          contentContainerStyle={{ paddingVertical: 16, gap: 16 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Animated Microphone & Timer Controller */}
          <View
            style={{
              alignItems: 'center',
              paddingVertical: 14,
              paddingHorizontal: 16,
              borderRadius: radii.lg,
              backgroundColor: t.surfaceMuted,
              borderWidth: 1,
              borderColor: t.border,
            }}
          >
            <View style={{ width: 96, height: 96, alignItems: 'center', justifyContent: 'center' }}>
              {/* Outer pulsing ring */}
              <Animated.View
                style={[
                  {
                    position: 'absolute',
                    width: 92,
                    height: 92,
                    borderRadius: 46,
                    backgroundColor: 'rgba(220, 31, 38, 0.22)',
                  },
                  animatedWaveStyle,
                ]}
              />

              {/* Main Microphone Button */}
              <PressableScale
                accessibilityLabel={isListening ? 'Stop recording' : 'Start recording'}
                onPress={() => {
                  if (isListening) {
                    void stopListening();
                  } else {
                    void startListening();
                  }
                }}
                disabled={isTranscribing}
                style={[
                  {
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    backgroundColor: isListening ? '#DC1F26' : '#FFFFFF',
                    borderWidth: 2,
                    borderColor: '#DC1F26',
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                  elevation[2],
                ]}
              >
                {isTranscribing ? (
                  <ActivityIndicator size="small" color="#DC1F26" />
                ) : isListening ? (
                  <Mic size={32} color="#FFFFFF" />
                ) : (
                  <Mic size={30} color="#DC1F26" />
                )}
              </PressableScale>
            </View>

            {/* Elapsed Time & Listening Badge */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: isListening ? '#DC1F26' : isTranscribing ? t.accent : t.textMuted,
                }}
              />
              <Txt variant="callout" style={{ fontFamily: fonts.bold, fontSize: 16 }}>
                {formatTime(elapsedSeconds)}
              </Txt>
              <Txt variant="footnote" tone="muted">
                {isListening
                  ? '· Tap mic to stop'
                  : isTranscribing
                  ? '· Transcribing your voice…'
                  : '· Tap mic to start speaking'}
              </Txt>
            </View>

            {/* Language Selector Chips */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 12 }}>
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = selectedLanguage === lang.code;
                return (
                  <PressableScale
                    key={lang.code}
                    disabled={isListening || isTranscribing}
                    onPress={() => {
                      tapFeedback();
                      setSelectedLanguage(lang.code);
                    }}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: radii.pill,
                      backgroundColor: isSelected ? 'rgba(14, 116, 144, 0.14)' : t.surface,
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
                YOUR NOTE TEXT
              </Txt>
              {transcript.length > 0 && (
                <PressableScale
                  onPress={() => updateTranscript('')}
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
              onChangeText={updateTranscript}
              placeholder={
                isTranscribing
                  ? 'Transcribing your voice note…'
                  : isListening
                  ? 'Listening… Tap the microphone button when you finish speaking.'
                  : 'Your dictated words will appear here, or tap a quick prompt below.'
              }
              placeholderTextColor={t.textMuted}
              multiline
              textAlignVertical="top"
              editable={!isTranscribing}
              style={{
                fontSize: 15,
                lineHeight: 22,
                color: t.text,
                backgroundColor: t.surfaceMuted,
                borderRadius: radii.lg,
                padding: 14,
                borderWidth: 1,
                borderColor: t.border,
                minHeight: 100,
              }}
            />
          </View>

          {/* Quick Structured Clinical Prompts */}
          <View style={{ gap: 8 }}>
            <Txt variant="label" tone="muted">
              QUICK PROMPTS
            </Txt>
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
        </ScrollView>

        {/* Pinned Bottom Action Buttons — always visible and accessible */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: t.border,
            gap: 10,
          }}
        >
          <PressableScale
            disabled={!canPressPrimary}
            onPress={() => {
              void handlePrimaryAction();
            }}
            style={[
              {
                height: 48,
                borderRadius: radii.pill,
                backgroundColor: !canPressPrimary
                  ? t.surfaceMuted
                  : isListening && !hasTranscript
                  ? '#DC1F26'
                  : '#16A34A',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
              },
              canPressPrimary ? elevation[2] : null,
            ]}
          >
            {isListening && !hasTranscript ? (
              <MicOff size={18} color="#FFFFFF" />
            ) : null}
            <Txt
              variant="callout"
              style={{
                fontFamily: fonts.semibold,
                color: canPressPrimary ? '#FFFFFF' : t.textMuted,
              }}
            >
              {isTranscribing
                ? 'Transcribing Voice Note…'
                : isListening && !hasTranscript
                ? 'Stop & Transcribe Voice'
                : existingBody?.trim()
                ? 'Append to My Note'
                : 'Insert into Note'}
            </Txt>
          </PressableScale>

          {onAttachVoiceNote && (
            <PressableScale
              disabled={isTranscribing}
              onPress={() => {
                void handleSaveVoiceAttachment();
              }}
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
                opacity: isTranscribing ? 0.5 : 1,
              }}
            >
              <Volume2 size={16} color={t.accent} />
              <Txt variant="footnote" color={t.accent} style={{ fontFamily: fonts.semibold }}>
                Save Voice Note Attachment ({formatTime(Math.max(elapsedSeconds, 1))})
              </Txt>
            </PressableScale>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
