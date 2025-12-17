// ============================================
// WIDGET DE GESTÃO DE CARGOS - OWNER ONLY
// Visualização e controle de permissões em tempo real
// ============================================

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Settings,
  LayoutGrid,
  Check,
  X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ROLE_PERMISSIONS, 
  ROLE_LABELS, 
  ROLE_COLORS, 
  ROLE_DESCRIPTIONS,
  type FullAppRole,
  type SystemArea 
} from "@/hooks/useRolePermissions";
import { useAdminCheck } from "@/hooks/useAdminCheck";
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
};

// Labels amigáveis para áreas
const AREA_LABELS: Record<SystemArea, string> = {
  "dashboard": "Dashboard",
  "dashboard-executivo": "Dashboard Executivo",
  "tarefas": "Tarefas",
  "integracoes": "Integrações",
  "calendario": "Calendário",
  "funcionarios": "Funcionários",
  "area-professor": "Área Professor",
  "gestao-equipe": "Gestão de Equipe",
  "marketing": "Marketing",
  "lancamento": "Lançamentos",
  "metricas": "Métricas",
  "arquivos": "Arquivos",
  "planejamento-aula": "Planejamento de Aula",
  "turmas-online": "Turmas Online",
  "turmas-presenciais": "Turmas Presenciais",
  "financas-pessoais": "Finanças Pessoais",
  "financas-empresa": "Finanças Empresa",
  "entradas": "Entradas",
  "pagamentos": "Pagamentos",
  "contabilidade": "Contabilidade",
  "cursos": "Cursos",
  "simulados": "Simulados",
  "afiliados": "Afiliados",
  "alunos": "Alunos",
  "portal-aluno": "Portal do Aluno",
  "gestao-site": "Gestão do Site",
  "relatorios": "Relatórios",
  "guia": "Guia",
  "laboratorio": "Laboratório",
  "site-programador": "Site Programador",
  "pessoal": "Pessoal",
  "vida-pessoal": "Vida Pessoal",
  "permissoes": "Permissões",
  "configuracoes": "Configurações",
  "monitoramento": "Monitoramento",
  "central-whatsapp": "Central WhatsApp",
  "diagnostico-whatsapp": "Diagnóstico WhatsApp",
};

// Todas as áreas disponíveis
const ALL_AREAS: SystemArea[] = Object.keys(AREA_LABELS) as SystemArea[];

// Ordem de exibição dos cargos
const ROLE_ORDER: FullAppRole[] = [
  "owner",
  "admin",
  "coordenacao",
  "suporte",
  "monitoria",
  "marketing",
  "contabilidade",
  "afiliado",
  "employee"
];

// Descrições curtas para o widget
const ROLE_SHORT_DESC: Record<FullAppRole, string> = {
  owner: "TUDO (só você)",
  admin: "Quase tudo (exceto pessoal)",
  coordenacao: "Equipe, turmas, aulas",
  suporte: "Portal aluno, WhatsApp",
  monitoria: "Alunos, turmas, simulados",
  marketing: "Campanhas, site",
  contabilidade: "Finanças empresa (só ver)",
  afiliado: "Suas métricas",
  employee: "Acesso básico",
};

export function RoleManagementWidget() {
  const { isOwner } = useAdminCheck();
  const [expandedRole, setExpandedRole] = useState<FullAppRole | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "matrix">("list");

  // Só mostra para owner
  if (!isOwner) return null;

  const toggleRole = (role: FullAppRole) => {
    setExpandedRole(expandedRole === role ? null : role);
  };

  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-card to-card/50">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
              <Crown className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Gestão de Cargos</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Controle de permissões em tempo real
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-8 px-2"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "matrix" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("matrix")}
              className="h-8 px-2"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {viewMode === "list" ? (
          <RoleListView 
            expandedRole={expandedRole} 
            toggleRole={toggleRole} 
          />
        ) : (
          <RoleMatrixView />
        )}
      </CardContent>
    </Card>
  );
}

// Vista em lista com expansão
function RoleListView({ 
  expandedRole, 
  toggleRole 
}: { 
  expandedRole: FullAppRole | null;
  toggleRole: (role: FullAppRole) => void;
}) {
  return (
    <ScrollArea className="h-[400px]">
      <div className="divide-y divide-border/50">
        {ROLE_ORDER.map((role, index) => {
          const Icon = ROLE_ICONS[role];
          const isExpanded = expandedRole === role;
          const areas = ROLE_PERMISSIONS[role];
          
          return (
            <motion.div
              key={role}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <button
                onClick={() => toggleRole(role)}
                className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-1.5 rounded-lg",
                    role === "owner" 
                      ? "bg-gradient-to-br from-purple-500 to-pink-500" 
                      : "bg-muted"
                  )}>
                    <Icon className={cn(
                      "h-4 w-4",
                      role === "owner" ? "text-white" : "text-muted-foreground"
                    )} />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{ROLE_LABELS[role]}</span>
                      <Badge variant="secondary" className="text-[10px] h-5">
                        {areas.length} áreas
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {ROLE_SHORT_DESC[role]}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {role === "owner" && (
                    <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px]">
                      VOCÊ
                    </Badge>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </button>
              
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 pt-1">
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-3">
                          {ROLE_DESCRIPTIONS[role]}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {areas.map((area) => (
                            <Badge 
                              key={area} 
                              variant="outline" 
                              className="text-[10px] bg-background"
                            >
                              <Check className="h-3 w-3 mr-1 text-green-500" />
                              {AREA_LABELS[area]}
                            </Badge>
                          ))}
                        </div>
                        {role !== "owner" && (
                          <div className="mt-3 pt-3 border-t border-border/50">
                            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                              <Lock className="h-3 w-3 text-destructive" />
                              Áreas bloqueadas:
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {ALL_AREAS.filter(a => !areas.includes(a)).slice(0, 8).map((area) => (
                                <Badge 
                                  key={area} 
                                  variant="outline" 
                                  className="text-[10px] bg-destructive/10 text-destructive border-destructive/30"
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  {AREA_LABELS[area]}
                                </Badge>
                              ))}
                              {ALL_AREAS.filter(a => !areas.includes(a)).length > 8 && (
                                <Badge 
                                  variant="outline" 
                                  className="text-[10px] bg-muted"
                                >
                                  +{ALL_AREAS.filter(a => !areas.includes(a)).length - 8} mais
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
            </motion.div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

// Vista em matriz (tabela)
function RoleMatrixView() {
  // Áreas mais importantes para mostrar na matriz
  const KEY_AREAS: SystemArea[] = [
    "dashboard",
    "financas-empresa",
    "financas-pessoais",
    "funcionarios",
    "cursos",
    "alunos",
    "marketing",
    "permissoes",
    "central-whatsapp",
  ];

  return (
    <ScrollArea className="h-[400px]">
      <div className="p-3">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left py-2 px-1 font-medium text-muted-foreground">
                Cargo
              </th>
              {KEY_AREAS.map((area) => (
                <th 
                  key={area} 
                  className="text-center py-2 px-1 font-medium text-muted-foreground"
                  title={AREA_LABELS[area]}
                >
                  <span className="block truncate max-w-[60px]">
                    {AREA_LABELS[area].split(" ")[0]}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROLE_ORDER.map((role) => {
              const areas = ROLE_PERMISSIONS[role];
              
              return (
                <tr 
                  key={role} 
                  className="border-b border-border/30 hover:bg-muted/30"
                >
                  <td className="py-2 px-1">
                    <div className="flex items-center gap-1.5">
                      {role === "owner" && (
                        <Crown className="h-3 w-3 text-primary" />
                      )}
                      <span className="font-medium truncate max-w-[80px]">
                        {ROLE_LABELS[role].split(" ")[0]}
                      </span>
                    </div>
                  </td>
                  {KEY_AREAS.map((area) => {
                    const hasAccess = areas.includes(area);
                    return (
                      <td key={area} className="text-center py-2 px-1">
                        {hasAccess ? (
                          <div className="flex justify-center">
                            <div className="p-1 rounded bg-green-500/20">
                              <Check className="h-3 w-3 text-green-500" />
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-center">
                            <div className="p-1 rounded bg-destructive/20">
                              <X className="h-3 w-3 text-destructive" />
                            </div>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        
        <p className="text-[10px] text-muted-foreground mt-3 text-center">
          Mostrando 9 de {ALL_AREAS.length} áreas • Clique em "Lista" para ver todas
        </p>
      </div>
    </ScrollArea>
  );
}

export default RoleManagementWidget;
