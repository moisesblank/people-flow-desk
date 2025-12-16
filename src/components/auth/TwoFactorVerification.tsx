// ============================================
// MOISÉS MEDEIROS v10.0 - Two Factor Verification
// Componente de verificação 2FA Ultra Seguro
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
  ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface TwoFactorVerificationProps {
  email: string;
  userId: string;
  userName?: string;
  onVerified: () => void;
  onCancel: () => void;
}

export function TwoFactorVerification({
  email,
  userId,
  userName,
  onVerified,
  onCancel
}: TwoFactorVerificationProps) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Enviar código ao montar
  useEffect(() => {
    sendCode();
  }, []);

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

  const sendCode = useCallback(async () => {
    setIsResending(true);
    setError("");

    try {
      const { data, error } = await supabase.functions.invoke("send-2fa-code", {
        body: { email, userId, userName }
      });

      if (error) throw error;

      if (data?.error) {
        if (data.retryAfter) {
          toast.error("Muitas tentativas", {
            description: "Aguarde 15 minutos para solicitar novo código"
          });
          return;
        }
        throw new Error(data.error);
      }

      toast.success("Código enviado!", {
        description: `Verifique: ${email}`
      });

      setCountdown(60);
    } catch (err: any) {
      console.error("Erro ao enviar código:", err);
      toast.error("Erro ao enviar código", {
        description: err.message || "Tente novamente em alguns segundos"
      });
    } finally {
      setIsResending(false);
    }
  }, [email, userId, userName]);

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
    setIsLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.functions.invoke("verify-2fa-code", {
        body: { userId, code: fullCode }
      });

      if (error || !data?.valid) {
        // Verificar se está bloqueado
        if (data?.lockedUntil) {
          setIsLocked(true);
          setLockoutTime(data.remainingSeconds || 900);
          setError("Conta temporariamente bloqueada por excesso de tentativas");
          setCode(["", "", "", "", "", ""]);
          return;
        }

        // Atualizar tentativas restantes
        if (data?.attemptsRemaining !== undefined) {
          setAttemptsRemaining(data.attemptsRemaining);
        }

        setError(data?.error || "Código inválido");
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        return;
      }

      toast.success("Verificação concluída!", {
        description: "Bem-vindo(a) de volta!"
      });

      onVerified();
    } catch (err: any) {
      console.error("Erro ao verificar:", err);
      setError("Erro ao verificar código. Tente novamente.");
      setCode(["", "", "", "", "", ""]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');

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
                : "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--destructive)) 100%)"
            }}
          >
            {isLocked ? (
              <ShieldAlert className="w-10 h-10 text-white" />
            ) : (
              <Shield className="w-10 h-10 text-white" />
            )}
            
            {/* Animated ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary/50"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>

          <h2 className="text-2xl font-bold text-foreground mb-2">
            {isLocked ? "Conta Temporariamente Bloqueada" : "Verificação em Duas Etapas"}
          </h2>
          <p className="text-muted-foreground text-sm">
            {isLocked 
              ? "Muitas tentativas incorretas detectadas"
              : "Enviamos um código de 6 dígitos para"}
          </p>
          {!isLocked && (
            <p className="text-primary font-medium flex items-center justify-center gap-2 mt-1">
              <Mail className="w-4 h-4" />
              {maskedEmail}
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
                Expira em 10 min
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

        {/* Resend */}
        {!isLocked && (
          <div className="text-center mb-6">
            <p className="text-sm text-muted-foreground mb-2">
              Não recebeu o código?
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={sendCode}
              disabled={isResending || countdown > 0}
              className="text-primary hover:text-primary/80"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isResending ? "animate-spin" : ""}`} />
              {countdown > 0 ? `Reenviar em ${countdown}s` : "Reenviar código"}
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
          {isLocked ? "Voltar ao login" : "Cancelar e voltar ao login"}
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
              Nossa equipe <strong>jamais</strong> solicitará esse código por telefone ou WhatsApp.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default TwoFactorVerification;
