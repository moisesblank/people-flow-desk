// ============================================
// BETA ACCESS MANAGER - GESTÃO DE ACESSO BETA
// Owner/Admin podem conceder, estender ou revogar acesso
// ============================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  ShieldCheck,
  ShieldX,
  Clock,
  Plus,
  Minus,
  Crown,
  Loader2,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BetaAccessInfo {
  hasAccess: boolean;
  role: string | null;
  daysRemaining: number | null;
  expiresAt: string | null;
  accessStart: string | null;
}

interface BetaAccessManagerProps {
  studentEmail: string;
  studentName: string;
  studentId: string;
  onAccessChange?: () => void;
}

const DURATION_OPTIONS = [
  { value: "30", label: "30 dias" },
  { value: "90", label: "90 dias (3 meses)" },
  { value: "180", label: "180 dias (6 meses)" },
  { value: "365", label: "365 dias (1 ano)" },
  { value: "custom", label: "Personalizado" },
];

export function BetaAccessManager({
  studentEmail,
  studentName,
  studentId,
  onAccessChange,
}: BetaAccessManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [accessInfo, setAccessInfo] = useState<BetaAccessInfo | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState("365");
  const [customDays, setCustomDays] = useState("");
  const [action, setAction] = useState<"grant" | "extend" | "revoke" | null>(null);

  // Buscar informações de acesso quando abrir o modal
  const fetchAccessInfo = async () => {
    setIsLoading(true);
    try {
      // 1. Buscar user_id pelo email no profiles
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .ilike("email", studentEmail.trim())
        .maybeSingle();

      if (profileError) {
        console.error("Erro ao buscar profile:", profileError);
      }

      if (!profileData?.id) {
        setAccessInfo({
          hasAccess: false,
          role: null,
          daysRemaining: null,
          expiresAt: null,
          accessStart: null,
        });
        setUserId(null);
        setIsLoading(false);
        return;
      }

      setUserId(profileData.id);

      // 2. Verificar acesso beta usando a RPC
      const { data, error } = await supabase.rpc("check_beta_access", {
        _user_id: profileData.id,
      });

      if (error) {
        console.error("Erro ao verificar acesso:", error);
        setAccessInfo({
          hasAccess: false,
          role: null,
          daysRemaining: null,
          expiresAt: null,
          accessStart: null,
        });
      } else if (data) {
        const result = data as Record<string, unknown>;
        setAccessInfo({
          hasAccess: (result.has_access as boolean) ?? false,
          role: (result.role as string) ?? null,
          daysRemaining: (result.days_remaining as number) ?? null,
          expiresAt: (result.expires_at as string) ?? null,
          accessStart: (result.access_start as string) ?? null,
        });
      }
    } catch (err) {
      console.error("Erro ao buscar informações:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      fetchAccessInfo();
      setAction(null);
    }
  };

  const getDays = () => {
    if (selectedDuration === "custom") {
      return parseInt(customDays) || 0;
    }
    return parseInt(selectedDuration);
  };

  const handleGrantAccess = async () => {
    const days = getDays();
    if (days <= 0) {
      toast.error("Informe um número válido de dias");
      return;
    }

    setIsLoading(true);
    try {
      // Se não tem user_id, precisa criar o usuário primeiro
      if (!userId) {
        // Criar usuário via edge function
        const { data, error } = await supabase.functions.invoke("invite-employee", {
          body: {
            email: studentEmail,
            nome: studentName,
            funcao: "aluno_beta",
            createAsBeta: true,
          },
        });

        if (error) throw error;
        
        if (data?.user_id) {
          // Agora conceder acesso
          const { error: grantError } = await supabase.rpc("grant_beta_access", {
            _user_id: data.user_id,
            _days: days,
          });

          if (grantError) throw grantError;
        }
      } else {
        // Usuário já existe, apenas conceder acesso
        const { error } = await supabase.rpc("grant_beta_access", {
          _user_id: userId,
          _days: days,
        });

        if (error) throw error;
      }

      toast.success(`✅ Acesso BETA concedido!`, {
        description: `${studentName} agora tem ${days} dias de acesso`,
      });

      await fetchAccessInfo();
      onAccessChange?.();
      setAction(null);
    } catch (err: any) {
      console.error("Erro ao conceder acesso:", err);
      toast.error("Erro ao conceder acesso", {
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtendAccess = async () => {
    if (!userId) {
      toast.error("Usuário não encontrado");
      return;
    }

    const days = getDays();
    if (days <= 0) {
      toast.error("Informe um número válido de dias");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.rpc("extend_beta_access", {
        _user_id: userId,
        _additional_days: days,
      });

      if (error) throw error;

      toast.success(`✅ Acesso estendido!`, {
        description: `+${days} dias adicionados para ${studentName}`,
      });

      await fetchAccessInfo();
      onAccessChange?.();
      setAction(null);
    } catch (err: any) {
      console.error("Erro ao estender acesso:", err);
      toast.error("Erro ao estender acesso", {
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeAccess = async () => {
    if (!userId) {
      toast.error("Usuário não encontrado");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.rpc("revoke_beta_access", {
        _user_id: userId,
      });

      if (error) throw error;

      toast.success(`🔒 Acesso revogado`, {
        description: `${studentName} não tem mais acesso BETA`,
      });

      await fetchAccessInfo();
      onAccessChange?.();
      setAction(null);
    } catch (err: any) {
      console.error("Erro ao revogar acesso:", err);
      toast.error("Erro ao revogar acesso", {
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderAccessStatus = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!accessInfo) {
      return (
        <div className="text-center py-6 text-muted-foreground">
          Erro ao carregar informações
        </div>
      );
    }

    if (!userId) {
      return (
        <div className="space-y-4">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="font-medium text-yellow-500">Usuário não cadastrado</p>
                <p className="text-sm text-muted-foreground">
                  Este email ainda não possui conta no sistema. Ao conceder acesso, 
                  será enviado um convite por email.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Status atual */}
        <div className={`rounded-lg p-4 border ${
          accessInfo.hasAccess 
            ? "bg-emerald-500/10 border-emerald-500/30" 
            : "bg-red-500/10 border-red-500/30"
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {accessInfo.hasAccess ? (
                <ShieldCheck className="h-6 w-6 text-emerald-500" />
              ) : (
                <ShieldX className="h-6 w-6 text-red-500" />
              )}
              <div>
                <p className={`font-semibold ${
                  accessInfo.hasAccess ? "text-emerald-500" : "text-red-500"
                }`}>
                  {accessInfo.hasAccess ? "Acesso BETA Ativo" : "Sem Acesso BETA"}
                </p>
                {accessInfo.role && (
                  <Badge variant="outline" className="mt-1">
                    Role: {accessInfo.role}
                  </Badge>
                )}
              </div>
            </div>
            {accessInfo.hasAccess && accessInfo.daysRemaining !== null && (
              <div className="text-right">
                <div className={`text-2xl font-bold ${
                  accessInfo.daysRemaining <= 7 
                    ? "text-red-500" 
                    : accessInfo.daysRemaining <= 30 
                    ? "text-yellow-500" 
                    : "text-emerald-500"
                }`}>
                  {accessInfo.daysRemaining}
                </div>
                <p className="text-xs text-muted-foreground">dias restantes</p>
              </div>
            )}
          </div>

          {accessInfo.expiresAt && (
            <div className="mt-3 pt-3 border-t border-current/20 flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Expira em: {format(new Date(accessInfo.expiresAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderActionForm = () => {
    if (!action) return null;

    const titles = {
      grant: "Conceder Acesso BETA",
      extend: "Estender Acesso",
      revoke: "Revogar Acesso",
    };

    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="space-y-4 pt-4 border-t"
      >
        <h4 className="font-semibold flex items-center gap-2">
          {action === "grant" && <Plus className="h-4 w-4 text-emerald-500" />}
          {action === "extend" && <Clock className="h-4 w-4 text-blue-500" />}
          {action === "revoke" && <Minus className="h-4 w-4 text-red-500" />}
          {titles[action]}
        </h4>

        {action !== "revoke" && (
          <div className="space-y-3">
            <div>
              <Label>Duração do Acesso</Label>
              <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedDuration === "custom" && (
              <div>
                <Label>Dias personalizados</Label>
                <Input
                  type="number"
                  min="1"
                  max="3650"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  placeholder="Ex: 45"
                  className="mt-1.5"
                />
              </div>
            )}
          </div>
        )}

        {action === "revoke" && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-sm text-red-400">
              ⚠️ Esta ação irá remover imediatamente o acesso BETA do aluno.
              Ele não poderá mais acessar as áreas exclusivas.
            </p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => setAction(null)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={
              action === "grant"
                ? handleGrantAccess
                : action === "extend"
                ? handleExtendAccess
                : handleRevokeAccess
            }
            disabled={isLoading}
            className={
              action === "revoke"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-emerald-600 hover:bg-emerald-700"
            }
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {action === "grant" && "Conceder Acesso"}
            {action === "extend" && "Estender Acesso"}
            {action === "revoke" && "Revogar Acesso"}
          </Button>
        </div>
      </motion.div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
          title="Gerenciar Acesso BETA"
        >
          <Crown className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Gerenciar Acesso BETA
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{studentName}</span>
            <br />
            <span className="text-sm">{studentEmail}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {renderAccessStatus()}

          <AnimatePresence mode="wait">
            {renderActionForm()}
          </AnimatePresence>

          {/* Botões de ação */}
          {!action && !isLoading && (
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              {!accessInfo?.hasAccess && (
                <Button
                  onClick={() => setAction("grant")}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Conceder Acesso
                </Button>
              )}
              {accessInfo?.hasAccess && userId && (
                <>
                  <Button
                    onClick={() => setAction("extend")}
                    variant="outline"
                    className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Estender
                  </Button>
                  <Button
                    onClick={() => setAction("revoke")}
                    variant="outline"
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                  >
                    <Minus className="h-4 w-4 mr-2" />
                    Revogar
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
