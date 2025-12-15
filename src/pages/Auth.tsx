import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, User, Loader2, Eye, EyeOff, Sparkles, GraduationCap, Trophy, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email("Email inválido").max(255),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").max(100),
});

const signupSchema = loginSchema.extend({
  nome: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
});

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp, isLoading: authLoading } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
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
    setIsLoading(true);

    try {
      const schema = isLogin ? loginSchema : signupSchema;
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
    } catch (err) {
      toast.error("Erro ao processar solicitação");
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration - Heroic Theme */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
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
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm">Voltar ao site</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="wine-card rounded-3xl p-8 shadow-2xl border border-primary/20">
          {/* Logo/Brand - Heroic Style */}
          <div className="text-center mb-8">
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl brand-gradient mb-4 shadow-xl shadow-primary/30"
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
            
            {/* Heroic badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mt-3">
              <div className="w-2 h-2 rounded-full bg-stats-green animate-pulse" />
              <span className="text-xs text-primary font-medium">Sistema Ativo</span>
            </div>
          </div>

          {/* Tabs - Heroic Style */}
          <div className="flex gap-2 p-1.5 bg-secondary/50 rounded-xl mb-6 border border-border/30">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                isLogin 
                  ? "bg-primary text-primary-foreground shadow-lg heroic-glow" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                !isLogin 
                  ? "bg-primary text-primary-foreground shadow-lg heroic-glow" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Criar Conta
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Label htmlFor="nome" className="text-sm text-foreground font-medium">Nome Completo</Label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="nome"
                    name="nome"
                    type="text"
                    value={formData.nome}
                    onChange={handleChange}
                    placeholder="Seu nome"
                    className="pl-10 h-12 rounded-xl bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"
                  />
                </div>
                {errors.nome && <p className="text-xs text-destructive mt-1">{errors.nome}</p>}
              </motion.div>
            )}

            <div>
              <Label htmlFor="email" className="text-sm text-foreground font-medium">Email</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="seu@email.com"
                  className="pl-10 h-12 rounded-xl bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"
                />
              </div>
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
            </div>

            <div>
              <Label htmlFor="password" className="text-sm text-foreground font-medium">Senha</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="pl-10 pr-10 h-12 rounded-xl bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xl shadow-primary/25 heroic-glow"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {isLogin ? "Entrar no Sistema" : "Criar Minha Conta"}
                </>
              )}
            </Button>
          </form>

          {/* Heroic Stats */}
          <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-border/30">
            <div className="text-center">
              <p className="text-lg font-bold text-primary">17</p>
              <p className="text-xs text-muted-foreground">Módulos</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-stats-blue">100%</p>
              <p className="text-xs text-muted-foreground">Seguro</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-stats-gold">24/7</p>
              <p className="text-xs text-muted-foreground">Online</p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            Ao continuar, você concorda com nossos termos de uso e política de privacidade.
          </p>
        </div>
        
        {/* Powered by */}
        <p className="text-center text-xs text-muted-foreground/50 mt-4">
          Projeto Synapse v2.1 • Sistema Nervoso Digital
        </p>
      </motion.div>
    </div>
  );
}
