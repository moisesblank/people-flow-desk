# 🔐 MATRIZ DE ACESSO POR ROLE — SYNAPSE Ω v9.2b

> **Data:** 25/12/2025  
> **Status:** VIGENTE  
> **OWNER:** MOISESBLANK@GMAIL.COM

---

## 📊 ROLES DISPONÍVEIS

| Role | Código | Descrição | Escopo |
|------|--------|-----------|--------|
| 👑 Owner | `owner` | Proprietário absoluto | Tudo |
| 🛡️ Admin | `admin` | Administrador geral | Gestão completa |
| 👔 Employee | `employee` | Funcionário | Operações diárias |
| 📞 Suporte | `suporte` | Atendimento ao aluno | Dados de alunos |
| 📣 Marketing | `marketing` | Campanhas e leads | Marketing apenas |
| 🎓 Moderator | `moderator` | Moderação comunidade | Comunidade |
| 👤 User | `user` | Usuário padrão | Próprios dados |

---

## 🗺️ MATRIZ DE ACESSO POR DOMÍNIO

### pro.moisesmedeiros.com.br (Plataforma Principal)

| Recurso | owner | admin | employee | suporte | marketing | user |
|---------|:-----:|:-----:|:--------:|:-------:|:---------:|:----:|
| Dashboard Aluno | ✅ | ✅ | ✅ | ✅ | ❌ | ✅* |
| Cursos/Aulas | ✅ | ✅ | ✅ | 👁️ | ❌ | ✅* |
| Livros Digitais | ✅ | ✅ | ✅ | 👁️ | ❌ | ✅* |
| Comunidade | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Certificados | ✅ | ✅ | ✅ | 👁️ | ❌ | ✅* |
| Perfil Próprio | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

> *Requer role `beta` ativo para acesso completo

### gestao.moisesmedeiros.com.br (Backoffice)

| Recurso | owner | admin | employee | suporte | marketing | user |
|---------|:-----:|:-----:|:--------:|:-------:|:---------:|:----:|
| Dashboard Gestão | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Gestão Alunos | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Gestão Cursos | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Gestão Financeiro | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Gestão Afiliados | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Marketing Campaigns | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Marketing Leads | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Métricas Marketing | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Configurações | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Auditoria/Logs | ✅ | 👁️ | ❌ | ❌ | ❌ | ❌ |
| User Roles | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 🔒 ACESSO A DADOS SENSÍVEIS (PII)

### Tabela: profiles

| Coluna | owner | admin | employee | suporte | marketing | próprio |
|--------|:-----:|:-----:|:--------:|:-------:|:---------:|:-------:|
| cpf | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| email | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| phone | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |

### Tabela: alunos

| Coluna | owner | admin | employee | suporte | marketing | user |
|--------|:-----:|:-----:|:--------:|:-------:|:---------:|:----:|
| cpf | ✅ | ✅ | Mask | ✅ | Mask | ❌ |
| data_nascimento | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| email | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| telefone | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| valor_pago | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

### Tabela: affiliates

| Coluna | owner | admin | employee | suporte | marketing | user |
|--------|:-----:|:-----:|:--------:|:-------:|:---------:|:----:|
| pix | ✅ | ✅ | Mask | ❌ | ❌ | ❌ |
| agencia | ✅ | ✅ | Mask | ❌ | ❌ | ❌ |
| conta | ✅ | ✅ | Mask | ❌ | ❌ | ❌ |
| comissao_total | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

### Tabela: transacoes_hotmart_completo

| Coluna | owner | admin | employee | suporte | marketing | user |
|--------|:-----:|:-----:|:--------:|:-------:|:---------:|:----:|
| cpf | ✅ | ✅ | Mask | Mask | ❌ | ❌ |
| buyer_cpf | ✅ | ✅ | Mask | Mask | ❌ | ❌ |
| valor_bruto | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| webhook_raw | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 🛡️ FUNÇÕES DE VERIFICAÇÃO (SQL)

```sql
-- Verificar se é owner
public.is_owner(user_id)

-- Verificar se é admin ou owner
public.is_admin_or_owner(user_id)

-- Verificar se é suporte (inclui owner)
public.is_suporte(user_id)

-- Verificar se é marketing (inclui owner)
public.is_marketing(user_id)

-- Verificar se é staff de gestão
public.is_gestao_staff(user_id)

-- Verificar role específico
public.has_role(user_id, 'role_name')
public.has_role_typed(user_id, 'role'::app_role)
```

---

## 📋 VIEWS SEGURAS (Column-Level Security)

| View | Tabela Base | Colunas Mascaradas |
|------|-------------|-------------------|
| `profiles_secure` | profiles | cpf |
| `alunos_secure` | alunos | cpf, data_nascimento |
| `affiliates_secure` | affiliates | pix, agencia, conta |
| `transacoes_hotmart_secure` | transacoes_hotmart_completo | cpf, buyer_cpf |

### Regras de Mascaramento

- **CPF:** `***.XXX.***-**` (mostra apenas 3 dígitos centrais)
- **PIX:** `***XXXX` (mostra apenas últimos 4)
- **Conta:** `****-X` (mostra apenas último dígito)
- **Agência:** `****` (totalmente mascarado)

---

## 🚨 REGRAS DE AUDITORIA

Todas as ações em dados sensíveis são logadas em `audit_logs`:

| Ação | Quando | Dados Capturados |
|------|--------|------------------|
| `SENSITIVE_DATA_ACCESS` | Acesso a PII | user_id, tabela, timestamp |
| `ROLE_CHANGE` | Mudança de role | antes, depois, quem alterou |
| `LOGIN` | Login do usuário | IP, device, timestamp |
| `LOGOUT` | Logout | session_id, motivo |

---

## 📊 CAPACIDADES POR ROLE

### Owner
- `*` (todas as capacidades)

### Admin
- `users:read`, `users:write`, `users:delete`
- `courses:*`, `lessons:*`, `alunos:*`
- `affiliates:*`, `finance:read`
- `reports:*`, `settings:read`

### Employee
- `users:read`, `courses:read`, `lessons:read`
- `alunos:read`, `alunos:write`
- `affiliates:read`, `support:*`

### Suporte
- `alunos:read` (com CPF completo)
- `tickets:*`, `support:*`
- `courses:read`, `lessons:read`

### Marketing
- `marketing:*`, `leads:*`
- `campaigns:*`, `metrics:read`
- `alunos:read` (sem PII)

### User
- `profile:read`, `profile:write` (próprio)
- `courses:read` (se beta)
- `community:read`, `community:write`

---

## ✅ CHECKLIST DE SEGURANÇA

- [x] Roles definidos no enum `app_role`
- [x] Funções SECURITY DEFINER para verificação
- [x] Views seguras com column-level masking
- [x] RLS ativo em todas as tabelas com PII
- [x] Auditoria de acesso a dados sensíveis
- [x] Separação de roles em tabela dedicada `user_roles`
- [x] OWNER bypass apenas para UX (não server-side)

---

## 📝 HISTÓRICO

| Data | Versão | Alteração |
|------|--------|-----------|
| 25/12/2025 | 1.0 | Criação inicial + roles suporte/marketing |

---

**STATUS:** ✅ VIGENTE | **AUTORIDADE:** OWNER
