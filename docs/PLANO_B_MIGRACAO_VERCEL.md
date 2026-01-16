# 🚀 PLANO B: Migração do Frontend para Vercel
## Guia Completo Passo a Passo (Para Leigos)

**Data de Criação:** 2026-01-16  
**Status:** PRONTO PARA EXECUÇÃO  
**Motivo:** Sandbox timeout persistente no Lovable impede deploys  
**Tempo Estimado:** 35-45 minutos + até 1h de propagação DNS

---

## 📋 ÍNDICE

1. [Pré-Requisitos](#1-pré-requisitos)
2. [ETAPA 1: Conectar GitHub ao Lovable](#2-etapa-1-conectar-github-ao-lovable)
3. [ETAPA 2: Criar Conta na Vercel](#3-etapa-2-criar-conta-na-vercel)
4. [ETAPA 3: Importar Projeto na Vercel](#4-etapa-3-importar-projeto-na-vercel)
5. [ETAPA 4: Configurar Variáveis de Ambiente](#5-etapa-4-configurar-variáveis-de-ambiente)
6. [ETAPA 5: Fazer o Deploy](#6-etapa-5-fazer-o-deploy)
7. [ETAPA 6: Configurar Domínio Customizado](#7-etapa-6-configurar-domínio-customizado)
8. [ETAPA 7: Atualizar DNS no Cloudflare](#8-etapa-7-atualizar-dns-no-cloudflare)
9. [ETAPA 8: Validação Final](#9-etapa-8-validação-final)
10. [Manutenção Futura](#10-manutenção-futura)
11. [Como Reverter (Se Necessário)](#11-como-reverter-se-necessário)

---

## 1. PRÉ-REQUISITOS

### O que você precisa ter:
- [ ] Conta no GitHub (gratuita) - https://github.com
- [ ] Acesso ao painel do Cloudflare (você já tem)
- [ ] Acesso ao Lovable (você já tem)
- [ ] ~45 minutos de tempo livre

### O que vai continuar funcionando AUTOMATICAMENTE:
- ✅ Banco de dados (todos os dados)
- ✅ Autenticação (login/logout)
- ✅ 94 Edge Functions
- ✅ Storage (arquivos, fotos, PDFs)
- ✅ Realtime (notificações)
- ✅ Todas as políticas de segurança (RLS)

### O que muda:
- Frontend hospedado na Vercel (ao invés do Lovable)
- Edições de código: VS Code local + git push
- Previews: Vercel Preview (ao invés do Lovable Preview)

---

## 2. ETAPA 1: Conectar GitHub ao Lovable

### Passo 1.1: Acessar o Lovable
1. Abra: https://lovable.dev
2. Entre no seu projeto (6e913832-eb53-4c6f-8ce9-7c3cc0b04251)

### Passo 1.2: Conectar ao GitHub
1. No editor do Lovable, olhe no **canto superior direito**
2. Clique no botão **"GitHub"** (ou ícone do GitHub)
3. Clique em **"Connect to GitHub"**
4. Uma janela do GitHub vai abrir
5. Clique em **"Authorize Lovable"**
6. Escolha sua conta pessoal ou organização
7. Clique em **"Create Repository"**

### Passo 1.3: Aguardar sincronização
- O Lovable vai criar um repositório novo no seu GitHub
- Nome sugerido: `pro-moisesmedeiros` ou similar
- Aguarde ~1-2 minutos para todo o código ser enviado
- Você verá uma mensagem de sucesso ✅

### Verificação:
- Acesse https://github.com/SEU_USUARIO
- Você deve ver o novo repositório listado
- Clique nele e verifique se há arquivos (src/, package.json, etc.)

---

## 3. ETAPA 2: Criar Conta na Vercel

### Passo 2.1: Acessar a Vercel
1. Abra: https://vercel.com
2. Clique em **"Sign Up"** (canto superior direito)

### Passo 2.2: Criar conta com GitHub
1. Clique em **"Continue with GitHub"** (RECOMENDADO)
2. Autorize a Vercel a acessar seu GitHub
3. Complete o cadastro (nome, email)

### Passo 2.3: Escolher plano
1. Selecione **"Hobby"** (gratuito, suficiente para começar)
2. Ou selecione **"Pro"** ($20/mês) se preferir mais recursos
3. Clique em **"Continue"**

### Verificação:
- Você deve estar no Dashboard da Vercel
- URL será algo como: https://vercel.com/SEU_USUARIO

---

## 4. ETAPA 3: Importar Projeto na Vercel

### Passo 3.1: Iniciar importação
1. No Dashboard da Vercel, clique em **"Add New..."**
2. Selecione **"Project"**

### Passo 3.2: Selecionar repositório
1. Na seção "Import Git Repository", você verá seus repos do GitHub
2. Encontre o repositório que o Lovable criou (ex: `pro-moisesmedeiros`)
3. Clique em **"Import"** ao lado dele

### Passo 3.3: Configurar projeto
1. **Project Name**: deixe como está ou renomeie (ex: `pro-moisesmedeiros`)
2. **Framework Preset**: a Vercel deve detectar automaticamente **"Vite"**
   - Se não detectar, selecione manualmente "Vite"
3. **Root Directory**: deixe em branco (usa a raiz)

### ⚠️ IMPORTANTE - NÃO CLIQUE EM DEPLOY AINDA!
Primeiro precisamos configurar as variáveis de ambiente (próxima etapa).

---

## 5. ETAPA 4: Configurar Variáveis de Ambiente

### Passo 4.1: Expandir "Environment Variables"
1. Na tela de configuração do projeto, procure a seção **"Environment Variables"**
2. Clique para expandir se estiver fechada

### Passo 4.2: Adicionar as 3 variáveis obrigatórias

Você vai adicionar 3 variáveis. Para cada uma:
- Digite o **Name** (nome da variável)
- Digite o **Value** (valor)
- Clique em **"Add"**

#### Variável 1:
```
Name: VITE_SUPABASE_URL
Value: https://fyikfsasudgzsjmumdlw.supabase.co
```

#### Variável 2:
```
Name: VITE_SUPABASE_PUBLISHABLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5aWtmc2FzdWRnenNqbXVtZGx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MzUwMTEsImV4cCI6MjA4MTMxMTAxMX0.qSVRCgEX6L0cLZoDebzOIvTGhDeZi0Rl45SsDVZthIs
```

#### Variável 3:
```
Name: VITE_SUPABASE_PROJECT_ID
Value: fyikfsasudgzsjmumdlw
```

### Passo 4.3: Verificar configurações de Build
1. **Build Command**: `npm run build`
2. **Output Directory**: `dist`
3. **Install Command**: deixe padrão (`npm install`)

### Verificação:
- Você deve ter 3 variáveis de ambiente listadas
- As configurações de build devem estar como acima

---

## 6. ETAPA 5: Fazer o Deploy

### Passo 5.1: Iniciar deploy
1. Agora sim, clique no botão **"Deploy"**
2. A Vercel vai começar o processo de build

### Passo 5.2: Acompanhar o build
1. Você será levado para a página de deployment
2. Verá logs em tempo real do processo
3. O build leva aproximadamente **2-5 minutos**

### Passo 5.3: Verificar sucesso
1. Se tudo der certo, você verá uma mensagem verde: **"Ready"**
2. A Vercel vai gerar uma URL temporária, algo como:
   - `https://pro-moisesmedeiros-abc123.vercel.app`
3. Clique nessa URL para ver seu site funcionando!

### Se houver erro:
- Anote a mensagem de erro
- Os erros mais comuns são variáveis de ambiente incorretas
- Volte e verifique se digitou tudo corretamente

---

## 7. ETAPA 6: Configurar Domínio Customizado

### Passo 6.1: Acessar configurações de domínio
1. No Dashboard do projeto na Vercel
2. Clique na aba **"Settings"** (Configurações)
3. No menu lateral, clique em **"Domains"**

### Passo 6.2: Adicionar domínio
1. No campo "Domain", digite: `pro.moisesmedeiros.com.br`
2. Clique em **"Add"**

### Passo 6.3: Anotar informações de DNS
A Vercel vai mostrar instruções de DNS. Anote:
- **Type**: CNAME
- **Name**: pro
- **Value**: `cname.vercel-dns.com` (ou similar)

Mantenha essa página aberta, você vai precisar dessas informações!

---

## 8. ETAPA 7: Atualizar DNS no Cloudflare

### Passo 7.1: Acessar Cloudflare
1. Abra: https://dash.cloudflare.com
2. Faça login
3. Clique no domínio `moisesmedeiros.com.br`

### Passo 7.2: Acessar DNS
1. No menu lateral, clique em **"DNS"**
2. Clique em **"Records"**

### Passo 7.3: Encontrar registro atual do "pro"
1. Procure na lista por um registro que tenha:
   - **Name**: `pro`
   - **Type**: A ou CNAME
2. Esse é o registro que aponta para o Lovable

### Passo 7.4: Editar o registro
1. Clique no registro "pro" para editá-lo
2. Altere os campos:
   - **Type**: CNAME
   - **Name**: pro
   - **Target**: `cname.vercel-dns.com`
   - **Proxy status**: ⚠️ **DNS only** (nuvem CINZA, não laranja!)
3. Clique em **"Save"**

### ⚠️ IMPORTANTE: Proxy Status
- A nuvem deve estar **CINZA** (DNS only)
- Se estiver laranja (Proxied), clique para desativar
- A Vercel precisa controlar o SSL

### Passo 7.5: Aguardar propagação
- A mudança pode levar de **5 minutos a 1 hora** para propagar
- Você pode verificar em: https://dnschecker.org

---

## 9. ETAPA 8: Validação Final

### Checklist de Validação:

#### 8.1: Acesso ao Site
- [ ] Acesse `https://pro.moisesmedeiros.com.br`
- [ ] O site deve carregar normalmente
- [ ] Verifique se o certificado SSL está funcionando (cadeado verde)

#### 8.2: Login
- [ ] Acesse `/auth`
- [ ] Faça login com sua conta owner (moisesblank@gmail.com)
- [ ] Verifique se o login funciona

#### 8.3: Dashboard
- [ ] Após login, você deve ser redirecionado corretamente
- [ ] Navegue pelo dashboard
- [ ] Verifique se os dados carregam

#### 8.4: Funcionalidades Críticas
- [ ] Acesse `/gestaofc` - deve funcionar
- [ ] Acesse `/alunos` - deve funcionar
- [ ] Teste criar/editar um registro
- [ ] Verifique se as notificações funcionam

#### 8.5: Edge Functions
- [ ] Faça uma ação que use Edge Function (ex: criar aluno)
- [ ] Verifique nos logs do Lovable Cloud se a função foi executada

---

## 10. MANUTENÇÃO FUTURA

### Como fazer alterações no código:

#### Opção A: Via VS Code (Recomendado)
1. Clone o repositório localmente:
   ```bash
   git clone https://github.com/SEU_USUARIO/pro-moisesmedeiros.git
   cd pro-moisesmedeiros
   npm install
   ```

2. Faça suas alterações nos arquivos

3. Envie para o GitHub:
   ```bash
   git add .
   git commit -m "Descrição da mudança"
   git push
   ```

4. A Vercel detecta automaticamente e faz um novo deploy!

#### Opção B: Editar direto no GitHub
1. Acesse o repositório no GitHub
2. Navegue até o arquivo que quer editar
3. Clique no ícone de lápis (Edit)
4. Faça a alteração
5. Clique em "Commit changes"
6. A Vercel faz deploy automaticamente

### Edge Functions (Backend):
- As Edge Functions continuam sendo gerenciadas pelo Lovable
- Você pode continuar editando-as no Lovable
- Elas são deployadas automaticamente
- O frontend na Vercel vai chamá-las normalmente

### Monitoramento:
- **Vercel Dashboard**: Veja logs de deploy e erros
- **Lovable Cloud**: Veja logs de Edge Functions e banco de dados

---

## 11. COMO REVERTER (SE NECESSÁRIO)

Se precisar voltar para o Lovable:

### Passo 11.1: Voltar DNS no Cloudflare
1. Acesse Cloudflare → DNS
2. Edite o registro "pro"
3. Altere para:
   - **Type**: A
   - **Name**: pro
   - **IPv4 address**: `185.158.133.1` (IP do Lovable)
   - **Proxy status**: DNS only (cinza)
4. Salve

### Passo 11.2: Aguardar propagação
- A mudança leva de 5 minutos a 1 hora

### Passo 11.3: Verificar
- Acesse `https://pro.moisesmedeiros.com.br`
- Deve voltar a funcionar via Lovable

---

## 📞 SUPORTE

### Se tiver problemas:

1. **Erro de build na Vercel**:
   - Verifique as variáveis de ambiente
   - Veja os logs de build detalhados

2. **Site não carrega após DNS**:
   - Aguarde mais tempo (propagação)
   - Verifique se o proxy está desativado (cinza)

3. **Login não funciona**:
   - Verifique se as variáveis VITE_SUPABASE_* estão corretas
   - Limpe cache do navegador

4. **Edge Functions não funcionam**:
   - As funções precisam estar deployadas no Lovable
   - Verifique os logs no Lovable Cloud

---

## 📊 RESUMO DOS VALORES

### Variáveis de Ambiente (copie exatamente):

```env
VITE_SUPABASE_URL=https://fyikfsasudgzsjmumdlw.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5aWtmc2FzdWRnenNqbXVtZGx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MzUwMTEsImV4cCI6MjA4MTMxMTAxMX0.qSVRCgEX6L0cLZoDebzOIvTGhDeZi0Rl45SsDVZthIs
VITE_SUPABASE_PROJECT_ID=fyikfsasudgzsjmumdlw
```

### DNS (para Cloudflare):
```
Type: CNAME
Name: pro
Target: cname.vercel-dns.com
Proxy: OFF (nuvem cinza)
```

---

**✅ DOCUMENTO PRONTO PARA EXECUÇÃO**

Última atualização: 2026-01-16
Autor: Lovable AI
