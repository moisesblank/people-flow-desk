# SISTEMA DE PROTEÇÃO DE VÍDEOS - DOCUMENTAÇÃO

## 📌 REGRA OBRIGATÓRIA PARA TODOS OS VÍDEOS

**TODOS os vídeos do sistema DEVEM usar o `ProtectedVideoWrapper`** para:
1. Bloquear botões de "Assistir no YouTube"
2. Bloquear botões de "Compartilhar"
3. Forçar qualidade 1080p automaticamente

---

## 🛡️ COMPONENTE DE PROTEÇÃO

### Arquivo: `src/components/video/ProtectedVideoWrapper.tsx`

### Como Usar:

```tsx
import { ProtectedVideoWrapper, getProtectedYouTubeUrl } from "@/components/video/ProtectedVideoWrapper";

// Em qualquer componente com vídeo:
<ProtectedVideoWrapper className="aspect-video">
  <iframe
    src={getProtectedYouTubeUrl(videoId, true)}
    className="w-full h-full"
    allowFullScreen
  />
</ProtectedVideoWrapper>
```

---

## 🎯 MÁSCARAS DE PROTEÇÃO

O wrapper adiciona 4 máscaras invisíveis que bloqueiam cliques:

| Área | Dimensão | O que bloqueia |
|------|----------|----------------|
| Inferior esquerdo | 200x65px | "Assistir no YouTube", Logo |
| Superior direito | 160x55px | Compartilhar, Configurações |
| Inferior direito | 60x50px | Botões adicionais |
| Lateral esquerda | 50x100px | Logo YouTube |

---

## 📺 PARÂMETROS DE QUALIDADE

Usar `getProtectedYouTubeUrl()` ou `PROTECTED_PLAYER_VARS`:

```js
{
  vq: "hd1080",        // Força 1080p
  rel: "0",            // Sem vídeos relacionados
  modestbranding: "1", // Minimiza branding
  showinfo: "0",       // Oculta info do canal
  iv_load_policy: "3", // Oculta anotações
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

1. Importar `ProtectedVideoWrapper`
2. Envolver o iframe com o wrapper
3. Usar `getProtectedYouTubeUrl()` para URLs
4. Para YouTube IFrame API, usar `PROTECTED_PLAYER_VARS`

---

## 🔒 PROTEÇÕES ADICIONAIS

- Clique direito bloqueado no container
- `onContextMenu` desabilitado
- Camadas de overlay invisíveis
- Qualidade 1080p forçada via parâmetro `vq=hd1080`

---

**Atualizado em:** 2024-12-21
**Versão:** 1.0
