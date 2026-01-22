// ============================================
// 🔥 DOGMA SUPREMO: EXCLUIR = ANIQUILAR
// Edge Function para Admin/Owner DELETAR usuário COMPLETAMENTE
// DELETE de auth.users + CASCADE + Broadcast Realtime
// ============================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// P1-2 FIX: OWNER_EMAIL removido - usar role='owner' do banco

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar autenticação
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("[admin-delete-user] ❌ Sem header de autorização");
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar quem está chamando
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !caller) {
      console.error("[admin-delete-user] ❌ Token inválido:", authError);
      return new Response(
        JSON.stringify({ error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // P1-2 FIX: Verificar role no banco (fonte da verdade)
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .maybeSingle();

    const callerRole = roleData?.role;
    if (callerRole !== "owner" && callerRole !== "admin") {
      console.error("[admin-delete-user] ❌ Permissão negada. Role:", callerRole);
      return new Response(
        JSON.stringify({ error: "Apenas Admin ou Owner podem excluir usuários" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const isOwner = callerRole === "owner";
    const callerEmail = caller.email || "unknown";

    // Parsear body
    const body = await req.json();
    const { targetUserId, targetEmail, reason } = body;

    console.log("[admin-delete-user] 📥 Request:", { targetUserId, targetEmail, callerEmail });

    // Resolver targetUserId se apenas email foi fornecido
    let resolvedUserId = targetUserId;
    let resolvedEmail = targetEmail?.toLowerCase();

    if (!resolvedUserId && resolvedEmail) {
      // Buscar por email no profiles primeiro
      const { data: profileData } = await supabaseAdmin
        .from("profiles")
        .select("id, email")
        .ilike("email", resolvedEmail)
        .maybeSingle();

      if (profileData) {
        resolvedUserId = profileData.id;
        console.log("[admin-delete-user] ✅ Usuário encontrado via profiles:", resolvedUserId);
      } else {
        // P0 FIX: Buscar em auth.users com filtro direto (mais eficiente que listUsers)
        console.log("[admin-delete-user] 🔍 Buscando em auth.users pelo email:", resolvedEmail);
        const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
          page: 1,
          perPage: 1000 // Aumentar limite para encontrar o usuário
        });
        
        if (listError) {
          console.error("[admin-delete-user] ❌ Erro ao listar usuários:", listError.message);
        }
        
        const foundUser = usersData?.users?.find(u => u.email?.toLowerCase() === resolvedEmail);
        if (foundUser) {
          resolvedUserId = foundUser.id;
          console.log("[admin-delete-user] ✅ Usuário encontrado via auth.users:", resolvedUserId);
        } else {
          console.log("[admin-delete-user] ⚠️ Usuário não encontrado. Total usuários verificados:", usersData?.users?.length || 0);
        }
      }
    }

    if (!resolvedUserId) {
      return new Response(
        JSON.stringify({ error: "Usuário não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar email se não temos ainda
    if (!resolvedEmail) {
      const { data: profileData } = await supabaseAdmin
        .from("profiles")
        .select("email")
        .eq("id", resolvedUserId)
        .maybeSingle();
      resolvedEmail = profileData?.email?.toLowerCase();
    }

    // P1-2 FIX: Proteção - verificar se target é owner via role no banco
    const { data: targetRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", resolvedUserId)
      .maybeSingle();

    if (targetRole?.role === "owner") {
      console.error("[admin-delete-user] ❌ Tentativa de excluir Owner BLOQUEADA");
      return new Response(
        JSON.stringify({ error: "Não é possível excluir o Owner do sistema" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[admin-delete-user] 🔥 INICIANDO ANIQUILAÇÃO:", { resolvedUserId, resolvedEmail });

    // ============================================
    // PASSO 1: Broadcast Realtime para LOGOUT FORÇADO
    // ============================================
    console.log("[admin-delete-user] 📡 Enviando broadcast de logout forçado...");
    
    const channel = supabaseAdmin.channel('force-logout');
    await channel.send({
      type: 'broadcast',
      event: 'user-deleted',
      payload: {
        userId: resolvedUserId,
        email: resolvedEmail,
        reason: reason || 'Conta excluída pelo administrador',
        timestamp: new Date().toISOString(),
      },
    });

    // ============================================
    // PASSO 2: Revogar TODAS as sessões ativas
    // ============================================
    console.log("[admin-delete-user] 🔐 Revogando sessões...");
    
    const { data: sessionsRevoked } = await supabaseAdmin
      .from("active_sessions")
      .update({
        status: "revoked",
        revoked_at: new Date().toISOString(),
        revoked_reason: "user_deleted_epoch_invalidated",
      })
      .eq("user_id", resolvedUserId)
      .eq("status", "active")
      .select();

    console.log("[admin-delete-user] ✅ Sessões revogadas:", sessionsRevoked?.length || 0);

    // ============================================
    // PASSO 2.5: 🛡️ BLOCO 3 - Invalidar magic links existentes
    // ============================================
    console.log("[admin-delete-user] 🔗 Invalidando magic links...");
    await supabaseAdmin
      .from("password_reset_tokens")
      .update({ used: true })
      .eq("user_id", resolvedUserId)
      .eq("used", false);

    // ============================================
    // PASSO 3: Desativar TODOS os dispositivos confiáveis
    // ============================================
    console.log("[admin-delete-user] 📱 Desativando dispositivos...");
    
    const { data: devicesDeactivated } = await supabaseAdmin
      .from("user_devices")
      .update({
        is_active: false,
        deactivated_at: new Date().toISOString(),
        deactivated_by: caller.id,
      })
      .eq("user_id", resolvedUserId)
      .eq("is_active", true)
      .select();

    console.log("[admin-delete-user] ✅ Dispositivos desativados:", devicesDeactivated?.length || 0);

    // Também device_trust_scores
    await supabaseAdmin
      .from("device_trust_scores")
      .delete()
      .eq("user_id", resolvedUserId);

    // ============================================
    // PASSO 4: Limpar dados auxiliares (que podem não ter CASCADE)
    // ============================================
    console.log("[admin-delete-user] 🧹 Limpando dados auxiliares...");

    // 🔥 P0 FIX: Tabelas COM FK para auth.users que BLOQUEIAM delete
    // ORDEM CRÍTICA: deletar de baixo para cima na hierarquia de dependências
    const criticalFKTables = [
      // Primeiro: tabelas sem dependência de outras tabelas públicas
      "two_factor_codes",
      "security_risk_state",
      "user_presence",
      "sensitive_operation_limits",
      "password_reset_tokens",
      "security_events",           // 🔥 FK bloqueante - DEVE ser limpa antes de auth.users
      "active_sessions",           // 🔥 Sessões (além do UPDATE já feito)
      "user_roles",                // 🔥 Roles do usuário
      "user_mfa_verifications",    // 🔥 CRÍTICO: Trust de dispositivo
      "user_devices",              // 🔥 Dispositivos vinculados
      "device_trust_scores",       // 🔥 Adicionado - pode ter FK
    ];

    // 🔥 P0 FIX: Usar delete com verificação de sucesso
    for (const table of criticalFKTables) {
      try {
        const { error: delError, count } = await supabaseAdmin
          .from(table)
          .delete()
          .eq("user_id", resolvedUserId);
        
        if (delError) {
          console.error(`[admin-delete-user] ❌ FALHA ao limpar ${table}:`, delError.message);
        } else {
          console.log(`[admin-delete-user] ✅ Limpo: ${table}`);
        }
      } catch (e: any) {
        console.error(`[admin-delete-user] ❌ EXCEÇÃO ao limpar ${table}:`, e?.message || e);
      }
    }

    // Se existir profile solto (ex: ban flag), remover explicitamente
    // (profiles nem sempre está com FK/cascade no banco)
    try {
      await supabaseAdmin.from("profiles").delete().eq("id", resolvedUserId);
    } catch (e) {
      console.warn("[admin-delete-user] ⚠️ Erro ao remover profiles:", e);
    }

    // ============================================
    // PASSO 5: Remover/neutralizar referências a auth.users
    // ============================================
    console.log("[admin-delete-user] 📝 Neutralizando FKs para auth.users...");

    // Logs/histórico: manter registro, mas soltar o vínculo com auth.users
    const setNullRefs = ["audit_logs", "activity_log", "affiliates"] as const;
    for (const table of setNullRefs) {
      try {
        await supabaseAdmin.from(table).update({ user_id: null }).eq("user_id", resolvedUserId);
        console.log(`[admin-delete-user] ✅ user_id NULL em: ${table}`);
      } catch (e) {
        console.warn(`[admin-delete-user] ⚠️ Erro ao NULL em ${table}:`, e);
      }
    }

    // Demais tabelas: deletar por user_id (onde o histórico não precisa ficar)
    // 🔥 P0 FIX: material_access_logs é FK bloqueante - DEVE ser limpa
    const deleteRefs = [
      "material_access_logs",       // 🔥 FK bloqueante identificado via logs
      "user_sessions",
      "notifications",
      "book_chat_messages",
      "book_chat_threads",
      "book_reading_sessions",
      "book_ratings",
      "book_user_annotations",      // Anotações em livros
      "book_user_bookmarks",        // Favoritos em livros
      "book_user_page_overlays",    // Desenhos em livros
      "calendar_tasks",
      "xp_history",
      "user_gamification",
      "user_achievements",
      "user_badges",
      "quiz_attempts",
      "lesson_progress",
      "enrollment",
    ];

    for (const table of deleteRefs) {
      try {
        await supabaseAdmin.from(table).delete().eq("user_id", resolvedUserId);
        console.log(`[admin-delete-user] ✅ Deletado: ${table}`);
      } catch (e) {
        console.warn(`[admin-delete-user] ⚠️ Erro ao deletar ${table}:`, e);
      }
    }

    // Registrar a exclusão com caller.id (admin que está excluindo)
    await supabaseAdmin.from("audit_logs").insert({
      action: "USER_DELETED_PERMANENTLY",
      user_id: caller.id, // Admin que executou, não o usuário deletado
      record_id: resolvedUserId,
      table_name: "auth.users",
      old_data: { email: resolvedEmail, deleted_at: new Date().toISOString() },
      new_data: null,
      metadata: {
        reason: reason || "Exclusão administrativa",
        deleted_by_email: callerEmail,
        sessions_revoked: sessionsRevoked?.length || 0,
        devices_deactivated: devicesDeactivated?.length || 0,
      },
    });

    // ============================================
    // PASSO 6: DELETAR do auth.users (CASCADE em profiles, user_roles, etc)
    // ============================================
    console.log("[admin-delete-user] 💀 DELETANDO de auth.users...");
    
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(resolvedUserId);

    if (deleteError) {
      console.error("[admin-delete-user] ❌ Erro ao deletar de auth.users:", deleteError);
      return new Response(
        JSON.stringify({ 
          error: "Erro ao excluir usuário", 
          details: deleteError.message,
          partial: {
            sessionsRevoked: sessionsRevoked?.length || 0,
            devicesDeactivated: devicesDeactivated?.length || 0,
          }
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[admin-delete-user] ✅✅✅ USUÁRIO ANIQUILADO COM SUCESSO:", resolvedEmail);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Usuário excluído permanentemente de TODAS as camadas",
        deletedUserId: resolvedUserId,
        deletedEmail: resolvedEmail,
        stats: {
          sessionsRevoked: sessionsRevoked?.length || 0,
          devicesDeactivated: devicesDeactivated?.length || 0,
          authUserDeleted: true,
          broadcastSent: true,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[admin-delete-user] ❌ Erro crítico:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno", message: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
