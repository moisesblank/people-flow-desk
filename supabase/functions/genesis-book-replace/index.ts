// ============================================
// 🔄 GENESIS BOOK REPLACE — Substituição de PDF
// Reutiliza infraestrutura existente do genesis-book-upload
// LEI VI COMPLIANCE: CORS Allowlist
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions, isOriginAllowed, corsBlockedResponse } from "../_shared/corsConfig.ts";

// ============================================
// CONSTANTES
// ============================================
const RAW_BUCKET = "ena-assets-raw";
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const ALLOWED_MIME_TYPES = ["application/pdf", "application/epub+zip"];
const SIGNED_URL_EXPIRY = 3600; // 1 hora

// ============================================
// TIPOS
// ============================================
interface ReplaceInitResponse {
  success: boolean;
  phase: "init" | "complete";
  bookId?: string;
  uploadUrl?: string;
  uploadPath?: string;
  expiresAt?: string;
  oldPath?: string;
  message?: string;
  error?: string;
  errorCode?: string;
}

interface ReplaceCompleteResponse {
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
    // 2) VERIFICAR PERMISSÃO VIA ROLE (Owner/Admin only)
    // ============================================
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();
    
    const isOwner = userRole?.role === "owner";
    const isAdmin = userRole?.role === "admin";
    
    if (!isOwner && !isAdmin) {
      console.warn(`[Genesis Replace] Acesso negado: ${user.email} (role: ${userRole?.role})`);
      return new Response(
        JSON.stringify({ success: false, error: "Apenas owner/admin pode substituir PDFs", errorCode: "FORBIDDEN" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // 3) PARSE REQUEST
    // ============================================
    const body = await req.json();
    const phase = body.phase || "init";

    // ============================================
    // FASE 1: INIT - Gerar URL assinada para substituição
    // ============================================
    if (phase === "init") {
      const { bookId, fileName, fileSize, mimeType } = body;

      // Validações
      if (!bookId) {
        return new Response(
          JSON.stringify({ success: false, error: "bookId é obrigatório", errorCode: "BOOK_ID_REQUIRED" }),
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

      // Buscar livro existente
      const { data: book, error: fetchError } = await supabase
        .from("web_books")
        .select("id, title, original_path, original_bucket, original_filename")
        .eq("id", bookId)
        .single();

      if (fetchError || !book) {
        return new Response(
          JSON.stringify({ success: false, error: "Livro não encontrado", errorCode: "NOT_FOUND" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const oldPath = book.original_path;
      
      // Gerar novo path (mesmo padrão: bookId/original.pdf)
      const fileExtension = fileName.split(".").pop()?.toLowerCase() || "pdf";
      const uploadPath = `${bookId}/original.${fileExtension}`;

      console.log(`[Genesis Replace] Iniciando substituição: ${bookId} - ${book.title}`);
      console.log(`[Genesis Replace] Path antigo: ${oldPath} → Novo: ${uploadPath}`);

      // ============================================
      // CRIAR SIGNED URL PARA UPLOAD (upsert: true)
      // ============================================
      const { data: signedData, error: signError } = await supabase.storage
        .from(RAW_BUCKET)
        .createSignedUploadUrl(uploadPath, { upsert: true });

      if (signError || !signedData) {
        console.error("[Genesis Replace] Erro ao criar signed URL:", signError);
        return new Response(
          JSON.stringify({ success: false, error: "Erro ao gerar URL de upload", errorCode: "SIGNED_URL_ERROR" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ============================================
      // ATUALIZAR STATUS DO LIVRO PARA "queued"
      // ============================================
      const { error: updateError } = await supabase
        .from("web_books")
        .update({
          status: "queued",
          status_message: "Substituição de PDF em andamento",
          original_path: uploadPath,
          original_filename: fileName,
          original_size_bytes: fileSize,
          original_mime_type: mimeType,
          updated_at: new Date().toISOString(),
        })
        .eq("id", bookId);

      if (updateError) {
        console.error("[Genesis Replace] Erro ao atualizar livro:", updateError);
      }

      const expiresAt = new Date(Date.now() + SIGNED_URL_EXPIRY * 1000).toISOString();

      console.log(`[Genesis Replace] Signed URL gerada para: ${bookId}`);

      const response: ReplaceInitResponse = {
        success: true,
        phase: "init",
        bookId,
        uploadUrl: signedData.signedUrl,
        uploadPath,
        oldPath,
        expiresAt,
        message: "URL de upload gerada. Faça o upload do novo PDF.",
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
    // FASE 2: COMPLETE - Confirmar substituição e reprocessar
    // ============================================
    if (phase === "complete") {
      const { bookId, deleteOldPages } = body;

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

      // ============================================
      // DELETAR PÁGINAS ANTIGAS (se existirem)
      // ============================================
      if (deleteOldPages !== false) {
        console.log(`[Genesis Replace] Deletando páginas antigas do livro: ${bookId}`);
        
        const { error: deleteError } = await supabase
          .from("web_book_pages")
          .delete()
          .eq("book_id", bookId);
        
        if (deleteError) {
          console.error("[Genesis Replace] Erro ao deletar páginas antigas:", deleteError);
        } else {
          console.log(`[Genesis Replace] Páginas antigas deletadas`);
        }
      }

      // ============================================
      // CANCELAR JOBS ANTERIORES
      // ============================================
      await supabase
        .from("book_import_jobs")
        .update({ status: "cancelled" })
        .eq("book_id", bookId)
        .in("status", ["pending", "processing"]);

      const jobId = crypto.randomUUID();

      // ============================================
      // ATUALIZAR LIVRO: queued, reset total_pages
      // ============================================
      const { error: updateError } = await supabase
        .from("web_books")
        .update({
          status: "queued",
          status_message: "Aguardando reprocessamento",
          job_id: jobId,
          total_pages: 0,
          processing_progress: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", bookId);

      if (updateError) {
        console.error("[Genesis Replace] Erro ao atualizar livro:", updateError);
      }

      // ============================================
      // CRIAR NOVO JOB DE PROCESSAMENTO
      // ============================================
      const { error: jobError } = await supabase
        .from("book_import_jobs")
        .insert({
          id: jobId,
          book_id: bookId,
          status: "pending",
          priority: 3, // Prioridade alta para substituição
          created_by: user.id,
          current_step: "replace_pdf",
          output_data: {
            originalPath: book.original_path,
            originalFilename: book.original_filename,
            originalSize: book.original_size_bytes,
            isReplacement: true,
          },
        });

      if (jobError) {
        console.error("[Genesis Replace] Erro criar job:", jobError);
      }

      // ============================================
      // CRIAR NA FILA SANCTUM (se existir)
      // ============================================
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
              isReplacement: true,
            },
            status: "pending",
            priority: 3,
          });
      } catch {
        console.log("[Genesis Replace] Fila sanctum_jobs_queue não disponível");
      }

      // ============================================
      // LOG DE AUDITORIA
      // ============================================
      try {
        await supabase
          .from("audit_logs")
          .insert({
            user_id: user.id,
            action: "book_pdf_replaced",
            table_name: "web_books",
            record_id: bookId,
            metadata: {
              title: book.title,
              category: book.category,
              newFileName: book.original_filename,
              newFileSize: book.original_size_bytes,
            },
          });
      } catch {
        // Ignorar se tabela não existir
      }

      console.log(`[Genesis Replace] Substituição concluída: ${bookId} - Job: ${jobId}`);

      const response: ReplaceCompleteResponse = {
        success: true,
        bookId,
        title: book.title,
        status: "queued",
        jobId,
        message: "PDF substituído com sucesso! Reprocessamento iniciado.",
      };

      return new Response(
        JSON.stringify(response),
        { 
          status: 200, 
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
    console.error("[Genesis Replace] Erro fatal:", err);
    
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
