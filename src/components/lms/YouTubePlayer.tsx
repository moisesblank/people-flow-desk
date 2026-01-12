// ============================================
// YOUTUBE EMBEDDED PLAYER v2.1
// Player de vídeo YouTube com capítulos e controles
// COM PROTEÇÃO ANTI-COMPARTILHAMENTO + 1080p AUTO
// 🔒 DISCLAIMER OBRIGATÓRIO - VERDADE ABSOLUTA
// ============================================

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  Pause,
  SkipBack,
  SkipForward,
  List,
  BookmarkPlus,
  Clock,
  ChevronDown,
  ChevronUp,
  Beaker,
  Atom,
  FlaskConical,
  ExternalLink,
  Maximize,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { FortressPlayerWrapper, FORTRESS_PLAYER_VARS } from "@/components/video";
import { VideoDisclaimer, useVideoDisclaimer } from "@/components/video/VideoDisclaimer";

// Interface para capítulos/timestamps
export interface VideoChapter {
  id: string;
  title: string;
  startTime: number; // em segundos
  endTime?: number;
  icon?: string;
}

interface Note {
  id: string;
  timestamp: number;
  content: string;
  createdAt: Date;
}

interface YouTubePlayerProps {
  videoId: string;
  title: string;
  chapters?: VideoChapter[];
  onComplete?: () => void;
  onProgress?: (progress: number) => void;
  onChapterChange?: (chapter: VideoChapter) => void;
  showChaptersBelow?: boolean;
  autoplay?: boolean;
}

// Declaração do tipo do YouTube IFrame API
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export function YouTubePlayer({ 
  videoId,
  title, 
  chapters = [],
  onComplete, 
  onProgress,
  onChapterChange,
  showChaptersBelow = true,
  autoplay = false
}: YouTubePlayerProps) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 🚀 PATCH 5K: Ref para armazenar intervalId e limpar no unmount
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // 🔒 DISCLAIMER OBRIGATÓRIO - VERDADE ABSOLUTA
  const { showDisclaimer, disclaimerCompleted, startDisclaimer, handleDisclaimerComplete } = useVideoDisclaimer();
  const [disclaimerShown, setDisclaimerShown] = useState(false);
  
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [currentChapter, setCurrentChapter] = useState<VideoChapter | null>(null);
  const [showChaptersList, setShowChaptersList] = useState(true);
  
  // 🔒 Mostrar disclaimer ao montar (antes do primeiro play)
  useEffect(() => {
    if (videoId && !disclaimerShown && !disclaimerCompleted) {
      startDisclaimer();
      setDisclaimerShown(true);
    }
  }, [videoId, disclaimerShown, disclaimerCompleted, startDisclaimer]);

  // Carregar YouTube IFrame API - 🔥 FIX v16.0: SÓ após disclaimer completar
  useEffect(() => {
    if (!videoId) return;
    
    // 🔒 DISCLAIMER OBRIGATÓRIO: Não inicializar player antes do disclaimer
    if (!disclaimerCompleted) {
      console.log('[YouTubePlayer] ⏳ Aguardando disclaimer antes de inicializar player...');
      return;
    }
    
    console.log('[YouTubePlayer] ✅ Disclaimer concluído - inicializando player');

    // Se já existe a API, inicializar player
    if (window.YT && window.YT.Player) {
      initPlayer();
      return;
    }

    // Carregar script da API
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      initPlayer();
    };

    return () => {
      // 🚀 PATCH 5K: Limpar interval ao desmontar (evita memory leak)
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      if (playerRef.current) {
        playerRef.current.destroy?.();
      }
    };
  }, [videoId, disclaimerCompleted]);

  const initPlayer = () => {
    if (!containerRef.current || !videoId) return;

    // Criar div para o player se não existir
    const playerId = `youtube-player-${videoId}`;
    let playerDiv = document.getElementById(playerId);
    
    if (!playerDiv) {
      playerDiv = document.createElement("div");
      playerDiv.id = playerId;
      containerRef.current.appendChild(playerDiv);
    }

    playerRef.current = new window.YT.Player(playerId, {
      videoId: videoId,
      width: "100%",
      height: "100%",
      playerVars: {
        ...FORTRESS_PLAYER_VARS,
        autoplay: autoplay ? 1 : 0,
        origin: window.location.origin
      },
      events: {
        onReady: handlePlayerReady,
        onStateChange: handleStateChange
      }
    });
  };

  const handlePlayerReady = (event: any) => {
    // 🔥 FIX v15.0: Salvar a referência REAL do player (event.target) para que
    // setPlaybackRate e outras APIs funcionem corretamente
    playerRef.current = event.target; // CRÍTICO: sobrescrever com player funcional
    console.log('[YouTubePlayer] 🎬 Player YouTube pronto, ref atualizada');
    
    setIsReady(true);
    setDuration(event.target.getDuration());
    
    // 🚀 PATCH 5K: Limpar interval anterior antes de criar novo (evita duplicatas)
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    // Iniciar tracking de tempo - armazenar em ref para cleanup
    progressIntervalRef.current = setInterval(() => {
      if (playerRef.current?.getCurrentTime) {
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(time);
        
        const progress = (time / playerRef.current.getDuration()) * 100;
        onProgress?.(progress);
        
        if (progress >= 90) {
          onComplete?.();
        }
      }
    }, 1000);
  };

  const handleStateChange = (event: any) => {
    // Estados: -1 (não iniciado), 0 (encerrado), 1 (reproduzindo), 2 (pausado), 3 (buffering), 5 (pronto)
    setIsPlaying(event.data === 1);
    
    if (event.data === 0) {
      onComplete?.();
    }
  };

  // Detectar capítulo atual baseado no tempo
  useEffect(() => {
    if (chapters.length === 0 || !duration) return;
    
    const chapter = chapters.find((ch, index) => {
      const nextChapter = chapters[index + 1];
      const endTime = ch.endTime || (nextChapter?.startTime || duration);
      return currentTime >= ch.startTime && currentTime < endTime;
    });

    if (chapter && chapter.id !== currentChapter?.id) {
      setCurrentChapter(chapter);
      onChapterChange?.(chapter);
    }
  }, [currentTime, chapters, duration, currentChapter, onChapterChange]);

  // Formatar tempo HH:MM:SS
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const seekToTime = useCallback((seconds: number) => {
    if (playerRef.current?.seekTo) {
      playerRef.current.seekTo(seconds, true);
      setCurrentTime(seconds);
    }
  }, []);

  const togglePlay = () => {
    if (!playerRef.current) return;
    
    if (isPlaying) {
      playerRef.current.pauseVideo?.();
    } else {
      playerRef.current.playVideo?.();
    }
  };

  const skip = (seconds: number) => {
    seekToTime(currentTime + seconds);
  };

  const addNote = () => {
    if (!newNote.trim()) return;

    const note: Note = {
      id: Date.now().toString(),
      timestamp: currentTime,
      content: newNote.trim(),
      createdAt: new Date(),
    };

    setNotes([...notes, note]);
    setNewNote("");
    setShowNoteInput(false);
    
    toast({
      title: "Nota adicionada",
      description: `Nota salva em ${formatTime(currentTime)}`,
    });
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Ícones de química para capítulos
  const getChapterIcon = (index: number) => {
    const icons = [Beaker, Atom, FlaskConical];
    const Icon = icons[index % icons.length];
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4">
      {/* Video Container COM PROTEÇÃO */}
      <FortressPlayerWrapper className="relative rounded-2xl overflow-hidden bg-black" showSecurityBadge>
        {/* 🔒 DISCLAIMER OVERLAY - OBRIGATÓRIO EM TODOS OS VÍDEOS */}
        <VideoDisclaimer 
          isVisible={showDisclaimer} 
          onComplete={handleDisclaimerComplete} 
        />
        
        {/* YouTube Player Container */}
        <div 
          ref={containerRef} 
          className="w-full aspect-video"
        />

        {/* Loading State */}
        {!isReady && videoId && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              <p className="text-sm text-muted-foreground">Carregando vídeo...</p>
            </div>
          </div>
        )}

        {/* No Video State */}
        {!videoId && (
          <div className="w-full aspect-video flex items-center justify-center bg-muted/20">
            <div className="text-center space-y-4">
              <Play className="h-16 w-16 text-muted-foreground/30 mx-auto" />
              <p className="text-muted-foreground">Nenhum vídeo selecionado</p>
            </div>
          </div>
        )}

        {/* Current Chapter Indicator */}
        {currentChapter && isReady && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg pointer-events-none"
          >
            <p className="text-sm text-white/90 font-medium">{currentChapter.title}</p>
          </motion.div>
        )}
      </FortressPlayerWrapper>

      {/* Custom Controls Bar */}
      {isReady && (
        <div className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlay}
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>

            <Button variant="ghost" size="icon" onClick={() => skip(-10)}>
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button variant="ghost" size="icon" onClick={() => skip(10)}>
              <SkipForward className="h-4 w-4" />
            </Button>

            <span className="text-sm text-muted-foreground ml-2">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Chapters Toggle */}
            {chapters.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowChaptersList(!showChaptersList)}
              >
                <List className="h-4 w-4" />
              </Button>
            )}

            {/* Add Note */}
            <Popover open={showNoteInput} onOpenChange={setShowNoteInput}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon">
                  <BookmarkPlus className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Nota em {formatTime(currentTime)}
                    </span>
                  </div>
                  <Textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Digite sua anotação..."
                    rows={3}
                  />
                  <Button onClick={addNote} className="w-full" size="sm">
                    Salvar Nota
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Open in YouTube */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.open(`https://www.youtube.com/watch?v=${videoId}`, "_blank")}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Progress Bar with Chapter Markers */}
      {isReady && (
        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
          {/* Progress */}
          <div 
            className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
          
          {/* Chapter Markers */}
          {chapters.map((chapter) => {
            const markerPosition = duration > 0 
              ? (chapter.startTime / duration) * 100 
              : 0;
            return (
              <button
                key={chapter.id}
                onClick={() => seekToTime(chapter.startTime)}
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-primary hover:scale-125 transition-transform z-10"
                style={{ left: `${markerPosition}%` }}
                title={chapter.title}
              />
            );
          })}
        </div>
      )}

      {/* Chapter Buttons (TRACKLIST) - Below Player */}
      {showChaptersBelow && chapters.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ 
            opacity: showChaptersList ? 1 : 0, 
            height: showChaptersList ? "auto" : 0 
          }}
          className="overflow-hidden"
        >
          <div className="bg-muted/20 rounded-xl p-4 border border-border/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <List className="h-5 w-5 text-primary" />
                Capítulos ({chapters.length})
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChaptersList(!showChaptersList)}
              >
                {showChaptersList ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>

            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {chapters.map((chapter, index) => {
                  const isActive = currentChapter?.id === chapter.id;
                  const isPast = currentTime >= chapter.startTime && !isActive;
                  
                  return (
                    <motion.button
                      key={chapter.id}
                      onClick={() => seekToTime(chapter.startTime)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={cn(
                        "w-full flex items-center gap-4 p-3 rounded-lg text-left transition-all",
                        isActive 
                          ? "bg-primary/10 border border-primary/50 shadow-lg shadow-primary/10" 
                          : isPast
                            ? "bg-muted/30 hover:bg-muted/50"
                            : "bg-muted/10 hover:bg-muted/30"
                      )}
                    >
                      {/* Number/Icon */}
                      <div className={cn(
                        "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold",
                        isActive 
                          ? "bg-primary text-primary-foreground" 
                          : isPast
                            ? "bg-green-500/20 text-green-500"
                            : "bg-muted text-muted-foreground"
                      )}>
                        {isPast && !isActive ? "✓" : getChapterIcon(index)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "font-medium truncate",
                          isActive && "text-primary"
                        )}>
                          {chapter.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(chapter.startTime)}
                        </p>
                      </div>

                      {/* Active Indicator */}
                      {isActive && (
                        <Badge className="bg-primary/20 text-primary border-primary/30">
                          Reproduzindo
                        </Badge>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </motion.div>
      )}

      {/* Notes Section */}
      {notes.length > 0 && (
        <div className="bg-muted/10 rounded-xl p-4 border border-border/50">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <BookmarkPlus className="h-5 w-5 text-amber-500" />
            Suas Anotações ({notes.length})
          </h3>
          <ScrollArea className="h-[200px]">
            <div className="space-y-3">
              {notes.map((note) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-muted/30 rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => seekToTime(note.timestamp)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {formatTime(note.timestamp)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {note.createdAt.toLocaleTimeString("pt-BR")}
                    </span>
                  </div>
                  <p className="text-sm">{note.content}</p>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

export default YouTubePlayer;
