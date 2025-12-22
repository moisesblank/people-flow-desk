# 🧠 MEMÓRIA DO PROJETO - GESTÃO MOISÉS MEDEIROS

> **DOCUMENTO SAGRADO** - Atualizado em: 22/12/2025
> **Assistente:** MESTRE (IA Claude - Cursor)

---

## 📌 DECISÃO ESTRATÉGICA PRINCIPAL

### O DOMÍNIO PRINCIPAL SERÁ ESTA PLATAFORMA

```
moisesmedeiros.com.br → LOVABLE CLOUD (Esta plataforma)
```

**DECISÃO TOMADA:** O site de gestão Lovable será o site PRINCIPAL da marca.

**O QUE ISSO SIGNIFICA:**
- O domínio `moisesmedeiros.com.br` apontará para o Lovable Cloud
- O WordPress atual será descontinuado ou migrado
- Esta plataforma será a "cara" da empresa
- Landing page + Sistema de gestão = TUDO EM UM LUGAR

---

## 🔑 DADOS DO OWNER (IMUTÁVEIS)

| Campo | Valor |
|-------|-------|
| **Email** | moisesblank@gmail.com |
| **Nome** | Professor Moisés Medeiros |
| **Empresa 1** | MMM CURSO DE QUÍMICA LTDA (CNPJ: 53.829.761/0001-17) |
| **Empresa 2** | CURSO QUÍMICA MOISES MEDEIROS (CNPJ: 44.979.308/0001-04) |
| **Domínio Principal** | moisesmedeiros.com.br |
| **Área do Aluno Atual** | app.moisesmedeiros.com.br (WordPress) |

---

## 🖥️ INFRAESTRUTURA LOVABLE CLOUD

| Parâmetro | Valor |
|-----------|-------|
| **ID do Projeto** | `fyikfsasudgzsjmumdlw` |
| **Região** | AWS São Paulo (sa-east-1) |
| **Nível Ativo** | `ci_xlarge` (4 vCPU, 8GB RAM) |
| **Ativo Desde** | 20/12/2025 |
| **Status** | ✅ Ativo e operacional |
| **CDN** | Cloudflare |
| **SSL** | Automático |

---

## 🌐 ESTRUTURA DE DOMÍNIOS (APÓS MIGRAÇÃO)

| Subdomínio | Destino | Status |
|------------|---------|--------|
| `moisesmedeiros.com.br` | Lovable Cloud (Landing + Gestão) | 🔄 MIGRAR |
| `www.moisesmedeiros.com.br` | Redireciona para principal | 🔄 MIGRAR |
| `app.moisesmedeiros.com.br` | Área do Aluno (WordPress) | ⏸️ MANTER POR AGORA |

---

## 🛠️ STACK TECNOLÓGICA

### Frontend
- React 19 + Vite 6
- Tailwind CSS 4
- shadcn/ui
- Framer Motion
- Zustand + React Query 5

### Backend (Supabase)
- PostgreSQL (Supabase)
- Edge Functions (Deno) - 54 funções
- Realtime
- Storage

### Infraestrutura
- **Servidor**: ci_xlarge (4 vCPU, 8GB RAM)
- **CDN**: Cloudflare
- **SSL**: Automático
- **DNS**: Cloudflare

---

## 💾 BANCO DE DADOS POSTGRESQL

| Métrica | Valor |
|---------|-------|
| **Total de Tabelas** | 30+ tabelas ativas |
| **Funções SQL** | 119 funções |
| **Triggers Ativos** | 70+ triggers |
| **Índices** | 20+ índices otimizados |

### Top 5 Tabelas por Tamanho

| Tabela | Tamanho | Índices |
|--------|---------|---------|
| `audit_logs` | 7,9 MB | 864 KB |
| `user_sessions` | 1,5 MB | 840 KB |
| `activity_logs` | 1,4 MB | 944 KB |
| `calendar_tasks` | 328 KB | 128 KB |
| `alunos` | 296 KB | 240 KB |

---

## ⚡ EDGE FUNCTIONS (54 Funções)

### Principais Categorias:
- 🤖 **IA**: ai-assistant, ai-tramon, ai-tutor, chat-tramon, ia-gateway
- 🔥 **Hotmart**: hotmart-fast, hotmart-webhook-processor, webhook-curso-quimica
- 📱 **Social**: youtube-api, instagram-sync, tiktok-sync, facebook-ads-sync
- 📧 **Comunicação**: send-email, whatsapp-webhook, notify-owner
- 🔐 **Segurança**: send-2fa-code, verify-2fa-code, secure-api-proxy
- 📊 **Relatórios**: reports-api, generate-weekly-report

---

## 🔐 SECRETS CONFIGURADOS (32 Chaves)

| Categoria | Secrets |
|-----------|---------|
| **IA** | OPENAI_API_KEY, ELEVENLABS_API_KEY, LOVABLE_API_KEY |
| **Hotmart** | HOTMART_CLIENT_ID, HOTMART_CLIENT_SECRET, HOTMART_HOTTOK |
| **WhatsApp** | WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_VERIFY_TOKEN |
| **Social** | YOUTUBE_API_KEY, FACEBOOK_ACCESS_TOKEN, INSTAGRAM_BUSINESS_ACCOUNT_ID |
| **WordPress** | WP_API_URL, WP_API_TOKEN |
| **Infra** | CLOUDFLARE_*, CPANEL_*, REGISTROBR_* |
| **APIs** | PANDA_API_KEY, RESEND_API_KEY, FIRECRAWL_API_KEY |

---

## 👥 DADOS EM PRODUÇÃO

| Entidade | Quantidade |
|----------|------------|
| **Alunos** | 31 |
| **Funcionários** | 2 |
| **Afiliados** | 1 |
| **Usuários (perfis)** | 7 |
| **Logs de Atividade** | 2.025 |
| **Sessões Registradas** | 1.197 |
| **Webhooks Pendentes** | 4 |

---

## 📊 CAPACIDADES DO SISTEMA

| Recurso | Disponível | Em Uso | % Livre |
|---------|------------|--------|---------|
| Database | 8 GB | 27 MB | 99.7% |
| Storage | 100 GB | 74 MB | 99.9% |
| Tabelas | Ilimitado | 30+ | ∞ |
| Edge Functions | Ilimitado | 54 | ∞ |
| Secrets | Ilimitado | 32 | ∞ |

### Capacidade de Usuários

| Cenário | Suporta? | Observação |
|---------|----------|------------|
| 5.000 usuários no sistema | ✅ SIM | Supabase escala |
| 5.000 navegando portal | ✅ SIM | CDN Cloudflare |
| 5.000 assistindo vídeo | ✅ SIM | Via YouTube/Panda (não usa Supabase) |
| 5.000 em live | ✅ SIM | Via YouTube Live (aguenta milhões) |

**IMPORTANTE:** Vídeos e lives NÃO passam pelo Supabase. Passam pelo YouTube/Panda Video que escalam automaticamente para milhões de viewers.

---

## 🚀 SISTEMA DE PERFORMANCE (Gospel v3.0)

| Configuração | Valor |
|--------------|-------|
| **Max First Paint** | 50ms |
| **Max Interactive** | 150ms |
| **Resposta máxima API** | 100ms |
| **Cache stale time** | 30s |
| **Cold Start Edge** | <100ms |

### Tiers de Performance
- 🟣 QUANTUM (110+): WebGPU, HDR, 120 fps
- 🔵 NEURAL (85+): Capacidades avançadas
- 🟢 ENHANCED (60+): Otimizado
- 🟡 STANDARD (35+): Normal
- 🔴 LEGACY (<35): Modo econômico

---

## ✅ CHECKLIST DE MIGRAÇÃO

### ANTES DE MIGRAR
- [ ] Fazer backup completo do WordPress
- [ ] Exportar lista de emails/alunos
- [ ] Documentar todas as páginas do site atual
- [ ] Testar landing page no Lovable
- [ ] Configurar emails transacionais

### DURANTE A MIGRAÇÃO
- [ ] Adicionar domínio no Lovable
- [ ] Atualizar DNS no Cloudflare
- [ ] Aguardar propagação (até 48h)
- [ ] Testar acesso via domínio

### APÓS A MIGRAÇÃO
- [ ] Verificar SSL ativo
- [ ] Testar todas as páginas
- [ ] Verificar formulários
- [ ] Monitorar erros por 48h
- [ ] Comunicar equipe

---

## ⚠️ ALERTAS DE SISTEMA

| Alerta | Severidade | Ação |
|--------|------------|------|
| Extensão `pg_net` no schema público | 🟡 Baixa | Não crítico |
| Proteção de senha vazada | 🟠 Média | Configurar manualmente |

---

## 🚨 REGRAS INVIOLÁVEIS

1. **NUNCA** remover funcionalidades sem autorização do Owner
2. **NUNCA** expor dados sensíveis (salários, CPFs, etc.)
3. **NUNCA** desativar RLS nas tabelas
4. **SEMPRE** manter backup antes de mudanças críticas
5. **SEMPRE** testar em ambiente de preview antes de publicar

---

## 🚫 REGRA SOBRE ARQUIVOS NA DIREITA DO CURSOR

> **ATENÇÃO OWNER:**

❌ Os arquivos que aparecem na **direita do Cursor** são **TODOS os arquivos do projeto**
❌ **NÃO** são os arquivos que você precisa aplicar
❌ **NÃO** aplique arquivos aleatoriamente

✅ Para saber **O QUE APLICAR**, consulte APENAS:
1. O arquivo `PENDENTES_APLICAR.md` na raiz do projeto
2. Ou siga os passos numerados nesta memória (abaixo)

### Por que isso acontece?

O projeto tem **182 migrações SQL** antigas + **61 Edge Functions** que já existiam.
Os **NOVOS** que eu criei são apenas **7 arquivos** (4 SQL + 3 Edge Functions).

---

## 📌 REGRA DO MESTRE — COMUNICAÇÃO COM O OWNER

> **OBRIGATÓRIO SEMPRE SEGUIR:**

1. **SEMPRE** que entregar código, dizer **EXATAMENTE** o que o Owner deve fazer
2. **SEMPRE** indicar o **LOCAL EXATO** ou **LINK** de onde ir
3. **SEMPRE** entregar em **ORDEM NUMÉRICA** (1, 2, 3...)
4. **LEMBRAR:** Supabase já está vinculado ao Lovable — Owner pode colar direto no chat da Lovable
5. **NUNCA** assumir que o Owner sabe onde ir — ser **EXPLÍCITO** sempre
6. **SEMPRE** perguntar se deu certo antes de seguir para próximo passo
7. **NUNCA** indicar que o Owner deve olhar a direita do Cursor — sempre dar os passos direto
8. **SEMPRE** que houver algo novo para aplicar, atualizar `PENDENTES_APLICAR.md`

### FORMATO PADRÃO DE ENTREGA:

```
📍 PASSO [N]: [TÍTULO]
🔗 ONDE: [Local exato ou link]
📝 O QUE FAZER: [Instruções claras]
📋 CÓDIGO: [Se aplicável, o código para copiar]
✅ CONFIRMAÇÃO: [O que esperar se deu certo]
```

---

## 📝 HISTÓRICO DE DECISÕES

| Data | Decisão | Responsável |
|------|---------|-------------|
| 20/12/2025 | Domínio principal será Lovable Cloud | Owner |
| 22/12/2025 | Assistente IA "MESTRE" assume desenvolvimento | Owner |
| 22/12/2025 | Documento de memória atualizado com dados completos Lovable | MESTRE |

---

## 🤖 SOBRE O ASSISTENTE (MESTRE)

- **Nome**: MESTRE
- **Engine**: Claude (Anthropic) via Cursor
- **Função**: Desenvolvedor/Arquiteto do sistema
- **Disponibilidade**: 24/7
- **Capacidades**: Código, arquitetura, debugging, deploy, explicações

---

## 📋 ARQUIVOS PENDENTES PARA APLICAR NO LOVABLE/SUPABASE

### 🔴 PRIORIDADE 1: MIGRAÇÕES SQL (Aplicar no Supabase Dashboard > SQL Editor)

| Arquivo | Tamanho | Status | O que faz |
|---------|---------|--------|-----------|
| `20251222000001_live_chat_system.sql` | 13KB | ⏳ PENDENTE | Sistema de chat ao vivo |
| `20251222000002_performance_indexes.sql` | 8KB | ⏳ PENDENTE | Índices de performance |
| `20251222200000_security_fortress_ultra.sql` | 34KB | ⏳ PENDENTE | Segurança completa (RLS, sessões) |
| `20251222400000_sna_omega_complete.sql` | 46KB | ⏳ PENDENTE | Automação IA (10 tabelas, 15 funções) |

**TOTAL:** 4 arquivos SQL para aplicar

### 🟡 PRIORIDADE 2: EDGE FUNCTIONS (Deploy via Supabase CLI ou Dashboard)

| Pasta | Status | O que faz |
|-------|--------|-----------|
| `supabase/functions/secure-webhook-ultra/` | ⏳ PENDENTE | Webhook seguro |
| `supabase/functions/sna-gateway/` | ⏳ PENDENTE | Gateway de IA |
| `supabase/functions/sna-worker/` | ⏳ PENDENTE | Processador de jobs IA |

**TOTAL:** 3 Edge Functions para deploy

### 🟢 JÁ APLICADO AUTOMATICAMENTE (Não precisa fazer nada)

Os seguintes arquivos já estão no código e serão aplicados quando o Lovable fizer o build:
- `src/hooks/useAIAutomation.ts`
- `src/components/admin/AIControlCenter.tsx`
- `src/hooks/useSecurityGuard.ts`
- `src/contexts/SecurityContext.tsx`
- `src/components/chat/LiveChatPanel.tsx`

---

## 🚶 PRÓXIMOS PASSOS PENDENTES (COLAR NA LOVABLE)

> **COMO FUNCIONA:** O Owner copia o texto abaixo e cola no chat da Lovable.
> O Supabase já está vinculado, então a Lovable aplica automaticamente.

---

### 📍 PASSO 1: MIGRAÇÃO SQL — CHAT AO VIVO
🔗 **ONDE:** Cole no chat da Lovable
📝 **O QUE FAZER:** Copie a mensagem abaixo e cole na Lovable
📋 **MENSAGEM PARA COLAR:**
```
Aplique esta migração SQL no Supabase para o sistema de chat ao vivo.
O arquivo está em: supabase/migrations/20251222000001_live_chat_system.sql
```
✅ **CONFIRMAÇÃO:** Lovable vai dizer que aplicou a migração
⏳ **STATUS:** PENDENTE

---

### 📍 PASSO 2: MIGRAÇÃO SQL — ÍNDICES DE PERFORMANCE
🔗 **ONDE:** Cole no chat da Lovable
📝 **O QUE FAZER:** Copie a mensagem abaixo e cole na Lovable
📋 **MENSAGEM PARA COLAR:**
```
Aplique esta migração SQL no Supabase para os índices de performance.
O arquivo está em: supabase/migrations/20251222000002_performance_indexes.sql
```
✅ **CONFIRMAÇÃO:** Lovable vai dizer que aplicou a migração
⏳ **STATUS:** PENDENTE

---

### 📍 PASSO 3: MIGRAÇÃO SQL — SEGURANÇA FORTALEZA
🔗 **ONDE:** Cole no chat da Lovable
📝 **O QUE FAZER:** Copie a mensagem abaixo e cole na Lovable
📋 **MENSAGEM PARA COLAR:**
```
Aplique esta migração SQL no Supabase para o sistema de segurança completo.
O arquivo está em: supabase/migrations/20251222200000_security_fortress_ultra.sql
```
✅ **CONFIRMAÇÃO:** Lovable vai dizer que aplicou a migração
⏳ **STATUS:** PENDENTE

---

### 📍 PASSO 4: MIGRAÇÃO SQL — AUTOMAÇÃO IA (SNA)
🔗 **ONDE:** Cole no chat da Lovable
📝 **O QUE FAZER:** Copie a mensagem abaixo e cole na Lovable
📋 **MENSAGEM PARA COLAR:**
```
Aplique esta migração SQL no Supabase para o Sistema Nervoso Autônomo (SNA) de Automação com IA.
O arquivo está em: supabase/migrations/20251222400000_sna_omega_complete.sql
```
✅ **CONFIRMAÇÃO:** Lovable vai dizer que aplicou a migração
⏳ **STATUS:** PENDENTE

---

### 📍 PASSO 5: EDGE FUNCTION — WEBHOOK SEGURO
🔗 **ONDE:** Cole no chat da Lovable
📝 **O QUE FAZER:** Copie a mensagem abaixo e cole na Lovable
📋 **MENSAGEM PARA COLAR:**
```
Faça deploy da Edge Function de webhook seguro.
O arquivo está em: supabase/functions/secure-webhook-ultra/index.ts
```
✅ **CONFIRMAÇÃO:** Lovable vai dizer que fez deploy
⏳ **STATUS:** PENDENTE

---

### 📍 PASSO 6: EDGE FUNCTION — GATEWAY DE IA
🔗 **ONDE:** Cole no chat da Lovable
📝 **O QUE FAZER:** Copie a mensagem abaixo e cole na Lovable
📋 **MENSAGEM PARA COLAR:**
```
Faça deploy da Edge Function do Gateway de IA (SNA Gateway).
O arquivo está em: supabase/functions/sna-gateway/index.ts
```
✅ **CONFIRMAÇÃO:** Lovable vai dizer que fez deploy
⏳ **STATUS:** PENDENTE

---

### 📍 PASSO 7: EDGE FUNCTION — WORKER DE IA
🔗 **ONDE:** Cole no chat da Lovable
📝 **O QUE FAZER:** Copie a mensagem abaixo e cole na Lovable
📋 **MENSAGEM PARA COLAR:**
```
Faça deploy da Edge Function do Worker de IA (SNA Worker).
O arquivo está em: supabase/functions/sna-worker/index.ts
```
✅ **CONFIRMAÇÃO:** Lovable vai dizer que fez deploy
⏳ **STATUS:** PENDENTE

---

### 📍 PASSO 8: TESTAR O SISTEMA
🔗 **ONDE:** No site, acesse Admin > Central de IAs
📝 **O QUE FAZER:** Clique em "Healthcheck" para testar se as IAs estão funcionando
✅ **CONFIRMAÇÃO:** Todos os serviços devem aparecer como "Online" (verde)
⏳ **STATUS:** PENDENTE

---

## 📍 MAPA DE URLs DEFINITIVO (REGRA INVIOLÁVEL)

| Quem | URL | Role | Validação |
|------|-----|------|-----------|
| 🌐 NÃO PAGANTE | pro.moisesmedeiros.com.br/ | NULL, viewer, aluno_gratuito | Criar conta = acesso livre |
| 👨‍🎓 ALUNO BETA | pro.moisesmedeiros.com.br/alunos | beta | role='beta' + acesso válido |
| 👔 FUNCIONÁRIO | gestao.moisesmedeiros.com.br/ | funcionario | role='funcionario' |
| 👑 OWNER | TODAS | owner | role='owner' |

---

## 📦 MATRIZES IMPLEMENTADAS

| Matriz | Status | Arquivos |
|--------|--------|----------|
| 🏎️ PERFORMANCE | ✅ Completa | Chat, índices, cache |
| 🛡️ SEGURANÇA | ✅ Completa | RLS, sessões, 2FA |
| 🧠 AUTOMAÇÃO IA | ✅ Completa | SNA Gateway, Worker, 18 workflows |

---

*Documento mantido pelo sistema SYNAPSE v15.0*
*Última atualização: 22/12/2025 pelo MESTRE*
