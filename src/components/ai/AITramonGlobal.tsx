// ============================================
// 🔮 TRAMON v6.0 ULTRA - COMPONENTE GLOBAL
// SEMPRE VISÍVEL - ÁUDIO + IMAGEM + CRUD
// ============================================

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Crown, X, Send, Sparkles, Brain, TrendingUp, DollarSign, Users,
  Target, Loader2, Copy, Trash2, Zap, Phone,
  Calendar, BarChart3, ChevronUp, ChevronDown,
  AlertTriangle, UserCircle, Settings, Camera,
  XCircle, Code, RefreshCw, Terminal, Minimize2, Maximize2,
  Mic, MicOff, Image as ImageIcon, Bot, User as UserIcon,
  Receipt, UserPlus, CheckSquare, Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  image?: string;
  tempoProcessamento?: number;
  tipoCrud?: boolean;
}

const OWNER_EMAIL = 'moisesblank@gmail.com';

// Ações rápidas CRUD
const quickActionsCRUD = [
  { icon: Receipt, label: "Registrar Despesa", prompt: "Gastei 50 reais de almoço", category: "despesa", color: "text-red-400" },
  { icon: Wallet, label: "Registrar Receita", prompt: "Recebi 1500 reais de venda do curso", category: "receita", color: "text-green-400" },
  { icon: UserPlus, label: "Cadastrar Aluno", prompt: "Cadastrar aluno João Silva, email joao@email.com", category: "aluno", color: "text-blue-400" },
  { icon: CheckSquare, label: "Criar Tarefa", prompt: "Criar tarefa: Revisar relatório financeiro", category: "tarefa", color: "text-yellow-400" },
];

// Ações rápidas Análise
const quickActionsAnalise = [
  { icon: TrendingUp, label: "Análise Executiva", prompt: "Faça uma análise executiva completa do meu negócio", category: "analise" },
  { icon: DollarSign, label: "Saldo do Mês", prompt: "Saldo do mês", category: "financeiro" },
  { icon: Calendar, label: "Tarefas Hoje", prompt: "Minhas tarefas de hoje", category: "tarefas" },
  { icon: AlertTriangle, label: "Alertas Críticos", prompt: "Liste todos os alertas críticos do sistema", category: "alertas" },
  { icon: UserCircle, label: "Meu Assessor", prompt: "meu assessor", category: "assessor" },
  { icon: BarChart3, label: "Relatório", prompt: "Gere um relatório executivo completo", category: "relatorio" },
];

export function AITramonGlobal() {
  const { user } = useAuth();
  const { canAccessTramon, isLoading: roleLoading } = useAdminCheck();
  const location = useLocation();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [programmerMode, setProgrammerMode] = useState(false);
  const [programmerCode, setProgrammerCode] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [activeTab, setActiveTab] = useState<'crud' | 'analise'>('crud');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-tramon`;
  const hasAccess = canAccessTramon;
  const isOwner = user?.email === OWNER_EMAIL;

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0 && hasAccess) {
      const welcomeMsg = `🔮 **TRAMON v6.0 ULTRA** - Olá, ${user?.email?.split('@')[0] || 'Mestre'}!

**ASSESSOR INTELIGENTE + SUPERINTELIGÊNCIA**

📝 **Comandos Rápidos:**
• "Gastei 50 reais de gasolina" → Registra despesa
• "Recebi 1500 de venda" → Registra receita  
• "Cadastrar aluno João" → Cadastra aluno
• "Criar tarefa: ..." → Cria tarefa
• "Quanto gastei hoje?" → Consulta gastos
• "Saldo do mês" → Mostra saldo

📊 **Análises:**
• Relatórios executivos
• Projeções financeiras
• Alertas críticos

📸 **Envie imagens** de notas fiscais para registro automático!
${isOwner ? '\n💻 **"ativar modo programador"** para editar o site' : ''}

**Use as ações rápidas abaixo ou digite!**`;

      setMessages([{
        id: "welcome",
        type: "assistant",
        content: welcomeMsg,
        timestamp: new Date()
      }]);
    }
  }, [isOpen, user, messages.length, hasAccess, isOwner]);

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

  // Audio recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        toast.info("🎙️ Áudio gravado! Processando...");
        // Por enquanto, áudio será tratado como texto
        // Em produção, enviar para transcrição
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      toast.info("🎙️ Gravando... Clique novamente para parar");
    } catch (error) {
      console.error("Erro ao iniciar gravação:", error);
      toast.error("Erro ao acessar microfone");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  // Detect programmer mode
  const detectProgrammerMode = (text: string): boolean => {
    const normalizedText = text.toLowerCase().trim();
    return normalizedText.includes("ativar modo programador") || 
           normalizedText.includes("modo programador");
  };

  // Apply code changes
  const applyCodeChanges = useCallback(() => {
    if (!programmerCode.trim()) {
      toast.error("Nenhum código para aplicar");
      return;
    }
    toast.success("🔄 Aplicando mudanças...");
    sessionStorage.setItem('tramon_code_suggestion', programmerCode);
    setTimeout(() => window.location.reload(), 1500);
  }, [programmerCode]);

  // Send message
  const handleSend = useCallback(async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim() || isLoading || !user) return;

    // Check programmer mode (OWNER ONLY)
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

🔐 Acesso verificado: **${user.email}**
📍 Página: \`${location.pathname}\`

**Agora você pode:**
• 🎨 Mudar cores, estilos, layout
• 📝 Editar textos e títulos
• ➕ Adicionar componentes
• 🗑️ Remover elementos

**Descreva a modificação desejada!**`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMessage, assistantMessage]);
      setInput("");
      return;
    }

    // Check assessor
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

    if (isAssessorRequest) {
      const assessorResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: `📱 **Contato com Assessores**

👤 **Moisés Medeiros** - CEO
📞 +55 83 98920-105
💼 Decisões estratégicas, financeiras

👩 **Bruna** - Co-gestora
📞 +55 83 96354-090
💼 Operações, equipe`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assessorResponse]);
      return;
    }

    setIsLoading(true);
    const startTime = Date.now();

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

      if (!response.ok) {
        // Check if it's a CRUD response (JSON)
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const data = await response.json();
          if (data.tipo === "crud") {
            const tempoProcessamento = Date.now() - startTime;
            const crudResponse: Message = {
              id: (Date.now() + 1).toString(),
              type: "assistant",
              content: data.resposta,
              timestamp: new Date(),
              tempoProcessamento,
              tipoCrud: true
            };
            setMessages(prev => [...prev, crudResponse]);
            setIsLoading(false);
            return;
          }
          
          if (response.status === 403) {
            toast.error("🔒 Acesso negado");
          } else if (response.status === 429) {
            toast.error("⏳ Limite de requisições");
          }
          setIsLoading(false);
          return;
        }
        throw new Error("Falha ao conectar");
      }

      // Check if CRUD response
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const data = await response.json();
        const tempoProcessamento = Date.now() - startTime;
        const crudResponse: Message = {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          content: data.resposta,
          timestamp: new Date(),
          tempoProcessamento,
          tipoCrud: true
        };
        setMessages(prev => [...prev, crudResponse]);
        toast.success(`✅ Comando executado em ${tempoProcessamento}ms`);
        setIsLoading(false);
        return;
      }

      // Streaming response
      if (!response.body) throw new Error("No response body");

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

      // Extract code if programmer mode
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

    } catch (error) {
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

  if (roleLoading) return null;
  if (!hasAccess) return null;

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Floating Trigger */}
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
              TRAMON v6
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
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
                width: isMinimized ? 320 : (isExpanded ? '90vw' : 440),
                height: isMinimized ? 60 : (isExpanded ? '90vh' : 650),
                maxWidth: isExpanded ? 1200 : 440
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
                      TRAMON v6.0 ULTRA
                    </span>
                    {!isMinimized && (
                      <span className="text-[10px] text-muted-foreground">
                        {programmerMode ? '💻 Modo Programador' : '🔮 Assessor + Superinteligência'}
                      </span>
                    )}
                  </div>
                  {programmerMode && isOwner && (
                    <Badge variant="outline" className="ml-2 bg-green-500/20 text-green-400 border-green-500/50 text-[10px]">
                      <Terminal className="w-3 h-3 mr-1" />
                      DEV
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
                          className={`flex gap-2 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          {msg.type === 'assistant' && (
                            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                              <Bot className="w-4 h-4 text-primary" />
                            </div>
                          )}
                          <div className={`max-w-[85%] rounded-xl p-3 ${
                            msg.type === 'user' 
                              ? 'bg-primary text-primary-foreground' 
                              : msg.tipoCrud 
                                ? 'bg-green-500/20 border border-green-500/30' 
                                : 'bg-secondary/80'
                          }`}>
                            {msg.image && (
                              <img 
                                src={msg.image} 
                                alt="Uploaded" 
                                className="max-w-full h-auto rounded-lg mb-2 max-h-32 object-contain"
                              />
                            )}
                            <div className="text-sm whitespace-pre-wrap break-words">
                              {msg.content.split('\n').map((line, i) => (
                                <span key={i}>
                                  {line.includes('**')
                                    ? line.split('**').map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)
                                    : line
                                  }
                                  {i < msg.content.split('\n').length - 1 && <br />}
                                </span>
                              ))}
                            </div>
                            {msg.tempoProcessamento && (
                              <p className="text-[10px] opacity-60 mt-1">
                                ⚡ {msg.tempoProcessamento}ms
                              </p>
                            )}
                            {msg.type === 'assistant' && msg.content && msg.id !== 'welcome' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 px-2 text-[10px] mt-1"
                                onClick={() => handleCopy(msg.content)}
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copiar
                              </Button>
                            )}
                          </div>
                          {msg.type === 'user' && (
                            <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0">
                              <UserIcon className="w-4 h-4" />
                            </div>
                          )}
                        </motion.div>
                      ))}
                      {isLoading && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-primary" />
                          </div>
                          <div className="bg-secondary/80 rounded-xl p-3">
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin text-primary" />
                              <span className="text-sm text-muted-foreground">Processando...</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </ScrollArea>

                  {/* Programmer Mode Button */}
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
                    <div className="px-3 pb-2 space-y-2">
                      {/* Tabs */}
                      <div className="flex gap-1">
                        <Button
                          variant={activeTab === 'crud' ? 'default' : 'outline'}
                          size="sm"
                          className="h-6 text-[10px] flex-1"
                          onClick={() => setActiveTab('crud')}
                        >
                          📝 Registrar
                        </Button>
                        <Button
                          variant={activeTab === 'analise' ? 'default' : 'outline'}
                          size="sm"
                          className="h-6 text-[10px] flex-1"
                          onClick={() => setActiveTab('analise')}
                        >
                          📊 Análises
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-1.5">
                        {(activeTab === 'crud' ? quickActionsCRUD : quickActionsAnalise).map((action, i) => (
                          <Button
                            key={i}
                            variant="outline"
                            size="sm"
                            className="h-9 text-[10px] justify-start"
                            onClick={() => handleSend(action.prompt)}
                          >
                            <action.icon className={`h-3.5 w-3.5 mr-1.5 shrink-0 ${(action as any).color || ''}`} />
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
                          className="h-14 w-auto rounded-lg border border-border"
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

                  {/* Input */}
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
                      <Button
                        variant={isRecording ? "destructive" : "outline"}
                        size="icon"
                        className="shrink-0 h-10 w-10"
                        onClick={isRecording ? stopRecording : startRecording}
                      >
                        {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </Button>
                      <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={programmerMode ? "Descreva a modificação..." : "Gastei 50 reais de gasolina..."}
                        className="min-h-[40px] max-h-[80px] resize-none text-sm flex-1"
                        rows={1}
                      />
                      <Button
                        onClick={() => handleSend()}
                        disabled={isLoading || (!input.trim() && !selectedImage)}
                        className="shrink-0 h-10 w-10 bg-gradient-to-r from-primary to-purple-600"
                        size="icon"
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </div>
                    {isOwner && !programmerMode && (
                      <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
                        💡 "ativar modo programador" para editar o site
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
