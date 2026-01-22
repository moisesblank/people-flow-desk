# 📊 MATRIZ OMEGA — FUNÇÕES REGISTRADAS

> Tabela completa de todas as funções do sistema SYNAPSE v15

---

## FORMATO

```
FunctionId | Categoria | Rota | Backend | Tabelas | RLS | Status
```

---

## NAVEGAÇÃO (F.NAV.*)

| FunctionId | Categoria | Rota | Backend | Tabelas | RLS | Status |
|------------|-----------|------|---------|---------|-----|--------|
| `F.NAV.DASHBOARD` | navigation | `/dashboard` | supabase-client | - | - | ✅ active |
| `F.NAV.DASHBOARD_EXECUTIVO` | navigation | `/dashboard-executivo` | supabase-client | - | - | ✅ active |
| `F.NAV.TAREFAS` | navigation | `/tarefas` | supabase-client | calendar_tasks | ✅ | ✅ active |
| `F.NAV.INTEGRACOES` | navigation | `/integracoes` | edge-function | - | - | ✅ active |
| `F.NAV.CALENDARIO` | navigation | `/calendario` | supabase-client | calendar_tasks | ✅ | ✅ active |
| `F.NAV.FUNCIONARIOS` | navigation | `/funcionarios` | supabase-client | funcionarios | ✅ | ✅ active |

---

## MARKETING (F.MKT.*)

| FunctionId | Categoria | Rota | Backend | Tabelas | RLS | Status |
|------------|-----------|------|---------|---------|-----|--------|
| `F.MKT.DASHBOARD` | navigation | `/marketing` | supabase-client | - | - | ✅ active |
| `F.MKT.LANCAMENTO` | navigation | `/lancamento` | edge-function | - | - | 🔄 coming_soon |
| `F.MKT.METRICAS` | navigation | `/metricas` | supabase-client | analytics_metrics | ✅ | ✅ active |
| `F.MKT.ARQUIVOS` | navigation | `/arquivos` | supabase-client | arquivos_universal | ✅ | ✅ active |

---

## AULAS (F.AULA.*)

| FunctionId | Categoria | Rota | Backend | Tabelas | RLS | Status |
|------------|-----------|------|---------|---------|-----|--------|
| `F.AULA.PROFESSOR` | navigation | `/area-professor` | supabase-client | lessons, modules | ✅ | ✅ active |
| `F.AULA.PLANEJAMENTO` | navigation | `/planejamento-aula` | supabase-client | lessons | ✅ | ✅ active |
| `F.AULA.LABORATORIO` | navigation | `/laboratorio` | edge-function | - | - | 🔄 coming_soon |
| `F.AULA.TURMAS_ONLINE` | navigation | `/turmas-online` | supabase-client | turmas | ✅ | ✅ active |
| `F.AULA.TURMAS_PRESENCIAIS` | navigation | `/turmas-presenciais` | supabase-client | turmas | ✅ | ✅ active |

---

## FINANÇAS (F.FIN.*)

| FunctionId | Categoria | Rota | Backend | Tabelas | RLS | Status |
|------------|-----------|------|---------|---------|-----|--------|
| `F.FIN.ENTRADAS` | navigation | `/entradas` | supabase-client | transactions, hotmart_transactions | ✅ | ✅ active |
| `F.FIN.EMPRESA` | navigation | `/financas-empresa` | supabase-client | company_fixed_expenses, company_extra_expenses | ✅ | ✅ active |
| `F.FIN.PESSOAL` | navigation | `/financas-pessoais` | supabase-client | personal_expenses | ✅ | ✅ active |
| `F.FIN.CONTABILIDADE` | navigation | `/contabilidade` | supabase-client | contabilidade | ✅ | ✅ active |
| `F.FIN.PAGAMENTOS` | navigation | `/pagamentos` | edge-function | transactions | ✅ | ✅ active |

---

## NEGÓCIOS (F.NEG.*)

| FunctionId | Categoria | Rota | Backend | Tabelas | RLS | Status |
|------------|-----------|------|---------|---------|-----|--------|
| `F.NEG.CURSOS` | navigation | `/cursos` | supabase-client | courses, modules, lessons | ✅ | ✅ active |
| `F.NEG.SIMULADOS` | navigation | `/simulados` | supabase-client | simulados | ✅ | ✅ active |
| `F.NEG.ALUNOS` | navigation | `/alunos` | supabase-client | alunos, profiles | ✅ | ✅ active |
| `F.NEG.PORTAL_ALUNO` | navigation | `/portal-aluno` | supabase-client | student_progress | ✅ | ✅ active |
| `F.NEG.RELATORIOS` | navigation | `/relatorios` | supabase-client | - | - | ✅ active |
| `F.NEG.GUIA` | navigation | `/guia` | supabase-client | - | - | ✅ active |

---

## ADMIN (F.ADM.*)

| FunctionId | Categoria | Rota | Backend | Tabelas | RLS | Status |
|------------|-----------|------|---------|---------|-----|--------|
| `F.ADM.PERMISSOES` | navigation | `/permissoes` | supabase-client | user_roles | ✅ | ✅ active |
| `F.ADM.CONFIGURACOES` | navigation | `/configuracoes` | supabase-client | settings | ✅ | ✅ active |

---

## OWNER (F.OWN.*)

| FunctionId | Categoria | Rota | Backend | Tabelas | RLS | Status |
|------------|-----------|------|---------|---------|-----|--------|
| `F.OWN.MONITORAMENTO` | navigation | `/monitoramento` | supabase-client | audit_logs | ✅ | ✅ active |
| `F.OWN.WHATSAPP` | navigation | `/central-whatsapp` | edge-function | whatsapp_conversations | ✅ | ✅ active |
| `F.OWN.DIAGNOSTICO_WPP` | navigation | `/diagnostico-whatsapp` | edge-function | - | - | ✅ active |
| `F.OWN.CENTRAL_MONITOR` | navigation | `/central-monitoramento` | supabase-client | - | - | ✅ active |
| `F.OWN.DIAGNOSTICO` | navigation | `/_owner/diagnostico` | hybrid | - | - | 🔄 coming_soon |

---

## CRUD (F.CRUD.*)

| FunctionId | Categoria | Tabela | Operações | RLS | Status |
|------------|-----------|--------|-----------|-----|--------|
| `F.CRUD.ALUNO_CREATE` | crud | alunos | INSERT | ✅ | ✅ active |
| `F.CRUD.ALUNO_READ` | crud | alunos | SELECT | ✅ | ✅ active |
| `F.CRUD.ALUNO_UPDATE` | crud | alunos | UPDATE | ✅ | ✅ active |
| `F.CRUD.ALUNO_DELETE` | crud | alunos | DELETE | ✅ | ✅ active |
| `F.CRUD.CURSO_CREATE` | crud | courses | INSERT | ✅ | ✅ active |
| `F.CRUD.CURSO_READ` | crud | courses | SELECT | ✅ | ✅ active |
| `F.CRUD.CURSO_UPDATE` | crud | courses | UPDATE | ✅ | ✅ active |
| `F.CRUD.CURSO_DELETE` | crud | courses | DELETE | ✅ | ✅ active |

---

## UPLOAD (F.UPL.*)

| FunctionId | Categoria | Bucket | Validação | Status |
|------------|-----------|--------|-----------|--------|
| `F.UPL.AVATAR` | upload | avatars | image/*, 5MB | ✅ active |
| `F.UPL.DOCUMENTO` | upload | documents | pdf/*, 20MB | ✅ active |
| `F.UPL.MATERIAL` | upload | materiais | *, 50MB | ✅ active |
| `F.UPL.LIVRO` | upload | livros | pdf/*, 100MB | ✅ active |

---

## DOWNLOAD (F.DWN.*)

| FunctionId | Categoria | Bucket | Expiração | Status |
|------------|-----------|--------|-----------|--------|
| `F.DWN.AVATAR` | download | avatars | público | ✅ active |
| `F.DWN.DOCUMENTO` | download | documents | 5min | ✅ active |
| `F.DWN.MATERIAL` | download | materiais | 15min | ✅ active |
| `F.DWN.LIVRO` | download | livros | 60min | ✅ active |

---

## ESTATÍSTICAS

| Métrica | Valor |
|---------|-------|
| Total de funções | **68+** |
| Funções ativas | **62** |
| Funções coming_soon | **6** |
| Cobertura RLS | **100%** |
| Cobertura telemetria | **100%** |

---

## ATUALIZADO EM

2025-12-23 por Sistema SYNAPSE v15
