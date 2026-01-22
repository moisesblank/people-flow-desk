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

    // ============================================
    // 🔐 P0 FIX: Buscar usuário DIRETAMENTE em auth.users
    // Problema: profiles pode não existir, mas auth.users sim
    // Solução: Tentar criar e capturar erro email_exists
    // ============================================
    let existingUser = null;
    
    // Primeiro, tentar buscar via profile (mais rápido se existir)
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id')
        .ilike('email', email)
        .limit(1)
        .maybeSingle();
      
      if (profileData?.id) {
        const { data: userData } = await supabase.auth.admin.getUserById(profileData.id);
        existingUser = userData?.user || null;
        console.log(`[INVITE] User found via profile: ${email}`);
      }
    } catch (checkErr) {
      console.warn("[INVITE] Profile check error:", checkErr);
    }
    
    // Se não encontrou via profile, tentar criar - capturar email_exists
    if (!existingUser) {
      console.log(`[INVITE] User not found via profile, attempting creation: ${email}`);
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        password: senha,
        email_confirm: true,
        user_metadata: {
          nome: nome,
          funcao: funcao,
          invited: true,
          employee_id: employee_id,
        },
      });
      
      if (createError) {
        // Se erro for email_exists, buscar o usuário existente
        if (createError.message?.includes('already been registered') || 
            (createError as any).code === 'email_exists') {
          console.log(`[INVITE] Email exists in auth.users, fetching via listUsers: ${email}`);
          
          // Buscar via listUsers (última opção)
          const { data: usersData } = await supabase.auth.admin.listUsers({
            page: 1,
            perPage: 1000, // Buscar mais para encontrar o email
          });
          
          if (usersData?.users) {
            existingUser = usersData.users.find(
              (u) => u.email?.toLowerCase() === email.toLowerCase()
            ) || null;
          }
          
          if (!existingUser) {
            console.error("[INVITE] Email exists but user not found - inconsistent state");
            return new Response(
              JSON.stringify({ error: "Email já registrado mas não encontrado. Contate o suporte." }),
              { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
            );
          }
        } else {
          // Outro erro na criação
          console.error("[INVITE] Error creating user:", createError);
          return new Response(
            JSON.stringify({ error: `Erro ao criar usuário: ${createError.message}` }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
      } else if (newUser?.user) {
        // Usuário criado com sucesso! Continuar com o resto do fluxo
        console.log(`[INVITE] User created successfully: ${email}, ID: ${newUser.user.id}`);
        
        // Update employee record if employee_id provided
        if (employee_id) {
          const { error: updateError } = await supabase
            .from("employees")
            .update({ 
              email: email,
              user_id: newUser.user.id 
            })
            .eq("id", employee_id);
          
          if (updateError) {
            console.warn("[INVITE] Could not update employee:", updateError);
          }
        }
        
        // 🎯 CONTRATO: Funcionário NÃO passa por onboarding de aluno
        await supabase.from("profiles").upsert({
          id: newUser.user.id,
          email: email,
          nome: nome,
          password_change_required: false, // Senha já definida pelo admin
          onboarding_completed: true, // Funcionário vai DIRETO para /gestaofc
        }, { onConflict: "id" });
        
        await supabase.from("user_roles").upsert({ 
          user_id: newUser.user.id, 
          role: assignedRole
        }, { onConflict: "user_id", ignoreDuplicates: false });
        
        // 🎯 CONTRATO: Email com link DIRETO para /auth + credenciais
        try {
          const siteUrl = Deno.env.get('SITE_URL') || 'https://pro.moisesmedeiros.com.br';
          
          await fetch(`${supabaseUrl}/functions/v1/send-notification-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              to: email,
              type: "welcome_staff", // Template COM credenciais e link DIRETO /auth
              data: { 
                nome,
                email,
                senha, // Senha definida pelo admin
                funcao: funcao || 'Funcionário',
              },
            }),
          });
          console.log("[INVITE] Welcome email with credentials sent to:", email);
        } catch (emailErr) {
          console.warn("[INVITE] Email error:", emailErr);
        }
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Acesso criado com sucesso!",
            user_id: newUser.user.id
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
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

      // 🎯 CONTRATO: UPSERT profile e role para usuário existente
      await supabase.from("profiles").upsert({
        id: existingUser.id,
        email: email,
        nome: nome,
        password_change_required: false, // Senha já definida pelo admin
        onboarding_completed: true, // Funcionário não passa por onboarding de aluno
      }, { onConflict: "id" });
      
      await supabase.from("user_roles").upsert({ 
        user_id: existingUser.id, 
        role: assignedRole
      }, { onConflict: "user_id", ignoreDuplicates: false });

      console.log(`[INVITE] Profile/role updated for existing user: ${email}, role: ${assignedRole}`);
      
      // 🎯 CONTRATO: Email com credenciais + link DIRETO para /auth
      try {
        await fetch(`${supabaseUrl}/functions/v1/send-notification-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            to: email,
            type: "welcome_staff",
            data: { 
              nome,
              senha,
              email,
              funcao: funcao || 'Funcionário',
            },
          }),
        });
        console.log("[INVITE] Welcome email sent to existing user:", email);
      } catch (emailErr) {
        console.warn("[INVITE] Email error:", emailErr);
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Acesso atualizado com sucesso! O funcionário receberá um email com as credenciais.",
          user_id: existingUser.id
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Se chegou aqui sem existingUser e sem ter retornado, algo deu errado
    console.error("[INVITE] Unexpected state: no user found or created");
    return new Response(
      JSON.stringify({ error: "Erro inesperado ao processar convite" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
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