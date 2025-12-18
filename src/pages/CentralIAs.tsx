import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Brain, Code, MessageSquare, Zap, Send, RefreshCw, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FuturisticPageHeader } from "@/components/ui/futuristic-page-header";

interface IACommand {
  id: string;
  ia_destino: string;
  ia_origem: string | null;
  acao: string;
  parametros: unknown;
  status: string;
  resultado: unknown;
  erro: string | null;
  tempo_execucao_ms: number | null;
  created_at: string;
  completed_at: string | null;
}

interface IAStatus {
  name: string;
  icon: React.ReactNode;
  color: string;
  status: "online" | "busy" | "offline" | "error";
  description: string;
  lastActivity: string | null;
  commandsToday: number;
}

const iaConfigs: Record<string, { icon: React.ReactNode; color: string; description: string }> = {
  manus: {
    icon: <Brain className="h-6 w-6" />,
    color: "text-red-500",
    description: "Lobo Frontal - Estratégia e Análise",
  },
  lovable: {
    icon: <Code className="h-6 w-6" />,
    color: "text-blue-500",
    description: "Lobo Parietal - Construção e Automação",
  },
  chatgpt: {
    icon: <MessageSquare className="h-6 w-6" />,
    color: "text-amber-500",
    description: "Lobo Temporal - Linguagem e Comunicação",
  },
  tramon: {
    icon: <Zap className="h-6 w-6" />,
    color: "text-emerald-500",
    description: "Sistema Límbico - Ação Rápida",
  },
};

export default function CentralIAs() {
  const [commands, setCommands] = useState<IACommand[]>([]);
  const [iaStatuses, setIaStatuses] = useState<IAStatus[]>([]);
  const [manualCommand, setManualCommand] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("ia_commands_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comandos_ia_central" },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Buscar comandos recentes
      const { data: commandsData, error: commandsError } = await supabase
        .from("comandos_ia_central")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (!commandsError && commandsData) {
        setCommands(commandsData as unknown as IACommand[]);
        
        // Calcular status das IAs
        const today = new Date().toISOString().split("T")[0];
        const statuses: IAStatus[] = Object.entries(iaConfigs).map(([name, config]) => {
          const iaCommands = commandsData.filter((c) => c.ia_destino === name);
          const todayCommands = iaCommands.filter(
            (c) => c.created_at.startsWith(today)
          );
          const lastCommand = iaCommands[0];
          const hasError = iaCommands.slice(0, 5).some((c) => c.status === "failed");
          const hasPending = iaCommands.some((c) => c.status === "processing");

          let status: "online" | "busy" | "offline" | "error" = "online";
          if (hasError) status = "error";
          else if (hasPending) status = "busy";

          return {
            name,
            icon: config.icon,
            color: config.color,
            status,
            description: config.description,
            lastActivity: lastCommand?.created_at || null,
            commandsToday: todayCommands.length,
          };
        });

        setIaStatuses(statuses);
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const executeManualCommand = async () => {
    if (!manualCommand.trim()) return;

    setIsSending(true);
    try {
      // Parse do comando manual (formato: "IA, comando")
      const parts = manualCommand.split(",");
      let targetIA = "manus";
      let action = manualCommand;

      if (parts.length >= 2) {
        const possibleIA = parts[0].toLowerCase().trim();
        if (["manus", "lovable", "chatgpt", "tramon"].includes(possibleIA)) {
          targetIA = possibleIA;
          action = parts.slice(1).join(",").trim();
        }
      }

      const { data, error } = await supabase.functions.invoke("ia-gateway", {
        body: {
          ia: targetIA,
          action: "comando_manual",
          params: { comando: action },
        },
      });

      if (error) throw error;

      toast({
        title: "Comando Enviado",
        description: `${targetIA.toUpperCase()} está processando seu comando.`,
      });

      setManualCommand("");
      fetchData();
    } catch (error) {
      console.error("Erro ao enviar comando:", error);
      toast({
        title: "Erro",
        description: "Falha ao enviar comando.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "online":
        return <Badge className="bg-green-500">🟢 Online</Badge>;
      case "busy":
        return <Badge className="bg-amber-500">🟡 Ocupada</Badge>;
      case "error":
        return <Badge className="bg-red-500">🔴 Erro</Badge>;
      default:
        return <Badge className="bg-gray-500">⚫ Offline</Badge>;
    }
  };

  const getCommandStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "border-green-500/30 bg-green-500/5";
      case "failed":
        return "border-red-500/30 bg-red-500/5";
      case "processing":
        return "border-amber-500/30 bg-amber-500/5";
      default:
        return "border-blue-500/30 bg-blue-500/5";
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <FuturisticPageHeader
        title="Central de Orquestração das IAs"
        subtitle="Coordene e monitore as 4 inteligências artificiais do ecossistema"
        icon={Bot}
      />

      {/* IA Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {iaStatuses.map((ia) => (
          <motion.div
            key={ia.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card className={`border-2 ${ia.status === "error" ? "border-red-500/50" : "border-transparent"}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className={`${ia.color}`}>{ia.icon}</div>
                  {getStatusBadge(ia.status)}
                </div>
                <CardTitle className="text-lg">{ia.name.toUpperCase()}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">{ia.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <span>Hoje: {ia.commandsToday} comandos</span>
                  {ia.lastActivity && (
                    <span className="text-muted-foreground">
                      {new Date(ia.lastActivity).toLocaleTimeString("pt-BR")}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Manual Command */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Comando Manual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder='Ex: "MANUS, gere o relatório de churn de Novembro"'
              value={manualCommand}
              onChange={(e) => setManualCommand(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && executeManualCommand()}
              className="flex-1"
            />
            <Button onClick={executeManualCommand} disabled={isSending}>
              {isSending ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Executar
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Formato: "IA, comando" - IAs disponíveis: MANUS, LOVABLE, CHATGPT, TRAMON
          </p>
        </CardContent>
      </Card>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Feed de Atividades das IAs
            </CardTitle>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="manus">MANUS</TabsTrigger>
              <TabsTrigger value="lovable">LOVABLE</TabsTrigger>
              <TabsTrigger value="chatgpt">CHATGPT</TabsTrigger>
              <TabsTrigger value="tramon">TRAMON</TabsTrigger>
            </TabsList>

            {["all", "manus", "lovable", "chatgpt", "tramon"].map((tab) => (
              <TabsContent key={tab} value={tab}>
                <ScrollArea className="h-[400px]">
                  <AnimatePresence mode="popLayout">
                    {commands
                      .filter((c) => tab === "all" || c.ia_destino === tab)
                      .map((command, index) => {
                        const iaConfig = iaConfigs[command.ia_destino];
                        return (
                          <motion.div
                            key={command.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: index * 0.02 }}
                            className={`p-4 mb-2 rounded-lg border ${getCommandStatusColor(command.status)}`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <div className={iaConfig?.color}>{iaConfig?.icon}</div>
                                <div>
                                  <p className="font-medium">
                                    [{command.ia_destino.toUpperCase()}] {command.acao}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {command.ia_origem && `Origem: ${command.ia_origem} | `}
                                    {command.tempo_execucao_ms && `${command.tempo_execucao_ms}ms`}
                                  </p>
                                  {command.erro && (
                                    <p className="text-sm text-red-500 mt-1">Erro: {command.erro}</p>
                                  )}
                                  {command.resultado && (
                                    <details className="mt-2">
                                      <summary className="text-sm text-muted-foreground cursor-pointer">
                                        Ver resultado
                                      </summary>
                                      <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto max-h-32">
                                        {JSON.stringify(command.resultado, null, 2)}
                                      </pre>
                                    </details>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge
                                  variant={
                                    command.status === "completed"
                                      ? "default"
                                      : command.status === "failed"
                                      ? "destructive"
                                      : "secondary"
                                  }
                                >
                                  {command.status}
                                </Badge>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(command.created_at).toLocaleString("pt-BR")}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                  </AnimatePresence>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
