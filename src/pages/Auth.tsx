// ============================================
// MOISÉS MEDEIROS v10.0 - AUTH PAGE
// Design: Futurista Spider-Man / Vermelho Vinho
// Estética: Cyber-Tech Profissional
// COM VERIFICAÇÃO 2FA POR EMAIL
// UPGRADE: Feedback melhorado, mensagens claras
// ============================================

import { useState, useEffect, lazy, Suspense, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { CloudflareTurnstile, useTurnstile } from "@/components/security/CloudflareTurnstile";
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
// 2FA Decision Engine (SYNAPSE Ω v10.x) com cache de confiança
import { useDeviceFingerprint, decide2FA, setTrustCache } from "@/hooks/auth";
import { simpleLoginSchema, simpleSignupSchema } from "@/lib/validations/schemas";
import professorPhoto from "@/assets/professor-moises-novo.jpg";
import logoMoises from "@/assets/logo-moises-medeiros.png";
import { useEditableContent } from "@/hooks/useEditableContent";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { isOwnerEmail } from "@/lib/security";
import { getPostLoginRedirect } from "@/core/urlAccessControl";
import { registerDeviceBeforeSession, getDeviceErrorMessage } from "@/lib/deviceRegistration";
import { useDeviceGateStore, DeviceGatePayload, DeviceInfo, CurrentDeviceInfo } from "@/state/deviceGateStore";
import { collectFingerprintRawData, generateDeviceName } from "@/lib/deviceFingerprintRaw";

// Lazy load componentes pesados (apenas owner usa)
const EditableText = lazy(() => import("@/components/editor/EditableText").then(m => ({ default: m.EditableText })));
const EditableImage = lazy(() => import("@/components/editor/EditableImage").then(m => ({ default: m.EditableImage })));
const EditModeToggle = lazy(() => import("@/components/editor/EditModeToggle").then(m => ({ default: m.EditModeToggle })));
const TwoFactorVerification = lazy(() => import("@/components/auth/TwoFactorVerification").then(m => ({ default: m.TwoFactorVerification })));
const PasswordStrengthMeter = lazy(() => import("@/components/auth/PasswordStrengthMeter").then(m => ({ default: m.PasswordStrengthMeter })));
const ForcePasswordChange = lazy(() => import("@/components/auth/ForcePasswordChange").then(m => ({ default: m.ForcePasswordChange })));

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
  // 2FA Decision Engine (SYNAPSE Ω v10.x)
  const { collect: collectFingerprint } = useDeviceFingerprint();
  
  const { 
    isEditMode, 
    canEdit, 
    toggleEditMode, 
    getValue, 
    updateValue, 
    uploadImage 
  } = useEditableContent("auth");

  // Estado para token de reset customizado
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [resetTokenEmail, setResetTokenEmail] = useState<string | null>(null);
  const [validatingToken, setValidatingToken] = useState(false);

  // ✅ P0 FIX: Log apenas uma vez na montagem (não no corpo do componente!)
  useEffect(() => {
    console.log('[AUTH] 1. Componente montado (/auth)');
    
    const urlParams = new URLSearchParams(window.location.search);
    
    // 🎯 P0 FIX: Detectar reset_token (novo fluxo customizado)
    const customToken = urlParams.get('reset_token');
    if (customToken) {
      console.log('[AUTH] 🔐 Token de reset customizado detectado');
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
            console.error('[AUTH] Token inválido:', error || data);
            toast.error("Link de recuperação inválido ou expirado", {
              description: "Solicite uma nova recuperação de senha.",
            });
            setIsUpdatePassword(false);
            setResetToken(null);
          } else {
            console.log('[AUTH] ✅ Token válido para:', data.email);
            setResetTokenEmail(data.email);
          }
        } catch (err) {
          console.error('[AUTH] Erro ao validar token:', err);
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
    const isReset = urlParams.get('reset') === 'true' 
      || urlParams.get('type') === 'recovery'
      || urlParams.get('action') === 'set-password'; // 🎯 FIX: Suportar action=set-password do c-create-official-access
    if (isReset) {
      console.log('[AUTH] 🔐 Modo RESET PASSWORD detectado via URL');
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
    { value: "—", label: "Satisfação" }, // Disponível quando sistema de avaliação estiver ativo
  ];
  
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isUpdatePassword, setIsUpdatePassword] = useState(false); // 🎯 P0 FIX: Estado para definir nova senha
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // 🎯 P0 FIX
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [newPassword, setNewPassword] = useState(""); // 🎯 P0 FIX
  const [confirmPassword, setConfirmPassword] = useState(""); // 🎯 P0 FIX
  const [passwordUpdated, setPasswordUpdated] = useState(false); // 🎯 P0 FIX
  
  // 🎯 MAGIC PASSWORD FLOW: Estado para forçar troca de senha no primeiro login
  const [showForcePasswordChange, setShowForcePasswordChange] = useState(false);
  const [pendingPasswordChangeUser, setPendingPasswordChangeUser] = useState<{ email: string; userId: string } | null>(null);
  
  // Estado para 2FA
  const [show2FA, setShow2FA] = useState(false);
  const [pending2FAUser, setPending2FAUser] = useState<{ email: string; userId: string; nome?: string; phone?: string; deviceHash?: string } | null>(null);
  
  // 🔒 DOGMA I: Estado para bloqueio de sessão única
  const [showForceLogoutOption, setShowForceLogoutOption] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [pendingPassword, setPendingPassword] = useState<string | null>(null); // 🎯 FIX: Guardar senha para login automático
  const [isForceLoggingOut, setIsForceLoggingOut] = useState(false);
  
  // Estado para Cloudflare Turnstile (Anti-Bot)
  const { token: turnstileToken, isVerified: isTurnstileVerified, TurnstileProps, reset: resetTurnstile } = useTurnstile();

  // ============================================
  // ✅ P0-1 FIX DEFINITIVO: Se já existe sessão/user, /auth deve redirecionar
  // - SEMPRE busca role do banco antes de redirecionar
  // - Não redirecionar se 2FA estiver pendente nesta aba
  // - 🎯 FIX: Não redirecionar se estamos no modo de atualização de senha
  // ============================================
  useEffect(() => {
    const pendingKey = "matriz_2fa_pending";
    const pendingUserKey = "matriz_2fa_user";

    // 🎯 FIX CRÍTICO: Verificar se veio de link de recovery ANTES de qualquer redirect
    const urlParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    const isRecoveryFromUrl = urlParams.get('action') === 'set-password' 
      || urlParams.get('reset') === 'true' 
      || urlParams.get('type') === 'recovery'
      || urlParams.get('reset_token')
      || hash.includes('type=recovery');
    
    if (isRecoveryFromUrl) {
      console.log('[AUTH] 🔐 Link de recovery detectado - NÃO redirecionar automaticamente');
      setIsCheckingSession(false);
      return; // Deixar o outro useEffect tratar o reset de senha
    }

    // 🎯 FIX: Não redirecionar se já estamos no modo de update password
    if (isUpdatePassword) {
      console.log('[AUTH] 🔐 Em modo update password - não redirecionar');
      setIsCheckingSession(false);
      return;
    }

    // 👑 OWNER DEV MODE: ?dev=1 permite owner acessar /auth para desenvolvimento
    const isOwnerDevMode = urlParams.get('dev') === '1' && user?.email?.toLowerCase() === 'moisesblank@gmail.com';
    if (isOwnerDevMode) {
      console.log('[AUTH] 👑 OWNER DEV MODE - permanecendo em /auth para desenvolvimento');
      setIsCheckingSession(false);
      return;
    }

    // Função assíncrona para buscar role e redirecionar
    const redirectWithRole = async (userId: string, email: string | undefined) => {
      try {
        // ✅ P0-1 CRÍTICO: Buscar role ANTES de decidir destino
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .maybeSingle();
        
        const userRole = roleData?.role || null;
        const target = getPostLoginRedirect(userRole, email);
        console.log('[AUTH] ✅ Redirecionando para', target, '(role:', userRole, ')');
        navigate(target, { replace: true });
      } catch (err) {
        console.error('[AUTH] Erro ao buscar role no mount:', err);
        // Fallback seguro: usa função centralizada sem role (vai para /perfil-incompleto)
        const target = getPostLoginRedirect(null, email);
        navigate(target, { replace: true });
      }
    };

    // ✅ PRIMEIRO: Se o usuário já está autenticado
    // ⚠️ P0: NUNCA limpar 2FA pendente aqui (senão cria bypass/race)
    if (user) {
      const is2FAPending = sessionStorage.getItem(pendingKey) === "1";
      if (!is2FAPending) {
        sessionStorage.removeItem(pendingKey);
        sessionStorage.removeItem(pendingUserKey);
      }
      console.log('[AUTH] Usuário já autenticado - buscando role para redirect...');
      redirectWithRole(user.id, user.email);
      return;
    }

    const is2FAPending = sessionStorage.getItem(pendingKey) === "1";

    if (is2FAPending) {
      // ✅ Anti-stuck: se houve refresh com 2FA pendente, restaurar a UI do desafio.
      try {
        const raw = sessionStorage.getItem(pendingUserKey);
        const parsed = raw ? (JSON.parse(raw) as { email: string; userId: string; nome?: string }) : null;

        if (parsed?.email && parsed?.userId) {
          console.log('[AUTH] 0. 2FA pendente nesta aba - restaurando desafio');
          setPending2FAUser(parsed);
          setShow2FA(true);
          setIsCheckingSession(false);
          return;
        }

        console.warn('[AUTH] 0. Flag 2FA pendente sem payload - limpando (stale)');
        sessionStorage.removeItem(pendingKey);
      } catch (e) {
        console.warn('[AUTH] 0. Falha ao restaurar 2FA - limpando flag (stale)', e);
        sessionStorage.removeItem(pendingKey);
        sessionStorage.removeItem(pendingUserKey);
      }
    }

    // Fallback: sessão existe no storage, mas o provider ainda não refletiu
    (async () => {
      console.log('[AUTH] Verificando sessão existente (fallback)...');
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // 👑 OWNER DEV MODE: também respeitar no fallback
        const isOwnerDevModeFallback = urlParams.get('dev') === '1' && 
          session.user.email?.toLowerCase() === 'moisesblank@gmail.com';
        
        if (isOwnerDevModeFallback) {
          console.log('[AUTH] 👑 OWNER DEV MODE (fallback) - permanecendo em /auth');
          setIsCheckingSession(false);
          return;
        }
        
        console.log('[AUTH] Sessão encontrada - buscando role para redirect...');
        await redirectWithRole(session.user.id, session.user.email);
        return;
      }

      console.log('[AUTH] Sem sessão - mostrando formulário');
      setIsCheckingSession(false);
    })();
  }, [navigate, user, isUpdatePassword]);

  // Listener: login bem-sucedido deve sair de /auth
  // ✅ P0 FIX: Buscar role do banco ANTES de redirecionar
  // ✅ FIX: Tratar PASSWORD_RECOVERY para links de definição de senha
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // 🎯 FIX: Quando usuário clica no link de recovery, Supabase dispara PASSWORD_RECOVERY
      // Neste caso, devemos mostrar o formulário de definição de senha, NÃO redirecionar
      if (event === 'PASSWORD_RECOVERY') {
        console.log('[AUTH] 🔐 PASSWORD_RECOVERY event - mostrando formulário de nova senha');
        setIsUpdatePassword(true);
        setIsCheckingSession(false);
        return; // NÃO redirecionar, deixar usuário definir senha
      }

      if (event !== 'SIGNED_IN' || !session?.user) return;

      // Se estamos no modo de atualização de senha, não redirecionar
      if (isUpdatePassword) {
        console.log('[AUTH] 🔐 Em modo update password - não redirecionar');
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
        console.log('[AUTH] Role carregada do banco:', userRole);
        
        // 🎯 MAGIC PASSWORD FLOW: Verificar se precisa trocar senha
        const { data: profileData } = await supabase
          .from("profiles")
          .select("password_change_required")
          .eq("id", session.user.id)
          .maybeSingle();
        
        needsPasswordChange = profileData?.password_change_required === true;
        console.log('[AUTH] Password change required:', needsPasswordChange);
      } catch (err) {
        console.error('[AUTH] Erro ao buscar role/profile:', err);
      }

      // 🎯 MAGIC PASSWORD FLOW: Se precisa trocar senha, mostrar formulário
      if (needsPasswordChange) {
        console.log('[AUTH] 🔐 Usuário precisa trocar senha - mostrando formulário');
        setPendingPasswordChangeUser({
          email: session.user.email || '',
          userId: session.user.id,
        });
        setShowForcePasswordChange(true);
        setIsCheckingSession(false);
        return; // NÃO redirecionar
      }

      // ✅ REGRA DEFINITIVA: Usa função centralizada COM role
      const target = getPostLoginRedirect(userRole, session.user.email);
      console.log('[AUTH] ✅ SIGNED_IN - redirecionando para', target, '(role:', userRole, ')');
      navigate(target, { replace: true });
    });

    return () => subscription.unsubscribe();
  }, [navigate, isUpdatePassword]);

  useEffect(() => {
    console.log('[AUTH] 2. Turnstile hook status:', {
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
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      const email = (formData.email || '').trim();

      if (!email || !email.includes('@')) {
        setErrors({ email: "Digite um email válido" });
        setIsLoading(false);
        return;
      }

      // 🛡️ RESET DE SENHA: Turnstile obrigatório (evento de risco)
      // 🧿 OWNER BYPASS: owner nunca deve ser bloqueado por desafio externo
      if (!isOwnerEmail(email) && (!isTurnstileVerified || !turnstileToken)) {
        toast.error("Verificação de segurança necessária", {
          description: "Para recuperar a senha, complete a verificação anti-bot."
        });
        setIsLoading(false);
        return;
      }

      const { error } = await resetPassword(email);
      if (error) {
        toast.error(error.message);
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
        console.log('[AUTH] 🔐 Atualizando senha via fluxo customizado...');
        
        const { data, error } = await supabase.functions.invoke("custom-password-reset", {
          body: { 
            action: "reset", 
            token: resetToken, 
            newPassword: newPassword 
          },
        });

        if (error || data?.error) {
          console.error('[AUTH] Erro ao atualizar senha:', error || data?.error);
          toast.error(data?.error || "Erro ao atualizar senha");
          setIsLoading(false);
          return;
        }

        console.log('[AUTH] ✅ Senha atualizada com sucesso (fluxo customizado)!');
        setPasswordUpdated(true);
        toast.success("Senha atualizada com sucesso!");
        window.history.replaceState({}, document.title, '/auth');
        return;
      }

      // Fallback: fluxo antigo via supabase.auth.updateUser (quando vem do link nativo)
      console.log('[AUTH] 🔐 Atualizando senha via supabase.auth.updateUser (fallback)...');

      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        console.error('[AUTH] Erro ao atualizar senha:', error);
        toast.error(error.message || "Erro ao atualizar senha");
        setIsLoading(false);
        return;
      }

      console.log('[AUTH] ✅ Senha atualizada com sucesso!');
      setPasswordUpdated(true);
      toast.success("Senha atualizada com sucesso!");

      // Limpar URL params
      window.history.replaceState({}, document.title, '/auth');

    } catch (err: any) {
      console.error('[AUTH] Erro inesperado:', err);
      toast.error("Erro ao atualizar senha. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // 🔒 DOGMA I: FORÇAR ENCERRAMENTO DE OUTRAS SESSÕES
  // ============================================
  const handleForceLogout = async () => {
    console.log('[AUTH] handleForceLogout iniciado. pendingEmail:', pendingEmail, 'pendingPassword:', pendingPassword ? '***SET***' : 'NULL');
    
    if (!pendingEmail) {
      console.error('[AUTH] handleForceLogout: pendingEmail ausente');
      toast.error("Erro interno", { description: "Email não encontrado. Tente fazer login novamente." });
      setShowForceLogoutOption(false);
      return;
    }
    
    // Usar formData.password se pendingPassword estiver vazio
    const passwordToUse = pendingPassword || formData.password;
    if (!passwordToUse) {
      console.error('[AUTH] handleForceLogout: senha ausente');
      toast.error("Erro interno", { description: "Senha não encontrada. Tente fazer login novamente." });
      setShowForceLogoutOption(false);
      return;
    }
    
    setIsForceLoggingOut(true);
    console.log('[AUTH] 🔒 Forçando encerramento de sessões para:', pendingEmail);
    
    try {
      const { data, error } = await supabase.rpc('force_logout_other_sessions', {
        _email: pendingEmail
      });
      
      console.log('[AUTH] force_logout_other_sessions response:', { data, error });
      
      if (error) {
        console.error('[AUTH] Erro ao forçar logout (RPC):', {
          message: error.message,
          details: (error as any).details,
          hint: (error as any).hint,
          code: (error as any).code,
        });
        toast.error("Erro ao encerrar outras sessões", {
          description: `${error.message}${(error as any).code ? ` (code: ${(error as any).code})` : ''}`
        });
        setIsForceLoggingOut(false);
        return;
      }
      
      if (data) {
        console.log('[AUTH] ✅ Sessões anteriores encerradas com sucesso');
        
        // 🚀 BROADCAST: Enviar evento session-revoked para logout instantâneo
        // O user_id vem do data da RPC ou buscamos pelo email
        try {
          const { data: userData } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', pendingEmail.toLowerCase())
            .maybeSingle();
            
          if (userData?.id) {
            console.log('[AUTH] 📡 Enviando broadcast session-revoked para user:', userData.id);
            await supabase.channel(`user:${userData.id}`).send({
              type: 'broadcast',
              event: 'session-revoked',
              payload: { reason: 'force_logout', timestamp: new Date().toISOString() }
            });
          }
        } catch (broadcastError) {
          console.warn('[AUTH] ⚠️ Broadcast falhou (não crítico):', broadcastError);
        }
        
        toast.success("Outras sessões encerradas", {
          description: "Fazendo login agora..."
        });
        
        // 🎯 FIX: Fazer login automaticamente após encerrar sessões
        const savedEmail = pendingEmail;
        const savedPassword = passwordToUse; // Usar a variável que já foi validada
        
        // Limpar estado de bloqueio
        setShowForceLogoutOption(false);
        setPendingEmail(null);
        setPendingPassword(null);
        
        // Fazer login automaticamente
        console.log('[AUTH] 🔄 Iniciando login automático...');
        const result = await signIn(savedEmail, savedPassword, {});
        
        if (result.error) {
          console.error('[AUTH] Erro no login automático:', result.error);
          toast.error("Erro no login", {
            description: result.error.message || "Tente novamente."
          });
          setIsForceLoggingOut(false);
          return;
        }
        
        // Login bem sucedido - continuar com fluxo normal (2FA, etc)
        console.log('[AUTH] ✅ Login automático bem sucedido');
        
        // Restaurar formData para que o restante do fluxo funcione
        setFormData(prev => ({ ...prev, email: savedEmail, password: savedPassword }));
        
        // Se há usuário, verificar 2FA
        if (result.user) {
          // Coletar fingerprint para decisão 2FA
          const fp = await collectFingerprint();
          const deviceHash = fp.hash;
          
          // Buscar dados do perfil para 2FA
          const { data: profile } = await supabase
            .from('profiles')
            .select('nome, phone')
            .eq('id', result.user.id)
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
            }
          });
          
          if (twoFAResult.requires2FA) {
            console.log('[AUTH] 2FA necessário após login automático');
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
        console.warn('[AUTH] force_logout_other_sessions retornou false');
        toast.warning("Nenhuma sessão ativa encontrada", {
          description: "Tente fazer login normalmente."
        });
        setShowForceLogoutOption(false);
        setPendingEmail(null);
        setPendingPassword(null);
      }
    } catch (err: any) {
      console.error('[AUTH] Erro crítico ao forçar logout:', err);
      toast.error("Erro inesperado ao encerrar sessões");
    } finally {
      setIsForceLoggingOut(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[AUTH] === INICIANDO FLUXO DE LOGIN/SIGNUP ===');
    console.log('[AUTH] Timestamp:', new Date().toISOString());

    setErrors({});

    if (!isLogin && !acceptTerms) {
      toast.error("Você precisa aceitar os termos de uso");
      return;
    }

    // 🛡️ NOVA ESTRATÉGIA: Turnstile NÃO é obrigatório no login normal
    // Só é exigido em eventos de risco: signup, reset senha, muitas tentativas falhas
    // Login padrão flui SEM bloqueio por Turnstile

    console.log('[AUTH] 3. Estado Turnstile (não obrigatório no login):', {
      verified: isTurnstileVerified,
      hasToken: Boolean(turnstileToken),
    });

    setIsLoading(true);

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
        parsed.error.errors.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        console.error('[AUTH] ERROR: validação de formulário', fieldErrors);
        setErrors(fieldErrors);
        resetTurnstile();
        setIsLoading(false);
        return;
      }

      if (isLogin) {
        console.log('[AUTH] 4. Verificando sessão ativa existente...');

        // ============================================
        // 🔒 DOGMA I: SESSÃO ÚNICA GLOBAL - MODO BLOQUEIO
        // Verifica se já existe sessão ativa ANTES do login
        // ============================================
        try {
          const { data: sessionCheck, error: sessionCheckError } = await supabase.rpc(
            'check_active_session_exists',
            { _email: formData.email.toLowerCase().trim() }
          );

          if (!sessionCheckError && sessionCheck && sessionCheck.length > 0 && sessionCheck[0].has_active_session) {
            const activeSession = sessionCheck[0];
            console.warn('[AUTH] 🔴 BLOQUEIO: Sessão ativa detectada em outro dispositivo:', activeSession);
            
            toast.error("Sessão ativa detectada", {
              description: `Você já está logado em: ${activeSession.device_name || activeSession.device_type || 'outro dispositivo'}. Encerre a outra sessão primeiro.`,
              duration: 8000,
            });
            
            // Mostrar opção de forçar logout
            setShowForceLogoutOption(true);
            setPendingEmail(formData.email.toLowerCase().trim());
            setPendingPassword(formData.password); // 🎯 FIX: Guardar senha para login automático
            setIsLoading(false);
            return;
          }
        } catch (checkErr: any) {
          console.warn('[AUTH] ⚠️ Erro ao verificar sessão ativa (prosseguindo):', checkErr);
          // Se a verificação falhar, permite o login (fail-open temporário para não travar)
        }

        console.log('[AUTH] ✅ Nenhuma sessão ativa encontrada. Iniciando signInWithPassword...');

        const result = await withTimeout(
          'signInWithPassword',
          signIn(formData.email, formData.password, {})
        );

        console.log('[AUTH] Login response:', {
          hasError: Boolean(result.error),
          hasUser: Boolean(result.user),
          // Nosso 2FA é APP-level: se login OK, sempre exige 2FA antes do redirect.
          needs2FA: !result.error && Boolean(result.user),
        });

        console.log('[AUTH] 5. Resposta do signIn:', {
          hasError: Boolean(result.error),
          blocked: Boolean(result.blocked),
          needsChallenge: Boolean(result.needsChallenge),
          hasUser: Boolean(result.user),
        });

        if (result.blocked) {
          toast.error("Acesso bloqueado por segurança", {
            description: "Detectamos um risco elevado. Se você é você mesmo, fale com o suporte para liberar seu acesso."
          });
          resetTurnstile();
          setIsLoading(false);
          return;
        }

        if (result.needsChallenge) {
          toast.warning("Verificação adicional necessária", {
            description: "Refaça a verificação anti-bot e tente novamente. Se persistir, vamos ajustar o filtro para não travar alunos reais."
          });
          resetTurnstile();
          setIsLoading(false);
          return;
        }

        if (result.error) {
          console.error('[AUTH] ERROR: signIn retornou erro:', result.error);
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
          resetTurnstile();
          setIsLoading(false);
          return;
        }

        // ✅ Login bem sucedido - NÃO encerrar loading ainda (2FA decision em andamento)
        console.log('[AUTH] 6. Login bem sucedido. Verificando necessidade de 2FA...');

        const userFor2FA = result.user;
        if (!userFor2FA) {
          console.error('[AUTH] ERROR: user ausente após login');
          toast.error("Não foi possível concluir o login", {
            description: "Sua sessão não foi criada. Tente novamente."
          });
          setIsLoading(false);
          return;
        }

        // ============================================
        // 🛡️ DOGMA XI: VERIFICAR SE USUÁRIO ESTÁ BANIDO
        // ============================================
        console.log('[AUTH] 6.1. Verificando se usuário está banido...');
        const { data: isBanned, error: banCheckError } = await supabase.rpc('is_user_banned', {
          p_user_id: userFor2FA.id,
        });

        if (banCheckError) {
          console.warn('[AUTH] Erro ao verificar ban:', banCheckError);
          // Continua mesmo com erro (fail-open para não travar legítimos)
        } else if (isBanned === true) {
          console.error('[AUTH] ❌ USUÁRIO BANIDO - Bloqueando acesso');
          
          // Fazer logout imediato
          await supabase.auth.signOut();
          
          toast.error("Acesso Bloqueado", {
            description: "Sua conta foi suspensa. Entre em contato com o suporte.",
            duration: 10000,
          });
          resetTurnstile();
          setIsLoading(false);
          return;
        }

        console.log('[AUTH] 6.2. Usuário não está banido, prosseguindo...');

        // ============================================
        // 🛡️ 2FA DECISION ENGINE (SYNAPSE Ω v10.x)
        // Decidir SE 2FA é necessário baseado em sinais
        // ============================================
        try {
          console.log('[AUTH] 7. Coletando fingerprint para decisão 2FA...');
          const { hash: deviceHash, data: fingerprintData } = await collectFingerprint();

          // Chamar validate-device para obter sinais de risco
          // 🔧 FIX: usar 'validate' ao invés de 'post_login' pois a sessão ainda não foi propagada
          console.log('[AUTH] 8. Validando dispositivo...');
          const { data: validationData, error: validationError } = await supabase.functions.invoke('validate-device', {
            body: {
              fingerprint: deviceHash,
              fingerprintData,
              email: userFor2FA.email,
              action: 'validate',  // 🔧 'validate' não exige JWT, só fingerprint
            },
          });

          if (validationError) {
            console.warn('[AUTH] Erro na validação de dispositivo:', validationError);
          }

          // Extrair sinais da validação
          const deviceSignals = {
            isNewDevice: validationData?.isNewDevice ?? true,
            countryChanged: validationData?.countryChanged ?? false,
            rapidChange: validationData?.rapidChange ?? false,
            riskScore: validationData?.riskScore ?? 0,
            deviceHash,
          };

          console.log('[AUTH] 9. Sinais do dispositivo:', deviceSignals);

          // Decidir SE 2FA é necessário
          const decision = await decide2FA({
            userId: userFor2FA.id,
            email: userFor2FA.email || formData.email,
            deviceHash,
            deviceSignals,
            isPasswordReset: false, // Login normal, não é reset de senha
          });

          console.log('[AUTH] 10. Decisão 2FA:', decision);

          if (!decision.requires2FA) {
            // ✅ NÃO PRECISA DE 2FA - Dispositivo confiável dentro da janela de 24h
            console.log('[AUTH] ✅ 2FA dispensado - dispositivo confiável');
            
            // ============================================
            // 🛡️ BLOCO 3: REGISTRAR DISPOSITIVO ANTES DA SESSÃO
            // ============================================
            console.log('[AUTH][BLOCO3] 🔐 Registrando dispositivo ANTES da sessão...');
            const deviceResult = await registerDeviceBeforeSession();
            
            if (!deviceResult.success) {
              console.error('[AUTH][BLOCO3] ❌ Falha no registro de dispositivo:', deviceResult.error);
              
              // FAIL-CLOSED: Bloquear login se limite excedido
              if (deviceResult.error === 'DEVICE_LIMIT_EXCEEDED') {
                console.log('[AUTH][BLOCO3] 🛡️ Limite excedido - redirecionando para DeviceLimitGate');
                
                // Coletar dados do device atual para o payload
                const fingerprintData = await collectFingerprintRawData();
                const deviceName = generateDeviceName(fingerprintData);
                
                const currentDevice: CurrentDeviceInfo = {
                  device_type: fingerprintData.deviceType,
                  os_name: fingerprintData.os,
                  browser_name: fingerprintData.browser,
                  label: deviceName,
                };

                const devices: DeviceInfo[] = (deviceResult.devices || []).map((d: any, index: number) => ({
                  device_id: d.device_id || d.id,
                  label: d.label || d.device_name || `${d.os_name || d.os || 'Sistema'} • ${d.browser_name || d.browser || 'Navegador'}`,
                  device_type: d.device_type || 'desktop',
                  os_name: d.os_name || d.os || 'Desconhecido',
                  browser_name: d.browser_name || d.browser || 'Desconhecido',
                  last_seen_at: d.last_seen_at,
                  first_seen_at: d.first_seen_at || d.last_seen_at,
                  is_recommended_to_disconnect: d.is_recommended_to_disconnect ?? (index === (deviceResult.devices?.length || 1) - 1),
                }));

                const gatePayload: DeviceGatePayload = {
                  code: 'DEVICE_LIMIT_EXCEEDED',
                  message: 'Você ultrapassou o limite de dispositivos da sua conta',
                  max_devices: deviceResult.maxDevices || 3,
                  current_devices: deviceResult.deviceCount || 3,
                  current_device: currentDevice,
                  devices,
                  action_required: 'REVOKE_ONE_DEVICE_TO_CONTINUE',
                };

                // Salvar no store e redirecionar
                useDeviceGateStore.getState().setPayload(gatePayload);
                
                resetTurnstile();
                setIsLoading(false);
                navigate('/security/device-limit');
                return;
              }
              
              // Outros erros de dispositivo
              const errorMsg = getDeviceErrorMessage(deviceResult.error || 'UNEXPECTED_ERROR');
              toast.error(errorMsg.title, { description: errorMsg.description });
              await supabase.auth.signOut();
              resetTurnstile();
              setIsLoading(false);
              return;
            }
            
            console.log('[AUTH][BLOCO3] ✅ Dispositivo vinculado:', deviceResult.deviceId);
            
            // 🔐 PIECE 1: PROGRESSIVE AWARENESS RULES - Mostrar aviso se houver
            if (deviceResult.notice?.level && deviceResult.notice?.message) {
              if (deviceResult.notice.level === 'INFO') {
                toast.info('Novo Dispositivo', {
                  description: deviceResult.notice.message,
                  duration: 5000,
                });
              } else if (deviceResult.notice.level === 'WARNING') {
                toast.warning('Atenção', {
                  description: deviceResult.notice.message,
                  duration: 7000,
                });
              } else if (deviceResult.notice.level === 'HARD_WARNING') {
                toast.warning('Último Slot Disponível', {
                  description: deviceResult.notice.message,
                  duration: 10000,
                });
              }
            }
            
            // 🔒 DOGMA I: CRIAR SESSÃO ÚNICA IMEDIATAMENTE (APÓS dispositivo vinculado)
            // ============================================
            try {
              const SESSION_TOKEN_KEY = 'matriz_session_token';
              const ua = navigator.userAgent;
              let device_type = 'desktop';
              if (/Mobi|Android|iPhone|iPad/i.test(ua)) {
                device_type = /iPad|Tablet/i.test(ua) ? 'tablet' : 'mobile';
              }
              let browser = 'unknown';
              if (ua.includes('Firefox')) browser = 'Firefox';
              else if (ua.includes('Edg')) browser = 'Edge';
              else if (ua.includes('Chrome')) browser = 'Chrome';
              else if (ua.includes('Safari')) browser = 'Safari';
              let os = 'unknown';
              if (ua.includes('Windows')) os = 'Windows';
              else if (ua.includes('Mac')) os = 'macOS';
              else if (ua.includes('Linux')) os = 'Linux';
              else if (ua.includes('Android')) os = 'Android';
              else if (ua.includes('iPhone')) os = 'iOS';

              // ✅ Fonte da verdade: RPC SECURITY DEFINER (evita RLS/race)
              const { data, error } = await supabase.rpc('create_single_session', {
                _ip_address: null,
                _user_agent: navigator.userAgent.slice(0, 255),
                _device_type: device_type,
                _browser: browser,
                _os: os,
                _device_hash_from_server: deviceResult.deviceHash ?? null,
              });

              // 🛡️ MODELO HÍBRIDO: Tratar DEVICE_LIMIT_EXCEEDED para alunos
              if (error) {
                const errorMsg = error.message || '';
                
                // Verificar se é erro de limite de dispositivos (alunos)
                if (errorMsg.includes('DEVICE_LIMIT_EXCEEDED')) {
                  console.log('[AUTH][SESSAO] 🛡️ Limite de sessões excedido (aluno) - redirecionando para DeviceLimitGate');
                  
                  // Parse dos valores do erro: "DEVICE_LIMIT_EXCEEDED:max=3,current=3"
                  const maxMatch = errorMsg.match(/max=(\d+)/);
                  const currentMatch = errorMsg.match(/current=(\d+)/);
                  const maxDevices = maxMatch ? parseInt(maxMatch[1]) : 3;
                  const currentDevices = currentMatch ? parseInt(currentMatch[1]) : 3;
                  
                  // Buscar sessões ativas do usuário para mostrar no Gate
                  const { data: activeSessions } = await supabase.rpc('get_user_active_sessions');
                  
                  const fingerprintData = await collectFingerprintRawData();
                  const deviceName = generateDeviceName(fingerprintData);
                  
                  const currentDevice: CurrentDeviceInfo = {
                    device_type: fingerprintData.deviceType,
                    os_name: fingerprintData.os,
                    browser_name: fingerprintData.browser,
                    label: deviceName,
                  };

                  const devices: DeviceInfo[] = (activeSessions || []).map((s: any, index: number) => ({
                    device_id: s.id,
                    label: s.device_name || `${s.os || 'Sistema'} • ${s.browser || 'Navegador'}`,
                    device_type: s.device_type || 'desktop',
                    os_name: s.os || 'Desconhecido',
                    browser_name: s.browser || 'Desconhecido',
                    last_seen_at: s.last_activity_at,
                    first_seen_at: s.created_at,
                    is_recommended_to_disconnect: index === (activeSessions?.length || 1) - 1,
                  }));

                  const gatePayload: DeviceGatePayload = {
                    code: 'DEVICE_LIMIT_EXCEEDED',
                    message: 'Você ultrapassou o limite de dispositivos da sua conta',
                    max_devices: maxDevices,
                    current_devices: currentDevices,
                    current_device: currentDevice,
                    devices,
                    action_required: 'REVOKE_ONE_DEVICE_TO_CONTINUE',
                  };

                  useDeviceGateStore.getState().setPayload(gatePayload);
                  resetTurnstile();
                  setIsLoading(false);
                  navigate('/security/device-limit');
                  return;
                }
                
                // Outro erro genérico
                console.error('[AUTH][SESSAO] ❌ Falha ao criar sessão única (RPC):', error);
                toast.error('Falha crítica de segurança', {
                  description: 'Não foi possível iniciar a sessão única. Faça login novamente.',
                  duration: 9000,
                });
                await supabase.auth.signOut();
                resetTurnstile();
                setIsLoading(false);
                return;
              }
              
              if (!data?.[0]?.session_token) {
                console.error('[AUTH][SESSAO] ❌ Sessão criada mas sem token');
                toast.error('Falha crítica de segurança', {
                  description: 'Não foi possível iniciar a sessão única. Faça login novamente.',
                  duration: 9000,
                });
                await supabase.auth.signOut();
                resetTurnstile();
                setIsLoading(false);
                return;
              }

              localStorage.setItem(SESSION_TOKEN_KEY, data[0].session_token);
              console.log('[AUTH][SESSAO] ✅ Sessão única criada (RPC) e token armazenado');
            } catch (sessErr: any) {
              // 🛡️ Também tratar exceção como possível DEVICE_LIMIT_EXCEEDED
              const errMsg = sessErr?.message || String(sessErr);
              if (errMsg.includes('DEVICE_LIMIT_EXCEEDED')) {
                console.log('[AUTH][SESSAO] 🛡️ Limite excedido (catch) - redirecionando');
                
                const { data: activeSessions } = await supabase.rpc('get_user_active_sessions');
                const fingerprintData = await collectFingerprintRawData();
                const deviceName = generateDeviceName(fingerprintData);
                
                const gatePayload: DeviceGatePayload = {
                  code: 'DEVICE_LIMIT_EXCEEDED',
                  message: 'Você ultrapassou o limite de dispositivos da sua conta',
                  max_devices: 3,
                  current_devices: activeSessions?.length || 3,
                  current_device: {
                    device_type: fingerprintData.deviceType,
                    os_name: fingerprintData.os,
                    browser_name: fingerprintData.browser,
                    label: deviceName,
                  },
                  devices: (activeSessions || []).map((s: any, i: number) => ({
                    device_id: s.id,
                    label: s.device_name || `${s.os || 'Sistema'} • ${s.browser || 'Navegador'}`,
                    device_type: s.device_type || 'desktop',
                    os_name: s.os || 'Desconhecido',
                    browser_name: s.browser || 'Desconhecido',
                    last_seen_at: s.last_activity_at,
                    first_seen_at: s.created_at,
                    is_recommended_to_disconnect: i === (activeSessions?.length || 1) - 1,
                  })),
                  action_required: 'REVOKE_ONE_DEVICE_TO_CONTINUE',
                };

                useDeviceGateStore.getState().setPayload(gatePayload);
                resetTurnstile();
                setIsLoading(false);
                navigate('/security/device-limit');
                return;
              }
              
              console.warn('[AUTH][SESSAO] Erro crítico ao criar sessão (RPC):', sessErr);
              toast.error('Falha crítica de segurança', {
                description: 'Não foi possível iniciar a sessão única. Faça login novamente.',
                duration: 9000,
              });
              await supabase.auth.signOut();
              resetTurnstile();
              setIsLoading(false);
              return;
            }
            
            toast.success("Bem-vindo de volta!", {
              description: deviceResult.isNewDevice 
                ? "Novo dispositivo registrado com sucesso." 
                : "Dispositivo reconhecido. Login realizado com sucesso."
            });
            
            // Buscar role e redirecionar
            const { data: roleData } = await supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", userFor2FA.id)
              .maybeSingle();
            
            const userRole = roleData?.role || null;
            const target = getPostLoginRedirect(userRole, userFor2FA.email);
            console.log('[AUTH] ✅ Redirecionando para', target, '(role:', userRole, ')');
            setIsLoading(false);
            navigate(target, { replace: true });
            return;
          }

          // ✅ PRECISA DE 2FA - Mostrar desafio
          console.log('[AUTH] ⚠️ 2FA necessário:', decision.reason);
          
          // Encerrar loading e mostrar 2FA
          setIsLoading(false);

          // Setar flag ANTES de qualquer efeito global (AuthProvider)
          sessionStorage.setItem("matriz_2fa_pending", "1");
          sessionStorage.setItem(
            "matriz_2fa_user",
            JSON.stringify({
              email: userFor2FA.email || formData.email,
              userId: userFor2FA.id,
              nome: (userFor2FA.user_metadata as any)?.nome,
              phone: (userFor2FA.user_metadata as any)?.phone || (userFor2FA.user_metadata as any)?.telefone,
              deviceHash, // ✅ Incluir deviceHash para cache após 2FA
            })
          );

          setPending2FAUser({
            email: userFor2FA.email || formData.email,
            userId: userFor2FA.id,
            nome: (userFor2FA.user_metadata as any)?.nome,
            phone: (userFor2FA.user_metadata as any)?.phone || (userFor2FA.user_metadata as any)?.telefone,
            deviceHash, // ✅ Incluir deviceHash para cache após 2FA
          });
          setShow2FA(true);
          
          // Toast informativo com razão
          toast.info("Verificação de Segurança", {
            description: decision.reason
          });

        } catch (decisionError) {
          console.error('[AUTH] Erro na decisão 2FA - fallback para SEMPRE pedir 2FA:', decisionError);
          
          // Em caso de erro, SEMPRE pedir 2FA (segurança)
          setIsLoading(false);
          
          sessionStorage.setItem("matriz_2fa_pending", "1");
          sessionStorage.setItem(
            "matriz_2fa_user",
            JSON.stringify({
              email: userFor2FA.email || formData.email,
              userId: userFor2FA.id,
              nome: (userFor2FA.user_metadata as any)?.nome,
              phone: (userFor2FA.user_metadata as any)?.phone || (userFor2FA.user_metadata as any)?.telefone,
            })
          );

          setPending2FAUser({
            email: userFor2FA.email || formData.email,
            userId: userFor2FA.id,
            nome: (userFor2FA.user_metadata as any)?.nome,
            phone: (userFor2FA.user_metadata as any)?.phone || (userFor2FA.user_metadata as any)?.telefone,
          });
          setShow2FA(true);
          toast.info("Verificação de Segurança 2FA", {
            description: "Um código de 6 dígitos foi enviado para " + (userFor2FA.email || formData.email)
          });
        }

        return;
      }

      // SIGNUP
      console.log('[AUTH] 4. Iniciando signup...');

      if (!isTurnstileVerified || !turnstileToken) {
        console.error('[AUTH] ERROR: Turnstile ausente no signup');
        toast.error("Verificação de segurança necessária", {
          description: "Para criar uma conta, complete a verificação anti-bot."
        });
        setIsLoading(false);
        return;
      }

      const signupResult = await withTimeout(
        'signUp',
        signUp(formData.email, formData.password, formData.nome)
      );

      console.log('[AUTH] 5. Resposta do signUp:', { hasError: Boolean(signupResult.error) });

      if (signupResult.error) {
        console.error('[AUTH] ERROR: signUp retornou erro:', signupResult.error);
        if (signupResult.error.message.includes("User already registered")) {
          toast.error("Email já cadastrado", {
            description: "Este email já possui uma conta. Tente fazer login."
          });
        } else {
          toast.error("Erro no cadastro", {
            description: signupResult.error.message
          });
        }
        resetTurnstile();
        setIsLoading(false);
        return;
      }

      toast.success("Conta criada com sucesso!", {
        description: "Você já pode fazer login."
      });
      setIsLogin(true);
      setFormData({ nome: "", email: formData.email, password: "" });

    } catch (err: any) {
      console.error('[AUTH] ERROR:', err);
      toast.error("Erro ao processar solicitação", {
        description: err?.message || 'Falha inesperada'
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
        <SpiderWebPattern />
        <CyberGrid />
        <GlowingOrbs />
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
        <SpiderWebPattern />
        <CyberGrid />
        <GlowingOrbs />
        <Suspense fallback={<div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />}>
          <TwoFactorVerification
            email={pending2FAUser.email}
            userId={pending2FAUser.userId}
            userName={pending2FAUser.nome}
            userPhone={pending2FAUser.phone}
            onVerified={async () => {
              console.log('[AUTH] ✅ 2FA verificado com sucesso, iniciando redirect...');

              // ✅ OTIMIZAÇÃO: Salvar cache de confiança após 2FA bem-sucedido
              if (pending2FAUser.deviceHash) {
                setTrustCache(pending2FAUser.userId, pending2FAUser.deviceHash);
                console.log('[AUTH] ✅ Trust cache salvo para próximos logins');
              }

              // ✅ P0 FIX: Limpar flags ANTES de qualquer redirect
              sessionStorage.removeItem("matriz_2fa_pending");
              sessionStorage.removeItem("matriz_2fa_user");

              // ============================================
              // 🛡️ BLOCO 3: REGISTRAR DISPOSITIVO ANTES DA SESSÃO (pós-2FA)
              // ============================================
              console.log('[AUTH][BLOCO3] 🔐 Registrando dispositivo ANTES da sessão (pós-2FA)...');
              const deviceResult = await registerDeviceBeforeSession();
              
              if (!deviceResult.success) {
                console.error('[AUTH][BLOCO3] ❌ Falha no registro de dispositivo pós-2FA:', deviceResult.error);
                
                // FAIL-CLOSED: Bloquear login se limite excedido
                if (deviceResult.error === 'DEVICE_LIMIT_EXCEEDED') {
                  console.log('[AUTH][BLOCO3] 🛡️ Limite excedido pós-2FA - redirecionando para DeviceLimitGate');
                  
                  // Salvar payload no store para o Gate
                  if (deviceResult.gatePayload) {
                    useDeviceGateStore.getState().setPayload(deviceResult.gatePayload);
                  }
                  
                  // NÃO fazer logout - manter sessão para que o Gate possa revogar dispositivos
                  setShow2FA(false);
                  setPending2FAUser(null);
                  navigate('/security/device-limit', { replace: true });
                  return;
                }
                
                // Outros erros de dispositivo
                const errorMsg = getDeviceErrorMessage(deviceResult.error || 'UNEXPECTED_ERROR');
                toast.error(errorMsg.title, { description: errorMsg.description });
                await supabase.auth.signOut();
                setShow2FA(false);
                setPending2FAUser(null);
                return;
              }
              
              console.log('[AUTH][BLOCO3] ✅ Dispositivo vinculado pós-2FA:', deviceResult.deviceId);

              // ✅ P0: Sessão única só NASCE após dispositivo vinculado + 2FA validado
              try {
                const SESSION_TOKEN_KEY = 'matriz_session_token';
                const ua = navigator.userAgent;
                let device_type = 'desktop';
                if (/Mobi|Android|iPhone|iPad/i.test(ua)) {
                  device_type = /iPad|Tablet/i.test(ua) ? 'tablet' : 'mobile';
                }

                let browser = 'unknown';
                if (ua.includes('Firefox')) browser = 'Firefox';
                else if (ua.includes('Edg')) browser = 'Edge';
                else if (ua.includes('Chrome')) browser = 'Chrome';
                else if (ua.includes('Safari')) browser = 'Safari';

                let os = 'unknown';
                if (ua.includes('Windows')) os = 'Windows';
                else if (ua.includes('Mac')) os = 'macOS';
                else if (ua.includes('Linux')) os = 'Linux';
                else if (ua.includes('Android')) os = 'Android';
                else if (ua.includes('iPhone')) os = 'iOS';

                const { data, error } = await supabase.rpc('create_single_session', {
                  _ip_address: null,
                  _user_agent: navigator.userAgent.slice(0, 255),
                  _device_type: device_type,
                  _browser: browser,
                  _os: os,
                  _device_hash_from_server: deviceResult.deviceHash ?? null,
                });

                if (error || !data?.[0]?.session_token) {
                  console.error('[AUTH][SESSAO] ❌ Falha ao criar sessão única pós-2FA (RPC):', error);
                  toast.error('Falha crítica de segurança', {
                    description: 'Não foi possível iniciar a sessão única. Faça login novamente.',
                    duration: 9000,
                  });
                  await supabase.auth.signOut();
                  setShow2FA(false);
                  setPending2FAUser(null);
                  return;
                }

                localStorage.setItem(SESSION_TOKEN_KEY, data[0].session_token);
                console.log('[AUTH][SESSAO] ✅ Sessão única criada pós-2FA (RPC) e token armazenado');
              } catch (err) {
                console.warn('[AUTH][SESSAO] Erro crítico ao criar sessão pós-2FA (RPC):', err);
                toast.error('Falha crítica de segurança', {
                  description: 'Não foi possível iniciar a sessão única. Faça login novamente.',
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

                console.log('[AUTH] ✅ 2FA completo - redirecionando para', target, '(role:', userRole, ')');
                toast.success("Bem-vindo de volta!", {
                  description: deviceResult.isNewDevice 
                    ? "Novo dispositivo registrado com sucesso." 
                    : "Dispositivo reconhecido."
                });

                window.location.replace(target);
              } catch (err) {
                console.error('[AUTH] Erro ao buscar role pós-2FA:', err);
                toast.success("Bem-vindo de volta!");
                window.location.replace('/gestaofc');
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
                console.warn('[AUTH] Falha ao deslogar no cancel 2FA:', err);
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
        <SpiderWebPattern />
        <CyberGrid />
        <GlowingOrbs />
        <Suspense fallback={<div className="text-white">Carregando...</div>}>
          <ForcePasswordChange
            userEmail={pendingPasswordChangeUser.email}
            userId={pendingPasswordChangeUser.userId}
            onPasswordChanged={() => {
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
    const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);
    const isTablet = /iPad|Android(?!.*Mobile)/i.test(ua);
    
    let deviceType: 'desktop' | 'tablet' | 'mobile' = 'desktop';
    if (isTablet) deviceType = 'tablet';
    else if (isMobile) deviceType = 'mobile';
    
    let browser = 'Navegador';
    if (ua.includes('Chrome')) browser = 'Google Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Microsoft Edge';
    else if (ua.includes('Opera')) browser = 'Opera';
    
    let os = 'Sistema';
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
    
    return { deviceType, browser, os };
  };
  
  const currentDevice = detectCurrentDevice();
  
  if (showForceLogoutOption && pendingEmail) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <SpiderWebPattern />
        <CyberGrid />
        <GlowingOrbs />
        <div className="relative z-10 w-full max-w-md">
          <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-primary/30 rounded-2xl p-8 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Sessão Ativa Detectada
              </h2>
              <p className="text-gray-400 text-sm">
                Você já está logado em outro dispositivo
              </p>
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
                <div className={`flex flex-col items-center p-3 rounded-lg border ${
                  currentDevice.deviceType === 'desktop' 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-white/10 text-gray-500'
                }`}>
                  <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-[10px]">Desktop</span>
                </div>
                <div className={`flex flex-col items-center p-3 rounded-lg border ${
                  currentDevice.deviceType === 'tablet' 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-white/10 text-gray-500'
                }`}>
                  <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className="text-[10px]">Tablet</span>
                </div>
                <div className={`flex flex-col items-center p-3 rounded-lg border ${
                  currentDevice.deviceType === 'mobile' 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-white/10 text-gray-500'
                }`}>
                  <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
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
                  <p className="text-gray-500 text-xs">
                    Dispositivo detectado automaticamente
                  </p>
                </div>
                <div className="px-2 py-1 bg-primary/20 rounded text-primary text-xs font-medium">
                  Atual
                </div>
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
            <p className="text-xs text-gray-500 text-center mt-6">
              A outra sessão será encerrada imediatamente.
            </p>
          </div>
        </div>
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
                  <OptimizedImage
                    src={professorPhoto}
                    alt="Professor Moisés"
                    width={240}
                    height={240}
                    aspectRatio="square"
                    objectFit="cover"
                    objectPosition="50% 15%"
                    placeholderColor="#1a0a0a"
                    priority={false}
                    className="border-4 border-primary/60 shadow-2xl shadow-primary/30"
                    containerClassName="w-60 h-60 rounded-full overflow-hidden"
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
                      {errors.password && (
                        <p className="text-xs text-red-400 mt-1">{errors.password}</p>
                      )}
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
                      {errors.confirmPassword && (
                        <p className="text-xs text-red-400 mt-1">{errors.confirmPassword}</p>
                      )}
                    </div>

                    <p className="text-xs text-gray-500">
                      A senha deve conter: letra minúscula, maiúscula, número e caractere especial
                    </p>
                    
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-primary via-[#B22222] to-primary text-white font-semibold shadow-xl shadow-primary/30"
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        "Salvar Nova Senha"
                      )}
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

                    {/* Cloudflare Turnstile - RESET DE SENHA (evento de risco) */}
                    {!isOwnerEmail((formData.email || '').trim()) && (
                      <div className="py-2">
                        <CloudflareTurnstile
                          {...TurnstileProps}
                          theme="dark"
                          size="flexible"
                          showStatus={true}
                        />
                      </div>
                    )}
                    
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

              {/* Cloudflare Turnstile - APENAS para signup (evento de risco) */}
              {!isLogin && (
                <div className="py-2">
                  <CloudflareTurnstile
                    {...TurnstileProps}
                    theme="dark"
                    size="flexible"
                    showStatus={true}
                  />
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
