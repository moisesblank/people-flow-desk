// ============================================
// 📖 LIVROS DO MOISA - GENESIS UPLOAD
// Upload de PDF e criação de job de processamento
// DOGMA III: Apenas Owner pode fazer upload
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// ============================================
// CONSTANTES
// ============================================

const OWNER_EMAIL = "moisesblank@gmail.com";
const BUCKET_RAW = "ena-assets-raw";
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================
// TIPOS
// ============================================

interface UploadRequest {
  title: string;
  subtitle?: string;
  description?: string;
  category: string;
  tags?: string[];
  fileName: string;
  fileBase64: string; // Base64 encoded PDF
}

interface UploadResponse {
  success: boolean;
  error?: string;
  bookId?: string;
  jobId?: string;
  message?: string;
}

// ============================================
// HANDLER PRINCIPAL
// ============================================

serve(async (req: Request) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Autenticação
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "NOT_AUTHENTICATED" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("[genesis-upload] Auth error:", authError);
      return new Response(
        JSON.stringify({ success: false, error: "INVALID_TOKEN" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar se é owner (apenas owner pode fazer upload)
    const isOwner = user.email?.toLowerCase() === OWNER_EMAIL.toLowerCase();
    
    // Buscar role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    const role = roleData?.role || "user";
    const canUpload = isOwner || ["owner", "admin"].includes(role);

    if (!canUpload) {
      console.log(`[genesis-upload] Access denied for ${user.email} with role ${role}`);
      return new Response(
        JSON.stringify({ success: false, error: "OWNER_ONLY" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request
    const body = await req.json() as UploadRequest;
    const { title, subtitle, description, category, tags, fileName, fileBase64 } = body;

    if (!title || !category || !fileName || !fileBase64) {
      return new Response(
        JSON.stringify({ success: false, error: "MISSING_REQUIRED_FIELDS" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[genesis-upload] Processing upload: ${title} by ${user.email}`);

    // Decodificar base64
    const binaryString = atob(fileBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Verificar tamanho
    if (bytes.length > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ success: false, error: "FILE_TOO_LARGE" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar se é PDF (magic bytes)
    if (bytes[0] !== 0x25 || bytes[1] !== 0x50 || bytes[2] !== 0x44 || bytes[3] !== 0x46) {
      return new Response(
        JSON.stringify({ success: false, error: "INVALID_PDF" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Gerar nome único
    const timestamp = Date.now();
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storagePath = `books/raw/${timestamp}_${sanitizedName}`;

    // Upload para bucket
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_RAW)
      .upload(storagePath, bytes, {
        contentType: "application/pdf",
        upsert: false
      });

    if (uploadError) {
      console.error("[genesis-upload] Upload error:", uploadError);
      return new Response(
        JSON.stringify({ success: false, error: "UPLOAD_FAILED" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[genesis-upload] File uploaded to ${storagePath}`);

    // Criar registro do livro
    const { data: book, error: bookError } = await supabase
      .from("web_books")
      .insert([{
        title,
        subtitle: subtitle || null,
        description: description || null,
        category: category as "exercicios" | "fisico_quimica" | "mapas_mentais" | "outros" | "previsao_final" | "quimica_geral" | "quimica_organica" | "resumos" | "revisao_ciclica" | "simulados",
        tags: tags || [],
        status: "queued" as const,
        original_bucket: BUCKET_RAW,
        original_path: storagePath,
        original_filename: fileName,
        original_size_bytes: bytes.length,
        created_by: user.id,
      }])
      .select()
      .single();

    if (bookError || !book) {
      console.error("[genesis-upload] Book creation error:", bookError);
      // Tentar deletar o arquivo
      await supabase.storage.from(BUCKET_RAW).remove([storagePath]);
      return new Response(
        JSON.stringify({ success: false, error: "BOOK_CREATION_FAILED" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[genesis-upload] Book created: ${book.id}`);

    // Criar job de processamento (SNA)
    const jobId = crypto.randomUUID();
    const { error: jobError } = await supabase
      .from("sna_jobs")
      .insert([{
        id: jobId,
        job_type: "process_book_pdf",
        idempotency_key: `book_${book.id}`,
        priority: 100,
        status: "pending",
        input: {
          bookId: book.id,
          storagePath,
          fileName,
          title,
          category
        },
        created_by: user.id
      }]);

    if (jobError) {
      console.warn("[genesis-upload] Job creation warning:", jobError);
      // Não falhar, o livro foi criado
    }

    // Atualizar livro com job_id
    await supabase
      .from("web_books")
      .update({ job_id: jobId })
      .eq("id", book.id);

    // Logar ação
    await supabase.from("activity_log").insert({
      user_id: user.id,
      user_email: user.email,
      action: "book_upload",
      table_name: "web_books",
      record_id: book.id,
      new_value: { title, category, fileName, fileSize: bytes.length }
    });

    const response: UploadResponse = {
      success: true,
      bookId: book.id,
      jobId,
      message: `Livro "${title}" enviado para processamento!`
    };

    console.log(`[genesis-upload] Complete. Book: ${book.id}, Job: ${jobId}`);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[genesis-upload] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "INTERNAL_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
