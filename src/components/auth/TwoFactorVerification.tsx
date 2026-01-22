// ============================================
// MOISÉS MEDEIROS v10.0 - Two Factor Verification
// Componente de verificação 2FA com escolha de canal
// Email ou WhatsApp
// ============================================

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  Mail, 
  RefreshCw, 
  Lock, 
  CheckCircle, 
  AlertCircle, 
  Timer,
  AlertTriangle,
  ShieldAlert,
  MessageCircle,
  Smartphone,
  Phone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface TwoFactorVerificationProps {
  email: string;
  userId: string;
  userName?: string;
  userPhone?: string;
  onVerified: () => void | Promise<void>;
  onCancel: () => void | Promise<void>;
}

type Channel = "email" | "sms" | "whatsapp";

export function TwoFactorVerification({
  email,
  userId,
  userName,
  userPhone,
  onVerified,
  onCancel
}: TwoFactorVerificationProps) {
  // Estado de seleção de canal
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [showChannelSelection, setShowChannelSelection] = useState(true);

  // 📌 Telefone efetivo (prop -> fallback no perfil)
  const [profilePhone, setProfilePhone] = useState<string | null>(null);
  const effectivePhone = (userPhone || profilePhone || "").replace(/\D/g, "");

  // Estado do código
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);
  const [currentChannel, setCurrentChannel] = useState<Channel>("email");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // 🛡️ Proteção contra chamadas duplicadas
  const verifyingRef = useRef(false);
  const lastVerifiedCodeRef = useRef<string | null>(null);

  // Buscar telefone do perfil caso não venha do login (libera SMS/WhatsApp)
  useEffect(() => {
    if (userPhone) return;
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("phone")
        .eq("id", userId)
        .maybeSingle();

      if (!cancelled && !error) {
        setProfilePhone(data?.phone || null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, userPhone]);

  // Verificar se tem WhatsApp disponível
  const hasWhatsApp = Boolean(effectivePhone && effectivePhone.length >= 10);

  // Countdown para reenvio
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Countdown de lockout
  useEffect(() => {
    if (lockoutTime > 0) {
      const timer = setTimeout(() => setLockoutTime(lockoutTime - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isLocked && lockoutTime === 0) {
      setIsLocked(false);
      setAttemptsRemaining(5);
    }
  }, [lockoutTime, isLocked]);

  // Selecionar canal e enviar código
  const selectChannelAndSend = async (channel: Channel) => {
    setSelectedChannel(channel);
    setCurrentChannel(channel);
    setShowChannelSelection(false);
    await sendCode(channel);
  };

  const sendCode = useCallback(async (channel: Channel = currentChannel) => {
    console.log(`[AUTH][2FA] Enviando código via ${channel}...`);
    setIsResending(true);
    setError("");

    const TIMEOUT_MS = 30_000;
    const withTimeout = async <T,>(label: string, promise: Promise<T>): Promise<T> => {
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      try {
        const timeoutPromise = new Promise<T>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error(`Timeout ${TIMEOUT_MS}ms em: ${label}`)), TIMEOUT_MS);
        });
        return await Promise.race([promise, timeoutPromise]);
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
      }
    };

    try {
      const { data, error } = await withTimeout(
        'send-2fa-code',
        supabase.functions.invoke("send-2fa-code", {
          body: {
            email,
            userId,
            userName,
            // ✅ usar telefone efetivo (prop OU perfil) para WhatsApp/SMS
            phone: effectivePhone || userPhone,
            channel,
          },
        })
      );

      console.log('[AUTH][2FA] Resposta send-2fa-code:', {
        hasError: Boolean(error),
        hasData: Boolean(data),
        channel: (data as any)?.channel,
      });

      if (error) throw error;

      if ((data as any)?.error) {
        if ((data as any).retryAfter) {
          toast.error("Muitas tentativas", {
            description: "Aguarde 15 minutos para solicitar novo código"
          });
          return;
        }
        throw new Error((data as any).error);
      }

      // Atualizar canal usado (pode ter sido fallback)
      const usedChannel = (data as any)?.channel || channel;
      setCurrentChannel(usedChannel);

      const channelLabels: Record<Channel, string> = {
        email: "email",
        sms: "SMS",
        whatsapp: "WhatsApp"
      };
      const channelLabel = channelLabels[usedChannel as Channel] || usedChannel;
      const destination = usedChannel === "email"
        ? email
        : formatPhone(effectivePhone);

      toast.success(`Código enviado via ${channelLabel}!`, {
        description: `Verifique seu ${channelLabel}: ${destination}`,
      });

      setCountdown(60);
    } catch (err: any) {
      console.error('[AUTH][2FA] ERROR sendCode:', err);

      const status = err?.context?.status ?? err?.status;
      const message = String(err?.message || '');

      // 🛡️ AUDITORIA/RECOVERY: se o backend diz que o userId não existe,
      // isso indica sessão/token local stale (ex: conta deletada/recriada).
      // Regra: fail-closed → limpar artefatos e forçar reauth.
      if (status === 404 || /usuário não encontrado/i.test(message)) {
        try {
          sessionStorage.removeItem('matriz_2fa_pending');
          sessionStorage.removeItem('matriz_2fa_user');
          sessionStorage.removeItem('matriz_password_change_pending');

          const keysToRemove: string[] = [
            'matriz_session_token',
            'matriz_last_heartbeat',
            'matriz_device_fingerprint',
            'matriz_trusted_device',
          ];
          keysToRemove.forEach((k) => localStorage.removeItem(k));

          // Remover tokens do client (sb-*-auth-token)
          for (let i = localStorage.length - 1; i >= 0; i--) {
            const k = localStorage.key(i);
            if (k && /^sb-.*-auth-token$/.test(k)) localStorage.removeItem(k);
          }

          await supabase.auth.signOut();
        } catch (cleanupErr) {
          console.warn('[AUTH][2FA] Cleanup/reauth falhou (continuando):', cleanupErr);
        }

        toast.error('Sessão inválida', {
          description: 'Sua sessão estava desatualizada. Faça login novamente.',
        });
        window.location.replace('/auth?reauth=1');
        return;
      }

      setError(message || 'Erro ao enviar código');
      toast.error('Erro ao enviar código', {
        description: message || 'Tente novamente em alguns segundos',
      });
    } finally {
      setIsResending(false);
    }
  }, [email, userId, userName, userPhone, currentChannel]);

  const handleInputChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    if (isLocked) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError("");

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newCode.every(digit => digit !== "") && newCode.join("").length === 6) {
      verifyCode(newCode.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    if (isLocked) return;
    
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    
    if (pastedData.length === 6) {
      const newCode = pastedData.split("");
      setCode(newCode);
      verifyCode(pastedData);
    }
  };

  const verifyCode = async (fullCode: string) => {
    // 🛡️ PROTEÇÃO: Evitar chamadas duplicadas
    if (verifyingRef.current) {
      console.log('[AUTH][2FA] Verificação já em andamento, ignorando...');
      return;
    }
    
    // 🛡️ PROTEÇÃO: Não verificar o mesmo código duas vezes
    if (lastVerifiedCodeRef.current === fullCode) {
      console.log('[AUTH][2FA] Código já foi verificado anteriormente, ignorando...');
      return;
    }

    console.log('[AUTH][2FA] Verificando código...');
    verifyingRef.current = true;
    setIsLoading(true);
    setError("");

    const TIMEOUT_MS = 30_000;
    const withTimeout = async <T,>(label: string, promise: Promise<T>): Promise<T> => {
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      try {
        const timeoutPromise = new Promise<T>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error(`Timeout ${TIMEOUT_MS}ms em: ${label}`)), TIMEOUT_MS);
        });
        return await Promise.race([promise, timeoutPromise]);
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
      }
    };

    try {
      const { data, error } = await withTimeout(
        'verify-2fa-code',
        supabase.functions.invoke("verify-2fa-code", {
          body: { userId, code: fullCode }
        })
      );

      if (error || !(data as any)?.valid) {
        if ((data as any)?.lockedUntil) {
          setIsLocked(true);
          setLockoutTime((data as any).remainingSeconds || 900);
          setError("Conta temporariamente bloqueada por excesso de tentativas");
          setCode(["", "", "", "", "", ""]);
          return;
        }

        if ((data as any)?.attemptsRemaining !== undefined) {
          setAttemptsRemaining((data as any).attemptsRemaining);
        }

        setError((data as any)?.error || "Código inválido");
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        return;
      }

      // ✅ Sucesso - marcar código como verificado para evitar reuso
      lastVerifiedCodeRef.current = fullCode;

      toast.success("Verificação concluída!", {
        description: "Bem-vindo(a) de volta!"
      });

      // 🔐 P0: onVerified pode executar steps críticos (registrar dispositivo, criar sessão, redirect)
      // Se ele falhar e a Promise ficar sem tratamento, o app pode “resetar”/voltar ao início.
      try {
        await Promise.resolve(onVerified());
      } catch (e: any) {
        console.error('[AUTH][2FA] ❌ Erro no onVerified (pós-2FA):', e);
        const msg = String(e?.message || 'Falha ao finalizar verificação. Tente novamente.');
        setError(msg);
        toast.error('Falha ao finalizar 2FA', { description: msg });
      }
    } catch (err: any) {
      console.error('[AUTH][2FA] ERROR verifyCode:', err);
      setError(err?.message || "Erro ao verificar código. Tente novamente.");
      setCode(["", "", "", "", "", ""]);
    } finally {
      setIsLoading(false);
      verifyingRef.current = false;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPhone = (phone: string) => {
    const clean = phone.replace(/\D/g, '');
    if (clean.length >= 11) {
      return `(**) *****-${clean.slice(-4)}`;
    }
    return `***-${clean.slice(-4)}`;
  };

  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');

  // ============================================
  // TELA DE SELEÇÃO DE CANAL
  // ============================================
  if (showChannelSelection && !selectedChannel) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md mx-auto"
      >
        <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-8 shadow-2xl shadow-primary/10">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", delay: 0.1 }}
              className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--destructive)) 100%)"
              }}
            >
              <Shield className="w-10 h-10 text-white" />
            </motion.div>

            <h2 className="text-2xl font-bold text-foreground mb-2">
              Verificação em Duas Etapas
            </h2>
            <p className="text-muted-foreground text-sm">
              Onde você quer receber seu código de verificação?
            </p>
          </div>

          {/* Opções de Canal */}
          <div className="space-y-3 mb-6">
            {/* Email */}
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              onClick={() => selectChannelAndSend("email")}
              disabled={isResending}
              className="w-full p-4 rounded-xl border-2 border-border bg-background/50 hover:border-primary hover:bg-primary/5 transition-all duration-200 flex items-center gap-4 group disabled:opacity-50"
            >
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                <Mail className="w-6 h-6 text-blue-500" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-foreground">Email</p>
                <p className="text-sm text-muted-foreground">{maskedEmail}</p>
              </div>
              <CheckCircle className="w-5 h-5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
            </motion.button>

            {/* SMS */}
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              onClick={() => selectChannelAndSend("sms")}
              disabled={isResending || !hasWhatsApp}
              className={`w-full p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 group 
                ${hasWhatsApp 
                  ? "border-border bg-background/50 hover:border-orange-500 hover:bg-orange-500/5" 
                  : "border-border/50 bg-muted/30 cursor-not-allowed opacity-50"
                }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors
                ${hasWhatsApp ? "bg-orange-500/10 group-hover:bg-orange-500/20" : "bg-muted"}`}>
                <Phone className={`w-6 h-6 ${hasWhatsApp ? "text-orange-500" : "text-muted-foreground"}`} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-foreground">SMS</p>
                <p className="text-sm text-muted-foreground">
                  {hasWhatsApp ? formatPhone(userPhone || "") : "Telefone não cadastrado"}
                </p>
              </div>
              {hasWhatsApp && (
                <CheckCircle className="w-5 h-5 text-muted-foreground/30 group-hover:text-orange-500 transition-colors" />
              )}
            </motion.button>

            {/* WhatsApp - REMOVIDO TEMPORARIAMENTE (não configurado) */}
          </div>

          {/* Loading */}
          <AnimatePresence>
            {isResending && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4"
              >
                <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-primary/10 text-primary text-sm">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </motion.div>
                  <span>Enviando código...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Cancel */}
          <Button
            variant="outline"
            className="w-full"
            onClick={onCancel}
            disabled={isResending}
          >
            Cancelar
          </Button>
        </div>

        {/* Dica */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 p-4 rounded-lg bg-muted/30 border border-border/50"
        >
          <div className="flex items-start gap-3">
            <Smartphone className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Mais segurança para você</p>
              <p>
                A verificação em duas etapas protege sua conta mesmo que sua senha seja comprometida.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // ============================================
  // TELA DE INSERÇÃO DO CÓDIGO
  // ============================================
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-8 shadow-2xl shadow-primary/10">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", delay: 0.1 }}
            className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center relative"
            style={{
              background: isLocked 
                ? "linear-gradient(135deg, #991b1b 0%, #dc2626 100%)"
                : currentChannel === "whatsapp"
                  ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
                  : currentChannel === "sms"
                    ? "linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                    : "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--destructive)) 100%)"
            }}
          >
            {isLocked ? (
              <ShieldAlert className="w-10 h-10 text-white" />
            ) : currentChannel === "whatsapp" ? (
              <MessageCircle className="w-10 h-10 text-white" />
            ) : currentChannel === "sms" ? (
              <Phone className="w-10 h-10 text-white" />
            ) : (
              <Mail className="w-10 h-10 text-white" />
            )}
            
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-current opacity-50"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>

          <h2 className="text-2xl font-bold text-foreground mb-2">
            {isLocked ? "Conta Temporariamente Bloqueada" : "Digite o Código"}
          </h2>
          <p className="text-muted-foreground text-sm">
            {isLocked 
              ? "Muitas tentativas incorretas detectadas"
              : `Enviamos um código de 6 dígitos para seu ${currentChannel === "whatsapp" ? "WhatsApp" : currentChannel === "sms" ? "SMS" : "email"}`}
          </p>
          {!isLocked && (
            <p className="text-primary font-medium flex items-center justify-center gap-2 mt-1">
              {currentChannel === "whatsapp" ? (
                <>
                  <MessageCircle className="w-4 h-4" />
                  {formatPhone(userPhone || "")}
                </>
              ) : currentChannel === "sms" ? (
                <>
                  <Phone className="w-4 h-4" />
                  {formatPhone(userPhone || "")}
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  {maskedEmail}
                </>
              )}
            </p>
          )}
        </div>

        {/* Lockout Timer */}
        <AnimatePresence>
          {isLocked && lockoutTime > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <div className="flex flex-col items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                <AlertTriangle className="w-8 h-8 text-destructive" />
                <p className="text-center text-sm text-muted-foreground">
                  Por segurança, aguarde antes de tentar novamente
                </p>
                <div className="text-3xl font-bold text-destructive font-mono">
                  {formatTime(lockoutTime)}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Código Input */}
        {!isLocked && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-muted-foreground mb-3 text-center">
              Digite o código de verificação
            </label>
            
            <div className="flex justify-center gap-2" onPaste={handlePaste}>
              {code.map((digit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Input
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    disabled={isLoading || isLocked}
                    className={`
                      w-12 h-14 text-center text-2xl font-bold
                      bg-background/50 border-2 rounded-xl
                      transition-all duration-200
                      focus:border-primary focus:ring-2 focus:ring-primary/30
                      ${error ? "border-destructive shake" : "border-border"}
                      ${digit ? "border-primary bg-primary/10" : ""}
                      disabled:opacity-50
                    `}
                  />
                </motion.div>
              ))}
            </div>

            {/* Timer & Attempts Info */}
            <div className="flex items-center justify-center gap-4 mt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Timer className="w-4 h-4" />
                Expira em 5 min
              </span>
              {attemptsRemaining !== null && attemptsRemaining < 5 && (
                <span className="flex items-center gap-1 text-amber-500">
                  <AlertTriangle className="w-4 h-4" />
                  {attemptsRemaining} tentativas restantes
                </span>
              )}
            </div>
          </div>
        )}

        {/* Error */}
        <AnimatePresence>
          {error && !isLocked && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-4"
            >
              <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-primary/10 text-primary text-sm">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <RefreshCw className="w-4 h-4" />
                </motion.div>
                <span>Verificando código...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Resend & Change Channel */}
        {!isLocked && (
          <div className="text-center mb-6 space-y-3">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Não recebeu o código?
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => sendCode(currentChannel)}
                disabled={isResending || countdown > 0}
                className="text-primary hover:text-primary/80"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isResending ? "animate-spin" : ""}`} />
                {countdown > 0 ? `Reenviar em ${countdown}s` : "Reenviar código"}
              </Button>
            </div>

            {/* Trocar canal */}
            <Button
              variant="link"
              size="sm"
              onClick={() => {
                setShowChannelSelection(true);
                setSelectedChannel(null);
                setCode(["", "", "", "", "", ""]);
                setError("");
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              Usar outro método de verificação
            </Button>
          </div>
        )}

        {/* Cancel */}
        <Button
          variant="outline"
          className="w-full"
          onClick={onCancel}
          disabled={isLoading}
        >
          {isLocked ? "Voltar ao login" : "Cancelar"}
        </Button>
      </div>

      {/* Dicas de segurança */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 p-4 rounded-lg bg-muted/30 border border-border/50"
      >
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Dica de segurança</p>
            <p>
              Nunca compartilhe seu código de verificação com ninguém. 
              Nossa equipe <strong>jamais</strong> solicitará esse código.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default TwoFactorVerification;
