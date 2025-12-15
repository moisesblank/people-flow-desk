// ============================================
// MOISÉS MEDEIROS v9.0 - AUTH PAGE
// Design: Futurista Spider-Man / Vermelho Vinho
// Estética: Cyber-Tech Profissional
// ============================================

import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, 
  Lock, 
  User, 
  Loader2, 
  Eye, 
  EyeOff, 
  ArrowLeft,
  Shield,
  Atom,
  Zap,
  ArrowRight,
  Hexagon,
  CircuitBoard,
  Fingerprint
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
import { useEditableContent } from "@/hooks/useEditableContent";
import { EditableText } from "@/components/editor/EditableText";
import { EditableImage } from "@/components/editor/EditableImage";
import { EditModeToggle } from "@/components/editor/EditModeToggle";

// Animated Cyber Grid Background
function CyberGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Grid Pattern */}
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
      
      {/* Animated Lines */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={`h-${i}`}
          className="absolute h-px w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent"
          style={{ top: `${20 + i * 20}%` }}
          animate={{
            opacity: [0.1, 0.4, 0.1],
            scaleX: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 4 + i,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.5,
          }}
        />
      ))}
      
      {/* Floating Hexagons */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`hex-${i}`}
          className="absolute"
          style={{
            left: `${10 + (i % 4) * 25}%`,
            top: `${15 + Math.floor(i / 4) * 50}%`,
          }}
          animate={{
            y: [0, -20, 0],
            rotate: [0, 180, 360],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.3,
          }}
        >
          <Hexagon className="w-8 h-8 text-primary/20" strokeWidth={1} />
        </motion.div>
      ))}
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

// Glowing Orbs
function GlowingOrbs() {
  return (
    <>
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(139, 0, 0, 0.15) 0%, transparent 70%)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(80, 0, 0, 0.2) 0%, transparent 70%)',
        }}
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </>
  );
}

// Circuit Lines Animation
function CircuitLines() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: `${i * 20}%`,
            top: 0,
            width: '2px',
            height: '100%',
          }}
        >
          <motion.div
            className="w-full h-20 bg-gradient-to-b from-transparent via-primary/40 to-transparent"
            animate={{
              y: ['-100%', '500%'],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              ease: "linear",
              delay: i * 0.8,
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}

// Stats Display
function StatsDisplay({ stats }: { stats: { value: string; label: string }[] }) {
  return (
    <div className="grid grid-cols-3 gap-6 mt-8 w-full max-w-md">
      {stats.map((stat, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 + i * 0.1 }}
          className="text-center p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
          whileHover={{ 
            borderColor: 'rgba(139, 0, 0, 0.5)',
            backgroundColor: 'rgba(139, 0, 0, 0.1)'
          }}
        >
          <motion.div
            className="text-2xl xl:text-3xl font-bold text-primary"
            animate={{ 
              textShadow: [
                '0 0 10px rgba(139, 0, 0, 0.5)',
                '0 0 20px rgba(139, 0, 0, 0.8)',
                '0 0 10px rgba(139, 0, 0, 0.5)',
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {stat.value}
          </motion.div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
            {stat.label}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp, isLoading: authLoading } = useAuth();
  
  const { 
    isEditMode, 
    canEdit, 
    toggleEditMode, 
    getValue, 
    updateValue, 
    uploadImage 
  } = useEditableContent("auth");

  const stats = [
    { value: "12.847+", label: "Alunos" },
    { value: "4.892+", label: "Aprovados" },
    { value: "98%", label: "Satisfação" },
  ];
  
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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
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
    <div className="min-h-screen bg-[#0a0a0a] flex relative overflow-hidden">
      <EditModeToggle 
        isEditMode={isEditMode} 
        canEdit={canEdit} 
        onToggle={toggleEditMode} 
      />
      
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
          {/* Logo / Brand */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8"
          >
            <div className="relative">
              {/* Glow Effect */}
              <motion.div
                className="absolute inset-0 rounded-full blur-3xl"
                style={{ background: 'radial-gradient(circle, rgba(139, 0, 0, 0.4) 0%, transparent 70%)' }}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              
              {/* Hexagonal Frame */}
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                  <motion.polygon
                    points="50,2 95,25 95,75 50,98 5,75 5,25"
                    fill="none"
                    stroke="url(#hexGradient)"
                    strokeWidth="1"
                    animate={{
                      strokeDasharray: ['0,1000', '1000,0'],
                    }}
                    transition={{ duration: 3, ease: "easeInOut" }}
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
                <EditableImage
                  src={getValue("auth_professor_photo", professorPhoto)}
                  alt="Professor Moisés"
                  onUpload={async (file) => {
                    return await uploadImage("auth_professor_photo", file);
                  }}
                  isEditMode={isEditMode}
                  canEdit={canEdit}
                  className="w-full h-full object-cover object-top"
                  containerClassName="w-32 h-32 rounded-full overflow-hidden border-2 border-primary/50"
                />
              </div>
              
              {/* Status Indicator */}
              <motion.div
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary/90 to-[#DC143C]/90 backdrop-blur-sm border border-primary/30"
                animate={{ 
                  boxShadow: [
                    '0 0 10px rgba(139, 0, 0, 0.3)',
                    '0 0 20px rgba(139, 0, 0, 0.6)',
                    '0 0 10px rgba(139, 0, 0, 0.3)',
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="flex items-center gap-1.5 text-xs font-semibold text-white">
                  <Zap className="h-3 w-3" />
                  VERIFICADO
                </span>
              </motion.div>
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-6"
          >
            <h1 className="text-4xl xl:text-5xl font-bold text-white mb-3">
              <span className="text-gray-400">Prof.</span>{" "}
              <span className="bg-gradient-to-r from-primary via-[#DC143C] to-primary bg-clip-text text-transparent">
                <EditableText
                  value={getValue("auth_title_name", "Moisés Medeiros")}
                  onSave={(v) => updateValue("auth_title_name", v)}
                  isEditMode={isEditMode}
                  canEdit={canEdit}
                />
              </span>
            </h1>
            <motion.p
              className="text-lg text-gray-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <EditableText
                value={getValue("auth_subtitle", "O professor que mais aprova em Medicina")}
                onSave={(v) => updateValue("auth_subtitle", v)}
                isEditMode={isEditMode}
                canEdit={canEdit}
              />
            </motion.p>
          </motion.div>

          {/* Feature Pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap justify-center gap-3 mb-8"
          >
            {[
              { icon: Atom, label: "Química Completa" },
              { icon: CircuitBoard, label: "Metodologia Exclusiva" },
              { icon: Shield, label: "Resultados Comprovados" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm"
                whileHover={{ 
                  scale: 1.05, 
                  borderColor: 'rgba(139, 0, 0, 0.5)',
                  backgroundColor: 'rgba(139, 0, 0, 0.1)'
                }}
              >
                <item.icon className="h-4 w-4 text-primary" />
                <span className="text-sm text-gray-300">{item.label}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Stats */}
          <StatsDisplay stats={stats} />

          {/* Decorative Elements */}
          <motion.div
            className="absolute bottom-8 left-8 flex items-center gap-2 text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <div className="w-8 h-px bg-gradient-to-r from-transparent to-primary/50" />
            <span className="text-xs uppercase tracking-widest">Sistema de Gestão</span>
          </motion.div>
        </div>

        {/* Vertical Separator */}
        <div className="absolute right-0 top-0 bottom-0 w-px">
          <motion.div
            className="h-full w-full bg-gradient-to-b from-transparent via-primary/30 to-transparent"
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ duration: 3, repeat: Infinity }}
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
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-[#DC143C] mb-4 shadow-xl shadow-primary/30"
            >
              <Atom className="h-8 w-8 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-white">
              Prof. <span className="text-primary">Moisés</span>
            </h1>
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
              <motion.div
                key={isLogin ? "login" : "signup"}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Fingerprint className="h-5 w-5 text-primary" />
                  <h2 className="text-2xl font-bold text-white">
                    <EditableText
                      value={getValue(isLogin ? "auth_login_title" : "auth_signup_title", isLogin ? "Acesso Seguro" : "Nova Conta")}
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
              </motion.div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-white/5 rounded-xl mb-6 border border-white/5">
              {[
                { key: "auth_tab_login", default: "Entrar", isActive: isLogin },
                { key: "auth_tab_signup", default: "Criar Conta", isActive: !isLogin }
              ].map((tab, i) => (
                <button
                  key={tab.key}
                  onClick={() => setIsLogin(i === 0)}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                    tab.isActive
                      ? "bg-gradient-to-r from-primary to-[#DC143C] text-white shadow-lg shadow-primary/30" 
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <EditableText
                    value={getValue(tab.key, tab.default)}
                    onSave={(v) => updateValue(tab.key, v)}
                    isEditMode={isEditMode}
                    canEdit={canEdit}
                  />
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
                      <p className="text-xs text-red-400 mt-1">{errors.nome}</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

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
                  <p className="text-xs text-red-400 mt-1">{errors.email}</p>
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
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-400 mt-1">{errors.password}</p>
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
                  </motion.div>
                )}
              </AnimatePresence>

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
            </form>

            {/* Security Badge */}
            <div className="mt-6 flex justify-center">
              <motion.div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10"
                animate={{
                  borderColor: ['rgba(255,255,255,0.1)', 'rgba(139,0,0,0.3)', 'rgba(255,255,255,0.1)'],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Shield className="h-4 w-4 text-green-500" />
                <span className="text-xs text-gray-400">
                  Conexão criptografada SSL
                </span>
              </motion.div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-600 mt-6">
            © 2024 Prof. Moisés Medeiros. Todos os direitos reservados.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
