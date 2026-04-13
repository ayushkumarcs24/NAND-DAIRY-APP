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
          title: 'Reports',
          headerStyle: { backgroundColor: '#000' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '600', letterSpacing: -0.3 },
          headerRight: () => (
            <TouchableOpacity onPress={signOut} style={{ marginRight: 4 }}>
              <Text style={{ color: C.primary, fontSize: 15, fontWeight: '500' }}>Logout</Text>
            </TouchableOpacity>
          ),
        }}
      />
    </Stack>
  );
}
