import { Tabs } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { C } from '../../constants/Theme';
import { TouchableOpacity, Text } from 'react-native';

export default function AdminLayout() {
  const { signOut } = useAuth();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: 'rgba(19,19,19,0.92)',
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarLabelStyle: { fontSize: 11, letterSpacing: -0.1 },
        headerStyle: { backgroundColor: '#000' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600', letterSpacing: -0.3 },
        headerRight: () => (
          <TouchableOpacity onPress={signOut} style={{ marginRight: 16 }}>
            <Text style={{ color: C.primary, fontSize: 15, fontWeight: '500' }}>Logout</Text>
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="accountants"
        options={{
          title: 'Accountants',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="samitis"
        options={{
          title: 'Samitis',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="office-building" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="vehicles"
        options={{
          title: 'Vehicles',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="truck" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
