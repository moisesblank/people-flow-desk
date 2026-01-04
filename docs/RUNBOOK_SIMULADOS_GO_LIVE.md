# 📋 RUNBOOK — SIMULADOS GO-LIVE

**Documento Operacional para Lançamento de Simulados com Modo Hard**
**Versão:** 1.0.0 | **Data:** 2026-01-04

---

## 🏛️ GOVERNANÇA

### Estrutura de Tabelas
| Tabela | Propósito |
|--------|-----------|
| `simulado_consent_terms` | Termos versionados (texto legal) |
| `simulado_consent_logs` | Registro de aceites (user_id, timestamp, fingerprint) |
| `simulado_feature_flags` | Flags globais (rollback, contingência) |
| `simulado_audit_logs` | Logs de auditoria persistentes |
| `simulado_ranking_snapshots` | Snapshots de ranking para auditoria |
| `simulado_ranking_disputes` | Contestações de alunos |
| `simulado_metrics` | Métricas operacionais |

### RPCs Disponíveis
| RPC | Propósito | Permissão |
|-----|-----------|-----------|
| `register_simulado_consent` | Registra aceite de termos | Autenticado |
| `get_simulado_feature_flag` | Consulta flag | Público |
| `log_simulado_audit` | Registra evento de auditoria | Autenticado |
| `create_ranking_snapshot` | Cria snapshot de ranking | Owner/Admin |
| `open_ranking_dispute` | Abre contestação | Autenticado |
| `record_simulado_metric` | Registra métrica | Autenticado |

---

## 🔒 A. CONSENTIMENTO LEGAL

### Checklist
- [x] Termo explícito antes do Hard Mode (SimuladoHardModeConsent.tsx)
- [x] Aceite registrado (user_id, timestamp, IP hash)
- [x] Texto jurídico versionado (v1.0)
- [x] Hook de registro (useSimuladoConsent)

### Como Funciona
1. Usuário clica em "Iniciar Simulado" (Hard Mode)
2. Tela de consentimento exibe regras
3. Usuário marca checkboxes e clica "Aceitar e Iniciar"
4. `register_simulado_consent` é chamado com:
   - `p_simulado_id`
   - `p_term_version` (ex: "v1.0")
   - `p_consent_type` ("hard_mode" ou "camera")
   - `p_device_fingerprint`
   - `p_user_agent_hash`

### Atualizar Termos
```sql
-- Desativar versão antiga
UPDATE simulado_consent_terms SET is_active = false WHERE is_active = true;

-- Inserir nova versão
INSERT INTO simulado_consent_terms (version, title, content, is_active, activated_at)
VALUES ('v1.1', 'Termos do Modo Hard', 'Texto completo...', true, now());
```

---

## 🏆 B. RANKING E AUDITORIA

### Critério de Desempate
1. **Score** (maior = melhor)
2. **Tempo de conclusão** (menor = melhor, via `finished_at`)
3. **Número de tentativas** (menor = melhor)

### Congelar Ranking
```sql
-- Via flag global
UPDATE simulado_feature_flags SET flag_value = true WHERE flag_key = 'ranking_frozen';

-- Via simulado específico
UPDATE simulados SET is_ranking_frozen = true WHERE id = 'SIMULADO_ID';
```

### Criar Snapshot de Ranking
```sql
SELECT create_ranking_snapshot(
  'SIMULADO_ID'::uuid,  -- NULL para global
  'freeze',             -- tipo: manual, scheduled, freeze
  'Congelamento para auditoria'
);
```

### Exportar Ranking
```sql
SELECT * FROM simulado_ranking_snapshots 
WHERE simulado_id = 'SIMULADO_ID' 
ORDER BY created_at DESC LIMIT 1;
```

### Processo de Contestação
1. Aluno clica em "Contestar" na tela de invalidação
2. Preenche formulário (tipo, descrição)
3. Sistema registra via `open_ranking_dispute`
4. Admin visualiza em painel de gestão
5. Admin resolve e atualiza status

```sql
-- Ver contestações pendentes
SELECT * FROM simulado_ranking_disputes 
WHERE status = 'pending' 
ORDER BY created_at;

-- Resolver contestação
UPDATE simulado_ranking_disputes 
SET status = 'resolved', 
    resolution = 'Tentativa mantida como inválida. Evidências confirmam violação.',
    resolved_at = now(),
    resolved_by = auth.uid()
WHERE id = 'DISPUTE_ID';
```

---

## 📊 C. OPERAÇÃO E MONITORAMENTO

### Métricas Básicas
| Métrica | Descrição |
|---------|-----------|
| `simulado.start` | Tentativas iniciadas |
| `simulado.finish` | Tentativas concluídas |
| `simulado.invalidate` | Tentativas invalidadas |
| `simulado.tab_switch` | Trocas de aba |
| `simulado.camera_denied` | Câmera negada |

### Consultar Métricas
```sql
-- Últimas 24h
SELECT metric_key, COUNT(*), AVG(metric_value)
FROM simulado_metrics
WHERE recorded_at > now() - interval '24 hours'
GROUP BY metric_key;
```

### Alertas de Anomalia
Monitorar no Supabase Dashboard:
- Taxa de invalidação > 30%
- Pico de erros
- Latência de RPCs

### Healthcheck
```sql
-- Verificar sistema ativo
SELECT * FROM simulado_feature_flags 
WHERE flag_key = 'simulados_enabled';

-- Verificar tentativas recentes
SELECT COUNT(*) FROM simulado_attempts 
WHERE started_at > now() - interval '1 hour';
```

---

## 🔁 D. ROLLBACK E CONTINGÊNCIA

### Feature Flags Globais
| Flag | Efeito |
|------|--------|
| `simulados_enabled` | Desativa TODO o sistema |
| `hard_mode_enabled` | Desativa Modo Hard (cai para normal) |
| `camera_monitoring_enabled` | Desativa câmera |
| `ranking_frozen` | Congela ranking |
| `new_attempts_blocked` | Bloqueia novas tentativas |

### Rollback de Emergência
```sql
-- Desativar Hard Mode globalmente
UPDATE simulado_feature_flags SET flag_value = false WHERE flag_key = 'hard_mode_enabled';

-- Bloquear novas tentativas
UPDATE simulado_feature_flags SET flag_value = true WHERE flag_key = 'new_attempts_blocked';

-- Desativar simulados completamente
UPDATE simulado_feature_flags SET flag_value = false WHERE flag_key = 'simulados_enabled';
```

### Rollback por Simulado
```sql
-- Forçar desativar Hard Mode em simulado específico
UPDATE simulados SET hard_mode_override = 'force_off' WHERE id = 'SIMULADO_ID';

-- Mensagem de manutenção
UPDATE simulados SET maintenance_message = 'Este simulado está em manutenção. Tente novamente em breve.' WHERE id = 'SIMULADO_ID';
```

### Plano B (Procedimento Completo)
1. **Detectar problema** (alertas, reclamações)
2. **Avaliar severidade**
   - P0: Desativar simulados
   - P1: Desativar Hard Mode
   - P2: Desativar câmera
3. **Executar rollback** (comandos SQL acima)
4. **Comunicar** (banner, email)
5. **Diagnosticar** (logs, métricas)
6. **Corrigir** (hotfix)
7. **Reativar** (reverter flags)

---

## 🧾 E. COMUNICAÇÃO AO ALUNO

### Telas Implementadas
| Tela | Arquivo | Propósito |
|------|---------|-----------|
| Consentimento | `SimuladoHardModeConsent.tsx` | Aceite de regras |
| Invalidação | `SimuladoInvalidatedScreen.tsx` | UX clara de erro |
| Contestação | `SimuladoDisputeModal.tsx` | Formulário de contestação |

### Mensagens de Erro
| Código | Mensagem |
|--------|----------|
| `tab_switch` | "Excesso de trocas de aba" |
| `camera_denied` | "Câmera não autorizada" |
| `timeout` | "Tempo esgotado" |
| `manual_invalidation` | "Invalidação manual" |

### Canal de Suporte
- Email: suporte@moisesmedeiros.com.br
- Assunto padrão: "Contestação Simulado: [TÍTULO]"

---

## ✅ CHECKLIST PRÉ-GO-LIVE

### A. Legal/Consentimento
- [x] Termo explícito antes do Hard Mode
- [x] Aceite registrado (user_id, timestamp, IP)
- [x] Texto jurídico revisado
- [x] Consentimento versionado

### B. Prêmio/Ranking
- [x] Critério de desempate documentado
- [x] Ranking congelável
- [x] Auditoria manual possível
- [x] Exportação de evidência
- [x] Processo de contestação definido

### C. Operação/Monitoramento
- [x] Métricas básicas criadas
- [x] Alertas de anomalia (via Supabase Dashboard)
- [x] Healthcheck (queries SQL)
- [x] Dashboard mínimo (SimuladoFeatureFlagsPanel)

### D. Rollback/Contingência
- [x] Feature flag global
- [x] Feature flag por simulado
- [x] Rollback documentado
- [x] Plano B (desativar Hard Mode)

### E. Comunicação ao Aluno
- [x] UX de erro clara
- [x] Tela de invalidação humana
- [x] Canal de suporte
- [x] FAQ do simulado

---

## 📞 CONTATOS DE EMERGÊNCIA

| Função | Nome | Contato |
|--------|------|---------|
| Owner | Moisés | moisesblank@gmail.com |
| Suporte Técnico | - | suporte@moisesmedeiros.com.br |

---

## 🔄 VERSÕES

| Data | Versão | Alteração |
|------|--------|-----------|
| 2026-01-04 | 1.0.0 | Documento inicial |

---

*Este documento deve ser revisado antes de cada lançamento de simulado com Modo Hard.*
