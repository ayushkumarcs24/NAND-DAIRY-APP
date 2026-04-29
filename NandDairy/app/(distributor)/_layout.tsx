import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { C } from '../../constants/Theme';

export default function DistributorLayout() {
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
        headerStyle:       { backgroundColor: C.white },
        headerShadowVisible: false,
        headerTintColor:   C.textPri,
        headerTitleStyle:  { fontWeight: '800', fontSize: 18 },
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
