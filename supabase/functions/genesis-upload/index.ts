import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OWNER_EMAIL = "moisesblank@gmail.com";
const RAW_BUCKET = "ena-assets-raw";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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

    // Verificar se é owner
    if (user.email?.toLowerCase() !== OWNER_EMAIL) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      
      if (profile?.role !== "owner" && profile?.role !== "admin") {
        return new Response(
          JSON.stringify({ success: false, error: "Apenas owner pode importar livros" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Parse FormData
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const subtitle = formData.get("subtitle") as string || null;
    const category = formData.get("category") as string || "outros";
    const tags = formData.get("tags") as string || "";

    if (!file || !title) {
      return new Response(
        JSON.stringify({ success: false, error: "Arquivo e título obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Gerar path único
    const bookId = crypto.randomUUID();
    const filePath = `${bookId}/original.pdf`;

    // Upload para bucket raw
    const { error: uploadError } = await supabase.storage
      .from(RAW_BUCKET)
      .upload(filePath, file, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      console.error("[Genesis] Erro upload:", uploadError);
      return new Response(
        JSON.stringify({ success: false, error: "Erro ao fazer upload" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Criar registro do livro
    const { data: book, error: bookError } = await supabase
      .from("web_books")
      .insert({
        id: bookId,
        title,
        subtitle,
        category,
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        original_path: filePath,
        original_filename: file.name,
        original_size_bytes: file.size,
        status: "queued",
        created_by: user.id,
      })
      .select()
      .single();

    if (bookError) {
      console.error("[Genesis] Erro criar livro:", bookError);
      return new Response(
        JSON.stringify({ success: false, error: "Erro ao criar livro" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Criar job na fila
    const { error: jobError } = await supabase
      .from("sanctum_jobs_queue")
      .insert({
        job_type: "transmute_book",
        asset_id: bookId,
        input_data: { bookId, filePath, title },
        status: "pending",
        priority: 5,
      });

    if (jobError) {
      console.error("[Genesis] Erro criar job:", jobError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        bookId,
        title,
        status: "queued",
        message: "Livro enviado para processamento",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("[Genesis Upload] Erro:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
