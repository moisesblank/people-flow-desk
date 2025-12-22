# ✅ LISTA ÚNICA DE ARQUIVOS PENDENTES

**IMPORTANTE:** Esta é a ÚNICA lista de arquivos que você precisa aplicar.
Tudo o mais já foi aplicado ou são arquivos antigos.

**ESTE É O PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS**

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
| 5 | SQL | `20251222600000_video_fortress_omega.sql` | Vídeo OMEGA | ⏳ |
| 6 | SQL | `20251222700000_matriz_funcoes_omega.sql` | Matriz de Funções | ⏳ |
| 7 | SQL | `20251222800000_sanctum_pdf_omega.sql` | 🆕 SANCTUM PDF | ⏳ |
| 8 | Edge | `secure-webhook-ultra` | Webhooks seguros | ⏳ |
| 9 | Edge | `sna-gateway` | Gateway IA | ⏳ |
| 10 | Edge | `sna-worker` | Worker IA | ⏳ |
| 11 | Edge | `video-authorize-omega` | Autorização vídeo | ⏳ |
| 12 | Edge | `video-violation-omega` | Violações vídeo | ⏳ |
| 13 | Edge | `sanctum-asset-manifest` | 🆕 Manifest PDF | ⏳ |
| 14 | Edge | `sanctum-report-violation` | 🆕 Violações PDF | ⏳ |

**TOTAL: 14 itens (7 SQL + 7 Edge Functions)**

### 🔴 POR QUE ESSA ORDEM?

1. **SQL primeiro** = Cria as tabelas no banco de dados
2. **Edge Functions depois** = Código que usa as tabelas

Se inverter = ERRO!

---

## 📍 MAPA DE URLs DEFINITIVO (REGRA MANDATÓRIA)

| Quem | URL | Validação |
|------|-----|-----------|
| 🌐 **NÃO PAGANTE** | `pro.moisesmedeiros.com.br/` | Cadastro gratuito |
| 👨‍🎓 **ALUNO BETA** | `pro.moisesmedeiros.com.br/alunos` | `role='beta'` |
| 👔 **FUNCIONÁRIO** | `gestao.moisesmedeiros.com.br/gestao` | `role='funcionario'` |
| 👑 **OWNER** | **TODAS** | `role='owner'` = `moisesblank@gmail.com` |

---

## 🌌 SANCTUM 3.0 — PROTECT PDF OMEGA (NOVO!)

### Arquivos SQL

| # | Arquivo | Função |
|---|---------|--------|
| 7 | `20251222800000_sanctum_pdf_omega.sql` | 5 tabelas, 6 funções, RLS |

### Tabelas Criadas

- `ena_assets` — Assets protegidos (PDFs, textos, imagens)
- `ena_asset_pages` — Páginas transmutadas (webp/avif)
- `sanctum_jobs_queue` — Fila de transmutação
- `sanctum_risk_state` — Estado de risco por usuário
- `sanctum_asset_access` — Log forense de acessos

### Funções SQL

- `fn_apply_sanctum_risk` — Aplica risco após violação
- `fn_check_sanctum_lock` — Verifica se usuário está bloqueado
- `fn_decay_sanctum_scores` — Decay diário de scores
- `fn_get_asset_manifest` — Retorna manifest com permissões
- `fn_register_sanctum_violation` — Registra violação
- `fn_get_sanctum_stats` — Estatísticas para dashboard

### Edge Functions

| # | Arquivo | Função |
|---|---------|--------|
| 13 | `sanctum-asset-manifest/index.ts` | Manifest + Signed URLs |
| 14 | `sanctum-report-violation/index.ts` | Reportar violações |

### Arquivos Frontend (JÁ CRIADOS)

Estes arquivos JÁ ESTÃO no projeto e serão aplicados automaticamente:

- `src/hooks/useSanctumCore.ts` — Hook de segurança
- `src/components/security/SanctumWatermark.tsx` — Watermark dinâmica
- `src/components/security/SanctumProtectedContent.tsx` — Wrapper universal
- `src/components/security/HologramText.tsx` — Texto em canvas
- `src/components/pdf/SecurePdfViewerOmega.tsx` — Viewer por imagens
- `src/styles/sanctum.css` — CSS de proteção

---

## 🔥 VIDEO FORTRESS OMEGA v5.0 (PROTEÇÃO DE VÍDEOS)

| # | Arquivo | Função |
|---|---------|--------|
| 5 | `20251222600000_video_fortress_omega.sql` | 5 tabelas, 8 funções, RLS |
| 11 | `video-authorize-omega/index.ts` | Autorização + Signed URL + SANCTUM |
| 12 | `video-violation-omega/index.ts` | Risk score + bypass + ações graduais |

---

## 🧠 SNA OMEGA (AUTOMAÇÃO IA)

| # | Arquivo | Função |
|---|---------|--------|
| 4 | `20251222400000_sna_omega_complete.sql` | Jobs, budgets, healthchecks |
| 9 | `sna-gateway/index.ts` | Gateway IA com rate limit |
| 10 | `sna-worker/index.ts` | Worker assíncrono |

---

## 🛡️ SECURITY FORTRESS ULTRA

| # | Arquivo | Função |
|---|---------|--------|
| 3 | `20251222200000_security_fortress_ultra.sql` | Sessões, audit, RLS |
| 8 | `secure-webhook-ultra/index.ts` | Webhooks com HMAC |

---

## 🚀 COMANDO ÚNICO DEFINITIVO (COLE NA LOVABLE)

```
Aplique as seguintes migrations SQL na ordem:

1. supabase/migrations/20251222000001_live_chat_system.sql
2. supabase/migrations/20251222000002_performance_indexes.sql
3. supabase/migrations/20251222200000_security_fortress_ultra.sql
4. supabase/migrations/20251222400000_sna_omega_complete.sql
5. supabase/migrations/20251222600000_video_fortress_omega.sql
6. supabase/migrations/20251222700000_matriz_funcoes_omega.sql
7. supabase/migrations/20251222800000_sanctum_pdf_omega.sql

Depois deploy as Edge Functions:
8. supabase/functions/secure-webhook-ultra
9. supabase/functions/sna-gateway
10. supabase/functions/sna-worker
11. supabase/functions/video-authorize-omega
12. supabase/functions/video-violation-omega
13. supabase/functions/sanctum-asset-manifest
14. supabase/functions/sanctum-report-violation

Os arquivos do frontend já estão no projeto e serão compilados automaticamente.

REGRAS:
- Owner (moisesblank@gmail.com) ignora TODAS as restrições
- PDF original NUNCA chega ao client
- Texto premium renderizado em canvas (não selecionável)
- Watermark dinâmica com nome + CPF + timestamp
- Violações escalam até lock temporário (24h max)
```

---

## ✅ CHECKLIST DE APLICAÇÃO

| # | Item | Status |
|---|------|--------|
| 1 | SQL Live Chat | ⏳ |
| 2 | SQL Performance | ⏳ |
| 3 | SQL Security | ⏳ |
| 4 | SQL SNA Omega | ⏳ |
| 5 | SQL Video Fortress | ⏳ |
| 6 | SQL Matriz Funções | ⏳ |
| 7 | SQL SANCTUM PDF | ⏳ |
| 8 | Edge secure-webhook-ultra | ⏳ |
| 9 | Edge sna-gateway | ⏳ |
| 10 | Edge sna-worker | ⏳ |
| 11 | Edge video-authorize-omega | ⏳ |
| 12 | Edge video-violation-omega | ⏳ |
| 13 | Edge sanctum-asset-manifest | ⏳ |
| 14 | Edge sanctum-report-violation | ⏳ |

Marque ✅ após aplicar cada item.

---

**Última atualização:** 22/12/2025

**ESTE É O PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS!**
