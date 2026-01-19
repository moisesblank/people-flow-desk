// ============================================
// 🔐 MFA ACTION MODAL — Modal de Verificação 2FA
// Isolado do fluxo de login (para ações sensíveis)
// ============================================

import React, { useState, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Loader2, ShieldCheck, Mail, AlertCircle, CheckCircle2, MessageSquare, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { MFAProtectedAction } from "@/hooks/useMFAGuard";
import { cn } from "@/lib/utils";
import { formatError } from "@/lib/utils/formatError";

type MFAChannel = "email" | "sms" | "whatsapp";

interface MFAActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  action: MFAProtectedAction;
  title?: string;
  description?: string;
}

const ACTION_LABELS: Record<MFAProtectedAction, { title: string; description: string }> = {
  change_password: {
    title: "Alterar Senha",
    description: "Para sua segurança, confirme sua identidade antes de alterar a senha.",
  },
  change_email: {
    title: "Alterar E-mail",
    description: "Confirme sua identidade antes de alterar seu e-mail.",
  },
  register_new_device: {
    title: "Novo Dispositivo",
    description: "Confirme sua identidade para registrar este dispositivo.",
  },
  change_subscription: {
    title: "Alterar Plano",
    description: "Confirme sua identidade antes de modificar seu plano.",
  },
  access_admin: {
    title: "Acesso Administrativo",
    description: "Esta área requer verificação adicional de segurança.",
  },
  manage_users: {
    title: "Gerenciar Usuários",
    description: "Confirme sua identidade para gerenciar usuários.",
  },
  financial_access: {
    title: "Área Financeira",
    description: "Confirme sua identidade para acessar informações financeiras.",
  },
  delete_account: {
    title: "Excluir Conta",
    description: "Esta ação é irreversível. Confirme sua identidade.",
  },
  device_verification: {
    title: "Verificar Dispositivo",
    description: "Confirme sua identidade para autorizar este dispositivo.",
  },
};

export function MFAActionModal({ isOpen, onClose, onSuccess, action, title, description }: MFAActionModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<"send" | "verify" | "success">("send");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeSentAt, setCodeSentAt] = useState<Date | null>(null);
  const [channel, setChannel] = useState<MFAChannel>("email");
  const [userPhone, setUserPhone] = useState<string | null>(null);

  // Buscar telefone do usuário
  useEffect(() => {
    if (user?.id) {
      supabase
        .from("profiles")
        .select("phone")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.phone) {
            setUserPhone(data.phone);
          }
        });
    }
  }, [user?.id]);

  const actionLabel = ACTION_LABELS[action] || {
    title: "Verificação de Segurança",
    description: "Confirme sua identidade para continuar.",
  };

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep("send");
      setCode("");
      setError(null);
      setChannel("email");
    }
  }, [isOpen]);

  /**
   * Envia código 2FA pelo canal selecionado
   */
  const handleSendCode = useCallback(async () => {
    if (!user?.id || !user?.email) {
      setError("Usuário não autenticado");
      return;
    }

    // Validar telefone para SMS/WhatsApp
    if ((channel === "sms" || channel === "whatsapp") && !userPhone) {
      setError("Telefone não cadastrado. Use e-mail ou atualize seu perfil.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const channelMessages: Record<MFAChannel, string> = {
        email: "Código enviado para seu e-mail",
        sms: "Código enviado por SMS",
        whatsapp: "Código enviado pelo WhatsApp",
      };

      const { error: sendError } = await supabase.functions.invoke("send-2fa-code", {
        body: {
          userId: user.id,
          email: user.email,
          phone: userPhone,
          userName: user.user_metadata?.nome || user.email?.split("@")[0],
          action: action,
          channel: channel,
        },
      });

      if (sendError) {
        throw sendError;
      }

      setCodeSentAt(new Date());
      setStep("verify");
      toast.success(channelMessages[channel]);
    } catch (err: any) {
      console.error("[MFAActionModal] Erro ao enviar código:", err);
      setError(err.message || "Erro ao enviar código");
      toast.error("Erro ao enviar código de verificação");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.email, user?.user_metadata?.nome, action, channel, userPhone]);

  /**
   * Verifica código 2FA
   */
  // 🛡️ Refs para proteção contra chamadas duplicadas
  const verifyingRef = React.useRef(false);
  const lastVerifiedCodeRef = React.useRef<string | null>(null);

  const handleVerifyCode = useCallback(async () => {
    if (!user?.id || code.length !== 6) {
      setError("Digite o código completo");
      return;
    }

    // 🛡️ PROTEÇÃO: Evitar chamadas duplicadas
    if (verifyingRef.current) {
      console.log("[MFAActionModal] Verificação já em andamento, ignorando...");
      return;
    }

    // 🛡️ PROTEÇÃO: Não verificar o mesmo código duas vezes
    if (lastVerifiedCodeRef.current === code) {
      console.log("[MFAActionModal] Código já foi verificado anteriormente, ignorando...");
      return;
    }

    verifyingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: verifyError } = await supabase.functions.invoke("verify-2fa-code", {
        body: {
          userId: user.id,
          code: code,
        },
      });

      if (verifyError) {
        throw verifyError;
      }

      // ✅ FIX: A edge function retorna { valid: true }, não { success: true }
      if (!data?.valid) {
        setError(data?.error || "Código inválido");
        return;
      }

      // ✅ Sucesso - marcar código como verificado
      lastVerifiedCodeRef.current = code;
      setStep("success");
      toast.success("Verificação concluída!");

      // Delay para mostrar animação de sucesso
      setTimeout(() => {
        onSuccess();
      }, 800);
    } catch (err: any) {
      console.error("[MFAActionModal] Erro ao verificar código:", err);
      setError(err.message || "Código inválido ou expirado");
    } finally {
      setIsLoading(false);
      verifyingRef.current = false;
    }
  }, [user?.id, code, onSuccess]);

  /**
   * Auto-submit quando código completo
   */
  useEffect(() => {
    if (code.length === 6 && step === "verify") {
      handleVerifyCode();
    }
  }, [code, step, handleVerifyCode]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent useOriginalSize className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>{title || actionLabel.title}</DialogTitle>
              <DialogDescription className="mt-1">{description || actionLabel.description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4">
          {/* Step: Escolher canal e enviar código */}
          {step === "send" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Escolha como receber o código:</p>

              {/* Seleção de Canal */}
              <div className="grid grid-cols-2 gap-2">
                {/* Email */}
                <button
                  type="button"
                  onClick={() => setChannel("email")}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all",
                    channel === "email"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50 hover:bg-muted/50",
                  )}
                >
                  <Mail className="h-5 w-5" />
                  <span className="text-xs font-medium">E-mail</span>
                </button>

                {/* WhatsApp - REMOVIDO TEMPORARIAMENTE (não configurado) */}

                {/* SMS */}
                <button
                  type="button"
                  onClick={() => userPhone && setChannel("sms")}
                  disabled={!userPhone}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all",
                    channel === "sms"
                      ? "border-blue-500 bg-blue-500/10 text-blue-500"
                      : !userPhone
                        ? "border-border opacity-50 cursor-not-allowed"
                        : "border-border hover:border-blue-500/50 hover:bg-muted/50",
                  )}
                >
                  <Smartphone className="h-5 w-5" />
                  <span className="text-xs font-medium">SMS</span>
                </button>
              </div>

              {/* Info do canal selecionado */}
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                {channel === "email" && (
                  <p className="text-muted-foreground">
                    Código será enviado para: <span className="font-medium text-foreground">{user?.email}</span>
                  </p>
                )}
                {/* WhatsApp info - REMOVIDO TEMPORARIAMENTE */}
                {channel === "sms" && userPhone && (
                  <p className="text-muted-foreground">
                    Código será enviado para: <span className="font-medium text-foreground">{userPhone}</span> via SMS
                  </p>
                )}
                {!userPhone && channel === "sms" && (
                  <p className="text-yellow-500">
                    Telefone não cadastrado. Atualize seu perfil para usar SMS.
                  </p>
                )}
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {formatError(error)}
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1" disabled={isLoading}>
                  Cancelar
                </Button>
                <Button onClick={handleSendCode} className="flex-1" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar Código"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step: Verificar código */}
          {step === "verify" && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Digite o código de 6 dígitos enviado{" "}
                  {channel === "email" ? "para seu e-mail" : channel === "whatsapp" ? "pelo WhatsApp" : "por SMS"}
                </p>

                <div className="flex justify-center">
                  <InputOTP value={code} onChange={setCode} maxLength={6} disabled={isLoading}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {formatError(error)}
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("send")} className="flex-1" disabled={isLoading}>
                  Reenviar
                </Button>
                <Button onClick={handleVerifyCode} className="flex-1" disabled={isLoading || code.length !== 6}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Verificando...
                    </>
                  ) : (
                    "Verificar"
                  )}
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Não recebeu? Verifique a pasta de spam ou{" "}
                <button onClick={() => setStep("send")} className="text-primary hover:underline" disabled={isLoading}>
                  solicite um novo código
                </button>
              </p>
            </div>
          )}

          {/* Step: Sucesso */}
          {step === "success" && (
            <div className="text-center py-6">
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Verificação Concluída!</h3>
              <p className="text-sm text-muted-foreground mt-1">Sua identidade foi confirmada com sucesso.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default MFAActionModal;
