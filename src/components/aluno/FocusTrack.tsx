// ============================================
// TRILHA DE FOCO - SANTUÁRIO BETA v9.0
// O Coração da Experiência Preditiva
// IA monta a trilha diária perfeita para aprovação
// ============================================

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Target, BookOpen, Brain, Clock, Zap, 
  CheckCircle2, PlayCircle, ChevronRight,
  Sparkles, Flame, Trophy, Lock, Star
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FocusItem {
  id: string;
  tipo: 'aula' | 'revisao' | 'questoes' | 'flashcard' | 'simulado';
  titulo: string;
  descricao: string;
  duracao: string;
  xpRecompensa: number;
  concluido: boolean;
  bloqueado: boolean;
  areaId?: string;
  emoji: string;
  urgencia: 'alta' | 'media' | 'baixa';
}

interface FocusTrackProps {
  userId: string;
  currentFocusAreaId?: string;
}

// Mock data - será substituído por dados reais do Supabase + IA
const mockFocusItems: FocusItem[] = [
  {
    id: '1',
    tipo: 'revisao',
    titulo: 'Revisão: Estequiometria',
    descricao: 'Você errou 3 questões ontem. Vamos fixar!',
    duracao: '15 min',
    xpRecompensa: 75,
    concluido: false,
    bloqueado: false,
    emoji: '⚗️',
    urgencia: 'alta'
  },
  {
    id: '2',
    tipo: 'aula',
    titulo: 'Reações Redox - Parte 2',
    descricao: 'Continue sua jornada em Eletroquímica',
    duracao: '45 min',
    xpRecompensa: 100,
    concluido: false,
    bloqueado: false,
    emoji: '⚡',
    urgencia: 'media'
  },
  {
    id: '3',
    tipo: 'questoes',
    titulo: 'Treino Rápido: 10 Questões',
    descricao: 'Questões de Eletroquímica para fixar',
    duracao: '20 min',
    xpRecompensa: 120,
    concluido: false,
    bloqueado: true,
    emoji: '🎯',
    urgencia: 'media'
  },
  {
    id: '4',
    tipo: 'flashcard',
    titulo: 'Flashcards: Potenciais de Redução',
    descricao: 'Revisão espaçada para memorização',
    duracao: '10 min',
    xpRecompensa: 50,
    concluido: false,
    bloqueado: true,
    emoji: '🃏',
    urgencia: 'baixa'
  }
];

export function FocusTrack({ userId, currentFocusAreaId }: FocusTrackProps) {
  const navigate = useNavigate();
  const [items, setItems] = useState<FocusItem[]>(mockFocusItems);
  const [isLoading, setIsLoading] = useState(false);

  const completedCount = items.filter(item => item.concluido).length;
  const totalXP = items.reduce((acc, item) => acc + item.xpRecompensa, 0);
  const earnedXP = items.filter(i => i.concluido).reduce((acc, item) => acc + item.xpRecompensa, 0);
  const progressPercent = (completedCount / items.length) * 100;

  const handleItemClick = (item: FocusItem) => {
    if (item.bloqueado) return;
    
    // Navegar para a atividade correspondente
    switch (item.tipo) {
      case 'aula':
        navigate('/alunos/videoaulas');
        break;
      case 'questoes':
        navigate('/alunos/questoes');
        break;
      case 'flashcard':
        navigate('/alunos/flashcards');
        break;
      case 'revisao':
        navigate('/alunos/caderno-erros');
        break;
      default:
        navigate('/alunos/dashboard');
    }
  };

  const getItemIcon = (tipo: FocusItem['tipo']) => {
    switch (tipo) {
      case 'aula': return PlayCircle;
      case 'revisao': return Brain;
      case 'questoes': return Target;
      case 'flashcard': return Sparkles;
      case 'simulado': return Trophy;
      default: return BookOpen;
    }
  };

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary to-purple-600 shadow-lg shadow-primary/30">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                Sua Trilha de Foco
                <Badge variant="outline" className="text-xs font-normal">
                  <Sparkles className="w-3 h-3 mr-1" />
                  IA
                </Badge>
              </CardTitle>
              <CardDescription>Montada especialmente para você hoje</CardDescription>
            </div>
          </div>
          
          <motion.div 
            className="text-right bg-gradient-to-br from-amber-500/20 to-yellow-500/10 rounded-2xl px-4 py-2"
            whileHover={{ scale: 1.05 }}
          >
            <div className="flex items-center gap-1 justify-end">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="text-lg font-black text-amber-600">{earnedXP}/{totalXP}</span>
            </div>
            <span className="text-xs text-muted-foreground">XP disponível</span>
          </motion.div>
        </div>

        {/* Barra de progresso geral */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Flame className="w-4 h-4 text-orange-500" />
              {completedCount} de {items.length} atividades
            </span>
            <span className="font-semibold text-primary">{Math.round(progressPercent)}% concluído</span>
          </div>
          <Progress value={progressPercent} className="h-3" />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <AnimatePresence>
          {items.map((item, index) => {
            const ItemIcon = getItemIcon(item.tipo);
            const isNext = !item.concluido && !item.bloqueado && 
                          items.slice(0, index).every(i => i.concluido || i.bloqueado);
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`
                  relative flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 cursor-pointer
                  ${item.concluido 
                    ? 'bg-green-500/10 border border-green-500/30' 
                    : item.bloqueado 
                      ? 'bg-muted/30 opacity-60 cursor-not-allowed'
                      : isNext
                        ? 'bg-primary/10 border-2 border-primary/50 shadow-lg shadow-primary/10'
                        : 'bg-muted/50 hover:bg-muted/80'
                  }
                `}
                whileHover={!item.bloqueado ? { x: 5, scale: 1.01 } : {}}
                onClick={() => handleItemClick(item)}
              >
                {/* Indicador de ordem */}
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                  ${item.concluido 
                    ? 'bg-green-500 text-white' 
                    : item.bloqueado 
                      ? 'bg-muted text-muted-foreground'
                      : isNext 
                        ? 'bg-primary text-primary-foreground animate-pulse' 
                        : 'bg-muted text-foreground'
                  }
                `}>
                  {item.concluido ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : item.bloqueado ? (
                    <Lock className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>

                {/* Ícone da atividade */}
                <div className={`
                  w-12 h-12 rounded-2xl flex items-center justify-center text-2xl
                  ${item.urgencia === 'alta' 
                    ? 'bg-red-500/20' 
                    : item.urgencia === 'media'
                      ? 'bg-amber-500/20'
                      : 'bg-blue-500/20'
                  }
                `}>
                  {item.emoji}
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold truncate">{item.titulo}</h4>
                    {item.urgencia === 'alta' && !item.concluido && (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                        Prioridade
                      </Badge>
                    )}
                    {isNext && (
                      <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0 animate-pulse">
                        Próximo
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{item.descricao}</p>
                </div>

                {/* Metadados */}
                <div className="text-right space-y-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
                    <Clock className="w-3 h-3" />
                    {item.duracao}
                  </div>
                  <Badge variant="outline" className={`text-xs ${item.concluido ? 'text-green-500 border-green-500/50' : 'text-amber-500 border-amber-500/50'}`}>
                    <Zap className="w-3 h-3 mr-1" />
                    +{item.xpRecompensa} XP
                  </Badge>
                </div>

                {/* Seta de navegação */}
                {!item.bloqueado && !item.concluido && (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Mensagem motivacional */}
        {completedCount === items.length && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-6 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/30"
          >
            <div className="text-4xl mb-2">🎉</div>
            <h3 className="text-lg font-bold text-green-600">Trilha Concluída!</h3>
            <p className="text-sm text-muted-foreground">
              Você conquistou {totalXP} XP hoje. Incrível dedicação!
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
