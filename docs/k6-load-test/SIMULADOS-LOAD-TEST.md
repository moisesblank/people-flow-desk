# 🔥 TESTE DE CARGA — SISTEMA DE SIMULADOS

> **Versão:** 1.0.0 | **Data:** 2025-01-05
> **Status:** DOCUMENTADO | **Próximo:** Execução em staging

---

## 📋 VISÃO GERAL

Este documento define o plano de teste de carga para o **Sistema de Simulados**, garantindo que suporte **500-2000 usuários simultâneos** durante provas oficiais.

### Cenários de Uso Real

| Evento | Usuários Esperados | Duração | Criticidade |
|--------|-------------------|---------|-------------|
| Simulado semanal | 100-300 | 2-4 horas | Alta |
| Simulado mensal | 500-800 | 3-4 horas | Crítica |
| ENEM simulado | 1000-2000 | 5 horas | Máxima |

---

## 🎯 OBJETIVOS

### Métricas de Sucesso (GO/NO-GO)

| Métrica | Threshold | Crítico |
|---------|-----------|---------|
| `simulado_start_latency_ms p95` | < 2000ms | < 5000ms |
| `question_load_latency_ms p95` | < 500ms | < 1000ms |
| `answer_save_latency_ms p95` | < 300ms | < 500ms |
| `finish_latency_ms p95` | < 2000ms | < 5000ms |
| `ranking_load_latency_ms p95` | < 1000ms | < 2000ms |
| Taxa de erros | < 1% | < 5% |
| HTTP status 5xx | < 0.1% | < 1% |

### Pontos Críticos Identificados

1. **RPC `start_simulado_attempt`** — Lock de concorrência
2. **RPC `finish_simulado_attempt`** — Cálculo de score + XP
3. **Query de ranking** — Ordenação de milhares de registros
4. **Autosave de respostas** — Alta frequência de writes

---

## 🏗️ ARQUITETURA SOB TESTE

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                        │
│  - useSimuladoState (gerencia estado)                       │
│  - useSimuladoLock (previne concorrência)                   │
│  - Autosave a cada resposta                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE (Lovable Cloud)                  │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ Edge Functions  │  │   PostgreSQL    │                   │
│  │ - rate-limit    │  │ - quiz_attempts │                   │
│  │ - api-gateway   │  │ - quiz_answers  │                   │
│  └─────────────────┘  │ - quiz_questions│                   │
│                       │ - quizzes       │                   │
│  ┌─────────────────┐  └─────────────────┘                   │
│  │  RPCs (SECURITY │                                        │
│  │    DEFINER)     │  ┌─────────────────┐                   │
│  │ - start_attempt │  │    Realtime     │                   │
│  │ - finish_attempt│  │ - ranking live  │                   │
│  │ - save_answers  │  └─────────────────┘                   │
│  └─────────────────┘                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 EXECUÇÃO

### Pré-requisitos

```bash
# Instalar k6
brew install k6          # macOS
choco install k6         # Windows
sudo apt install k6      # Linux

# Verificar versão
k6 version  # >= 0.50.0
```

### Comandos de Execução

#### 1. Smoke Test (validação básica)
```bash
cd docs/k6-load-test

k6 run \
  --vus 10 \
  --duration 1m \
  -e BASE_URL=https://pro.moisesmedeiros.com.br \
  -e SUPABASE_URL=https://fyikfsasudgzsjmumdlw.supabase.co \
  test-simulados.js
```

#### 2. Stress Test (500 usuários)
```bash
k6 run \
  --vus 100 \
  --duration 5m \
  --stage 1m:500,3m:500,1m:0 \
  -e BASE_URL=https://pro.moisesmedeiros.com.br \
  --out json=simulados-stress-results.json \
  test-simulados.js
```

#### 3. Full Load Test (cenário completo)
```bash
k6 run \
  -e BASE_URL=https://pro.moisesmedeiros.com.br \
  -e SUPABASE_URL=https://fyikfsasudgzsjmumdlw.supabase.co \
  --out json=simulados-full-results.json \
  test-simulados.js
```

#### 4. Teste de Pico Extremo (2000 usuários)
```bash
k6 run \
  --vus 200 \
  --duration 3m \
  --stage 30s:500,1m:1000,1m:2000,30s:0 \
  test-simulados.js
```

---

## 📊 ANÁLISE DE RESULTADOS

### ✅ PASSOU (GO)
```
✓ simulado_start_latency_ms......: p(95)=1234ms ✓ < 2000ms
✓ question_load_latency_ms.......: p(95)=345ms  ✓ < 500ms
✓ answer_save_latency_ms.........: p(95)=189ms  ✓ < 300ms
✓ finish_latency_ms..............: p(95)=1567ms ✓ < 2000ms
✓ errors.........................: 0.34%        ✓ < 1%
```

### ❌ REPROVOU (NO-GO)
```
✗ simulado_start_latency_ms......: p(95)=4567ms ✗ > 2000ms
✗ errors.........................: 3.45%        ✗ > 1%
```

### Ações por Falha

| Falha | Causa Provável | Ação |
|-------|---------------|------|
| `start_latency` alto | Lock contention | Revisar RPC de início |
| `answer_save` alto | Writes excessivos | Implementar batch save |
| `ranking` alto | Query não otimizada | Adicionar índices |
| Taxa de erros alta | Rate limiting | Ajustar limites |
| 5xx errors | Timeout de conexão | Aumentar pool |

---

## 🔧 OTIMIZAÇÕES IMPLEMENTADAS

### 1. Índices Críticos (já aplicados)
```sql
-- Índice para lookup de tentativas ativas
CREATE INDEX idx_quiz_attempts_user_quiz_active 
ON quiz_attempts(user_id, quiz_id) 
WHERE status = 'running';

-- Índice para ranking
CREATE INDEX idx_quiz_attempts_score_desc 
ON quiz_attempts(quiz_id, score DESC, finished_at);

-- Índice para respostas
CREATE INDEX idx_quiz_answers_attempt 
ON quiz_answers(attempt_id);
```

### 2. RPCs Otimizadas
- `start_simulado_attempt`: Lock advisory para evitar duplicatas
- `finish_simulado_attempt`: Cálculo atômico de score
- `save_quiz_answer_batch`: Upsert em lote

### 3. Cache Strategy
```typescript
// React Query config para simulados
{
  staleTime: 0,           // Sempre fresh durante prova
  gcTime: 5 * 60 * 1000,  // 5 min cache
  refetchOnMount: true,
  refetchOnWindowFocus: false,  // Evita refetch desnecessário
}
```

### 4. Rate Limiting
| Endpoint | Limite | Janela |
|----------|--------|--------|
| `start_attempt` | 5 req | 1 min |
| `save_answer` | 60 req | 1 min |
| `finish_attempt` | 5 req | 1 min |

---

## 📅 CRONOGRAMA DE TESTES

| Fase | Data | Responsável | VUs | Duração |
|------|------|-------------|-----|---------|
| Smoke | T-7 dias | DevOps | 10 | 1 min |
| Stress | T-3 dias | DevOps | 500 | 5 min |
| Full | T-1 dia | DevOps + Owner | 1000 | 10 min |
| Validação | T-1 hora | DevOps | 100 | 2 min |

---

## 🚨 CONTINGÊNCIA

### Durante o Teste
1. **Se erros > 5%**: Parar teste imediatamente
2. **Se latência > 10s**: Verificar logs do Supabase
3. **Se 5xx > 1%**: Verificar edge functions

### Durante Prova Real
1. **Feature flag**: Desativar hard mode se necessário
2. **Fallback**: Extensão automática de tempo
3. **Comunicação**: Canal de suporte ativo

---

## ✅ CHECKLIST PRÉ-PROVA

- [ ] Smoke test passou
- [ ] Stress test passou (500 VUs)
- [ ] Índices verificados
- [ ] RPCs otimizadas
- [ ] Rate limiting configurado
- [ ] Logs habilitados
- [ ] Alertas configurados
- [ ] Equipe de plantão definida
- [ ] Canais de comunicação prontos
- [ ] Backup PITR confirmado

---

## 📚 REFERÊNCIAS

- [K6 Documentation](https://k6.io/docs/)
- [Supabase Performance](https://supabase.com/docs/guides/platform/performance)
- [Constituição Simulados v2.0.0](../SIMULADOS_CONSTITUTION_v2.0.0.md)
- [LGPD Compliance](../LGPD_SIMULADOS_COMPLIANCE.md)

---

**Última atualização:** 2025-01-05
**Versão:** 1.0.0
**Autor:** SYNAPSE Ω DevSecOps
