import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { useFonts, SpaceMono_400Regular } from '@expo-google-fonts/space-mono';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MissionProvider, useMission } from '@/context/MissionContext';
import { useSimulatedData } from '@/hooks/useSimulatedData';
import { useAlerts } from '@/hooks/useAlerts';
import { getColors } from '@/constants/theme';

// Define como as notificacoes locais sao exibidas com o app aberto.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

void SplashScreen.preventAutoHideAsync();

/**
 * Motor da missao: roda a simulacao de dados e o monitoramento de alertas
 * uma unica vez, dentro do Provider. Nao renderiza nada.
 */
function MissionEngine(): null {
  useSimulatedData();
  useAlerts();
  return null;
}

/** Stack raiz tematizado de acordo com o modo de tema atual. */
function ThemedStack(): React.JSX.Element {
  const { state } = useMission();
  const c = getColors(state.themeMode);
  return (
    <>
      <StatusBar style={state.themeMode === 'light' ? 'dark' : 'light'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: c.surface },
          headerTintColor: c.textPrimary,
          contentStyle: { backgroundColor: c.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="mission/[id]" options={{ title: 'Detalhe da Missao' }} />
        <Stack.Screen name="ai" options={{ title: 'Analise por IA' }} />
      </Stack>
    </>
  );
}

/**
 * Layout raiz do aplicativo.
 * Carrega fontes, solicita permissao de notificacao e injeta o Provider.
 */
export default function RootLayout(): React.JSX.Element | null {
  const [fontsLoaded] = useFonts({ SpaceMono_400Regular });

  useEffect(() => {
    (async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        await Notifications.requestPermissionsAsync();
      }
    })();
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <MissionProvider>
          <MissionEngine />
          <ThemedStack />
        </MissionProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
