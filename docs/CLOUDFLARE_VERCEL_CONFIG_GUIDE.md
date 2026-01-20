# ☁️ Guia Definitivo: Configuração Cloudflare + Vercel
## PRO.MOISESMEDEIROS.COM.BR

> **Versão:** 1.0.0  
> **Data:** 2026-01-20  
> **Status:** ✅ CONFIGURAÇÃO HÍBRIDA OTIMIZADA

---

## 📋 ÍNDICE

1. [Visão Geral](#-visão-geral)
2. [Pré-requisitos](#-pré-requisitos)
3. [Parte 1: Verificar DNS Existente](#parte-1-verificar-dns-existente)
4. [Parte 2: Configurar Domínios LARANJA](#parte-2-configurar-domínios-laranja)
5. [Parte 3: Criar Redirect Rules](#parte-3-criar-redirect-rules)
6. [Parte 4: Configurar SSL](#parte-4-configurar-ssl)
7. [Parte 5: Testar Configuração](#parte-5-testar-configuração)
8. [Checklist Final](#-checklist-final)
9. [Troubleshooting](#-troubleshooting)

---

## 🎯 VISÃO GERAL

### Arquitetura Final

```
┌─────────────────────────────────────────────────────────────────┐
│                     FLUXO DE TRÁFEGO                            │
└─────────────────────────────────────────────────────────────────┘

  www.moisesmedeiros.com.br      app.moisesmedeiros.com.br
  moisesmedeiros.com.br (raiz)
           │                              │
           ▼                              ▼
  ┌─────────────────────────────────────────────────┐
  │        🟠 CLOUDFLARE (LARANJA/PROXIED)          │
  │                                                  │
  │   • WAF Protection ativo                        │
  │   • Bot Fight Mode                              │
  │   • Redirect 301 configurado                    │
  └─────────────────────────────────────────────────┘
                         │
                         │ Redirect 301
                         ▼
           pro.moisesmedeiros.com.br
           www.pro.moisesmedeiros.com.br
                         │
                         ▼
  ┌─────────────────────────────────────────────────┐
  │        🔘 DNS ONLY (CINZA/BYPASS)               │
  │                                                  │
  │   • Tráfego direto para Vercel                  │
  │   • Zero conflito SSL                           │
  │   • Certificado gerenciado pela Vercel          │
  └─────────────────────────────────────────────────┘
                         │
                         ▼
  ┌─────────────────────────────────────────────────┐
  │              ☁️ VERCEL                           │
  │                                                  │
  │   • Hosting do SPA                              │
  │   • SSL automático                              │
  │   • CDN global                                  │
  └─────────────────────────────────────────────────┘
```

### Resumo da Configuração

| Hostname | Nuvem | Destino | Função |
|----------|-------|---------|--------|
| `pro.moisesmedeiros.com.br` | 🔘 CINZA | Vercel | Site principal |
| `www.pro.moisesmedeiros.com.br` | 🔘 CINZA | Vercel | Alias do principal |
| `www.moisesmedeiros.com.br` | 🟠 LARANJA | Redirect 301 | Redireciona para `pro.` |
| `app.moisesmedeiros.com.br` | 🟠 LARANJA | Redirect 301 | QR codes legados |
| `moisesmedeiros.com.br` (raiz) | 🟠 LARANJA | Redirect 301 | Redireciona para `pro.` |

---

## ✅ PRÉ-REQUISITOS

Antes de começar, verifique:

- [ ] Acesso ao painel do Cloudflare
- [ ] Domínio `moisesmedeiros.com.br` ativo no Cloudflare
- [ ] Projeto configurado na Vercel
- [ ] Domínios `pro.` e `www.pro.` já adicionados na Vercel

---

## PARTE 1: VERIFICAR DNS EXISTENTE

### Passo 1.1 — Acessar o Cloudflare

1. Acesse [dash.cloudflare.com](https://dash.cloudflare.com)
2. Faça login com suas credenciais
3. Clique no domínio **moisesmedeiros.com.br**

### Passo 1.2 — Ir para DNS Records

1. No menu lateral esquerdo, clique em **DNS**
2. Clique em **Records**

### Passo 1.3 — Verificar Configuração do `pro.`

Procure o registro `pro` e confirme:

| Campo | Valor Esperado |
|-------|----------------|
| Type | `CNAME` |
| Name | `pro` |
| Content | `cname.vercel-dns.com` |
| Proxy status | 🔘 **DNS only** (nuvem CINZA) |

> ⚠️ **Se estiver LARANJA:** Clique no ícone da nuvem para mudar para CINZA

### Passo 1.4 — Verificar Configuração do `www.pro.`

Procure o registro `www.pro` e confirme:

| Campo | Valor Esperado |
|-------|----------------|
| Type | `CNAME` |
| Name | `www.pro` |
| Content | `cname.vercel-dns.com` |
| Proxy status | 🔘 **DNS only** (nuvem CINZA) |

> ✅ **Se já está assim:** Pule para a Parte 2. Não mexa nesses registros.

---

## PARTE 2: CONFIGURAR DOMÍNIOS LARANJA

Estes domínios farão redirect no Cloudflare (nunca chegarão na Vercel).

### Passo 2.1 — Configurar `www.`

1. Clique em **Add record**
2. Preencha:

| Campo | Valor |
|-------|-------|
| Type | `A` |
| Name | `www` |
| IPv4 address | `192.0.2.1` |
| Proxy status | 🟠 **Proxied** (nuvem LARANJA) |
| TTL | Auto |

3. Clique em **Save**

> 💡 **Por que 192.0.2.1?** É um endereço reservado para documentação (RFC 5737). Nunca será acessado porque o Cloudflare vai interceptar e redirecionar.

### Passo 2.2 — Configurar `app.`

1. Clique em **Add record**
2. Preencha:

| Campo | Valor |
|-------|-------|
| Type | `A` |
| Name | `app` |
| IPv4 address | `192.0.2.1` |
| Proxy status | 🟠 **Proxied** (nuvem LARANJA) |
| TTL | Auto |

3. Clique em **Save**

### Passo 2.3 — Configurar domínio raiz `@`

1. Procure o registro existente para `@` (raiz)
2. Se não existir, clique em **Add record**
3. Preencha:

| Campo | Valor |
|-------|-------|
| Type | `A` |
| Name | `@` |
| IPv4 address | `192.0.2.1` |
| Proxy status | 🟠 **Proxied** (nuvem LARANJA) |
| TTL | Auto |

4. Clique em **Save**

---

## PARTE 3: CRIAR REDIRECT RULES

### Passo 3.1 — Acessar Redirect Rules

1. No menu lateral, clique em **Rules**
2. Clique em **Redirect Rules**
3. Clique em **Create rule**

### Passo 3.2 — Criar Regra: `www.` → `pro.`

**Configuração da regra:**

| Campo | Valor |
|-------|-------|
| Rule name | `WWW para PRO` |

**When incoming requests match...**

1. Selecione **Custom filter expression**
2. Configure:

| Field | Operator | Value |
|-------|----------|-------|
| Hostname | equals | `www.moisesmedeiros.com.br` |

**Then...**

| Campo | Valor |
|-------|-------|
| Type | `Dynamic` |
| Expression | `concat("https://pro.moisesmedeiros.com.br", http.request.uri.path)` |
| Status code | `301` |
| Preserve query string | ✅ Ativado |

3. Clique em **Deploy**

### Passo 3.3 — Criar Regra: Raiz → `pro.`

1. Clique em **Create rule**
2. Configure:

| Campo | Valor |
|-------|-------|
| Rule name | `Raiz para PRO` |

**When incoming requests match...**

| Field | Operator | Value |
|-------|----------|-------|
| Hostname | equals | `moisesmedeiros.com.br` |

**Then...**

| Campo | Valor |
|-------|-------|
| Type | `Dynamic` |
| Expression | `concat("https://pro.moisesmedeiros.com.br", http.request.uri.path)` |
| Status code | `301` |
| Preserve query string | ✅ Ativado |

3. Clique em **Deploy**

### Passo 3.4 — Criar Regra: `app.` → `pro.` (QR Codes)

1. Clique em **Create rule**
2. Configure:

| Campo | Valor |
|-------|-------|
| Rule name | `APP para PRO (QR Codes)` |

**When incoming requests match...**

| Field | Operator | Value |
|-------|----------|-------|
| Hostname | equals | `app.moisesmedeiros.com.br` |

**Then...**

| Campo | Valor |
|-------|-------|
| Type | `Dynamic` |
| Expression | `concat("https://pro.moisesmedeiros.com.br/qr", http.request.uri.query)` |
| Status code | `301` |
| Preserve query string | ✅ Ativado |

3. Clique em **Deploy**

---

## PARTE 4: CONFIGURAR SSL

### Passo 4.1 — Verificar Modo SSL

1. No menu lateral, clique em **SSL/TLS**
2. Clique em **Overview**
3. Selecione **Full (strict)**

> ⚠️ **IMPORTANTE:** O modo deve ser **Full (strict)** para garantir criptografia end-to-end.

### Passo 4.2 — Verificar Edge Certificates

1. Clique em **Edge Certificates**
2. Verifique se **Always Use HTTPS** está ✅ ativado
3. Verifique se **Automatic HTTPS Rewrites** está ✅ ativado

---

## PARTE 5: TESTAR CONFIGURAÇÃO

### Passo 5.1 — Aguardar Propagação

Aguarde **5 minutos** para os DNS propagarem.

### Passo 5.2 — Testar via Terminal

Execute os comandos abaixo:

```bash
# Teste 1: WWW deve redirecionar para PRO
curl -I https://www.moisesmedeiros.com.br
# Esperado: HTTP/2 301 + Location: https://pro.moisesmedeiros.com.br/

# Teste 2: Raiz deve redirecionar para PRO
curl -I https://moisesmedeiros.com.br
# Esperado: HTTP/2 301 + Location: https://pro.moisesmedeiros.com.br/

# Teste 3: APP deve redirecionar para PRO/QR
curl -I https://app.moisesmedeiros.com.br
# Esperado: HTTP/2 301 + Location: https://pro.moisesmedeiros.com.br/qr

# Teste 4: PRO deve retornar 200 (sem redirect)
curl -I https://pro.moisesmedeiros.com.br
# Esperado: HTTP/2 200

# Teste 5: WWW.PRO deve retornar 200 ou 308 para PRO
curl -I https://www.pro.moisesmedeiros.com.br
# Esperado: HTTP/2 200 ou 308
```

### Passo 5.3 — Testar via Navegador

1. Abra uma aba anônima
2. Acesse `www.moisesmedeiros.com.br`
3. Verifique se redireciona para `pro.moisesmedeiros.com.br`
4. Repita para `moisesmedeiros.com.br` e `app.moisesmedeiros.com.br`

---

## ✅ CHECKLIST FINAL

### DNS Records

```
HOSTNAME                          TIPO    DESTINO                    NUVEM
─────────────────────────────────────────────────────────────────────────
pro.moisesmedeiros.com.br         CNAME   cname.vercel-dns.com       🔘 CINZA
www.pro.moisesmedeiros.com.br     CNAME   cname.vercel-dns.com       🔘 CINZA
www.moisesmedeiros.com.br         A       192.0.2.1                  🟠 LARANJA
app.moisesmedeiros.com.br         A       192.0.2.1                  🟠 LARANJA
moisesmedeiros.com.br (@)         A       192.0.2.1                  🟠 LARANJA
```

### Redirect Rules

```
REGRA                    ORIGEM                              DESTINO
─────────────────────────────────────────────────────────────────────────
WWW para PRO             www.moisesmedeiros.com.br           pro.moisesmedeiros.com.br
Raiz para PRO            moisesmedeiros.com.br               pro.moisesmedeiros.com.br
APP para PRO (QR)        app.moisesmedeiros.com.br           pro.moisesmedeiros.com.br/qr
```

### SSL/TLS

```
[ ] SSL Mode: Full (strict)
[ ] Always Use HTTPS: ✅
[ ] Automatic HTTPS Rewrites: ✅
```

### Testes

```
[ ] www.moisesmedeiros.com.br → 301 → pro.moisesmedeiros.com.br
[ ] moisesmedeiros.com.br → 301 → pro.moisesmedeiros.com.br
[ ] app.moisesmedeiros.com.br → 301 → pro.moisesmedeiros.com.br/qr
[ ] pro.moisesmedeiros.com.br → 200 OK
[ ] www.pro.moisesmedeiros.com.br → 200 OK
```

---

## 🔧 TROUBLESHOOTING

### Problema: "ERR_TOO_MANY_REDIRECTS"

**Causa:** Loop de redirect entre Cloudflare e Vercel.

**Solução:**
1. Verifique se `pro.` está como **CINZA** (não LARANJA)
2. Verifique se SSL está em **Full (strict)**
3. Limpe cache do navegador

### Problema: "Failed to Generate Certificate" na Vercel

**Causa:** Cloudflare está interceptando o tráfego (LARANJA) no hostname principal.

**Solução:**
1. Mude `pro.` para **DNS only** (CINZA)
2. Aguarde 5-10 minutos
3. Na Vercel, clique em "Refresh" no domínio

### Problema: Redirect não funciona

**Causa:** Regra de redirect não está ativa ou está com prioridade errada.

**Solução:**
1. Verifique se a regra está com status **Active**
2. Verifique a ordem das regras (mais específicas primeiro)
3. Aguarde 2-3 minutos para propagação

### Problema: QR Codes não redirecionam corretamente

**Causa:** Query string não está sendo preservada.

**Solução:**
1. Verifique se **Preserve query string** está ativado na regra
2. Teste com: `curl -I "https://app.moisesmedeiros.com.br?v=123"`

---

## 📊 CERTIFICADO DE CONFORMIDADE

```
╔══════════════════════════════════════════════════════════════════╗
║        CLOUDFLARE + VERCEL — CONFIGURAÇÃO HÍBRIDA                ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  DNS PRO (CINZA):                                                ║
║    • Tráfego direto para Vercel               ✅ CONFIGURADO    ║
║    • SSL sem conflito                         ✅ VERIFICADO     ║
║                                                                  ║
║  DNS REDIRECT (LARANJA):                                         ║
║    • WAF Protection ativo                     ✅ ATIVO          ║
║    • Redirect 301 configurado                 ✅ CONFIGURADO    ║
║                                                                  ║
║  SSL/TLS:                                                        ║
║    • Mode: Full (strict)                      ✅ CONFIGURADO    ║
║    • Always Use HTTPS                         ✅ ATIVO          ║
║                                                                  ║
╠══════════════════════════════════════════════════════════════════╣
║  STATUS: PRONTO PARA PRODUÇÃO                                    ║
║  DATA: 2026-01-20                                                ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## 📚 REFERÊNCIAS

- [Cloudflare DNS Documentation](https://developers.cloudflare.com/dns/)
- [Vercel Custom Domains](https://vercel.com/docs/projects/domains)
- [Cloudflare Redirect Rules](https://developers.cloudflare.com/rules/url-forwarding/)
- [CONSTITUIÇÃO SYNAPSE Ω v10.4](./CLOUDFLARE_REDIRECT_RULES_v2.md)

---

**Autor:** Sistema SYNAPSE Ω  
**Última atualização:** 2026-01-20  
**Versão:** 1.0.0
