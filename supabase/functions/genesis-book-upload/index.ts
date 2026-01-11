// ============================================
// 🌌🔥 GENESIS BOOK UPLOAD v2.0 — SIGNED URL PATTERN 🔥🌌
// CORRIGIDO: Sem OOM risk — Upload direto para Storage
// LEI VI COMPLIANCE: CORS Allowlist
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions, isOriginAllowed, corsBlockedResponse } from "../_shared/corsConfig.ts";

// ============================================
// CONSTANTES (P1 FIX: OWNER_EMAIL removido)
// ============================================
const RAW_BUCKET = "ena-assets-raw";
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const ALLOWED_MIME_TYPES = ["application/pdf", "application/epub+zip"];
const SIGNED_URL_EXPIRY = 3600; // 1 hora para upload

// ============================================
// TIPOS
// ============================================
interface UploadInitResponse {
  success: boolean;
  phase: "init" | "complete";
  bookId?: string;
  uploadUrl?: string;
  uploadPath?: string;
  expiresAt?: string;
  message?: string;
  error?: string;
  errorCode?: string;
}

interface UploadCompleteResponse {
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
    return handleCorsOptions(req);
  }

  // Validar origem
  const origin = req.headers.get("Origin");
  if (!isOriginAllowed(origin)) {
    return corsBlockedResponse(origin);
  }

  const corsHeaders = getCorsHeaders(req);

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Token inválido", errorCode: "UNAUTHORIZED" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // 2) VERIFICAR PERMISSÃO VIA ROLE (P1 FIX)
    // ============================================
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();
    
    const isOwner = userRole?.role === "owner";
    const isAdmin = userRole?.role === "admin";
    
    if (!isOwner && !isAdmin) {
      console.warn(`[Genesis] Acesso negado: ${user.email} (role: ${userRole?.role})`);
      return new Response(
        JSON.stringify({ success: false, error: "Apenas owner/admin pode importar livros", errorCode: "FORBIDDEN" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // 3) PARSE REQUEST - DETECTAR FASE
    // ============================================
    const body = await req.json();
    const phase = body.phase || "init";

    // ============================================
    // FASE 1: INIT - Gerar URL assinada para upload direto
    // ============================================
    if (phase === "init") {
      const { title, subtitle, description, author, category, tags, isPublished, position, fileName, fileSize, mimeType } = body;

      // Validações
      if (!title || title.trim().length === 0) {
        return new Response(
          JSON.stringify({ success: false, error: "Título é obrigatório", errorCode: "TITLE_REQUIRED" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!fileName) {
        return new Response(
          JSON.stringify({ success: false, error: "Nome do arquivo é obrigatório", errorCode: "FILENAME_REQUIRED" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Tipo de arquivo não permitido: ${mimeType}. Apenas PDF e EPUB.`,
            errorCode: "INVALID_FILE_TYPE" 
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (fileSize > MAX_FILE_SIZE) {
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

      // Gerar IDs
      const bookId = crypto.randomUUID();
      const fileExtension = fileName.split(".").pop()?.toLowerCase() || "pdf";
      const uploadPath = `${bookId}/original.${fileExtension}`;
      const slug = title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .substring(0, 100);

      // Validar categoria
      const finalCategory = category && VALID_CATEGORIES.includes(category) ? category : "outros";

      // Parsear tags
      const parsedTags = tags
        ? (Array.isArray(tags) ? tags : tags.split(",").map((t: string) => t.trim()).filter(Boolean))
        : [];

      console.log(`[Genesis v2] Iniciando upload: ${bookId} - ${title}`);

      // ============================================
      // CRIAR SIGNED URL PARA UPLOAD DIRETO
      // ============================================
      const { data: signedData, error: signError } = await supabase.storage
        .from(RAW_BUCKET)
        .createSignedUploadUrl(uploadPath);

      if (signError || !signedData) {
        console.error("[Genesis v2] Erro ao criar signed URL:", signError);
        return new Response(
          JSON.stringify({ success: false, error: "Erro ao gerar URL de upload", errorCode: "SIGNED_URL_ERROR" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ============================================
      // CRIAR REGISTRO DO LIVRO (STATUS: draft)
      // ============================================
      const { error: bookError } = await supabase
        .from("web_books")
        .insert({
          id: bookId,
          title: title.trim(),
          subtitle: subtitle?.trim() || null,
          description: description?.trim() || null,
          author: author?.trim() || "Prof. Moisés Medeiros",
          category: finalCategory,
          tags: parsedTags,
          position: typeof position === 'number' ? position : 0,
          original_path: uploadPath,
          original_filename: fileName,
          original_size_bytes: fileSize,
          original_mime_type: mimeType,
          // Enum permitido: draft | queued | processing | ready | error | archived
          status: "draft",
          status_message: "Aguardando upload do arquivo",
          is_published: isPublished || false,
          created_by: user.id,
          slug: `${slug}-${bookId.substring(0, 8)}`,
        });

      if (bookError) {
        console.error("[Genesis v2] Erro criar registro livro:", bookError);
        return new Response(
          JSON.stringify({ success: false, error: "Erro ao criar registro do livro", errorCode: "DATABASE_ERROR" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const expiresAt = new Date(Date.now() + SIGNED_URL_EXPIRY * 1000).toISOString();

      console.log(`[Genesis v2] Signed URL gerada: ${bookId}`);

      // ============================================
      // RESPOSTA FASE 1: URL para upload
      // ============================================
      const response: UploadInitResponse = {
        success: true,
        phase: "init",
        bookId,
        uploadUrl: signedData.signedUrl,
        uploadPath,
        expiresAt,
        message: "URL de upload gerada. Faça o upload do arquivo diretamente.",
      };

      return new Response(
        JSON.stringify(response),
        { 
          status: 200, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "X-Book-Id": bookId,
          } 
        }
      );
    }

    // ============================================
    // FASE 2: COMPLETE - Confirmar upload e criar job
    // ============================================
    if (phase === "complete") {
      const { bookId, checksum } = body;

      if (!bookId) {
        return new Response(
          JSON.stringify({ success: false, error: "bookId é obrigatório", errorCode: "BOOK_ID_REQUIRED" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Buscar livro
      const { data: book, error: fetchError } = await supabase
        .from("web_books")
        .select("*")
        .eq("id", bookId)
        .single();

      if (fetchError || !book) {
        return new Response(
          JSON.stringify({ success: false, error: "Livro não encontrado", errorCode: "NOT_FOUND" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verificar se arquivo foi enviado para o Storage
      const { data: fileList, error: listError } = await supabase.storage
        .from(RAW_BUCKET)
        .list(bookId, { limit: 1 });

      if (listError || !fileList || fileList.length === 0) {
        return new Response(
          JSON.stringify({ success: false, error: "Arquivo não encontrado no storage. Upload não completado.", errorCode: "FILE_NOT_FOUND" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const jobId = crypto.randomUUID();

      // Atualizar status do livro
      const { error: updateError } = await supabase
        .from("web_books")
        .update({
          status: "queued",
          status_message: "Aguardando processamento",
          job_id: jobId,
          original_checksum: checksum || null,
        })
        .eq("id", bookId);

      if (updateError) {
        console.error("[Genesis v2] Erro ao atualizar livro:", updateError);
      }

      // Criar job na fila
      const { error: jobError } = await supabase
        .from("book_import_jobs")
        .insert({
          id: jobId,
          book_id: bookId,
          status: "pending",
          priority: 5,
          created_by: user.id,
          output_data: {
            originalPath: book.original_path,
            originalFilename: book.original_filename,
            originalSize: book.original_size_bytes,
            checksum: checksum || null,
          },
        });

      if (jobError) {
        console.error("[Genesis v2] Erro criar job:", jobError);
      }

      // Também criar na fila SANCTUM (se existir)
      try {
        await supabase
          .from("sanctum_jobs_queue")
          .insert({
            job_type: "transmute_book",
            asset_id: bookId,
            input_data: { 
              bookId, 
              filePath: book.original_path, 
              title: book.title,
              category: book.category,
            },
            status: "pending",
            priority: 5,
          });
      } catch {
        console.log("[Genesis v2] Fila sanctum_jobs_queue não disponível");
      }

      // Logar evento
      try {
        await supabase
          .from("audit_logs")
          .insert({
            user_id: user.id,
            action: "book_upload_complete",
            table_name: "web_books",
            record_id: bookId,
            metadata: {
              title: book.title,
              category: book.category,
              fileSize: book.original_size_bytes,
              fileName: book.original_filename,
            },
          });
      } catch {
        // Ignorar se tabela não existir
      }

      console.log(`[Genesis v2] Upload concluído: ${bookId}`);

      // Resposta FASE 2: Sucesso
      const response: UploadCompleteResponse = {
        success: true,
        bookId,
        title: book.title,
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
    }

    // Fase desconhecida
    return new Response(
      JSON.stringify({ success: false, error: "Fase inválida. Use 'init' ou 'complete'.", errorCode: "INVALID_PHASE" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("[Genesis v2] Erro fatal:", err);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Erro interno do servidor", 
        errorCode: "SERVER_ERROR" 
      }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
