import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { UnreadActivityProvider, useUnreadActivity } from '../../lib/context/UnreadActivityContext';
import { useTheme } from '../../lib/theme/ThemeContext';

function TabsNavigator() {
  const { count } = useUnreadActivity();
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.surface },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
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
        name="screens/amis"
        options={{
          title: 'Amis',
          tabBarIcon: ({ color }) => <Ionicons name="people" size={24} color={color} />,
          tabBarBadge: count > 0 ? count : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.accent },

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
    </Tabs>
  );
}

export default function TabsLayoutOuter() {
  return (
    <UnreadActivityProvider>
        <TabsNavigator />
    </UnreadActivityProvider>
  )
}