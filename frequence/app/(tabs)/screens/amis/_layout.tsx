import { Stack } from 'expo-router';

export default function FriendsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false}}>
      <Stack.Screen name="amis" />
      <Stack.Screen name="search" />
      <Stack.Screen name="[userId]" />
    </Stack>
  )
}