import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Slider from '@react-native-community/slider';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';
import { getColors, FONT, radius, spacing } from '@/constants/theme';
import { THRESHOLD_LIMITS } from '@/constants/thresholds';
import { useMission } from '@/context/MissionContext';

/** Chaves dos limiares editaveis no formulario. */
type ThresholdKey = 'tempMax' | 'pressureMin' | 'energyMin' | 'signalMin';

/**
 * Formulario controlado de configuracoes da missao.
 * Valida o nome (min. 3 chars), ajusta limiares por slider, alterna
 * notificacoes/tema e salva a chave de IA. Exibe erros inline e banner
 * de sucesso animado ao concluir.
 */
export default function MissionForm(): React.JSX.Element {
  const { state, dispatch } = useMission();
  const c = getColors(state.themeMode);

  const [name, setName] = useState<string>(state.missionName);
  const [tempMax, setTempMax] = useState<number>(state.thresholds.tempMax);
  const [pressureMin, setPressureMin] = useState<number>(state.thresholds.pressureMin);
  const [energyMin, setEnergyMin] = useState<number>(state.thresholds.energyMin);
  const [signalMin, setSignalMin] = useState<number>(state.thresholds.signalMin);
  const [notifications, setNotifications] = useState<boolean>(state.notificationsEnabled);
  const [lightMode, setLightMode] = useState<boolean>(state.themeMode === 'light');
  const [apiKey, setApiKey] = useState<string>(state.apiKey);
  const [nameError, setNameError] = useState<string>('');

  const bannerOpacity = useRef(new Animated.Value(0)).current;

  // Sincroniza os campos quando o estado persistido e hidratado.
  useEffect(() => {
    setName(state.missionName);
    setTempMax(state.thresholds.tempMax);
    setPressureMin(state.thresholds.pressureMin);
    setEnergyMin(state.thresholds.energyMin);
    setSignalMin(state.thresholds.signalMin);
    setNotifications(state.notificationsEnabled);
    setLightMode(state.themeMode === 'light');
    setApiKey(state.apiKey);
  }, [state.hydrated]);

  /** Exibe o banner de sucesso por 2.5s. */
  function showSuccess(): void {
    Animated.sequence([
      Animated.timing(bannerOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(2200),
      Animated.timing(bannerOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }

  /** Solicita permissao de notificacao ao ativar o toggle. */
  async function handleToggleNotifications(value: boolean): Promise<void> {
    setNotifications(value);
    if (value) {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        await Notifications.requestPermissionsAsync();
      }
    }
  }

  /** Valida e salva todas as configuracoes no estado global. */
  function handleSave(): void {
    const trimmed = name.trim();
    if (trimmed.length < 3) {
      setNameError('O nome da missao deve ter pelo menos 3 caracteres.');
      return;
    }
    setNameError('');

    dispatch({ type: 'SET_MISSION_NAME', payload: trimmed });
    dispatch({
      type: 'UPDATE_THRESHOLDS',
      payload: {
        tempMax: Math.round(tempMax),
        pressureMin: Math.round(pressureMin),
        energyMin: Math.round(energyMin),
        signalMin: Math.round(signalMin),
      },
    });
    dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications });
    dispatch({ type: 'SET_THEME', payload: lightMode ? 'light' : 'dark' });
    dispatch({ type: 'SET_API_KEY', payload: apiKey.trim() });
    showSuccess();
  }

  const sliderValues: Record<ThresholdKey, { value: number; set: (v: number) => void; suffix: string }> = {
    tempMax: { value: tempMax, set: setTempMax, suffix: 'C' },
    pressureMin: { value: pressureMin, set: setPressureMin, suffix: 'kPa' },
    energyMin: { value: energyMin, set: setEnergyMin, suffix: '%' },
    signalMin: { value: signalMin, set: setSignalMin, suffix: 'dBm' },
  };

  return (
    <View>
      {/* Banner de sucesso */}
      <Animated.View
        pointerEvents="none"
        style={[styles.banner, { backgroundColor: c.success, opacity: bannerOpacity }]}
      >
        <Ionicons name="checkmark-circle" size={18} color="#fff" />
        <Text style={styles.bannerText}>Configuracoes salvas com sucesso!</Text>
      </Animated.View>

      {/* Nome da missao */}
      <Text style={[styles.label, { color: c.textSecondary }]}>Nome da missao *</Text>
      <TextInput
        value={name}
        onChangeText={(t) => {
          setName(t);
          if (nameError) setNameError('');
        }}
        placeholder="Ex.: Artemis Orbital"
        placeholderTextColor={c.textSecondary}
        style={[
          styles.input,
          { backgroundColor: c.surfaceAlt, color: c.textPrimary, borderColor: nameError ? c.danger : c.border },
        ]}
      />
      {nameError ? <Text style={[styles.error, { color: c.danger }]}>{nameError}</Text> : null}

      {/* Limiares */}
      <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>Limiares de alerta</Text>
      {(Object.keys(sliderValues) as ThresholdKey[]).map((key) => {
        const limit = THRESHOLD_LIMITS[key];
        const { value, set, suffix } = sliderValues[key];
        return (
          <View key={key} style={styles.sliderBlock}>
            <View style={styles.sliderHeader}>
              <Text style={[styles.label, { color: c.textSecondary }]}>{limit.label}</Text>
              <Text style={[styles.sliderValue, { color: c.accent }]}>
                {Math.round(value)} {suffix}
              </Text>
            </View>
            <Slider
              minimumValue={limit.min}
              maximumValue={limit.max}
              step={1}
              value={value}
              onValueChange={set}
              minimumTrackTintColor={c.primary}
              maximumTrackTintColor={c.border}
              thumbTintColor={c.accent}
            />
          </View>
        );
      })}

      {/* Notificacoes */}
      <View style={[styles.switchRow, { borderColor: c.border }]}>
        <View style={styles.switchLabel}>
          <Ionicons name="notifications" size={18} color={c.primary} />
          <Text style={[styles.switchText, { color: c.textPrimary }]}>Notificacoes ativas</Text>
        </View>
        <Switch
          value={notifications}
          onValueChange={(v) => void handleToggleNotifications(v)}
          trackColor={{ true: c.primary, false: c.border }}
          thumbColor="#fff"
        />
      </View>

      {/* Tema */}
      <View style={[styles.switchRow, { borderColor: c.border }]}>
        <View style={styles.switchLabel}>
          <Ionicons name={lightMode ? 'sunny' : 'moon'} size={18} color={c.warning} />
          <Text style={[styles.switchText, { color: c.textPrimary }]}>Modo claro</Text>
        </View>
        <Switch
          value={lightMode}
          onValueChange={setLightMode}
          trackColor={{ true: c.primary, false: c.border }}
          thumbColor="#fff"
        />
      </View>

      {/* Chave de IA */}
      <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>Analise por IA (opcional)</Text>
      <Text style={[styles.label, { color: c.textSecondary }]}>Chave de API (Groq / OpenAI compativel)</Text>
      <TextInput
        value={apiKey}
        onChangeText={setApiKey}
        placeholder="gsk_..."
        placeholderTextColor={c.textSecondary}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        style={[styles.input, { backgroundColor: c.surfaceAlt, color: c.textPrimary, borderColor: c.border }]}
      />

      {/* Botao salvar */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleSave}
        style={[styles.saveBtn, { backgroundColor: c.primary }]}
      >
        <Ionicons name="save" size={18} color="#fff" />
        <Text style={styles.saveText}>Salvar Configuracoes</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  bannerText: { color: '#fff', fontWeight: '600', fontFamily: FONT.mono },
  label: { fontSize: 13, marginBottom: spacing.xs, fontFamily: FONT.mono },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 15,
    fontFamily: FONT.mono,
  },
  error: { fontSize: 12, marginTop: spacing.xs, fontFamily: FONT.mono },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    fontFamily: FONT.mono,
  },
  sliderBlock: { marginBottom: spacing.md },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sliderValue: { fontSize: 13, fontWeight: '700', fontFamily: FONT.mono },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  switchLabel: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  switchText: { fontSize: 14, fontFamily: FONT.mono },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    marginTop: spacing.xl,
  },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '700', fontFamily: FONT.mono },
});
