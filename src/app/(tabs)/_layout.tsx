import { Tabs } from 'expo-router';

import { TabBar } from '@/components/TabBar';

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar state={props.state as any} navigation={props.navigation as any} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="records" />
      <Tabs.Screen name="assistant" />
      <Tabs.Screen name="calendar" />
      {/* Diary keeps its routes but is reached from the Calendar tab's switch. */}
      <Tabs.Screen name="diary" options={{ href: null }} />
      <Tabs.Screen name="more" />
    </Tabs>
  );
}
