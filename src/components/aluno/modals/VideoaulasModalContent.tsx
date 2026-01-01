// ============================================
// 🎥 VIDEOAULAS MODAL CONTENT
// Biblioteca de vídeos - Lazy-loaded
// ============================================

import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Video, Play, Clock, Search, Filter, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock de videoaulas
const MOCK_VIDEOS = [
  { id: 1, title: "Introdução à Estequiometria", duration: "25:30", views: 1250, category: "Química Geral", thumbnail: "🧪" },
  { id: 2, title: "Balanceamento de Equações", duration: "18:45", views: 980, category: "Química Geral", thumbnail: "⚗️" },
  { id: 3, title: "Funções Orgânicas - Parte 1", duration: "32:15", views: 1540, category: "Química Orgânica", thumbnail: "🔬" },
  { id: 4, title: "Eletroquímica Básica", duration: "28:00", views: 870, category: "Físico-Química", thumbnail: "⚡" },
  { id: 5, title: "Termoquímica - Entalpia", duration: "22:30", views: 720, category: "Físico-Química", thumbnail: "🔥" },
  { id: 6, title: "Cinética Química", duration: "26:45", views: 650, category: "Físico-Química", thumbnail: "⏱️" },
];

export const VideoaulasModalContent = memo(function VideoaulasModalContent() {
  return (
    <div className="space-y-6">
      {/* Search and filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar videoaulas..." className="pl-10" />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          Filtrar
        </Button>
      </div>
      
      {/* Stats */}
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <span className="flex items-center gap-2">
          <Video className="w-4 h-4 text-red-500" />
          <strong className="text-foreground">156</strong> videoaulas
        </span>
        <span className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-500" />
          <strong className="text-foreground">48h</strong> de conteúdo
        </span>
        <span className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-green-500" />
          <strong className="text-foreground">12</strong> módulos
        </span>
      </div>
      
      {/* Video grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MOCK_VIDEOS.map((video) => (
          <Card 
            key={video.id} 
            className="group overflow-hidden hover:border-red-500/30 transition-all cursor-pointer"
          >
            {/* Thumbnail */}
            <div className="relative aspect-video bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
              <span className="text-4xl">{video.thumbnail}</span>
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm">
                  <Play className="w-8 h-8 text-white" />
                </div>
              </div>
              <Badge className="absolute bottom-2 right-2 bg-black/70 text-white text-xs">
                {video.duration}
              </Badge>
            </div>
            
            {/* Info */}
            <CardContent className="p-4">
              <h4 className="font-medium line-clamp-2 mb-2">{video.title}</h4>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <Badge variant="outline">{video.category}</Badge>
                <span>{video.views.toLocaleString()} views</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
});

export default VideoaulasModalContent;
