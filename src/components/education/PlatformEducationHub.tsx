import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Lock, Users, Settings, ArrowRight, Ban,
  Network, KeyRound, UserCheck, ShieldCheck, Database,
  Play, FileText, Calendar, Brain, HelpCircle, Trophy,
  Bot, Calculator, Video, MessageSquare, Award,
  Building2, DollarSign, UserCog, BarChart3, Send,
  Webhook, Zap, Eye, AlertTriangle, Check,
  Layers, Sparkles, Target, Rocket, BookOpen,
  GraduationCap, Lightbulb, ChevronRight, Home,
  Clock, Cpu, Globe, Server, Activity, Crown
} from "lucide-react";
import { PlatformGuideVS } from "./PlatformGuideVS";
import { PlatformGuideCard } from "./PlatformGuideCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type GuideCategory = "overview" | "security" | "student" | "management" | "ai" | "integrations";

interface GuideSlide {
  id: string;
  category: GuideCategory;
  title: string;
  description: string;
  component: React.ReactNode;
}

export function PlatformEducationHub() {
  const [activeCategory, setActiveCategory] = useState<GuideCategory>("overview");
  const [currentSlide, setCurrentSlide] = useState(0);

  const categories: { id: GuideCategory; label: string; icon: React.ElementType; color: string }[] = [
    { id: "overview", label: "Visão Geral", icon: Home, color: "text-blue-400" },
    { id: "security", label: "Segurança", icon: Shield, color: "text-emerald-400" },
    { id: "student", label: "Portal Aluno", icon: GraduationCap, color: "text-amber-400" },
    { id: "management", label: "Gestão", icon: Building2, color: "text-purple-400" },
    { id: "ai", label: "Inteligência", icon: Brain, color: "text-fuchsia-400" },
    { id: "integrations", label: "Integrações", icon: Webhook, color: "text-cyan-400" },
  ];

  const slides: GuideSlide[] = [
    // OVERVIEW
    {
      id: "overview-1",
      category: "overview",
      title: "Constituição vs Ideias",
      description: "Entenda o que é fixo (lei) e o que pode evoluir (sugestões)",
      component: (
        <PlatformGuideVS
          leftCard={{
            title: "Caixa da Lei",
            subtitle: "Regras Fixas",
            variant: "law",
            badge: "JSON PURO",
            items: [
              { icon: Network, label: "Hierarquia", description: "Roles imutáveis" },
              { icon: Shield, label: "Segurança", description: "4 camadas" },
              { icon: KeyRound, label: "Autenticação", description: "Supabase Auth" },
              { icon: UserCheck, label: "Permissões", description: "RLS + RBAC" },
              { icon: ArrowRight, label: "Redirecionamento", description: "Por role" },
              { icon: Ban, label: "Bloqueios", description: "Automáticos" },
            ],
            footer: "NÃO MUDA",
          }}
          rightCard={{
            title: "Caixa da Ideia",
            subtitle: "Novas Oportunidades",
            variant: "idea",
            badge: "TEXTO LIVRE",
            items: [
              { icon: Lightbulb, label: "Sugestões", description: "De UI/UX" },
              { icon: Sparkles, label: "Melhorias", description: "Incrementais" },
              { icon: MessageSquare, label: "Discutir", description: "Com o OWNER" },
              { icon: Target, label: "Features", description: "Novas funções" },
              { icon: Rocket, label: "Inovação", description: "Sem limite" },
              { icon: BookOpen, label: "Documentar", description: "Histórico" },
            ],
            footer: "PODE MUDAR",
          }}
        />
      ),
    },
    {
      id: "overview-2",
      category: "overview",
      title: "Dois Mundos, Um Sistema",
      description: "A plataforma tem dois blocos principais que não se misturam",
      component: (
        <PlatformGuideVS
          leftCard={{
            title: "Bloco Gestão",
            subtitle: "/gestaofc/*",
            variant: "security",
            badge: "FUNCIONÁRIOS",
            items: [
              { icon: Building2, label: "Admin", description: "Nível 1" },
              { icon: Users, label: "Coordenação", description: "Nível 2" },
              { icon: DollarSign, label: "Contabilidade", description: "Nível 2" },
              { icon: UserCog, label: "Suporte", description: "Nível 3" },
              { icon: Eye, label: "Monitoria", description: "Nível 3" },
              { icon: Send, label: "Marketing", description: "Nível 3" },
            ],
            footer: "QUEM TRABALHA",
          }}
          rightCard={{
            title: "Bloco Alunos",
            subtitle: "/alunos/*",
            variant: "student",
            badge: "ESTUDANTES",
            items: [
              { icon: Trophy, label: "Beta", description: "Pagante" },
              { icon: Users, label: "Gratuito", description: "Limitado" },
              { icon: Play, label: "Videoaulas", description: "Premium" },
              { icon: FileText, label: "Materiais", description: "PDF/Docs" },
              { icon: Bot, label: "Tutoria IA", description: "Assistente" },
              { icon: Award, label: "Gamificação", description: "XP + Badges" },
            ],
            footer: "QUEM ESTUDA",
          }}
          vsLabel="≠"
        />
      ),
    },
    // SECURITY
    {
      id: "security-1",
      category: "security",
      title: "Segurança em 4 Camadas",
      description: "Defense in depth - cada camada protege a próxima",
      component: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PlatformGuideCard
            title="Camada 1: Borda"
            subtitle="Primeira Linha de Defesa"
            variant="security"
            items={[
              { icon: Globe, label: "Rate Limit", description: "Por IP/user" },
              { icon: Shield, label: "Turnstile", description: "Anti-bot" },
              { icon: AlertTriangle, label: "WAF", description: "Cloudflare" },
              { icon: Ban, label: "IP Block", description: "Automático" },
            ]}
            footer="EDGE GUARD"
          />
          <PlatformGuideCard
            title="Camada 2: Auth"
            subtitle="Autenticação e Autorização"
            variant="law"
            items={[
              { icon: KeyRound, label: "Supabase", description: "JWT + Sessions" },
              { icon: Database, label: "RLS", description: "Row Level Security" },
              { icon: Users, label: "RBAC", description: "Role Based" },
              { icon: Lock, label: "Default Deny", description: "Sem role = sem acesso" },
            ]}
            footer="SANCTUM GUARD"
          />
          <PlatformGuideCard
            title="Camada 3: Conteúdo"
            subtitle="Proteção de Materiais"
            variant="ai"
            items={[
              { icon: Clock, label: "URLs Curtas", description: "Expiram rápido" },
              { icon: Eye, label: "Watermark", description: "Nome + Email" },
              { icon: Activity, label: "Logs", description: "Tudo auditado" },
              { icon: Video, label: "Panda", description: "DRM de vídeo" },
            ]}
            footer="CONTENT SHIELD"
          />
          <PlatformGuideCard
            title="Camada 4: Comportamento"
            subtitle="Detecção de Ameaças"
            variant="idea"
            items={[
              { icon: Target, label: "Threat Score", description: "0-100" },
              { icon: Cpu, label: "Fingerprint", description: "Dispositivo" },
              { icon: AlertTriangle, label: "DevTools", description: "Detecção" },
              { icon: Ban, label: "Progressivo", description: "Throttle → Ban" },
            ]}
            footer="SANCTUM OMEGA"
          />
        </div>
      ),
    },
    {
      id: "security-2",
      category: "security",
      title: "Sistema de Roles",
      description: "Quem pode fazer o quê na plataforma",
      component: (
        <div className="space-y-4">
          <PlatformGuideCard
            title="Hierarquia de Poder"
            subtitle="OWNER → Admin → Staff → Alunos"
            variant="law"
            className="max-w-2xl mx-auto"
            items={[
              { icon: Crown, label: "Owner", description: "Único • Imutável • God Mode" },
              { icon: ShieldCheck, label: "Admin", description: "Vários • Acesso total" },
              { icon: Users, label: "Staff", description: "6 roles • Funções específicas" },
              { icon: GraduationCap, label: "Alunos", description: "Beta • Gratuito" },
            ]}
            footer="NÍVEIS 0 → 1 → 2 → 3"
          />
          <div className="bg-zinc-800/50 rounded-xl p-4 max-w-2xl mx-auto">
            <h4 className="text-amber-400 font-bold mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Regras de Ouro
            </h4>
            <ul className="space-y-2 text-sm text-zinc-300">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <span><strong>ROLE</strong> é valor no banco (suporte, admin, beta)</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <span><strong>CARGO</strong> é texto descritivo (Atendente Nível 2)</span>
              </li>
              <li className="flex items-start gap-2">
                <Ban className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <span><strong>NUNCA</strong> usar employee ou funcionario como role</span>
              </li>
              <li className="flex items-start gap-2">
                <Ban className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <span><strong>NUNCA</strong> pode existir 2º owner</span>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    // STUDENT
    {
      id: "student-1",
      category: "student",
      title: "Portal do Aluno",
      description: "Tudo que o aluno tem acesso na plataforma",
      component: (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <PlatformGuideCard
            title="Estudos"
            subtitle="Material Didático"
            variant="student"
            items={[
              { icon: Play, label: "Videoaulas", description: "Panda protegido" },
              { icon: FileText, label: "Materiais", description: "PDFs/Docs" },
              { icon: Brain, label: "Mapas Mentais", description: "Visual" },
              { icon: Layers, label: "Flashcards", description: "Memorização" },
            ]}
            footer="APRENDER"
          />
          <PlatformGuideCard
            title="Prática"
            subtitle="Exercitar Conhecimento"
            variant="idea"
            items={[
              { icon: HelpCircle, label: "Questões", description: "Banco de questões" },
              { icon: Target, label: "Simulados", description: "Provas completas" },
              { icon: Calculator, label: "Calculadora", description: "Ferramenta" },
              { icon: BookOpen, label: "Laboratório", description: "Experimentos" },
            ]}
            footer="PRATICAR"
          />
          <PlatformGuideCard
            title="Social"
            subtitle="Comunidade e Gamificação"
            variant="ai"
            items={[
              { icon: Trophy, label: "Ranking", description: "Competição" },
              { icon: Award, label: "Conquistas", description: "Badges + XP" },
              { icon: MessageSquare, label: "Fórum", description: "Discussões" },
              { icon: Video, label: "Lives", description: "Ao vivo" },
            ]}
            footer="ENGAJAR"
          />
        </div>
      ),
    },
    // MANAGEMENT
    {
      id: "management-1",
      category: "management",
      title: "Área de Gestão",
      description: "Ferramentas para a equipe administrativa",
      component: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PlatformGuideCard
            title="Operações"
            subtitle="Dia a Dia"
            variant="security"
            items={[
              { icon: Users, label: "Alunos", description: "Cadastro + Status" },
              { icon: DollarSign, label: "Financeiro", description: "Entradas/Saídas" },
              { icon: UserCog, label: "Funcionários", description: "RH" },
              { icon: BarChart3, label: "Relatórios", description: "Analytics" },
            ]}
            footer="ADMIN + COORD"
          />
          <PlatformGuideCard
            title="Suporte"
            subtitle="Atendimento"
            variant="idea"
            items={[
              { icon: MessageSquare, label: "WhatsApp", description: "Integrado" },
              { icon: Users, label: "Tickets", description: "Chamados" },
              { icon: Eye, label: "Monitoria", description: "Acompanhamento" },
              { icon: Send, label: "Notificações", description: "Emails" },
            ]}
            footer="SUPORTE + MONITORIA"
          />
          <PlatformGuideCard
            title="Marketing"
            subtitle="Aquisição e Retenção"
            variant="ai"
            items={[
              { icon: Rocket, label: "Campanhas", description: "Lançamentos" },
              { icon: Target, label: "Leads", description: "Captação" },
              { icon: Activity, label: "Analytics", description: "Métricas" },
              { icon: Users, label: "Afiliados", description: "Comissões" },
            ]}
            footer="MARKETING + AFILIADO"
          />
          <PlatformGuideCard
            title="Owner Only"
            subtitle="Exclusivo Moisés"
            variant="law"
            items={[
              { icon: Eye, label: "Central", description: "Monitoramento" },
              { icon: Cpu, label: "Diagnóstico", description: "Webhooks" },
              { icon: Server, label: "Master Mode", description: "God Mode" },
              { icon: AlertTriangle, label: "Auditoria", description: "Tudo" },
            ]}
            footer="ACESSO TOTAL"
          />
        </div>
      ),
    },
    // AI
    {
      id: "ai-1",
      category: "ai",
      title: "Sistema Neural (SNA Omega)",
      description: "Inteligência Artificial integrada à plataforma",
      component: (
        <div className="space-y-4">
          <PlatformGuideVS
            leftCard={{
              title: "Tier Omega",
              subtitle: "Nunca Desativar",
              variant: "law",
              badge: "CRÍTICO",
              items: [
                { icon: Server, label: "SNA Gateway", description: "Ponto único" },
                { icon: Cpu, label: "Orchestrator", description: "Orquestra tudo" },
                { icon: Webhook, label: "Event Router", description: "Distribui eventos" },
                { icon: Activity, label: "Queue Worker", description: "Processa fila" },
              ],
              footer: "INFRAESTRUTURA",
            }}
            rightCard={{
              title: "Tier Alpha",
              subtitle: "Monitorar",
              variant: "ai",
              badge: "IA ATIVA",
              items: [
                { icon: Bot, label: "AI Tutor", description: "Tira dúvidas" },
                { icon: Brain, label: "AI Assistant", description: "Geral" },
                { icon: BookOpen, label: "Book Chat", description: "Livros" },
                { icon: Sparkles, label: "Generate", description: "Conteúdo IA" },
              ],
              footer: "ASSISTENTES",
            }}
            vsLabel="🧠"
          />
          <div className="bg-gradient-to-r from-violet-900/50 to-fuchsia-900/50 rounded-xl p-4 max-w-2xl mx-auto border border-violet-500/30">
            <h4 className="text-fuchsia-300 font-bold mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Como Usar a IA
            </h4>
            <p className="text-sm text-zinc-300">
              A IA da plataforma usa <strong>Lovable AI Gateway</strong> com modelos Gemini e GPT-5. 
              Não precisa de API key - já está configurado. Basta usar o <strong>AI Tutor</strong> no portal 
              do aluno ou o <strong>Book Chat</strong> nos livros digitais.
            </p>
          </div>
        </div>
      ),
    },
    // INTEGRATIONS
    {
      id: "integrations-1",
      category: "integrations",
      title: "Integrações Ativas",
      description: "Sistemas externos conectados à plataforma",
      component: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PlatformGuideCard
            title="Hotmart"
            subtitle="Pagamentos e Vendas"
            variant="security"
            items={[
              { icon: DollarSign, label: "Compras", description: "Webhook auto" },
              { icon: ArrowRight, label: "Reembolsos", description: "Auto-revoke" },
              { icon: Users, label: "Afiliados", description: "Comissões" },
              { icon: Activity, label: "Tracking", description: "Transaction ID" },
            ]}
            footer="VENDAS 24/7"
          />
          <PlatformGuideCard
            title="Panda Video"
            subtitle="Streaming Protegido"
            variant="ai"
            items={[
              { icon: Video, label: "URLs Assinadas", description: "Curta duração" },
              { icon: Lock, label: "DRM", description: "Anti-pirataria" },
              { icon: Eye, label: "Watermark", description: "Forense" },
              { icon: Shield, label: "Proteção", description: "Enterprise" },
            ]}
            footer="VÍDEOS SEGUROS"
          />
          <PlatformGuideCard
            title="WordPress"
            subtitle="Sync de Usuários"
            variant="idea"
            items={[
              { icon: Users, label: "Sync", description: "Automático" },
              { icon: KeyRound, label: "SSO", description: "Login único" },
              { icon: Database, label: "Grupos", description: "Memberships" },
              { icon: Webhook, label: "Webhooks", description: "Tempo real" },
            ]}
            footer="LEGADO INTEGRADO"
          />
          <PlatformGuideCard
            title="Cloudflare"
            subtitle="Edge e Segurança"
            variant="law"
            items={[
              { icon: Globe, label: "CDN", description: "Global" },
              { icon: Shield, label: "WAF", description: "Firewall" },
              { icon: Zap, label: "Cache", description: "Performance" },
              { icon: Lock, label: "SSL", description: "Certificado" },
            ]}
            footer="BORDA GLOBAL"
          />
        </div>
      ),
    },
  ];

  const filteredSlides = slides.filter(s => s.category === activeCategory);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-950 to-black text-white p-4 md:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent mb-2">
          🎓 Guia da Plataforma PRO
        </h1>
        <p className="text-zinc-400 max-w-2xl mx-auto">
          Aprenda tudo sobre o sistema. Navegue pelas categorias abaixo para explorar cada área.
        </p>
      </motion.div>

      {/* Category Tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={activeCategory === cat.id ? "default" : "outline"}
            onClick={() => {
              setActiveCategory(cat.id);
              setCurrentSlide(0);
            }}
            className={cn(
              "gap-2 transition-all",
              activeCategory === cat.id
                ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0"
                : "border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500"
            )}
          >
            <cat.icon className={cn("w-4 h-4", activeCategory === cat.id ? "text-white" : cat.color)} />
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Slide Navigation */}
      {filteredSlides.length > 1 && (
        <div className="flex justify-center gap-2 mb-6">
          {filteredSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={cn(
                "w-3 h-3 rounded-full transition-all",
                currentSlide === idx
                  ? "bg-amber-500 w-8"
                  : "bg-zinc-700 hover:bg-zinc-600"
              )}
            />
          ))}
        </div>
      )}

      {/* Current Slide */}
      <AnimatePresence mode="wait">
        {filteredSlides[currentSlide] && (
          <motion.div
            key={filteredSlides[currentSlide].id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-1">
                {filteredSlides[currentSlide].title}
              </h2>
              <p className="text-zinc-400">
                {filteredSlides[currentSlide].description}
              </p>
            </div>
            <div className="max-w-6xl mx-auto">
              {filteredSlides[currentSlide].component}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Arrows */}
      {filteredSlides.length > 1 && (
        <div className="flex justify-center gap-4 mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
            disabled={currentSlide === 0}
            className="border-zinc-700"
          >
            ← Anterior
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentSlide(Math.min(filteredSlides.length - 1, currentSlide + 1))}
            disabled={currentSlide === filteredSlides.length - 1}
            className="border-zinc-700"
          >
            Próximo →
          </Button>
        </div>
      )}

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 text-center text-zinc-500 text-sm"
      >
        <p>Constituição Synapse Ω v10.0 • OWNER: moisesblank@gmail.com</p>
      </motion.div>
    </div>
  );
}
