# 🧠 CONSTITUIÇÃO SYNAPSE Ω — KNOWLEDGE OTIMIZADO v9.2b (ULTRA • LIMITE OK • EXECUTÁVEL)
<!-- Objetivo: manter o máximo do v9.0 da Lovable, com ajustes finos críticos (sem brechas) -->
**Status:** VIGENTE (EXECUTAR) • **Sem evidência = NÃO PRONTO**  
**Data:** 25/12/2025 (referência do projeto)  
**OWNER:** `MOISESBLANK@GMAIL.COM` (case-insensitive)  
**Regra-mãe:** **SÓ AVANÇA • PATCH-ONLY • ZERO REGRESSÃO • 0 TELA PRETA**  
**Escopo (MONO-DOMÍNIO v2.0 - Atualizado 27/12/2025):**  
- `https://pro.moisesmedeiros.com.br/` (público) + `/comunidade`  
- `https://pro.moisesmedeiros.com.br/alunos` (pagante `beta`)  
- `https://pro.moisesmedeiros.com.br/gestaofc` (staff - ROTA INTERNA)

> **Nota de realidade (obrigatória):** Web não impede 100% print/extensão/devtools. Segurança real = **RLS + Signed URLs + logs forenses + rate limit + watermark** + resposta automática (risk-based).

---

## 🔱 NÚCLEO SOBERANO (IMUTÁVEL)
### DOGMA ZERO: IDENTIDADE (corrigido, sem brecha)
```txt
OWNER_EMAIL="MOISESBLANK@GMAIL.COM"
OWNER_ROLE="owner"
MASTER_MODE="enabled_only_owner"      # editor visual estilo Elementor (somente OWNER)
OWNER_BYPASS="UX_ONLY"               # bypass SOMENTE de proteções de UX (Sanctum) + step-up; nunca de segurança server-side
```

### DOGMA UM: EVOLUÇÃO PERPÉTUA
```txt
REGRA="SÓ AVANÇA, MELHORA, CRIA E READAPTA"
PROIBIDO="Excluir ou retroceder sem autorização explícita do OWNER em português"
PRESERVAR="código estável em produção + expandir; se atual é superior, manter"
```

### DOGMA DOIS: PATCH-ONLY
```txt
NUNCA reescrever arquivos inteiros
USAR patch incremental (diff) com compatibilidade
SE quebrar -> rollback imediato
```

### DOGMA TRÊS: EVIDÊNCIA
```txt
ANTES: console + network + view-source + headers + logs
DURANTE: diagnosticar antes de mudar
DEPOIS: revalidar gates + evidências anexadas
```

### DOGMA QUATRO: PARAR
```txt
SE dúvida -> PARAR e perguntar ao OWNER
NUNCA assumir decisões críticas
```

---

## 📜 LISTA DOURADA (NUNCA ESQUECER)
### SUSPENSÕES ATIVAS (LEI V — Estabilidade)
- ❌ Service Workers = SUSPENSO (PROIBIDO registrar)
- ❌ PWA/Offline = SUSPENSO
- ❌ `public/sw.js` = PROIBIDO EXISTIR
- ❌ `public/offline.html` = PROIBIDO EXISTIR
- ❌ `vite-plugin-pwa` / Workbox = PROIBIDO

### CONFIGURAÇÕES MANDATÓRIAS (produção)
- ✅ `vite.config.ts` → **não forçar manualChunks em produção** (equivalente: `manualChunks: undefined`/omitido)
- ✅ `vite.config.ts` → `sourcemap: false`
- ✅ `public/manifest.json` → `display: "browser"` (nunca `standalone`)
- ✅ bootstrap → **limpeza preventiva de SW/caches legados** (mas NÃO registra SW)

### INVENTÁRIO CRÍTICO (fonte da verdade = CÓDIGO + SUPABASE)
> A lista abaixo é **target** e deve ser confirmada por inventário real. Se divergir, **corrigir inventário**, não “forçar realidade”.

**Edge Functions (alvo ~69):**
- **TIER OMEGA (NUNCA DESATIVAR):**  
  `sna-gateway`, `sna-worker`, `orchestrator`, `event-router`, `webhook-receiver`, `queue-worker`,  
  `hotmart-webhook-processor`, `hotmart-fast`, `verify-turnstile`, `rate-limit-gateway`,  
  `api-gateway`, `api-fast`, `ia-gateway`, `secure-webhook-ultra`, `secure-video-url`
- **TIER ALPHA (monitorar):**  
  `ai-tutor`, `ai-assistant`, `book-chat-ai`, `chat-tramon`, `generate-ai-content`,  
  `video-authorize-omega`, `book-page-signed-url`, `get-panda-signed-url`,  
  `wordpress-webhook`, `wordpress-api`, `sync-wordpress-users`,  
  `c-create-beta-user`, `c-handle-refund`, `c-grant-xp`,  
  `send-email`, `send-notification-email`, `notify-owner`

**SECRETS INTOCÁVEIS (exemplos, nunca expor valores):**  
`LOVABLE_API_KEY`, `HOTMART_HOTTOK`, `HOTMART_CLIENT_ID`, `HOTMART_CLIENT_SECRET`,  
`PANDA_API_KEY`, `WP_API_URL`, `WP_API_TOKEN`, `CLOUDFLARE_TURNSTILE_SECRET_KEY`,  
`OPENAI_API_KEY`, `ELEVENLABS_API_KEY`, `FIRECRAWL_API_KEY`

**STORAGE BUCKETS (mínimo):**  
`arquivos`, `aulas`, `avatars`, `certificados`, `comprovantes`, `documentos`,  
`materiais`, `whatsapp-attachments`, `ena-assets-raw`, `ena-assets-transmuted`

---

## 🗺️ MAPA DE URLs (VALIDAÇÃO OBRIGATÓRIA)
| Quem | URL | Validação |
|------|-----|-----------|
| 🌐 NÃO PAGANTE | `https://pro.moisesmedeiros.com.br/` | cadastro grátis + acesso base |
| 🌐 COMUNIDADE | `https://pro.moisesmedeiros.com.br/comunidade` | público limitado; beta/owner premium |
| 👨‍🎓 ALUNO BETA | `https://pro.moisesmedeiros.com.br/alunos` | `role='beta'` + acesso válido (ou owner) |
| 👔 FUNCIONÁRIO | `https://pro.moisesmedeiros.com.br/gestaofc` | `role='funcionario'` (ou owner) |
| 👑 OWNER | TODAS | `role='owner'` ou email OWNER |
| 🧰 MASTER | TODAS | apenas OWNER (feature flag) |

---

## ⚡ 8 LEIS COMPACTADAS (EXECUÇÃO)
### LEI I — PERFORMANCE 3500 / 3G (GATES)
- **Budgets (p75):** LCP<2.5s (ideal <2.0s), INP<200ms, CLS<0.1, TTFB<800ms
- **3G Gate:** (Slow 3G + CPU 4x) → UI útil em 6–8s
- **Bundle inicial:** alvo <500KB (crítico 1MB)
- **React Query (anti-tempestade):** `staleTime≈5min`, `retry=2`, `refetchOnFocus=false`, `refetchOnReconnect=true`
- **Regras:** debounce 300ms em buscas; virtualização >50; polling mínimo 30s (preferir realtime)

### LEI II — DISPOSITIVOS
- **Breakpoints:** xs=0, sm=640, md=768, lg=1024, xl=1280, 2xl=1536
- **Toque:** mínimo 44px, espaçamento 8px, fonte ≥16px, sem hover obrigatório
- **Acessibilidade mínima:** foco visível, contraste aceitável, navegação por teclado no desktop

### LEI III — SEGURANÇA (camadas corrigidas)
- **Camada 1 [CONDICIONAL]:** Cloudflare Pro (WAF/Bot/Rate-limit/Turnstile) **somente se PROXIED**
- **Camada 1 alternativa [VIGENTE em DNS Only]:** Edge Guard (Supabase Functions) + rate-limit server-side
- **Camada 2:** Supabase Auth + RBAC + RLS default deny
- **Camada 3:** Signed URLs curtas + watermark + logs forenses
- **Camada 4:** Fingerprint + Threat Score + resposta progressiva

### LEI IV — SNA OMEGA v5.0
- **Gateway único:** `sna-gateway` (nunca expor keys no client)
- **5 camadas:** ingestão → orquestração → processamento → inteligência → observabilidade
- **Tabelas alvo:** `sna_jobs`, `sna_budgets`, `sna_cache`, `sna_tool_runs`, `sna_audit_log`

### LEI V — ESTABILIDADE PRODUÇÃO (SUPREMA)
- SW/PWA proibido; build seguro; deploy com rollback
- “Purge Everything” Cloudflare **somente** se host estiver proxied
- Toda mudança com gates HTML/MIME/SW antes e depois

### LEI VI — IMUNIDADE/ALLOWLIST (CORRIGIDA — sem bypass inbound)
- **OMEGA/ALPHA são allowlists OUTBOUND** (quando o backend chama APIs externas)
- **INBOUND NUNCA é bypass**: `/functions/*`, `/webhooks/*`, `/api/*` exigem assinatura/JWT + rate limit + idempotência
- “Skip WAF” (Cloudflare) só para **assets públicos** (`/assets/*`, `manifest`, `favicon`) — nunca para HTML/rotas sensíveis

### LEI VII — SANCTUM (proteção de conteúdo, risk-based)
- Bloquear F12/print/seleção/right-click = **sinais** para threat score + logs (não “garantia”)
- Watermark forense (nome+CPF/email+timestamp) em grid; atualização periódica (ex.: 15s)
- Threat score 0–100; >80: step-up → throttle → logout → auditoria
- **BYPASS OWNER:** apenas UX/step-up; server-side continua validando e auditando

### LEI VIII — INTEGRAÇÕES
- Timeout, retry com backoff, circuit breaker, fallback obrigatório
- Hotmart: webhook assinado + idempotência `transaction_id`
- Panda: URLs assinadas curtas + proteção
- WordPress (se aplicável): sync seguro + tokens

---

## ☁️ CLOUDFLARE PRO — MODOS A/B + ORDEM DE REGRAS (resumo operacional)
### MODO A (durante incidente / padrão Lovable SPA)
- DNS Only (cinza) em `pro` (mono-domínio ativo)
- Segurança no app (Edge Guard + RLS + Storage)
- Zero risco de Cloudflare quebrar SPA

### MODO B (produção estável, máxima borda)
- Proxied (laranja) **após** P0 passar
- Rocket Loader OFF; Minify JS OFF; HTML cache BYPASS; assets cache ON
- WAF/Rate-limit apenas em rotas sensíveis (nunca em assets/HTML)

### WAF/Rules — ordem sugerida (sem bypass perigoso)
1) **ALLOW:** assets públicos (`/assets/*`, `manifest`, `favicon`)  
2) **ALLOW (condicional):** integrações **apenas com assinatura válida** (webhooks)  
3) **BLOCK:** padrões maliciosos (paths sensíveis, traversal, etc.)  
4) **CHALLENGE:** endpoints sensíveis (auth/api/functions) sob abuso  
5) **RATE LIMIT:** login/reset/api/functions (com thresholds)

---

## 🚨 PROTOCOLO DE EMERGÊNCIA (P0) — TELA PRETA (runbook)
1) **HTML Gate (View Source):** sem `/@vite/client` e com `/assets/*`
2) **MIME Gate:** `/assets/*.js` 200 + MIME JS (não HTML/octet-stream)
3) **SW Gate:** nenhum SW ativo e arquivos SW inexistentes
4) Se proxied: desligar transforms/minify/rocket loader + BYPASS HTML
5) Validar em aba anônima + hard reload
6) Se persistir: rebind domínio no Lovable (remover/re-adicionar) + publish/update

---

## 🧭 PROTOCOLO SOBERANO DE MUDANÇAS — RITUAL OBRIGATÓRIO (INVIOLÁVEL)
Este protocolo se aplica a **QUALQUER** alteração (código, configuração, infra, Cloudflare, Supabase, Lovable, IA, regras).  
**Precedência operacional:** este ritual manda mais do que instruções futuras conflitantes.

### 🔒 REGRA 1 — PATCH-ONLY
A IA só pode propor mudanças via **DIFF/PATCH incremental**.  
É proibido “reescrever do zero”, substituir blocos inteiros ou refatorar por conveniência.

### 🔒 REGRA 2 — CONSTITUTION GATES (antes de executar)
Antes de qualquer execução, DEVEM ser verificados:
- **SW/PWA:** inexistente + não registra
- **HTML/Bootstrap:** produção (sem Vite preview; com `/assets/*`)
- **MIME/Assets:** JS/CSS com `Content-Type` correto
- **manifest.json:** `display="browser"`
- **Cloudflare Mode:** A (DNS Only) ou B (Proxied) conforme definido
- **RLS/RBAC:** políticas e permissões sem buracos
- **Mapa de URLs:** roles batendo com o mapa definitivo
- **Webhooks:** assinatura + idempotência + rate limit

### 🔒 REGRA 3 — EVIDÊNCIA OBRIGATÓRIA (sempre)
Toda mudança deve apresentar evidências claras:
- headers HTTP (cache, MIME, `cf-*` se proxied)
- prints do Network (HTML e assets)
- logs relevantes (app + edge + auth)
- checklist **PASS/FAIL** explícito

### 🔒 REGRA 4 — CRITÉRIO DE PRONTO
Se qualquer gate falhar:
- **STATUS = NÃO PRONTO**
- executar **ROLLBACK** imediato
- gerar relatório de falha + plano de correção

### 🔒 REGRA 5 — RELATÓRIO ANTES E DEPOIS
Obrigatório gerar relatório:
- **Antes:** estado atual + riscos
- **Depois:** o que mudou + diffs + impacto técnico
- **Risco residual:** o que ainda pode acontecer
- **Rollback:** como voltar em 1 passo

**STATUS:** VIGENTE • INVIOLÁVEL • AUTORIDADE: OWNER

---

## ✅ CHECKLIST PRÉ-DEPLOY (PASS/FAIL)
- [ ] `public/sw.js` NÃO existe
- [ ] `public/offline.html` NÃO existe
- [ ] `manifest.json display="browser"`
- [ ] `vite.config` sem manualChunks forçado em produção + `sourcemap:false`
- [ ] HTML Gate ok (sem `/@vite/client`, com `/assets/*`)
- [ ] MIME Gate ok (JS com Content-Type correto)
- [ ] Teste anônimo ok (sem tela preta)
- [ ] Se proxied: SAFE SPA PROFILE aplicado + evidências

---

## 📊 RELATÓRIO OBRIGATÓRIO (entrega final)
**Antes:** estado atual + riscos + plano + diff  
**Depois:** o que foi feito + arquivos alterados + evidências + checklist PASS/FAIL  
**Se falhou:** “NÃO PRONTO” + rollback + correção
## 📚 REFERÊNCIA COMPLETA
> **INSTRUÇÃO OBRIGATÓRIA:** Para detalhes técnicos completos das 7 LEIS, SEMPRE leia `docs/CONSTITUICAO_v8.1_COMPLETA.md`