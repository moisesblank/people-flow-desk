// ============================================
// 🔮 TRAMON - IA PREMIUM EXCLUSIVA
// Acesso: Owner + Admin APENAS
// Modelo: GPT-5 (o mais poderoso)
// ============================================

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Crown,
  X, 
  Send, 
  Sparkles,
  Brain,
  TrendingUp,
  DollarSign,
  Users,
  Target,
  Loader2,
  Copy,
  Check,
  Trash2,
  Lock,
  Zap,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AITramonProps {
  isOpen: boolean;
  onClose: () => void;
}

const quickActions = [
  { icon: TrendingUp, label: "Análise completa do negócio", prompt: "Faça uma análise executiva completa do meu negócio com todos os KPIs, tendências e recomendações estratégicas." },
  { icon: DollarSign, label: "Projeção financeira", prompt: "Crie uma projeção financeira para os próximos 6 meses com cenários otimista, realista e pessimista." },
  { icon: Users, label: "Estratégia de retenção", prompt: "Desenvolva uma estratégia completa para reduzir churn e aumentar retenção de alunos." },
  { icon: Target, label: "Plano de crescimento", prompt: "Crie um plano de crescimento acelerado para os próximos 90 dias com metas e ações específicas." },
];

export function AITramon({ isOpen, onClose }: AITramonProps) {
  const { user } = useAuth();
  const { isOwner, isAdmin, isLoading: roleLoading } = useAdminCheck();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-tramon`;
  const hasAccess = isOwner || isAdmin;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: "welcome",
        type: "assistant",
        content: `🔮 **Olá, ${user?.email?.split('@')[0] || 'Mestre'}!**

Sou **TRAMON**, sua superinteligência empresarial exclusiva powered by **GPT-5**.

Tenho acesso completo aos dados do seu sistema em tempo real e posso:

• 📊 **Análises preditivas** - Antecipo tendências e riscos
• 💰 **Estratégias financeiras** - Modelagem de cenários e projeções
• 🎯 **Planos de ação** - Roadmaps detalhados com métricas
• 🧠 **Insights profundos** - Padrões que humanos não percebem

**Selecione uma ação rápida abaixo ou me pergunte qualquer coisa.**`,
        timestamp: new Date()
      }]);
    }
  }, [isOpen, user, messages.length]);

  const handleSend = useCallback(async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim() || isLoading || !user) return;

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
          messages: messages.filter(m => m.id !== "welcome").concat(userMessage).map(m => ({
            type: m.type,
            content: m.content
          })),
          userId: user.id,
          context: "executive"
        }),
      });

      if (!response.ok || !response.body) {
        if (response.status === 403) {
          toast.error("🔒 Acesso negado. TRAMON é exclusiva para Owner e Admins.");
          setIsLoading(false);
          return;
        }
        if (response.status === 429) {
          toast.error("⏳ Limite de requisições. Aguarde um momento.");
          setIsLoading(false);
          return;
        }
        if (response.status === 402) {
          toast.error("💳 Créditos de IA esgotados.");
          setIsLoading(false);
          return;
        }
        throw new Error("Falha ao conectar com TRAMON");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantContent = "";

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

    } catch (error) {
      console.error("TRAMON error:", error);
      toast.error("Não foi possível conectar ao TRAMON. Tente novamente.");
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }, [messages, input, isLoading, user, CHAT_URL]);

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Copiado!");
  };

  const handleClearChat = () => {
    setMessages([]);
    toast.success("Conversa limpa");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  // Loading state
  if (roleLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </motion.div>
    );
  }

  // Access denied
  if (!hasAccess) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] bg-card border border-border rounded-2xl shadow-2xl z-50 p-8 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-xl font-bold mb-2">Acesso Restrito</h2>
          <p className="text-muted-foreground mb-4">
            TRAMON é exclusiva para <strong>Owner</strong> e <strong>Administradores</strong>.
          </p>
          <Button onClick={onClose} variant="outline" className="w-full">
            Voltar
          </Button>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/90 backdrop-blur-md z-50"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="fixed bottom-4 right-4 w-[500px] h-[700px] bg-gradient-to-b from-card to-card/95 border border-primary/30 rounded-2xl shadow-2xl shadow-primary/20 z-50 flex flex-col overflow-hidden"
        >
          {/* Header Premium */}
          <div className="p-4 border-b border-primary/20 bg-gradient-to-r from-primary/20 via-purple-500/10 to-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div 
                  className="relative"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 4 }}
                >
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-purple-600 shadow-lg shadow-primary/30">
                    <Crown className="h-6 w-6 text-white" />
                  </div>
                  <motion.div 
                    className="absolute -top-1 -right-1"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <Zap className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  </motion.div>
                </motion.div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                      TRAMON
                    </h3>
                    <Badge className="bg-gradient-to-r from-primary to-purple-600 text-white text-[10px] px-1.5">
                      GPT-5
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Superinteligência Exclusiva
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 hover:bg-primary/10"
                  onClick={handleClearChat}
                  title="Limpar conversa"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 hover:bg-primary/10" 
                  onClick={onClose}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          {messages.length <= 1 && (
            <div className="p-3 border-b border-border/50 bg-muted/30">
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Ações Rápidas
              </p>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="h-auto py-2 px-3 text-xs justify-start gap-2 bg-background/50 hover:bg-primary/10 hover:border-primary/30"
                    onClick={() => handleSend(action.prompt)}
                    disabled={isLoading}
                  >
                    <action.icon className="h-4 w-4 text-primary shrink-0" />
                    <span className="truncate">{action.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

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
                  <div className={`max-w-[90%] relative group ${
                    message.type === "user" 
                      ? "bg-gradient-to-r from-primary to-purple-600 text-white rounded-2xl rounded-br-md" 
                      : "bg-secondary/50 border border-border/50 rounded-2xl rounded-bl-md"
                  } p-4`}>
                    {message.type === "assistant" && (
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/30">
                        <Brain className="h-4 w-4 text-primary" />
                        <span className="text-xs font-medium text-primary">TRAMON</span>
                      </div>
                    )}
                    <div className="text-sm whitespace-pre-wrap leading-relaxed prose prose-sm dark:prose-invert max-w-none">
                      {message.content.split('**').map((part, i) => 
                        i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/20">
                      <p className="text-[10px] opacity-50">
                        {message.timestamp.toLocaleTimeString("pt-BR", { 
                          hour: "2-digit", 
                          minute: "2-digit" 
                        })}
                      </p>
                      
                      {message.type === "assistant" && message.content && message.id !== "welcome" && (
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
                  className="flex items-center gap-3"
                >
                  <div className="p-2 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                  <div className="bg-secondary/50 border border-border/50 p-3 rounded-2xl">
                    <span className="text-sm text-muted-foreground">Processando com GPT-5...</span>
                  </div>
                </motion.div>
              )}
            </div>
          </ScrollArea>

          {/* Input Premium */}
          <div className="p-4 border-t border-border/50 bg-gradient-to-t from-muted/50 to-transparent">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pergunte qualquer coisa sobre seu negócio..."
                className="min-h-[50px] max-h-32 resize-none bg-background border-primary/20 focus:border-primary/50"
                disabled={isLoading}
                rows={2}
              />
              <Button 
                onClick={() => handleSend()} 
                disabled={!input.trim() || isLoading}
                size="icon"
                className="h-[50px] w-[50px] bg-gradient-to-br from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 shadow-lg"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
            <p className="text-[10px] text-center text-muted-foreground mt-2 flex items-center justify-center gap-1">
              <Shield className="h-3 w-3" />
              Acesso exclusivo Owner/Admin • GPT-5 • Dados em tempo real
            </p>
          </div>
        </motion.div>
      </>
    </AnimatePresence>
  );
}

// Floating Trigger Button for TRAMON
export function AITramonTrigger({ onClick }: { onClick: () => void }) {
  const { isOwner, isAdmin } = useAdminCheck();
  
  if (!isOwner && !isAdmin) return null;

  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="fixed bottom-24 right-6 p-4 rounded-full bg-gradient-to-br from-primary via-purple-600 to-primary text-white shadow-lg shadow-primary/40 z-40 border border-white/20"
      title="TRAMON - IA Premium (GPT-5)"
    >
      <motion.div
        animate={{ rotate: [0, 360] }}
        transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
      >
        <Crown className="h-6 w-6" />
      </motion.div>
      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center">
        <Zap className="h-2.5 w-2.5 text-yellow-900 fill-yellow-900" />
      </span>
    </motion.button>
  );
}
