import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

import { getCorsHeaders, handleCorsOptions } from "../_shared/corsConfig.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// 🎯 CONSTITUIÇÃO ROLES v1.0.0 - Nomenclatura Definitiva
// "employee" e "funcionario" são CATEGORIAS, não roles
// Cada funcionário recebe UMA role específica de permissão
type StaffRole = 
  | "admin"        // Nível 1 - Administrador
  | "coordenacao"  // Nível 2 - Coordenação
  | "contabilidade"// Nível 2 - Contabilidade  
  | "suporte"      // Nível 3 - Suporte
  | "monitoria"    // Nível 3 - Monitoria
  | "marketing"    // Nível 3 - Marketing
  | "afiliado";    // Nível 3 - Afiliados

const VALID_STAFF_ROLES: StaffRole[] = [
  "admin", "coordenacao", "contabilidade", "suporte", "monitoria", "marketing", "afiliado"
];

const PASSWORD_POLICY = {
  minLength: 8,
  // pelo menos 1 minúscula, 1 maiúscula, 1 número e 1 especial
  regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|<>?,./`~]).+$/,
} as const;

function validateStrongPassword(password: string): string | null {
  if (!password || password.length < PASSWORD_POLICY.minLength) {
    return `Senha fraca: mínimo de ${PASSWORD_POLICY.minLength} caracteres.`;
  }
  if (!PASSWORD_POLICY.regex.test(password)) {
    return "Senha fraca: use ao menos 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial.";
  }
  return null;
}

interface InviteRequest {
  email: string;
  nome: string;
  senha: string;
  funcao?: string;
  role?: StaffRole; // Role específica de permissão (NOVO!)
  employee_id?: number;
}

const handler = async (req: Request): Promise<Response> => {
  // LEI VI: CORS dinâmico via allowlist centralizado
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

  try {
    // Verify authorization
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      console.log("[INVITE] No authorization header");
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify the requesting user is admin/owner
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.log("[INVITE] Invalid token:", userError?.message);
      return new Response(
        JSON.stringify({ error: "Token inválido" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user is gestao staff (owner, admin, employee, coordenacao, etc.)
    const { data: isStaff } = await supabase.rpc("is_gestao_staff", { _user_id: user.id });
    if (!isStaff) {
      console.log("[INVITE] User is not gestao staff:", user.id);
      return new Response(
        JSON.stringify({ error: "Permissão negada. Apenas funcionários da gestão podem criar acessos." }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const rawBody: InviteRequest = await req.json();
    
    // ============================================
    // AXIOMA DE IDENTIDADE: NORMALIZAR EMAIL
    // 1 EMAIL = 1 PESSOA = 1 LOGIN
    // ============================================
    const email = rawBody.email?.toLowerCase().trim();
    const nome = rawBody.nome?.trim();
    const senha = rawBody.senha;
    const funcao = rawBody.funcao;
    const role = rawBody.role;
    const employee_id = rawBody.employee_id;

    if (!email || !nome) {
      return new Response(
        JSON.stringify({ error: "Email e nome são obrigatórios" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const passwordError = validateStrongPassword(senha);
    if (passwordError) {
      return new Response(
        JSON.stringify({ error: passwordError }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // 🎯 Validar role (default: suporte)
    const assignedRole: StaffRole = role && VALID_STAFF_ROLES.includes(role) ? role : "suporte";
    console.log(`[INVITE] Role a ser atribuída: ${assignedRole}`);

    console.log(`[INVITE] Creating user: ${email} (${nome})`);

    // Check if user already exists (OTIMIZADO: busca direta, não listUsers)
    // P1 FIX: listUsers() não escala com +10k usuários
    let existingUser = null;
    try {
      // Buscar pelo profiles (indexado por email) - mais rápido que auth.admin.listUsers
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, email')
        .ilike('email', email.trim())
        .limit(1)
        .single();
      
      if (profileData?.id) {
        const { data: userData } = await supabase.auth.admin.getUserById(profileData.id);
        existingUser = userData?.user;
      }
    } catch {
      // Usuário não existe, será criado abaixo
      existingUser = null;
    }

    if (existingUser) {
      console.log(`[INVITE] User already exists: ${email}`);
      
      // Update password for existing user
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { password: senha }
      );

      if (updateError) {
        console.error("[INVITE] Error updating password:", updateError);
        return new Response(
          JSON.stringify({ error: `Erro ao atualizar senha: ${updateError.message}` }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Update employee record if employee_id provided
      if (employee_id) {
        await supabase
          .from("employees")
          .update({ 
            email: email,
            user_id: existingUser.id 
          })
          .eq("id", employee_id);
      }

      console.log(`[INVITE] Password updated for existing user: ${email}`);
      
      // 🎯 FIX: Enviar email via fetch direto COM SENHA
      try {
        const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-notification-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            to: email,
            type: "welcome_staff", // Template específico com senha
            data: { 
              nome,
              senha, // ✅ P0 FIX: Incluir senha no email
              email, // Para exibir login
            },
          }),
        });

        if (emailResponse.ok) {
          const emailData = await emailResponse.json();
          console.log("[INVITE] Welcome email sent to existing user", emailData);
        } else {
          const errText = await emailResponse.text();
          console.warn("[INVITE] Email sending may have failed:", errText);
        }
      } catch (emailErr) {
        console.warn("[INVITE] Email error:", emailErr);
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Acesso atualizado com sucesso! O funcionário receberá um email.",
          user_id: existingUser.id
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create new user with password
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      password: senha,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        nome: nome,
        funcao: funcao,
        invited: true,
        employee_id: employee_id,
      },
    });

    if (createError) {
      console.error("[INVITE] Error creating user:", createError);
      return new Response(
        JSON.stringify({ error: `Erro ao criar usuário: ${createError.message}` }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[INVITE] User created successfully: ${email}, ID: ${newUser.user?.id}`);

    // Update employee record if employee_id provided
    if (employee_id && newUser.user) {
      const { error: updateError } = await supabase
        .from("employees")
        .update({ 
          email: email,
          user_id: newUser.user.id 
        })
        .eq("id", employee_id);
      
      if (updateError) {
        console.warn("[INVITE] Could not update employee:", updateError);
      } else {
        console.log(`[INVITE] Employee ${employee_id} linked to user ${newUser.user.id}`);
      }
    }

    // ============================================
    // 🎯 UPSERT ROLE (CONSTITUIÇÃO v10.x)
    // Regra: 1 role por user_id (constraint UNIQUE user_roles_user_id_key)
    // 
    // ⚠️ ESTRATÉGIA DE CONFLICT:
    // - ON CONFLICT (user_id) DO UPDATE: Sobrescreve role existente
    // - Isso é CORRETO para convite de funcionário
    // - Se user já existia com outra role, agora será staff
    // ============================================
    if (newUser.user) {
      // 🎯 CONSTITUIÇÃO v10.4: Criar profile com password_change_required = true
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: newUser.user.id,
          email: email,
          nome: nome,
          password_change_required: true,  // 🔐 OBRIGATÓRIO: Força primeiro acesso
          onboarding_completed: false,     // 🔐 OBRIGATÓRIO: Força onboarding
        }, { onConflict: "id" });
      
      if (profileError) {
        console.warn("[INVITE] Could not create profile:", profileError);
      } else {
        console.log(`[INVITE] Profile created for ${newUser.user.id} with password_change_required=true`);
      }

      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert({ 
          user_id: newUser.user.id, 
          role: assignedRole // Role específica: suporte, monitoria, coordenacao, etc.
        }, { 
          onConflict: "user_id",  // ✅ CORRETO: 1 role por user
          ignoreDuplicates: false, // ✅ ATUALIZA role se já existir
        });
      
      if (roleError) {
        console.warn("[INVITE] Could not assign role:", roleError);
      } else {
        console.log(`[INVITE] Role '${assignedRole}' assigned to ${newUser.user.id}`);
      }
    }

    // 🎯 P0 FIX v2: Gerar magic link para /primeiro-acesso
    // NÃO enviar senha em texto - funcionário define no onboarding
    if (newUser.user) {
      try {
        // 🎯 P0 FIX v3: URL dinâmica via env (fallback para produção)
        const siteUrl = Deno.env.get('SITE_URL') || 'https://pro.moisesmedeiros.com.br';
        console.log('[invite-employee] 📍 Using SITE_URL:', siteUrl);
        
        // Gerar magic link para primeiro acesso
        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
          type: 'magiclink',
          email: email,
          options: {
            redirectTo: `${siteUrl}/primeiro-acesso`,
          },
        });
        
        const accessLink = linkData?.properties?.action_link || `${siteUrl}/auth`;
        
        if (linkError) {
          console.warn("[INVITE] Magic link generation failed:", linkError);
        }

        const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-notification-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            to: email,
            type: "welcome_staff_magic", // 🎯 NOVO: Template com magic link (sem senha)
            data: { 
              nome,
              email,
              access_link: accessLink, // Link de acesso
              funcao: funcao || 'Funcionário',
            },
          }),
        });

        if (emailResponse.ok) {
          const emailData = await emailResponse.json();
          console.log("[INVITE] Welcome email with magic link sent successfully", emailData);
        } else {
          const errText = await emailResponse.text();
          console.warn("[INVITE] Email sending may have failed:", errText);
        }
      } catch (emailErr) {
        console.warn("[INVITE] Email error:", emailErr);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Acesso criado com sucesso!",
        user_id: newUser.user?.id
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("[INVITE] Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno do servidor" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);