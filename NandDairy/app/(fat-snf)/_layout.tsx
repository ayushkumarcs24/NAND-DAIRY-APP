import { Stack } from 'expo-router';

export default function FatSnfLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
