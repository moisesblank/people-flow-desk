// ============================================
// MOISÉS MEDEIROS v9.0 - VIDEO PLAYER AVANÇADO
// FORTALEZA DIGITAL - Player com proteção total
// 🔒 DISCLAIMER OBRIGATÓRIO - VERDADE ABSOLUTA
// ============================================

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  Pause,
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize,
  BookmarkPlus,
  SkipBack,
  SkipForward,
  Clock,
  List,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Beaker,
  Atom,
  FlaskConical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
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
import { FortressPlayerWrapper } from "@/components/video/FortressPlayerWrapper";
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

interface VideoPlayerAdvancedProps {
  src: string;
  title: string;
  duration: string;
  chapters?: VideoChapter[];
  onComplete?: () => void;
  onProgress?: (progress: number) => void;
  onChapterChange?: (chapter: VideoChapter) => void;
  showChaptersBelow?: boolean;
  isEditMode?: boolean;
  onChaptersEdit?: (chapters: VideoChapter[]) => void;
}

export function VideoPlayerAdvanced({ 
  src, 
  title, 
  duration, 
  chapters = [],
  onComplete, 
  onProgress,
  onChapterChange,
  showChaptersBelow = true,
  isEditMode = false,
  onChaptersEdit
}: VideoPlayerAdvancedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 🔒 DISCLAIMER OBRIGATÓRIO - VERDADE ABSOLUTA
  const { showDisclaimer, disclaimerCompleted, startDisclaimer, handleDisclaimerComplete } = useVideoDisclaimer();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentChapter, setCurrentChapter] = useState<VideoChapter | null>(null);
  const [showChaptersList, setShowChaptersList] = useState(true);

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

  // Parse string "HH:MM:SS" ou "MM:SS" para segundos
  const parseTimeToSeconds = (timeStr: string): number => {
    const parts = timeStr.split(":").map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return parts[0] * 60 + parts[1];
  };

  // Detectar capítulo atual baseado no tempo
  useEffect(() => {
    if (chapters.length === 0) return;
    
    const chapter = chapters.find((ch, index) => {
      const nextChapter = chapters[index + 1];
      const endTime = ch.endTime || (nextChapter?.startTime || videoDuration);
      return currentTime >= ch.startTime && currentTime < endTime;
    });

    if (chapter && chapter.id !== currentChapter?.id) {
      setCurrentChapter(chapter);
      onChapterChange?.(chapter);
    }
  }, [currentTime, chapters, videoDuration, currentChapter, onChapterChange]);

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      setCurrentTime(current);
      
      const progress = (current / videoDuration) * 100;
      onProgress?.(progress);

      if (progress >= 90) {
        onComplete?.();
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      const newTime = (value[0] / 100) * videoDuration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const seekToTime = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      setCurrentTime(seconds);
      if (!isPlaying) {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0] / 100;
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const changePlaybackRate = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
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

  const goToNote = (timestamp: number) => {
    seekToTime(timestamp);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } else {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const progress = videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0;

  // Ícones de química para capítulos
  const getChapterIcon = (index: number) => {
    const icons = [Beaker, Atom, FlaskConical];
    const Icon = icons[index % icons.length];
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4" ref={containerRef}>
      {/* Video Container - FORTALEZA DIGITAL */}
      <FortressPlayerWrapper className="relative rounded-2xl overflow-hidden bg-black group" showSecurityBadge>
        {/* 🔒 DISCLAIMER OVERLAY - OBRIGATÓRIO EM TODOS OS VÍDEOS */}
        <VideoDisclaimer 
          isVisible={showDisclaimer} 
          onComplete={handleDisclaimerComplete} 
        />
        
        <video
          ref={videoRef}
          src={src}
          className="w-full aspect-video"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onClick={() => {
            if (!disclaimerCompleted) {
              startDisclaimer();
              return;
            }
            togglePlay();
          }}
          playsInline
        />

        {/* Current Chapter Indicator */}
        {currentChapter && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg"
          >
            <p className="text-sm text-white/90 font-medium">{currentChapter.title}</p>
          </motion.div>
        )}

        {/* Play Overlay */}
        <AnimatePresence>
          {!isPlaying && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/40"
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={togglePlay}
                className="p-6 rounded-full bg-primary/90 text-primary-foreground shadow-2xl"
              >
                <Play className="h-12 w-12" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Chapter Markers on Progress Bar */}
          <div className="relative mb-3">
            {/* Progress Slider */}
            <Slider
              value={[progress]}
              max={100}
              step={0.1}
              onValueChange={handleSeek}
              className="cursor-pointer"
            />
            
            {/* Chapter Markers */}
            {chapters.map((chapter, index) => {
              const markerPosition = videoDuration > 0 
                ? (chapter.startTime / videoDuration) * 100 
                : 0;
              return (
                <button
                  key={chapter.id}
                  onClick={() => seekToTime(chapter.startTime)}
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary hover:bg-primary/80 transition-colors z-10 hover:scale-125"
                  style={{ left: `${markerPosition}%` }}
                  title={chapter.title}
                />
              );
            })}
          </div>

          <div className="flex items-center justify-between">
            {/* Left Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={togglePlay}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => skip(-10)}
              >
                <SkipBack className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => skip(10)}
              >
                <SkipForward className="h-4 w-4" />
              </Button>

              {/* Volume */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={toggleMute}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume * 100]}
                  max={100}
                  onValueChange={handleVolumeChange}
                  className="w-20"
                />
              </div>

              {/* Time */}
              <span className="text-xs text-white/80 ml-2">
                {formatTime(currentTime)} / {formatTime(videoDuration)}
              </span>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2">
              {/* Chapters Toggle */}
              {chapters.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={() => setShowChaptersList(!showChaptersList)}
                >
                  <List className="h-4 w-4" />
                </Button>
              )}

              {/* Add Note */}
              <Popover open={showNoteInput} onOpenChange={setShowNoteInput}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                  >
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

              {/* Playback Speed */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20 text-xs"
                  >
                    {playbackRate}x
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-32">
                  <div className="space-y-1">
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                      <Button
                        key={rate}
                        variant={playbackRate === rate ? "default" : "ghost"}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => changePlaybackRate(rate)}
                      >
                        {rate}x
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Fullscreen */}
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? (
                  <Minimize className="h-4 w-4" />
                ) : (
                  <Maximize className="h-4 w-4" />
                )}
              </Button>
          </div>
          </div>
        </div>
      </FortressPlayerWrapper>

      {/* Chapter Buttons (TRACKLIST) - Below Player */}
      {showChaptersBelow && chapters.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <List className="h-4 w-4 text-primary" />
              Índice da Aula ({chapters.length} tópicos)
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowChaptersList(!showChaptersList)}
            >
              {showChaptersList ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>

          <AnimatePresence>
            {showChaptersList && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {chapters.map((chapter, index) => {
                    const isActive = currentChapter?.id === chapter.id;
                    const isPast = currentTime > chapter.startTime && !isActive;
                    
                    return (
                      <motion.button
                        key={chapter.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => seekToTime(chapter.startTime)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg text-left transition-all border",
                          isActive 
                            ? "bg-primary/20 border-primary text-primary shadow-lg shadow-primary/20" 
                            : isPast
                            ? "bg-muted/50 border-border/50 text-muted-foreground"
                            : "bg-card hover:bg-muted border-border hover:border-primary/50"
                        )}
                      >
                        <div className={cn(
                          "flex items-center justify-center w-10 h-10 rounded-full shrink-0",
                          isActive ? "bg-primary text-primary-foreground" : "bg-muted"
                        )}>
                          {getChapterIcon(index)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm font-medium truncate",
                            isActive && "text-primary"
                          )}>
                            {chapter.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatTime(chapter.startTime)}
                          </p>
                        </div>
                        {isActive && (
                          <Badge className="bg-primary/20 text-primary shrink-0">
                            Agora
                          </Badge>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Title and Current Chapter */}
      <div>
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>Duração: {duration}</span>
          {currentChapter && (
            <>
              <span>•</span>
              <span className="text-primary">{currentChapter.title}</span>
            </>
          )}
        </div>
      </div>

      {/* Notes Section */}
      {notes.length > 0 && (
        <div className="space-y-3 p-4 bg-muted/30 rounded-xl border border-border">
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            Suas Anotações ({notes.length})
          </h3>
          <ScrollArea className="max-h-48">
            <div className="space-y-2">
              {notes.map((note) => (
                <motion.button
                  key={note.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => goToNote(note.timestamp)}
                  className="w-full text-left p-3 rounded-lg bg-background hover:bg-muted transition-colors border border-border"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                      {formatTime(note.timestamp)}
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground">{note.content}</p>
                </motion.button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
