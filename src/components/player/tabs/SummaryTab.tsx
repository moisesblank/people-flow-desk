// ============================================
// RESUMO IA TAB - Resumo gerado por IA
// Integração com Lovable AI
// ============================================

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useQuantumReactivity } from '@/hooks/useQuantumReactivity';
import { Brain, Sparkles, RefreshCw, Copy, Check, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';

interface SummaryTabProps {
  lessonId: string;
  lessonTitle?: string;
}

// Exemplo de resumo (em produção viria da API)
const SAMPLE_SUMMARY = {
  title: "Diagramas de Fases e Mudanças de Estado",
  keyPoints: [
    "Diagramas de fases mostram o comportamento de substâncias em diferentes temperaturas e pressões",
    "O ponto triplo é onde as três fases (sólido, líquido e gás) coexistem em equilíbrio",
    "O ponto crítico marca o limite do fluido supercrítico",
    "A água tem comportamento anômalo: sua linha de fusão tem inclinação negativa",
    "Isso explica por que o gelo flutua e permite a patinação no gelo"
  ],
  concepts: [
    { term: "Ponto Triplo", definition: "Condição única de T e P onde as três fases coexistem" },
    { term: "Ponto Crítico", definition: "Limite acima do qual não há distinção entre líquido e gás" },
    { term: "Fluido Supercrítico", definition: "Estado da matéria com propriedades de líquido e gás" },
    { term: "Sublimação", definition: "Passagem direta de sólido para gás" }
  ],
  summary: `Esta aula abordou os diagramas de fases, fundamentais para entender como substâncias mudam de estado físico. 

O diagrama relaciona temperatura e pressão, mostrando as regiões onde cada fase (sólido, líquido, gás) é estável.

Destaque especial para o comportamento anômalo da água, cuja linha de fusão tem inclinação negativa - diferente de quase todas as outras substâncias. Isso ocorre porque o gelo é menos denso que a água líquida.

Para o ENEM, é importante saber interpretar diagramas e identificar pontos triplo e crítico.`
};

function SummaryTab({ lessonId, lessonTitle }: SummaryTabProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [summary] = useState(SAMPLE_SUMMARY);

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    // Simular chamada à API
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    toast({ title: "Resumo atualizado!", description: "O resumo foi regenerado pela IA." });
  }, []);

  const handleCopy = () => {
    const fullText = `${summary.title}\n\n${summary.summary}\n\nPontos-chave:\n${summary.keyPoints.map(p => `• ${p}`).join('\n')}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    toast({ title: "Copiado!", description: "Resumo copiado para a área de transferência." });
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[450px] pr-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="flex items-center gap-3">
            <motion.div 
              className="p-2 rounded-lg bg-purple-500/10"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 3 }}
            >
              <Brain className="h-5 w-5 text-purple-500" />
            </motion.div>
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                Resumo Inteligente
                <Sparkles className="h-4 w-4 text-primary" />
              </h3>
              <p className="text-xs text-muted-foreground">
                Gerado por IA • Baseado no conteúdo da aula
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Regenerar
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
              {copied ? 'Copiado' : 'Copiar'}
            </Button>
          </div>
        </div>

        {/* Título do resumo */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-primary/10 border border-purple-500/20">
          <h2 className="text-lg font-bold">{summary.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {lessonTitle || 'Aula do curso'}
          </p>
        </div>

        {/* Pontos-chave */}
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            Pontos-chave
          </h4>
          <div className="space-y-2">
            {summary.keyPoints.map((point, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <Badge variant="outline" className="shrink-0 mt-0.5">
                  {idx + 1}
                </Badge>
                <p className="text-sm">{point}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Conceitos */}
        <div className="space-y-3">
          <h4 className="font-semibold">Conceitos Importantes</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {summary.concepts.map((concept, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                className="p-4 rounded-lg border border-border bg-card"
              >
                <h5 className="font-medium text-primary">{concept.term}</h5>
                <p className="text-sm text-muted-foreground mt-1">{concept.definition}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Resumo completo */}
        <div className="space-y-3">
          <h4 className="font-semibold">Resumo Completo</h4>
          <div className="p-4 rounded-lg bg-muted/30 border border-border">
            <p className="text-sm leading-relaxed whitespace-pre-line">
              {summary.summary}
            </p>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}

export default SummaryTab;
