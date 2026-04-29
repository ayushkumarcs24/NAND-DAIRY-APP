import { Stack } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { TouchableOpacity, Text } from 'react-native';
import { C } from '../../constants/Theme';

export default function FatSnfLayout() {
  const { signOut } = useAuth();
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Quality Testing',
          headerStyle: { backgroundColor: C.white },
          headerShadowVisible: false,
          headerTintColor: C.textPri,
          headerTitleStyle: { fontWeight: '800', fontSize: 18, color: C.textPri },
          headerRight: () => (
            <TouchableOpacity onPress={signOut} style={{ marginRight: 16 }}>
              <Text style={{ color: C.error, fontSize: 14, fontWeight: '600' }}>Logout</Text>
            </TouchableOpacity>
          ),
        }}
      />
    </Stack>
  );
}
