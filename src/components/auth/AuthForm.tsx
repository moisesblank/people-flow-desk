// ============================================
// AUTH FORM - Formulário de login/signup extraído
// ============================================

import { memo, lazy, Suspense } from "react";
import { 
  Mail, Lock, Eye, EyeOff, ArrowLeft, 
  ArrowRight, Loader2, User, Shield 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "react-router-dom";

const PasswordStrengthMeter = lazy(() => 
  import("@/components/auth/PasswordStrengthMeter").then(m => ({ default: m.PasswordStrengthMeter }))
);

export interface AuthFormData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
}

interface AuthFormProps {
  isLogin: boolean;
  formData: AuthFormData;
  errors: Record<string, string>;
  isLoading: boolean;
  showPassword: boolean;
  acceptTerms: boolean;
  onFormChange: (field: keyof AuthFormData, value: string) => void;
  onTogglePassword: () => void;
  onToggleTerms: (checked: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  onToggleMode: () => void;
  onForgotPassword: () => void;
  onGoogleSignIn: () => void;
  turnstileComponent?: React.ReactNode;
}

export const AuthForm = memo(function AuthForm({
  isLogin,
  formData,
  errors,
  isLoading,
  showPassword,
  acceptTerms,
  onFormChange,
  onTogglePassword,
  onToggleTerms,
  onSubmit,
  onToggleMode,
  onForgotPassword,
  onGoogleSignIn,
  turnstileComponent,
}: AuthFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Nome (só no signup) */}
      {!isLogin && (
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium text-foreground/90 flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Nome Completo
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="Seu nome completo"
            value={formData.name}
            onChange={(e) => onFormChange("name", e.target.value)}
            className={errors.name ? "border-red-500" : ""}
            autoComplete="name"
          />
          {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
        </div>
      )}

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-foreground/90 flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" />
          Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          value={formData.email}
          onChange={(e) => onFormChange("email", e.target.value)}
          className={errors.email ? "border-red-500" : ""}
          autoComplete="email"
        />
        {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
      </div>

      {/* Senha */}
      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium text-foreground/90 flex items-center gap-2">
          <Lock className="h-4 w-4 text-primary" />
          Senha
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => onFormChange("password", e.target.value)}
            className={`pr-10 ${errors.password ? "border-red-500" : ""}`}
            autoComplete={isLogin ? "current-password" : "new-password"}
          />
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
        
        {!isLogin && formData.password && (
          <Suspense fallback={null}>
            <PasswordStrengthMeter password={formData.password} />
          </Suspense>
        )}
      </div>

      {/* Confirmar Senha (só no signup) */}
      {!isLogin && (
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground/90 flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" />
            Confirmar Senha
          </Label>
          <Input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={(e) => onFormChange("confirmPassword", e.target.value)}
            className={errors.confirmPassword ? "border-red-500" : ""}
            autoComplete="new-password"
          />
          {errors.confirmPassword && <p className="text-xs text-red-400">{errors.confirmPassword}</p>}
        </div>
      )}

      {/* Termos (só no signup) */}
      {!isLogin && (
        <div className="flex items-start gap-2">
          <Checkbox
            id="terms"
            checked={acceptTerms}
            onCheckedChange={onToggleTerms}
          />
          <Label htmlFor="terms" className="text-xs text-muted-foreground cursor-pointer">
            Aceito os{" "}
            <Link to="/termos" className="text-primary hover:underline">
              Termos de Uso
            </Link>{" "}
            e a{" "}
            <Link to="/privacidade" className="text-primary hover:underline">
              Política de Privacidade
            </Link>
          </Label>
        </div>
      )}

      {/* Turnstile */}
      {turnstileComponent}

      {/* Botão Submit */}
      <Button
        type="submit"
        className="w-full h-11 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-medium rounded-lg transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-primary/40"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isLogin ? "Entrando..." : "Criando conta..."}
          </>
        ) : (
          <>
            {isLogin ? "Entrar" : "Criar Conta"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>

      {/* Link: Esqueci senha / Já tenho conta */}
      <div className="flex items-center justify-between text-sm">
        {isLogin ? (
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-primary/80 hover:text-primary transition-colors"
          >
            Esqueci minha senha
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={onToggleMode}
          className="text-primary/80 hover:text-primary transition-colors flex items-center gap-1"
        >
          {isLogin ? (
            <>
              Criar conta <ArrowRight className="h-3 w-3" />
            </>
          ) : (
            <>
              <ArrowLeft className="h-3 w-3" /> Já tenho conta
            </>
          )}
        </button>
      </div>

      {/* Divider */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/50" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-card px-2 text-muted-foreground">ou continue com</span>
        </div>
      </div>

      {/* Google */}
      <Button
        type="button"
        variant="outline"
        className="w-full h-11 border-border/50 hover:bg-muted/50"
        onClick={onGoogleSignIn}
        disabled={isLoading}
      >
        <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Google
      </Button>

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-4">
        <Shield className="h-3 w-3 text-green-500" />
        Conexão segura criptografada
      </div>
    </form>
  );
});
