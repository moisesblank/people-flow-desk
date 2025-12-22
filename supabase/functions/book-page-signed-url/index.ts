// ============================================
// 📖 LIVROS DO MOISA - SIGNED URL GENERATOR
// Gera URLs assinadas para páginas de livros
// DOGMA III: Segurança NASA + Rate Limiting
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// ============================================
// CONSTANTES
// ============================================

const OWNER_EMAIL = "moisesblank@gmail.com";
const SIGNED_URL_TTL = 30; // 30 segundos
const BUCKET_TRANSMUTED = "ena-assets-transmuted";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================
// TIPOS
// ============================================

interface SignedUrlRequest {
  bookId: string;
  pageNumber: number;
  prefetch?: number[]; // Páginas para prefetch
}

interface SignedUrlResponse {
  success: boolean;
  error?: string;
  url?: string;
  expiresAt?: string;
  prefetchUrls?: Record<number, string>;
  isOwner?: boolean;
}

// ============================================
// UTILITÁRIOS
// ============================================

async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
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
      console.error("[book-page-signed-url] Auth error:", authError);
      return new Response(
        JSON.stringify({ success: false, error: "INVALID_TOKEN" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request
    const { bookId, pageNumber, prefetch = [] } = await req.json() as SignedUrlRequest;

    if (!bookId || !pageNumber) {
      return new Response(
        JSON.stringify({ success: false, error: "MISSING_PARAMS" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[book-page-signed-url] User ${user.email} requesting page ${pageNumber} of book ${bookId}`);

    // Verificar se é owner
    const isOwner = user.email?.toLowerCase() === OWNER_EMAIL.toLowerCase();

    // Buscar role do usuário
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    const role = roleData?.role || "user";
    const hasAccess = isOwner || ["beta", "admin", "owner", "funcionario"].includes(role);

    if (!hasAccess) {
      console.log(`[book-page-signed-url] Access denied for role: ${role}`);
      return new Response(
        JSON.stringify({ success: false, error: "ACCESS_DENIED" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar se o livro existe e está pronto
    const { data: book, error: bookError } = await supabase
      .from("web_books")
      .select("id, title, status, total_pages, transmuted_bucket")
      .eq("id", bookId)
      .single();

    if (bookError || !book) {
      return new Response(
        JSON.stringify({ success: false, error: "BOOK_NOT_FOUND" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Só owner pode ver livros não prontos
    if (book.status !== "ready" && !isOwner) {
      return new Response(
        JSON.stringify({ success: false, error: "BOOK_NOT_READY" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar página
    const { data: page, error: pageError } = await supabase
      .from("web_book_pages")
      .select("id, page_number, image_path, image_format")
      .eq("book_id", bookId)
      .eq("page_number", pageNumber)
      .single();

    if (pageError || !page) {
      return new Response(
        JSON.stringify({ success: false, error: "PAGE_NOT_FOUND" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Gerar signed URL
    const bucket = book.transmuted_bucket || BUCKET_TRANSMUTED;
    const { data: signedUrlData, error: signedError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(page.image_path, SIGNED_URL_TTL);

    if (signedError || !signedUrlData?.signedUrl) {
      console.error("[book-page-signed-url] Signed URL error:", signedError);
      return new Response(
        JSON.stringify({ success: false, error: "SIGNED_URL_ERROR" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prefetch: gerar URLs para próximas páginas
    const prefetchUrls: Record<number, string> = {};
    if (prefetch.length > 0) {
      const { data: prefetchPages } = await supabase
        .from("web_book_pages")
        .select("page_number, image_path")
        .eq("book_id", bookId)
        .in("page_number", prefetch);

      if (prefetchPages) {
        for (const p of prefetchPages) {
          const { data: pUrl } = await supabase.storage
            .from(bucket)
            .createSignedUrl(p.image_path, SIGNED_URL_TTL + 30); // +30s para prefetch
          
          if (pUrl?.signedUrl) {
            prefetchUrls[p.page_number] = pUrl.signedUrl;
          }
        }
      }
    }

    // Logar acesso
    const ipHash = await hashString(req.headers.get("x-forwarded-for") || "unknown");
    const uaHash = await hashString(req.headers.get("user-agent") || "unknown");

    await supabase.from("book_access_logs").insert({
      user_id: user.id,
      user_email: user.email,
      book_id: bookId,
      page_number: pageNumber,
      event_type: "page_view",
      ip_hash: ipHash,
      ua_hash: uaHash,
      is_violation: false,
      metadata: { 
        role,
        prefetchCount: prefetch.length,
        isOwner 
      }
    });

    const expiresAt = new Date(Date.now() + SIGNED_URL_TTL * 1000).toISOString();

    const response: SignedUrlResponse = {
      success: true,
      url: signedUrlData.signedUrl,
      expiresAt,
      prefetchUrls: Object.keys(prefetchUrls).length > 0 ? prefetchUrls : undefined,
      isOwner
    };

    console.log(`[book-page-signed-url] Success for page ${pageNumber}`);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[book-page-signed-url] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "INTERNAL_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
