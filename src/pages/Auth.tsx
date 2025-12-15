// ============================================
// MOISES MEDEIROS v5.0 - AUTH PAGE
// Pilar 1: Segurança Zero Confiança
// Pilar 2: Acessibilidade WCAG 2.1 AA
// ============================================

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, 
  Lock, 
  User, 
  Loader2, 
  Eye, 
  EyeOff, 
  Sparkles, 
  GraduationCap, 
  Trophy, 
  ArrowLeft,
  Shield,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { simpleLoginSchema, simpleSignupSchema } from "@/lib/validations/schemas";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp, isLoading: authLoading } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [acceptTerms, setAcceptTerms] = useState(false);
  
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Validar termos no cadastro
    if (!isLogin && !acceptTerms) {
      toast.error("Você precisa aceitar os termos de uso e política de privacidade");
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
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Email ou senha incorretos");
          } else if (error.message.includes("Email not confirmed")) {
            toast.error("Por favor, confirme seu email antes de fazer login");
          } else {
            toast.error(error.message);
          }
          setIsLoading(false);
          return;
        }
        toast.success("Bem-vindo de volta!");
      } else {
        const { error } = await signUp(formData.email, formData.password, formData.nome);
        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("Este email já está cadastrado");
          } else if (error.message.includes("Password")) {
            toast.error("Senha não atende aos requisitos de segurança");
          } else {
            toast.error(error.message);
          }
          setIsLoading(false);
          return;
        }
        toast.success("Conta criada com sucesso! Verifique seu email.");
      }
    } catch (err) {
      toast.error("Erro ao processar solicitação");
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" role="status" aria-label="Carregando">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
        <span className="sr-only">Carregando autenticação...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Skip to main content - Acessibilidade */}
      <a 
        href="#auth-form" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg"
      >
        Pular para o formulário
      </a>

      {/* Background decoration - Heroic Theme */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {/* Vinho glow top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-primary/15 via-transparent to-transparent opacity-60" />
        {/* Blue glow right */}
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-radial from-stats-blue/10 via-transparent to-transparent opacity-50" />
        {/* Gold glow bottom */}
        <div className="absolute bottom-0 left-0 w-[600px] h-[400px] bg-gradient-radial from-stats-gold/8 via-transparent to-transparent opacity-40" />
        
        {/* Animated orbs */}
        <motion.div
          className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-primary/5 blur-3xl"
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ repeat: Infinity, duration: 6 }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/4 w-48 h-48 rounded-full bg-stats-blue/5 blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ repeat: Infinity, duration: 8, delay: 2 }}
        />
      </div>

      {/* Back to site link */}
      <Link 
        to="/site" 
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg p-1"
        aria-label="Voltar ao site principal"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        <span className="text-sm">Voltar ao site</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="wine-card rounded-3xl p-8 shadow-2xl border border-primary/20">
          {/* Logo/Brand - Heroic Style */}
          <header className="text-center mb-8">
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl brand-gradient mb-4 shadow-xl shadow-primary/30"
              aria-hidden="true"
            >
              <GraduationCap className="h-10 w-10 text-primary-foreground" />
              <motion.div
                className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-stats-gold flex items-center justify-center"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Trophy className="h-3 w-3 text-background" />
              </motion.div>
            </motion.div>
            <h1 className="text-2xl font-bold text-foreground hero-title">
              <span className="brand-text">Prof. Moisés</span> Medeiros
            </h1>
            <p className="text-muted-foreground mt-2">Sistema de Gestão</p>
            
            {/* Security badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-stats-green/10 border border-stats-green/20 mt-3">
              <Shield className="w-3.5 h-3.5 text-stats-green" aria-hidden="true" />
              <span className="text-xs text-stats-green font-medium">Conexão Segura</span>
            </div>
          </header>

          {/* Tabs - Heroic Style with ARIA */}
          <div className="flex gap-2 p-1.5 bg-secondary/50 rounded-xl mb-6 border border-border/30" role="tablist" aria-label="Tipo de acesso">
            <button
              role="tab"
              aria-selected={isLogin}
              aria-controls="auth-form"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isLogin 
                  ? "bg-primary text-primary-foreground shadow-lg heroic-glow" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Entrar
            </button>
            <button
              role="tab"
              aria-selected={!isLogin}
              aria-controls="auth-form"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                !isLogin 
                  ? "bg-primary text-primary-foreground shadow-lg heroic-glow" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Criar Conta
            </button>
          </div>

          {/* Form */}
          <form id="auth-form" onSubmit={handleSubmit} className="space-y-4" role="tabpanel" aria-label={isLogin ? "Formulário de login" : "Formulário de cadastro"}>
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  key="nome-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Label htmlFor="nome" className="text-sm text-foreground font-medium">
                    Nome Completo <span className="text-destructive" aria-hidden="true">*</span>
                  </Label>
                  <div className="relative mt-1.5">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <Input
                      id="nome"
                      name="nome"
                      type="text"
                      value={formData.nome}
                      onChange={handleChange}
                      placeholder="Seu nome completo"
                      autoComplete="name"
                      aria-required="true"
                      aria-invalid={!!errors.nome}
                      aria-describedby={errors.nome ? "nome-error" : undefined}
                      className="pl-10 h-12 rounded-xl bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"
                    />
                  </div>
                  {errors.nome && (
                    <p id="nome-error" className="text-xs text-destructive mt-1" role="alert">
                      {errors.nome}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <Label htmlFor="email" className="text-sm text-foreground font-medium">
                Email <span className="text-destructive" aria-hidden="true">*</span>
              </Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="seu@email.com"
                  autoComplete="email"
                  aria-required="true"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className="pl-10 h-12 rounded-xl bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"
                />
              </div>
              {errors.email && (
                <p id="email-error" className="text-xs text-destructive mt-1" role="alert">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="password" className="text-sm text-foreground font-medium">
                Senha <span className="text-destructive" aria-hidden="true">*</span>
              </Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  aria-required="true"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "password-error" : "password-requirements"}
                  className="pl-10 pr-10 h-12 rounded-xl bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="text-xs text-destructive mt-1" role="alert">
                  {errors.password}
                </p>
              )}
              
              {/* Password Strength Meter - apenas no cadastro */}
              {!isLogin && formData.password && (
                <div className="mt-3">
                  <PasswordStrengthMeter password={formData.password} showRequirements={true} />
                </div>
              )}
            </div>

            {/* Terms acceptance - apenas no cadastro */}
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  key="terms-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-3 pt-2"
                >
                  <Checkbox
                    id="acceptTerms"
                    checked={acceptTerms}
                    onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                    aria-describedby="terms-description"
                    className="mt-0.5"
                  />
                  <Label 
                    htmlFor="acceptTerms" 
                    id="terms-description"
                    className="text-xs text-muted-foreground leading-relaxed cursor-pointer"
                  >
                    Eu li e concordo com os{" "}
                    <Link to="/termos" className="text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded" target="_blank">
                      Termos de Uso
                    </Link>{" "}
                    e a{" "}
                    <Link to="/privacidade" className="text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded" target="_blank">
                      Política de Privacidade
                    </Link>
                  </Label>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              disabled={isLoading || (!isLogin && !acceptTerms)}
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xl shadow-primary/25 heroic-glow disabled:opacity-50 disabled:cursor-not-allowed"
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" aria-hidden="true" />
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" aria-hidden="true" />
                  {isLogin ? "Entrar no Sistema" : "Criar Minha Conta"}
                </>
              )}
            </Button>

            {/* Forgot password link - apenas no login */}
            {isLogin && (
              <p className="text-center text-sm text-muted-foreground">
                <button
                  type="button"
                  className="text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                  onClick={() => toast.info("Funcionalidade em desenvolvimento")}
                >
                  Esqueci minha senha
                </button>
              </p>
            )}
          </form>

          {/* Security Features */}
          <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-border/30">
            <div className="text-center">
              <div className="flex justify-center mb-1">
                <Shield className="h-4 w-4 text-primary" aria-hidden="true" />
              </div>
              <p className="text-xs text-muted-foreground">SSL/TLS</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-1">
                <Lock className="h-4 w-4 text-stats-blue" aria-hidden="true" />
              </div>
              <p className="text-xs text-muted-foreground">Criptografia</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-1">
                <CheckCircle2 className="h-4 w-4 text-stats-green" aria-hidden="true" />
              </div>
              <p className="text-xs text-muted-foreground">LGPD</p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            Seus dados estão protegidos de acordo com a{" "}
            <Link to="/privacidade" className="text-primary hover:underline">
              Lei Geral de Proteção de Dados
            </Link>
          </p>
        </div>
        
        {/* Powered by */}
        <p className="text-center text-xs text-muted-foreground/50 mt-4">
          Moisés Medeiros v5.0 • Sistema Nervoso Digital
        </p>
      </motion.div>
    </div>
  );
}
