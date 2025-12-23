# 🚀 RUNBOOK - GO-LIVE 5.000 AO VIVO

**Documento Operacional para Eventos ao Vivo**

---

## 📋 CHECKLIST PRÉ-LIVE (T-24h até T-1h)

### T-24h (1 dia antes)
- [ ] **Congelar deploys** - Nenhuma alteração em produção
- [ ] **Revisar secrets** - Verificar validade de tokens/API keys
- [ ] **Verificar backups** - Confirmar PITR ativo no Supabase
- [ ] **Testar conectividade** - Ping em todos os providers (YouTube, Supabase, etc.)
- [ ] **Revisar rate limits** - Confirmar configuração de slow mode

### T-6h (6 horas antes)
- [ ] **Warmup de cache** - Acessar páginas críticas para popular cache
- [ ] **Verificar métricas baseline** - Anotar valores normais de CPU, RAM, conexões
- [ ] **Preparar banner de contingência** - Texto pronto para exibir se houver instabilidade
- [ ] **Testar embed alternativo** - Ter URL de backup do YouTube/Vimeo pronta

### T-1h (1 hora antes)
- [ ] **Ensaio interno** - Testar com 10-50 usuários da equipe
- [ ] **Verificar chat** - Enviar mensagens de teste
- [ ] **Verificar moderação** - Testar pin, delete, ban
- [ ] **Abrir dashboards** - Supabase, Central de IAs, Logs

---

## 📊 DASHBOARDS PARA MONITORAR

### 1. Supabase Dashboard
- **URL**: https://supabase.com/dashboard/project/fyikfsasudgzsjmumdlw
- **Métricas**:
  - Conexões ativas
  - CPU/RAM
  - Realtime connections
  - Storage egress

### 2. Central de IAs (Admin)
- **URL**: /admin/central-ias
- **Métricas**:
  - Status das IAs (online/offline)
  - Queue depth
  - Erros recentes

### 3. Logs
- **URL**: Supabase → Logs
- **Filtros**:
  - `level:error` - Erros
  - `function:chat` - Logs do chat

---

## 🔴 DURANTE A LIVE

### Monitoramento Contínuo (a cada 5 min)
1. [ ] Verificar conexões Realtime (< 5.000 = OK)
2. [ ] Verificar CPU do banco (< 80% = OK)
3. [ ] Verificar erros no chat (< 1% = OK)
4. [ ] Verificar latência API (p95 < 300ms = OK)

### Triggers de Ação

| Situação | Threshold | Ação |
|----------|-----------|------|
| Conexões > 4.500 | 90% capacidade | Ativar slow mode (10s) |
| CPU > 80% | Alto | Verificar queries lentas |
| Erros > 1% | Crítico | Ativar banner de instabilidade |
| Chat travou | Crítico | Limpar mensagens antigas |

### Comandos de Emergência

#### Ativar Slow Mode Máximo
```sql
UPDATE live_chat_config 
SET slow_mode_seconds = 15 
WHERE live_id = 'LIVE_ID_AQUI';
```

#### Limpar Chat (últimas 24h)
```sql
DELETE FROM live_chat_messages 
WHERE created_at < NOW() - INTERVAL '24 hours';
```

#### Desconectar Sessões Inativas
```sql
SELECT cleanup_expired_video_sessions_omega();
```

---

## 🆘 PLANO DE CONTINGÊNCIA

### Cenário 1: Chat Travou
1. Verificar conexões Realtime no Supabase
2. Se > limite, desconectar sessões antigas:
   ```sql
   DELETE FROM active_sessions WHERE last_activity_at < NOW() - INTERVAL '30 minutes';
   ```
3. Reiniciar subscription no frontend (orientar usuários a dar F5)

### Cenário 2: Vídeo Caiu
1. Verificar status do provider (YouTube/Vimeo)
2. Ativar embed alternativo:
   ```sql
   UPDATE live_events SET embed_url = 'URL_BACKUP' WHERE id = 'LIVE_ID';
   ```
3. Comunicar no chat: "Estamos corrigindo, aguarde"

### Cenário 3: Lentidão Geral
1. Verificar queries lentas:
   ```sql
   SELECT * FROM pg_stat_activity WHERE state = 'active' AND duration > interval '10 seconds';
   ```
2. Matar queries travadas:
   ```sql
   SELECT pg_cancel_backend(pid) FROM pg_stat_activity WHERE duration > interval '30 seconds';
   ```
3. Ativar modo mínimo (desabilitar features não essenciais)

### Cenário 4: Supabase Fora
1. Ativar página de fallback (banner estático)
2. Comunicar nas redes sociais
3. Aguardar status do Supabase: https://status.supabase.com

---

## 📝 PÓS-LIVE

### Imediatamente Após (T+0 a T+1h)
- [ ] **Salvar métricas** - Screenshot dos dashboards
- [ ] **Exportar logs** - Filtrar erros e warnings
- [ ] **Feedback da equipe** - O que funcionou? O que falhou?

### Dia Seguinte (T+24h)
- [ ] **Relatório de incidentes** - Documentar qualquer problema
- [ ] **Análise de custos** - Verificar consumo de egress, invocações
- [ ] **Lições aprendidas** - Atualizar este runbook

### Template de Relatório Pós-Live

```markdown
# Relatório Pós-Live - [DATA]

## Resumo
- **Pico de usuários**: X
- **Mensagens no chat**: X
- **Duração**: X horas
- **Incidentes**: X

## Métricas
- CPU máximo: X%
- Conexões máximo: X
- Erros: X%
- Latência p95: Xms

## Incidentes
1. [HH:MM] Descrição - Ação tomada - Resultado

## Custos
- Egress: $X
- Invocações Edge: X
- Realtime messages: X

## Lições Aprendidas
- O que funcionou bem
- O que precisa melhorar
```

---

## 📞 CONTATOS DE EMERGÊNCIA

| Função | Nome | Contato |
|--------|------|---------|
| Owner | Moisés | moisesblank@gmail.com |
| Supabase Support | - | support@supabase.io |
| Status Supabase | - | https://status.supabase.com |

---

## 🔄 VERSÕES

| Data | Versão | Alteração |
|------|--------|-----------|
| 2025-12-23 | 1.0 | Documento inicial |

---

*Este documento deve ser revisado antes de cada evento ao vivo.*
