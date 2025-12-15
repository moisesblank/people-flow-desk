# 🔧 GUIA CLOUDFLARE - O QUE FAZER AGORA

## Para: Moisés Medeiros
## Domínio: moisesmedeiros.com.br
## Data: 15 de Dezembro de 2025

---

## 📸 ANÁLISE DA SUA TELA DO CLOUDFLARE

Eu vi sua configuração atual. Você já tem registros A apontando para `179.127.7.x`.

Para o Lovable funcionar, você precisa **ADICIONAR 2 REGISTROS NOVOS**.

---

## ✅ PASSO A PASSO (FAÇA EXATAMENTE ISSO)

### PASSO 1: Adicionar Domínio no Lovable

Primeiro, você precisa configurar o domínio no Lovable para receber o código de verificação:

1. No Lovable, clique no nome do projeto (canto superior esquerdo)
2. Clique em **"Settings"** (Configurações)
3. No menu lateral, clique em **"Domains"**
4. Clique em **"Connect Domain"**
5. Digite: `moisesmedeiros.com.br`
6. Clique em **"Continue"**
7. **ANOTE** o código TXT que aparecer (algo como `lovable_verify=abc123...`)

---

### PASSO 2: Adicionar Registros no Cloudflare

Volte ao Cloudflare (https://dash.cloudflare.com) e clique em **"+ Adicionar registro"**

#### 📌 REGISTRO 1 - Apontar domínio para Lovable

| Campo | O que colocar |
|-------|---------------|
| **Tipo** | `A` |
| **Nome** | `lovable` |
| **Endereço IPv4** | `185.158.133.1` |
| **Proxy** | ⚫ **Desligado** (nuvem CINZA!) |
| **TTL** | Auto |

👆 Clique em **Salvar**

---

#### 📌 REGISTRO 2 - Verificação do Lovable

| Campo | O que colocar |
|-------|---------------|
| **Tipo** | `TXT` |
| **Nome** | `_lovable` |
| **Conteúdo** | O código que você anotou no Passo 1 |
| **TTL** | Auto |

👆 Clique em **Salvar**

---

### PASSO 3: Verificar no Lovable

1. Volte ao Lovable
2. Clique em **"Verify"** ou **"Verificar"**
3. Aguarde 5-15 minutos

---

## ⚠️ IMPORTANTE - NUVEM CINZA!

No Cloudflare, quando você adicionar o registro A, a nuvem aparece **LARANJA** por padrão.

**VOCÊ PRECISA CLICAR NA NUVEM PARA DEIXÁ-LA CINZA!**

| Visual | Significado | Funciona com Lovable? |
|--------|-------------|----------------------|
| 🔘 Nuvem CINZA | DNS only | ✅ **SIM** |
| 🟠 Nuvem LARANJA | Proxied | ❌ **NÃO** |

---

## 🤔 E SE EU QUISER QUE O DOMÍNIO PRINCIPAL APONTE PARA O LOVABLE?

Se você quiser que `moisesmedeiros.com.br` (sem nada na frente) aponte para o Lovable, você precisaria:

1. **Editar** o registro A existente de `moisesmedeiros.co...` (o registro que mostra `179.127.7.5`)
2. Mudar o IP para `185.158.133.1`
3. Deixar a nuvem CINZA

**⚠️ ATENÇÃO:** Isso pode afetar seu site atual! Só faça isso se souber o que está fazendo.

---

## 📋 RESUMO VISUAL

```
┌─────────────────────────────────────────────────────────────────┐
│                    SUA CONFIGURAÇÃO ATUAL                       │
├─────────────────────────────────────────────────────────────────┤
│  moisesmedeiros.com.br  →  179.127.7.5 (seu servidor atual)    │
│  www                    →  179.127.7.5 (seu servidor atual)    │
│  app                    →  179.127.7.8 (área do aluno)         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              REGISTROS PARA ADICIONAR AGORA                     │
├─────────────────────────────────────────────────────────────────┤
│  lovable (novo)         →  185.158.133.1 (Lovable)             │
│  _lovable (TXT)         →  código de verificação               │
└─────────────────────────────────────────────────────────────────┘

Resultado: lovable.moisesmedeiros.com.br funcionará com Lovable
```

---

## 🎯 OPÇÕES DE CONFIGURAÇÃO

### OPÇÃO A: Subdomínio (Mais Seguro)
- URL: `lovable.moisesmedeiros.com.br`
- ✅ Não afeta seu site atual
- ✅ Mantém tudo funcionando
- Ideal para testar primeiro

### OPÇÃO B: Domínio Principal (Mais Impacto)
- URL: `moisesmedeiros.com.br`
- ⚠️ Precisa EDITAR registros existentes
- ⚠️ Seu site atual para de funcionar
- Só faça quando estiver 100% pronto

---

## ❓ QUAL OPÇÃO VOCÊ QUER?

Me diga qual opção você prefere e eu explico o passo a passo exato!

- **Opção A**: Quero usar `lovable.moisesmedeiros.com.br` (mais seguro)
- **Opção B**: Quero usar `moisesmedeiros.com.br` como principal

---

## 📞 PRECISA DE AJUDA?

Se algo não funcionar:
1. Tire um print da tela de DNS do Cloudflare
2. Tire um print da tela de Domains do Lovable
3. Me envie aqui!

---

*Documento gerado pelo Curso Moisés Medeiros*
