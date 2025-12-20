// ============================================
// MOISÉS MEDEIROS v10.0 - AUTH PAGE
// Design: Futurista Spider-Man / Vermelho Vinho
// Estética: Cyber-Tech Profissional
// COM VERIFICAÇÃO 2FA POR EMAIL
// UPGRADE: Feedback melhorado, mensagens claras
// ============================================

import { useState, useEffect, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft,
  Shield,
  Atom,
  Zap,
  ArrowRight,
  CircuitBoard,
  Loader2,
  Fingerprint,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { simpleLoginSchema, simpleSignupSchema } from "@/lib/validations/schemas";
import professorPhoto from "@/assets/professor-moises-novo.jpg";
import logoMoises from "@/assets/logo-moises-medeiros.png";
import { useEditableContent } from "@/hooks/useEditableContent";

// Lazy load componentes pesados (apenas owner usa)
const EditableText = lazy(() => import("@/components/editor/EditableText").then(m => ({ default: m.EditableText })));
const EditableImage = lazy(() => import("@/components/editor/EditableImage").then(m => ({ default: m.EditableImage })));
const EditModeToggle = lazy(() => import("@/components/editor/EditModeToggle").then(m => ({ default: m.EditModeToggle })));
const TwoFactorVerification = lazy(() => import("@/components/auth/TwoFactorVerification").then(m => ({ default: m.TwoFactorVerification })));
const PasswordStrengthMeter = lazy(() => import("@/components/auth/PasswordStrengthMeter").then(m => ({ default: m.PasswordStrengthMeter })));

// Performance Optimized Cyber Grid - CSS Only
function CyberGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Static Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(139, 0, 0, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 0, 0, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}
      />
      
      {/* CSS-only animated line */}
      <div 
        className="absolute h-px w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent animate-pulse"
        style={{ top: '50%', animationDuration: '4s' }}
      />
    </div>
  );
}

// Spider Web Pattern
function SpiderWebPattern() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.02]" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <pattern id="web" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <path 
            d="M10 0 L10 20 M0 10 L20 10 M0 0 L20 20 M20 0 L0 20" 
            stroke="currentColor" 
            strokeWidth="0.3" 
            fill="none" 
            className="text-primary"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#web)" />
    </svg>
  );
}

// Simplified Glowing Orbs - Single orb only
function GlowingOrbs() {
  return (
    <div
      className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-30"
      style={{
        background: 'radial-gradient(circle, rgba(139, 0, 0, 0.15) 0%, transparent 70%)',
      }}
    />
  );
}

// Removed CircuitLines - too heavy for performance
function CircuitLines() {
  return null;
}

// Stats Display - CSS animations only
function StatsDisplay({ stats }: { stats: { value: string; label: string }[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-8 w-full">
      {stats.map((stat, i) => (
        <div
          key={i}
          className="text-center px-6 py-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm min-w-[120px] hover:border-primary/50 hover:bg-primary/10 transition-all duration-300 animate-fade-in"
          style={{ animationDelay: `${0.3 + i * 0.1}s`, animationFillMode: 'backwards' }}
        >
          <div className="text-2xl xl:text-3xl font-bold text-primary">
            {stat.value}
          </div>
          <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp, resetPassword, isLoading: authLoading } = useAuth();
  
  const { 
    isEditMode, 
    canEdit, 
    toggleEditMode, 
    getValue, 
    updateValue, 
    uploadImage 
  } = useEditableContent("auth");

  // =====================================================
  // AUDITORIA: Stats reais do banco - nenhum valor fictício
  // Se não houver dados, mostra 0
  // =====================================================
  const [realStats, setRealStats] = useState({ alunos: 0, aprovados: 0 });
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Buscar total de alunos
        const { count: alunosCount } = await supabase
          .from("alunos")
          .select("*", { count: "exact", head: true });
        
        // Buscar alunos ativos (considerados "aprovados" no sistema)
        const { count: aprovadosCount } = await supabase
          .from("alunos")
          .select("*", { count: "exact", head: true })
          .eq("status", "ativo");
        
        setRealStats({
          alunos: alunosCount || 0,
          aprovados: aprovadosCount || 0
        });
      } catch (error) {
        console.error("[AUDIT] Erro ao buscar stats:", error);
      }
    };
    fetchStats();
  }, []);

  const stats = [
    { value: realStats.alunos > 0 ? `${realStats.alunos.toLocaleString("pt-BR")}+` : "0", label: "Alunos" },
    { value: realStats.aprovados > 0 ? `${realStats.aprovados.toLocaleString("pt-BR")}+` : "0", label: "Ativos" },
    { value: "0%", label: "Satisfação" }, // TODO: Implementar sistema de avaliação
  ];
  
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  
  // Estado para 2FA
  const [show2FA, setShow2FA] = useState(false);
  const [pending2FAUser, setPending2FAUser] = useState<{ email: string; userId: string; nome?: string } | null>(null);
  
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    if (user && !authLoading) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      if (!formData.email || !formData.email.includes('@')) {
        setErrors({ email: "Digite um email válido" });
        setIsLoading(false);
        return;
      }

      const { error } = await resetPassword(formData.email);
      if (error) {
        toast.error(error.message);
        setIsLoading(false);
        return;
      }
      
      setResetEmailSent(true);
      toast.success("Email de recuperação enviado!");
    } catch {
      toast.error("Erro ao enviar email de recuperação");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    if (!isLogin && !acceptTerms) {
      toast.error("Você precisa aceitar os termos de uso");
      return;
    }
    
    setIsLoading(true);

    try {
      const schema = isLogin ? simpleLoginSchema : simpleSignupSchema;
      const result = schema.safeParse(formData);
      
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        setIsLoading(false);
        return;
      }

      if (isLogin) {
        const result = await signIn(formData.email, formData.password);
        if (result.error) {
          if (result.error.message.includes("Invalid login credentials")) {
            toast.error("Credenciais inválidas", {
              description: "Verifique seu email e senha e tente novamente."
            });
          } else if (result.error.message.includes("Email not confirmed")) {
            toast.warning("Email não confirmado", {
              description: "Verifique sua caixa de entrada para confirmar seu email."
            });
          } else {
            toast.error("Erro no login", {
              description: result.error.message
            });
          }
          setIsLoading(false);
          return;
        }
        
        // Login bem sucedido - ativar 2FA
        // Buscar usuário atual do supabase
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          setPending2FAUser({
            email: user.email || formData.email,
            userId: user.id,
            nome: user.user_metadata?.nome
          });
          setShow2FA(true);
          toast.info("Verificação de Segurança 2FA", {
            description: "Um código de 6 dígitos foi enviado para " + (user.email || formData.email)
          });
        }
      } else {
        // Cadastro de novo usuário
        const result = await signUp(formData.email, formData.password, formData.nome);
        if (result.error) {
          if (result.error.message.includes("User already registered")) {
            toast.error("Email já cadastrado", {
              description: "Este email já possui uma conta. Tente fazer login."
            });
          } else {
            toast.error("Erro no cadastro", {
              description: result.error.message
            });
          }
          setIsLoading(false);
          return;
        }
        
        toast.success("Conta criada com sucesso!", {
          description: "Você já pode fazer login."
        });
        setIsLogin(true);
        setFormData({ nome: "", email: formData.email, password: "" });
      }
    } catch {
      toast.error("Erro ao processar solicitação");
    } finally {
      setIsLoading(false);
    }
  };

  // REMOVIDO: authLoading check - renderizar instantaneamente
  // O redirecionamento acontece no useEffect quando user/authLoading mudam

  // Renderizar tela de 2FA se necessário
  if (show2FA && pending2FAUser) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
        <SpiderWebPattern />
        <CyberGrid />
        <GlowingOrbs />
        <Suspense fallback={<div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />}>
          <TwoFactorVerification
            email={pending2FAUser.email}
            userId={pending2FAUser.userId}
            userName={pending2FAUser.nome}
            onVerified={() => {
              toast.success("Bem-vindo de volta!");
              navigate("/");
            }}
            onCancel={() => {
              setShow2FA(false);
              setPending2FAUser(null);
            }}
          />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex relative overflow-hidden">
      {canEdit && (
        <Suspense fallback={null}>
          <EditModeToggle 
            isEditMode={isEditMode} 
            canEdit={canEdit} 
            onToggle={toggleEditMode} 
          />
        </Suspense>
      )}
      
      {/* Background Effects */}
      <SpiderWebPattern />
      <CyberGrid />
      <GlowingOrbs />
      <CircuitLines />
      
      {/* Left Panel - Visual Side */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0505]/90 via-[#0a0a0a]/80 to-[#0a0a0a]" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12">
          {/* Logo / Brand - CSS animations */}
          <div className="mb-8 animate-scale-in">
            <div className="relative">
              {/* Glow Effect - CSS only */}
              <div
                className="absolute inset-0 rounded-full blur-3xl animate-pulse"
                style={{ 
                  background: 'radial-gradient(circle, rgba(139, 0, 0, 0.4) 0%, transparent 70%)',
                  animationDuration: '3s'
                }}
              />
              
              {/* Hexagonal Frame */}
              <div className="relative w-72 h-72 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                  <polygon
                    points="50,2 95,25 95,75 50,98 5,75 5,25"
                    fill="none"
                    stroke="url(#hexGradient)"
                    strokeWidth="1.5"
                    className="animate-dash"
                    style={{ strokeDasharray: 1000, strokeDashoffset: 1000 }}
                  />
                  <defs>
                    <linearGradient id="hexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#8B0000" />
                      <stop offset="50%" stopColor="#DC143C" />
                      <stop offset="100%" stopColor="#8B0000" />
                    </linearGradient>
                  </defs>
                </svg>
                
                {/* Professor Photo */}
                {canEdit && isEditMode ? (
                  <Suspense fallback={<img src={professorPhoto} alt="Professor Moisés" className="w-60 h-60 rounded-full object-cover [object-position:50%_15%] border-4 border-primary/60 shadow-2xl shadow-primary/30" />}>
                    <EditableImage
                      src={professorPhoto}
                      alt="Professor Moisés"
                      onUpload={async (file) => await uploadImage("auth_professor_photo", file)}
                      isEditMode={isEditMode}
                      canEdit={canEdit}
                      className="w-full h-full object-cover [object-position:50%_15%]"
                      containerClassName="w-60 h-60 rounded-full overflow-hidden border-4 border-primary/60 shadow-2xl shadow-primary/30"
                    />
                  </Suspense>
                ) : (
                  <img 
                    src={professorPhoto} 
                    alt="Professor Moisés" 
                    width={240}
                    height={240}
                    loading="eager"
                    decoding="async"
                    className="w-60 h-60 rounded-full object-cover [object-position:50%_15%] border-4 border-primary/60 shadow-2xl shadow-primary/30" 
                  />
                )}
              </div>
              
              {/* Status Indicator - CSS animation */}
              <div
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary/90 to-[#DC143C]/90 backdrop-blur-sm border border-primary/30 animate-pulse"
                style={{ animationDuration: '2s' }}
              >
                <span className="flex items-center gap-1.5 text-xs font-semibold text-white">
                  <Zap className="h-3 w-3" />
                  VERIFICADO
                </span>
              </div>
            </div>
          </div>

          {/* Title - CSS animations */}
          <div className="text-center mb-6 animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'backwards' }}>
            <h1 className="text-4xl xl:text-5xl font-bold text-white mb-3">
              <span className="text-gray-400">Prof.</span>{" "}
              <span className="bg-gradient-to-r from-primary via-[#DC143C] to-primary bg-clip-text text-transparent">
                {canEdit && isEditMode ? (
                  <Suspense fallback="Moisés Medeiros">
                    <EditableText
                      value={getValue("auth_title_name", "Moisés Medeiros")}
                      onSave={(v) => updateValue("auth_title_name", v)}
                      isEditMode={isEditMode}
                      canEdit={canEdit}
                    />
                  </Suspense>
                ) : (
                  getValue("auth_title_name", "Moisés Medeiros")
                )}
              </span>
            </h1>
            <p className="text-lg text-gray-400 animate-fade-in" style={{ animationDelay: '0.4s', animationFillMode: 'backwards' }}>
              {canEdit && isEditMode ? (
                <Suspense fallback="O professor que mais aprova em Medicina">
                  <EditableText
                    value={getValue("auth_subtitle", "O professor que mais aprova em Medicina")}
                    onSave={(v) => updateValue("auth_subtitle", v)}
                    isEditMode={isEditMode}
                    canEdit={canEdit}
                  />
                </Suspense>
              ) : (
                getValue("auth_subtitle", "O professor que mais aprova em Medicina")
              )}
            </p>
          </div>

          {/* Feature Pills - CSS only */}
          <div className="flex flex-wrap justify-center gap-3 mb-8 animate-fade-in" style={{ animationDelay: '0.5s', animationFillMode: 'backwards' }}>
            {[
              { icon: Atom, label: "Química Completa" },
              { icon: CircuitBoard, label: "Metodologia Exclusiva" },
              { icon: Shield, label: "Resultados Comprovados" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm hover:scale-105 hover:border-primary/50 hover:bg-primary/10 transition-all duration-200 animate-scale-in"
                style={{ animationDelay: `${0.6 + i * 0.1}s`, animationFillMode: 'backwards' }}
              >
                <item.icon className="h-4 w-4 text-primary" />
                <span className="text-sm text-gray-300">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <StatsDisplay stats={stats} />

          {/* Decorative Elements - CSS only */}
          <div 
            className="absolute bottom-8 left-8 flex items-center gap-2 text-gray-500 animate-fade-in"
            style={{ animationDelay: '1s', animationFillMode: 'backwards' }}
          >
            <div className="w-8 h-px bg-gradient-to-r from-transparent to-primary/50" />
            <span className="text-xs uppercase tracking-widest">Sistema de Gestão</span>
          </div>
        </div>

        {/* Vertical Separator - CSS only */}
        <div className="absolute right-0 top-0 bottom-0 w-px">
          <div 
            className="h-full w-full bg-gradient-to-b from-transparent via-primary/30 to-transparent animate-pulse"
            style={{ animationDuration: '3s' }}
          />
        </div>
      </div>

      {/* Right Panel - Form Side */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-6 lg:p-12 relative">
        {/* Mobile Background */}
        <div className="lg:hidden absolute inset-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
        </div>

        {/* Back Button */}
        <Link 
          to="/site" 
          className="absolute top-6 left-6 flex items-center gap-2 text-gray-500 hover:text-white transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm">Voltar</span>
        </Link>

        <div className="w-full max-w-md relative z-10 animate-fade-in">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4 animate-scale-in">
              <img 
                src={logoMoises} 
                alt="Moisés Medeiros - Curso de Química" 
                width={269}
                height={112}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="h-24 md:h-28 w-auto drop-shadow-2xl"
              />
            </div>
          </div>

          {/* Card */}
          <div className="relative rounded-2xl p-8 bg-[#111111]/90 backdrop-blur-xl border border-white/10 shadow-2xl">
            {/* Glow Effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
            
            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-16 h-px bg-gradient-to-r from-primary to-transparent" />
            <div className="absolute top-0 left-0 w-px h-16 bg-gradient-to-b from-primary to-transparent" />
            <div className="absolute bottom-0 right-0 w-16 h-px bg-gradient-to-l from-primary to-transparent" />
            <div className="absolute bottom-0 right-0 w-px h-16 bg-gradient-to-t from-primary to-transparent" />
            
            {/* Header */}
            <div className="text-center mb-8 relative">
              <div className="animate-fade-in">
                <div className="flex flex-col items-center justify-center gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Fingerprint className="h-5 w-5 text-primary" />
                    <span className="text-xs text-primary/80 uppercase tracking-widest font-medium">
                      {isLogin ? "Acesso Seguro" : "Novo Cadastro"}
                    </span>
                  </div>
                  <h2 className="text-lg md:text-xl font-bold text-white text-center leading-tight">
                    <EditableText
                      value={getValue(isLogin ? "auth_login_title" : "auth_signup_title", isLogin ? "GESTÃO CURSO QUÍMICA MOISÉS MEDEIROS" : "Criar Nova Conta")}
                      onSave={(v) => updateValue(isLogin ? "auth_login_title" : "auth_signup_title", v)}
                      isEditMode={isEditMode}
                      canEdit={canEdit}
                    />
                  </h2>
                </div>
                <p className="text-sm text-gray-400">
                  <EditableText
                    value={getValue(isLogin ? "auth_login_subtitle" : "auth_signup_subtitle", isLogin ? "Entre para acessar o sistema" : "Comece sua jornada de aprovação")}
                    onSave={(v) => updateValue(isLogin ? "auth_login_subtitle" : "auth_signup_subtitle", v)}
                    isEditMode={isEditMode}
                    canEdit={canEdit}
                  />
                </p>
              </div>
            </div>

            {/* Acesso Restrito Info */}
            {!isForgotPassword && (
              <div className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Acesso Restrito</p>
                    <p className="text-xs text-gray-400">
                      Apenas usuários pré-cadastrados podem acessar o sistema.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Forgot Password Mode */}
            {isForgotPassword ? (
              <div className="space-y-4">
                {resetEmailSent ? (
                  <div className="text-center py-8 animate-scale-in">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Mail className="h-8 w-8 text-green-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Email Enviado!</h3>
                    <p className="text-sm text-gray-400 mb-6">
                      Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
                    </p>
                    <Button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(false);
                        setResetEmailSent(false);
                      }}
                      className="bg-white/10 hover:bg-white/20 text-white"
                    >
                      Voltar para Login
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-semibold text-white mb-1">Recuperar Senha</h3>
                      <p className="text-sm text-gray-400">
                        Digite seu email para receber o link de recuperação
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="reset-email" className="text-sm font-medium text-gray-300">
                        Email
                      </Label>
                      <div className="relative mt-1.5">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          id="reset-email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="seu@email.com"
                          autoComplete="email"
                          className="pl-11 h-12 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>
                      {errors.email && (
                        <p className="text-xs text-red-400 mt-1" role="alert" aria-live="polite">{errors.email}</p>
                      )}
                    </div>
                    
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-primary via-[#B22222] to-primary text-white font-semibold shadow-xl shadow-primary/30 transition-all hover:scale-[1.02] hover:shadow-primary/50 active:scale-[0.98] disabled:opacity-50 border-0"
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        "Enviar Link de Recuperação"
                      )}
                    </Button>
                    
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(false)}
                      className="w-full text-sm text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Voltar para Login
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="animate-fade-in">
                  <Label htmlFor="nome" className="text-sm font-medium text-gray-300">
                    Nome Completo
                  </Label>
                  <div className={`relative mt-1.5 transition-all ${focusedField === 'nome' ? 'scale-[1.02]' : ''}`}>
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="nome"
                      name="nome"
                      type="text"
                      value={formData.nome}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('nome')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Seu nome completo"
                      className="pl-11 h-12 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                  {errors.nome && (
                    <p className="text-xs text-red-400 mt-1" role="alert" aria-live="polite">{errors.nome}</p>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-300">
                  Email
                </Label>
                <div className={`relative mt-1.5 transition-all ${focusedField === 'email' ? 'scale-[1.02]' : ''}`}>
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="seu@email.com"
                    autoComplete="email"
                    className="pl-11 h-12 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-400 mt-1" role="alert" aria-live="polite">{errors.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password" className="text-sm font-medium text-gray-300">
                  Senha
                </Label>
                <div className={`relative mt-1.5 transition-all ${focusedField === 'password' ? 'scale-[1.02]' : ''}`}>
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="••••••••"
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    className="pl-11 pr-11 h-12 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-400 mt-1" role="alert" aria-live="polite">{errors.password}</p>
                )}
                
                {!isLogin && formData.password && (
                  <div className="mt-3">
                    <PasswordStrengthMeter password={formData.password} showRequirements={true} />
                  </div>
                )}
                
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-xs text-primary hover:text-primary/80 hover:underline mt-2 transition-colors"
                  >
                    Esqueceu sua senha?
                  </button>
                )}
              </div>

              {!isLogin && (
                <div className="flex items-start gap-3 pt-2 animate-fade-in">
                  <Checkbox
                    id="acceptTerms"
                    checked={acceptTerms}
                    onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                    className="mt-0.5 border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <Label htmlFor="acceptTerms" className="text-xs text-gray-400 leading-relaxed cursor-pointer">
                    Eu li e concordo com os{" "}
                    <Link to="/termos" className="text-primary hover:underline" target="_blank">
                      Termos de Uso
                    </Link>{" "}
                    e a{" "}
                    <Link to="/privacidade" className="text-primary hover:underline" target="_blank">
                      Política de Privacidade
                    </Link>
                  </Label>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading || (!isLogin && !acceptTerms)}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-primary via-[#B22222] to-primary text-white font-semibold shadow-xl shadow-primary/30 transition-all hover:scale-[1.02] hover:shadow-primary/50 active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 border-0"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    {isLogin ? "Entrar" : "Criar Conta"}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-4 bg-[#111111] text-gray-500">ou continue com</span>
                </div>
              </div>

              {/* SSO Google Button */}
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  setIsLoading(true);
                  const { supabase } = await import("@/integrations/supabase/client");
                  const redirectUrl = `${window.location.origin}/`;
                  const { error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: { redirectTo: redirectUrl },
                  });
                  if (error) {
                    toast.error("Erro ao entrar com Google: " + error.message);
                  }
                  setIsLoading(false);
                }}
                disabled={isLoading}
                className="w-full h-12 rounded-xl bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="font-medium">Google</span>
              </Button>

              {/* Toggle Login/Signup */}
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setErrors({});
                    setFormData({ nome: "", email: "", password: "" });
                  }}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {isLogin ? (
                    <>Não tem conta? <span className="text-primary hover:underline">Criar conta</span></>
                  ) : (
                    <>Já tem conta? <span className="text-primary hover:underline">Fazer login</span></>
                  )}
                </button>
              </div>
            </form>
            )}

            {/* Security Badge - CSS animation */}
            <div className="mt-6 flex justify-center">
              <div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:border-primary/30 transition-colors duration-300"
              >
                <Shield className="h-4 w-4 text-green-500" />
                <span className="text-xs text-gray-400">
                  Conexão criptografada SSL
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-600 mt-6">
            © 2025 Prof. Moisés Medeiros. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
