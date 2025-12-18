# 🧠 RUNBOOK TRAMON v9.0 - ECOSSISTEMA NEURAL AUTÔNOMO

**Versão:** 9.0  
**Data:** 18/12/2025  
**Proprietário:** Prof. Moisés Medeiros (moisesblank@gmail.com)

---

## 1. VISÃO GERAL DO SISTEMA

O TRAMON v9.0 é um Ecossistema Neural Autônomo composto por 5 camadas:

1. **Camada de Ingestão** - Webhooks de WordPress, Hotmart, WhatsApp, RD Station
2. **Camada de Processamento** - Fila de webhooks com retry e dead letter queue
3. **Camada Central** - PostgreSQL Data Warehouse + Orchestrator
4. **Camada de IA** - Gateway unificado para TRAMON, LOVABLE, MANUS, ChatGPT
5. **Camada de Ação** - Dashboards, APIs, Alertas

---

## 2. SCHEMA DO BANCO DE DADOS (TABELAS PRINCIPAIS)

### Tabelas de Segurança e Auditoria
| Tabela | Descrição |
|--------|-----------|
| `security_events` | Eventos de segurança (HMAC inválido, tentativas de acesso) |
| `dead_letter_queue` | Webhooks que falharam após 3 tentativas |
| `audit_access_mismatches` | Discrepâncias entre pagamento e acesso |
| `audit_logs` | Log geral de auditoria |
| `activity_log` | Atividades de usuários |

### Tabelas de Processamento
| Tabela | Descrição |
|--------|-----------|
| `webhooks_queue` | Fila de webhooks para processamento |
| `logs_integracao_detalhado` | Logs detalhados de integrações |
| `comandos_ia_central` | Comandos e respostas das IAs |

### Tabelas de Negócio
| Tabela | Descrição |
|--------|-----------|
| `alunos` | Cadastro de alunos |
| `transacoes_hotmart_completo` | Transações da Hotmart |
| `usuarios_wordpress_sync` | Usuários sincronizados do WordPress |
| `affiliates` | Afiliados |
| `entradas` / `gastos` | Financeiro |
| `calendar_tasks` | Tarefas e agenda |

---

## 3. EDGE FUNCTIONS (SERVERLESS)

| Função | Propósito | Endpoint |
|--------|-----------|----------|
| `webhook-handler` | Recebe e valida webhooks | `/functions/v1/webhook-handler` |
| `queue-worker` | Processa fila de webhooks | `/functions/v1/queue-worker` |
| `orchestrator` | Cérebro lógico central | `/functions/v1/orchestrator` |
| `ia-gateway` | Gateway unificado para IAs | `/functions/v1/ia-gateway` |
| `reports-api` | API de relatórios e dashboards | `/functions/v1/reports-api` |
| `automacoes` | Automações programadas | `/functions/v1/automacoes` |
| `hotmart-webhook-processor` | Processador específico Hotmart | `/functions/v1/hotmart-webhook-processor` |
| `whatsapp-webhook` | Integração WhatsApp | `/functions/v1/whatsapp-webhook` |
| `wordpress-api` | Comunicação com WordPress | `/functions/v1/wordpress-api` |
| `ai-tramon` | Assistente TRAMON (restrito) | `/functions/v1/ai-tramon` |

---

## 4. SECRETS NECESSÁRIOS

**⚠️ NUNCA compartilhe estes valores! Apenas os nomes estão listados.**

| Secret | Descrição | Obrigatório |
|--------|-----------|-------------|
| `SUPABASE_URL` | URL do projeto Supabase | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço Supabase | ✅ |
| `LOVABLE_API_KEY` | Chave do Lovable AI Gateway | ✅ |
| `HOTMART_HOTTOK` | Token de validação Hotmart | ✅ |
| `HOTMART_CLIENT_ID` | Client ID Hotmart | ✅ |
| `HOTMART_CLIENT_SECRET` | Client Secret Hotmart | ✅ |
| `WHATSAPP_ACCESS_TOKEN` | Token do WhatsApp Business | ✅ |
| `WHATSAPP_VERIFY_TOKEN` | Token de verificação webhook | ✅ |
| `WHATSAPP_PHONE_NUMBER_ID` | ID do número WhatsApp | ✅ |
| `WP_API_URL` | URL da API WordPress | ✅ |
| `WP_API_TOKEN` | Token de autenticação WP | ✅ |
| `RESEND_API_KEY` | Chave do Resend para emails | ✅ |
| `YOUTUBE_API_KEY` | Chave da API YouTube | ⭕ |
| `FACEBOOK_ACCESS_TOKEN` | Token do Facebook/Instagram | ⭕ |

---

## 5. URLS E ENDPOINTS DE WEBHOOK

### Hotmart
```
https://fyikfsasudgzsjmumdlw.supabase.co/functions/v1/webhook-handler
Headers: X-Hotmart-Hottok: [SEU_HOTTOK]
```

### WhatsApp Business
```
Webhook URL: https://fyikfsasudgzsjmumdlw.supabase.co/functions/v1/whatsapp-webhook
Verify Token: [WHATSAPP_VERIFY_TOKEN]
```

### WordPress
```
https://fyikfsasudgzsjmumdlw.supabase.co/functions/v1/webhook-handler
Headers: X-WordPress-Webhook: true
```

---

## 6. COMO TROCAR DE FORNECEDOR EM 30 MINUTOS

### Passo 1: Exportar Dados (5 min)
```sql
-- Execute no SQL Editor do Supabase
COPY (SELECT * FROM alunos) TO '/tmp/alunos.csv' CSV HEADER;
COPY (SELECT * FROM transacoes_hotmart_completo) TO '/tmp/hotmart.csv' CSV HEADER;
COPY (SELECT * FROM usuarios_wordpress_sync) TO '/tmp/wordpress.csv' CSV HEADER;
```

### Passo 2: Revogar Acesso da Lovable (2 min)
1. Acesse o Supabase Dashboard
2. Vá em Settings > API
3. Regenere a `anon key` e `service_role key`
4. Atualize os secrets no novo ambiente

### Passo 3: Transferir Código (5 min)
1. Clone o repositório do GitHub (se conectado)
2. Ou exporte os arquivos via Lovable > Settings > Export

### Passo 4: Configurar Novo Ambiente (10 min)
1. Crie um novo projeto Supabase
2. Execute as migrations em ordem
3. Configure todos os secrets listados na seção 4
4. Atualize as URLs de webhook na Hotmart e WhatsApp

### Passo 5: Validar Funcionamento (8 min)
1. Teste o webhook-handler: `curl -X POST [URL] -d '{"test": true}'`
2. Verifique logs no Supabase Dashboard
3. Confirme que a fila está processando

---

## 7. MONITORAMENTO E ALERTAS

### Dashboard de Saúde
```
GET /functions/v1/reports-api?type=system_health
```

### Auditoria de Acesso
```
GET /functions/v1/reports-api?type=audit_access
```

### Dead Letter Queue
```
GET /functions/v1/reports-api?type=dlq
```

### Logs de Integração
```
GET /functions/v1/reports-api?type=logs
```

---

## 8. CONTATOS E SUPORTE

- **Proprietário:** Prof. Moisés Medeiros
- **Email:** moisesblank@gmail.com
- **Projeto:** https://lovable.dev/projects/6e913832-eb53-4c6f-8ce9-7c3cc0b04251

---

## 9. SLAs E MÉTRICAS

| Métrica | SLA | Descrição |
|---------|-----|-----------|
| Webhook Response | < 50ms | Tempo de resposta do webhook-handler |
| Queue Processing | < 30s | Tempo de processamento na fila |
| IA Response | < 15s | Tempo de resposta do ia-gateway |
| Dead Letter Rate | < 1% | Taxa de falhas permanentes |

---

## 10. PROCEDIMENTOS DE EMERGÊNCIA

### Webhook Handler Fora do Ar
1. Verificar logs: `supabase functions logs webhook-handler`
2. Reiniciar função: redesploy via Lovable
3. Verificar secrets estão configurados

### Fila Acumulando
1. Verificar queue-worker está rodando
2. Checar dead_letter_queue por erros
3. Aumentar batch_size temporariamente

### IA Não Responde
1. Verificar LOVABLE_API_KEY está válida
2. Checar rate limits
3. Verificar créditos disponíveis

---

*Documento gerado automaticamente pelo sistema TRAMON v9.0*
*Última atualização: 18/12/2025*
