# 🔥 PROMPT LOVABLE — MATRIZ UNIFICADA DE FUNCIONALIDADES 🔥

> **Cole este prompt na Lovable para aplicar a Matriz Unificada**

---

## CONTEXTO

Você está trabalhando na plataforma gestao.moisesmedeiros.com.br (Lovable + Supabase).

Existe uma estrutura `src/core/` que centraliza TODAS as rotas, ações, storage e funções.

**Regra de Ouro: NADA pode "não pegar".**

---

## ARQUIVOS A APLICAR

Por favor, aplique os seguintes arquivos ao projeto:

### 1. ROUTES (Rotas Centralizadas)

Arquivo: `src/core/routes.ts`

- 95+ rotas tipadas
- Definições com metadata (auth, roles, status)
- Helpers: `getRoute()`, `canAccessRoute()`, `getRoutesByDomain()`

### 2. ACTIONS (Ações Centralizadas)

Arquivo: `src/core/actions.ts`

- 100+ ações tipadas
- Categorias: navigation, crud, upload, auth, ai, payment
- Helpers: `getAction()`, `canExecuteAction()`, `requiresConfirmation()`

### 3. STORAGE (Storage Centralizado)

Arquivo: `src/core/storage.ts`

- 18 buckets configurados
- Definições com maxFileSize, mimeTypes, pathPattern
- Helpers: `generateFilePath()`, `validateFileForBucket()`

### 4. FUNCTION MATRIX (Registry de Funções)

Arquivo: `src/core/functionMatrix.ts`

- Cada função é um "átomo" com: UI, Route, Action, Backend, Storage, Security, Observability, UX, Tests
- Helpers: `getFunctionById()`, `auditAllFunctions()`, `validateFunction()`

### 5. SAFE COMPONENTS (Componentes Seguros)

Arquivo: `src/core/SafeComponents.tsx`

- `SafeLink` — Link que valida rota e permissão
- `SafeButton` — Button que valida ação e permissão
- `SafeNavItem` — Item de menu com RBAC
- `SafeDownload` — Download com signed URL
- `SafeExternalLink` — Link externo com tracking

### 6. NAV ROUTE MAP (Mapa de Navegação)

Arquivo: `src/core/nav/navRouteMap.ts`

- 75 itens de menu mapeados para rotas
- RBAC por item de menu
- Status: active, disabled, coming_soon

### 7. CENTRAL DE DIAGNÓSTICO

Arquivo: `src/pages/CentralDiagnostico.tsx`

- Página de auditoria automática (somente owner)
- Audita: Rotas, Navegação, Funções, Storage, Ações, Segurança
- Exporta relatório MD

### 8. ÍNDICE CENTRAL

Arquivo: `src/core/index.ts`

- Re-exporta tudo
- `verifyCoreIntegrity()` para validação

---

## ROTA A ADICIONAR NO APP.TSX

```tsx
// Importar
const CentralDiagnostico = lazy(() => import("./pages/CentralDiagnostico"));

// Adicionar rota (protegida, somente owner)
<Route 
  path="/central-diagnostico" 
  element={<ProtectedPage><CentralDiagnostico /></ProtectedPage>} 
/>
```

---

## REGRAS INEGOCIÁVEIS

### 1. ZERO STRINGS SOLTAS

❌ PROIBIDO:

```tsx
<a href="#">Link</a>
<button onClick={() => {}}>Botão</button>
navigate("/dashboard")
```

✅ CORRETO:

```tsx
<SafeLink routeKey="DASHBOARD">Dashboard</SafeLink>
<SafeButton actionKey="CURSO_CREATE" onClick={handleCreate}>Criar</SafeButton>
navigate(ROUTES.DASHBOARD)
```

### 2. ZERO URLs PERSISTIDAS

❌ PROIBIDO: Salvar signed URL no banco como campo definitivo

✅ CORRETO: Salvar `bucket + path`, gerar URL sob demanda

### 3. FUNCIONALIDADE INCOMPLETA

❌ PROIBIDO: Botão visível sem handler

✅ CORRETO: `disabled` com tooltip "Em breve"

---

## VERIFICAÇÃO FINAL

Após aplicar, acesse `/central-diagnostico` e execute a auditoria.

Resultado esperado:

```
✅ Rotas: 95/95 válidas
✅ Navegação: 75/75 itens funcionando
✅ Funções: 100% cobertura
✅ Storage: 18 buckets OK
✅ Ações: 100+ registradas
✅ Segurança: RLS ativo
```

---

## RESUMO

| Arquivo | Função |
|---------|--------|
| `src/core/routes.ts` | Rotas centralizadas |
| `src/core/actions.ts` | Ações centralizadas |
| `src/core/storage.ts` | Storage centralizado |
| `src/core/functionMatrix.ts` | Registry de funções |
| `src/core/SafeComponents.tsx` | Componentes seguros |
| `src/core/nav/navRouteMap.ts` | Mapa de navegação |
| `src/core/index.ts` | Índice central |
| `src/pages/CentralDiagnostico.tsx` | Página de auditoria |

---

**OBJETIVO: ZERO CLIQUES MORTOS**

> *"Qualquer coisa clicável → leva a uma rota/ação existente → executa com segurança → persiste onde deve → gera logs/auditoria → retorna feedback ao usuário."*
