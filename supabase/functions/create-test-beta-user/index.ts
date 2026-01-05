/**
 * 🧪 EDGE FUNCTION TEMPORÁRIA — Criar Usuário Beta de Teste
 * Constituição SYNAPSE Ω v10.0
 * 
 * USO ÚNICO: Criar usuário de teste para o Owner testar a área de alunos.
 * DELETAR APÓS USO.
 */

// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Chave secreta para executar (proteção mínima)
const SECRET_KEY = "CRIAR_BETA_2025";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Verificar chave secreta via query param ou body
  const url = new URL(req.url);
  const keyFromUrl = url.searchParams.get("key");
  
  if (keyFromUrl !== SECRET_KEY) {
    return new Response(
      JSON.stringify({ error: "Chave inválida" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

const testEmail = "moisescursoquimica@gmail.com";
const testPassword = "Eocomando32!!!";

    // 1. Verificar se já existe
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existing = existingUsers?.users?.find(u => u.email === testEmail);
    
    if (existing) {
      // Já existe - resetar senha
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existing.id,
        { password: testPassword }
      );
      
      if (updateError) {
        throw new Error(`Erro ao resetar senha: ${updateError.message}`);
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          message: "Senha resetada com sucesso!",
          credentials: {
            email: testEmail,
            password: testPassword,
          },
          user_id: existing.id,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    // 2. Criar usuário no Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true, // Já confirma o email
      user_metadata: {
        nome: "Aluno Teste Beta",
        is_test_user: true,
      },
    });

    if (authError) {
      throw new Error(`Erro ao criar usuário: ${authError.message}`);
    }

    const userId = authData.user.id;

    // 3. Criar profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: userId,
        email: testEmail,
        nome: "Aluno Teste Beta",
        status: "ativo",
        created_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error("Erro ao criar profile:", profileError);
    }

    // 4. Adicionar role beta
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: userId,
        role: "beta",
      });

    if (roleError) {
      console.error("Erro ao adicionar role:", roleError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Usuário de teste Beta criado com sucesso!",
        credentials: {
          email: testEmail,
          password: testPassword,
        },
        user_id: userId,
        instructions: [
          "1. Abra uma aba anônima ou outro navegador",
          "2. Acesse pro.moisesmedeiros.com.br/auth",
          "3. Faça login com as credenciais acima",
          "4. Você será redirecionado para /alunos como Beta",
        ],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
