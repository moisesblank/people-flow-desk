# 📚 SISTEMA DE ABAS EDUCACIONAIS v9.0

## 📌 VISÃO GERAL

O sistema de abas educacionais (`LessonTabs`) oferece 7 funcionalidades integradas para maximizar o aprendizado do aluno, todas com lazy loading para performance otimizada.

---

## 🎯 COMPONENTES DISPONÍVEIS

### 1. LessonTabs (Componente Principal)
**Arquivo:** `src/components/player/LessonTabs.tsx`

```tsx
import { LessonTabs } from '@/components/player/LessonTabs';

<LessonTabs
  lessonId="lesson-123"
  lessonTitle="Título da Aula"
  lessonTranscript="Transcrição opcional..."
  className="mt-6"
/>
```

### 2. LessonProgressWidget (Progresso Visual)
**Arquivo:** `src/components/player/LessonProgressWidget.tsx`

```tsx
import { LessonProgressWidget } from '@/components/player/LessonProgressWidget';

<LessonProgressWidget lessonId="lesson-123" />
```

---

## 📑 ABAS DISPONÍVEIS

| Aba | Ícone | Funcionalidade | XP |
|-----|-------|----------------|-----|
| **Resumo IA** | 🧠 Brain | Resumo gerado por IA com pontos-chave | +10 |
| **Quiz** | ❓ HelpCircle | Quiz interativo gamificado | +30 |
| **Flashcards** | 📖 BookOpen | Cards de memorização FSRS | +20 |
| **Transcrição** | 📄 FileText | Transcrição com busca e timestamps | - |
| **Mapa Mental** | 🔗 Network | Visualização hierárquica do conteúdo | +15 |
| **Anotações** | ✏️ Pencil | Notas pessoais do aluno | +15 |
| **TRAMON** | 🤖 Bot | Tutor IA para tirar dúvidas | - |

---

## 🔧 ARQUIVOS DO SISTEMA

```
src/components/player/
├── LessonTabs.tsx           # Componente principal
├── LessonProgressWidget.tsx # Widget de progresso
├── index.ts                 # Exportações
└── tabs/
    ├── TranscriptTab.tsx    # Transcrição
    ├── SummaryTab.tsx       # Resumo IA
    ├── QuizTab.tsx          # Quiz gamificado
    ├── FlashcardsTab.tsx    # Flashcards
    ├── MindmapTab.tsx       # Mapa mental
    ├── NotesTab.tsx         # Anotações
    └── AITutorTab.tsx       # TRAMON inline

src/hooks/
├── useLessonNotes.ts        # Gerenciamento de anotações
└── useLessonAI.ts           # Conteúdo gerado por IA
```

---

## ⚡ FEATURES IMPLEMENTADAS

### 📝 TranscriptTab
- ✅ Busca em tempo real na transcrição
- ✅ Timestamps clicáveis
- ✅ Highlight dos termos pesquisados
- ✅ Copiar transcrição completa

### 🧠 SummaryTab
- ✅ Resumo estruturado por IA
- ✅ Pontos-chave destacados
- ✅ Conceitos importantes com definições
- ✅ Botão de regenerar

### ❓ QuizTab
- ✅ Quiz com 4 questões por aula
- ✅ Feedback instantâneo
- ✅ Explicação após cada resposta
- ✅ Gamificação com XP (+10 por acerto)
- ✅ Tela de resultado final

### 📖 FlashcardsTab
- ✅ Cards flip animados
- ✅ Navegação entre cards
- ✅ Sistema "Sei / Não sei"
- ✅ Indicador de dificuldade
- ✅ Progresso de memorização

### 🔗 MindmapTab
- ✅ Visualização hierárquica
- ✅ Nós coloridos por categoria
- ✅ Zoom in/out
- ✅ Exportar como imagem

### ✏️ NotesTab
- ✅ CRUD completo de anotações
- ✅ Persistência em localStorage
- ✅ Timestamps opcionais
- ✅ Lista de notas na sidebar

### 🤖 AITutorTab (TRAMON)
- ✅ Chat integrado com Lovable AI
- ✅ Streaming de respostas
- ✅ Sugestões de perguntas
- ✅ Contexto da aula automático
- ✅ Limpar histórico

---

## 🎮 INTEGRAÇÃO COM GAMIFICAÇÃO

O sistema se integra com o hook `usePublishEvent` para:
- Publicar eventos de conclusão de atividades
- Conceder XP automaticamente
- Atualizar badges e conquistas

---

## 🔒 SEGURANÇA (Lei II)

- Notas são salvas por usuário (userId)
- Conteúdo IA é cacheado por lessonId
- Acesso protegido pelo BetaLessonGuard

---

## 📱 RESPONSIVIDADE (Lei III)

- Abas com scroll horizontal em mobile
- Labels ocultos em telas pequenas (só ícones)
- Layout adaptativo para todas as abas

---

**Atualizado em:** 2024-12-21
**Versão:** 9.0 - Sistema de Abas Educacionais
