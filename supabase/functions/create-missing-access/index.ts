// ============================================
// CREATE MISSING ACCESS v1.0
// Cria auth.users + profiles + user_roles para alunos
// que já existem na tabela 'alunos' mas NÃO têm acesso
//
// CONSTITUIÇÃO SYNAPSE Ω v10.x
// ============================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessResult {
  email: string;
  nome: string;
  status: 'created' | 'skipped' | 'error';
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Parse body
    const body = await req.json();
    const { 
      batchSize = 50,
      defaultPassword = 'eneM2026@#',
      role = 'beta_expira',
      expirationDays = 365 
    } = body;

    console.log(`[create-missing-access] Iniciando processamento...`);

    // 1. Buscar alunos que estão na tabela 'alunos' mas NÃO têm profile
    const { data: alunosSemProfile, error: queryError } = await adminClient
      .from('alunos')
      .select('id, email, nome, cpf, telefone')
      .not('email', 'like', '%@placeholder.local')
      .order('email');

    if (queryError) {
      throw new Error(`Erro ao buscar alunos: ${queryError.message}`);
    }

    console.log(`[create-missing-access] Total alunos encontrados: ${alunosSemProfile?.length || 0}`);

    // Filtrar apenas os que não têm profile
    const alunosParaProcessar: typeof alunosSemProfile = [];
    
    for (const aluno of (alunosSemProfile || [])) {
      if (!aluno.email) continue;
      
      const { data: existingProfile } = await adminClient
        .from('profiles')
        .select('id')
        .eq('email', aluno.email.toLowerCase())
        .maybeSingle();
      
      if (!existingProfile) {
        alunosParaProcessar.push(aluno);
      }
    }

    console.log(`[create-missing-access] Alunos sem profile: ${alunosParaProcessar.length}`);

    const results: ProcessResult[] = [];
    let createdCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    // Processar em batches
    for (let i = 0; i < alunosParaProcessar.length; i += batchSize) {
      const batch = alunosParaProcessar.slice(i, i + batchSize);
      console.log(`[create-missing-access] Processando batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(alunosParaProcessar.length / batchSize)}`);

      for (const aluno of batch) {
        try {
          const email = aluno.email.toLowerCase().trim();
          const nome = aluno.nome || 'Aluno';
          const cpf = aluno.cpf || null;
          const telefone = aluno.telefone || null;

          // Verificar se já existe no auth.users
          const { data: existingAuth } = await adminClient.auth.admin.listUsers();
          const existingUser = existingAuth?.users?.find(u => u.email?.toLowerCase() === email);

          let userId: string;

          if (existingUser) {
            // Já existe auth, apenas criar profile/role
            userId = existingUser.id;
            console.log(`[create-missing-access] Auth já existe para ${email}, criando profile/role`);
          } else {
            // Criar auth user
            const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
              email,
              password: defaultPassword,
              email_confirm: true,
              user_metadata: { nome, cpf },
            });

            if (authError || !authData.user) {
              results.push({ email, nome, status: 'error', error: authError?.message || 'Erro ao criar auth' });
              errorCount++;
              continue;
            }

            userId = authData.user.id;
            console.log(`[create-missing-access] Auth criado para ${email}`);
          }

          // Criar/atualizar profile
          const { error: profileError } = await adminClient.from('profiles').upsert({
            id: userId,
            email,
            nome,
            cpf,
            phone: telefone,
            password_change_required: true,
            onboarding_completed: false,
          }, { onConflict: 'id' });

          if (profileError) {
            console.warn(`[create-missing-access] Erro profile ${email}: ${profileError.message}`);
          }

          // Verificar se já tem role
          const { data: existingRole } = await adminClient
            .from('user_roles')
            .select('role')
            .eq('user_id', userId)
            .maybeSingle();

          if (!existingRole) {
            // Criar role com expiração
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + expirationDays);

            const { error: roleError } = await adminClient.from('user_roles').insert({
              user_id: userId,
              role,
              expires_at: expiresAt.toISOString(),
            });

            if (roleError) {
              console.warn(`[create-missing-access] Erro role ${email}: ${roleError.message}`);
            }
          }

          results.push({ email, nome, status: 'created' });
          createdCount++;
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
          results.push({ email: aluno.email || '', nome: aluno.nome || '', status: 'error', error: errorMessage });
          errorCount++;
        }
      }
    }

    console.log(`[create-missing-access] Concluído! Criados: ${createdCount}, Erros: ${errorCount}`);

    return new Response(JSON.stringify({
      success: true,
      total: alunosParaProcessar.length,
      created: createdCount,
      errors: errorCount,
      skipped: skippedCount,
      results: results.slice(0, 100), // Limita output
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error(`[create-missing-access] Erro: ${errorMessage}`);
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
