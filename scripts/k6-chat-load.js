// ============================================
// 🔥 K6 LOAD TEST: CHAT REALTIME (1.000 msgs/min)
// Cenário: Usuários enviando mensagens no chat
// Executar: k6 run scripts/k6-chat-load.js
// ============================================

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Métricas customizadas
const errorRate = new Rate('error_rate');
const messageLatency = new Trend('message_latency');
const messagesDelivered = new Counter('messages_delivered');
const connectionErrors = new Counter('connection_errors');

// Configuração do teste
export const options = {
  stages: [
    { duration: '30s', target: 100 },  // Warmup
    { duration: '1m', target: 300 },   // Escala inicial
    { duration: '2m', target: 500 },   // 500 usuários ativos no chat
    { duration: '2m', target: 500 },   // Sustentação
    { duration: '1m', target: 0 },     // Ramp-down
  ],
  
  thresholds: {
    error_rate: ['rate<0.01'],           // Erros < 1%
    message_latency: ['p(95)<1000'],     // Latência < 1s
    http_req_failed: ['rate<0.01'],
  },
};

// Configuração do Supabase
const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://fyikfsasudgzsjmumdlw.supabase.co';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || 'your-anon-key-here';

// Simular envio de mensagem via REST (fallback sem WebSocket)
export default function () {
  const userId = `user_${__VU}_${__ITER}`;
  const liveId = 'test-live-001';
  
  // Simular rate limit do frontend (1 msg a cada 2s)
  const minInterval = 2000; // 2 segundos
  const maxInterval = 5000; // 5 segundos
  
  // 1. Verificar status da live
  const statusRes = http.get(`${SUPABASE_URL}/rest/v1/youtube_lives?status=eq.live&limit=1`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    tags: { name: 'check_live_status' },
  });
  
  check(statusRes, {
    'live status check ok': (r) => r.status === 200,
  });
  
  sleep(randomBetween(1, 2));
  
  // 2. Simular envio de mensagem
  const message = {
    live_id: liveId,
    author_name: `Aluno ${__VU}`,
    message: generateRandomMessage(),
    created_at: new Date().toISOString(),
  };
  
  const startTime = Date.now();
  
  const msgRes = http.post(
    `${SUPABASE_URL}/rest/v1/youtube_live_chat`,
    JSON.stringify(message),
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      tags: { name: 'send_message' },
    }
  );
  
  const latency = Date.now() - startTime;
  messageLatency.add(latency);
  
  const msgOk = check(msgRes, {
    'mensagem enviada (201)': (r) => r.status === 201,
    'rate limit ok (não 429)': (r) => r.status !== 429,
  });
  
  if (msgOk) {
    messagesDelivered.add(1);
  } else {
    errorRate.add(1);
  }
  
  // 3. Simular leitura de mensagens (polling)
  const readRes = http.get(
    `${SUPABASE_URL}/rest/v1/youtube_live_chat?live_id=eq.${liveId}&order=created_at.desc&limit=50`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      tags: { name: 'read_messages' },
    }
  );
  
  check(readRes, {
    'leitura ok': (r) => r.status === 200,
  });
  
  // 4. Intervalo respeitando rate limit
  sleep(randomBetween(minInterval / 1000, maxInterval / 1000));
}

// Gerar mensagens aleatórias realistas
function generateRandomMessage() {
  const messages = [
    'Boa aula, professor! 🎉',
    'Entendi agora!',
    'Pode repetir essa parte?',
    'Muito bom! 👏',
    'Dúvida: como calcular isso?',
    'Obrigado pela explicação!',
    'Qual o próximo tema?',
    'Top demais! 🔥',
    'Salvou minha prova!',
    'Melhor professor!',
    'Não entendi direito...',
    'Pode dar mais exemplos?',
    '🧪 Química é top!',
    'Isso cai no ENEM?',
    'Anotando tudo aqui!',
  ];
  
  return messages[Math.floor(Math.random() * messages.length)];
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

// Relatório customizado
export function handleSummary(data) {
  const { metrics } = data;
  
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║           🔥 RELATÓRIO DE TESTE - CHAT REALTIME 🔥           ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  MENSAGENS:                                                  ║
║  ├─ Total Enviadas:    ${(metrics.messages_delivered?.values?.count || 0).toLocaleString().padStart(10)}                       ║
║  ├─ Msgs/segundo:      ${(metrics.messages_delivered?.values?.rate || 0).toFixed(2).padStart(10)}                       ║
║  ├─ Taxa de Erro:      ${((metrics.error_rate?.values?.rate || 0) * 100).toFixed(2).padStart(9)}%                       ║
║                                                              ║
║  LATÊNCIA DE MENSAGEM:                                       ║
║  ├─ Média:    ${(metrics.message_latency?.values?.avg || 0).toFixed(0).padStart(8)}ms                              ║
║  ├─ p(95):    ${(metrics.message_latency?.values?.['p(95)'] || 0).toFixed(0).padStart(8)}ms                              ║
║  ├─ p(99):    ${(metrics.message_latency?.values?.['p(99)'] || 0).toFixed(0).padStart(8)}ms                              ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
  
  return {
    'chat-summary.json': JSON.stringify(data, null, 2),
  };
}
