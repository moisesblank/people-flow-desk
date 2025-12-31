// ============================================
// 🧠 PARSE ANKI APKG - Edge Function
// Processa arquivos .apkg (formato Anki) e extrai flashcards
// APKG = ZIP contendo SQLite com cards
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import JSZip from "https://esm.sh/jszip@3.10.1";
import initSqlJs from "https://esm.sh/sql.js@1.9.0";

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
    const lessonId = formData.get("lesson_id") as string | null;

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

    // Procurar o banco SQLite (collection.anki2)
    let dbFile: JSZip.JSZipObject | null = null;
    
    for (const [filename, zipObject] of Object.entries(zip.files)) {
      console.log(`[parse-anki-apkg] Arquivo no ZIP: ${filename}`);
      if (filename.endsWith('.anki2') || filename === 'collection.anki2') {
        dbFile = zipObject;
        break;
      }
    }

    if (!dbFile) {
      // Tentar encontrar qualquer arquivo que possa ser SQLite
      for (const [filename, zipObject] of Object.entries(zip.files)) {
        if (!zipObject.dir && !filename.includes('media')) {
          dbFile = zipObject;
          console.log(`[parse-anki-apkg] Usando arquivo alternativo: ${filename}`);
          break;
        }
      }
    }

    if (!dbFile) {
      return new Response(
        JSON.stringify({ error: "Arquivo collection.anki2 não encontrado no APKG" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extrair banco SQLite
    const dbData = await dbFile.async("uint8array");
    console.log(`[parse-anki-apkg] Banco SQLite extraído: ${dbData.length} bytes`);

    // Inicializar SQL.js
    const SQL = await initSqlJs({
      locateFile: (file: string) => `https://sql.js.org/dist/${file}`
    });

    // Carregar banco de dados
    const db = new SQL.Database(dbData);

    // Extrair cards da tabela notes
    const cards: AnkiCard[] = [];
    
    try {
      // Query para obter notas (cards)
      const result = db.exec(`
        SELECT n.flds, n.tags 
        FROM notes n 
        ORDER BY n.id
        LIMIT 10000
      `);

      if (result.length > 0) {
        const rows = result[0].values;
        console.log(`[parse-anki-apkg] Encontrados ${rows.length} cards`);

        for (const row of rows) {
          const flds = row[0] as string;
          const tags = row[1] as string;

          const { front, back } = parseAnkiFields(flds);
          
          if (front && back && front !== back) {
            cards.push({
              question: front.slice(0, 2000), // Limitar tamanho
              answer: back.slice(0, 5000),
              tags: tags ? tags.trim().split(' ').filter(Boolean) : undefined,
            });
          }
        }
      }
    } catch (sqlError) {
      console.error("[parse-anki-apkg] Erro SQL:", sqlError);
      
      // Tentar query alternativa
      try {
        const result = db.exec(`SELECT flds FROM notes LIMIT 10000`);
        if (result.length > 0) {
          for (const row of result[0].values) {
            const { front, back } = parseAnkiFields(row[0] as string);
            if (front && back) {
              cards.push({ question: front, answer: back });
            }
          }
        }
      } catch (fallbackError) {
        console.error("[parse-anki-apkg] Fallback também falhou:", fallbackError);
      }
    }

    db.close();

    if (cards.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhum flashcard encontrado no arquivo APKG" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[parse-anki-apkg] ${cards.length} flashcards extraídos com sucesso`);

    // Retornar cards parseados (não inserir ainda - deixar o frontend decidir)
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
