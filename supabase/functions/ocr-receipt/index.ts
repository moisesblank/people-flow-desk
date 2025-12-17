// ============================================
// SYNAPSE v14.0 - OCR PARA COMPROVANTES
// Extração automática de dados via AI
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OCRResult {
  amount: number | null;
  date: string | null;
  vendor: string | null;
  category: string | null;
  confidence: number;
  raw_text: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization required');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid authentication');
    }

    const body = await req.json();
    const { image_url, image_base64, extraction_id } = body;

    if (!image_url && !image_base64) {
      throw new Error('image_url or image_base64 is required');
    }

    // Prepare image for AI analysis
    let imageContent;
    if (image_base64) {
      imageContent = image_base64;
    } else if (image_url) {
      // Fetch image and convert to base64
      const imageResponse = await fetch(image_url);
      const imageBuffer = await imageResponse.arrayBuffer();
      imageContent = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
    }

    // Use Lovable AI to extract receipt data
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em extração de dados de comprovantes e recibos.
Analise a imagem fornecida e extraia:
- Valor total (em reais, formato numérico sem R$)
- Data da transação (formato YYYY-MM-DD)
- Nome do estabelecimento/vendedor
- Categoria sugerida (alimentação, transporte, compras, serviços, outros)

Responda APENAS em JSON válido com esta estrutura:
{
  "amount": number ou null,
  "date": "YYYY-MM-DD" ou null,
  "vendor": "nome" ou null,
  "category": "categoria" ou null,
  "confidence": 0.0 a 1.0,
  "raw_text": "texto extraído resumido"
}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extraia os dados deste comprovante/recibo:'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageContent}`
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.1
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI response error:', errorText);
      throw new Error('Failed to process image with AI');
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || '';

    // Parse AI response
    let ocrResult: OCRResult;
    try {
      // Extract JSON from response
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        ocrResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      ocrResult = {
        amount: null,
        date: null,
        vendor: null,
        category: 'outros',
        confidence: 0,
        raw_text: aiContent.substring(0, 500)
      };
    }

    // Update extraction record if provided
    if (extraction_id) {
      await supabase
        .from('receipt_ocr_extractions')
        .update({
          extracted_data: ocrResult,
          amount_detected: ocrResult.amount,
          date_detected: ocrResult.date,
          vendor_detected: ocrResult.vendor,
          category_suggested: ocrResult.category,
          confidence_score: ocrResult.confidence,
          status: 'completed',
          processed_at: new Date().toISOString()
        })
        .eq('id', extraction_id);
    }

    // Log the extraction
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'ocr_extraction',
      metadata: {
        extraction_id,
        confidence: ocrResult.confidence,
        amount_detected: ocrResult.amount,
        vendor_detected: ocrResult.vendor
      }
    });

    return new Response(JSON.stringify({
      success: true,
      data: ocrResult,
      message: 'Receipt data extracted successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('OCR error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
