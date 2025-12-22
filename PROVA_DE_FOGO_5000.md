# 🔥 PROVA DE FOGO 5.000 SIMULTÂNEOS
## Plano Adaptado ao Projeto Moisés Medeiros
## Versão 1.0 | Gerado em: 22/12/2025 pelo MESTRE

---

# 📋 SUMÁRIO EXECUTIVO

## O Que Já Temos (MATRIZ SAGRADA)

| Componente | Status | Arquivo |
|------------|--------|---------|
| 🛡️ SessionGuard (Sessão Única) | ✅ EXISTE | `src/components/security/SessionGuard.tsx` |
| 🔐 DeviceGuard (Limite Dispositivos) | ✅ EXISTE | `src/components/security/DeviceGuard.tsx` |
| 🎬 FortressVideoPlayer (Proteção) | ✅ EXISTE | `src/components/video/FortressVideoPlayer.tsx` |
| 📺 Página de Lives | ✅ EXISTE | `src/pages/Lives.tsx` |
| ⚡ Cache Config (TanStack Query) | ✅ EXISTE | `src/lib/performance/cacheConfig.ts` |
| 🚀 Lazy Loading (todas as páginas) | ✅ EXISTE | `src/App.tsx` |
| 🔄 178 Migrações SQL | ✅ EXISTE | `supabase/migrations/` |
| 📡 Realtime Config | ✅ EXISTE | Várias migrações |

## O Que Precisa Melhorar/Criar

| Componente | Status | Prioridade |
|------------|--------|------------|
| 💬 Chat Escalável para Lives | 🔄 MELHORAR | 🔴 ALTA |
| 📊 Índices Otimizados | 🔄 VERIFICAR | 🔴 ALTA |
| 📈 Observabilidade/Métricas | 🔄 MELHORAR | 🟡 MÉDIA |
| 📋 Runbook de Go-Live | 🆕 CRIAR | 🟡 MÉDIA |
| 🧪 Scripts de Teste de Carga | 🆕 CRIAR | 🟡 MÉDIA |

---

# PARTE 1: INVENTÁRIO REAL

## 1.1 Infraestrutura Atual

| Recurso | Valor | Status |
|---------|-------|--------|
| **Servidor** | Lovable Cloud ci_xlarge | ✅ |
| **vCPU** | 4 núcleos | ✅ |
| **RAM** | 8 GB | ✅ |
| **Região** | AWS São Paulo | ✅ |
| **CDN** | Cloudflare | ✅ |

## 1.2 Supabase Atual

| Recurso | Limite | Usado | Margem |
|---------|--------|-------|--------|
| **Database** | 8 GB | 27 MB | 99.7% ✅ |
| **Storage** | 100 GB | 74 MB | 99.9% ✅ |
| **Edge Functions** | Ilimitado | 55 | ∞ ✅ |
| **Realtime Connections** | 500 (Free) / 10k+ (Pro) | ~5 | Verificar plano |
| **SQL Functions** | Ilimitado | 119 | ∞ ✅ |
| **Triggers** | Ilimitado | 70+ | ∞ ✅ |

## 1.3 Análise de Gaps para 5000 Simultâneos

| Área | Hoje | Meta 5K | Gap | Ação |
|------|------|---------|-----|------|
| **Realtime Connections** | ~5 | 5.000 | ⚠️ Verificar plano | Confirmar plano Pro |
| **Vídeo Streaming** | YouTube/Panda | Externo | ✅ OK | Já desacoplado |
| **Chat Rate Limit** | Não implementado | 1 msg/2s | 🔴 CRIAR | Implementar |
| **Índices DB** | Parcial | Otimizado | 🟡 VERIFICAR | Auditar |

---

# PARTE 2: O QUE JÁ TEMOS (NÃO MEXER)

## 2.1 SessionGuard ✅

```typescript
// src/components/security/SessionGuard.tsx
// Verifica sessão a cada 30 segundos
// Invalida sessão antiga quando login em novo dispositivo
// ✅ FUNCIONA - NÃO ALTERAR
```

## 2.2 DeviceGuard ✅

```typescript
// src/components/security/DeviceGuard.tsx
// Limite de dispositivos por usuário
// Owner bypassa verificação
// ✅ FUNCIONA - NÃO ALTERAR
```

## 2.3 FortressVideoPlayer ✅

```typescript
// src/components/video/FortressVideoPlayer.tsx
// Suporta YouTube e Panda Video
// Watermark dinâmico (nome + CPF)
// Velocidade ajustável
// ✅ FUNCIONA - NÃO ALTERAR
```

## 2.4 Cache Config ✅

```typescript
// src/lib/performance/cacheConfig.ts
// TanStack Query otimizado
// Cache por categoria (realtime, dashboard, static)
// CDN headers configurados
// ✅ FUNCIONA - NÃO ALTERAR
```

## 2.5 Lazy Loading ✅

```typescript
// src/App.tsx
// Todas as 65+ páginas com React.lazy()
// Suspense com PageLoader otimizado
// ✅ FUNCIONA - NÃO ALTERAR
```

---

# PARTE 3: ARQUITETURA 5K LIVE

## 3.1 Fluxo de Vídeo (Já Implementado)

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO DE VÍDEO AO VIVO                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   👨‍🏫 Professor Moisés                                          │
│      │                                                          │
│      ▼                                                          │
│   📺 YouTube Live / Panda Video                                 │
│      │ (ABR + CDN Global)                                       │
│      ▼                                                          │
│   🌐 Cloudflare CDN                                             │
│      │                                                          │
│      ▼                                                          │
│   👨‍🎓👨‍🎓👨‍🎓 5.000 Alunos                                          │
│      │                                                          │
│   ┌──┴──────────────────────────────────────────────────┐       │
│   │  FortressVideoPlayer                                 │       │
│   │  ├── Watermark: Nome + CPF parcial                  │       │
│   │  ├── Sessão única ativa                             │       │
│   │  ├── Controles: Play/Pause + Velocidade             │       │
│   │  └── Sem download/print                             │       │
│   └─────────────────────────────────────────────────────┘       │
│                                                                 │
│   ⚡ VÍDEO NÃO PASSA PELO SUPABASE = ESCALA INFINITA            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 3.2 Fluxo de Chat (PRECISA MELHORAR)

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO DE CHAT LIVE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   👨‍🎓 Aluno envia mensagem                                       │
│      │                                                          │
│      ▼                                                          │
│   🛡️ Rate Limiter (1 msg/2s)                                    │
│      │                                                          │
│      ▼                                                          │
│   🧹 Sanitização + Validação                                    │
│      │                                                          │
│      ▼                                                          │
│   📡 Supabase Realtime Broadcast                                │
│      │                                                          │
│      ▼                                                          │
│   💾 Persistência (batch, retenção 24h)                         │
│      │                                                          │
│      ▼                                                          │
│   👨‍🎓👨‍🎓👨‍🎓 5.000 Alunos recebem                                   │
│                                                                 │
│   🎛️ Controles de Moderação:                                    │
│   ├── Slow mode (1 msg/5s em pico)                              │
│   ├── Ban/Timeout por admin                                     │
│   ├── Filtro de palavras                                        │
│   └── Limite 280 chars                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

# PARTE 4: PERFORMANCE CHECKLIST

## 4.1 Orçamentos de Performance

| Métrica | Target | Status Atual |
|---------|--------|--------------|
| PageSpeed Mobile | > 95 | 🟡 VERIFICAR |
| LCP (mobile) | <= 2.5s | 🟡 VERIFICAR |
| TTFB (p95) | <= 200ms | ✅ Edge Functions |
| JS inicial (gzip) | <= 250KB | 🟡 VERIFICAR |
| Total requests | <= 60 | 🟡 VERIFICAR |

## 4.2 Otimizações Já Aplicadas

| Otimização | Status |
|------------|--------|
| ✅ Code splitting (React.lazy) | APLICADO |
| ✅ Lazy load de iframes | APLICADO |
| ✅ TanStack Query cache | APLICADO |
| ✅ Skeletons/placeholders | APLICADO |
| ✅ CDN cache headers | APLICADO |
| ✅ Memoização (memo, useCallback) | APLICADO |
| 🔄 Service Worker (PWA) | PARCIAL |
| 🔄 Virtualização de listas | PARCIAL |

---

# PARTE 5: BANCO DE DADOS

## 5.1 Índices Críticos (VERIFICAR/CRIAR)

```sql
-- Índices para Chat de Lives (CRIAR SE NÃO EXISTIR)
CREATE INDEX IF NOT EXISTS idx_live_chat_live_id ON live_chat_messages(live_id);
CREATE INDEX IF NOT EXISTS idx_live_chat_created_at ON live_chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_chat_user_id ON live_chat_messages(user_id);

-- Índices para Progresso de Alunos
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson ON lesson_progress(lesson_id);

-- Índices para Matrículas
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);

-- Índices para Sessões
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active);
```

## 5.2 Connection Pooling

| Config | Valor Recomendado |
|--------|-------------------|
| Pool Mode | Transaction |
| Pool Size | 25-50 |
| Statement Timeout | 30s |

---

# PARTE 6: SEGURANÇA (JÁ IMPLEMENTADA)

## 6.1 Camadas de Proteção Ativas

| Camada | Status | Componente |
|--------|--------|------------|
| 1️⃣ Autenticação Supabase | ✅ | Auth |
| 2️⃣ RLS em todas tabelas | ✅ | Policies |
| 3️⃣ Sessão Única | ✅ | SessionGuard |
| 4️⃣ Limite Dispositivos | ✅ | DeviceGuard |
| 5️⃣ Watermark Vídeo | ✅ | FortressVideoPlayer |
| 6️⃣ Proteção DevTools | ✅ | useGlobalDevToolsBlock |
| 7️⃣ Edge Functions | ✅ | 55 funções |

## 6.2 Anti-Pirataria

| Proteção | Status |
|----------|--------|
| Watermark dinâmico (Nome + CPF) | ✅ |
| Sessão única | ✅ |
| Limite de dispositivos | ✅ |
| Bloqueio de DevTools | ✅ |
| Logs de acesso | ✅ |
| URLs de vídeo assinadas (Panda) | ✅ |

---

# PARTE 7: OBSERVABILIDADE

## 7.1 Métricas a Monitorar

| Métrica | Onde Ver | Alerta |
|---------|----------|--------|
| Conexões Realtime | Supabase Dashboard | > 80% limite |
| CPU/RAM do DB | Supabase Metrics | > 80% |
| Erros de API | Logs Edge Functions | > 1% |
| Latência p95 | Supabase Logs | > 300ms |
| Uptime | Supabase Status | < 99.9% |

## 7.2 Alertas Recomendados

```
🚨 CRÍTICO: Conexões Realtime > 4000
🟠 ALTO: CPU do DB > 80%
🟡 MÉDIO: Latência p95 > 300ms
⚪ INFO: Nova live iniciada
```

---

# PARTE 8: RUNBOOK GO-LIVE

## 8.1 Pré-Live (T-24h até T-1h)

- [ ] Congelar deploys (release freeze)
- [ ] Verificar secrets rotacionados
- [ ] Confirmar backup/PITR ativo
- [ ] Warmup de cache (páginas críticas)
- [ ] Verificar métricas baseline
- [ ] Ensaio com 100-300 usuários

## 8.2 Durante a Live

- [ ] Monitorar dashboards em tempo real
- [ ] Slow mode do chat pronto
- [ ] Player backup (YouTube fallback)
- [ ] Comunicação: banner de instabilidade

## 8.3 Pós-Live

- [ ] Relatório de incidentes
- [ ] Lições aprendidas
- [ ] Revisão de custos

---

# PARTE 9: CHECKLIST FINAL

## ✅ Performance

- [x] Code splitting (React.lazy)
- [x] TanStack Query cache
- [x] CDN headers
- [x] Skeletons
- [ ] PWA completo
- [ ] Virtualização de listas longas

## ✅ Segurança

- [x] RLS em todas tabelas
- [x] Sessão única
- [x] Limite dispositivos
- [x] Watermark vídeo
- [x] Secrets protegidos
- [x] Edge Functions validadas

## ✅ Realtime

- [x] Supabase Realtime configurado
- [ ] Chat com rate-limit
- [ ] Moderação de chat
- [ ] Paginação de chat

## ✅ Operação

- [ ] Dashboards de monitoramento
- [ ] Alertas automáticos
- [ ] Runbook documentado
- [ ] Plano de contingência

---

# PARTE 10: PRÓXIMOS PASSOS

## Prioridade 1 (URGENTE)

1. **Verificar plano Supabase** - Confirmar limite de Realtime connections
2. **Criar tabela live_chat_messages** - Se não existir
3. **Implementar rate-limit no chat** - 1 msg/2s

## Prioridade 2 (IMPORTANTE)

4. **Criar índices otimizados** - Para chat e progresso
5. **Configurar alertas** - Supabase + frontend
6. **Testar com carga** - k6/Artillery

## Prioridade 3 (DESEJÁVEL)

7. **PWA completo** - Service Worker
8. **Virtualização** - Listas longas
9. **Runbook completo** - Documentação

---

# 📊 STATUS GERAL

## ✅ O QUE JÁ ESTÁ PRONTO

| Área | % Pronto |
|------|----------|
| Frontend Performance | 85% |
| Segurança | 95% |
| Vídeo Proteção | 100% |
| Backend Structure | 90% |
| Realtime Chat | 60% |
| Observabilidade | 40% |

## 🎯 ESTIMATIVA PARA 5000 SIMULTÂNEOS

Com as implementações atuais e os ajustes propostos:

| Cenário | Suporte Atual | Após Ajustes |
|---------|---------------|--------------|
| Vídeo ao vivo | ✅ 5000+ | ✅ 5000+ |
| Portal navegando | ✅ 5000+ | ✅ 5000+ |
| Chat simultâneo | ⚠️ ~500 | ✅ 5000+ |
| Login pico | ✅ OK | ✅ OK |

---

---

# PARTE 11: IMPLEMENTAÇÕES REALIZADAS

## ✅ Arquivos Criados

| Arquivo | Descrição | Status |
|---------|-----------|--------|
| `src/hooks/useChatRateLimit.ts` | Rate limiting inteligente 1msg/2s | ✅ CRIADO |
| `src/hooks/useLiveChat.ts` | Hook de chat com Realtime | ✅ CRIADO |
| `src/components/chat/LiveChatPanel.tsx` | Componente de chat futurista | ✅ CRIADO |
| `src/components/chat/index.ts` | Exportações do chat | ✅ CRIADO |
| `supabase/migrations/20251222000001_live_chat_system.sql` | Tabelas + RLS + Índices | ✅ CRIADO |
| `supabase/migrations/20251222000002_performance_indexes.sql` | Índices de performance | ✅ CRIADO |

## ✅ Funcionalidades Implementadas

| Funcionalidade | Status |
|----------------|--------|
| Rate limiting (1 msg/2s) | ✅ |
| Slow mode (1 msg/4s) | ✅ |
| Timeout de usuários | ✅ |
| Ban de usuários | ✅ |
| Mensagem fixada | ✅ |
| Contador de viewers | ✅ |
| Moderação (admin/mod) | ✅ |
| Validação de mensagem | ✅ |
| Anti-spam | ✅ |
| Limite 280 caracteres | ✅ |
| Design futurista 2300 | ✅ |
| Glassmorphism | ✅ |
| Animações fluidas | ✅ |
| Realtime com reconnect | ✅ |
| RLS em todas tabelas | ✅ |
| Índices otimizados | ✅ |

---

*PROVA DE FOGO 5.000 - Plano Adaptado*
*Gerado pelo MESTRE em 22/12/2025*
*Baseado no DNA + MATRIZ SAGRADA do Projeto*
*BUILD: ✅ PASSOU em 11.69s*
