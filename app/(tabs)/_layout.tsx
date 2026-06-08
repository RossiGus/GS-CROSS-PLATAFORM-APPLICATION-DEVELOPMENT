import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getColors } from '@/constants/theme';
import { useMission } from '@/context/MissionContext';

/**
 * Navegador de abas principal do OrbitWatch.
 * Abas: Home, Sensores, Energia, Comunicacao, Alertas e Config.
 * A aba Alertas exibe um contador de alertas nao lidos.
 */
export default function TabsLayout(): React.JSX.Element {
  const { state } = useMission();
  const c = getColors(state.themeMode);
  const unread = state.alerts.filter((a) => !a.read).length;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: c.surface },
        headerTintColor: c.textPrimary,
        tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.border },
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textSecondary,
        sceneStyle: { backgroundColor: c.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="planet" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="sensors"
        options={{
          title: 'Sensores',
          tabBarIcon: ({ color, size }) => <Ionicons name="pulse" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="energy"
        options={{
          title: 'Energia',
          tabBarIcon: ({ color, size }) => <Ionicons name="flash" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="communication"
        options={{
          title: 'Comunicacao',
          tabBarIcon: ({ color, size }) => <Ionicons name="radio" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alertas',
          tabBarBadge: unread > 0 ? unread : undefined,
          tabBarIcon: ({ color, size }) => <Ionicons name="warning" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Config',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
