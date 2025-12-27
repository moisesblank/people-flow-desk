# 🔥 Teste de Carga - 5.000 Usuários Ao Vivo

## Pré-requisitos

1. Instalar k6:
```bash
# macOS
brew install k6

# Windows
choco install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

## Executar Teste

### Teste Completo (5K ramp-up)
```bash
k6 run test-5k-live.js
```

### Teste Reduzido (500 usuários - validação)
```bash
k6 run --vus 100 --duration 2m test-5k-live.js
```

### Com variáveis de ambiente
```bash
k6 run \
  -e BASE_URL=https://pro.moisesmedeiros.com.br \
  -e SUPABASE_URL=https://fyikfsasudgzsjmumdlw.supabase.co \
  test-5k-live.js
```

### Exportar resultados
```bash
k6 run --out json=results.json test-5k-live.js
```

## Thresholds (GO/NO-GO)

| Métrica | Threshold | Descrição |
|---------|-----------|-----------|
| `errors` | < 0.5% | Taxa de erros total |
| `http_req_duration p95` | < 500ms | Latência p95 |
| `api_latency_ms p95` | < 300ms | Latência API p95 |
| `chat_latency_ms p95` | < 500ms | Latência chat p95 |
| `page_load_time_ms p95` | < 3000ms | LCP p95 |

## Cenários

### 1. Live Viewers (Principal)
- Ramp-up: 0 → 500 → 2000 → 5000 usuários
- Duração: 12 minutos
- Simula: Carrega página, conecta chat, envia mensagens, heartbeat

### 2. Login Stress (Separado)
```bash
k6 run -e SCENARIO=login --vus 100 --duration 1m test-5k-live.js
```

### 3. Dashboard Stress (Separado)
```bash
k6 run -e SCENARIO=dashboard --vus 200 --duration 2m test-5k-live.js
```

## Interpretando Resultados

### ✅ GO (Passou)
```
✓ errors........................: 0.12%  ✓ < 0.5%
✓ http_req_duration.............: p(95)=234ms ✓ < 500ms
✓ api_latency_ms................: p(95)=189ms ✓ < 300ms
✓ chat_latency_ms...............: p(95)=312ms ✓ < 500ms
```

### ❌ NO-GO (Reprovou)
```
✗ errors........................: 2.34%  ✗ > 0.5%
✗ http_req_duration.............: p(95)=1234ms ✗ > 500ms
```

## Troubleshooting

### Erro: "Too many open files"
```bash
ulimit -n 65535
```

### Erro: "Connection refused"
- Verificar se o site está acessível
- Verificar rate limits do Supabase

### Erro: "Rate limited"
- Esperado em carga alta
- Verificar se slow mode está ativo
