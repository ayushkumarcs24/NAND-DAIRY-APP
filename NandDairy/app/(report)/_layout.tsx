import { Stack } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { TouchableOpacity, Text } from 'react-native';
import { C } from '../../constants/Theme';

export default function ReportLayout() {
  const { signOut } = useAuth();
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,  // Reports has its own hero header inside the screen
        }}
      />
    </Stack>
  );
}
