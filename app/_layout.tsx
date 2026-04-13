import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="create-goal" />
      <Stack.Screen name="create-challenge" />
      <Stack.Screen name="goal-detail" />
      <Stack.Screen name="payment" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}