import { Tabs } from 'expo-router';
import { View } from 'react-native';

import { TabBar } from '@/components/TabBar';
import { WebSidebar } from '@/components/web/WebSidebar';
import { useIsWebDesktop } from '@/hooks/useIsWebDesktop';

export default function TabsLayout() {
  const desktop = useIsWebDesktop();

  const tabs = (
    <Tabs
      tabBar={desktop ? () => null : (props: any) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="records" />
      <Tabs.Screen name="assistant" />
      <Tabs.Screen name="calendar" />
      {/* Diary keeps its routes and is reached from the Calendar tab's switch. */}
      <Tabs.Screen name="diary" />
      <Tabs.Screen name="more" />
    </Tabs>
  );

  if (!desktop) return tabs;

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#F8FAFC' }}>
      <WebSidebar />
      <View style={{ flex: 1 }}>{tabs}</View>
    </View>
  );
}
