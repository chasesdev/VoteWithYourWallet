import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="index" options={{ title: 'VoteWithYourWallet' }} />
        <Stack.Screen name="business-detail" options={{ title: 'Business Details' }} />
        <Stack.Screen name="political-alignment" options={{ title: 'Political Alignment' }} />
      </Stack>
    </>
  );
}
