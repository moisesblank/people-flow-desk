// ============================================
// MOISÉS MEDEIROS v10.0 - AI COMMAND CENTER
// Centro de comando das IAs do sistema
// ============================================

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Brain, Zap, Code, MessageSquare, 
  Send, RefreshCw, Sparkles, Terminal
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type IATarget = "manus" | "lovable" | "chatgpt" | "tramon";

interface IAConfig {
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  examples: string[];
}

const iaConfigs: Record<IATarget, IAConfig> = {
  manus: {
    name: "MANUS",
    icon: <Brain className="h-4 w-4" />,
    color: "text-red-500 bg-red-500/10",
    description: "Análise estratégica e relatórios",
    examples: [
      "Gerar relatório de vendas",
      "Analisar churn de alunos",
      "Projeção de receita mensal",
    ],
  },
  lovable: {
    name: "LOVABLE",
    icon: <Code className="h-4 w-4" />,
    color: "text-blue-500 bg-blue-500/10",
    description: "Automação e desenvolvimento",
    examples: [
      "Atualizar grupos de usuários",
      "Processar webhooks pendentes",
      "Verificar status de integrações",
    ],
  },
  chatgpt: {
    name: "CHATGPT",
    icon: <MessageSquare className="h-4 w-4" />,
    color: "text-amber-500 bg-amber-500/10",
    description: "Comunicação e conteúdo",
    examples: [
      "Gerar email de boas-vindas",
      "Criar script de vendas",
      "Responder dúvida de aluno",
    ],
  },
  tramon: {
    name: "TRAMON",
    icon: <Zap className="h-4 w-4" />,
    color: "text-emerald-500 bg-emerald-500/10",
    description: "Execução rápida e orquestração",
    examples: [
      "Executar auditoria beta",
      "Processar fila de webhooks",
      "Sincronizar métricas",
    ],
  },
};

export function AICommandCenter() {
  const [selectedIA, setSelectedIA] = useState<IATarget>("tramon");
  const [command, setCommand] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const { toast } = useToast();

  const executeCommand = async () => {
    if (!command.trim()) return;

    setIsExecuting(true);
    setLastResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("ia-gateway", {
        body: {
          ia: selectedIA,
          action: "comando_manual",
          params: { comando: command },
        },
      });

      if (error) throw error;

      setLastResult(JSON.stringify(data?.resultado || data, null, 2));
      toast({
        title: "✅ Comando executado",
        description: `${iaConfigs[selectedIA].name} processou seu comando.`,
      });
      setCommand("");
    } catch (error) {
      console.error("Erro ao executar comando:", error);
      toast({
        title: "❌ Erro",
        description: "Falha ao executar comando.",
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const selectExample = (example: string) => {
    setCommand(example);
  };

  const currentConfig = iaConfigs[selectedIA];

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-primary" />
            Centro de Comando IA
          </div>
          <Badge variant="outline" className="text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            4 IAs Online
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* IA Selector */}
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(iaConfigs) as IATarget[]).map((ia) => {
            const config = iaConfigs[ia];
            const isSelected = selectedIA === ia;
            return (
              <motion.button
                key={ia}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedIA(ia)}
                className={`
                  flex flex-col items-center gap-1 p-3 rounded-lg border transition-all
                  ${isSelected 
                    ? `${config.color} border-current` 
                    : "bg-muted/50 border-border hover:border-primary/30"
                  }
                `}
              >
                <div className={isSelected ? "" : "text-muted-foreground"}>
                  {config.icon}
                </div>
                <span className="text-xs font-medium">{config.name}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Selected IA Info */}
        <div className={`p-3 rounded-lg ${currentConfig.color}`}>
          <p className="text-sm font-medium">{currentConfig.name}</p>
          <p className="text-xs opacity-80">{currentConfig.description}</p>
        </div>

        {/* Command Input */}
        <div className="flex gap-2">
          <Input
            placeholder={`Comando para ${currentConfig.name}...`}
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && executeCommand()}
            className="flex-1"
          />
          <Button 
            onClick={executeCommand} 
            disabled={isExecuting || !command.trim()}
          >
            {isExecuting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Quick Examples */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Exemplos rápidos:</p>
          <div className="flex flex-wrap gap-2">
            {currentConfig.examples.map((example, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => selectExample(example)}
              >
                {example}
              </Button>
            ))}
          </div>
        </div>

        {/* Last Result */}
        {lastResult && (
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Resultado:</p>
            <pre className="text-xs overflow-auto max-h-32 whitespace-pre-wrap">
              {lastResult}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
