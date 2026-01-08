import React, { useMemo, useRef, useEffect } from 'react';
import { Clock, ChevronRight, List } from 'lucide-react';

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

export const ChapterSidebar: React.FC<ChapterSidebarProps> = ({
  chapters,
  currentTime,
  onChapterClick,
  isOpen,
  onToggle
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  
  const sortedChapters = useMemo(() => 
    [...chapters].sort((a, b) => a.seconds - b.seconds),
    [chapters]
  );

  const currentChapterIndex = useMemo(() => {
    for (let i = sortedChapters.length - 1; i >= 0; i--) {
      if (currentTime >= sortedChapters[i].seconds) {
        return i;
      }
    }
    return -1;
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

  if (!chapters.length) return null;

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
        <div className="p-4 border-b border-purple-500/30 bg-gradient-to-r from-purple-900/50 to-blue-900/50">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            Capítulos da Aula
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            {chapters.length} seções disponíveis
          </p>
        </div>

        {/* Lista de capítulos */}
        <div ref={listRef} className="overflow-y-auto h-[calc(100%-80px)] p-2">
          {sortedChapters.map((chapter, index) => {
            const isActive = index === currentChapterIndex;
            const isPast = index < currentChapterIndex;
            
            return (
              <button
                key={index}
                data-chapter-index={index}
                onClick={() => onChapterClick(chapter.seconds)}
                className={`w-full text-left p-3 rounded-lg mb-2 transition-all duration-200
                           flex items-start gap-3 group
                           ${isActive 
                             ? 'bg-gradient-to-r from-purple-600/40 to-blue-600/40 border border-purple-400/50' 
                             : isPast 
                               ? 'bg-gray-800/50 hover:bg-gray-700/50' 
                               : 'bg-gray-800/30 hover:bg-gray-700/50'
                           }`}
              >
                {/* Indicador de tempo */}
                <div className={`flex-shrink-0 px-2 py-1 rounded text-xs font-mono
                               ${isActive 
                                 ? 'bg-purple-500 text-white' 
                                 : 'bg-gray-700 text-gray-300'}`}>
                  {chapter.time}
                </div>
                
                {/* Título */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate
                               ${isActive ? 'text-white' : 'text-gray-300'}`}>
                    {chapter.title}
                  </p>
                  {isActive && (
                    <p className="text-xs text-purple-400 mt-1 flex items-center gap-1">
                      <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                      Reproduzindo agora
                    </p>
                  )}
                </div>

                {/* Seta */}
                <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-transform
                                        ${isActive ? 'text-purple-400' : 'text-gray-500'}
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
