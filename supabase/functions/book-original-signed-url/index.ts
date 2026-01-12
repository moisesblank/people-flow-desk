// ============================================
// 📚 BOOK ORIGINAL SIGNED URL — PDF RAW ACCESS
// Gera URL assinada do PDF original (ena-assets-raw)
// Fonte da verdade: permissão via fn_get_book_for_reader
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/corsConfig.ts";

const RAW_BUCKET = "ena-assets-raw";
const URL_TTL_SECONDS = 3600; // 1h

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json().catch(() => ({}));
    const bookId = body?.bookId as string | undefined;

    if (!bookId) {
      return new Response(
        JSON.stringify({ success: false, error: "bookId obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Cliente COM Authorization propagado - para RPCs que usam auth.uid()
    const supabaseWithAuth = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Cliente SERVICE ROLE puro - para operações de storage que precisam bypassar RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // Obter usuário para verificações
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ============================================
    // 🛡️ P0-4: VERIFICAR is_banned ANTES DE TUDO
    // ============================================
    const { data: profileData } = await supabaseAdmin
      .from("profiles")
      .select("is_banned")
      .eq("id", user.id)
      .single();
    
    if (profileData?.is_banned === true) {
      console.warn(`[Book Original URL] 🚫 USUÁRIO BANIDO: ${user.email}`);
      return new Response(
        JSON.stringify({ success: false, error: "Acesso bloqueado" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    
    // ============================================
    // 🛡️ P0-2: VERIFICAR mfa_verified NA SESSÃO
    // ============================================
    const { data: sessionData } = await supabaseAdmin
      .from("active_sessions")
      .select("mfa_verified")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    const isOwner = user.email?.toLowerCase() === "moisesblank@gmail.com";
    if (sessionData && sessionData.mfa_verified === false && !isOwner) {
      console.warn(`[Book Original URL] 🚫 MFA NÃO VERIFICADO: ${user.email}`);
      return new Response(
        JSON.stringify({ success: false, error: "Verificação 2FA pendente" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 1) Validar acesso via RPC (usa contexto do usuário para checar permissões)
    const { data: bookData, error: bookError } = await supabaseWithAuth.rpc(
      "fn_get_book_for_reader",
      { p_book_id: bookId },
    );

    console.log("[book-original-signed-url] RPC result:", JSON.stringify({ bookData, bookError }));

    if (bookError || !bookData?.success) {
      return new Response(
        JSON.stringify({ success: false, error: bookData?.error || "Acesso negado", details: bookError }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let originalPath: string | null = bookData?.pdfMode?.originalPath ?? null;
    console.log("[book-original-signed-url] bookId:", bookId);
    console.log("[book-original-signed-url] pdfMode:", JSON.stringify(bookData?.pdfMode));
    console.log("[book-original-signed-url] originalPath from RPC:", originalPath);

    // 2) Fallback: buscar do banco (não depende do pdfMode) - usa supabaseAdmin para bypassar RLS
    if (!originalPath) {
      const { data, error } = await supabaseAdmin
        .from("web_books")
        .select("original_path, original_bucket, original_filename")
        .eq("id", bookId)
        .maybeSingle();

      console.log("[book-original-signed-url] Fallback DB data:", JSON.stringify(data));

      if (error) {
        console.error("[book-original-signed-url] DB error:", error);
      }

      originalPath = data?.original_path ?? null;
    }

    console.log("[book-original-signed-url] Final originalPath:", originalPath);
    console.log("[book-original-signed-url] Bucket:", RAW_BUCKET);

    if (!originalPath) {
      return new Response(
        JSON.stringify({ success: false, error: "ORIGINAL_PATH_NOT_FOUND" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 3) Gerar URL assinada - USANDO supabaseAdmin para bypassar RLS do storage
    const { data: signedData, error: signError } = await supabaseAdmin.storage
      .from(RAW_BUCKET)
      .createSignedUrl(originalPath, URL_TTL_SECONDS);

    if (signError || !signedData?.signedUrl) {
      console.error("[book-original-signed-url] Sign error:", signError);
      return new Response(
        JSON.stringify({ success: false, error: "Erro ao gerar URL" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        signedUrl: signedData.signedUrl,
        expiresIn: URL_TTL_SECONDS,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[book-original-signed-url] Erro:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
