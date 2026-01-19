// ============================================
// 👑 /alunos/dashboardowner — ESPELHO DO OWNER
// Visualização em tempo real do dashboard de um aluno (sem mexer no login)
// ============================================

import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRolePermissions } from "@/hooks/useRolePermissions";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  Database,
  Eye,
  Flame,
  Timer,
  Target,
  Zap,
  RefreshCw,
  User,
} from "lucide-react";

import {
  calcularXpProximoNivel,
  getTituloNivel,
  useStudentDashboardData,
} from "@/hooks/student/useStudentDashboardData";
import { formatError } from "@/lib/utils/formatError";

type MirrorStudent = {
  userId: string;
  nome: string;
  email: string;
  role: string;
};

function useMirrorStudentsList() {
  return useQuery({
    queryKey: ["owner-mirror-students"],
    queryFn: async (): Promise<MirrorStudent[]> => {
      // 1) pega ids por role
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["beta", "aluno_presencial", "beta_expira", "aluno_gratuito"])
        .limit(1000);

      if (rolesError) {
        console.error("[dashboardowner] erro user_roles:", rolesError);
        throw rolesError;
      }

      const userIds = Array.from(new Set((roles ?? []).map((r) => r.user_id)));
      if (userIds.length === 0) return [];

      // 2) pega perfis
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, nome, email")
        .in("id", userIds)
        .limit(1000);

      if (profilesError) {
        console.error("[dashboardowner] erro profiles:", profilesError);
        // não bloquear o espelho por falta de profile
      }

      const profileById = new Map(
        (profiles ?? []).map((p) => [p.id, { nome: p.nome ?? "Aluno", email: p.email ?? "" }])
      );

      return (roles ?? [])
        .map((r) => {
          const p = profileById.get(r.user_id);
          return {
            userId: r.user_id,
            role: r.role,
            nome: p?.nome ?? "Aluno",
            email: p?.email ?? "",
          };
        })
        .sort((a, b) => a.nome.localeCompare(b.nome));
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

function useMirrorRealtimeInvalidation(selectedUserId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!selectedUserId) return;

    console.log("[dashboardowner] realtime subscribe user:", selectedUserId);

    const channel = supabase
      .channel(`owner-mirror-${selectedUserId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_gamification",
          filter: `user_id=eq.${selectedUserId}`,
        },
        (payload) => {
          console.log("[dashboardowner] realtime user_gamification:", payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["student-dashboard-data", selectedUserId] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "lesson_progress",
          filter: `user_id=eq.${selectedUserId}`,
        },
        (payload) => {
          console.log("[dashboardowner] realtime lesson_progress:", payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["student-dashboard-data", selectedUserId] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "question_attempts",
          filter: `user_id=eq.${selectedUserId}`,
        },
        (payload) => {
          console.log("[dashboardowner] realtime question_attempts:", payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["student-dashboard-data", selectedUserId] });
        }
      )
      .subscribe((status) => {
        console.log("[dashboardowner] channel status:", status);
      });

    return () => {
      console.log("[dashboardowner] realtime unsubscribe");
      supabase.removeChannel(channel);
    };
  }, [queryClient, selectedUserId]);
}

export default function AlunoDashboardOwner() {
  const { user, isLoading: authLoading } = useAuth();
  const { isOwner, isLoading: roleLoading } = useRolePermissions();

  const [query, setQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { data: students, isLoading: studentsLoading, error: studentsError } = useMirrorStudentsList();

  useMirrorRealtimeInvalidation(selectedUserId);

  const selectedStudent = useMemo(
    () => (students ?? []).find((s) => s.userId === selectedUserId) ?? null,
    [students, selectedUserId]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students ?? [];
    return (students ?? []).filter((s) => {
      return (
        s.nome.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.role.toLowerCase().includes(q)
      );
    });
  }, [query, students]);

  const {
    data: dashboardData,
    isLoading: dashLoading,
    error: dashError,
  } = useStudentDashboardData(selectedUserId ?? undefined);

  // Gate de loading
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-4 md:p-6 space-y-4">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Gate de auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Owner-only (sem mexer no login): se não é owner, volta pro dashboard padrão
  if (!isOwner) {
    return <Navigate to="/alunos/dashboard" replace />;
  }

  const stats = {
    xpTotal: dashboardData?.xpTotal ?? 0,
    nivel: dashboardData?.nivel ?? 1,
    diasConsecutivos: dashboardData?.diasConsecutivos ?? 0,
    horasEstudadas: dashboardData?.horasEstudadas ?? 0,
    questoesResolvidas: dashboardData?.questoesResolvidas ?? 0,
    taxaAcerto: dashboardData?.taxaAcerto ?? 0,
  };

  const xpProximoNivel = calcularXpProximoNivel(stats.nivel);
  const progresso = xpProximoNivel > 0 ? Math.min(100, (stats.xpTotal / xpProximoNivel) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        {/* HERO */}
        <Card className="border-border/50">
          <CardHeader className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  <Eye className="w-3 h-3 mr-1" />
                  ESPELHO DO OWNER
                </Badge>
                <Badge className="bg-muted text-muted-foreground">
                  <Database className="w-3 h-3 mr-1" />
                  tempo real
                </Badge>
              </div>

              <Button
                variant="outline"
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ["owner-mirror-students"] });
                  if (selectedUserId) {
                    queryClient.invalidateQueries({ queryKey: ["student-dashboard-data", selectedUserId] });
                  }
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            </div>

            <CardTitle className="text-xl md:text-2xl">
              /alunos/dashboardowner — Visão do Aluno (sem logar como ele)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* BUSCA + LISTA */}
            <div className="grid gap-3 md:grid-cols-3">
              <div className="md:col-span-1 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="w-4 h-4" />
                  Selecione um aluno
                </div>
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar por nome, email ou role..."
                />

                <div className="max-h-[360px] overflow-auto rounded-xl border border-border/50">
                  {studentsLoading ? (
                    <div className="p-3 space-y-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                      ))}
                    </div>
                  ) : studentsError ? (
                    <div className="p-4 text-sm text-destructive">
                      Falha ao carregar lista de alunos.
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground">Nenhum aluno encontrado.</div>
                  ) : (
                    <div className="p-1">
                      {filtered.slice(0, 200).map((s) => {
                        const active = s.userId === selectedUserId;
                        return (
                          <button
                            key={`${s.userId}:${s.role}`}
                            onClick={() => setSelectedUserId(s.userId)}
                            className={
                              "w-full text-left rounded-lg p-3 transition-colors " +
                              (active
                                ? "bg-primary/10 border border-primary/20"
                                : "hover:bg-muted")
                            }
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="font-medium truncate">{s.nome}</div>
                                <div className="text-xs text-muted-foreground truncate">{s.email}</div>
                              </div>
                              <Badge className="bg-muted text-muted-foreground border-border/50 shrink-0">
                                {s.role}
                              </Badge>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="text-xs text-muted-foreground">
                  Mostrando até 200 alunos (busca filtra local). Se quiser, eu adiciono paginação.
                </div>
              </div>

              {/* PAINEL DIREITO */}
              <div className="md:col-span-2 space-y-3">
                <Card className="border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Aluno selecionado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!selectedStudent ? (
                      <div className="text-sm text-muted-foreground">
                        Selecione um aluno na lista para iniciar o espelhamento.
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <div className="font-semibold">{selectedStudent.nome}</div>
                        <div className="text-sm text-muted-foreground">{selectedStudent.email}</div>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge className="bg-primary/10 text-primary border-primary/20">
                            {getTituloNivel(stats.nivel).toUpperCase()} • NÍVEL {stats.nivel}
                          </Badge>
                          <Badge className="bg-muted text-muted-foreground border-border/50">
                            {selectedStudent.role}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* KPI GRID */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    {
                      label: "Streak",
                      value: `${stats.diasConsecutivos}d`,
                      Icon: Flame,
                    },
                    {
                      label: "XP",
                      value: stats.xpTotal.toLocaleString(),
                      Icon: Zap,
                    },
                    {
                      label: "Horas",
                      value: `${stats.horasEstudadas}h`,
                      Icon: Timer,
                    },
                    {
                      label: "Acerto",
                      value: `${stats.taxaAcerto}%`,
                      Icon: Target,
                    },
                  ].map(({ label, value, Icon }) => (
                    <Card key={label} className="border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-muted-foreground">{label}</div>
                          <Icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="mt-2 text-2xl font-bold">{value}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* PROGRESS */}
                <Card className="border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Progresso do nível</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Nível {stats.nivel} → {stats.nivel + 1}</span>
                      <span className="font-medium">{stats.xpTotal} / {xpProximoNivel} XP</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${progresso}%` }} />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round(progresso)}% do próximo nível
                    </div>
                  </CardContent>
                </Card>

                {/* ERROS */}
                {selectedUserId && (dashLoading || dashError) && (
                  <Card className="border-border/50">
                    <CardContent className="p-4 text-sm">
                      {dashLoading ? (
                        <div className="text-muted-foreground">Carregando dados do aluno...</div>
                      ) : (
                        <div className="text-destructive">
                          Falha ao carregar dados do aluno: {formatError(dashError)}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
