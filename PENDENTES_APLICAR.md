# 📋 PENDENTES PARA APLICAR — COMANDO ÚNICO DEFINITIVO

## 🔥 ESTE É O PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS 🔥

**Data de Atualização:** 22/12/2024
**Status:** ✅ BUILD PASSOU — PRONTO PARA APLICAR

---

## 📍 MAPA DE URLs DEFINITIVO (REGRA SUPREMA)

| Quem | URL | Validação |
|------|-----|-----------|
| 🌐 **NÃO PAGANTE** | `pro.moisesmedeiros.com.br/` + `/comunidade` | Cadastro gratuito |
| 👨‍🎓 **ALUNO BETA** | `pro.moisesmedeiros.com.br/alunos` | `role='beta'` + acesso válido |
| 👔 **FUNCIONÁRIO** | `gestao.moisesmedeiros.com.br/gestao` | `role='funcionario'` |
| 👑 **OWNER** | **TODAS** | `role='owner'` + `moisesblank@gmail.com` = MASTER |

---

## 🚀 MIGRAÇÕES SQL PARA APLICAR (EM ORDEM)

Cole no **SQL Editor do Supabase** na ordem correta:

### 1️⃣ SANCTUM OMEGA ULTRA (PROTEÇÃO DE CONTEÚDO)
**Arquivo:** `supabase/migrations/20251222900000_sanctum_omega_ultra.sql`

Este arquivo contém:
- 5 tabelas: `ena_assets`, `ena_asset_pages`, `sanctum_risk_state`, `sanctum_asset_access`, `sanctum_jobs_queue`
- 6 funções SQL: `fn_check_sanctum_lock`, `fn_apply_sanctum_risk`, `fn_decay_sanctum_scores`, `fn_get_asset_manifest`, `fn_register_sanctum_violation`, `fn_get_sanctum_stats`
- Trigger: `trg_apply_sanctum_risk`
- Políticas RLS completas
- Índices de performance

---

## ⚡ EDGE FUNCTIONS PARA DEPLOY

### 1️⃣ sanctum-asset-manifest
**Caminho:** `supabase/functions/sanctum-asset-manifest/index.ts`
**Propósito:** Entrega manifest seguro com URLs assinadas

### 2️⃣ sanctum-report-violation  
**Caminho:** `supabase/functions/sanctum-report-violation/index.ts`
**Propósito:** Recebe e processa violações de segurança

**Comando de deploy:**
```bash
supabase functions deploy sanctum-asset-manifest
supabase functions deploy sanctum-report-violation
```

---

## 📁 ARQUIVOS FRONTEND CRIADOS/ATUALIZADOS

| # | Arquivo | Descrição |
|---|---------|-----------|
| 1 | `src/core/storage.ts` | 28 buckets com controle de acesso |
| 2 | `src/hooks/useSanctumCore.ts` | Hook de detecção de ameaças |
| 3 | `src/components/security/SanctumWatermark.tsx` | Marca d'água dinâmica |
| 4 | `src/components/security/SanctumProtectedContent.tsx` | Wrapper de proteção |
| 5 | `src/components/security/HologramText.tsx` | Texto em canvas |
| 6 | `src/components/pdf/SecurePdfViewerOmega.tsx` | Visualizador blindado |
| 7 | `src/styles/sanctum.css` | CSS de proteção |
| 8 | `src/index.css` | Import do sanctum.css |

---

## ✅ VERIFICAÇÃO FINAL

- [x] Build: **PASSOU** (exit code: 0)
- [x] Lint: **PASSOU** (0 erros)
- [x] TypeScript: **SEM ERROS**
- [x] Owner bypass: **IMPLEMENTADO**
- [x] Mapa de URLs: **OBEDECIDO**

---

## 📝 PRÓXIMOS PASSOS

1. **Aplique a migração SQL** no Supabase
2. **Deploy das Edge Functions**
3. **Teste com usuário beta** (verificar watermark)
4. **Teste com owner** (verificar bypass)

---

**Prof. Moisés Medeiros**
**moisesmedeiros.com.br**
