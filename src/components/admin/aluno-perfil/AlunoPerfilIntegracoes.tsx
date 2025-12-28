// ============================================
// SEÇÃO INTEGRAÇÕES VISÍVEIS DO ALUNO
// ============================================

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FuturisticCard } from "@/components/ui/futuristic-card";
import { Badge } from "@/components/ui/badge";
import { 
  Plug, ExternalLink, CheckCircle, XCircle, Clock,
  ShoppingCart, Video, MessageCircle, Globe, Users
} from "lucide-react";
import { PresetEmptyState } from "@/components/ui/empty-state";

interface AlunoIntegracoesProps {
  alunoId: string;
  alunoEmail: string;
  hotmartTransactionId: string | null;
}

export function AlunoPerfilIntegracoes({ 
  alunoId, 
  alunoEmail, 
  hotmartTransactionId 
}: AlunoIntegracoesProps) {
  // Buscar dados de WordPress (se existir vínculo)
  const { data: wpAudit } = useQuery({
    queryKey: ['aluno-wp-audit', alunoEmail],
    queryFn: async () => {
      const { data } = await supabase
        .from('auditoria_grupo_beta')
        .select('wp_user_id, antes_grupos, depois_grupos')
        .eq('email', alunoEmail)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      return data;
    },
    enabled: !!alunoEmail
  });

  // Verificar transações Hotmart
  const { data: hotmartData } = useQuery({
    queryKey: ['aluno-hotmart-integration', alunoEmail],
    queryFn: async () => {
      const { data } = await supabase
        .from('transacoes_hotmart_completo')
        .select('status, product_name, data_compra')
        .eq('email', alunoEmail)
        .order('data_compra', { ascending: false })
        .limit(1)
        .single();
      return data;
    },
    enabled: !!alunoEmail
  });

  // Placeholder for video access check
  const videoAccess = false;

  const integrations = [
    {
      name: "Hotmart",
      description: "Plataforma de vendas e pagamentos",
      icon: ShoppingCart,
      color: "orange",
      status: hotmartTransactionId || hotmartData ? 'connected' : 'not_connected',
      details: hotmartData ? `Produto: ${hotmartData.product_name}` : hotmartTransactionId ? `ID: ${hotmartTransactionId}` : null
    },
    {
      name: "WordPress",
      description: "Gestão de grupos e comunidade",
      icon: Globe,
      color: "blue",
      status: wpAudit?.wp_user_id ? 'connected' : 'not_connected',
      details: wpAudit?.wp_user_id ? `WP ID: ${wpAudit.wp_user_id}` : null,
      groups: wpAudit?.depois_grupos || wpAudit?.antes_grupos
    },
    {
      name: "Panda Video",
      description: "Streaming de videoaulas",
      icon: Video,
      color: "green",
      status: videoAccess ? 'connected' : 'not_connected',
      details: videoAccess ? "Acesso registrado" : null
    },
    {
      name: "WhatsApp",
      description: "Grupos de suporte",
      icon: MessageCircle,
      color: "emerald",
      status: 'pending', // Would need to check if user is in WA groups
      details: null
    },
    {
      name: "Comunidade",
      description: "Fórum e interações",
      icon: Users,
      color: "purple",
      status: 'connected', // Assume connected if has profile
      details: null
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Conectado
          </Badge>
        );
      case 'not_connected':
        return (
          <Badge className="bg-muted text-muted-foreground border-border">
            <XCircle className="h-3 w-3 mr-1" />
            Não Conectado
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
      default:
        return null;
    }
  };

  const getIconColorClass = (color: string) => {
    const colors: Record<string, string> = {
      orange: "text-orange-400 bg-orange-500/20",
      blue: "text-blue-400 bg-blue-500/20",
      green: "text-green-400 bg-green-500/20",
      emerald: "text-emerald-400 bg-emerald-500/20",
      purple: "text-purple-400 bg-purple-500/20",
    };
    return colors[color] || colors.blue;
  };

  return (
    <FuturisticCard className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-cyan-500/20">
          <Plug className="h-5 w-5 text-cyan-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Integrações</h3>
          <p className="text-sm text-muted-foreground">Conexões com plataformas externas</p>
        </div>
      </div>

      <div className="space-y-4">
        {integrations.map((integration) => (
          <div 
            key={integration.name}
            className="p-4 rounded-lg bg-background/50 border border-border/50 hover:border-border transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${getIconColorClass(integration.color)}`}>
                  <integration.icon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-foreground">{integration.name}</h4>
                  <p className="text-xs text-muted-foreground">{integration.description}</p>
                  {integration.details && (
                    <p className="text-xs text-foreground mt-1">{integration.details}</p>
                  )}
                  {integration.groups && Array.isArray(integration.groups) && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {integration.groups.map((group: string, idx: number) => (
                        <Badge 
                          key={idx} 
                          variant="outline" 
                          className="text-xs bg-blue-500/10 border-blue-500/30"
                        >
                          {group}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {getStatusBadge(integration.status)}
            </div>
          </div>
        ))}

        {/* Tags de Automação */}
        <div className="p-4 rounded-lg bg-background/50 border border-border/50">
          <h4 className="text-sm font-medium text-foreground mb-3">Tags de Automação</h4>
          <div className="flex flex-wrap gap-2">
            {hotmartData?.status === 'approved' && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                pagamento_aprovado
              </Badge>
            )}
            {wpAudit?.wp_user_id && (
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                wordpress_sync
              </Badge>
            )}
            <Badge variant="outline" className="text-muted-foreground">
              + Adicionar tag
            </Badge>
          </div>
        </div>
      </div>
    </FuturisticCard>
  );
}
