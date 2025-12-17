// ============================================
// EXTRAÇÃO DE DOCUMENTOS COM IA
// Suporta: PDF, Word, Excel, PowerPoint, TXT, Imagens
// Usa Lovable AI (Gemini) para extração inteligente
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId, fileUrl, fileName, fileType } = await req.json();

    if (!documentId || !fileUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'documentId e fileUrl são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY não configurada');
      return new Response(
        JSON.stringify({ success: false, error: 'Configuração de IA não encontrada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Atualizar status para "processing"
    await supabase
      .from('general_documents')
      .update({ extraction_status: 'processing' })
      .eq('id', documentId);

    console.log(`Processando documento: ${fileName} (${fileType})`);

    // Determinar tipo de análise baseado no arquivo
    let analysisPrompt = '';
    const isImage = fileType.startsWith('image/');
    const isPdf = fileType === 'application/pdf';
    const isSpreadsheet = fileType.includes('spreadsheet') || fileType.includes('excel') || fileType.includes('csv');
    const isPresentation = fileType.includes('presentation') || fileType.includes('powerpoint');
    const isWord = fileType.includes('document') || fileType.includes('word');
    const isText = fileType.includes('text') || fileName.endsWith('.txt');

    if (isImage) {
      analysisPrompt = `Analise esta imagem em detalhes. Extraia:
1. Todo texto visível (OCR)
2. Descrição do conteúdo visual
3. Informações importantes identificadas
4. Se for um documento escaneado, extraia todo o conteúdo textual

Responda em português brasileiro de forma estruturada.`;
    } else if (isPdf || isWord) {
      analysisPrompt = `Analise este documento e extraia:
1. Título e assunto principal
2. Todo o conteúdo textual relevante
3. Resumo executivo (se aplicável)
4. Dados importantes (datas, valores, nomes)
5. Estrutura do documento

Responda em português brasileiro de forma organizada.`;
    } else if (isSpreadsheet) {
      analysisPrompt = `Analise esta planilha e extraia:
1. Estrutura das colunas/campos
2. Dados principais
3. Totais e cálculos importantes
4. Tendências identificadas
5. Resumo dos dados

Responda em português brasileiro de forma tabular quando possível.`;
    } else if (isPresentation) {
      analysisPrompt = `Analise esta apresentação e extraia:
1. Título e tema principal
2. Principais pontos de cada slide
3. Resumo executivo do conteúdo
4. Dados e estatísticas apresentados
5. Conclusões/call-to-action

Responda em português brasileiro de forma estruturada.`;
    } else if (isText) {
      analysisPrompt = `Analise este arquivo de texto e extraia:
1. Conteúdo completo
2. Resumo do assunto
3. Pontos-chave identificados
4. Estrutura do texto

Responda em português brasileiro.`;
    } else {
      analysisPrompt = `Analise este arquivo (${fileName}) e extraia todas as informações relevantes que puder identificar. Responda em português brasileiro de forma estruturada.`;
    }

    // Preparar mensagem para a IA
    const messages: any[] = [
      {
        role: "system",
        content: `Você é um assistente especializado em análise e extração de documentos. 
Extraia informações de forma precisa e estruturada.
Sempre responda em português brasileiro.
Se não conseguir acessar ou processar o arquivo, informe claramente.`
      }
    ];

    // Para imagens, usar visão multimodal
    if (isImage) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: analysisPrompt },
          { type: "image_url", image_url: { url: fileUrl } }
        ]
      });
    } else {
      // Para outros arquivos, enviar URL e pedir análise
      messages.push({
        role: "user",
        content: `${analysisPrompt}\n\nArquivo: ${fileName}\nTipo: ${fileType}\nURL: ${fileUrl}\n\nPor favor, analise o conteúdo deste documento.`
      });
    }

    console.log('Enviando para Lovable AI...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: isImage ? 'google/gemini-2.5-pro' : 'google/gemini-2.5-flash',
        messages,
        max_tokens: 4000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Erro da API:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        await supabase
          .from('general_documents')
          .update({ extraction_status: 'rate_limited' })
          .eq('id', documentId);
        return new Response(
          JSON.stringify({ success: false, error: 'Limite de requisições excedido. Tente novamente em alguns minutos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        await supabase
          .from('general_documents')
          .update({ extraction_status: 'credits_required' })
          .eq('id', documentId);
        return new Response(
          JSON.stringify({ success: false, error: 'Créditos de IA esgotados.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`API error: ${aiResponse.status}`);
    }

    const data = await aiResponse.json();
    const extractedContent = data.choices?.[0]?.message?.content || '';

    console.log('Extração concluída, salvando...');

    // Salvar conteúdo extraído
    const { error: updateError } = await supabase
      .from('general_documents')
      .update({
        extracted_content: extractedContent,
        extraction_status: 'completed',
        extraction_date: new Date().toISOString(),
        extraction_model: isImage ? 'gemini-2.5-pro' : 'gemini-2.5-flash'
      })
      .eq('id', documentId);

    if (updateError) {
      console.error('Erro ao salvar:', updateError);
      throw updateError;
    }

    console.log('Documento processado com sucesso!');

    return new Response(
      JSON.stringify({
        success: true,
        extractedContent,
        model: isImage ? 'gemini-2.5-pro' : 'gemini-2.5-flash'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na extração:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
