// ============================================
// 🎯 QUESTÕES MODAL CONTENT - MODO TREINO ONLY
// Hard block: simulados, rankings, exames oficiais
// Lazy-loaded
// ============================================

import { memo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  Play, 
  BookOpen, 
  Brain, 
  Filter,
  AlertTriangle,
  Zap,
  Clock,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock de áreas para treino
const AREAS_TREINO = [
  { id: 1, name: "Estequiometria", questions: 45, accuracy: 68, color: "from-blue-500 to-cyan-500" },
  { id: 2, name: "Química Orgânica", questions: 78, accuracy: 72, color: "from-purple-500 to-pink-500" },
  { id: 3, name: "Eletroquímica", questions: 32, accuracy: 55, color: "from-amber-500 to-yellow-500" },
  { id: 4, name: "Termoquímica", questions: 28, accuracy: 81, color: "from-red-500 to-orange-500" },
  { id: 5, name: "Cinética", questions: 24, accuracy: 63, color: "from-green-500 to-emerald-500" },
  { id: 6, name: "Soluções", questions: 36, accuracy: 59, color: "from-indigo-500 to-violet-500" },
];

export const QuestoesModalContent = memo(function QuestoesModalContent() {
  const [selectedArea, setSelectedArea] = useState<number | null>(null);
  
  return (
    <div className="space-y-6">
      {/* AVISO: Modo Treino */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold flex items-center gap-2">
                Modo Treino
                <Badge variant="outline" className="text-amber-600 border-amber-500/30 bg-amber-500/10">
                  0 XP
                </Badge>
              </h3>
              <p className="text-sm text-muted-foreground">
                Pratique sem pressão! Questões de treino não afetam seu ranking.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Bloco de aviso sobre simulados */}
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="text-sm">
              <strong className="text-destructive">Quer ganhar XP?</strong>
              <p className="text-muted-foreground mt-1">
                Para questões que valem pontos e afetam o ranking, acesse o módulo <strong>Simulados</strong>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Estatísticas gerais */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <BookOpen className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">243</div>
            <div className="text-xs text-muted-foreground">Questões disponíveis</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">67%</div>
            <div className="text-xs text-muted-foreground">Taxa de acerto</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">2.3min</div>
            <div className="text-xs text-muted-foreground">Tempo médio</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Áreas para treinar */}
      <div>
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Brain className="w-4 h-4" />
          Escolha uma área para treinar
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {AREAS_TREINO.map((area) => (
            <Card 
              key={area.id}
              className={cn(
                "cursor-pointer transition-all hover:scale-105",
                selectedArea === area.id && "ring-2 ring-primary"
              )}
              onClick={() => setSelectedArea(area.id)}
            >
              <CardContent className="pt-4">
                <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3", area.color)}>
                  <Target className="w-5 h-5 text-white" />
                </div>
                <h4 className="font-medium text-sm">{area.name}</h4>
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span>{area.questions} questões</span>
                  <span className={area.accuracy >= 70 ? "text-green-500" : area.accuracy >= 50 ? "text-amber-500" : "text-red-500"}>
                    {area.accuracy}%
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      {/* Botão iniciar */}
      <Button 
        className="w-full h-14 text-lg font-bold bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black"
        disabled={!selectedArea}
      >
        <Play className="w-5 h-5 mr-2" />
        Iniciar Treino
      </Button>
    </div>
  );
});

export default QuestoesModalContent;
