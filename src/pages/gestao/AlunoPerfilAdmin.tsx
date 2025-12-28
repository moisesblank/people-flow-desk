// ============================================
// PERFIL ADMINISTRATIVO DO ALUNO - PÁGINA COMPLETA
// /gestaofc/gestao-alunos/:id
// ============================================

import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, Edit, Shield, Mail, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FuturisticPageHeader } from "@/components/ui/futuristic-page-header";
import { CyberBackground } from "@/components/ui/cyber-background";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlunoPerfilIdentidade } from "@/components/admin/aluno-perfil/AlunoPerfilIdentidade";
import { AlunoPerfilFinanceiro } from "@/components/admin/aluno-perfil/AlunoPerfilFinanceiro";
import { AlunoPerfilAcademico } from "@/components/admin/aluno-perfil/AlunoPerfilAcademico";
import { Skeleton } from "@/components/ui/skeleton";

export default function AlunoPerfilAdmin() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Buscar dados do aluno
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
          <Button onClick={() => navigate('/gestaofc/gestao-alunos')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
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
        <div className="flex items-center justify-between mb-6">
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
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
            </Button>
            <Button variant="outline" size="sm">
              <Mail className="h-4 w-4 mr-2" /> Email
            </Button>
            <Button variant="outline" size="sm">
              <MessageSquare className="h-4 w-4 mr-2" /> WhatsApp
            </Button>
            <Button variant="default" size="sm">
              <Edit className="h-4 w-4 mr-2" /> Editar
            </Button>
          </div>
        </div>

        {/* Seções do Perfil */}
        <div className="space-y-6">
          {/* Identidade */}
          <AlunoPerfilIdentidade 
            aluno={aluno} 
            profile={profile} 
            role={userRole} 
          />

          {/* Financeiro */}
          <AlunoPerfilFinanceiro 
            alunoId={aluno.id}
            alunoEmail={aluno.email}
            valorPago={aluno.valor_pago}
            hotmartTransactionId={aluno.hotmart_transaction_id}
          />

          {/* Acadêmico */}
          <AlunoPerfilAcademico 
            userId={profile?.id || null}
            alunoId={aluno.id}
          />
        </div>
      </div>
    </div>
  );
}
