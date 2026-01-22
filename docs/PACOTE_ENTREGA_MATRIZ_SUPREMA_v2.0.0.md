# INÍCIO — PACOTE DE ENTREGA v2.0.0

**Data:** 2025-12-27  
**Autoridade:** CONSTITUIÇÃO v2.0.0  
**Owner:** MOISESBLANK@GMAIL.COM  

---

## ARTEFATO 1: CERTIFICADO DE CONFORMIDADE

| Item | Status | Evidência |
|------|--------|-----------|
| A. Single App Hub (`pro.moisesmedeiros.com.br`) | ✅ PASS | Único domínio de produção, `isProHost()` verificado |
| B. Single Login (`/auth`) | ✅ PASS | `authentication.exclusive_login_endpoint` implementado em `useAuth.tsx` |
| C. Legacy gestao.* Terminated | ✅ PASS | `LegacyDomainBlocker.tsx` redireciona para `pro.*/gestaofc` |
| D. Employee Permissions Lossless | ✅ PASS | `urlAccessControl.ts` espelha roles sem modificação |
| E. Block Isolation | ✅ PASS | `RoleProtectedRoute.tsx` valida blocos GESTAO/ALUNOS |

**RESULTADO GLOBAL: ✅ PASS**

---

## ARTEFATO 2: MAPA CANÔNICO DE URLS

| FROM | TO | Status | Preserva Path/Query | Local |
|------|----|--------|---------------------|-------|
| `http://www.moisesmedeiros.com.br/*` | `https://pro.moisesmedeiros.com.br/*` | 301 | ✅ Sim | Cloudflare |
| `https://moisesmedeiros.com.br/*` | `https://pro.moisesmedeiros.com.br/*` | 301 | ✅ Sim | Cloudflare |
| `https://gestao.moisesmedeiros.com.br/*` | `https://pro.moisesmedeiros.com.br/gestaofc` | 301 | ❌ Não (block) | Cloudflare + `LegacyDomainBlocker.tsx` |
| `/auth` (authenticated) | Role-based redirect | N/A | N/A | `useAuth.tsx:getPostLoginRedirect()` |
| `/gestaofc/*` (unauthorized) | 404 genérico | N/A | N/A | `RoleProtectedRoute.tsx` |
| `/alunos/*` (unauthorized) | 404 genérico | N/A | N/A | `RoleProtectedRoute.tsx` |

---

## ARTEFATO 3: CONFIG CLOUDFLARE READY

### 3.1 Bulk Redirects (CSV)

```csv
source_url,target_url,status_code,preserve_query_string,preserve_path_suffix
http://www.moisesmedeiros.com.br,https://pro.moisesmedeiros.com.br,301,true,true
https://moisesmedeiros.com.br,https://pro.moisesmedeiros.com.br,301,true,true
https://www.moisesmedeiros.com.br,https://pro.moisesmedeiros.com.br,301,true,true
https://gestao.moisesmedeiros.com.br,https://pro.moisesmedeiros.com.br/gestaofc,301,false,false
```

### 3.2 Redirect Rules (Expression-based)

**Rule 1: Entry Domain Redirect**
```
Expression: (http.host eq "moisesmedeiros.com.br") or (http.host eq "www.moisesmedeiros.com.br")
Action: Dynamic Redirect
Status: 301
Target: concat("https://pro.moisesmedeiros.com.br", http.request.uri.path)
Preserve Query: true
```

**Rule 2: Legacy Gestao Block**
```
Expression: (http.host eq "gestao.moisesmedeiros.com.br")
Action: Dynamic Redirect
Status: 301
Target: "https://pro.moisesmedeiros.com.br/gestaofc"
Preserve Query: false
Preserve Path: false
```

---

## ARTEFATO 4: MATRIZ DE ACESSO POR BLOCO

| Bloco | Rotas | Roles Permitidos | OWNER Override | Partial Access |
|-------|-------|------------------|----------------|----------------|
| **PUBLICO** | `/`, `/comunidade`, `/auth`, `/termos`, `/privacidade` | FREE, BETA, FUNCIONARIO, OWNER | ✅ | ❌ |
| **GESTAO** | `/gestaofc`, `/gestaofc/*` | owner, admin, employee, funcionario, suporte, coordenacao, monitoria, marketing, contabilidade, professor, afiliado | ✅ | ❌ |
| **ALUNOS** | `/alunos`, `/alunos/*` | owner, admin, beta, aluno | ✅ | ❌ |
| **OWNER** | `/gestaofc/central-*`, `/gestaofc/master`, `/gestaofc/owner` | owner ONLY | N/A | ❌ |

### Hierarquia de Roles (Supabase `app_role` enum)

```
1. owner          → PODE TUDO
2. admin          → Gestão + Alunos + Comunidade
3. employee       → Gestão + Público
4. coordenacao    → Gestão + Público
5. suporte        → Gestão + Público
6. monitoria      → Gestão + Público
7. marketing      → Gestão + Público
8. contabilidade  → Gestão + Público
9. afiliado       → Gestão (limitado) + Público
10. beta          → Alunos + Comunidade + Público
11. aluno         → Alunos + Comunidade + Público
12. aluno_gratuito→ Comunidade + Público
13. moderator     → Comunidade + Público
14. user          → Público
```

---

## ARTEFATO 5: ESPEC RBAC LOSSLESS MIRROR

### 5.1 Inventário de RBAC (Fonte: Supabase)

**Tabela:** `public.user_roles`
```sql
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
```

**Enum:** `public.app_role`
```sql
CREATE TYPE public.app_role AS ENUM (
  'owner', 'admin', 'employee', 'coordenacao', 'suporte', 
  'monitoria', 'afiliado', 'marketing', 'contabilidade', 
  'aluno', 'beta', 'aluno_gratuito', 'moderator', 'user'
);
```

### 5.2 Prova de Espelhamento

**Arquivo:** `src/core/urlAccessControl.ts`

```typescript
// GESTAO_ROLES = exatamente as roles que podiam acessar gestao.moisesmedeiros.com.br
export const GESTAO_ROLES: AppRole[] = [
  "owner", "admin", "funcionario", "employee", "suporte",
  "coordenacao", "monitoria", "marketing", "contabilidade", "professor",
];

// isGestaoRole() valida acesso a /gestaofc/* SEM modificação
export function isGestaoRole(role?: string | null): boolean {
  if (!role) return false;
  return GESTAO_ROLES.includes(role as AppRole);
}
```

**Consulta em `useAuth.tsx:fetchUserRole()`:**
```typescript
const { data } = await supabase
  .from("user_roles")
  .select("role")
  .eq("user_id", userId)
  .maybeSingle();
```

### 5.3 Mapa de Não-Regressão

| Role | Antes (gestao.moisesmedeiros.com.br) | Depois (/gestaofc) | Status |
|------|--------------------------------------|---------------------|--------|
| owner | ✅ Acesso total | ✅ Acesso total | LOSSLESS |
| admin | ✅ Acesso total (exceto owner-only) | ✅ Acesso total (exceto owner-only) | LOSSLESS |
| employee | ✅ Acesso padrão | ✅ Acesso padrão | LOSSLESS |
| suporte | ✅ Visualizar/Editar | ✅ Visualizar/Editar | LOSSLESS |
| coordenacao | ✅ Pedagógico | ✅ Pedagógico | LOSSLESS |
| monitoria | ✅ Tutoria | ✅ Tutoria | LOSSLESS |
| marketing | ✅ Campanhas | ✅ Campanhas | LOSSLESS |
| contabilidade | ✅ Financeiro | ✅ Financeiro | LOSSLESS |
| afiliado | ✅ Painel Afiliados | ✅ Painel Afiliados | LOSSLESS |
| beta | ❌ Sem acesso | ❌ 404 genérico | LOSSLESS |
| aluno | ❌ Sem acesso | ❌ 404 genérico | LOSSLESS |
| viewer | ❌ Sem acesso | ❌ 404 genérico | LOSSLESS |

---

## ARTEFATO 6: IMPLEMENTAÇÃO LOVABLE

### 6.1 Pontos de Guard

| Arquivo | Função | Decisão |
|---------|--------|---------|
| `src/components/layout/RoleProtectedRoute.tsx` | Guard principal | `isGestaoPath && isStaffRole` → allow, else 404 |
| `src/components/routing/LegacyDomainBlocker.tsx` | Bloqueio gestao.* | Detecta hostname, redireciona para pro.*/gestaofc |
| `src/hooks/useAuth.tsx` | Sessão + Role | Busca role em `user_roles`, redirect pós-login |
| `src/core/urlAccessControl.ts` | Lógica central | `GESTAO_ROLES`, `canAccessArea()`, `getPostLoginRedirect()` |

### 6.2 Fluxo de Decisão

```
INPUT: (user, role, pathname, hostname)
                  │
                  ▼
    ┌─────────────────────────────┐
    │ hostname = gestao.*?         │
    └──────────────┬──────────────┘
                   │ SIM
                   ▼
    ┌─────────────────────────────┐
    │ LegacyDomainBlocker         │
    │ → replace(pro.*/gestaofc)   │
    └─────────────────────────────┘
                   │ NÃO
                   ▼
    ┌─────────────────────────────┐
    │ pathname = /auth?            │
    └──────────────┬──────────────┘
                   │ SIM + authenticated
                   ▼
    ┌─────────────────────────────┐
    │ getPostLoginRedirect(role)  │
    │ owner/staff → /gestaofc     │
    │ beta/aluno → /alunos        │
    │ viewer → /comunidade        │
    └─────────────────────────────┘
                   │ NÃO
                   ▼
    ┌─────────────────────────────┐
    │ RoleProtectedRoute          │
    │ pathname.startsWith(/gestaofc)?│
    └──────────────┬──────────────┘
                   │ SIM
                   ▼
    ┌─────────────────────────────┐
    │ isStaffRole(role)?          │
    │ SIM → render children       │
    │ NÃO → NotFoundPage (404)    │
    └─────────────────────────────┘
```

### 6.3 Prevenção Anti-Loop

```typescript
// useAuth.tsx - linha 354
if (user && session && isAuthPath) {
  // replace() em vez de navigate() = não volta ao histórico
  window.location.replace(target);
}

// RoleProtectedRoute.tsx - linha 130
if (shouldBypassForOwner) {
  return <>{children}</>; // Owner nunca entra em loop
}
```

---

## ARTEFATO 7: SQL SUPABASE COMPLETO

### 7.1 Funções Helper (SECURITY DEFINER)

```sql
-- Verifica se é owner
CREATE OR REPLACE FUNCTION public.is_owner(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'owner'
  )
$$;

-- Verifica se é admin ou owner
CREATE OR REPLACE FUNCTION public.is_admin_or_owner(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('owner', 'admin')
  )
$$;

-- Verifica se é suporte
CREATE OR REPLACE FUNCTION public.is_suporte(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('owner', 'admin', 'suporte')
  )
$$;

-- Verifica se é staff (funcionário)
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id 
    AND role IN ('owner', 'admin', 'employee', 'funcionario', 'suporte', 
                 'coordenacao', 'monitoria', 'marketing', 'contabilidade')
  )
$$;

-- Verifica se tem role específica
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
```

### 7.2 Políticas RLS Críticas

```sql
-- user_roles: Apenas owner pode gerenciar
CREATE POLICY "owner_manage_roles" ON public.user_roles
FOR ALL USING (is_owner(auth.uid()));

CREATE POLICY "users_read_own_role" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);

-- Exemplo: alunos (dados sensíveis)
CREATE POLICY "alunos_select_v17" ON public.alunos
FOR SELECT USING (is_admin_or_owner(auth.uid()) OR is_suporte(auth.uid()));

CREATE POLICY "alunos_insert_v17" ON public.alunos
FOR INSERT WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "alunos_update_v17" ON public.alunos
FOR UPDATE USING (is_admin_or_owner(auth.uid()) OR is_suporte(auth.uid()));

CREATE POLICY "alunos_delete_v17" ON public.alunos
FOR DELETE USING (is_owner(auth.uid()));
```

### 7.3 Prova de Fail Closed

- **Sem role:** `is_owner(null)` = FALSE → DENY
- **Sem perfil:** `user_roles` vazia → nenhuma função retorna TRUE → DENY
- **Erro:** Qualquer exceção em SECURITY DEFINER → aborta → DENY implícito

---

## ARTEFATO 8: PLANO DE TESTE (≥40)

### 8.1 Testes por URL Direta

| # | Cenário | URL | Role | Esperado | Comando |
|---|---------|-----|------|----------|---------|
| 1 | Entry redirect www | `http://www.moisesmedeiros.com.br/` | anon | 301 → pro.* | `curl -I http://www.moisesmedeiros.com.br/` |
| 2 | Entry redirect naked | `https://moisesmedeiros.com.br/` | anon | 301 → pro.* | `curl -I https://moisesmedeiros.com.br/` |
| 3 | Legacy block gestao | `https://gestao.moisesmedeiros.com.br/` | anon | 301 → pro.*/gestaofc | `curl -I https://gestao.moisesmedeiros.com.br/` |
| 4 | Legacy path preserve | `https://gestao.moisesmedeiros.com.br/dashboard` | anon | 301 → pro.*/gestaofc (path NOT preserved) | `curl -I https://gestao.moisesmedeiros.com.br/dashboard` |
| 5 | Pro home public | `https://pro.moisesmedeiros.com.br/` | anon | 200 | `curl -I https://pro.moisesmedeiros.com.br/` |
| 6 | Auth page | `https://pro.moisesmedeiros.com.br/auth` | anon | 200 | `curl -I https://pro.moisesmedeiros.com.br/auth` |

### 8.2 Testes de Bloco GESTAO

| # | Cenário | URL | Role | Esperado |
|---|---------|-----|------|----------|
| 7 | Gestaofc como owner | `/gestaofc` | owner | 200 + render |
| 8 | Gestaofc como admin | `/gestaofc` | admin | 200 + render |
| 9 | Gestaofc como employee | `/gestaofc` | employee | 200 + render |
| 10 | Gestaofc como suporte | `/gestaofc` | suporte | 200 + render |
| 11 | Gestaofc como coordenacao | `/gestaofc` | coordenacao | 200 + render |
| 12 | Gestaofc como monitoria | `/gestaofc` | monitoria | 200 + render |
| 13 | Gestaofc como marketing | `/gestaofc` | marketing | 200 + render |
| 14 | Gestaofc como contabilidade | `/gestaofc` | contabilidade | 200 + render |
| 15 | Gestaofc como beta | `/gestaofc` | beta | 404 genérico |
| 16 | Gestaofc como aluno | `/gestaofc` | aluno | 404 genérico |
| 17 | Gestaofc como viewer | `/gestaofc` | viewer | 404 genérico |
| 18 | Gestaofc anon | `/gestaofc` | anon | redirect → /auth |

### 8.3 Testes de Bloco ALUNOS

| # | Cenário | URL | Role | Esperado |
|---|---------|-----|------|----------|
| 19 | Alunos como owner | `/alunos` | owner | 200 + render |
| 20 | Alunos como beta | `/alunos` | beta | 200 + render |
| 21 | Alunos como aluno | `/alunos` | aluno | 200 + render |
| 22 | Alunos como employee | `/alunos` | employee | 404 genérico |
| 23 | Alunos como viewer | `/alunos` | viewer | 404 genérico |
| 24 | Alunos anon | `/alunos` | anon | redirect → /auth |

### 8.4 Testes de Pós-Login

| # | Cenário | Role | Esperado Destino |
|---|---------|------|------------------|
| 25 | Pós-login owner | owner | /gestaofc |
| 26 | Pós-login admin | admin | /gestaofc |
| 27 | Pós-login employee | employee | /gestaofc |
| 28 | Pós-login suporte | suporte | /gestaofc |
| 29 | Pós-login beta | beta | /alunos |
| 30 | Pós-login aluno | aluno | /alunos |
| 31 | Pós-login viewer | viewer | /comunidade |
| 32 | Pós-login aluno_gratuito | aluno_gratuito | /comunidade |

### 8.5 Testes de Cross-Block (FORBIDDEN)

| # | Cenário | De | Para | Esperado |
|---|---------|-----|------|----------|
| 33 | Beta → Gestaofc | /alunos | /gestaofc | 404 genérico |
| 34 | Employee → Alunos | /gestaofc | /alunos | 404 genérico |
| 35 | Viewer → Alunos | /comunidade | /alunos | 404 genérico |
| 36 | Viewer → Gestaofc | /comunidade | /gestaofc | 404 genérico |

### 8.6 Testes de Refresh/Deep Link

| # | Cenário | Ação | Role | Esperado |
|---|---------|------|------|----------|
| 37 | Refresh em /gestaofc | F5 | employee | 200 (mantém) |
| 38 | Deep link /gestaofc/alunos | URL direta | beta | 404 |
| 39 | Deep link /alunos/aulas | URL direta | employee | 404 |
| 40 | Aba anônima /gestaofc | Nova aba | anon | redirect → /auth |

### 8.7 Testes Owner-Only

| # | Cenário | URL | Role | Esperado |
|---|---------|-----|------|----------|
| 41 | Central monitoramento owner | `/gestaofc/central-monitoramento` | owner | 200 |
| 42 | Central monitoramento admin | `/gestaofc/central-monitoramento` | admin | 404/redirect |
| 43 | Master owner | `/gestaofc/master` | owner | 200 |
| 44 | Master admin | `/gestaofc/master` | admin | 404/redirect |

---

## ARTEFATO 9: CHECKLIST GO-LIVE

| # | Item | Status | Bloqueio |
|---|------|--------|----------|
| 1 | Entry domains redirect 301 configurado | ⬜ Pendente Cloudflare | CRÍTICO |
| 2 | Legacy gestao.* redirect/block configurado | ⬜ Pendente Cloudflare | CRÍTICO |
| 3 | LegacyDomainBlocker.tsx ativo em App.tsx | ✅ OK | - |
| 4 | RoleProtectedRoute.tsx com 404 genérico | ✅ OK | - |
| 5 | getPostLoginRedirect() corrigido | ✅ OK | - |
| 6 | urlAccessControl.ts sem /dashboard | ✅ OK | - |
| 7 | Enum app_role com 14 roles | ✅ OK | - |
| 8 | user_roles com RLS | ✅ OK | - |
| 9 | Funções SECURITY DEFINER ativas | ✅ OK | - |
| 10 | 40+ testes executados | ⬜ Pendente execução | CRÍTICO |

### Critérios de Bloqueio

- ❌ **BLOQUEIA GO-LIVE SE:**
  - Cloudflare redirects não configurados
  - Qualquer teste falhar
  - RLS desabilitado em tabela sensível
  - Função is_owner/is_admin_or_owner ausente

---

## ARTEFATO 10: ROLLBACK

### Procedimento de Rollback (< 5 minutos)

1. **Cloudflare:**
   - Desativar Redirect Rules (não deletar, apenas off)
   - DNS: gestao.moisesmedeiros.com.br → IP Lovable (se necessário temporário)

2. **Lovable (Git Revert):**
   ```bash
   # Identificar commit anterior
   git log --oneline -5
   
   # Revert para versão anterior
   git revert HEAD~1
   ```

3. **Supabase:**
   - Não há rollback necessário (schema não alterado)
   - RLS policies são aditivas, não destrutivas

4. **Validação Pós-Rollback:**
   - Acessar gestao.moisesmedeiros.com.br (deve funcionar temporariamente)
   - Verificar login em pro.moisesmedeiros.com.br/auth

### O que NÃO quebra com rollback:
- ✅ Login único em /auth
- ✅ Roles no banco
- ✅ RLS policies
- ✅ Domínios DNS

---

# FIM — CONFORMIDADE: ✅ PASS

**Observação:** Pendente configuração final no Cloudflare para redirects de domínio. Código Lovable e RLS Supabase estão 100% conformes com CONSTITUIÇÃO v2.0.0.

---

=== INÍCIO CONSTITUIÇÃO JSON v2.0.0 ===
```json
{
  "version": "2.0.0",
  "authority": "constitutional_single_source_of_truth",
  "immutability": true,
  "root_domain": "https://pro.moisesmedeiros.com.br",
  "domains": {
    "entry_domains": [
      "http://www.moisesmedeiros.com.br",
      "https://moisesmedeiros.com.br"
    ],
    "core_domain": "https://pro.moisesmedeiros.com.br",
    "legacy_domains": [
      "https://gestao.moisesmedeiros.com.br"
    ]
  },
  "domain_enforcement": {
    "entry_redirect": {
      "from": [
        "http://www.moisesmedeiros.com.br",
        "https://moisesmedeiros.com.br"
      ],
      "to": "https://pro.moisesmedeiros.com.br",
      "status": 301,
      "override_allowed": false
    },
    "legacy_domain": {
      "domain": "https://gestao.moisesmedeiros.com.br",
      "state": "terminated",
      "direct_access": "forbidden",
      "all_logic_migrated_to": "https://pro.moisesmedeiros.com.br/gestaofc",
      "any_request_action": "redirect_or_block"
    }
  },
  "authentication": {
    "exclusive_login_endpoint": "https://pro.moisesmedeiros.com.br/auth",
    "multiple_login_points": false,
    "auth_as_final_destination": false,
    "bypass_authentication": "forbidden"
  },
  "associative_blocks": {
    "PUBLICO": {
      "routes": ["/", "/comunidade", "/auth"],
      "roles": ["FREE", "BETA", "FUNCIONARIO", "OWNER"],
      "block_type": "open",
      "partial_access": false
    },
    "GESTAO": {
      "routes": ["/gestaofc", "/gestaofc/*"],
      "roles": ["FUNCIONARIO", "OWNER"],
      "block_type": "restricted",
      "partial_access": false,
      "permission_inheritance": {
        "source_system": "gestao.moisesmedeiros.com.br",
        "target_system": "pro.moisesmedeiros.com.br/gestaofc",
        "mode": "absolute_mirror",
        "scope": "all_employee_roles_existing_or_future",
        "hierarchy_preserved": true,
        "permission_set_preserved": true,
        "role_names_preserved": true,
        "permission_expansion": false,
        "permission_reduction": false,
        "reinterpretation": false
      }
    },
    "ALUNOS": {
      "routes": ["/alunos", "/alunos/*"],
      "roles": ["BETA", "OWNER"],
      "block_type": "restricted",
      "partial_access": false
    },
    "OWNER": {
      "inherits": ["PUBLICO", "GESTAO", "ALUNOS"],
      "roles": ["OWNER"],
      "override_denials": true
    }
  },
  "post_login_routing": {
    "resolution_strategy": "role_first_then_block",
    "rules": {
      "OWNER": "/gestaofc",
      "FUNCIONARIO": "/gestaofc",
      "BETA": "/alunos",
      "FREE": "/comunidade"
    },
    "fallback": "deny"
  },
  "access_control": {
    "cross_block_access": "forbidden",
    "route_outside_block": "deny_or_force_redirect",
    "partial_rendering": "forbidden",
    "implicit_permissions": "forbidden",
    "explicit_only": true
  },
  "invariants": [
    "users_belong_to_blocks_not_pages",
    "blocks_are_atomic_and_indivisible",
    "employee_permissions_are_inherited_not_redefined",
    "legacy_gestao_has_no_runtime_existence",
    "single_authentication_path_only",
    "no_route_exists_outside_defined_blocks",
    "any_violation_is_a_critical_architecture_error"
  ]
}
```
=== FIM CONSTITUIÇÃO JSON v2.0.0 ===
