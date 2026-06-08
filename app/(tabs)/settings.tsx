import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MissionForm from '@/components/MissionForm';
import { getColors, FONT, spacing } from '@/constants/theme';
import { useMission } from '@/context/MissionContext';

/**
 * Tela de Configuracoes.
 * Hospeda o formulario controlado (MissionForm) com validacao de campos,
 * ajuste de limiares de alerta, notificacoes, tema e chave de API da IA.
 */
export default function SettingsScreen(): React.JSX.Element {
  const { state } = useMission();
  const c = getColors(state.themeMode);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: c.textPrimary }]}>Configuracoes</Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>
            Ajuste os parametros de monitoramento da missao
          </Text>
        </View>

        <MissionForm />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { marginBottom: spacing.lg },
  title: {
    fontSize: 24,
    fontFamily: FONT.mono,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  subtitle: { fontSize: 13, fontFamily: FONT.mono },
});
