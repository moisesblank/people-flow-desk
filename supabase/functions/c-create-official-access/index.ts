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

import { createClient } from "npm:@supabase/supabase-js@2";
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Resend } from "npm:resend@2.0.0";

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
  email: string;          // 🔒 OBRIGATÓRIO e ÚNICO
  nome: string;
  role: StudentRole;
  telefone: string;       // 🔒 OBRIGATÓRIO e ÚNICO
  cpf: string;            // 🔒 OBRIGATÓRIO e ÚNICO (validado na Receita Federal)
  foto_aluno?: string;
  senha?: string;
  endereco?: EnderecoInput;
  expires_days?: number;  // 30, 60, 90, 180, 365, ou custom
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
// CONSTITUIÇÃO v10.x — TODAS as roles de gestão
// NÃO usar 'funcionario' (é CATEGORIA, não role!)
// ============================================
const ALLOWED_CALLER_ROLES = [
  'owner',           // Proprietário
  'admin',           // Administrador
  'coordenacao',     // Coordenação
  'contabilidade',   // Contabilidade (pode criar acessos presenciais)
  'suporte',         // Suporte (principal criador de acessos)
  'monitoria',       // Monitoria
];

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

  // Validar CPF OBRIGATÓRIO (11 dígitos)
  if (!p.cpf || typeof p.cpf !== 'string') {
    return { valid: false, error: 'CPF é obrigatório' };
  }
  const cpfClean = String(p.cpf).replace(/\D/g, '');
  if (cpfClean.length !== 11) {
    return { valid: false, error: 'CPF deve ter 11 dígitos' };
  }

  // Validar Telefone OBRIGATÓRIO
  if (!p.telefone || typeof p.telefone !== 'string' || !p.telefone.trim()) {
    return { valid: false, error: 'Telefone é obrigatório' };
  }

  return {
    valid: true,
    data: {
      email: (p.email as string).toLowerCase().trim(),
      nome: (p.nome as string).trim(),
      role: p.role as StudentRole,
      telefone: (p.telefone as string).trim(), // Já validado como obrigatório
      cpf: (p.cpf as string).replace(/\D/g, ''), // Já validado como obrigatório
      foto_aluno: typeof p.foto_aluno === 'string' ? p.foto_aluno.trim() : undefined,
      senha: typeof p.senha === 'string' ? p.senha : undefined,
      endereco: typeof p.endereco === 'object' ? p.endereco as EnderecoInput : undefined,
      expires_days: typeof p.expires_days === 'number' ? p.expires_days : undefined,
      tipo_produto: typeof p.tipo_produto === 'string' ? p.tipo_produto as 'livroweb' | 'fisico' : undefined,
    },
  };
}

// ============================================
// 🔍 LOOKUP ROBUSTO: buscar usuário por email no Auth
// Evita falso-negativo do listUsers() (padrão pagina)
// e corrige o bug: tentar createUser → email_exists
// ============================================
async function getAuthUserByEmailSafe(
  supabaseAdmin: any,
  email: string
): Promise<{ id: string; email?: string | null } | null> {
  const normalized = (email || '').toLowerCase().trim();
  if (!normalized) return null;

  // Preferência: API específica (determinística)
  try {
    if (supabaseAdmin?.auth?.admin?.getUserByEmail) {
      const { data, error } = await supabaseAdmin.auth.admin.getUserByEmail(normalized);
      if (!error && data?.user?.id) return { id: data.user.id, email: data.user.email };
    }
  } catch (_e) {
    // fallback abaixo
  }

  // Fallback: paginação manual (limite grande, mas finito)
  // OBS: listUsers() por padrão pagina e pode retornar só os primeiros N.
  try {
    const perPage = 1000;
    for (let page = 1; page <= 20; page++) {
      const { data } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
      const found = data?.users?.find((u: any) => (u.email || '').toLowerCase().trim() === normalized);
      if (found?.id) return { id: found.id, email: found.email };
      if (!data?.users?.length || data.users.length < perPage) break;
    }
  } catch (_e) {
    // última linha de defesa: null
  }

  return null;
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
// TEMPLATE BASE PADRÃO - OTIMIZADO PARA GMAIL
// ⚠️ Gmail oculta conteúdo quando detecta CSS "suspeito"
// ✅ Solução: HTML simples, cores sólidas, sem gradientes
// ============================================
const getBaseTemplate = (titulo: string, conteudo: string, botaoTexto?: string, botaoUrl?: string) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
  <title>${titulo}</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5;color:#333333;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#ffffff;">
    <tr>
      <td align="center" style="padding:20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border:1px solid #dddddd;border-radius:8px;">
          <!-- HEADER -->
          <tr>
            <td align="center" style="padding:30px 20px;background-color:#E62B4A;border-radius:8px 8px 0 0;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:bold;">Curso Moisés Medeiros</h1>
              <p style="margin:10px 0 0;color:#ffffff;font-size:14px;opacity:0.9;">${titulo}</p>
            </td>
          </tr>
          <!-- CONTENT -->
          <tr>
            <td style="padding:30px 25px;background-color:#ffffff;">
              ${conteudo}
            </td>
          </tr>
          <!-- BUTTON -->
          ${botaoTexto && botaoUrl ? `
          <tr>
            <td align="center" style="padding:10px 25px 30px;">
              <!--[if mso]>
              <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${botaoUrl}" style="height:50px;v-text-anchor:middle;width:250px;" arcsize="10%" strokecolor="#C91A32" fillcolor="#E62B4A">
              <w:anchorlock/>
              <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">
              ${botaoTexto}
              </center>
              </v:roundrect>
              <![endif]-->
              <!--[if !mso]><!-->
              <a href="${botaoUrl}" target="_blank" style="display:inline-block;background-color:#E62B4A;color:#ffffff;text-decoration:none;padding:15px 40px;border-radius:6px;font-weight:bold;font-size:16px;text-align:center;border:2px solid #C91A32;">
                ${botaoTexto}
              </a>
              <!--<![endif]-->
            </td>
          </tr>
          ` : ''}
          <!-- FOOTER -->
          <tr>
            <td style="padding:20px 25px;background-color:#f5f5f5;border-top:1px solid #dddddd;border-radius:0 0 8px 8px;">
              <p style="margin:0 0 8px;color:#333333;font-size:14px;font-weight:bold;">Prof. Moisés Medeiros Melo</p>
              <p style="margin:0 0 8px;color:#666666;font-size:13px;">MM CURSO DE QUÍMICA LTDA | O curso que mais aprova e comprova!</p>
              <p style="margin:0;color:#666666;font-size:13px;">WhatsApp: <a href="https://wa.me/558396169222" style="color:#E62B4A;text-decoration:none;">+55 83 9616-9222</a></p>
            </td>
          </tr>
          <!-- COPYRIGHT -->
          <tr>
            <td align="center" style="padding:15px;">
              <p style="margin:0;color:#999999;font-size:12px;">© ${new Date().getFullYear()} MM Curso de Química Ltda.</p>
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
// ENVIAR EMAIL DE BOAS-VINDAS COM LINK DE DEFINIÇÃO DE SENHA
// ⚠️ NUNCA envia senha em texto - envia link clicável
// 🎯 P0 FIX v2: Botão clicável para PRIMEIRO ACESSO (não reset de senha)
// O magic link autentica e redireciona direto para /primeiro-acesso
// A definição de senha acontece DENTRO do onboarding (etapa 3)
// ============================================
async function sendWelcomeEmailWithMagicLink(
  resend: Resend,
  fromEmail: string,
  toEmail: string,
  nome: string,
  role: StudentRole,
  magicLinkUrl: string, // Link de acesso (magic link, não reset token)
): Promise<{ success: boolean; error?: string }> {
  const roleLabel = ROLE_LABELS[role];

  // 🎯 P0 FIX v4: Conteúdo SIMPLIFICADO para Gmail não ocultar
  // ⚠️ Gmail oculta e-mails com CSS dark/gradientes
  const conteudo = `
    <h2 style="margin:0 0 16px;font-size:20px;color:#E62B4A;">Bem-vindo(a), ${nome}!</h2>
    <p style="margin:0 0 16px;color:#333333;font-size:15px;">Seu acesso à plataforma foi criado pela equipe de gestão.</p>
    
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:16px 0;">
      <tr>
        <td style="background-color:#f0f9ff;border-radius:8px;padding:16px;text-align:center;border:1px solid #bae6fd;">
          <p style="margin:0;color:#0369a1;font-size:16px;font-weight:bold;">${roleLabel}</p>
        </td>
      </tr>
    </table>
    
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:16px 0;">
      <tr>
        <td style="background-color:#f0fdf4;border-radius:8px;padding:20px;border-left:4px solid #22c55e;">
          <p style="margin:0 0 10px;color:#166534;font-weight:bold;font-size:16px;">Acesse a Plataforma</p>
          <p style="margin:0 0 10px;color:#333333;font-size:14px;">Clique no botão abaixo para iniciar sua configuração. Você vai definir sua senha e personalizar sua experiência.</p>
          <p style="margin:0;color:#166534;font-size:13px;font-weight:bold;">Este link NÃO expira. Use quando quiser!</p>
        </td>
      </tr>
    </table>
    
    <p style="margin:20px 0 12px;font-size:15px;color:#333333;font-weight:bold;">O que vai acontecer:</p>
    <ol style="margin:0;padding-left:20px;color:#555555;font-size:14px;line-height:1.8;">
      <li><strong style="color:#E62B4A;">Clique no botão abaixo</strong></li>
      <li>Conheça as funcionalidades disponíveis</li>
      <li>Escolha seu tema visual preferido</li>
      <li>Defina sua senha de acesso</li>
      <li>Cadastre seu dispositivo de confiança</li>
    </ol>
  `;
  
  const htmlContent = getBaseTemplate(
    "Seu acesso foi criado com sucesso!",
    conteudo,
    "Acessar Plataforma", // 🎯 MUDOU: Não é mais "Definir Minha Senha"
    magicLinkUrl
  );

  try {
    console.log('[c-create-official-access] Sending welcome email with magic link to:', toEmail);
    
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      subject: `🎉 Bem-vindo(a), ${nome}! Acesse a plataforma — Curso Moisés Medeiros`,
      html: htmlContent,
    });

    if (error) {
      console.error('[c-create-official-access] Resend error:', error);
      return { success: false, error: error.message };
    }

    console.log('[c-create-official-access] Welcome email with magic link sent successfully. ID:', data?.id);
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
    // 3.2 VALIDAR UNICIDADE DO CPF (SE FORNECIDO)
    // CPF deve ser único no sistema
    // ============================================
    if (payload.cpf) {
      console.log('[c-create-official-access] 🔍 Verificando unicidade do CPF...');
      
      // Verificar em profiles
      const { data: existingCPFProfile } = await supabaseAdmin
        .from('profiles')
        .select('id, email, cpf')
        .eq('cpf', payload.cpf)
        .maybeSingle();
      
      if (existingCPFProfile && existingCPFProfile.email?.toLowerCase() !== payload.email) {
        console.error('[c-create-official-access] ❌ CPF já cadastrado para outro usuário:', existingCPFProfile.email);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `CPF já cadastrado para outro usuário (${existingCPFProfile.email?.substring(0, 3)}***)`
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Verificar também em alunos
      const { data: existingCPFAluno } = await supabaseAdmin
        .from('alunos')
        .select('id, email, cpf')
        .eq('cpf', payload.cpf)
        .maybeSingle();
      
      if (existingCPFAluno && existingCPFAluno.email?.toLowerCase() !== payload.email) {
        console.error('[c-create-official-access] ❌ CPF já cadastrado na tabela alunos:', existingCPFAluno.email);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `CPF já cadastrado para outro aluno (${existingCPFAluno.email?.substring(0, 3)}***)`
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('[c-create-official-access] ✅ CPF único confirmado');
    }

    // ============================================
    // 3.3 VALIDAR UNICIDADE DO TELEFONE (OBRIGATÓRIO)
    // Telefone deve ser único no sistema
    // ============================================
    if (payload.telefone) {
      console.log('[c-create-official-access] 🔍 Verificando unicidade do telefone...');
      
      // Normalizar telefone (apenas dígitos)
      const telefoneNormalizado = payload.telefone.replace(/\D/g, '');
      
      // Verificar em profiles (campo phone)
      const { data: existingPhoneProfile } = await supabaseAdmin
        .from('profiles')
        .select('id, email, phone')
        .or(`phone.eq.${telefoneNormalizado},phone.eq.${payload.telefone}`)
        .maybeSingle();
      
      if (existingPhoneProfile && existingPhoneProfile.email?.toLowerCase() !== payload.email) {
        console.error('[c-create-official-access] ❌ Telefone já cadastrado para outro usuário:', existingPhoneProfile.email);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Telefone já cadastrado para outro usuário (${existingPhoneProfile.email?.substring(0, 3)}***)`
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Verificar também em alunos
      const { data: existingPhoneAluno } = await supabaseAdmin
        .from('alunos')
        .select('id, email, telefone')
        .or(`telefone.eq.${telefoneNormalizado},telefone.eq.${payload.telefone}`)
        .maybeSingle();
      
      if (existingPhoneAluno && existingPhoneAluno.email?.toLowerCase() !== payload.email) {
        console.error('[c-create-official-access] ❌ Telefone já cadastrado na tabela alunos:', existingPhoneAluno.email);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Telefone já cadastrado para outro aluno (${existingPhoneAluno.email?.substring(0, 3)}***)`
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('[c-create-official-access] ✅ Telefone único confirmado');
    } else {
      // Telefone é OBRIGATÓRIO
      console.error('[c-create-official-access] ❌ Telefone não fornecido');
      return new Response(
        JSON.stringify({ success: false, error: 'Telefone é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // 4. VERIFICAR SE USUÁRIO JÁ EXISTE (GLOBAL CHECK)
    // Verifica em auth.users E profiles
    // ============================================
    let userId: string | null = null;
    let userAlreadyExists = false;

    // Verificar em auth.users primeiro (fonte primária de identidade)
    // ⚠️ BUG P0: listUsers() é paginado e pode não incluir o email procurado.
    const existingAuthUser = await getAuthUserByEmailSafe(supabaseAdmin, payload.email);

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
    // 🎯 P0 FIX NOVO FLUXO: Criar com senha temporária
    // O usuário vai definir sua própria senha via link no email
    // ============================================
    let emailStatus: 'sent' | 'queued' | 'failed' | 'password_set' | 'welcome_sent' = 'failed';
    let welcomeEmailSent = false;
    let passwordEmailSent = false;
    
    // Senha temporária - usuário vai redefinir via link
    const tempPassword = payload.senha || generateSecurePassword();

    if (!userAlreadyExists) {
      console.log('[c-create-official-access] 🔐 Creating user with temporary password (will be reset via link)');
      
       const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: payload.email,
        password: tempPassword,
        email_confirm: true, // Auto-confirma email
        user_metadata: {
          nome: payload.nome,
          created_by: caller.email,
          created_via: 'c-create-official-access',
          requires_password_setup: !payload.senha, // Flag para indicar que precisa definir senha
        },
      });

      if (createError) {
         // 🎯 FIX P0: Se email já existe, recuperar user_id e seguir fluxo de reativação.
         const msg = (createError as any)?.message || '';
         const code = (createError as any)?.code || '';
         const isEmailExists = code === 'email_exists' || msg.toLowerCase().includes('already been registered') || msg.toLowerCase().includes('email_exists');
         if (isEmailExists) {
           console.warn('[c-create-official-access] ⚠️ createUser email_exists — recuperando usuário existente');
           const recovered = await getAuthUserByEmailSafe(supabaseAdmin, payload.email);
           if (recovered?.id) {
             userId = recovered.id;
             userAlreadyExists = true;
             console.log('[c-create-official-access] ✅ User recovered after email_exists:', userId);
           } else {
             console.error('[c-create-official-access] ❌ email_exists mas não foi possível recuperar o usuário por email');
             return new Response(
               JSON.stringify({ success: false, error: 'Email já existe, mas não foi possível recuperar o usuário para reativação. Contate o suporte técnico.' }),
               { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
             );
           }
         } else {
           console.error('[c-create-official-access] ❌ Error creating user:', createError);
           return new Response(
             JSON.stringify({ success: false, error: `Erro ao criar usuário: ${createError.message}` }),
             { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
           );
         }
      }

       // Se criou agora, newUser existe. Se caiu no email_exists, userId foi recuperado.
       if (newUser?.user?.id) {
         userId = newUser.user.id;
         userAlreadyExists = false;
         console.log('[c-create-official-access] ✅ User created:', userId);
       }

       emailStatus = 'password_set';
       passwordEmailSent = !payload.senha;
    } else {
      // ============================================
      // 🎯 Usuário já existe - NÃO alterar senha (manter existente)
      // Apenas atualizar metadata e enviar link de reset se necessário
      // ============================================
      console.log('[c-create-official-access] ℹ️ User already exists, updating metadata only');
      
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId!,
        { 
          email_confirm: true, // Garantir email confirmado
          user_metadata: {
            nome: payload.nome,
            updated_by: caller.email,
            updated_via: 'c-create-official-access',
            access_reactivated_at: new Date().toISOString(),
          },
        }
      );
      
      if (updateError) {
        console.error('[c-create-official-access] ⚠️ Error updating user metadata:', updateError.message);
      } else {
        console.log('[c-create-official-access] ✅ User metadata updated successfully');
      }
      
      emailStatus = 'password_set';
      passwordEmailSent = true; // Vai enviar link de setup
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

    if (payload.cpf) {
      profileData.cpf = payload.cpf;
    }

    if (payload.foto_aluno) {
      profileData.avatar_url = payload.foto_aluno;
    }

    // 🎯 PRIMEIRO ACESSO: SEMPRE marca password_change_required para novos usuários
    // O link no email vai permitir que o usuário defina sua própria senha
    if (!payload.senha) {
      profileData.password_change_required = true;
      profileData.onboarding_completed = false;
      profileData.platform_steps_completed = false;
      console.log('[c-create-official-access] 🔐 First access: will redirect to password setup via email link');
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

    if (payload.cpf) {
      alunoData.cpf = payload.cpf;
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
    // 9. GERAR TOKEN PERSISTENTE DE PRIMEIRO ACESSO
    // 🎯 P0 FIX v3: Token que NUNCA expira até ser usado
    // Substitui magic links que expiram em 1 hora
    // ============================================
    console.log('[c-create-official-access] 📧 Generating persistent first-access token...');
    
    // 🎯 P0 FIX: URL dinâmica via env (fallback para produção)
    const siteUrl = Deno.env.get('SITE_URL') || 'https://pro.moisesmedeiros.com.br';
    console.log('[c-create-official-access] 📍 Using SITE_URL:', siteUrl);
    
    // Gerar token único e seguro (32 bytes = 64 hex chars)
    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const persistentToken = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Invalidar tokens anteriores do mesmo usuário
    await supabaseAdmin
      .from('first_access_tokens')
      .update({ is_used: true, used_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_used', false);
    
    // Criar novo token persistente (SEM expiração!)
    const { error: tokenError } = await supabaseAdmin
      .from('first_access_tokens')
      .insert({
        user_id: userId,
        email: payload.email,
        token: persistentToken,
        created_by: caller.id,
        metadata: {
          role: payload.role,
          nome: payload.nome,
          created_via: 'c-create-official-access',
        },
      });
    
    if (tokenError) {
      console.error('[c-create-official-access] ❌ Failed to create persistent token:', tokenError);
    } else {
      console.log('[c-create-official-access] ✅ Persistent first-access token created (NEVER expires until used)');
    }
    
    // URL com token persistente
    const firstAccessUrl = `${siteUrl}/auth?first_access_token=${persistentToken}`;
    
    const emailResult = await sendWelcomeEmailWithMagicLink(
      resend,
      resendFrom,
      payload.email,
      payload.nome,
      payload.role,
      firstAccessUrl,
    );

    if (emailResult.success) {
      welcomeEmailSent = true;
      emailStatus = 'welcome_sent';
      console.log('[c-create-official-access] ✅ Welcome email with persistent token sent successfully');
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
