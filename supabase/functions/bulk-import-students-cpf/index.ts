// ============================================
// BULK IMPORT STUDENTS WITH CPF VALIDATION
// CONSTITUIÇÃO SYNAPSE Ω v10.x
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
  [key: string]: unknown;
}

interface ImportResult {
  row: number;
  cpf: string;
  email: string;
  nome: string;
  status: 'success' | 'error';
  error?: string;
}

// Validate CPF format locally
function validateCPFFormat(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.charAt(10))) return false;
  
  return true;
}

// Validate CPF against Receita Federal
async function validateCPFReceita(cpf: string): Promise<{ valid: boolean; nome?: string; error?: string }> {
  const token = Deno.env.get('CPF_API_TOKEN');
  if (!token) {
    return { valid: false, error: 'Token API CPF não configurado' };
  }
  
  const cleaned = cpf.replace(/\D/g, '');
  
  try {
    const response = await fetch(`https://api.cpfcnpj.com.br/${token}/1/${cleaned}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    
    if (!response.ok) {
      if (response.status === 429) {
        return { valid: false, error: 'Rate limit excedido' };
      }
      return { valid: false, error: `Erro API: ${response.status}` };
    }
    
    const data = await response.json();
    
    if (data.erro || data.status === 'ERROR') {
      return { valid: false, error: 'CPF não encontrado na Receita Federal' };
    }
    
    const situacao = data.situacao_cadastral || data.situacao || 'REGULAR';
    if (situacao.toUpperCase().includes('CANCELAD')) {
      return { valid: false, error: `CPF cancelado: ${situacao}` };
    }
    
    return { valid: true, nome: data.nome || data.nome_completo };
  } catch (err) {
    return { valid: false, error: `Erro de conexão: ${err.message}` };
  }
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
    const { students, defaultPassword = 'eneM2026@#' } = body as { students: StudentRow[]; defaultPassword?: string };
    
    if (!students || !Array.isArray(students) || students.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'Nenhum aluno para importar' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results: ImportResult[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const rowNum = i + 1;
      const cpfClean = (student.cpf || '').replace(/\D/g, '');
      const email = (student.email || '').trim().toLowerCase();
      const nome = (student.nome || '').trim();

      // 1. Validate mandatory fields
      if (!cpfClean || !email || !nome) {
        results.push({ row: rowNum, cpf: cpfClean, email, nome, status: 'error', error: 'Campos obrigatórios faltando (CPF, email, nome)' });
        errorCount++;
        continue;
      }

      // 2. Validate CPF format
      if (!validateCPFFormat(cpfClean)) {
        results.push({ row: rowNum, cpf: cpfClean, email, nome, status: 'error', error: 'CPF com formato inválido' });
        errorCount++;
        continue;
      }

      // 3. Check for duplicates
      const { data: existingCPF } = await adminClient.from('alunos').select('id').eq('cpf', cpfClean).maybeSingle();
      if (existingCPF) {
        results.push({ row: rowNum, cpf: cpfClean, email, nome, status: 'error', error: 'CPF já cadastrado no sistema' });
        errorCount++;
        continue;
      }

      const { data: existingEmail } = await adminClient.from('alunos').select('id').eq('email', email).maybeSingle();
      if (existingEmail) {
        results.push({ row: rowNum, cpf: cpfClean, email, nome, status: 'error', error: 'Email já cadastrado no sistema' });
        errorCount++;
        continue;
      }

      // 4. Validate CPF with Receita Federal
      const cpfValidation = await validateCPFReceita(cpfClean);
      if (!cpfValidation.valid) {
        results.push({ row: rowNum, cpf: cpfClean, email, nome, status: 'error', error: `CPF inválido na Receita Federal: ${cpfValidation.error}` });
        errorCount++;
        continue;
      }

      // 5. Create auth user
      const { data: authData, error: createAuthError } = await adminClient.auth.admin.createUser({
        email,
        password: defaultPassword,
        email_confirm: true,
        user_metadata: { nome, cpf: cpfClean },
      });

      if (createAuthError || !authData.user) {
        results.push({ row: rowNum, cpf: cpfClean, email, nome, status: 'error', error: `Erro ao criar auth: ${createAuthError?.message || 'Desconhecido'}` });
        errorCount++;
        continue;
      }

      const userId = authData.user.id;

      // 6. Create profile with password_change_required
      await adminClient.from('profiles').upsert({
        id: userId,
        email,
        nome,
        cpf: cpfClean,
        phone: student.telefone || null,
        password_change_required: true,
        onboarding_completed: false,
      }, { onConflict: 'id' });

      // 7. Assign beta role
      await adminClient.from('user_roles').upsert({
        user_id: userId,
        role: 'beta',
      }, { onConflict: 'user_id' });

      // 8. Create alunos entry
      await adminClient.from('alunos').insert({
        nome,
        email,
        cpf: cpfClean,
        telefone: student.telefone || null,
        cidade: student.cidade || null,
        estado: student.estado || null,
        status: 'Ativo',
        fonte: 'Importação em Massa (CPF Validado)',
        tipo_produto: 'livroweb',
        data_matricula: new Date().toISOString().split('T')[0],
      });

      results.push({ row: rowNum, cpf: cpfClean, email, nome, status: 'success' });
      successCount++;

      // Rate limit protection (100ms delay between API calls)
      if (i < students.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Log operation
    await adminClient.from('activity_log').insert({
      action: 'BULK_IMPORT_STUDENTS_CPF',
      user_id: user.id,
      user_email: user.email,
      new_value: {
        total_rows: students.length,
        success_count: successCount,
        error_count: errorCount,
      },
    });

    return new Response(JSON.stringify({
      success: true,
      total: students.length,
      successCount,
      errorCount,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[bulk-import-students-cpf] Error:', err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
