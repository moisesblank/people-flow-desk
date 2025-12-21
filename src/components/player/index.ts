// ============================================
// PLAYER COMPONENTS - Índice de exportações
// Sistema de abas educacionais v9.0
// ============================================

// Componente principal de abas
export { LessonTabs } from './LessonTabs';
export { default as LessonTabsDefault } from './LessonTabs';

// Widget de progresso
export { LessonProgressWidget } from './LessonProgressWidget';
export { default as LessonProgressWidgetDefault } from './LessonProgressWidget';

// Sub-componentes das abas (lazy loaded)
// Nota: Esses são importados via lazy() no LessonTabs
// export { default as TranscriptTab } from './tabs/TranscriptTab';
// export { default as SummaryTab } from './tabs/SummaryTab';
// export { default as QuizTab } from './tabs/QuizTab';
// export { default as FlashcardsTab } from './tabs/FlashcardsTab';
// export { default as MindmapTab } from './tabs/MindmapTab';
// export { default as NotesTab } from './tabs/NotesTab';
// export { default as AITutorTab } from './tabs/AITutorTab';
