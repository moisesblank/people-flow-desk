# 🔍 CHECKLIST — FASE 1/6

## DOMÍNIOS & CLOUDFLARE (BASE DO SISTEMA)

> **Regra:** Sem 100% aqui, NADA AVANÇA.
> **Data:** 2025-12-27
> **Status:** ⏳ AGUARDANDO EVIDÊNCIAS DO OWNER

---

## 1.1 Domínio raiz HTTP → PRO (301)

**Comando:**
```bash
curl -I http://www.moisesmedeiros.com.br
```

**Esperado:**
- Status: `301`
- Location: `https://pro.moisesmedeiros.com.br`

| Resultado | |
|-----------|--|
| ☐ SIM | ☐ NÃO |

**Evidência (colar saída):**
```
[COLAR AQUI]
```

---

## 1.2 Domínio raiz HTTPS → PRO (301)

**Comando:**
```bash
curl -I https://moisesmedeiros.com.br
```

**Esperado:**
- Status: `301`
- Location: `https://pro.moisesmedeiros.com.br`

| Resultado | |
|-----------|--|
| ☐ SIM | ☐ NÃO |

**Evidência (colar saída):**
```
[COLAR AQUI]
```

---

## 1.3 Sem cadeia de redirecionamento (apenas 1 salto)

**Comando:**
```bash
curl -IL http://www.moisesmedeiros.com.br
```

**Esperado:**
- Apenas 1 redirect
- Nenhum loop

| Resultado | |
|-----------|--|
| ☐ SIM | ☐ NÃO |

**Evidência (colar saída):**
```
[COLAR AQUI]
```

---

## 1.4 Domínio legado NÃO possui runtime

**Comando:**
```bash
curl -I https://gestao.moisesmedeiros.com.br
```

**Esperado (um dos dois):**
- `301/302` → redirect para `/gestaofc` ou `pro.moisesmedeiros.com.br`
- OU `403 / 410`

| Resultado | |
|-----------|--|
| ☐ SIM | ☐ NÃO |

**Evidência (colar saída):**
```
[COLAR AQUI]
```

---

## 1.5 Legado NÃO autentica e NÃO serve aplicação

**Verificação manual:**
- Acessar `https://gestao.moisesmedeiros.com.br` no navegador
- Confirmar que NÃO exibe login
- Confirmar que NÃO serve conteúdo da aplicação

| Resultado | |
|-----------|--|
| ☐ SIM | ☐ NÃO |

**Evidência (print / descrição objetiva):**
```
[COLAR AQUI OU ANEXAR PRINT]
```

---

## 🔒 RESULTADO DA FASE 1/6

| Status | Condição |
|--------|----------|
| ☐ APROVADO | TODOS OS ITENS = SIM → AVANÇA PARA FASE 2 |
| ☐ BLOQUEADO | ALGUM ITEM = NÃO → PROCESSO BLOQUEADO |

---

## 📋 RESUMO EXECUTIVO

| Item | Teste | Status |
|------|-------|--------|
| 1.1 | HTTP www → PRO 301 | ⏳ |
| 1.2 | HTTPS raiz → PRO 301 | ⏳ |
| 1.3 | Max 1 hop, sem loop | ⏳ |
| 1.4 | Legado sem runtime | ⏳ |
| 1.5 | Legado sem auth/app | ⏳ |

---

## ⚠️ AÇÃO NECESSÁRIA

**O OWNER deve executar os comandos `curl` acima e colar as evidências neste documento.**

Eu (IA) não tenho acesso para executar `curl` em domínios externos.

Após preencher as evidências, marque o resultado final e prossiga para a Fase 2/6.
