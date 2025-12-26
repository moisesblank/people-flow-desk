# 🔥 EXECUÇÃO DO TESTE 5.000 USUÁRIOS — RUNBOOK COMPLETO

> **FASE 3 — PROVA DE FOGO**
> Documento oficial para executar os 3 níveis de teste de carga

---

## 📋 PRÉ-REQUISITOS

### 1. Instalar K6
```bash
# macOS
brew install k6

# Windows (Chocolatey)
choco install k6

# Linux (Ubuntu/Debian)
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6
```

### 2. Verificar Instalação
```bash
k6 version
# Esperado: k6 v0.50.0 ou superior
```

### 3. Aumentar Limites do Sistema (Linux/Mac)
```bash
ulimit -n 65535
```

---

## 🎯 NÍVEIS DE TESTE

### NÍVEL 1: SMOKE TEST (10 usuários) — Garantir que nada quebra
```bash
cd docs/k6-load-test

k6 run \
  --vus 10 \
  --duration 1m \
  -e BASE_URL=https://pro.moisesmedeiros.com.br \
  -e SUPABASE_URL=https://fyikfsasudgzsjmumdlw.supabase.co \
  test-5k-live.js
```

**Thresholds GO:**
- ✅ `errors` < 1%
- ✅ `http_req_duration p95` < 500ms
- ✅ Sem erros 5xx

**Duração:** ~2 minutos

---

### NÍVEL 2: STRESS TEST (500 usuários) — Achar gargalos
```bash
cd docs/k6-load-test

k6 run \
  --vus 100 \
  --duration 3m \
  --stage 30s:100,1m:300,1m:500,30s:0 \
  -e BASE_URL=https://pro.moisesmedeiros.com.br \
  -e SUPABASE_URL=https://fyikfsasudgzsjmumdlw.supabase.co \
  --out json=stress-results.json \
  test-5k-live.js
```

**Thresholds GO:**
- ✅ `errors` < 0.5%
- ✅ `http_req_duration p95` < 500ms
- ✅ `api_latency_ms p95` < 300ms
- ✅ `chat_latency_ms p95` < 500ms

**Duração:** ~5 minutos

**O que observar:**
- Tempo de resposta do Supabase
- Rate limiting ativando corretamente
- Erros de conexão WebSocket
- Uso de memória do browser (se testar localmente)

---

### NÍVEL 3: FULL TEST (5.000 usuários) — Prova de Fogo
```bash
cd docs/k6-load-test

# ATENÇÃO: Este teste requer máquina potente ou k6 Cloud
k6 run \
  -e BASE_URL=https://pro.moisesmedeiros.com.br \
  -e SUPABASE_URL=https://fyikfsasudgzsjmumdlw.supabase.co \
  --out json=full-5k-results.json \
  test-5k-live.js
```

**Thresholds GO/NO-GO:**
| Métrica | Threshold | Ação se falhar |
|---------|-----------|----------------|
| `errors` | < 0.5% | ❌ NO-GO - Investigar erros |
| `http_req_duration p95` | < 500ms | ⚠️ Revisar CDN/cache |
| `api_latency_ms p95` | < 300ms | ⚠️ Otimizar queries |
| `chat_latency_ms p95` | < 500ms | ⚠️ Ativar slow mode |
| `page_load_time_ms p95` | < 3000ms | ⚠️ Revisar bundle size |

**Duração:** ~12 minutos (conforme stages no script)

---

## 📊 INTERPRETAR RESULTADOS

### ✅ PASSOU (GO)
```
✓ errors........................: 0.12%  ✓ < 0.5%
✓ http_req_duration.............: p(95)=234ms ✓ < 500ms
✓ api_latency_ms................: p(95)=189ms ✓ < 300ms
✓ chat_latency_ms...............: p(95)=312ms ✓ < 500ms
✓ page_load_time_ms.............: p(95)=2100ms ✓ < 3000ms
```

### ❌ REPROVOU (NO-GO)
```
✗ errors........................: 2.34%  ✗ > 0.5%
✗ http_req_duration.............: p(95)=1234ms ✗ > 500ms
```

**Ações se reprovar:**
1. Verificar logs do Supabase (Analytics Query)
2. Verificar logs das Edge Functions
3. Checar rate limiting
4. Revisar slow mode do chat
5. Considerar upgrade de instância Supabase

---

## 🔧 CENÁRIOS ADICIONAIS

### Login em Massa
```bash
k6 run -e SCENARIO=login --vus 100 --duration 1m test-5k-live.js
```

### Dashboard Stress
```bash
k6 run -e SCENARIO=dashboard --vus 200 --duration 2m test-5k-live.js
```

### Exportar para Análise
```bash
# JSON detalhado
k6 run --out json=results.json test-5k-live.js

# CSV para Excel
k6 run --out csv=results.csv test-5k-live.js
```

---

## 🚨 TROUBLESHOOTING

### Erro: "Too many open files"
```bash
ulimit -n 65535
```

### Erro: "Connection refused"
- Verificar se o site está acessível
- Verificar rate limits do Cloudflare
- Verificar se WAF não está bloqueando

### Erro: "Rate limited" (429)
- **Esperado** em carga alta
- Verificar se slow mode está configurado
- Ajustar `RATE_LIMIT_CONFIG` se necessário

### Erro: "WebSocket connection failed"
- Verificar limites do Supabase Realtime
- Considerar upgrade para Pro se necessário

---

## 📅 CRONOGRAMA PRÉ-EVENTO

| Tempo | Ação | Responsável |
|-------|------|-------------|
| T-7 dias | Smoke Test (10 usuários) | DevOps |
| T-3 dias | Stress Test (500 usuários) | DevOps |
| T-1 dia | Full Test (5000 simulado) | DevOps + Owner |
| T-1 hora | Verificar métricas baseline | DevOps |
| T-0 | Monitorar Live Monitor | Todos |

---

## 🎯 CHECKLIST FINAL PRÉ-5K

- [ ] Smoke Test passou
- [ ] Stress Test passou
- [ ] Full Test passou OU analisado
- [ ] Slow mode configurado (5s entre mensagens)
- [ ] Rate limiting ativo em todos os endpoints
- [ ] CDN/Cache configurado
- [ ] Player backup (YouTube) pronto
- [ ] Equipe de suporte posicionada
- [ ] Release freeze ativo
- [ ] Backup PITR confirmado

---

**Última atualização:** 2025-12-26
**Versão:** 1.0.0
**Autor:** SYNAPSE Ω DevSecOps
