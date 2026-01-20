# 🚀 GUIA COMPLETO DE MIGRAÇÃO DNS
## Do Site Antigo para pro.moisesmedeiros.com.br (Vercel)

**Data:** Janeiro 2026  
**Nível:** Para leigos (explicado como se fosse para minha avó)  
**Tempo estimado:** 30 minutos  
**Resultado:** Seu site funcionando em pro.moisesmedeiros.com.br

---

## 📚 PRIMEIRO: ENTENDA O QUE É CADA COISA

### O que é DNS?
Imagine que a internet é uma cidade enorme. O DNS é como a lista telefônica dessa cidade.

- **Seu domínio** (`moisesmedeiros.com.br`) = Nome da sua casa
- **O servidor** (Vercel) = Endereço físico da sua casa (número da rua)
- **DNS** = A lista que diz "Casa do Moisés fica na Rua X, número Y"

Quando alguém digita `moisesmedeiros.com.br`, o DNS diz: "Ah, esse site mora lá na Vercel!"

---

### O que é Cloudflare?
O Cloudflare é como um **segurança na porta da sua casa**. Ele:
- Protege contra hackers (WAF)
- Bloqueia robôs maliciosos
- Acelera seu site (CDN)

Você paga o Cloudflare PRO, então tem segurança extra!

---

### O que significa "Nuvem Laranja" vs "Nuvem Cinza"?

| Nuvem | Nome Técnico | O que faz |
|-------|--------------|-----------|
| 🟠 **Laranja** | Proxied | O Cloudflare INTERCEPTA todo o tráfego antes de mandar pro servidor |
| ⚫ **Cinza** | DNS Only | O Cloudflare só aponta o caminho, não intercepta nada |

### Por que CINZA para Vercel?

```
PROBLEMA COM NUVEM LARANJA + VERCEL:

Visitante → Cloudflare (SSL) → Vercel (SSL) = 💥 CONFLITO!

Os dois tentam "proteger" ao mesmo tempo.
Resultado: Site quebra, loops infinitos, erros de SSL.
```

```
SOLUÇÃO COM NUVEM CINZA:

Visitante → Vercel (SSL) = ✅ FUNCIONA!

Só a Vercel cuida do SSL.
O Cloudflare só aponta o caminho.
```

### Mas e a proteção do Cloudflare?
**ÓTIMA NOTÍCIA:** Mesmo com nuvem cinza, você AINDA tem:
- ✅ Redirect Rules (redirecionamentos)
- ✅ Page Rules
- ✅ Proteção básica de DNS

O que você PERDE com nuvem cinza:
- ❌ WAF (firewall)
- ❌ Bot Fight Mode
- ❌ Cache do Cloudflare

**MAS** a Vercel tem sua própria proteção e CDN, então você não perde segurança real!

---

## 🗺️ MAPA DO QUE VAMOS FAZER

```
ANTES (site do programador):
├── moisesmedeiros.com.br     → Site antigo dele
├── www.moisesmedeiros.com.br → Site antigo dele
├── app.moisesmedeiros.com.br → Sistema antigo dele
└── pro.moisesmedeiros.com.br → Seu site novo (Vercel) ✅

DEPOIS (tudo seu):
├── moisesmedeiros.com.br     → REDIRECIONA para pro.
├── www.moisesmedeiros.com.br → REDIRECIONA para pro.
├── app.moisesmedeiros.com.br → REDIRECIONA para pro. (ou deletar)
└── pro.moisesmedeiros.com.br → Seu site novo (Vercel) ✅ PRINCIPAL
```

---

## 📋 CHECKLIST ANTES DE COMEÇAR

- [ ] Tenho acesso ao Cloudflare (email e senha)
- [ ] Tenho acesso à Vercel (email e senha)
- [ ] Sei que o site pode ficar fora do ar por alguns minutos durante a migração
- [ ] Estou em um computador (não celular)
- [ ] Tenho este guia aberto ao lado

---

## 🔧 PARTE 1: CONFIGURAR VERCEL (5 minutos)

### Passo 1.1 — Acessar a Vercel

1. Abra o navegador
2. Vá para: **https://vercel.com**
3. Clique em **"Log In"** (canto superior direito)
4. Entre com sua conta (provavelmente GitHub)

### Passo 1.2 — Encontrar seu projeto

1. Você verá uma lista de projetos
2. Clique no projeto do seu site (provavelmente algo como "pro-moisesmedeiros" ou similar)

### Passo 1.3 — Ir para configurações de domínio

1. Clique na aba **"Settings"** (Configurações) — fica no menu superior
2. No menu lateral esquerdo, clique em **"Domains"** (Domínios)

### Passo 1.4 — Adicionar os domínios

Você precisa adicionar DOIS domínios:

**Primeiro domínio (PRINCIPAL):**
1. No campo de texto, digite: `pro.moisesmedeiros.com.br`
2. Clique no botão **"Add"**
3. A Vercel vai mostrar instruções de DNS — **ANOTE ou TIRE PRINT**

**Segundo domínio (WWW):**
1. No campo de texto, digite: `www.moisesmedeiros.com.br`
2. Clique no botão **"Add"**
3. Vai aparecer uma opção: **"Redirect to pro.moisesmedeiros.com.br"**
4. **SELECIONE ESSA OPÇÃO** — assim quem digitar www vai para pro automaticamente

### Passo 1.5 — Verificar o que a Vercel pede

A Vercel vai mostrar algo assim:

```
Para configurar pro.moisesmedeiros.com.br:
Tipo: CNAME
Nome: pro
Valor: cname.vercel-dns.com
```

**GUARDE ESSA INFORMAÇÃO!** Você vai usar no Cloudflare.

---

## 🔧 PARTE 2: CONFIGURAR CLOUDFLARE (15 minutos)

### Passo 2.1 — Acessar o Cloudflare

1. Abra o navegador
2. Vá para: **https://dash.cloudflare.com**
3. Entre com email e senha

### Passo 2.2 — Selecionar o domínio

1. Você verá seus domínios listados
2. Clique em **moisesmedeiros.com.br**

### Passo 2.3 — Ir para DNS

1. No menu lateral esquerdo, clique em **"DNS"**
2. Depois clique em **"Records"** (Registros)

### Passo 2.4 — LIMPAR registros antigos (CUIDADO!)

Agora você verá uma lista de registros DNS. Pode ter muita coisa.

**ANTES DE DELETAR, TIRE UM PRINT DE TUDO!** (para backup)

Procure e **DELETE** estes registros se existirem:

| Tipo | Nome | Ação |
|------|------|------|
| A | pro | ❌ DELETAR (clique nos 3 pontinhos → Delete) |
| CNAME | pro | ❌ DELETAR |
| A | www | ❌ DELETAR |
| CNAME | www | ❌ DELETAR |
| A | app | ❌ DELETAR (se não precisar mais) |
| CNAME | app | ❌ DELETAR (se não precisar mais) |

**NÃO DELETE:**
- Registros MX (são do email)
- Registros TXT (são de verificação)
- O registro @ (raiz) — vamos modificar ele

### Passo 2.5 — CRIAR novos registros para Vercel

Clique no botão azul **"+ Add record"** (Adicionar registro)

**REGISTRO 1 — pro (seu site principal):**
```
Type (Tipo):     CNAME
Name (Nome):     pro
Target (Alvo):   cname.vercel-dns.com
Proxy status:    ⚫ DNS only (CLIQUE NA NUVEM ATÉ FICAR CINZA!)
TTL:             Auto
```
Clique em **"Save"**

**REGISTRO 2 — www (redirecionamento):**
```
Type (Tipo):     CNAME
Name (Nome):     www
Target (Alvo):   cname.vercel-dns.com
Proxy status:    ⚫ DNS only (NUVEM CINZA!)
TTL:             Auto
```
Clique em **"Save"**

### Passo 2.6 — Configurar redirecionamento do domínio raiz

Quando alguém digitar só `moisesmedeiros.com.br` (sem www ou pro), queremos que vá para `pro.moisesmedeiros.com.br`.

**Método 1: Usando Redirect Rules (RECOMENDADO)**

1. No menu lateral, clique em **"Rules"**
2. Clique em **"Redirect Rules"**
3. Clique em **"+ Create rule"**

Configure assim:
```
Rule name: Redirect raiz para pro
```

**When incoming requests match... (Se a requisição combinar com...):**
```
Field:    Hostname
Operator: equals
Value:    moisesmedeiros.com.br
```

**Then... (Então...):**
```
Type:           Dynamic
Expression:     concat("https://pro.moisesmedeiros.com.br", http.request.uri.path)
Status code:    301 (Permanent Redirect)
Preserve query: ✅ Sim
```

Clique em **"Deploy"**

### Passo 2.7 — Verificar SSL/TLS

1. No menu lateral, clique em **"SSL/TLS"**
2. Verifique se está em **"Full"** ou **"Full (strict)"**
3. Se estiver em "Flexible", **MUDE PARA "Full"**

---

## 🔧 PARTE 3: VERIFICAR NA VERCEL (5 minutos)

### Passo 3.1 — Voltar para Vercel

1. Vá para **https://vercel.com**
2. Entre no seu projeto
3. Vá em **Settings → Domains**

### Passo 3.2 — Verificar status

Você deve ver algo assim:

| Domínio | Status |
|---------|--------|
| pro.moisesmedeiros.com.br | ✅ Valid Configuration |
| www.moisesmedeiros.com.br | ✅ Valid Configuration |

**Se aparecer "Invalid Configuration":**
- Espere 5-10 minutos (DNS demora para propagar)
- Verifique se a nuvem está CINZA no Cloudflare
- Verifique se digitou `cname.vercel-dns.com` corretamente

---

## 🧪 PARTE 4: TESTAR TUDO (5 minutos)

### Teste 1 — Domínio principal
1. Abra uma **aba anônima** (Ctrl+Shift+N)
2. Digite: `https://pro.moisesmedeiros.com.br`
3. **Esperado:** Seu site abre normalmente ✅

### Teste 2 — WWW
1. Digite: `https://www.moisesmedeiros.com.br`
2. **Esperado:** Redireciona para pro. e abre o site ✅

### Teste 3 — Raiz
1. Digite: `https://moisesmedeiros.com.br`
2. **Esperado:** Redireciona para pro. e abre o site ✅

### Teste 4 — HTTP (sem S)
1. Digite: `http://moisesmedeiros.com.br` (sem o S)
2. **Esperado:** Redireciona para https://pro. automaticamente ✅

### Teste 5 — Verificar SSL
1. No seu site, clique no cadeado 🔒 na barra de endereço
2. **Esperado:** Certificado válido emitido pela "Let's Encrypt" ou "Vercel"

---

## 🔧 PARTE 5: E O APP.MOISESMEDEIROS.COM.BR?

Você tem duas opções:

### Opção A — Redirecionar para o novo site

Se os QR codes antigos apontam para `app.moisesmedeiros.com.br/aluno/modulos/?v=XXX`:

1. No Cloudflare, vá em **Rules → Redirect Rules**
2. Crie uma nova regra:

```
Rule name: Redirect app para pro

When: Hostname equals app.moisesmedeiros.com.br

Then: Dynamic redirect to:
concat("https://pro.moisesmedeiros.com.br/qr", http.request.uri.query)

Status: 301
```

### Opção B — Deletar completamente

Se não precisa mais do app:

1. No Cloudflare, vá em **DNS → Records**
2. Encontre qualquer registro com nome "app"
3. Delete todos

---

## ⚠️ PROBLEMAS COMUNS E SOLUÇÕES

### "Invalid Configuration" na Vercel
```
Causa: DNS ainda não propagou ou nuvem está laranja
Solução: 
1. Verifique se a nuvem está CINZA no Cloudflare
2. Espere 10-30 minutos
3. Limpe o cache do navegador (Ctrl+Shift+Del)
```

### "Too many redirects" (loop infinito)
```
Causa: Nuvem laranja + SSL duplo
Solução:
1. Mude a nuvem para CINZA no Cloudflare
2. Espere 5 minutos
3. Teste em aba anônima
```

### Site mostra página antiga
```
Causa: Cache do navegador ou DNS local
Solução:
1. Teste em aba anônima
2. Teste no celular (com WiFi desligado, só 4G)
3. Espere até 24 horas (em casos raros)
```

### "SSL Certificate Error"
```
Causa: Certificado ainda não foi emitido pela Vercel
Solução:
1. Verifique se a nuvem está CINZA
2. Espere até 1 hora (Vercel precisa emitir o certificado)
3. Verifique o status em Vercel → Settings → Domains
```

---

## 📊 RESUMO VISUAL FINAL

```
CLOUDFLARE (dash.cloudflare.com)
│
├── DNS Records:
│   ├── pro   → CNAME → cname.vercel-dns.com  → ⚫ CINZA
│   └── www   → CNAME → cname.vercel-dns.com  → ⚫ CINZA
│
├── Redirect Rules:
│   ├── moisesmedeiros.com.br → 301 → pro.moisesmedeiros.com.br
│   └── app.moisesmedeiros.com.br → 301 → pro.moisesmedeiros.com.br/qr
│
└── SSL/TLS: Full (strict)


VERCEL (vercel.com)
│
├── Domains:
│   ├── pro.moisesmedeiros.com.br  → ✅ Primary
│   └── www.moisesmedeiros.com.br  → ↪️ Redirect to pro.
│
└── SSL: Automatic (Let's Encrypt)


FLUXO DO VISITANTE:
┌──────────────────────────────────────────────────────────────┐
│ Visitante digita: moisesmedeiros.com.br                      │
│         ↓                                                     │
│ Cloudflare: "Ah, esse vai para pro!"                         │
│         ↓ (Redirect 301)                                      │
│ Visitante agora está em: pro.moisesmedeiros.com.br           │
│         ↓                                                     │
│ Cloudflare: "pro aponta para Vercel"                         │
│         ↓ (CNAME direto, sem proxy)                           │
│ Vercel: "Aqui está o site!" 🎉                                │
└──────────────────────────────────────────────────────────────┘
```

---

## ✅ CHECKLIST FINAL

Depois de fazer tudo, confirme:

- [ ] pro.moisesmedeiros.com.br abre o site ✅
- [ ] www.moisesmedeiros.com.br redireciona para pro ✅
- [ ] moisesmedeiros.com.br (raiz) redireciona para pro ✅
- [ ] Cadeado 🔒 aparece (SSL funcionando) ✅
- [ ] Não há loops de redirect ✅
- [ ] Login funciona normalmente ✅
- [ ] Nenhum erro no console do navegador ✅

---

## 🆘 PRECISA DE AJUDA?

Se algo der errado:

1. **Tire print do erro**
2. **Tire print das configurações do Cloudflare (DNS)**
3. **Tire print do status na Vercel (Domains)**
4. **Me envie tudo aqui no chat**

---

## 📝 HISTÓRICO DE MUDANÇAS

| Data | O que foi feito |
|------|-----------------|
| Hoje | Migração do site antigo para Vercel |
| | DNS configurado com nuvem cinza |
| | Redirects configurados |
| | SSL verificado |

---

**FIM DO GUIA**

Autoridade: SYNAPSE Ω  
Versão: 1.0.0  
Última atualização: Janeiro 2026
