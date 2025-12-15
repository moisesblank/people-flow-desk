# 🌐 GUIA COMPLETO: Como Conectar Seu Domínio moisesmedeiros.com.br

## Para: Moisés Medeiros (Leigo em Tecnologia)
## Atualizado em: 15 de Dezembro de 2025

---

## 📋 O QUE VOCÊ VAI PRECISAR (CHECKLIST)

Antes de começar, tenha em mãos:

| Item | Onde Conseguir | Você Já Tem? |
|------|----------------|--------------|
| Acesso ao painel do Registro.br | https://registro.br (login com CPF/CNPJ) | ⬜ |
| Domínio ativo: moisesmedeiros.com.br | Já possui (válido até 2035) | ✅ |
| Acesso ao Lovable | Já está logado | ✅ |

---

## 🎯 PASSO A PASSO DETALHADO

### PASSO 1: Acessar as Configurações de Domínio no Lovable

1. **Olhe para o canto superior direito** da tela do Lovable
2. **Clique no nome do projeto** (aparece o menu)
3. **Clique em "Settings"** (Configurações)
4. **Clique em "Domains"** no menu lateral

![Local: Settings → Domains]

---

### PASSO 2: Adicionar Seu Domínio

1. Na seção Domains, clique em **"Connect Domain"** (botão azul)
2. Digite: `moisesmedeiros.com.br`
3. Clique em **"Continue"** ou **"Next"**
4. **ANOTE** as informações que aparecem na tela:
   - Tipo de registro (A ou TXT)
   - Nome/Host
   - Valor/Endereço

**⚠️ IMPORTANTE: O Lovable vai mostrar algo assim:**

```
Registro A:
  Nome: @
  Valor: 185.158.133.1

Registro A:
  Nome: www
  Valor: 185.158.133.1

Registro TXT:
  Nome: _lovable
  Valor: lovable_verify=XXXXX (um código único)
```

---

### PASSO 3: Acessar o Registro.br

1. Abra uma nova aba no navegador
2. Acesse: **https://registro.br**
3. Clique em **"Entrar"** (canto superior direito)
4. Faça login com seu **CPF ou CNPJ** e senha
5. Após logar, você verá seus domínios listados
6. Clique em **"moisesmedeiros.com.br"**

---

### PASSO 4: Acessar a Zona DNS

1. Dentro do seu domínio, procure por **"DNS"** ou **"Zona DNS"**
2. Clique em **"Editar Zona"** ou **"Gerenciar DNS"**
3. Você verá uma tabela com os registros atuais

---

### PASSO 5: Adicionar os Registros (PARTE MAIS IMPORTANTE!)

Você precisa **ADICIONAR** 3 registros. Clique em **"Novo Registro"** ou **"Adicionar"** para cada um:

#### 📌 REGISTRO 1 - Domínio Principal (@)

| Campo | O que digitar |
|-------|---------------|
| **Tipo** | A |
| **Nome** ou **Host** | @ |
| **Valor** ou **Endereço** | `185.158.133.1` |
| **TTL** | 3600 (ou deixe padrão) |

Clique em **Salvar**

---

#### 📌 REGISTRO 2 - Subdomínio WWW

| Campo | O que digitar |
|-------|---------------|
| **Tipo** | A |
| **Nome** ou **Host** | www |
| **Valor** ou **Endereço** | `185.158.133.1` |
| **TTL** | 3600 (ou deixe padrão) |

Clique em **Salvar**

---

#### 📌 REGISTRO 3 - Verificação do Lovable

| Campo | O que digitar |
|-------|---------------|
| **Tipo** | TXT |
| **Nome** ou **Host** | _lovable |
| **Valor** | O código que o Lovable mostrou (ex: `lovable_verify=abc123xyz`) |
| **TTL** | 3600 (ou deixe padrão) |

Clique em **Salvar**

---

### PASSO 6: Verificar e Aguardar

1. **Volte para o Lovable** (aba do navegador)
2. Clique em **"Verify"** ou **"Verificar"**
3. **AGUARDE** - A propagação DNS pode levar:
   - ⏱️ Mínimo: 5 minutos
   - ⏱️ Normal: 30 minutos a 2 horas
   - ⏱️ Máximo: até 72 horas (raro)

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

### ❌ "Não consigo logar no Registro.br"
**Solução:** 
- Use "Esqueci minha senha" no site
- Ou ligue: 0800 728 9001 (suporte Registro.br)

### ❌ "Não encontro onde editar DNS"
**Solução no Registro.br:**
1. Entre no domínio
2. Procure "DNS" no menu lateral
3. Clique em "Editar zona" ou "Gerenciar"

### ❌ "Já existe um registro A para @"
**Solução:** 
- Delete o registro antigo primeiro
- Depois adicione o novo com IP `185.158.133.1`

### ❌ "Passou 24 horas e ainda não funcionou"
**Solução:**
1. Verifique se os registros estão corretos
2. Use o site https://dnschecker.org para verificar
3. Digite seu domínio e veja se o IP `185.158.133.1` aparece

---

## 📞 PRECISA DE AJUDA?

Se mesmo seguindo todos os passos não conseguir:

1. **Tire um print da tela do DNS** do Registro.br
2. **Tire um print da tela de Domains** do Lovable
3. **Me envie aqui** que eu ajudo você!

---

## 🎉 RESULTADO FINAL

Quando tudo estiver funcionando:

- ✅ Acesse `https://moisesmedeiros.com.br` → Seu dashboard!
- ✅ Acesse `https://www.moisesmedeiros.com.br` → Também funciona!
- ✅ Certificado SSL (cadeado verde) → Automático e gratuito!

---

*Documento gerado pelo Projeto Synapse - Sistema Nervoso Digital*
