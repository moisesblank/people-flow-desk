// ============================================
// MOISÉS MEDEIROS v10.1 - AUTH PAGE
// P0 FIX v3.1: Bloqueia redirect se password_change_pending
// Design: SPIDER-MAN CINEMATIC 2300
// Estética: Vermelho/Azul Heroico • Cinematográfico
// Performance: CSS-only GPU-accelerated
// ============================================

import "@/styles/auth-spiderman-2300.css";

import { useState, useEffect, lazy, Suspense, useCallback, forwardRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
// 🛡️ ERRADICADO: CloudflareTurnstile removido (anti-bot-eradication-protocol-v1-0-0)
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
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { formatError } from "@/lib/utils/formatError";
import { useAuth } from "@/hooks/useAuth";
// 2FA Decision Engine (SYNAPSE Ω v10.x) com cache de confiança
import { useDeviceFingerprint, decide2FA, setTrustCache } from "@/hooks/auth";
import { simpleLoginSchema, simpleSignupSchema } from "@/lib/validations/schemas";
import professorPhoto from "@/assets/professor-moises-novo.jpg";
import logoMoises from "@/assets/logo-moises-medeiros.png";
import { useEditableContent } from "@/hooks/useEditableContent";
import { OptimizedImage } from "@/components/ui/optimized-image";
// P1-2 SECURITY FIX: Turnstile bypass agora via role, não email
// Esta função será chamada apenas após login quando role estiver disponível

import { getPostLoginRedirect } from "@/core/urlAccessControl";
import { registerDeviceBeforeSession, getDeviceErrorMessage } from "@/lib/deviceRegistration";
import { useDeviceGateStore, DeviceGatePayload, DeviceInfo, CurrentDeviceInfo } from "@/state/deviceGateStore";
import { useSameTypeReplacementStore } from "@/state/sameTypeReplacementStore";
import { collectFingerprintRawData, generateDeviceName } from "@/lib/deviceFingerprintRaw";
import { useConstitutionPerformance } from "@/hooks/useConstitutionPerformance";

// 🛡️ CRITÉRIO EXPLÍCITO: Getter para setLoginIntent (evita re-render desnecessário)
const getDeviceGateActions = () => useDeviceGateStore.getState();
// 🛡️ BEYOND_THE_3_DEVICES: Getter para SameTypeReplacementStore
const getSameTypeReplacementActions = () => useSameTypeReplacementStore.getState();

// Lazy load componentes pesados (apenas owner usa)
const EditableText = lazy(() => import("@/components/editor/EditableText").then((m) => ({ default: m.EditableText })));
const EditableImage = lazy(() =>
  import("@/components/editor/EditableImage").then((m) => ({ default: m.EditableImage })),
);
const EditModeToggle = lazy(() =>
  import("@/components/editor/EditModeToggle").then((m) => ({ default: m.EditModeToggle })),
);
const TwoFactorVerification = lazy(() =>
  import("@/components/auth/TwoFactorVerification").then((m) => ({ default: m.TwoFactorVerification })),
);
const PasswordStrengthMeter = lazy(() =>
  import("@/components/auth/PasswordStrengthMeter").then((m) => ({ default: m.PasswordStrengthMeter })),
);
const ForcePasswordChange = lazy(() =>
  import("@/components/auth/ForcePasswordChange").then((m) => ({ default: m.ForcePasswordChange })),
);

// ============================================
// 🕷️ SPIDER-MAN CINEMATIC 2300 COMPONENTS
// Performance: CSS-only GPU-accelerated animations
// Cores: Vermelho/Azul heroico profundo
// ============================================

// Spider-Man Deep Space Background (STATIC - no animations per user request)
// ✅ forwardRef para evitar "Function components cannot be given refs"

const SpiderBackground = forwardRef<HTMLDivElement>((_, ref) => (
  <div
    ref={ref}
    className="absolute inset-0 pointer-events-none"
    style={{
      background: "linear-gradient(135deg, hsl(230 40% 6%) 0%, hsl(230 40% 3%) 100%)",
    }}
  />
));
SpiderBackground.displayName = "SpiderBackground";

// Spider Eyes - DISABLED per user request (no animated glows)
const SpiderEyes = forwardRef<HTMLDivElement>((_, ref) => <span ref={ref} />);
SpiderEyes.displayName = "SpiderEyes";

// Energy Veins - DISABLED per user request (no animated lines)
const SpiderVeins = forwardRef<HTMLDivElement>((_, ref) => <span ref={ref} />);
SpiderVeins.displayName = "SpiderVeins";

// Spider Card Frame - Tech Interface
function SpiderCardFrame() {
  return (
    <>
      {/* Animated corner brackets - Red/Blue */}
      <div className="absolute -top-1 -left-1 w-8 h-8 border-l-2 border-t-2 spider-corner spider-corner-red" />
      <div
        className="absolute -top-1 -right-1 w-8 h-8 border-r-2 border-t-2 spider-corner spider-corner-blue"
        style={{ animationDelay: "0.6s" }}
      />
      <div
        className="absolute -bottom-1 -left-1 w-8 h-8 border-l-2 border-b-2 spider-corner spider-corner-blue"
        style={{ animationDelay: "1.2s" }}
      />
      <div
        className="absolute -bottom-1 -right-1 w-8 h-8 border-r-2 border-b-2 spider-corner spider-corner-red"
        style={{ animationDelay: "1.8s" }}
      />

      {/* Scanning beam effect - Red/Blue gradient */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
        <div className="spider-card-scan absolute inset-x-0 h-[2px]" />
      </div>
    </>
  );
}

// Holographic Grid 2300
function HolographicGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Primary hex grid */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.08]" preserveAspectRatio="none">
        <defs>
          <pattern id="hexGrid2300" x="0" y="0" width="50" height="43.4" patternUnits="userSpaceOnUse">
            <path
              d="M25,0 L50,14.4 L50,28.9 L25,43.4 L0,28.9 L0,14.4 Z"
              fill="none"
              stroke="url(#holoGradient)"
              strokeWidth="0.5"
            />
          </pattern>
          <linearGradient id="holoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(185 100% 50%)" />
            <stop offset="50%" stopColor="hsl(280 100% 60%)" />
            <stop offset="100%" stopColor="hsl(320 100% 60%)" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#hexGrid2300)" />
      </svg>

      {/* Energy flow lines */}
      <div className="absolute inset-0">
        <div
          className="absolute h-px w-full auth-energy-flow"
          style={{
            top: "25%",
            background: "linear-gradient(90deg, transparent, hsl(var(--holo-cyan) / 0.4), transparent)",
          }}
        />
        <div
          className="absolute h-px w-full auth-energy-flow-reverse"
          style={{
            top: "75%",
            background: "linear-gradient(90deg, transparent, hsl(var(--holo-purple) / 0.4), transparent)",
          }}
        />
      </div>
    </div>
  );
}

// Orbital Ring System
function OrbitalRings() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      {/* Ring 1 - Outer */}
      <div
        className="absolute w-[800px] h-[800px] rounded-full border border-holo-cyan/20 auth-orbital-ring"
        style={{
          boxShadow: "inset 0 0 60px hsl(var(--holo-cyan) / 0.1), 0 0 60px hsl(var(--holo-cyan) / 0.05)",
        }}
      />
      {/* Ring 2 - Middle */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full border border-holo-purple/20 auth-orbital-ring-reverse"
        style={{
          boxShadow: "inset 0 0 40px hsl(var(--holo-purple) / 0.1), 0 0 40px hsl(var(--holo-purple) / 0.05)",
        }}
      />
      {/* Ring 3 - Inner */}
      <div
        className="absolute w-[400px] h-[400px] rounded-full border border-primary/30 auth-orbital-ring"
        style={{
          animationDuration: "15s",
          boxShadow: "inset 0 0 30px hsl(var(--primary) / 0.15), 0 0 30px hsl(var(--primary) / 0.1)",
        }}
      />

      {/* Orbital nodes */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => (
        <div
          key={i}
          className="absolute w-3 h-3 rounded-full auth-orbital-node"
          style={{
            background: i % 2 === 0 ? "hsl(var(--holo-cyan))" : "hsl(var(--holo-purple))",
            boxShadow:
              i % 2 === 0
                ? "0 0 15px hsl(var(--holo-cyan)), 0 0 30px hsl(var(--holo-cyan) / 0.5)"
                : "0 0 15px hsl(var(--holo-purple)), 0 0 30px hsl(var(--holo-purple) / 0.5)",
            transform: `rotate(${angle}deg) translateX(300px)`,
            animationDelay: `${i * 0.5}s`,
          }}
        />
      ))}
    </div>
  );
}

// DNA Helix Animation
function DNAHelix() {
  return (
    <div className="absolute left-8 top-0 bottom-0 w-16 overflow-hidden pointer-events-none opacity-40">
      <div className="auth-dna-helix h-full">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="absolute w-full flex justify-between items-center" style={{ top: `${i * 8.33}%` }}>
            <div
              className="w-3 h-3 rounded-full auth-dna-node-left"
              style={{
                background: "hsl(var(--holo-cyan))",
                boxShadow: "0 0 10px hsl(var(--holo-cyan))",
                animationDelay: `${i * 0.2}s`,
              }}
            />
            <div
              className="flex-1 h-px mx-1"
              style={{
                background: "linear-gradient(90deg, hsl(var(--holo-cyan) / 0.5), hsl(var(--holo-purple) / 0.5))",
              }}
            />
            <div
              className="w-3 h-3 rounded-full auth-dna-node-right"
              style={{
                background: "hsl(var(--holo-purple))",
                boxShadow: "0 0 10px hsl(var(--holo-purple))",
                animationDelay: `${i * 0.2 + 0.5}s`,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// Cosmic Background with Stars
function CosmicBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Deep space gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 30% 20%, hsl(280 40% 8% / 0.8) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, hsl(185 40% 5% / 0.6) 0%, transparent 50%)",
        }}
      />

      {/* Twinkling stars */}
      {[...Array(40)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full auth-star"
          style={{
            width: `${1 + Math.random() * 2}px`,
            height: `${1 + Math.random() * 2}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: "#fff",
            animationDelay: `${Math.random() * 4}s`,
            animationDuration: `${2 + Math.random() * 3}s`,
          }}
        />
      ))}

      {/* Nebula glow spots */}
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl"
        style={{
          background: "radial-gradient(circle, hsl(var(--holo-purple) / 0.1) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute top-1/2 right-1/3 w-64 h-64 rounded-full blur-3xl"
        style={{
          background: "radial-gradient(circle, hsl(var(--holo-cyan) / 0.08) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}

// Holographic Card Frame
function HoloCardFrame() {
  return (
    <>
      {/* Animated corner brackets */}
      <div className="absolute -top-1 -left-1 w-8 h-8 border-l-2 border-t-2 border-holo-cyan/60 auth-corner-pulse" />
      <div
        className="absolute -top-1 -right-1 w-8 h-8 border-r-2 border-t-2 border-holo-purple/60 auth-corner-pulse"
        style={{ animationDelay: "0.5s" }}
      />
      <div
        className="absolute -bottom-1 -left-1 w-8 h-8 border-l-2 border-b-2 border-holo-purple/60 auth-corner-pulse"
        style={{ animationDelay: "1s" }}
      />
      <div
        className="absolute -bottom-1 -right-1 w-8 h-8 border-r-2 border-b-2 border-holo-cyan/60 auth-corner-pulse"
        style={{ animationDelay: "1.5s" }}
      />

      {/* Scanning beam effect */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
        <div
          className="auth-card-scan absolute inset-x-0 h-px"
          style={{
            background: "linear-gradient(90deg, transparent, hsl(var(--holo-cyan) / 0.8), transparent)",
            boxShadow: "0 0 20px hsl(var(--holo-cyan) / 0.5)",
          }}
        />
      </div>
    </>
  );
}

// Stats Display - Futuristic 2300 version
function ApprovalHeroText() {
  // 🏛️ LEI I - Performance Tiering (5000+ usuários)
  const { shouldAnimate, shouldBlur, isLowEnd } = useConstitutionPerformance();
  
  return (
    <div className="relative text-center mt-6 w-full overflow-visible">
      {/* 🔥 GLOW BACKGROUND - Apenas em high-end */}
      {!isLowEnd && (
        <div 
          className="absolute inset-0 -z-10 opacity-60 auth-hero-glow-bg"
          style={{
            background: "radial-gradient(ellipse 80% 50% at 50% 50%, hsl(320 90% 50% / 0.15), transparent 70%)",
            filter: shouldBlur ? "blur(40px)" : "blur(20px)",
          }}
        />
      )}
      
      {/* ⚡ MAIN TITLE - CSS-only animations for stability */}
      <div className={shouldAnimate ? "auth-hero-title-animated" : ""}>
        <h2 
          className="text-3xl sm:text-4xl xl:text-5xl font-black text-white leading-[1.1] tracking-tight"
          style={{ textShadow: !isLowEnd ? "0 0 60px hsl(0 0% 100% / 0.1)" : undefined }}
        >
          O Professor que
        </h2>
        
        {/* 🌟 HIGHLIGHT - "Mais Aprova" com GLOW otimizado */}
        <div className={`relative inline-block py-2 ${shouldAnimate ? "auth-hero-highlight-animated" : ""}`}>
          {/* Glow Layer - só em high-end */}
          {!isLowEnd && (
            <div 
              className="absolute inset-0 -z-10 rounded-lg auth-glow-layer"
              style={{
                background: "linear-gradient(90deg, hsl(280 90% 60% / 0.4), hsl(320 95% 55% / 0.5), hsl(0 90% 55% / 0.4))",
                filter: shouldBlur ? "blur(25px)" : "blur(15px)",
              }}
            />
          )}
          
          <span 
            className="relative text-4xl sm:text-5xl xl:text-6xl font-black"
            style={{
              background: "linear-gradient(90deg, hsl(280 90% 65%), hsl(320 95% 60%), hsl(350 90% 58%))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: !isLowEnd 
                ? "drop-shadow(0 0 30px hsl(320 90% 55% / 0.6)) drop-shadow(0 0 60px hsl(320 90% 55% / 0.3))"
                : "drop-shadow(0 0 15px hsl(320 90% 55% / 0.4))",
              letterSpacing: "-0.02em",
            }}
          >
            Mais Aprova
          </span>
        </div>
        
        <h2 
          className={`text-3xl sm:text-4xl xl:text-5xl font-black text-white leading-[1.1] tracking-tight ${shouldAnimate ? "auth-hero-subtitle-animated" : ""}`}
          style={{ textShadow: !isLowEnd ? "0 0 60px hsl(0 0% 100% / 0.1)" : undefined }}
        >
          em <span style={{ color: "hsl(210 100% 70%)" }}>Medicina</span> no Brasil
        </h2>
      </div>
      
      {/* 📝 DESCRIPTION */}
      <p 
        className={`mt-6 text-sm sm:text-base text-gray-300 max-w-sm mx-auto leading-relaxed ${shouldAnimate ? "auth-hero-desc-animated" : ""}`}
      >
        Química de alto nível com metodologia exclusiva.<br />
        <span className="text-gray-400">Milhares de alunos aprovados nas melhores faculdades do país.</span>
      </p>
      
      {/* ✨ DECORATIVE LINE */}
      <div className={`flex items-center justify-center gap-4 mt-6 ${shouldAnimate ? "auth-hero-line-animated" : ""}`}>
        <div 
          className="h-px w-16 sm:w-24"
          style={{ background: "linear-gradient(90deg, transparent, hsl(320 90% 55% / 0.6), hsl(320 90% 55%))" }}
        />
        <div className="relative">
          <div 
            className={`w-3 h-3 rounded-full ${shouldAnimate ? "auth-orb-animated" : ""}`}
            style={{ 
              background: "linear-gradient(135deg, hsl(320 90% 60%), hsl(280 90% 55%))",
              boxShadow: !isLowEnd 
                ? "0 0 15px hsl(320 90% 55% / 0.8), 0 0 30px hsl(320 90% 55% / 0.4)"
                : "0 0 10px hsl(320 90% 55% / 0.6)",
            }}
          />
          {/* Orbiting Ring - só em high-end com animações */}
          {!isLowEnd && shouldAnimate && (
            <div 
              className="absolute inset-0 rounded-full border border-primary/30 auth-ring-animated"
              style={{ transform: "scale(2.5)" }}
            />
          )}
        </div>
        <div 
          className="h-px w-16 sm:w-24"
          style={{ background: "linear-gradient(90deg, hsl(320 90% 55%), hsl(320 90% 55% / 0.6), transparent)" }}
        />
      </div>
    </div>
  );
}

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp, resetPassword, isLoading: authLoading } = useAuth();
  // 2FA Decision Engine (SYNAPSE Ω v10.x)
  const { collect: collectFingerprint } = useDeviceFingerprint();

  const { isEditMode, canEdit, toggleEditMode, getValue, updateValue, uploadImage } = useEditableContent("auth");

  // Estado para token de reset customizado
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [resetTokenEmail, setResetTokenEmail] = useState<string | null>(null);
  const [validatingToken, setValidatingToken] = useState(false);
  
  // 🎯 P0 FIX v3: Estado para first_access_token (NUNCA expira)
  const [firstAccessToken, setFirstAccessToken] = useState<string | null>(null);
  const [firstAccessData, setFirstAccessData] = useState<{
    email?: string;
    nome?: string;
    role?: string;
  } | null>(null);

  // ✅ P0 FIX: Log apenas uma vez na montagem (não no corpo do componente!)
  useEffect(() => {
    console.log("[AUTH] 1. Componente montado (/auth)");

    // 🛡️ CLEANUP: Resetar loginIntent ao desmontar a tela de Auth
    return () => {
      console.log("[AUTH] Componente desmontado - resetando loginIntent");
      getDeviceGateActions().setLoginIntent(false);
    };
  }, []);

  useEffect(() => {
    console.log("[AUTH] 2. Verificando parâmetros de URL...");
    const urlParams = new URLSearchParams(window.location.search);

    // 🎯 P0 FIX v3: Detectar first_access_token (token persistente que NUNCA expira)
    const firstAccessTokenParam = urlParams.get("first_access_token");
    if (firstAccessTokenParam) {
      console.log("[AUTH] 🔐 Token de primeiro acesso detectado (persistente)");
      setFirstAccessToken(firstAccessTokenParam);
      setValidatingToken(true);
      setIsCheckingSession(false);

      // Validar e consumir token
      const validateAndConsumeToken = async () => {
        try {
          const { data, error } = await supabase.functions.invoke("validate-first-access-token", {
            body: { token: firstAccessTokenParam, consume: true },
          });

          if (error || !data?.valid) {
            console.error("[AUTH] Token de primeiro acesso inválido:", error || data);
            
            // Se já foi usado, mostrar mensagem amigável
            if (data?.already_used) {
              toast.info("Este link já foi utilizado", {
                description: "Faça login normalmente com seu e-mail e senha.",
              });
              // Preencher email para facilitar
              if (data?.email) {
                setFormData(prev => ({ ...prev, email: data.email }));
              }
            } else {
              toast.error("Link de acesso inválido", {
                description: "Entre em contato com o suporte.",
              });
            }
            
            setFirstAccessToken(null);
          } else {
            console.log("[AUTH] ✅ Token de primeiro acesso válido para:", data.email);
            setFirstAccessData({
              email: data.email,
              nome: data.nome,
              role: data.role,
            });
            
            // Auto-login com senha temporária
            if (data.temp_password && data.email) {
              console.log("[AUTH] 🚀 Fazendo auto-login com senha temporária...");
              
              const { error: signInError } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.temp_password,
              });
              
              if (signInError) {
                console.error("[AUTH] Erro no auto-login:", signInError);
                toast.error("Erro ao acessar automaticamente", {
                  description: "Por favor, faça login manualmente.",
                });
                setFormData(prev => ({ ...prev, email: data.email || "" }));
              } else {
                console.log("[AUTH] ✅ Auto-login bem-sucedido! Redirecionando para /primeiro-acesso");
                toast.success(`Bem-vindo(a), ${data.nome || "Aluno"}!`, {
                  description: "Vamos configurar seu acesso.",
                });
                navigate("/primeiro-acesso", { replace: true });
                return;
              }
            }
          }
        } catch (err) {
          console.error("[AUTH] Erro ao validar token de primeiro acesso:", err);
          toast.error("Erro ao validar link de acesso");
          setFirstAccessToken(null);
        } finally {
          setValidatingToken(false);
        }
      };

      validateAndConsumeToken();
      return;
    }

    // 🎯 P0 FIX: Detectar reset_token (novo fluxo customizado)
    const customToken = urlParams.get("reset_token");
    if (customToken) {
      console.log("[AUTH] 🔐 Token de reset customizado detectado");
      setResetToken(customToken);
      setIsUpdatePassword(true);
      setValidatingToken(true);
      setIsCheckingSession(false);

      // Validar token
      const validateToken = async () => {
        try {
          const { data, error } = await supabase.functions.invoke("custom-password-reset", {
            body: { action: "validate", token: customToken },
          });

          if (error || !data?.valid) {
            console.error("[AUTH] Token inválido:", error || data);
            toast.error("Link de recuperação inválido ou expirado", {
              description: "Solicite uma nova recuperação de senha.",
            });
            setIsUpdatePassword(false);
            setResetToken(null);
          } else {
            console.log("[AUTH] ✅ Token válido para:", data.email);
            setResetTokenEmail(data.email);
          }
        } catch (err) {
          console.error("[AUTH] Erro ao validar token:", err);
          toast.error("Erro ao validar link de recuperação");
          setIsUpdatePassword(false);
          setResetToken(null);
        } finally {
          setValidatingToken(false);
        }
      };

      validateToken();
      return;
    }

    // Fallback: suporte ao fluxo antigo (reset=true, type=recovery, action=set-password)
    const isReset =
      urlParams.get("reset") === "true" ||
      urlParams.get("type") === "recovery" ||
      urlParams.get("action") === "set-password"; // 🎯 FIX: Suportar action=set-password do c-create-official-access
    if (isReset) {
      console.log("[AUTH] 🔐 Modo RESET PASSWORD detectado via URL");
      setIsUpdatePassword(true);
      setIsCheckingSession(false);
    }
  }, []);

  // =====================================================
  // AUDITORIA: Stats reais do banco - nenhum valor fictício
  // Se não houver dados, mostra 0
  // =====================================================
  const [realStats, setRealStats] = useState({ alunos: 0, aprovados: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Buscar total de alunos
        const { count: alunosCount } = await supabase.from("alunos").select("*", { count: "exact", head: true });

        // Buscar alunos ativos (considerados "aprovados" no sistema)
        const { count: aprovadosCount } = await supabase
          .from("alunos")
          .select("*", { count: "exact", head: true })
          .eq("status", "ativo");

        setRealStats({
          alunos: alunosCount || 0,
          aprovados: aprovadosCount || 0,
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
    { value: "—", label: "Satisfação" }, // Disponível quando sistema de avaliação estiver ativo
  ];

  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isUpdatePassword, setIsUpdatePassword] = useState(false); // 🎯 P0 FIX: Estado para definir nova senha
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [showPassword, setShowPassword] = useState(true); // 🎯 Visível por padrão
  const [showConfirmPassword, setShowConfirmPassword] = useState(true); // 🎯 Visível por padrão
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [newPassword, setNewPassword] = useState(""); // 🎯 P0 FIX
  const [confirmPassword, setConfirmPassword] = useState(""); // 🎯 P0 FIX
  const [passwordUpdated, setPasswordUpdated] = useState(false); // 🎯 P0 FIX

  // 🎯 MAGIC PASSWORD FLOW: Estado para forçar troca de senha no primeiro login
  const [showForcePasswordChange, setShowForcePasswordChange] = useState(false);
  const [pendingPasswordChangeUser, setPendingPasswordChangeUser] = useState<{ email: string; userId: string } | null>(
    null,
  );

  // Estado para 2FA
  const [show2FA, setShow2FA] = useState(false);
  const [pending2FAUser, setPending2FAUser] = useState<{
    email: string;
    userId: string;
    nome?: string;
    phone?: string;
    deviceHash?: string;
  } | null>(null);

  // 🔒 DOGMA I: Estado para bloqueio de sessão única
  const [showForceLogoutOption, setShowForceLogoutOption] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [pendingPassword, setPendingPassword] = useState<string | null>(null); // 🎯 FIX: Guardar senha para login automático
  const [isForceLoggingOut, setIsForceLoggingOut] = useState(false);

  // 🛡️ ERRADICADO: Turnstile removido (anti-bot-eradication-protocol-v1-0-0)
  // Stubs para evitar quebra de código sem mudanças funcionais
  const turnstileToken = 'BYPASS_ERADICATED';
  const isTurnstileVerified = true;
  const TurnstileProps = {};
  const resetTurnstile = () => {};

  // ============================================
  // 🛡️ POLÍTICA v10.0: ZERO SESSION PERSISTENCE
  // Nova aba/navegador = SEMPRE mostrar formulário de login
  // NÃO redirecionar automaticamente com sessão existente
  // O usuário DEVE clicar em "Entrar" para prosseguir
  // ============================================
  useEffect(() => {
    const pendingKey = "matriz_2fa_pending";
    const pendingUserKey = "matriz_2fa_user";

    // Rodar async fora do corpo do effect (TS/React-safe)
    void (async () => {
      // 🎯 FIX CRÍTICO: Verificar se veio de link de recovery ANTES de qualquer coisa
      const urlParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash;
      const isRecoveryFromUrl =
        urlParams.get("action") === "set-password" ||
        urlParams.get("reset") === "true" ||
        urlParams.get("type") === "recovery" ||
        Boolean(urlParams.get("reset_token")) ||
        hash.includes("type=recovery");

      if (isRecoveryFromUrl) {
        console.log("[AUTH] 🔐 Link de recovery detectado - mostrando formulário");
        setIsCheckingSession(false);
        return;
      }

      // 🎯 FIX: Não redirecionar se já estamos no modo de update password
      if (isUpdatePassword) {
        console.log("[AUTH] 🔐 Em modo update password - mostrando formulário");
        setIsCheckingSession(false);
        return;
      }

      // 🔓 PLANO B (UX): Sempre limpar flags 2FA pendentes ao entrar em /auth
      // Evita loop de redirect por estado “meio logado”
      console.log("[AUTH] 🔓 PLANO B: limpando flags 2FA pendentes ao carregar /auth");
      sessionStorage.removeItem(pendingKey);
      sessionStorage.removeItem(pendingUserKey);

      // ✅ PLANO B (UX): Se já existe sessão válida,
      // redirecionar imediatamente para a área correta.
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          console.log("[AUTH] ✅ Sessão existente detectada em /auth — redirecionando");

          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .maybeSingle();

          const userRole = roleData?.role || null;
          const target = getPostLoginRedirect(userRole, session.user.email);
          navigate(target, { replace: true });
          setIsCheckingSession(false);
          return;
        }
      } catch (err) {
        console.warn("[AUTH] Falha ao verificar sessão existente em /auth (fail-open):", err);
      }

      // Sem sessão → mostrar formulário
      setIsCheckingSession(false);
    })();
  }, [isUpdatePassword, navigate]);

  // 🛡️ POLÍTICA v10.0: Flag para garantir que redirect só ocorre após login EXPLÍCITO
  const [loginAttempted, setLoginAttempted] = useState(false);

  // Listener: login bem-sucedido deve sair de /auth
  // ✅ P0 FIX: Buscar role do banco ANTES de redirecionar
  // ✅ FIX: Tratar PASSWORD_RECOVERY para links de definição de senha
  // 🛡️ POLÍTICA v10.0: Só redirecionar se loginAttempted === true
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // 🎯 FIX: Quando usuário clica no link de recovery, Supabase dispara PASSWORD_RECOVERY
      // Neste caso, devemos mostrar o formulário de definição de senha, NÃO redirecionar
      if (event === "PASSWORD_RECOVERY") {
        console.log("[AUTH] 🔐 PASSWORD_RECOVERY event - mostrando formulário de nova senha");
        setIsUpdatePassword(true);
        setIsCheckingSession(false);
        return; // NÃO redirecionar, deixar usuário definir senha
      }

      if ((event !== "SIGNED_IN" && event !== "INITIAL_SESSION") || !session?.user) return;

      // 🛡️ PLANO B (UX):
      // - SIGNED_IN: só redireciona quando usuário clicou em "Entrar" (evita saltos em novas abas)
      // - INITIAL_SESSION: sessão restaurada pode redirecionar automaticamente
      if (event === "SIGNED_IN" && !loginAttempted) {
        console.log("[AUTH] 🛡️ SIGNED_IN detectado mas loginAttempted=false - BLOQUEANDO auto-redirect");
        return;
      }

      // Se estamos no modo de atualização de senha, não redirecionar
      if (isUpdatePassword) {
        console.log("[AUTH] 🔐 Em modo update password - não redirecionar");
        return;
      }

      const is2FAPending = sessionStorage.getItem("matriz_2fa_pending") === "1";
      if (is2FAPending) return;

      // ✅ P0 FIX CRÍTICO: Buscar role E verificar password_change_required
      let userRole: string | null = null;
      let needsPasswordChange = false;

      try {
        // Buscar role
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .maybeSingle();

        userRole = roleData?.role || null;
        console.log("[AUTH] Role carregada do banco:", userRole);

        // 🎯 MAGIC PASSWORD FLOW: Verificar se precisa trocar senha
        const { data: profileData } = await supabase
          .from("profiles")
          .select("password_change_required")
          .eq("id", session.user.id)
          .maybeSingle();

        needsPasswordChange = profileData?.password_change_required === true;
        console.log("[AUTH] Password change required:", needsPasswordChange);
      } catch (err) {
        console.error("[AUTH] Erro ao buscar role/profile:", err);
      }

      // 🎯 MAGIC PASSWORD FLOW: Se precisa trocar senha, mostrar formulário
      if (needsPasswordChange) {
        console.log("[AUTH] 🔐 Usuário precisa trocar senha - mostrando formulário");
        // 🎯 P0 FIX v3.1: Setar flag para bloquear redirect no useAuth
        sessionStorage.setItem("matriz_password_change_pending", "1");
        setPendingPasswordChangeUser({
          email: session.user.email || "",
          userId: session.user.id,
        });
        setShowForcePasswordChange(true);
        setIsCheckingSession(false);
        return; // NÃO redirecionar
      }

      // ✅ REGRA DEFINITIVA: Usa função centralizada COM role
      const target = getPostLoginRedirect(userRole, session.user.email);
      console.log("[AUTH] ✅ SIGNED_IN + loginAttempted - redirecionando para", target, "(role:", userRole, ")");
      navigate(target, { replace: true });
    });

    return () => subscription.unsubscribe();
  }, [navigate, isUpdatePassword, loginAttempted]);

  useEffect(() => {
    console.log("[AUTH] 2. Turnstile hook status:", {
      verified: isTurnstileVerified,
      hasToken: Boolean(turnstileToken),
    });
  }, [isTurnstileVerified, turnstileToken]);

  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    password: "",
  });

  // ============================================
  // 🔒 CONTROLE DE 2FA (SINALIZAÇÃO APENAS)
  // /auth NÃO redireciona. Quem redireciona é o AuthProvider.
  // Este flag só evita redirect durante o desafio 2FA.
  // ============================================
  useEffect(() => {
    const pendingKey = "matriz_2fa_pending";
    const pendingUserKey = "matriz_2fa_user";

    if (show2FA && pending2FAUser) {
      sessionStorage.setItem(pendingKey, "1");
      sessionStorage.setItem(pendingUserKey, JSON.stringify(pending2FAUser));
    } else {
      sessionStorage.removeItem(pendingKey);
      sessionStorage.removeItem(pendingUserKey);
    }
  }, [show2FA, pending2FAUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      const email = (formData.email || "").trim();

      if (!email || !email.includes("@")) {
        setErrors({ email: "Digite um email válido" });
        setIsLoading(false);
        return;
      }

      // 🛡️ RESET DE SENHA: Turnstile obrigatório para TODOS (P1-2 FIX)
      if (!isTurnstileVerified || !turnstileToken) {
        toast.error("Verificação de segurança necessária", {
          description: "Para recuperar a senha, complete a verificação anti-bot.",
        });
        setIsLoading(false);
        return;
      }

      const { error } = await resetPassword(email);
      if (error) {
        toast.error(formatError(error));
        resetTurnstile();
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

  // 🎯 P0 FIX: Handler para DEFINIR NOVA SENHA (após clicar no link do email)
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      // Validações
      if (!newPassword || newPassword.length < 8) {
        setErrors({ password: "Senha deve ter no mínimo 8 caracteres" });
        setIsLoading(false);
        return;
      }

      if (newPassword !== confirmPassword) {
        setErrors({ confirmPassword: "As senhas não coincidem" });
        setIsLoading(false);
        return;
      }

      // Validar força da senha (mesma policy do backend)
      const hasLower = /[a-z]/.test(newPassword);
      const hasUpper = /[A-Z]/.test(newPassword);
      const hasNumber = /\d/.test(newPassword);
      const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|<>?,./`~]/.test(newPassword);

      if (!hasLower || !hasUpper || !hasNumber || !hasSpecial) {
        setErrors({ password: "Senha deve conter: minúscula, maiúscula, número e caractere especial" });
        setIsLoading(false);
        return;
      }

      // 🎯 NOVO FLUXO: Se temos resetToken, usar fluxo customizado
      if (resetToken) {
        console.log("[AUTH] 🔐 Atualizando senha via fluxo customizado...");

        const { data, error } = await supabase.functions.invoke("custom-password-reset", {
          body: {
            action: "reset",
            token: resetToken,
            newPassword: newPassword,
          },
        });

        if (error || data?.error) {
          console.error("[AUTH] Erro ao atualizar senha:", error || data?.error);
          toast.error(data?.error || "Erro ao atualizar senha");
          setIsLoading(false);
          return;
        }

        console.log("[AUTH] ✅ Senha atualizada com sucesso (fluxo customizado)!");
        setPasswordUpdated(true);
        toast.success("Senha atualizada com sucesso!");
        window.history.replaceState({}, document.title, "/auth");
        return;
      }

      // Fallback: fluxo antigo via supabase.auth.updateUser (quando vem do link nativo)
      console.log("[AUTH] 🔐 Atualizando senha via supabase.auth.updateUser (fallback)...");

      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        console.error("[AUTH] Erro ao atualizar senha:", error);
        toast.error(error.message || "Erro ao atualizar senha");
        setIsLoading(false);
        return;
      }

      console.log("[AUTH] ✅ Senha atualizada com sucesso!");
      setPasswordUpdated(true);
      toast.success("Senha atualizada com sucesso!");

      // Limpar URL params
      window.history.replaceState({}, document.title, "/auth");
    } catch (err: any) {
      console.error("[AUTH] Erro inesperado:", err);
      toast.error("Erro ao atualizar senha. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // 🔒 DOGMA I: FORÇAR ENCERRAMENTO DE OUTRAS SESSÕES
  // ============================================
  const handleForceLogout = async () => {
    console.log(
      "[AUTH] handleForceLogout iniciado. pendingEmail:",
      pendingEmail,
      "pendingPassword:",
      pendingPassword ? "***SET***" : "NULL",
    );

    if (!pendingEmail) {
      console.error("[AUTH] handleForceLogout: pendingEmail ausente");
      toast.error("Erro interno", { description: "Email não encontrado. Tente fazer login novamente." });
      setShowForceLogoutOption(false);
      return;
    }

    // Usar formData.password se pendingPassword estiver vazio
    const passwordToUse = pendingPassword || formData.password;
    if (!passwordToUse) {
      console.error("[AUTH] handleForceLogout: senha ausente");
      toast.error("Erro interno", { description: "Senha não encontrada. Tente fazer login novamente." });
      setShowForceLogoutOption(false);
      return;
    }

    setIsForceLoggingOut(true);
    console.log("[AUTH] 🔒 Forçando encerramento de sessões para:", pendingEmail);

    try {
      const { data, error } = await supabase.rpc("force_logout_other_sessions", {
        _email: pendingEmail,
      });

      console.log("[AUTH] force_logout_other_sessions response:", { data, error });

      if (error) {
        console.error("[AUTH] Erro ao forçar logout (RPC):", {
          message: error.message,
          details: (error as any).details,
          hint: (error as any).hint,
          code: (error as any).code,
        });
        toast.error("Erro ao encerrar outras sessões", {
          description: `${error.message}${(error as any).code ? ` (code: ${(error as any).code})` : ""}`,
        });
        setIsForceLoggingOut(false);
        return;
      }

      if (data) {
        console.log("[AUTH] ✅ Sessões anteriores encerradas com sucesso");

        // 🚀 BROADCAST: Enviar evento session-revoked para logout instantâneo
        // O user_id vem do data da RPC ou buscamos pelo email
        try {
          const { data: userData } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", pendingEmail.toLowerCase())
            .maybeSingle();

          if (userData?.id) {
            console.log("[AUTH] 📡 Enviando broadcast session-revoked para user:", userData.id);
            await supabase.channel(`user:${userData.id}`).send({
              type: "broadcast",
              event: "session-revoked",
              payload: { reason: "force_logout", timestamp: new Date().toISOString() },
            });
          }
        } catch (broadcastError) {
          console.warn("[AUTH] ⚠️ Broadcast falhou (não crítico):", broadcastError);
        }

        toast.success("Outras sessões encerradas", {
          description: "Fazendo login agora...",
        });

        // 🎯 FIX: Fazer login automaticamente após encerrar sessões
        const savedEmail = pendingEmail;
        const savedPassword = passwordToUse; // Usar a variável que já foi validada

        // Limpar estado de bloqueio
        setShowForceLogoutOption(false);
        setPendingEmail(null);
        setPendingPassword(null);

        // Fazer login automaticamente
        console.log("[AUTH] 🔄 Iniciando login automático...");
        const result = await signIn(savedEmail, savedPassword, {});

        if (result.error) {
          console.error("[AUTH] Erro no login automático:", result.error);
          toast.error("Erro no login", {
            description: result.error.message || "Tente novamente.",
          });
          setIsForceLoggingOut(false);
          return;
        }

        // Login bem sucedido - continuar com fluxo normal (2FA, etc)
        console.log("[AUTH] ✅ Login automático bem sucedido");

        // Restaurar formData para que o restante do fluxo funcione
        setFormData((prev) => ({ ...prev, email: savedEmail, password: savedPassword }));

        // Se há usuário, verificar 2FA
        if (result.user) {
          // Coletar fingerprint para decisão 2FA
          const fp = await collectFingerprint();
          const deviceHash = fp.hash;

          // Buscar dados do perfil para 2FA
          const { data: profile } = await supabase
            .from("profiles")
            .select("nome, phone")
            .eq("id", result.user.id)
            .maybeSingle();

          // Verificar se precisa de 2FA
          const twoFAResult = await decide2FA({
            email: savedEmail,
            userId: result.user.id,
            deviceHash,
            deviceSignals: {
              isNewDevice: true, // Forçar 2FA após força logout
              countryChanged: false,
              rapidChange: false,
              riskScore: 0,
              deviceHash,
            },
          });

          if (twoFAResult.requires2FA) {
            console.log("[AUTH] 2FA necessário após login automático");
            setPending2FAUser({
              email: savedEmail,
              userId: result.user.id,
              nome: profile?.nome ?? undefined,
              phone: profile?.phone ?? undefined,
              deviceHash,
            });
            setShow2FA(true);
          }
          // Se não precisa 2FA, o redirect será tratado pelo onAuthStateChange
        }
      } else {
        console.warn("[AUTH] force_logout_other_sessions retornou false");
        toast.warning("Nenhuma sessão ativa encontrada", {
          description: "Tente fazer login normalmente.",
        });
        setShowForceLogoutOption(false);
        setPendingEmail(null);
        setPendingPassword(null);
      }
    } catch (err: any) {
      console.error("[AUTH] Erro crítico ao forçar logout:", err);
      toast.error("Erro inesperado ao encerrar sessões");
    } finally {
      setIsForceLoggingOut(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[AUTH] === INICIANDO FLUXO DE LOGIN/SIGNUP ===");
    console.log("[AUTH] Timestamp:", new Date().toISOString());

    // 🛡️ CRITÉRIO EXPLÍCITO: Ativar loginIntent ao clicar "Entrar"
    // Nenhuma UI de device limit pode ser renderizada enquanto loginIntent !== true
    getDeviceGateActions().setLoginIntent(true);

    setErrors({});

    if (!isLogin && !acceptTerms) {
      toast.error("Você precisa aceitar os termos de uso");
      getDeviceGateActions().setLoginIntent(false); // 🛡️ Reset em early return
      return;
    }

    // 🛡️ ERRADICADO: Turnstile removido (anti-bot-eradication-protocol-v1-0-0)
    // Autenticação agora flui diretamente sem verificação anti-bot
    console.log("[AUTH] 3. Turnstile ERRADICADO - bypass permanente ativo");

    setIsLoading(true);

    // ✅ P0: cada clique em "Entrar" começa do ZERO (não herdar 2FA pendente desta aba)
    sessionStorage.removeItem("matriz_2fa_pending");
    sessionStorage.removeItem("matriz_2fa_user");
    setShow2FA(false);
    setPending2FAUser(null);

    const TIMEOUT_MS = 30_000;
    const withTimeout = async <T,>(label: string, promise: Promise<T>): Promise<T> => {
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      try {
        const timeoutPromise = new Promise<T>((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error(`Timeout ${TIMEOUT_MS}ms em: ${label}`));
          }, TIMEOUT_MS);
        });
        return await Promise.race([promise, timeoutPromise]);
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
      }
    };

    try {
      const schema = isLogin ? simpleLoginSchema : simpleSignupSchema;
      const parsed = schema.safeParse(formData);

      if (!parsed.success) {
        const fieldErrors: Record<string, string> = {};
        parsed.error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        console.error("[AUTH] ERROR: validação de formulário", fieldErrors);
        setErrors(fieldErrors);
        // resetTurnstile(); // ERRADICADO
        setIsLoading(false);
        getDeviceGateActions().setLoginIntent(false); // 🛡️ Reset em erro de validação
        return;
      }

      if (isLogin) {
        // 🛡️ POLÍTICA v10.0: Sinaliza que o usuário CLICOU em "Entrar"
        // Isso habilita o redirect no onAuthStateChange listener
        setLoginAttempted(true);
        console.log("[AUTH] 4. Verificando sessão ativa existente...");

        // ✅ Sessões anteriores serão revogadas automaticamente pelo create_single_session RPC
        console.log("[AUTH] ✅ Novo login irá sobrescrever sessões anteriores (Single Session Policy)");

        console.log("[AUTH] ✅ Verificação de sessão concluída. Iniciando signInWithPassword...");

        const result = await withTimeout("signInWithPassword", signIn(formData.email, formData.password, {}));

        console.log("[AUTH] Login response:", {
          hasError: Boolean(result.error),
          hasUser: Boolean(result.user),
          // Nosso 2FA é APP-level: se login OK, sempre exige 2FA antes do redirect.
          needs2FA: !result.error && Boolean(result.user),
        });

        console.log("[AUTH] 5. Resposta do signIn:", {
          hasError: Boolean(result.error),
          blocked: Boolean(result.blocked),
          needsChallenge: Boolean(result.needsChallenge),
          hasUser: Boolean(result.user),
        });

        if (result.blocked) {
          toast.error("Acesso bloqueado por segurança", {
            description:
              "Detectamos um risco elevado. Se você é você mesmo, fale com o suporte para liberar seu acesso.",
          });
          resetTurnstile();
          setIsLoading(false);
          getDeviceGateActions().setLoginIntent(false); // 🛡️ Reset em bloqueio
          return;
        }

        if (result.needsChallenge) {
          toast.warning("Verificação adicional necessária", {
            description:
              "Refaça a verificação anti-bot e tente novamente. Se persistir, vamos ajustar o filtro para não travar alunos reais.",
          });
          resetTurnstile();
          setIsLoading(false);
          getDeviceGateActions().setLoginIntent(false); // 🛡️ Reset em challenge
          return;
        }

        if (result.error) {
          console.error("[AUTH] ERROR: signIn retornou erro:", result.error);
          if (result.error.message.includes("Invalid login credentials")) {
            toast.error("Credenciais inválidas", {
              description: "Verifique seu email e senha e tente novamente.",
            });
          } else if (result.error.message.includes("Email not confirmed")) {
            toast.warning("Email não confirmado", {
              description: "Verifique sua caixa de entrada para confirmar seu email.",
            });
          } else {
            toast.error("Erro no login", {
              description: result.error.message,
            });
          }
          resetTurnstile();
          setIsLoading(false);
          getDeviceGateActions().setLoginIntent(false); // 🛡️ Reset em erro de login
          return;
        }

        // ✅ Login bem sucedido - NÃO encerrar loading ainda (2FA decision em andamento)
        console.log("[AUTH] 6. Login bem sucedido. Verificando necessidade de 2FA...");

        const userFor2FA = result.user;
        if (!userFor2FA) {
          console.error("[AUTH] ERROR: user ausente após login");
          toast.error("Não foi possível concluir o login", {
            description: "Sua sessão não foi criada. Tente novamente.",
          });
          setIsLoading(false);
          getDeviceGateActions().setLoginIntent(false); // 🛡️ Reset em erro
          return;
        }

        // ============================================
        // 🛡️ DOGMA XI: VERIFICAR SE USUÁRIO ESTÁ BANIDO
        // ============================================
        console.log("[AUTH] 6.1. Verificando se usuário está banido...");
        const { data: isBanned, error: banCheckError } = await supabase.rpc("is_user_banned", {
          p_user_id: userFor2FA.id,
        });

        if (banCheckError) {
          console.warn("[AUTH] Erro ao verificar ban:", banCheckError);
          // Continua mesmo com erro (fail-open para não travar legítimos)
        } else if (isBanned === true) {
          console.error("[AUTH] ❌ USUÁRIO BANIDO - Bloqueando acesso");

          // Fazer logout imediato
          await supabase.auth.signOut();

          toast.error("Acesso Bloqueado", {
            description: "Sua conta foi suspensa. Entre em contato com o suporte.",
            duration: 10000,
          });
          resetTurnstile();
          setIsLoading(false);
          getDeviceGateActions().setLoginIntent(false); // 🛡️ Reset em banimento
          return;
        }

        console.log("[AUTH] 6.2. Usuário não está banido, prosseguindo...");

        // ============================================
        // 🛡️ BLOCO 1: VERIFICAR password_change_required PRIMEIRO
        // ============================================
        console.log("[AUTH][BLOCO1] 🔐 Verificando password_change_required...");
        const { data: profileCheck } = await supabase
          .from("profiles")
          .select("password_change_required")
          .eq("id", userFor2FA.id)
          .maybeSingle();

        if (profileCheck?.password_change_required === true) {
          console.log("[AUTH][BLOCO1] 🔐 Usuário precisa trocar senha - mostrando formulário");
          sessionStorage.setItem("matriz_password_change_pending", "1");
          setPendingPasswordChangeUser({
            email: userFor2FA.email || "",
            userId: userFor2FA.id,
          });
          setShowForcePasswordChange(true);
          setIsLoading(false);
          return; // NÃO prosseguir - mostrar formulário de troca de senha
        }

        // ============================================
        // 🛡️ BLOCO 2: REGISTRAR DISPOSITIVO ANTES DA SESSÃO
        // ============================================
        console.log("[AUTH][BLOCO2] 🔐 Registrando dispositivo ANTES da sessão...");
        const deviceResult = await registerDeviceBeforeSession();

        if (!deviceResult.success) {
          console.error("[AUTH][BLOCO2] ❌ Falha no registro de dispositivo:", deviceResult.error);

          // 🛡️ BEYOND_THE_3_DEVICES: Substituição do mesmo tipo
          if (deviceResult.error === "SAME_TYPE_REPLACEMENT_REQUIRED") {
            console.log("[AUTH][BEYOND_3] 🔄 Same-type replacement oferecida - redirecionando");

            if (deviceResult.sameTypePayload) {
              getSameTypeReplacementActions().setPayload(deviceResult.sameTypePayload);
            }

            setIsLoading(false);
            navigate("/security/same-type-replacement", { replace: true });
            return;
          }

          // FAIL-CLOSED: Bloquear login se limite excedido
          if (deviceResult.error === "DEVICE_LIMIT_EXCEEDED") {
            console.log("[AUTH][BLOCO2] 🛡️ Limite excedido - redirecionando para DeviceLimitGate");

            if (deviceResult.gatePayload) {
              useDeviceGateStore.getState().setPayload(deviceResult.gatePayload);
            }

            setIsLoading(false);
            navigate("/security/device-limit", { replace: true });
            return;
          }

          // Outros erros de dispositivo
          const errorMsg = getDeviceErrorMessage(deviceResult.error || "UNEXPECTED_ERROR");
          toast.error(errorMsg.title, { description: errorMsg.description });
          await supabase.auth.signOut();
          resetTurnstile();
          setIsLoading(false);
          getDeviceGateActions().setLoginIntent(false);
          return;
        }

        console.log("[AUTH][BLOCO2] ✅ Dispositivo vinculado:", deviceResult.deviceId);

        // ============================================
        // 🛡️ BLOCO 3: DECISÃO DE 2FA (decide2FA Engine)
        // ============================================
        console.log("[AUTH][BLOCO3] 🔐 Iniciando decisão de 2FA...");

        // 🔐 Owner bypass por role (verificar role primeiro)
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userFor2FA.id)
          .maybeSingle();

        const userRole = roleData?.role || null;
        const isOwnerRole = userRole === "owner";

        // 🔐 Owner tem bypass de 2FA
        if (isOwnerRole) {
          console.log("[AUTH][BLOCO3] 👑 Owner detectado - bypass de 2FA ativado");

          // Owner não precisa de 2FA, vai direto para sessão RPC
          const SESSION_TOKEN_KEY = "matriz_session_token";
          const ua = navigator.userAgent;
          let device_type = "desktop";
          if (/Mobi|Android|iPhone|iPad/i.test(ua)) {
            device_type = /iPad|Tablet/i.test(ua) ? "tablet" : "mobile";
          }

          let browser = "unknown";
          if (ua.includes("Firefox")) browser = "Firefox";
          else if (ua.includes("Edg")) browser = "Edge";
          else if (ua.includes("Chrome")) browser = "Chrome";
          else if (ua.includes("Safari")) browser = "Safari";

          let os = "unknown";
          if (ua.includes("Windows")) os = "Windows";
          else if (ua.includes("Mac")) os = "macOS";
          else if (ua.includes("Linux")) os = "Linux";
          else if (ua.includes("Android")) os = "Android";
          else if (ua.includes("iPhone")) os = "iOS";

          const serverDeviceHash = deviceResult.deviceHash || localStorage.getItem('matriz_device_server_hash');
          if (!serverDeviceHash) {
            console.error("[AUTH][SESSAO] ❌ P0 VIOLATION: Sem hash do servidor!");
            toast.error("Falha de segurança", { description: "Dispositivo não registrado corretamente." });
            await supabase.auth.signOut();
            resetTurnstile();
            setIsLoading(false);
            return;
          }

          const { data, error } = await supabase.rpc("create_single_session", {
            _ip_address: null,
            _user_agent: navigator.userAgent.slice(0, 255),
            _device_type: device_type,
            _browser: browser,
            _os: os,
            _device_hash_from_server: serverDeviceHash,
          });

          if (error || !data?.[0]?.session_token) {
            console.error("[AUTH][SESSAO] ❌ Falha ao criar sessão única (RPC):", error);
            toast.error("Falha crítica de segurança", {
              description: "Não foi possível iniciar a sessão única. Faça login novamente.",
              duration: 9000,
            });
            await supabase.auth.signOut();
            setIsLoading(false);
            return;
          }

          localStorage.setItem(SESSION_TOKEN_KEY, data[0].session_token);
          console.log("[AUTH][SESSAO] ✅ Sessão única criada (Owner bypass) e token armazenado");

          // Marcar mfa_verified = true para owner (bypass)
          await supabase
            .from("active_sessions")
            .update({ mfa_verified: true })
            .eq("session_token", data[0].session_token);

          toast.success("Login realizado com sucesso!");
          const target = getPostLoginRedirect(userRole, userFor2FA.email);
          console.log("[AUTH] ✅ Owner redirecionando para", target);
          setIsLoading(false);
          navigate(target, { replace: true });
          return;
        }

        // Coletar fingerprint para decisão de 2FA
        const fingerprintResult = await collectFingerprint();

        // Decidir se precisa de 2FA
        const twoFADecision = await decide2FA({
          userId: userFor2FA.id,
          email: userFor2FA.email || "",
          deviceHash: deviceResult.deviceHash || fingerprintResult.hash,
          deviceSignals: {
            isNewDevice: deviceResult.isNewDevice || false,
            countryChanged: false,
            rapidChange: false,
            riskScore: 0,
            deviceHash: deviceResult.deviceHash || fingerprintResult.hash,
          },
          isPasswordReset: false,
        });

        console.log("[AUTH][BLOCO3] Decisão de 2FA:", twoFADecision);

        if (twoFADecision.requires2FA) {
          console.log("[AUTH][BLOCO3] ⚠️ 2FA necessário:", twoFADecision.reason);

          // Mostrar tela de 2FA
          setPending2FAUser({
            email: userFor2FA.email || "",
            userId: userFor2FA.id,
            nome: userFor2FA.user_metadata?.nome || userFor2FA.user_metadata?.name || "",
            phone: userFor2FA.phone || "",
            deviceHash: deviceResult.deviceHash || fingerprintResult.hash,
          });
          setShow2FA(true);
          sessionStorage.setItem("matriz_2fa_pending", "1");
          sessionStorage.setItem("matriz_2fa_user", JSON.stringify({
            email: userFor2FA.email,
            userId: userFor2FA.id,
          }));
          setIsLoading(false);
          return; // Aguardar 2FA antes de continuar
        }

        // ============================================
        // 🛡️ BLOCO 4: 2FA NÃO NECESSÁRIO - CRIAR SESSÃO DIRETAMENTE
        // ============================================
        console.log("[AUTH][BLOCO4] ✅ 2FA não necessário - criando sessão diretamente");

        // Salvar cache de confiança
        if (deviceResult.deviceHash) {
          setTrustCache(userFor2FA.id, deviceResult.deviceHash);
          console.log("[AUTH] ✅ Trust cache salvo para próximos logins");
        }

        const SESSION_TOKEN_KEY = "matriz_session_token";
        const ua = navigator.userAgent;
        let device_type = "desktop";
        if (/Mobi|Android|iPhone|iPad/i.test(ua)) {
          device_type = /iPad|Tablet/i.test(ua) ? "tablet" : "mobile";
        }

        let browser = "unknown";
        if (ua.includes("Firefox")) browser = "Firefox";
        else if (ua.includes("Edg")) browser = "Edge";
        else if (ua.includes("Chrome")) browser = "Chrome";
        else if (ua.includes("Safari")) browser = "Safari";

        let os = "unknown";
        if (ua.includes("Windows")) os = "Windows";
        else if (ua.includes("Mac")) os = "macOS";
        else if (ua.includes("Linux")) os = "Linux";
        else if (ua.includes("Android")) os = "Android";
        else if (ua.includes("iPhone")) os = "iOS";

        const serverDeviceHash = deviceResult.deviceHash || localStorage.getItem('matriz_device_server_hash');
        if (!serverDeviceHash) {
          console.error("[AUTH][SESSAO] ❌ P0 VIOLATION: Sem hash do servidor!");
          toast.error("Falha de segurança", { description: "Dispositivo não registrado corretamente." });
          await supabase.auth.signOut();
          resetTurnstile();
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase.rpc("create_single_session", {
          _ip_address: null,
          _user_agent: navigator.userAgent.slice(0, 255),
          _device_type: device_type,
          _browser: browser,
          _os: os,
          _device_hash_from_server: serverDeviceHash,
        });

        if (error || !data?.[0]?.session_token) {
          console.error("[AUTH][SESSAO] ❌ Falha ao criar sessão única (RPC):", error);
          toast.error("Falha crítica de segurança", {
            description: "Não foi possível iniciar a sessão única. Faça login novamente.",
            duration: 9000,
          });
          await supabase.auth.signOut();
          setIsLoading(false);
          return;
        }

        localStorage.setItem(SESSION_TOKEN_KEY, data[0].session_token);
        console.log("[AUTH][SESSAO] ✅ Sessão única criada (sem 2FA) e token armazenado");

        // Marcar mfa_verified = true (dispositivo confiável dentro da janela de 24h)
        await supabase
          .from("active_sessions")
          .update({ mfa_verified: true })
          .eq("session_token", data[0].session_token);

        toast.success("Login realizado com sucesso!");
        const target = getPostLoginRedirect(userRole, userFor2FA.email);
        console.log("[AUTH] ✅ Redirecionando para", target, "(role:", userRole, ")");
        setIsLoading(false);
        navigate(target, { replace: true });
        return; // ✅ Fluxo completo restaurado
      }

      // SIGNUP
      console.log("[AUTH] 4. Iniciando signup...");

      if (!isTurnstileVerified || !turnstileToken) {
        console.error("[AUTH] ERROR: Turnstile ausente no signup");
        toast.error("Verificação de segurança necessária", {
          description: "Para criar uma conta, complete a verificação anti-bot.",
        });
        setIsLoading(false);
        return;
      }

      const signupResult = await withTimeout("signUp", signUp(formData.email, formData.password, formData.nome));

      console.log("[AUTH] 5. Resposta do signUp:", { hasError: Boolean(signupResult.error) });

      if (signupResult.error) {
        console.error("[AUTH] ERROR: signUp retornou erro:", signupResult.error);
        if (signupResult.error.message.includes("User already registered")) {
          toast.error("Email já cadastrado", {
            description: "Este email já possui uma conta. Tente fazer login.",
          });
        } else {
          toast.error("Erro no cadastro", {
            description: signupResult.error.message,
          });
        }
        resetTurnstile();
        setIsLoading(false);
        return;
      }

      toast.success("Conta criada com sucesso!", {
        description: "Você já pode fazer login.",
      });
      setIsLogin(true);
      setFormData({ nome: "", email: formData.email, password: "" });
    } catch (err: any) {
      console.error("[AUTH] ERROR:", err);
      toast.error("Erro ao processar solicitação", {
        description: err?.message || "Falha inesperada",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // REMOVIDO: authLoading check - renderizar instantaneamente
  // O redirecionamento acontece no useEffect quando user/authLoading mudam

  // ✅ P0: Não renderizar form enquanto valida sessão/redirect
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 relative overflow-hidden">
        <SpiderBackground />
        <SpiderEyes />
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-7 w-7 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Verificando sessão…</p>
        </div>
      </div>
    );
  }

  // Renderizar tela de 2FA se necessário
  if (show2FA && pending2FAUser) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
        <SpiderBackground />
        <SpiderEyes />
        <Suspense
          fallback={<div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
        >
          <TwoFactorVerification
            email={pending2FAUser.email}
            userId={pending2FAUser.userId}
            userName={pending2FAUser.nome}
            userPhone={pending2FAUser.phone}
            onVerified={async () => {
              console.log("[AUTH] ✅ 2FA verificado com sucesso, iniciando redirect...");

              // ✅ OTIMIZAÇÃO: Salvar cache de confiança após 2FA bem-sucedido
              if (pending2FAUser.deviceHash) {
                setTrustCache(pending2FAUser.userId, pending2FAUser.deviceHash);
                console.log("[AUTH] ✅ Trust cache salvo para próximos logins");
              }

              // ✅ P0 FIX: Limpar flags ANTES de qualquer redirect
              sessionStorage.removeItem("matriz_2fa_pending");
              sessionStorage.removeItem("matriz_2fa_user");

              // ============================================
              // 🛡️ BLOCO 3: REGISTRAR DISPOSITIVO ANTES DA SESSÃO (pós-2FA)
              // ============================================
              console.log("[AUTH][BLOCO3] 🔐 Registrando dispositivo ANTES da sessão (pós-2FA)...");
              const deviceResult = await registerDeviceBeforeSession();

              if (!deviceResult.success) {
                console.error("[AUTH][BLOCO3] ❌ Falha no registro de dispositivo pós-2FA:", deviceResult.error);

                // 🛡️ BEYOND_THE_3_DEVICES: Substituição do mesmo tipo
                if (deviceResult.error === "SAME_TYPE_REPLACEMENT_REQUIRED") {
                  console.log("[AUTH][BEYOND_3] 🔄 Same-type replacement oferecida pós-2FA - redirecionando");

                  if (deviceResult.sameTypePayload) {
                    getSameTypeReplacementActions().setPayload(deviceResult.sameTypePayload);
                  }

                  setShow2FA(false);
                  setPending2FAUser(null);
                  navigate("/security/same-type-replacement", { replace: true });
                  return;
                }

                // FAIL-CLOSED: Bloquear login se limite excedido
                if (deviceResult.error === "DEVICE_LIMIT_EXCEEDED") {
                  console.log("[AUTH][BLOCO3] 🛡️ Limite excedido pós-2FA - redirecionando para DeviceLimitGate");

                  // Salvar payload no store para o Gate
                  if (deviceResult.gatePayload) {
                    useDeviceGateStore.getState().setPayload(deviceResult.gatePayload);
                  }

                  // NÃO fazer logout - manter sessão para que o Gate possa revogar dispositivos
                  setShow2FA(false);
                  setPending2FAUser(null);
                  navigate("/security/device-limit", { replace: true });
                  return;
                }

                // Outros erros de dispositivo
                const errorMsg = getDeviceErrorMessage(deviceResult.error || "UNEXPECTED_ERROR");
                toast.error(errorMsg.title, { description: errorMsg.description });
                await supabase.auth.signOut();
                setShow2FA(false);
                setPending2FAUser(null);
                return;
              }

              console.log("[AUTH][BLOCO3] ✅ Dispositivo vinculado pós-2FA:", deviceResult.deviceId);

              // ✅ P0: Sessão única só NASCE após dispositivo vinculado + 2FA validado
              try {
                const SESSION_TOKEN_KEY = "matriz_session_token";
                const ua = navigator.userAgent;
                let device_type = "desktop";
                if (/Mobi|Android|iPhone|iPad/i.test(ua)) {
                  device_type = /iPad|Tablet/i.test(ua) ? "tablet" : "mobile";
                }

                let browser = "unknown";
                if (ua.includes("Firefox")) browser = "Firefox";
                else if (ua.includes("Edg")) browser = "Edge";
                else if (ua.includes("Chrome")) browser = "Chrome";
                else if (ua.includes("Safari")) browser = "Safari";

                let os = "unknown";
                if (ua.includes("Windows")) os = "Windows";
                else if (ua.includes("Mac")) os = "macOS";
                else if (ua.includes("Linux")) os = "Linux";
                else if (ua.includes("Android")) os = "Android";
                else if (ua.includes("iPhone")) os = "iOS";

                // 🔐 P0 FIX: Garantir hash do servidor com fallback seguro
                const serverDeviceHash = deviceResult.deviceHash || localStorage.getItem('matriz_device_server_hash');
                if (!serverDeviceHash) {
                  console.error("[AUTH][SESSAO] ❌ P0 VIOLATION: Sem hash do servidor!");
                  toast.error("Falha de segurança", { description: "Dispositivo não registrado corretamente." });
                  await supabase.auth.signOut();
                  setShow2FA(false);
                  setPending2FAUser(null);
                  return;
                }

                const { data, error } = await supabase.rpc("create_single_session", {
                  _ip_address: null,
                  _user_agent: navigator.userAgent.slice(0, 255),
                  _device_type: device_type,
                  _browser: browser,
                  _os: os,
                  _device_hash_from_server: serverDeviceHash, // 🔐 P0 FIX: Hash do SERVIDOR obrigatório
                });

                if (error || !data?.[0]?.session_token) {
                  console.error("[AUTH][SESSAO] ❌ Falha ao criar sessão única pós-2FA (RPC):", error);
                  toast.error("Falha crítica de segurança", {
                    description: "Não foi possível iniciar a sessão única. Faça login novamente.",
                    duration: 9000,
                  });
                  await supabase.auth.signOut();
                  setShow2FA(false);
                  setPending2FAUser(null);
                  return;
                }

                localStorage.setItem(SESSION_TOKEN_KEY, data[0].session_token);
                console.log("[AUTH][SESSAO] ✅ Sessão única criada pós-2FA (RPC) e token armazenado");
              } catch (err) {
                console.warn("[AUTH][SESSAO] Erro crítico ao criar sessão pós-2FA (RPC):", err);
                toast.error("Falha crítica de segurança", {
                  description: "Não foi possível iniciar a sessão única. Faça login novamente.",
                  duration: 9000,
                });
                await supabase.auth.signOut();
                setShow2FA(false);
                setPending2FAUser(null);
                return;
              }

              // ✅ P0 FIX CRÍTICO: Buscar role e fazer redirect EXPLÍCITO
              try {
                const { data: roleData } = await supabase
                  .from("user_roles")
                  .select("role")
                  .eq("user_id", pending2FAUser.userId)
                  .maybeSingle();

                const userRole = roleData?.role || null;
                const target = getPostLoginRedirect(userRole, pending2FAUser.email);

                console.log("[AUTH] ✅ 2FA completo - redirecionando para", target, "(role:", userRole, ")");
                toast.success("Bem-vindo de volta!", {
                  description: deviceResult.isNewDevice
                    ? "Novo dispositivo registrado com sucesso."
                    : "Dispositivo reconhecido.",
                });

                window.location.replace(target);
              } catch (err) {
                console.error("[AUTH] Erro ao buscar role pós-2FA:", err);
                toast.success("Bem-vindo de volta!");
                window.location.replace("/gestaofc");
              }

              setShow2FA(false);
              setPending2FAUser(null);
            }}
            onCancel={async () => {
              // ✅ Fail-safe: nunca deixar usuário “meio logado” sem 2FA
              sessionStorage.removeItem("matriz_2fa_pending");
              sessionStorage.removeItem("matriz_2fa_user");
              try {
                await supabase.auth.signOut();
              } catch (err) {
                console.warn("[AUTH] Falha ao deslogar no cancel 2FA:", err);
              }
              setShow2FA(false);
              setPending2FAUser(null);
              toast.info("Login cancelado", {
                description: "Você saiu com segurança. Faça login novamente para tentar o 2FA.",
              });
            }}
          />
        </Suspense>
      </div>
    );
  }

  // 🎯 MAGIC PASSWORD FLOW: Mostrar formulário de troca de senha obrigatória
  if (showForcePasswordChange && pendingPasswordChangeUser) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <SpiderBackground />
        <SpiderEyes />
        <Suspense fallback={<div className="text-white">Carregando...</div>}>
          <ForcePasswordChange
            userEmail={pendingPasswordChangeUser.email}
            userId={pendingPasswordChangeUser.userId}
            onPasswordChanged={() => {
              // 🎯 P0 FIX v3.1: Limpar flag de password change pendente
              sessionStorage.removeItem("matriz_password_change_pending");
              setShowForcePasswordChange(false);
              setPendingPasswordChangeUser(null);
              // Redirecionar para área correta após trocar senha
              window.location.reload();
            }}
          />
        </Suspense>
      </div>
    );
  }

  // ============================================
  // 🔒 DOGMA I: MODAL DE SESSÃO ATIVA DETECTADA
  // ============================================

  // Detectar tipo de dispositivo atual
  const detectCurrentDevice = () => {
    const ua = navigator.userAgent;
    
    // 🖥️ DESKTOP FIRST: macOS/Windows/Linux detection ANTES de Mobi check
    const isDesktopOS = 
      (/Mac OS X|Macintosh/i.test(ua) && !/iPhone|iPad/i.test(ua)) ||
      (/Windows NT/i.test(ua) && !/Phone/i.test(ua)) ||
      (/Linux/i.test(ua) && !/Android/i.test(ua));
    
    let deviceType: "desktop" | "tablet" | "mobile" = "desktop";
    
    if (!isDesktopOS) {
      const isTablet = /iPad|Android(?!.*Mobile)/i.test(ua);
      const isMobile = /iPhone|iPod|Android.*Mobile|Mobi/i.test(ua);
      if (isTablet) deviceType = "tablet";
      else if (isMobile) deviceType = "mobile";
    }

    let browser = "Navegador";
    if (ua.includes("Chrome")) browser = "Google Chrome";
    else if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Safari")) browser = "Safari";
    else if (ua.includes("Edge")) browser = "Microsoft Edge";
    else if (ua.includes("Opera")) browser = "Opera";

    let os = "Sistema";
    if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Mac")) os = "macOS";
    else if (ua.includes("Linux")) os = "Linux";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

    return { deviceType, browser, os };
  };

  const currentDevice = detectCurrentDevice();

  if (showForceLogoutOption && pendingEmail) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <SpiderBackground />
        <SpiderEyes />
        <div className="relative z-10 w-full max-w-md">
          <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-primary/30 rounded-2xl p-8 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Sessão Ativa Detectada</h2>
              <p className="text-gray-400 text-sm">Você já está logado em outro dispositivo</p>
            </div>

            {/* Info */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-4">
              <p className="text-amber-300 text-sm text-center">
                Por segurança, apenas <strong>uma sessão</strong> por usuário é permitida.
              </p>
            </div>

            {/* Dispositivo Atual Detectado */}
            <div className="mb-6">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 text-center">
                Dispositivo tentando conectar
              </p>

              {/* Tipos de dispositivos */}
              <div className="flex justify-center gap-4 mb-4">
                <div
                  className={`flex flex-col items-center p-3 rounded-lg border ${
                    currentDevice.deviceType === "desktop"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-white/10 text-gray-500"
                  }`}
                >
                  <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-[10px]">Desktop</span>
                </div>
                <div
                  className={`flex flex-col items-center p-3 rounded-lg border ${
                    currentDevice.deviceType === "tablet"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-white/10 text-gray-500"
                  }`}
                >
                  <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-[10px]">Tablet</span>
                </div>
                <div
                  className={`flex flex-col items-center p-3 rounded-lg border ${
                    currentDevice.deviceType === "mobile"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-white/10 text-gray-500"
                  }`}
                >
                  <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-[10px]">Celular</span>
                </div>
              </div>

              {/* Info do dispositivo atual */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Fingerprint className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">
                    {currentDevice.browser} no {currentDevice.os}
                  </p>
                  <p className="text-gray-500 text-xs">Dispositivo detectado automaticamente</p>
                </div>
                <div className="px-2 py-1 bg-primary/20 rounded text-primary text-xs font-medium">Atual</div>
              </div>
            </div>

            {/* Ações */}
            <div className="space-y-3">
              <Button
                onClick={handleForceLogout}
                disabled={isForceLoggingOut}
                className="w-full bg-primary hover:bg-primary/90 text-white h-12"
              >
                {isForceLoggingOut ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Encerrando...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Encerrar Outra Sessão e Logar Aqui
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setShowForceLogoutOption(false);
                  setPendingEmail(null);
                  setPendingPassword(null);
                }}
                className="w-full border-white/20 text-gray-300 hover:bg-white/5 h-12"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Cancelar e Voltar
              </Button>
            </div>

            {/* Rodapé */}
            <p className="text-xs text-gray-500 text-center mt-6">A outra sessão será encerrada imediatamente.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex relative overflow-hidden">
      {canEdit && (
        <Suspense fallback={null}>
          <EditModeToggle isEditMode={isEditMode} canEdit={canEdit} onToggle={toggleEditMode} />
        </Suspense>
      )}

      {/* 🕷️ SPIDER-MAN Background Effects */}
      <SpiderBackground />
      <SpiderEyes />
      <SpiderVeins />

      {/* Left Panel - Visual Side - YEAR 2300 */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative">
        {/* 🕷️ SPIDER-MAN Gradient Overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 20% 30%, hsl(0 85% 45% / 0.12) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, hsl(220 80% 40% / 0.08) 0%, transparent 50%), linear-gradient(135deg, hsl(230 40% 4%) 0%, hsl(230 40% 2%) 100%)",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12">
          {/* Professor Photo - Spider Frame */}
          <div className="mb-8 spider-entrance">
            <div className="relative">
              {/* Spider Glow Effect - Red/Blue */}
              <div
                className="absolute inset-0 rounded-full blur-3xl"
                style={{
                  background:
                    "radial-gradient(circle, hsl(0 85% 45% / 0.25) 0%, hsl(220 80% 40% / 0.15) 50%, transparent 70%)",
                }}
              />

              {/* Hexagonal Frame - Spider Colors */}
              <div className="relative w-72 h-72 flex items-center justify-center">
                {/* Outer rotating ring */}
                <div className="absolute inset-0" style={{ animation: "auth-orbit 25s linear infinite" }}>
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <polygon
                      points="50,2 95,25 95,75 50,98 5,75 5,25"
                      fill="none"
                      stroke="url(#spiderHexGradient)"
                      strokeWidth="0.8"
                      opacity="0.6"
                    />
                  </svg>
                </div>

                {/* Inner static frame */}
                <svg className="absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)]" viewBox="0 0 100 100">
                  <polygon
                    points="50,2 95,25 95,75 50,98 5,75 5,25"
                    fill="none"
                    stroke="url(#spiderHexGradient)"
                    strokeWidth="1.5"
                  />
                  <defs>
                    <linearGradient id="spiderHexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="hsl(0 90% 55%)" />
                      <stop offset="50%" stopColor="hsl(220 100% 60%)" />
                      <stop offset="100%" stopColor="hsl(0 90% 55%)" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Professor Photo - Spider Border */}
                {canEdit && isEditMode ? (
                  <Suspense
                    fallback={
                      <img
                        src={professorPhoto}
                        alt="Professor Moisés"
                        className="w-56 h-56 rounded-full object-cover [object-position:50%_15%]"
                      />
                    }
                  >
                    <EditableImage
                      src={professorPhoto}
                      alt="Professor Moisés"
                      onUpload={async (file) => await uploadImage("auth_professor_photo", file)}
                      isEditMode={isEditMode}
                      canEdit={canEdit}
                      className="w-full h-full object-cover [object-position:50%_15%]"
                      containerClassName="w-56 h-56 rounded-full overflow-hidden spider-professor-frame"
                    />
                  </Suspense>
                ) : (
                  <div
                    className="relative w-56 h-56 rounded-full overflow-hidden spider-professor-frame"
                    style={{
                      border: "3px solid transparent",
                      backgroundImage:
                        "linear-gradient(hsl(230 40% 4%), hsl(230 40% 4%)), linear-gradient(135deg, hsl(0 90% 55%), hsl(220 100% 60%), hsl(0 90% 55%))",
                      backgroundOrigin: "border-box",
                      backgroundClip: "padding-box, border-box",
                    }}
                  >
                    <OptimizedImage
                      src={professorPhoto}
                      alt="Professor Moisés"
                      width={224}
                      height={224}
                      aspectRatio="square"
                      objectFit="cover"
                      objectPosition="50% 15%"
                      placeholderColor="#0a0a12"
                      priority={false}
                      className=""
                      containerClassName="w-full h-full"
                    />
                  </div>
                )}
              </div>

              {/* Status Indicator - Spider Style */}
              <div
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-5 py-2 rounded-full backdrop-blur-sm spider-corner"
                style={{
                  background: "linear-gradient(135deg, hsl(0 85% 45% / 0.3), hsl(220 80% 50% / 0.2))",
                  border: "1px solid hsl(0 90% 55% / 0.5)",
                  color: "hsl(0 90% 55%)",
                }}
              >
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                  <Zap className="h-3 w-3" />
                  VERIFICADO
                </span>
              </div>
            </div>
          </div>

          {/* Title - Spider-Man Gradient */}
          <div className="text-center mb-6 spider-entrance spider-entrance-delay-1">
            <h1 className="text-4xl xl:text-5xl font-bold text-white mb-3">
              <span style={{ color: "hsl(220 90% 70% / 0.8)" }}>Prof.</span>{" "}
              <span className="spider-title">
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
            <p className="text-lg spider-entrance spider-entrance-delay-2" style={{ color: "hsl(220 70% 70% / 0.9)" }}>
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
          <div
            className="flex flex-wrap justify-center gap-3 mb-8 animate-fade-in"
            style={{ animationDelay: "0.5s", animationFillMode: "backwards" }}
          >
            {[
              { icon: Atom, label: "Química Completa" },
              { icon: CircuitBoard, label: "Metodologia Exclusiva" },
              { icon: Shield, label: "Resultados Comprovados" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm hover:scale-105 hover:border-primary/50 hover:bg-primary/10 transition-all duration-200 animate-scale-in"
                style={{ animationDelay: `${0.6 + i * 0.1}s`, animationFillMode: "backwards" }}
              >
                <item.icon className="h-4 w-4 text-primary" />
                <span className="text-sm text-gray-300">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Hero Impact Text */}
          <ApprovalHeroText />

          {/* Decorative Elements - CSS only */}
          <div
            className="absolute bottom-8 left-8 flex items-center gap-2 text-gray-500 animate-fade-in"
            style={{ animationDelay: "1s", animationFillMode: "backwards" }}
          >
            <div className="w-8 h-px bg-gradient-to-r from-transparent to-primary/50" />
            <span className="text-xs uppercase tracking-widest">Sistema de aprovações</span>
          </div>
        </div>

        {/* Vertical Separator - CSS only */}
        <div className="absolute right-0 top-0 bottom-0 w-px">
          <div
            className="h-full w-full bg-gradient-to-b from-transparent via-primary/30 to-transparent animate-pulse"
            style={{ animationDuration: "3s" }}
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

          {/* Card - 🕷️ SPIDER-MAN Tech Interface */}
          <div className="relative rounded-2xl p-8 backdrop-blur-xl shadow-2xl spider-card">
            {/* Spider Frame */}
            <SpiderCardFrame />

            {/* Spider Glow Effect - Red/Blue gradient */}
            <div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at top left, hsl(0 85% 45% / 0.08), transparent 50%), radial-gradient(ellipse at bottom right, hsl(220 80% 50% / 0.06), transparent 50%)",
              }}
            />

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
                      value={getValue(
                        isLogin ? "auth_login_title" : "auth_signup_title",
                        isLogin ? "CURSO QUÍMICA MOISÉS MEDEIROS" : "Criar Nova Conta",
                      )}
                      onSave={(v) => updateValue(isLogin ? "auth_login_title" : "auth_signup_title", v)}
                      isEditMode={isEditMode}
                      canEdit={canEdit}
                    />
                  </h2>
                </div>
                <p className="text-sm text-gray-400">
                  <EditableText
                    value={getValue(
                      isLogin ? "auth_login_subtitle" : "auth_signup_subtitle",
                      isLogin ? "Entre para acessar o sistema" : "Comece sua jornada de aprovação",
                    )}
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
                    <p className="text-xs text-gray-400">Apenas usuários pré-cadastrados podem acessar o sistema.</p>
                  </div>
                </div>
              </div>
            )}

            {/* 🎯 P0 FIX: Modo DEFINIR NOVA SENHA (após clicar no link do email) */}
            {isUpdatePassword ? (
              <div className="space-y-4">
                {validatingToken ? (
                  <div className="text-center py-8 animate-fade-in">
                    <Loader2 className="h-8 w-8 mx-auto mb-4 text-primary animate-spin" />
                    <p className="text-sm text-gray-400">Validando link de recuperação...</p>
                  </div>
                ) : passwordUpdated ? (
                  <div className="text-center py-8 animate-scale-in">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Lock className="h-8 w-8 text-green-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Senha Atualizada!</h3>
                    <p className="text-sm text-gray-400 mb-6">
                      Sua senha foi redefinida com sucesso. Agora você pode fazer login.
                    </p>
                    <Button
                      type="button"
                      onClick={() => {
                        setIsUpdatePassword(false);
                        setPasswordUpdated(false);
                        setNewPassword("");
                        setConfirmPassword("");
                        setResetToken(null);
                        setResetTokenEmail(null);
                      }}
                      className="bg-gradient-to-r from-primary to-[#7D1128] text-white"
                    >
                      Fazer Login
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-semibold text-white mb-1">Definir Nova Senha</h3>
                      <p className="text-sm text-gray-400">
                        {resetTokenEmail
                          ? `Definindo nova senha para: ${resetTokenEmail}`
                          : "Digite sua nova senha de acesso"}
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="new-password" className="text-sm font-medium text-gray-300">
                        Nova Senha
                      </Label>
                      <div className="relative mt-1.5">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          id="new-password"
                          type={showPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Mínimo 8 caracteres"
                          className="pl-11 pr-11 h-12 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-primary"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password}</p>}
                    </div>

                    <div>
                      <Label htmlFor="confirm-password" className="text-sm font-medium text-gray-300">
                        Confirmar Senha
                      </Label>
                      <div className="relative mt-1.5">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          id="confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repita a senha"
                          className="pl-11 pr-11 h-12 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-primary"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.confirmPassword && <p className="text-xs text-red-400 mt-1">{errors.confirmPassword}</p>}
                    </div>

                    <p className="text-xs text-gray-500">
                      A senha deve conter: letra minúscula, maiúscula, número e caractere especial
                    </p>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-primary via-[#B22222] to-primary text-white font-semibold shadow-xl shadow-primary/30"
                    >
                      {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Salvar Nova Senha"}
                    </Button>
                  </form>
                )}
              </div>
            ) : isForgotPassword ? (
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
                      <p className="text-sm text-gray-400">Digite seu email para receber o link de recuperação</p>
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
                        <p className="text-xs text-red-400 mt-1" role="alert" aria-live="polite">
                          {errors.email}
                        </p>
                      )}
                    </div>

                    {/* 🛡️ ERRADICADO: Turnstile removido (anti-bot-eradication-protocol-v1-0-0) */}

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-primary via-[#B22222] to-primary text-white font-semibold shadow-xl shadow-primary/30 transition-all hover:scale-[1.02] hover:shadow-primary/50 active:scale-[0.98] disabled:opacity-50 border-0"
                    >
                      {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Enviar Link de Recuperação"}
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
                    <div className={`relative mt-1.5 transition-all ${focusedField === "nome" ? "scale-[1.02]" : ""}`}>
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        id="nome"
                        name="nome"
                        type="text"
                        value={formData.nome}
                        onChange={handleChange}
                        onFocus={() => setFocusedField("nome")}
                        onBlur={() => setFocusedField(null)}
                        placeholder="Seu nome completo"
                        className="pl-11 h-12 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    {errors.nome && (
                      <p className="text-xs text-red-400 mt-1" role="alert" aria-live="polite">
                        {errors.nome}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-300">
                    Email
                  </Label>
                  <div className={`relative mt-1.5 transition-all ${focusedField === "email" ? "scale-[1.02]" : ""}`}>
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="seu@email.com"
                      autoComplete="email"
                      className="pl-11 h-12 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-red-400 mt-1" role="alert" aria-live="polite">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="password" className="text-sm font-medium text-gray-300">
                    Senha
                  </Label>
                  <div
                    className={`relative mt-1.5 transition-all ${focusedField === "password" ? "scale-[1.02]" : ""}`}
                  >
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
                      onFocus={() => setFocusedField("password")}
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
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-400 mt-1" role="alert" aria-live="polite">
                      {errors.password}
                    </p>
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

                {/* 🛡️ ERRADICADO: Turnstile removido (anti-bot-eradication-protocol-v1-0-0) */}

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

                {/* Toggle Login/Signup - REMOVIDO conforme solicitação */}
              </form>
            )}

            {/* Security Badge - CSS animation */}
            <div className="mt-6 flex justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:border-primary/30 transition-colors duration-300">
                <Shield className="h-4 w-4 text-green-500" />
                <span className="text-xs text-gray-400">Conexão criptografada SSL</span>
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
