import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OWNER_EMAIL = "moisesblank@gmail.com";
const TRANSMUTED_BUCKET = "ena-assets-transmuted";
const URL_TTL_SECONDS = 30;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Cache-Control": "no-store",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

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
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

    // Logar acesso
    await supabase.from("book_access_logs").insert({
      user_id: user.id,
      user_email: user.email,
      book_id: bookId,
      page_number: pageNumber,
      event_type: "page_view",
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
