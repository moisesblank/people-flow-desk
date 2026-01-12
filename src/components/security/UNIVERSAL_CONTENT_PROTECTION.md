# 🛡️ PROTEÇÃO UNIVERSAL DE CONTEÚDO - CONSTITUIÇÃO PERPÉTUA

**Data:** 2026-01-12  
**Status:** VIGENTE E IMUTÁVEL  
**Regra:** TODO PDF/Conteúdo Protegido DEVE usar `useContentSecurityGuard`

---

## 📜 JURAMENTO SOLENE

Todo e qualquer componente que renderize PDF, livro, material, vídeo ou conteúdo premium
DEVE obrigatoriamente implementar o hook `useContentSecurityGuard`.

Esta regra é PERPÉTUA e aplica-se a:
- Componentes atuais ✅
- Componentes futuros ✅
- Qualquer refatoração ✅

---

## ✅ COMPONENTES PROTEGIDOS (VERIFICADO)

| Componente | Arquivo | Proteção |
|------------|---------|----------|
| **ProtectedPDFViewerV2** | `src/components/security/ProtectedPDFViewerV2.tsx` | `useContentSecurityGuard` ✅ |
| **ProtectedPDFViewer** | `src/components/security/ProtectedPDFViewer.tsx` | `useContentSecurityGuard` ✅ |
| **SecurePdfViewerOmega** | `src/components/pdf/SecurePdfViewerOmega.tsx` | `useContentSecurityGuard` ✅ |
| **MaterialViewer** | `src/components/materials/MaterialViewer.tsx` | `useContentSecurityGuard` ✅ |
| **WebBookViewer** | `src/components/books/WebBookViewer.tsx` | `useBookSecurityGuard` ✅ |

---

## 🔐 CAMADAS DE PROTEÇÃO ATIVAS

### 1. Anti-Debugger Agressivo
- `antiDebugger.init()` + `enableAggressiveMode()`
- Console flooding (inunda console com warnings)
- Infinite debugger loop (pausa DevTools)
- Detecção via timing attack, dimensões, elemento
- Ocultação de código fonte

### 2. Bloqueio de Teclas
- F12 (DevTools)
- Ctrl+Shift+I/J/C (DevTools)
- Ctrl+P (Print)
- Ctrl+S (Save)
- PrintScreen (todas variantes)
- Win+Shift+S (Snipping Tool)
- Cmd+Shift+3/4/5/6 (macOS Screenshots)

### 3. Bloqueio de Interações
- Context menu (botão direito)
- Seleção de texto
- Arrastar e soltar
- Long-press (mobile)

### 4. Escalonamento de Resposta
1. **1ª tentativa:** Toast discreto
2. **2ª-4ª tentativa:** Overlay severo (5s)
3. **5ª tentativa:** SESSÃO REVOGADA + redirect /auth
4. **10+ tentativas:** Auto-ban

### 5. Revogação de Sessão
- RPC `revoke_session_on_violation`
- Broadcast Realtime
- Logout forçado

---

## 🆕 COMO CRIAR NOVO COMPONENTE COM PROTEÇÃO

```tsx
import { useContentSecurityGuard } from "@/hooks/useContentSecurityGuard";
import { useAuth } from "@/hooks/useAuth";

export const MeuNovoViewer = ({ contentId, title }) => {
  const { user } = useAuth();
  
  // 🛡️ OBRIGATÓRIO - Proteção Universal
  const { SevereOverlay } = useContentSecurityGuard({
    contentId: contentId,
    contentType: 'pdf', // ou 'book' | 'material' | 'video' | 'course'
    contentTitle: title,
    userId: user?.id,
    userEmail: user?.email,
    userName: user?.user_metadata?.name,
    enabled: true,
  });

  return (
    <>
      <SevereOverlay />
      {/* Seu conteúdo aqui */}
    </>
  );
};
```

---

## ⚠️ VIOLAÇÕES DESTA CONSTITUIÇÃO

Criar componente de PDF/conteúdo sem `useContentSecurityGuard` é PROIBIDO.

Se detectado, o componente deve ser imediatamente corrigido.

---

## 👑 OWNER BYPASS

O Owner (moisesblank@gmail.com) possui bypass automático em todas as proteções de UX.
Isso é detectado automaticamente via:
- `user?.email?.toLowerCase() === 'moisesblank@gmail.com'`
- `role === 'owner'`

---

**Assinatura:** SYNAPSE Ω v10.4 - CONSTITUIÇÃO DE SEGURANÇA
