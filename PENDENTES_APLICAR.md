# ✅ LISTA ÚNICA DE ARQUIVOS PENDENTES

**IMPORTANTE:** Esta é a ÚNICA lista de arquivos que você precisa aplicar.
Tudo o mais já foi aplicado ou são arquivos antigos.

---

## ⚠️ SOBRE A ORDEM NA TELA

A tela do Cursor/Lovable mostra os arquivos em **ORDEM ALFABÉTICA**.
Isso **NÃO** é a ordem de aplicação!

**SEMPRE siga a ordem numérica abaixo (1, 2, 3...).**

---

## 📊 RESUMO RÁPIDO (APLIQUE NESTA ORDEM!)

| # | Tipo | Arquivo | Função | Status |
|---|------|---------|--------|--------|
| 1 | SQL | `20251222000001_live_chat_system.sql` | Chat ao vivo | ⏳ |
| 2 | SQL | `20251222000002_performance_indexes.sql` | Índices | ⏳ |
| 3 | SQL | `20251222200000_security_fortress_ultra.sql` | Segurança | ⏳ |
| 4 | SQL | `20251222400000_sna_omega_complete.sql` | IA/Automação | ⏳ |
| 5 | SQL | `20251222600000_video_fortress_omega.sql` | 🆕 Vídeo OMEGA | ⏳ |
| 6 | Edge | `secure-webhook-ultra` | Webhooks seguros | ⏳ |
| 7 | Edge | `sna-gateway` | Gateway IA | ⏳ |
| 8 | Edge | `sna-worker` | Worker IA | ⏳ |
| 9 | Edge | `video-authorize-omega` | 🆕 Autorização vídeo | ⏳ |
| 10 | Edge | `video-violation-omega` | 🆕 Violações vídeo | ⏳ |

**TOTAL: 10 itens (5 SQL + 5 Edge Functions)**

### 🔴 POR QUE ESSA ORDEM?

1. **SQL primeiro** = Cria as tabelas no banco de dados
2. **Edge Functions depois** = Código que usa as tabelas

Se inverter = ERRO!

---

## 🔥 VIDEO FORTRESS OMEGA v5.0 (PROTEÇÃO DE VÍDEOS)

| # | Arquivo | Função |
|---|---------|--------|
| 5 | `20251222600000_video_fortress_omega.sql` | 5 tabelas, 8 funções, RLS |
| 9 | `video-authorize-omega/index.ts` | Autorização + Signed URL + SANCTUM |
| 10 | `video-violation-omega/index.ts` | Risk score + bypass + ações graduais |

### Arquivos Frontend (AUTOMÁTICOS - não precisa fazer nada):
- `src/hooks/useVideoFortressOmega.ts` ✅ Hook OMEGA integrado
- `src/components/video/OmegaFortressPlayer.tsx` ✅ Player OMEGA definitivo
- `src/hooks/useVideoFortress.ts` ✅ Hook de integração
- `src/components/video/index.ts` ✅ Exportações centralizadas

---

## 🔴 O QUE NÃO APLICAR (IGNORE ESSES!)

### Arquivos que começam com `src/` = AUTOMÁTICO

A Lovable aplica esses sozinha. **NÃO FAÇA NADA** com eles:

| Padrão | Ação |
|--------|------|
| `src/*` | 🚫 IGNORE (automático) |
| Migrações antigas (antes de 20251222) | 🚫 IGNORE (já aplicado) |

### REGRA SIMPLES:

| Começa com... | Ação |
|---------------|------|
| `src/` | 🚫 IGNORE |
| `supabase/migrations/20251222*` | ✅ APLIQUE (são 5) |
| `supabase/functions/*-omega` ou `sna-*` | ✅ APLIQUE (são 5) |
| Qualquer outra coisa | 🚫 IGNORE |

---

## 📝 PASSOS NA ORDEM (COLE NA LOVABLE)

### PASSO 1 - Chat ao Vivo
```
Aplique a migração SQL do sistema de chat ao vivo.
Arquivo: supabase/migrations/20251222000001_live_chat_system.sql
```

### PASSO 2 - Performance
```
Aplique a migração SQL dos índices de performance.
Arquivo: supabase/migrations/20251222000002_performance_indexes.sql
```

### PASSO 3 - Segurança
```
Aplique a migração SQL do sistema de segurança.
Arquivo: supabase/migrations/20251222200000_security_fortress_ultra.sql
```

### PASSO 4 - Automação IA
```
Aplique a migração SQL do sistema SNA de automação com IA.
Arquivo: supabase/migrations/20251222400000_sna_omega_complete.sql
```

### PASSO 5 - Video Fortress OMEGA 🆕
```
Aplique a migração SQL do Video Fortress OMEGA v5.0.
Arquivo: supabase/migrations/20251222600000_video_fortress_omega.sql
```

### PASSO 6 - Deploy Gateway IA
```
Faça deploy da Edge Function sna-gateway.
Pasta: supabase/functions/sna-gateway/
```

### PASSO 7 - Deploy Worker IA
```
Faça deploy da Edge Function sna-worker.
Pasta: supabase/functions/sna-worker/
```

### PASSO 8 - Deploy Webhook Seguro
```
Faça deploy da Edge Function secure-webhook-ultra.
Pasta: supabase/functions/secure-webhook-ultra/
```

### PASSO 9 - Deploy Video Authorize OMEGA 🆕
```
Faça deploy da Edge Function video-authorize-omega.
Pasta: supabase/functions/video-authorize-omega/
```

### PASSO 10 - Deploy Video Violation OMEGA 🆕
```
Faça deploy da Edge Function video-violation-omega.
Pasta: supabase/functions/video-violation-omega/
```

---

## 🚀 COMANDO ÚNICO (ALTERNATIVA RÁPIDA)

Cole este comando na Lovable para aplicar TUDO de uma vez:

```
Por favor, aplique todas as migrações SQL e Edge Functions do projeto na seguinte ordem:

FASE 1 - SQL (executar no Supabase SQL Editor):
1. supabase/migrations/20251222000001_live_chat_system.sql
2. supabase/migrations/20251222000002_performance_indexes.sql
3. supabase/migrations/20251222200000_security_fortress_ultra.sql
4. supabase/migrations/20251222400000_sna_omega_complete.sql
5. supabase/migrations/20251222600000_video_fortress_omega.sql

FASE 2 - Edge Functions (fazer deploy):
6. supabase/functions/sna-gateway
7. supabase/functions/sna-worker
8. supabase/functions/secure-webhook-ultra
9. supabase/functions/video-authorize-omega
10. supabase/functions/video-violation-omega

Os arquivos src/* são automáticos e não precisam de ação manual.
```

---

## ✅ MARCAR COMO CONCLUÍDO

Quando aplicar cada passo, atualize esta lista:
- ⏳ = Pendente
- ✅ = Concluído
- ❌ = Erro (precisa refazer)

---

**Última atualização:** 22/12/2024 — Video Fortress OMEGA v5.0
