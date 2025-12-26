import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, AlertTriangle, DollarSign, RefreshCw, Trash2, Eye, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FuturisticPageHeader } from "@/components/ui/futuristic-page-header";
import { VirtualListSimple } from "@/components/performance/VirtualTable";

interface AuditEntry {
  id: string;
  email: string;
  nome: string | null;
  wp_user_id: number | null;
  tipo_discrepancia: string;
  acao_tomada: string | null;
  data_deteccao: string;
  sucesso: boolean;
}

interface WPUser {
  id: string;
  email: string;
  nome: string | null;
  wp_user_id: number;
  tem_pagamento_confirmado: boolean;
  grupos: unknown;
  data_cadastro_wp: string | null;
}

export default function AuditoriaAcessos() {
  const [discrepancias, setDiscrepancias] = useState<WPUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const { toast } = useToast();

  const valorCurso = 199;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Buscar usuários sem pagamento confirmado
      const { data: wpUsers, error: wpError } = await supabase
        .from("usuarios_wordpress_sync")
        .select("*")
        .eq("tem_pagamento_confirmado", false);

      if (wpError) throw wpError;

      // Filtrar usuários no grupo beta
      const usersWithBeta = (wpUsers || []).filter((u) => {
        const grupos = u.grupos as string[] | null;
        return grupos && Array.isArray(grupos) && grupos.includes("beta");
      }) as unknown as WPUser[];

      setDiscrepancias(usersWithBeta);

      // Buscar histórico de auditoria
      const { data: audits, error: auditError } = await supabase
        .from("auditoria_grupo_beta")
        .select("*")
        .order("data_deteccao", { ascending: false })
        .limit(50);

      if (!auditError && audits) {
        setAuditLogs(audits);
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados de auditoria.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const executarAuditoria = async () => {
    setIsAuditing(true);
    try {
      const { data, error } = await supabase.functions.invoke("ia-gateway", {
        body: {
          ia: "tramon",
          action: "executar_auditoria",
          params: {},
        },
      });

      if (error) throw error;

      toast({
        title: "Auditoria Concluída",
        description: `${data?.resultado?.total_discrepancias || 0} discrepâncias encontradas.`,
      });

      fetchData();
    } catch (error) {
      console.error("Erro na auditoria:", error);
      toast({
        title: "Erro",
        description: "Falha ao executar auditoria.",
        variant: "destructive",
      });
    } finally {
      setIsAuditing(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const selectAll = () => {
    if (selectedUsers.size === discrepancias.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(discrepancias.map((d) => d.id)));
    }
  };

  const removerAcessoSelecionados = async () => {
    if (selectedUsers.size === 0) return;

    const usersToRemove = discrepancias.filter((d) => selectedUsers.has(d.id));

    for (const user of usersToRemove) {
      // Registrar na auditoria
      await supabase.from("auditoria_grupo_beta").insert({
        email: user.email,
        nome: user.nome,
        wp_user_id: user.wp_user_id,
        tipo_discrepancia: "acesso_indevido",
        acao_tomada: "removido",
        executado_por: "admin_manual",
      });

      // Chamar IA para remover acesso no WordPress
      await supabase.functions.invoke("ia-gateway", {
        body: {
          ia: "lovable",
          action: "remover_acesso_wp",
          params: { email: user.email, group: "beta" },
        },
      });
    }

    toast({
      title: "Acessos Removidos",
      description: `${selectedUsers.size} usuários tiveram acesso removido.`,
    });

    setSelectedUsers(new Set());
    fetchData();
  };

  const perdaFinanceiraEstimada = discrepancias.length * valorCurso;

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <FuturisticPageHeader
        title="Auditoria de Acessos"
        subtitle="Detecte e remova acessos indevidos ao grupo beta"
        icon={Shield}
      />

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Acessos Indevidos</CardTitle>
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">
                {discrepancias.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Usuários sem pagamento confirmado
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-amber-500/50 bg-amber-500/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Perda Financeira Estimada</CardTitle>
              <DollarSign className="h-5 w-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-500">
                R$ {perdaFinanceiraEstimada.toLocaleString("pt-BR")}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Baseado em R$ {valorCurso}/curso
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Ações</CardTitle>
              <RefreshCw className={`h-5 w-5 ${isAuditing ? "animate-spin" : ""}`} />
            </CardHeader>
            <CardContent>
              <Button
                onClick={executarAuditoria}
                disabled={isAuditing}
                className="w-full"
              >
                {isAuditing ? "Auditando..." : "Auditar Agora"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabela de Discrepâncias */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Discrepâncias Detectadas
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>
                {selectedUsers.size === discrepancias.length ? "Desmarcar Todos" : "Selecionar Todos"}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={removerAcessoSelecionados}
                disabled={selectedUsers.size === 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remover Selecionados ({selectedUsers.size})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : discrepancias.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Check className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p>Nenhuma discrepância encontrada! ✨</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {discrepancias.map((user) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      selectedUsers.has(user.id) ? "bg-destructive/10 border-destructive" : "bg-card"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={selectedUsers.has(user.id)}
                        onCheckedChange={() => toggleUserSelection(user.id)}
                      />
                      <div>
                        <p className="font-medium">{user.nome || "Sem nome"}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">WP ID: {user.wp_user_id}</Badge>
                      <Badge variant="destructive">Sem Pagamento</Badge>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedUsers(new Set([user.id]));
                          removerAcessoSelecionados();
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Auditoria */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Auditoria</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <VirtualListSimple
              items={auditLogs}
              itemHeight={64}
              containerHeight={280}
              emptyMessage="Nenhum log de auditoria encontrado"
              renderItem={(log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    {log.sucesso ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-destructive" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{log.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {log.tipo_discrepancia} - {log.acao_tomada || "Pendente"}
                      </p>
                    </div>
                  </div>
                  <Badge variant={log.sucesso ? "default" : "destructive"}>
                    {new Date(log.data_deteccao).toLocaleDateString("pt-BR")}
                  </Badge>
                </div>
              )}
            />
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
