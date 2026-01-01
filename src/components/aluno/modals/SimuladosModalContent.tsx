// ============================================
// 📝 SIMULADOS MODAL CONTENT
// Provas oficiais com XP - Lazy-loaded
// ============================================

import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  Play, 
  Clock, 
  Target, 
  Trophy, 
  Zap, 
  Calendar,
  Medal,
  TrendingUp,
  Lock
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock de simulados
const MOCK_SIMULADOS = [
  { id: 1, name: "Simulado ENEM 2024 - Química", questions: 45, time: 90, xp: 150, difficulty: "Médio", available: true },
  { id: 2, name: "Prova FUVEST 2023 - 1ª Fase", questions: 30, time: 60, xp: 120, difficulty: "Difícil", available: true },
  { id: 3, name: "UNICAMP 2023 - Química", questions: 25, time: 50, xp: 100, difficulty: "Difícil", available: true },
  { id: 4, name: "UNESP 2024 - Química", questions: 20, time: 40, xp: 80, difficulty: "Médio", available: false },
];

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "Fácil": return "text-green-500 border-green-500/30 bg-green-500/10";
    case "Médio": return "text-amber-500 border-amber-500/30 bg-amber-500/10";
    case "Difícil": return "text-red-500 border-red-500/30 bg-red-500/10";
    default: return "";
  }
};

export const SimuladosModalContent = memo(function SimuladosModalContent() {
  return (
    <div className="space-y-6">
      {/* Header com ranking */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-indigo-500/20 bg-indigo-500/5">
          <CardContent className="pt-4 text-center">
            <Trophy className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">#42</div>
            <div className="text-xs text-muted-foreground">Seu Ranking</div>
          </CardContent>
        </Card>
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="pt-4 text-center">
            <Zap className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">2.450</div>
            <div className="text-xs text-muted-foreground">XP Total</div>
          </CardContent>
        </Card>
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="pt-4 text-center">
            <Medal className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">78%</div>
            <div className="text-xs text-muted-foreground">Aproveitamento</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Info XP */}
      <Card className="border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 to-violet-500/10">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold">Ganhe XP e suba no ranking!</h3>
              <p className="text-sm text-muted-foreground">
                Cada simulado vale pontos que contam para sua posição
              </p>
            </div>
            <Badge className="ml-auto bg-gradient-to-r from-indigo-500 to-violet-500 text-white border-0 px-4">
              +10 XP/questão
            </Badge>
          </div>
        </CardContent>
      </Card>
      
      {/* Lista de simulados */}
      <div>
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Simulados Disponíveis
        </h3>
        
        <div className="space-y-3">
          {MOCK_SIMULADOS.map((simulado) => (
            <Card 
              key={simulado.id}
              className={cn(
                "transition-all",
                simulado.available ? "hover:border-indigo-500/30 cursor-pointer" : "opacity-60"
              )}
            >
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shrink-0">
                    {simulado.available ? (
                      <FileText className="w-5 h-5 text-white" />
                    ) : (
                      <Lock className="w-5 h-5 text-white" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{simulado.name}</h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        {simulado.questions} questões
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {simulado.time} min
                      </span>
                      <Badge variant="outline" className={cn("text-[10px]", getDifficultyColor(simulado.difficulty))}>
                        {simulado.difficulty}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="text-right shrink-0">
                    <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black border-0 mb-2">
                      <Zap className="w-3 h-3 mr-1" />
                      +{simulado.xp} XP
                    </Badge>
                    {simulado.available && (
                      <Button size="sm" className="w-full bg-gradient-to-r from-indigo-500 to-violet-500">
                        <Play className="w-4 h-4 mr-1" />
                        Iniciar
                      </Button>
                    )}
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

export default SimuladosModalContent;
