// ============================================
// CONSTITUIÇÃO SYNAPSE Ω v10.0 — P0-3
// Página para usuário autenticado SEM role
// EVITA loop de /auth
// ============================================

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, LogOut, Mail, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function PerfilIncompleto() {
  const { user, role, isLoading, signOut } = useAuth();
  const navigate = useNavigate();

  // Se tem role, redirecionar para área correta
  useEffect(() => {
    if (isLoading) return;

    // Se não está logado, vai para /auth
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }

    // Se TEM role, redirecionar para área correta
    if (role) {
      const gestaoRoles = ["owner", "admin", "coordenacao", "contabilidade", "suporte", "monitoria", "marketing", "afiliado"];
      const alunoRoles = ["beta", "aluno_gratuito", "aluno_presencial", "beta_expira"];

      if (gestaoRoles.includes(role)) {
        navigate("/gestaofc", { replace: true });
      } else if (alunoRoles.includes(role)) {
        navigate("/alunos/dashboard", { replace: true });
      } else {
        navigate("/comunidade", { replace: true });
      }
    }
  }, [user, role, isLoading, navigate]);

  // Log forense obrigatório (CONSTITUIÇÃO P0-3)
  useEffect(() => {
    if (user && !role && !isLoading) {
      // Logar acesso sem role
      const logNoRoleAccess = async () => {
        try {
          await supabase.from("activity_log").insert({
            user_id: user.id,
            user_email: user.email,
            action: "NO_ROLE_ACCESS",
            table_name: "perfil-incompleto",
            ip_address: null,
            user_agent: navigator.userAgent,
          });
        } catch (err) {
          console.error("[CONSTITUIÇÃO P0-3] Erro ao logar acesso sem role:", err);
        }
      };
      logNoRoleAccess();
    }
  }, [user, role, isLoading]);

  const handleLogout = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Verificando...</div>
      </div>
    );
  }

  // Se tem role, não mostrar esta página (useEffect vai redirecionar)
  if (role) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <CardTitle className="text-xl">Perfil Incompleto</CardTitle>
          <CardDescription>
            Sua conta foi criada, mas ainda não possui permissões de acesso.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email do usuário */}
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground mb-1">Email da conta:</p>
            <p className="font-medium">{user?.email || "Não identificado"}</p>
          </div>

          {/* Instruções */}
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong>O que isso significa?</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Seu cadastro foi realizado com sucesso</li>
              <li>Um administrador precisa atribuir seu nível de acesso</li>
              <li>Isso pode levar algumas horas</li>
            </ul>
          </div>

          {/* Contato */}
          <div className="rounded-lg border p-4 space-y-2">
            <p className="font-medium text-sm">Precisa de ajuda?</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>suporte@moisesmedeiros.com.br</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>WhatsApp do suporte</span>
            </div>
          </div>

          {/* Botão de Logout */}
          <Button 
            onClick={handleLogout} 
            variant="outline" 
            className="w-full"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair da conta
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
