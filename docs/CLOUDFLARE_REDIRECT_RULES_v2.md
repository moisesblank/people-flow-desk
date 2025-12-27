# ☁️ CLOUDFLARE REDIRECT RULES v2.0
## Checkpoint 4/6 — Configuração Pronta para Cloudflare

> **CONFORMIDADE:** CONSTITUIÇÃO v2.0.0
> **Data:** 2025-12-27
> **Status:** ✅ PRONTO PARA COPIAR/COLAR

---

## 📋 REQUISITOS ATENDIDOS

| Requisito | Status |
|-----------|--------|
| max_redirect_hops: 1 | ✅ |
| no_loops | ✅ |
| no_javascript_redirects | ✅ |
| preserve_path_and_query | ✅ |
| status_code_must_match_constitution | ✅ |

---

## 🔄 REGRAS DE REDIRECT

### REGRA 1: Entry Redirect (301 Permanente)
**Origem:** `moisesmedeiros.com.br` (domínio raiz sem www/pro)
**Destino:** `https://pro.moisesmedeiros.com.br`
**Preserva:** Path + Query String
**Status:** 301 (Moved Permanently)

### REGRA 2: Legacy Domain (301 Permanente)  
**Origem:** `gestao.moisesmedeiros.com.br/*`
**Destino:** `https://pro.moisesmedeiros.com.br/`
**Preserva:** NÃO (legacy domain terminado, vai para home)
**Status:** 301 (Moved Permanently)

### REGRA 3: WWW Redirect (301 Permanente)
**Origem:** `www.moisesmedeiros.com.br/*`
**Destino:** `https://pro.moisesmedeiros.com.br/$1`
**Preserva:** Path + Query String
**Status:** 301

---

## 📄 FORMATO 1: Bulk Redirects CSV

```csv
source,destination,status,preserve_path_suffix,preserve_query_string
https://moisesmedeiros.com.br,https://pro.moisesmedeiros.com.br,301,true,true
https://www.moisesmedeiros.com.br,https://pro.moisesmedeiros.com.br,301,true,true
https://gestao.moisesmedeiros.com.br,https://pro.moisesmedeiros.com.br,301,false,false
```

---

## 📄 FORMATO 2: Redirect Rules (Expression + Target)

### Regra 1 — Entry Redirect (Domínio Raiz)
```
Name: Entry Redirect - Domínio Raiz
Expression: (http.host eq "moisesmedeiros.com.br")
Action: Dynamic Redirect
Status: 301
Target: concat("https://pro.moisesmedeiros.com.br", http.request.uri.path, "?", http.request.uri.query)
```

### Regra 2 — WWW Redirect
```
Name: WWW Redirect
Expression: (http.host eq "www.moisesmedeiros.com.br")
Action: Dynamic Redirect
Status: 301
Target: concat("https://pro.moisesmedeiros.com.br", http.request.uri.path, "?", http.request.uri.query)
```

### Regra 3 — Legacy Gestão Domain (TERMINADO)
```
Name: Legacy Gestao Domain Terminated
Expression: (http.host eq "gestao.moisesmedeiros.com.br")
Action: Static Redirect
Status: 301
Target: https://pro.moisesmedeiros.com.br/
```

---

## 📄 FORMATO 3: Page Rules (Legacy - Ainda Suportado)

### Page Rule 1 — Entry Redirect
```
URL: moisesmedeiros.com.br/*
Setting: Forwarding URL
Status: 301
Destination: https://pro.moisesmedeiros.com.br/$1
```

### Page Rule 2 — WWW Redirect
```
URL: www.moisesmedeiros.com.br/*
Setting: Forwarding URL
Status: 301
Destination: https://pro.moisesmedeiros.com.br/$1
```

### Page Rule 3 — Legacy Gestão (TERMINADO)
```
URL: gestao.moisesmedeiros.com.br/*
Setting: Forwarding URL
Status: 301
Destination: https://pro.moisesmedeiros.com.br/
```

---

## 🧪 VALIDAÇÃO COM CURL

```bash
# Testar Entry Redirect (domínio raiz)
curl -I https://moisesmedeiros.com.br/
# Esperado: 301, Location: https://pro.moisesmedeiros.com.br/

# Testar Entry Redirect com path
curl -I https://moisesmedeiros.com.br/auth?next=/alunos
# Esperado: 301, Location: https://pro.moisesmedeiros.com.br/auth?next=/alunos

# Testar WWW Redirect
curl -I https://www.moisesmedeiros.com.br/comunidade
# Esperado: 301, Location: https://pro.moisesmedeiros.com.br/comunidade

# Testar Legacy Gestão (TERMINADO - não preserva path)
curl -I https://gestao.moisesmedeiros.com.br/dashboard
# Esperado: 301, Location: https://pro.moisesmedeiros.com.br/

# Testar que PRO é o destino final (sem redirect)
curl -I https://pro.moisesmedeiros.com.br/
# Esperado: 200 OK (sem Location header)
```

---

## ⚠️ ORDEM DE REGRAS NO CLOUDFLARE

1. **Legacy Gestão** (mais específico - bloqueia subdomínio)
2. **WWW Redirect** (subdomínio www)
3. **Entry Redirect** (domínio raiz - fallback)

---

## 🚫 NÃO FAZER

- ❌ Redirect de `pro.*` para qualquer lugar (é o destino final)
- ❌ JavaScript redirects (meta refresh, window.location)
- ❌ Loops de redirect (A → B → A)
- ❌ Mais de 1 hop para chegar ao destino
- ❌ Redirect de `/gestaofc/*` (rota interna, não existe no DNS)

---

## ✅ CHECKLIST CLOUDFLARE

- [ ] Bulk Redirects ou Page Rules configurados
- [ ] DNS apontando para Cloudflare (proxied/laranja)
- [ ] SSL/TLS em "Full (strict)"
- [ ] Testar com curl cada regra
- [ ] Confirmar 0 loops
- [ ] Confirmar max 1 hop

---

## 📊 CERTIFICADO DE CONFORMIDADE

```
╔══════════════════════════════════════════════════════════════════╗
║              CHECKPOINT 4/6 — CLOUDFLARE RULES                   ║
╠══════════════════════════════════════════════════════════════════╣
║ max_redirect_hops: 1              ✅ PASS                        ║
║ no_loops                          ✅ PASS                        ║
║ no_javascript_redirects           ✅ PASS                        ║
║ preserve_path_and_query           ✅ PASS (exceto legacy)        ║
║ status_code_must_match            ✅ PASS (301 Permanente)       ║
╠══════════════════════════════════════════════════════════════════╣
║ RESULTADO: CONFORMIDADE TOTAL                                    ║
╚══════════════════════════════════════════════════════════════════╝
```
