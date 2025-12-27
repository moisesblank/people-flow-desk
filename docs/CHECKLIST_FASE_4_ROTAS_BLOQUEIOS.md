# 🔍 CHECKLIST — FASE 4/6

## ROTAS & BLOQUEIOS (FRONTEND)

> **Regra:** Isolamento de blocos associativos — GESTAO ≠ ALUNOS
> **Data:** 2025-12-27
> **Status:** ✅ VALIDADO POR CÓDIGO

---

## 4.1 FUNCIONARIO acessa /gestaofc

| Resultado | |
|-----------|--|
| ✅ SIM | ☐ NÃO |

**Evidência (código-fonte):**

```typescript
// src/components/layout/RoleProtectedRoute.tsx:122
const isStaffRole = [
  'owner', 'admin', 'funcionario', 'employee', 
  'coordenacao', 'suporte', 'monitoria', 
  'marketing', 'contabilidade', 'professor', 'afiliado'
].includes(role || '');

// Linha 156-161: Se isGestaoPath && isStaffRole → PERMITE
if (isGestaoPath && isStaffRole) {
  return <>{children}</>; // ✅ ACESSO PERMITIDO
}
```

**Roles Permitidos em /gestaofc:**
- `owner`, `admin`, `funcionario`, `employee`, `coordenacao`
- `suporte`, `monitoria`, `marketing`, `contabilidade`, `professor`, `afiliado`

---

## 4.2 FUNCIONARIO NÃO acessa /alunos

| Resultado | |
|-----------|--|
| ✅ SIM | ☐ NÃO |

**Evidência (código-fonte):**

```typescript
// src/core/urlAccessControl.ts:126-131
export const ALUNO_ROLES: AppRole[] = [
  "owner",
  "admin",
  "beta",
  "aluno",
];
// ❌ NÃO INCLUI: funcionario, employee, suporte, coordenacao, etc.
```

```typescript
// src/components/layout/RoleProtectedRoute.tsx:164-172
// Se não tem permissão para a área → 404 GENÉRICO
if (!hasPermission) {
  console.log(`[RoleProtectedRoute] Acesso negado para role="${role}" em "${location.pathname}"`);
  return <NotFoundPage />; // ← 404 genérico
}
```

**Comportamento:**
- Funcionário tenta `/alunos` → `hasPermission = false` → **404 genérico**
- Não expõe existência da área (segurança por obscuridade)

---

## 4.3 BETA acessa /alunos

| Resultado | |
|-----------|--|
| ✅ SIM | ☐ NÃO |

**Evidência (código-fonte):**

```typescript
// src/core/urlAccessControl.ts:126-131
export const ALUNO_ROLES: AppRole[] = [
  "owner",
  "admin",
  "beta",    // ✅ INCLUÍDO
  "aluno",   // ✅ INCLUÍDO
];
```

```typescript
// src/core/urlAccessControl.ts:182-194
// ROLE_PERMISSIONS define áreas permitidas
beta: {
  areas: ["publico", "comunidade", "alunos"], // ✅ ALUNOS INCLUÍDO
  canCreate: false,
  canEdit: false,
  // ...
}
```

**Comportamento:**
- Role `beta` → `hasAccess("alunos") = true` → **ACESSO PERMITIDO**

---

## 4.4 BETA NÃO acessa /gestaofc

| Resultado | |
|-----------|--|
| ✅ SIM | ☐ NÃO |

**Evidência (código-fonte):**

```typescript
// src/components/layout/RoleProtectedRoute.tsx:121-122
const isGestaoPath = location.pathname.startsWith("/gestaofc");
const isStaffRole = [
  'owner', 'admin', 'funcionario', 'employee', 
  'coordenacao', 'suporte', 'monitoria', 
  'marketing', 'contabilidade', 'professor', 'afiliado'
].includes(role || '');
// ❌ 'beta' NÃO ESTÁ NA LISTA isStaffRole

// Linha 156-161
if (isGestaoPath && !isStaffRole) {
  // Beta tentando /gestaofc → 404 genérico
  return <NotFoundPage />;
}
```

**Comportamento:**
- Role `beta` + path `/gestaofc` → `isStaffRole = false` → **404 genérico**

---

## 4.5 Não logado tenta rota restrita → /auth

**Teste:** Aba anônima, acessar `/gestaofc`

| Resultado | |
|-----------|--|
| ✅ SIM | ☐ NÃO |

**Evidência (código-fonte):**

```typescript
// src/components/layout/RoleProtectedRoute.tsx:146-149
if (!user) {
  return <Navigate to="/auth" replace />;
}
```

```typescript
// src/components/layout/ProtectedRoute.tsx:21-23
if (!user) {
  return <Navigate to="/auth" replace />;
}
```

**Comportamento:**
- Sem sessão (`user = null`) → **Redirect para /auth**
- Aplica-se a TODAS as rotas protegidas

---

## 🔍 MATRIZ DE ACESSO POR BLOCO

| Bloco | Rotas | Roles Permitidos | Acesso Negado |
|-------|-------|------------------|---------------|
| **PUBLICO** | `/`, `/auth`, `/termos` | Todos | N/A |
| **COMUNIDADE** | `/comunidade/*` | owner, admin, beta, aluno, viewer | 404 genérico |
| **ALUNOS** | `/alunos/*` | owner, admin, beta, aluno | 404 genérico |
| **GESTAO** | `/gestaofc/*` | owner, admin, funcionario, employee, coordenacao, suporte, monitoria, marketing, contabilidade, professor, afiliado | 404 genérico |
| **OWNER** | `/gestaofc/central-*` | owner | 404 genérico |

---

## 🛡️ FLUXO DE DECISÃO DO GUARD

```
┌──────────────────────────────────────────────────────────────┐
│           RoleProtectedRoute Decision Flow                   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─ user === null? ─────────────── YES ──────► Navigate /auth│
│  │                                                           │
│  ├─ isOwnerEmail && (role=owner || loading)? ── YES ──► ✅   │
│  │                                                           │
│  ├─ isGestaoPath && isStaffRole? ────────────── YES ──► ✅   │
│  │                                                           │
│  ├─ isGestaoPath && !isStaffRole? ───────────── YES ──► 404  │
│  │                                                           │
│  ├─ hasPermission(currentArea)? ─────────────── YES ──► ✅   │
│  │                                                           │
│  └─ !hasPermission ─────────────────────────────────────► 404│
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔒 RESULTADO DA FASE 4/6

| Status | Condição |
|--------|----------|
| ✅ **APROVADO** | TODOS OS ITENS = SIM → AVANÇA PARA FASE 5 |
| ☐ BLOQUEADO | ALGUM ITEM = NÃO → PROCESSO BLOQUEADO |

---

## 📋 RESUMO EXECUTIVO

| Item | Teste | Status | Evidência |
|------|-------|--------|-----------|
| 4.1 | FUNCIONARIO → /gestaofc | ✅ PASS | isStaffRole check |
| 4.2 | FUNCIONARIO ✗ /alunos | ✅ PASS | ALUNO_ROLES não inclui |
| 4.3 | BETA → /alunos | ✅ PASS | ALUNO_ROLES inclui beta |
| 4.4 | BETA ✗ /gestaofc | ✅ PASS | isStaffRole não inclui beta |
| 4.5 | Anônimo → /auth | ✅ PASS | Navigate to="/auth" |

---

## ✅ CONFORMIDADE CONSTITUIÇÃO v2.0.0

```
╔══════════════════════════════════════════════════════════════════╗
║              FASE 4/6 — ROTAS & BLOQUEIOS                        ║
╠══════════════════════════════════════════════════════════════════╣
║ deterministic_guards_per_block        ✅ PASS                    ║
║ partial_rendering: forbidden          ✅ PASS                    ║
║ implicit_permissions: forbidden       ✅ PASS                    ║
║ explicit_only                         ✅ PASS                    ║
║ out_of_block_access: deny (404)       ✅ PASS                    ║
║ unauthenticated → /auth               ✅ PASS                    ║
╠══════════════════════════════════════════════════════════════════╣
║ RESULTADO: CONFORMIDADE TOTAL - AVANÇA PARA FASE 5               ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## 📁 ARQUIVOS RELACIONADOS

| Arquivo | Função |
|---------|--------|
| `src/components/layout/RoleProtectedRoute.tsx` | Guard central + isStaffRole |
| `src/components/layout/ProtectedRoute.tsx` | Guard simples (auth only) |
| `src/core/urlAccessControl.ts` | GESTAO_ROLES, ALUNO_ROLES, ROLE_PERMISSIONS |
| `src/routes/routeHelpers.tsx` | ProtectedPage wrapper |
| `src/pages/NotFound.tsx` | 404 genérico (não expõe área) |
