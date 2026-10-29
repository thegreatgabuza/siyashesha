import { Image } from 'expo-image';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { useClerkAvatarSync } from '@/lib/clerkAvatar';

export function Avatar({
  name,
  size = 48,
  imageUrl,
}: {
  name: string;
  size?: number;
  imageUrl?: string | null;
}) {
  const syncedAvatarUrl = useClerkAvatarSync();
  const [failedUri, setFailedUri] = useState<string | null>(null);

  const resolvedUri = imageUrl || syncedAvatarUrl;
  const showImage = Boolean(resolvedUri && failedUri !== resolvedUri);

  const initials = (name || '?')
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (showImage && resolvedUri) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: 'hidden',
          borderWidth: 1.5,
          borderColor: 'rgba(11, 37, 89, 0.16)',
        }}
        className="items-center justify-center bg-brand-500 dark:bg-brand-400"
      >
        <Image
          source={{ uri: resolvedUri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          contentFit="cover"
          transition={150}
          accessibilityLabel={`${name} profile photo`}
          onError={() => setFailedUri(resolvedUri)}
        />
      </View>
    );
  }

  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="items-center justify-center bg-brand-500 dark:bg-brand-400"
    >
      <Text className="font-sans-bold text-white" style={{ fontSize: size * 0.36 }}>
        {initials}
      </Text>
    </View>
  );
}
