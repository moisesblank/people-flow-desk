// ============================================
// 📚 MODO LEITURA - Toolbar de Ferramentas
// Anotações, Marcações e Favoritos
// DESIGNER 2300 - Apenas visível em fullscreen
// ============================================

import { memo, useState } from 'react';
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
  Edit3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useBookAnnotations, AnnotationType, BookAnnotation, BookBookmark } from '@/hooks/useBookAnnotations';

// ============================================
// TIPOS
// ============================================

interface ReadingModeToolbarProps {
  bookId: string;
  currentPage: number;
  isFullscreen: boolean;
  onGoToPage: (page: number) => void;
}

const ANNOTATION_TYPES: { type: AnnotationType; icon: typeof StickyNote; label: string; color: string }[] = [
  { type: 'note', icon: StickyNote, label: 'Nota', color: '#3b82f6' },
  { type: 'highlight', icon: Highlighter, label: 'Destaque', color: '#eab308' },
  { type: 'question', icon: HelpCircle, label: 'Dúvida', color: '#8b5cf6' },
  { type: 'important', icon: AlertCircle, label: 'Importante', color: '#ef4444' },
];

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const ReadingModeToolbar = memo(function ReadingModeToolbar({
  bookId,
  currentPage,
  isFullscreen,
  onGoToPage
}: ReadingModeToolbarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'tools' | 'annotations' | 'bookmarks'>('tools');
  const [newNoteType, setNewNoteType] = useState<AnnotationType>('note');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

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
    isTogglingBookmark
  } = useBookAnnotations(bookId);

  const currentPageAnnotations = getAnnotationsForPage(currentPage);
  const currentPageBookmarked = isPageBookmarked(currentPage);

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

  return (
    <AnimatePresence>
      {/* Botão de toggle no canto direito */}
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 100, opacity: 0 }}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-50"
      >
        {/* Toggle Button */}
        {!isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            className="flex flex-col items-center gap-2 p-3 bg-black/90 border-l-2 border-y-2 border-red-600/60 rounded-l-xl hover:border-red-500 transition-all group"
          >
            <StickyNote className="w-5 h-5 text-red-500 group-hover:text-red-400" />
            {stats.totalAnnotations > 0 && (
              <Badge variant="destructive" className="text-[10px] px-1.5">
                {stats.totalAnnotations}
              </Badge>
            )}
            <Bookmark className={cn("w-5 h-5", currentPageBookmarked ? "text-red-500 fill-red-500" : "text-muted-foreground")} />
            {stats.totalBookmarks > 0 && (
              <Badge variant="outline" className="text-[10px] px-1.5 border-red-600/50 text-red-400">
                {stats.totalBookmarks}
              </Badge>
            )}
            <ChevronRight className="w-4 h-4 text-muted-foreground mt-2 -rotate-180" />
          </button>
        )}

        {/* Painel Expandido */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 bg-black/95 backdrop-blur-xl border-l-2 border-red-600/40 flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-red-600/20">
                <h3 className="font-bold text-red-500 flex items-center gap-2">
                  <StickyNote className="w-5 h-5" />
                  Minhas Anotações
                </h3>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setIsExpanded(false)}
                  className="hover:bg-red-600/20"
                >
                  <X className="w-5 h-5 text-red-500" />
                </Button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-red-600/20">
                {[
                  { id: 'tools', label: 'Criar' },
                  { id: 'annotations', label: `Notas (${stats.totalAnnotations})` },
                  { id: 'bookmarks', label: `Favoritos (${stats.totalBookmarks})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "flex-1 py-2.5 text-xs font-medium transition-colors",
                      activeTab === tab.id
                        ? "text-red-500 border-b-2 border-red-500 bg-red-500/10"
                        : "text-muted-foreground hover:text-red-400"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Content */}
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  {/* Tab: Ferramentas */}
                  {activeTab === 'tools' && (
                    <>
                      {/* Bookmark da página atual */}
                      <div className="space-y-2">
                        <label className="text-xs text-muted-foreground uppercase tracking-wider">
                          Página {currentPage}
                        </label>
                        <Button
                          variant="outline"
                          onClick={handleToggleBookmark}
                          disabled={isTogglingBookmark}
                          className={cn(
                            "w-full justify-start gap-2",
                            currentPageBookmarked 
                              ? "border-red-500 text-red-500 bg-red-500/10" 
                              : "border-border"
                          )}
                        >
                          {isTogglingBookmark ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Bookmark className={cn("w-4 h-4", currentPageBookmarked && "fill-current")} />
                          )}
                          {currentPageBookmarked ? 'Página Favoritada' : 'Favoritar Página'}
                        </Button>
                      </div>

                      {/* Tipo de anotação */}
                      <div className="space-y-2">
                        <label className="text-xs text-muted-foreground uppercase tracking-wider">
                          Tipo de Anotação
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {ANNOTATION_TYPES.map(({ type, icon: Icon, label, color }) => (
                            <button
                              key={type}
                              onClick={() => setNewNoteType(type)}
                              className={cn(
                                "flex items-center gap-2 p-2.5 rounded-lg border transition-all text-sm",
                                newNoteType === type
                                  ? "border-current bg-current/10"
                                  : "border-border hover:border-current/50"
                              )}
                              style={{ 
                                color: newNoteType === type ? color : undefined,
                                borderColor: newNoteType === type ? color : undefined
                              }}
                            >
                              <Icon className="w-4 h-4" style={{ color }} />
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Conteúdo da anotação */}
                      <div className="space-y-2">
                        <label className="text-xs text-muted-foreground uppercase tracking-wider">
                          Sua Anotação
                        </label>
                        <Textarea
                          value={newNoteContent}
                          onChange={(e) => setNewNoteContent(e.target.value)}
                          placeholder="Escreva sua anotação aqui..."
                          className="min-h-[100px] bg-background/50 border-border focus:border-red-500"
                        />
                        <Button
                          onClick={handleCreateNote}
                          disabled={!newNoteContent.trim() || isCreatingAnnotation}
                          className="w-full bg-red-600 hover:bg-red-700 text-white"
                        >
                          {isCreatingAnnotation ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <StickyNote className="w-4 h-4 mr-2" />
                          )}
                          Salvar Anotação
                        </Button>
                      </div>

                      {/* Anotações da página atual */}
                      {currentPageAnnotations.length > 0 && (
                        <div className="space-y-2 pt-4 border-t border-red-600/20">
                          <label className="text-xs text-muted-foreground uppercase tracking-wider">
                            Anotações desta página ({currentPageAnnotations.length})
                          </label>
                          <div className="space-y-2">
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

                  {/* Tab: Todas as Anotações */}
                  {activeTab === 'annotations' && (
                    <div className="space-y-2">
                      {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-red-500" />
                        </div>
                      ) : annotations.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <StickyNote className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>Nenhuma anotação ainda</p>
                          <p className="text-xs mt-1">Use a aba "Criar" para adicionar</p>
                        </div>
                      ) : (
                        annotations.map((annotation) => (
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
                        ))
                      )}
                    </div>
                  )}

                  {/* Tab: Favoritos */}
                  {activeTab === 'bookmarks' && (
                    <div className="space-y-2">
                      {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-red-500" />
                        </div>
                      ) : bookmarks.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Bookmark className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>Nenhum favorito ainda</p>
                          <p className="text-xs mt-1">Favorite páginas importantes</p>
                        </div>
                      ) : (
                        bookmarks.map((bookmark) => (
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
                        ))
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Footer Stats */}
              <div className="p-3 border-t border-red-600/20 bg-red-600/5">
                <div className="flex justify-around text-xs text-muted-foreground">
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
                    <Bookmark className="w-3 h-3 text-red-500" />
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
  const typeInfo = ANNOTATION_TYPES.find(t => t.type === annotation.annotation_type);
  const Icon = typeInfo?.icon || StickyNote;

  return (
    <div 
      className="p-3 rounded-lg border bg-background/30 transition-all hover:bg-background/50"
      style={{ borderColor: `${annotation.color}40` }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" style={{ color: annotation.color }} />
          {showPage && (
            <button
              onClick={onGoToPage}
              className="text-xs font-medium hover:underline"
              style={{ color: annotation.color }}
            >
              Página {annotation.page_number}
            </button>
          )}
          <span className="text-[10px] text-muted-foreground">
            {new Date(annotation.created_at).toLocaleDateString('pt-BR')}
          </span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={onEditStart}
            className="p-1 rounded hover:bg-muted transition-colors"
          >
            <Edit3 className="w-3 h-3 text-muted-foreground" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded hover:bg-destructive/20 transition-colors"
          >
            <Trash2 className="w-3 h-3 text-destructive" />
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            value={editContent}
            onChange={(e) => onEditChange(e.target.value)}
            className="min-h-[60px] text-sm"
            autoFocus
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={onEditSave} className="flex-1">
              Salvar
            </Button>
            <Button size="sm" variant="outline" onClick={onEditCancel}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-foreground/90 whitespace-pre-wrap">
          {annotation.content}
        </p>
      )}
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
        "flex items-center justify-between p-3 rounded-lg border transition-all",
        isCurrent 
          ? "border-red-500 bg-red-500/10" 
          : "border-border hover:border-red-500/50 bg-background/30"
      )}
    >
      <button
        onClick={onGoToPage}
        className="flex items-center gap-3 flex-1 text-left"
      >
        <Bookmark className={cn("w-5 h-5", isCurrent ? "text-red-500 fill-red-500" : "text-red-500")} />
        <div>
          <p className="font-medium text-sm">
            Página {bookmark.page_number}
          </p>
          {bookmark.label && (
            <p className="text-xs text-muted-foreground">{bookmark.label}</p>
          )}
        </div>
      </button>
      <button
        onClick={onDelete}
        className="p-2 rounded hover:bg-destructive/20 transition-colors"
      >
        <Trash2 className="w-4 h-4 text-destructive" />
      </button>
    </div>
  );
});

ReadingModeToolbar.displayName = 'ReadingModeToolbar';
