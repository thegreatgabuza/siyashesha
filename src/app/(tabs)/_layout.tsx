import { Tabs } from 'expo-router';

import { TabBar } from '@/components/TabBar';

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar state={props.state as any} navigation={props.navigation as any} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="records" />
      <Tabs.Screen name="calendar" />
      <Tabs.Screen name="diary" />
      <Tabs.Screen name="more" />
    </Tabs>
  );
}
