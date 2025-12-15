// ============================================
// MOISÉS MEDEIROS v8.0 - Assistente de IA Avançado
// Chatbot inteligente para ajuda contextual
// ============================================

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bot, 
  X, 
  Send, 
  Sparkles,
  Lightbulb,
  TrendingUp,
  DollarSign,
  Users,
  BookOpen,
  Loader2,
  MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  suggestions?: string[];
  timestamp: Date;
}

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  context?: "dashboard" | "finance" | "students" | "marketing";
}

const contextualSuggestions: Record<string, string[]> = {
  dashboard: [
    "Como está meu fluxo de caixa?",
    "Quais são as metas da semana?",
    "Mostre um resumo das finanças",
    "Quais tarefas estão pendentes?"
  ],
  finance: [
    "Qual foi meu lucro este mês?",
    "Onde posso economizar?",
    "Previsão para próximo mês",
    "Comparar com mês anterior"
  ],
  students: [
    "Quantos alunos ativos tenho?",
    "Taxa de conclusão do curso",
    "Alunos com baixa atividade",
    "Engajamento médio"
  ],
  marketing: [
    "ROI das campanhas",
    "Custo de aquisição de cliente",
    "Taxa de conversão atual",
    "Melhores canais de vendas"
  ]
};

export function AIAssistant({ isOpen, onClose, context = "dashboard" }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      type: "assistant",
      content: "Olá! 👋 Sou seu assistente de gestão. Como posso ajudar você hoje?",
      suggestions: contextualSuggestions[context],
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simular resposta da IA (em produção, conectar com Lovable AI)
    setTimeout(() => {
      const responses: Record<string, { content: string; suggestions?: string[] }> = {
        "fluxo de caixa": {
          content: "📊 Seu fluxo de caixa este mês está positivo! Entradas: R$ 45.230,00 | Saídas: R$ 32.150,00 | Saldo: +R$ 13.080,00. Isso representa um aumento de 12% em relação ao mês anterior.",
          suggestions: ["Ver detalhamento", "Comparar períodos", "Projeção futura"]
        },
        "lucro": {
          content: "💰 Seu lucro líquido este mês é de R$ 13.080,00 (margem de 28,9%). O maior contribuinte foi o curso de Química Geral com 45% das receitas.",
          suggestions: ["Por produto", "Por período", "Otimizar custos"]
        },
        "alunos": {
          content: "👥 Você tem 234 alunos ativos, com taxa de retenção de 89%. 47 novos alunos este mês (↑15%). Taxa de conclusão: 73%.",
          suggestions: ["Ver inativos", "Engajamento", "Certificados"]
        },
        default: {
          content: "Entendi sua dúvida! Deixe-me analisar os dados para você. Baseado nos seus registros, posso fornecer insights personalizados sobre finanças, alunos ou marketing. O que gostaria de saber especificamente?",
          suggestions: ["Resumo financeiro", "Status dos alunos", "Performance de vendas", "Tarefas pendentes"]
        }
      };

      const key = Object.keys(responses).find(k => 
        messageText.toLowerCase().includes(k)
      ) || "default";

      const response = responses[key];

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: response.content,
        suggestions: response.suggestions,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Assistant Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed bottom-4 right-4 w-[400px] h-[600px] bg-card border border-border rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="p-2 rounded-xl bg-primary/20">
                      <Bot className="h-6 w-6 text-primary" />
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-[hsl(var(--stats-green))] border-2 border-card" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Assistente IA</h3>
                    <p className="text-xs text-muted-foreground">Powered by Lovable AI</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[85%] ${
                      message.type === "user" 
                        ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md" 
                        : "bg-secondary/50 rounded-2xl rounded-bl-md"
                    } p-3`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {message.suggestions.map((suggestion, i) => (
                            <Button
                              key={i}
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs bg-background/50 hover:bg-background"
                              onClick={() => handleSend(suggestion)}
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      )}
                      
                      <p className="text-[10px] opacity-50 mt-2">
                        {message.timestamp.toLocaleTimeString("pt-BR", { 
                          hour: "2-digit", 
                          minute: "2-digit" 
                        })}
                      </p>
                    </div>
                  </motion.div>
                ))}

                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-muted-foreground"
                  >
                    <div className="p-2 rounded-full bg-secondary/50">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                    <span className="text-sm">Analisando...</span>
                  </motion.div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-border bg-muted/30">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Pergunte algo..."
                  className="flex-1 bg-background"
                />
                <Button 
                  onClick={() => handleSend()} 
                  disabled={!input.trim() || isLoading}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[10px] text-center text-muted-foreground mt-2">
                IA pode cometer erros. Verifique informações importantes.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Floating Trigger Button
export function AIAssistantTrigger({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="fixed bottom-6 right-6 p-4 rounded-full bg-gradient-to-br from-primary to-[hsl(var(--stats-purple))] text-white shadow-lg shadow-primary/25 z-40"
    >
      <Sparkles className="h-6 w-6" />
    </motion.button>
  );
}
