// ============================================
// 📜 PARTE 10 + 11 — Edge Function: c-create-official-access
// CONSTITUIÇÃO SYNAPSE Ω v10.x — PATCH-ONLY
// ============================================
// Cria acesso oficial para alunos (beta, aluno_gratuito, aluno_presencial, beta_expira)
// Campos obrigatórios: email, nome, role
// Campos opcionais: endereco, telefone, foto_aluno, senha, expires_days
// 
// 🎯 NOVO: expires_days para role beta_expira
// - Se role === 'beta_expira' e expires_days existe:
//   Calcula expires_at = NOW() + expires_days e salva em user_roles.expires_at
//
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

// CONSTITUIÇÃO v10.x - 4 roles de aluno válidas
type StudentRole = 'beta' | 'aluno_gratuito' | 'aluno_presencial' | 'beta_expira';

interface CreateAccessPayload {
  email: string;
  nome: string;
  role: StudentRole;
  telefone?: string;
  foto_aluno?: string;
  senha?: string;
  endereco?: EnderecoInput;
  expires_days?: number; // 30, 60, 90, 180, 365, ou custom
  tipo_produto?: 'livroweb' | 'fisico'; // Tipo de produto Hotmart
}

interface CreateAccessResponse {
  success: boolean;
  user_id?: string;
  role?: string;
  expires_at?: string | null; // NOVO: data de expiração se role === beta_expira
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
// ROLE LABELS (CONSTITUIÇÃO v10.x)
// ============================================
const ROLE_LABELS: Record<StudentRole, string> = {
  beta: 'Aluno Beta (Premium)',
  aluno_gratuito: 'Aluno Gratuito',
  aluno_presencial: 'Aluno Presencial',
  beta_expira: 'Beta com Expiração',
};

// ============================================
// ROLES DE ALUNO VÁLIDAS
// ============================================
const VALID_STUDENT_ROLES: StudentRole[] = ['beta', 'aluno_gratuito', 'aluno_presencial', 'beta_expira'];

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

  // Validar role (4 roles válidas)
  if (!VALID_STUDENT_ROLES.includes(p.role as StudentRole)) {
    return { valid: false, error: `Role deve ser uma de: ${VALID_STUDENT_ROLES.join(', ')}` };
  }

  // Validar expires_days se fornecido
  if (p.expires_days !== undefined) {
    if (typeof p.expires_days !== 'number' || p.expires_days < 1) {
      return { valid: false, error: 'expires_days deve ser um número positivo' };
    }
  }

  // Se role === 'beta_expira', expires_days é recomendado (warning, não erro)
  if (p.role === 'beta_expira' && !p.expires_days) {
    console.warn('[c-create-official-access] ⚠️ beta_expira sem expires_days - será acesso sem expiração');
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
      role: p.role as StudentRole,
      telefone: typeof p.telefone === 'string' ? p.telefone.trim() : undefined,
      foto_aluno: typeof p.foto_aluno === 'string' ? p.foto_aluno.trim() : undefined,
      senha: typeof p.senha === 'string' ? p.senha : undefined,
      endereco: typeof p.endereco === 'object' ? p.endereco as EnderecoInput : undefined,
      expires_days: typeof p.expires_days === 'number' ? p.expires_days : undefined,
    },
  };
}

// ============================================
// 🔐 GERADOR DE SENHA FORTE ALEATÓRIA
// Requisitos: 16 chars, maiúsculas, minúsculas, números, símbolos
// ============================================
function generateSecurePassword(): string {
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';      // Sem I, O (confusão visual)
  const lowercase = 'abcdefghjkmnpqrstuvwxyz';      // Sem i, l, o
  const numbers = '23456789';                        // Sem 0, 1
  const symbols = '!@#$%^&*+-=?';                   // Símbolos seguros para email
  const allChars = uppercase + lowercase + numbers + symbols;
  
  // Garantir pelo menos 1 de cada tipo
  const password: string[] = [
    uppercase[Math.floor(Math.random() * uppercase.length)],
    uppercase[Math.floor(Math.random() * uppercase.length)],
    lowercase[Math.floor(Math.random() * lowercase.length)],
    lowercase[Math.floor(Math.random() * lowercase.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ];
  
  // Preencher o resto até 16 caracteres
  while (password.length < 16) {
    password.push(allChars[Math.floor(Math.random() * allChars.length)]);
  }
  
  // Embaralhar (Fisher-Yates)
  for (let i = password.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [password[i], password[j]] = [password[j], password[i]];
  }
  
  return password.join('');
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
  role: StudentRole,
  generatedPassword?: string,
): Promise<{ success: boolean; error?: string }> {
  const roleLabel = ROLE_LABELS[role];
  const platformUrl = 'https://pro.moisesmedeiros.com.br/alunos';
  
  // 🎯 P0 FIX: Agora SEMPRE envia senha gerada no email (autorizado pelo OWNER)
  const hasPassword = !!generatedPassword;
  
  // Conteúdo interno usando o template base padrão
  const conteudo = `
    <h2 style="margin:0 0 16px;font-size:18px;color:#ffffff;">🎉 Bem-vindo(a), ${nome}!</h2>
    <p style="margin:0 0 12px;">Seu acesso à plataforma foi criado pela equipe de gestão.</p>
    
    <div style="background:#1a1a1f;border-radius:8px;padding:16px;margin:16px 0;text-align:center;">
      <p style="margin:0;color:#E62B4A;font-size:16px;font-weight:bold;">✅ ${roleLabel}</p>
    </div>
    
    ${hasPassword ? `
    <div style="background:#2a2a2f;border-radius:8px;padding:20px;margin:16px 0;border-left:4px solid #E62B4A;">
      <p style="margin:0 0 12px;color:#ffffff;font-weight:bold;font-size:15px;">🔐 Suas Credenciais de Acesso</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0;color:#9aa0a6;font-size:13px;width:60px;">📧 Email:</td>
          <td style="padding:8px 0;color:#ffffff;font-size:14px;font-weight:500;">${toEmail}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#9aa0a6;font-size:13px;">🔑 Senha:</td>
          <td style="padding:8px 0;">
            <code style="background:#1a1a1f;padding:8px 12px;border-radius:6px;font-family:'Courier New',monospace;color:#22c55e;font-size:15px;font-weight:bold;letter-spacing:1px;">${generatedPassword}</code>
          </td>
        </tr>
      </table>
      <p style="margin:16px 0 0;color:#fbbf24;font-size:12px;">⚠️ Por segurança, recomendamos alterar sua senha no primeiro acesso.</p>
    </div>
    ` : `
    <div style="background:#1a2f1a;border-radius:8px;padding:16px;margin:16px 0;border-left:3px solid #22c55e;">
      <p style="margin:0 0 8px;color:#22c55e;font-weight:bold;">✅ Acesso pronto!</p>
      <p style="margin:0;color:#9aa0a6;font-size:13px;">Sua conta já está configurada. Faça login com seu email e senha.</p>
    </div>
    `}
    
    <h3 style="margin:20px 0 12px;font-size:14px;color:#ffffff;">📚 Próximos passos:</h3>
    <ul style="margin:0;padding-left:20px;color:#9aa0a6;font-size:13px;line-height:1.8;">
      <li>Acesse a plataforma clicando no botão abaixo</li>
      <li>Faça login com seu email e senha</li>
      <li>Explore todo o conteúdo disponível para você</li>
      <li>Em caso de dúvidas, entre em contato via WhatsApp</li>
    </ul>
  `;
  
  const htmlContent = getBaseTemplate(
    "Seu acesso foi criado com sucesso!",
    conteudo,
    "Acessar Plataforma",
    platformUrl
  );

  try {
    console.log('[c-create-official-access] Sending welcome email to:', toEmail);
    
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      subject: `🎉 Bem-vindo(a), ${nome}! Seu acesso está pronto — Curso Moisés Medeiros`,
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
    
    // ============================================
    // 3.1 NORMALIZAR EMAIL (AXIOMA DE IDENTIDADE)
    // 1 EMAIL = 1 PESSOA = 1 LOGIN
    // ============================================
    payload.email = payload.email.toLowerCase().trim();
    console.log('[c-create-official-access] 📝 Creating access for:', payload.email, 'Role:', payload.role);

    // ============================================
    // 4. VERIFICAR SE USUÁRIO JÁ EXISTE (GLOBAL CHECK)
    // Verifica em auth.users E profiles
    // ============================================
    let userId: string | null = null;
    let userAlreadyExists = false;

    // Verificar em auth.users primeiro (fonte primária de identidade)
    const { data: existingAuthUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuthUser = existingAuthUsers?.users?.find(
      u => u.email?.toLowerCase().trim() === payload.email
    );

    if (existingAuthUser) {
      userId = existingAuthUser.id;
      userAlreadyExists = true;
      console.log('[c-create-official-access] ℹ️ User already exists in auth.users:', userId);
    } else {
      // Fallback: buscar em profiles (para casos de inconsistência)
      const { data: userByEmail } = await supabaseAdmin
        .from('profiles')
        .select('id, email')
        .ilike('email', payload.email)
        .maybeSingle();

      if (userByEmail) {
        userId = userByEmail.id;
        userAlreadyExists = true;
        console.log('[c-create-official-access] ⚠️ User exists in profiles but not auth (orphan):', userId);
      }
    }

    // ============================================
    // 5. CRIAR OU OBTER USUÁRIO
    // 🎯 P0 FIX: SEMPRE gera senha aleatória se não fornecida
    // e ENVIA a senha por email (autorizado pelo OWNER)
    // ============================================
    let emailStatus: 'sent' | 'queued' | 'failed' | 'password_set' | 'welcome_sent' = 'failed';
    let generatedPassword: string | undefined;
    let welcomeEmailSent = false;
    let passwordEmailSent = false;

    if (!userAlreadyExists) {
      // Determinar senha: usar fornecida ou gerar nova
      const senhaFinal = payload.senha || generateSecurePassword();
      generatedPassword = payload.senha ? undefined : senhaFinal; // Só guarda se foi gerada
      
      console.log('[c-create-official-access] 🔐 Creating user with password (generated:', !payload.senha, ')');
      
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: payload.email,
        password: senhaFinal,
        email_confirm: true, // Auto-confirma email
        user_metadata: {
          nome: payload.nome,
          created_by: caller.email,
          created_via: 'c-create-official-access',
          password_was_generated: !payload.senha,
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
      passwordEmailSent = !payload.senha; // Será enviada se foi gerada
      console.log('[c-create-official-access] ✅ User created:', userId);
    } else {
      // ============================================
      // 🎯 P0 FIX: Usuário já existe - SEMPRE gera nova senha
      // e atualiza no auth para garantir acesso funcional
      // ============================================
      const senhaParaExistente = payload.senha || generateSecurePassword();
      generatedPassword = payload.senha ? undefined : senhaParaExistente;
      
      console.log('[c-create-official-access] 🔐 Updating existing user password (generated:', !payload.senha, ')');
      
      // Atualizar senha do usuário existente
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId!,
        { 
          password: senhaParaExistente,
          email_confirm: true, // Garantir email confirmado
          user_metadata: {
            nome: payload.nome,
            updated_by: caller.email,
            updated_via: 'c-create-official-access',
            password_was_regenerated: !payload.senha,
            password_regenerated_at: new Date().toISOString(),
          },
        }
      );
      
      if (updateError) {
        console.error('[c-create-official-access] ⚠️ Error updating user password:', updateError.message);
        // Não falha completamente, continua com o fluxo
      } else {
        console.log('[c-create-official-access] ✅ User password updated successfully');
        passwordEmailSent = !payload.senha;
      }
      
      emailStatus = 'password_set';
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
    // + password_change_required (MAGIC PASSWORD FLOW)
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

    // 🎯 MAGIC PASSWORD FLOW: Forçar troca de senha no primeiro login
    // Se senha foi gerada automaticamente (novo OU existente), marca para forçar troca
    if (generatedPassword) {
      profileData.password_change_required = true;
      profileData.magic_password_created_at = new Date().toISOString();
      console.log('[c-create-official-access] 🔐 Magic password flow: will require password change on first login');
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
    
    // Tipo de produto (livroweb ou fisico) para roles beta/beta_expira
    if (payload.tipo_produto) {
      alunoData.tipo_produto = payload.tipo_produto;
      console.log('[c-create-official-access] 📦 Tipo produto:', payload.tipo_produto);
    }

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
    // 
    // 🎯 UNIFICADO: expires_at funciona para QUALQUER role (SYNAPSE Ω v10.x)
    // - Se expires_days fornecido → calcula expires_at
    // - Se não fornecido → expires_at = NULL (permanente)
    // ============================================
    
    // Calcular expires_at se expires_days fornecido (para qualquer role)
    let expiresAt: string | null = null;
    if (payload.expires_days) {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + payload.expires_days);
      expiresAt = expirationDate.toISOString();
      console.log(`[c-create-official-access] 📅 Role expires_at: ${expiresAt} (${payload.expires_days} days)`);
    } else {
      console.log(`[c-create-official-access] ♾️ Role permanente (sem expiração)`);
    }
    
    const roleData: Record<string, unknown> = {
      user_id: userId,
      role: payload.role,
      expires_at: expiresAt, // NULL = permanente, DATE = expira
    };
    
    const { error: roleUpsertError } = await supabaseAdmin
      .from('user_roles')
      .upsert(roleData, { 
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

    console.log('[c-create-official-access] ✅ Role assigned:', payload.role, expiresAt ? `(expires: ${expiresAt})` : '');

    // ============================================
    // 9. ENVIAR EMAIL DE BOAS-VINDAS (COM SENHA SE GERADA)
    // 🎯 P0 FIX: Envia senha gerada por email (autorizado pelo OWNER)
    // ============================================
    console.log('[c-create-official-access] 📧 Sending welcome email...');
    
    const emailResult = await sendWelcomeEmail(
      resend,
      resendFrom,
      payload.email,
      payload.nome,
      payload.role,
      generatedPassword, // Envia senha gerada (ou undefined se foi fornecida)
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
          expires_at: expiresAt,
          expires_days: payload.expires_days,
          created_by: caller.email,
          caller_role: callerRoleData.role,
          user_already_existed: userAlreadyExists,
          welcome_email_sent: welcomeEmailSent,
          password_was_generated: !payload.senha,
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
      expires_at: expiresAt,
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
