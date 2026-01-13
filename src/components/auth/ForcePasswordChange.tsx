// ============================================
// FORCE PASSWORD CHANGE COMPONENT
// Exibido quando password_change_required = true
// ============================================

import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, Shield, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ForcePasswordChangeProps {
  userEmail: string;
  userId: string;
  onPasswordChanged: () => void;
}

export function ForcePasswordChange({ 
  userEmail, 
  userId, 
  onPasswordChanged 
}: ForcePasswordChangeProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(true); // Visível por padrão
  const [showConfirmPassword, setShowConfirmPassword] = useState(true); // Visível por padrão
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validação de senha forte
  const passwordChecks = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
  };

  const isPasswordStrong = Object.values(passwordChecks).filter(Boolean).length >= 4;
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordStrong) {
      toast.error("Senha muito fraca", {
        description: "Sua senha deve atender pelo menos 4 dos 5 critérios de segurança.",
      });
      return;
    }

    if (!passwordsMatch) {
      toast.error("Senhas não coincidem", {
        description: "A confirmação deve ser igual à nova senha.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Atualizar senha no Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        console.error("[ForcePasswordChange] Error updating password:", updateError);
        toast.error("Erro ao atualizar senha", {
          description: updateError.message,
        });
        return;
      }

      // 2. Marcar senha como alterada no banco (remove a flag)
      const { error: markError } = await supabase.rpc("mark_password_changed", {
        _user_id: userId,
      });

      if (markError) {
        console.error("[ForcePasswordChange] Error marking password changed:", markError);
        // Não falha, apenas loga - a senha já foi alterada
      }

      // 3. Log de auditoria
      await supabase.from("audit_logs").insert({
        action: "password_changed_first_login",
        user_id: userId,
        metadata: {
          email: userEmail,
          changed_at: new Date().toISOString(),
          was_magic_password: true,
        },
      });

      toast.success("Senha alterada com sucesso!", {
        description: "Você será redirecionado para a plataforma.",
      });

      // Notificar componente pai para continuar o fluxo
      setTimeout(() => {
        onPasswordChanged();
      }, 1500);

    } catch (err) {
      console.error("[ForcePasswordChange] Unexpected error:", err);
      toast.error("Erro inesperado", {
        description: "Tente novamente ou entre em contato com o suporte.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Alteração de Senha Obrigatória
          </h2>
          <p className="text-muted-foreground text-sm">
            Por segurança, você deve criar uma nova senha pessoal antes de continuar.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email (readonly) */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-sm">Email</Label>
            <Input
              type="email"
              value={userEmail}
              disabled
              className="bg-muted/50 text-muted-foreground"
            />
          </div>

          {/* Nova senha */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nova Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Digite sua nova senha"
                className="pl-10 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Critérios de senha */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Sua senha deve ter:
            </p>
            <div className="grid grid-cols-1 gap-1.5 text-xs">
              {[
                { key: "length", label: "Mínimo 8 caracteres" },
                { key: "uppercase", label: "Uma letra maiúscula" },
                { key: "lowercase", label: "Uma letra minúscula" },
                { key: "number", label: "Um número" },
                { key: "special", label: "Um caractere especial" },
              ].map(({ key, label }) => (
                <div
                  key={key}
                  className={`flex items-center gap-2 ${
                    passwordChecks[key as keyof typeof passwordChecks]
                      ? "text-green-500"
                      : "text-muted-foreground"
                  }`}
                >
                  {passwordChecks[key as keyof typeof passwordChecks] ? (
                    <CheckCircle className="w-3.5 h-3.5" />
                  ) : (
                    <div className="w-3.5 h-3.5 border border-current rounded-full" />
                  )}
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Confirmar senha */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme sua nova senha"
                className={`pl-10 pr-10 ${
                  confirmPassword.length > 0
                    ? passwordsMatch
                      ? "border-green-500 focus-visible:ring-green-500"
                      : "border-destructive focus-visible:ring-destructive"
                    : ""
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                As senhas não coincidem
              </p>
            )}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !isPasswordStrong || !passwordsMatch}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Alterando senha...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Definir Nova Senha
              </>
            )}
          </Button>
        </form>

        {/* Security note */}
        <p className="text-xs text-muted-foreground text-center mt-6">
          🔒 Sua nova senha será criptografada e armazenada de forma segura.
        </p>
      </div>
    </motion.div>
  );
}
