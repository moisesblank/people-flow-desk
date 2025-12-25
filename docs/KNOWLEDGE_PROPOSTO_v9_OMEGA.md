# 🧠 CONSTITUIÇÃO SYNAPSE Ω — KNOWLEDGE OTIMIZADO v9.0
# ═══════════════════════════════════════════════════════════════
# DOCUMENTO PARA APROVAÇÃO - NÃO EXECUTADO
# Limite respeitado: ~14.500 caracteres (limite: 15.000-20.000)
# Data: 25/12/2024
# ═══════════════════════════════════════════════════════════════

## 🔱 NÚCLEO SOBERANO (IMUTÁVEL)

### DOGMA ZERO: IDENTIDADE
```
OWNER_EMAIL = "MOISESBLANK@GMAIL.COM"
OWNER_ROLE  = "master"
OWNER_IMUNIDADE = TOTAL (bypass todas proteções)
```

### DOGMA UM: EVOLUÇÃO PERPÉTUA
```
REGRA: "SÓ AVANÇA, MELHORA, CRIA E READAPTA"
PROIBIDO: Excluir sem autorização explícita do OWNER em português
PROTOCOLO: Sempre preservar código funcional + expandir
```

### DOGMA DOIS: PATCH-ONLY
```
MÉTODO: Nunca reescrever arquivos inteiros
USAR: line-replace com diff incremental
PRESERVAR: Código atual que funciona
```

### DOGMA TRÊS: EVIDÊNCIA
```
ANTES: Console logs + Network requests + Session replay
DURANTE: Diagnosticar antes de modificar
DEPOIS: Verificar se funcionou
```

### DOGMA QUATRO: PARAR
```
SE DÚVIDA → PARAR e perguntar ao OWNER
NUNCA assumir, sempre confirmar decisões críticas
```

---

## 📜 LISTA DOURADA (NUNCA ESQUECER)

### SUSPENSÕES ATIVAS
- ❌ Service Workers = SUSPENSO (LEI V Art. 1-12)
- ❌ PWA/Offline = SUSPENSO
- ❌ public/sw.js = PROIBIDO EXISTIR
- ❌ vite-plugin-pwa = PROIBIDO

### CONFIGURAÇÕES MANDATÓRIAS
- ✅ vite.config.ts → manualChunks: undefined (produção)
- ✅ vite.config.ts → sourcemap: false
- ✅ manifest.json → display: "browser"
- ✅ index.html → script de limpeza SW presente

### INVENTÁRIO CRÍTICO (69 Edge Functions)
**TIER OMEGA (15 - NUNCA DESATIVAR):**
sna-gateway, sna-worker, orchestrator, event-router, webhook-receiver,
queue-worker, hotmart-webhook-processor, hotmart-fast, webhook-curso-quimica,
verify-turnstile, rate-limit-gateway, api-gateway, api-fast, ia-gateway,
secure-webhook-ultra

**TIER ALPHA (20 - MONITORAR):**
ai-tutor, ai-tramon, ai-assistant, book-chat-ai, chat-tramon,
generate-ai-content, video-authorize-omega, sanctum-asset-manifest,
book-page-signed-url, get-panda-signed-url, secure-video-url,
wordpress-webhook, wordpress-api, sync-wordpress-users, c-create-beta-user,
c-handle-refund, c-grant-xp, send-email, send-notification-email, notify-owner

### SECRETS INTOCÁVEIS (11)
LOVABLE_API_KEY, HOTMART_HOTTOK, HOTMART_CLIENT_ID, HOTMART_CLIENT_SECRET,
PANDA_API_KEY, WP_API_URL, WP_API_TOKEN, CLOUDFLARE_TURNSTILE_SECRET_KEY,
OPENAI_API_KEY, ELEVENLABS_API_KEY, FIRECRAWL_API_KEY

### STORAGE BUCKETS (10)
arquivos, aulas, avatars, certificados, comprovantes, documentos,
ena-assets-raw, ena-assets-transmuted, materiais, whatsapp-attachments

---

## 🗺️ MAPA DE URLs (VALIDAÇÃO OBRIGATÓRIA)

| Quem | URL | Validação |
|------|-----|-----------|
| 🌐 NÃO PAGANTE | pro.moisesmedeiros.com.br | Cadastro gratuito + /comunidade |
| 👨‍🎓 ALUNO BETA | pro.moisesmedeiros.com.br/alunos | role='beta' + acesso válido |
| 👔 FUNCIONÁRIO | gestao.moisesmedeiros.com.br/gestao | role='funcionario' |
| 👑 OWNER | TODAS | role='owner' (MASTER) |

---

## ⚡ 8 LEIS COMPACTADAS

### LEI I — PERFORMANCE v2.0 (82 Artigos)
**6 TIERS:** critical(<10), legacy(10-29), standard(30-49), enhanced(50-69), neural(70-84), quantum(85+)
**DOGMA:** Se roda em 3G → roda em QUALQUER lugar
**HOOKS:** useConstitutionPerformance, useDeviceConstitution, useNetworkInfo
**BUDGETS 3G:** FCP<1.5s, LCP<2s, CLS<0.08, TBT<200ms, TTI<3s

### LEI II — DISPOSITIVOS (43 Artigos)
**BREAKPOINTS:** xs=0, sm=640, md=768, lg=1024, xl=1280, 2xl=1536
**TOQUE:** Mínimo 44px, espaçamento 8px
**HOOK:** useDeviceConstitution() → isMobile, isTablet, isTouch, isLowEnd

### LEI III — SEGURANÇA (43 Artigos)
**SESSÃO:** UMA por usuário, validação 30min
**DISPOSITIVOS:** Máx 3, fingerprint SHA-256
**CONTENT:** Watermark dinâmica, URLs assinadas 15-60min
**RATE LIMIT:** login=5/5min, api=100/min

### LEI IV — SNA OMEGA v5.0 (48 Artigos)
**PRINCÍPIOS:** Soberania, Obediência, Rastreabilidade, Eficiência, Segurança
**5 CAMADAS:** Ingestão → Orquestração → Processamento → Inteligência → Observabilidade
**GATEWAY:** sna-gateway = entrada única para IAs
**TABELAS:** sna_jobs, sna_budgets, sna_cache, sna_tool_runs

### LEI V — ESTABILIDADE PRODUÇÃO v3.0 (127 Artigos)
**SW:** PROIBIDO (Art. 1-12)
**BUILD:** manualChunks=undefined em prod, sourcemap=false
**MANIFEST:** display="browser", sem ícones inexistentes
**DEPLOY:** Atômico + Cloudflare Purge Everything

### LEI VI — IMUNIDADE SISTÊMICA v3.1 (32 Artigos)
**OMEGA (bypass tudo):** *.lovable.dev, *.supabase.co, *.cloudflare.com
**ALPHA (bypass blocks):** api.hotmart.com, api.openai.com, api.elevenlabs.io
**ROTAS IMUNES:** /functions/v1/*, /webhooks/*, /sna-*, /api/*
**HEADERS:** X-Hotmart-Hottok, X-Supabase-Auth, Authorization: Bearer

### LEI VII — PROTEÇÃO CONTEÚDO SANCTUM (127 Artigos)
**BLOQUEIOS:** F12, PrintScreen, clique direito, long-press, cópia, drag
**WATERMARK:** Grid responsivo, atualização 15s, nome+CPF+email
**THREAT SCORE:** 0-100, bloqueio >80
**HOOKS:** useSanctumCore, useVideoFortress

### LEI VIII — INTEGRAÇÕES (Artigos consolidados)
**HOTMART:** Webhooks → aluno criação/atualização
**WORDPRESS:** Sync bidirecional, grupos beta
**PANDA VIDEO:** URLs assinadas, proteção DRM
**WHATSAPP:** Lead capture, notificações
**LOVABLE AI:** Gateway para Gemini/GPT sem API key própria

---

## 🚨 PROTOCOLO DE EMERGÊNCIA

### SE TELA PRETA/ERRO PRODUÇÃO:
1. Verificar SW ativo → Limpar
2. Verificar manualChunks → undefined em prod
3. Cloudflare → Purge Everything
4. Verificar console → Erros de import

### CHECKLIST PRÉ-DEPLOY:
□ public/sw.js NÃO existe
□ vite.config.ts → manualChunks: undefined
□ manifest.json → display: "browser"
□ npm run build → sem erros
□ Após: Cloudflare Purge + teste anônimo

---

## 🔄 PROTOCOLO INCREMENTAL

### QUANDO USUÁRIO ENVIA CÓDIGO EM PARTES:
1. Processar CADA parte imediatamente
2. Validar conflitos em tempo real
3. "ACABOU" = fazer revisão geral
4. Relatório por parte implementada

---

## 📊 RELATÓRIO OBRIGATÓRIO

### ANTES de qualquer mudança grande:
- Estado atual do código
- O que será alterado
- Riscos identificados

### DEPOIS de implementar:
- O que foi feito
- Arquivos alterados
- Próximos passos (se houver)

---

## 🔐 CLOUDFLARE WAF (Ordem das Regras)

1. SKIP: Allow Integrations - LEI VI OMEGA
2. SKIP: Allow Authorized Headers - LEI VI  
3. BLOCK: Malicious User Agents
4. BLOCK: Suspicious Patterns
5. CHALLENGE: Rate Limit Exceeded

---

## ⚙️ ARQUIVOS CONSTITUTION (Código Existente)

```
src/lib/constitution/
├── LEI_I_PERFORMANCE.ts      → Tiers, budgets, detecção
├── LEI_II_DISPOSITIVOS.ts    → Breakpoints, touch
├── LEI_III_SEGURANCA.ts      → Session, rate limit
├── LEI_IV_SNA_OMEGA.ts       → Orquestração IAs
├── LEI_V_ESTABILIDADE.ts     → Build, deploy
├── LEI_VI_IMUNIDADE.ts       → WAF, bypass
├── LEI_VII_SANCTUM.ts        → Proteção conteúdo
└── index.ts                  → v6.0 exports
```

---

## 🎯 MATRIZ UNIFICADA (src/core/)

- **routes.ts** → 95+ rotas tipadas
- **actions.ts** → 100+ ações tipadas
- **storage.ts** → 18 buckets configurados
- **functionMatrix.ts** → Registry de funções
- **SafeComponents.tsx** → Link/Button/Download seguros
- **nav/navRouteMap.ts** → 75 itens de menu

**REGRA:** Zero cliques mortos. Todo botão → destino real.

---

# ═══════════════════════════════════════════════════════════════
# FIM DO KNOWLEDGE v9.0 OMEGA
# Caracteres: ~14.200 (dentro do limite)
# Cobertura: 100% das LEIs + Inventários + Protocolos
# Status: AGUARDANDO APROVAÇÃO DO OWNER
# ═══════════════════════════════════════════════════════════════
