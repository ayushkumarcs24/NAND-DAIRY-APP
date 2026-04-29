import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TouchableOpacity, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { C } from '../../constants/Theme';

export default function DistributorLayout() {
  const { user, signOut } = useAuth();
  const firstName = user?.name ? user.name.split(' ')[0] : 'Distributor';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor:   C.purple,
        tabBarInactiveTintColor: C.textSec,
        tabBarStyle: {
          backgroundColor: C.white,
          borderTopWidth: 1,
          borderTopColor: C.border,
          height: 60,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle:  { fontSize: 11, fontWeight: '500' },
        headerStyle:       { backgroundColor: C.white, shadowColor: 'transparent', elevation: 0 },
        headerTintColor:   C.textPri,
        headerTitle: () => (
          <View>
            <Text style={{ fontSize: 12, color: C.textSec, fontWeight: '600' }}>Hello, {firstName}</Text>
            <Text style={{ fontWeight: '800', fontSize: 18, color: C.textPri }}>Distributor Hub</Text>
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
        name="index"
        options={{
          title: 'Shop',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="storefront" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'My Orders',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="receipt" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
