// ============================================
// MOISÉS MEDEIROS v10.0 - PERMISSÕES
// Spider-Man Theme - Controle de Acesso RBAC Completo
// Cargos: Owner, Admin, Coordenação, Suporte, Monitoria,
//         Afiliados, Marketing, Contabilidade, Administrativo
// ============================================

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, Users, Crown, User, Search, Loader2, AlertTriangle, Info, History, 
  Clock, ArrowRight, UserCog, Headphones, GraduationCap, Users2, 
  TrendingUp, Calculator, Briefcase 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type AppRole = "owner" | "admin" | "coordenacao" | "suporte" | "monitoria" | "afiliado" | "marketing" | "contabilidade" | "employee";

interface UserWithRole {
  id: string;
  nome: string;
  email: string | null;
  role: AppRole | null;
  avatar_url: string | null;
}

interface AuditLog {
  id: string;
  user_id: string;
  user_email: string | null;
  user_name: string | null;
  changed_by: string;
  changed_by_email: string | null;
  changed_by_name: string | null;
  old_role: string | null;
  new_role: string | null;
  action: string;
  created_at: string;
}

const ROLE_CONFIG: Record<AppRole, { label: string; icon: typeof Crown; color: string; description: string }> = {
  owner: {
    label: "Proprietário",
    icon: Crown,
    color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    description: "Acesso total ao sistema. Pode gerenciar usuários, permissões e todas as configurações.",
  },
  admin: {
    label: "Administrador",
    icon: Shield,
    color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    description: "Acesso administrativo completo, exceto áreas pessoais do owner.",
  },
  coordenacao: {
    label: "Coordenação",
    icon: UserCog,
    color: "text-green-500 bg-green-500/10 border-green-500/20",
    description: "Gerencia equipe, turmas e planejamento de aulas.",
  },
  suporte: {
    label: "Suporte",
    icon: Headphones,
    color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
    description: "Atendimento ao aluno e gestão do portal.",
  },
  monitoria: {
    label: "Monitoria",
    icon: GraduationCap,
    color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
    description: "Acompanhamento de alunos, turmas e simulados.",
  },
  afiliado: {
    label: "Afiliados",
    icon: Users2,
    color: "text-pink-500 bg-pink-500/10 border-pink-500/20",
    description: "Gestão de afiliados e métricas de vendas.",
  },
  marketing: {
    label: "Marketing",
    icon: TrendingUp,
    color: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    description: "Marketing, lançamentos e gestão do site.",
  },
  contabilidade: {
    label: "Contabilidade",
    icon: Calculator,
    color: "text-teal-500 bg-teal-500/10 border-teal-500/20",
    description: "Acesso às finanças da empresa (visualização).",
  },
  employee: {
    label: "Administrativo",
    icon: Briefcase,
    color: "text-gray-500 bg-gray-500/10 border-gray-500/20",
    description: "Acesso básico ao sistema (somente leitura em algumas áreas).",
  },
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function getAvatarGradient(name: string): string {
  const gradients = [
    "from-rose-500 to-pink-600",
    "from-violet-500 to-purple-600",
    "from-blue-500 to-cyan-600",
    "from-emerald-500 to-teal-600",
    "from-amber-500 to-orange-600",
  ];
  const index = name.charCodeAt(0) % gradients.length;
  return gradients[index];
}

function getRoleLabel(role: string | null): string {
  if (!role) return "Sem permissão";
  return ROLE_CONFIG[role as AppRole]?.label || role;
}

function getRoleBadgeClass(role: string | null): string {
  if (!role) return "text-muted-foreground bg-muted/50";
  return ROLE_CONFIG[role as AppRole]?.color || "";
}

export default function Permissoes() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const [search, setSearch] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [activeTab, setActiveTab] = useState("usuarios");

  const fetchAuditLogs = useCallback(async () => {
    setIsLoadingAudit(true);
    try {
      const { data, error } = await supabase
        .from("permission_audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setIsLoadingAudit(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, nome, email, avatar_url")
        .order("nome");

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      const usersWithRoles: UserWithRole[] = (profiles || []).map((profile) => {
        const userRole = roles?.find((r) => r.user_id === profile.id);
        return {
          id: profile.id,
          nome: profile.nome,
          email: profile.email,
          avatar_url: profile.avatar_url,
          role: (userRole?.role as AppRole) || null,
        };
      });

      setUsers(usersWithRoles);

      const currentUserRole = roles?.find((r) => r.user_id === user?.id);
      setIsOwner(currentUserRole?.role === "owner");
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (activeTab === "historico" && isOwner) {
      fetchAuditLogs();
    }
  }, [activeTab, isOwner, fetchAuditLogs]);

  const logPermissionChange = async (
    targetUserId: string,
    targetUser: UserWithRole,
    oldRole: AppRole | null,
    newRole: AppRole | null,
    action: string
  ) => {
    try {
      const currentProfile = users.find((u) => u.id === user?.id);
      
      await supabase.from("permission_audit_logs").insert({
        user_id: targetUserId,
        user_email: targetUser.email,
        user_name: targetUser.nome,
        changed_by: user?.id,
        changed_by_email: currentProfile?.email || user?.email,
        changed_by_name: currentProfile?.nome || "Desconhecido",
        old_role: oldRole,
        new_role: newRole,
        action,
      });
    } catch (error) {
      console.error("Error logging permission change:", error);
    }
  };

  const handleRoleChange = async (userId: string, newRole: AppRole | "none") => {
    setUpdatingUserId(userId);
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    const oldRole = targetUser.role;

    try {
      if (newRole === "none") {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId);

        if (error) throw error;
        
        await logPermissionChange(userId, targetUser, oldRole, null, "role_removed");
        toast.success("Permissão removida com sucesso");
      } else {
        const { error } = await supabase
          .from("user_roles")
          .upsert(
            { user_id: userId, role: newRole },
            { onConflict: "user_id", ignoreDuplicates: false }
          );

        if (error) throw error;
        
        const action = oldRole ? "role_changed" : "role_assigned";
        await logPermissionChange(userId, targetUser, oldRole, newRole, action);
        toast.success("Permissão atualizada com sucesso");
      }

      await fetchUsers();
    } catch (error: any) {
      console.error("Error updating role:", error);
      toast.error("Erro ao atualizar permissão");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const searchLower = search.toLowerCase();
    return (
      u.nome.toLowerCase().includes(searchLower) ||
      (u.email?.toLowerCase().includes(searchLower) ?? false)
    );
  });

  const stats = {
    total: users.length,
    owners: users.filter((u) => u.role === "owner").length,
    admins: users.filter((u) => u.role === "admin").length,
    coordenacao: users.filter((u) => u.role === "coordenacao").length,
    suporte: users.filter((u) => u.role === "suporte").length,
    monitoria: users.filter((u) => u.role === "monitoria").length,
    afiliados: users.filter((u) => u.role === "afiliado").length,
    marketing: users.filter((u) => u.role === "marketing").length,
    contabilidade: users.filter((u) => u.role === "contabilidade").length,
    employees: users.filter((u) => u.role === "employee").length,
    noRole: users.filter((u) => u.role === null).length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 lg:p-12">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Gestão de Permissões
            </h1>
          </div>
          <p className="text-muted-foreground">
            Gerencie os níveis de acesso dos usuários do sistema.
          </p>
        </motion.header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="usuarios" className="gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="historico" className="gap-2" disabled={!isOwner}>
              <History className="h-4 w-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="usuarios" className="space-y-6">
            {/* Info Alert */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Alert className="border-primary/20 bg-primary/5">
                <Info className="h-4 w-4 text-primary" />
                <AlertTitle className="text-primary">Sobre as permissões</AlertTitle>
                <AlertDescription className="text-muted-foreground">
                  Os níveis de acesso controlam o que cada usuário pode ver e fazer no sistema. 
                  Apenas <strong>Proprietários</strong> e <strong>Administradores</strong> podem ver informações 
                  financeiras como salários. Usuários sem permissão verão dados sensíveis mascarados.
                </AlertDescription>
              </Alert>
            </motion.div>

            {/* Role Cards */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="grid gap-4 md:grid-cols-3"
            >
              {(Object.entries(ROLE_CONFIG) as [AppRole, typeof ROLE_CONFIG.owner][]).map(
                ([role, config]) => (
                  <Tooltip key={role}>
                    <TooltipTrigger asChild>
                      <Card className="cursor-help hover:border-primary/30 transition-colors">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div className={`p-2 rounded-lg ${config.color}`}>
                              <config.icon className="h-5 w-5" />
                            </div>
                            <Badge variant="secondary" className="text-lg font-bold">
                              {stats[role === "owner" ? "owners" : role === "admin" ? "admins" : "employees"]}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <CardTitle className="text-lg">{config.label}</CardTitle>
                          <CardDescription className="text-xs mt-1 line-clamp-2">
                            {config.description}
                          </CardDescription>
                        </CardContent>
                      </Card>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p>{config.description}</p>
                    </TooltipContent>
                  </Tooltip>
                )
              )}
            </motion.div>

            {/* Search */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-secondary/30 border-border/50"
                />
              </div>
            </motion.div>

            {/* Users List */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Usuários ({filteredUsers.length})
                  </CardTitle>
                  <CardDescription>
                    Clique no seletor de permissão para alterar o nível de acesso de cada usuário.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {search ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado"}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <AnimatePresence mode="popLayout">
                        {filteredUsers.map((userItem, index) => {
                          const roleConfig = userItem.role ? ROLE_CONFIG[userItem.role] : null;
                          const isCurrentUser = userItem.id === user?.id;
                          const isUserOwner = userItem.role === "owner";

                          return (
                            <motion.div
                              key={userItem.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ delay: index * 0.03 }}
                              className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 border border-border/50 hover:border-border transition-colors"
                            >
                              {/* Avatar */}
                              <Avatar className={`h-12 w-12 shrink-0 bg-gradient-to-br ${getAvatarGradient(userItem.nome)}`}>
                                <AvatarFallback className="text-white font-bold">
                                  {getInitials(userItem.nome)}
                                </AvatarFallback>
                              </Avatar>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-foreground truncate">
                                    {userItem.nome}
                                  </h3>
                                  {isCurrentUser && (
                                    <Badge variant="outline" className="text-xs shrink-0">
                                      Você
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground truncate">
                                  {userItem.email || "Email não informado"}
                                </p>
                              </div>

                              {/* Current Role Badge */}
                              {roleConfig && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge
                                      variant="outline"
                                      className={`shrink-0 ${roleConfig.color} cursor-help`}
                                    >
                                      <roleConfig.icon className="h-3 w-3 mr-1" />
                                      {roleConfig.label}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{roleConfig.description}</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}

                              {/* Role Selector */}
                              <div className="shrink-0">
                                {!isOwner ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="text-sm text-muted-foreground px-3 py-2 rounded-lg bg-secondary/50">
                                        <AlertTriangle className="h-4 w-4" />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Apenas proprietários podem alterar permissões</p>
                                    </TooltipContent>
                                  </Tooltip>
                                ) : isUserOwner ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="text-sm text-muted-foreground px-3 py-2 rounded-lg bg-secondary/50">
                                        Protegido
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>O papel de proprietário não pode ser alterado</p>
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <Select
                                    value={userItem.role || "none"}
                                    onValueChange={(value) =>
                                      handleRoleChange(userItem.id, value as AppRole | "none")
                                    }
                                    disabled={updatingUserId === userItem.id}
                                  >
                                    <SelectTrigger className="w-[140px] bg-background">
                                      {updatingUserId === userItem.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <SelectValue placeholder="Selecionar" />
                                      )}
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">
                                        <span className="text-muted-foreground">Sem permissão</span>
                                      </SelectItem>
                                      <SelectItem value="admin">
                                        <div className="flex items-center gap-2">
                                          <Shield className="h-3 w-3 text-blue-500" />
                                          Administrador
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="employee">
                                        <div className="flex items-center gap-2">
                                          <User className="h-3 w-3 text-emerald-500" />
                                          Funcionário
                                        </div>
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* No Role Warning */}
            {stats.noRole > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Alert variant="destructive" className="border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Atenção</AlertTitle>
                  <AlertDescription>
                    {stats.noRole} usuário{stats.noRole > 1 ? "s" : ""} não possui{stats.noRole > 1 ? "em" : ""} permissão definida. 
                    Usuários sem permissão terão acesso muito limitado ao sistema.
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="historico" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Histórico de Alterações
                </CardTitle>
                <CardDescription>
                  Registro de todas as mudanças de permissões realizadas no sistema.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingAudit ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : auditLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Nenhuma alteração registrada ainda.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {auditLogs.map((log, index) => (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="flex items-start gap-4 p-4 rounded-xl bg-secondary/30 border border-border/50"
                      >
                        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                          <Shield className="h-4 w-4 text-primary" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="font-medium text-foreground">
                              {log.user_name || log.user_email || "Usuário desconhecido"}
                            </span>
                            
                            {log.action === "role_changed" && (
                              <>
                                <Badge variant="outline" className={getRoleBadgeClass(log.old_role)}>
                                  {getRoleLabel(log.old_role)}
                                </Badge>
                                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                <Badge variant="outline" className={getRoleBadgeClass(log.new_role)}>
                                  {getRoleLabel(log.new_role)}
                                </Badge>
                              </>
                            )}
                            
                            {log.action === "role_assigned" && (
                              <>
                                <span className="text-muted-foreground text-sm">recebeu</span>
                                <Badge variant="outline" className={getRoleBadgeClass(log.new_role)}>
                                  {getRoleLabel(log.new_role)}
                                </Badge>
                              </>
                            )}
                            
                            {log.action === "role_removed" && (
                              <>
                                <span className="text-muted-foreground text-sm">perdeu</span>
                                <Badge variant="outline" className={getRoleBadgeClass(log.old_role)}>
                                  {getRoleLabel(log.old_role)}
                                </Badge>
                              </>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              {format(new Date(log.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                            </span>
                            <span>•</span>
                            <span>
                              por {log.changed_by_name || log.changed_by_email || "Sistema"}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
