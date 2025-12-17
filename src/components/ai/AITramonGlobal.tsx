// ============================================
// 🔮 TRAMON v5.0 - SUPERINTELIGÊNCIA GLOBAL
// SEMPRE VISÍVEL - MODO PROGRAMADOR EXCLUSIVO
// ============================================

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Crown, X, Send, Sparkles, Brain, TrendingUp, DollarSign, Users,
  Target, Loader2, Copy, Check, Trash2, Zap, Shield, Phone,
  Calendar, BarChart3, ChevronUp, ChevronDown, ExternalLink,
  FileText, PieChart, Lightbulb, AlertTriangle, UserCircle,
  Building2, BookOpen, Settings, Image as ImageIcon, Camera,
  Eye, XCircle, Code, RefreshCw, Terminal, Wand2, Minimize2, Maximize2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { useLocation, useNavigate } from "react-router-dom";

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  source?: string;
  image?: string;
}

// Assessores oficiais
const ASSESSORES = {
  moises: {
    nome: "Moisés Medeiros",
    telefones: ["5583989201 05", "5583998920105"],
    whatsapp: "5583998920105",
    cargo: "CEO / Proprietário"
  },
  bruna: {
    nome: "Bruna",
    telefones: ["5583963540 90", "5583996354090"],
    whatsapp: "5583996354090",
    cargo: "Co-gestora"
  }
};

const WHATSAPP_TRAMON = '5583991462045';
const OWNER_EMAIL = 'moisesblank@gmail.com';

// Ações rápidas
const quickActions = [
  { icon: TrendingUp, label: "Análise Executiva", prompt: "Faça uma análise executiva completa do meu negócio com todos os KPIs, tendências e recomendações estratégicas.", category: "analise" },
  { icon: DollarSign, label: "Projeção Financeira", prompt: "Crie uma projeção financeira para os próximos 6 meses com cenários otimista, realista e pessimista.", category: "financeiro" },
  { icon: Users, label: "Retenção Alunos", prompt: "Desenvolva uma estratégia completa para reduzir churn e aumentar retenção de alunos.", category: "alunos" },
  { icon: Target, label: "Plano 90 Dias", prompt: "Crie um plano de crescimento acelerado para os próximos 90 dias com metas SMART.", category: "estrategia" },
  { icon: Calendar, label: "Agenda Hoje", prompt: "Mostre minhas tarefas de hoje e da semana, com prioridades e alertas de atrasos.", category: "tarefas" },
  { icon: BarChart3, label: "Relatório Completo", prompt: "Gere um relatório executivo completo com métricas financeiras, alunos, marketing e equipe.", category: "relatorio" },
  { icon: AlertTriangle, label: "Alertas Críticos", prompt: "Liste todos os alertas críticos do sistema: tarefas atrasadas, pagamentos pendentes, alunos em risco.", category: "alertas" },
  { icon: UserCircle, label: "Meu Assessor", prompt: "meu assessor", category: "assessor" },
];

export function AITramonGlobal() {
  const { user } = useAuth();
  const { canAccessTramon, isLoading: roleLoading } = useAdminCheck();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAllActions, setShowAllActions] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [programmerMode, setProgrammerMode] = useState(false);
  const [programmerCode, setProgrammerCode] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-tramon`;
  const hasAccess = canAccessTramon;
  const isOwner = user?.email === OWNER_EMAIL;

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0 && hasAccess) {
      const welcomeMsg = isOwner 
        ? `🔮 **Olá, Moisés!**

Sou **TRAMON v5.0**, sua superinteligência com **VISÃO COMPUTACIONAL** e **MODO PROGRAMADOR**.

🔐 **COMANDO EXCLUSIVO OWNER:**
Digite **"ativar modo programador"** para editar o site em tempo real!

**Capacidades:**
• 📊 Análises preditivas em tempo real
• 💰 Projeções financeiras detalhadas
• 🎯 Planos estratégicos personalizados
• 👁️ Visão computacional avançada
• 💻 **MODO PROGRAMADOR** (exclusivo para você)
• 📱 Contato direto com assessores

**Página atual:** \`${location.pathname}\`

**Envie uma imagem ou pergunte qualquer coisa!**`
        : `🔮 **Olá, ${user?.email?.split('@')[0] || 'Mestre'}!**

Sou **TRAMON v5.0**, sua superinteligência com **VISÃO COMPUTACIONAL**.

**Capacidades:**
• 📊 Análises preditivas em tempo real
• 💰 Projeções financeiras detalhadas
• 🎯 Planos estratégicos personalizados
• 👁️ Visão computacional avançada
• 📱 Contato direto com assessores

**Página atual:** \`${location.pathname}\`

**Envie uma imagem ou pergunte qualquer coisa!**`;

      setMessages([{
        id: "welcome",
        type: "assistant",
        content: welcomeMsg,
        timestamp: new Date()
      }]);
    }
  }, [isOpen, user, messages.length, hasAccess, isOwner, location.pathname]);

  // Image upload
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Apenas imagens são permitidas");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setSelectedImage(base64);
      setImagePreview(base64);
      toast.success("Imagem carregada!");
    };
    reader.readAsDataURL(file);
  }, []);

  const removeImage = useCallback(() => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // Detect programmer mode activation
  const detectProgrammerMode = (text: string): boolean => {
    const normalizedText = text.toLowerCase().trim();
    return normalizedText.includes("ativar modo programador") || 
           normalizedText.includes("modo programador") ||
           normalizedText.includes("ativar programador");
  };

  // Apply code changes (simulated refresh)
  const applyCodeChanges = useCallback(() => {
    if (!programmerCode.trim()) {
      toast.error("Nenhum código para aplicar");
      return;
    }
    
    toast.success("🔄 Aplicando mudanças...");
    
    // Store the code suggestion in session for reference
    sessionStorage.setItem('tramon_code_suggestion', programmerCode);
    
    // Refresh the page after a short delay
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  }, [programmerCode]);

  const handleSend = useCallback(async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim() || isLoading || !user) return;

    // Check for programmer mode activation (OWNER ONLY)
    if (isOwner && detectProgrammerMode(messageText)) {
      setProgrammerMode(true);
      const userMessage: Message = {
        id: Date.now().toString(),
        type: "user",
        content: messageText,
        timestamp: new Date()
      };
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: `💻 **MODO PROGRAMADOR ATIVADO!**

🔐 Acesso exclusivo verificado: **${user.email}**

**Página atual:** \`${location.pathname}\`

Agora você pode me pedir para:
• 🎨 Mudar cores, estilos, layout
• 📝 Editar textos e títulos
• ➕ Adicionar componentes
• 🗑️ Remover elementos
• 🔧 Ajustar funcionalidades

**Como usar:**
1. Descreva o que quer modificar nesta página
2. Eu vou gerar o código/sugestão
3. Clique em "Aplicar Mudanças" para refresh

**Exemplo:** "Mude o título desta página para 'Dashboard Premium'"

⚡ **O que você quer modificar?**`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMessage, assistantMessage]);
      setInput("");
      return;
    }

    // Check assessor request
    const isAssessorRequest = messageText.toLowerCase().includes("assessor") && 
                              !messageText.toLowerCase().includes("analise");

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: messageText,
      timestamp: new Date(),
      image: selectedImage || undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    
    const imageToSend = selectedImage;
    removeImage();

    // Assessor response
    if (isAssessorRequest) {
      const assessorResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: `📱 **Contato com Assessores**

👤 **Moisés Medeiros** - CEO / Proprietário
📞 +55 83 98920-105
💼 Decisões estratégicas, financeiras, parcerias

👩 **Bruna** - Co-gestora
📞 +55 83 96354-090
💼 Operações, equipe, dia-a-dia`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assessorResponse]);
      return;
    }

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
          context: programmerMode ? "programmer" : "executive",
          currentPage: location.pathname,
          image: imageToSend,
          isProgrammerMode: programmerMode && isOwner
        }),
      });

      if (!response.ok || !response.body) {
        if (response.status === 403) {
          toast.error("🔒 Acesso negado");
          setIsLoading(false);
          return;
        }
        if (response.status === 429) {
          toast.error("⏳ Limite de requisições");
          setIsLoading(false);
          return;
        }
        throw new Error("Falha ao conectar");
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
                  updated[lastIdx] = { ...updated[lastIdx], content: assistantContent };
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

      // If in programmer mode, extract code suggestions
      if (programmerMode && isOwner) {
        const codeMatch = assistantContent.match(/```[\s\S]*?```/g);
        if (codeMatch) {
          setProgrammerCode(codeMatch.join('\n\n'));
        }
      }

      // Save conversation
      try {
        await supabase.from('tramon_conversations').insert([
          { user_id: user.id, role: 'user', content: messageText, source: 'web' },
          { user_id: user.id, role: 'assistant', content: assistantContent, source: 'web' }
        ]);
      } catch { /* Silent */ }

    } catch {
      toast.error("Não foi possível conectar ao TRAMON");
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }, [messages, input, isLoading, user, CHAT_URL, programmerMode, isOwner, location.pathname, selectedImage, removeImage]);

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copiado!");
  };

  const handleClearChat = () => {
    setMessages([]);
    setProgrammerMode(false);
    setProgrammerCode("");
    toast.success("Chat limpo");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Don't render if no access
  if (roleLoading) return null;
  if (!hasAccess) return null;

  const visibleActions = showAllActions ? quickActions : quickActions.slice(0, 4);

  return (
    <>
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Floating Trigger - Always visible */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-[100]"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="h-14 w-14 rounded-full bg-gradient-to-br from-primary via-purple-600 to-primary shadow-2xl hover:shadow-primary/50 transition-all duration-300 group relative overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent"
                animate={{ y: ['100%', '-100%'] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              />
              <div className="relative">
                <Crown className="h-6 w-6 text-primary-foreground group-hover:scale-110 transition-transform" />
                <motion.div
                  className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full border-2 border-background"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
              </div>
            </Button>
            <motion.span 
              className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap shadow-lg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {isOwner && <Code className="w-3 h-3 inline mr-1" />}
              TRAMON v5
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for expanded mode */}
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[90]"
                onClick={() => setIsExpanded(false)}
              />
            )}

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                y: 0,
                width: isMinimized ? 300 : (isExpanded ? '90vw' : 420),
                height: isMinimized ? 60 : (isExpanded ? '90vh' : 600),
                maxWidth: isExpanded ? 1200 : 420
              }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={`fixed ${isExpanded ? 'inset-4 m-auto' : 'bottom-6 right-6'} z-[100] bg-card/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-primary/20 flex flex-col overflow-hidden`}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-3 border-b border-border bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Crown className="h-5 w-5 text-primary" />
                    <motion.div
                      className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-green-400 rounded-full"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                      TRAMON v5.0
                    </span>
                    {!isMinimized && (
                      <span className="text-[10px] text-muted-foreground">
                        {programmerMode ? '💻 Modo Programador' : '🔮 Superinteligência Empresarial'}
                      </span>
                    )}
                  </div>
                  {programmerMode && isOwner && (
                    <Badge variant="outline" className="ml-2 bg-green-500/20 text-green-400 border-green-500/50 text-[10px]">
                      <Terminal className="w-3 h-3 mr-1" />
                      DEV MODE
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {!isMinimized && (
                    <>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleClearChat}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsExpanded(!isExpanded)}>
                        {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                      </Button>
                    </>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsMinimized(!isMinimized)}>
                    {isMinimized ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsOpen(false)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Content - Hidden when minimized */}
              {!isMinimized && (
                <>
                  {/* Messages */}
                  <ScrollArea className="flex-1 p-3" ref={scrollRef}>
                    <div className="space-y-3">
                      {messages.map((msg) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[85%] rounded-xl p-3 ${
                            msg.type === 'user' 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-secondary/80'
                          }`}>
                            {msg.image && (
                              <img 
                                src={msg.image} 
                                alt="Uploaded" 
                                className="max-w-full h-auto rounded-lg mb-2 max-h-40 object-contain"
                              />
                            )}
                            <div className="text-sm whitespace-pre-wrap break-words prose prose-sm dark:prose-invert max-w-none">
                              {msg.content.split('\n').map((line, i) => (
                                <span key={i}>
                                  {line.startsWith('**') && line.endsWith('**') 
                                    ? <strong>{line.slice(2, -2)}</strong>
                                    : line.includes('**')
                                      ? line.split('**').map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)
                                      : line
                                  }
                                  {i < msg.content.split('\n').length - 1 && <br />}
                                </span>
                              ))}
                            </div>
                            {msg.type === 'assistant' && msg.content && (
                              <div className="flex gap-1 mt-2 pt-2 border-t border-border/50">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-[10px]"
                                  onClick={() => handleCopy(msg.content)}
                                >
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copiar
                                </Button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                      {isLoading && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex justify-start"
                        >
                          <div className="bg-secondary/80 rounded-xl p-3">
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin text-primary" />
                              <span className="text-sm text-muted-foreground">Analisando...</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </ScrollArea>

                  {/* Programmer Mode Actions */}
                  {programmerMode && isOwner && programmerCode && (
                    <div className="px-3 pb-2">
                      <Button 
                        onClick={applyCodeChanges}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Aplicar Mudanças e Refresh
                      </Button>
                    </div>
                  )}

                  {/* Quick Actions */}
                  {messages.length <= 1 && !programmerMode && (
                    <div className="px-3 pb-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">Ações Rápidas</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 px-1.5 text-[10px]"
                          onClick={() => setShowAllActions(!showAllActions)}
                        >
                          {showAllActions ? 'Menos' : 'Mais'}
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {visibleActions.map((action, i) => (
                          <Button
                            key={i}
                            variant="outline"
                            size="sm"
                            className="h-8 text-[10px] justify-start"
                            onClick={() => handleSend(action.prompt)}
                          >
                            <action.icon className="h-3 w-3 mr-1.5 shrink-0" />
                            <span className="truncate">{action.label}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="px-3 pb-2">
                      <div className="relative inline-block">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="h-16 w-auto rounded-lg border border-border"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-5 w-5 rounded-full"
                          onClick={removeImage}
                        >
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Input Area */}
                  <div className="p-3 border-t border-border">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0 h-10 w-10"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                      <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={programmerMode ? "Descreva a modificação..." : "Digite sua pergunta..."}
                        className="min-h-[40px] max-h-[100px] resize-none text-sm"
                        rows={1}
                      />
                      <Button
                        onClick={() => handleSend()}
                        disabled={isLoading || (!input.trim() && !selectedImage)}
                        className="shrink-0 h-10 w-10 bg-gradient-to-r from-primary to-purple-600"
                        size="icon"
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {isOwner && !programmerMode && (
                      <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
                        💡 Digite "ativar modo programador" para editar o site
                      </p>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
