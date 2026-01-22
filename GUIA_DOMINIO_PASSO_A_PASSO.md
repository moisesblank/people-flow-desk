# 🌐 GUIA COMPLETO: Conectar Domínio moisesmedeiros.com.br

## Para: Moisés Medeiros
## DNS: Cloudflare (conforme sua configuração atual)
## Atualizado em: 15 de Dezembro de 2025

---

## ✅ SITUAÇÃO ATUAL (Identificada)

Seu domínio está usando **Cloudflare** como DNS:
- Servidor 1: `huxley.ns.cloudflare.com`
- Servidor 2: `liv.ns.cloudflare.com`

Isso é **EXCELENTE** porque o Cloudflare é mais rápido e confiável!

---

## 📋 O QUE VOCÊ VAI PRECISAR (CHECKLIST)

| Item | Onde Conseguir | Status |
|------|----------------|--------|
| Acesso ao Cloudflare | https://dash.cloudflare.com | ⬜ Verificar |
| Domínio: moisesmedeiros.com.br | Já possui | ✅ |
| Acesso ao Lovable | Já está logado | ✅ |

---

## 🎯 PASSO A PASSO DETALHADO

### PASSO 1: Acessar Configurações de Domínio no Lovable

**No Computador:**
1. Olhe no **canto superior direito** da tela
2. Clique no **nome do projeto** (aparece um menu)
3. Clique em **"Settings"** (Configurações)
4. No menu lateral, clique em **"Domains"**
5. Clique em **"Connect Domain"** (botão azul/dourado)

**No Celular:**
1. Toque no **nome do projeto** no topo
2. Toque em **"Settings"**
3. Procure **"Domains"**

---

### PASSO 2: Adicionar Seu Domínio no Lovable

1. Digite: `moisesmedeiros.com.br`
2. Clique em **"Continue"** ou **"Next"**
3. O Lovable vai mostrar os registros DNS necessários

**📝 ANOTE ESSAS INFORMAÇÕES (exemplo):**

```
Registro A (para domínio principal):
   Nome: @
   Valor: 185.158.133.1

Registro A (para www):
   Nome: www
   Valor: 185.158.133.1

Registro TXT (para verificação):
   Nome: _lovable
   Valor: lovable_verify=XXXXX (código único)
```

---

### PASSO 3: Acessar o Cloudflare

1. Abra uma **nova aba** no navegador
2. Acesse: **https://dash.cloudflare.com**
3. Faça login com seu email e senha
4. Clique no domínio **"moisesmedeiros.com.br"**
5. No menu lateral esquerdo, clique em **"DNS"**

---

### PASSO 4: Adicionar os Registros no Cloudflare

Você verá uma lista de registros DNS. Clique em **"Add record"** (Adicionar registro) para cada um:

#### 📌 REGISTRO 1 - Domínio Principal (@)

| Campo | O que selecionar/digitar |
|-------|--------------------------|
| **Type** | A |
| **Name** | @ |
| **IPv4 address** | `185.158.133.1` |
| **Proxy status** | 🟠 **DNS only** (nuvem CINZA, não laranja!) |
| **TTL** | Auto |

⚠️ **IMPORTANTE:** Clique na nuvem laranja para deixá-la **CINZA** (DNS only). Isso é essencial!

Clique em **Save**

---

#### 📌 REGISTRO 2 - Subdomínio WWW

| Campo | O que selecionar/digitar |
|-------|--------------------------|
| **Type** | A |
| **Name** | www |
| **IPv4 address** | `185.158.133.1` |
| **Proxy status** | 🟠 **DNS only** (nuvem CINZA!) |
| **TTL** | Auto |

Clique em **Save**

---

#### 📌 REGISTRO 3 - Verificação do Lovable

| Campo | O que selecionar/digitar |
|-------|--------------------------|
| **Type** | TXT |
| **Name** | _lovable |
| **Content** | O código que o Lovable mostrou (ex: `lovable_verify=abc123xyz`) |
| **TTL** | Auto |

Clique em **Save**

---

### PASSO 5: Verificar e Aguardar

1. **Volte para o Lovable** (aba do navegador)
2. Clique em **"Verify"** ou **"Verificar"**
3. **AGUARDE** - A propagação DNS pode levar:
   - ⏱️ **Cloudflare:** Geralmente 5-15 minutos (mais rápido!)
   - ⏱️ Máximo: até 24 horas (raro)

---

## ⚠️ CUIDADO ESPECIAL COM CLOUDFLARE

### Proxy vs DNS Only

O Cloudflare tem um recurso de "Proxy" (nuvem laranja). Para funcionar com Lovable:

| Configuração | Visual | Funciona com Lovable? |
|--------------|--------|----------------------|
| **DNS only** | 🔘 Nuvem CINZA | ✅ SIM |
| **Proxied** | 🟠 Nuvem LARANJA | ❌ NÃO |

**Como mudar:** Clique no registro → Clique na nuvem laranja → Ela fica cinza → Salve

---

## ✅ COMO SABER SE FUNCIONOU

### Status no Lovable:

| Status | Significado | O que fazer |
|--------|-------------|-------------|
| 🟢 **Active** | Tudo funcionando! | Nada, está pronto! |
| 🟡 **Verifying** | Aguardando propagação | Espere mais um pouco |
| 🟡 **Setting up** | SSL sendo configurado | Espere mais um pouco |
| 🔴 **Action required** | Precisa completar algo | Siga as instruções na tela |
| 🔴 **Failed** | Algo deu errado | Verifique os registros DNS |

---

## 🔧 PROBLEMAS COMUNS E SOLUÇÕES

### ❌ "Não consigo logar no Cloudflare"
**Solução:** 
- Use "Forgot password?" no site
- Verifique seu email cadastrado

### ❌ "A nuvem está laranja"
**Solução:** 
- Clique no registro
- Clique na nuvem laranja para desativar o proxy
- Ela deve ficar CINZA
- Salve

### ❌ "Já existe um registro A para @"
**Solução:** 
- Clique nos 3 pontinhos do registro antigo
- Clique em "Delete"
- Depois adicione o novo com IP `185.158.133.1`

### ❌ "Passou 24 horas e ainda não funcionou"
**Solução:**
1. Verifique se o proxy está DESATIVADO (nuvem cinza)
2. Use https://dnschecker.org para verificar
3. Digite seu domínio e veja se o IP `185.158.133.1` aparece

---

## 📞 PRECISA DE AJUDA?

Se mesmo seguindo todos os passos não conseguir:

1. **Tire um print da tela de DNS** do Cloudflare
2. **Tire um print da tela de Domains** do Lovable
3. **Me envie aqui** que eu ajudo você!

---

## 🎉 RESULTADO FINAL

Quando tudo estiver funcionando:

- ✅ Acesse `https://moisesmedeiros.com.br` → Seu site!
- ✅ Acesse `https://www.moisesmedeiros.com.br` → Também funciona!
- ✅ Certificado SSL (cadeado verde) → Automático e gratuito!

---

## 🚀 NOVA LANDING PAGE

Além do dashboard administrativo, agora você tem uma **Landing Page Premium**!

Acesse: `/site` para ver a página pública do Professor Moisés Medeiros com:
- Hero Section com contador de aprovados
- Seção RAIO X (revisão de 7 semanas)
- Cronograma de aulas ao vivo
- Depoimentos de alunos aprovados
- Links para redes sociais e área do aluno

---

*Documento gerado pelo Sistema Curso de Química - Moisés Medeiros*
