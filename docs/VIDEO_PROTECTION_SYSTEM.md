# 🔥 SISTEMA DE PROTEÇÃO DE VÍDEOS - FORTALEZA DIGITAL

## 📌 REGRA OBRIGATÓRIA PARA TODOS OS VÍDEOS

**TODOS os vídeos do sistema DEVEM usar o `FortressPlayerWrapper`** (ou `ProtectedVideoWrapper` para casos simples):

1. Bloquear botões de "Assistir no YouTube"
2. Bloquear botões de "Compartilhar"
3. Forçar qualidade 1080p automaticamente
4. Bloquear clique direito e atalhos de teclado
5. Detectar tentativas de inspeção (DevTools)

---

## 🔥 FORTALEZA DIGITAL (5 CAMADAS)

### Arquivo: `src/components/video/FortressPlayerWrapper.tsx`

### As 5 Camadas de Proteção:

| Camada | Nome | Proteção |
|--------|------|----------|
| 1 | Escudo CSS | Máscaras invisíveis que bloqueiam cliques em áreas sensíveis |
| 2 | Escudo JS (Cliques) | Bloqueio de contextmenu, drag, select, copy |
| 3 | Escudo JS (Teclado) | Bloqueio de Ctrl+S, F12, Ctrl+U, Ctrl+Shift+I/J/C |
| 4 | Anti-Inspeção | Detecção de DevTools e limpeza de console |
| 5 | CSS Específico | Oculta botões de download/share do Panda/YouTube |

### Como Usar (Modo Fortaleza):

```tsx
import { FortressPlayerWrapper, getFortressYouTubeUrl } from "@/components/video/FortressPlayerWrapper";

// Em qualquer componente com vídeo:
<FortressPlayerWrapper className="aspect-video" showSecurityBadge>
  <iframe
    src={getFortressYouTubeUrl(videoId, true)}
    className="w-full h-full"
    allowFullScreen
  />
</FortressPlayerWrapper>
```

---

## 🛡️ COMPONENTE BÁSICO (ProtectedVideoWrapper)

### Arquivo: `src/components/video/ProtectedVideoWrapper.tsx`

Para casos onde proteção mais leve é suficiente:

```tsx
import { ProtectedVideoWrapper, getProtectedYouTubeUrl } from "@/components/video/ProtectedVideoWrapper";

<ProtectedVideoWrapper className="aspect-video">
  <iframe
    src={getProtectedYouTubeUrl(videoId, true)}
    className="w-full h-full"
    allowFullScreen
  />
</ProtectedVideoWrapper>
```

---

## 🎯 MÁSCARAS DE PROTEÇÃO (Fortaleza)

O FortressPlayerWrapper adiciona escudos em todas as bordas:

| Área | Dimensão | O que bloqueia |
|------|----------|----------------|
| Superior | 100% x 60px | Info do vídeo, título, share |
| Inferior | 100% x 70px | Controles, timeline, logo |
| Esquerda | 80px x 100% | Logo, branding |
| Direita | 80px x 100% | Config, share, mais |
| Centro | 30% x 40% | **PERMITIDO** (Play/Pause) |

---

## 📺 PARÂMETROS DE QUALIDADE

Usar `getFortressYouTubeUrl()` ou `FORTRESS_PLAYER_VARS`:

```js
{
  vq: "hd1080",        // Força 1080p
  rel: "0",            // Sem vídeos relacionados
  modestbranding: "1", // Minimiza branding
  showinfo: "0",       // Oculta info do canal
  iv_load_policy: "3", // Oculta anotações
  enablejsapi: "0",    // Desabilita API JS (anti-manipulação)
}
```

---

## ✅ ARQUIVOS JÁ PROTEGIDOS

- [x] `src/components/landing/FuturisticVideoPlayer.tsx`
- [x] `src/components/landing/VideoFeedbackCarousel.tsx`
- [x] `src/components/lms/YouTubePlayer.tsx`
- [x] `src/components/youtube/YouTubeLivePlayer.tsx`

---

## ⚠️ PARA NOVOS COMPONENTES

**OBRIGATÓRIO**: Qualquer novo componente de vídeo DEVE:

1. Importar `FortressPlayerWrapper` (recomendado) ou `ProtectedVideoWrapper`
2. Envolver o iframe com o wrapper
3. Usar `getFortressYouTubeUrl()` ou `getFortressPandaUrl()` para URLs
4. Para YouTube IFrame API, usar `FORTRESS_PLAYER_VARS`

---

## 🔒 PROTEÇÕES ATIVAS

- ✅ Clique direito bloqueado
- ✅ Arrastar bloqueado
- ✅ Selecionar texto bloqueado
- ✅ Copiar bloqueado
- ✅ Atalhos de DevTools bloqueados (F12, Ctrl+Shift+I, etc.)
- ✅ Detecção de DevTools aberto
- ✅ Máscaras invisíveis em todas as bordas
- ✅ CSS para ocultar botões de share/download
- ✅ Qualidade 1080p forçada

---

**Atualizado em:** 2024-12-21
**Versão:** 2.0 - FORTALEZA DIGITAL
