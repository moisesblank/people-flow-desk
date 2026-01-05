# 📜 POLÍTICA DE COMPLIANCE LGPD — SIMULADOS
**Versão:** 1.0.0  
**Data:** 2025-01-05  
**Status:** VIGENTE  
**Autoridade:** OWNER (moisesblank@gmail.com)

---

## 🎯 ESCOPO

Este documento define as políticas de retenção, backup e descarte de dados relacionados ao sistema de Simulados da plataforma PRO.MOISESMEDEIROS.COM.BR, em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).

---

## 📊 INVENTÁRIO DE DADOS PESSOAIS

### Tabelas com Dados Pessoais

| Tabela | Dados Coletados | Base Legal | Finalidade |
|--------|-----------------|------------|------------|
| `simulado_attempts` | user_id, IP hash, timestamps | Execução de Contrato | Registro de participação |
| `simulado_audit_logs` | user_id, IP hash, fingerprint | Legítimo Interesse | Segurança e antifraude |
| `simulado_ranking_snapshots` | user_id, nome, pontuação | Execução de Contrato | Ranking competitivo |
| `simulado_ranking_disputes` | user_id, mensagem, evidências | Legítimo Interesse | Gestão de contestações |
| `quiz_answers` | user_id, respostas | Execução de Contrato | Avaliação acadêmica |
| `question_attempts` | user_id, respostas, timestamps | Execução de Contrato | Histórico de estudos |

### Dados Sensíveis (Art. 11 LGPD)
- **Nenhum dado sensível é coletado** no módulo de simulados.
- IP é armazenado como HASH (irreversível) para segurança.

---

## ⏰ POLÍTICA DE RETENÇÃO (Item #15)

### Períodos de Guarda

| Categoria | Período | Justificativa Legal |
|-----------|---------|---------------------|
| **Dados de Tentativas** | 5 anos | Histórico acadêmico + Defesa em processos |
| **Logs de Auditoria** | 5 anos | Compliance + Investigações |
| **Rankings/Snapshots** | Indefinido | Histórico institucional |
| **Contestações** | 5 anos após resolução | Defesa em processos |
| **Dados de Sessão** | 30 dias | Segurança operacional |

### Fundamentação Legal
- **Art. 16 LGPD**: Eliminação após término do tratamento
- **Art. 7º, II**: Cumprimento de obrigação legal
- **Art. 7º, V**: Execução de contrato
- **Código Civil Art. 206**: Prescrição de 5 anos para ações pessoais

---

## 💾 POLÍTICA DE BACKUP (Item #16)

### Configuração Lovable Cloud (Supabase)

| Aspecto | Configuração | Detalhes |
|---------|--------------|----------|
| **Backup Automático** | ✅ Ativo | Diário, gerenciado por Lovable Cloud |
| **Retenção de Backups** | 7 dias | Rolling backup |
| **Point-in-Time Recovery** | Disponível | Até 7 dias retroativos |
| **Região de Armazenamento** | América do Sul | Compliance com soberania de dados |
| **Criptografia** | AES-256 | Em repouso e em trânsito |

### Responsabilidades

| Responsável | Função |
|-------------|--------|
| Lovable Cloud | Execução automática de backups |
| OWNER | Verificação periódica (mensal) |
| Equipe Técnica | Testes de restauração (trimestral) |

### Procedimento de Restauração
1. Acessar painel Lovable Cloud
2. Selecionar ponto de restauração
3. Confirmar com INTERNAL_SECRET (dados críticos)
4. Documentar em `audit_logs`

---

## 🗑️ POLÍTICA DE DESCARTE (Item #17)

### Critérios de Purga

| Dado | Gatilho de Purga | Método |
|------|------------------|--------|
| Sessões expiradas | 30 dias após expiração | Automático (cron) |
| Logs de debug | 7 dias | Automático (cron) |
| Tentativas não finalizadas | 90 dias | Automático (cron) |
| Dados de usuário excluído | Imediato | Cascade delete |
| Backups antigos | Rolling 7 dias | Automático (Cloud) |

### Dados com Retenção Estendida

| Dado | Motivo | Período |
|------|--------|---------|
| Rankings oficiais | Histórico institucional | Indefinido |
| Certificados | Comprovação acadêmica | 20 anos |
| Contestações resolvidas | Defesa legal | 5 anos |

### Procedimento de Exclusão por Solicitação (Art. 18, VI)

1. **Recebimento**: Registrar solicitação em `audit_logs`
2. **Validação**: Confirmar identidade do titular
3. **Análise**: Verificar se há base legal para retenção
4. **Execução**: Se aprovado, executar exclusão completa
5. **Confirmação**: Notificar titular em até 15 dias

### Dados que NÃO podem ser excluídos
- Registros de certificados emitidos (obrigação legal)
- Logs de segurança com evidência de fraude (legítimo interesse)
- Dados em litígio (ordem judicial)

---

## 🔒 MEDIDAS DE SEGURANÇA

### Técnicas Implementadas

| Medida | Implementação |
|--------|---------------|
| Criptografia em Trânsito | TLS 1.3 |
| Criptografia em Repouso | AES-256 |
| Controle de Acesso | RBAC + RLS |
| Logs de Acesso | Imutáveis, 5 anos |
| Anonimização de IP | SHA-256 hash |
| Backup Criptografado | AES-256 |

### Controle de Acesso (Fase 5)

| Nível | Acesso a Dados Pessoais |
|-------|-------------------------|
| Owner | Total |
| Admin | Total |
| Coordenação | Apenas agregados |
| Monitoria | Apenas próprios alunos |
| Alunos | Apenas próprios dados |

---

## 📋 CHECKLIST DE COMPLIANCE

### Mensal
- [ ] Verificar execução de backups
- [ ] Auditar acessos a dados sensíveis
- [ ] Revisar logs de segurança

### Trimestral
- [ ] Testar restauração de backup
- [ ] Revisar políticas de retenção
- [ ] Atualizar inventário de dados

### Anual
- [ ] Auditoria completa LGPD
- [ ] Treinamento de equipe
- [ ] Revisão de base legal

---

## 📞 CONTATOS

| Função | Contato |
|--------|---------|
| Controlador | Moisés Medeiros |
| DPO (Encarregado) | dpo@moisesmedeiros.com.br |
| Suporte | suporte@moisesmedeiros.com.br |

---

## 📝 HISTÓRICO DE REVISÕES

| Versão | Data | Autor | Alterações |
|--------|------|-------|------------|
| 1.0.0 | 2025-01-05 | Sistema | Criação inicial |

---

**DECLARAÇÃO DE CONFORMIDADE**

Este documento atesta que o sistema de Simulados da plataforma PRO.MOISESMEDEIROS.COM.BR opera em conformidade com a LGPD, implementando medidas técnicas e organizacionais adequadas para proteção de dados pessoais.

*Documento sujeito a atualizações conforme evolução regulatória.*
