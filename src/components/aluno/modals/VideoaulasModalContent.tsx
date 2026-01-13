// ============================================
// 🎥 VIDEOAULAS MODAL CONTENT
// Biblioteca de vídeos - Acesso direto
// ============================================

import { memo, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Video, Play, BookOpen, Film } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface VideoaulasStats {
  totalAulas: number;
  totalModulos: number;
}

export const VideoaulasModalContent = memo(function VideoaulasModalContent() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<VideoaulasStats>({ totalAulas: 0, totalModulos: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Cast para evitar erro de recursão de tipos do Supabase
        const client = supabase as any;
        
        const [lessonsRes, areasRes] = await Promise.all([
          client.from('lessons').select('id', { count: 'exact', head: true }).eq('is_active', true),
          client.from('areas').select('id', { count: 'exact', head: true }).eq('is_active', true),
        ]);

        setStats({
          totalAulas: lessonsRes.count ?? 0,
          totalModulos: areasRes.count ?? 0,
        });
      } catch (error) {
        console.error('Erro ao buscar stats de videoaulas:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  return (
    <div className="space-y-6">
      {/* Stats - DADOS REAIS */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="pt-4 text-center">
            <Video className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.totalAulas}</div>
            <div className="text-xs text-muted-foreground">Videoaulas</div>
          </CardContent>
        </Card>
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="pt-4 text-center">
            <BookOpen className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.totalModulos}</div>
            <div className="text-xs text-muted-foreground">Módulos</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Acesso às videoaulas */}
      <Card className="border-red-500/20 bg-gradient-to-br from-red-500/5 to-orange-500/5">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <Film className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Acesse suas Videoaulas</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              {stats.totalAulas > 0
                ? `Você tem acesso a ${stats.totalAulas} videoaulas.`
                : 'Nenhuma videoaula disponível no momento.'
              }
            </p>
            <Button 
              className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
              onClick={() => navigate('/alunos/videoaulas')}
            >
              <Play className="w-4 h-4 mr-2" />
              Ir para Videoaulas
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

export default VideoaulasModalContent;
