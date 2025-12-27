// ============================================
// 📜 PARTE 10 — Edge Function: c-create-official-access
// CONSTITUIÇÃO SYNAPSE Ω v10.x — PATCH-ONLY
// ============================================
// Cria acesso oficial para alunos (beta ou aluno_gratuito)
// Campos obrigatórios: email, nome, role
// Campos opcionais: endereco, telefone, foto_aluno, senha
// Segurança: caller deve ter role owner/admin/suporte via tabela
// ============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================
// TIPOS
// ============================================

interface EnderecoInput {
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
}

interface CreateAccessPayload {
  email: string;
  nome: string;
  role: 'beta' | 'aluno_gratuito';
  telefone?: string;
  foto_aluno?: string;
  senha?: string;
  endereco?: EnderecoInput;
}

interface CreateAccessResponse {
  success: boolean;
  user_id?: string;
  role?: string;
  email_status?: 'sent' | 'queued' | 'failed' | 'password_set';
  error?: string;
}

// ============================================
// ROLES PERMITIDAS PARA CHAMAR ESTA FUNÇÃO
// ============================================
const ALLOWED_CALLER_ROLES = ['owner', 'admin', 'suporte'];

// ============================================
// VALIDAÇÃO DE INPUT
// ============================================
function validateInput(payload: unknown): { valid: boolean; error?: string; data?: CreateAccessPayload } {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Payload inválido' };
  }

  const p = payload as Record<string, unknown>;

  // Campos obrigatórios
  if (typeof p.email !== 'string' || !p.email.trim()) {
    return { valid: false, error: 'Email é obrigatório' };
  }

  if (typeof p.nome !== 'string' || !p.nome.trim()) {
    return { valid: false, error: 'Nome é obrigatório' };
  }

  if (p.role !== 'beta' && p.role !== 'aluno_gratuito') {
    return { valid: false, error: 'Role deve ser "beta" ou "aluno_gratuito"' };
  }

  // Validar email formato básico
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(p.email as string)) {
    return { valid: false, error: 'Formato de email inválido' };
  }

  // Validar senha se fornecida
  if (p.senha && (typeof p.senha !== 'string' || (p.senha as string).length < 8)) {
    return { valid: false, error: 'Senha deve ter pelo menos 8 caracteres' };
  }

  return {
    valid: true,
    data: {
      email: (p.email as string).toLowerCase().trim(),
      nome: (p.nome as string).trim(),
      role: p.role as 'beta' | 'aluno_gratuito',
      telefone: typeof p.telefone === 'string' ? p.telefone.trim() : undefined,
      foto_aluno: typeof p.foto_aluno === 'string' ? p.foto_aluno.trim() : undefined,
      senha: typeof p.senha === 'string' ? p.senha : undefined,
      endereco: typeof p.endereco === 'object' ? p.endereco as EnderecoInput : undefined,
    },
  };
}

// ============================================
// MAIN HANDLER
// ============================================
serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[c-create-official-access] Request started');

  try {
    // ============================================
    // 1. AUTENTICAÇÃO DO CALLER
    // ============================================
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.warn('[c-create-official-access] Missing authorization header');
      return new Response(
        JSON.stringify({ success: false, error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Client do usuário (para verificar quem está chamando)
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Client admin (para criar usuários e manipular dados)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verificar usuário autenticado
    const { data: { user: caller }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !caller) {
      console.warn('[c-create-official-access] Auth error:', authError?.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[c-create-official-access] Caller authenticated:', caller.email);

    // ============================================
    // 2. VERIFICAR ROLE DO CALLER VIA TABELA
    // (CONSTITUIÇÃO v10.x - role via tabela, não metadata)
    // ============================================
    const { data: callerRoleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)
      .in('role', ALLOWED_CALLER_ROLES)
      .limit(1)
      .maybeSingle();

    if (roleError) {
      console.error('[c-create-official-access] Role check error:', roleError);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao verificar permissões' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!callerRoleData) {
      console.warn('[c-create-official-access] Caller lacks permission. User:', caller.email);
      return new Response(
        JSON.stringify({ success: false, error: 'Sem permissão para criar acessos. Requer role: owner, admin ou suporte' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[c-create-official-access] Caller role:', callerRoleData.role);

    // ============================================
    // 3. VALIDAR INPUT
    // ============================================
    const body = await req.json();
    const validation = validateInput(body);

    if (!validation.valid || !validation.data) {
      console.warn('[c-create-official-access] Validation failed:', validation.error);
      return new Response(
        JSON.stringify({ success: false, error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload = validation.data;
    console.log('[c-create-official-access] Creating access for:', payload.email, 'Role:', payload.role);

    // ============================================
    // 4. VERIFICAR SE USUÁRIO JÁ EXISTE
    // ============================================
    let userId: string | null = null;
    let userAlreadyExists = false;

    // Buscar por email no auth
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });

    // Buscar especificamente pelo email
    const { data: userByEmail } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('email', payload.email)
      .maybeSingle();

    if (userByEmail) {
      userId = userByEmail.id;
      userAlreadyExists = true;
      console.log('[c-create-official-access] User already exists:', userId);
    }

    // ============================================
    // 5. CRIAR OU OBTER USUÁRIO
    // ============================================
    let emailStatus: 'sent' | 'queued' | 'failed' | 'password_set' = 'failed';

    if (!userAlreadyExists) {
      // Criar novo usuário
      if (payload.senha) {
        // Criar com senha fornecida
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: payload.email,
          password: payload.senha,
          email_confirm: true, // Auto-confirma email
          user_metadata: {
            nome: payload.nome,
            created_by: caller.email,
            created_via: 'c-create-official-access',
          },
        });

        if (createError) {
          console.error('[c-create-official-access] Error creating user:', createError);
          return new Response(
            JSON.stringify({ success: false, error: `Erro ao criar usuário: ${createError.message}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        userId = newUser.user.id;
        emailStatus = 'password_set';
        console.log('[c-create-official-access] User created with password:', userId);

      } else {
        // Criar sem senha - enviar magic link / recovery
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: payload.email,
          email_confirm: false, // Não confirma ainda
          user_metadata: {
            nome: payload.nome,
            created_by: caller.email,
            created_via: 'c-create-official-access',
          },
        });

        if (createError) {
          console.error('[c-create-official-access] Error creating user:', createError);
          return new Response(
            JSON.stringify({ success: false, error: `Erro ao criar usuário: ${createError.message}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        userId = newUser.user.id;

        // Enviar email de recuperação/definição de senha
        const { error: recoveryError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email: payload.email,
          options: {
            redirectTo: `${supabaseUrl.replace('.supabase.co', '.lovable.app')}/auth?action=set-password`,
          },
        });

        if (recoveryError) {
          console.warn('[c-create-official-access] Recovery link error:', recoveryError.message);
          emailStatus = 'failed';
        } else {
          emailStatus = 'sent';
        }

        console.log('[c-create-official-access] User created, recovery sent:', userId, 'Status:', emailStatus);
      }
    } else {
      // Usuário já existe
      emailStatus = 'password_set'; // Assume que já tem senha
      console.log('[c-create-official-access] Using existing user:', userId);
    }

    if (!userId) {
      console.error('[c-create-official-access] No user_id after creation');
      return new Response(
        JSON.stringify({ success: false, error: 'Erro interno: user_id não obtido' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // 6. UPSERT EM PROFILES
    // Colunas reais: nome, email, phone, avatar_url
    // ============================================
    const profileData: Record<string, unknown> = {
      id: userId,
      nome: payload.nome,
      email: payload.email,
    };

    if (payload.telefone) {
      profileData.phone = payload.telefone;
    }

    if (payload.foto_aluno) {
      profileData.avatar_url = payload.foto_aluno;
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(profileData, { onConflict: 'id' });

    if (profileError) {
      console.error('[c-create-official-access] Profile upsert error:', profileError);
      // Não falha, apenas loga (profile pode já existir com trigger)
    } else {
      console.log('[c-create-official-access] Profile upserted');
    }

    // ============================================
    // 7. UPSERT EM ALUNOS
    // Colunas reais: nome, email, telefone, foto_url, 
    // logradouro, numero, complemento, bairro, cidade, estado, cep
    // ============================================
    const alunoData: Record<string, unknown> = {
      nome: payload.nome,
      email: payload.email,
      status: 'ativo',
      fonte: 'Acesso Oficial (Gestão)',
      data_matricula: new Date().toISOString(),
    };

    if (payload.telefone) {
      alunoData.telefone = payload.telefone;
    }

    if (payload.foto_aluno) {
      alunoData.foto_url = payload.foto_aluno;
    }

    // Endereço completo (todas as colunas agora existem)
    if (payload.endereco) {
      if (payload.endereco.logradouro) {
        alunoData.logradouro = payload.endereco.logradouro;
      }
      if (payload.endereco.numero) {
        alunoData.numero = payload.endereco.numero;
      }
      if (payload.endereco.complemento) {
        alunoData.complemento = payload.endereco.complemento;
      }
      if (payload.endereco.bairro) {
        alunoData.bairro = payload.endereco.bairro;
      }
      if (payload.endereco.cidade) {
        alunoData.cidade = payload.endereco.cidade;
      }
      if (payload.endereco.estado) {
        alunoData.estado = payload.endereco.estado.toUpperCase();
      }
      if (payload.endereco.cep) {
        alunoData.cep = payload.endereco.cep.replace(/\D/g, '');
      }
    }

    const { error: alunoError } = await supabaseAdmin
      .from('alunos')
      .upsert(alunoData, { 
        onConflict: 'email',
        ignoreDuplicates: false,
      });

    if (alunoError) {
      console.error('[c-create-official-access] Aluno upsert error:', alunoError);
      // Continua, não é crítico
    } else {
      console.log('[c-create-official-access] Aluno upserted');
    }

    // ============================================
    // 8. UPSERT EM USER_ROLES
    // Role: beta ou aluno_gratuito (via tabela, CONSTITUIÇÃO v10.x)
    // ============================================
    const { error: roleUpsertError } = await supabaseAdmin
      .from('user_roles')
      .upsert({
        user_id: userId,
        role: payload.role,
      }, { 
        onConflict: 'user_id,role',
        ignoreDuplicates: false,
      });

    if (roleUpsertError) {
      console.error('[c-create-official-access] Role upsert error:', roleUpsertError);
      return new Response(
        JSON.stringify({ success: false, error: `Erro ao atribuir role: ${roleUpsertError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[c-create-official-access] Role assigned:', payload.role);

    // ============================================
    // 9. LOG DE AUDITORIA
    // ============================================
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        user_id: caller.id,
        action: 'CREATE_OFFICIAL_ACCESS',
        table_name: 'user_roles',
        record_id: userId,
        new_data: {
          target_email: payload.email,
          target_role: payload.role,
          created_by: caller.email,
          caller_role: callerRoleData.role,
        },
        metadata: {
          function: 'c-create-official-access',
          duration_ms: Date.now() - startTime,
        },
      });

    // ============================================
    // 10. RESPOSTA DE SUCESSO
    // ============================================
    const response: CreateAccessResponse = {
      success: true,
      user_id: userId,
      role: payload.role,
      email_status: emailStatus,
    };

    console.log('[c-create-official-access] Success:', JSON.stringify(response));

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[c-create-official-access] Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro interno' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
