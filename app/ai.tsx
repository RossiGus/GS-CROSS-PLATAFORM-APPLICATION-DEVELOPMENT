import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getColors, FONT, radius, spacing } from '@/constants/theme';
import { useMission } from '@/context/MissionContext';
import { average } from '@/utils/predictions';

/** Endpoint compativel com OpenAI da Groq (rapido e gratuito para estudo). */
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

/** Resposta minima esperada do endpoint de chat. */
interface ChatResponse {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
}

/**
 * Tela de Analise por IA (diferencial de IA generativa).
 * Monta um resumo dos ultimos dados de telemetria e envia para um modelo
 * de linguagem, exibindo a interpretacao em linguagem natural.
 * A chave de API e configurada na tela de Configuracoes.
 */
export default function AiAnalysisScreen(): React.JSX.Element {
  const { state } = useMission();
  const c = getColors(state.themeMode);
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const hasKey = state.apiKey.trim().length > 0;

  // Monta um resumo textual compacto do estado atual da missao.
  const telemetrySummary = useMemo(() => {
    const lastSensor = state.sensorData[state.sensorData.length - 1];
    const lastEnergy = state.energyData[state.energyData.length - 1];
    const lastComm = state.commData[state.commData.length - 1];
    const avgTemp = average(state.sensorData.map((s) => s.temperature));
    const avgSignal = average(state.commData.map((cm) => cm.signalStrength));

    return [
      `Missao: ${state.missionName || 'sem nome'}`,
      `Status: ${state.status}`,
      `Temperatura atual: ${lastSensor?.temperature.toFixed(1) ?? 'N/A'} C (media ${avgTemp.toFixed(1)} C)`,
      `Pressao: ${lastSensor?.pressure.toFixed(1) ?? 'N/A'} kPa`,
      `Radiacao: ${lastSensor?.radiation.toFixed(2) ?? 'N/A'} mSv/h`,
      `Energia total: ${lastEnergy?.totalEnergy.toFixed(0) ?? 'N/A'} %`,
      `Carga solar: ${lastEnergy?.solarCharge.toFixed(0) ?? 'N/A'} %`,
      `Sinal: ${lastComm?.signalStrength.toFixed(1) ?? 'N/A'} dBm (media ${avgSignal.toFixed(1)})`,
      `Latencia: ${lastComm?.latency.toFixed(0) ?? 'N/A'} ms`,
      `Link: ${lastComm?.linkStatus ?? 'N/A'}`,
      `Alertas ativos: ${state.alerts.length}`,
    ].join('\n');
  }, [state]);

  /** Envia o resumo de telemetria para o modelo e trata a resposta. */
  async function analyze(): Promise<void> {
    if (!hasKey) {
      setError('Configure a chave de API na tela de Configuracoes para usar a analise por IA.');
      return;
    }
    setLoading(true);
    setError('');
    setResult('');

    try {
      const res = await fetch(GROQ_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${state.apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          temperature: 0.4,
          max_tokens: 500,
          messages: [
            {
              role: 'system',
              content:
                'Voce e um engenheiro de controle de missao espacial. Analise os dados de ' +
                'telemetria fornecidos e responda em portugues do Brasil, de forma objetiva, ' +
                'destacando riscos, tendencias e recomendacoes praticas em ate 3 paragrafos curtos.',
            },
            {
              role: 'user',
              content: `Dados de telemetria atuais da missao:\n\n${telemetrySummary}`,
            },
          ],
        }),
      });

      const data = (await res.json()) as ChatResponse;

      if (!res.ok) {
        throw new Error(data.error?.message ?? `Erro ${res.status} ao consultar a IA.`);
      }

      const content = data.choices?.[0]?.message?.content?.trim();
      if (!content) {
        throw new Error('A IA nao retornou nenhuma analise.');
      }
      setResult(content);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao consultar a IA.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Analise por IA',
          headerStyle: { backgroundColor: c.surface },
          headerTintColor: c.textPrimary,
        }}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.intro, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Ionicons name="sparkles" size={22} color={c.accent} />
          <Text style={[styles.introText, { color: c.textSecondary }]}>
            Interpretacao dos dados de telemetria em linguagem natural usando um modelo de IA
            generativa.
          </Text>
        </View>

        {/* Resumo enviado ao modelo */}
        <Text style={[styles.label, { color: c.textPrimary }]}>Dados enviados</Text>
        <View style={[styles.codeBox, { backgroundColor: c.surfaceAlt, borderColor: c.border }]}>
          <Text style={[styles.code, { color: c.textSecondary }]}>{telemetrySummary}</Text>
        </View>

        {!hasKey && (
          <View style={[styles.warnBox, { backgroundColor: c.surface, borderColor: c.warning }]}>
            <Ionicons name="key-outline" size={18} color={c.warning} />
            <Text style={[styles.warnText, { color: c.textPrimary }]}>
              Nenhuma chave de API configurada. Defina-a em Configuracoes.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: hasKey ? c.primary : c.border }]}
          onPress={analyze}
          disabled={loading || !hasKey}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="analytics-outline" size={18} color="#FFFFFF" />
              <Text style={styles.buttonText}>Gerar analise</Text>
            </>
          )}
        </TouchableOpacity>

        {error.length > 0 && (
          <View style={[styles.errorBox, { backgroundColor: c.surface, borderColor: c.danger }]}>
            <Text style={[styles.errorText, { color: c.danger }]}>{error}</Text>
            {!hasKey && (
              <TouchableOpacity onPress={() => router.push('/settings')}>
                <Text style={[styles.link, { color: c.primary }]}>Abrir Configuracoes</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {result.length > 0 && (
          <>
            <Text style={[styles.label, { color: c.textPrimary }]}>Analise</Text>
            <View style={[styles.resultBox, { backgroundColor: c.surface, borderColor: c.accent }]}>
              <Text style={[styles.resultText, { color: c.textPrimary }]}>{result}</Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  intro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  introText: { flex: 1, fontSize: 13, fontFamily: FONT.mono, lineHeight: 19 },
  label: {
    fontSize: 13,
    fontFamily: FONT.mono,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  codeBox: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  code: { fontSize: 12, fontFamily: FONT.mono, lineHeight: 18 },
  warnBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  warnText: { flex: 1, fontSize: 12, fontFamily: FONT.mono },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontFamily: FONT.mono, fontWeight: '700' },
  errorBox: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  errorText: { fontSize: 13, fontFamily: FONT.mono, lineHeight: 19 },
  link: { fontSize: 13, fontFamily: FONT.mono, fontWeight: '700', marginTop: spacing.sm },
  resultBox: { padding: spacing.lg, borderRadius: radius.md, borderWidth: 1 },
  resultText: { fontSize: 14, fontFamily: FONT.mono, lineHeight: 22 },
});
