import { useRef } from 'react';
import { View } from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

export function useShareProfile() {
  const shotRef = useRef<ViewShot>(null);

  async function share() {
    if (!shotRef.current?.capture) return;
    const uri = await shotRef.current.capture();

    const available = await Sharing.isAvailableAsync();
    if (!available) return;

    await Sharing.shareAsync(uri, {
      mimeType: 'image/png',
      dialogTitle: 'Partager mon année musicale',
    });
  }

  return { shotRef, share };
}