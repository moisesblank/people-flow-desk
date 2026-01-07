// ============================================
// MOISÉS MEDEIROS v10.0 - Verify 2FA Code
// Verificação segura com proteção brute-force
// ============================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

import { getCorsHeaders, handleCorsOptions } from "../_shared/corsConfig.ts";

interface Verify2FARequest {
  userId: string;
  code: string;
}

// Proteção brute-force: máximo 5 tentativas em 15 minutos
const MAX_ATTEMPTS = 5;
const LOCKOUT_WINDOW = 15 * 60 * 1000; // 15 minutos

const handler = async (req: Request): Promise<Response> => {
  // LEI VI: CORS dinâmico via allowlist centralizado
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

  try {
    const { userId, code }: Verify2FARequest = await req.json();

    const rawCode = String(code ?? "");
    const normalizedCode = rawCode.replace(/\D/g, "");

    console.log(`[2FA Verify] Verificando código para user: ${userId}`);

    if (!userId || !normalizedCode) {
      return new Response(
        JSON.stringify({ valid: false, error: "userId e código são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validar formato do código (6 dígitos) — tolerante a espaços/traços vindos de copy/paste
    if (!/^\d{6}$/.test(normalizedCode)) {
      return new Response(
        JSON.stringify({ valid: false, error: "Formato de código inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // ========================================
    // PROTEÇÃO BRUTE-FORCE
    // ========================================
    const windowStart = new Date(Date.now() - LOCKOUT_WINDOW).toISOString();
    
    // Contar tentativas falhas recentes
    const { data: failedAttempts } = await supabaseAdmin
      .from("activity_log")
      .select("id")
      .eq("user_id", userId)
      .eq("action", "2FA_FAILED")
      .gte("created_at", windowStart);

    if (failedAttempts && failedAttempts.length >= MAX_ATTEMPTS) {
      console.log(`[2FA Verify] Usuário bloqueado por excesso de tentativas: ${userId}`);
      
      // Calcular tempo restante do bloqueio
      const { data: lastAttempt } = await supabaseAdmin
        .from("activity_log")
        .select("created_at")
        .eq("user_id", userId)
        .eq("action", "2FA_FAILED")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const lockoutEnds = lastAttempt 
        ? new Date(new Date(lastAttempt.created_at).getTime() + LOCKOUT_WINDOW)
        : new Date(Date.now() + LOCKOUT_WINDOW);
      
      const remainingSeconds = Math.ceil((lockoutEnds.getTime() - Date.now()) / 1000);

      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: "Muitas tentativas incorretas. Conta temporariamente bloqueada.",
          lockedUntil: lockoutEnds.toISOString(),
          remainingSeconds: Math.max(0, remainingSeconds)
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========================================
    // BUSCAR E VALIDAR CÓDIGO
    // ========================================
    const { data: validCode, error: fetchError } = await supabaseAdmin
      .from("two_factor_codes")
      .select("*")
      .eq("user_id", userId)
      .eq("code", normalizedCode)
      .eq("verified", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !validCode) {
      // ========================================
      // IDEMPOTÊNCIA (UX): se o mesmo código já foi verificado e ainda não expirou,
      // tratar como sucesso para evitar "código inválido" em double-submit.
      // ========================================
      const { data: alreadyVerified } = await supabaseAdmin
        .from("two_factor_codes")
        .select("id")
        .eq("user_id", userId)
        .eq("code", normalizedCode)
        .eq("verified", true)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (alreadyVerified?.id) {
        console.log(`[2FA Verify] Código já verificado anteriormente (idempotente) para user: ${userId}`);

        // Tentar marcar sessão como mfa_verified (mesma lógica do caminho de sucesso)
        const { data: latestSession, error: findError } = await supabaseAdmin
          .from("active_sessions")
          .select("id")
          .eq("user_id", userId)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (findError) {
          console.error("[2FA Verify] Erro ao buscar sessão (idempotente):", findError);
        }

        if (latestSession?.id) {
          const { error: sessionError } = await supabaseAdmin
            .from("active_sessions")
            .update({
              mfa_verified: true,
              last_activity_at: new Date().toISOString(),
            })
            .eq("id", latestSession.id);

          if (sessionError) {
            console.error("[2FA Verify] Erro ao marcar sessão mfa_verified (idempotente):", sessionError);
          } else {
            console.log("[2FA Verify] ✅ Sessão marcada como mfa_verified (idempotente) (id:", latestSession.id, ")");
          }
        } else {
          console.warn("[2FA Verify] ⚠️ Nenhuma sessão ativa encontrada para marcar mfa_verified (idempotente)");
        }

        return new Response(
          JSON.stringify({
            valid: true,
            message: "Código já verificado. Prosseguindo...",
            verifiedAt: new Date().toISOString(),
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[2FA Verify] Código inválido ou expirado para user: ${userId}`);

      // Registrar tentativa falha
      await supabaseAdmin
        .from("activity_log")
        .insert({
          user_id: userId,
          action: "2FA_FAILED",
          new_value: {
            attempted_code: normalizedCode.substring(0, 2) + "****", // Log parcial por segurança
            timestamp: new Date().toISOString(),
            ip_address: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
          },
        });

      // Verificar se código existe mas expirou
      const { data: expiredCode } = await supabaseAdmin
        .from("two_factor_codes")
        .select("expires_at")
        .eq("user_id", userId)
        .eq("code", normalizedCode)
        .single();

      if (expiredCode) {
        const expiredAt = new Date(expiredCode.expires_at);
        return new Response(
          JSON.stringify({
            valid: false,
            error: "Código expirado. Por favor, solicite um novo código.",
            expiredAt: expiredCode.expires_at,
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Calcular tentativas restantes
      const attemptsRemaining = MAX_ATTEMPTS - (failedAttempts?.length || 0) - 1;

      return new Response(
        JSON.stringify({
          valid: false,
          error: "Código incorreto. Verifique e tente novamente.",
          attemptsRemaining: Math.max(0, attemptsRemaining),
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========================================
    // CÓDIGO VÁLIDO - MARCAR COMO USADO
    // ========================================
    const { error: updateError } = await supabaseAdmin
      .from("two_factor_codes")
      .update({ verified: true })
      .eq("id", validCode.id);

    if (updateError) {
      console.error("[2FA Verify] Erro ao atualizar código:", updateError);
    }

    // ========================================
    // MARCAR SESSÃO COMO MFA_VERIFIED (SYNAPSE Ω v10.x)
    // Isso habilita o Trust Window de 24h para este dispositivo
    // FIX: .order().limit() não funciona com UPDATE no Supabase
    // Usar subquery para encontrar a sessão mais recente
    // ========================================
    
    // Primeiro, buscar o ID da sessão ativa mais recente
    const { data: latestSession, error: findError } = await supabaseAdmin
      .from("active_sessions")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (findError) {
      console.error("[2FA Verify] Erro ao buscar sessão:", findError);
    }

    if (latestSession?.id) {
      // Agora fazer o UPDATE usando o ID específico
      const { error: sessionError, count } = await supabaseAdmin
        .from("active_sessions")
        .update({ 
          mfa_verified: true,
          last_activity_at: new Date().toISOString()
        })
        .eq("id", latestSession.id);

      if (sessionError) {
        console.error("[2FA Verify] Erro ao marcar sessão mfa_verified:", sessionError);
      } else {
        console.log("[2FA Verify] ✅ Sessão marcada como mfa_verified (id:", latestSession.id, ")");
      }
    } else {
      console.warn("[2FA Verify] ⚠️ Nenhuma sessão ativa encontrada para marcar mfa_verified");
    }

    // Registrar login bem-sucedido
    await supabaseAdmin
      .from("activity_log")
      .insert({
        user_id: userId,
        action: "2FA_VERIFIED",
        new_value: { 
          method: "email", 
          verified_at: new Date().toISOString(),
          ip_address: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
          user_agent: req.headers.get("user-agent")?.substring(0, 100) || "unknown"
        }
      });

    // Limpar tentativas falhas antigas
    await supabaseAdmin
      .from("activity_log")
      .delete()
      .eq("user_id", userId)
      .eq("action", "2FA_FAILED")
      .lt("created_at", windowStart);

    console.log(`[2FA Verify] Código verificado com sucesso para user: ${userId}`);

    return new Response(
      JSON.stringify({ 
        valid: true, 
        message: "Verificação concluída com sucesso!",
        verifiedAt: new Date().toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[2FA Verify] Erro:", error);
    return new Response(
      JSON.stringify({ valid: false, error: "Erro interno do servidor. Tente novamente." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
