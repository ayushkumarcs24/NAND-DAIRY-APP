import { Stack } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Button } from 'react-native-paper';
import { DairyTheme } from '../../constants/Theme';

export default function MilkEntryLayout() {
  const { signOut } = useAuth();
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Milk Entry',
          headerStyle: { backgroundColor: DairyTheme.colors.primary },
          headerTintColor: '#fff',
          headerRight: () => <Button textColor="#fff" onPress={signOut}>Logout</Button>,
        }}
      />
    </Stack>
  );
}
