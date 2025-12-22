// ============================================
// 🔥 K6 LOAD TEST: PÁGINA DE LIVE (5.000 usuários)
// Cenário: Usuários acessando a página de aula ao vivo
// Executar: k6 run scripts/k6-live-page.js
// ============================================

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Métricas customizadas
const errorRate = new Rate('error_rate');
const pageLatency = new Trend('page_latency');
const apiLatency = new Trend('api_latency');
const successfulLoads = new Counter('successful_loads');

// Configuração do teste
export const options = {
  // Rampa de carga simulando entrada gradual
  stages: [
    { duration: '1m', target: 500 },   // Warmup: 500 usuários em 1 min
    { duration: '2m', target: 2000 },  // Escala: 2.000 em 2 min
    { duration: '2m', target: 4000 },  // Pico parcial: 4.000 em 2 min
    { duration: '3m', target: 5000 },  // Pico máximo: 5.000 sustentados
    { duration: '2m', target: 5000 },  // Sustentação: manter 5.000
    { duration: '2m', target: 1000 },  // Ramp-down: descer para 1.000
    { duration: '1m', target: 0 },     // Finalização
  ],
  
  // Thresholds GO/NO-GO
  thresholds: {
    http_req_duration: ['p(95)<3000', 'p(99)<5000'], // 95% < 3s, 99% < 5s
    error_rate: ['rate<0.005'],                      // Erros < 0.5%
    page_latency: ['p(95)<3500'],                    // Página < 3.5s
    api_latency: ['p(95)<500'],                      // API < 500ms
  },
  
  // Configurações de execução
  noConnectionReuse: false,
  userAgent: 'k6-load-test/1.0',
};

// URL base da aplicação
const BASE_URL = __ENV.BASE_URL || 'https://gestao.moisesmedeiros.com.br';

// Função principal executada por cada VU (Virtual User)
export default function () {
  // 1. Carregar página principal de Lives
  const livePageStart = Date.now();
  const livePage = http.get(`${BASE_URL}/lives`, {
    tags: { name: 'page_lives' },
    timeout: '10s',
  });
  
  const livePageDuration = Date.now() - livePageStart;
  pageLatency.add(livePageDuration);
  
  const pageOk = check(livePage, {
    'página carregou (status 200)': (r) => r.status === 200,
    'página tem conteúdo': (r) => r.body && r.body.length > 1000,
    'página carregou em < 5s': (r) => r.timings.duration < 5000,
  });
  
  errorRate.add(!pageOk);
  if (pageOk) successfulLoads.add(1);
  
  // Simular tempo de leitura da página
  sleep(randomBetween(1, 3));
  
  // 2. Simular carregamento de assets (JS chunks)
  const assetsRequests = [
    `${BASE_URL}/assets/vendor-react-*.js`,
    `${BASE_URL}/assets/vendor-ui-*.js`,
  ];
  
  // Batch request para assets (simulado como requests individuais)
  http.batch([
    ['GET', `${BASE_URL}/manifest.json`, null, { tags: { name: 'manifest' } }],
  ]);
  
  // 3. Simular polling do status da live (a cada 30s na prática)
  const apiStart = Date.now();
  const liveStatus = http.get(`${BASE_URL}/api/youtube-live/status`, {
    tags: { name: 'api_live_status' },
    timeout: '5s',
    headers: {
      'Accept': 'application/json',
    },
  });
  
  apiLatency.add(Date.now() - apiStart);
  
  check(liveStatus, {
    'API respondeu': (r) => r.status === 200 || r.status === 404,
    'API < 500ms': (r) => r.timings.duration < 500,
  });
  
  // 4. Simular tempo assistindo a live (30s - 2min)
  sleep(randomBetween(5, 15));
  
  // 5. Simular refresh ocasional do status
  if (Math.random() < 0.3) { // 30% dos usuários fazem refresh
    http.get(`${BASE_URL}/lives`, {
      tags: { name: 'page_refresh' },
      timeout: '10s',
    });
  }
  
  // 6. Tempo entre iterações
  sleep(randomBetween(20, 60));
}

// Função auxiliar para números aleatórios
function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

// Relatório ao final do teste
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'summary.json': JSON.stringify(data, null, 2),
  };
}

function textSummary(data, options) {
  const { metrics } = data;
  
  let summary = `
╔══════════════════════════════════════════════════════════════╗
║         🔥 RELATÓRIO DE TESTE DE CARGA - LIVE PAGE 🔥        ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  MÉTRICAS PRINCIPAIS:                                        ║
║  ├─ Total Requisições: ${metrics.http_reqs.values.count.toLocaleString().padStart(10)}                       ║
║  ├─ Requisições/s:     ${metrics.http_reqs.values.rate.toFixed(2).padStart(10)}                       ║
║  ├─ Taxa de Erro:      ${(metrics.error_rate?.values?.rate * 100 || 0).toFixed(2).padStart(9)}%                       ║
║  │                                                           ║
║  LATÊNCIA HTTP:                                              ║
║  ├─ Média:    ${(metrics.http_req_duration.values.avg).toFixed(0).padStart(8)}ms                              ║
║  ├─ p(50):    ${(metrics.http_req_duration.values['p(50)']).toFixed(0).padStart(8)}ms                              ║
║  ├─ p(95):    ${(metrics.http_req_duration.values['p(95)']).toFixed(0).padStart(8)}ms                              ║
║  └─ p(99):    ${(metrics.http_req_duration.values['p(99)']).toFixed(0).padStart(8)}ms                              ║
║                                                              ║
║  THRESHOLDS:                                                 ║
`;

  // Adicionar status dos thresholds
  for (const [name, threshold] of Object.entries(data.thresholds || {})) {
    const status = threshold.ok ? '✅ PASS' : '❌ FAIL';
    summary += `║  ├─ ${name.padEnd(30)} ${status.padStart(10)}    ║\n`;
  }

  summary += `╚══════════════════════════════════════════════════════════════╝\n`;
  
  return summary;
}
