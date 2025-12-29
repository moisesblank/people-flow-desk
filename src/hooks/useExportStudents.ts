// ============================================
// 🧱 LEI CANÔNICA DO EXPORT (GESTÃO → PERFIL)
// CONSTITUIÇÃO SYNAPSE Ω v10.x — PATCH-ONLY
// ============================================
// REGRA SAGRADA:
// - Gestão seleciona QUEM exportar
// - Perfil fornece O QUE exportar
// - Um aluno = Uma realidade = Um Excel
// ============================================

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

// ============================================
// TYPES
// ============================================

type StudentRoleType = 'beta' | 'aluno_gratuito' | 'aluno_presencial' | 'beta_expira';

interface ExportStudent {
  id: string;
  nome: string;
  email: string;
  status: string;
  fonte: string | null;
  tipo_produto: string | null;
  role: StudentRoleType | null;
}

interface ExportOptions {
  universeFilter: string;
  filterLabel: string;
}

// ============================================
// SHEET INTERFACES (8 ABAS)
// ============================================

interface Sheet01Resumo {
  student_id: string;
  nome: string;
  email: string;
  role: string;
  universo: string;
  status_acesso: string;
  expires_at: string;
}

interface Sheet02Identidade {
  student_id: string;
  cpf: string;
  rg: string;
  data_nascimento: string;
  telefone: string;
  whatsapp: string;
  email_secundario: string;
  endereco_completo: string;
}

interface Sheet03Acesso {
  student_id: string;
  role_atual: string;
  origem_acesso: string;
  expires_at: string;
  password_change_required: string;
  ultimo_login: string;
}

interface Sheet04Academico {
  student_id: string;
  curso: string;
  modalidade: string;
  status_matricula: string;
  percentual_conclusao: string;
}

interface Sheet05Financeiro {
  student_id: string;
  origem_pagamento: string;
  produto: string;
  valor_pago: string;
  status_pagamento: string;
}

interface Sheet06Correios {
  student_id: string;
  codigo_rastreio: string;
  status_envio: string;
  data_postagem: string;
  data_entrega_prevista: string;
  data_entrega_real: string;
}

interface Sheet07Notificacoes {
  student_id: string;
  tipo_notificacao: string;
  canal: string;
  data_envio: string;
  status: string;
}

interface Sheet08Auditoria {
  student_id: string;
  acao: string;
  executado_por: string;
  timestamp: string;
  origem: string;
}

// ============================================
// ROLE LABELS
// ============================================

const ROLE_LABELS: Record<string, string> = {
  beta: 'Beta (Premium)',
  aluno_gratuito: 'Gratuito',
  aluno_presencial: 'Presencial',
  beta_expira: 'Beta com Expiração',
};

// ============================================
// EXPORT HOOK
// ============================================

export function useExportStudents() {
  const [isExporting, setIsExporting] = useState(false);

  const exportStudents = useCallback(async (
    students: ExportStudent[],
    options: ExportOptions
  ) => {
    if (students.length === 0) {
      toast.error('Nenhum aluno para exportar');
      return;
    }

    setIsExporting(true);
    const startTime = Date.now();

    try {
      // 1. Verificar autorização (OWNER/ADMIN apenas)
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        toast.error('Não autorizado');
        return;
      }

      const actorId = session.session.user.id;
      const actorEmail = session.session.user.email;

      // Verificar role do ator
      const { data: actorRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', actorId)
        .maybeSingle();

      if (!actorRole || !['owner', 'admin'].includes(actorRole.role)) {
        toast.error('Apenas Owner e Admin podem exportar');
        return;
      }

      toast.loading('Preparando exportação...', { id: 'export-progress' });

      // 2. Buscar dados completos de cada aluno
      const studentIds = students.map(s => s.id);
      const studentEmails = students.map(s => s.email?.toLowerCase()).filter(Boolean);

      // Buscar dados da tabela alunos (PERFIL CANÔNICO)
      const { data: alunosData } = await supabase
        .from('alunos')
        .select('*')
        .in('id', studentIds);

      // Buscar profiles para dados adicionais
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, email, nome, phone, avatar_url, created_at, updated_at')
        .in('email', studentEmails);

      // Buscar user_roles para expiração
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role, expires_at')
        .in('role', ['beta', 'aluno_gratuito', 'aluno_presencial', 'beta_expira']);

      // Mapear profiles por email
      const profilesByEmail: Record<string, any> = {};
      (profilesData || []).forEach(p => {
        if (p.email) profilesByEmail[p.email.toLowerCase()] = p;
      });

      // Mapear roles por email
      const rolesByEmail: Record<string, any> = {};
      (rolesData || []).forEach(r => {
        const profile = profilesData?.find(p => p.id === r.user_id);
        if (profile?.email) {
          rolesByEmail[profile.email.toLowerCase()] = r;
        }
      });

      // Mapear alunos por ID
      const alunosById: Record<string, any> = {};
      (alunosData || []).forEach(a => {
        alunosById[a.id] = a;
      });

      // 3. Construir dados para cada aba
      const sheet01Data: Sheet01Resumo[] = [];
      const sheet02Data: Sheet02Identidade[] = [];
      const sheet03Data: Sheet03Acesso[] = [];
      const sheet04Data: Sheet04Academico[] = [];
      const sheet05Data: Sheet05Financeiro[] = [];
      const sheet06Data: Sheet06Correios[] = [];
      const sheet07Data: Sheet07Notificacoes[] = [];
      const sheet08Data: Sheet08Auditoria[] = [];

      for (const student of students) {
        const aluno = alunosById[student.id] || {};
        const profile = profilesByEmail[student.email?.toLowerCase() || ''] || {};
        const roleData = rolesByEmail[student.email?.toLowerCase() || ''] || {};

        // 01_RESUMO_DO_ALUNO
        sheet01Data.push({
          student_id: student.id,
          nome: aluno.nome || student.nome || '',
          email: aluno.email || student.email || '',
          role: ROLE_LABELS[student.role || ''] || 'Não definido',
          universo: options.filterLabel || 'Todos',
          status_acesso: aluno.status || 'Ativo',
          expires_at: roleData.expires_at ? new Date(roleData.expires_at).toLocaleDateString('pt-BR') : 'Permanente',
        });

        // 02_IDENTIDADE_E_CONTATO
        sheet02Data.push({
          student_id: student.id,
          cpf: aluno.cpf || '',
          rg: '',
          data_nascimento: aluno.data_nascimento ? new Date(aluno.data_nascimento).toLocaleDateString('pt-BR') : '',
          telefone: aluno.telefone || profile.phone || '',
          whatsapp: aluno.telefone || '',
          email_secundario: '',
          endereco_completo: [
            aluno.logradouro,
            aluno.numero,
            aluno.complemento,
            aluno.bairro,
            aluno.cidade,
            aluno.estado,
            aluno.cep,
          ].filter(Boolean).join(', ') || '',
        });

        // 03_ACESSO_E_PERMISSOES
        sheet03Data.push({
          student_id: student.id,
          role_atual: ROLE_LABELS[student.role || ''] || 'Não definido',
          origem_acesso: aluno.fonte || 'Não identificado',
          expires_at: roleData.expires_at ? new Date(roleData.expires_at).toLocaleDateString('pt-BR') : 'Permanente',
          password_change_required: 'Não',
          ultimo_login: profile.updated_at ? new Date(profile.updated_at).toLocaleDateString('pt-BR') : '',
        });

        // 04_ACADEMICO
        sheet04Data.push({
          student_id: student.id,
          curso: 'Curso Moisés Medeiros',
          modalidade: aluno.tipo_produto === 'fisico' ? 'Físico' : aluno.tipo_produto === 'livroweb' ? 'Livroweb' : 'Online',
          status_matricula: aluno.status || 'Ativo',
          percentual_conclusao: '',
        });

        // 05_FINANCEIRO
        sheet05Data.push({
          student_id: student.id,
          origem_pagamento: aluno.fonte || '',
          produto: aluno.tipo_produto === 'fisico' ? 'Material Físico' : aluno.tipo_produto === 'livroweb' ? 'Livroweb Digital' : 'Não especificado',
          valor_pago: aluno.valor_pago ? `R$ ${aluno.valor_pago.toFixed(2)}` : '',
          status_pagamento: aluno.status === 'Ativo' ? 'Confirmado' : 'Pendente',
        });

        // 06_CORREIOS
        sheet06Data.push({
          student_id: student.id,
          codigo_rastreio: '',
          status_envio: '',
          data_postagem: '',
          data_entrega_prevista: '',
          data_entrega_real: '',
        });

        // 07_NOTIFICACOES
        sheet07Data.push({
          student_id: student.id,
          tipo_notificacao: '',
          canal: '',
          data_envio: '',
          status: '',
        });

        // 08_AUDITORIA - Exportação
        sheet08Data.push({
          student_id: student.id,
          acao: 'EXPORT_GESTAO',
          executado_por: actorEmail || actorId,
          timestamp: new Date().toISOString(),
          origem: '/gestaofc/gestao-alunos',
        });
      }

      // 4. Criar workbook Excel
      const wb = XLSX.utils.book_new();

      // Adicionar abas
      const ws01 = XLSX.utils.json_to_sheet(sheet01Data);
      XLSX.utils.book_append_sheet(wb, ws01, '01_RESUMO_DO_ALUNO');

      const ws02 = XLSX.utils.json_to_sheet(sheet02Data);
      XLSX.utils.book_append_sheet(wb, ws02, '02_IDENTIDADE_E_CONTATO');

      const ws03 = XLSX.utils.json_to_sheet(sheet03Data);
      XLSX.utils.book_append_sheet(wb, ws03, '03_ACESSO_E_PERMISSOES');

      const ws04 = XLSX.utils.json_to_sheet(sheet04Data);
      XLSX.utils.book_append_sheet(wb, ws04, '04_ACADEMICO');

      const ws05 = XLSX.utils.json_to_sheet(sheet05Data);
      XLSX.utils.book_append_sheet(wb, ws05, '05_FINANCEIRO');

      const ws06 = XLSX.utils.json_to_sheet(sheet06Data);
      XLSX.utils.book_append_sheet(wb, ws06, '06_CORREIOS');

      const ws07 = XLSX.utils.json_to_sheet(sheet07Data);
      XLSX.utils.book_append_sheet(wb, ws07, '07_NOTIFICACOES');

      const ws08 = XLSX.utils.json_to_sheet(sheet08Data);
      XLSX.utils.book_append_sheet(wb, ws08, '08_AUDITORIA');

      // 5. Gerar arquivo
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const fileName = `export_gestao_alunos_canonico_${timestamp}.xlsx`;

      XLSX.writeFile(wb, fileName);

      // 6. Registrar auditoria no banco
      await supabase.from('audit_logs').insert({
        user_id: actorId,
        action: 'EXPORT_GESTAO_ALUNOS',
        table_name: 'alunos',
        metadata: {
          actor_id: actorId,
          actor_email: actorEmail,
          actor_role: actorRole.role,
          gestao_filters_used: options.universeFilter,
          filter_label: options.filterLabel,
          students_exported_count: students.length,
          file_name: fileName,
          exported_at: new Date().toISOString(),
        },
      });

      const elapsedMs = Date.now() - startTime;
      toast.success(`Exportação concluída!`, {
        id: 'export-progress',
        description: `${students.length} alunos exportados em ${(elapsedMs / 1000).toFixed(1)}s`,
      });

    } catch (error) {
      console.error('[Export] Error:', error);
      toast.error('Erro ao exportar', {
        id: 'export-progress',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    } finally {
      setIsExporting(false);
    }
  }, []);

  return {
    exportStudents,
    isExporting,
  };
}
