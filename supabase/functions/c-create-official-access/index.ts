// ============================================
// 📜 PARTE 10 + 11 — Edge Function: c-create-official-access
// CONSTITUIÇÃO SYNAPSE Ω v10.x — PATCH-ONLY
// ============================================
// Cria acesso oficial para alunos (beta ou aluno_gratuito)
// Campos obrigatórios: email, nome, role
// Campos opcionais: endereco, telefone, foto_aluno, senha
// Segurança: caller deve ter role owner/admin/suporte via tabela
// Email: Envia boas-vindas via Resend (NUNCA envia senha em texto)
// ============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Resend } from 'https://esm.sh/resend@2.0.0';

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
  email_status?: 'sent' | 'queued' | 'failed' | 'password_set' | 'welcome_sent';
  email_details?: {
    welcome_email: boolean;
    password_setup_email: boolean;
  };
  error?: string;
}

// ============================================
// ROLES PERMITIDAS PARA CHAMAR ESTA FUNÇÃO
// ============================================
const ALLOWED_CALLER_ROLES = ['owner', 'admin', 'suporte'];

// ============================================
// ROLE LABELS
// ============================================
const ROLE_LABELS: Record<string, string> = {
  beta: 'Aluno Beta (Premium)',
  aluno_gratuito: 'Aluno Gratuito',
};

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
// TEMPLATE BASE PADRÃO (Igual send-notification-email)
// ============================================
const getBaseTemplate = (titulo: string, conteudo: string, botaoTexto?: string, botaoUrl?: string) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#0a0a0f;color:#ffffff;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0f;">
    <tr>
      <td align="center" style="padding:24px;">
        <table role="presentation" width="100%" style="max-width:640px;" cellspacing="0" cellpadding="0">
          <tr>
            <td style="background:linear-gradient(180deg,#131318 0%,#0a0a0f 100%);border-radius:16px;padding:28px;border:1px solid #7D1128;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr><td align="center" style="padding-bottom:20px;">
                  <h1 style="margin:0;color:#E62B4A;font-size:24px;font-weight:700;">Curso Moisés Medeiros</h1>
                  <p style="margin:8px 0 0;color:#9aa0a6;font-size:13px;">${titulo}</p>
                </td></tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr><td style="color:#e6e6e6;line-height:1.7;font-size:14px;">${conteudo}</td></tr>
              </table>
              ${botaoTexto && botaoUrl ? `
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr><td align="center" style="padding-top:24px;">
                  <a href="${botaoUrl}" style="display:inline-block;background:linear-gradient(135deg,#E62B4A,#7D1128);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:14px;">${botaoTexto}</a>
                </td></tr>
              </table>
              ` : ''}
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr><td style="padding:24px 0 18px;"><hr style="border:none;border-top:1px solid #2a2a2f;margin:0;" /></td></tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr><td style="color:#9aa0a6;font-size:12px;line-height:1.6;">
                  <p style="margin:0 0 8px;"><strong style="color:#e6e6e6;">Prof. Moisés Medeiros Melo</strong></p>
                  <p style="margin:0 0 8px;">MM CURSO DE QUÍMICA LTDA | O curso que mais aprova e comprova!</p>
                  <p style="margin:0;">WhatsApp: <a href="https://wa.me/558396169222" style="color:#E62B4A;">+55 83 9616-9222</a></p>
                </td></tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr><td align="center" style="padding-top:18px;"><p style="margin:0;color:#666;font-size:11px;">© ${new Date().getFullYear()} MM Curso de Química Ltda.</p></td></tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// ============================================
// ENVIAR EMAIL DE BOAS-VINDAS (Resend)
// ⚠️ NUNCA envia senha em texto
// AGORA USA O TEMPLATE PADRÃO DA PLATAFORMA
// ============================================
async function sendWelcomeEmail(
  resend: Resend,
  fromEmail: string,
  toEmail: string,
  nome: string,
  role: string,
  passwordSetupLink?: string,
): Promise<{ success: boolean; error?: string }> {
  const roleLabel = ROLE_LABELS[role] || role;
  const platformUrl = 'https://pro.moisesmedeiros.com.br/alunos';
  
  // Conteúdo do email baseado em se precisa definir senha ou não
  const needsPasswordSetup = !!passwordSetupLink;
  
  // Conteúdo interno usando o template base padrão
  const conteudo = `
    <h2 style="margin:0 0 16px;font-size:18px;color:#ffffff;">🎉 Bem-vindo(a), ${nome}!</h2>
    <p style="margin:0 0 12px;">Seu acesso à plataforma foi criado pela equipe de gestão.</p>
    
    <div style="background:#1a1a1f;border-radius:8px;padding:16px;margin:16px 0;text-align:center;">
      <p style="margin:0;color:#E62B4A;font-size:16px;font-weight:bold;">✅ ${roleLabel}</p>
    </div>
    
    ${needsPasswordSetup ? `
    <div style="background:#2a2a2f;border-radius:8px;padding:16px;margin:16px 0;border-left:3px solid #E62B4A;">
      <p style="margin:0 0 8px;color:#ffffff;font-weight:bold;">🔐 Configure sua senha</p>
      <p style="margin:0;color:#9aa0a6;font-size:13px;">Para acessar a plataforma, você precisa definir uma senha clicando no botão abaixo.</p>
      <p style="margin:12px 0 0;color:#9aa0a6;font-size:12px;">⚠️ Este link expira em 24 horas.</p>
    </div>
    ` : `
    <div style="background:#1a2f1a;border-radius:8px;padding:16px;margin:16px 0;border-left:3px solid #22c55e;">
      <p style="margin:0 0 8px;color:#22c55e;font-weight:bold;">✅ Acesso pronto!</p>
      <p style="margin:0;color:#9aa0a6;font-size:13px;">Sua conta já está configurada. Faça login com seu email e senha.</p>
    </div>
    `}
    
    <h3 style="margin:20px 0 12px;font-size:14px;color:#ffffff;">📚 Próximos passos:</h3>
    <ul style="margin:0;padding-left:20px;color:#9aa0a6;font-size:13px;line-height:1.8;">
      ${needsPasswordSetup ? '<li>Clique no botão abaixo para definir sua senha</li>' : ''}
      <li>Acesse a plataforma e faça login com seu email</li>
      <li>Explore todo o conteúdo disponível para você</li>
      <li>Em caso de dúvidas, entre em contato via WhatsApp</li>
    </ul>
  `;
  
  const botaoTexto = needsPasswordSetup ? "Definir Minha Senha" : "Acessar Plataforma";
  const botaoUrl = needsPasswordSetup ? passwordSetupLink : platformUrl;
  
  const htmlContent = getBaseTemplate(
    "Seu acesso foi criado com sucesso!",
    conteudo,
    botaoTexto,
    botaoUrl
  );

  try {
    console.log('[c-create-official-access] Sending welcome email to:', toEmail);
    
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      subject: needsPasswordSetup 
        ? `🎉 Bem-vindo(a), ${nome}! Configure seu acesso — Curso Moisés Medeiros` 
        : `🎉 Bem-vindo(a), ${nome}! Seu acesso está pronto — Curso Moisés Medeiros`,
      html: htmlContent,
    });

    if (error) {
      console.error('[c-create-official-access] Resend error:', error);
      return { success: false, error: error.message };
    }

    console.log('[c-create-official-access] Welcome email sent successfully. ID:', data?.id);
    return { success: true };
    
  } catch (err) {
    console.error('[c-create-official-access] Email send exception:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
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
  console.log('[c-create-official-access] ========== REQUEST START ==========');

  try {
    // ============================================
    // 0. VERIFICAR SECRETS OBRIGATÓRIOS
    // ============================================
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const resendFrom = Deno.env.get('RESEND_FROM');
    
    if (!resendApiKey) {
      console.error('[c-create-official-access] ❌ RESEND_API_KEY não configurado');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Configuração de email ausente. Solicite INTERNAL_SECRET ao owner para configurar SMTP/Resend.',
          requires_config: true,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!resendFrom) {
      console.error('[c-create-official-access] ❌ RESEND_FROM não configurado');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Email remetente não configurado. Configure RESEND_FROM nos secrets.',
          requires_config: true,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('[c-create-official-access] ✅ Email config OK. From:', resendFrom);
    const resend = new Resend(resendApiKey);

    // ============================================
    // 1. AUTENTICAÇÃO DO CALLER
    // ============================================
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.warn('[c-create-official-access] ❌ Missing authorization header');
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
      console.warn('[c-create-official-access] ❌ Auth error:', authError?.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[c-create-official-access] ✅ Caller authenticated:', caller.email);

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
      console.error('[c-create-official-access] ❌ Role check error:', roleError);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao verificar permissões' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!callerRoleData) {
      console.warn('[c-create-official-access] ❌ Caller lacks permission. User:', caller.email);
      return new Response(
        JSON.stringify({ success: false, error: 'Sem permissão para criar acessos. Requer role: owner, admin ou suporte' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[c-create-official-access] ✅ Caller role:', callerRoleData.role);

    // ============================================
    // 3. VALIDAR INPUT
    // ============================================
    const body = await req.json();
    const validation = validateInput(body);

    if (!validation.valid || !validation.data) {
      console.warn('[c-create-official-access] ❌ Validation failed:', validation.error);
      return new Response(
        JSON.stringify({ success: false, error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload = validation.data;
    console.log('[c-create-official-access] 📝 Creating access for:', payload.email, 'Role:', payload.role);

    // ============================================
    // 4. VERIFICAR SE USUÁRIO JÁ EXISTE
    // ============================================
    let userId: string | null = null;
    let userAlreadyExists = false;

    // Buscar especificamente pelo email em profiles
    const { data: userByEmail } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('email', payload.email)
      .maybeSingle();

    if (userByEmail) {
      userId = userByEmail.id;
      userAlreadyExists = true;
      console.log('[c-create-official-access] ℹ️ User already exists:', userId);
    }

    // ============================================
    // 5. CRIAR OU OBTER USUÁRIO
    // ============================================
    let emailStatus: 'sent' | 'queued' | 'failed' | 'password_set' | 'welcome_sent' = 'failed';
    let passwordSetupLink: string | undefined;
    let welcomeEmailSent = false;
    let passwordEmailSent = false;

    if (!userAlreadyExists) {
      // Criar novo usuário
      if (payload.senha) {
        // Criar com senha fornecida (⚠️ NUNCA logamos ou enviamos a senha por email)
        console.log('[c-create-official-access] 🔐 Creating user with provided password (NOT logged/emailed)');
        
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
          console.error('[c-create-official-access] ❌ Error creating user:', createError);
          return new Response(
            JSON.stringify({ success: false, error: `Erro ao criar usuário: ${createError.message}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        userId = newUser.user.id;
        emailStatus = 'password_set';
        passwordEmailSent = false; // Não precisou enviar email de senha
        console.log('[c-create-official-access] ✅ User created with password:', userId);

      } else {
        // Criar sem senha - gerar link de recuperação
        console.log('[c-create-official-access] 📧 Creating user WITHOUT password (will send setup link)');
        
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: payload.email,
          email_confirm: true, // Confirma email automaticamente
          user_metadata: {
            nome: payload.nome,
            created_by: caller.email,
            created_via: 'c-create-official-access',
          },
        });

        if (createError) {
          console.error('[c-create-official-access] ❌ Error creating user:', createError);
          return new Response(
            JSON.stringify({ success: false, error: `Erro ao criar usuário: ${createError.message}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        userId = newUser.user.id;

        // Gerar link de recuperação/definição de senha
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email: payload.email,
          options: {
            redirectTo: 'https://pro.moisesmedeiros.com.br/auth?action=set-password',
          },
        });

        if (linkError) {
          console.warn('[c-create-official-access] ⚠️ Recovery link error:', linkError.message);
        } else if (linkData?.properties?.action_link) {
          passwordSetupLink = linkData.properties.action_link;
          passwordEmailSent = true;
          console.log('[c-create-official-access] ✅ Password setup link generated');
        }

        emailStatus = 'queued';
        console.log('[c-create-official-access] ✅ User created, link generated:', userId);
      }
    } else {
      // Usuário já existe
      emailStatus = 'password_set'; // Assume que já tem senha
      console.log('[c-create-official-access] ℹ️ Using existing user:', userId);
    }

    if (!userId) {
      console.error('[c-create-official-access] ❌ No user_id after creation');
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
      console.error('[c-create-official-access] ⚠️ Profile upsert error:', profileError);
      // Não falha, apenas loga (profile pode já existir com trigger)
    } else {
      console.log('[c-create-official-access] ✅ Profile upserted');
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
      console.error('[c-create-official-access] ⚠️ Aluno upsert error:', alunoError);
      // Continua, não é crítico
    } else {
      console.log('[c-create-official-access] ✅ Aluno upserted');
    }

    // ============================================
    // 8. UPSERT EM USER_ROLES (CONSTITUIÇÃO v10.x)
    // Regra: 1 role por user_id (constraint UNIQUE user_roles_user_id_key)
    // 
    // ⚠️ ESTRATÉGIA DE CONFLICT:
    // - ON CONFLICT (user_id) DO UPDATE: Sobrescreve role existente
    // - Isso é CORRETO para fluxo de Hotmart/acesso oficial
    // - Aluno pode "subir" de aluno_gratuito → beta
    // ============================================
    const { error: roleUpsertError } = await supabaseAdmin
      .from('user_roles')
      .upsert({
        user_id: userId,
        role: payload.role,
      }, { 
        onConflict: 'user_id',  // ✅ CORRETO: 1 role por user
        ignoreDuplicates: false, // ✅ ATUALIZA role se já existir
      });

    if (roleUpsertError) {
      console.error('[c-create-official-access] ❌ Role upsert error:', roleUpsertError);
      return new Response(
        JSON.stringify({ success: false, error: `Erro ao atribuir role: ${roleUpsertError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[c-create-official-access] ✅ Role assigned:', payload.role);

    // ============================================
    // 9. ENVIAR EMAIL DE BOAS-VINDAS (OBRIGATÓRIO)
    // ⚠️ NUNCA envia senha em texto
    // ============================================
    console.log('[c-create-official-access] 📧 Sending welcome email...');
    
    const emailResult = await sendWelcomeEmail(
      resend,
      resendFrom,
      payload.email,
      payload.nome,
      payload.role,
      passwordSetupLink, // Só inclui se precisar configurar senha
    );

    if (emailResult.success) {
      welcomeEmailSent = true;
      emailStatus = 'welcome_sent';
      console.log('[c-create-official-access] ✅ Welcome email sent successfully');
    } else {
      console.error('[c-create-official-access] ❌ Welcome email failed:', emailResult.error);
      emailStatus = 'failed';
    }

    // ============================================
    // 10. LOG DE AUDITORIA
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
          user_already_existed: userAlreadyExists,
          welcome_email_sent: welcomeEmailSent,
          password_setup_required: !payload.senha,
        },
        metadata: {
          function: 'c-create-official-access',
          duration_ms: Date.now() - startTime,
        },
      });

    // ============================================
    // 11. RESPOSTA DE SUCESSO
    // ============================================
    const response: CreateAccessResponse = {
      success: true,
      user_id: userId,
      role: payload.role,
      email_status: emailStatus,
      email_details: {
        welcome_email: welcomeEmailSent,
        password_setup_email: passwordEmailSent,
      },
    };

    console.log('[c-create-official-access] ========== SUCCESS ==========');
    console.log('[c-create-official-access] Response:', JSON.stringify(response));
    console.log('[c-create-official-access] Duration:', Date.now() - startTime, 'ms');

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[c-create-official-access] ❌ Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro interno' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
