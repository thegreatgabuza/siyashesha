import { Tabs } from 'expo-router';

import { TabBar } from '@/components/TabBar';

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props: any) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="records" />
      <Tabs.Screen name="assistant" />
      <Tabs.Screen name="calendar" />
      {/* Diary keeps its routes and is reached from the Calendar tab's switch. */}
      <Tabs.Screen name="diary" />
      <Tabs.Screen name="more" />
    </Tabs>
  );
}
