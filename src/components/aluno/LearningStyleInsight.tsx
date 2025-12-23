// ============================================
// LEARNING STYLE INSIGHT - SANTUÁRIO BETA v9.0
// GPU-ONLY animations via useQuantumReactivity
// ============================================

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { Brain, Eye, Headphones, BookOpen, Sparkles, Lightbulb } from "lucide-react";
import { useQuantumReactivity } from "@/hooks/useQuantumReactivity";

type LearningStyle = 'visual' | 'auditivo' | 'leitor' | 'cinesico';

interface LearningStyleInsightProps {
  learningStyle?: string;
}

const styleData: Record<LearningStyle, {
  icon: typeof Eye;
  title: string;
  description: string;
  tips: string[];
  color: string;
  gradient: string;
  emoji: string;
}> = {
  visual: {
    icon: Eye,
    title: 'Aprendiz Visual',
    description: 'Você aprende melhor com imagens, gráficos e representações visuais.',
    tips: [
      'Use mapas mentais para organizar conceitos',
      'Assista videoaulas com atenção aos diagramas',
      'Crie flashcards com imagens e cores'
    ],
    color: 'text-blue-500',
    gradient: 'from-blue-500/20 to-cyan-500/10',
    emoji: '👁️'
  },
  auditivo: {
    icon: Headphones,
    title: 'Aprendiz Auditivo',
    description: 'Você absorve melhor o conteúdo ouvindo explicações e discussões.',
    tips: [
      'Ouça as aulas em velocidade confortável',
      'Grave resumos e ouça depois',
      'Explique conceitos em voz alta para fixar'
    ],
    color: 'text-purple-500',
    gradient: 'from-purple-500/20 to-pink-500/10',
    emoji: '🎧'
  },
  leitor: {
    icon: BookOpen,
    title: 'Aprendiz Leitor',
    description: 'Você aprende melhor lendo e escrevendo, processando texto.',
    tips: [
      'Faça anotações detalhadas durante as aulas',
      'Leia os resumos gerados pela IA',
      'Escreva seus próprios resumos para fixar'
    ],
    color: 'text-emerald-500',
    gradient: 'from-emerald-500/20 to-green-500/10',
    emoji: '📚'
  },
  cinesico: {
    icon: Brain,
    title: 'Aprendiz Cinestésico',
    description: 'Você aprende melhor praticando e experimentando.',
    tips: [
      'Resolva muitas questões práticas',
      'Use simulados para testar seu conhecimento',
      'Faça experimentos mentais com os conceitos'
    ],
    color: 'text-amber-500',
    gradient: 'from-amber-500/20 to-orange-500/10',
    emoji: '🔬'
  }
};

export function LearningStyleInsight({ learningStyle }: LearningStyleInsightProps) {
  // Default para visual se não tiver estilo definido
  const style = (learningStyle as LearningStyle) || 'visual';
  const data = styleData[style] || styleData.visual;
  const StyleIcon = data.icon;

  // Mock de confiança - na versão real, virá da IA
  const confidence = 78;

  return (
    <Card className={`bg-gradient-to-br ${data.gradient} border-0`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <div className={`p-2 rounded-xl bg-background/50`}>
              <StyleIcon className={`w-4 h-4 ${data.color}`} />
            </div>
            Seu Estilo de Aprendizado
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            <Sparkles className="w-3 h-3 mr-1" />
            IA
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <div className="text-4xl">{data.emoji}</div>
          <div>
            <h3 className={`font-bold text-lg ${data.color}`}>{data.title}</h3>
            <p className="text-sm text-muted-foreground">{data.description}</p>
          </div>
        </motion.div>

        {/* Barra de confiança */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Confiança da análise</span>
            <span className="font-medium">{confidence}%</span>
          </div>
          <Progress value={confidence} className="h-1.5" />
        </div>

        {/* Dicas personalizadas */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            Dicas para você:
          </div>
          <ul className="space-y-1.5">
            {data.tips.map((tip, index) => (
              <motion.li 
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-xs text-muted-foreground flex items-start gap-2 pl-2"
              >
                <span className="text-primary mt-0.5">•</span>
                {tip}
              </motion.li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
