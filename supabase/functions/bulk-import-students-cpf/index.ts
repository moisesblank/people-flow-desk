// ============================================
// BULK IMPORT STUDENTS WITH CPF VALIDATION
// CONSTITUIÇÃO SYNAPSE Ω v10.x
// MODO: Livro Web - BETA com 1 ano de expiração
// ============================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StudentRow {
  cpf: string;
  email: string;
  nome: string;
  telefone?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  endereco?: string;
  bairro?: string;
  numero?: string;
  complemento?: string;
  cupom?: string;
  [key: string]: unknown;
}

interface ImportResult {
  row: number;
  cpf: string;
  email: string;
  nome: string;
  status: 'success' | 'error' | 'skipped';
  error?: string;
  cpf_receita_nome?: string;
}

// Validate CPF format locally (dígitos verificadores)
function validateCPFFormat(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');
  
  // Pode ter 10 ou 11 dígitos (alguns CPFs sem zero à esquerda)
  if (cleaned.length < 10 || cleaned.length > 11) return false;
  
  // Pad com zero à esquerda se necessário
  const padded = cleaned.padStart(11, '0');
  
  // Rejeita sequências repetidas
  if (/^(\d)\1+$/.test(padded)) return false;
  
  // Validação do primeiro dígito
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(padded.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(padded.charAt(9))) return false;
  
  // Validação do segundo dígito
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(padded.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(padded.charAt(10))) return false;
  
  return true;
}

// Normaliza CPF para 11 dígitos
function normalizeCPF(cpf: string): string {
  return cpf.replace(/\D/g, '').padStart(11, '0');
}

// ============================================
// VALIDAÇÃO RECEITA FEDERAL: DESATIVADA
// Owner decidiu usar apenas validação local (dígitos verificadores)
// para evitar looping/timeout em importações grandes.
// ============================================
async function validateCPFReceita(cpf: string): Promise<{ valid: boolean; nome?: string; error?: string }> {
  // Retorna sempre válido - validação de formato já é feita por validateCPFFormat()
  console.log(`[bulk-import] CPF ${normalizeCPF(cpf).slice(0,3)}.***: Validação Receita DESATIVADA (apenas formato local)`);
  return { valid: true, nome: undefined };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Verify user
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: 'Token inválido' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check owner/admin role
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (!roleData || !['owner', 'admin'].includes(roleData.role)) {
      return new Response(JSON.stringify({ success: false, error: 'Apenas Owner/Admin podem importar' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { 
      students, 
      defaultPassword = 'eneM2026@#',
      tipoProduto = 'Livro Web',
      fonte = 'Importação em Massa (CPF Validado)',
      expirationDays = 365, // 1 ano de acesso BETA
    } = body as { 
      students: StudentRow[]; 
      defaultPassword?: string;
      tipoProduto?: string;
      fonte?: string;
      expirationDays?: number;
    };
    
    // Role sempre beta_expira com data de expiração
    const role = 'beta_expira';
    
    if (!students || !Array.isArray(students) || students.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'Nenhum aluno para importar' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results: ImportResult[] = [];
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    console.log(`[bulk-import] Iniciando importação de ${students.length} alunos`);

    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const rowNum = i + 1;
      
      // Normaliza campos
      const cpfRaw = String(student.cpf || '').trim();
      const cpfClean = normalizeCPF(cpfRaw);
      const email = String(student.email || '').trim().toLowerCase();
      const nome = String(student.nome || '').trim();
      const telefone = String(student.telefone || '').replace(/\D/g, '') || null;

      // 1. Valida campos mínimos: NOME + CPF
      if (!nome) {
        results.push({ row: rowNum, cpf: cpfClean, email, nome, status: 'skipped', error: 'Nome não informado' });
        skippedCount++;
        continue;
      }

      if (!cpfRaw || cpfClean.length < 10) {
        results.push({ row: rowNum, cpf: cpfClean, email, nome, status: 'skipped', error: 'CPF não informado ou inválido' });
        skippedCount++;
        continue;
      }

      // 2. Valida formato do CPF (dígitos verificadores)
      if (!validateCPFFormat(cpfClean)) {
        results.push({ row: rowNum, cpf: cpfClean, email, nome, status: 'error', error: 'CPF com dígitos verificadores inválidos' });
        errorCount++;
        continue;
      }

      // 3. Verifica duplicidade de CPF
      const { data: existingCPF } = await adminClient.from('alunos').select('id, nome').eq('cpf', cpfClean).maybeSingle();
      if (existingCPF) {
        results.push({ row: rowNum, cpf: cpfClean, email, nome, status: 'skipped', error: `CPF já cadastrado (${existingCPF.nome})` });
        skippedCount++;
        continue;
      }

      // 4. Verifica duplicidade de email (se informado)
      if (email) {
        const { data: existingEmail } = await adminClient.from('alunos').select('id, nome').eq('email', email).maybeSingle();
        if (existingEmail) {
          results.push({ row: rowNum, cpf: cpfClean, email, nome, status: 'skipped', error: `Email já cadastrado (${existingEmail.nome})` });
          skippedCount++;
          continue;
        }
      }

      // 5. Valida CPF na Receita Federal (se API disponível)
      const cpfValidation = await validateCPFReceita(cpfClean);
      if (!cpfValidation.valid) {
        results.push({ 
          row: rowNum, 
          cpf: cpfClean, 
          email, 
          nome, 
          status: 'error', 
          error: `CPF inválido: ${cpfValidation.error}` 
        });
        errorCount++;
        continue;
      }

      // 6. Se não tem email, não pode criar auth user - apenas registra no alunos
      if (!email) {
        // Registra apenas na tabela alunos (sem acesso ao sistema)
        await adminClient.from('alunos').insert({
          nome,
          email: `sem-email-${cpfClean}@placeholder.local`,
          cpf: cpfClean,
          telefone,
          cidade: student.cidade || null,
          estado: student.estado || null,
          cep: student.cep || null,
          logradouro: student.endereco || null,
          bairro: student.bairro || null,
          numero: student.numero || null,
          complemento: student.complemento || null,
          status: 'Pendente', // Sem email = pendente
          fonte,
          tipo_produto: tipoProduto,
          data_matricula: new Date().toISOString().split('T')[0],
          observacoes: `Importado sem email. Cupom: ${student.cupom || 'N/A'}. Nome Receita: ${cpfValidation.nome || 'N/A'}`,
        });

        results.push({ 
          row: rowNum, 
          cpf: cpfClean, 
          email: '(sem email)', 
          nome, 
          status: 'skipped', 
          error: 'Registrado sem acesso (sem email)',
          cpf_receita_nome: cpfValidation.nome
        });
        skippedCount++;
        continue;
      }

      // 7. Cria usuário auth
      const { data: authData, error: createAuthError } = await adminClient.auth.admin.createUser({
        email,
        password: defaultPassword,
        email_confirm: true,
        user_metadata: { nome, cpf: cpfClean },
      });

      if (createAuthError || !authData.user) {
        results.push({ 
          row: rowNum, 
          cpf: cpfClean, 
          email, 
          nome, 
          status: 'error', 
          error: `Erro auth: ${createAuthError?.message || 'Desconhecido'}` 
        });
        errorCount++;
        continue;
      }

      const userId = authData.user.id;

      // 8. Cria profile
      await adminClient.from('profiles').upsert({
        id: userId,
        email,
        nome,
        cpf: cpfClean,
        phone: telefone,
        password_change_required: true,
        onboarding_completed: false,
      }, { onConflict: 'id' });

      // 9. Atribui role beta_expira com data de expiração (1 ano)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expirationDays);
      
      await adminClient.from('user_roles').upsert({
        user_id: userId,
        role: role,
        expires_at: expiresAt.toISOString(),
      }, { onConflict: 'user_id' });

      // 10. Cria entrada na tabela alunos
      await adminClient.from('alunos').insert({
        nome,
        email,
        cpf: cpfClean,
        telefone,
        cidade: student.cidade || null,
        estado: student.estado || null,
        cep: student.cep || null,
        logradouro: student.endereco || null,
        bairro: student.bairro || null,
        numero: student.numero || null,
        complemento: student.complemento || null,
        status: 'Ativo',
        fonte,
        tipo_produto: tipoProduto,
        data_matricula: new Date().toISOString().split('T')[0],
        observacoes: `Cupom: ${student.cupom || 'N/A'}. Nome Receita: ${cpfValidation.nome || 'N/A'}`,
      });

      results.push({ 
        row: rowNum, 
        cpf: cpfClean, 
        email, 
        nome, 
        status: 'success',
        cpf_receita_nome: cpfValidation.nome
      });
      successCount++;

      // Receita desativada: remove delay para não estourar timeout em lotes grandes
      // (mantém o loop o mais rápido possível)

      // Log progresso a cada 10 alunos
      if ((i + 1) % 10 === 0) {
        console.log(`[bulk-import] Progresso: ${i + 1}/${students.length}`);
      }
    }

    console.log(`[bulk-import] Finalizado: ${successCount} sucesso, ${errorCount} erros, ${skippedCount} pulados`);

    // Log operation com histórico completo
    await adminClient.from('activity_log').insert({
      action: 'BULK_IMPORT_STUDENTS_CPF',
      user_id: user.id,
      user_email: user.email,
      new_value: {
        total_rows: students.length,
        success_count: successCount,
        error_count: errorCount,
        skipped_count: skippedCount,
        tipo_produto: tipoProduto,
        fonte,
        results_summary: results.map(r => ({
          row: r.row,
          nome: r.nome,
          status: r.status,
          error: r.error
        }))
      },
    });

    return new Response(JSON.stringify({
      success: true,
      total: students.length,
      successCount,
      errorCount,
      skippedCount,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: unknown) {
    console.error('[bulk-import-students-cpf] Error:', err);
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
