# 🚀 GUIA DE MIGRAÇÃO PARA VERCEL — VERSÃO PARA LEIGOS

**O que vamos fazer?** Mover seu site para outro servidor porque o atual (Lovable) está travado.  
**Tempo:** 30-45 minutos  
**Dificuldade:** Fácil (só clicar e copiar/colar)  
**Custo:** GRÁTIS  

---

## 📌 O QUE VOCÊ PRECISA TER EM MÃOS

1. ✅ Seu email e senha do **GitHub** (mesmo usado no Lovable)
2. ✅ Acesso ao **Cloudflare** (onde o domínio moisesmedeiros.com.br está)
3. ✅ Este guia aberto em outra aba

---

# PASSO 1 — CRIAR CONTA NA VERCEL

## 1.1 Abrir o site da Vercel

👉 **Clique aqui:** https://vercel.com

## 1.2 Clicar para criar conta

Na página inicial da Vercel, procure e clique no botão:

```
[ Start Deploying ]  ou  [ Sign Up ]
```

## 1.3 Escolher "Continue with GitHub"

Você vai ver várias opções. **CLIQUE EM:**

```
🐙 Continue with GitHub
```

> ⚠️ **IMPORTANTE:** Use o MESMO GitHub que está conectado ao Lovable!

## 1.4 Autorizar a Vercel

O GitHub vai pedir permissão. Clique em:

```
[ Authorize Vercel ]
```

## 1.5 Pronto!

Você agora tem uma conta na Vercel. Vai aparecer o "Dashboard" (painel de controle).

---

# PASSO 2 — IMPORTAR SEU PROJETO

## 2.1 Clicar em "Add New Project"

No dashboard da Vercel, procure o botão:

```
[ Add New... ] → [ Project ]
```

Ou pode aparecer como:

```
[ + New Project ]
```

## 2.2 Encontrar seu repositório

Vai aparecer uma lista dos seus projetos do GitHub.

**Procure por um nome parecido com:**
- `lovable-project-...`
- Ou o nome do seu projeto

## 2.3 Clicar em "Import"

Ao lado do projeto correto, clique em:

```
[ Import ]
```

---

# PASSO 3 — CONFIGURAR O BUILD (COMPILAÇÃO)

## 3.1 Framework Preset

Na tela que aparecer, procure:

```
Framework Preset: [  ▼  ]
```

**Selecione:** `Vite`

## 3.2 Confirmar outras configurações

Verifique se está assim:

| Campo | O que colocar |
|-------|---------------|
| **Framework Preset** | Vite |
| **Root Directory** | Deixe vazio ou `.` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

> 💡 Geralmente a Vercel já detecta automaticamente. Só confirme!

---

# PASSO 4 — ADICIONAR VARIÁVEIS DE AMBIENTE ⚠️ CRÍTICO!

## 4.1 Expandir "Environment Variables"

Na mesma tela de configuração, procure:

```
▼ Environment Variables
```

**Clique para expandir.**

## 4.2 Adicionar a PRIMEIRA variável

**Campo "Name":** Cole isso:
```
VITE_SUPABASE_URL
```

**Campo "Value":** Cole isso:
```
https://fyikfsasudgzsjmumdlw.supabase.co
```

Clique em **[ Add ]**

## 4.3 Adicionar a SEGUNDA variável

**Campo "Name":** Cole isso:
```
VITE_SUPABASE_PUBLISHABLE_KEY
```

**Campo "Value":** Cole TUDO isso (é grande, não corte!):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5aWtmc2FzdWRnenNqbXVtZGx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MzUwMTEsImV4cCI6MjA4MTMxMTAxMX0.qSVRCgEX6L0cLZoDebzOIvTGhDeZi0Rl45SsDVZthIs
```

Clique em **[ Add ]**

## 4.4 Adicionar a TERCEIRA variável

**Campo "Name":** Cole isso:
```
VITE_SUPABASE_PROJECT_ID
```

**Campo "Value":** Cole isso:
```
fyikfsasudgzsjmumdlw
```

Clique em **[ Add ]**

## 4.5 Verificar as 3 variáveis

Confirme que aparecem:

```
✅ VITE_SUPABASE_URL
✅ VITE_SUPABASE_PUBLISHABLE_KEY  
✅ VITE_SUPABASE_PROJECT_ID
```

> ⚠️ **SEM ESSAS VARIÁVEIS O SITE NÃO VAI FUNCIONAR!**

---

# PASSO 5 — FAZER O DEPLOY (PUBLICAR)

## 5.1 Clicar em Deploy

Depois de configurar tudo, clique no botão grande:

```
[ Deploy ]
```

## 5.2 Aguardar o build

Vai aparecer uma tela com logs (textos correndo).

**Espere de 2 a 5 minutos.**

Você vai ver várias mensagens, é normal.

## 5.3 Sucesso!

Quando terminar, vai aparecer:

```
✅ Congratulations! Your project has been deployed.
```

Ou vai mostrar seu site com:

```
Status: Ready ✓
```

## 5.4 Testar a URL temporária

A Vercel vai dar um link tipo:

```
https://seu-projeto.vercel.app
```

**Clique nele!** Seu site deve aparecer.

> Se o login funcionar, está tudo certo até aqui!

---

# PASSO 6 — ADICIONAR SEU DOMÍNIO

## 6.1 Ir para Settings → Domains

No projeto da Vercel, clique em:

```
Settings → Domains
```

## 6.2 Adicionar o domínio

No campo que aparecer, digite:

```
pro.moisesmedeiros.com.br
```

Clique em **[ Add ]**

## 6.3 Anotar as instruções

A Vercel vai mostrar instruções de DNS. Vai aparecer algo como:

```
CNAME Record
Name: pro
Value: cname.vercel-dns.com
```

**Mantenha essa aba aberta!** Vamos usar no próximo passo.

---

# PASSO 7 — CONFIGURAR O CLOUDFLARE

## 7.1 Abrir o Cloudflare

👉 **Clique aqui:** https://dash.cloudflare.com

Faça login com sua conta.

## 7.2 Selecionar o domínio

Clique em:

```
moisesmedeiros.com.br
```

## 7.3 Ir para DNS

No menu lateral, clique em:

```
DNS → Records
```

## 7.4 Encontrar o registro "pro"

Na lista, procure a linha que tem:

```
Type: CNAME
Name: pro
Content: [algo].lovable.app
```

## 7.5 Editar o registro

Clique no **lápis** (✏️) ou **Edit** ao lado dessa linha.

## 7.6 Mudar os valores

**MUDE APENAS ESSES CAMPOS:**

| Campo | Valor ANTIGO | Valor NOVO |
|-------|--------------|------------|
| **Content** | `[algo].lovable.app` | `cname.vercel-dns.com` |
| **Proxy status** | Nuvem laranja (Proxied) | **Nuvem cinza (DNS only)** |

## 7.7 Mudar para DNS Only (IMPORTANTE!)

Procure o switch/botão da nuvem:

```
🟠 → Clique para ficar → ⚪
```

A nuvem deve ficar **CINZA**, não laranja.

## 7.8 Salvar

Clique em:

```
[ Save ]
```

---

# PASSO 8 — AGUARDAR E TESTAR

## 8.1 Aguardar propagação

As mudanças de DNS podem levar:
- **Mínimo:** 5 minutos
- **Normal:** 15-30 minutos  
- **Máximo raro:** até 48 horas

## 8.2 Verificar no Vercel

Volte para a Vercel e vá em:

```
Settings → Domains
```

O domínio `pro.moisesmedeiros.com.br` deve mostrar:

```
✅ Valid Configuration
```

Se ainda mostrar erro, aguarde mais alguns minutos.

## 8.3 Testar o site

Abra uma aba **anônima/privada** e acesse:

```
https://pro.moisesmedeiros.com.br
```

---

# PASSO 9 — CHECKLIST DE TESTES

## ✅ Teste cada item:

- [ ] **Site abre?** → A página inicial carrega
- [ ] **HTTPS funciona?** → Aparece cadeado verde 🔒
- [ ] **Login funciona?** → Consegue entrar com moisesblank@gmail.com
- [ ] **Gestão abre?** → Após login, /gestaofc carrega
- [ ] **Menu funciona?** → Consegue navegar entre páginas
- [ ] **Dados aparecem?** → Alunos, questões, etc. carregam

---

# 🎉 PARABÉNS! MIGRAÇÃO COMPLETA!

Se todos os testes passaram, seu site agora roda na Vercel!

## O que mudou?

```
ANTES:
[Usuário] → [Cloudflare] → [Lovable] → [Supabase]
                              ❌ (travado)

AGORA:
[Usuário] → [Cloudflare] → [Vercel] → [Supabase]
                             ✅ (funcionando!)
```

## O que NÃO mudou?

- ✅ Seu banco de dados (todos os dados)
- ✅ Usuários e logins
- ✅ Arquivos e uploads
- ✅ QR Codes funcionando
- ✅ PDFs e materiais

---

# ❓ SE ALGO DER ERRADO

## Problema: "Build Failed" (falhou)

**Solução:**
1. Vá em Settings → Environment Variables
2. Confirme que as 3 variáveis estão lá
3. Clique em "Redeploy" para tentar de novo

## Problema: Site não abre

**Solução:**
1. Espere 30 minutos (propagação DNS)
2. Teste em aba anônima
3. Verifique se o Cloudflare está em "DNS Only"

## Problema: Login não funciona

**Solução:**
1. Verifique as variáveis de ambiente
2. A URL do Supabase deve estar EXATAMENTE assim:
   `https://fyikfsasudgzsjmumdlw.supabase.co`

## Problema: Preciso voltar para o Lovable

**Solução de Rollback:**
1. Vá no Cloudflare → DNS
2. Edite o registro `pro`
3. Mude Content de volta para: `people-flow-desk.lovable.app`
4. Mude para Proxied (nuvem laranja)

---

# 📋 RESUMO ULTRA-RÁPIDO

```
1. vercel.com → Criar conta com GitHub
2. Import projeto do GitHub
3. Framework: Vite
4. Adicionar 3 variáveis de ambiente (COPIAR/COLAR)
5. Deploy
6. Adicionar domínio pro.moisesmedeiros.com.br
7. Cloudflare: mudar CNAME para cname.vercel-dns.com + DNS Only
8. Esperar 5-30 min
9. Testar
10. ✅ PRONTO!
```

---

# 📞 VALORES PARA COPIAR/COLAR

## Variáveis de Ambiente (guarde isso!):

**Variável 1:**
```
Nome: VITE_SUPABASE_URL
Valor: https://fyikfsasudgzsjmumdlw.supabase.co
```

**Variável 2:**
```
Nome: VITE_SUPABASE_PUBLISHABLE_KEY
Valor: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5aWtmc2FzdWRnenNqbXVtZGx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MzUwMTEsImV4cCI6MjA4MTMxMTAxMX0.qSVRCgEX6L0cLZoDebzOIvTGhDeZi0Rl45SsDVZthIs
```

**Variável 3:**
```
Nome: VITE_SUPABASE_PROJECT_ID
Valor: fyikfsasudgzsjmumdlw
```

## DNS Cloudflare:

```
Type: CNAME
Name: pro
Content: cname.vercel-dns.com
Proxy: DNS Only (nuvem cinza)
```

---

**Documento criado em:** 2026-01-17  
**Versão para leigos:** 1.0.0  
**Status:** PRONTO PARA SEGUIR!
