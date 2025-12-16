# 📱 Guia Completo: WhatsApp Business API em Produção

## Status Atual
- ✅ Webhook configurado e funcionando
- ✅ Integração com TRAMON AI pronta
- ⏳ **Pendente:** Número real verificado + Token permanente

---

## 🚀 Passo a Passo para Produção

### PASSO 1: Acessar Meta Business Suite
1. Acesse: https://business.facebook.com
2. Faça login com sua conta Facebook/Meta

### PASSO 2: Criar/Acessar App do WhatsApp
1. Vá para: https://developers.facebook.com/apps
2. Se não tem app, clique **"Criar App"**
3. Escolha: **"Empresa"** → **"WhatsApp"**
4. Dê um nome (ex: "Moises Medeiros Bot")

### PASSO 3: Verificar Seu Número Real
1. No painel do app, vá em **WhatsApp** → **Primeiros Passos**
2. Clique em **"Adicionar número de telefone"**
3. Insira seu número: `+55 83 99146-2045` (ou outro)
4. Escolha verificação por **SMS** ou **Ligação**
5. Digite o código recebido
6. ✅ Número verificado!

### PASSO 4: Criar Token Permanente
1. Vá em **Configurações do App** → **Básico**
2. Copie o **App ID** e **App Secret**
3. Acesse: **Configurações do Sistema** → **Usuários do Sistema**
4. Clique **"Adicionar"** → Nome: "WhatsApp Bot"
5. Função: **Admin**
6. Clique em **"Gerar Token"**
7. Selecione as permissões:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
8. **Copie o token** (ele não aparecerá novamente!)

### PASSO 5: Obter Phone Number ID do Número Real
1. Vá em **WhatsApp** → **Configuração da API**
2. No dropdown, selecione seu número verificado
3. Copie o **Phone Number ID** (diferente do número de teste!)

### PASSO 6: Atualizar Secrets no Lovable
Você precisará atualizar estes secrets:

| Secret | Valor |
|--------|-------|
| `WHATSAPP_ACCESS_TOKEN` | Token permanente do Passo 4 |
| `WHATSAPP_PHONE_NUMBER_ID` | ID do seu número real (Passo 5) |

---

## 🔧 Como Atualizar os Secrets

1. No Lovable, me peça: **"Atualizar o WHATSAPP_ACCESS_TOKEN"**
2. Cole o novo token permanente
3. Repita para **WHATSAPP_PHONE_NUMBER_ID**

---

## ⚠️ Importante: Limites e Custos

### Tier Gratuito (1.000 conversas/mês)
- Primeiras 1.000 conversas iniciadas pelo usuário: **GRÁTIS**
- Conversas iniciadas pelo negócio: cobradas

### Limites de Mensagens
| Tier | Mensagens/24h |
|------|---------------|
| Não verificado | 250 |
| Verificado | 1.000 |
| Tier 1 | 10.000 |
| Tier 2 | 100.000 |

### Para Aumentar Limites
1. Verifique seu negócio no Meta Business
2. Mantenha boa qualidade de mensagens
3. Aumente gradualmente o volume

---

## 🧪 Testar Após Configuração

Após atualizar os secrets:

1. **Envie uma mensagem** para seu número WhatsApp Business
2. O TRAMON deve responder automaticamente
3. Teste comandos como:
   - "Quais são minhas tarefas?"
   - "Resumo financeiro"
   - "Criar tarefa: revisar aulas"

---

## 📋 Checklist Final

- [ ] App criado no Meta Developers
- [ ] Número real adicionado e verificado
- [ ] Token permanente gerado
- [ ] Phone Number ID do número real copiado
- [ ] `WHATSAPP_ACCESS_TOKEN` atualizado no Lovable
- [ ] `WHATSAPP_PHONE_NUMBER_ID` atualizado no Lovable
- [ ] Teste de envio/recebimento funcionando

---

## 🆘 Problemas Comuns

### "Token expirado"
→ Você está usando token temporário. Gere um permanente (Passo 4)

### "Número não verificado"
→ Complete a verificação por SMS/Ligação (Passo 3)

### "Mensagem não entregue"
→ Verifique se o número do destinatário tem WhatsApp ativo

### "Rate limit exceeded"
→ Aguarde 24h ou solicite aumento de tier

---

## 📞 Suporte

Se precisar de ajuda:
1. Documentação Meta: https://developers.facebook.com/docs/whatsapp
2. Me pergunte aqui no Lovable!

---

**Quando tiver o token permanente e Phone Number ID, me avise para atualizarmos!** 🚀
