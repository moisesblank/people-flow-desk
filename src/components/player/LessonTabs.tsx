// ============================================
// MOISÉS MEDEIROS v9.1 - LESSON TABS
// Sistema de abas educacionais com IA
// Lei I: Performance | Lei IV: Poder do Arquiteto
// NOVO: Aba de Materiais (PDF)
// ============================================

import { useState, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuantumReactivity } from '@/hooks/useQuantumReactivity';
import { 
  FileText, 
  Brain, 
  HelpCircle, 
  BookOpen, 
  Network, 
  Pencil,
  Bot,
  Loader2,
  File
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Lazy load tabs para performance (Lei I)
const TranscriptTab = lazy(() => import('./tabs/TranscriptTab'));
const SummaryTab = lazy(() => import('./tabs/SummaryTab'));
const QuizTab = lazy(() => import('./tabs/QuizTab'));
const FlashcardsTab = lazy(() => import('./tabs/FlashcardsTab'));
const MindmapTab = lazy(() => import('./tabs/MindmapTab'));
const NotesTab = lazy(() => import('./tabs/NotesTab'));
const AITutorTab = lazy(() => import('./tabs/AITutorTab'));
const MaterialsTab = lazy(() => import('./tabs/MaterialsTab'));

// Configuração das abas
const TABS = [
  { id: 'summary', label: 'Resumo IA', icon: Brain, color: 'text-purple-500' },
  { id: 'materials', label: 'Materiais', icon: File, color: 'text-red-500' },
  { id: 'quiz', label: 'Quiz', icon: HelpCircle, color: 'text-green-500' },
  { id: 'flashcards', label: 'Flashcards', icon: BookOpen, color: 'text-blue-500' },
  { id: 'transcript', label: 'Transcrição', icon: FileText, color: 'text-amber-500' },
  { id: 'mindmap', label: 'Mapa Mental', icon: Network, color: 'text-pink-500' },
  { id: 'notes', label: 'Anotações', icon: Pencil, color: 'text-emerald-500' },
  { id: 'tutor', label: 'TRAMON', icon: Bot, color: 'text-primary' },
] as const;

type TabId = typeof TABS[number]['id'];

interface LessonTabsProps {
  lessonId: string;
  lessonTitle?: string;
  lessonTranscript?: string;
  className?: string;
}

// Loading skeleton para tabs
function TabSkeleton() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );
}

export function LessonTabs({ lessonId, lessonTitle, lessonTranscript, className }: LessonTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('summary');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'summary':
        return <SummaryTab lessonId={lessonId} lessonTitle={lessonTitle} />;
      case 'materials':
        return <MaterialsTab lessonId={lessonId} />;
      case 'quiz':
        return <QuizTab lessonId={lessonId} />;
      case 'flashcards':
        return <FlashcardsTab lessonId={lessonId} />;
      case 'transcript':
        return <TranscriptTab lessonId={lessonId} transcript={lessonTranscript} />;
      case 'mindmap':
        return <MindmapTab lessonId={lessonId} />;
      case 'notes':
        return <NotesTab lessonId={lessonId} />;
      case 'tutor':
        return <AITutorTab lessonId={lessonId} lessonContext={lessonTitle} />;
      default:
        return null;
    }
  };

  return (
    <div className={cn("bg-card rounded-xl border border-border overflow-hidden", className)}>
      {/* Tab Navigation - Scrollable em mobile */}
      <div className="border-b border-border bg-muted/30">
        <div className="flex overflow-x-auto scrollbar-hide p-2 gap-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                  "hover:bg-background/50",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "" : tab.color)} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content com animação */}
      <div className="p-4 sm:p-6 min-h-[350px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Suspense fallback={<TabSkeleton />}>
              {renderTabContent()}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default LessonTabs;
