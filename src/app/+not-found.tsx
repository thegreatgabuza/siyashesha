import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { CtaButton, SitePage } from '@/components/web/site/SitePage';
import { MUTED, sans } from '@/components/web/site/SiteChrome';

export default function NotFound() {
  return (
    <SitePage title="Page not found" intro="That page doesn't exist or has moved." narrow>
      <Text style={{ fontFamily: sans(400), fontSize: 16, color: MUTED, marginBottom: 20 }}>Try the home page or the help centre.</Text>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <CtaButton label="Go home" onPress={() => router.navigate('/')} />
        <CtaButton label="Help and contact" secondary onPress={() => router.navigate('/support')} />
      </View>
    </SitePage>
  );
}
