import { Tabs } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { C } from '../../constants/Theme';
import { TouchableOpacity, Text, View } from 'react-native';

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  const firstName = user?.name ? user.name.split(' ')[0] : 'Admin';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor:   C.primary,
        tabBarInactiveTintColor: C.textSec,
        tabBarStyle: {
          backgroundColor: C.white,
          borderTopWidth: 1,
          borderTopColor: C.border,
          height: 60,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        headerStyle: { backgroundColor: C.white, shadowColor: 'transparent', elevation: 0 },
        headerTintColor: C.textPri,
        headerTitle: () => (
          <View>
            <Text style={{ fontSize: 12, color: C.textSec, fontWeight: '600' }}>Hello, {firstName}</Text>
            <Text style={{ fontWeight: '800', fontSize: 18, color: C.textPri }}>Admin Dashboard</Text>
          </View>
        ),
        headerRight: () => (
          <TouchableOpacity onPress={signOut} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF3B3015', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, marginRight: 16 }}>
            <MaterialCommunityIcons name="logout" size={16} color={C.error} style={{ marginRight: 4 }} />
            <Text style={{ color: C.error, fontSize: 13, fontWeight: '700' }}>Logout</Text>
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="accountants"
        options={{
          title: 'Staff',
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
      <Tabs.Screen
        name="products"
        options={{
          title: 'Products',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="bottle-tonic" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="distributor-orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="currency-inr" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
