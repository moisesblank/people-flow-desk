// ============================================
// 📚 GENERATE-BOOK-TOC
// Geração Inteligente de Sumário para Livros-Web
// Usa IA para detectar capítulos quando PDF não tem outline
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TocItem {
  title: string;
  pageNumber: number;
  level: number;
  children?: TocItem[];
}

interface GenerateTocRequest {
  bookId?: string;        // Processar um livro específico
  batchProcess?: boolean; // Processar todos os livros
  forceRegenerate?: boolean; // Forçar regeneração mesmo se já tiver sumário
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    // Autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar se é owner/admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    const isOwnerOrAdmin = user.email === 'moisesblank@gmail.com' || 
                           roleData?.role === 'owner' || 
                           roleData?.role === 'admin';
    
    if (!isOwnerOrAdmin) {
      return new Response(
        JSON.stringify({ error: 'Acesso negado - apenas owner/admin' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: GenerateTocRequest = await req.json();
    const { bookId, batchProcess, forceRegenerate } = body;

    console.log(`[generate-book-toc] Iniciando - bookId: ${bookId}, batch: ${batchProcess}, force: ${forceRegenerate}`);

    // Buscar livros para processar
    let query = supabase
      .from('web_books')
      .select('id, title, original_path, original_bucket, content_structure, total_pages, status')
      .eq('status', 'ready');
    
    if (bookId) {
      query = query.eq('id', bookId);
    }
    
    if (!forceRegenerate) {
      // Apenas livros sem sumário ou com sumário vazio
      query = query.or('content_structure.is.null,content_structure.eq.[]');
    }

    const { data: books, error: booksError } = await query;
    
    if (booksError) {
      throw new Error(`Erro ao buscar livros: ${booksError.message}`);
    }

    if (!books || books.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nenhum livro para processar',
          processed: 0,
          skipped: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[generate-book-toc] ${books.length} livros para processar`);

    const results = {
      processed: 0,
      success: 0,
      failed: 0,
      skipped: 0,
      details: [] as { bookId: string; title: string; status: string; chapters: number; error?: string }[]
    };

    // Processar cada livro
    for (const book of books) {
      try {
        console.log(`[generate-book-toc] Processando: ${book.title} (${book.id})`);
        
        // Buscar páginas do livro para análise
        const { data: pages, error: pagesError } = await supabase
          .from('web_book_pages')
          .select('page_number, chapter_title, section_title, ocr_text')
          .eq('book_id', book.id)
          .order('page_number', { ascending: true });

        if (pagesError) {
          throw new Error(`Erro ao buscar páginas: ${pagesError.message}`);
        }

        // Gerar sumário inteligente
        const toc = await generateIntelligentToc(book, pages || [], supabase);
        
        if (toc.length === 0) {
          console.log(`[generate-book-toc] Nenhum capítulo detectado para: ${book.title}`);
          results.skipped++;
          results.details.push({
            bookId: book.id,
            title: book.title,
            status: 'skipped',
            chapters: 0
          });
          continue;
        }

        // Salvar sumário no banco
        const { error: updateError } = await supabase
          .from('web_books')
          .update({ 
            content_structure: toc,
            updated_at: new Date().toISOString()
          })
          .eq('id', book.id);

        if (updateError) {
          throw new Error(`Erro ao salvar sumário: ${updateError.message}`);
        }

        console.log(`[generate-book-toc] ✅ Sumário gerado para ${book.title}: ${toc.length} capítulos`);
        
        results.success++;
        results.details.push({
          bookId: book.id,
          title: book.title,
          status: 'success',
          chapters: toc.length
        });

      } catch (bookError) {
        console.error(`[generate-book-toc] ❌ Erro em ${book.title}:`, bookError);
        results.failed++;
        results.details.push({
          bookId: book.id,
          title: book.title,
          status: 'error',
          chapters: 0,
          error: bookError instanceof Error ? bookError.message : 'Erro desconhecido'
        });
      }

      results.processed++;
    }

    const duration = Date.now() - startTime;
    console.log(`[generate-book-toc] Concluído em ${duration}ms - ${results.success}/${results.processed} sucesso`);

    return new Response(
      JSON.stringify({
        message: `Processamento concluído: ${results.success} sucesso, ${results.failed} falhas, ${results.skipped} ignorados`,
        processed: results.processed,
        success_count: results.success,
        failed_count: results.failed,
        skipped: results.skipped,
        details: results.details,
        duration_ms: duration
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[generate-book-toc] Erro geral:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro interno',
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ============================================
// GERAÇÃO INTELIGENTE DE SUMÁRIO
// ============================================

async function generateIntelligentToc(
  book: any, 
  pages: any[], 
  supabase: any
): Promise<TocItem[]> {
  const toc: TocItem[] = [];
  
  // MÉTODO 1: Usar chapter_title das páginas processadas
  const chaptersFromPages = extractChaptersFromPages(pages);
  if (chaptersFromPages.length > 0) {
    console.log(`[TOC] Método 1 (páginas): ${chaptersFromPages.length} capítulos`);
    return chaptersFromPages;
  }

  // MÉTODO 2: Detectar padrões no texto OCR
  const chaptersFromOcr = detectChaptersFromOcr(pages);
  if (chaptersFromOcr.length > 0) {
    console.log(`[TOC] Método 2 (OCR): ${chaptersFromOcr.length} capítulos`);
    return chaptersFromOcr;
  }

  // MÉTODO 3: Usar IA para análise semântica (se tiver texto)
  const hasOcrText = pages.some(p => p.ocr_text && p.ocr_text.length > 50);
  if (hasOcrText) {
    const chaptersFromAI = await detectChaptersWithAI(pages, book.title, supabase);
    if (chaptersFromAI.length > 0) {
      console.log(`[TOC] Método 3 (IA): ${chaptersFromAI.length} capítulos`);
      return chaptersFromAI;
    }
  }

  // MÉTODO 4: Gerar seções automáticas baseadas no número de páginas
  const autoSections = generateAutoSections(book.total_pages || pages.length);
  console.log(`[TOC] Método 4 (auto): ${autoSections.length} seções`);
  
  return autoSections;
}

// ============================================
// MÉTODO 1: Extrair de páginas processadas
// ============================================

function extractChaptersFromPages(pages: any[]): TocItem[] {
  const chapters: TocItem[] = [];
  
  for (const page of pages) {
    if (page.chapter_title && page.chapter_title.trim()) {
      // Verificar se já existe (evitar duplicatas)
      const exists = chapters.some(c => c.title === page.chapter_title);
      if (!exists) {
        chapters.push({
          title: page.chapter_title.trim(),
          pageNumber: page.page_number,
          level: 0
        });
      }
    }
  }
  
  return chapters;
}

// ============================================
// MÉTODO 2: Detectar padrões no OCR
// ============================================

function detectChaptersFromOcr(pages: any[]): TocItem[] {
  const chapters: TocItem[] = [];
  
  // Padrões comuns de títulos de capítulos
  const patterns = [
    /^(Capítulo|CAPÍTULO)\s+(\d+)[:\.\s\-–—]*(.+)?$/im,
    /^(Cap\.?|CAP\.?)\s+(\d+)[:\.\s\-–—]*(.+)?$/im,
    /^(Unidade|UNIDADE)\s+(\d+)[:\.\s\-–—]*(.+)?$/im,
    /^(Módulo|MÓDULO)\s+(\d+)[:\.\s\-–—]*(.+)?$/im,
    /^(Parte|PARTE)\s+(\d+|[IVX]+)[:\.\s\-–—]*(.+)?$/im,
    /^(\d+)\s*[–\-\.]\s*([A-Z][A-Za-zÀ-ú\s]{5,})$/m, // "1 - Introdução à Química"
    /^(INTRODUÇÃO|CONCLUSÃO|REFERÊNCIAS|BIBLIOGRAFIA|ÍNDICE|PREFÁCIO)$/im,
  ];

  for (const page of pages) {
    if (!page.ocr_text) continue;
    
    // Pegar primeiras linhas da página (onde títulos costumam estar)
    const firstLines = page.ocr_text.split('\n').slice(0, 10).join('\n');
    
    for (const pattern of patterns) {
      const match = firstLines.match(pattern);
      if (match) {
        let title = '';
        
        if (match[3]) {
          // Padrão com número e título
          title = `${match[1]} ${match[2]} - ${match[3]}`.trim();
        } else if (match[2] && match[1]) {
          title = `${match[1]} ${match[2]}`.trim();
        } else if (match[1]) {
          title = match[1].trim();
        }
        
        if (title && title.length > 2) {
          // Verificar se já existe
          const exists = chapters.some(c => 
            c.title.toLowerCase() === title.toLowerCase() || 
            c.pageNumber === page.page_number
          );
          
          if (!exists) {
            chapters.push({
              title: title,
              pageNumber: page.page_number,
              level: 0
            });
            break; // Só um título por página
          }
        }
      }
    }
  }
  
  return chapters;
}

// ============================================
// MÉTODO 3: Usar IA para análise semântica
// ============================================

async function detectChaptersWithAI(pages: any[], bookTitle: string, supabase: any): Promise<TocItem[]> {
  try {
    // Coletar texto das primeiras linhas de cada página
    const pagesSummary = pages
      .filter(p => p.ocr_text && p.ocr_text.length > 20)
      .slice(0, 50) // Limitar para não exceder tokens
      .map(p => ({
        page: p.page_number,
        text: p.ocr_text.split('\n').slice(0, 5).join(' ').substring(0, 200)
      }));

    if (pagesSummary.length === 0) {
      return [];
    }

    // Preparar prompt para IA
    const prompt = `Analise o texto de um livro de Química chamado "${bookTitle}" e identifique os capítulos/seções principais.

Texto das páginas (página: texto inicial):
${pagesSummary.map(p => `[P${p.page}] ${p.text}`).join('\n')}

Retorne um JSON array com os capítulos detectados no formato:
[{"title": "Nome do Capítulo", "pageNumber": 1, "level": 0}]

Apenas capítulos/seções principais, não listas ou parágrafos. Se não detectar capítulos claros, retorne [].`;

    // Chamar IA via sna-gateway ou modelo disponível
    const aiResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/ia-gateway`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gemini-2.5-flash-lite',
        prompt,
        maxTokens: 2000,
        temperature: 0.3
      })
    });

    if (!aiResponse.ok) {
      console.warn('[TOC-AI] IA gateway não disponível, pulando método 3');
      return [];
    }

    const aiResult = await aiResponse.json();
    const content = aiResult.content || aiResult.text || '';
    
    // Extrair JSON da resposta
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const chapters = JSON.parse(jsonMatch[0]);
      return chapters.filter((c: any) => c.title && c.pageNumber && typeof c.pageNumber === 'number');
    }

    return [];
  } catch (error) {
    console.warn('[TOC-AI] Erro na detecção por IA:', error);
    return [];
  }
}

// ============================================
// MÉTODO 4: Seções automáticas
// ============================================

function generateAutoSections(totalPages: number): TocItem[] {
  const sections: TocItem[] = [];
  
  if (totalPages <= 0) return sections;
  
  // Sempre incluir início
  sections.push({
    title: '📖 Início',
    pageNumber: 1,
    level: 0
  });

  if (totalPages >= 10) {
    // Para livros maiores, criar seções proporcionais
    const sectionSize = Math.ceil(totalPages / 5);
    
    if (totalPages >= 20) {
      sections.push({
        title: '📚 Primeira Parte',
        pageNumber: sectionSize,
        level: 0
      });
    }
    
    if (totalPages >= 40) {
      sections.push({
        title: '📖 Desenvolvimento',
        pageNumber: Math.floor(totalPages * 0.4),
        level: 0
      });
    }
    
    if (totalPages >= 60) {
      sections.push({
        title: '📝 Segunda Parte',
        pageNumber: Math.floor(totalPages * 0.6),
        level: 0
      });
    }
    
    // Parte final
    if (totalPages >= 30) {
      sections.push({
        title: '🎯 Conclusão',
        pageNumber: Math.floor(totalPages * 0.85),
        level: 0
      });
    }
  }
  
  return sections;
}
