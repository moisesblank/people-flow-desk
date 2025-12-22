// ============================================
// 🌌🔥 GENESIS BOOK UPLOAD — EDGE FUNCTION NÍVEL NASA 🔥🌌
// ANO 2300 — IMPORTAÇÃO DE PDF PARA LIVRO WEB
// ESTE É O PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================
// CONSTANTES
// ============================================
const OWNER_EMAIL = "moisesblank@gmail.com";
const RAW_BUCKET = "ena-assets-raw";
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const ALLOWED_MIME_TYPES = ["application/pdf", "application/epub+zip"];

// ============================================
// CORS HEADERS
// ============================================
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "X-Content-Type-Options": "nosniff",
};

// ============================================
// TIPOS
// ============================================
interface UploadResponse {
  success: boolean;
  bookId?: string;
  title?: string;
  status?: string;
  jobId?: string;
  message?: string;
  error?: string;
  errorCode?: string;
}

// ============================================
// CATEGORIAS VÁLIDAS
// ============================================
const VALID_CATEGORIES = [
  "quimica_geral",
  "quimica_organica",
  "fisico_quimica",
  "revisao_ciclica",
  "previsao_final",
  "exercicios",
  "simulados",
  "resumos",
  "mapas_mentais",
  "apostilas",
  "livros_didaticos",
  "material_complementar",
  "outros",
];

// ============================================
// FUNÇÃO PRINCIPAL
// ============================================
serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Método não permitido", errorCode: "METHOD_NOT_ALLOWED" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // ============================================
    // 1) AUTENTICAÇÃO
    // ============================================
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Não autorizado", errorCode: "UNAUTHORIZED" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar usuário
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Token inválido", errorCode: "UNAUTHORIZED" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // 2) VERIFICAR PERMISSÃO (OWNER/ADMIN)
    // ============================================
    const isOwner = user.email?.toLowerCase() === OWNER_EMAIL;
    
    if (!isOwner) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      
      if (!profile || !["owner", "admin"].includes(profile.role || "")) {
        return new Response(
          JSON.stringify({ success: false, error: "Apenas owner/admin pode importar livros", errorCode: "FORBIDDEN" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ============================================
    // 3) PARSE FORMDATA
    // ============================================
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch (err) {
      return new Response(
        JSON.stringify({ success: false, error: "Dados de formulário inválidos", errorCode: "BAD_REQUEST" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string | null;
    const subtitle = formData.get("subtitle") as string | null;
    const description = formData.get("description") as string | null;
    const author = formData.get("author") as string | null;
    const category = formData.get("category") as string | null;
    const tagsRaw = formData.get("tags") as string | null;
    const isPublished = formData.get("isPublished") === "true";

    // ============================================
    // 4) VALIDAÇÕES
    // ============================================
    if (!file) {
      return new Response(
        JSON.stringify({ success: false, error: "Arquivo PDF é obrigatório", errorCode: "FILE_REQUIRED" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!title || title.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Título é obrigatório", errorCode: "TITLE_REQUIRED" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validar tipo de arquivo
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Tipo de arquivo não permitido: ${file.type}. Apenas PDF e EPUB.`,
          errorCode: "INVALID_FILE_TYPE" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validar tamanho
    if (file.size > MAX_FILE_SIZE) {
      const maxMB = Math.round(MAX_FILE_SIZE / (1024 * 1024));
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Arquivo muito grande. Máximo: ${maxMB}MB`,
          errorCode: "FILE_TOO_LARGE" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validar categoria
    const finalCategory = category && VALID_CATEGORIES.includes(category) ? category : "outros";

    // Parsear tags
    const tags = tagsRaw
      ? tagsRaw.split(",").map(t => t.trim()).filter(Boolean)
      : [];

    // ============================================
    // 5) GERAR IDs E PATHS
    // ============================================
    const bookId = crypto.randomUUID();
    const jobId = crypto.randomUUID();
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "pdf";
    const filePath = `${bookId}/original.${fileExtension}`;
    const slug = title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 100);

    // Gerar checksum
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const checksum = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    // ============================================
    // 6) UPLOAD PARA BUCKET RAW
    // ============================================
    console.log(`[Genesis] Iniciando upload: ${bookId} - ${title}`);

    const { error: uploadError } = await supabase.storage
      .from(RAW_BUCKET)
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("[Genesis] Erro upload:", uploadError);
      return new Response(
        JSON.stringify({ success: false, error: "Erro ao fazer upload do arquivo", errorCode: "UPLOAD_ERROR" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // 7) CRIAR REGISTRO DO LIVRO
    // ============================================
    const { data: book, error: bookError } = await supabase
      .from("web_books")
      .insert({
        id: bookId,
        title: title.trim(),
        subtitle: subtitle?.trim() || null,
        description: description?.trim() || null,
        author: author?.trim() || "Prof. Moisés Medeiros",
        category: finalCategory,
        tags,
        original_path: filePath,
        original_filename: file.name,
        original_size_bytes: file.size,
        original_mime_type: file.type,
        original_checksum: checksum,
        status: "queued",
        status_message: "Aguardando processamento",
        job_id: jobId,
        is_published: isPublished,
        created_by: user.id,
        slug: `${slug}-${bookId.substring(0, 8)}`,
      })
      .select()
      .single();

    if (bookError) {
      console.error("[Genesis] Erro criar livro:", bookError);
      
      // Tentar remover arquivo em caso de erro
      await supabase.storage.from(RAW_BUCKET).remove([filePath]);
      
      return new Response(
        JSON.stringify({ success: false, error: "Erro ao criar registro do livro", errorCode: "DATABASE_ERROR" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // 8) CRIAR JOB NA FILA
    // ============================================
    const { error: jobError } = await supabase
      .from("book_import_jobs")
      .insert({
        id: jobId,
        book_id: bookId,
        status: "pending",
        priority: 5,
        created_by: user.id,
        output_data: {
          originalPath: filePath,
          originalFilename: file.name,
          originalSize: file.size,
          checksum,
        },
      });

    if (jobError) {
      console.error("[Genesis] Erro criar job:", jobError);
    }

    // ============================================
    // 9) TAMBÉM CRIAR NA FILA SANCTUM (SE EXISTIR)
    // ============================================
    try {
      await supabase
        .from("sanctum_jobs_queue")
        .insert({
          job_type: "transmute_book",
          asset_id: bookId,
          input_data: { 
            bookId, 
            filePath, 
            title: title.trim(),
            category: finalCategory,
          },
          status: "pending",
          priority: 5,
        });
    } catch (err) {
      console.log("[Genesis] Fila sanctum_jobs_queue não disponível");
    }

    // ============================================
    // 10) LOGAR EVENTO
    // ============================================
    try {
      await supabase
        .from("audit_logs")
        .insert({
          user_id: user.id,
          action: "book_upload",
          table_name: "web_books",
          record_id: bookId,
          metadata: {
            title: title.trim(),
            category: finalCategory,
            fileSize: file.size,
            fileName: file.name,
          },
        });
    } catch {
      // Ignorar se tabela não existir
    }

    console.log(`[Genesis] Upload concluído: ${bookId}`);

    // ============================================
    // 11) RESPOSTA DE SUCESSO
    // ============================================
    const response: UploadResponse = {
      success: true,
      bookId,
      title: title.trim(),
      status: "queued",
      jobId,
      message: "Livro enviado para processamento com sucesso!",
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: 201, 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "X-Book-Id": bookId,
          "X-Job-Id": jobId,
        } 
      }
    );

  } catch (err) {
    console.error("[Genesis Upload] Erro fatal:", err);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Erro interno do servidor", 
        errorCode: "SERVER_ERROR" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
