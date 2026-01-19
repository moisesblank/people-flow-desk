// ============================================
// 🔓 RESET SEGURANÇA USUÁRIO
// Desbloquear usuários bloqueados pelo Blackout v1.3
// Owner/Admin Only
// ============================================

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ShieldOff, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2,
  User,
  Mail,
  Calendar,
  Shield,
  Trash2,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UserSecurityInfo {
  id: string;
  email: string;
  nome: string | null;
  is_banned: boolean;
  created_at: string;
  violations: Array<{
    id: number;
    action: string;
    created_at: string;
    details: unknown;
  }>;
  security_events: Array<{
    id: string;
    event_type: string;
    created_at: string;
    metadata: unknown;
  }>;
}

const ResetSegurancaUsuario = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [userInfo, setUserInfo] = useState<UserSecurityInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Verificar se é owner/admin
  const isOwner = user?.email?.toLowerCase() === "moisesblank@gmail.com";

  const searchUser = async () => {
    if (!email.trim()) {
      toast.error("Digite um email para buscar");
      return;
    }

    setIsSearching(true);
    setError(null);
    setUserInfo(null);

    try {
      // 1. Buscar usuário pelo email
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, nome, is_banned, created_at")
        .eq("email", email.toLowerCase().trim())
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profile) {
        setError(`Usuário não encontrado: ${email}`);
        setIsSearching(false);
        return;
      }

      // 2. Buscar violações de vídeo (usando 'violation' que é o tipo válido)
      const { data: violations } = await supabase
        .from("video_access_logs")
        .select("id, action, created_at, details")
        .eq("user_id", profile.id)
        .eq("action", "violation")
        .order("created_at", { ascending: false })
        .limit(20);

      // 3. Buscar eventos de segurança
      const { data: securityEvents } = await supabase
        .from("security_events")
        .select("id, event_type, created_at, metadata")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(20);

      setUserInfo({
        id: profile.id,
        email: profile.email || email,
        nome: profile.nome,
        is_banned: profile.is_banned || false,
        created_at: profile.created_at,
        violations: (violations || []).map(v => ({
          id: v.id,
          action: v.action,
          created_at: v.created_at,
          details: v.details
        })),
        security_events: (securityEvents || []).map(e => ({
          id: e.id,
          event_type: e.event_type,
          created_at: e.created_at,
          metadata: e.metadata
        })),
      });

      toast.success("Usuário encontrado!");
    } catch (err) {
      console.error("[ResetSeguranca] Erro ao buscar:", err);
      setError("Erro ao buscar usuário. Verifique o console.");
    } finally {
      setIsSearching(false);
    }
  };

  const resetUserSecurity = async (action: "unban" | "clear_violations" | "full_reset") => {
    if (!userInfo) return;

    setIsResetting(true);

    try {
      if (action === "unban" || action === "full_reset") {
        // Desbanir via Edge Function
        const { data, error } = await supabase.functions.invoke("admin-ban-user", {
          body: {
            action: "unban",
            targetEmail: userInfo.email,
            reason: `Reset manual por ${user?.email}`,
          },
        });

        if (error) throw error;
        console.log("[ResetSeguranca] Unban result:", data);
      }

      if (action === "clear_violations" || action === "full_reset") {
        // Limpar violações de vídeo (marcar como resolvidas)
        const { error: clearError } = await supabase
          .from("video_access_logs")
          .update({ 
            details: { 
              resolved: true, 
              resolved_at: new Date().toISOString(),
              resolved_by: user?.email 
            } 
          })
          .eq("user_id", userInfo.id)
          .eq("action", "violation");

        if (clearError) {
          console.warn("[ResetSeguranca] Erro ao limpar violações:", clearError);
        }

        // Limpar eventos de segurança (marcar como resolvidos)
        const { error: secError } = await supabase
          .from("security_events")
          .update({ 
            metadata: { 
              resolved: true, 
              resolved_at: new Date().toISOString(),
              resolved_by: user?.email 
            } 
          })
          .eq("user_id", userInfo.id);

        if (secError) {
          console.warn("[ResetSeguranca] Erro ao limpar security_events:", secError);
        }
      }

      // Log da ação
      await supabase.from("audit_logs").insert({
        user_id: user?.id,
        action: `security_reset_${action}`,
        table_name: "profiles",
        record_id: userInfo.id,
        metadata: {
          target_email: userInfo.email,
          action_type: action,
          performed_by: user?.email,
        },
      });

      toast.success(
        action === "unban" 
          ? "Usuário desbanido com sucesso!" 
          : action === "clear_violations"
          ? "Violações limpas com sucesso!"
          : "Reset completo realizado!"
      );

      // Recarregar dados
      await searchUser();
    } catch (err) {
      console.error("[ResetSeguranca] Erro ao resetar:", err);
      toast.error("Erro ao resetar segurança. Verifique o console.");
    } finally {
      setIsResetting(false);
    }
  };

  if (!isOwner) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Acesso Negado
            </CardTitle>
            <CardDescription>
              Esta funcionalidade é exclusiva do Owner.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30">
          <ShieldOff className="h-6 w-6 text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Reset de Segurança</h1>
          <p className="text-muted-foreground">
            Desbloquear usuários afetados pelo Blackout Anti-Pirataria
          </p>
        </div>
      </div>

      {/* Busca */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar Usuário
          </CardTitle>
          <CardDescription>
            Digite o email do usuário para verificar status de segurança
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="email">Email do Usuário</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchUser()}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={searchUser} disabled={isSearching}>
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Buscar
              </Button>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
              <AlertTriangle className="h-4 w-4 inline mr-2" />
              {typeof error === 'string' ? error : 'Ocorreu um erro'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resultado */}
      {userInfo && (
        <>
          {/* Info do Usuário */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações do Usuário
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{userInfo.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{userInfo.nome || "Sem nome"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {format(new Date(userInfo.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span className="font-medium">Status:</span>
                </div>
                {userInfo.is_banned ? (
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    BANIDO
                  </Badge>
                ) : (
                  <Badge variant="default" className="gap-1 bg-green-600">
                    <CheckCircle2 className="h-3 w-3" />
                    ATIVO
                  </Badge>
                )}

                <Badge variant="outline">
                  {userInfo.violations.length} violações de vídeo
                </Badge>
                <Badge variant="outline">
                  {userInfo.security_events.length} eventos de segurança
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Ações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-400">
                <RefreshCw className="h-5 w-5" />
                Ações de Reset
              </CardTitle>
              <CardDescription>
                Escolha o tipo de reset que deseja aplicar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Desbanir */}
                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2 border-yellow-500/50 hover:bg-yellow-500/10"
                  onClick={() => resetUserSecurity("unban")}
                  disabled={isResetting || !userInfo.is_banned}
                >
                  {isResetting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <ShieldOff className="h-5 w-5 text-yellow-400" />
                  )}
                  <span className="font-medium">Desbanir Usuário</span>
                  <span className="text-xs text-muted-foreground">
                    Remove is_banned = true
                  </span>
                </Button>

                {/* Limpar Violações */}
                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2 border-blue-500/50 hover:bg-blue-500/10"
                  onClick={() => resetUserSecurity("clear_violations")}
                  disabled={isResetting}
                >
                  {isResetting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Trash2 className="h-5 w-5 text-blue-400" />
                  )}
                  <span className="font-medium">Limpar Violações</span>
                  <span className="text-xs text-muted-foreground">
                    Marca violações como resolvidas
                  </span>
                </Button>

                {/* Reset Completo */}
                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2 border-red-500/50 hover:bg-red-500/10"
                  onClick={() => resetUserSecurity("full_reset")}
                  disabled={isResetting}
                >
                  {isResetting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-5 w-5 text-red-400" />
                  )}
                  <span className="font-medium">Reset Completo</span>
                  <span className="text-xs text-muted-foreground">
                    Desbanir + Limpar tudo
                  </span>
                </Button>
              </div>

              <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <p className="text-sm text-amber-200">
                  <AlertTriangle className="h-4 w-4 inline mr-2" />
                  <strong>Importante:</strong> O reset do lado do servidor não limpa o localStorage do navegador do usuário. 
                  O usuário pode precisar limpar os dados do navegador ou usar aba anônima para acessar novamente.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Histórico de Violações */}
          {userInfo.violations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Últimas Violações de Vídeo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {userInfo.violations.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm"
                    >
                      <Badge variant="outline" className="text-xs">
                        {v.action}
                      </Badge>
                      <span className="text-muted-foreground">
                        {format(new Date(v.created_at), "dd/MM HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Histórico de Security Events */}
          {userInfo.security_events.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Últimos Eventos de Segurança</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {userInfo.security_events.map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm"
                    >
                      <Badge variant="outline" className="text-xs">
                        {e.event_type}
                      </Badge>
                      <span className="text-muted-foreground">
                        {format(new Date(e.created_at), "dd/MM HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default ResetSegurancaUsuario;
