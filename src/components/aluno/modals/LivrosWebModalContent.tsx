// ============================================
// 📚 LIVROS WEB MODAL CONTENT
// Biblioteca digital - Lazy-loaded
// ============================================

import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Search, Clock, Bookmark, Star, Eye, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock de livros
const MOCK_LIVROS = [
  { id: 1, title: "Química Geral - Volume 1", author: "Prof. Moisés Medeiros", pages: 320, progress: 45, category: "quimica-geral", color: "from-red-500 to-orange-500" },
  { id: 2, title: "Química Orgânica Essencial", author: "Prof. Moisés Medeiros", pages: 280, progress: 72, category: "quimica-organica", color: "from-purple-500 to-indigo-500" },
  { id: 3, title: "Físico-Química Aplicada", author: "Prof. Moisés Medeiros", pages: 240, progress: 23, category: "fisico-quimica", color: "from-green-500 to-emerald-500" },
  { id: 4, title: "Revisão Intensiva ENEM", author: "Prof. Moisés Medeiros", pages: 180, progress: 0, category: "revisao", color: "from-cyan-500 to-blue-500" },
];

export const LivrosWebModalContent = memo(function LivrosWebModalContent() {
  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar livros..." className="pl-10" />
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-orange-500/20 bg-orange-500/5">
          <CardContent className="pt-4 text-center">
            <BookOpen className="w-6 h-6 text-orange-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">4</div>
            <div className="text-xs text-muted-foreground">Livros disponíveis</div>
          </CardContent>
        </Card>
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="pt-4 text-center">
            <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">12h</div>
            <div className="text-xs text-muted-foreground">Tempo de leitura</div>
          </CardContent>
        </Card>
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="pt-4 text-center">
            <Bookmark className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">35%</div>
            <div className="text-xs text-muted-foreground">Progresso total</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Continuar lendo */}
      {MOCK_LIVROS.filter(l => l.progress > 0 && l.progress < 100).length > 0 && (
        <div>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Continuar Lendo
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MOCK_LIVROS.filter(l => l.progress > 0 && l.progress < 100).slice(0, 2).map((livro) => (
              <Card 
                key={livro.id}
                className="overflow-hidden hover:border-orange-500/30 transition-all cursor-pointer"
              >
                <div className="flex">
                  {/* Cover */}
                  <div className={cn("w-24 h-32 bg-gradient-to-br flex items-center justify-center shrink-0", livro.color)}>
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                  
                  {/* Info */}
                  <CardContent className="flex-1 py-3">
                    <h4 className="font-medium text-sm line-clamp-2">{livro.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{livro.author}</p>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Progresso</span>
                        <span>{livro.progress}%</span>
                      </div>
                      <Progress value={livro.progress} className="h-2" />
                    </div>
                    <Button size="sm" className="mt-3 w-full gap-1" variant="outline">
                      Continuar <ArrowRight className="w-3 h-3" />
                    </Button>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {/* Biblioteca completa */}
      <div>
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          Biblioteca Completa
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {MOCK_LIVROS.map((livro) => (
            <Card 
              key={livro.id}
              className="group overflow-hidden hover:border-orange-500/30 transition-all cursor-pointer"
            >
              {/* Cover */}
              <div className={cn("aspect-[3/4] bg-gradient-to-br flex items-center justify-center relative", livro.color)}>
                <BookOpen className="w-10 h-10 text-white/80" />
                {livro.progress > 0 && (
                  <Badge className="absolute bottom-2 right-2 bg-black/70 text-white text-xs">
                    {livro.progress}%
                  </Badge>
                )}
              </div>
              
              {/* Info */}
              <CardContent className="p-3">
                <h4 className="font-medium text-xs line-clamp-2 mb-1">{livro.title}</h4>
                <p className="text-[10px] text-muted-foreground">{livro.pages} páginas</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
});

export default LivrosWebModalContent;
