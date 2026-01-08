import React, { useMemo } from 'react';

interface Chapter {
  time: string;
  seconds: number;
  title: string;
}

interface ChapterMarkersProps {
  chapters: Chapter[];
  duration: number;
  currentTime: number;
  onChapterClick: (seconds: number) => void;
}

export const ChapterMarkers: React.FC<ChapterMarkersProps> = ({
  chapters,
  duration,
  currentTime,
  onChapterClick
}) => {
  const sortedChapters = useMemo(() => 
    [...chapters].sort((a, b) => a.seconds - b.seconds),
    [chapters]
  );

  const currentChapter = useMemo(() => {
    for (let i = sortedChapters.length - 1; i >= 0; i--) {
      if (currentTime >= sortedChapters[i].seconds) {
        return sortedChapters[i];
      }
    }
    return null;
  }, [sortedChapters, currentTime]);

  if (!chapters.length || duration <= 0) return null;

  return (
    <div className="chapter-markers-container absolute inset-0 pointer-events-none">
      {sortedChapters.map((chapter, index) => {
        const position = (chapter.seconds / duration) * 100;
        const isActive = currentChapter?.seconds === chapter.seconds;
        
        // Evitar marcador no início (0%) para não sobrepor
        if (position < 1) return null;
        
        return (
          <div
            key={index}
            className="chapter-marker pointer-events-auto cursor-pointer group"
            style={{
              position: 'absolute',
              left: `${position}%`,
              top: '-2px',
              bottom: '-2px',
              width: '4px',
              transform: 'translateX(-50%)',
              zIndex: 15
            }}
            onClick={(e) => {
              e.stopPropagation();
              onChapterClick(chapter.seconds);
            }}
          >
            {/* Linha do marcador - mais visível */}
            <div 
              className={`w-full h-full rounded-sm transition-all duration-300 ${
                isActive 
                  ? 'bg-gradient-to-b from-yellow-300 to-yellow-500 shadow-lg shadow-yellow-400/60 scale-x-150' 
                  : 'bg-white/80 group-hover:bg-purple-400 group-hover:scale-x-150'
              }`}
            />
            
            {/* Ponto indicador no topo */}
            <div 
              className={`absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full transition-all duration-300 ${
                isActive 
                  ? 'bg-yellow-400 shadow-md shadow-yellow-400/50' 
                  : 'bg-white/70 group-hover:bg-purple-400 group-hover:scale-125'
              }`}
            />
            
            {/* Tooltip com título do capítulo */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 
                          opacity-0 group-hover:opacity-100 transition-all duration-200 scale-95 group-hover:scale-100
                          bg-gray-900/95 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-lg 
                          pointer-events-none z-50 min-w-[120px] max-w-[220px] shadow-xl border border-purple-500/30">
              <div className="font-bold text-purple-300">{chapter.time}</div>
              <div className="text-gray-200 mt-0.5 line-clamp-2">{chapter.title}</div>
              {/* Seta do tooltip */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 
                            border-l-4 border-r-4 border-t-4 
                            border-l-transparent border-r-transparent border-t-gray-900/95" />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ChapterMarkers;
