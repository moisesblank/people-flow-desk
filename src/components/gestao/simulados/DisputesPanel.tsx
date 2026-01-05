/**
 * 🎯 PAINEL DE CONTESTAÇÕES — Constituição SYNAPSE Ω v10.0
 * 
 * FASE 3: Interface admin para visualizar e responder disputas.
 * Workflow: pending → analyzing → resolved/rejected
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  Gavel, MessageSquare, Clock, CheckCircle2, XCircle,
  AlertTriangle, FileQuestion, User, Search, Filter,
  Eye, Send, Loader2, RefreshCw, ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Dispute {
  id: string;
  user_id: string;
  simulado_id: string | null;
  attempt_id: string | null;
  dispute_type: string;
  description: string;
  evidence: Record<string, unknown> | null;
  status: string;
  resolution: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  // Joined data
  user_name?: string;
  user_email?: string;
  simulado_title?: string;
}

const STATUS_CONFIG = {
  pending: {
    label: "Pendente",
    color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
    icon: Clock,
  },
  under_review: {
    label: "Em Análise",
    color: "bg-blue-500/10 text-blue-500 border-blue-500/30",
    icon: Eye,
  },
  resolved: {
    label: "Resolvida",
    color: "bg-green-500/10 text-green-500 border-green-500/30",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejeitada",
    color: "bg-red-500/10 text-red-500 border-red-500/30",
    icon: XCircle,
  },
};

const TYPE_CONFIG = {
  score_error: { label: "Erro na Pontuação", icon: AlertTriangle },
  invalidation_appeal: { label: "Apelação de Invalidação", icon: Gavel },
  technical_issue: { label: "Problema Técnico", icon: FileQuestion },
};

function useDisputes(statusFilter: string) {
  return useQuery({
    queryKey: ["admin-disputes", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("simulado_ranking_disputes")
        .select(`
          *,
          profiles!simulado_ranking_disputes_user_id_fkey(full_name, email),
          simulados!simulado_ranking_disputes_simulado_id_fkey(title)
        `)
        .order("created_at", { ascending: false });

      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error("[Disputes] Erro:", error);
        throw error;
      }

      // Transform data
      return (data || []).map((d: Record<string, unknown>) => ({
        ...d,
        user_name: (d.profiles as Record<string, unknown>)?.full_name || "N/A",
        user_email: (d.profiles as Record<string, unknown>)?.email || "N/A",
        simulado_title: (d.simulados as Record<string, unknown>)?.title || "N/A",
      })) as Dispute[];
    },
    staleTime: 30_000,
  });
}

function useUpdateDispute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      disputeId,
      status,
      resolution,
    }: {
      disputeId: string;
      status: string;
      resolution?: string;
    }) => {
      const updateData: Record<string, unknown> = {
        status,
      };

      if (status === "resolved" || status === "rejected") {
        updateData.resolution = resolution || null;
        updateData.resolved_at = new Date().toISOString();
        updateData.resolved_by = (await supabase.auth.getUser()).data.user?.id;
      }

      const { error } = await supabase
        .from("simulado_ranking_disputes")
        .update(updateData)
        .eq("id", disputeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-disputes"] });
      toast.success("Contestação atualizada!");
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
}

interface DisputeDetailModalProps {
  dispute: Dispute | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canRespond?: boolean;
}

function DisputeDetailModal({ dispute, open, onOpenChange, canRespond = true }: DisputeDetailModalProps) {
  const [resolution, setResolution] = useState("");
  const [newStatus, setNewStatus] = useState<string>("");
  const updateDispute = useUpdateDispute();

  if (!dispute) return null;

  const statusConfig = STATUS_CONFIG[dispute.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
  const typeConfig = TYPE_CONFIG[dispute.dispute_type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.technical_issue;
  const StatusIcon = statusConfig.icon;
  const TypeIcon = typeConfig.icon;

  const handleSubmit = () => {
    if (!newStatus) {
      toast.error("Selecione um novo status");
      return;
    }

    if ((newStatus === "resolved" || newStatus === "rejected") && !resolution.trim()) {
      toast.error("Forneça uma resolução para finalizar a contestação");
      return;
    }

    updateDispute.mutate(
      { disputeId: dispute.id, status: newStatus, resolution },
      {
        onSuccess: () => {
          onOpenChange(false);
          setResolution("");
          setNewStatus("");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5 text-primary" />
            Análise de Contestação
          </DialogTitle>
          <DialogDescription>
            Revise os detalhes e responda à contestação do aluno.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6 py-4">
            {/* Status atual */}
            <div className="flex items-center justify-between">
              <Badge className={cn("gap-1", statusConfig.color)}>
                <StatusIcon className="h-3 w-3" />
                {statusConfig.label}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(dispute.created_at), { 
                  addSuffix: true, 
                  locale: ptBR 
                })}
              </span>
            </div>

            <Separator />

            {/* Informações do aluno */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-muted-foreground">Aluno</Label>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{dispute.user_name}</span>
                </div>
                <p className="text-sm text-muted-foreground">{dispute.user_email}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">Simulado</Label>
                <p className="font-medium">{dispute.simulado_title}</p>
              </div>
            </div>

            <Separator />

            {/* Tipo e descrição */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TypeIcon className="h-4 w-4 text-muted-foreground" />
                <Label>Tipo: {typeConfig.label}</Label>
              </div>
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <p className="text-sm">{dispute.description}</p>
                </CardContent>
              </Card>
            </div>

            {/* Evidências */}
            {dispute.evidence && Object.keys(dispute.evidence).length > 0 && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">Evidências</Label>
                <Card className="bg-muted/30">
                  <CardContent className="p-4">
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(dispute.evidence, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Resolução anterior */}
            {dispute.resolution && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">Resolução Anterior</Label>
                <Card className="bg-green-500/10 border-green-500/30">
                  <CardContent className="p-4">
                    <p className="text-sm">{dispute.resolution}</p>
                    {dispute.resolved_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Resolvida em {format(new Date(dispute.resolved_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            <Separator />

            {/* Ação - 🔒 Só exibe se tiver permissão de responder */}
            {canRespond && dispute.status !== "resolved" && dispute.status !== "rejected" && (
              <div className="space-y-4">
                <Label className="font-medium">Responder Contestação</Label>
                
                <div className="space-y-2">
                  <Label>Novo Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="under_review">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4 text-blue-500" />
                          Em Análise
                        </div>
                      </SelectItem>
                      <SelectItem value="resolved">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          Resolver (Deferido)
                        </div>
                      </SelectItem>
                      <SelectItem value="rejected">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-500" />
                          Rejeitar (Indeferido)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(newStatus === "resolved" || newStatus === "rejected") && (
                  <div className="space-y-2">
                    <Label>Resolução/Justificativa *</Label>
                    <Textarea
                      placeholder="Explique a decisão tomada..."
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      rows={4}
                    />
                  </div>
                )}
              </div>
            )}
            
            {/* Mensagem se não tiver permissão */}
            {!canRespond && dispute.status !== "resolved" && dispute.status !== "rejected" && (
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">
                  Você não tem permissão para responder contestações.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Apenas Owner e Admin podem responder.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          {/* 🔒 Só exibe botão se tiver permissão */}
          {canRespond && dispute.status !== "resolved" && dispute.status !== "rejected" && (
            <Button onClick={handleSubmit} disabled={updateDispute.isPending || !newStatus}>
              {updateDispute.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Atualizar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DisputesPanelProps {
  canRespond?: boolean;
}

export function DisputesPanel({ canRespond = true }: DisputesPanelProps) {
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data: disputes, isLoading, refetch } = useDisputes(statusFilter);

  // Filtrar por busca
  const filteredDisputes = (disputes || []).filter((d) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      d.user_name?.toLowerCase().includes(term) ||
      d.user_email?.toLowerCase().includes(term) ||
      d.simulado_title?.toLowerCase().includes(term) ||
      d.description.toLowerCase().includes(term)
    );
  });

  // Estatísticas
  const stats = {
    pending: disputes?.filter((d) => d.status === "pending").length || 0,
    under_review: disputes?.filter((d) => d.status === "under_review").length || 0,
    resolved: disputes?.filter((d) => d.status === "resolved").length || 0,
    rejected: disputes?.filter((d) => d.status === "rejected").length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header com stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Gavel className="h-5 w-5 text-primary" />
                Contestações de Alunos
              </CardTitle>
              <CardDescription>
                Gerencie e responda às contestações de resultados.
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => refetch()} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Stats cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { key: "pending", label: "Pendentes", color: "text-yellow-500 bg-yellow-500/10" },
              { key: "under_review", label: "Em Análise", color: "text-blue-500 bg-blue-500/10" },
              { key: "resolved", label: "Resolvidas", color: "text-green-500 bg-green-500/10" },
              { key: "rejected", label: "Rejeitadas", color: "text-red-500 bg-red-500/10" },
            ].map((stat) => (
              <Card
                key={stat.key}
                className={cn(
                  "cursor-pointer transition-all border-2",
                  statusFilter === stat.key ? "border-primary" : "border-transparent hover:border-border"
                )}
                onClick={() => setStatusFilter(stat.key)}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", stat.color)}>
                    {(() => {
                      const config = STATUS_CONFIG[stat.key as keyof typeof STATUS_CONFIG];
                      if (config?.icon) {
                        const IconComponent = config.icon;
                        return <IconComponent className="h-4 w-4" />;
                      }
                      return null;
                    })()}
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats[stat.key as keyof typeof stats]}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filtros */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por aluno, email ou simulado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="under_review">Em Análise</SelectItem>
                <SelectItem value="resolved">Resolvidas</SelectItem>
                <SelectItem value="rejected">Rejeitadas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabela */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredDisputes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Gavel className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma contestação encontrada.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Simulado</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="w-[100px]">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDisputes.map((dispute) => {
                  const statusConfig = STATUS_CONFIG[dispute.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
                  const typeConfig = TYPE_CONFIG[dispute.dispute_type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.technical_issue;
                  const StatusIcon = statusConfig.icon;

                  return (
                    <TableRow key={dispute.id}>
                      <TableCell>
                        <Badge className={cn("gap-1", statusConfig.color)}>
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{dispute.user_name}</p>
                          <p className="text-xs text-muted-foreground">{dispute.user_email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {dispute.simulado_title}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{typeConfig.label}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(dispute.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedDispute(dispute);
                            setDetailOpen(true);
                          }}
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de detalhe */}
      <DisputeDetailModal
        dispute={selectedDispute}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        canRespond={canRespond}
      />
    </div>
  );
}
