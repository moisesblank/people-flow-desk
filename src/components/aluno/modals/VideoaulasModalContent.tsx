// ============================================
// 🎥 VIDEOAULAS MODAL CONTENT
// Biblioteca de vídeos - Acesso direto
// ============================================

import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Video, Play, BookOpen, Film } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const VideoaulasModalContent = memo(function VideoaulasModalContent() {
  const navigate = useNavigate();

  // Buscar contagens reais
  const { data: stats, isLoading } = useQuery({
    queryKey: ['videoaulas-modal-stats'],
    queryFn: async () => {
      const { count: totalAulas } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      const { count: totalModulos } = await supabase
        .from('areas')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      return {
        totalAulas: totalAulas || 0,
        totalModulos: totalModulos || 0,
      };
    },
    staleTime: 60_000,
  });

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
            <div className="text-2xl font-bold">{stats?.totalAulas || 0}</div>
            <div className="text-xs text-muted-foreground">Videoaulas</div>
          </CardContent>
        </Card>
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="pt-4 text-center">
            <BookOpen className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats?.totalModulos || 0}</div>
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
              {stats?.totalAulas && stats.totalAulas > 0
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
