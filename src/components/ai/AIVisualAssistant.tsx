// ============================================
// AI VISUAL ASSISTANT - Assistente Futurista
// Com avatar animado, hologramas e interação
// ============================================

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { 
  Bot, 
  Sparkles, 
  MessageCircle,
  X,
  Send,
  Zap,
  Brain,
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AIVisualAssistantProps {
  context?: {
    pendingTasks?: number;
    profit?: number;
    students?: number;
    pendingPayments?: number;
  };
}

interface Insight {
  id: string;
  type: "success" | "warning" | "info" | "tip";
  title: string;
  message: string;
  action?: () => void;
  actionLabel?: string;
}

// Animated Avatar
function AIAvatar({ isThinking }: { isThinking: boolean }) {
  return (
    <div className="relative w-20 h-20 md:w-24 md:h-24">
      {/* Outer Ring */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-primary/30"
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Middle Ring */}
      <motion.div
        className="absolute inset-2 rounded-full border border-primary/50"
        animate={{ rotate: -360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Pulsing Core */}
      <motion.div
        className="absolute inset-4 rounded-full bg-gradient-to-br from-primary/40 to-primary/20 backdrop-blur-xl"
        animate={{
          scale: isThinking ? [1, 1.1, 1] : 1,
          boxShadow: isThinking 
            ? [
                "0 0 20px rgba(139, 0, 0, 0.3)",
                "0 0 40px rgba(139, 0, 0, 0.6)",
                "0 0 20px rgba(139, 0, 0, 0.3)",
              ]
            : "0 0 20px rgba(139, 0, 0, 0.3)"
        }}
        transition={{ duration: 1, repeat: isThinking ? Infinity : 0 }}
      />
      
      {/* Bot Icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        {isThinking ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="h-8 w-8 text-primary" />
          </motion.div>
        ) : (
          <Bot className="h-8 w-8 text-primary" />
        )}
      </div>
      
      {/* Orbiting Particles */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-primary/60"
          style={{
            top: "50%",
            left: "50%",
          }}
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 4 + i,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <div 
            style={{
              transform: `translateX(${35 + i * 8}px) translateY(-50%)`,
            }}
            className="w-2 h-2 rounded-full bg-primary/60"
          />
        </motion.div>
      ))}
    </div>
  );
}

// Insight Card
function InsightCard({ insight, onDismiss }: { insight: Insight; onDismiss: () => void }) {
  const iconConfig = {
    success: { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10 border-green-500/20" },
    warning: { icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-500/10 border-yellow-500/20" },
    info: { icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20" },
    tip: { icon: Lightbulb, color: "text-purple-500", bg: "bg-purple-500/10 border-purple-500/20" },
  };

  const config = iconConfig[insight.type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -20, scale: 0.9 }}
      className={`p-4 rounded-xl border ${config.bg} backdrop-blur-sm`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${config.bg}`}>
          <Icon className={`h-5 w-5 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground text-sm">{insight.title}</h4>
          <p className="text-xs text-muted-foreground mt-1">{insight.message}</p>
          {insight.action && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={insight.action}
              className="mt-2 h-7 text-xs"
            >
              {insight.actionLabel || "Ver mais"} →
            </Button>
          )}
        </div>
        <button 
          onClick={onDismiss}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

export function AIVisualAssistant({ context }: AIVisualAssistantProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [message, setMessage] = useState("");
  const [insights, setInsights] = useState<Insight[]>([]);
  const [conversation, setConversation] = useState<Array<{ role: string; content: string }>>([]);

  // Generate contextual insights
  useEffect(() => {
    if (!context) return;

    const newInsights: Insight[] = [];

    if (context.pendingTasks && context.pendingTasks > 5) {
      newInsights.push({
        id: "tasks",
        type: "warning",
        title: "Muitas tarefas pendentes",
        message: `Você tem ${context.pendingTasks} tarefas aguardando. Que tal priorizar as mais urgentes?`,
      });
    }

    if (context.profit && context.profit > 0) {
      newInsights.push({
        id: "profit",
        type: "success",
        title: "Performance positiva!",
        message: "Seu lucro está positivo este mês. Continue assim!",
      });
    }

    if (context.pendingPayments && context.pendingPayments > 3) {
      newInsights.push({
        id: "payments",
        type: "warning",
        title: "Pagamentos pendentes",
        message: `${context.pendingPayments} pagamentos precisam de atenção.`,
      });
    }

    // Always add a tip
    newInsights.push({
      id: "tip",
      type: "tip",
      title: "Dica do dia",
      message: "Use o WhatsApp LIVE para gerenciar tarefas e finanças de qualquer lugar!",
    });

    setInsights(newInsights);
  }, [context]);

  const handleSendMessage = async () => {
    if (!message.trim() || isThinking) return;

    const userMessage = message.trim();
    setMessage("");
    setConversation(prev => [...prev, { role: "user", content: userMessage }]);
    setIsThinking(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          message: userMessage,
          context: {
            ...context,
            previousMessages: conversation.slice(-5),
          },
        },
      });

      if (error) throw error;

      setConversation(prev => [...prev, { role: "assistant", content: data.response }]);
    } catch (error) {
      console.error("AI error:", error);
      setConversation(prev => [...prev, { 
        role: "assistant", 
        content: "Desculpe, não consegui processar sua mensagem. Tente novamente." 
      }]);
    } finally {
      setIsThinking(false);
    }
  };

  const dismissInsight = (id: string) => {
    setInsights(prev => prev.filter(i => i.id !== id));
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsExpanded(true)}
        className={`
          fixed bottom-6 right-6 z-50
          p-4 rounded-full
          bg-gradient-to-br from-primary to-primary/80
          shadow-2xl
          ${isExpanded ? 'hidden' : 'flex'}
          items-center justify-center
        `}
        style={{
          boxShadow: "0 0 30px rgba(139, 0, 0, 0.5)",
        }}
      >
        <Sparkles className="h-6 w-6 text-white" />
        
        {/* Notification Badge */}
        {insights.length > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 text-white text-xs font-bold flex items-center justify-center"
          >
            {insights.length}
          </motion.div>
        )}
      </motion.button>

      {/* Expanded Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)]"
          >
            <div className="bg-background/95 backdrop-blur-xl border border-primary/30 rounded-3xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-border/50 bg-gradient-to-r from-primary/10 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AIAvatar isThinking={isThinking} />
                    <div>
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <Brain className="h-4 w-4 text-primary" />
                        Assistente IA
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {isThinking ? "Processando..." : "Synapse v15.0"}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setIsExpanded(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Insights */}
              {insights.length > 0 && (
                <div className="p-4 border-b border-border/50 space-y-3 max-h-48 overflow-y-auto">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Zap className="h-3 w-3 text-primary" />
                    Insights em tempo real
                  </p>
                  <AnimatePresence>
                    {insights.slice(0, 3).map(insight => (
                      <InsightCard 
                        key={insight.id} 
                        insight={insight} 
                        onDismiss={() => dismissInsight(insight.id)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* Chat Area */}
              <ScrollArea className="h-64 p-4">
                {conversation.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Bot className="h-12 w-12 text-primary/30 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Olá! Sou seu assistente de IA. Como posso ajudar?
                    </p>
                    <div className="flex flex-wrap gap-2 mt-4 justify-center">
                      {["Resumo do dia", "Próximas tarefas", "Status financeiro"].map(suggestion => (
                        <Button
                          key={suggestion}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => {
                            setMessage(suggestion);
                            handleSendMessage();
                          }}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {conversation.map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`
                          max-w-[80%] p-3 rounded-2xl text-sm
                          ${msg.role === "user" 
                            ? "bg-primary text-primary-foreground rounded-br-md" 
                            : "bg-muted text-foreground rounded-bl-md"
                          }
                        `}>
                          {msg.content}
                        </div>
                      </motion.div>
                    ))}
                    {isThinking && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                      >
                        <div className="bg-muted rounded-2xl rounded-bl-md p-3 flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          <span className="text-sm text-muted-foreground">Pensando...</span>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </ScrollArea>

              {/* Input */}
              <div className="p-4 border-t border-border/50">
                <div className="flex gap-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Digite sua mensagem..."
                    className="flex-1 bg-muted/50 border-border/50"
                    disabled={isThinking}
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={isThinking || !message.trim()}
                    className="shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}