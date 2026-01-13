// ============================================
// 📚 LIVROS WEB MODAL CONTENT
// Biblioteca digital - Acesso direto
// ============================================

import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const LivrosWebModalContent = memo(function LivrosWebModalContent() {
  const navigate = useNavigate();

  // Buscar apenas contagem de livros
  const { data: totalLivros, isLoading } = useQuery({
    queryKey: ['livros-modal-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('web_books')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true);
      return count || 0;
    },
    staleTime: 60_000,
  });

  if (isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <Card className="border-orange-500/20 bg-orange-500/5">
        <CardContent className="pt-4 text-center">
          <BookOpen className="w-6 h-6 text-orange-500 mx-auto mb-2" />
          <div className="text-2xl font-bold">{totalLivros}</div>
          <div className="text-xs text-muted-foreground">Livros disponíveis</div>
        </CardContent>
      </Card>
      
      {/* Acesso à biblioteca */}
      <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-red-500/5">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Biblioteca Digital</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              {totalLivros && totalLivros > 0
                ? `Acesse ${totalLivros} livros digitais exclusivos.`
                : 'Nenhum livro disponível no momento.'
              }
            </p>
            <Button 
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              onClick={() => navigate('/alunos/livro-web')}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Acessar Biblioteca
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

export default LivrosWebModalContent;
