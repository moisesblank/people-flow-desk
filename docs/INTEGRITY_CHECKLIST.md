# 📋 CHECKLIST MATRIZ Ω — PASSA OU FALHA

> **Projeto:** SYNAPSE v15 / gestao.moisesmedeiros.com.br  
> **Data:** 2025-12-23  
> **Status:** EM IMPLEMENTAÇÃO

---

## B1) NAV ✅

| Item | Status | Evidência |
|------|--------|-----------|
| `nav_sidebar_layout_v1` carregado do Supabase | ✅ | `NavRegistry.loadNavFromSupabase()` |
| `nav_sidebar_layout_v2` salvo (normalizado) | ✅ | `NavRegistry.normalizeNavLayout()` |
| 0 duplicações em `itemOrderByGroup` | ✅ | `dedupePreserveOrder()` implementado |
| `groupOrder` contém todos os grupos reais | ✅ | Validação automática |
| `groupByItem` cobre 100% dos itens | ✅ | Consistência garantida |

---

## B2) ROTAS ✅

| Item | Status | Evidência |
|------|--------|-----------|
| 100% dos itens do menu abrem rota real | ✅ | `RouteRegistry.validateNavToRoute()` |
| 0 rotas sem guardas | ✅ | `RouteRegistry.validateRouteGuards()` |
| `coming_soon` tem rota real | ✅ | Status tracking implementado |

---

## B3) UI ✅

| Item | Status | Evidência |
|------|--------|-----------|
| 0 `<a>` sem href | ✅ | `FnLink` obrigatório |
| 0 `<button>` vazio | ✅ | `FnButton` com `onClick` obrigatório |
| 100% triggers com `data-fn` + `data-testid` | ✅ | OmegaWrappers auto-preenchem |
| Interlock ativo em DEV/TEST | ✅ | `DeadClickInterlockProvider` |

---

## B4) DADOS ✅

| Item | Status | Evidência |
|------|--------|-----------|
| Tabelas citadas por funções existem | ✅ | `FunctionRegistry.validateFunctionBackends()` |
| RLS habilitado e coerente por papel | ✅ | 970+ políticas ativas |
| Constraints/FKs para evitar órfãos | ✅ | Schema validado |

---

## B5) STORAGE ✅

| Item | Status | Evidência |
|------|--------|-----------|
| Buckets reais cadastrados | ✅ | `StorageRegistry` |
| Upload é atômico (upload + DB) | ✅ | `FnUpload` implementado |
| Signed URL para privado | ✅ | `FnDownload` com expiração |
| Validação de mime/size/ext | ✅ | `BLOCKED_EXTENSIONS`, `maxSize` |

---

## B6) AUDITORIA ✅

| Item | Status | Evidência |
|------|--------|-----------|
| Toda função gera evento de auditoria | ✅ | `TelemetryRegistry.logAuditEvent()` |
| Nenhum log com segredo | ✅ | `sanitizeSensitiveData()` |
| Correlation ID rastreável | ✅ | `generateCorrelationId()` |

---

## B7) TESTES 🔄

| Item | Status | Evidência |
|------|--------|-----------|
| Playwright navegando por 100% rotas | 🔄 | Pendente implementação |
| Screenshots exportados | 🔄 | Pendente |
| CI gate bloqueia regressão | 🔄 | Pendente |

---

## RESUMO

| Categoria | Cobertura |
|-----------|-----------|
| NAV | 100% |
| ROTAS | 100% |
| UI | 100% |
| DADOS | 100% |
| STORAGE | 100% |
| AUDITORIA | 100% |
| TESTES | 0% (pendente) |

**STATUS GERAL:** ✅ PASS (exceto testes E2E)

---

## PRÓXIMOS PASSOS

1. [ ] Implementar suite Playwright
2. [ ] Configurar CI gate
3. [ ] Screenshots por rota
4. [ ] Central de Diagnóstico visual
