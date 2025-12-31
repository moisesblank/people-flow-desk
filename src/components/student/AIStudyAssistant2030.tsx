// ============================================
// AI STUDY ASSISTANT 2030 - SANTUÁRIO BETA v10
// Assistente IA flutuante interativo
// Integrado com o sistema TRAMON existente
// ============================================

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  Brain,
  MessageSquare,
  Lightbulb,
  BookOpen,
  HelpCircle,
  Minimize2,
  Maximize2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface QuickAction {
  icon: typeof Brain;
  label: string;
  prompt: string;
  path?: string;
}

export function AIStudyAssistant2030() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const quickActions: QuickAction[] = [
    { icon: Brain, label: 'Explicar conceito', prompt: 'Explique de forma simples:', path: '/alunos/tutoria' },
    { icon: HelpCircle, label: 'Resolver dúvida', prompt: 'Tenho uma dúvida sobre:', path: '/alunos/tutoria' },
    { icon: BookOpen, label: 'Resumir tema', prompt: 'Faça um resumo sobre:', path: '/alunos/materiais' },
    { icon: Lightbulb, label: 'Dica de estudo', prompt: 'Preciso de dicas para estudar:', path: '/alunos/planejamento' },
  ];

  // Auto-scroll para última mensagem
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Mensagem inicial
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: '1',
        role: 'assistant',
        content: '👋 Olá! Sou o TRAMON, seu assistente de estudos com IA. Como posso ajudar você hoje?',
        timestamp: new Date()
      }]);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simular resposta da IA (em produção, usar edge function)
    setTimeout(() => {
      const responses = [
        'Ótima pergunta! Para entender isso melhor, recomendo revisar o material sobre o tema. Quer que eu te leve até a seção de materiais?',
        'Isso é muito comum entre estudantes. A dica é fazer exercícios práticos para fixar o conceito. Posso te mostrar algumas questões?',
        'Entendi! Vou simplificar: pense assim... É como uma receita de bolo - cada ingrediente tem sua função específica.',
        'Excelente dúvida! Isso cai muito no ENEM. Deixa eu te explicar com um exemplo prático...',
      ];

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleQuickAction = (action: QuickAction) => {
    if (action.path) {
      navigate(action.path);
      setIsOpen(false);
    } else {
      setInput(action.prompt + ' ');
    }
  };

  return (
    <>
      {/* Botão Flutuante */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              size="lg"
              onClick={() => setIsOpen(true)}
              className={cn(
                "h-14 w-14 rounded-full shadow-2xl",
                "bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500",
                "hover:shadow-purple-500/50 hover:scale-110 transition-all duration-300"
              )}
            >
              <Bot className="h-6 w-6 text-white" />
              <motion.span
                className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-background"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? 'auto' : '500px'
            }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className={cn(
              "fixed bottom-6 right-6 z-50 w-[380px]",
              "shadow-2xl rounded-2xl overflow-hidden"
            )}
          >
            <Card className="h-full border-2 border-primary/30 bg-background/95 backdrop-blur-xl">
              {/* Header */}
              <CardHeader className="p-4 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-400 rounded-full border-2 border-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base text-white flex items-center gap-2">
                        TRAMON
                        <Badge className="bg-white/20 text-white border-0 text-xs">
                          <Sparkles className="h-3 w-3 mr-1" />
                          IA
                        </Badge>
                      </CardTitle>
                      <p className="text-xs text-white/80">Seu assistente de estudos</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsMinimized(!isMinimized)}
                      className="h-8 w-8 text-white hover:bg-white/20"
                    >
                      {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsOpen(false)}
                      className="h-8 w-8 text-white hover:bg-white/20"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Content */}
              {!isMinimized && (
                <CardContent className="p-0 flex flex-col h-[calc(100%-80px)]">
                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                    <div className="space-y-4">
                      {messages.map((msg) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            "flex",
                            msg.role === 'user' ? 'justify-end' : 'justify-start'
                          )}
                        >
                          <div className={cn(
                            "max-w-[80%] rounded-2xl px-4 py-2",
                            msg.role === 'user' 
                              ? 'bg-primary text-primary-foreground rounded-br-md'
                              : 'bg-muted rounded-bl-md'
                          )}>
                            <p className="text-sm">{msg.content}</p>
                          </div>
                        </motion.div>
                      ))}
                      {isTyping && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex gap-1 p-3 bg-muted rounded-2xl rounded-bl-md w-fit"
                        >
                          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
                          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0.1s]" />
                          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0.2s]" />
                        </motion.div>
                      )}
                    </div>
                  </ScrollArea>

                  {/* Quick Actions */}
                  {messages.length <= 1 && (
                    <div className="p-3 border-t border-border/50">
                      <p className="text-xs text-muted-foreground mb-2">Ações rápidas:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {quickActions.map((action) => (
                          <Button
                            key={action.label}
                            variant="outline"
                            size="sm"
                            className="h-auto py-2 justify-start text-xs gap-2"
                            onClick={() => handleQuickAction(action)}
                          >
                            <action.icon className="h-3 w-3" />
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Input */}
                  <div className="p-3 border-t border-border/50">
                    <div className="flex gap-2">
                      <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Digite sua dúvida..."
                        className="flex-1"
                      />
                      <Button 
                        size="icon" 
                        onClick={handleSend}
                        disabled={!input.trim() || isTyping}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
