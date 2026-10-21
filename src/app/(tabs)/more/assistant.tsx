import dayjs from 'dayjs';
import { router } from 'expo-router';
import { Lock, Send, ShieldCheck } from 'lucide-react-native';
import { useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/ui/IconButton';
import {
  assistantEncryptionNotice,
  assistantFallback,
  assistantGreeting,
  quickCommands,
} from '@/data/assistant';
import { hba1cSeries } from '@/data/timeline';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export default function AssistantScreen() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'm0', sender: 'assistant', text: assistantGreeting, timestamp: dayjs().toISOString() },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const listRef = useRef<FlatList>(null);

  const pushMessage = (sender: 'user' | 'assistant', text: string) => {
    setMessages((m) => [...m, { id: `m${Date.now()}-${Math.random()}`, sender, text, timestamp: dayjs().toISOString() }]);
  };

  const respond = (userText: string) => {
    setTyping(true);
    setTimeout(() => {
      const numberMatch = userText.trim().match(/^[1-5]$/);
      const command = numberMatch
        ? quickCommands.find((c) => c.number === Number(userText.trim()))
        : quickCommands.find((c) => c.keywords.some((k) => userText.toLowerCase().includes(k)));

      setTyping(false);
      if (command) {
        let reply = command.reply;
        if (command.number === 5) {
          const latest = hba1cSeries[hba1cSeries.length - 1];
          reply = `Your latest HbA1c result was ${latest.value}% on ${dayjs(latest.date).format('D MMMM YYYY')}. ${reply}`;
        }
        pushMessage('assistant', reply);
        if (command.action.type === 'navigate') {
          setTimeout(() => router.push(command.action.type === 'navigate' ? (command.action.target as any) : '/'), 700);
        }
      } else {
        pushMessage('assistant', assistantFallback);
      }
    }, 900);
  };

  const handleSend = (text?: string) => {
    const value = (text ?? input).trim();
    if (!value) return;
    pushMessage('user', value);
    setInput('');
    respond(value);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-50 dark:bg-canvasdark"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        className="flex-row items-center gap-3 bg-ink px-4 pb-3 dark:bg-canvasdark-card"
        style={{ paddingTop: insets.top + 10 }}
      >
        <IconButton accessibilityLabel="Go back" variant="ghost" onPress={() => router.back()}>
          <Text className="text-[22px] text-white">{'‹'}</Text>
        </IconButton>
        <View className="h-10 w-10 items-center justify-center rounded-full bg-white/20">
          <ShieldCheck size={18} color="#FFFFFF" />
        </View>
        <View className="flex-1">
          <Text className="font-sans-bold text-[15px] text-white">Siyashesha Assistant</Text>
          <Text className="font-sans text-[11px] text-white/80">
            {typing ? 'typing…' : 'Online · Health information assistant'}
          </Text>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 8, gap: 8 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListHeaderComponent={
          <View className="mb-3 items-center">
            <View className="flex-row items-center gap-1.5 rounded-xl bg-white/70 px-3 py-2 dark:bg-white/10">
              <Lock size={11} color="#5B6478" />
              <Text className="font-sans text-[10px] text-ink-muted dark:text-slate-400">
                {assistantEncryptionNotice}
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View className={`flex-row ${item.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <View
              className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${
                item.sender === 'user' ? 'bg-brand-100 dark:bg-brand-500/25' : 'bg-white dark:bg-canvasdark-card'
              }`}
            >
              <Text className="font-sans text-[14px] leading-[20px] text-ink dark:text-slate-50">
                {item.text}
              </Text>
              <Text className="mt-1 text-right font-sans text-[10px] text-ink-muted dark:text-slate-500">
                {dayjs(item.timestamp).format('h:mm A')}
              </Text>
            </View>
          </View>
        )}
        ListFooterComponent={
          <View className="mt-2 gap-2">
            {typing ? (
              <View className="flex-row justify-start">
                <View className="rounded-2xl bg-white px-4 py-3 dark:bg-canvasdark-card">
                  <Text className="font-sans text-[18px] text-ink-muted dark:text-slate-400">• • •</Text>
                </View>
              </View>
            ) : null}
            <View className="flex-row flex-wrap gap-2 pt-2">
              {quickCommands.map((c) => (
                <Pressable
                  key={c.number}
                  accessibilityRole="button"
                  accessibilityLabel={`${c.number}. ${c.label}`}
                  onPress={() => handleSend(String(c.number))}
                  className="min-h-[36px] rounded-full bg-white px-3.5 py-2 dark:bg-canvasdark-card"
                >
                  <Text className="font-sans-medium text-[12px] text-ink dark:text-brand-300">
                    {c.number}. {c.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        }
      />

      <View
        className="flex-row items-center gap-2 border-t border-slate-200 bg-white px-3 py-2 dark:border-canvasdark-card dark:bg-canvasdark"
        style={{ paddingBottom: insets.bottom + 8 }}
      >
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Type a message"
          placeholderTextColor="#8C98B8"
          className="min-h-[44px] flex-1 rounded-full bg-slate-100 px-4 font-sans text-[14px] text-ink dark:bg-canvasdark-card dark:text-slate-50"
          accessibilityLabel="Message the Siyashesha Assistant"
          onSubmitEditing={() => handleSend()}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send message"
          onPress={() => handleSend()}
          className="h-11 w-11 items-center justify-center rounded-full bg-ink dark:bg-brand-400"
        >
          <Send size={18} color="#FFFFFF" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
