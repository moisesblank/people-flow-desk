// ============================================
// 📚 MATERIAIS MODAL CONTENT
// Acesso via Hub do Aluno (/alunos/planejamento)
// Flashcards + Mapas Mentais consolidados
// ============================================

import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Brain, 
  BookOpen, 
  FileText, 
  Zap, 
  Flame, 
  ChevronRight,
  Map,
  Lightbulb,
  Layers,
  Play
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useGamification } from "@/hooks/useGamification";

export const MateriaisModalContent = memo(function MateriaisModalContent() {
  const navigate = useNavigate();
  const { gamification } = useGamification();
  
  const streak = gamification?.current_streak || 0;
  const totalXp = gamification?.total_xp || 0;

  // Buscar contagem de materiais (areas como proxy)
  const { data: materiaisCount, isLoading: materiaisLoading } = useQuery({
    queryKey: ['hub-materiais-count'],
    queryFn: async () => {
      // Usando 'areas' como proxy para materiais disponíveis
      const { count, error } = await supabase
        .from('areas')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
      if (error) throw error;
      return count || 0;
    },
  });

  // Buscar contagem de flashcards via quiz_questions com tag
  const { data: flashcardsCount, isLoading: flashcardsLoading } = useQuery({
    queryKey: ['hub-flashcards-count'],
    queryFn: async () => {
      // Usando quiz_questions como proxy
      // 🔒 FILTROS DE INTEGRIDADE PERMANENTES: Contar apenas questões válidas
      const { count, error } = await supabase
        .from('quiz_questions')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .not('question_text', 'is', null)
        .neq('question_text', '')
        .not('explanation', 'is', null)
        .neq('explanation', '')
        .not('question_type', 'is', null)
        .neq('question_type', '');
      if (error) throw error;
      return count || 0;
    },
  });

  const isLoading = materiaisLoading || flashcardsLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const categories = [
    {
      id: 'flashcards',
      title: 'Flashcards',
      description: 'Revisão espaçada para memorização',
      icon: Brain,
      count: flashcardsCount || 0,
      gradient: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10 border-purple-500/30',
      path: '/alunos/materiais?tab=flashcards',
    },
    {
      id: 'mapas',
      title: 'Mapas Mentais',
      description: 'Visualize conceitos complexos',
      icon: Map,
      count: 0, // Placeholder
      gradient: 'from-cyan-500 to-blue-500',
      bgColor: 'bg-cyan-500/10 border-cyan-500/30',
      path: '/alunos/materiais?tab=mapas',
    },
    {
      id: 'resumos',
      title: 'Resumos & PDFs',
      description: 'Material de apoio em PDF',
      icon: FileText,
      count: materiaisCount || 0,
      gradient: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-500/10 border-amber-500/30',
      path: '/alunos/materiais?tab=resumos',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="pt-4 text-center">
            <Flame className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{streak}</div>
            <div className="text-xs text-muted-foreground">Dias de Streak</div>
          </CardContent>
        </Card>
        <Card className="border-purple-500/20 bg-purple-500/5">
          <CardContent className="pt-4 text-center">
            <Zap className="w-6 h-6 text-purple-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{totalXp.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">XP Total</div>
          </CardContent>
        </Card>
      </div>

      {/* Dica */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-purple-600">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold">Dica de Estudo</h3>
              <p className="text-sm text-muted-foreground">
                Use flashcards diariamente para fixar conceitos importantes!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categorias */}
      <div className="space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Layers className="w-4 h-4" />
          Tipos de Material
        </h3>
        
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <Card 
              key={cat.id}
              className={cn(
                "cursor-pointer transition-all hover:scale-[1.01]",
                cat.bgColor
              )}
              onClick={() => navigate(cat.path)}
            >
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-3 rounded-xl bg-gradient-to-br shrink-0",
                    cat.gradient
                  )}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium">{cat.title}</h4>
                    <p className="text-sm text-muted-foreground">{cat.description}</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {cat.count > 0 && (
                      <Badge variant="secondary">{cat.count}</Badge>
                    )}
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Acesso Rápido */}
      <div className="grid grid-cols-2 gap-3">
        <Button 
          className="h-14 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          onClick={() => navigate('/alunos/materiais?tab=flashcards')}
        >
          <Brain className="w-5 h-5 mr-2" />
          Flashcards
        </Button>
        <Button 
          variant="outline"
          className="h-14"
          onClick={() => navigate('/alunos/materiais')}
        >
          <BookOpen className="w-5 h-5 mr-2" />
          Ver Todos
        </Button>
      </div>
    </div>
  );
});

export default MateriaisModalContent;
