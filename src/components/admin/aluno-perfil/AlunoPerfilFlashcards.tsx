// ============================================
// SEÇÃO FLASHCARDS E REVISÃO DO ALUNO
// ============================================

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FuturisticCard } from "@/components/ui/futuristic-card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, Brain, RotateCcw, Calendar, Clock, 
  CheckCircle, AlertCircle, TrendingUp
} from "lucide-react";
import { PresetEmptyState } from "@/components/ui/empty-state";

interface AlunoFlashcardsProps {
  userId: string | null;
}

export function AlunoPerfilFlashcards({ userId }: AlunoFlashcardsProps) {
  // Placeholder for flashcard progress (table doesn't exist yet)
  const flashcardProgress: any[] = [];

  // Buscar anotações de lições (como proxy de estudo)
  const { data: annotations } = useQuery({
    queryKey: ['aluno-annotations', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from('lesson_annotations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!userId
  });

  // Buscar notas de lições
  const { data: lessonNotes } = useQuery({
    queryKey: ['aluno-lesson-notes', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from('lesson_notes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!userId
  });

  const totalAnnotations = annotations?.length || 0;
  const totalNotes = lessonNotes?.length || 0;
  const hasData = totalAnnotations > 0 || totalNotes > 0;

  return (
    <FuturisticCard className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-cyan-500/20">
          <BookOpen className="h-5 w-5 text-cyan-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Flashcards & Revisão</h3>
          <p className="text-sm text-muted-foreground">Sistema de repetição espaçada e anotações</p>
        </div>
      </div>

      {!hasData ? (
        <PresetEmptyState preset="noData" />
      ) : (
        <div className="space-y-6">
          {/* Resumo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-background/50 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-4 w-4 text-cyan-400" />
                <span className="text-sm text-muted-foreground">Total Flashcards</span>
              </div>
              <p className="text-2xl font-bold text-foreground">0</p>
              <p className="text-xs text-muted-foreground">Sistema em desenvolvimento</p>
            </div>
            
            <div className="p-4 rounded-lg bg-background/50 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-4 w-4 text-purple-400" />
                <span className="text-sm text-muted-foreground">Anotações</span>
              </div>
              <p className="text-2xl font-bold text-purple-400">{totalAnnotations}</p>
            </div>
            
            <div className="p-4 rounded-lg bg-background/50 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <RotateCcw className="h-4 w-4 text-orange-400" />
                <span className="text-sm text-muted-foreground">Notas de Aula</span>
              </div>
              <p className="text-2xl font-bold text-orange-400">{totalNotes}</p>
            </div>
            
            <div className="p-4 rounded-lg bg-background/50 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-400" />
                <span className="text-sm text-muted-foreground">Taxa Retenção</span>
              </div>
              <p className="text-2xl font-bold text-muted-foreground">--</p>
              <p className="text-xs text-muted-foreground">Dados insuficientes</p>
            </div>
          </div>

          {/* Últimas Anotações */}
          {annotations && annotations.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-400" />
                Últimas Anotações
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {annotations.slice(0, 5).map((annotation: any) => (
                  <div 
                    key={annotation.id}
                    className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20"
                  >
                    <p className="text-sm text-foreground line-clamp-2">{(() => { const val = annotation.content ?? annotation.text; return typeof val === 'string' ? val : (val as any)?.text ?? String(val ?? ''); })()}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(annotation.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Últimas Notas de Aula */}
          {lessonNotes && lessonNotes.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-cyan-400" />
                Últimas Notas de Aula
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {lessonNotes.slice(0, 5).map((note: any) => (
                  <div 
                    key={note.id}
                    className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20"
                  >
                    <p className="text-sm text-foreground line-clamp-2">{note.content || note.note}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(note.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Curva de Esquecimento (Placeholder) */}
          <div className="p-4 rounded-lg bg-background/50 border border-border/50">
            <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-400" />
              Curva de Esquecimento
            </h4>
            <p className="text-sm text-muted-foreground">
              Análise de retenção disponível após uso do sistema de flashcards
            </p>
          </div>
        </div>
      )}
    </FuturisticCard>
  );
}
