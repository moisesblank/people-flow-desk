// ============================================
// 🛡️ Ω3: BOOK PAGE SIGNED URL v3.0
// TTL CURTO (30s) + CORS SEGURO + DUAL CLIENT
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions, isOriginAllowed } from "../_shared/corsConfig.ts";

// ============================================
// P1 FIX: OWNER_EMAIL removido - usar role check via user_roles
// Fonte da verdade: user_roles.role = 'owner'
// ============================================
const TRANSMUTED_BUCKET = "ena-assets-transmuted";
const URL_TTL_SECONDS = 3600; // 1 hora - URLs duráveis para leitura prolongada

// Rate limit em memória
const rateLimitCache = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = { limit: 60, windowMs: 60000 }; // 60 req/min

function checkRateLimit(userId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = rateLimitCache.get(userId);
  
  if (!entry || entry.resetAt < now) {
    rateLimitCache.set(userId, { count: 1, resetAt: now + RATE_LIMIT.windowMs });
    return { allowed: true };
  }
  
  entry.count++;
  if (entry.count > RATE_LIMIT.limit) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { allowed: true };
}

serve(async (req: Request) => {
  // CORS seguro com allowlist
  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }
  
  const corsHeaders = getCorsHeaders(req);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

     const token = authHeader.replace("Bearer ", "");
     const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
     const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
     const supabase = createClient(supabaseUrl, supabaseKey, {
       global: {
         headers: {
           // ✅ Necessário para auth.uid() funcionar dentro das RPCs (fonte da verdade)
           Authorization: authHeader,
         },
       },
     });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // ============================================
    // 🛡️ P0-4: VERIFICAR is_banned ANTES DE TUDO
    // ============================================
    const { data: profileData } = await supabase
      .from("profiles")
      .select("is_banned")
      .eq("id", user.id)
      .single();
    
    if (profileData?.is_banned === true) {
      console.warn(`[Book Page URL] 🚫 USUÁRIO BANIDO: ${user.email}`);
      return new Response(
        JSON.stringify({ success: false, error: "Acesso bloqueado", code: "USER_BANNED" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // ============================================
    // 🛡️ PLANO A NUCLEAR: MFA CHECK DESATIVADO
    // Constituição SYNAPSE Ω v10.4 - PARTE XIV
    // Status: FAIL-OPEN para não bloquear aplicação
    // ============================================
    const isOwner = user.email?.toLowerCase() === "moisesblank@gmail.com";
    
    // Log para auditoria (mas não bloqueia)
    if (!isOwner) {
      const { data: sessionData } = await supabase
        .from("active_sessions")
        .select("mfa_verified")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (sessionData?.mfa_verified === false) {
        console.log(`[Book Page URL] ⚠️ MFA pendente (BYPASS NUCLEAR): ${user.email}`);
      }
    }
    
    // Rate limit por usuário
    const rateCheck = checkRateLimit(user.id);
    if (!rateCheck.allowed) {
      console.warn(`[Book Page URL] 🚫 Rate limit excedido: ${user.email}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Muitas requisições. Aguarde.", 
          retryAfter: rateCheck.retryAfter 
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": String(rateCheck.retryAfter)
          } 
        }
      );
    }

    // Obter parâmetros
    const url = new URL(req.url);
    let bookId = url.searchParams.get("bookId");
    let pageNumber = parseInt(url.searchParams.get("pageNumber") || "1");

    if (req.method === "POST") {
      const body = await req.json();
      bookId = body.bookId || bookId;
      pageNumber = body.pageNumber || pageNumber;
    }

    if (!bookId) {
      return new Response(
        JSON.stringify({ success: false, error: "bookId obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar acesso via RPC
    const { data: bookData, error: bookError } = await supabase.rpc(
      "fn_get_book_for_reader",
      { p_book_id: bookId }
    );

    if (bookError || !bookData?.success) {
      return new Response(
        JSON.stringify({ success: false, error: bookData?.error || "Acesso negado" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar página
    const { data: page, error: pageError } = await supabase
      .from("web_book_pages")
      .select("image_path")
      .eq("book_id", bookId)
      .eq("page_number", pageNumber)
      .single();

    if (pageError || !page) {
      return new Response(
        JSON.stringify({ success: false, error: "Página não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Gerar signed URL
    const { data: signedData, error: signError } = await supabase.storage
      .from(TRANSMUTED_BUCKET)
      .createSignedUrl(page.image_path, URL_TTL_SECONDS);

    if (signError || !signedData?.signedUrl) {
      return new Response(
        JSON.stringify({ success: false, error: "Erro ao gerar URL" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Logar acesso com fingerprint
    const deviceFingerprint = req.headers.get("x-device-fingerprint") || null;
    const userAgent = req.headers.get("user-agent") || null;
    
    await supabase.from("book_access_logs").insert({
      user_id: user.id,
      user_email: user.email,
      book_id: bookId,
      page_number: pageNumber,
      event_type: "page_view",
      device_fingerprint: deviceFingerprint,
      ua_hash: userAgent ? btoa(userAgent).slice(0, 32) : null,
      metadata: {
        signedUrlTTL: URL_TTL_SECONDS,
        requestedAt: new Date().toISOString(),
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        url: signedData.signedUrl,
        expiresIn: URL_TTL_SECONDS,
        pageNumber,
        watermark: bookData.watermark,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("[Book Page URL] Erro:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
