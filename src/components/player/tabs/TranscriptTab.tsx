// ============================================
// TRANSCRIÇÃO TAB - Exibe transcrição do vídeo
// Lei I: Carregamento otimizado
// ============================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Search, Copy, Check, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

interface TranscriptTabProps {
  lessonId: string;
  transcript?: string;
}

// Exemplo de transcrição formatada com timestamps
const SAMPLE_TRANSCRIPT = `[00:00] Olá pessoal, bem-vindos a mais uma aula do curso de Química!

[00:15] Hoje vamos estudar um tema muito importante para o ENEM: Diagramas de Fases.

[01:30] Primeiro, vamos entender o que é um diagrama de fases. É uma representação gráfica que mostra como uma substância se comporta em diferentes condições de temperatura e pressão.

[03:45] O ponto triplo é onde as três fases coexistem em equilíbrio. É um ponto único para cada substância.

[05:00] Já o ponto crítico marca o limite acima do qual não existe distinção entre líquido e gás - temos o fluido supercrítico.

[07:30] Vamos analisar o diagrama da água. Percebam que a linha de fusão tem inclinação negativa - isso é exclusivo da água!

[10:00] Por que isso acontece? Porque o gelo é menos denso que a água líquida. Isso permite que patinadores deslizem no gelo!

[12:30] Agora vamos ver algumas questões do ENEM sobre esse tema...

[15:00] Na questão 1, eles pedem para identificar qual substância está representada no diagrama...

[18:00] Lembrem-se: a inclinação da linha de fusão nos diz muito sobre as propriedades da substância.

[20:00] Vamos para a próxima questão que envolve o ponto triplo...`;

function TranscriptTab({ lessonId, transcript }: TranscriptTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);

  const content = transcript || SAMPLE_TRANSCRIPT;

  // Destacar termos pesquisados
  const highlightText = (text: string, search: string) => {
    if (!search.trim()) return text;
    
    const regex = new RegExp(`(${search})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? (
        <mark key={i} className="bg-primary/30 text-foreground rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Formatar linhas com timestamp
  const formatTranscript = () => {
    const lines = content.split('\n').filter(line => line.trim());
    
    return lines.map((line, idx) => {
      const timestampMatch = line.match(/^\[(\d{2}:\d{2})\]/);
      const timestamp = timestampMatch ? timestampMatch[1] : null;
      const text = timestamp ? line.replace(/^\[\d{2}:\d{2}\]\s*/, '') : line;
      
      // Filtrar por pesquisa
      if (searchTerm && !text.toLowerCase().includes(searchTerm.toLowerCase())) {
        return null;
      }

      return (
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.02 }}
          className="flex gap-3 py-3 border-b border-border/50 last:border-0 hover:bg-muted/30 rounded-lg px-2 -mx-2 transition-colors cursor-pointer"
        >
          {timestamp && (
            <div className="flex items-start gap-1 text-xs text-primary font-mono shrink-0 pt-0.5">
              <Clock className="h-3 w-3" />
              {timestamp}
            </div>
          )}
          <p className="text-sm text-foreground leading-relaxed">
            {highlightText(text, searchTerm)}
          </p>
        </motion.div>
      );
    }).filter(Boolean);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    toast({ title: "Copiado!", description: "Transcrição copiada para a área de transferência." });
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredCount = formatTranscript().length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <FileText className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h3 className="font-semibold">Transcrição da Aula</h3>
            <p className="text-xs text-muted-foreground">
              Gerada automaticamente • Clique no timestamp para ir ao momento
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {filteredCount} trechos
          </Badge>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
            {copied ? 'Copiado' : 'Copiar'}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar na transcrição..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Transcript Content */}
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-1">
          {formatTranscript()}
        </div>
        
        {filteredCount === 0 && searchTerm && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">
              Nenhum resultado para "{searchTerm}"
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

export default TranscriptTab;
