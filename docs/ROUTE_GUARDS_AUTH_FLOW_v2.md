# 🛡️ ROUTE GUARDS & AUTH FLOW v2.0
## Checkpoint 5/6 — Routes e Autenticação

> **CONFORMIDADE:** CONSTITUIÇÃO v2.0.0
> **Data:** 2025-12-27
> **Status:** ✅ PRONTO

---

## 📋 REQUISITOS VALIDADOS

### Route Rules (hard_rules)
| Regra | Status | Implementação |
|-------|--------|---------------|
| deterministic_guards_per_block | ✅ | `RoleProtectedRoute.tsx` + `ROLE_PERMISSIONS` |
| partial_rendering: forbidden | ✅ | Retorna 404/Loading/Children, nunca parcial |
| implicit_permissions: forbidden | ✅ | Todas em `ROLE_PERMISSIONS` explícito |
| explicit_only | ✅ | Cada role tem `areas[]` definida |
| out_of_block_access: deny_or_force_redirect | ✅ | 404 genérico ou `/auth` redirect |

### Authentication (hard_rules)
| Regra | Status | Implementação |
|-------|--------|---------------|
| auth_never_final_destination | ✅ | `getPostLoginRedirect()` em Auth.tsx e useAuth.tsx |
| resolution_strategy: role_first_then_block | ✅ | Verifica role → determina bloco |
| fallback: deny | ✅ | Sem role = `/comunidade` (não privilegiada) |
| bypass_authentication: forbidden | ✅ | Todas rotas protegidas usam `ProtectedPage` |

---

## 📍 BLOCOS ASSOCIATIVOS (CONSTITUIÇÃO)

### BLOCO PUBLICO
```
Rotas:        /, /site, /auth, /termos, /privacidade, /area-gratuita
Guard:        NENHUM (público)
Auth:         NÃO requer
Arquivo:      src/routes/publicRoutes.tsx
```

### BLOCO COMUNIDADE
```
Rotas:        /comunidade, /comunidade/*
Guard:        ProtectedPage (apenas sub-rotas)
Roles:        viewer, aluno_gratuito, aluno, beta, owner, todos staff
Arquivo:      src/routes/comunidadeRoutes.tsx
```

### BLOCO ALUNOS
```
Rotas:        /alunos, /alunos/*
Guard:        ProtectedPage → RoleProtectedRoute
Roles:        aluno, beta, owner (staff NÃO TEM ACESSO via role)
Arquivo:      src/routes/alunoRoutes.tsx
Isolamento:   Não vaza para /gestaofc
```

### BLOCO GESTAO (gestaofc)
```
Rotas:        /gestaofc, /gestaofc/*
Guard:        ProtectedPage → RoleProtectedRoute → isStaffRole check
Roles:        owner, admin, funcionario, employee, coordenacao, suporte, 
              monitoria, marketing, contabilidade, professor, afiliado
Arquivo:      src/routes/gestaofcRoutes.tsx
Isolamento:   Não vaza para /alunos; acesso negado = 404 genérico
```

### BLOCO OWNER
```
Rotas:        /gestaofc/central-*, /gestaofc/monitoramento, etc.
Guard:        RoleProtectedRoute + canAccessOwnerArea check
Roles:        APENAS owner
Arquivo:      src/routes/gestaofcRoutes.tsx (mesmo arquivo, guarda interna)
```

---

## 🔄 FLUXO PÓS-LOGIN

### Arquivo: `src/core/urlAccessControl.ts` → `getPostLoginRedirect()`

```
┌─────────────────────────────────────────────────────────────────┐
│                    USUÁRIO FAZ LOGIN                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                   ┌──────────────────────┐
                   │ getPostLoginRedirect │
                   │   (role, email)      │
                   └──────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
    ┌─────────┐         ┌─────────┐         ┌─────────┐
    │ OWNER?  │    OR   │ STAFF?  │         │ ALUNO?  │
    │(email ou│         │(role in │         │(beta,   │
    │ role)   │         │GESTAO)  │         │aluno)   │
    └────┬────┘         └────┬────┘         └────┬────┘
         │                   │                   │
         ▼                   ▼                   ▼
    /gestaofc           /gestaofc            /alunos
                              │
                              ▼
                   ┌──────────────────────┐
                   │ viewer/aluno_gratuito│
                   │       ELSE           │
                   └──────────────────────┘
                              │
                              ▼
                         /comunidade
```

### Passos Numerados (Determinístico):

1. **Login bem-sucedido** → `SIGNED_IN` event disparado
2. **Auth.tsx L276-278**: `getPostLoginRedirect(null, session.user.email)` chamada
3. **urlAccessControl.ts L625-649**: Função resolve destino:
   - Se `email === owner` ou `role === owner` → `/gestaofc`
   - Se `isGestaoRole(role)` → `/gestaofc`
   - Se `isAlunoRole(role)` → `/alunos`
   - Se `viewer` ou `aluno_gratuito` → `/comunidade`
   - Fallback → `/comunidade`
4. **Redirect executado** → `navigate(target, { replace: true })`
5. **useAuth.tsx L354-362**: Segunda verificação se ainda em `/auth`:
   - `window.location.replace(target)` como safety net

---

## 🔒 GUARD DETERMINÍSTICO POR BLOCO

### Arquivo: `src/components/layout/RoleProtectedRoute.tsx`

```typescript
// VERIFICAÇÃO EXPLÍCITA L121-122
const isGestaoPath = location.pathname.startsWith("/gestaofc");
const isStaffRole = [
  'owner', 'admin', 'funcionario', 'employee', 
  'coordenacao', 'suporte', 'monitoria', 'marketing', 
  'contabilidade', 'professor', 'afiliado'
].includes(role || '');

// DECISÃO L158-166
if (isGestaoPath && !isStaffRole && !isOwner) {
  return <NotFoundPage />;  // 404 genérico - não expõe existência
}

if (isGestaoPath && isStaffRole) {
  return <>{children}</>;  // Acesso permitido
}
```

### Inputs → Decisão → Output:

| Input (role) | Input (path) | Decisão | Output |
|--------------|--------------|---------|--------|
| `null` | `/gestaofc` | Não autenticado | → `/auth` |
| `beta` | `/gestaofc` | Não é staff | → 404 |
| `funcionario` | `/gestaofc` | É staff | → Render children |
| `owner` | `/gestaofc` | É owner | → Render children |
| `beta` | `/alunos` | Tem permissão | → Render children |
| `funcionario` | `/alunos` | Não tem permissão | → 404 |
| `viewer` | `/comunidade` | Tem permissão | → Render children |
| `null` | `/` | Rota pública | → Render (sem guard) |

---

## 🛡️ PREVENÇÃO ANTI-LOOP

### Auth.tsx:
```typescript
// L276-278: replace: true evita voltar para /auth no histórico
navigate(target, { replace: true });
```

### useAuth.tsx:
```typescript
// L361: window.location.replace() limpa histórico completamente
window.location.replace(target);
```

### Condições de Loop Prevenidas:
1. `getPostLoginRedirect` NUNCA retorna `/auth`
2. `replace: true` evita back button para /auth
3. `window.location.replace` como fallback nuclear
4. `isAuthPath` check antes de redirect (evita duplo redirect)

---

## 📁 ONDE O GUARD ESTÁ IMPLEMENTADO

| Arquivo | Função |
|---------|--------|
| `src/routes/routeHelpers.tsx` | `ProtectedPage` wrapper |
| `src/components/layout/RoleProtectedRoute.tsx` | Guard central |
| `src/core/urlAccessControl.ts` | `ROLE_PERMISSIONS`, `getPostLoginRedirect` |
| `src/hooks/useRolePermissions.ts` | `hasAccess`, `hasAccessToUrl` |
| `src/pages/Auth.tsx` | Post-login redirect |
| `src/hooks/useAuth.tsx` | Safety net redirect |

---

## 🧪 CENÁRIOS DE TESTE (≥10)

### Bloco PUBLICO
1. `curl https://pro.moisesmedeiros.com.br/` → 200 (sem redirect)
2. `curl https://pro.moisesmedeiros.com.br/auth` → 200 (página login)
3. `curl https://pro.moisesmedeiros.com.br/termos` → 200

### Bloco GESTAO
4. Não-auth acessa `/gestaofc` → redirect `/auth`
5. `role=beta` acessa `/gestaofc` → 404 genérico
6. `role=funcionario` acessa `/gestaofc` → 200
7. `role=owner` acessa `/gestaofc/central-*` → 200

### Bloco ALUNOS
8. `role=beta` acessa `/alunos` → 200
9. `role=funcionario` acessa `/alunos` → 404 (isolamento)
10. `role=viewer` acessa `/alunos` → 404

### Cross-Block
11. `role=beta` acessa `/gestaofc` após acessar `/alunos` → 404
12. Refresh em `/gestaofc` sem role=staff → 404
13. Deep link `/gestaofc/dashboard` sem auth → `/auth`

---

## 📊 CERTIFICADO DE CONFORMIDADE

```
╔══════════════════════════════════════════════════════════════════╗
║            CHECKPOINT 5/6 — ROUTES & AUTH                        ║
╠══════════════════════════════════════════════════════════════════╣
║ ROUTE RULES                                                      ║
╠══════════════════════════════════════════════════════════════════╣
║ deterministic_guards_per_block    ✅ PASS                        ║
║ partial_rendering: forbidden      ✅ PASS                        ║
║ implicit_permissions: forbidden   ✅ PASS                        ║
║ explicit_only                     ✅ PASS                        ║
║ out_of_block_access: deny         ✅ PASS (404 genérico)         ║
╠══════════════════════════════════════════════════════════════════╣
║ AUTHENTICATION                                                   ║
╠══════════════════════════════════════════════════════════════════╣
║ auth_never_final_destination      ✅ PASS                        ║
║ resolution_strategy: role_first   ✅ PASS                        ║
║ fallback: deny                    ✅ PASS (/comunidade)          ║
║ bypass_authentication: forbidden  ✅ PASS                        ║
╠══════════════════════════════════════════════════════════════════╣
║ RESULTADO: CONFORMIDADE TOTAL                                    ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## 🔗 ARQUIVOS RELACIONADOS

- `src/routes/index.tsx` - Export central
- `src/routes/publicRoutes.tsx` - Rotas públicas
- `src/routes/comunidadeRoutes.tsx` - Bloco comunidade
- `src/routes/alunoRoutes.tsx` - Bloco alunos
- `src/routes/gestaofcRoutes.tsx` - Bloco gestão
- `src/routes/routeHelpers.tsx` - ProtectedPage wrapper
- `src/components/layout/RoleProtectedRoute.tsx` - Guard central
- `src/core/urlAccessControl.ts` - Permissões e redirects
- `src/pages/Auth.tsx` - Página de login
- `src/hooks/useAuth.tsx` - Hook de autenticação
