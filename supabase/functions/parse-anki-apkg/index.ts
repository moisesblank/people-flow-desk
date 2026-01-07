// ============================================
// 🧠 PARSE ANKI APKG - Edge Function
// Processa arquivos .apkg (formato Anki) e extrai flashcards
// APKG = ZIP contendo SQLite com cards
// Usa sqlite3 nativo do Deno
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import JSZip from "https://esm.sh/jszip@3.10.1";
import { DB } from "https://deno.land/x/sqlite@v3.8/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AnkiCard {
  question: string;
  answer: string;
  tags?: string[];
}

// Remove tags HTML básicas
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<div[^>]*>/gi, '\n')
    .replace(/<\/div>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n+/g, '\n')
    .trim();
}

// Processa campos do Anki (separados por \x1f)
function parseAnkiFields(flds: string): { front: string; back: string } {
  const parts = flds.split('\x1f');
  return {
    front: stripHtml(parts[0] || ''),
    back: stripHtml(parts[1] || parts[0] || ''),
  };
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[parse-anki-apkg] Iniciando processamento...");

    // Verificar autenticação
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar usuário
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error("[parse-anki-apkg] Usuário não autenticado:", userError);
      return new Response(
        JSON.stringify({ error: "Usuário não autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[parse-anki-apkg] Usuário: ${user.email}`);

    // Obter arquivo do request
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new Response(
        JSON.stringify({ error: "Arquivo não fornecido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[parse-anki-apkg] Arquivo: ${file.name}, Tamanho: ${(file.size / 1024 / 1024).toFixed(2)}MB`);

    // Ler arquivo como ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Extrair ZIP
    const zip = await JSZip.loadAsync(arrayBuffer);
    console.log("[parse-anki-apkg] ZIP extraído, procurando collection.anki2...");

    // Procurar o banco SQLite (collection.anki2 ou collection.anki21)
    let dbFile: JSZip.JSZipObject | null = null;
    let dbFileName: string = "";
    
    for (const [filename, zipObject] of Object.entries(zip.files)) {
      if (filename === 'collection.anki2' || filename === 'collection.anki21') {
        dbFile = zipObject;
        dbFileName = filename;
        console.log(`[parse-anki-apkg] Encontrado: ${filename}`);
        break;
      }
    }

    if (!dbFile) {
      // Tentar encontrar qualquer arquivo .anki2 ou .anki21
      for (const [filename, zipObject] of Object.entries(zip.files)) {
        if (filename.endsWith('.anki2') || filename.endsWith('.anki21')) {
          dbFile = zipObject;
          dbFileName = filename;
          console.log(`[parse-anki-apkg] Usando arquivo alternativo: ${filename}`);
          break;
        }
      }
    }

    if (!dbFile) {
      console.error("[parse-anki-apkg] Nenhum arquivo de banco de dados encontrado");
      const fileList = Object.keys(zip.files).join(', ');
      return new Response(
        JSON.stringify({ 
          error: "Arquivo collection.anki2 não encontrado no APKG",
          details: `Arquivos no ZIP: ${fileList}`
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extrair banco SQLite para arquivo temporário
    const dbData = await dbFile.async("uint8array");
    console.log(`[parse-anki-apkg] Banco SQLite extraído: ${dbData.length} bytes`);

    // Salvar em arquivo temporário
    const tempPath = `/tmp/anki_${Date.now()}.db`;
    await Deno.writeFile(tempPath, dbData);
    console.log(`[parse-anki-apkg] Banco salvo em: ${tempPath}`);

    // Abrir banco de dados com sqlite nativo do Deno
    const db = new DB(tempPath, { mode: "read" });

    // Extrair cards da tabela notes
    const cards: AnkiCard[] = [];
    
    try {
      // Query para obter notas (cards)
      const rows = db.query<[string, string]>(`
        SELECT flds, tags 
        FROM notes 
        ORDER BY id
        LIMIT 10000
      `);

      console.log(`[parse-anki-apkg] Query executada, processando resultados...`);
      
      let count = 0;
      for (const [flds, tags] of rows) {
        const { front, back } = parseAnkiFields(flds);
        
        if (front && back && front !== back) {
          cards.push({
            question: front.slice(0, 2000), // Limitar tamanho
            answer: back.slice(0, 5000),
            tags: tags ? tags.trim().split(' ').filter(Boolean) : undefined,
          });
          count++;
        }
      }
      
      console.log(`[parse-anki-apkg] ${count} cards extraídos`);
      
    } catch (sqlError) {
      console.error("[parse-anki-apkg] Erro SQL:", sqlError);
      
      // Tentar query alternativa (sem tags)
      try {
        const rows = db.query<[string]>(`SELECT flds FROM notes LIMIT 10000`);
        for (const [flds] of rows) {
          const { front, back } = parseAnkiFields(flds);
          if (front && back) {
            cards.push({ question: front.slice(0, 2000), answer: back.slice(0, 5000) });
          }
        }
        console.log(`[parse-anki-apkg] Fallback: ${cards.length} cards extraídos`);
      } catch (fallbackError) {
        console.error("[parse-anki-apkg] Fallback também falhou:", fallbackError);
      }
    }

    // Fechar banco e limpar arquivo temporário
    db.close();
    try {
      await Deno.remove(tempPath);
    } catch (e) {
      console.warn("[parse-anki-apkg] Não foi possível remover arquivo temporário:", e);
    }

    if (cards.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhum flashcard encontrado no arquivo APKG" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[parse-anki-apkg] ${cards.length} flashcards extraídos com sucesso`);

    // Retornar cards parseados
    return new Response(
      JSON.stringify({
        success: true,
        cards,
        total: cards.length,
        message: `${cards.length} flashcards extraídos do arquivo Anki`,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("[parse-anki-apkg] Erro:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erro ao processar arquivo APKG",
        details: String(error)
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
