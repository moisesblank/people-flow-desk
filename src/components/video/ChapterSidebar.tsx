import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import { Clock, ChevronRight, List, X } from 'lucide-react';

interface Chapter {
  time: string;
  seconds: number;
  title: string;
}

interface ChapterSidebarProps {
  chapters: Chapter[];
  currentTime: number;
  onChapterClick: (seconds: number) => void;
  isOpen: boolean;
  onToggle: () => void;
}

// Função segura para formatar tempo (evita RangeError com valores negativos)
const formatTime = (seconds: number): string => {
  // Proteção contra valores negativos ou inválidos
  if (seconds === null || seconds === undefined || seconds < 0 || isNaN(seconds)) {
    return '0:00';
  }
  
  const totalSeconds = Math.floor(Math.abs(seconds));
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const ChapterSidebar: React.FC<ChapterSidebarProps> = ({
  chapters,
  currentTime,
  onChapterClick,
  isOpen,
  onToggle
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  
  const sortedChapters = useMemo(() => 
    [...(chapters || [])].sort((a, b) => (a.seconds || 0) - (b.seconds || 0)),
    [chapters]
  );

  const currentChapterIndex = useMemo(() => {
    if (!sortedChapters || sortedChapters.length === 0) return -1;
    const safeCurrentTime = Math.max(0, currentTime || 0);
    
    for (let i = sortedChapters.length - 1; i >= 0; i--) {
      const chapterSeconds = sortedChapters[i]?.seconds || 0;
      if (safeCurrentTime >= chapterSeconds) {
        return i;
      }
    }
    return 0;
  }, [sortedChapters, currentTime]);

  // Auto-scroll para o capítulo atual
  useEffect(() => {
    if (listRef.current && currentChapterIndex >= 0) {
      const activeItem = listRef.current.querySelector(`[data-chapter-index="${currentChapterIndex}"]`);
      if (activeItem) {
        activeItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentChapterIndex]);

  // Handler seguro para clique no capítulo
  const handleChapterClick = useCallback((chapter: Chapter) => {
    const seconds = chapter?.seconds || 0;
    console.log('[CHAPTERS] ✅ Clicou no capítulo:', chapter?.title);
    console.log('[CHAPTERS] ✅ Pulando para:', seconds, 'segundos');
    
    if (typeof onChapterClick === 'function') {
      onChapterClick(seconds);
    } else {
      console.error('[CHAPTERS] ❌ onChapterClick não é uma função!');
    }
  }, [onChapterClick]);

  if (!chapters || chapters.length === 0) return null;

  return (
    <>
      {/* Botão toggle */}
      <button
        onClick={onToggle}
        className="fixed right-4 top-1/2 -translate-y-1/2 z-50 
                   bg-gradient-to-r from-purple-600 to-blue-600 
                   hover:from-purple-500 hover:to-blue-500
                   text-white p-3 rounded-full shadow-lg
                   transition-all duration-300 hover:scale-110"
        title={isOpen ? 'Fechar capítulos' : 'Abrir capítulos'}
        aria-label={isOpen ? 'Fechar capítulos' : 'Abrir capítulos'}
      >
        <List className="w-5 h-5" />
      </button>

      {/* Sidebar */}
      <div 
        className={`fixed right-0 top-0 h-full w-80 bg-gray-900/95 backdrop-blur-md
                   border-l border-purple-500/30 shadow-2xl z-40
                   transform transition-transform duration-300 ease-in-out
                   ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="p-4 border-b border-purple-500/30 bg-gradient-to-r from-purple-900/50 to-blue-900/50 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-400" />
              Capítulos da Aula
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              {chapters?.length || 0} seções disponíveis
            </p>
          </div>
          <button
            onClick={onToggle}
            className="p-1 hover:bg-white/10 rounded-full transition-colors"
            aria-label="Fechar capítulos"
          >
            <X className="w-5 h-5 text-gray-400 hover:text-white" />
          </button>
        </div>

        {/* Lista de capítulos */}
        <div ref={listRef} className="overflow-y-auto h-[calc(100%-80px)] p-2">
          {sortedChapters.map((chapter, index) => {
            const isActive = index === currentChapterIndex;
            const isPast = index < currentChapterIndex;
            
            return (
              <button
                key={`chapter-${index}`}
                data-chapter-index={index}
                onClick={() => handleChapterClick(chapter)}
                className={`w-full text-left p-3 rounded-lg mb-2 transition-all duration-300
                           flex items-start gap-3 group cursor-pointer relative overflow-hidden
                           ${isActive 
                             ? 'bg-gradient-to-r from-purple-600/50 to-blue-600/50 border-2 border-purple-400/70 shadow-lg shadow-purple-500/20' 
                             : isPast 
                               ? 'bg-gray-800/50 hover:bg-gray-700/60 border border-transparent hover:border-purple-500/30' 
                               : 'bg-gray-800/30 hover:bg-gray-700/60 border border-transparent hover:border-purple-500/30'
                           }`}
              >
                {/* Glow effect para item ativo */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 animate-pulse pointer-events-none" />
                )}
                
                {/* Indicador de tempo */}
                <div className={`flex-shrink-0 px-2.5 py-1.5 rounded text-xs font-mono font-bold transition-all duration-300 z-10
                               ${isActive 
                                 ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md shadow-purple-500/30' 
                                 : 'bg-gray-700/80 text-gray-300 group-hover:bg-purple-600/50 group-hover:text-white'}`}>
                  {chapter.time || formatTime(chapter.seconds)}
                </div>
                
                {/* Título */}
                <div className="flex-1 min-w-0 z-10">
                  <p className={`text-sm font-medium truncate transition-colors duration-300
                               ${isActive ? 'text-white font-semibold' : 'text-gray-300 group-hover:text-white'}`}>
                    {chapter.title}
                  </p>
                  {isActive && (
                    <p className="text-xs text-purple-300 mt-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse shadow-sm shadow-purple-400" />
                      Reproduzindo agora
                    </p>
                  )}
                </div>

                {/* Seta */}
                <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-all duration-300 z-10
                                        ${isActive ? 'text-purple-300 translate-x-1' : 'text-gray-500 group-hover:text-purple-400'}
                                        group-hover:translate-x-1`} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Overlay quando aberto */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-30"
          onClick={onToggle}
        />
      )}
    </>
  );
};

export default ChapterSidebar;
