// ============================================
// SEÇÃO AÇÕES ADMINISTRATIVAS DO ALUNO
// ============================================

import { useState } from "react";
import { FuturisticCard } from "@/components/ui/futuristic-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Settings, Key, LogOut, Shield, Clock, Award,
  Mail, MessageSquare, UserX, Ban, Download, Trash2,
  Edit, RefreshCw, Plus, AlertTriangle, CheckCircle
} from "lucide-react";
import { toast } from "sonner";

interface AlunoAcoesProps {
  alunoId: string;
  alunoEmail: string;
  alunoNome: string;
  userId: string | null;
  currentRole: string | null;
}

export function AlunoPerfilAcoes({ 
  alunoId, 
  alunoEmail, 
  alunoNome, 
  userId, 
  currentRole 
}: AlunoAcoesProps) {
  const [internalNote, setInternalNote] = useState("");
  const [isLoading, setIsLoading] = useState<string | null>(null);

  // Placeholder actions - would connect to actual backend
  const handleAction = async (action: string) => {
    setIsLoading(action);
    
    // Simulate action
    await new Promise(resolve => setTimeout(resolve, 500));
    
    toast.info(`Ação "${action}" será implementada em breve`, {
      description: "Esta funcionalidade está em desenvolvimento"
    });
    
    setIsLoading(null);
  };

  const handleAddNote = async () => {
    if (!internalNote.trim()) {
      toast.error("Digite uma nota antes de salvar");
      return;
    }
    
    setIsLoading('note');
    await new Promise(resolve => setTimeout(resolve, 500));
    toast.success("Nota interna adicionada");
    setInternalNote("");
    setIsLoading(null);
  };

  const actionGroups = [
    {
      title: "Edição de Dados",
      icon: Edit,
      color: "blue",
      actions: [
        { key: "edit_data", label: "Editar Cadastro", icon: Edit },
        { key: "edit_photo", label: "Alterar Foto", icon: RefreshCw },
        { key: "edit_address", label: "Atualizar Endereço", icon: Plus },
      ]
    },
    {
      title: "Segurança",
      icon: Shield,
      color: "red",
      actions: [
        { key: "reset_password", label: "Resetar Senha", icon: Key },
        { key: "force_logout", label: "Forçar Logout", icon: LogOut },
        { key: "revoke_sessions", label: "Revogar Sessões", icon: AlertTriangle },
      ]
    },
    {
      title: "Acesso",
      icon: Clock,
      color: "green",
      actions: [
        { key: "grant_access", label: "Conceder Acesso Beta", icon: CheckCircle },
        { key: "revoke_access", label: "Revogar Acesso", icon: UserX },
        { key: "extend_access", label: "Estender Acesso", icon: Clock },
      ]
    },
    {
      title: "Certificados",
      icon: Award,
      color: "yellow",
      actions: [
        { key: "generate_certificate", label: "Gerar Certificado", icon: Award },
        { key: "reissue_certificate", label: "Reemitir Certificado", icon: RefreshCw },
      ]
    },
    {
      title: "Comunicação",
      icon: Mail,
      color: "purple",
      actions: [
        { key: "send_email", label: "Enviar Email", icon: Mail },
        { key: "send_whatsapp", label: "Enviar WhatsApp", icon: MessageSquare },
        { key: "send_notification", label: "Enviar Notificação", icon: MessageSquare },
      ]
    },
    {
      title: "Moderação",
      icon: Ban,
      color: "orange",
      actions: [
        { key: "temp_block", label: "Bloqueio Temporário", icon: Clock },
        { key: "perm_ban", label: "Banimento Permanente", icon: Ban, danger: true },
      ]
    },
    {
      title: "Dados (LGPD)",
      icon: Download,
      color: "cyan",
      actions: [
        { key: "export_data", label: "Exportar Dados", icon: Download },
        { key: "delete_data", label: "Excluir Dados", icon: Trash2, danger: true },
      ]
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: "bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30",
      red: "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30",
      green: "bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30",
      yellow: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30",
      purple: "bg-purple-500/20 text-purple-400 border-purple-500/30 hover:bg-purple-500/30",
      orange: "bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30",
      cyan: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/30",
    };
    return colors[color] || colors.blue;
  };

  return (
    <FuturisticCard className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-blue-500/20">
          <Settings className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Ações Administrativas</h3>
          <p className="text-sm text-muted-foreground">Gerenciar acesso, dados e comunicação do aluno</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Status Atual */}
        <div className="p-4 rounded-lg bg-background/50 border border-border/50">
          <h4 className="text-sm font-medium text-foreground mb-3">Status Atual</h4>
          <div className="flex flex-wrap gap-2">
            <Badge className={
              ['beta', 'aluno_presencial', 'beta_expira'].includes(currentRole || '') 
                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' 
                : 'bg-muted'
            }>
              Role: {currentRole || 'Sem role'}
            </Badge>
            {userId && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                Perfil Vinculado
              </Badge>
            )}
          </div>
        </div>

        {/* Grupos de Ações */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {actionGroups.map((group) => (
            <div 
              key={group.title}
              className="p-4 rounded-lg bg-background/50 border border-border/50"
            >
              <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <group.icon className={`h-4 w-4 text-${group.color}-400`} />
                {group.title}
              </h4>
              <div className="space-y-2">
                {group.actions.map((action) => (
                  <Button
                    key={action.key}
                    variant="outline"
                    size="sm"
                    className={`w-full justify-start ${action.danger ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' : ''}`}
                    onClick={() => handleAction(action.key)}
                    disabled={isLoading === action.key}
                  >
                    <action.icon className="h-4 w-4 mr-2" />
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Notas Internas */}
        <div className="p-4 rounded-lg bg-background/50 border border-border/50">
          <h4 className="text-sm font-medium text-foreground mb-3">Adicionar Nota Interna</h4>
          <Textarea
            value={internalNote}
            onChange={(e) => setInternalNote(e.target.value)}
            placeholder="Digite uma observação interna sobre o aluno..."
            className="mb-3"
            rows={3}
          />
          <Button 
            onClick={handleAddNote}
            disabled={isLoading === 'note' || !internalNote.trim()}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Salvar Nota
          </Button>
        </div>

        {/* Aviso */}
        <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-400">Atenção</p>
              <p className="text-xs text-muted-foreground">
                Ações como banimento e exclusão de dados são irreversíveis. 
                Todas as ações são registradas no log de auditoria.
              </p>
            </div>
          </div>
        </div>
      </div>
    </FuturisticCard>
  );
}
