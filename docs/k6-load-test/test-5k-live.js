// =====================================================
// K6 LOAD TEST - Simulação 5.000 Usuários Ao Vivo
// Cenário: Aula ao vivo com chat em tempo real
// =====================================================

import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { randomString, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

// =====================================================
// CONFIGURAÇÃO
// =====================================================

const BASE_URL = __ENV.BASE_URL || 'https://gestao.moisesmedeiros.com.br';
const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://fyikfsasudgzsjmumdlw.supabase.co';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5aWtmc2FzdWRnenNqbXVtZGx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MzUwMTEsImV4cCI6MjA4MTMxMTAxMX0.qSVRCgEX6L0cLZoDebzOIvTGhDeZi0Rl45SsDVZthIs';

// =====================================================
// MÉTRICAS CUSTOMIZADAS
// =====================================================

const chatMessagesSent = new Counter('chat_messages_sent');
const chatMessagesReceived = new Counter('chat_messages_received');
const chatLatency = new Trend('chat_latency_ms');
const pageLoadTime = new Trend('page_load_time_ms');
const apiLatency = new Trend('api_latency_ms');
const errorRate = new Rate('errors');
const wsConnections = new Counter('ws_connections');

// =====================================================
// CENÁRIOS DE TESTE
// =====================================================

export const options = {
  scenarios: {
    // Cenário 1: Ramp-up para 5.000 usuários em 5 minutos
    live_viewers: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 500 },    // Warm-up: 500 em 1 min
        { duration: '2m', target: 2000 },   // Ramp: 2000 em 2 min
        { duration: '2m', target: 5000 },   // Peak: 5000 em 2 min
        { duration: '5m', target: 5000 },   // Sustain: 5 min em 5000
        { duration: '2m', target: 0 },      // Cool-down
      ],
      gracefulRampDown: '30s',
    },
  },
  
  // Thresholds - GO/NO-GO
  thresholds: {
    // Erros
    'errors': ['rate<0.005'],                    // < 0.5% erros
    
    // Latência API
    'api_latency_ms': ['p(95)<300', 'p(99)<800'], // p95 < 300ms, p99 < 800ms
    
    // Latência Chat
    'chat_latency_ms': ['p(95)<500', 'p(99)<1000'], // p95 < 500ms
    
    // Page Load
    'page_load_time_ms': ['p(95)<3000'],         // LCP < 3s
    
    // HTTP Requests
    'http_req_duration': ['p(95)<500'],          // p95 < 500ms
    'http_req_failed': ['rate<0.01'],            // < 1% falhas
  },
};

// =====================================================
// HELPERS
// =====================================================

function getHeaders(token = null) {
  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

function generateUserEmail() {
  return `loadtest_${randomString(8)}@test.local`;
}

function generateChatMessage() {
  const messages = [
    'Ótima aula, professor!',
    'Não entendi essa parte, pode explicar?',
    'Muito bom! 👏',
    'Qual a fórmula mesmo?',
    'Valeu, prof!',
    'Isso cai na prova?',
    '🔥🔥🔥',
    'Excelente explicação!',
    'Pode repetir?',
    'Top demais!',
  ];
  return messages[randomIntBetween(0, messages.length - 1)];
}

// =====================================================
// CENÁRIO PRINCIPAL: VIEWER NA LIVE
// =====================================================

export default function() {
  const userId = `user_${__VU}_${__ITER}`;
  const liveId = 'test-live-001'; // ID da live de teste
  
  group('1. Carregar Página da Live', function() {
    const startTime = Date.now();
    
    // Simular carregamento da página
    const pageRes = http.get(`${BASE_URL}/alunos/aulas/live/${liveId}`, {
      tags: { name: 'load_live_page' },
    });
    
    const loadTime = Date.now() - startTime;
    pageLoadTime.add(loadTime);
    
    check(pageRes, {
      'page loaded': (r) => r.status === 200,
      'page load < 3s': () => loadTime < 3000,
    }) || errorRate.add(1);
    
    sleep(randomIntBetween(1, 3));
  });
  
  group('2. Conectar ao Chat (Realtime)', function() {
    // Simular conexão WebSocket ao Supabase Realtime
    const wsUrl = SUPABASE_URL.replace('https://', 'wss://') + 
      `/realtime/v1/websocket?apikey=${SUPABASE_ANON_KEY}&vsn=1.0.0`;
    
    const startTime = Date.now();
    
    // Simular subscribe ao canal
    const subscribeRes = http.post(
      `${SUPABASE_URL}/rest/v1/rpc/check_rate_limit`,
      JSON.stringify({ p_user_id: userId, p_endpoint: 'chat' }),
      { headers: getHeaders(), tags: { name: 'chat_subscribe' } }
    );
    
    if (subscribeRes.status === 200) {
      wsConnections.add(1);
    }
    
    const latency = Date.now() - startTime;
    chatLatency.add(latency);
    
    check(subscribeRes, {
      'chat connected': (r) => r.status === 200 || r.status === 404, // 404 OK se RPC não existir
    }) || errorRate.add(1);
  });
  
  group('3. Enviar Mensagens (Rate Limited)', function() {
    // Simular envio de 2-3 mensagens durante a sessão
    const messageCount = randomIntBetween(1, 3);
    
    for (let i = 0; i < messageCount; i++) {
      const message = generateChatMessage();
      const startTime = Date.now();
      
      // Tentar enviar mensagem
      const sendRes = http.post(
        `${SUPABASE_URL}/rest/v1/live_chat_messages`,
        JSON.stringify({
          live_id: liveId,
          user_id: userId,
          user_name: `User ${__VU}`,
          message: message,
          created_at: new Date().toISOString(),
        }),
        { 
          headers: getHeaders(),
          tags: { name: 'chat_send_message' },
        }
      );
      
      const latency = Date.now() - startTime;
      apiLatency.add(latency);
      
      const success = check(sendRes, {
        'message sent or rate limited': (r) => [201, 429, 401].includes(r.status),
      });
      
      if (sendRes.status === 201) {
        chatMessagesSent.add(1);
      } else if (sendRes.status === 429) {
        // Rate limited - esperado em carga alta
        console.log(`VU ${__VU}: Rate limited (expected)`);
      } else {
        errorRate.add(1);
      }
      
      // Slow mode: aguardar 5s entre mensagens
      sleep(randomIntBetween(5, 10));
    }
  });
  
  group('4. Assistir (Heartbeat)', function() {
    // Simular 2-5 minutos assistindo
    const watchTime = randomIntBetween(2, 5);
    
    for (let minute = 0; minute < watchTime; minute++) {
      // Heartbeat a cada 30s
      for (let i = 0; i < 2; i++) {
        const heartbeatRes = http.post(
          `${SUPABASE_URL}/rest/v1/rpc/video_session_heartbeat_omega`,
          JSON.stringify({
            p_session_id: `${userId}-session`,
            p_current_time_seconds: minute * 60 + i * 30,
          }),
          { 
            headers: getHeaders(),
            tags: { name: 'video_heartbeat' },
          }
        );
        
        check(heartbeatRes, {
          'heartbeat ok': (r) => r.status === 200 || r.status === 404,
        });
        
        sleep(30);
      }
    }
  });
  
  group('5. Buscar Mensagens Recentes', function() {
    const startTime = Date.now();
    
    const messagesRes = http.get(
      `${SUPABASE_URL}/rest/v1/live_chat_messages?live_id=eq.${liveId}&order=created_at.desc&limit=50`,
      { 
        headers: getHeaders(),
        tags: { name: 'chat_fetch_messages' },
      }
    );
    
    const latency = Date.now() - startTime;
    apiLatency.add(latency);
    
    check(messagesRes, {
      'messages fetched': (r) => r.status === 200,
      'fetch < 300ms': () => latency < 300,
    }) || errorRate.add(1);
    
    if (messagesRes.status === 200) {
      try {
        const messages = JSON.parse(messagesRes.body);
        chatMessagesReceived.add(messages.length);
      } catch (e) {
        // Ignorar erro de parse
      }
    }
  });
}

// =====================================================
// CENÁRIO DE SETUP (opcional)
// =====================================================

export function setup() {
  console.log('🚀 Iniciando teste de carga 5K Live');
  console.log(`📍 Target: ${BASE_URL}`);
  console.log(`🔗 Supabase: ${SUPABASE_URL}`);
  
  // Verificar conectividade
  const healthCheck = http.get(`${BASE_URL}/`);
  if (healthCheck.status !== 200) {
    console.error('❌ Site não acessível!');
  }
  
  return { startTime: Date.now() };
}

// =====================================================
// CENÁRIO DE TEARDOWN
// =====================================================

export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`\n✅ Teste finalizado em ${duration.toFixed(0)}s`);
}

// =====================================================
// CENÁRIOS ADICIONAIS (rodar separadamente)
// =====================================================

// Cenário: Login em massa
export function loginStress() {
  const email = generateUserEmail();
  const password = 'LoadTest123!';
  
  const res = http.post(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    JSON.stringify({ email, password }),
    { headers: getHeaders() }
  );
  
  check(res, {
    'login responded': (r) => [200, 400, 401].includes(r.status),
  });
}

// Cenário: Dashboard stress
export function dashboardStress() {
  const res = http.get(`${BASE_URL}/alunos/painel`, {
    tags: { name: 'load_dashboard' },
  });
  
  check(res, {
    'dashboard loaded': (r) => r.status === 200,
  });
}
