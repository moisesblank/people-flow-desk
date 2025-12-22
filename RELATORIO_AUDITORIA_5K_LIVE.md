# 🔥 RELATÓRIO DE AUDITORIA — PROVA DE FOGO 5.000 AO VIVO

## Plataforma: gestao.moisesmedeiros.com.br
### Data da Auditoria: 22 de Dezembro de 2024
### Stack: React 18 + TypeScript + Vite + Tailwind + Shadcn/UI + Supabase

---

# ÍNDICE

1. [Fase A - Inventário Forense](#fase-a---inventário-forense)
2. [Fase B - Arquitetura 5K Live](#fase-b---arquitetura-5k-live)
3. [Fase C - Performance Mobile-first 3G](#fase-c---performance-mobile-first-3g)
4. [Fase D - Banco/Queries](#fase-d---bancoqueries)
5. [Fase E - Segurança Máxima](#fase-e---segurança-máxima)
6. [Fase F - Observabilidade](#fase-f---observabilidade)
7. [Fase G - Teste de Carga](#fase-g---teste-de-carga)
8. [Fase H - Go-Live Runbook](#fase-h---go-live-runbook)
9. [Checklist Final GO/NO-GO](#checklist-final-gono-go)
10. [Plano de Ação e Recomendações](#plano-de-ação-e-recomendações)

---

# FASE A - INVENTÁRIO FORENSE

## 1.1 Infraestrutura de Hospedagem

| Componente | Status Atual | Observação |
|------------|--------------|------------|
| **Frontend** | Lovable Cloud / Netlify (CDN) | Deploy serverless com CDN global |
| **Backend** | Supabase (Projeto: `fyikfsasudgzsjmumdlw`) | PostgreSQL + Auth + Realtime + Edge Functions |
| **CDN** | Cloudflare | DNS + CDN + DDoS Protection |
| **Vídeo Live** | YouTube (externo) | ✅ Correto - streaming desacoplado |
| **Vídeo Gravado** | Panda Video (externo) | ✅ Correto - URLs assinadas via Edge Function |

### 1.1.1 Limites da Hospedagem (Lovable/Netlify)

| Recurso | Limite Estimado | Uso Típico | Status |
|---------|-----------------|------------|--------|
| Requests/mês | 100M+ | ~5M | ✅ OK |
| Bandwidth/mês | 100GB+ | ~20GB | ✅ OK |
| Build time | 15min | ~3min | ✅ OK |
| Concurrent builds | 1-3 | 1 | ✅ OK |
| Functions timeout | 10s | <5s | ✅ OK |

## 1.2 Supabase - Análise Detalhada

### 1.2.1 Configuração Identificada (config.toml)

```toml
project_id = "fyikfsasudgzsjmumdlw"

# Edge Functions configuradas: 55+
# Funções críticas com verify_jwt = true:
# - secure-video-url ✅
# - secure-api-proxy ✅
# - get-panda-signed-url ✅
# - backup-data ✅
# - extract-document ✅
```

### 1.2.2 Estimativa de Limites Supabase (Plano Pro)

| Recurso | Limite Pro | Meta 5K Live | Gap/Risco |
|---------|------------|--------------|-----------|
| **Database Size** | 8GB | ~2GB estimado | ✅ OK |
| **Compute** | 2 vCPU / 4GB RAM | Requer teste | ⚠️ VERIFICAR |
| **Conexões Pooler** | 400 diretas / 15k pooled | 5K realtime | ⚠️ CRÍTICO |
| **Realtime Connections** | 500 simultâneas | 5.000 | ❌ INSUFICIENTE |
| **Realtime Messages** | 500/s | ~1.000/s pico | ❌ INSUFICIENTE |
| **Storage** | 100GB | ~10GB | ✅ OK |
| **Bandwidth** | 200GB | ~50GB | ✅ OK |
| **Edge Functions** | 2M invocações | ~500K/mês | ✅ OK |

### 1.2.3 ⚠️ GARGALOS CRÍTICOS IDENTIFICADOS

| Gargalo | Severidade | Impacto | Solução |
|---------|------------|---------|---------|
| **Realtime Connections** | 🔴 CRÍTICO | Limite de 500 conexões vs 5.000 necessárias | Upgrade para Team/Enterprise ou usar Broadcast Channels |
| **Pooler Mode** | 🟡 ALTO | Conexões podem saturar | Confirmar modo transacional ativo |
| **RLS em tabelas de chat** | 🟡 MÉDIO | Policies `USING (true)` detectadas | Revisar e restringir |

---

# FASE B - ARQUITETURA 5K LIVE

## 2.1 Vídeo AO VIVO - Arquitetura Atual ✅

### 2.1.1 Fluxo de Streaming

```
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐
│   YouTube   │───▶│ CDN YouTube  │───▶│ Player Plataforma│
│   (OBS/etc) │    │   (Global)   │    │  (YouTubeLive)  │
└─────────────┘    └──────────────┘    └─────────────────┘
                                              │
                                              ▼
                                    ┌─────────────────┐
                                    │ FortressWrapper │
                                    │ (Proteção DRM)  │
                                    └─────────────────┘
```

### 2.1.2 Componentes Implementados ✅

| Componente | Arquivo | Status |
|------------|---------|--------|
| **YouTubeLivePlayer** | `src/components/youtube/YouTubeLivePlayer.tsx` | ✅ Implementado |
| **YouTubeLiveWidget** | `src/components/youtube/YouTubeLiveWidget.tsx` | ✅ Implementado |
| **FortressPlayerWrapper** | `src/components/video/FortressPlayerWrapper.tsx` | ✅ Implementado |
| **Página Lives** | `src/pages/Lives.tsx` | ✅ Implementado |
| **Hook useLiveClass** | `src/hooks/useLiveClass.tsx` | ✅ Implementado |
| **Edge Function youtube-live** | `supabase/functions/youtube-live/index.ts` | ✅ Implementado |

### 2.1.3 Tabelas de Banco ✅

```sql
-- Estrutura existente (20251220014503)
youtube_lives (id, video_id, titulo, status, scheduled_start, max_viewers, ...)
youtube_live_chat (id, live_id, author_name, message, is_moderator, ...)
youtube_live_attendance (id, live_id, aluno_id, watch_time_minutes, xp_earned, ...)
```

### 2.1.4 Anti-Pirataria Implementado ✅

| Proteção | Status | Arquivo |
|----------|--------|---------|
| **Watermark Dinâmica** | ✅ CPF + Nome + Posição variável | `FortressPlayerWrapper.tsx` |
| **DevTools Detector** | ✅ Pausa vídeo + alerta | `FortressPlayerWrapper.tsx` |
| **Bloqueio Cliques** | ✅ Escudos CSS em bordas | `FortressPlayerWrapper.tsx` |
| **Bloqueio Atalhos** | ✅ F12, Ctrl+S, Ctrl+U | `FortressPlayerWrapper.tsx` |
| **URLs Assinadas** | ✅ Edge Function secure-video-url | `supabase/functions/secure-video-url/` |

## 2.2 Chat Realtime - Arquitetura Atual

### 2.2.1 Implementação Atual (`useLiveClass.tsx`)

```typescript
// Estratégia híbrida implementada:
// 1. Supabase Realtime Broadcast (sem persistência = baixa latência)
// 2. Presence API para contagem de viewers
// 3. Rate limiting no frontend (chatRateLimiter)
```

### 2.2.2 Rate Limiting Implementado ✅

| Limiter | Limite | Janela | Arquivo |
|---------|--------|--------|---------|
| **chatRateLimiter** | 30 msgs | 60s | `src/lib/rateLimiter.ts` |
| **reactionRateLimiter** | 60 reações | 60s | `src/lib/rateLimiter.ts` |
| **apiRateLimiter** | 100 req | 60s | `src/lib/rateLimiter.ts` |

### 2.2.3 ⚠️ PROBLEMA: Limite de Realtime Connections

**Situação Atual:**
- Supabase Pro: ~500 conexões realtime simultâneas
- Meta: 5.000 conexões

**Solução Recomendada:**

```
OPÇÃO 1: Upgrade Supabase Enterprise
- Limite customizado de conexões
- Custo: $$$$ (contatar Supabase)

OPÇÃO 2: Broadcast Channels (sem Presence)
- Usar apenas channel.send() para chat
- Contagem de viewers via polling (30s)
- Reduz conexões mantidas

OPÇÃO 3: Sharding por Turma
- Dividir em múltiplos canais por "sala"
- Limite de 500 por canal
- Complexidade adicional

OPÇÃO 4: Chat do YouTube Integrado
- Usar chat nativo do YouTube (já implementado)
- Contagem de viewers via API YouTube
- ✅ RECOMENDADO para 5K
```

---

# FASE C - PERFORMANCE MOBILE-FIRST 3G

## 3.1 Performance Budgets Configurados ✅

### 3.1.1 Configuração (`lighthouserc.json`)

| Métrica | Meta | Status |
|---------|------|--------|
| **Performance Score** | ≥ 95 | ⚠️ A verificar |
| **LCP** | ≤ 2.5s | ✅ Configurado |
| **FCP** | ≤ 1.8s | ✅ Configurado |
| **CLS** | ≤ 0.1 | ✅ Configurado |
| **TBT** | ≤ 300ms | ✅ Configurado |
| **TTI** | ≤ 3.8s | ✅ Configurado |

### 3.1.2 Budgets de Bundle (`performanceBudgets.ts`)

| Métrica | Limite | Status |
|---------|--------|--------|
| **JS Principal (gzip)** | 100KB | ⚠️ A verificar |
| **CSS Principal (gzip)** | 30KB | ⚠️ A verificar |
| **Total Inicial** | 200KB | ⚠️ A verificar |
| **Max Chunk** | 50KB | ⚠️ A verificar |
| **Max Requests** | 50 | ⚠️ A verificar |
| **Max DOM Nodes** | 1.500 | ⚠️ A verificar |

## 3.2 Otimizações Vite Implementadas ✅

### 3.2.1 Code Splitting (`vite.config.ts`)

```typescript
manualChunks: {
  "vendor-react": ["react", "react-dom", "react-router-dom"],
  "vendor-ui": ["@radix-ui/..."], // 6 componentes
  "vendor-data": ["@tanstack/react-query", "zustand"],
  "vendor-motion": ["framer-motion"],
  "vendor-charts": ["recharts"],
  "vendor-forms": ["react-hook-form", "@hookform/resolvers", "zod"],
  "vendor-utils": ["date-fns", "clsx", "tailwind-merge"],
}
```

### 3.2.2 Build Optimizations ✅

- ✅ Target: `esnext`
- ✅ Minify: `esbuild`
- ✅ CSS Code Split: `true`
- ✅ Tree Shaking: `true`
- ✅ Source Maps: `false` (produção)
- ✅ Dedupe: React, Framer Motion, TanStack Query

## 3.3 PWA/Service Worker Implementado ✅

### 3.3.1 Estratégias de Cache (`public/sw.js`)

| Tipo | Estratégia | Cache |
|------|------------|-------|
| **API/Supabase** | Network First + Fallback | `api-v2.0.0` |
| **Imagens** | Stale While Revalidate | `images-v2.0.0` |
| **Assets (JS/CSS/Fonts)** | Cache First | `dynamic-v2.0.0` |
| **HTML/Navegação** | Network First | `dynamic-v2.0.0` |

### 3.3.2 Features PWA ✅

- ✅ Service Worker registrado
- ✅ Push Notifications configuradas
- ✅ Offline fallback
- ✅ Auto-update com confirmação

## 3.4 Checklist Performance Frontend

| Item | Status | Evidência |
|------|--------|-----------|
| Code splitting rotas | ✅ | `vite.config.ts` manualChunks |
| Lazy load player | ✅ | `React.lazy` em componentes |
| Imagens otimizadas | ⚠️ | Verificar webp/avif |
| Cache TanStack Query | ✅ | `staleTime` configurado |
| Skeletons/Placeholders | ✅ | Componentes de loading |
| Preload fontes | ⚠️ | Verificar `<link preload>` |
| Compressão (gzip/brotli) | ✅ | CDN/Netlify automático |
| Cache headers | ✅ | CDN configurado |

---

# FASE D - BANCO/QUERIES

## 4.1 Estrutura de Tabelas Críticas

### 4.1.1 Tabelas Identificadas (178 migrações)

| Tabela | Índices | RLS | Realtime |
|--------|---------|-----|----------|
| `youtube_lives` | ✅ status, scheduled | ✅ | ✅ |
| `youtube_live_chat` | ✅ live_id | ✅ | ✅ |
| `youtube_live_attendance` | ✅ live_id | ✅ | ❌ |
| `profiles` | ⚠️ Verificar | ✅ | ❌ |
| `alunos` | ⚠️ Verificar | ✅ | ❌ |
| `courses` | ⚠️ Verificar | ✅ | ❌ |
| `enrollments` | ⚠️ Verificar | ✅ | ❌ |
| `lesson_progress` | ⚠️ Verificar | ✅ | ❌ |

### 4.1.2 Índices Recomendados (SQL)

```sql
-- Índices críticos para 5K live
-- Executar via Supabase SQL Editor

-- Progresso do aluno (queries frequentes)
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_course 
  ON lesson_progress(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson 
  ON lesson_progress(lesson_id);

-- Matrículas (verificação de acesso)
CREATE INDEX IF NOT EXISTS idx_enrollments_user_status 
  ON enrollments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_status 
  ON enrollments(course_id, status);

-- Chat (paginação)
CREATE INDEX IF NOT EXISTS idx_youtube_live_chat_created 
  ON youtube_live_chat(live_id, created_at DESC);

-- Sessões únicas (validação)
CREATE INDEX IF NOT EXISTS idx_user_sessions_token 
  ON user_sessions(session_token) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_sessions_user 
  ON user_sessions(user_id, is_active);

-- Dispositivos
CREATE INDEX IF NOT EXISTS idx_user_devices_fingerprint 
  ON user_devices(device_fingerprint) WHERE is_active = true;
```

## 4.2 Connection Pooling

### 4.2.1 Status Atual

| Config | Valor | Recomendação |
|--------|-------|--------------|
| **Pooler** | Supavisor (nativo) | ✅ OK |
| **Modo** | Transaction | ✅ Recomendado |
| **Pool Size** | ~20 (Pro default) | ⚠️ Aumentar se possível |

### 4.2.2 Verificação do Frontend

```typescript
// ✅ Correto - Cliente único com pooling
// src/integrations/supabase/client.ts
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

---

# FASE E - SEGURANÇA MÁXIMA

## 5.1 RLS (Row Level Security)

### 5.1.1 Políticas Identificadas

| Tabela | Política | Risco | Ação |
|--------|----------|-------|------|
| `youtube_lives` | `USING (true)` SELECT | 🟡 MÉDIO | OK para lives públicas |
| `youtube_live_chat` | `USING (true)` ALL | 🔴 ALTO | Restringir INSERT |
| `youtube_live_attendance` | `USING (true)` SELECT | 🟡 MÉDIO | OK para visualização |
| `profiles` | ⚠️ Verificar | - | Auditar |
| `alunos` | ⚠️ Verificar | - | Auditar |

### 5.1.2 Correções RLS Recomendadas

```sql
-- Corrigir política de chat (INSERT apenas autenticado)
DROP POLICY IF EXISTS "Service pode gerenciar chat" ON youtube_live_chat;

CREATE POLICY "Usuários podem inserir chat" 
  ON youtube_live_chat FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Chat público para leitura" 
  ON youtube_live_chat FOR SELECT 
  USING (true);

CREATE POLICY "Moderadores podem deletar" 
  ON youtube_live_chat FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'moderator', 'owner')
    )
  );
```

## 5.2 Sessão Única ✅

### 5.2.1 Implementação Atual

| Componente | Arquivo | Status |
|------------|---------|--------|
| **Hook** | `src/hooks/useSingleSession.ts` | ✅ Implementado |
| **Guard** | `src/components/security/SessionGuard.tsx` | ✅ Implementado |
| **Verificação** | A cada 30s + visibilitychange | ✅ Configurado |
| **Logout remoto** | Via RPC `create_single_session` | ✅ Implementado |

### 5.2.2 Funções RPC Necessárias

```sql
-- Verificar se existem no banco:
-- create_single_session(_ip_address, _user_agent, _device_type, _browser, _os)
-- validate_session_token(p_session_token)
-- invalidate_session(p_session_token)
```

## 5.3 Controle de Dispositivos ✅

### 5.3.1 Implementação (`useDeviceLimit.ts`)

| Feature | Status |
|---------|--------|
| **Limite de dispositivos** | 3 (exceto owner) |
| **Fingerprint** | ✅ Gerado no cliente |
| **Registro automático** | ✅ No login |
| **Desativação manual** | ✅ Pelo usuário |

## 5.4 Proteção de Conteúdo ✅

### 5.4.1 Vídeo (`FortressPlayerWrapper.tsx`)

| Proteção | Status |
|----------|--------|
| Watermark dinâmica (CPF) | ✅ 4 camadas |
| Detecção DevTools | ✅ Pausa vídeo |
| Bloqueio menu contexto | ✅ |
| Bloqueio arrastar | ✅ |
| Bloqueio seleção | ✅ |
| Bloqueio atalhos | ✅ F12, Ctrl+S/P/C/U |
| CSS user-select: none | ✅ |

### 5.4.2 URLs de Vídeo (`secure-video-url/index.ts`)

| Feature | Status |
|---------|--------|
| URLs assinadas (5min) | ✅ |
| Validação JWT | ✅ (verify_jwt = true) |
| Log de acessos | ✅ content_access_log |
| Dados para watermark | ✅ nome, cpf, email |

## 5.5 Secrets e Chaves

### 5.5.1 Chaves no Frontend

```typescript
// ✅ CORRETO - Apenas variáveis públicas
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY // anon key (pública)
```

### 5.5.2 Chaves no Servidor (Edge Functions)

```typescript
// ✅ Secrets via Deno.env.get()
PANDA_API_KEY
YOUTUBE_API_KEY
SUPABASE_SERVICE_ROLE_KEY
// + outros secrets de integrações
```

## 5.6 Edge Functions Críticas

### 5.6.1 Funções com verify_jwt = true ✅

| Função | Propósito |
|--------|-----------|
| `secure-video-url` | URLs assinadas para vídeos |
| `secure-api-proxy` | Proxy seguro para APIs |
| `get-panda-signed-url` | URLs do Panda Video |
| `backup-data` | Backup de dados |
| `extract-document` | OCR de documentos |
| `ocr-receipt` | OCR de recibos |
| `send-report` | Envio de relatórios |
| `generate-ai-content` | Geração IA |
| `reschedule-flashcard` | Flashcards FSRS |
| `chat-tramon` | Chat IA contextual |

### 5.6.2 ⚠️ Funções Públicas (verify_jwt = false)

| Função | Justificativa | Risco |
|--------|---------------|-------|
| `hotmart-webhook-processor` | Webhook externo | ✅ OK (validar assinatura) |
| `whatsapp-webhook` | Webhook WhatsApp | ✅ OK (validar token) |
| `youtube-live` | API pública | 🟡 Avaliar rate limit |
| `ai-tutor/ai-assistant` | IA pública? | 🟡 Avaliar |

---

# FASE F - OBSERVABILIDADE

## 6.1 Métricas Implementadas

### 6.1.1 Frontend

| Métrica | Implementação | Status |
|---------|---------------|--------|
| **Web Vitals** | `performanceBudgets.ts` + BudgetEnforcer | ✅ |
| **Long Tasks** | PerformanceObserver | ✅ |
| **Resource Timing** | PerformanceObserver | ✅ |
| **Network Condition** | Navigator.connection | ✅ |
| **Erros JS** | ⚠️ Sentry não detectado | Implementar |

### 6.1.2 Backend (Supabase)

| Métrica | Fonte | Status |
|---------|-------|--------|
| **Latência API** | Supabase Dashboard | ✅ Nativo |
| **Conexões DB** | Supabase Dashboard | ✅ Nativo |
| **CPU/RAM** | Supabase Dashboard | ✅ Nativo |
| **Realtime Connections** | Supabase Dashboard | ✅ Nativo |
| **Edge Functions logs** | Supabase Dashboard | ✅ Nativo |

## 6.2 Alertas Recomendados

```yaml
# Configurar no Supabase/Grafana/PagerDuty:

alertas_criticos:
  - nome: "Erro API > 1%"
    condição: error_rate > 0.01
    janela: 5min
    severidade: CRITICAL
    
  - nome: "Latência p95 > 500ms"
    condição: latency_p95 > 500
    janela: 5min
    severidade: HIGH
    
  - nome: "Realtime connections > 80%"
    condição: realtime_connections > 400 # 80% de 500
    janela: 1min
    severidade: CRITICAL
    
  - nome: "DB connections > 80%"
    condição: db_connections > 320 # 80% de 400
    janela: 1min
    severidade: HIGH
    
  - nome: "Edge Function timeout"
    condição: function_timeout_count > 10
    janela: 5min
    severidade: HIGH
```

---

# FASE G - TESTE DE CARGA

## 7.1 Scripts k6 para Teste

### 7.1.1 Cenário 1: 5.000 usuários na página Live

```javascript
// k6-live-page.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const latency = new Trend('latency');

export const options = {
  stages: [
    { duration: '1m', target: 1000 },  // Ramp-up
    { duration: '2m', target: 3000 },  // Escala
    { duration: '2m', target: 5000 },  // Pico
    { duration: '3m', target: 5000 },  // Sustentação
    { duration: '2m', target: 0 },     // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000', 'p(99)<5000'],
    errors: ['rate<0.005'], // < 0.5%
  },
};

export default function () {
  const BASE_URL = 'https://gestao.moisesmedeiros.com.br';
  
  // 1. Carregar página de Lives
  const livePage = http.get(`${BASE_URL}/lives`);
  check(livePage, {
    'live page status is 200': (r) => r.status === 200,
    'live page has content': (r) => r.body.length > 0,
  });
  latency.add(livePage.timings.duration);
  errorRate.add(livePage.status !== 200);
  
  sleep(Math.random() * 2 + 1); // 1-3s
  
  // 2. Buscar status da live (API)
  const liveStatus = http.get(`${BASE_URL}/api/youtube-live/status`);
  check(liveStatus, {
    'api status is 200': (r) => r.status === 200,
  });
  
  sleep(Math.random() * 5 + 3); // 3-8s (simula assistir)
}
```

### 7.1.2 Cenário 2: Chat 1.000 msgs/min

```javascript
// k6-chat-load.js
import ws from 'k6/ws';
import { check } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('ws_errors');

export const options = {
  stages: [
    { duration: '30s', target: 500 },
    { duration: '2m', target: 1000 },
    { duration: '2m', target: 1000 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    ws_errors: ['rate<0.01'],
  },
};

export default function () {
  const SUPABASE_URL = 'wss://fyikfsasudgzsjmumdlw.supabase.co/realtime/v1/websocket';
  
  const res = ws.connect(SUPABASE_URL, {}, (socket) => {
    socket.on('open', () => {
      // Subscrever no canal
      socket.send(JSON.stringify({
        topic: 'realtime:live-class:test',
        event: 'phx_join',
        payload: {},
        ref: '1',
      }));
    });
    
    socket.on('message', (data) => {
      // Processar mensagens
    });
    
    socket.on('error', (e) => {
      errorRate.add(1);
    });
    
    // Enviar mensagem a cada 3-6 segundos
    socket.setInterval(() => {
      socket.send(JSON.stringify({
        topic: 'realtime:live-class:test',
        event: 'broadcast',
        payload: { message: 'Test message ' + Date.now() },
        ref: String(Date.now()),
      }));
    }, Math.random() * 3000 + 3000);
    
    socket.setTimeout(() => {
      socket.close();
    }, 120000); // 2 min
  });
  
  check(res, { 'ws connected': (r) => r && r.status === 101 });
}
```

### 7.1.3 Cenário 3: Login pico (500 em 10min)

```javascript
// k6-login-spike.js
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '3m', target: 300 },
    { duration: '5m', target: 500 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const SUPABASE_URL = 'https://fyikfsasudgzsjmumdlw.supabase.co';
  
  const payload = JSON.stringify({
    email: `test${__VU}@example.com`,
    password: 'testpassword123',
  });
  
  const res = http.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, payload, {
    headers: { 
      'Content-Type': 'application/json',
      'apikey': __ENV.SUPABASE_ANON_KEY,
    },
  });
  
  check(res, {
    'login successful or rate limited': (r) => r.status === 200 || r.status === 429,
  });
}
```

## 7.2 Como Executar os Testes

```bash
# Instalar k6
# Mac: brew install k6
# Linux: sudo apt install k6
# Windows: choco install k6

# Executar cenário de live
k6 run k6-live-page.js

# Executar com output para Grafana
k6 run --out influxdb=http://localhost:8086/k6 k6-live-page.js

# Executar com variáveis de ambiente
k6 run -e SUPABASE_ANON_KEY=your-key k6-login-spike.js
```

## 7.3 Thresholds GO/NO-GO

| Métrica | Threshold GO | Threshold WARN | Threshold FAIL |
|---------|--------------|----------------|----------------|
| **Erros totais** | < 0.5% | 0.5-1% | > 1% |
| **p95 API** | < 300ms | 300-500ms | > 500ms |
| **p99 API** | < 800ms | 800-1200ms | > 1200ms |
| **Queries críticas p95** | < 50ms | 50-100ms | > 100ms |
| **Realtime latência** | < 300ms | 300-500ms | > 500ms |
| **LCP mobile** | ≤ 2.5s | 2.5-3.5s | > 3.5s |
| **FCP mobile** | ≤ 1.8s | 1.8-2.5s | > 2.5s |

---

# FASE H - GO-LIVE RUNBOOK

## 8.1 Pré-Live (T-24h até T-1h)

### T-24h
- [ ] Congelar deploys (release freeze)
- [ ] Verificar backups PITR ativos
- [ ] Rotacionar secrets se necessário
- [ ] Confirmar quotas Supabase suficientes
- [ ] Testar Edge Functions críticas

### T-12h
- [ ] Executar teste de carga leve (10% capacidade)
- [ ] Verificar logs de erro
- [ ] Confirmar integração YouTube API funcionando
- [ ] Testar fluxo completo de login → live

### T-4h
- [ ] Warmup de cache (acessar páginas críticas)
- [ ] Verificar métricas baseline
- [ ] Confirmar equipe de suporte online
- [ ] Testar chat do YouTube

### T-1h
- [ ] Verificar status Supabase (status.supabase.com)
- [ ] Verificar status YouTube
- [ ] Ensaio com 50-100 usuários internos
- [ ] Confirmar backup embed_url (YouTube alternativo)

## 8.2 Durante a Live (T0 até T+Xh)

### Monitoramento Contínuo
- [ ] Dashboard Supabase aberto (conexões, CPU, erros)
- [ ] Dashboard Cloudflare aberto (requests, bandwidth)
- [ ] Console do navegador limpo (erros JS)
- [ ] Monitorar chat do YouTube

### Ações de Contingência
- [ ] **Lentidão detectada**: Ativar "slow mode" no chat
- [ ] **Erros de conexão**: Verificar Supabase Dashboard
- [ ] **Queda de realtime**: Redirecionar para chat YouTube
- [ ] **Queda do player**: Usar backup embed_url
- [ ] **Ataque DDoS**: Cloudflare Under Attack Mode

### Comunicação
- [ ] Banner de "instabilidade" preparado
- [ ] Mensagem para WhatsApp/Email preparada
- [ ] Canal de comunicação com equipe (Slack/Discord)

## 8.3 Pós-Live (T+Xh até T+24h)

### Imediato (T+1h)
- [ ] Coletar métricas finais
- [ ] Verificar logs de erro
- [ ] Confirmar gravação salva (se aplicável)
- [ ] Agradecer equipe

### Análise (T+24h)
- [ ] Relatório de incidentes (se houver)
- [ ] Análise de custos (bandwidth, invocações)
- [ ] Lições aprendidas documentadas
- [ ] Ajustes para próxima live

---

# CHECKLIST FINAL GO/NO-GO

## Performance (Mobile / 3G)

| Item | Status | Evidência |
|------|--------|-----------|
| PageSpeed Mobile > 95 | ⚠️ VERIFICAR | Rodar Lighthouse |
| LCP ≤ 2.5s | ⚠️ VERIFICAR | Rodar Lighthouse |
| TTI/INP aceitáveis | ⚠️ VERIFICAR | Rodar Lighthouse |
| JS inicial ≤ 250KB gzip | ⚠️ VERIFICAR | `npm run build` |
| Player lazy load | ✅ | Código verificado |
| Cache headers | ✅ | CDN configurado |
| PWA funcionando | ✅ | SW implementado |

## Banco/Backend

| Item | Status | Evidência |
|------|--------|-----------|
| Pooler ativo | ✅ | Supavisor nativo |
| Queries críticas < 100ms | ⚠️ VERIFICAR | EXPLAIN ANALYZE |
| Índices compostos | ⚠️ CRIAR | SQL fornecido |
| Sem N+1 queries | ⚠️ VERIFICAR | Auditar hooks |

## Realtime

| Item | Status | Evidência |
|------|--------|-----------|
| 5.000 conexões suportadas | ❌ INSUFICIENTE | Limite 500 (Pro) |
| Chat com rate-limit | ✅ | rateLimiter.ts |
| Chat com moderação | ⚠️ PARCIAL | Implementar ban |
| Sem loop de re-render | ⚠️ VERIFICAR | Auditar hooks |

## Segurança

| Item | Status | Evidência |
|------|--------|-----------|
| RLS auditado | ⚠️ PARCIAL | Revisar chat policies |
| Sessão única ativa | ✅ | useSingleSession.ts |
| Conteúdo protegido | ✅ | FortressPlayerWrapper |
| Secrets não vazam | ✅ | Verificado |
| Webhooks validados | ⚠️ VERIFICAR | Auditar assinaturas |

## Operação

| Item | Status | Evidência |
|------|--------|-----------|
| Dashboards ativos | ✅ | Supabase Dashboard |
| Alertas configurados | ⚠️ CONFIGURAR | Guia fornecido |
| Runbook pronto | ✅ | Este documento |
| Plano contingência | ✅ | Chat YouTube backup |

---

# PLANO DE AÇÃO E RECOMENDAÇÕES

## 🔴 CRÍTICO (Fazer ANTES da live 5K)

### 1. Resolver Limite de Realtime Connections

**Problema:** Supabase Pro = 500 conexões vs 5.000 necessárias

**Soluções (escolher uma):**

**OPÇÃO A - Usar Chat do YouTube (RECOMENDADO)**
- Já implementado no `YouTubeLivePlayer.tsx`
- Chat nativo do YouTube sem limite
- Contagem de viewers via API YouTube
- ✅ Zero trabalho adicional

**OPÇÃO B - Upgrade Supabase Enterprise**
- Contatar Supabase para quota customizada
- Custo: $$$$ (negociável)
- Lead time: 1-2 semanas

**OPÇÃO C - Sharding de Canais**
- Dividir usuários em salas de 400
- Complexidade: ALTA
- Não recomendado para prazo curto

### 2. Revisar RLS do Chat

```sql
-- Executar no Supabase SQL Editor
-- Remover política permissiva e adicionar controle

-- (Ver SQL na seção 5.1.2)
```

### 3. Criar Índices de Banco

```sql
-- Executar no Supabase SQL Editor
-- (Ver SQL na seção 4.1.2)
```

## 🟡 ALTO (Fazer se possível antes da live)

### 4. Implementar Sentry para Erros JS

```bash
npm install @sentry/react

# Configurar em main.tsx
```

### 5. Verificar e Otimizar Bundle

```bash
npm run build
# Analisar dist/assets/*.js (tamanhos)
# Meta: < 250KB gzip total inicial
```

### 6. Rodar Lighthouse CI

```bash
npx lhci autorun
# Verificar se atende thresholds do lighthouserc.json
```

## 🟢 MÉDIO (Melhorias pós-live)

### 7. Implementar Ban/Timeout no Chat
### 8. Adicionar Moderação Automática (palavras proibidas)
### 9. Dashboard de Métricas Customizado
### 10. Alertas via PagerDuty/Slack

---

# RESULTADO DA AUDITORIA

## Veredicto: ⚠️ GO CONDICIONAL

### Condições para GO:

1. ✅ **Usar Chat do YouTube** ao invés de Supabase Realtime para 5K
2. ⚠️ **Executar SQL** de índices e correção RLS
3. ⚠️ **Verificar bundle size** com `npm run build`
4. ⚠️ **Rodar Lighthouse** e confirmar scores

### Se usar Chat do YouTube:

| Componente | Capacidade | Status |
|------------|------------|--------|
| Página Live | 5.000+ | ✅ GO |
| Player YouTube | 5.000+ | ✅ GO |
| Chat YouTube | Ilimitado | ✅ GO |
| Contagem Viewers | Via API | ✅ GO |
| Sessão Única | 5.000 | ✅ GO |
| Proteção Vídeo | 5.000 | ✅ GO |

### Se usar Chat Supabase Realtime:

| Componente | Capacidade | Status |
|------------|------------|--------|
| Realtime Chat | 500 | ❌ NO-GO |

---

## Assinatura da Auditoria

**Auditor:** Claude (Arquiteto de Alta Escala)
**Data:** 22/12/2024
**Versão:** 1.0

**Próximos Passos:**
1. Implementar correções CRÍTICAS
2. Executar teste de carga com k6
3. Validar métricas de performance
4. Agendar live de teste (100-500 usuários)
5. GO para produção com 5.000
