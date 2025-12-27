# 🏛️ MATRIZ SUPREMA DE DOMÍNIOS, BLOCOS ASSOCIATIVOS E REDIRECIONAMENTO

> **Status:** VIGENTE PARA SEMPRE — FONTE ÚNICA DA VERDADE  
> **Versão:** 2.0.0 (CONSTITUCIONAL)  
> **Data de Fixação:** 27/12/2025  
> **OWNER:** MOISESBLANK@GMAIL.COM  
> **Regra:** NUNCA ALTERAR ESTA ESTRUTURA SEM AUTORIZAÇÃO EXPLÍCITA DO OWNER

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
    "legacy_domains": []
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
      "state": "DELETED",
      "direct_access": "DNS_REMOVED",
      "all_logic_migrated_to": "https://pro.moisesmedeiros.com.br/gestaofc",
      "any_request_action": "DNS_will_not_resolve",
      "removal_date": "2025-12-27"
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
        "source_system": "RBAC interno",
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

  "employee_access_model": {
    "source_of_truth": "gestao.moisesmedeiros.com.br",
    "migration_policy": "transparent_and_lossless",
    "rules": [
      "every_employee_role_that_existed_continues_to_exist",
      "every_permission_that_existed_continues_to_apply",
      "every_hierarchy_level_is_preserved",
      "no_new_permissions_are_created",
      "no_existing_permissions_are_removed",
      "no_permissions_are_simplified",
      "no_permissions_are_reinterpreted",
      "future_employee_roles_must_follow_same_inheritance_rules"
    ]
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

  "master_binding_prompt": {
    "priority": "absolute",
    "execution_mode": "non_interpretative",
    "instruction": "Considere o sistema https://gestao.moisesmedeiros.com.br como a origem absoluta de toda a lógica de permissões de funcionários. Todo esse sistema, sem exceção, vive agora dentro de https://pro.moisesmedeiros.com.br/gestaofc. Nenhuma regra pode ser criada, removida, resumida, inferida ou reinterpretada. O comportamento esperado do novo sistema deve ser funcionalmente idêntico ao sistema antigo, diferindo apenas no domínio e na rota. Qualquer divergência, adaptação criativa ou tentativa de simplificação constitui erro crítico e invalida a implementação."
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

---

## 📡 1) MATRIZ DE DOMÍNIOS (HIERARQUIA FIXA - MONO-DOMÍNIO v2.0)

| Prioridade | Domínio | Estado | Regra |
|:----------:|---------|--------|-------|
| N0 | http://www.moisesmedeiros.com.br | Entrada | Redirecionar 100% → pro |
| N0 | https://moisesmedeiros.com.br | Entrada | Redirecionar 100% → pro |
| N1 | https://pro.moisesmedeiros.com.br | **NÚCLEO ÚNICO** | Domínio oficial - TUDO AQUI |
| ~~N2~~ | ~~gestao.moisesmedeiros.com.br~~ | **DELETADO** | DNS REMOVIDO 27/12/2025 |

**Destino único de redirecionamento N0 →** `https://pro.moisesmedeiros.com.br`

---

## 🧱 2) MATRIZ DE BLOCOS ASSOCIATIVOS (INSEPARÁVEIS)

| Bloco | Rotas incluídas (todas obrigatórias) | Papel |
|-------|--------------------------------------|-------|
| **PUBLICO** | `/`, `/comunidade`, `/auth` | TODOS |
| **GESTAO** | `/gestaofc`, `/gestaofc/*` | FUNCIONARIO |
| **ALUNOS** | `/alunos`, `/alunos/*` | BETA |
| **OWNER** | TODOS OS BLOCOS | OWNER |

**Regra:** Usuários pertencem a **BLOCOS**, não a páginas individuais. Blocos são **INDIVISÍVEIS**.

---

## 🔐 3) MATRIZ DE AUTENTICAÇÃO (PONTO ÚNICO)

| Regra | Valor |
|-------|-------|
| URL de login | `https://pro.moisesmedeiros.com.br/auth` |
| Outros logins | **PROIBIDOS** |
| Página final | **NUNCA** é `/auth` (sempre redireciona) |

---

## 🔄 4) MATRIZ DE REDIRECIONAMENTO PÓS-LOGIN (ABSOLUTA)

| Role | Bloco concedido | Redirecionamento obrigatório |
|------|-----------------|------------------------------|
| **OWNER** | PUBLICO + GESTAO + ALUNOS | `/gestaofc` |
| **FUNCIONARIO** | GESTAO | `/gestaofc` |
| **BETA** | ALUNOS | `/alunos` |
| **FREE** | PUBLICO | `/comunidade` |

```typescript
// Implementação em src/core/urlAccessControl.ts → getPostLoginRedirect()
if (email === OWNER_EMAIL || role === "owner") {
  redirect("/gestaofc");  // Owner vai pro backoffice
} else if (isGestaoRole(role)) {
  redirect("/gestaofc");  // Staff vai pro backoffice  
} else if (isAlunoRole(role)) {
  redirect("/alunos");    // Aluno pagante vai pro portal
} else {
  redirect("/comunidade"); // Free vai pra comunidade
}
```

---

## 🚫 5) MATRIZ DE NEGATIVA (ANTI-EXCEÇÃO)

| Condição | Ação |
|----------|------|
| Rota fora do bloco | **NEGAR** ou **REDIRECIONAR** |
| Tentativa de exceção | **BLOQUEAR** |
| Conteúdo parcial | **PROIBIDO** |

---

## ⛔ 6) MATRIZ DO DOMÍNIO LEGADO

| URL | Tratamento |
|-----|------------|
| `https://gestao.moisesmedeiros.com.br` | **BLOQUEADO** |
| Destino para staff/owner | `https://pro.moisesmedeiros.com.br/gestaofc` |
| Destino para outros | `https://pro.moisesmedeiros.com.br/` |

**Implementação:** `src/components/routing/LegacyDomainBlocker.tsx`

---

## ⚖️ 7) REGRA FINAL (NÃO INTERPRETAR)

1. Usuários pertencem a **BLOCOS**, não a páginas.
2. Blocos são **INDIVISÍVEIS**.
3. Toda decisão é feita por **ROLE**.
4. Nenhuma rota existe fora desta matriz.
5. **Qualquer divergência é ERRO.**

---

## 👥 ROLES E PERMISSÕES

### Hierarquia de Roles

```
OWNER (👑)
  │
  ├── admin
  │     ├── coordenacao
  │     ├── professor
  │     └── monitoria
  │
  ├── funcionario / employee
  │     ├── suporte
  │     ├── marketing
  │     └── contabilidade
  │
  └── beta (aluno pagante)
        └── viewer (aluno free)
```

### Matriz de Acesso por Role

| Role | `/` | `/comunidade` | `/alunos` | `/gestaofc` |
|------|-----|---------------|-----------|-------------|
| owner | ✅ | ✅ | ✅ | ✅ |
| admin | ✅ | ✅ | ✅ | ✅ |
| funcionario | ✅ | ❌ | ❌ | ✅ |
| employee | ✅ | ❌ | ❌ | ✅ |
| suporte | ✅ | ❌ | ❌ | ✅ |
| marketing | ✅ | ❌ | ❌ | ✅ |
| contabilidade | ✅ | ❌ | ❌ | ✅ |
| coordenacao | ✅ | ❌ | ❌ | ✅ |
| professor | ✅ | ❌ | ❌ | ✅ |
| monitoria | ✅ | ❌ | ❌ | ✅ |
| beta | ✅ | ✅ | ✅ | ❌ |
| aluno | ✅ | ✅ | ✅ | ❌ |
| viewer | ✅ | ✅ | ❌ | ❌ |
| null (anônimo) | ✅ | ❌ | ❌ | ❌ |

---

## 🔄 FLUXO DE REDIRECIONAMENTO

```
                    ┌─────────────────────────────┐
                    │ www.moisesmedeiros.com.br   │
                    │ moisesmedeiros.com.br       │
                    └───────────┬─────────────────┘
                                │ REDIRECT 301
                                ▼
                    ┌─────────────────────────────┐
                    │ pro.moisesmedeiros.com.br   │
                    │         (HOME /)             │
                    └───────────┬─────────────────┘
                                │
            ┌───────────────────┼───────────────────┐
            │                   │                   │
            ▼                   ▼                   ▼
    ┌───────────────┐   ┌───────────────┐   ┌───────────────┐
    │  /comunidade  │   │    /auth      │   │   (público)   │
    │  (FREE AREA)  │   │   (LOGIN)     │   │   /termos     │
    └───────────────┘   └───────┬───────┘   │   /privacidade│
                                │           └───────────────┘
                                │ APÓS LOGIN
                    ┌───────────┴───────────┐
                    │                       │
                    ▼                       ▼
            ┌───────────────┐       ┌───────────────┐
            │  /gestaofc    │       │   /alunos     │
            │ (STAFF/OWNER) │       │ (BETA/OWNER)  │
            └───────────────┘       └───────────────┘

        gestao.moisesmedeiros.com.br ──BLOQUEADO──► pro.../gestaofc (staff)
                                                    pro.../        (outros)
```

---

## 📁 ESTRUTURA DE ÁREAS

### 1. ÁREA PÚBLICA (`/`)
- Home/Landing
- Termos de Uso
- Política de Privacidade
- Área Gratuita (preview)

### 2. COMUNIDADE (`/comunidade`)
- Fórum
- Conteúdos gratuitos
- Networking
- **Acesso:** viewer, beta, owner

### 3. PORTAL DO ALUNO (`/alunos`)
- Cursos
- Aulas
- Materiais
- Certificados
- Progresso
- **Acesso:** beta, owner

### 4. BACKOFFICE (`/gestaofc`)
- Dashboard Executivo
- Tarefas
- Funcionários
- Marketing
- Finanças
- Cursos (CRUD)
- Alunos (CRUD)
- Afiliados
- Integrações
- **Acesso:** funcionários, owner
- **ROTA SECRETA:** Não expor aliases

---

## ⚠️ REGRAS INVIOLÁVEIS

1. **MONO-DOMÍNIO:** Tudo roda em `pro.moisesmedeiros.com.br`
2. **gestao.moisesmedeiros.com.br:** BLOQUEADO — redireciona automaticamente
3. **www.moisesmedeiros.com.br:** Redireciona para `pro.moisesmedeiros.com.br`
4. **OWNER:** Acesso total a TODAS as áreas
5. **STAFF:** Só acessa `/gestaofc`, nunca `/alunos`
6. **BETA:** Só acessa `/alunos` e `/comunidade`, nunca `/gestaofc`
7. **FREE:** Só acessa `/comunidade` e páginas públicas
8. **gestaofc É SECRETO:** Rotas legadas (/gestao, /admin, /dashboard) vão para `/`

---

## 🔧 ARQUIVOS RELACIONADOS

| Arquivo | Função |
|---------|--------|
| `src/core/urlAccessControl.ts` | Controle de acesso por URL + getPostLoginRedirect |
| `src/components/routing/LegacyDomainBlocker.tsx` | Bloqueia gestao.* |
| `src/components/routing/LegacyRedirectHandler.tsx` | Redirects de rotas legadas |
| `src/lib/cloudflare/legacyRedirects.ts` | Mapeamento de redirects |
| `src/routes/publicRoutes.tsx` | Rotas públicas |
| `src/routes/comunidadeRoutes.tsx` | Rotas da comunidade |
| `src/routes/alunoRoutes.tsx` | Rotas do portal do aluno |
| `src/routes/gestaofcRoutes.tsx` | Rotas do backoffice |
| `src/routes/legacyRoutes.tsx` | Redirects legados |
| `src/hooks/useAuth.tsx` | Lógica de autenticação e redirect |
| `src/pages/Auth.tsx` | Página de login/cadastro |
| `src/components/layout/RoleProtectedRoute.tsx` | Proteção de rotas por role |

---

## 📅 CHANGELOG

| Data | Alteração | Autor |
|------|-----------|-------|
| 27/12/2025 | Documento criado — Estrutura DEFINITIVA | OWNER |
| 27/12/2025 | MATRIZ SUPREMA incorporada (7 matrizes) | OWNER |
| 27/12/2025 | LegacyDomainBlocker criado | SISTEMA |

---

**FIM DO DOCUMENTO — IMUTÁVEL**
