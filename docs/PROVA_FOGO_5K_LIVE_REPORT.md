# 🔥 PROVA DE FOGO — RELATÓRIO 5.000 AO VIVO

**Data:** 2025-12-23  
**Projeto:** gestao.moisesmedeiros.com.br  
**Objetivo:** Validar capacidade para 5.000 usuários simultâneos em aula ao vivo

---

## 1) INVENTÁRIO FORENSE — INFRAESTRUTURA REAL

### 1.1 Supabase Cloud

| Recurso | Status Atual | Limite | Gap para 5K |
|---------|--------------|--------|-------------|
| **Compute** | `ci_xlarge` (upgrade 20/12) | Shared → Dedicated | ✅ Adequado |
| **Database Size** | 67 MB | 8 GB (Free) / 500GB (Pro) | ✅ OK |
| **Connection Pooling** | Supavisor ativo | 200-500 conexões | ⚠️ Monitorar |
| **Realtime** | Ativo | ~500 simultâneos (Free) / 10K (Pro) | ⚠️ Verificar plano |
| **Edge Functions** | Operacionais | 400K invocações/mês (Free) | ✅ OK |
| **Storage** | Configurado | 1GB (Free) / 100GB (Pro) | ✅ OK (vídeos externos) |

### 1.2 Hospedagem (Lovable Cloud)

| Recurso | Status |
|---------|--------|
| **Deploy** | Serverless via Lovable Cloud |
| **CDN** | Automático (edge caching) |
| **SSL** | Ativo |
| **Cold Starts** | Minimal (edge functions) |

### 1.3 Database Stats

| Tabela | Registros | Tamanho |
|--------|-----------|---------|
| `audit_logs` | 15.771 | 28 MB |
| `activity_log` | 2.966 | 2.2 MB |
| `user_sessions` | 1.962 | 2.6 MB |
| `profiles` | 7 | - |
| `alunos` | 39 | - |

### 1.4 Linter de Segurança (28 Warnings)

| Issue | Quantidade | Severidade | Ação |
|-------|------------|------------|------|
| Function Search Path Mutable | 26 | WARN | Adicionar `SET search_path = public` |
| Extension in Public | 1 | WARN | Mover extensões para schema `extensions` |
| Leaked Password Protection Disabled | 1 | WARN | Habilitar no Auth settings |

---

## 2) ARQUITETURA 5K LIVE — JÁ IMPLEMENTADA ✅

### 2.1 Vídeo ao Vivo (EXTERNO)

```
┌─────────────────────────────────────────────────────────────┐
│                     ARQUITETURA DE VÍDEO                    │
├─────────────────────────────────────────────────────────────┤
│  VÍDEO AO VIVO                                              │
│  ┌─────────────┐                                            │
│  │   YouTube   │─────────────────────────────────┐          │
│  │   Panda     │ ◄── Embed via iframe           │          │
│  │   Vimeo     │     (banda = provedor)         │          │
│  │   Cloudflare│                                │          │
│  └─────────────┘                                ▼          │
│                                        ┌─────────────────┐  │
│  PLATAFORMA (Lovable)                  │ OmegaFortress   │  │
│  ┌──────────────────────────┐          │ Player.tsx      │  │
│  │ - Valida acesso (RLS)    │◄─────────│ (825 linhas)    │  │
│  │ - Gera URL segura        │          └─────────────────┘  │
│  │ - Controla permissões    │                               │
│  │ - Log de auditoria       │                               │
│  └──────────────────────────┘                               │
└─────────────────────────────────────────────────────────────┘
```

**Implementação:**
- `src/components/video/OmegaFortressPlayer.tsx` (825 linhas)
- `src/hooks/useYouTubeLive.tsx` (309 linhas)
- Edge Function: `youtube-live`

### 2.2 Chat em Tempo Real (BATCH + REALTIME)

```
┌─────────────────────────────────────────────────────────────┐
│                   ARQUITETURA DE CHAT 5K                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  FRONTEND (React)                                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ LiveChatPanel.tsx (933 linhas)                       │   │
│  │ ├── Rate limiting: 1 msg/2s (normal) ou 1 msg/5s    │   │
│  │ ├── Slow Mode auto: >1000 viewers                   │   │
│  │ ├── Max 150 mensagens visíveis (virtualização)      │   │
│  │ ├── Role badges: Owner/Admin/Mod/Beta/Viewer        │   │
│  │ └── Moderação: pin, delete, ban                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                  │
│                          ▼                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ chatPersistence.ts (227 linhas)                      │   │
│  │ ├── Buffer de mensagens                              │   │
│  │ ├── Batch persist: 50 msgs ou 10s                   │   │
│  │ ├── Cleanup: mensagens >24h                         │   │
│  │ └── Upsert para evitar duplicatas                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                  │
│                          ▼                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Supabase Realtime                                    │   │
│  │ ├── Subscription: live_chat_messages                │   │
│  │ ├── Event: INSERT only                              │   │
│  │ └── Filter: live_id=eq.{liveId}                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Configuração (performance-5k.ts):**
```typescript
CHAT: {
  MIN_MESSAGE_INTERVAL: 2000,      // 1 msg a cada 2s
  SLOW_MODE_INTERVAL: 5000,        // 1 msg a cada 5s (pico)
  SLOW_MODE_THRESHOLD: 1000,       // Ativa slow mode >1000
  MAX_MESSAGES_PER_MINUTE: 20,
  MAX_MESSAGE_LENGTH: 280,
  MAX_VISIBLE_MESSAGES: 150,       // Virtualização
  BATCH_PERSIST_SIZE: 50,
  BATCH_PERSIST_INTERVAL: 10000,
  MESSAGE_RETENTION_MS: 86400000,  // 24h
}
```

---

## 3) CHECKLISTS EXECUTÁVEIS

### ✅ 3.1 Checklist de Performance (3G)

| Item | Status | Evidência |
|------|--------|-----------|
| Code splitting ativo | ✅ | Vite config |
| Lazy loading de rotas | ✅ | React.lazy() |
| Imagens com loading="lazy" | ⚠️ | Verificar componentes |
| Service Worker (PWA) | ⚠️ | Implementar |
| Bundle size <500KB (gzip) | ⚠️ | Auditar |
| LCP <2.5s em 3G | ⚠️ | Medir com Lighthouse |
| Chat virtualizado | ✅ | MAX_VISIBLE_MESSAGES: 150 |

### ✅ 3.2 Checklist de Banco/Queries

| Item | Status | Ação |
|------|--------|------|
| Índices em live_chat_messages | ✅ | live_id, created_at |
| Connection pooling ativo | ✅ | Supavisor |
| Queries com .limit() | ⚠️ | Auditar todas |
| Batch inserts | ✅ | chatPersistence.ts |
| Cleanup automático | ✅ | MESSAGE_RETENTION_MS |

### ✅ 3.3 Checklist de Realtime

| Item | Status | Limite |
|------|--------|--------|
| Subscription filtrada | ✅ | filter: live_id=eq.{id} |
| Apenas INSERT events | ✅ | event: 'INSERT' |
| Unsubscribe no unmount | ✅ | useEffect cleanup |
| Deduplicação | ✅ | Check msg.id exists |

### ⚠️ 3.4 Checklist de Segurança

| Item | Status | Ação Necessária |
|------|--------|-----------------|
| RLS em todas tabelas | ⚠️ | Auditar políticas |
| Functions com search_path | ❌ | **26 funções precisam fix** |
| Leaked Password Protection | ❌ | **Habilitar no Auth** |
| Extensions fora do public | ❌ | **Mover para extensions** |
| Rate limiting no backend | ✅ | sna_rate_limits |
| CORS configurado | ✅ | Edge Functions |

### ✅ 3.5 Checklist de Observabilidade

| Item | Status | Ferramenta |
|------|--------|------------|
| Logs estruturados | ✅ | console.log + Supabase |
| Métricas de chat | ✅ | sna_tool_runs |
| Alertas de erro | ⚠️ | Implementar |
| Dashboard de saúde | ✅ | Central de IAs |

---

## 4) GAPS CRÍTICOS IDENTIFICADOS

### 🔴 CRÍTICO (Bloqueia Go-Live)

| ID | Issue | Impacto | Ação |
|----|-------|---------|------|
| C1 | 26 funções sem search_path | SQL Injection risk | Migration para fix |
| C2 | Leaked Password Protection OFF | Senhas fracas | Ativar no dashboard |

### 🟡 ALTO (Deve resolver antes do pico)

| ID | Issue | Impacto | Ação |
|----|-------|---------|------|
| A1 | Verificar plano Realtime | Limite de conexões | Confirmar Pro/Enterprise |
| A2 | Bundle size não medido | Performance 3G | Lighthouse audit |
| A3 | PWA não implementado | Offline experience | Adicionar SW |

### 🟢 MÉDIO (Pode resolver após)

| ID | Issue | Impacto | Ação |
|----|-------|---------|------|
| M1 | Extensões em public | Security hygiene | Mover schema |
| M2 | Alertas não configurados | Resposta a incidentes | Implementar |

---

## 5) CAPACIDADE ESTIMADA

### 5.1 Cálculo de Throughput

**Chat (pior caso - todos enviando):**
- 5.000 usuários × 1 msg/5s (slow mode) = **1.000 msgs/s**
- Com batch de 50: **20 writes/s** no banco
- Realtime broadcast: **1.000 eventos/s**

**Realidade (típico):**
- ~10% enviam mensagens = 500 usuários ativos
- 500 × 1 msg/10s (média) = **50 msgs/s**
- Broadcast: **50 eventos/s** (muito gerenciável)

### 5.2 Limites do Supabase

| Recurso | Limite Free | Limite Pro | Necessário 5K |
|---------|-------------|------------|---------------|
| Realtime connections | 200 | 500-10K | ⚠️ Pro mínimo |
| Realtime messages/s | 100 | 1000+ | ✅ Pro OK |
| Database connections | 60 | 500 | ✅ OK |
| Edge invocations | 400K/mês | 2M/mês | ✅ OK |

---

## 6) PLANO DE AÇÃO PRIORIZADO

### Fase 1: Segurança (HOJE)
1. [ ] Habilitar Leaked Password Protection
2. [ ] Criar migration para fix de search_path (26 funções)

### Fase 2: Performance (ESTA SEMANA)
1. [ ] Rodar Lighthouse em 3G throttled
2. [ ] Implementar PWA básico (service worker)
3. [ ] Verificar bundle size

### Fase 3: Teste de Carga (ANTES DO EVENTO)
1. [ ] Criar script k6 para simular 5K
2. [ ] Testar Realtime com múltiplas conexões
3. [ ] Monitorar CPU/RAM durante teste

---

## 7) VEREDICTO GO/NO-GO

| Critério | Status | Nota |
|----------|--------|------|
| Arquitetura de Vídeo | ✅ GO | Externos (YouTube/Panda/Vimeo) |
| Arquitetura de Chat | ✅ GO | Batch + Rate limiting implementado |
| Segurança | ⚠️ CONDITIONAL | Precisa fix de search_path |
| Performance Frontend | ⚠️ CONDITIONAL | Precisa audit de bundle |
| Realtime Capacity | ⚠️ CONDITIONAL | Confirmar plano Pro |
| Observabilidade | ✅ GO | Central de IAs + logs |

### RESULTADO: 🟡 CONDITIONAL GO

**Pode fazer o evento**, mas ANTES:
1. ✅ Fix de segurança (search_path)
2. ✅ Confirmar plano Supabase Pro/Enterprise para Realtime
3. ⚠️ Testar com 100-500 usuários simulados primeiro

---

## 8) PRÓXIMOS PASSOS

Deseja que eu execute alguma das ações abaixo?

1. **Criar migration** para corrigir as 26 funções com search_path mutable
2. **Criar script k6** para teste de carga
3. **Implementar PWA** básico
4. **Auditar bundle size** e otimizar

---

*Relatório gerado automaticamente pela análise da Lovable (Mestre)*
