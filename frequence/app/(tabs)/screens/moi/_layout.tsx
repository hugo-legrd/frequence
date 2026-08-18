import { Stack } from 'expo-router';

export default function MoiLayout() {
  return (
    <Stack screenOptions={{ headerShown: false}}>
      <Stack.Screen name="moi" />
      <Stack.Screen name="artists" />
      <Stack.Screen name="concerts" />
    </Stack>
  )
}