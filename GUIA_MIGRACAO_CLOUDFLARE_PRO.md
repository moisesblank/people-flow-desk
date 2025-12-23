# 🚀 GUIA COMPLETO: Migração para Cloudflare Pro + Lovable

## Sua Arquitetura Final

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLOUDFLARE PRO (CDN/Proxy)                        │
│                    moisesmedeiros.com.br (domínio raiz)                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────┐
│  www.moisesmedeiros   │ │  pro.moisesmedeiros   │ │ gestao.moisesmedeiros │
│      .com.br          │ │       .com.br         │ │       .com.br         │
│                       │ │                       │ │                       │
│  REDIRECIONA para →   │ │   LOVABLE HOSTING     │ │   LOVABLE HOSTING     │
│  pro.moisesmedeiros   │ │   (Frontend React)    │ │   (Frontend React)    │
│      .com.br          │ │                       │ │                       │
└───────────────────────┘ └───────────────────────┘ └───────────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────┐
                    │         LOVABLE CLOUD               │
                    │    (Supabase - Backend Direto)      │
                    │  fyikfsasudgzsjmumdlw.supabase.co   │
                    │                                     │
                    │  ✅ Própria proteção DDoS           │
                    │  ✅ Próprio CDN global              │
                    │  ✅ NÃO passa pelo Cloudflare       │
                    └─────────────────────────────────────┘
```

---

## 📍 MAPA DE URLs DEFINITIVO

| Quem | URL | Validação | Descrição |
|------|-----|-----------|-----------|
| 🌐 Visitante | `moisesmedeiros.com.br` | Nenhuma | Redireciona → `pro.moisesmedeiros.com.br` |
| 🌐 Visitante | `www.moisesmedeiros.com.br` | Nenhuma | Redireciona → `pro.moisesmedeiros.com.br` |
| 🌐 Não Pagante | `pro.moisesmedeiros.com.br` | Cadastro gratuito | Área pública + `/comunidade` |
| 👨‍🎓 Aluno Beta | `pro.moisesmedeiros.com.br/alunos` | `role='beta'` | Área completa do aluno pagante |
| 👔 Funcionário | `gestao.moisesmedeiros.com.br/gestao` | `role='funcionario'` | Gestão administrativa |
| 👑 Owner | TODAS | `role='owner'` | `MOISESBLANK@GMAIL.COM` - Acesso total |

---

## 🔧 PASSO A PASSO NO CLOUDFLARE

### FASE 1: Configurar DNS (5 minutos)

No painel Cloudflare → **DNS** → **Records**

#### 1.1 Adicionar Registro A para `pro`
```
Tipo: A
Nome: pro
Endereço: 185.158.133.1
Proxy: ⚫ DESLIGADO (nuvem CINZA!)
TTL: Auto
```

#### 1.2 Adicionar Registro A para `gestao`
```
Tipo: A
Nome: gestao
Endereço: 185.158.133.1
Proxy: ⚫ DESLIGADO (nuvem CINZA!)
TTL: Auto
```

#### 1.3 Adicionar Registro TXT para verificação Lovable
```
Tipo: TXT
Nome: _lovable
Conteúdo: [código que o Lovable fornecer]
TTL: Auto
```

⚠️ **IMPORTANTE**: A nuvem DEVE estar CINZA (DNS only) para funcionar com Lovable!

---

### FASE 2: Configurar Domínios no Lovable (10 minutos)

1. No Lovable → Clique no nome do projeto → **Settings**
2. Vá em **Domains**
3. Clique **Connect Domain**

#### 2.1 Adicionar primeiro domínio:
```
pro.moisesmedeiros.com.br
```
- Copie o código de verificação TXT
- Adicione no Cloudflare (passo 1.3)
- Clique **Verify**

#### 2.2 Adicionar segundo domínio:
```
gestao.moisesmedeiros.com.br
```
- Mesmo processo

#### 2.3 Definir Primário:
- Marque `pro.moisesmedeiros.com.br` como **Primary**

---

### FASE 3: Criar Redirecionamentos no Cloudflare (5 minutos)

Vá em **Rules** → **Redirect Rules** → **Create rule**

#### 3.1 Regra: www → pro
```
Nome: Redirect www to pro
Se: (http.host eq "www.moisesmedeiros.com.br")
Então: Dynamic Redirect
  URL: https://pro.moisesmedeiros.com.br
  Status: 301 (Permanente)
  Preserve query string: ✅
```

#### 3.2 Regra: raiz → pro
```
Nome: Redirect root to pro
Se: (http.host eq "moisesmedeiros.com.br")
Então: Dynamic Redirect
  URL: https://pro.moisesmedeiros.com.br
  Status: 301 (Permanente)
  Preserve query string: ✅
```

---

### FASE 4: Configurar Speed no Cloudflare Pro (5 minutos)

Vá em **Speed** → **Optimization**

#### 4.1 Content Optimization
- [x] Auto Minify: JavaScript, CSS, HTML
- [x] Brotli: ON
- [x] Early Hints: ON
- [x] Rocket Loader: OFF (pode conflitar com React)

#### 4.2 Image Optimization (Pro Feature!)
- [x] Polish: Lossless
- [x] Mirage: ON (acelera mobile)
- [x] WebP: ON

---

### FASE 5: Configurar Cache (5 minutos)

Vá em **Caching** → **Configuration**

#### 5.1 Configurações Gerais
- Cache Level: Standard
- Browser Cache TTL: Respect Existing Headers
- Always Online: ON

#### 5.2 Cache Rules (Pro Feature!)
Vá em **Rules** → **Cache Rules** → **Create rule**

```
Nome: Cache Assets Long
Se: (http.request.uri.path contains "/assets/")
Então: 
  Cache eligibility: Eligible for cache
  Edge TTL: 1 year
  Browser TTL: 1 year
```

```
Nome: No Cache API
Se: (http.request.uri.path contains "/api/")
Então:
  Cache eligibility: Bypass cache
```

---

### FASE 6: Configurar Segurança WAF (10 minutos)

Vá em **Security** → **WAF**

#### 6.1 Managed Rules (Pro Feature!)
- [x] Cloudflare Managed Ruleset: ON
- [x] Cloudflare OWASP Core Ruleset: ON

#### 6.2 Rate Limiting (Pro Feature!)
Vá em **Security** → **WAF** → **Rate limiting rules**

```
Nome: Protect Login
Se: (http.request.uri.path contains "/auth")
Então: Block
Rate: 10 requests per 1 minute
```

```
Nome: Protect API
Se: (http.request.uri.path contains "/api/")
Então: Block
Rate: 100 requests per 1 minute
```

#### 6.3 Custom Rules
```
Nome: Block Bad Bots
Se: (cf.client.bot) and not (cf.verified_bot_category in {"search_engine"})
Então: Block
```

```
Nome: Protect Gestao Area
Se: (http.host eq "gestao.moisesmedeiros.com.br") and (cf.threat_score gt 30)
Então: Challenge
```

---

### FASE 7: SSL/TLS (2 minutos)

Vá em **SSL/TLS** → **Overview**

- Encryption mode: **Full (strict)**
- Always Use HTTPS: **ON**
- Automatic HTTPS Rewrites: **ON**
- Minimum TLS Version: **TLS 1.2**

---

## ✅ CHECKLIST FINAL

### DNS (Cloudflare)
- [ ] Registro A `pro` → 185.158.133.1 (nuvem CINZA)
- [ ] Registro A `gestao` → 185.158.133.1 (nuvem CINZA)
- [ ] Registro TXT `_lovable` → código de verificação

### Lovable
- [ ] Domínio `pro.moisesmedeiros.com.br` conectado
- [ ] Domínio `gestao.moisesmedeiros.com.br` conectado
- [ ] `pro` definido como Primary

### Cloudflare Rules
- [ ] Redirect www → pro
- [ ] Redirect raiz → pro

### Speed
- [ ] Auto Minify ativado
- [ ] Polish ativado
- [ ] Mirage ativado

### Security
- [ ] WAF Managed Rules ON
- [ ] Rate Limiting configurado
- [ ] SSL Full (strict)

---

## 🔄 ORDEM DE EXECUÇÃO (SEGURA)

1. **PRIMEIRO**: Configure DNS no Cloudflare (registros A + TXT)
2. **SEGUNDO**: Adicione domínios no Lovable e verifique
3. **TERCEIRO**: Aguarde propagação (5-15 minutos)
4. **QUARTO**: Configure redirecionamentos
5. **QUINTO**: Ative otimizações de Speed
6. **SEXTO**: Configure WAF e segurança

---

## ⚠️ O QUE NÃO FAZER

1. ❌ NÃO ative a nuvem LARANJA para os subdomínios pro/gestao
2. ❌ NÃO mexa nos registros do Supabase (backend é separado)
3. ❌ NÃO ative Rocket Loader (pode quebrar React)
4. ❌ NÃO mude o servidor antigo até tudo funcionar aqui

---

## 📞 SE ALGO DER ERRADO

1. Tire print da tela de DNS do Cloudflare
2. Tire print da tela de Domains do Lovable
3. Me envie aqui!

---

*Documento gerado para Curso Moisés Medeiros - Cloudflare Pro + Lovable*
