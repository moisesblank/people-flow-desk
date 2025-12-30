# 📦 PATCHES PRONTOS PARA LOVABLE — 29/12/2025
## Prioridade: P1 (Aplicar esta semana)

---

## 📋 RESUMO EXECUTIVO

| PATCH | Arquivo | Linhas | Prioridade | Risco se não aplicar |
|-------|---------|--------|------------|---------------------|
| P1-001 | sanctum-report-violation/index.ts | 65-104 → ~50 novas | P1 | Rate limit perde estado em cold start |
| P1-002 | _shared/guards.ts | 68 → 3 novas | P1 | Timing attack teórico (baixo risco) |
| P1-003 | hotmart-webhook-processor/index.ts | 1175 → ~8 novas | P1 | Timing attack teórico (baixo risco) |

---

# PATCH-P1-001: Rate Limit Persistente para sanctum-report-violation

## Por que é importante?
O rate limit atual usa um `Map()` em memória. Quando a Edge Function faz "cold start" (reinicia), o mapa é zerado. Um atacante pode explorar isso enviando 29 requests, esperando cold start, e repetindo — infinitamente.

## Impacto se não corrigir:
- Spam de violações pode encher o banco
- Custo de processamento desnecessário
- Logs poluídos

## Arquivo
`supabase/functions/sanctum-report-violation/index.ts`

## ANTES (linhas 62-104):

```typescript
// ============================================
// RATE LIMITING + DEDUPE (ANTI-SPAM/DoS)
// ============================================
const rateLimitCache = new Map<string, { count: number; resetAt: number; lastHash: string }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minuto
const RATE_LIMIT_MAX = 30; // 30 violações por minuto por IP

function checkRateLimitAndDedupe(ipHash: string, violationHash: string): { allowed: boolean; reason?: string } {
  const now = Date.now();
  const key = ipHash;
  
  const entry = rateLimitCache.get(key);
  
  if (!entry || now > entry.resetAt) {
    // Nova janela
    rateLimitCache.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS, lastHash: violationHash });
    return { allowed: true };
  }
  
  // Dedupe: mesma violação em sequência
  if (entry.lastHash === violationHash) {
    return { allowed: false, reason: 'DUPLICATE' };
  }
  
  // Rate limit
  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, reason: 'RATE_LIMIT' };
  }
  
  entry.count++;
  entry.lastHash = violationHash;
  return { allowed: true };
}

// Limpar cache periodicamente
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitCache.entries()) {
    if (now > entry.resetAt) {
      rateLimitCache.delete(key);
    }
  }
}, 60000);
```

## DEPOIS:

```typescript
// ============================================
// 🛡️ PATCH-P1-001: RATE LIMITING PERSISTENTE (DB)
// Não perde estado em cold start
// ============================================
const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMIT_MAX = 30;

async function checkPersistentRateLimitAndDedupe(
  supabase: any,
  ipHash: string,
  violationHash: string
): Promise<{ allowed: boolean; reason?: string }> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - (RATE_LIMIT_WINDOW_SECONDS * 1000));
  const clientId = `sanctum:${ipHash}`;

  try {
    // Buscar registro existente
    const { data: existing } = await supabase
      .from('api_rate_limits')
      .select('id, request_count, window_start, metadata')
      .eq('client_id', clientId)
      .eq('endpoint', 'sanctum-report')
      .single();

    // Dedupe: verificar se é a mesma violação
    if (existing?.metadata?.lastHash === violationHash) {
      return { allowed: false, reason: 'DUPLICATE' };
    }

    if (existing) {
      const existingWindowStart = new Date(existing.window_start);
      
      if (existingWindowStart > windowStart) {
        // Dentro da janela atual
        if (existing.request_count >= RATE_LIMIT_MAX) {
          return { allowed: false, reason: 'RATE_LIMIT' };
        }
        
        // Incrementar contador
        await supabase
          .from('api_rate_limits')
          .update({ 
            request_count: existing.request_count + 1,
            last_request_at: now.toISOString(),
            metadata: { lastHash: violationHash }
          })
          .eq('id', existing.id);
        
        return { allowed: true };
      } else {
        // Janela expirada, resetar
        await supabase
          .from('api_rate_limits')
          .update({ 
            request_count: 1,
            window_start: now.toISOString(),
            last_request_at: now.toISOString(),
            metadata: { lastHash: violationHash }
          })
          .eq('id', existing.id);
        
        return { allowed: true };
      }
    } else {
      // Primeiro request
      await supabase
        .from('api_rate_limits')
        .insert({
          client_id: clientId,
          endpoint: 'sanctum-report',
          request_count: 1,
          window_start: now.toISOString(),
          last_request_at: now.toISOString(),
          metadata: { lastHash: violationHash }
        });
      
      return { allowed: true };
    }
  } catch (err) {
    console.error('[sanctum-report] Rate limit error:', err);
    // Em caso de erro, permitir (fail-open para UX)
    return { allowed: true };
  }
}

// REMOVER: setInterval (não necessário com DB)
```

## MUDANÇA NA CHAMADA (linha ~197):

**ANTES:**
```typescript
const rateLimitResult = checkRateLimitAndDedupe(ipHash, violationHash);
```

**DEPOIS:**
```typescript
const rateLimitResult = await checkPersistentRateLimitAndDedupe(supabase, ipHash, violationHash);
```

## Como testar:
1. Enviar 30 reports → todos devem passar
2. Enviar 31º report → deve ser bloqueado com `rateLimited: true`
3. Reiniciar a função (forçar cold start)
4. Enviar 1 request → deve ser bloqueado (prova que estado persiste)

## Como reverter:
```bash
git checkout supabase/functions/sanctum-report-violation/index.ts
```

---

# PATCH-P1-002: Comparação Timing-Safe para HOTTOK em guards.ts

## Por que é importante?
A comparação string simples (`===`) pode vazar informações sobre o tamanho e conteúdo do token correto através de timing side-channel attacks. Embora seja um ataque sofisticado, é uma best practice de segurança.

## Impacto se não corrigir:
- Risco teórico baixo, mas não zero
- Não atende padrão bancário completo

## Arquivo
`supabase/functions/_shared/guards.ts`

## ANTES (linha 67-68):

```typescript
  // Comparação segura
  const isValid = receivedHottok.trim() === HOTMART_HOTTOK.trim();
```

## DEPOIS:

```typescript
  // 🛡️ PATCH-P1-002: Comparação timing-safe (anti side-channel)
  const encoder = new TextEncoder();
  const received = encoder.encode(receivedHottok.trim());
  const expected = encoder.encode(HOTMART_HOTTOK.trim());

  // Comparação em tempo constante
  let mismatch = received.length !== expected.length ? 1 : 0;
  const maxLen = Math.max(received.length, expected.length);
  for (let i = 0; i < maxLen; i++) {
    mismatch |= (received[i] || 0) ^ (expected[i] || 0);
  }
  const isValid = mismatch === 0;
```

## Como testar:
1. Webhook Hotmart com HOTTOK correto → 200 OK
2. Webhook Hotmart com HOTTOK errado → 403

## Como reverter:
```bash
git checkout supabase/functions/_shared/guards.ts
```

---

# PATCH-P1-003: Comparação Timing-Safe para HOTTOK em hotmart-webhook-processor

## Por que é importante?
Mesmo motivo do P1-002, mas no arquivo específico do webhook Hotmart.

## Arquivo
`supabase/functions/hotmart-webhook-processor/index.ts`

## ANTES (linha 1174-1175):

```typescript
    // Comparação segura (timing-safe não disponível em Deno, mas usamos trim/lowercase)
    const isValidHottok = receivedHottok.trim() === HOTMART_HOTTOK.trim();
```

## DEPOIS:

```typescript
    // 🛡️ PATCH-P1-003: Comparação timing-safe
    const encoder = new TextEncoder();
    const received = encoder.encode(receivedHottok.trim());
    const expected = encoder.encode(HOTMART_HOTTOK.trim());
    
    let mismatch = received.length !== expected.length ? 1 : 0;
    const maxLen = Math.max(received.length, expected.length);
    for (let i = 0; i < maxLen; i++) {
      mismatch |= (received[i] || 0) ^ (expected[i] || 0);
    }
    const isValidHottok = mismatch === 0;
```

## Como testar:
1. Webhook Hotmart com HOTTOK correto → processa normalmente
2. Webhook Hotmart com HOTTOK errado → 403

## Como reverter:
```bash
git checkout supabase/functions/hotmart-webhook-processor/index.ts
```

---

# VERIFICAÇÕES PÓS-PATCH

## Tabela api_rate_limits

Certifique-se de que esta tabela existe no Supabase:

```sql
-- Verificar se existe
SELECT * FROM api_rate_limits LIMIT 1;

-- Se não existir, criar:
CREATE TABLE IF NOT EXISTS api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT now(),
  last_request_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, endpoint)
);

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_lookup 
ON api_rate_limits(client_id, endpoint);

-- RLS (apenas service role pode acessar)
ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;
```

## Deploy

Após aplicar os patches:

```bash
supabase functions deploy sanctum-report-violation
supabase functions deploy hotmart-webhook-processor
# guards.ts é shared, será incluído automaticamente
```

---

# CHECKLIST DE APLICAÇÃO

- [ ] PATCH-P1-001 aplicado em sanctum-report-violation
- [ ] PATCH-P1-002 aplicado em guards.ts
- [ ] PATCH-P1-003 aplicado em hotmart-webhook-processor
- [ ] Tabela api_rate_limits verificada/criada
- [ ] Deploy das funções executado
- [ ] Teste de fumaça realizado

---

**Autor:** Claude Opus 4.5
**Data:** 29/12/2025
**Status:** PRONTO PARA APLICAR
