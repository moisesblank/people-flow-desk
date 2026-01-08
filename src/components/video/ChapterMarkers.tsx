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
        
        return (
          <div
            key={index}
            className="chapter-marker pointer-events-auto cursor-pointer group"
            style={{
              position: 'absolute',
              left: `${position}%`,
              top: '0',
              bottom: '0',
              width: '3px',
              transform: 'translateX(-50%)',
              zIndex: 10
            }}
            onClick={(e) => {
              e.stopPropagation();
              onChapterClick(chapter.seconds);
            }}
          >
            {/* Linha do marcador */}
            <div 
              className={`w-full h-full transition-all duration-200 ${
                isActive 
                  ? 'bg-yellow-400 shadow-lg shadow-yellow-400/50' 
                  : 'bg-white/60 group-hover:bg-white'
              }`}
            />
            
            {/* Tooltip com título do capítulo */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 
                          opacity-0 group-hover:opacity-100 transition-opacity duration-200
                          bg-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap
                          pointer-events-none z-50 max-w-[200px] truncate">
              <div className="font-semibold">{chapter.time}</div>
              <div className="text-gray-300">{chapter.title}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ChapterMarkers;
