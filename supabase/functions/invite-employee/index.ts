import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

import { getCorsHeaders, handleCorsOptions } from "../_shared/corsConfig.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface InviteRequest {
  email: string;
  nome: string;
  senha: string;
  funcao?: string;
  employee_id?: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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

    // Check if user is admin/owner
    const { data: isAdmin } = await supabase.rpc("is_admin_or_owner", { _user_id: user.id });
    if (!isAdmin) {
      console.log("[INVITE] User is not admin/owner:", user.id);
      return new Response(
        JSON.stringify({ error: "Permissão negada. Apenas administradores podem criar acessos." }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { email, nome, senha, funcao, employee_id }: InviteRequest = await req.json();

    if (!email || !nome) {
      return new Response(
        JSON.stringify({ error: "Email e nome são obrigatórios" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!senha || senha.length < 6) {
      return new Response(
        JSON.stringify({ error: "Senha é obrigatória e deve ter no mínimo 6 caracteres" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

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
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Senha atualizada com sucesso! O funcionário já estava cadastrado.",
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

    // Assign employee role
    if (newUser.user) {
      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert({ 
          user_id: newUser.user.id, 
          role: "employee" 
        }, { 
          onConflict: "user_id" 
        });
      
      if (roleError) {
        console.warn("[INVITE] Could not assign role:", roleError);
      } else {
        console.log(`[INVITE] Role 'employee' assigned to ${newUser.user.id}`);
      }
    }

    // Send welcome email usando template padronizado (aprovado 16/12/2024)
    try {
      const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-notification-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          to: email,
          type: "welcome",
          data: { nome },
        }),
      });

      if (emailResponse.ok) {
        console.log("[INVITE] Welcome email sent successfully");
      } else {
        console.warn("[INVITE] Email sending may have failed");
      }
    } catch (emailErr) {
      console.warn("[INVITE] Email error:", emailErr);
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