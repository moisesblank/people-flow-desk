// ============================================
// WIDGET DE GESTÃO DE CARGOS v2.0 - OWNER ONLY
// Visualização premium de permissões em tempo real
// ============================================

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
  Crown, 
  Shield, 
  Users, 
  GraduationCap, 
  HeadphonesIcon, 
  UserCheck, 
  HandCoins, 
  TrendingUp, 
  Calculator,
  ChevronRight,
  Eye,
  Lock,
  Settings,
  LayoutGrid,
  Check,
  X,
  ExternalLink,
  Sparkles,
  Users2,
  Zap,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  ROLE_LABELS, 
  ROLE_DESCRIPTIONS,
  type FullAppRole,
} from "@/hooks/useRolePermissions";
// 🎯 FONTE ÚNICA DE VERDADE - ÁREAS
import { type SystemArea, SYSTEM_AREAS, ROLE_AREA_PERMISSIONS } from "@/core/areas";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

// Ícones para cada cargo
const ROLE_ICONS: Record<FullAppRole, React.ElementType> = {
  owner: Crown,
  admin: Shield,
  coordenacao: Users,
  suporte: HeadphonesIcon,
  monitoria: GraduationCap,
  afiliado: HandCoins,
  marketing: TrendingUp,
  contabilidade: Calculator,
  employee: UserCheck,
  beta: Sparkles,
  aluno_gratuito: Users2,
};

// Cores de gradiente para cada cargo - USANDO TOKENS SEMÂNTICOS
const ROLE_GRADIENTS: Record<FullAppRole, string> = {
  owner: "from-role-owner via-holo-pink to-primary",
  admin: "from-role-admin via-holo-cyan to-role-contabilidade",
  coordenacao: "from-role-coordenacao via-success to-role-contabilidade",
  suporte: "from-role-suporte via-warning to-role-beta",
  monitoria: "from-role-monitoria via-holo-purple to-role-owner",
  afiliado: "from-role-afiliado via-primary to-stats-red",
  marketing: "from-role-marketing via-primary to-stats-wine",
  contabilidade: "from-role-contabilidade via-holo-cyan to-role-admin",
  employee: "from-role-employee via-muted-foreground to-border",
  beta: "from-role-beta via-warning to-role-marketing",
  aluno_gratuito: "from-role-aluno via-muted-foreground to-border",
};

// Cores de fundo suave - USANDO TOKENS SEMÂNTICOS
const ROLE_BG: Record<FullAppRole, string> = {
  owner: "bg-role-owner/10 border-role-owner/30 hover:bg-role-owner/20",
  admin: "bg-role-admin/10 border-role-admin/30 hover:bg-role-admin/20",
  coordenacao: "bg-role-coordenacao/10 border-role-coordenacao/30 hover:bg-role-coordenacao/20",
  suporte: "bg-role-suporte/10 border-role-suporte/30 hover:bg-role-suporte/20",
  monitoria: "bg-role-monitoria/10 border-role-monitoria/30 hover:bg-role-monitoria/20",
  afiliado: "bg-role-afiliado/10 border-role-afiliado/30 hover:bg-role-afiliado/20",
  marketing: "bg-role-marketing/10 border-role-marketing/30 hover:bg-role-marketing/20",
  contabilidade: "bg-role-contabilidade/10 border-role-contabilidade/30 hover:bg-role-contabilidade/20",
  employee: "bg-role-employee/10 border-role-employee/30 hover:bg-role-employee/20",
  beta: "bg-role-beta/10 border-role-beta/30 hover:bg-role-beta/20",
  aluno_gratuito: "bg-role-aluno/10 border-role-aluno/30 hover:bg-role-aluno/20",
};

// Labels amigáveis para áreas principais
const AREA_LABELS: Record<string, string> = {
  "dashboard": "Dashboard",
  "dashboard-executivo": "Dashboard Executivo",
  "financas-empresa": "Finanças Empresa",
  "financas-pessoais": "Finanças Pessoais",
  "funcionarios": "Funcionários",
  "cursos": "Cursos",
  "alunos": "Alunos",
  "marketing": "Marketing",
  "permissoes": "Permissões",
  "central-whatsapp": "WhatsApp",
  "vida-pessoal": "Vida Pessoal",
  "configuracoes": "Configurações",
  "monitoramento": "Monitoramento",
};

// Todas as áreas disponíveis - USANDO FONTE ÚNICA
const ALL_AREAS = SYSTEM_AREAS as unknown as SystemArea[];

// Ordem de exibição dos cargos
const ROLE_ORDER: FullAppRole[] = [
  "owner", "admin", "coordenacao", "suporte", 
  "monitoria", "marketing", "contabilidade", "afiliado", "employee",
  "beta", "aluno_gratuito"
];

// Descrições curtas
const ROLE_SHORT_DESC: Record<FullAppRole, string> = {
  owner: "Acesso total ao sistema",
  admin: "Quase tudo (exceto pessoal)",
  coordenacao: "Equipe, turmas, aulas",
  suporte: "Portal aluno, WhatsApp",
  monitoria: "Alunos, turmas, simulados",
  marketing: "Campanhas, site, métricas",
  contabilidade: "Finanças empresa (leitura)",
  afiliado: "Métricas de afiliados",
  employee: "Acesso básico limitado",
  beta: "Aluno Premium (365 dias)",
  aluno_gratuito: "Apenas área gratuita",
};

export function RoleManagementWidget() {
  const { isOwner } = useAdminCheck();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<FullAppRole | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "matrix">("cards");

  // Buscar contagem de usuários por role
  const { data: roleStats } = useQuery({
    queryKey: ['role-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .limit(5000);
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data?.forEach((item: any) => {
        counts[item.role] = (counts[item.role] || 0) + 1;
      });
      return counts;
    },
    enabled: isOwner,
  });

  // Só mostra para owner
  if (!isOwner) return null;

  const totalUsers = Object.values(roleStats || {}).reduce((a, b) => a + b, 0);

  return (
    <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-card via-card to-card/80">
      {/* Header com gradiente */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-rose-500/20" />
        <CardHeader className="relative pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div 
                className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/25"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <Crown className="h-5 w-5 text-white" />
              </motion.div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  Gestão de Cargos
                  <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px]">
                    OWNER
                  </Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {totalUsers} usuários • {ROLE_ORDER.length} cargos disponíveis
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === "cards" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("cards")}
                    className="h-8 w-8 p-0"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Vista em Cards</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === "matrix" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("matrix")}
                    className="h-8 w-8 p-0"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Vista em Matriz</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardHeader>
      </div>

      <CardContent className="p-0">
        <AnimatePresence mode="wait">
          {viewMode === "cards" ? (
            <motion.div
              key="cards"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <RoleCardsView 
                selectedRole={selectedRole}
                setSelectedRole={setSelectedRole}
                roleStats={roleStats || {}}
              />
            </motion.div>
          ) : (
            <motion.div
              key="matrix"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <RoleMatrixView />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Botão de ação */}
        <div className="p-3 border-t border-border/50 bg-muted/30">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full group"
            onClick={() => navigate('/permissoes')}
          >
            <Users2 className="h-4 w-4 mr-2" />
            Gerenciar Permissões
            <ExternalLink className="h-3 w-3 ml-auto opacity-50 group-hover:opacity-100" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Vista em cards compactos
function RoleCardsView({ 
  selectedRole, 
  setSelectedRole,
  roleStats
}: { 
  selectedRole: FullAppRole | null;
  setSelectedRole: (role: FullAppRole | null) => void;
  roleStats: Record<string, number>;
}) {
  return (
    <div className="p-3">
      <ScrollArea className="h-[320px]">
        <div className="space-y-2">
          {ROLE_ORDER.map((role, index) => {
            const Icon = ROLE_ICONS[role];
            const isSelected = selectedRole === role;
            const areas = ROLE_AREA_PERMISSIONS[role] || [];
            const userCount = roleStats[role] || 0;
            const accessPercent = Math.round((areas.length / ALL_AREAS.length) * 100);
            
            return (
              <motion.div
                key={role}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <button
                  onClick={() => setSelectedRole(isSelected ? null : role)}
                  className={cn(
                    "w-full p-3 rounded-xl border transition-all duration-200 text-left",
                    ROLE_BG[role],
                    isSelected && "ring-2 ring-primary"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Ícone com gradiente */}
                    <div className={cn(
                      "p-2 rounded-lg bg-gradient-to-br shadow-lg",
                      ROLE_GRADIENTS[role]
                    )}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{ROLE_LABELS[role]}</span>
                          {role === "owner" && (
                            <Sparkles className="h-3 w-3 text-yellow-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {userCount > 0 && (
                            <Badge variant="secondary" className="text-[10px] h-5">
                              <Users className="h-3 w-3 mr-1" />
                              {userCount}
                            </Badge>
                          )}
                          <ChevronRight className={cn(
                            "h-4 w-4 text-muted-foreground transition-transform",
                            isSelected && "rotate-90"
                          )} />
                        </div>
                      </div>
                      
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {ROLE_SHORT_DESC[role]}
                      </p>
                      
                      {/* Barra de acesso */}
                      <div className="mt-2 flex items-center gap-2">
                        <Progress 
                          value={accessPercent} 
                          className="h-1.5 flex-1"
                        />
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {areas.length}/{ALL_AREAS.length}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expansão com áreas */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <div className="grid grid-cols-2 gap-1.5">
                            {/* Áreas com acesso */}
                            <div>
                              <p className="text-[10px] font-medium text-green-500 flex items-center gap-1 mb-1.5">
                                <Eye className="h-3 w-3" />
                                Pode acessar ({areas.length})
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {areas.slice(0, 6).map((area) => (
                                  <Badge 
                                    key={area} 
                                    variant="outline" 
                                    className="text-[9px] h-5 bg-green-500/10 border-green-500/30 text-green-600"
                                  >
                                    <Check className="h-2.5 w-2.5 mr-0.5" />
                                    {AREA_LABELS[area] || area}
                                  </Badge>
                                ))}
                                {areas.length > 6 && (
                                  <Badge variant="outline" className="text-[9px] h-5">
                                    +{areas.length - 6}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            {/* Áreas bloqueadas */}
                            {role !== "owner" && (
                              <div>
                                <p className="text-[10px] font-medium text-destructive flex items-center gap-1 mb-1.5">
                                  <Lock className="h-3 w-3" />
                                  Bloqueado ({ALL_AREAS.length - areas.length})
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {ALL_AREAS.filter(a => !areas.includes(a)).slice(0, 4).map((area) => (
                                    <Badge 
                                      key={area} 
                                      variant="outline" 
                                      className="text-[9px] h-5 bg-destructive/10 border-destructive/30 text-destructive"
                                    >
                                      <X className="h-2.5 w-2.5 mr-0.5" />
                                      {AREA_LABELS[area] || area}
                                    </Badge>
                                  ))}
                                  {ALL_AREAS.filter(a => !areas.includes(a)).length > 4 && (
                                    <Badge variant="outline" className="text-[9px] h-5 bg-muted">
                                      +{ALL_AREAS.filter(a => !areas.includes(a)).length - 4}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

// Vista em matriz comparativa
function RoleMatrixView() {
  const KEY_AREAS: SystemArea[] = [
    "dashboard", "financas-empresa", "financas-pessoais", 
    "funcionarios", "cursos", "marketing", "permissoes", "central-whatsapp"
  ];

  return (
    <div className="p-3">
      <ScrollArea className="h-[320px]">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 bg-card z-10 text-left py-2 px-2 font-semibold border-b border-border/50">
                  Cargo
                </th>
                {KEY_AREAS.map((area) => (
                  <th 
                    key={area} 
                    className="text-center py-2 px-1 font-medium text-muted-foreground border-b border-border/50"
                  >
                    <span className="block truncate max-w-[50px] text-[10px]">
                      {AREA_LABELS[area]?.split(" ")[0] || area}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROLE_ORDER.map((role, index) => {
                const Icon = ROLE_ICONS[role];
                const areas = ROLE_AREA_PERMISSIONS[role] || [];
                
                return (
                  <motion.tr 
                    key={role}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-border/30 hover:bg-muted/30"
                  >
                    <td className="sticky left-0 bg-card z-10 py-2 px-2">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "p-1 rounded bg-gradient-to-br",
                          ROLE_GRADIENTS[role]
                        )}>
                          <Icon className="h-3 w-3 text-white" />
                        </div>
                        <span className="font-medium text-[11px] truncate max-w-[70px]">
                          {ROLE_LABELS[role].split(" ")[0]}
                        </span>
                      </div>
                    </td>
                    {KEY_AREAS.map((area) => {
                      const hasAccess = areas.includes(area);
                      return (
                        <td key={area} className="text-center py-2 px-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="flex justify-center cursor-help">
                                {hasAccess ? (
                                  <motion.div 
                                    className="p-1 rounded-full bg-green-500/20"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: index * 0.02 }}
                                  >
                                    <Check className="h-3 w-3 text-green-500" />
                                  </motion.div>
                                ) : (
                                  <div className="p-1 rounded-full bg-destructive/10">
                                    <X className="h-3 w-3 text-destructive/50" />
                                  </div>
                                )}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {hasAccess ? "Tem acesso" : "Sem acesso"} a {AREA_LABELS[area]}
                            </TooltipContent>
                          </Tooltip>
                        </td>
                      );
                    })}
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Legenda */}
        <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-border/50">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <div className="p-1 rounded-full bg-green-500/20">
              <Check className="h-2.5 w-2.5 text-green-500" />
            </div>
            Pode acessar
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <div className="p-1 rounded-full bg-destructive/10">
              <X className="h-2.5 w-2.5 text-destructive/50" />
            </div>
            Bloqueado
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

export default RoleManagementWidget;
