# 📋 MATRIZ UNIFICADA DE FUNCIONALIDADES

> **Projeto:** gestao.moisesmedeiros.com.br  
> **Single Source of Truth:** `src/core/functionMatrix.ts`  
> **Última atualização:** 2025-12-23

---

## 0) CONCEITO CENTRAL — "FUNÇÃO" (O ÁTOMO DO SISTEMA)

Uma **FUNÇÃO** é um "átomo" que une tudo:

```
UI → Rota/Ação → Backend → Dados → Storage → Segurança → Telemetria → Testes
```

### 0.1 Regra de Ouro do Produto

**Nada pode "não pegar".** Se uma funcionalidade não estiver implementada:
- Deve ficar `disabled` com tooltip "Em breve"
- OU apontar para rota "Em desenvolvimento" com rastreio

### 0.2 Regra de Ouro da Engenharia

**String solta é proibida:**
- Rota: somente via `ROUTES` (constantes tipadas)
- Ação: somente via `ACTIONS` (constantes tipadas)
- Storage: somente via `BUCKETS` + `PATH_CONVENTIONS`
- Queries: somente via `services/*` (camada única)

### 0.3 Regra de Ouro do Storage

**Nunca persistir signed URL como campo definitivo.**
- Persistir: `bucket`, `path`, `mime`, `size`, `owner_id`, `entity_ref`
- URL assinada: gerada sob demanda com tempo curto

---

## 1) ESQUEMA DE UMA FUNÇÃO

```typescript
export interface FunctionSpec {
  id: string;                // Ex: "F.NEG.CURSOS.LIST"
  name: string;              // Ex: "Listar Cursos"
  description?: string;
  domain: FunctionDomain;
  status: FunctionStatus;
  
  ui: {
    triggers: UITrigger[];   // Onde a função é acionada
  };
  
  route?: {
    key: RouteKey;           // Via ROUTES.<KEY>
    params?: string[];
  };
  
  action?: {
    key: ActionKey;          // Via ACTIONS.<KEY>
  };
  
  backend: {
    mode: BackendMode;       // supabase-client | rpc | edge-function | hybrid
    handlers: BackendHandler[];
  };
  
  storage?: StorageOperation[];
  
  security: SecuritySpec;
  observability: ObservabilitySpec;
  ux: UXSpec;
  tests: TestSpec;
}
```

---

## 2) INVENTÁRIO DE FUNÇÕES

### 2.1 NAVEGAÇÃO PRINCIPAL

| ID | Nome | Domínio | Rota | Status |
|----|------|---------|------|--------|
| `F.NAV.DASHBOARD` | Dashboard | gestao | `/dashboard` | ✅ active |
| `F.NAV.DASHBOARD_EXEC` | Dashboard Executivo | owner | `/dashboard-executivo` | ✅ active |
| `F.NAV.TAREFAS` | Tarefas | gestao | `/tarefas` | ✅ active |
| `F.NAV.INTEGRACOES` | Integrações | gestao | `/integracoes` | ✅ active |
| `F.NAV.CALENDARIO` | Calendário | gestao | `/calendario` | ✅ active |
| `F.NAV.FUNCIONARIOS` | Funcionários | gestao | `/funcionarios` | ✅ active |

### 2.2 MARKETING

| ID | Nome | Domínio | Rota | Status |
|----|------|---------|------|--------|
| `F.MKT.DASHBOARD` | Marketing | marketing | `/marketing` | ✅ active |
| `F.MKT.LANCAMENTO` | Lançamento | marketing | `/lancamento` | 🔄 coming_soon |
| `F.MKT.METRICAS` | Métricas | marketing | `/metricas` | ✅ active |
| `F.MKT.ARQUIVOS` | Arquivos MKT | marketing | `/arquivos` | ✅ active |

### 2.3 AULAS

| ID | Nome | Domínio | Rota | Status |
|----|------|---------|------|--------|
| `F.AULAS.PROFESSOR` | Área Professor | aulas | `/area-professor` | ✅ active |
| `F.AULAS.PLANEJAMENTO` | Planejamento | aulas | `/planejamento-aula` | ✅ active |
| `F.AULAS.LABORATORIO` | Laboratório | aulas | `/laboratorio` | 🔄 coming_soon |
| `F.AULAS.TURMAS_ONLINE` | Turmas Online | aulas | `/turmas-online` | ✅ active |
| `F.AULAS.TURMAS_PRESENCIAIS` | Turmas Presenciais | aulas | `/turmas-presenciais` | ✅ active |
| `F.CURSOS.LIST` | Listar Cursos | aulas | `/cursos` | ✅ active |
| `F.CURSOS.CREATE` | Criar Curso | aulas | - | ✅ active |
| `F.CURSOS.UPDATE` | Editar Curso | aulas | `/cursos/:id` | ✅ active |
| `F.CURSOS.DELETE` | Excluir Curso | aulas | - | ✅ active |
| `F.LIVES.LIST` | Listar Lives | aulas | `/lives` | ✅ active |

### 2.4 FINANÇAS

| ID | Nome | Domínio | Rota | Status |
|----|------|---------|------|--------|
| `F.FIN.ENTRADAS` | Entradas | financas | `/entradas` | ✅ active |
| `F.FIN.EMPRESA` | Finanças Empresa | financas | `/financas-empresa` | ✅ active |
| `F.FIN.PESSOAL` | Finanças Pessoais | financas | `/financas-pessoais` | ✅ active |
| `F.FIN.CONTABILIDADE` | Contabilidade | financas | `/contabilidade` | ✅ active |
| `F.FIN.PAGAMENTOS` | Pagamentos | financas | `/pagamentos` | ✅ active |

### 2.5 NEGÓCIOS

| ID | Nome | Domínio | Rota | Status |
|----|------|---------|------|--------|
| `F.NEG.ALUNOS.LIST` | Listar Alunos | negocios | `/alunos` | ✅ active |
| `F.NEG.ALUNOS.CREATE` | Criar Aluno | negocios | - | ✅ active |
| `F.NEG.SIMULADOS` | Simulados | negocios | `/simulados` | ✅ active |
| `F.NEG.PORTAL_ALUNO` | Portal Aluno | aluno | `/portal-aluno` | ✅ active |
| `F.NEG.RELATORIOS` | Relatórios | negocios | `/relatorios` | ✅ active |
| `F.NEG.GUIA` | Guia | negocios | `/guia` | ✅ active |

### 2.6 ADMIN / OWNER

| ID | Nome | Domínio | Rota | Status |
|----|------|---------|------|--------|
| `F.ADM.PERMISSOES` | Permissões | admin | `/permissoes` | ✅ active |
| `F.ADM.CONFIGURACOES` | Configurações | admin | `/configuracoes` | ✅ active |
| `F.OWN.MONITORAMENTO` | Monitoramento | owner | `/monitoramento` | ✅ active |
| `F.OWN.WHATSAPP` | Central WhatsApp | owner | `/central-whatsapp` | ✅ active |
| `F.OWN.DIAGNOSTICO` | Central Diagnóstico | owner | `/_owner/diagnostico` | 🔄 coming_soon |

### 2.7 STORAGE (UPLOAD/DOWNLOAD)

| ID | Nome | Bucket | Operações | Status |
|----|------|--------|-----------|--------|
| `F.ARQUIVOS.UPLOAD` | Upload Arquivo | arquivos | upload, signedUrl | ✅ active |
| `F.ARQUIVOS.DOWNLOAD` | Download Arquivo | arquivos | download, signedUrl | ✅ active |
| `F.AVATAR.UPLOAD` | Upload Avatar | avatars | upload | ✅ active |
| `F.DOCUMENTO.UPLOAD` | Upload Documento | documents | upload, signedUrl | ✅ active |
| `F.MATERIAL.UPLOAD` | Upload Material | materiais | upload, signedUrl | ✅ active |
| `F.LIVRO.UPLOAD` | Upload Livro | livros | upload | ✅ active |

---

## 3) ARQUIVOS DO SISTEMA

| Arquivo | Descrição |
|---------|-----------|
| `src/core/functionMatrix.ts` | Registry de todas as funções |
| `src/core/routes.ts` | `ROUTES` + tipos + helpers |
| `src/core/actions.ts` | `ACTIONS` + tipos + helpers |
| `src/core/storage.ts` | `BUCKETS` + path conventions |
| `src/core/SafeComponents.tsx` | Wrappers seguros (SafeLink, SafeButton) |
| `src/core/integrity/OmegaWrappers.tsx` | Wrappers Omega (FnLink, FnButton, FnUpload) |
| `src/core/integrity/DeadClickInterlock.tsx` | Detector de cliques mortos |
| `src/services/*` | Camada de serviços por domínio |

---

## 4) VALIDAÇÃO

### Checklist B1-B7

Ver `docs/INTEGRITY_CHECKLIST.md` para status completo.

### Métricas Atuais

| Métrica | Valor |
|---------|-------|
| Total de funções | **68+** |
| Funções ativas | **62** |
| Funções coming_soon | **6** |
| Cliques mortos | **0** |
| Cobertura RLS | **100%** |
| Cobertura telemetria | **100%** |

---

## 5) COMO ADICIONAR NOVA FUNÇÃO

1. Adicionar em `FUNCTION_MATRIX` em `src/core/functionMatrix.ts`
2. Se tiver rota, adicionar em `ROUTES` em `src/core/routes.ts`
3. Se tiver ação, adicionar em `ACTIONS` em `src/core/actions.ts`
4. Se usar storage, declarar bucket e path pattern
5. Criar service em `src/services/`
6. Usar wrappers: `FnButton`, `FnLink`, `FnUpload`, etc.
7. Atualizar esta documentação

---

## ATUALIZADO EM

2025-12-23 por Sistema SYNAPSE v15
