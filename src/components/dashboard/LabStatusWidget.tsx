// ============================================
// UPGRADE v10 - WIDGET DO LABORATÓRIO v2.0
// Status de reagentes e equipamentos - CLICÁVEL
// ============================================

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  FlaskConical,
  Beaker,
  AlertTriangle,
  ArrowRight,
  Thermometer,
  Package,
  ChevronRight,
  Plus,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";

export function LabStatusWidget() {
  const navigate = useNavigate();
  
  // Buscar reagentes com estoque baixo
  const { data: reagentsData } = useQuery({
    queryKey: ["reagents-stats"],
    queryFn: async () => {
      const { data: reagents, error } = await supabase
        .from("reagents")
        .select("*");

      if (error) throw error;

      const total = reagents?.length || 0;
      const lowStock =
        reagents?.filter(
          (r) => r.min_quantity && r.quantity && r.quantity <= r.min_quantity
        ).length || 0;
      const expiringSoon =
        reagents?.filter((r) => {
          if (!r.expiry_date) return false;
          const expiryDate = new Date(r.expiry_date);
          const thirtyDaysFromNow = new Date();
          thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
          return expiryDate <= thirtyDaysFromNow;
        }).length || 0;
      const hazardous = reagents?.filter((r) => r.is_hazardous).length || 0;

      return { total, lowStock, expiringSoon, hazardous };
    },
  });

  // Buscar equipamentos
  const { data: equipmentData } = useQuery({
    queryKey: ["equipment-stats"],
    queryFn: async () => {
      const { data: equipment, error } = await supabase
        .from("equipment")
        .select("*");

      if (error) throw error;

      const total = equipment?.length || 0;
      const available =
        equipment?.filter((e) => e.status === "available").length || 0;
      const maintenance =
        equipment?.filter((e) => e.status === "maintenance").length || 0;
      const needsMaintenance =
        equipment?.filter((e) => {
          if (!e.next_maintenance) return false;
          return new Date(e.next_maintenance) <= new Date();
        }).length || 0;

      return { total, available, maintenance, needsMaintenance };
    },
  });

  const hasAlerts =
    (reagentsData?.lowStock || 0) > 0 ||
    (reagentsData?.expiringSoon || 0) > 0 ||
    (equipmentData?.needsMaintenance || 0) > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="glass-card border-border/50 hover:border-primary/30 transition-all">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle 
              className="text-lg flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
              onClick={() => navigate("/laboratorio")}
            >
              <FlaskConical className="h-5 w-5 text-primary" />
              Laboratório
            </CardTitle>
            <Link to="/laboratorio">
              <Button variant="ghost" size="sm" className="text-xs">
                Gerenciar
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Alertas - CLICÁVEIS */}
          {hasAlerts && (
            <div 
              className="flex items-start gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20 cursor-pointer hover:bg-destructive/20 transition-colors"
              onClick={() => navigate("/laboratorio")}
            >
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
              <div className="text-sm text-destructive space-y-1 flex-1">
                {(reagentsData?.lowStock || 0) > 0 && (
                  <div>{reagentsData?.lowStock} reagente(s) com estoque baixo</div>
                )}
                {(reagentsData?.expiringSoon || 0) > 0 && (
                  <div>{reagentsData?.expiringSoon} próximo(s) do vencimento</div>
                )}
                {(equipmentData?.needsMaintenance || 0) > 0 && (
                  <div>
                    {equipmentData?.needsMaintenance} equipamento(s) precisam de
                    manutenção
                  </div>
                )}
              </div>
              <ChevronRight className="h-4 w-4 text-destructive mt-0.5" />
            </div>
          )}

          {/* Reagentes - CLICÁVEIS */}
          <div className="space-y-2">
            <div 
              className="flex items-center gap-2 cursor-pointer hover:text-stats-blue transition-colors"
              onClick={() => navigate("/laboratorio?tab=reagents")}
            >
              <Beaker className="h-4 w-4 text-stats-blue" />
              <span className="text-sm font-medium">Reagentes</span>
              <ChevronRight className="h-3 w-3 text-muted-foreground ml-auto" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div 
                className="text-center p-2 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors group"
                onClick={() => navigate("/laboratorio?tab=reagents")}
              >
                <div className="text-xl font-bold group-hover:text-primary transition-colors">{reagentsData?.total || 0}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div 
                className="text-center p-2 rounded-lg bg-stats-gold/10 cursor-pointer hover:bg-stats-gold/20 transition-colors group"
                onClick={() => navigate("/laboratorio?tab=reagents&filter=low")}
              >
                <div className="text-xl font-bold text-stats-gold">
                  {reagentsData?.lowStock || 0}
                </div>
                <div className="text-xs text-muted-foreground">Baixo</div>
              </div>
              <div 
                className="text-center p-2 rounded-lg bg-destructive/10 cursor-pointer hover:bg-destructive/20 transition-colors group"
                onClick={() => navigate("/laboratorio?tab=reagents&filter=hazardous")}
              >
                <div className="text-xl font-bold text-destructive">
                  {reagentsData?.hazardous || 0}
                </div>
                <div className="text-xs text-muted-foreground">Perigosos</div>
              </div>
            </div>
          </div>

          {/* Equipamentos - CLICÁVEIS */}
          <div className="space-y-2">
            <div 
              className="flex items-center gap-2 cursor-pointer hover:text-stats-purple transition-colors"
              onClick={() => navigate("/laboratorio?tab=equipment")}
            >
              <Thermometer className="h-4 w-4 text-stats-purple" />
              <span className="text-sm font-medium">Equipamentos</span>
              <ChevronRight className="h-3 w-3 text-muted-foreground ml-auto" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div 
                className="text-center p-2 rounded-lg bg-stats-green/10 cursor-pointer hover:bg-stats-green/20 transition-colors group"
                onClick={() => navigate("/laboratorio?tab=equipment&filter=available")}
              >
                <div className="text-xl font-bold text-stats-green">
                  {equipmentData?.available || 0}
                </div>
                <div className="text-xs text-muted-foreground">Disponíveis</div>
              </div>
              <div 
                className="text-center p-2 rounded-lg bg-stats-gold/10 cursor-pointer hover:bg-stats-gold/20 transition-colors group"
                onClick={() => navigate("/laboratorio?tab=equipment&filter=maintenance")}
              >
                <div className="text-xl font-bold text-stats-gold">
                  {equipmentData?.maintenance || 0}
                </div>
                <div className="text-xs text-muted-foreground">Manutenção</div>
              </div>
              <div 
                className="text-center p-2 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors group"
                onClick={() => navigate("/laboratorio?tab=equipment")}
              >
                <div className="text-xl font-bold group-hover:text-primary transition-colors">
                  {equipmentData?.total || 0}
                </div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
            </div>
          </div>

          {/* Status badges - CLICÁVEIS */}
          <div className="flex gap-2 pt-2 flex-wrap">
            <Badge
              variant="outline"
              className="bg-stats-green/10 text-stats-green border-0 cursor-pointer hover:bg-stats-green/20 transition-colors"
              onClick={() => navigate("/laboratorio?tab=equipment&filter=available")}
            >
              <Package className="h-3 w-3 mr-1" />
              {equipmentData?.available || 0} equipamentos prontos
            </Badge>
            {(reagentsData?.expiringSoon || 0) > 0 && (
              <Badge
                variant="outline"
                className="bg-stats-gold/10 text-stats-gold border-0 cursor-pointer hover:bg-stats-gold/20 transition-colors"
                onClick={() => navigate("/laboratorio?tab=reagents&filter=expiring")}
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                {reagentsData?.expiringSoon} vencendo
              </Badge>
            )}
          </div>

          {/* Ação rápida */}
          <div className="pt-2 border-t border-border/50">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full gap-2 text-xs"
              onClick={() => navigate("/laboratorio")}
            >
              <Plus className="h-3 w-3" />
              Adicionar Item
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
