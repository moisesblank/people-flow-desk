// ============================================
// 🧠 FLASHCARDS MODAL CONTENT
// Revisão espaçada - Lazy-loaded
// ============================================

import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, Play, Clock, Flame, RotateCcw, Sparkles, Zap, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock de decks
const MOCK_DECKS = [
  { id: 1, name: "Tabela Periódica", cards: 118, due: 23, mastered: 85, color: "from-pink-500 to-rose-500" },
  { id: 2, name: "Funções Orgânicas", cards: 45, due: 12, mastered: 67, color: "from-purple-500 to-violet-500" },
  { id: 3, name: "Fórmulas de Físico-Química", cards: 32, due: 8, mastered: 72, color: "from-blue-500 to-cyan-500" },
  { id: 4, name: "Nomenclatura IUPAC", cards: 56, due: 15, mastered: 58, color: "from-green-500 to-emerald-500" },
];

export const FlashcardsModalContent = memo(function FlashcardsModalContent() {
  return (
    <div className="space-y-6">
      {/* Header stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-pink-500/20 bg-pink-500/5">
          <CardContent className="pt-4 text-center">
            <Brain className="w-6 h-6 text-pink-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">251</div>
            <div className="text-xs text-muted-foreground">Total de cards</div>
          </CardContent>
        </Card>
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="pt-4 text-center">
            <Clock className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">58</div>
            <div className="text-xs text-muted-foreground">Para revisar</div>
          </CardContent>
        </Card>
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="pt-4 text-center">
            <Sparkles className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">72%</div>
            <div className="text-xs text-muted-foreground">Dominados</div>
          </CardContent>
        </Card>
        <Card className="border-orange-500/20 bg-orange-500/5">
          <CardContent className="pt-4 text-center">
            <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">7</div>
            <div className="text-xs text-muted-foreground">Streak</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Revisão do dia */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg">Revisão do Dia</h3>
              <p className="text-sm text-muted-foreground">58 cards aguardando revisão</p>
            </div>
            <Badge className="bg-gradient-to-r from-primary to-purple-500 text-white border-0 px-4 py-1">
              <Zap className="w-4 h-4 mr-1" />
              +120 XP
            </Badge>
          </div>
          <Button className="w-full h-12 text-lg font-bold bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600">
            <Play className="w-5 h-5 mr-2" />
            Iniciar Revisão
          </Button>
        </CardContent>
      </Card>
      
      {/* Decks */}
      <div>
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          Seus Decks
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MOCK_DECKS.map((deck) => (
            <Card key={deck.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="pt-4">
                <div className="flex items-start gap-4">
                  <div className={cn("p-3 rounded-xl bg-gradient-to-br shrink-0", deck.color)}>
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{deck.name}</h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{deck.cards} cards</span>
                      <span className="text-amber-500">{deck.due} pendentes</span>
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Dominados</span>
                        <span className="text-green-500">{deck.mastered}%</span>
                      </div>
                      <Progress value={deck.mastered} className="h-2" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
});

export default FlashcardsModalContent;
