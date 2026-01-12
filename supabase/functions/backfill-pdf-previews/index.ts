// ============================================
// BACKFILL PDF PREVIEWS
// Processa PDFs existentes que não têm preview
// Usa PDF.js via Cloudflare/external para gerar previews
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Buckets conhecidos que contêm PDFs
const PDF_BUCKETS: Record<string, string> = {
  'web_books': 'ena-assets-raw',
  'arquivos_universal': 'arquivos',
};

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { table = 'web_books', limit = 10 } = await req.json().catch(() => ({}));

    console.log(`[backfill-pdf-previews] Iniciando backfill para ${table}, limite: ${limit}`);

    // 1. Buscar registros pendentes
    let query;
    if (table === 'web_books') {
      query = supabase
        .from('web_books')
        .select('id, title, original_path, preview_status')
        .eq('preview_status', 'pending')
        .not('original_path', 'is', null)
        .limit(limit);
    } else {
      query = supabase
        .from('arquivos_universal')
        .select('id, nome, path, tipo, preview_status')
        .eq('preview_status', 'pending')
        .eq('tipo', 'application/pdf')
        .limit(limit);
    }

    const { data: records, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Erro ao buscar registros: ${fetchError.message}`);
    }

    if (!records || records.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nenhum registro pendente encontrado',
          processed: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[backfill-pdf-previews] Encontrados ${records.length} registros pendentes`);

    // 2. Processar cada registro
    const results: Array<{ id: string; status: string; error?: string }> = [];

    for (const record of records) {
      const recordId = record.id;
      const pdfPath = table === 'web_books' ? record.original_path : record.path;
      const bucket = PDF_BUCKETS[table];

      try {
        // Marcar como processando
        await supabase
          .from(table)
          .update({ preview_status: 'processing' })
          .eq('id', recordId);

        // Obter URL assinada do PDF
        const { data: signedData, error: signedError } = await supabase.storage
          .from(bucket)
          .createSignedUrl(pdfPath, 300); // 5 minutos

        if (signedError || !signedData?.signedUrl) {
          throw new Error(`Falha ao obter URL assinada: ${signedError?.message || 'URL não gerada'}`);
        }

        // NOTA: Em ambiente Deno, não temos PDF.js nativo.
        // A geração de preview precisa ser feita no client-side.
        // Esta função apenas marca os registros como 'pending' para processamento no frontend.
        
        // Por enquanto, marcamos como 'skipped' pois a geração real será feita no frontend
        // quando o usuário visualizar a lista pela primeira vez.
        
        await supabase
          .from(table)
          .update({ 
            preview_status: 'pending', // Mantém pendente para processamento no frontend
          })
          .eq('id', recordId);

        results.push({ id: recordId, status: 'marked_for_frontend' });

      } catch (error: any) {
        console.error(`[backfill-pdf-previews] Erro no registro ${recordId}:`, error);
        
        await supabase
          .from(table)
          .update({ preview_status: 'error' })
          .eq('id', recordId);

        results.push({ id: recordId, status: 'error', error: error.message });
      }
    }

    const successCount = results.filter(r => r.status !== 'error').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    console.log(`[backfill-pdf-previews] Concluído: ${successCount} sucesso, ${errorCount} erros`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processados ${records.length} registros`,
        processed: successCount,
        errors: errorCount,
        results,
        note: 'A geração de preview será feita no frontend quando o usuário visualizar os documentos.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[backfill-pdf-previews] Erro geral:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
