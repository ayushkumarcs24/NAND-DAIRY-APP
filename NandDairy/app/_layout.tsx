import { Slot, useRouter, useSegments } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { DairyTheme, C } from '../constants/Theme';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';

const InitialLayout = () => {
  const { userToken, userRole, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!userToken && !inAuthGroup) {
      // Redirect to login if user is not authenticated and not already in auth
      router.replace('/(auth)/login');
    } else if (userToken && inAuthGroup) {
      // Redirect based on role
      if (userRole === 'admin') {
         router.replace('/(admin)/accountants');
      } else if (userRole === 'milk-entry') {
         router.replace('/(milk-entry)');
      } else if (userRole === 'fat-snf') {
         router.replace('/(fat-snf)');
      } else if (userRole === 'report') {
         router.replace('/(report)');
      } else if (userRole === 'distributor') {
         router.replace('/(distributor)');
      } else {
         router.replace('/(auth)/login'); // Fallback
      }
    }
  }, [userToken, userRole, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#131313' }}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  return <Slot />;
};

export default function RootLayout() {
  return (
    <PaperProvider theme={DairyTheme}>
      <AuthProvider>
        <InitialLayout />
      </AuthProvider>
    </PaperProvider>
  );
}
