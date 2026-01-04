# 🔒 REGRA ABSOLUTA — PROTEÇÃO YOUTUBE (LOCKDOWN)

**Status:** VIGENTE E IMUTÁVEL | **Autoridade:** OWNER (moisesblank@gmail.com)  
**Data:** 2025-01-04

---

## ⛔ PROIBIÇÃO ABSOLUTA

**NENHUMA MODIFICAÇÃO** em código, funções, componentes ou Edge Functions relacionados a **vídeos do YouTube** pode ser executada sem **INTERNAL_SECRET** explícito do OWNER.

---

## 🎯 ESCOPO DA PROTEÇÃO

### Arquivos Protegidos (Exemplos):
- `src/components/video/FortressPlayerWrapper.tsx` (partes YouTube)
- `src/components/lms/YouTubePlayer.tsx`
- `src/components/youtube/YouTubeLivePlayer.tsx`
- Qualquer hook/função que contenha "youtube" no nome
- Funções RPC/SQL que processam `provider = 'youtube'`
- Edge Functions relacionadas a YouTube

### Funcionalidades Protegidas:
- Player de YouTube (embed, IFrame API)
- URLs protegidas do YouTube (`getFortressYouTubeUrl`)
- Parâmetros de qualidade YouTube (`FORTRESS_PLAYER_VARS`)
- Detecção de provider YouTube
- Logs e métricas de sessões YouTube

---

## ✅ PERMITIDO SEM AUTORIZAÇÃO

- **Panda Video:** Correções, melhorias, novas features
- **Vimeo:** Correções, melhorias, novas features
- **Infraestrutura compartilhada:** DESDE QUE não afete comportamento do YouTube

---

## 🛡️ JUSTIFICATIVA

Os vídeos do YouTube estão funcionando corretamente. Qualquer alteração não autorizada pode:
1. Quebrar o player existente
2. Afetar a proteção de conteúdo
3. Causar regressão em funcionalidades estáveis

---

## 📋 PROCESSO PARA ALTERAÇÃO

1. Identificar necessidade de mudança
2. Documentar razão e impacto
3. Solicitar **INTERNAL_SECRET** do OWNER
4. Aguardar autorização explícita
5. Executar mudança com rollback preparado

---

**REGRA MÃE:** YouTube funciona → NÃO TOCAR.

