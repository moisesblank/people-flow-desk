// ============================================
// TEAM SUMMARY - Resumo da Equipe
// Visão rápida da equipe
// ============================================

import { motion } from "framer-motion";
import { 
  Users, 
  UserCheck, 
  Clock, 
  TrendingUp,
  ChevronRight,
  Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";

interface TeamSummaryProps {
  totalEmployees: number;
  activeEmployees: number;
  onVacation: number;
  onLeave: number;
}

export function TeamSummary({ 
  totalEmployees, 
  activeEmployees, 
  onVacation, 
  onLeave 
}: TeamSummaryProps) {
  const navigate = useNavigate();
  
  const teamInitials = ["JM", "AC", "RF", "MS", "LP"];
  const displayedMembers = Math.min(activeEmployees, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Equipe
        </h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate("/funcionarios")}
          className="gap-1"
        >
          Ver todos
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-3 rounded-xl bg-[hsl(var(--stats-green))]/10 border border-[hsl(var(--stats-green))]/20">
          <div className="flex items-center gap-2 mb-1">
            <UserCheck className="h-4 w-4 text-[hsl(var(--stats-green))]" />
            <span className="text-xs text-muted-foreground">Ativos</span>
          </div>
          <p className="text-xl font-bold text-[hsl(var(--stats-green))]">{activeEmployees}</p>
        </div>
        
        <div className="p-3 rounded-xl bg-[hsl(var(--stats-blue))]/10 border border-[hsl(var(--stats-blue))]/20">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-[hsl(var(--stats-blue))]" />
            <span className="text-xs text-muted-foreground">Em férias</span>
          </div>
          <p className="text-xl font-bold text-[hsl(var(--stats-blue))]">{onVacation}</p>
        </div>
      </div>

      {/* Team Members Preview */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground mb-3">Membros da equipe</p>
        <div className="flex items-center">
          <div className="flex -space-x-2">
            {Array.from({ length: displayedMembers }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                <Avatar className="h-10 w-10 border-2 border-background">
                  <AvatarFallback className="bg-primary/20 text-primary text-xs font-medium">
                    {teamInitials[i] || "?"}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
            ))}
          </div>
          {activeEmployees > 5 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="ml-3 px-2 py-1 rounded-full bg-muted text-xs text-muted-foreground font-medium"
            >
              +{activeEmployees - 5} mais
            </motion.div>
          )}
        </div>
      </div>

      {/* Performance indicator */}
      <div className="p-3 rounded-xl bg-[hsl(var(--stats-gold))]/10 border border-[hsl(var(--stats-gold))]/20">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-[hsl(var(--stats-gold))]" />
          <div>
            <p className="text-sm font-medium text-foreground">Produtividade da Equipe</p>
            <p className="text-xs text-muted-foreground">
              {((activeEmployees / Math.max(totalEmployees, 1)) * 100).toFixed(0)}% da equipe ativa
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
