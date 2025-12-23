# ☁️🛡️ GUIA CLOUDFLARE PRO — CONFIGURAÇÃO NÍVEL PENTAGON 🛡️☁️
## MESTRE MOISÉS MEDEIROS — PROTEÇÃO DA NASA

---

## 📍 MAPA DE URLs DEFINITIVO

| Quem | URL | Validação |
|------|-----|-----------|
| 🌐 NÃO PAGANTE | `pro.moisesmedeiros.com.br/` + `/comunidade` | Cadastro gratuito |
| 👨‍🎓 ALUNO BETA | `pro.moisesmedeiros.com.br/alunos` | `role='beta'` |
| 👔 FUNCIONÁRIO | `gestao.moisesmedeiros.com.br/gestao` | `role='funcionario'` |
| 👑 OWNER | TODAS | `moisesblank@gmail.com` = MASTER |

---

# ⚡ PASSO A PASSO CLOUDFLARE PRO

## 1️⃣ CONFIGURAÇÃO DE SSL/TLS

**Caminho:** Cloudflare → SSL/TLS → Overview

1. Selecionar: **Full (strict)**
2. Ativar: **Always Use HTTPS**
3. Ativar: **Automatic HTTPS Rewrites**
4. Ativar: **TLS 1.3**

---

## 2️⃣ CONFIGURAÇÃO DO WAF

**Caminho:** Cloudflare → Security → WAF

### Managed Rules (225 regras):
1. Ativar: **Cloudflare Managed Ruleset**
2. Ativar: **Cloudflare OWASP Core Ruleset**
3. Sensibilidade: **High**
4. Action: **Challenge** (não Block direto)

### Custom Rules (usar 10 das 20):

#### REGRA 1: Bloquear SQL Injection
```
Expression: (http.request.uri.query contains "UNION" and http.request.uri.query contains "SELECT") or (http.request.uri.query contains "DROP" and http.request.uri.query contains "TABLE")
Action: Block
```

#### REGRA 2: Bloquear XSS
```
Expression: (http.request.uri.query contains "<script" or http.request.body.raw contains "<script" or http.request.uri.query contains "javascript:")
Action: Block
```

#### REGRA 3: Proteger Login
```
Expression: (http.request.uri.path contains "/login" and http.request.method eq "POST" and cf.threat_score gt 20)
Action: Managed Challenge
```

#### REGRA 4: Proteger API
```
Expression: (http.request.uri.path contains "/api/" and cf.bot_management.score lt 30 and not cf.bot_management.verified_bot)
Action: Managed Challenge
```

#### REGRA 5: Bloquear User Agents Suspeitos
```
Expression: (http.user_agent contains "curl" or http.user_agent contains "wget" or http.user_agent contains "python-requests") and not cf.bot_management.verified_bot
Action: Managed Challenge
```

#### REGRA 6: Proteger Conteúdo Premium
```
Expression: (http.request.uri.path contains "/video" or http.request.uri.path contains "/pdf" or http.request.uri.path contains "/livro") and cf.threat_score gt 10
Action: Managed Challenge
```

#### REGRA 7: Bloquear Path Traversal
```
Expression: (http.request.uri.path contains "../" or http.request.uri.query contains "../" or http.request.uri.query contains "..%2F")
Action: Block
```

#### REGRA 8: Proteger Webhooks
```
Expression: (http.request.uri.path contains "/webhook" and http.request.method eq "POST" and not any(http.request.headers["x-hotmart-hottok"][*] ne ""))
Action: Block
```

#### REGRA 9: Bloquear Threat Score Alto
```
Expression: (cf.threat_score gt 80)
Action: Block
```

#### REGRA 10: Rate Limit APIs
```
Expression: (http.request.uri.path contains "/functions/v1/" and cf.bot_management.score lt 50)
Action: Managed Challenge
```

---

## 3️⃣ BOT FIGHT MODE

**Caminho:** Cloudflare → Security → Bots

1. Ativar: **Bot Fight Mode**
2. Configurar: **Super Bot Fight Mode** (disponível no Pro)
   - Definitely automated: **Block**
   - Likely automated: **Managed Challenge**
   - Verified bots: **Allow**

---

## 4️⃣ RATE LIMITING

**Caminho:** Cloudflare → Security → WAF → Rate limiting rules

### Regra 1: Login
```
Expression: (http.request.uri.path eq "/login" and http.request.method eq "POST")
Rate: 5 requests per 1 minute
Action: Block for 10 minutes
```

### Regra 2: API Geral
```
Expression: (http.request.uri.path contains "/api/")
Rate: 100 requests per 1 minute
Action: Managed Challenge
```

### Regra 3: Signup
```
Expression: (http.request.uri.path eq "/signup" and http.request.method eq "POST")
Rate: 3 requests per 1 hour
Action: Block for 1 hour
```

---

## 5️⃣ PAGE RULES

**Caminho:** Cloudflare → Rules → Page Rules

### Regra 1: APIs - Bypass Cache
```
URL: *moisesmedeiros.com.br/api/*
Settings:
  - Cache Level: Bypass
  - Security Level: High
  - Browser Integrity Check: On
```

### Regra 2: Área de Alunos - Cache Agressivo
```
URL: *moisesmedeiros.com.br/alunos/*
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 hour
  - Browser Cache TTL: 1 hour
```

### Regra 3: Área de Gestão - Alta Segurança
```
URL: *moisesmedeiros.com.br/gestao/*
Settings:
  - Cache Level: Bypass
  - Security Level: High
  - Browser Integrity Check: On
```

### Regra 4: Vídeos - Sem Cache
```
URL: *moisesmedeiros.com.br/*.mp4
Settings:
  - Cache Level: Bypass
  - Security Level: High
```

### Regra 5: PDFs - Sem Cache
```
URL: *moisesmedeiros.com.br/*.pdf
Settings:
  - Cache Level: Bypass
  - Security Level: High
```

---

## 6️⃣ OTIMIZAÇÃO DE IMAGENS

**Caminho:** Cloudflare → Speed → Optimization → Image Optimization

1. Ativar: **Polish** (Lossless ou Lossy)
2. Ativar: **WebP conversion**
3. Ativar: **Mirage** (otimização para mobile)

---

## 7️⃣ FIREWALL SETTINGS

**Caminho:** Cloudflare → Security → Settings

1. **Security Level:** High
2. **Challenge Passage:** 30 minutes
3. **Browser Integrity Check:** On
4. **Privacy Pass Support:** On

---

## 8️⃣ DDOS PROTECTION

**Caminho:** Cloudflare → Security → DDoS

1. Ativar: **HTTP DDoS attack protection**
2. Sensitivity: **High**
3. Action: **Managed Challenge** ou **Block**

---

## 9️⃣ CACHE SETTINGS

**Caminho:** Cloudflare → Caching → Configuration

1. **Caching Level:** Standard
2. **Browser Cache TTL:** Respect Existing Headers
3. **Crawler Hints:** On
4. **Always Online:** On
5. **Development Mode:** Off (apenas para debug)

---

## 🔟 HEADERS DE SEGURANÇA (Transform Rules)

**Caminho:** Cloudflare → Rules → Transform Rules → Modify Response Header

Adicionar headers:

| Header | Value |
|--------|-------|
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `X-XSS-Protection` | `1; mode=block` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` |

---

# 📊 COMPARAÇÃO ANTES × DEPOIS

## ANTES (Sem Cloudflare Pro)

| Camada | Proteção | Status |
|--------|----------|--------|
| WAF | ❌ Não tinha | ❌ |
| Bot Protection | ❌ Não tinha | ❌ |
| DDoS | ⚠️ Básico | ⚠️ |
| Rate Limit | ⚠️ Só backend | ⚠️ |
| SSL | ✅ Let's Encrypt | ✅ |
| CDN | ❌ Não tinha | ❌ |
| Cache | ⚠️ Básico | ⚠️ |
| Otimização Imagens | ❌ Não tinha | ❌ |
| Threat Score | ❌ Não tinha | ❌ |
| Geo Blocking | ❌ Não tinha | ❌ |

## DEPOIS (Com Cloudflare Pro + Security Omega)

| Camada | Proteção | Status |
|--------|----------|--------|
| WAF | ✅ 225 regras + 10 custom | ✅✅✅ |
| Bot Protection | ✅ Super Bot Fight Mode | ✅✅✅ |
| DDoS | ✅ Enterprise-grade | ✅✅✅ |
| Rate Limit | ✅ Edge + Backend duplo | ✅✅✅ |
| SSL | ✅ Full (strict) + TLS 1.3 | ✅✅✅ |
| CDN | ✅ 300+ PoPs global | ✅✅✅ |
| Cache | ✅ Inteligente por rota | ✅✅✅ |
| Otimização Imagens | ✅ WebP + Polish + Mirage | ✅✅✅ |
| Threat Score | ✅ 0-100 em tempo real | ✅✅✅ |
| Geo Blocking | ✅ Por país/região | ✅✅✅ |

---

# 🛡️ ARQUITETURA DE SEGURANÇA COMPLETA

```
┌─────────────────────────────────────────────────────────────────┐
│                     🌐 USUÁRIO                                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│               ☁️ CLOUDFLARE PRO (EDGE)                         │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │   WAF    │  │   BOT    │  │  DDoS    │  │  RATE    │       │
│  │225 rules │  │  Fight   │  │ Shield   │  │  Limit   │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │   SSL    │  │   CDN    │  │  Image   │  │  Cache   │       │
│  │TLS 1.3   │  │ 300 PoPs │  │  Optim   │  │ Smart    │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                                                                 │
│  Headers: cf-ray, cf-connecting-ip, cf-bot-score, etc          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              🔥 SECURITY OMEGA (BACKEND)                        │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              SANCTUM GATE (Porteiro)                     │  │
│  │  • Valida cf-headers                                     │  │
│  │  • Rate limit duplo                                      │  │
│  │  • Progressive lockout                                   │  │
│  │  • Audit log                                             │  │
│  │  • OWNER BYPASS                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  AUTH    │  │ WEBHOOK  │  │ CONTENT  │  │   RLS    │       │
│  │  GUARD   │  │  GUARD   │  │  SHIELD  │  │Policies  │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              🗄️ SUPABASE (BANCO + STORAGE)                     │
│                                                                 │
│  • RLS em todas as tabelas                                     │
│  • Storage privado                                              │
│  • Audit log imutável                                          │
│  • Signed URLs curtos                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

# ✅ CHECKLIST DE CONFIGURAÇÃO

| # | Item | Status |
|---|------|--------|
| 1 | SSL Full (strict) | ⬜ |
| 2 | Always HTTPS | ⬜ |
| 3 | TLS 1.3 | ⬜ |
| 4 | WAF Managed Rules | ⬜ |
| 5 | 10 Custom WAF Rules | ⬜ |
| 6 | Bot Fight Mode | ⬜ |
| 7 | Rate Limiting (3 regras) | ⬜ |
| 8 | Page Rules (5 regras) | ⬜ |
| 9 | Image Optimization | ⬜ |
| 10 | Security Headers | ⬜ |
| 11 | DDoS Protection | ⬜ |
| 12 | Cache Configuration | ⬜ |

---

**PRONTO! ✅**

*Configuração Cloudflare Pro completa!*
*Prof. Moisés Medeiros*
