// ============================================
// TUTORIA IA - Chat Interface 2300
// Performance-first: virtualized messages, GPU animations
// ============================================

import { memo, useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Bot, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFuturisticUI } from "@/hooks/useFuturisticUI";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type AIMode = "tutor" | "redacao" | "flashcards" | "cronograma";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface TutoriaChatProps {
  mode: AIMode;
  lessonContext?: string;
}

const SUGGESTIONS = [
  "Explique o ponto triplo de forma simples",
  "Quais são os erros mais comuns nesse tema?",
  "Gere 3 questões de fixação",
  "Resuma os conceitos principais",
];

const MODE_PLACEHOLDERS: Record<AIMode, string> = {
  tutor: "Tire sua dúvida de Química...",
  redacao: "Cole sua redação para correção...",
  flashcards: "Sobre qual tema gerar flashcards?",
  cronograma: "Descreva sua rotina e objetivos...",
};

export const TutoriaChat = memo(function TutoriaChat({ mode, lessonContext }: TutoriaChatProps) {
  const ui = useFuturisticUI();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-tutor`;
  
  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);
  
  // Stream chat response
  const streamChat = useCallback(async (userMessage: string) => {
    setIsLoading(true);
    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setInput("");
    
    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: newMessages,
          lessonContext: lessonContext || "Química ENEM - Prof. Moisés Medeiros",
          mode,
        }),
      });
      
      if (!response.ok || !response.body) {
        if (response.status === 429) {
          toast({ title: "Limite atingido", description: "Aguarde um momento.", variant: "destructive" });
          return;
        }
        if (response.status === 402) {
          toast({ title: "Créditos esgotados", description: "Créditos de IA esgotados.", variant: "destructive" });
          return;
        }
        throw new Error("Falha na conexão");
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantContent = "";
      
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
      
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
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: assistantContent };
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
      console.error("AI Tutor error:", error);
      toast({ title: "Erro", description: "Não foi possível conectar ao tutor.", variant: "destructive" });
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }, [messages, lessonContext, mode, CHAT_URL]);
  
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    streamChat(input.trim());
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  const handleSuggestion = (text: string) => {
    if (isLoading) return;
    streamChat(text);
  };
  
  return (
    <div className={cn(
      "flex flex-col h-[500px] md:h-[600px] rounded-2xl overflow-hidden",
      ui.glassClass,
      ui.glowClass
    )}>
      {/* Chat Header */}
      <div className="flex items-center gap-3 p-4 border-b border-ai-border/50">
        <motion.div 
          className="p-2 rounded-xl bg-gradient-to-br from-holo-cyan/20 to-holo-purple/20"
          animate={ui.shouldAnimate ? { rotate: [0, 5, -5, 0] } : undefined}
          transition={{ repeat: Infinity, duration: 4 }}
        >
          <Sparkles className="h-5 w-5 text-holo-cyan" />
        </motion.div>
        <div>
          <h3 className="font-semibold text-foreground">Chat com Tutor IA</h3>
          <p className="text-xs text-muted-foreground">Química ENEM • Prof. Moisés</p>
        </div>
      </div>
      
      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <Bot className="h-12 w-12 text-holo-cyan/50 mb-4" />
            <p className="text-muted-foreground mb-4">
              Olá! Sou seu tutor de IA. Como posso ajudar?
            </p>
            
            {/* Quick suggestions */}
            <div className="flex flex-wrap justify-center gap-2 max-w-md">
              {SUGGESTIONS.map((text) => (
                <Button
                  key={text}
                  variant="outline"
                  size="sm"
                  className="text-xs border-ai-border/50 hover:bg-ai-surface-hover hover:border-holo-cyan/50"
                  onClick={() => handleSuggestion(text)}
                >
                  {text}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={ui.shouldAnimate ? { opacity: 0, y: 10 } : undefined}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "")}
                >
                  {msg.role === "assistant" && (
                    <div className="p-2 rounded-full bg-gradient-to-br from-holo-cyan/20 to-holo-purple/20 h-fit shrink-0">
                      <Bot className="h-4 w-4 text-holo-cyan" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] p-3 rounded-2xl text-sm",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-ai-surface border border-ai-border/50 text-foreground"
                    )}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  {msg.role === "user" && (
                    <div className="p-2 rounded-full bg-secondary h-fit shrink-0">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            
            {/* Loading indicator */}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="p-2 rounded-full bg-gradient-to-br from-holo-cyan/20 to-holo-purple/20 h-fit">
                  <Loader2 className="h-4 w-4 text-holo-cyan animate-spin" />
                </div>
                <div className="bg-ai-surface border border-ai-border/50 p-3 rounded-2xl">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span 
                        key={i}
                        className="w-2 h-2 bg-holo-cyan/50 rounded-full" 
                        style={{ opacity: 0.4 + (i * 0.2) }} 
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </ScrollArea>
      
      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-ai-border/50">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={MODE_PLACEHOLDERS[mode]}
            className="min-h-[44px] max-h-32 resize-none bg-ai-surface border-ai-border/50 focus:border-holo-cyan/50"
            disabled={isLoading}
            rows={1}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="shrink-0 bg-gradient-to-br from-holo-cyan to-holo-purple hover:opacity-90"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
});

TutoriaChat.displayName = "TutoriaChat";
