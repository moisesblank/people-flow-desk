// ============================================
// FIX-MISSING-BETA-ACCESS v1.0
// Correção de Emergência P0
// 
// OBJETIVO: Criar profiles + user_roles para alunos 
// que pagaram mas não receberam acesso Beta
// 
// SEGURANÇA: Apenas OWNER pode executar
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

import { getCorsHeaders, handleCorsOptions } from "../_shared/corsConfig.ts";

// P1-2 FIX: OWNER_EMAIL removido - usar role='owner' do banco

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // ========================================
    // 🛡️ VERIFICAR AUTORIZAÇÃO
    // Apenas OWNER pode executar esta função
    // ========================================
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ 
        error: "Token de autenticação necessário" 
      }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ 
        error: "Token inválido" 
      }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // P1-2 FIX: Verificar role no banco (fonte da verdade)
    const { data: ownerRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (ownerRole?.role !== 'owner') {
      console.log(`[FIX-BETA] ❌ Acesso negado para: ${user.email} (role: ${ownerRole?.role})`);
      return new Response(JSON.stringify({ 
        error: "Apenas o OWNER pode executar esta função" 
      }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log(`[FIX-BETA] ✅ OWNER autorizado: ${user.email}`);

    // ========================================
    // ETAPA 1: Buscar alunos sem profile/role
    // ========================================
    
    const { data: alunosSemAcesso, error: queryError } = await supabaseAdmin
      .from('alunos')
      .select(`
        id,
        email,
        nome,
        telefone,
        status,
        created_at
      `)
      .eq('status', 'ativo')
      .order('created_at', { ascending: false });

    if (queryError) {
      throw new Error(`Erro ao buscar alunos: ${queryError.message}`);
    }

    console.log(`[FIX-BETA] 📊 Total de alunos ativos: ${alunosSemAcesso?.length || 0}`);

    const resultados = {
      total_alunos: alunosSemAcesso?.length || 0,
      criados: 0,
      atualizados: 0,
      erros: [] as string[],
      detalhes: [] as any[],
    };

    // ========================================
    // ETAPA 2: Processar cada aluno
    // ========================================
    
    for (const aluno of alunosSemAcesso || []) {
      try {
        console.log(`[FIX-BETA] 🔄 Processando: ${aluno.email}`);
        
        // Verificar se já tem profile
        const { data: existingProfile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('email', aluno.email.toLowerCase())
          .maybeSingle();

        let userId: string;

        if (existingProfile) {
          userId = existingProfile.id;
          console.log(`[FIX-BETA] ℹ️ Profile existe: ${userId}`);
        } else {
          // Criar usuário no Auth
          const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: aluno.email.toLowerCase(),
            email_confirm: true,
            user_metadata: {
              nome: aluno.nome,
              created_by: 'fix-missing-beta-access',
            },
          });

          if (createError) {
            // Se já existe, buscar
            if (createError.message?.includes('already') || createError.message?.includes('exists')) {
              const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
              const existingAuthUser = listData?.users?.find(
                (u: any) => u.email?.toLowerCase() === aluno.email.toLowerCase()
              );
              
              if (existingAuthUser) {
                userId = existingAuthUser.id;
              } else {
                throw new Error(`Usuário existe mas não encontrado: ${createError.message}`);
              }
            } else {
              throw new Error(`Erro ao criar auth: ${createError.message}`);
            }
          } else if (newUser?.user) {
            userId = newUser.user.id;
            resultados.criados++;
            console.log(`[FIX-BETA] ✅ Auth criado: ${userId}`);
          } else {
            throw new Error("Falha ao obter user_id");
          }
        }

        // Upsert profile
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .upsert({
            id: userId!,
            email: aluno.email.toLowerCase(),
            nome: aluno.nome,
            phone: aluno.telefone || null,
          }, { onConflict: 'id' });

        if (profileError) {
          console.warn(`[FIX-BETA] ⚠️ Profile upsert warning: ${profileError.message}`);
        }

        // Verificar se já tem role
        const { data: existingRole } = await supabaseAdmin
          .from('user_roles')
          .select('role')
          .eq('user_id', userId!)
          .maybeSingle();

        if (existingRole) {
          console.log(`[FIX-BETA] ℹ️ Role já existe: ${existingRole.role}`);
          resultados.atualizados++;
        } else {
          // Criar role beta
          const { error: roleError } = await supabaseAdmin
            .from('user_roles')
            .insert({
              user_id: userId!,
              role: 'beta',
            });

          if (roleError) {
            throw new Error(`Erro ao criar role: ${roleError.message}`);
          }
          
          resultados.criados++;
          console.log(`[FIX-BETA] ✅ Role beta criada`);
        }

        resultados.detalhes.push({
          email: aluno.email,
          user_id: userId!,
          status: 'success',
        });

      } catch (err: any) {
        console.error(`[FIX-BETA] ❌ Erro em ${aluno.email}: ${err.message}`);
        resultados.erros.push(`${aluno.email}: ${err.message}`);
        resultados.detalhes.push({
          email: aluno.email,
          status: 'error',
          error: err.message,
        });
      }
    }

    // ========================================
    // ETAPA 3: Registrar execução
    // ========================================
    
    await supabaseAdmin.from('activity_log').insert({
      action: 'fix_missing_beta_access',
      user_id: user.id,
      user_email: user.email,
      new_value: resultados,
    });

    console.log(`[FIX-BETA] 🎉 Correção concluída!`);
    console.log(`[FIX-BETA] 📊 Criados: ${resultados.criados}, Atualizados: ${resultados.atualizados}, Erros: ${resultados.erros.length}`);

    return new Response(JSON.stringify({
      success: true,
      message: "Correção de acesso Beta concluída",
      resultados,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error(`[FIX-BETA] ❌ Erro crítico: ${error.message}`);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
