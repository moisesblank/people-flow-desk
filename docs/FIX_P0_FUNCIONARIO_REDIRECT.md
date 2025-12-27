# 🔥 FIX P0 — FUNCIONÁRIO REDIRECT INCORRETO

> **Data:** 27/12/2025  
> **Status:** ✅ CORRIGIDO  
> **Bug Category:** post_login_redirect_incorrect_role

---

## 📋 PROBLEMA REPORTADO

| Campo | Valor |
|-------|-------|
| Role afetada | `funcionario` / `employee` |
| URL de login | `https://pro.moisesmedeiros.com.br/auth` |
| Redirect observado | `/comunidade` ❌ |
| Redirect esperado | `/gestaofc` ✅ |

---

## 🔍 CAUSA RAIZ IDENTIFICADA

### Problema 1: Auth.tsx (linha 276)
```typescript
// ❌ ANTES: Role era null no momento do SIGNED_IN
const target = getPostLoginRedirect(null, session.user.email);
// Resultado: fallback para /comunidade
```

### Problema 2: useAuth.tsx (linha 358)
```typescript
// ❌ ANTES: Redirecionava antes da role ser carregada do banco
const target = getPostLoginRedirect(derivedRole, email);
// Se derivedRole = null → fallback /comunidade
```

### Problema 3: useRoleBasedRedirect.ts (linha 80-82)
```typescript
// ❌ ANTES: Funcionário fora de /gestaofc ia para /
if (GESTAO_ROLES.includes(role)) {
  return "/";  // ERRADO!
}
```

---

## ✅ CORREÇÕES APLICADAS

### Fix 1: Auth.tsx — Buscar role ANTES de redirecionar
```typescript
// ✅ DEPOIS: Busca role do banco antes de decidir
const { data: roleData } = await supabase
  .from("user_roles")
  .select("role")
  .eq("user_id", session.user.id)
  .maybeSingle();

userRole = roleData?.role || null;
const target = getPostLoginRedirect(userRole, session.user.email);
```

### Fix 2: useAuth.tsx — Esperar role ser carregada
```typescript
// ✅ DEPOIS: Se role ainda é null, NÃO redirecionar
if (derivedRole === null) {
  console.log('[AUTH] Aguardando role ser carregada do banco...');
  return; // Espera próximo ciclo
}
```

### Fix 3: useRoleBasedRedirect.ts — Funcionário → /gestaofc
```typescript
// ✅ DEPOIS: Funcionário SEMPRE vai para /gestaofc
if (GESTAO_ROLES.includes(role)) {
  return "/gestaofc";  // CORRETO!
}
```

---

## 📊 FLUXO CORRIGIDO

```
FUNCIONARIO faz login
       ↓
[Auth.tsx] SIGNED_IN event
       ↓
[Busca role do banco] → role = "funcionario"
       ↓
[getPostLoginRedirect("funcionario", email)]
       ↓
[isGestaoRole("funcionario") = true]
       ↓
✅ Redirect para /gestaofc
```

---

## 🧪 VALIDAÇÃO (TESTES OBRIGATÓRIOS)

| Role | Redirect Esperado | Status |
|------|-------------------|--------|
| `owner` | `/gestaofc` | ✅ |
| `funcionario` | `/gestaofc` | ✅ |
| `employee` | `/gestaofc` | ✅ |
| `admin` | `/gestaofc` | ✅ |
| `suporte` | `/gestaofc` | ✅ |
| `beta` | `/alunos` | ✅ |
| `viewer` | `/comunidade` | ✅ |
| `null` (sem role) | `/comunidade` | ✅ |

---

## 🛡️ ANTI-REGRESSÃO

### Proibições Implementadas:
- ❌ FUNCIONARIO nunca pode ir para `/comunidade`
- ❌ Fallback FREE nunca sobrescreve role válido
- ❌ Redirect não ocorre sem role resolvido explicitamente

### Garantias:
- ✅ Role sempre buscada do banco antes de redirect
- ✅ Owner pode redirecionar imediatamente (bypass)
- ✅ Outros usuários esperam role ser carregada

---

## 📁 ARQUIVOS ALTERADOS

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/Auth.tsx` | Listener SIGNED_IN agora busca role do banco |
| `src/hooks/useAuth.tsx` | Espera role != null antes de redirecionar |
| `src/hooks/useRoleBasedRedirect.ts` | Funcionário → /gestaofc (não /) |

---

## ✅ DECLARAÇÃO DE CONFORMIDADE

- [x] FUNCIONARIO redireciona sempre para `/gestaofc`
- [x] Nenhum cenário válido redireciona FUNCIONARIO para `/comunidade`
- [x] Role é sempre resolvida antes do redirect
- [x] Fallback /comunidade só para viewer/aluno_gratuito/null

**STATUS:** ✅ FIX COMPLETO — PRONTO PARA PRODUÇÃO

---

**Executor:** Lovable AI  
**Data:** 27/12/2025
