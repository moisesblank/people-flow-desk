# 🚀 GUIA COMPLETO DE MIGRAÇÃO PARA VERCEL — VERSÃO DEFINITIVA

**O que vamos fazer?** Mover seu site para outro servidor porque o atual (Lovable) está travado.  
**Tempo:** 45-60 minutos (sem pressa!)  
**Dificuldade:** Fácil (só clicar e copiar/colar)  
**Custo:** GRÁTIS (plano Hobby da Vercel)  
**Versão do código:** 17 de Janeiro de 2026 (a mais recente!)  

---

# 📌 ANTES DE COMEÇAR

## O que você PRECISA ter:

| Item | Onde conseguir | Status |
|------|----------------|--------|
| Email/senha do GitHub | Mesmo usado no Lovable | [ ] Tenho |
| Acesso ao Cloudflare | dash.cloudflare.com | [ ] Tenho |
| Este guia aberto | Outra aba do navegador | [ ] OK |
| 45-60 minutos livres | Sem interrupções | [ ] OK |

## O que NÃO vai mudar (fica tudo igual):

- ✅ Banco de dados (todos os alunos, questões, etc.)
- ✅ Logins e senhas dos usuários
- ✅ Arquivos, PDFs e uploads
- ✅ QR Codes funcionando
- ✅ Sistema de segurança
- ✅ Funções do backend (Edge Functions)
- ✅ Pagamentos e integrações
- ✅ Histórico de tudo

---

# PASSO 0 — VERIFICAR SE O GITHUB ESTÁ ATUALIZADO

## ⚠️ ISSO É CRÍTICO! Não pule!

A Vercel vai pegar o código do GitHub. Precisamos garantir que é a versão mais recente.

## 0.1 Abrir o Lovable

Acesse seu projeto no Lovable (onde você está agora).

## 0.2 Clicar no botão GitHub

No canto superior direito, procure o botão:

```
🐙 GitHub
```

Clique nele.

## 0.3 Verificar status

Deve aparecer algo como:

```
✅ Connected to GitHub
Repository: [nome-do-seu-repo]
Last synced: [data/hora]
```

## 0.4 Clicar em "View on GitHub"

Isso vai abrir o GitHub no navegador.

## 0.5 Verificar a data do último commit

No GitHub, olhe na parte de cima onde mostra os arquivos. Deve aparecer:

```
Latest commit: [hash] · [data]
```

**A data deve ser de 17 de Janeiro de 2026** (ou a mais recente que você fez).

## 0.6 Se NÃO estiver atualizado

Volte ao Lovable e:
1. Vá em Settings → GitHub
2. Procure "Force Push" ou "Sync Now"
3. Clique e aguarde
4. Verifique novamente no GitHub

---

# PASSO 1 — CRIAR CONTA NA VERCEL

## 1.1 Abrir o site da Vercel

👉 **Acesse:** https://vercel.com

## 1.2 Clicar em "Sign Up" ou "Start Deploying"

Na página inicial, clique em um desses botões:

```
[ Start Deploying ]   ou   [ Sign Up ]
```

## 1.3 IMPORTANTE: Escolher "Continue with GitHub"

Você vai ver várias opções de login. **CLIQUE EM:**

```
🐙 Continue with GitHub
```

> ⚠️ **USE O MESMO GITHUB DO LOVABLE!** Isso é obrigatório para ver seu projeto.

## 1.4 Autorizar a Vercel no GitHub

O GitHub vai pedir permissão. Clique em:

```
[ Authorize Vercel ]
```

## 1.5 Selecionar escopo (se pedir)

Se perguntar sobre "scope" ou acesso, selecione:
- **All repositories** (recomendado)
- Ou pelo menos o repositório do seu projeto

## 1.6 Confirmar email (se pedir)

A Vercel pode pedir para confirmar seu email. Verifique sua caixa de entrada.

## 1.7 Pronto!

Você agora está no Dashboard (painel de controle) da Vercel.

---

# PASSO 2 — IMPORTAR SEU PROJETO

## 2.1 Clicar em "Add New"

No dashboard da Vercel, procure:

```
[ Add New... ] → [ Project ]
```

Ou pode aparecer como:

```
[ + New Project ]   ou   [ Import Project ]
```

## 2.2 Dar permissão (se pedir)

Se a Vercel pedir para instalar no GitHub:
1. Clique em "Install"
2. Selecione "All repositories" ou o repositório específico
3. Confirme

## 2.3 Encontrar seu repositório

Vai aparecer uma lista dos seus projetos do GitHub.

**Procure pelo nome do seu projeto.** Pode ser algo como:
- O nome que aparece no Lovable
- Algo com "lovable" no nome
- O repositório que você verificou no Passo 0

## 2.4 Clicar em "Import"

Ao lado do projeto correto, clique em:

```
[ Import ]
```

---

# PASSO 3 — CONFIGURAR O BUILD

## 3.1 Tela de Configuração

Vai aparecer uma tela com várias opções. Vamos configurar cada uma:

## 3.2 Project Name (Nome do Projeto)

Deixe como está ou mude para algo que você reconheça.
Exemplo: `pro-moisesmedeiros`

## 3.3 Framework Preset

Procure o campo:

```
Framework Preset: [  ▼  ]
```

**Clique e selecione:** `Vite`

> 💡 A Vercel geralmente detecta automaticamente. Só confirme que está "Vite".

## 3.4 Root Directory

```
Root Directory: ./
```

**Deixe vazio ou com `.` (ponto)**

## 3.5 Build and Output Settings

Clique para expandir se necessário:

```
▼ Build and Output Settings
```

Confirme que está assim:

| Campo | Valor |
|-------|-------|
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

## 3.6 AINDA NÃO CLIQUE EM DEPLOY!

Falta configurar as variáveis de ambiente (próximo passo).

---

# PASSO 4 — VARIÁVEIS DE AMBIENTE ⚠️ CRÍTICO!

## ⚠️ SEM ISSO O SITE NÃO FUNCIONA!

As variáveis conectam seu site ao banco de dados. Sem elas = tela branca.

## 4.1 Expandir "Environment Variables"

Na mesma tela de configuração, procure:

```
▼ Environment Variables
```

**Clique para expandir.**

## 4.2 Adicionar a PRIMEIRA variável

Você vai ver dois campos: "Name" e "Value"

**No campo "Name" (Nome):** Cole isso:
```
VITE_SUPABASE_URL
```

**No campo "Value" (Valor):** Cole isso:
```
https://fyikfsasudgzsjmumdlw.supabase.co
```

Clique em **[ Add ]**

## 4.3 Adicionar a SEGUNDA variável

**No campo "Name":** Cole isso:
```
VITE_SUPABASE_PUBLISHABLE_KEY
```

**No campo "Value":** Cole TUDO isso (é grande, copie inteiro!):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5aWtmc2FzdWRnenNqbXVtZGx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MzUwMTEsImV4cCI6MjA4MTMxMTAxMX0.qSVRCgEX6L0cLZoDebzOIvTGhDeZi0Rl45SsDVZthIs
```

Clique em **[ Add ]**

## 4.4 Adicionar a TERCEIRA variável

**No campo "Name":** Cole isso:
```
VITE_SUPABASE_PROJECT_ID
```

**No campo "Value":** Cole isso:
```
fyikfsasudgzsjmumdlw
```

Clique em **[ Add ]**

## 4.5 Verificar as 3 variáveis

Confirme que aparecem as 3:

```
✅ VITE_SUPABASE_URL = https://fyikfsasudgzsjmumdlw.supabase.co
✅ VITE_SUPABASE_PUBLISHABLE_KEY = eyJhbGci... (texto grande)
✅ VITE_SUPABASE_PROJECT_ID = fyikfsasudgzsjmumdlw
```

---

# PASSO 5 — FAZER O DEPLOY

## 5.1 Clicar em Deploy

Agora sim! Clique no botão grande:

```
[ Deploy ]
```

## 5.2 Aguardar o build

Vai aparecer uma tela com logs (textos correndo).

```
⏳ Building...
Installing dependencies...
Running build command...
```

**Espere de 3 a 8 minutos.** É normal demorar!

## 5.3 O que você vai ver

Várias linhas de texto vão aparecer. Ignore a maioria. Procure por:

✅ **Sucesso:**
```
✓ Compiled successfully
✓ Build completed
✓ Deployed to production
```

❌ **Erro (se acontecer):**
```
Error: ...
Build failed
```

## 5.4 Se der SUCESSO

Vai aparecer confetes 🎉 e uma prévia do seu site!

```
🎉 Congratulations!
Your project has been deployed.

https://seu-projeto.vercel.app
```

## 5.5 Se der ERRO

Vá para a seção "PROBLEMAS COMUNS" no final deste guia.

## 5.6 Testar a URL temporária

Clique na URL que a Vercel gerou (algo como `https://seu-projeto.vercel.app`)

Teste:
- [ ] A página inicial carrega?
- [ ] Consigo ver o formulário de login?

> 💡 Ainda não vai funcionar o login porque o domínio é diferente. Isso é normal!

---

# PASSO 6 — CONFIGURAR VERSÃO DO NODE.JS

## 6.1 Por que isso é importante?

Às vezes o build falha por versão errada do Node.js. Vamos garantir a correta.

## 6.2 Ir para Settings

No seu projeto na Vercel, clique em:

```
Settings (ícone de engrenagem ⚙️)
```

## 6.3 Ir para General

No menu lateral, clique em:

```
General
```

## 6.4 Encontrar Node.js Version

Role a página até encontrar:

```
Node.js Version
[  18.x  ▼  ]
```

## 6.5 Selecionar versão

Escolha **18.x** ou **20.x** (recomendado)

## 6.6 Salvar

Clique em **[ Save ]** se houver o botão.

---

# PASSO 7 — CRIAR ARQUIVO DE CONFIGURAÇÃO (vercel.json)

## 7.1 Por que isso é necessário?

Seu site é uma SPA (Single Page Application). Sem essa configuração, páginas como `/alunos/dashboard` podem dar erro 404.

## 7.2 Voltar ao Lovable

Volte para esta conversa no Lovable.

## 7.3 Me peça para criar o arquivo

Diga: **"Crie o vercel.json"**

Eu vou criar automaticamente e ele será sincronizado com o GitHub, que vai para a Vercel.

> 💡 Ou você pode criar manualmente no GitHub (mais complexo).

---

# PASSO 8 — ADICIONAR SEU DOMÍNIO NA VERCEL

## 8.1 Ir para Settings → Domains

No projeto da Vercel:

1. Clique em **Settings** (⚙️)
2. No menu lateral, clique em **Domains**

## 8.2 Adicionar o domínio principal

No campo de texto, digite:

```
pro.moisesmedeiros.com.br
```

Clique em **[ Add ]**

## 8.3 Adicionar o domínio www (TAMBÉM!)

Repita o processo com:

```
www.pro.moisesmedeiros.com.br
```

> 💡 Isso garante que funcione com ou sem "www"

## 8.4 A Vercel vai mostrar instruções

Vai aparecer algo como:

```
⚠️ Invalid Configuration

To configure your domain, add the following record to your DNS provider:

Type: CNAME
Name: pro
Value: cname.vercel-dns.com
```

**ANOTE ESSE VALOR!** (ou deixe essa aba aberta)

## 8.5 Escolha de configuração

A Vercel pode oferecer opções:
- **Recommended:** geralmente é a melhor
- Escolha CNAME se possível

---

# PASSO 9 — CONFIGURAR O CLOUDFLARE

## 9.1 Abrir o Cloudflare

👉 **Acesse:** https://dash.cloudflare.com

Faça login com sua conta.

## 9.2 Selecionar o domínio

Clique no seu domínio:

```
moisesmedeiros.com.br
```

## 9.3 Ir para DNS

No menu lateral esquerdo, clique em:

```
DNS → Records
```

## 9.4 Encontrar o registro atual do "pro"

Na lista de registros, procure a linha que tem:

```
Type: CNAME (ou A)
Name: pro
Content: [algo].lovable.app (ou algum IP)
```

## 9.5 Clicar para EDITAR

Clique no **lápis** (✏️) ou no texto **"Edit"** ao lado dessa linha.

**NÃO DELETE!** Apenas edite.

## 9.6 Mudar o valor de "Content"

| Campo | Valor ANTIGO | Valor NOVO |
|-------|--------------|------------|
| **Type** | (manter) | CNAME |
| **Name** | pro | pro (manter) |
| **Content** | `[algo].lovable.app` | `cname.vercel-dns.com` |

## 9.7 CRÍTICO: Mudar para DNS Only!

Procure o botão/switch de Proxy:

```
Proxy status: 🟠 Proxied
```

**CLIQUE para mudar para:**

```
Proxy status: ⚪ DNS only
```

A nuvem deve ficar **CINZA**, não laranja!

## 9.8 Por que "DNS Only"?

```
⚠️ IMPORTANTE: A Vercel gerencia seu próprio SSL/HTTPS.
   Se deixar "Proxied" (laranja), pode haver conflito de certificados.
   
   Depois que tudo funcionar, você pode tentar voltar para Proxied,
   mas comece SEMPRE com DNS Only.
```

## 9.9 TTL

Deixe como:

```
TTL: Auto
```

## 9.10 Salvar

Clique em:

```
[ Save ]
```

## 9.11 Verificar se existe registro www.pro

Se existir um registro para `www.pro`, edite também:

```
Type: CNAME
Name: www.pro
Content: cname.vercel-dns.com
Proxy: DNS only (cinza)
```

Se não existir, crie um novo com esses valores.

---

# PASSO 10 — AGUARDAR PROPAGAÇÃO DNS

## 10.1 Quanto tempo demora?

| Situação | Tempo |
|----------|-------|
| Sorte | 5 minutos |
| Normal | 15-30 minutos |
| Demorado | 1-2 horas |
| Raro (máximo) | 48 horas |

## 10.2 Como verificar se propagou?

### Opção A: Na Vercel

1. Vá em Settings → Domains
2. O status deve mudar de:
   - ⚠️ Invalid Configuration → ✅ Valid Configuration

### Opção B: Site de verificação

👉 Acesse: https://dnschecker.org

1. Digite: `pro.moisesmedeiros.com.br`
2. Clique em Search
3. Verifique se a maioria mostra `cname.vercel-dns.com`

### Opção C: Testar no navegador

1. Abra uma aba **anônima/privada** (Ctrl+Shift+N ou Cmd+Shift+N)
2. Acesse: `https://pro.moisesmedeiros.com.br`
3. Se carregar = propagou!

## 10.3 Se não propagou ainda

**ESPERE.** Não mude nada. Só aguarde mais tempo.

Fique verificando a cada 10-15 minutos.

---

# PASSO 11 — TESTAR TUDO

## 11.1 Checklist de Acesso

Abra uma aba anônima e teste cada um:

| Teste | O que fazer | Esperado | ✓ |
|-------|-------------|----------|---|
| Home | Acessar `https://pro.moisesmedeiros.com.br` | Página inicial carrega | [ ] |
| HTTPS | Verificar cadeado | 🔒 Aparece cadeado verde | [ ] |
| Login | Ir para `/auth` | Formulário de login aparece | [ ] |

## 11.2 Teste de Login (OWNER)

1. Acesse: `https://pro.moisesmedeiros.com.br/auth`
2. Faça login com: `moisesblank@gmail.com`
3. Senha: (sua senha)

| Teste | Esperado | ✓ |
|-------|----------|---|
| Login aceito | Não dá erro | [ ] |
| Redirecionamento | Vai para /gestaofc | [ ] |
| Dashboard carrega | Vê o painel de gestão | [ ] |

## 11.3 Teste de Navegação

Depois de logado, teste navegar:

| Página | Como acessar | ✓ |
|--------|--------------|---|
| Dashboard | Menu → Dashboard | [ ] |
| Alunos | Menu → Alunos | [ ] |
| Questões | Menu → Questões | [ ] |
| Configurações | Menu → Configurações | [ ] |

## 11.4 Teste de Dados

| Teste | Esperado | ✓ |
|-------|----------|---|
| Lista de alunos | Aparece os alunos cadastrados | [ ] |
| Lista de questões | Aparece as questões | [ ] |
| Uploads | Consegue fazer upload | [ ] |

## 11.5 Teste como Aluno (Beta)

1. Faça logout
2. Acesse: `https://pro.moisesmedeiros.com.br/auth`
3. Login com um aluno beta de teste
4. Verifique se vai para `/alunos/dashboard`

## 11.6 Teste de QR Codes

1. Como owner, vá para gestão de QR Codes
2. Verifique se os books aparecem
3. Teste abrir um PDF

---

# PASSO 12 — VERIFICAR EDGE FUNCTIONS

## 12.1 O que são Edge Functions?

São funções que rodam no servidor (backend). Elas continuam no Supabase/Lovable Cloud e **NÃO precisam de mudança!**

## 12.2 Como verificar se estão funcionando?

| Função | Como testar | ✓ |
|--------|-------------|---|
| Login | Consegue fazer login | [ ] |
| Criar aluno | Consegue criar novo aluno | [ ] |
| Upload | Consegue fazer upload de arquivo | [ ] |
| Email | Sistema envia emails | [ ] |

## 12.3 Se alguma Edge Function não funcionar

O problema NÃO é a migração. Pode ser:
- Timeout do Lovable (já estava acontecendo)
- Configuração específica

Me avise qual função não está funcionando.

---

# PASSO 13 — CONFIGURAÇÕES EXTRAS (RECOMENDADO)

## 13.1 Configurar Redirects (www para sem www)

Na Vercel, você pode configurar para `www.pro` redirecionar para `pro`:

1. Settings → Domains
2. Clique no domínio www
3. Configure como redirect para o principal

## 13.2 Verificar Preview Deployments

Cada push no GitHub cria uma preview. Você pode desativar se quiser:

1. Settings → Git
2. Ignored Build Step (se quiser ignorar alguns branches)

## 13.3 Configurar notificações

1. Settings → Notifications
2. Configure para receber email em caso de falha de deploy

---

# PASSO 14 — O QUE ACONTECE AGORA?

## 14.1 Atualizações futuras

Quando você fizer mudanças no Lovable:

```
Você edita no Lovable
        ↓
Lovable sincroniza com GitHub
        ↓
Vercel detecta o push no GitHub
        ↓
Vercel faz deploy automático (2-3 min)
        ↓
Site atualizado!
```

## 14.2 Você NÃO precisa

- ❌ Ir na Vercel para fazer deploy manual
- ❌ Fazer nada no Cloudflare
- ❌ Configurar nada novamente

## 14.3 Você PODE (opcional)

- Ver logs de deploy na Vercel
- Ver analytics na Vercel
- Ver erros em tempo real

---

# ❓ PROBLEMAS COMUNS E SOLUÇÕES

## PROBLEMA: Build Failed (Falhou)

### Possível causa 1: Variáveis de ambiente

**Verificar:**
1. Settings → Environment Variables
2. Confirme as 3 variáveis estão lá
3. Verifique se não tem espaço extra no início/fim

**Solução:**
1. Delete e adicione novamente as variáveis
2. Clique em "Redeploy" → "Redeploy with existing Build Cache" = NÃO

### Possível causa 2: Versão do Node.js

**Solução:**
1. Settings → General → Node.js Version
2. Mude para 18.x ou 20.x
3. Redeploy

### Possível causa 3: Código com erro

**Verificar:**
1. Veja os logs do build na Vercel
2. Procure por "Error:" ou "Failed"
3. Me envie o erro exato

---

## PROBLEMA: Site não abre (timeout ou erro)

### Possível causa: DNS não propagou

**Solução:**
1. Espere 30 minutos a 2 horas
2. Teste em aba anônima
3. Verifique no dnschecker.org

### Possível causa: Cloudflare está Proxied

**Solução:**
1. Cloudflare → DNS
2. Edite o registro "pro"
3. Mude para DNS Only (nuvem cinza)
4. Aguarde 5-10 minutos

---

## PROBLEMA: Login não funciona

### Possível causa 1: Variáveis de ambiente erradas

**Verificar:**
1. A URL do Supabase está EXATAMENTE assim?
   `https://fyikfsasudgzsjmumdlw.supabase.co`
2. Não tem espaço extra?
3. A key está completa (texto grande)?

### Possível causa 2: Domínio não autorizado no Supabase

O Supabase pode bloquear requisições de domínios não autorizados.

**Isso geralmente não é problema** porque a URL da Vercel (seu-projeto.vercel.app) é diferente do domínio final.

Se persistir, me avise.

---

## PROBLEMA: Página dá 404 (Not Found)

### Causa: Configuração de SPA faltando

**Solução:**
Peça para eu criar o arquivo `vercel.json` com a configuração correta.

---

## PROBLEMA: HTTPS não funciona (sem cadeado)

### Possível causa: SSL ainda sendo provisionado

**Solução:**
1. Aguarde 10-30 minutos
2. A Vercel provisiona SSL automaticamente
3. Verifique em Settings → Domains se mostra "SSL Certificate: Valid"

### Possível causa: Cloudflare com SSL conflitante

**Solução:**
1. No Cloudflare, verifique SSL/TLS settings
2. Se estiver "Full (strict)", mude para "Full"
3. Ou mantenha DNS Only até resolver

---

## PROBLEMA: Preciso voltar para o Lovable

### Passos de Rollback:

1. **Cloudflare → DNS → Records**
2. Edite o registro `pro`
3. Mude Content para: `people-flow-desk.lovable.app`
4. Mude Proxy para: Proxied (nuvem laranja)
5. Salve e aguarde 5-10 minutos

---

# 📋 RESUMO MEGA-RÁPIDO (Referência)

```
0. GitHub atualizado? (verificar data do commit)
1. vercel.com → Sign Up com GitHub (MESMO do Lovable)
2. Add New → Project → Import seu repositório
3. Framework: Vite
4. Adicionar 3 variáveis de ambiente
5. Deploy (esperar 3-8 min)
6. Settings → Node.js Version → 18.x ou 20.x
7. Settings → Domains → Adicionar pro.moisesmedeiros.com.br
8. Cloudflare → DNS → Editar registro pro
9. Content: cname.vercel-dns.com
10. Proxy: DNS Only (CINZA!)
11. Aguardar 15-30 min
12. Testar tudo
13. ✅ PRONTO!
```

---

# 📞 VALORES PARA COPIAR/COLAR

## Variáveis de Ambiente:

```
VARIÁVEL 1:
Nome:  VITE_SUPABASE_URL
Valor: https://fyikfsasudgzsjmumdlw.supabase.co
```

```
VARIÁVEL 2:
Nome:  VITE_SUPABASE_PUBLISHABLE_KEY
Valor: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5aWtmc2FzdWRnenNqbXVtZGx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MzUwMTEsImV4cCI6MjA4MTMxMTAxMX0.qSVRCgEX6L0cLZoDebzOIvTGhDeZi0Rl45SsDVZthIs
```

```
VARIÁVEL 3:
Nome:  VITE_SUPABASE_PROJECT_ID
Valor: fyikfsasudgzsjmumdlw
```

## DNS Cloudflare:

```
Type:    CNAME
Name:    pro
Content: cname.vercel-dns.com
Proxy:   DNS only (nuvem cinza ⚪)
TTL:     Auto
```

## URL para teste:

```
https://pro.moisesmedeiros.com.br
```

## Rollback (se precisar voltar):

```
Type:    CNAME
Name:    pro
Content: people-flow-desk.lovable.app
Proxy:   Proxied (nuvem laranja 🟠)
```

---

# ⏰ TIMELINE ESTIMADA

| Etapa | Tempo |
|-------|-------|
| Verificar GitHub | 5 min |
| Criar conta Vercel | 3 min |
| Importar projeto | 2 min |
| Configurar build | 5 min |
| Adicionar variáveis | 5 min |
| Deploy inicial | 3-8 min |
| Configurar Node.js | 2 min |
| Adicionar domínio | 3 min |
| Configurar Cloudflare | 5 min |
| Propagação DNS | 15-30 min |
| Testes | 10 min |
| **TOTAL** | **~60 min** |

---

# ✅ CHECKLIST FINAL

Marque cada item conforme completar:

## Configuração

- [ ] GitHub verificado e atualizado
- [ ] Conta Vercel criada
- [ ] Projeto importado
- [ ] Framework Vite selecionado
- [ ] 3 variáveis de ambiente adicionadas
- [ ] Deploy bem-sucedido
- [ ] Node.js versão 18.x ou 20.x
- [ ] Domínio adicionado na Vercel
- [ ] Cloudflare DNS atualizado
- [ ] Proxy status = DNS Only

## Funcionamento

- [ ] Site abre no domínio final
- [ ] HTTPS funcionando (cadeado verde)
- [ ] Login owner funciona
- [ ] Dashboard carrega
- [ ] Dados aparecem
- [ ] Navegação funciona
- [ ] Login aluno funciona
- [ ] QR Codes funcionam
- [ ] PDFs abrem

---

**SE TUDO PASSOU: PARABÉNS! 🎉 MIGRAÇÃO CONCLUÍDA!**

---

**Documento criado em:** 2026-01-17  
**Versão:** 2.0.0 (Completa para Leigos)  
**Status:** DEFINITIVO
