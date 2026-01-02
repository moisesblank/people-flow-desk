// ============================================
// 🧪 CHEMICAL IMAGE EXTRACTOR BUTTON
// Permanent Chemical Data Extraction and Normalization Policy v1.0
// ============================================

import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FlaskConical, 
  Loader2, 
  Eye, 
  Copy, 
  Check,
  Sparkles,
  Image as ImageIcon,
  FileText,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useChemicalImageExtraction, ExtractedChemicalData } from '@/hooks/useChemicalImageExtraction';
import { cn } from '@/lib/utils';

interface ChemicalImageExtractorButtonProps {
  imageUrls: string[];
  questionId?: string;
  onExtracted?: (formattedOutput: string, extractedData: ExtractedChemicalData) => void;
  className?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'icon';
}

export const ChemicalImageExtractorButton = memo(function ChemicalImageExtractorButton({
  imageUrls,
  questionId,
  onExtracted,
  className,
  variant = 'outline',
  size = 'sm',
}: ChemicalImageExtractorButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [results, setResults] = useState<ExtractedChemicalData[]>([]);
  const [combinedOutput, setCombinedOutput] = useState('');
  const [copied, setCopied] = useState(false);
  
  const { isExtracting, extractFromMultipleImages, combineExtractedData } = useChemicalImageExtraction();

  const handleExtract = async () => {
    if (imageUrls.length === 0) {
      toast.warning('Nenhuma imagem disponível para análise');
      return;
    }

    setIsDialogOpen(true);
    toast.info(`🔬 Analisando ${imageUrls.length} imagem(ns)...`);

    const extractionResults = await extractFromMultipleImages(imageUrls, questionId);
    
    const extractedDataList = extractionResults
      .filter(r => r.success && r.extractedData)
      .map(r => r.extractedData!);
    
    setResults(extractedDataList);
    
    const combined = combineExtractedData(extractionResults);
    setCombinedOutput(combined);

    const chemicalCount = extractedDataList.filter(d => d.hasChemicalContent).length;
    
    if (chemicalCount > 0) {
      toast.success(`✅ Dados químicos extraídos de ${chemicalCount} imagem(ns)`);
      
      if (onExtracted && extractedDataList.length > 0) {
        onExtracted(combined, extractedDataList[0]);
      }
    } else {
      toast.info('Nenhum dado químico relevante encontrado nas imagens');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(combinedOutput);
    setCopied(true);
    toast.success('Dados copiados para a área de transferência');
    setTimeout(() => setCopied(false), 2000);
  };

  if (imageUrls.length === 0) return null;

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleExtract}
        disabled={isExtracting}
        className={cn('gap-2', className)}
      >
        {isExtracting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Analisando...
          </>
        ) : (
          <>
            <FlaskConical className="h-4 w-4" />
            Extrair Dados Químicos
          </>
        )}
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-primary" />
              Extração de Dados Químicos
            </DialogTitle>
            <DialogDescription>
              Dados químicos extraídos automaticamente das imagens
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            {isExtracting ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <FlaskConical className="h-12 w-12 text-primary" />
                </motion.div>
                <p className="text-muted-foreground">Analisando imagens com IA...</p>
              </div>
            ) : (
              <div className="space-y-6 p-1">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-lg border bg-card p-4 text-center">
                    <ImageIcon className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-2xl font-bold">{imageUrls.length}</p>
                    <p className="text-xs text-muted-foreground">Imagens analisadas</p>
                  </div>
                  <div className="rounded-lg border bg-card p-4 text-center">
                    <FlaskConical className="h-5 w-5 mx-auto mb-2 text-green-500" />
                    <p className="text-2xl font-bold text-green-600">
                      {results.filter(r => r.hasChemicalContent).length}
                    </p>
                    <p className="text-xs text-muted-foreground">Com dados químicos</p>
                  </div>
                  <div className="rounded-lg border bg-card p-4 text-center">
                    <Zap className="h-5 w-5 mx-auto mb-2 text-amber-500" />
                    <p className="text-2xl font-bold">
                      {results.reduce((acc, r) => acc + (r.equations?.length || 0), 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">Equações extraídas</p>
                  </div>
                </div>

                {/* Extracted Data Details */}
                {results.map((result, index) => (
                  <div key={index} className="rounded-lg border p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant={result.hasChemicalContent ? 'default' : 'secondary'}>
                        Imagem {index + 1}
                      </Badge>
                      {result.hasChemicalContent && (
                        <Badge variant="outline" className="bg-green-500/10 text-green-600">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Dados químicos detectados
                        </Badge>
                      )}
                      <Badge variant="outline" className="ml-auto">
                        Confiança: {(result.confidence * 100).toFixed(0)}%
                      </Badge>
                    </div>

                    {result.hasChemicalContent ? (
                      <div className="space-y-3 text-sm">
                        {/* Equations */}
                        {result.equations?.length > 0 && (
                          <div>
                            <p className="font-medium text-primary mb-1">📐 Equações:</p>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                              {result.equations.map((eq, i) => (
                                <li key={i} className="font-mono">{eq}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Atomic Numbers */}
                        {result.atomicNumbers?.length > 0 && (
                          <div>
                            <p className="font-medium text-primary mb-1">⚛️ Dados Atômicos:</p>
                            <div className="flex flex-wrap gap-2">
                              {result.atomicNumbers.map((atom, i) => (
                                <Badge key={i} variant="outline">
                                  Z={atom.z} {atom.element}
                                  {atom.group && ` (grupo ${atom.group})`}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Molar Masses */}
                        {result.molarMasses?.length > 0 && (
                          <div>
                            <p className="font-medium text-primary mb-1">⚖️ Massas Molares:</p>
                            <div className="flex flex-wrap gap-2">
                              {result.molarMasses.map((mass, i) => (
                                <Badge key={i} variant="outline">
                                  {mass.element}: {mass.mass}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Alternative Options */}
                        {result.alternativeOptions?.length > 0 && (
                          <div>
                            <p className="font-medium text-primary mb-1">📝 Alternativas:</p>
                            <ul className="space-y-1">
                              {result.alternativeOptions.map((opt, i) => (
                                <li key={i} className="font-mono text-muted-foreground">
                                  {opt.letter}) {opt.content}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Reaction Conditions */}
                        {result.reactionConditions?.length > 0 && (
                          <div>
                            <p className="font-medium text-primary mb-1">🔥 Condições:</p>
                            <p className="text-muted-foreground">
                              {result.reactionConditions.join('; ')}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        Nenhum dado químico relevante detectado nesta imagem.
                      </p>
                    )}
                  </div>
                ))}

                {/* Combined Output */}
                {combinedOutput && (
                  <div className="rounded-lg border bg-muted/50 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Saída Formatada
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopy}
                        className="gap-2"
                      >
                        {copied ? (
                          <>
                            <Check className="h-4 w-4 text-green-500" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Copiar
                          </>
                        )}
                      </Button>
                    </div>
                    <pre className="text-sm whitespace-pre-wrap font-mono text-muted-foreground bg-background rounded p-3">
                      {combinedOutput}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
});

export default ChemicalImageExtractorButton;
