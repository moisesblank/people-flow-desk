# 🔒 OWNER GUARD — REGRA ARQUITETURAL P0

## DOGMA ABSOLUTO

```
SE role === "owner" → URL FINAL = /gestaofc
SEMPRE. SEM EXCEÇÃO. SEM DESVIO.
```

## POLÍTICA DE IMPORT

Qualquer componente, hook, middleware ou callback de auth que precise verificar/redirecionar o Owner **DEVE** importar desta pasta:

```typescript
import { enforceOwnerRedirect, OWNER_ROLE, OWNER_HOME } from '@/owner-guard';
```

## ANTI-PATTERNS PROIBIDOS

❌ Redirect hardcoded em layouts  
❌ `if (role === 'owner')` espalhado pelo app  
❌ Redirect duplicado em páginas  
❌ Default redirect para /alunos para owner  

## ARQUIVOS

| Arquivo | Responsabilidade |
|---------|------------------|
| `constants.ts` | OWNER_ROLE, OWNER_HOME, OWNER_EMAIL |
| `pathUtils.ts` | normalizePath, isOwnerPath |
| `resolveRole.ts` | Resolve role de JWT, metadata ou DB |
| `enforceOwnerRedirect.ts` | **FUNÇÃO CANÔNICA** de redirect |
| `index.ts` | Barrel export |

## FLUXO OBRIGATÓRIO

```
Login/Restore Session
        ↓
  resolveRole()
        ↓
enforceOwnerRedirect({ role, pathname })
        ↓
  Se owner + fora de /gestaofc
        ↓
  window.location.replace('/gestaofc')
```

---
**Versão:** 1.0.0  
**Data:** 2026-01-21  
**Autoridade:** SYNAPSE Ω CONSTITUIÇÃO v10.4
