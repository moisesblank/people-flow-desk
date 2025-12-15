// ============================================
// MOISÉS MEDEIROS v9.0 - Assistente de IA Avançado
// Chatbot conectado com Lovable AI + dados reais
// ============================================

import { useState, useRef, useEffect, useCallback } from "react";
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
  MessageCircle,
  RefreshCw,
  Mic,
  MicOff,
  Copy,
  Check,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

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
      content: "Olá! 👋 Sou seu assistente de gestão com IA. Tenho acesso aos seus dados reais do sistema. Como posso ajudar?",
      suggestions: contextualSuggestions[context],
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(async (text?: string) => {
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

    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          messages: [...messages.filter(m => m.id !== "welcome"), userMessage].map(m => ({
            type: m.type,
            content: m.content
          })),
          context
        }),
      });

      if (!response.ok || !response.body) {
        if (response.status === 429) {
          toast.error("Limite de requisições excedido. Aguarde um momento.");
          setIsLoading(false);
          return;
        }
        if (response.status === 402) {
          toast.error("Créditos de IA esgotados.");
          setIsLoading(false);
          return;
        }
        throw new Error("Falha ao conectar com o assistente");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantContent = "";

      // Add empty assistant message
      const assistantId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { 
        id: assistantId, 
        type: "assistant", 
        content: "", 
        timestamp: new Date() 
      }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });
        
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                if (updated[lastIdx]?.type === "assistant") {
                  updated[lastIdx] = { 
                    ...updated[lastIdx], 
                    content: assistantContent 
                  };
                }
                return updated;
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Add contextual suggestions after response
      setMessages(prev => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (updated[lastIdx]?.type === "assistant") {
          updated[lastIdx] = {
            ...updated[lastIdx],
            suggestions: getFollowUpSuggestions(assistantContent)
          };
        }
        return updated;
      });

    } catch (error) {
      console.error("AI Assistant error:", error);
      toast.error("Não foi possível conectar ao assistente. Tente novamente.");
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }, [messages, input, isLoading, context, CHAT_URL]);

  const getFollowUpSuggestions = (content: string): string[] => {
    const suggestions: string[] = [];
    
    if (content.toLowerCase().includes("receita") || content.toLowerCase().includes("lucro")) {
      suggestions.push("Detalhar por categoria", "Comparar períodos");
    }
    if (content.toLowerCase().includes("aluno")) {
      suggestions.push("Ver inativos", "Taxa de conclusão");
    }
    if (content.toLowerCase().includes("tarefa") || content.toLowerCase().includes("pendente")) {
      suggestions.push("Priorizar tarefas", "Marcar como feito");
    }
    
    if (suggestions.length === 0) {
      suggestions.push("Mais detalhes", "Próximos passos");
    }
    
    return suggestions.slice(0, 3);
  };

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Copiado!");
  };

  const handleClearChat = () => {
    setMessages([{
      id: "welcome",
      type: "assistant",
      content: "Olá! 👋 Sou seu assistente de gestão com IA. Tenho acesso aos seus dados reais do sistema. Como posso ajudar?",
      suggestions: contextualSuggestions[context],
      timestamp: new Date()
    }]);
    toast.success("Conversa limpa");
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
            className="fixed bottom-4 right-4 w-[420px] h-[650px] bg-card border border-border rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <motion.div 
                      className="p-2 rounded-xl bg-primary/20"
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 4 }}
                    >
                      <Bot className="h-6 w-6 text-primary" />
                    </motion.div>
                    <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-[hsl(var(--stats-green))] border-2 border-card" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Assistente IA</h3>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">Powered by Lovable AI</p>
                      <Badge variant="outline" className="text-[10px] h-4 px-1">
                        {context === "dashboard" && "Dashboard"}
                        {context === "finance" && "Finanças"}
                        {context === "students" && "Alunos"}
                        {context === "marketing" && "Marketing"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={handleClearChat}
                    title="Limpar conversa"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Quick Context Pills */}
            <div className="px-4 py-2 border-b border-border flex gap-2 overflow-x-auto">
              {["dashboard", "finance", "students", "marketing"].map((ctx) => (
                <Badge 
                  key={ctx}
                  variant={context === ctx ? "default" : "outline"}
                  className="cursor-pointer text-xs whitespace-nowrap"
                >
                  {ctx === "dashboard" && <TrendingUp className="h-3 w-3 mr-1" />}
                  {ctx === "finance" && <DollarSign className="h-3 w-3 mr-1" />}
                  {ctx === "students" && <Users className="h-3 w-3 mr-1" />}
                  {ctx === "marketing" && <Lightbulb className="h-3 w-3 mr-1" />}
                  {ctx === "dashboard" && "Geral"}
                  {ctx === "finance" && "Finanças"}
                  {ctx === "students" && "Alunos"}
                  {ctx === "marketing" && "Marketing"}
                </Badge>
              ))}
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
                    <div className={`max-w-[85%] relative group ${
                      message.type === "user" 
                        ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md" 
                        : "bg-secondary/50 rounded-2xl rounded-bl-md"
                    } p-3`}>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {message.suggestions.map((suggestion, i) => (
                            <Button
                              key={i}
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs bg-background/50 hover:bg-background"
                              onClick={() => handleSend(suggestion)}
                              disabled={isLoading}
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-[10px] opacity-50">
                          {message.timestamp.toLocaleTimeString("pt-BR", { 
                            hour: "2-digit", 
                            minute: "2-digit" 
                          })}
                        </p>
                        
                        {message.type === "assistant" && message.content && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleCopy(message.id, message.content)}
                          >
                            {copiedId === message.id ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                      </div>
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
                    <span className="text-sm">Analisando dados...</span>
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
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder="Pergunte sobre finanças, alunos, tarefas..."
                  className="flex-1 bg-background"
                  disabled={isLoading}
                />
                <Button 
                  onClick={() => handleSend()} 
                  disabled={!input.trim() || isLoading}
                  size="icon"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-[10px] text-center text-muted-foreground mt-2">
                🔒 Dados processados com segurança • IA pode cometer erros
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
      <motion.div
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ repeat: Infinity, duration: 3 }}
      >
        <Sparkles className="h-6 w-6" />
      </motion.div>
    </motion.button>
  );
}
