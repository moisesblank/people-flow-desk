// ============================================
// TRILHA DE FOCO - SANTUÁRIO BETA v9.0
// 🔒 COMPONENTE DESATIVADO - AGUARDANDO DADOS REAIS
// Não exibe dados fictícios conforme política de integridade
// ============================================

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { 
  Target, Brain, Zap, 
  PlayCircle, Sparkles, AlertTriangle
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FocusTrackProps {
  userId: string;
  currentFocusAreaId?: string;
}

/**
 * FocusTrack - Trilha de Foco Diária
 * 
 * 🔒 STATUS: AGUARDANDO IMPLEMENTAÇÃO DE DADOS REAIS
 * 
 * Este componente exibia dados mockados. Conforme a política de 
 * integridade de dados, agora exibe um estado informativo até
 * que a lógica de IA para montagem de trilha seja implementada
 * com dados reais do banco de dados.
 */
export function FocusTrack({ userId, currentFocusAreaId }: FocusTrackProps) {
  const navigate = useNavigate();

  return (
    <Card className="border-2 border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                Sua Trilha de Foco
                <Badge variant="outline" className="text-xs font-normal border-amber-500/50 text-amber-600">
                  <Sparkles className="w-3 h-3 mr-1" />
                  EM BREVE
                </Badge>
              </CardTitle>
              <CardDescription>Sistema de trilhas personalizadas em desenvolvimento</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20"
        >
          <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">Trilha Personalizada em Desenvolvimento</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            Estamos desenvolvendo um sistema de IA que irá montar trilhas de estudo 
            personalizadas baseadas no seu desempenho real. Por enquanto, explore 
            as opções abaixo.
          </p>
          
          <div className="flex flex-wrap justify-center gap-3">
            <Button 
              onClick={() => navigate('/alunos/videoaulas')}
              className="gap-2 bg-gradient-to-r from-purple-500 to-pink-600"
            >
              <PlayCircle className="w-4 h-4" />
              Ver Aulas
            </Button>
            <Button 
              onClick={() => navigate('/alunos/questoes')}
              variant="outline"
              className="gap-2"
            >
              <Brain className="w-4 h-4" />
              Praticar Questões
            </Button>
          </div>
        </motion.div>
        
        {/* Indicador de integridade de dados */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Zap className="w-3 h-3 text-amber-500" />
            Este componente não exibe dados fictícios por política de integridade
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
