import { Tabs } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DairyTheme } from '../../constants/Theme';
import { Button } from 'react-native-paper';

export default function AdminLayout() {
  const { signOut } = useAuth();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: DairyTheme.colors.primary,
        tabBarInactiveTintColor: '#999',
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#e0e0e0' },
        headerStyle: { backgroundColor: DairyTheme.colors.primary },
        headerTintColor: '#fff',
        headerRight: () => (
          <Button textColor="#fff" onPress={signOut}>Logout</Button>
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
