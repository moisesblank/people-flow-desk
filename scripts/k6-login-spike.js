// ============================================
// 🔥 K6 LOAD TEST: LOGIN SPIKE (500 logins em 10min)
// Cenário: Pico de logins antes da live começar
// Executar: k6 run scripts/k6-login-spike.js
// ============================================

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Métricas customizadas
const errorRate = new Rate('error_rate');
const loginLatency = new Trend('login_latency');
const successfulLogins = new Counter('successful_logins');
const rateLimited = new Counter('rate_limited');

// Configuração do teste
export const options = {
  stages: [
    { duration: '1m', target: 50 },    // Início gradual
    { duration: '2m', target: 150 },   // Escala
    { duration: '3m', target: 300 },   // Pico moderado
    { duration: '2m', target: 500 },   // Pico máximo
    { duration: '2m', target: 100 },   // Ramp-down
  ],
  
  thresholds: {
    http_req_duration: ['p(95)<3000'],  // 95% < 3s
    error_rate: ['rate<0.05'],          // Erros < 5% (logins podem falhar por credenciais)
    login_latency: ['p(95)<2000'],      // Login < 2s
  },
};

// Configuração do Supabase
const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://fyikfsasudgzsjmumdlw.supabase.co';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || 'your-anon-key-here';

// Pool de usuários de teste (criar no banco antes do teste)
const TEST_USERS = [
  { email: 'test1@example.com', password: 'TestPassword123!' },
  { email: 'test2@example.com', password: 'TestPassword123!' },
  { email: 'test3@example.com', password: 'TestPassword123!' },
  // Adicionar mais usuários conforme necessário
];

export default function () {
  // Selecionar usuário aleatório (ou gerar)
  const userIndex = __VU % TEST_USERS.length;
  const user = TEST_USERS[userIndex] || {
    email: `loadtest_${__VU}@example.com`,
    password: 'LoadTest123!',
  };
  
  // 1. Tentar login
  const startTime = Date.now();
  
  const loginRes = http.post(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    JSON.stringify({
      email: user.email,
      password: user.password,
    }),
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      tags: { name: 'login' },
      timeout: '10s',
    }
  );
  
  const latency = Date.now() - startTime;
  loginLatency.add(latency);
  
  // Verificar resultado
  const loginOk = check(loginRes, {
    'login sucesso (200)': (r) => r.status === 200,
    'token retornado': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.access_token !== undefined;
      } catch {
        return false;
      }
    },
  });
  
  // Rate limit é esperado sob carga
  if (loginRes.status === 429) {
    rateLimited.add(1);
    check(loginRes, {
      'rate limit (esperado sob carga)': (r) => r.status === 429,
    });
  } else if (loginRes.status === 400) {
    // Credenciais inválidas (esperado para usuários de teste)
    check(loginRes, {
      'credenciais inválidas (esperado)': (r) => r.status === 400,
    });
  } else if (!loginOk) {
    errorRate.add(1);
  } else {
    successfulLogins.add(1);
  }
  
  // 2. Se login OK, simular navegação para dashboard
  if (loginRes.status === 200) {
    try {
      const body = JSON.parse(loginRes.body);
      const token = body.access_token;
      
      sleep(randomBetween(0.5, 1));
      
      // Buscar perfil do usuário
      const profileRes = http.get(
        `${SUPABASE_URL}/rest/v1/profiles?select=*&limit=1`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${token}`,
          },
          tags: { name: 'get_profile' },
        }
      );
      
      check(profileRes, {
        'perfil carregado': (r) => r.status === 200,
      });
      
      sleep(randomBetween(0.5, 1));
      
      // Simular navegação para página de lives
      const livesRes = http.get(
        `${SUPABASE_URL}/rest/v1/youtube_lives?status=eq.live&limit=1`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${token}`,
          },
          tags: { name: 'check_lives' },
        }
      );
      
      check(livesRes, {
        'lives carregadas': (r) => r.status === 200,
      });
      
    } catch (e) {
      // Erro ao parsear resposta
    }
  }
  
  // 3. Intervalo entre tentativas de login
  sleep(randomBetween(2, 5));
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

// Relatório customizado
export function handleSummary(data) {
  const { metrics } = data;
  
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║            🔥 RELATÓRIO DE TESTE - LOGIN SPIKE 🔥            ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  LOGINS:                                                     ║
║  ├─ Total Tentativas:  ${(metrics.http_reqs?.values?.count || 0).toLocaleString().padStart(10)}                       ║
║  ├─ Logins/segundo:    ${(metrics.http_reqs?.values?.rate || 0).toFixed(2).padStart(10)}                       ║
║  ├─ Sucessos:          ${(metrics.successful_logins?.values?.count || 0).toLocaleString().padStart(10)}                       ║
║  ├─ Rate Limited:      ${(metrics.rate_limited?.values?.count || 0).toLocaleString().padStart(10)}                       ║
║  ├─ Taxa de Erro:      ${((metrics.error_rate?.values?.rate || 0) * 100).toFixed(2).padStart(9)}%                       ║
║                                                              ║
║  LATÊNCIA DE LOGIN:                                          ║
║  ├─ Média:    ${(metrics.login_latency?.values?.avg || 0).toFixed(0).padStart(8)}ms                              ║
║  ├─ p(95):    ${(metrics.login_latency?.values?.['p(95)'] || 0).toFixed(0).padStart(8)}ms                              ║
║  ├─ p(99):    ${(metrics.login_latency?.values?.['p(99)'] || 0).toFixed(0).padStart(8)}ms                              ║
║                                                              ║
║  NOTA: Rate limiting é ESPERADO e DESEJADO sob carga.        ║
║  Protege o sistema contra ataques de força bruta.            ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
  
  return {
    'login-summary.json': JSON.stringify(data, null, 2),
  };
}
