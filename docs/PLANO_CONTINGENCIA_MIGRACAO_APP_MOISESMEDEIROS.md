# 🚨 PLANO DE CONTINGÊNCIA — MIGRAÇÃO DO SUBDOMÍNIO APP

**Status:** PRONTO PARA EXECUÇÃO  
**Data:** 2025-01-04  
**Autor:** Synapse Ω  
**Prioridade:** Alta quando servidor antigo ficar offline

---

## 📋 SITUAÇÃO ATUAL

| Item | Quem Controla | Status |
|------|---------------|--------|
| Domínio `moisesmedeiros.com.br` | **VOCÊ (Moisés)** | ✅ Seu |
| Cloudflare (DNS) | **VOCÊ (Moisés)** | ✅ Seu |
| Subdomínio `pro.moisesmedeiros.com.br` | **VOCÊ (Lovable)** | ✅ Funcionando |
| Servidor do site antigo (WordPress) | Programador antigo | ⚠️ Risco |
| Subdomínio `app.moisesmedeiros.com.br` | Aponta para servidor do programador | ⚠️ Risco |

---

## 🎯 OBJETIVO

Quando o servidor antigo ficar offline (seja por ação do programador ou qualquer outro motivo), recuperar a funcionalidade dos **QR Codes impressos** que apontam para:

```
app.moisesmedeiros.com.br/aluno/modulos/?v=XXXXX
```

E redirecioná-los para o novo sistema:

```
pro.moisesmedeiros.com.br/qr?v=XXXXX
```

---

## ⏰ QUANDO EXECUTAR ESTE PLANO

Execute este plano quando **QUALQUER** uma dessas situações ocorrer:

1. ❌ O site `app.moisesmedeiros.com.br` parar de funcionar
2. ❌ O site mostrar erro 502, 503, 504 ou "Site não encontrado"
3. ❌ O programador comunicar que vai desligar o servidor
4. ✅ O novo portal estiver 100% pronto e você decidir migrar proativamente

---

## 📝 PASSO A PASSO DETALHADO

### PASSO 1: Acessar o Cloudflare

1. Acesse: https://dash.cloudflare.com
2. Faça login com sua conta
3. Clique no domínio `moisesmedeiros.com.br`

---

### PASSO 2: Alterar o DNS do subdomínio "app"

1. No menu lateral, clique em **"DNS"** → **"Records"**
2. Localize o registro do tipo **A** com nome **"app"**
3. Clique no botão de **editar** (ícone de lápis)
4. Altere os campos:

| Campo | Valor ANTIGO | Valor NOVO |
|-------|--------------|------------|
| **Type** | A | A |
| **Name** | app | app |
| **IPv4 address** | (IP do servidor antigo) | `185.158.133.1` |
| **Proxy status** | (qualquer) | **LIGADO (laranja)** ☁️ |
| **TTL** | Auto | Auto |

5. Clique em **"Save"**

> ⚠️ **IMPORTANTE:** O proxy (nuvem laranja) DEVE estar LIGADO para as regras de redirecionamento funcionarem.

---

### PASSO 3: Criar a Regra de Redirecionamento

1. No menu lateral do Cloudflare, clique em **"Rules"**
2. Clique em **"Redirect Rules"**
3. Clique no botão **"+ Create rule"**

#### 3.1 Configurar o Nome da Regra

- **Rule name:** `QR_CODE_REDIRECT_TO_NEW_SYSTEM`

#### 3.2 Configurar "When incoming requests match..."

Clique em **"Edit expression"** (link azul no canto direito) e cole EXATAMENTE este código:

```
(http.host eq "app.moisesmedeiros.com.br" and starts_with(http.request.uri.path, "/aluno/modulos/"))
```

Depois clique em **"Use expression builder"** para voltar ao modo visual (opcional).

#### 3.3 Configurar "Then..."

1. Em **"Type"**, selecione: **Dynamic**
2. Em **"Expression"**, cole:

```
concat("https://pro.moisesmedeiros.com.br/qr?v=", http.request.uri.query)
```

> **ATENÇÃO:** Se a expressão acima não funcionar corretamente (testar depois), use a alternativa estática:

**Alternativa mais simples (Type: Static):**
- **URL:** `https://pro.moisesmedeiros.com.br/qr`
- **Status code:** `301`
- **Preserve query string:** ✅ LIGADO

#### 3.4 Status Code

- Selecione: **301** (Permanent Redirect)

#### 3.5 Finalizar

1. Clique em **"Deploy"**

---

### PASSO 4: Testar o Redirecionamento

Após aguardar 2-5 minutos para propagação, teste no navegador:

**URL de teste:**
```
https://app.moisesmedeiros.com.br/aluno/modulos/?v=123
```

**Deve redirecionar para:**
```
https://pro.moisesmedeiros.com.br/qr?v=123
```

#### Teste via Terminal (opcional):

```bash
curl -I "https://app.moisesmedeiros.com.br/aluno/modulos/?v=123"
```

**Resposta esperada:**
```
HTTP/2 301
location: https://pro.moisesmedeiros.com.br/qr?v=123
```

---

### PASSO 5: Verificar o Resolvedor de QR

Acesse manualmente com um ID real de aula:

```
https://pro.moisesmedeiros.com.br/qr?v=1
```

O sistema deve:
1. Identificar a aula pelo `legacy_qr_id`
2. Mostrar o nome da aula
3. Redirecionar automaticamente para o player

---

## ⚠️ O QUE ACONTECE COM O RESTO DO SITE ANTIGO?

Quando você fizer esta mudança:

| URL | O que acontece |
|-----|----------------|
| `app.moisesmedeiros.com.br/aluno/modulos/?v=XXX` | ✅ Redireciona para novo sistema |
| `app.moisesmedeiros.com.br/qualquer-outra-coisa` | ❌ Mostrará erro (site não configurado no Lovable) |

**Isso é esperado e aceitável** porque:
- O site antigo já estará offline de qualquer forma
- Os QR codes (que é o que importa) funcionarão
- O novo portal em `pro.moisesmedeiros.com.br` é o sistema oficial

---

## 🔧 TROUBLESHOOTING (Se algo der errado)

### Problema: Redirect não funciona

**Solução:**
1. Verifique se o proxy (nuvem laranja) está LIGADO no DNS
2. Verifique se a regra está ATIVA (não em draft)
3. Aguarde até 5 minutos para propagação
4. Teste em aba anônima (para evitar cache)

### Problema: Parâmetro `v=` não está sendo passado

**Solução:**
1. Na regra de redirect, certifique-se que **"Preserve query string"** está ✅ LIGADO
2. Ou use o tipo **Dynamic** com a expressão correta

### Problema: Erro de SSL/Certificado

**Solução:**
1. No Cloudflare, vá em **SSL/TLS** → **Overview**
2. Certifique-se que está em **Full** ou **Full (strict)**
3. Aguarde até 24h para o certificado ser emitido para o novo subdomínio

---

## 📊 RESUMO VISUAL DO FLUXO

```
┌─────────────────────────────────────────────────────────────┐
│                    ANTES DA MIGRAÇÃO                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  QR Code Impresso                                          │
│       ↓                                                    │
│  app.moisesmedeiros.com.br/aluno/modulos/?v=123            │
│       ↓                                                    │
│  Servidor do Programador (WordPress)                       │
│       ↓                                                    │
│  ❌ OFFLINE / Não funciona                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   DEPOIS DA MIGRAÇÃO                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  QR Code Impresso                                          │
│       ↓                                                    │
│  app.moisesmedeiros.com.br/aluno/modulos/?v=123            │
│       ↓                                                    │
│  Cloudflare (Redirect Rule 301)                            │
│       ↓                                                    │
│  pro.moisesmedeiros.com.br/qr?v=123                        │
│       ↓                                                    │
│  Resolvedor identifica aula pelo legacy_qr_id              │
│       ↓                                                    │
│  ✅ Player de vídeo abre!                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ CHECKLIST FINAL

Antes de considerar a migração completa, verifique:

- [ ] DNS do `app` aponta para `185.158.133.1`
- [ ] Proxy (nuvem laranja) está LIGADO
- [ ] Redirect Rule está DEPLOYED (não em draft)
- [ ] Teste com URL real funcionou
- [ ] QR code físico testado com celular

---

## 📞 SUPORTE

Se encontrar dificuldades durante a execução:

1. Tire prints de cada tela
2. Anote as mensagens de erro
3. Volte ao chat do Lovable com os prints

---

## 📅 HISTÓRICO DE ATUALIZAÇÕES

| Data | Versão | Alteração |
|------|--------|-----------|
| 2025-01-04 | 1.0 | Documento inicial criado |

---

**FIM DO DOCUMENTO**
