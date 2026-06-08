# 🛰️ OrbitWatch

### Plataforma de Análise Preditiva Espacial — Global Solution 2026.1 (FIAP)
**Disciplina:** Cross-Platform Application Development

---

## 📖 Descrição

OrbitWatch é um aplicativo mobile que simula uma central de monitoramento de missões espaciais.
Ele reúne dashboards analíticos em tempo real para sensores, energia e comunicação, gera alertas
automáticos quando limiares críticos são ultrapassados e aplica algoritmos preditivos simples para
estimar estabilidade orbital e autonomia. O tema visual é inspirado em centros de controle da NASA
e da SpaceX, com modo escuro como padrão e integração com dados reais da ISS e análise por IA generativa.

---

## 👥 Integrantes

| Nome Completo        | RM        |
|----------------------|-----------|
| Nome Completo 1      | RM000000  |
| Nome Completo 2      | RM000000  |
| Nome Completo 3      | RM000000  |

---

## 📱 Telas do Aplicativo

### Home (Dashboard Principal)
![Home](./assets/screenshots/home.png)
Status geral da missão, 4 métricas-chave, mini gráfico de temperatura e posição real da ISS via API externa.

### Sensores
![Sensores](./assets/screenshots/sensors.png)
Gráfico de linha com três séries (temperatura, pressão, radiação) e indicadores de tendência por leitura.

### Energia
![Energia](./assets/screenshots/energy.png)
Consumo por subsistema em gráfico de barras, carga dos painéis solares e estimativa de autonomia em horas.

### Comunicação
![Comunicação](./assets/screenshots/communication.png)
Latência em tempo real, gauge SVG de qualidade do sinal, status do link de telemetria e taxa de erro de pacotes.

### Alertas
![Alertas](./assets/screenshots/alerts.png)
Lista ordenada por criticidade e tempo, badges coloridos por nível e botão para dispensar cada alerta.

### Configurações
![Configurações](./assets/screenshots/settings.png)
Formulário controlado com validação: nome da missão, limiares ajustáveis, notificações, tema e chave de API da IA.

---

## ✅ Funcionalidades

- [x] Navegação com Expo Router (Tabs na raiz + Stack aninhada `/mission/[id]`)
- [x] Ícones do `@expo/vector-icons` em todas as abas
- [x] 4 dashboards com dados simulados atualizando a cada 2s (`setInterval`)
- [x] Home: 4 MetricCards, status geral e mini gráfico de temperatura
- [x] Sensores: gráfico multi-série + tendências (↑↓)
- [x] Energia: gráfico de barras, barra de progresso solar e autonomia
- [x] Comunicação: latência, gauge SVG de sinal, status do link e taxa de erro
- [x] Gerenciamento de estado com Context API + `useReducer`
- [x] Context consumido em mais de 4 telas
- [x] Persistência com AsyncStorage (limiares, missão, alertas, preferências)
- [x] Carregamento do estado persistido no `useEffect` do Provider
- [x] Formulário com validação inline e feedback de sucesso
- [x] Sistema de alertas por limiares com níveis de criticidade
- [x] Contador de alertas não lidos no ícone da aba
- [x] Tema dark espacial + toggle para light mode
- [x] Animações `Animated` (fade + slide) nos cards
- [x] Layout responsivo com `Dimensions`
- [x] TypeScript estrito, sem `any` explícito, com JSDoc
- [x] `.gitignore` correto e logs protegidos por `__DEV__`
- [x] **Diferencial:** API externa da ISS (`api.wheretheiss.at`) com fallback offline
- [x] **Diferencial:** Notificações locais (`expo-notifications`) em alertas críticos
- [x] **Diferencial:** Análise por IA generativa (tela `/ai` com chave de API configurável)

---

## 🧰 Tecnologias

- **React Native** + **Expo** (SDK 52) + **TypeScript**
- **Expo Router** — roteamento baseado em arquivos
- **Context API** + `useReducer` — estado global
- **AsyncStorage** — persistência local
- **react-native-chart-kit** + **react-native-svg** — gráficos e gauges
- **expo-notifications** — notificações locais
- **@expo/vector-icons** (Ionicons) — ícones
- **@expo-google-fonts/space-mono** — tipografia
- **@react-native-community/slider** — controles de limiar

---

## 🚀 Como Executar

```bash
# 1. Clonar o repositório
git clone <url-do-repositorio>
cd orbitwatch

# 2. Instalar as dependências
npm install

# 3. (Opcional) Alinhar versões nativas com o SDK do Expo
npx expo install --fix

# 4. Iniciar o projeto
npx expo start
```

Em seguida, escaneie o QR Code com o app **Expo Go** (Android/iOS) ou pressione `a` / `i`
para abrir em um emulador.

> A análise por IA é opcional: gere uma chave gratuita em [console.groq.com](https://console.groq.com)
> e cole no campo "Chave de API" da tela de Configurações.

---

## 🎥 Vídeo de Demonstração

🔗 **Link do vídeo:** _[inserir link do YouTube/Drive aqui]_

### Roteiro do Vídeo (3 minutos)

**[0:00 – 0:20] Abertura**
Apresente o time e o conceito: o OrbitWatch é uma central de monitoramento de missões espaciais
construída em React Native + Expo. Mostre a tela Home já em execução no Expo Go.

**[0:20 – 0:50] Dashboard Home e API externa**
Destaque o status geral da missão, os 4 MetricCards atualizando a cada 2 segundos e o mini gráfico
de temperatura. Mostre o bloco da ISS com a posição real obtida da API e comente o fallback offline.

**[0:50 – 1:20] Sensores e Energia**
Navegue para Sensores: mostre o gráfico de três séries e as setas de tendência. Em seguida, Energia:
gráfico de barras de consumo, barra de carga solar e a estimativa de autonomia calculada.

**[1:20 – 1:45] Comunicação**
Mostre a latência em tempo real, o gauge SVG de qualidade do sinal, o status do link de telemetria
e os contadores de pacotes com taxa de erro.

**[1:45 – 2:15] Alertas e Notificações**
Force um cenário crítico (ex.: temperatura alta). Mostre o alerta surgindo na aba Alertas com o badge
colorido, o contador no ícone da aba e a notificação local disparada pelo `expo-notifications`.

**[2:15 – 2:45] Configurações, Tema e Detalhe da Missão**
Abra Configurações: altere o nome da missão, ajuste limiares nos sliders, ative o modo claro e salve
(mostrando a validação e o banner de sucesso). Abra a tela de detalhe `/mission/[id]` com o resumo.

**[2:45 – 3:00] Análise por IA e Encerramento**
Abra a tela de Análise por IA, gere a interpretação em linguagem natural dos dados e encerre reforçando
a arquitetura: Expo Router, Context API, AsyncStorage e os diferenciais implementados.

---

## 📄 Licença

Projeto acadêmico desenvolvido para a **FIAP** — Global Solution 2026.1.
Uso restrito a fins educacionais.
