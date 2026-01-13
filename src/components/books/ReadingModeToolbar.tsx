// ============================================
// 📚 MODO LEITURA - Toolbar de Ferramentas COMPLETO
// Anotações, Marcações, Desenho e Mais
// DESIGNER 2300 - Apenas visível em fullscreen
// ============================================

import { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookmarkPlus,
  Bookmark,
  StickyNote,
  Highlighter,
  HelpCircle,
  AlertCircle,
  X,
  ChevronRight,
  Loader2,
  Trash2,
  Edit3,
  Pencil,
  Eraser,
  Type,
  Search,
  Download,
  Palette,
  RulerIcon,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  EyeOff,
  Copy,
  Share2,
  Star,
  Flag,
  MessageSquare,
  FileText,
  ListChecks,
  Clock,
  Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { useBookAnnotations, AnnotationType, BookAnnotation, BookBookmark } from '@/hooks/useBookAnnotations';
import { toast } from 'sonner';

// ============================================
// TIPOS
// ============================================

export type ToolMode = 'highlight' | 'pencil' | 'eraser' | 'text';

interface ReadingModeToolbarProps {
  bookId: string;
  currentPage: number;
  isFullscreen: boolean;
  onGoToPage: (page: number) => void;
  onZoomChange?: (zoom: number) => void;
  currentZoom?: number;
  // Novos props para controle de ferramentas de desenho
  activeTool?: ToolMode;
  onToolChange?: (tool: ToolMode) => void;
  drawingColor?: string;
  onColorChange?: (color: string) => void;
  drawingSize?: number;
  onSizeChange?: (size: number) => void;
}

const ANNOTATION_TYPES: { type: AnnotationType; icon: typeof StickyNote; label: string; color: string; description: string }[] = [
  { type: 'note', icon: StickyNote, label: 'Nota', color: '#3b82f6', description: 'Anotação geral' },
  { type: 'highlight', icon: Highlighter, label: 'Destaque', color: '#eab308', description: 'Marcar trecho importante' },
  { type: 'question', icon: HelpCircle, label: 'Dúvida', color: '#8b5cf6', description: 'Marcar para revisar' },
  { type: 'important', icon: AlertCircle, label: 'Importante', color: '#ef4444', description: 'Ponto crítico' },
];

const HIGHLIGHT_COLORS = [
  { name: 'Amarelo', color: '#fef08a', border: '#eab308' },
  { name: 'Verde', color: '#bbf7d0', border: '#22c55e' },
  { name: 'Azul', color: '#bfdbfe', border: '#3b82f6' },
  { name: 'Rosa', color: '#fbcfe8', border: '#ec4899' },
  { name: 'Laranja', color: '#fed7aa', border: '#f97316' },
  { name: 'Roxo', color: '#ddd6fe', border: '#8b5cf6' },
];

const TOOL_BUTTONS: { id: ToolMode; icon: typeof Pencil; label: string; color: string }[] = [
  { id: 'highlight', icon: Highlighter, label: 'Marca-texto', color: '#eab308' },
  { id: 'pencil', icon: Pencil, label: 'Lápis', color: '#3b82f6' },
  { id: 'eraser', icon: Eraser, label: 'Borracha', color: '#ef4444' },
  { id: 'text', icon: Type, label: 'Texto', color: '#22c55e' },
];

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const ReadingModeToolbar = memo(function ReadingModeToolbar({
  bookId,
  currentPage,
  isFullscreen,
  onGoToPage,
  onZoomChange,
  currentZoom = 1,
  activeTool: externalActiveTool,
  onToolChange,
  drawingColor: externalDrawingColor,
  onColorChange,
  drawingSize: externalDrawingSize,
  onSizeChange
}: ReadingModeToolbarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'tools' | 'annotations' | 'bookmarks' | 'search'>('tools');
  const [internalActiveTool, setInternalActiveTool] = useState<ToolMode>('pencil');
  const [newNoteType, setNewNoteType] = useState<AnnotationType>('note');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [internalSelectedColor, setInternalSelectedColor] = useState(HIGHLIGHT_COLORS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showRuler, setShowRuler] = useState(false);
  const [rulerPosition, setRulerPosition] = useState(50);
  const [internalPencilSize, setInternalPencilSize] = useState(3);

  // Usar valores externos se fornecidos, senão usar internos
  const activeTool = externalActiveTool ?? internalActiveTool;
  const setActiveTool = useCallback((tool: ToolMode) => {
    if (onToolChange) {
      onToolChange(tool);
    } else {
      setInternalActiveTool(tool);
    }
  }, [onToolChange]);

  const selectedColor = externalDrawingColor 
    ? HIGHLIGHT_COLORS.find(c => c.color === externalDrawingColor) || HIGHLIGHT_COLORS[0]
    : internalSelectedColor;
  
  const setSelectedColor = useCallback((color: typeof HIGHLIGHT_COLORS[0]) => {
    if (onColorChange) {
      onColorChange(color.color);
    } else {
      setInternalSelectedColor(color);
    }
  }, [onColorChange]);

  const pencilSize = externalDrawingSize ?? internalPencilSize;
  const setPencilSize = useCallback((size: number) => {
    if (onSizeChange) {
      onSizeChange(size);
    } else {
      setInternalPencilSize(size);
    }
  }, [onSizeChange]);

  const {
    annotations,
    bookmarks,
    stats,
    isLoading,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation,
    toggleBookmark,
    isPageBookmarked,
    getAnnotationsForPage,
    isCreatingAnnotation,
    isTogglingBookmark,
    deleteBookmark
  } = useBookAnnotations(bookId);

  const currentPageAnnotations = getAnnotationsForPage(currentPage);
  const currentPageBookmarked = isPageBookmarked(currentPage);

  // Filtrar anotações pela busca
  const filteredAnnotations = searchQuery 
    ? annotations.filter(a => 
        a.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.page_number.toString().includes(searchQuery)
      )
    : annotations;

  // Não renderiza se não estiver em fullscreen
  if (!isFullscreen) return null;

  const handleCreateNote = () => {
    if (!newNoteContent.trim()) return;
    
    createAnnotation({
      book_id: bookId,
      page_number: currentPage,
      annotation_type: newNoteType,
      content: newNoteContent.trim(),
      color: ANNOTATION_TYPES.find(t => t.type === newNoteType)?.color || '#ef4444'
    });
    
    setNewNoteContent('');
    toast.success('Anotação criada!');
  };

  const handleQuickHighlight = () => {
    createAnnotation({
      book_id: bookId,
      page_number: currentPage,
      annotation_type: 'highlight',
      content: `Destaque na página ${currentPage}`,
      color: selectedColor.color
    });
    toast.success('Destaque adicionado!');
  };

  const handleUpdateAnnotation = (id: string) => {
    if (!editContent.trim()) return;
    updateAnnotation({ id, content: editContent.trim() });
    setEditingId(null);
    setEditContent('');
  };

  const handleToggleBookmark = () => {
    toggleBookmark({
      book_id: bookId,
      page_number: currentPage,
      label: `Página ${currentPage}`
    });
  };

  const handleDeleteAllPageAnnotations = () => {
    if (currentPageAnnotations.length === 0) return;
    currentPageAnnotations.forEach(a => deleteAnnotation(a.id));
    toast.success(`${currentPageAnnotations.length} anotações removidas`);
  };

  const handleExportAnnotations = () => {
    const data = annotations.map(a => ({
      pagina: a.page_number,
      tipo: a.annotation_type,
      conteudo: a.content,
      data: new Date(a.created_at).toLocaleDateString('pt-BR')
    }));
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anotacoes-livro-${bookId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Anotações exportadas!');
  };

  const handleCopyAnnotations = () => {
    const text = annotations
      .map(a => `[Página ${a.page_number}] ${a.annotation_type.toUpperCase()}: ${a.content}`)
      .join('\n\n');
    navigator.clipboard.writeText(text);
    toast.success('Anotações copiadas para a área de transferência!');
  };

  return (
    <AnimatePresence>
      {/* 🔶 RÉGUA DE LEITURA - Overlay */}
      {showRuler && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-x-0 z-40 pointer-events-none"
          style={{ top: `${rulerPosition}%` }}
        >
          <div className="h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-80" />
          <div className="h-32 bg-gradient-to-b from-black/40 to-transparent" />
        </motion.div>
      )}

      {/* 🔶 BOTÃO CHAMATIVO DESIGNER 2300 - Posicionado ACIMA da seta */}
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 100, opacity: 0 }}
        className="fixed right-4 top-28 z-50"
      >
        {/* Toggle Button - Grande e Chamativo */}
        {!isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            className="relative group transition-all duration-300 hover:scale-105 active:scale-95"
            title="Abrir Ferramentas de Estudo"
          >
            {/* Glow externo pulsante */}
            <div className="absolute -inset-3 rounded-2xl opacity-60 blur-lg bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 animate-pulse" />
            
            {/* Container principal */}
            <div className="relative flex flex-col items-center gap-2 px-4 py-4 rounded-xl bg-gradient-to-br from-black via-gray-900 to-black border-2 border-amber-500/70 shadow-[0_0_30px_rgba(251,191,36,0.5),inset_0_0_20px_rgba(251,191,36,0.1)] group-hover:border-amber-400 group-hover:shadow-[0_0_40px_rgba(251,191,36,0.7)]">
              {/* Efeito scanline futurístico */}
              <div 
                className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none opacity-20"
                style={{
                  background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)"
                }}
              />
              
              {/* Brilho superior */}
              <div className="absolute top-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
              
              {/* Ícones de ferramentas em grid */}
              <div className="grid grid-cols-2 gap-1.5">
                <Pencil className="w-5 h-5 text-blue-400" style={{ filter: "drop-shadow(0 0 4px rgba(59,130,246,0.6))" }} />
                <Highlighter className="w-5 h-5 text-yellow-400" style={{ filter: "drop-shadow(0 0 4px rgba(234,179,8,0.6))" }} />
                <StickyNote className="w-5 h-5 text-amber-400" style={{ filter: "drop-shadow(0 0 4px rgba(251,191,36,0.6))" }} />
                <Bookmark className={cn("w-5 h-5", currentPageBookmarked ? "text-red-400 fill-red-400" : "text-red-400/60")} style={{ filter: "drop-shadow(0 0 4px rgba(239,68,68,0.6))" }} />
              </div>
              
              {/* Badge de quantidade total */}
              {(stats.totalAnnotations + stats.totalBookmarks) > 0 && (
                <Badge 
                  className="bg-amber-600 text-white border-0 text-xs px-2 py-0.5 font-bold"
                  style={{ boxShadow: "0 0 15px rgba(251,191,36,0.6)" }}
                >
                  {stats.totalAnnotations + stats.totalBookmarks}
                </Badge>
              )}
              
              {/* Texto indicador */}
              <span 
                className="text-[9px] font-bold tracking-wider uppercase text-amber-400"
                style={{ textShadow: "0 0 10px rgba(251,191,36,0.6)" }}
              >
                FERRAMENTAS
              </span>
              
              {/* Seta de expansão */}
              <ChevronRight 
                className="w-4 h-4 text-amber-500 -rotate-180 group-hover:translate-x-1 transition-transform" 
                style={{ filter: "drop-shadow(0 0 5px rgba(251,191,36,0.5))" }}
              />
            </div>
          </button>
        )}

        {/* Painel Expandido - 📱 RESPONSIVO: 100% em mobile, 360px em desktop */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:w-[360px] bg-black/95 backdrop-blur-xl border-l-2 border-amber-600/40 flex flex-col overflow-hidden z-[60]"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-3 border-b border-amber-600/20 bg-gradient-to-r from-amber-900/20 to-transparent">
                <h3 className="font-bold text-amber-400 flex items-center gap-2 text-sm">
                  <Pencil className="w-4 h-4" />
                  Ferramentas de Estudo
                </h3>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setIsExpanded(false)}
                  className="hover:bg-amber-600/20 h-8 w-8"
                >
                  <X className="w-4 h-4 text-amber-500" />
                </Button>
              </div>

              {/* Quick Tools Bar */}
              <div className="p-2 border-b border-amber-600/20 bg-black/50">
                <div className="flex items-center gap-1 flex-wrap">
                  {TOOL_BUTTONS.map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => setActiveTool(tool.id)}
                      className={cn(
                        "p-2 rounded-lg transition-all",
                        activeTool === tool.id 
                          ? "bg-amber-600/30 ring-1 ring-amber-500" 
                          : "hover:bg-white/5"
                      )}
                      title={tool.label}
                      style={{ color: tool.color }}
                    >
                      <tool.icon className="w-4 h-4" />
                    </button>
                  ))}
                  
                  <div className="w-px h-6 bg-amber-600/30 mx-1" />
                  
                  {/* Quick actions */}
                  <button
                    onClick={() => setShowRuler(!showRuler)}
                    className={cn(
                      "p-2 rounded-lg transition-all",
                      showRuler ? "bg-purple-600/30 text-purple-400" : "hover:bg-white/5 text-gray-400"
                    )}
                    title="Régua de Leitura"
                  >
                    <RulerIcon className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={handleToggleBookmark}
                    disabled={isTogglingBookmark}
                    className={cn(
                      "p-2 rounded-lg transition-all",
                      currentPageBookmarked ? "bg-red-600/30 text-red-400" : "hover:bg-white/5 text-gray-400"
                    )}
                    title={currentPageBookmarked ? "Remover Favorito" : "Favoritar Página"}
                  >
                    {isTogglingBookmark ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Bookmark className={cn("w-4 h-4", currentPageBookmarked && "fill-current")} />
                    )}
                  </button>
                  
                  <button
                    onClick={handleQuickHighlight}
                    className="p-2 rounded-lg hover:bg-white/5 text-yellow-400"
                    title="Destacar Página Rápido"
                  >
                    <Highlighter className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Color picker para marca-texto */}
                {activeTool === 'highlight' && (
                  <div className="flex items-center gap-1 mt-2 pt-2 border-t border-amber-600/10">
                    <span className="text-[10px] text-muted-foreground mr-2">COR:</span>
                    {HIGHLIGHT_COLORS.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => setSelectedColor(c)}
                        className={cn(
                          "w-6 h-6 rounded-full transition-all",
                          selectedColor.name === c.name && "ring-2 ring-white ring-offset-2 ring-offset-black"
                        )}
                        style={{ backgroundColor: c.color, border: `2px solid ${c.border}` }}
                        title={c.name}
                      />
                    ))}
                  </div>
                )}
                
                {/* Tamanho do lápis */}
                {activeTool === 'pencil' && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-amber-600/10">
                    <span className="text-[10px] text-muted-foreground">ESPESSURA:</span>
                    <Slider
                      value={[pencilSize]}
                      onValueChange={([v]) => setPencilSize(v)}
                      min={1}
                      max={10}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-xs text-blue-400 w-6">{pencilSize}px</span>
                  </div>
                )}
                
                {/* Régua posição */}
                {showRuler && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-amber-600/10">
                    <span className="text-[10px] text-muted-foreground">RÉGUA:</span>
                    <Slider
                      value={[rulerPosition]}
                      onValueChange={([v]) => setRulerPosition(v)}
                      min={10}
                      max={90}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-xs text-purple-400 w-8">{rulerPosition}%</span>
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div className="flex border-b border-amber-600/20">
                {[
                  { id: 'tools', label: 'Criar', icon: StickyNote },
                  { id: 'annotations', label: `Notas`, count: stats.totalAnnotations, icon: FileText },
                  { id: 'bookmarks', label: `Favoritos`, count: stats.totalBookmarks, icon: Bookmark },
                  { id: 'search', label: 'Buscar', icon: Search },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "flex-1 py-2 text-[10px] font-medium transition-colors flex flex-col items-center gap-0.5",
                      activeTab === tab.id
                        ? "text-amber-400 border-b-2 border-amber-500 bg-amber-500/10"
                        : "text-muted-foreground hover:text-amber-400"
                    )}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    <span className="flex items-center gap-1">
                      {tab.label}
                      {tab.count !== undefined && tab.count > 0 && (
                        <Badge variant="secondary" className="text-[8px] px-1 py-0 h-4">
                          {tab.count}
                        </Badge>
                      )}
                    </span>
                  </button>
                ))}
              </div>

              {/* Content */}
              <ScrollArea className="flex-1">
                <div className="p-3 space-y-3">
                  {/* Tab: Ferramentas de Criação */}
                  {activeTab === 'tools' && (
                    <>
                      {/* Status da página */}
                      <div className="flex items-center justify-between p-2 rounded-lg bg-amber-600/10 border border-amber-600/20">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-amber-400" />
                          <span className="text-sm font-medium text-amber-400">Página {currentPage}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {currentPageBookmarked && (
                            <Badge className="bg-red-600/20 text-red-400 text-[10px]">
                              <Bookmark className="w-3 h-3 mr-1 fill-current" /> Favoritada
                            </Badge>
                          )}
                          {currentPageAnnotations.length > 0 && (
                            <Badge className="bg-blue-600/20 text-blue-400 text-[10px]">
                              {currentPageAnnotations.length} notas
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Tipo de anotação */}
                      <div className="space-y-2">
                        <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                          Tipo de Anotação
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {ANNOTATION_TYPES.map(({ type, icon: Icon, label, color, description }) => (
                            <button
                              key={type}
                              onClick={() => setNewNoteType(type)}
                              className={cn(
                                "flex flex-col items-start gap-1 p-2.5 rounded-lg border transition-all text-left",
                                newNoteType === type
                                  ? "border-current bg-current/10"
                                  : "border-border hover:border-current/50"
                              )}
                              style={{ 
                                color: newNoteType === type ? color : undefined,
                                borderColor: newNoteType === type ? color : undefined
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4" style={{ color }} />
                                <span className="font-medium text-sm">{label}</span>
                              </div>
                              <span className="text-[10px] text-muted-foreground">{description}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Conteúdo da anotação */}
                      <div className="space-y-2">
                        <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                          Sua Anotação
                        </label>
                        <Textarea
                          value={newNoteContent}
                          onChange={(e) => setNewNoteContent(e.target.value)}
                          placeholder="Escreva sua anotação aqui..."
                          className="min-h-[80px] bg-background/50 border-border focus:border-amber-500 text-sm"
                        />
                        <Button
                          onClick={handleCreateNote}
                          disabled={!newNoteContent.trim() || isCreatingAnnotation}
                          className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                        >
                          {isCreatingAnnotation ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <StickyNote className="w-4 h-4 mr-2" />
                          )}
                          Salvar Anotação
                        </Button>
                      </div>

                      {/* Ações rápidas da página */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-amber-600/20">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleToggleBookmark}
                          disabled={isTogglingBookmark}
                          className={cn(
                            "text-xs",
                            currentPageBookmarked && "border-red-500 text-red-500"
                          )}
                        >
                          <Bookmark className={cn("w-3 h-3 mr-1", currentPageBookmarked && "fill-current")} />
                          {currentPageBookmarked ? 'Remover' : 'Favoritar'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleQuickHighlight}
                          className="text-xs text-yellow-500 border-yellow-500/50"
                        >
                          <Highlighter className="w-3 h-3 mr-1" />
                          Destacar
                        </Button>
                      </div>

                      {/* Anotações da página atual */}
                      {currentPageAnnotations.length > 0 && (
                        <div className="space-y-2 pt-3 border-t border-amber-600/20">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                              Nesta Página ({currentPageAnnotations.length})
                            </label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleDeleteAllPageAnnotations}
                              className="h-6 text-[10px] text-red-400 hover:text-red-300 hover:bg-red-600/20"
                            >
                              <Eraser className="w-3 h-3 mr-1" />
                              Limpar
                            </Button>
                          </div>
                          <div className="space-y-1.5">
                            {currentPageAnnotations.map((annotation) => (
                              <AnnotationCard
                                key={annotation.id}
                                annotation={annotation}
                                isEditing={editingId === annotation.id}
                                editContent={editContent}
                                onEditStart={() => {
                                  setEditingId(annotation.id);
                                  setEditContent(annotation.content);
                                }}
                                onEditChange={setEditContent}
                                onEditSave={() => handleUpdateAnnotation(annotation.id)}
                                onEditCancel={() => setEditingId(null)}
                                onDelete={() => deleteAnnotation(annotation.id)}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Tab: Buscar */}
                  {activeTab === 'search' && (
                    <div className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Buscar nas anotações..."
                          className="pl-9 bg-background/50 border-amber-600/30 focus:border-amber-500"
                        />
                      </div>
                      
                      {searchQuery && (
                        <p className="text-xs text-muted-foreground">
                          {filteredAnnotations.length} resultado(s) encontrado(s)
                        </p>
                      )}
                      
                      <div className="space-y-1.5">
                        {filteredAnnotations.map((annotation) => (
                          <AnnotationCard
                            key={annotation.id}
                            annotation={annotation}
                            isEditing={editingId === annotation.id}
                            editContent={editContent}
                            showPage
                            onGoToPage={() => onGoToPage(annotation.page_number)}
                            onEditStart={() => {
                              setEditingId(annotation.id);
                              setEditContent(annotation.content);
                            }}
                            onEditChange={setEditContent}
                            onEditSave={() => handleUpdateAnnotation(annotation.id)}
                            onEditCancel={() => setEditingId(null)}
                            onDelete={() => deleteAnnotation(annotation.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tab: Todas as Anotações */}
                  {activeTab === 'annotations' && (
                    <div className="space-y-2">
                      {/* Ações em lote */}
                      <div className="flex items-center gap-2 pb-2 border-b border-amber-600/20">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleExportAnnotations}
                          disabled={annotations.length === 0}
                          className="text-[10px] h-7"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Exportar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopyAnnotations}
                          disabled={annotations.length === 0}
                          className="text-[10px] h-7"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copiar
                        </Button>
                      </div>
                      
                      {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                        </div>
                      ) : annotations.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <StickyNote className="w-10 h-10 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Nenhuma anotação ainda</p>
                          <p className="text-xs mt-1">Use a aba "Criar" para adicionar</p>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {annotations.map((annotation) => (
                            <AnnotationCard
                              key={annotation.id}
                              annotation={annotation}
                              isEditing={editingId === annotation.id}
                              editContent={editContent}
                              showPage
                              onGoToPage={() => onGoToPage(annotation.page_number)}
                              onEditStart={() => {
                                setEditingId(annotation.id);
                                setEditContent(annotation.content);
                              }}
                              onEditChange={setEditContent}
                              onEditSave={() => handleUpdateAnnotation(annotation.id)}
                              onEditCancel={() => setEditingId(null)}
                              onDelete={() => deleteAnnotation(annotation.id)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab: Favoritos */}
                  {activeTab === 'bookmarks' && (
                    <div className="space-y-2">
                      {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                        </div>
                      ) : bookmarks.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Bookmark className="w-10 h-10 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Nenhum favorito ainda</p>
                          <p className="text-xs mt-1">Favorite páginas importantes</p>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {bookmarks.map((bookmark) => (
                            <BookmarkCard
                              key={bookmark.id}
                              bookmark={bookmark}
                              isCurrent={bookmark.page_number === currentPage}
                              onGoToPage={() => onGoToPage(bookmark.page_number)}
                              onDelete={() => toggleBookmark({ 
                                book_id: bookId, 
                                page_number: bookmark.page_number 
                              })}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Footer Stats */}
              <div className="p-2 border-t border-amber-600/20 bg-amber-600/5">
                <div className="flex justify-around text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <StickyNote className="w-3 h-3 text-blue-500" />
                    {stats.noteCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <Highlighter className="w-3 h-3 text-yellow-500" />
                    {stats.highlightCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <HelpCircle className="w-3 h-3 text-purple-500" />
                    {stats.questionCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-red-500" />
                    {stats.importantCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <Bookmark className="w-3 h-3 text-amber-500" />
                    {stats.totalBookmarks}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
});

// ============================================
// SUB-COMPONENTES
// ============================================

interface AnnotationCardProps {
  annotation: BookAnnotation;
  isEditing: boolean;
  editContent: string;
  showPage?: boolean;
  onGoToPage?: () => void;
  onEditStart: () => void;
  onEditChange: (value: string) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onDelete: () => void;
}

const AnnotationCard = memo(function AnnotationCard({
  annotation,
  isEditing,
  editContent,
  showPage,
  onGoToPage,
  onEditStart,
  onEditChange,
  onEditSave,
  onEditCancel,
  onDelete
}: AnnotationCardProps) {
  const typeConfig = ANNOTATION_TYPES.find(t => t.type === annotation.annotation_type);
  const Icon = typeConfig?.icon || StickyNote;
  
  return (
    <div 
      className="p-2 rounded-lg border transition-all hover:bg-white/5"
      style={{ borderColor: `${typeConfig?.color}40` }}
    >
      <div className="flex items-start gap-2">
        <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: typeConfig?.color }} />
        
        <div className="flex-1 min-w-0">
          {showPage && (
            <button
              onClick={onGoToPage}
              className="text-[10px] text-amber-500 hover:text-amber-400 mb-1 flex items-center gap-1"
            >
              <FileText className="w-3 h-3" />
              Página {annotation.page_number}
            </button>
          )}
          
          {isEditing ? (
            <div className="space-y-1.5">
              <Textarea
                value={editContent}
                onChange={(e) => onEditChange(e.target.value)}
                className="min-h-[60px] text-xs bg-background/50"
                autoFocus
              />
              <div className="flex gap-1">
                <Button size="sm" onClick={onEditSave} className="h-6 text-[10px]">Salvar</Button>
                <Button size="sm" variant="ghost" onClick={onEditCancel} className="h-6 text-[10px]">Cancelar</Button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-foreground/90 line-clamp-3">{annotation.content}</p>
          )}
          
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[9px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              {new Date(annotation.created_at).toLocaleDateString('pt-BR')}
            </span>
            
            {!isEditing && (
              <div className="flex gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onEditStart}
                  className="h-5 w-5 hover:bg-blue-600/20"
                >
                  <Edit3 className="w-2.5 h-2.5 text-blue-400" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onDelete}
                  className="h-5 w-5 hover:bg-red-600/20"
                >
                  <Trash2 className="w-2.5 h-2.5 text-red-400" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

interface BookmarkCardProps {
  bookmark: BookBookmark;
  isCurrent: boolean;
  onGoToPage: () => void;
  onDelete: () => void;
}

const BookmarkCard = memo(function BookmarkCard({
  bookmark,
  isCurrent,
  onGoToPage,
  onDelete
}: BookmarkCardProps) {
  return (
    <div 
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg border transition-all",
        isCurrent 
          ? "border-amber-500 bg-amber-500/10" 
          : "border-border hover:bg-white/5"
      )}
    >
      <Bookmark className={cn(
        "w-4 h-4 flex-shrink-0",
        isCurrent ? "text-amber-500 fill-amber-500" : "text-amber-500/60"
      )} />
      
      <button
        onClick={onGoToPage}
        className="flex-1 text-left min-w-0"
      >
        <span className="text-sm font-medium text-foreground">
          {bookmark.label || `Página ${bookmark.page_number}`}
        </span>
        <span className="text-[10px] text-muted-foreground ml-2">
          {new Date(bookmark.created_at).toLocaleDateString('pt-BR')}
        </span>
      </button>
      
      {isCurrent && (
        <Badge variant="secondary" className="text-[8px] px-1 py-0">atual</Badge>
      )}
      
      <Button
        variant="ghost"
        size="icon"
        onClick={onDelete}
        className="h-6 w-6 hover:bg-red-600/20 flex-shrink-0"
      >
        <Trash2 className="w-3 h-3 text-red-400" />
      </Button>
    </div>
  );
});

ReadingModeToolbar.displayName = 'ReadingModeToolbar';
