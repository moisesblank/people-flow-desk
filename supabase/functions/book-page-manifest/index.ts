// ============================================
// 🌌🔥 BOOK PAGE MANIFEST — EDGE FUNCTION NÍVEL NASA 🔥🌌
// ANO 2300 — ENTREGA SEGURA DE PÁGINAS DO LIVRO WEB
// LEI VI COMPLIANCE: CORS Allowlist
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions, isOriginAllowed, corsBlockedResponse } from "../_shared/corsConfig.ts";

// ============================================
// CONSTANTES (P1 FIX: OWNER_EMAIL removido)
// ============================================
const SIGNED_URL_TTL_SECONDS = 3600; // 1 hora - URLs duráveis para leitura prolongada
const TRANSMUTED_BUCKET = "ena-assets-transmuted";
const MAX_PAGES_PER_REQUEST = 10;

// ============================================
// TIPOS
// ============================================
interface PageData {
  pageNumber: number;
  url: string;
  width?: number;
  height?: number;
  chapterTitle?: string;
  sectionTitle?: string;
}

interface ManifestResponse {
  success: boolean;
  bookId?: string;
  pages?: PageData[];
  watermark?: {
    enabled: boolean;
    seed: string;
    userEmail?: string;
    userCpf?: string;
    userName?: string;
  };
  expiresAt?: string;
  isOwner?: boolean;
  error?: string;
  errorCode?: string;
}

// ============================================
// FUNÇÃO PRINCIPAL
// ============================================
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

  const origin = req.headers.get("Origin");
  if (!isOriginAllowed(origin)) {
    return corsBlockedResponse(origin);
  }

  const corsHeaders = {
    ...getCorsHeaders(req),
    "Cache-Control": "no-store, no-cache, must-revalidate",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
  };

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
    // 2) OBTER PARÂMETROS
    // ============================================
    const url = new URL(req.url);
    let bookId = url.searchParams.get("bookId");
    let pageNumbersParam = url.searchParams.get("pages");
    let sessionId = url.searchParams.get("sessionId");

    if (req.method === "POST") {
      try {
        const body = await req.json();
        bookId = body.bookId || bookId;
        pageNumbersParam = body.pages?.toString() || pageNumbersParam;
        sessionId = body.sessionId || sessionId;
      } catch {
        // Ignorar erro de parse
      }
    }

    if (!bookId) {
      return new Response(
        JSON.stringify({ success: false, error: "bookId é obrigatório", errorCode: "BAD_REQUEST" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // 3) PARSEAR PÁGINAS SOLICITADAS
    // ============================================
    let requestedPages: number[] = [];

    if (pageNumbersParam) {
      if (pageNumbersParam.includes("-")) {
        const [start, end] = pageNumbersParam.split("-").map(Number);
        for (let i = start; i <= Math.min(end, start + MAX_PAGES_PER_REQUEST - 1); i++) {
          requestedPages.push(i);
        }
      } else {
        requestedPages = pageNumbersParam
          .split(",")
          .map(Number)
          .filter(n => !isNaN(n) && n > 0)
          .slice(0, MAX_PAGES_PER_REQUEST);
      }
    }

    // ============================================
    // 4) VERIFICAR ACESSO VIA RPC
    // ============================================
    const { data: bookData, error: bookError } = await supabase.rpc(
      "fn_get_book_for_reader",
      { p_book_id: bookId }
    );

    if (bookError) {
      console.error("[Book Manifest] Erro RPC:", bookError);
      return new Response(
        JSON.stringify({ success: false, error: "Erro interno", errorCode: "SERVER_ERROR" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!bookData?.success) {
      const errorCode = bookData?.errorCode || "UNKNOWN";
      let status = 500;

      switch (errorCode) {
        case "LOCKED": status = 423; break;
        case "UNAUTHORIZED": status = 403; break;
        case "NOT_FOUND": status = 404; break;
        case "NOT_READY": status = 503; break;
      }

      return new Response(
        JSON.stringify(bookData),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // 5) BUSCAR INFORMAÇÕES DAS PÁGINAS
    // ============================================
    const isOwner = bookData.isOwner; // P1 FIX: role-based only
    const allPages = bookData.pages || [];

    if (requestedPages.length === 0) {
      const currentPage = bookData.progress?.currentPage || 1;
      requestedPages = [currentPage, currentPage + 1].filter(p => p <= (bookData.book?.totalPages || 1));
    }

    const validPages = allPages.filter((p: { pageNumber: number }) => 
      requestedPages.includes(p.pageNumber)
    );

    // ============================================
    // 6) GERAR SIGNED URLs
    // ============================================
    const signedPages: PageData[] = [];

    for (const page of validPages) {
      try {
        const { data: signedData, error: signError } = await supabase.storage
          .from(TRANSMUTED_BUCKET)
          .createSignedUrl(page.imagePath, SIGNED_URL_TTL_SECONDS);

        if (signError) {
          console.error(`[Book Manifest] Erro ao assinar página ${page.pageNumber}:`, signError);
          continue;
        }

        if (signedData?.signedUrl) {
          signedPages.push({
            pageNumber: page.pageNumber,
            url: signedData.signedUrl,
            width: page.width,
            height: page.height,
            chapterTitle: page.chapterTitle,
            sectionTitle: page.sectionTitle,
          });
        }
      } catch (err) {
        console.error(`[Book Manifest] Exceção ao assinar página ${page.pageNumber}:`, err);
      }
    }

    // ============================================
    // 7) GERAR WATERMARK SEED
    // ============================================
    const watermarkSeed = crypto.randomUUID().substring(0, 8).toUpperCase();
    const expiresAt = new Date(Date.now() + SIGNED_URL_TTL_SECONDS * 1000).toISOString();

    // ============================================
    // 8) LOGAR ACESSO ÀS PÁGINAS
    // ============================================
    if (signedPages.length > 0) {
      const pageNumbers = signedPages.map(p => p.pageNumber);
      
      try {
        await supabase
          .from("book_access_logs")
          .insert({
            user_id: user.id,
            user_email: user.email,
            book_id: bookId,
            page_number: pageNumbers[0],
            event_type: "page_view",
            session_id: sessionId,
            metadata: { 
              requestedPages: pageNumbers,
              signedCount: signedPages.length,
            },
          });
      } catch {
        // Ignorar erro de log
      }
    }

    // ============================================
    // 9) MONTAR RESPOSTA
    // ============================================
    const response: ManifestResponse = {
      success: true,
      bookId,
      pages: signedPages,
      watermark: {
        enabled: bookData.watermark?.enabled && !isOwner,
        seed: watermarkSeed,
        userEmail: bookData.watermark?.userEmail,
        userCpf: bookData.watermark?.userCpf,
        userName: bookData.watermark?.userName,
      },
      expiresAt,
      isOwner,
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "X-Watermark-Seed": watermarkSeed,
          "X-Expires-At": expiresAt,
        },
      }
    );

  } catch (err) {
    console.error("[Book Page Manifest] Erro fatal:", err);
    
    return new Response(
      JSON.stringify({ success: false, error: "Erro interno do servidor", errorCode: "SERVER_ERROR" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
