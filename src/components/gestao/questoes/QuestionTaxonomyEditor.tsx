// ============================================
// 🏷️ EDITOR DE TAXONOMIA DA QUESTÃO
// HÍBRIDO: MACRO → MICRO (hierárquico) + TEMA/SUBTEMA (busca livre)
// ============================================

import { memo, useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  FolderTree, 
  Save, 
  X, 
  Edit2, 
  Loader2,
  ChevronRight,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useTaxonomyForSelects } from '@/hooks/useQuestionTaxonomy';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface QuestionTaxonomyEditorProps {
  questionId: string;
  currentMacro?: string | null;
  currentMicro?: string | null;
  currentTema?: string | null;
  currentSubtema?: string | null;
  onUpdate?: () => void;
  className?: string;
}

const QuestionTaxonomyEditor = memo(function QuestionTaxonomyEditor({
  questionId,
  currentMacro,
  currentMicro,
  currentTema,
  currentSubtema,
  onUpdate,
  className,
}: QuestionTaxonomyEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Popover states for combobox
  const [temaOpen, setTemaOpen] = useState(false);
  const [subtemaOpen, setSubtemaOpen] = useState(false);
  
  // Local state for selections
  const [macro, setMacro] = useState(currentMacro || '');
  const [micro, setMicro] = useState(currentMicro || '');
  const [tema, setTema] = useState(currentTema || '');
  const [subtema, setSubtema] = useState(currentSubtema || '');
  
  // Taxonomy hook
  const { 
    macros, 
    getMicrosForSelect, 
    getAllTemasForSelect,
    getAllSubtemasForSelect,
    isLoading: taxonomyLoading 
  } = useTaxonomyForSelects();
  
  // Derived options
  const microOptions = macro ? getMicrosForSelect(macro) : [];
  const allTemas = useMemo(() => getAllTemasForSelect(), [getAllTemasForSelect]);
  const allSubtemas = useMemo(() => getAllSubtemasForSelect(), [getAllSubtemasForSelect]);
  
  // Reset to current values when editing is cancelled
  useEffect(() => {
    if (!isEditing) {
      setMacro(currentMacro || '');
      setMicro(currentMicro || '');
      setTema(currentTema || '');
      setSubtema(currentSubtema || '');
    }
  }, [isEditing, currentMacro, currentMicro, currentTema, currentSubtema]);
  
  // Cascade reset when MACRO changes (only resets MICRO)
  const handleMacroChange = useCallback((value: string) => {
    setMacro(value);
    setMicro('');
    // TEMA e SUBTEMA NÃO resetam - são independentes
  }, []);
  
  // MICRO change - não reseta TEMA/SUBTEMA (híbrido)
  const handleMicroChange = useCallback((value: string) => {
    setMicro(value);
    // Não reseta tema/subtema - são independentes
  }, []);
  
  // Save to database
  // P0 FIX UNIVERSAL: Converter VALUE → LABEL antes de salvar (LEI SUPREMA)
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      // Buscar labels correspondentes aos values selecionados
      const macroLabel = macros.find(m => m.value === macro)?.label || macro || null;
      const microLabel = microOptions.find(m => m.value === micro)?.label || micro || null;
      const temaLabel = allTemas.find(t => t.value === tema)?.label || tema || null;
      const subtemaLabel = allSubtemas.find(s => s.value === subtema)?.label || subtema || null;
      
      const { error } = await supabase
        .from('quiz_questions')
        .update({
          macro: macroLabel,
          micro: microLabel,
          tema: temaLabel,
          subtema: subtemaLabel,
          updated_at: new Date().toISOString(),
        })
        .eq('id', questionId);
      
      if (error) throw error;
      
      toast.success('Taxonomia atualizada com sucesso!');
      setIsEditing(false);
      onUpdate?.();
    } catch (err) {
      console.error('Erro ao salvar taxonomia:', err);
      toast.error('Erro ao salvar taxonomia');
    } finally {
      setIsSaving(false);
    }
  }, [questionId, macro, micro, tema, subtema, macros, microOptions, allTemas, allSubtemas, onUpdate]);
  
  // Check if there are changes
  const hasChanges = 
    macro !== (currentMacro || '') ||
    micro !== (currentMicro || '') ||
    tema !== (currentTema || '') ||
    subtema !== (currentSubtema || '');
  
  // Get label for display - LEI SUPREMA: NUNCA expor VALUE
  const getTemaLabel = (value: string) => allTemas.find(t => t.value === value)?.label || 'Carregando...';
  const getSubtemaLabel = (value: string) => allSubtemas.find(s => s.value === value)?.label || 'Carregando...';
  
  return (
    <Card className={cn("border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <FolderTree className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <CardTitle className="text-lg text-amber-500 flex items-center gap-2">
                Classificação Taxonômica
                <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-500">
                  HÍBRIDO
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                MACRO/MICRO hierárquicos • TEMA/SUBTEMA: busca livre (qualquer área)
              </CardDescription>
            </div>
          </div>
          
          {!isEditing ? (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditing(true)}
              className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
            >
              <Edit2 className="h-4 w-4 mr-1" />
              Editar
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
              >
                <X className="h-4 w-4 mr-1" />
                Cancelar
              </Button>
              <Button 
                size="sm" 
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                Salvar
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {isEditing ? (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {taxonomyLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* MACRO - Select normal */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-amber-500 flex items-center gap-1">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-xs">1</span>
                    MACRO
                    <Badge variant="secondary" className="text-[10px] ml-1">obrigatório</Badge>
                  </label>
                  <Select value={macro} onValueChange={handleMacroChange}>
                    <SelectTrigger className="border-amber-500/30 focus:ring-amber-500">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {macros.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* MICRO - Select filtrado por MACRO */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-orange-500 flex items-center gap-1">
                    <span className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center text-xs">2</span>
                    MICRO
                    <Badge variant="secondary" className="text-[10px] ml-1">obrigatório</Badge>
                  </label>
                  <Select 
                    value={micro} 
                    onValueChange={handleMicroChange}
                    disabled={!macro || microOptions.length === 0}
                  >
                    <SelectTrigger className="border-orange-500/30 focus:ring-orange-500">
                      <SelectValue placeholder={macro ? "Selecione..." : "Selecione MACRO primeiro"} />
                    </SelectTrigger>
                    <SelectContent>
                      {microOptions.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* TEMA - Combobox com busca livre */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-rose-500 flex items-center gap-1">
                    <span className="w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center text-xs">3</span>
                    TEMA
                    <Badge variant="outline" className="text-[10px] ml-1 border-rose-500/30 text-rose-500">livre</Badge>
                  </label>
                  <Popover open={temaOpen} onOpenChange={setTemaOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={temaOpen}
                        className="w-full justify-between border-rose-500/30 focus:ring-rose-500 hover:bg-rose-500/5"
                      >
                        {tema ? getTemaLabel(tema) : "Buscar tema..."}
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0 z-50" align="start">
                      <Command>
                        <CommandInput placeholder="Digite para buscar..." />
                        <CommandList>
                          <CommandEmpty>Nenhum tema encontrado.</CommandEmpty>
                          <CommandGroup className="max-h-[200px] overflow-auto">
                            {allTemas.map((t) => (
                              <CommandItem
                                key={t.value}
                                value={t.label}
                                onSelect={() => {
                                  setTema(t.value);
                                  setTemaOpen(false);
                                }}
                              >
                                {t.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {tema && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 text-xs text-muted-foreground"
                      onClick={() => setTema('')}
                    >
                      Limpar
                    </Button>
                  )}
                </div>
                
                {/* SUBTEMA - Combobox com busca livre */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-purple-500 flex items-center gap-1">
                    <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-xs">4</span>
                    SUBTEMA
                    <Badge variant="outline" className="text-[10px] ml-1 border-purple-500/30 text-purple-500">livre</Badge>
                  </label>
                  <Popover open={subtemaOpen} onOpenChange={setSubtemaOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={subtemaOpen}
                        className="w-full justify-between border-purple-500/30 focus:ring-purple-500 hover:bg-purple-500/5"
                      >
                        {subtema ? getSubtemaLabel(subtema) : "Buscar subtema..."}
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0 z-50" align="start">
                      <Command>
                        <CommandInput placeholder="Digite para buscar..." />
                        <CommandList>
                          <CommandEmpty>Nenhum subtema encontrado.</CommandEmpty>
                          <CommandGroup className="max-h-[200px] overflow-auto">
                            {allSubtemas.map((s) => (
                              <CommandItem
                                key={s.value}
                                value={s.label}
                                onSelect={() => {
                                  setSubtema(s.value);
                                  setSubtemaOpen(false);
                                }}
                              >
                                {s.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {subtema && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 text-xs text-muted-foreground"
                      onClick={() => setSubtema('')}
                    >
                      Limpar
                    </Button>
                  )}
                </div>
              </div>
            )}
            
            {/* Preview da seleção */}
            {(macro || micro || tema || subtema) && (
              <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border/50">
                <p className="text-xs text-muted-foreground mb-2">Hierarquia selecionada:</p>
                <div className="flex items-center gap-1 flex-wrap text-sm">
                  {macro && (
                    <Badge variant="outline" className="border-amber-500/50 text-amber-500">
                      {/* LEI SUPREMA: Só exibe LABEL, nunca VALUE */}
                      {macros.find(m => m.value === macro)?.label || 'Carregando...'}
                    </Badge>
                  )}
                  {micro && (
                    <>
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      <Badge variant="outline" className="border-orange-500/50 text-orange-500">
                        {/* LEI SUPREMA: Só exibe LABEL, nunca VALUE */}
                        {microOptions.find(m => m.value === micro)?.label || 'Carregando...'}
                      </Badge>
                    </>
                  )}
                  {tema && (
                    <>
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      <Badge variant="outline" className="border-rose-500/50 text-rose-500">
                        {getTemaLabel(tema)}
                      </Badge>
                    </>
                  )}
                  {subtema && (
                    <>
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      <Badge variant="outline" className="border-purple-500/50 text-purple-500">
                        {getSubtemaLabel(subtema)}
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          /* Modo visualização - LEI SUPREMA: NUNCA expor VALUE, apenas LABEL */
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs mb-1">MACRO</p>
              {currentMacro ? (
                <Badge variant="outline" className="border-amber-500/50 text-amber-500">
                  {macros.find(m => m.value === currentMacro)?.label || 'Carregando...'}
                </Badge>
              ) : (
                <span className="text-muted-foreground italic">Não definido</span>
              )}
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">MICRO</p>
              {currentMicro ? (
                <Badge variant="outline" className="border-orange-500/50 text-orange-500">
                  {/* LEI SUPREMA: Buscar LABEL a partir do MACRO atual */}
                  {(currentMacro ? getMicrosForSelect(currentMacro) : []).find(m => m.value === currentMicro)?.label || 'Carregando...'}
                </Badge>
              ) : (
                <span className="text-muted-foreground italic">Não definido</span>
              )}
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">TEMA</p>
              {currentTema ? (
                <Badge variant="outline" className="border-rose-500/50 text-rose-500">
                  {/* LEI SUPREMA: Buscar LABEL do TEMA */}
                  {getTemaLabel(currentTema)}
                </Badge>
              ) : (
                <span className="text-muted-foreground italic">Não definido</span>
              )}
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">SUBTEMA</p>
              {currentSubtema ? (
                <Badge variant="outline" className="border-purple-500/50 text-purple-500">
                  {/* LEI SUPREMA: Buscar LABEL do SUBTEMA */}
                  {getSubtemaLabel(currentSubtema)}
                </Badge>
              ) : (
                <span className="text-muted-foreground italic">Não definido</span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export default QuestionTaxonomyEditor;