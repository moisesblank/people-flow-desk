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

| # | Tipo | Arquivo | Aparece na tela como | Status |
|---|------|---------|---------------------|--------|
| 1 | SQL | `20251222000001_live_chat_system.sql` | `20251222000001_live_chat_system.sql` | ⏳ |
| 2 | SQL | `20251222000002_performance_indexes.sql` | `20251222000002_performance_indexes.sql` | ⏳ |
| 3 | SQL | `20251222200000_security_fortress_ultra.sql` | `20251222200000_security_fortress_ultra.sql` | ⏳ |
| 4 | SQL | `20251222400000_sna_omega_complete.sql` | `20251222400000_sna_omega_complete.sql` | ⏳ |
| 5 | Edge | `secure-webhook-ultra` | `secure-webhook-ultra/index.ts` | ⏳ |
| 6 | Edge | `sna-gateway` | `sna-gateway/index.ts` | ⏳ |
| 7 | Edge | `sna-worker` | `sna-worker/index.ts` | ⏳ |

**TOTAL: 7 itens (4 SQL + 3 Edge Functions)**

### 🔴 POR QUE ESSA ORDEM?

1. **SQL primeiro** = Cria as tabelas no banco de dados
2. **Edge Functions depois** = Código que usa as tabelas

Se inverter = ERRO!

---

## 🔴 O QUE NÃO APLICAR

❌ Qualquer arquivo que NÃO esteja nesta lista
❌ Arquivos de código frontend (.tsx, .ts em src/) - Esses a Lovable sincroniza automaticamente
❌ Migrações SQL antigas (qualquer uma com data antes de 20251222)

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

### PASSO 5 - Deploy Gateway IA
```
Faça deploy da Edge Function sna-gateway.
Pasta: supabase/functions/sna-gateway/
```

### PASSO 6 - Deploy Worker IA
```
Faça deploy da Edge Function sna-worker.
Pasta: supabase/functions/sna-worker/
```

### PASSO 7 - Deploy Webhook Seguro
```
Faça deploy da Edge Function secure-webhook-ultra.
Pasta: supabase/functions/secure-webhook-ultra/
```

---

## ✅ MARCAR COMO CONCLUÍDO

Quando aplicar cada passo, atualize esta lista:
- ⏳ = Pendente
- ✅ = Concluído
- ❌ = Erro (precisa refazer)

---

**Última atualização:** 22/12/2024
