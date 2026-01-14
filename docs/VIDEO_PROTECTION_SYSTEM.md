# 🔥 SISTEMA DE PROTEÇÃO DE VÍDEOS - OMEGA FORTRESS v2400

## 📌 REGRA SOBERANA ABSOLUTA (LEI IMUTÁVEL)

**TODOS os vídeos do sistema DEVEM usar EXCLUSIVAMENTE o `OmegaFortressPlayer`:**

```tsx
import { OmegaFortressPlayer } from "@/components/video";

<OmegaFortressPlayer
  videoId={videoId}
  type="youtube" // ou "panda" ou "vimeo"
  title="Título do Vídeo"
  showSecurityBadge
  showWatermark
  autoplay={false}
/>
```

---

## 🛡️ 7 CAMADAS DE PROTEÇÃO (OMEGA)

| Camada | Nome | Proteção |
|--------|------|----------|
| 1 | **Disclaimer Legal** | Aviso obrigatório 3s antes da reprodução |
| 2 | **Escudo CSS** | Máscaras invisíveis que bloqueiam cliques em áreas sensíveis |
| 3 | **Escudo JS (Cliques)** | Bloqueio de contextmenu, drag, select, copy |
| 4 | **Escudo JS (Teclado)** | Bloqueio de F12, Ctrl+Shift+I/J/C, PrintScreen |
| 5 | **Anti-DevTools** | Detecção de DevTools via timing attacks |
| 6 | **Watermark Forense** | Nome + CPF + Email do usuário (dinâmica) |
| 7 | **SANCTUM 2.0** | Sessão única, heartbeat 30s, threat score |

---

## ⚠️ COMPONENTES LEGADOS (PROIBIDOS)

Os seguintes componentes são **LEGADOS** e **NÃO DEVEM SER USADOS**:

```tsx
// ❌ PROIBIDO - Use OmegaFortressPlayer
import { FortressVideoPlayer } from "@/components/video";
import { FortressPlayerWrapper } from "@/components/video";
import { ProtectedVideoWrapper } from "@/components/video";
import { VideoPlayer2300 } from "@/components/ui/video-player-2300";
import { YouTubePlayer } from "@/components/lms/YouTubePlayer";
import { LazyVideoPlayer } from "@/components/video";

// ✅ CORRETO - ÚNICO PERMITIDO
import { OmegaFortressPlayer } from "@/components/video";
```

---

## ✅ ARQUIVOS COM OMEGA FORTRESS

- [x] `src/pages/aluno/AlunoPlanejamento.tsx`
- [x] `src/pages/aluno/AlunoVideoaulas.tsx`
- [x] `src/pages/gestao/GestaoVideoaulas.tsx`
- [x] `src/components/landing/FuturisticVideoPlayer.tsx`
- [x] `src/components/landing/VideoFeedbackCarousel.tsx`
- [x] `src/components/aluno/AlunoCoursesHierarchy.tsx`
- [x] `src/components/aluno/questoes/TreinoReviewModal.tsx`
- [x] `src/components/simulados/screens/SimuladoReviewScreen.tsx`
- [x] `src/pages/Aula.tsx`
- [x] `src/pages/empresas/ArquivosEmpresariais.tsx`

---

## 🔒 BYPASS DO OWNER

O Owner (moisesblank@gmail.com) possui bypass automático:
- Watermark não exibida
- Sem bloqueio de DevTools
- Sem restrições de captura

Verificado via `useRolePermissions().isOwner`

---

## 📺 PARÂMETROS OBRIGATÓRIOS

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `videoId` | ✅ | ID do vídeo (YouTube, Panda ou Vimeo) |
| `type` | ✅ | `"youtube"` \| `"panda"` \| `"vimeo"` |
| `title` | ⚠️ | Título para acessibilidade |
| `showWatermark` | ⚠️ | Habilitar watermark forense |
| `autoplay` | ❌ | Default: false (Disclaimer obrigatório) |

---

**Atualizado em:** 2026-01-14
**Versão:** 3.0 - OMEGA FORTRESS SOVEREIGN
**Autoridade:** CONSTITUIÇÃO SYNAPSE Ω v10.4
