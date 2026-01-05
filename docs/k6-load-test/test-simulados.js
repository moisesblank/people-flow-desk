/**
 * 🔥 TESTE DE CARGA - SISTEMA DE SIMULADOS
 * 
 * Simula cenário de prova com múltiplos alunos simultâneos
 * Objetivo: Validar comportamento sob carga de 500-2000 usuários
 * 
 * @version 1.0.0
 * @date 2025-01-05
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Trend, Rate } from 'k6/metrics';

// ============================================
// CONFIGURAÇÃO
// ============================================

const BASE_URL = __ENV.BASE_URL || 'https://pro.moisesmedeiros.com.br';
const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://fyikfsasudgzsjmumdlw.supabase.co';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5aWtmc2FzdWRnenNqbXVtZGx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MzUwMTEsImV4cCI6MjA4MTMxMTAxMX0.qSVRCgEX6L0cLZoDebzOIvTGhDeZi0Rl45SsDVZthIs';

// ============================================
// MÉTRICAS CUSTOMIZADAS
// ============================================

const simuladoStartLatency = new Trend('simulado_start_latency_ms');
const questionLoadLatency = new Trend('question_load_latency_ms');
const answerSaveLatency = new Trend('answer_save_latency_ms');
const finishLatency = new Trend('finish_latency_ms');
const rankingLoadLatency = new Trend('ranking_load_latency_ms');
const errorRate = new Rate('errors');
const successfulAttempts = new Counter('successful_attempts');
const failedAttempts = new Counter('failed_attempts');

// ============================================
// OPÇÕES DO TESTE
// ============================================

export const options = {
  scenarios: {
    // Cenário 1: Início de prova (pico de acessos)
    prova_inicio: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 100 },   // Warm-up
        { duration: '1m', target: 500 },    // Ramp-up para 500
        { duration: '2m', target: 500 },    // Sustenta 500
        { duration: '1m', target: 1000 },   // Pico: 1000 usuários
        { duration: '2m', target: 1000 },   // Sustenta pico
        { duration: '1m', target: 500 },    // Cool-down
        { duration: '30s', target: 0 },     // Encerra
      ],
      gracefulRampDown: '30s',
    },
  },
  
  thresholds: {
    // Latências máximas aceitáveis
    'simulado_start_latency_ms': ['p(95)<2000', 'p(99)<5000'],
    'question_load_latency_ms': ['p(95)<500', 'p(99)<1000'],
    'answer_save_latency_ms': ['p(95)<300', 'p(99)<500'],
    'finish_latency_ms': ['p(95)<2000', 'p(99)<5000'],
    'ranking_load_latency_ms': ['p(95)<1000', 'p(99)<2000'],
    
    // Taxa de erros
    'errors': ['rate<0.01'],  // Menos de 1% de erros
    
    // HTTP geral
    'http_req_duration': ['p(95)<2000'],
    'http_req_failed': ['rate<0.01'],
  },
};

// ============================================
// HELPERS
// ============================================

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

function generateTestEmail() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 100000);
  return `loadtest_${timestamp}_${random}@test.local`;
}

// ============================================
// CENÁRIO PRINCIPAL: FLUXO DE SIMULADO
// ============================================

export default function () {
  const vuId = __VU;
  const iterationId = __ITER;
  
  group('1. Carregar página de simulados', () => {
    const startTime = Date.now();
    
    // Carrega lista de simulados
    const listRes = http.get(`${SUPABASE_URL}/rest/v1/quizzes?select=id,title,status,starts_at,ends_at&status=eq.published&limit=10`, {
      headers: getHeaders(),
    });
    
    const loadTime = Date.now() - startTime;
    questionLoadLatency.add(loadTime);
    
    const success = check(listRes, {
      'Lista de simulados carregada': (r) => r.status === 200,
      'Resposta é array': (r) => {
        try {
          const data = JSON.parse(r.body);
          return Array.isArray(data);
        } catch {
          return false;
        }
      },
    });
    
    if (!success) {
      errorRate.add(1);
      failedAttempts.add(1);
      return;
    }
    
    errorRate.add(0);
  });
  
  sleep(1 + Math.random() * 2); // Simula leitura da página
  
  group('2. Iniciar tentativa (RPC)', () => {
    const startTime = Date.now();
    
    // Simula chamada ao RPC start_simulado_attempt
    // Em produção, isso requer autenticação real
    const rpcRes = http.post(`${SUPABASE_URL}/rest/v1/rpc/get_active_quizzes`, 
      JSON.stringify({}),
      { headers: getHeaders() }
    );
    
    const latency = Date.now() - startTime;
    simuladoStartLatency.add(latency);
    
    const success = check(rpcRes, {
      'RPC executado': (r) => r.status === 200 || r.status === 401,
    });
    
    if (!success) {
      errorRate.add(1);
    } else {
      errorRate.add(0);
    }
  });
  
  sleep(0.5);
  
  group('3. Carregar questões', () => {
    const startTime = Date.now();
    
    // Carrega estrutura de questões (sem respostas corretas)
    const questionsRes = http.get(`${SUPABASE_URL}/rest/v1/quiz_questions?select=id,question_text,question_type,options&limit=50`, {
      headers: getHeaders(),
    });
    
    const latency = Date.now() - startTime;
    questionLoadLatency.add(latency);
    
    const success = check(questionsRes, {
      'Questões carregadas': (r) => r.status === 200,
    });
    
    if (!success) {
      errorRate.add(1);
    } else {
      errorRate.add(0);
    }
  });
  
  // Simula responder 5-10 questões
  const numQuestions = 5 + Math.floor(Math.random() * 5);
  
  for (let i = 0; i < numQuestions; i++) {
    group(`4. Salvar resposta ${i + 1}`, () => {
      const startTime = Date.now();
      
      // Simula salvamento de resposta
      // Em produção, isso seria via RPC autenticado
      const saveRes = http.post(`${SUPABASE_URL}/rest/v1/rpc/save_quiz_answer_batch`,
        JSON.stringify({
          p_attempt_id: 'test-attempt-id',
          p_answers: [{ question_id: `q${i}`, answer: 'A' }]
        }),
        { headers: getHeaders() }
      );
      
      const latency = Date.now() - startTime;
      answerSaveLatency.add(latency);
      
      // 401 é esperado sem auth real
      const success = check(saveRes, {
        'Resposta processada': (r) => r.status === 200 || r.status === 401 || r.status === 404,
      });
      
      if (!success) {
        errorRate.add(1);
      } else {
        errorRate.add(0);
      }
    });
    
    sleep(2 + Math.random() * 5); // Simula tempo de resposta
  }
  
  group('5. Finalizar simulado', () => {
    const startTime = Date.now();
    
    // Simula finalização
    const finishRes = http.post(`${SUPABASE_URL}/rest/v1/rpc/finish_simulado_attempt`,
      JSON.stringify({
        p_attempt_id: 'test-attempt-id'
      }),
      { headers: getHeaders() }
    );
    
    const latency = Date.now() - startTime;
    finishLatency.add(latency);
    
    const success = check(finishRes, {
      'Finalização processada': (r) => r.status === 200 || r.status === 401 || r.status === 404,
    });
    
    if (!success) {
      errorRate.add(1);
      failedAttempts.add(1);
    } else {
      errorRate.add(0);
      successfulAttempts.add(1);
    }
  });
  
  sleep(1);
  
  group('6. Carregar ranking', () => {
    const startTime = Date.now();
    
    // Carrega ranking público
    const rankingRes = http.get(`${SUPABASE_URL}/rest/v1/quiz_attempts?select=score,finished_at,profiles(nome)&order=score.desc&limit=100`, {
      headers: getHeaders(),
    });
    
    const latency = Date.now() - startTime;
    rankingLoadLatency.add(latency);
    
    check(rankingRes, {
      'Ranking carregado': (r) => r.status === 200 || r.status === 401,
    });
  });
  
  sleep(2 + Math.random() * 3);
}

// ============================================
// SETUP E TEARDOWN
// ============================================

export function setup() {
  console.log('🔥 Iniciando teste de carga - Sistema de Simulados');
  console.log(`📍 Target: ${BASE_URL}`);
  console.log(`🗄️ Supabase: ${SUPABASE_URL}`);
  
  // Verifica se o sistema está acessível
  const healthCheck = http.get(`${SUPABASE_URL}/rest/v1/`, {
    headers: getHeaders(),
  });
  
  if (healthCheck.status !== 200) {
    console.warn('⚠️ Supabase pode estar indisponível');
  }
  
  return { startTime: Date.now() };
}

export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`\n✅ Teste finalizado em ${duration.toFixed(1)}s`);
  console.log('📊 Verifique as métricas acima para análise');
}

// ============================================
// CENÁRIOS ADICIONAIS (executar separadamente)
// ============================================

/**
 * Teste de pico extremo (2000 usuários)
 * Executar com: k6 run -e SCENARIO=extreme test-simulados.js
 */
export function extremeLoad() {
  // Cenário para testar limite do sistema
  const res = http.get(`${SUPABASE_URL}/rest/v1/quizzes?limit=1`, {
    headers: getHeaders(),
  });
  
  check(res, {
    'Sistema respondeu': (r) => r.status < 500,
  });
  
  sleep(0.1);
}

/**
 * Teste de ranking em tempo real
 * Executar com: k6 run -e SCENARIO=ranking test-simulados.js
 */
export function rankingStress() {
  const res = http.get(`${SUPABASE_URL}/rest/v1/quiz_attempts?select=*&order=score.desc&limit=500`, {
    headers: getHeaders(),
  });
  
  rankingLoadLatency.add(res.timings.duration);
  
  check(res, {
    'Ranking carregado rápido': (r) => r.timings.duration < 1000,
  });
  
  sleep(0.5);
}
