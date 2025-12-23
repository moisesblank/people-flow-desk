// ============================================
// MOISÉS MEDEIROS v8.0 - VIDEO PLAYER LMS
// FORTALEZA DIGITAL - Player com proteção total
// LEI I: Animações governadas por prefers-reduced-motion
// ============================================

import { useState, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  Pause,
  Volume2, 
  VolumeX, 
  Maximize, 
  Settings,
  MessageSquare,
  BookmarkPlus,
  SkipBack,
  SkipForward,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";
import { FortressPlayerWrapper } from "@/components/video/FortressPlayerWrapper";
import { useReducedMotion } from "@/hooks/usePerformance";

interface Note {
  id: string;
  timestamp: number;
  content: string;
  createdAt: Date;
}

interface VideoPlayerProps {
  src: string;
  title: string;
  duration: string;
  onComplete?: () => void;
  onProgress?: (progress: number) => void;
}

export function VideoPlayer({ 
  src, 
  title, 
  duration, 
  onComplete, 
  onProgress 
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reducedMotion = useReducedMotion(); // LEI I - Animações governadas
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  
  // Animações condicionais (LEI I - Artigo 20)
  const animationProps = useMemo(() => 
    reducedMotion ? {} : { whileHover: { scale: 1.1 }, whileTap: { scale: 0.95 } }
  , [reducedMotion]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

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

      // Mark as complete at 90%
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
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
      setCurrentTime(timestamp);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const progress = videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Video Container */}
      <FortressPlayerWrapper className="relative rounded-2xl overflow-hidden bg-black group" showSecurityBadge>
        <video
          ref={videoRef}
          src={src}
          className="w-full aspect-video"
          preload="none"
          poster="/placeholder.svg"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onClick={togglePlay}
          aria-label={`Vídeo: ${title}`}
        />

        {/* Play Overlay */}
        <AnimatePresence>
          {!isPlaying && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/30"
            >
            <motion.button
              {...animationProps}
              onClick={togglePlay}
              className="p-5 rounded-full bg-primary/90 text-primary-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label={`Reproduzir vídeo: ${title}`}
              tabIndex={0}
            >
              <Play className="h-10 w-10" />
            </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Progress Bar */}
          <div className="mb-3">
            <Slider
              value={[progress]}
              max={100}
              step={0.1}
              onValueChange={handleSeek}
              className="cursor-pointer"
            />
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
                <Maximize className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </FortressPlayerWrapper>

      {/* Title */}
      <div>
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">Duração: {duration}</p>
      </div>

      {/* Notes */}
      {notes.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Suas Anotações ({notes.length})
          </h3>
          <div className="space-y-2">
            {notes.map((note) => (
              <motion.button
                key={note.id}
                initial={reducedMotion ? undefined : { opacity: 0, y: 10 }}
                animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
                onClick={() => goToNote(note.timestamp)}
                className="w-full text-left p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="text-xs">
                    {formatTime(note.timestamp)}
                  </Badge>
                </div>
                <p className="text-sm text-foreground">{note.content}</p>
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
