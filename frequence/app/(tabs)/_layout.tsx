import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#0f0f0f', borderTopColor: '#1e1e1e' },
        tabBarActiveTintColor: '#a78bfa',
        tabBarInactiveTintColor: '#3a3a3a',
      }}
    >
      <Tabs.Screen
        name="screens/home"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="screens/concerts"
        options={{
          title: 'Concerts',
          tabBarIcon: ({ color }) => <Ionicons name="musical-notes" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="screens/explorer"
        options={{
          title: 'Explorer',
          tabBarIcon: ({ color }) => <Ionicons name="compass" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="screens/amis/amis"
        options={{
          title: 'Amis',
          tabBarIcon: ({ color }) => <Ionicons name="people" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="screens/moi"
        options={{
          title: 'Moi',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="screens/event/[id]"
        options={{ href: null}}
      />
      <Tabs.Screen
        name="screens/amis/search"
        options={{ href: null }}
      />
    </Tabs>
  );
}