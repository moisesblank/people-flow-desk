# 🚀 MIGRAÇÃO PARA VERCEL — GUIA DEFINITIVO
**Data:** 2026-01-17  
**Status:** PRONTO PARA EXECUÇÃO  
**Versão do Código:** 17 de Janeiro de 2026 (mais recente)  
**Tempo Estimado:** 30-45 minutos

---

## 📋 ÍNDICE

1. [Pré-Requisitos](#1-pré-requisitos)
2. [Verificar Sincronização GitHub](#2-verificar-sincronização-github)
3. [Criar Conta Vercel](#3-criar-conta-vercel)
4. [Importar Projeto](#4-importar-projeto-do-github)
5. [Configurar Variáveis de Ambiente](#5-configurar-variáveis-de-ambiente)
6. [Deploy Inicial](#6-deploy-inicial)
7. [Configurar Domínio Customizado](#7-configurar-domínio-customizado)
8. [Configurar Cloudflare](#8-configurar-cloudflare)
9. [Testes Pós-Migração](#9-testes-pós-migração)
10. [Checklist Final](#10-checklist-final)
11. [Rollback (Se Necessário)](#11-rollback-se-necessário)

---

## 1. PRÉ-REQUISITOS

### ✅ O que você JÁ TEM:
- [x] Repositório GitHub conectado ao Lovable
- [x] Código atualizado (17/01/2026)
- [x] Backend Supabase funcionando (não será alterado)
- [x] Domínio pro.moisesmedeiros.com.br no Cloudflare

### 📝 O que você PRECISA:
- [ ] Conta no Vercel (gratuita)
- [ ] Acesso ao Cloudflare (você já tem)
- [ ] 30-45 minutos de tempo

---

## 2. VERIFICAR SINCRONIZAÇÃO GITHUB

### 2.1 Acessar o GitHub

1. No Lovable, clique no botão **GitHub** (canto superior direito)
2. Verifique se aparece "Connected" ou "Sincronizado"
3. Clique em **"View on GitHub"** para abrir o repositório

### 2.2 Confirmar Versão Mais Recente

No GitHub, verifique:
- **Último commit:** Deve ser de 17 de Janeiro de 2026
- **Branch:** `main` (ou `master`)
- **Arquivos alterados recentemente:**
  - `src/pages/aluno/AlunoQrCodesBook.tsx`
  - `src/pages/aluno/AlunoQrCodesPdfView.tsx`
  - `src/components/security/ProtectedPDFViewerV2.tsx`

### 2.3 Se NÃO Estiver Sincronizado

```
⚠️ IMPORTANTE: Se o GitHub não estiver atualizado:
1. No Lovable, vá em Settings → GitHub
2. Clique em "Force Push" ou "Sync Now"
3. Aguarde a sincronização completar
4. Verifique novamente no GitHub
```

---

## 3. CRIAR CONTA VERCEL

### 3.1 Acessar Vercel

1. Acesse: **https://vercel.com**
2. Clique em **"Start Deploying"** ou **"Sign Up"**

### 3.2 Criar Conta com GitHub

1. Selecione **"Continue with GitHub"** (RECOMENDADO)
2. Autorize o Vercel a acessar sua conta GitHub
3. Confirme a autorização

```
💡 DICA: Usar a mesma conta GitHub conectada ao Lovable
   facilita o processo e já dá acesso ao repositório.
```

---

## 4. IMPORTAR PROJETO DO GITHUB

### 4.1 Iniciar Importação

1. No Dashboard do Vercel, clique em **"Add New..."** → **"Project"**
2. Na lista de repositórios, encontre o projeto do Lovable
3. Clique em **"Import"**

### 4.2 Configurar Build Settings

Na tela de configuração, defina:

| Campo | Valor |
|-------|-------|
| **Framework Preset** | Vite |
| **Root Directory** | `.` (deixar vazio ou ponto) |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

### 4.3 Node.js Version

```
⚠️ IMPORTANTE: Verificar versão do Node.js
- Vá em "Settings" → "General" → "Node.js Version"
- Selecione: 18.x ou 20.x (recomendado)
```

---

## 5. CONFIGURAR VARIÁVEIS DE AMBIENTE

### 5.1 Variáveis OBRIGATÓRIAS

No Vercel, vá em **Settings → Environment Variables** e adicione:

| Nome | Valor | Ambiente |
|------|-------|----------|
| `VITE_SUPABASE_URL` | `https://fyikfsasudgzsjmumdlw.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5aWtmc2FzdWRnenNqbXVtZGx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MzUwMTEsImV4cCI6MjA4MTMxMTAxMX0.qSVRCgEX6L0cLZoDebzOIvTGhDeZi0Rl45SsDVZthIs` | Production, Preview, Development |
| `VITE_SUPABASE_PROJECT_ID` | `fyikfsasudgzsjmumdlw` | Production, Preview, Development |

### 5.2 Como Adicionar

1. Clique em **"Add New"**
2. Cole o **Nome** da variável
3. Cole o **Valor**
4. Marque os ambientes: ✅ Production, ✅ Preview, ✅ Development
5. Clique em **"Save"**
6. Repita para cada variável

```
⚠️ CRÍTICO: NÃO pule esta etapa!
   Sem as variáveis de ambiente, o app não conectará ao backend.
```

---

## 6. DEPLOY INICIAL

### 6.1 Executar Build

1. Após configurar as variáveis, clique em **"Deploy"**
2. Aguarde o build completar (2-5 minutos)
3. Monitore os logs para erros

### 6.2 Verificar Sucesso

✅ Build bem-sucedido mostra:
- Status: **"Ready"**
- URL temporária: `seu-projeto.vercel.app`

❌ Se houver erro:
- Verifique os logs de build
- Confirme variáveis de ambiente
- Verifique versão do Node.js

### 6.3 Testar URL Temporária

1. Clique na URL gerada (ex: `pro-moisesmedeiros.vercel.app`)
2. Teste:
   - [ ] Página inicial carrega
   - [ ] Login funciona
   - [ ] Navegação OK

---

## 7. CONFIGURAR DOMÍNIO CUSTOMIZADO

### 7.1 Adicionar Domínio no Vercel

1. No projeto, vá em **Settings → Domains**
2. Digite: `pro.moisesmedeiros.com.br`
3. Clique em **"Add"**
4. O Vercel mostrará as configurações de DNS necessárias

### 7.2 Opções de Configuração

O Vercel oferecerá duas opções:

**Opção A - CNAME (RECOMENDADA):**
```
Tipo: CNAME
Nome: pro
Valor: cname.vercel-dns.com
```

**Opção B - A Record:**
```
Tipo: A
Nome: pro
Valor: 76.76.21.21
```

```
💡 RECOMENDAÇÃO: Use CNAME para melhor compatibilidade com Cloudflare
```

---

## 8. CONFIGURAR CLOUDFLARE

### 8.1 Acessar Cloudflare

1. Acesse: **https://dash.cloudflare.com**
2. Selecione o domínio: `moisesmedeiros.com.br`
3. Vá em **DNS → Records**

### 8.2 Modificar Registro Existente

Encontre o registro atual de `pro` e **EDITE** (não delete):

**ANTES (Lovable):**
```
Tipo: CNAME
Nome: pro
Conteúdo: [algo].lovable.app
Proxy: Proxied (nuvem laranja)
```

**DEPOIS (Vercel):**
```
Tipo: CNAME
Nome: pro
Conteúdo: cname.vercel-dns.com
Proxy: DNS Only (nuvem cinza) ⚠️ IMPORTANTE!
TTL: Auto
```

### 8.3 Por que "DNS Only"?

```
⚠️ CRÍTICO: O Vercel exige "DNS Only" (nuvem cinza)
   Se deixar "Proxied" (nuvem laranja), o SSL pode conflitar.
   
   Você pode tentar Proxied depois, mas comece com DNS Only.
```

### 8.4 Salvar e Aguardar

1. Clique em **"Save"**
2. Aguarde propagação DNS (5-30 minutos)
3. Verifique no Vercel se o domínio ficou **"Valid Configuration"**

---

## 9. TESTES PÓS-MIGRAÇÃO

### 9.1 Checklist de Testes Funcionais

Acesse `https://pro.moisesmedeiros.com.br` e teste:

| Teste | URL | Esperado | Status |
|-------|-----|----------|--------|
| Home | `/` | Página inicial carrega | [ ] |
| Login | `/auth` | Formulário aparece | [ ] |
| Login Owner | - | moisesblank@gmail.com funciona | [ ] |
| Gestão | `/gestaofc` | Dashboard carrega (owner) | [ ] |
| Alunos | `/alunos/dashboard` | Portal carrega (beta) | [ ] |
| QR Codes | `/alunos/qr-codes` | Lista de books carrega | [ ] |
| Upload PDF | - | Upload funciona | [ ] |
| Visualizar PDF | - | PDF abre com watermark | [ ] |

### 9.2 Checklist de Segurança

| Teste | Esperado | Status |
|-------|----------|--------|
| HTTPS ativo | Cadeado verde no navegador | [ ] |
| RLS funcionando | Dados isolados por usuário | [ ] |
| Owner bypass | Acesso total sem bloqueios | [ ] |
| Login/Logout | Sessão funciona corretamente | [ ] |

### 9.3 Checklist de Performance

| Métrica | Aceitável | Ideal | Status |
|---------|-----------|-------|--------|
| TTFB | < 800ms | < 400ms | [ ] |
| LCP | < 2.5s | < 2.0s | [ ] |
| Carregamento | < 5s | < 3s | [ ] |

---

## 10. CHECKLIST FINAL

### ✅ Migração Completa

- [ ] Conta Vercel criada
- [ ] Projeto importado do GitHub
- [ ] Variáveis de ambiente configuradas (3 variáveis)
- [ ] Build bem-sucedido
- [ ] Domínio adicionado no Vercel
- [ ] DNS atualizado no Cloudflare
- [ ] Propagação DNS completa
- [ ] SSL ativo (HTTPS)
- [ ] Login funcionando
- [ ] Navegação OK
- [ ] QR Codes funcionando
- [ ] PDFs carregando

### 📊 Resultado Esperado

```
ANTES:
pro.moisesmedeiros.com.br → Lovable (bloqueado por timeout)

DEPOIS:
pro.moisesmedeiros.com.br → Vercel → App funcionando ✅
                                   ↓
                              Supabase (backend inalterado)
```

---

## 11. ROLLBACK (SE NECESSÁRIO)

### Se precisar voltar para Lovable:

1. **No Cloudflare:**
   - Edite o registro `pro`
   - Mude o conteúdo de volta para o domínio Lovable original
   - Pode ativar Proxy (nuvem laranja) novamente

2. **Domínio Lovable original:**
   - Verifique em Lovable → Settings → Domains
   - Geralmente é algo como: `people-flow-desk.lovable.app`

### Comando para verificar DNS atual:

```bash
# No terminal (Mac/Linux):
dig pro.moisesmedeiros.com.br

# Ou use: https://dnschecker.org
```

---

## 📞 SUPORTE

| Situação | Ação |
|----------|------|
| Build falhou | Verificar logs no Vercel |
| DNS não propaga | Aguardar até 48h (raro, geralmente 5-30min) |
| SSL não ativa | Verificar se DNS está "DNS Only" |
| Login não funciona | Verificar variáveis de ambiente |
| Dados não carregam | Verificar conexão Supabase |

---

## 🔄 ATUALIZAÇÕES FUTURAS

Após migrar, para atualizar o app:

1. **Via Lovable:** Faça mudanças normalmente → GitHub sincroniza → Vercel faz deploy automático
2. **Via GitHub:** Push para branch main → Vercel detecta e faz deploy
3. **Via Vercel:** Nenhuma ação necessária, deploys são automáticos

```
💡 O Vercel faz deploy automático a cada push no GitHub.
   Você continua usando Lovable normalmente para editar.
```

---

## ⏱️ RESUMO RÁPIDO (Para Referência)

```
1. vercel.com → Sign Up com GitHub
2. Add New Project → Importar repositório
3. Framework: Vite
4. Adicionar 3 variáveis de ambiente
5. Deploy
6. Domains → Adicionar pro.moisesmedeiros.com.br
7. Cloudflare → Editar CNAME pro → cname.vercel-dns.com (DNS Only)
8. Aguardar 5-30min
9. Testar tudo
10. ✅ PRONTO!
```

---

**Documento criado em:** 2026-01-17  
**Autor:** SYNAPSE Ω  
**Versão:** 1.0.0  
**Status:** PRONTO PARA EXECUÇÃO
