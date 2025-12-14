import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="add"
        options={{
          tabBarIcon: ({ color }) => <Ionicons size={28} name="add-circle-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="books"
        options={{
          tabBarIcon: ({ color }) => <Ionicons size={28} name="book" color={color} />,
        }}
      />
    </Tabs>
  );
}
