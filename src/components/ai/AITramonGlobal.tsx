// ============================================
// 🌟 TRAMON v8.0 OMEGA ULTRA - UI REVOLUCIONÁRIA
// INTEGRAÇÃO TOTAL: Hotmart + YouTube + Instagram + WhatsApp
// GLASSMORPHISM + ANIMAÇÕES + QUICK INSIGHTS
// ============================================

import React, { useState, useRef, useEffect, useCallback, forwardRef } from "react";
import { useFileUploadWorker } from "@/hooks/useWebWorker";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Crown, X, Send, Sparkles, Brain, TrendingUp, DollarSign, Users,
  Target, Loader2, Copy, Trash2, Zap, 
  Calendar, BarChart3, ChevronUp, ChevronDown,
  AlertTriangle, Settings, Camera,
  XCircle, Code, RefreshCw, Minimize2, Maximize2,
  Mic, MicOff, Image as ImageIcon, Bot, User as UserIcon,
  Receipt, UserPlus, CheckSquare, Wallet, MessageCircle,
  Activity, PieChart, FileText, Clock, Star, ArrowRight,
  Eye, EyeOff, Lightbulb, Rocket, Shield, Youtube, Instagram,
  Handshake, Phone, Building
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useInvalidateCache } from "@/hooks/useDataCache";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";

/**
 * @deprecated P1-2: OWNER_EMAIL mantido apenas como fallback UX.
 * Verificação primária é via role === 'owner'.
 */
const OWNER_EMAIL = 'moisesblank@gmail.com';

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  image?: string;
  tempoProcessamento?: number;
  tipoCrud?: boolean;
}

interface QuickInsight {
  icon: React.ElementType;
  label: string;
  value: string;
  trend?: 'up' | 'down' | 'neutral';
  color: string;
}

// OWNER_EMAIL já definido acima (linha 37)

// ========================================
// 🎯 AÇÕES RÁPIDAS v3.0
// ========================================
const quickActions = {
  crud: [
    { icon: Receipt, label: "💸 Despesa", prompt: "Gastei 50 reais de ", color: "from-red-500/20 to-red-600/20 border-red-500/30" },
    { icon: Wallet, label: "💰 Receita", prompt: "Recebi reais de ", color: "from-green-500/20 to-green-600/20 border-green-500/30" },
    { icon: UserPlus, label: "👤 Aluno", prompt: "Cadastrar aluno ", color: "from-blue-500/20 to-blue-600/20 border-blue-500/30" },
    { icon: CheckSquare, label: "📋 Tarefa", prompt: "Criar tarefa: ", color: "from-yellow-500/20 to-yellow-600/20 border-yellow-500/30" },
  ],
  cadastros: [
    { icon: Building, label: "👔 Funcionário", prompt: "Cadastrar funcionário ", color: "from-indigo-500/20 to-indigo-600/20 border-indigo-500/30" },
    { icon: Handshake, label: "🤝 Afiliado", prompt: "Cadastrar afiliado ", color: "from-pink-500/20 to-pink-600/20 border-pink-500/30" },
  ],
  analise: [
    { icon: TrendingUp, label: "📊 Análise", prompt: "Faça uma análise executiva completa", color: "from-purple-500/20 to-purple-600/20 border-purple-500/30" },
    { icon: DollarSign, label: "💵 Saldo", prompt: "Qual o saldo do mês?", color: "from-emerald-500/20 to-emerald-600/20 border-emerald-500/30" },
    { icon: Calendar, label: "📅 Hoje", prompt: "Minhas tarefas de hoje", color: "from-cyan-500/20 to-cyan-600/20 border-cyan-500/30" },
    { icon: AlertTriangle, label: "🚨 Alertas", prompt: "Liste todos os alertas críticos", color: "from-orange-500/20 to-orange-600/20 border-orange-500/30" },
  ],
  integracoes: [
    { icon: Youtube, label: "📺 YouTube", prompt: "Métricas do YouTube", color: "from-red-600/20 to-red-700/20 border-red-600/30" },
    { icon: Instagram, label: "📸 Instagram", prompt: "Métricas do Instagram", color: "from-pink-600/20 to-purple-600/20 border-pink-600/30" },
    { icon: Phone, label: "📱 WhatsApp", prompt: "Métricas do WhatsApp", color: "from-green-600/20 to-green-700/20 border-green-600/30" },
    { icon: Zap, label: "🔥 Hotmart", prompt: "Métricas do Hotmart", color: "from-orange-600/20 to-orange-700/20 border-orange-600/30" },
  ]
};

export const AITramonGlobal = forwardRef<HTMLDivElement, Record<string, never>>(function AITramonGlobal(_props, ref) {
  const { user, role } = useAuth();
  const { canAccessTramon, isLoading: roleLoading, isOwner: ownerCheck, isAdmin } = useAdminCheck();
  const location = useLocation();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [programmerMode, setProgrammerMode] = useState(false);
  const [programmerCode, setProgrammerCode] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [quickInsights, setQuickInsights] = useState<QuickInsight[]>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // 🏛️ LEI I - Web Worker para Base64
  const { convertFileToBase64: workerFileToBase64 } = useFileUploadWorker();

  // Speech-to-text (Web Speech API)
  // Tipagem via `any` para compatibilidade entre browsers (webkitSpeechRecognition)
  const speechRecognitionRef = useRef<any>(null);
  const speechTranscriptRef = useRef<string>("");

  const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-tramon`;
  
  // 🎯 REGRA: TRAMON só aparece para Owner/Admin na área /gestaofc
  const isInGestaoArea = location.pathname.startsWith('/gestaofc');
  const isOwnerOrAdmin = ownerCheck || isAdmin;
  const hasAccess = isOwnerOrAdmin && isInGestaoArea;
  
  // P1-2 FIX: Role-first, email como fallback UX
  const isOwner = role === 'owner' || user?.email?.toLowerCase() === OWNER_EMAIL.toLowerCase();
  const { invalidateAll } = useInvalidateCache();

  // ========================================
  // 📊 CARREGAR QUICK INSIGHTS
  // ========================================
  useEffect(() => {
    if (!isOpen || !hasAccess) return;
    
    const loadInsights = async () => {
      try {
        const hoje = new Date();
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();
        
        const [entradasRes, gastosRes, tarefasRes] = await Promise.all([
          supabase.from('entradas').select('valor').gte('data', inicioMes),
          supabase.from('gastos').select('valor').gte('data', inicioMes),
          supabase.from('calendar_tasks').select('id, is_completed').eq('task_date', hoje.toISOString().split('T')[0])
        ]);
        
        const receita = (entradasRes.data || []).reduce((s, e) => s + (e.valor || 0), 0);
        const despesas = (gastosRes.data || []).reduce((s, g) => s + (g.valor || 0), 0);
        const saldo = receita - despesas;
        const tarefasPendentes = (tarefasRes.data || []).filter(t => !t.is_completed).length;
        
        setQuickInsights([
          { icon: Wallet, label: "Saldo", value: `R$ ${saldo.toLocaleString('pt-BR')}`, trend: saldo >= 0 ? 'up' : 'down', color: saldo >= 0 ? 'text-green-400' : 'text-red-400' },
          { icon: TrendingUp, label: "Receita", value: `R$ ${receita.toLocaleString('pt-BR')}`, trend: 'up', color: 'text-emerald-400' },
          { icon: CheckSquare, label: "Tarefas", value: `${tarefasPendentes} pendentes`, trend: tarefasPendentes > 3 ? 'down' : 'neutral', color: tarefasPendentes > 3 ? 'text-yellow-400' : 'text-blue-400' },
        ]);
      } catch (error) {
        console.error('Erro ao carregar insights:', error);
      }
    };
    
    loadInsights();
  }, [isOpen, hasAccess]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0 && hasAccess) {
      const hora = new Date().getHours();
      const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
      
      const welcomeMsg = `🌟 **${saudacao}, ${user?.email?.split('@')[0] || 'Mestre'}!**

Sou **TRAMON v8.0 OMEGA ULTRA** - sua superinteligência empresarial com integração total.

**💬 Comandos naturais:**
• "Gastei 80 de gasolina" → Registra despesa
• "Recebi 2000 do curso" → Registra receita
• "Cadastrar aluno/funcionário/afiliado" → Cadastra
• "Quanto gastei hoje/mês?" → Consulta

**🔗 Integrações:**
• "Métricas YouTube" → Inscritos, views
• "Métricas Instagram" → Seguidores, engajamento
• "Métricas WhatsApp" → Conversas, leads
• "Métricas Hotmart" → Vendas, comissões

**📸 Envie imagens** para análise automática!
${isOwner ? '\n🔐 **"ativar modo programador"** para editar o site' : ''}

**Use os botões abaixo!**`;

      setMessages([{
        id: "welcome",
        type: "assistant",
        content: welcomeMsg,
        timestamp: new Date()
      }]);
    }
  }, [isOpen, user, messages.length, hasAccess, isOwner]);

  // ========================================
  // 📤 HANDLERS
  // ========================================
  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    // 🏛️ LEI I - Web Worker para Base64 (UI fluida durante upload 5MB)
    try {
      const base64Raw = await workerFileToBase64(file);
      const mimeType = file.type || 'image/jpeg';
      const base64 = `data:${mimeType};base64,${base64Raw}`;
      setSelectedImage(base64);
      setImagePreview(base64);
      toast.success("📸 Imagem carregada!");
    } catch (err) {
      toast.error("Erro ao processar imagem");
      console.error('[AITramonGlobal] File processing error:', err);
    }
  }, [workerFileToBase64]);

  const removeImage = useCallback(() => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // Audio recording (speech-to-text)
  const toggleRecording = useCallback(async () => {
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      toast.error("Seu navegador não suporta ditado por voz");
      return;
    }

    if (isRecording) {
      try {
        speechRecognitionRef.current?.stop();
      } finally {
        setIsRecording(false);
        toast.info("🎙️ Ditado finalizado — revise o texto e clique em enviar");
      }
      return;
    }

    try {
      speechTranscriptRef.current = "";
      const recognition = new SpeechRecognitionCtor();
      recognition.lang = "pt-BR";
      recognition.interimResults = true;
      recognition.continuous = true;

      recognition.onresult = (event: any) => {
        let finalText = "";
        let interimText = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const text = result?.[0]?.transcript ?? "";
          if (result.isFinal) finalText += text;
          else interimText += text;
        }
        const merged = `${speechTranscriptRef.current} ${finalText}`.trim();
        speechTranscriptRef.current = merged;
        setInput(`${merged}${interimText ? " " + interimText.trim() : ""}`.trim());
      };

      recognition.onerror = (e: any) => {
        console.error("SpeechRecognition error", e);
        toast.error("Erro no ditado por voz");
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
      toast.info("🎙️ Ditado por voz ativado — fale agora");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao iniciar o ditado");
    }
  }, [isRecording]);

  // Detect programmer mode
  const detectProgrammerMode = (text: string): boolean => {
    const lower = text.toLowerCase().trim();
    return lower.includes("ativar modo programador") || lower.includes("modo programador") || lower.includes("programmer mode");
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
    const messageText = text ?? input;
    if (((!messageText || !messageText.trim()) && !selectedImage) || isLoading || !user) return;

    // Check programmer mode (OWNER ONLY)
    if (isOwner && detectProgrammerMode(messageText)) {
      setProgrammerMode(true);
      setShowQuickActions(false);
      
      setMessages(prev => [...prev, 
        { id: Date.now().toString(), type: "user", content: messageText, timestamp: new Date() },
        { 
          id: (Date.now() + 1).toString(), 
          type: "assistant", 
          content: `💻 **MODO PROGRAMADOR ATIVADO!**\n\n🔐 **Verificado:** ${user.email}\n📍 **Página:** \`${location.pathname}\`\n\n**Capacidades:**\n• 🎨 Alterar estilos e cores\n• 📝 Modificar textos\n• ➕ Adicionar componentes\n• 🗑️ Remover elementos\n\n**Descreva a modificação desejada!**`,
          timestamp: new Date()
        }
      ]);
      setInput("");
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: (messageText && messageText.trim()) ? messageText : (selectedImage ? "📎 Imagem enviada para análise" : ""),
      timestamp: new Date(),
      image: selectedImage || undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setShowQuickActions(false);
    
    const imageToSend = selectedImage;
    removeImage();

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

      const contentType = response.headers.get('content-type');
      
      // Handle CRUD response (JSON)
      if (contentType?.includes('application/json')) {
        const data = await response.json();
        
        if (data.error) {
          if (response.status === 403) toast.error("🔒 Acesso negado");
          else if (response.status === 429) toast.error("⏳ Limite de requisições");
          else toast.error(data.error);
          setIsLoading(false);
          return;
        }
        
        if (data.tipo === "crud" || data.resposta) {
          const tempoProcessamento = Date.now() - startTime;
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            type: "assistant",
            content: data.resposta,
            timestamp: new Date(),
            tempoProcessamento,
            tipoCrud: true
          }]);
          
          if (data.sucesso) {
            invalidateAll();
            toast.success(`✅ Executado em ${tempoProcessamento}ms`);
          }
          setIsLoading(false);
          return;
        }
      }

      if (!response.ok) throw new Error("Falha na conexão");
      if (!response.body) throw new Error("Sem resposta");

      // Streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantContent = "";

      const assistantId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: assistantId, type: "assistant", content: "", timestamp: new Date() }]);

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

    } catch (error) {
      toast.error("❌ Erro ao conectar");
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }, [messages, input, isLoading, user, CHAT_URL, programmerMode, isOwner, location.pathname, selectedImage, removeImage]);

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("📋 Copiado!");
  };

  const handleClearChat = () => {
    setMessages([]);
    setProgrammerMode(false);
    setProgrammerCode("");
    setShowQuickActions(true);
    toast.success("🗑️ Chat limpo");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  // 🎯 CONSTITUIÇÃO P0: TRAMON só visível para Owner/Admin em /gestaofc
  // NÃO mostrar o botão se não tem acesso - seguir regra estrita
  if (roleLoading) return null;
  if (!hasAccess) return null; // ← FIX: Ocultar completamente se não for Owner/Admin em /gestaofc

  // ========================================
  // 🎨 RENDER - BUILD 2024.12.17.v9
  // ========================================
  return (
    <div ref={ref}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Floating Trigger Button - CENTRALIZADO INFERIOR COM CINZA BRILHANTE */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-[100]"
          >
            <motion.button
              onClick={() => {
                if (!hasAccess) {
                  toast.info("Faça login para acessar o TRAMON", {
                    description: "A I.A. está disponível após autenticação"
                  });
                  return;
                }
                setIsOpen(true);
              }}
              className="relative h-16 w-16 rounded-2xl flex items-center justify-center group overflow-hidden border-2 border-white/60"
              style={{ 
                background: 'linear-gradient(135deg, #e8e8e8 0%, #f5f5f5 25%, #d4d4d4 50%, #e8e8e8 75%, #f0f0f0 100%)',
                boxShadow: '0 8px 32px rgba(180, 180, 180, 0.6), 0 0 20px rgba(255, 255, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
              }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Animated shimmer effect - mais brilhante */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-t from-white/60 via-white/30 to-transparent"
                animate={{ y: ['100%', '-100%'] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
              />
              
              {/* Glow effect - cinza brilhante intenso */}
              <motion.div 
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(200,200,200,0.4) 50%, transparent 70%)',
                  filter: 'blur(8px)'
                }}
              />
              
              <Sparkles className="h-8 w-8 text-gray-600 relative z-10 group-hover:scale-110 transition-transform drop-shadow-lg" />
              
              {/* Online indicator */}
              <motion.div
                className="absolute -top-1 -right-1 h-4 w-4 bg-emerald-400 rounded-full border-2 border-white shadow-lg"
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />

              {/* Sparkle particles */}
              <motion.div
                className="absolute top-1 left-1 h-1.5 w-1.5 bg-white rounded-full"
                animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 2, delay: 0 }}
              />
              <motion.div
                className="absolute bottom-2 right-2 h-1 w-1 bg-white rounded-full"
                animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
              />
            </motion.button>
            
            {/* Label - cinza brilhante premium */}
            <motion.span 
              className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shadow-xl border border-white/40"
              style={{
                background: 'linear-gradient(135deg, #6b6b6b 0%, #8a8a8a 50%, #6b6b6b 100%)',
                color: 'white',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                boxShadow: '0 4px 16px rgba(100, 100, 100, 0.4)'
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              ✨ TRAMON v8 ✨
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`fixed z-[100] ${
              isExpanded 
                ? 'inset-2 sm:inset-4 md:inset-6' 
                : 'bottom-4 right-4 left-4 sm:left-auto sm:w-[400px] h-[70vh] max-h-[600px] sm:max-h-[680px]'
            }`}
          >
            <div className="relative h-full w-full rounded-3xl overflow-hidden shadow-2xl shadow-purple-500/20 border border-white/10 backdrop-blur-xl bg-gradient-to-br from-slate-900/95 via-purple-950/90 to-slate-900/95 flex flex-col">
              
              {/* Header */}
              <div className="relative px-4 py-3 border-b border-white/10 bg-gradient-to-r from-violet-600/20 via-purple-600/20 to-fuchsia-600/20 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                        <Brain className="h-5 w-5 text-white" />
                      </div>
                      <motion.div
                        className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-400 rounded-full border-2 border-slate-900"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm flex items-center gap-2">
                        TRAMON v8.0
                        <Badge variant="outline" className="text-[9px] bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 border-purple-400/30 text-purple-300">
                          ULTRA
                        </Badge>
                      </h3>
                      <p className="text-[11px] text-purple-300/80">
                        {programmerMode ? "💻 Modo Programador" : "🧠 Superinteligência"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {programmerMode && isOwner && programmerCode && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={applyCodeChanges}
                        className="h-8 w-8 text-green-400 hover:text-green-300 hover:bg-green-500/20"
                        title="Aplicar código"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
                    >
                      {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleClearChat}
                      className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsOpen(false)}
                      className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Quick Insights Bar */}
                {quickInsights.length > 0 && !programmerMode && (
                  <div className="flex gap-2 mt-2 pt-2 border-t border-white/5">
                    {quickInsights.map((insight, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex-1 bg-white/5 rounded-lg px-2 py-1.5 border border-white/5"
                      >
                        <div className="flex items-center gap-1">
                          <insight.icon className={`h-3 w-3 ${insight.color}`} />
                          <span className="text-[9px] text-white/50">{insight.label}</span>
                        </div>
                        <p className={`text-xs font-semibold ${insight.color}`}>{insight.value}</p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Messages - usando div com overflow em vez de ScrollArea */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
                style={{ minHeight: 0 }}
              >
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[85%] ${message.type === "user" ? "order-2" : "order-1"}`}>
                      <div className={`rounded-2xl px-4 py-3 ${
                        message.type === "user"
                          ? "bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white"
                          : "bg-white/5 border border-white/10 text-white/90"
                      }`}>
                        {message.image && (
                          <img src={message.image} alt="Anexo" className="max-w-full rounded-lg mb-2" />
                        )}
                        <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap text-sm">
                          {message.content.split('\n').map((line, i) => (
                            <p key={i} className="mb-1 last:mb-0">
                              {line.replace(/\*\*(.*?)\*\*/g, '**$1**')}
                            </p>
                          ))}
                        </div>
                        
                        {message.tipoCrud && message.tempoProcessamento && (
                          <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-2">
                            <Zap className="h-3 w-3 text-yellow-400" />
                            <span className="text-[10px] text-white/50">{message.tempoProcessamento}ms</span>
                          </div>
                        )}
                      </div>
                      
                      {message.type === "assistant" && message.id !== "welcome" && (
                        <div className="flex gap-1 mt-1 ml-1">
                          <button
                            onClick={() => handleCopy(message.content)}
                            className="p-1 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
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
                    <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        >
                          <Loader2 className="h-4 w-4 text-purple-400" />
                        </motion.div>
                        <span className="text-sm text-purple-300">Processando...</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Quick Actions */}
              {showQuickActions && messages.length <= 1 && (
                <div className="px-4 pb-2">
                  <div className="grid grid-cols-4 gap-2">
                    {quickActions.crud.map((action, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => handleQuickAction(action.prompt)}
                        className={`p-2.5 rounded-xl bg-gradient-to-br ${action.color} border hover:scale-105 transition-all`}
                      >
                        <action.icon className="h-4 w-4 mx-auto text-white/80" />
                        <span className="text-[10px] text-white/70 mt-1 block">{action.label}</span>
                      </motion.button>
                    ))}
                  </div>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {quickActions.analise.map((action, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: (i + 4) * 0.05 }}
                        onClick={() => handleQuickAction(action.prompt)}
                        className={`p-2.5 rounded-xl bg-gradient-to-br ${action.color} border hover:scale-105 transition-all`}
                      >
                        <action.icon className="h-4 w-4 mx-auto text-white/80" />
                        <span className="text-[10px] text-white/70 mt-1 block">{action.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Image Preview */}
              {imagePreview && (
                <div className="px-4 pb-2">
                  <div className="relative inline-block">
                    <img src={imagePreview} alt="Preview" className="h-16 rounded-lg border border-white/20" />
                    <button
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center"
                    >
                      <XCircle className="h-3.5 w-3.5 text-white" />
                    </button>
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="p-4 border-t border-white/10 bg-gradient-to-r from-slate-900/50 to-purple-950/50">
                <div className="flex items-end gap-2">
                  <div className="flex gap-1.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-10 w-10 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleRecording}
                      className={`h-10 w-10 rounded-xl ${
                        isRecording 
                          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                          : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white'
                      }`}
                    >
                      {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  <div className="flex-1 relative">
                    <Textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={programmerMode ? "Descreva a modificação..." : "Digite seu comando..."}
                      className="min-h-[44px] max-h-32 pr-12 resize-none bg-white/5 border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-purple-500/50 focus:ring-purple-500/20"
                      rows={1}
                    />
                    <Button
                      onClick={() => handleSend()}
                      disabled={(!input.trim() && !selectedImage) || isLoading}
                      className="absolute right-1.5 bottom-1.5 h-8 w-8 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <p className="text-[10px] text-white/30 mt-2 text-center">
                  TRAMON v8.0 ULTRA • Gemini 2.5 Pro • Integração Total
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

AITramonGlobal.displayName = 'AITramonGlobal';
export default AITramonGlobal;
