// ============================================
// MOISÉS MEDEIROS v8.0 - AUTH PAGE
// Design Premium: Glassmorphism + Química Visual
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
  CheckCircle2,
  Atom,
  FlaskConical,
  Beaker,
  Zap,
  Star,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { simpleLoginSchema, simpleSignupSchema } from "@/lib/validations/schemas";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import professorPhoto from "@/assets/professor-moises.jpg";

// Floating Chemistry Elements
function FloatingElements() {
  const elements = [
    { symbol: "H", name: "Hidrogênio", color: "from-blue-500/20 to-cyan-500/20" },
    { symbol: "O", name: "Oxigênio", color: "from-red-500/20 to-orange-500/20" },
    { symbol: "C", name: "Carbono", color: "from-gray-500/20 to-slate-500/20" },
    { symbol: "N", name: "Nitrogênio", color: "from-purple-500/20 to-violet-500/20" },
    { symbol: "Fe", name: "Ferro", color: "from-amber-500/20 to-yellow-500/20" },
    { symbol: "Au", name: "Ouro", color: "from-yellow-400/20 to-amber-400/20" },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {elements.map((el, i) => (
        <motion.div
          key={el.symbol}
          className={`absolute w-16 h-16 rounded-2xl bg-gradient-to-br ${el.color} backdrop-blur-sm border border-white/10 flex items-center justify-center shadow-xl`}
          initial={{ 
            x: Math.random() * 100 + "%", 
            y: Math.random() * 100 + "%",
            rotate: 0,
            scale: 0
          }}
          animate={{ 
            y: [
              `${20 + i * 10}%`,
              `${30 + i * 8}%`,
              `${20 + i * 10}%`
            ],
            rotate: [0, 10, -10, 0],
            scale: 1
          }}
          transition={{ 
            y: { repeat: Infinity, duration: 6 + i * 2, ease: "easeInOut" },
            rotate: { repeat: Infinity, duration: 8 + i, ease: "easeInOut" },
            scale: { duration: 0.5, delay: i * 0.1 }
          }}
          style={{ left: `${10 + i * 15}%` }}
        >
          <span className="text-2xl font-bold text-white/60">{el.symbol}</span>
        </motion.div>
      ))}
    </div>
  );
}

// Animated DNA Helix
function DNAHelix() {
  return (
    <div className="absolute right-0 top-0 bottom-0 w-32 overflow-hidden opacity-20">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-4 h-4 rounded-full bg-primary"
          animate={{
            x: [0, 20, 0, -20, 0],
            scale: [1, 1.2, 1, 0.8, 1],
          }}
          transition={{
            duration: 4,
            delay: i * 0.3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ top: `${i * 8}%`, left: "50%" }}
        />
      ))}
    </div>
  );
}

// Stats Counter
function StatsBar() {
  const stats = [
    { value: "12.847+", label: "Alunos", icon: GraduationCap },
    { value: "4.892+", label: "Aprovados", icon: Trophy },
    { value: "98%", label: "Satisfação", icon: Star },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="flex justify-center gap-6 mt-6"
    >
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 + i * 0.1 }}
          className="flex items-center gap-2"
        >
          <stat.icon className="h-4 w-4 text-primary" />
          <div>
            <p className="text-sm font-bold text-foreground">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp, isLoading: authLoading } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
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
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Email ou senha incorretos");
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
          } else {
            toast.error(error.message);
          }
          setIsLoading(false);
          return;
        }
        toast.success("Conta criada com sucesso!");
      }
    } catch {
      toast.error("Erro ao processar solicitação");
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        >
          <Atom className="h-12 w-12 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex dark relative overflow-hidden">
      {/* Left Panel - Visual Side */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <FloatingElements />
        <DNAHelix />
        
        {/* Main Content */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12">
          {/* Logo Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/40 to-secondary/40 rounded-3xl blur-2xl" />
              <div className="relative w-32 h-32 rounded-3xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-2xl border border-primary/50">
                <Atom className="h-16 w-16 text-primary-foreground" />
              </div>
              <motion.div
                className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-stats-green flex items-center justify-center border-4 border-background shadow-lg"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <CheckCircle2 className="h-5 w-5 text-white" />
              </motion.div>
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl xl:text-5xl font-bold text-foreground mb-3">
              Prof. <span className="brand-text">Moisés Medeiros</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              O professor que mais aprova em Medicina
            </p>
          </motion.div>

          {/* Professor Photo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="relative mb-8"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-secondary/30 rounded-full blur-2xl scale-110" />
            <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-primary/40 shadow-2xl">
              <img 
                src={professorPhoto} 
                alt="Professor Moisés" 
                className="w-full h-full object-cover object-top"
              />
            </div>
            <motion.div
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-lg"
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                +15 anos de experiência
              </span>
            </motion.div>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-3 gap-4 max-w-lg"
          >
            {[
              { icon: FlaskConical, label: "Química Completa" },
              { icon: GraduationCap, label: "Metodologia Exclusiva" },
              { icon: Trophy, label: "Resultados Comprovados" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <span className="text-xs font-medium text-center text-muted-foreground">{item.label}</span>
              </motion.div>
            ))}
          </motion.div>

          <StatsBar />
        </div>

        {/* Decorative gradient line */}
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary/30 to-transparent" />
      </div>

      {/* Right Panel - Form Side */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-6 lg:p-12 relative">
        {/* Mobile Background */}
        <div className="lg:hidden absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-radial from-primary/20 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-radial from-secondary/20 to-transparent rounded-full blur-3xl" />
        </div>

        {/* Back Button */}
        <Link 
          to="/site" 
          className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm">Voltar</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 mb-4 shadow-xl"
            >
              <Atom className="h-8 w-8 text-primary-foreground" />
            </motion.div>
            <h1 className="text-2xl font-bold text-foreground">
              Prof. <span className="brand-text">Moisés</span>
            </h1>
          </div>

          {/* Card */}
          <div className="glass-card rounded-3xl p-8 shadow-2xl border border-primary/20">
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                key={isLogin ? "login" : "signup"}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {isLogin ? "Bem-vindo de volta!" : "Crie sua conta"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isLogin 
                    ? "Entre para acessar o sistema de gestão" 
                    : "Comece sua jornada de aprovação"
                  }
                </p>
              </motion.div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-muted/50 rounded-xl mb-6">
              {["Entrar", "Criar Conta"].map((tab, i) => (
                <button
                  key={tab}
                  onClick={() => setIsLogin(i === 0)}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                    (i === 0 ? isLogin : !isLogin)
                      ? "bg-primary text-primary-foreground shadow-lg" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    key="nome"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Label htmlFor="nome" className="text-sm font-medium">
                      Nome Completo
                    </Label>
                    <div className={`relative mt-1.5 transition-all ${focusedField === 'nome' ? 'scale-[1.02]' : ''}`}>
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="nome"
                        name="nome"
                        type="text"
                        value={formData.nome}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('nome')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="Seu nome completo"
                        className="pl-11 h-12 rounded-xl bg-background/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    {errors.nome && (
                      <p className="text-xs text-destructive mt-1">{errors.nome}</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <div className={`relative mt-1.5 transition-all ${focusedField === 'email' ? 'scale-[1.02]' : ''}`}>
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                    className="pl-11 h-12 rounded-xl bg-background/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-destructive mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password" className="text-sm font-medium">
                  Senha
                </Label>
                <div className={`relative mt-1.5 transition-all ${focusedField === 'password' ? 'scale-[1.02]' : ''}`}>
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                    className="pl-11 pr-11 h-12 rounded-xl bg-background/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive mt-1">{errors.password}</p>
                )}
                
                {!isLogin && formData.password && (
                  <div className="mt-3">
                    <PasswordStrengthMeter password={formData.password} showRequirements={true} />
                  </div>
                )}
              </div>

              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    key="terms"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-start gap-3 pt-2"
                  >
                    <Checkbox
                      id="acceptTerms"
                      checked={acceptTerms}
                      onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                      className="mt-0.5"
                    />
                    <Label htmlFor="acceptTerms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                      Eu li e concordo com os{" "}
                      <Link to="/termos" className="text-primary hover:underline" target="_blank">
                        Termos de Uso
                      </Link>{" "}
                      e a{" "}
                      <Link to="/privacidade" className="text-primary hover:underline" target="_blank">
                        Política de Privacidade
                      </Link>
                    </Label>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                type="submit"
                disabled={isLoading || (!isLogin && !acceptTerms)}
                className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xl shadow-primary/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
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
            </form>

            {/* Security Badge */}
            <div className="mt-6 flex justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/50">
                <Shield className="h-4 w-4 text-stats-green" />
                <span className="text-xs text-muted-foreground">Conexão 100% segura</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            © 2024 Prof. Moisés Medeiros. Todos os direitos reservados.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
