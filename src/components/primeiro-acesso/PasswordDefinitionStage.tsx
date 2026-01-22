// ============================================
// ETAPA 3: DEFINIÇÃO DE SENHA OFICIAL
// Política forte: 8 chars, upper, lower, number, symbol
// ============================================

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Lock, 
  Eye, 
  EyeOff, 
  Shield, 
  CheckCircle, 
  AlertTriangle,
  KeyRound
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface PasswordDefinitionStageProps {
  userEmail: string;
  userId: string;
  onComplete: () => void;
}

// Sequências comuns proibidas
const COMMON_SEQUENCES = [
  '123456', '654321', 'abcdef', 'qwerty', 'password', 'senha',
  '111111', '000000', 'aaaaaa', '123123', '121212', 'abc123',
];

export function PasswordDefinitionStage({ 
  userEmail, 
  userId, 
  onComplete 
}: PasswordDefinitionStageProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(true); // Visível por padrão
  const [showConfirmPassword, setShowConfirmPassword] = useState(true); // Visível por padrão
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validação de senha forte (8+ chars, todos os critérios)
  const passwordChecks = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/~`]/.test(newPassword),
    noCommonSequence: !COMMON_SEQUENCES.some(seq => 
      newPassword.toLowerCase().includes(seq)
    ),
  };

  const passedChecks = Object.values(passwordChecks).filter(Boolean).length;
  const allChecksPassed = passedChecks === 6;
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!allChecksPassed) {
      toast.error("Senha não atende todos os critérios", {
        description: "Sua senha deve atender TODOS os requisitos de segurança.",
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
        console.error("[PasswordDefinition] Error updating password:", updateError);
        toast.error("Erro ao definir senha", {
          description: updateError.message,
        });
        return;
      }

      // 2. Marcar senha como definida no banco
      try {
        await supabase.rpc("mark_password_changed", {
          _user_id: userId,
        });
      } catch (rpcErr) {
        console.warn("[PasswordDefinition] RPC mark_password_changed não existe ou falhou:", rpcErr);
        // Fallback: atualizar diretamente
        await supabase
          .from('profiles')
          .update({ 
            password_change_required: false,
            password_changed_at: new Date().toISOString(),
          })
          .eq('id', userId);
      }

      // 3. Log de auditoria
      await supabase.from("audit_logs").insert({
        action: "password_defined_onboarding",
        user_id: userId,
        metadata: {
          email: userEmail,
          defined_at: new Date().toISOString(),
          strength: 'strong',
        },
      });

      toast.success("Senha definida com sucesso!", {
        description: "Sua nova senha está ativa.",
      });

      // Aguardar um pouco e prosseguir
      setTimeout(() => {
        onComplete();
      }, 500);

    } catch (err) {
      console.error("[PasswordDefinition] Unexpected error:", err);
      toast.error("Erro inesperado", {
        description: "Tente novamente ou entre em contato com o suporte.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          <KeyRound className="w-4 h-4" />
          Segurança da Conta
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Defina sua Senha
        </h2>
        <p className="text-muted-foreground">
          Crie uma senha forte para proteger sua conta
        </p>
      </div>

      {/* Form */}
      <div className="bg-card border border-border rounded-2xl p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email (readonly) */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-sm">Sua conta</Label>
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
          <div className="bg-muted/30 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-foreground mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Sua senha deve ter:
            </p>
            <div className="grid grid-cols-1 gap-2">
              {[
                { key: "length", label: "Pelo menos 8 caracteres" },
                { key: "uppercase", label: "Letra maiúscula (A-Z)" },
                { key: "lowercase", label: "Letra minúscula (a-z)" },
                { key: "number", label: "Número (0-9)" },
                { key: "special", label: "Símbolo (!@#$%...)" },
                { key: "noCommonSequence", label: "Sequência não comum" },
              ].map(({ key, label }) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-center gap-2 text-sm transition-colors ${
                    passwordChecks[key as keyof typeof passwordChecks]
                      ? "text-green-500"
                      : "text-muted-foreground"
                  }`}
                >
                  {passwordChecks[key as keyof typeof passwordChecks] ? (
                    <CheckCircle className="w-4 h-4 shrink-0" />
                  ) : (
                    <div className="w-4 h-4 border-2 border-current rounded-full shrink-0" />
                  )}
                  {label}
                </motion.div>
              ))}
            </div>
            
            {/* Força visual */}
            <div className="mt-4 pt-3 border-t border-border">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Força da senha</span>
                <span className={`font-medium ${
                  passedChecks <= 2 ? 'text-red-500' :
                  passedChecks <= 4 ? 'text-yellow-500' :
                  'text-green-500'
                }`}>
                  {passedChecks <= 2 ? 'Fraca' : passedChecks <= 4 ? 'Média' : 'Forte'}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <motion.div
                  className={`h-full transition-colors ${
                    passedChecks <= 2 ? 'bg-red-500' :
                    passedChecks <= 4 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${(passedChecks / 6) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </div>

          {/* Confirmar senha */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
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
              <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3 h-3" />
                As senhas não coincidem
              </p>
            )}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full h-12"
            disabled={isSubmitting || !allChecksPassed || !passwordsMatch}
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Definindo senha...
              </>
            ) : (
              <>
                <Shield className="w-5 h-5 mr-2" />
                Definir Senha Segura
              </>
            )}
          </Button>
        </form>

        {/* Security note */}
        <p className="text-xs text-muted-foreground text-center mt-6">
          🔒 Sua senha será criptografada e nunca será visível para ninguém
        </p>
      </div>
    </div>
  );
}
