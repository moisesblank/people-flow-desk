// ============================================
// 🔮 TRAMON v3.0 - SUPERINTELIGÊNCIA EMPRESARIAL
// COM VISÃO COMPUTACIONAL E ANÁLISE DE IMAGENS
// Modelo: Gemini 2.5 Pro (Multimodal)
// ============================================

import React, { useState, useRef, useEffect, useCallback } from "react";
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
  Zap,
  Shield,
  Phone,
  Calendar,
  BarChart3,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  FileText,
  PieChart,
  Lightbulb,
  AlertTriangle,
  UserCircle,
  Building2,
  BookOpen,
  Settings,
  Image as ImageIcon,
  Camera,
  Eye,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";

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

// Ações rápidas expandidas para plano empresarial
const quickActions = [
  { icon: TrendingUp, label: "Análise Executiva", prompt: "Faça uma análise executiva completa do meu negócio com todos os KPIs, tendências e recomendações estratégicas.", category: "analise" },
  { icon: DollarSign, label: "Projeção Financeira", prompt: "Crie uma projeção financeira para os próximos 6 meses com cenários otimista, realista e pessimista. Inclua fluxo de caixa e DRE.", category: "financeiro" },
  { icon: Users, label: "Retenção Alunos", prompt: "Desenvolva uma estratégia completa para reduzir churn e aumentar retenção de alunos. Identifique os alunos em risco.", category: "alunos" },
  { icon: Target, label: "Plano 90 Dias", prompt: "Crie um plano de crescimento acelerado para os próximos 90 dias com metas SMART e ações específicas por semana.", category: "estrategia" },
  { icon: Calendar, label: "Agenda Hoje", prompt: "Mostre minhas tarefas de hoje e da semana, com prioridades, sugestões de organização e alertas de atrasos.", category: "tarefas" },
  { icon: BarChart3, label: "Relatório Completo", prompt: "Gere um relatório executivo completo com métricas financeiras, alunos, marketing, equipe e produtividade.", category: "relatorio" },
  { icon: PieChart, label: "Análise Marketing", prompt: "Analise o ROI das campanhas de marketing, CAC, LTV e sugira otimizações para melhorar conversão.", category: "marketing" },
  { icon: Lightbulb, label: "Sugerir Automações", prompt: "Baseado nos dados do sistema, sugira automações que podem economizar tempo e aumentar eficiência.", category: "automacao" },
  { icon: AlertTriangle, label: "Alertas Críticos", prompt: "Liste todos os alertas críticos do sistema: tarefas atrasadas, pagamentos pendentes, alunos em risco, problemas financeiros.", category: "alertas" },
  { icon: UserCircle, label: "Meu Assessor", prompt: "meu assessor", category: "assessor" },
  { icon: Building2, label: "Análise Multi-CNPJ", prompt: "Faça uma análise comparativa entre as duas empresas (MM CURSO DE QUÍMICA LTDA e CURSO QUÍMICA MOISES MEDEIROS).", category: "empresa" },
  { icon: BookOpen, label: "Performance Cursos", prompt: "Analise a performance de todos os cursos: matrículas, progresso dos alunos, avaliações e sugestões de melhoria.", category: "cursos" },
];

export function AITramon() {
  const { user } = useAuth();
  const { canAccessTramon, isLoading: roleLoading } = useAdminCheck();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAllActions, setShowAllActions] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-tramon`;
  const hasAccess = canAccessTramon;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0 && hasAccess) {
      setMessages([{
        id: "welcome",
        type: "assistant",
        content: `🔮 **Olá, ${user?.email?.split('@')[0] || 'Mestre'}!**

Sou **TRAMON v3.0**, sua superinteligência empresarial com **VISÃO COMPUTACIONAL**.

**🆕 NOVO:** Agora posso **ANALISAR IMAGENS** em tempo real!

📸 **Clique no ícone de câmera** para enviar:
• Screenshots de sites para eu analisar UX/UI
• Gráficos e dashboards para interpretar dados
• Materiais de marketing para avaliar efetividade
• Documentos para extrair informações
• Designs para aplicar no seu site

**Minhas capacidades:**
• 📊 Análises preditivas em tempo real
• 💰 Projeções financeiras detalhadas
• 🎯 Planos estratégicos personalizados
• 👁️ **Visão computacional avançada**
• 📱 Contato direto com assessores

**Diga "meu assessor"** para falar com Moisés ou Bruna.

**Envie uma imagem ou pergunte qualquer coisa!**`,
        timestamp: new Date()
      }]);
    }
  }, [isOpen, user, messages.length, hasAccess]);

  // Função de upload de imagem
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast.error("Apenas imagens são permitidas");
      return;
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setSelectedImage(base64);
      setImagePreview(base64);
      toast.success("Imagem carregada! Envie uma mensagem para analisá-la.");
    };
    reader.readAsDataURL(file);
  }, []);

  const removeImage = useCallback(() => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const detectAssessorKeyword = (text: string): boolean => {
    const keywords = ["meu assessor", "assessor", "falar com assessor", "contato assessor", "ligar para"];
    const normalized = text.toLowerCase().trim();
    return keywords.some(kw => normalized.includes(kw));
  };

  const handleSend = useCallback(async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim() || isLoading || !user) return;

    // Detectar palavras-chave de ativação
    const activationKeywords = ["tramon", "olá tramon", "oi tramon"];
    const normalizedInput = messageText.toLowerCase().trim();
    const isActivationKeyword = activationKeywords.some(kw => normalizedInput === kw);
    const isAssessorRequest = detectAssessorKeyword(messageText);

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: messageText,
      timestamp: new Date(),
      image: selectedImage || undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    
    // Limpar imagem após enviar
    const imageToSend = selectedImage;
    removeImage();

    // Se for keyword de ativação simples, responder imediatamente
    if (isActivationKeyword && messages.length <= 1) {
      const activationResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: `🔮 **Olá, ${user?.email?.split('@')[0] || 'Mestre'}!**

Estou aqui e pronto para ajudá-lo! Sou **TRAMON v3.0**, sua superinteligência com visão computacional.

**O que posso fazer por você agora?**

• 📊 Análise completa do seu negócio
• 💰 Projeções financeiras detalhadas
• 🎯 Planos estratégicos personalizados
• 📈 Relatórios em tempo real
• 👁️ **Analisar imagens** em tempo real
• 👥 Contato com assessores (Moisés ou Bruna)

**📸 Envie uma imagem** clicando no ícone de câmera ou **selecione uma ação rápida**!`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, activationResponse]);
      return;
    }

    // Se for pedido de assessor, responder com os contatos
    if (isAssessorRequest && !messageText.toLowerCase().includes("analise") && !messageText.toLowerCase().includes("relatório")) {
      const assessorResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: `📱 **Contato com Assessores**

Aqui estão os contatos dos assessores oficiais:

---

👤 **Moisés Medeiros** - CEO / Proprietário
📞 Telefones: +55 83 98920-105 / +55 83 99892-0105
📧 Email: moisesblank@gmail.com
💼 Para: Decisões estratégicas, financeiras, parcerias

---

👩 **Bruna** - Co-gestora
📞 Telefones: +55 83 96354-090 / +55 83 99635-4090
💼 Para: Operações, equipe, dia-a-dia

---

**Clique abaixo para entrar em contato:**`,
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
          context: "executive",
          image: imageToSend // Enviar imagem se existir
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

      // Save to database
      try {
        await supabase.from('tramon_conversations').insert([
          { user_id: user.id, role: 'user', content: messageText, source: 'web' },
          { user_id: user.id, role: 'assistant', content: assistantContent, source: 'web' }
        ]);
      } catch {
        // Silencioso - falha ao salvar conversa não interrompe o fluxo
      }

    } catch {
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

  const shareToWhatsApp = (message?: string) => {
    const text = message || messages.slice(-2).map(m => `${m.type === 'user' ? '👤' : '🤖'} ${m.content}`).join('\n\n');
    const url = `https://wa.me/${WHATSAPP_TRAMON}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const openAssessorWhatsApp = (assessor: 'moises' | 'bruna') => {
    const data = ASSESSORES[assessor];
    const url = `https://wa.me/${data.whatsapp}`;
    window.open(url, '_blank');
  };

  const copyConversation = () => {
    const text = messages.map(m => `${m.type === 'user' ? 'Você' : 'TRAMON'}: ${m.content}`).join('\n\n');
    navigator.clipboard.writeText(text);
    toast.success('Conversa copiada!');
  };

  // Don't render anything if user doesn't have access
  if (roleLoading) return null;
  if (!hasAccess) return null;

  const visibleActions = showAllActions ? quickActions : quickActions.slice(0, 6);

  return (
    <>
      {/* Floating Trigger Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed top-4 right-4 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="h-12 w-12 rounded-full bg-gradient-to-br from-primary via-purple-600 to-primary shadow-2xl hover:shadow-primary/50 transition-all duration-300 group relative overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent"
                animate={{ y: ['100%', '-100%'] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              />
              <div className="relative">
                <Crown className="h-5 w-5 text-primary-foreground group-hover:scale-110 transition-transform" />
                <motion.div
                  className="absolute -top-1 -right-1 h-2 w-2 bg-green-400 rounded-full border border-background"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
              </div>
            </Button>
            <motion.span 
              className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-purple-600 text-white px-2 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap shadow-lg"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              TRAMON
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
                onClick={() => setIsExpanded(false)}
              />
            )}

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              transition={{ type: 'spring', damping: 25 }}
              className={`fixed z-50 bg-gradient-to-b from-card to-card/95 border border-primary/30 rounded-2xl shadow-2xl shadow-primary/20 flex flex-col overflow-hidden
                ${isExpanded 
                  ? 'inset-4 md:inset-8' 
                  : 'bottom-6 right-6 w-[440px] h-[700px] max-h-[90vh]'
                }`}
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
                        <h3 className="font-bold text-lg bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
                          TRAMON v3.0
                        </h3>
                        <Badge className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[10px] px-1.5">
                          Gemini Pro
                        </Badge>
                        <Badge variant="outline" className="text-[9px] px-1 border-purple-500/50 text-purple-600 flex items-center gap-0.5">
                          <Eye className="h-2 w-2" />
                          VISÃO
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Camera className="h-3 w-3" />
                        Visão Computacional Avançada
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 hover:bg-green-500/10 text-green-500"
                      onClick={() => shareToWhatsApp()}
                      title="Enviar para WhatsApp"
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 hover:bg-primary/10"
                      onClick={copyConversation}
                      title="Copiar conversa"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 hover:bg-primary/10"
                      onClick={() => setIsExpanded(!isExpanded)}
                      title={isExpanded ? "Minimizar" : "Expandir"}
                    >
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 hover:bg-destructive/10 text-destructive"
                      onClick={handleClearChat}
                      title="Limpar conversa"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 hover:bg-primary/10" 
                      onClick={() => setIsOpen(false)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {/* Assessores Badges */}
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30 text-xs cursor-pointer hover:bg-blue-500/20" onClick={() => openAssessorWhatsApp('moises')}>
                    <UserCircle className="h-3 w-3 mr-1" />
                    Moisés (CEO)
                  </Badge>
                  <Badge variant="outline" className="bg-pink-500/10 text-pink-600 border-pink-500/30 text-xs cursor-pointer hover:bg-pink-500/20" onClick={() => openAssessorWhatsApp('bruna')}>
                    <UserCircle className="h-3 w-3 mr-1" />
                    Bruna (Co-gestora)
                  </Badge>
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30 text-xs cursor-pointer hover:bg-green-500/20" onClick={() => window.open(`https://wa.me/${WHATSAPP_TRAMON}`, '_blank')}>
                    <Phone className="h-3 w-3 mr-1" />
                    TRAMON WhatsApp
                  </Badge>
                </div>
              </div>

              {/* Quick Actions */}
              {messages.length <= 1 && (
                <div className="p-3 border-b border-border/50 bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Ações Rápidas
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 text-[10px] text-muted-foreground hover:text-foreground"
                      onClick={() => setShowAllActions(!showAllActions)}
                    >
                      {showAllActions ? "Ver menos" : `Ver todas (${quickActions.length})`}
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {visibleActions.map((action, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        size="sm"
                        className={`h-auto py-2 px-3 text-xs justify-start gap-2 bg-background/50 hover:bg-primary/10 hover:border-primary/30 ${
                          action.category === 'assessor' ? 'border-green-500/30 bg-green-500/5' : ''
                        }`}
                        onClick={() => handleSend(action.prompt)}
                        disabled={isLoading}
                      >
                        <action.icon className={`h-4 w-4 shrink-0 ${
                          action.category === 'assessor' ? 'text-green-500' : 'text-primary'
                        }`} />
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
                            <Badge variant="outline" className="text-[9px] h-4 px-1 bg-cyan-500/10 text-cyan-600">
                              Gemini Pro
                            </Badge>
                            <Badge variant="outline" className="text-[9px] h-4 px-1 bg-purple-500/10 text-purple-600">
                              <Eye className="h-2 w-2 mr-0.5" />
                              Visão
                            </Badge>
                            {message.source === 'whatsapp' && (
                              <Badge variant="outline" className="text-[10px] h-4 px-1 bg-green-500/10 text-green-600">
                                <Phone className="h-2 w-2 mr-0.5" />
                                WhatsApp
                              </Badge>
                            )}
                          </div>
                        )}
                        
                        {/* Mostrar imagem anexada */}
                        {message.image && (
                          <div className="mb-3">
                            <img 
                              src={message.image} 
                              alt="Imagem enviada" 
                              className="max-h-48 rounded-lg border border-white/20"
                            />
                          </div>
                        )}
                        
                        <div className="text-sm whitespace-pre-wrap leading-relaxed">
                          {message.content.split('**').map((part, i) => 
                            i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                          )}
                        </div>
                        
                        {/* Botões de assessor quando for mensagem de assessor */}
                        {message.type === "assistant" && message.content.includes("Moisés Medeiros") && message.content.includes("Bruna") && (
                          <div className="flex gap-2 mt-3 pt-2 border-t border-border/30">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs bg-blue-500/10 border-blue-500/30 text-blue-600 hover:bg-blue-500/20"
                              onClick={() => openAssessorWhatsApp('moises')}
                            >
                              <Phone className="h-3 w-3 mr-1" />
                              Moisés
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs bg-pink-500/10 border-pink-500/30 text-pink-600 hover:bg-pink-500/20"
                              onClick={() => openAssessorWhatsApp('bruna')}
                            >
                              <Phone className="h-3 w-3 mr-1" />
                              Bruna
                            </Button>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/20">
                          <p className="text-[10px] opacity-50">
                            {message.timestamp.toLocaleTimeString("pt-BR", { 
                              hour: "2-digit", 
                              minute: "2-digit" 
                            })}
                          </p>
                          
                          {message.type === "assistant" && message.content && message.id !== "welcome" && (
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => shareToWhatsApp(message.content)}
                                title="Enviar para WhatsApp"
                              >
                                <Phone className="h-3 w-3 text-green-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleCopy(message.id, message.content)}
                              >
                                {copiedId === message.id ? (
                                  <Check className="h-3 w-3 text-green-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
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
                        <span className="text-sm text-muted-foreground">
                          {selectedImage ? "Analisando imagem com visão computacional..." : "Processando com Gemini 2.5 Pro..."}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </div>
              </ScrollArea>

              {/* Input Premium com Upload de Imagem */}
              <div className="p-4 border-t border-border/50 bg-gradient-to-t from-muted/50 to-transparent">
                {/* Preview da Imagem */}
                <AnimatePresence>
                  {imagePreview && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-3 relative"
                    >
                      <div className="relative inline-block">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="max-h-32 rounded-lg border border-primary/30 shadow-lg"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-lg"
                          onClick={removeImage}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                        <div className="absolute bottom-1 left-1 bg-background/90 px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
                          <Eye className="h-3 w-3 text-primary" />
                          <span>Pronta para análise</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex gap-2">
                  {/* Input de arquivo oculto */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  
                  {/* Botão de Upload de Imagem */}
                  <Button
                    variant="outline"
                    size="icon"
                    className={`h-[50px] w-[50px] shrink-0 transition-all ${
                      imagePreview 
                        ? 'bg-primary/20 border-primary text-primary' 
                        : 'border-primary/20 hover:border-primary/50 hover:bg-primary/10'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    title="Enviar imagem para análise"
                  >
                    <Camera className="h-5 w-5" />
                  </Button>

                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={imagePreview ? 'Descreva o que quer que eu analise na imagem...' : 'Pergunte qualquer coisa... ou envie uma imagem 📸'}
                    className="min-h-[50px] max-h-32 resize-none bg-background border-primary/20 focus:border-primary/50"
                    disabled={isLoading}
                    rows={2}
                  />
                  <Button 
                    onClick={() => handleSend()} 
                    disabled={(!input.trim() && !imagePreview) || isLoading}
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
                
                <p className="text-[10px] text-muted-foreground text-center mt-2 flex items-center justify-center gap-1">
                  <Eye className="h-3 w-3" />
                  TRAMON v3.0 • Visão Computacional • Gemini 2.5 Pro
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
