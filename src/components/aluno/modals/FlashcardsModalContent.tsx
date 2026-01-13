// ============================================
// 🧠 FLASHCARDS MODAL CONTENT
// Revisão espaçada - Acesso direto
// ============================================

import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Play, Flame, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGamification } from "@/hooks/useGamification";

export const FlashcardsModalContent = memo(function FlashcardsModalContent() {
  const navigate = useNavigate();
  const { gamification } = useGamification();
  const streak = gamification?.current_streak || 0;

  return (
    <div className="space-y-6">
      {/* Header stats - DADOS REAIS */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-orange-500/20 bg-orange-500/5">
          <CardContent className="pt-4 text-center">
            <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{streak}</div>
            <div className="text-xs text-muted-foreground">Dias de Streak</div>
          </CardContent>
        </Card>
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="pt-4 text-center">
            <Zap className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{gamification?.total_xp || 0}</div>
            <div className="text-xs text-muted-foreground">XP Total</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Acesso aos flashcards */}
      <Card className="border-pink-500/20 bg-gradient-to-br from-pink-500/5 to-rose-500/5">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Flashcards</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Sistema de repetição espaçada para memorização eficiente.
            </p>
            <Button 
              className="w-full h-12 text-lg font-bold bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
              onClick={() => navigate('/alunos/materiais')}
            >
              <Play className="w-5 h-5 mr-2" />
              Acessar Flashcards
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

export default FlashcardsModalContent;
