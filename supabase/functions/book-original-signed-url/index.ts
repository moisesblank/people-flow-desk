// ============================================
// 📚 BOOK ORIGINAL SIGNED URL — PDF RAW ACCESS
// Gera URL assinada do PDF original (ena-assets-raw)
// Fonte da verdade: permissão via fn_get_book_for_reader
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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

    // IMPORTANTE: Propagar Authorization para permitir auth.uid() nas RPCs (fonte da verdade)
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // 1) Validar acesso e (se possível) obter originalPath via RPC
    const { data: bookData, error: bookError } = await supabase.rpc(
      "fn_get_book_for_reader",
      { p_book_id: bookId },
    );

    if (bookError || !bookData?.success) {
      return new Response(
        JSON.stringify({ success: false, error: bookData?.error || "Acesso negado" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let originalPath: string | null = bookData?.pdfMode?.originalPath ?? null;

    // 2) Fallback: buscar do banco (não depende do pdfMode)
    if (!originalPath) {
      const { data, error } = await supabase
        .from("web_books")
        .select("original_path")
        .eq("id", bookId)
        .maybeSingle();

      if (error) {
        console.error("[book-original-signed-url] DB error:", error);
      }

      originalPath = data?.original_path ?? null;
    }

    if (!originalPath) {
      return new Response(
        JSON.stringify({ success: false, error: "ORIGINAL_PATH_NOT_FOUND" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 3) Gerar URL assinada
    const { data: signedData, error: signError } = await supabase.storage
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
