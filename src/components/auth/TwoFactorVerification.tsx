// ============================================
// MOISÉS MEDEIROS v7.0 - Two Factor Verification
// Componente de verificação 2FA
// ============================================

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Mail, RefreshCw, Lock, CheckCircle, AlertCircle, Timer } from "lucide-react";
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

  const sendCode = async () => {
    setIsResending(true);
    setError("");

    try {
      const { data, error } = await supabase.functions.invoke("send-2fa-code", {
        body: { email, userId, userName }
      });

      if (error) throw error;

      toast.success("Código enviado!", {
        description: `Verifique sua caixa de entrada: ${email}`
      });

      setCountdown(60); // 60 segundos para reenvio
    } catch (err: any) {
      console.error("Erro ao enviar código:", err);
      toast.error("Erro ao enviar código", {
        description: "Tente novamente em alguns segundos"
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleInputChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Apenas números

    const newCode = [...code];
    newCode[index] = value.slice(-1); // Apenas último caractere
    setCode(newCode);
    setError("");

    // Auto-focus próximo input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verificar quando completo
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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
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
            Enviamos um código de 6 dígitos para
          </p>
          <p className="text-primary font-medium flex items-center justify-center gap-2 mt-1">
            <Mail className="w-4 h-4" />
            {email}
          </p>
        </div>

        {/* Código Input */}
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
                  disabled={isLoading}
                  className={`
                    w-12 h-14 text-center text-2xl font-bold
                    bg-background/50 border-2 rounded-xl
                    transition-all duration-200
                    focus:border-primary focus:ring-2 focus:ring-primary/30
                    ${error ? "border-destructive" : "border-border"}
                    ${digit ? "border-primary bg-primary/10" : ""}
                  `}
                />
              </motion.div>
            ))}
          </div>

          {/* Timer */}
          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
            <Timer className="w-4 h-4" />
            <span>O código expira em 10 minutos</span>
          </div>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
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

        {/* Cancel */}
        <Button
          variant="outline"
          className="w-full"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar e voltar ao login
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
              Nossa equipe jamais solicitará esse código.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default TwoFactorVerification;
