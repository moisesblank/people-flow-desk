// ============================================
// PERFIL ADMINISTRATIVO DO ALUNO - PÁGINA COMPLETA
// /gestaofc/gestao-alunos/:id
// URL CANÔNICA: Qualquer clique em aluno redireciona aqui
// ============================================

import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { ArrowLeft, RefreshCw, Edit, Shield, Mail, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FuturisticPageHeader } from "@/components/ui/futuristic-page-header";
import { CyberBackground } from "@/components/ui/cyber-background";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Seções do Perfil - Todas as 12 áreas
import { AlunoPerfilIdentidade } from "@/components/admin/aluno-perfil/AlunoPerfilIdentidade";
import { AlunoPerfilFinanceiro } from "@/components/admin/aluno-perfil/AlunoPerfilFinanceiro";
import { AlunoPerfilAcademico } from "@/components/admin/aluno-perfil/AlunoPerfilAcademico";
import { AlunoPerfilDesempenho } from "@/components/admin/aluno-perfil/AlunoPerfilDesempenho";
import { AlunoPerfilGamificacao } from "@/components/admin/aluno-perfil/AlunoPerfilGamificacao";
import { AlunoPerfilFlashcards } from "@/components/admin/aluno-perfil/AlunoPerfilFlashcards";
import { AlunoPerfilComunicacao } from "@/components/admin/aluno-perfil/AlunoPerfilComunicacao";
import { AlunoPerfilSeguranca } from "@/components/admin/aluno-perfil/AlunoPerfilSeguranca";
import { AlunoPerfilAnalytics } from "@/components/admin/aluno-perfil/AlunoPerfilAnalytics";
import { AlunoPerfilHistorico } from "@/components/admin/aluno-perfil/AlunoPerfilHistorico";
import { AlunoPerfilAcoes } from "@/components/admin/aluno-perfil/AlunoPerfilAcoes";
import { AlunoPerfilIntegracoes } from "@/components/admin/aluno-perfil/AlunoPerfilIntegracoes";
import { AlunoPerfilEnvios } from "@/components/admin/aluno-perfil/AlunoPerfilEnvios";
import { StudentEmailComposer } from "@/components/admin/aluno-perfil/StudentEmailComposer";

export default function AlunoPerfilAdmin() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Estados para modais de comunicação
  const [isEmailComposerOpen, setIsEmailComposerOpen] = useState(false);

  // Buscar dados do aluno - FONTE DA VERDADE
  const { data: aluno, isLoading: loadingAluno, refetch } = useQuery({
    queryKey: ['aluno-perfil-admin', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('alunos')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  // Buscar profile vinculado (por email)
  const { data: profile } = useQuery({
    queryKey: ['aluno-profile-vinculado', aluno?.email],
    queryFn: async () => {
      if (!aluno?.email) return null;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', aluno.email)
        .single();
      return data;
    },
    enabled: !!aluno?.email
  });

  // Buscar role
  const { data: userRole } = useQuery({
    queryKey: ['aluno-role', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', profile.id)
        .in('role', ['beta', 'aluno_gratuito'])
        .single();
      return data?.role || null;
    },
    enabled: !!profile?.id
  });

  // REALTIME: Sincronização em tempo real
  useEffect(() => {
    if (!id) return;

    // Canal para mudanças no aluno
    const alunoChannel = supabase
      .channel(`aluno-realtime-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alunos',
          filter: `id=eq.${id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['aluno-perfil-admin', id] });
        }
      )
      .subscribe();

    // Canal para mudanças no profile
    const profileChannel = aluno?.email ? supabase
      .channel(`profile-realtime-${aluno.email}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `email=eq.${aluno.email}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['aluno-profile-vinculado', aluno.email] });
        }
      )
      .subscribe() : null;

    return () => {
      supabase.removeChannel(alunoChannel);
      if (profileChannel) supabase.removeChannel(profileChannel);
    };
  }, [id, aluno?.email, queryClient]);

  // Função para abrir WhatsApp
  const handleOpenWhatsApp = useCallback(() => {
    if (!aluno) return;
    
    const phone = aluno.telefone || profile?.phone;
    if (!phone) {
      toast.error("Telefone não cadastrado", {
        description: "O aluno não possui telefone cadastrado."
      });
      return;
    }

    // Limpar telefone e converter para formato E164 (Brasil)
    let cleanPhone = phone.replace(/\D/g, '');
    
    // Adicionar código do país se não tiver
    if (cleanPhone.length === 10 || cleanPhone.length === 11) {
      cleanPhone = '55' + cleanPhone;
    }

    const whatsappUrl = `https://wa.me/${cleanPhone}`;
    window.open(whatsappUrl, '_blank');
    
    toast.success("Abrindo WhatsApp...", {
      description: `Conversa com ${aluno.nome}`
    });
  }, [aluno, profile]);

  // Verificar se tem telefone para habilitar botão
  const hasPhone = !!(aluno?.telefone || profile?.phone);

  if (loadingAluno) {
    return (
      <div className="min-h-screen bg-background">
        <CyberBackground variant="grid" />
        <div className="container mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!aluno) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Aluno não encontrado</h2>
          <p className="text-muted-foreground mb-4">O perfil solicitado não existe ou foi removido.</p>
          <Button onClick={() => navigate('/gestaofc/gestao-alunos')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para Lista
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CyberBackground variant="grid" />
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/gestaofc/gestao-alunos')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <FuturisticPageHeader
              title={aluno.nome}
              subtitle="Perfil Administrativo Completo"
              icon={Shield}
              accentColor="blue"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
            </Button>
            
            {/* Botão Email */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEmailComposerOpen(true)}
            >
              <Mail className="h-4 w-4 mr-2" /> Email
            </Button>
            
            {/* Botão WhatsApp */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleOpenWhatsApp}
                      disabled={!hasPhone}
                      className={!hasPhone ? "opacity-50 cursor-not-allowed" : ""}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" /> WhatsApp
                    </Button>
                  </span>
                </TooltipTrigger>
                {!hasPhone && (
                  <TooltipContent>
                    <p>Telefone não cadastrado</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            
            <Button variant="default" size="sm">
              <Edit className="h-4 w-4 mr-2" /> Editar
            </Button>
          </div>
        </div>

        {/* Navegação por Abas */}
        <Tabs defaultValue="identidade" className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-background/50 p-1">
            <TabsTrigger value="identidade" className="text-xs">Identidade</TabsTrigger>
            <TabsTrigger value="financeiro" className="text-xs">Financeiro</TabsTrigger>
            <TabsTrigger value="academico" className="text-xs">Acadêmico</TabsTrigger>
            <TabsTrigger value="desempenho" className="text-xs">Desempenho</TabsTrigger>
            <TabsTrigger value="gamificacao" className="text-xs">Gamificação</TabsTrigger>
            <TabsTrigger value="flashcards" className="text-xs">Flashcards</TabsTrigger>
            <TabsTrigger value="comunicacao" className="text-xs">Comunicação</TabsTrigger>
            <TabsTrigger value="seguranca" className="text-xs">Segurança</TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs">Analytics</TabsTrigger>
            <TabsTrigger value="historico" className="text-xs">Histórico</TabsTrigger>
            <TabsTrigger value="acoes" className="text-xs">Ações</TabsTrigger>
            <TabsTrigger value="integracoes" className="text-xs">Integrações</TabsTrigger>
            <TabsTrigger value="envios" className="text-xs">Envios Correios</TabsTrigger>
          </TabsList>

          {/* Identidade */}
          <TabsContent value="identidade">
            <AlunoPerfilIdentidade 
              aluno={aluno} 
              profile={profile} 
              role={userRole} 
            />
          </TabsContent>

          {/* Financeiro */}
          <TabsContent value="financeiro">
            <AlunoPerfilFinanceiro 
              alunoId={aluno.id}
              alunoEmail={aluno.email}
              valorPago={aluno.valor_pago}
              hotmartTransactionId={aluno.hotmart_transaction_id}
            />
          </TabsContent>

          {/* Acadêmico */}
          <TabsContent value="academico">
            <AlunoPerfilAcademico 
              userId={profile?.id || null}
              alunoId={aluno.id}
            />
          </TabsContent>

          {/* Desempenho */}
          <TabsContent value="desempenho">
            <AlunoPerfilDesempenho 
              userId={profile?.id || null}
              alunoId={aluno.id}
            />
          </TabsContent>

          {/* Gamificação */}
          <TabsContent value="gamificacao">
            <AlunoPerfilGamificacao 
              userId={profile?.id || null}
              profile={profile}
            />
          </TabsContent>

          {/* Flashcards */}
          <TabsContent value="flashcards">
            <AlunoPerfilFlashcards 
              userId={profile?.id || null}
            />
          </TabsContent>

          {/* Comunicação */}
          <TabsContent value="comunicacao">
            <AlunoPerfilComunicacao 
              userId={profile?.id || null}
              alunoEmail={aluno.email}
            />
          </TabsContent>

          {/* Segurança */}
          <TabsContent value="seguranca">
            <AlunoPerfilSeguranca 
              userId={profile?.id || null}
              profile={profile}
            />
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics">
            <AlunoPerfilAnalytics 
              userId={profile?.id || null}
              profile={profile}
            />
          </TabsContent>

          {/* Histórico */}
          <TabsContent value="historico">
            <AlunoPerfilHistorico 
              userId={profile?.id || null}
              alunoId={aluno.id}
              alunoEmail={aluno.email}
            />
          </TabsContent>

          {/* Ações */}
          <TabsContent value="acoes">
            <AlunoPerfilAcoes 
              alunoId={aluno.id}
              alunoEmail={aluno.email}
              alunoNome={aluno.nome}
              userId={profile?.id || null}
              currentRole={userRole}
            />
          </TabsContent>

          {/* Integrações */}
          <TabsContent value="integracoes">
            <AlunoPerfilIntegracoes 
              alunoId={aluno.id}
              alunoEmail={aluno.email}
              hotmartTransactionId={aluno.hotmart_transaction_id}
            />
          </TabsContent>

          {/* Envios Correios */}
          <TabsContent value="envios">
            <AlunoPerfilEnvios 
              alunoId={aluno.id}
              alunoNome={aluno.nome}
              alunoEmail={aluno.email}
              alunoTelefone={aluno.telefone || profile?.phone}
              endereco={{
                cep: aluno.cep || undefined,
                logradouro: aluno.logradouro || undefined,
                numero: aluno.numero || undefined,
                complemento: aluno.complemento || undefined,
                bairro: aluno.bairro || undefined,
                cidade: aluno.cidade || undefined,
                estado: aluno.estado || undefined,
              }}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de Email */}
      <StudentEmailComposer
        isOpen={isEmailComposerOpen}
        onClose={() => setIsEmailComposerOpen(false)}
        studentEmail={aluno.email}
        studentName={aluno.nome}
      />
    </div>
  );
}
