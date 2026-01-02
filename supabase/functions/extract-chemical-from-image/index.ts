import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * PERMANENT CHEMICAL DATA EXTRACTION AND NORMALIZATION POLICY v1.0
 * 
 * This Edge Function analyzes images for chemically relevant information and
 * extracts it as structured text following official chemical formatting standards.
 * 
 * Chemical data to extract:
 * - Molar masses (g/mol)
 * - Atomic numbers (Z)
 * - Chemical groups or families
 * - Chemical reactions or equations
 * - Reaction conditions
 * - Alternative options (A, B, C, D, E) presented in image form
 */

interface ExtractedChemicalData {
  hasChemicalContent: boolean;
  equations: string[];
  molarMasses: { element: string; mass: string }[];
  atomicNumbers: { element: string; z: number; group?: string }[];
  reactionConditions: string[];
  alternativeOptions: { letter: string; content: string }[];
  rawExtractedText: string;
  formattedOutput: string;
  confidence: number;
}

// Chemical formatting rules
function formatChemicalFormula(formula: string): string {
  // Subscripts for numbers after elements
  let result = formula
    .replace(/(\d+)/g, (match) => {
      const subscripts = '₀₁₂₃₄₅₆₇₈₉';
      return match.split('').map(d => subscripts[parseInt(d)]).join('');
    });
  
  // Handle charges (e.g., 2+ becomes ²⁺)
  result = result
    .replace(/(\d*)\+/g, (_, num) => {
      const superscripts = '⁰¹²³⁴⁵⁶⁷⁸⁹';
      const numStr = num ? num.split('').map((d: string) => superscripts[parseInt(d)]).join('') : '';
      return numStr + '⁺';
    })
    .replace(/(\d*)-/g, (_, num) => {
      const superscripts = '⁰¹²³⁴⁵⁶⁷⁸⁹';
      const numStr = num ? num.split('').map((d: string) => superscripts[parseInt(d)]).join('') : '';
      return numStr + '⁻';
    });
  
  // Physical states
  result = result
    .replace(/\(s\)/g, '₍ₛ₎')
    .replace(/\(l\)/g, '₍ₗ₎')
    .replace(/\(g\)/g, '₍g₎')
    .replace(/\(aq\)/g, '₍ₐq₎');
  
  // Arrows
  result = result
    .replace(/->/g, '→')
    .replace(/<->/g, '⇌')
    .replace(/<=>/g, '⇌');
  
  return result;
}

function formatAtomicNotation(z: number, symbol: string, group?: string): string {
  const subscripts = '₀₁₂₃₄₅₆₇₈₉';
  const zSubscript = z.toString().split('').map(d => subscripts[parseInt(d)]).join('');
  let result = `${zSubscript}${symbol}`;
  if (group) {
    result += ` (grupo ${group})`;
  }
  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, imageBase64, questionId } = await req.json();

    if (!imageUrl && !imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Image URL or base64 required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Prepare image content for vision model
    const imageContent = imageBase64 
      ? { type: "image_url", image_url: { url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/png;base64,${imageBase64}` } }
      : { type: "image_url", image_url: { url: imageUrl } };

    const systemPrompt = `You are a specialized chemistry data extraction system. Your task is to analyze images and extract ALL chemically relevant information.

EXTRACTION RULES:
1. Extract ALL chemical equations exactly as shown
2. Extract ALL molar masses with units (g/mol)
3. Extract ALL atomic numbers (Z) and element groups
4. Extract reaction conditions (temperature, pressure, catalysts)
5. If the image shows multiple choice options (A, B, C, D, E), extract each option's chemical content
6. Preserve stoichiometric coefficients
7. Note physical states if shown (s, l, g, aq)

OUTPUT FORMAT (JSON):
{
  "hasChemicalContent": true/false,
  "equations": ["equation1", "equation2"],
  "molarMasses": [{"element": "H", "mass": "1 g/mol"}],
  "atomicNumbers": [{"element": "S", "z": 16, "group": "16"}],
  "reactionConditions": ["condition1"],
  "alternativeOptions": [{"letter": "A", "content": "chemical content"}],
  "rawExtractedText": "all text visible in image",
  "confidence": 0.95
}

IMPORTANT:
- If no chemical content is found, set hasChemicalContent to false
- Extract equations in standard format: reactants -> products
- Use standard chemical notation (H2O, CO2, etc.)
- Be precise with coefficients and subscripts`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: [
              { type: 'text', text: 'Analyze this image and extract all chemically relevant information. Return ONLY valid JSON.' },
              imageContent
            ]
          }
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || '';
    
    console.log('AI raw response:', content);

    // Parse JSON from response
    let extractedData: ExtractedChemicalData;
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                        content.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, content];
      const jsonStr = jsonMatch[1] || content;
      extractedData = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      extractedData = {
        hasChemicalContent: false,
        equations: [],
        molarMasses: [],
        atomicNumbers: [],
        reactionConditions: [],
        alternativeOptions: [],
        rawExtractedText: content,
        formattedOutput: '',
        confidence: 0,
      };
    }

    // Format extracted data according to chemical standards
    let formattedOutput = '';
    
    if (extractedData.hasChemicalContent) {
      const parts: string[] = [];

      // Format equations
      if (extractedData.equations?.length > 0) {
        const formattedEquations = extractedData.equations.map(eq => formatChemicalFormula(eq));
        parts.push(`**Equações químicas:**\n${formattedEquations.join('\n')}`);
      }

      // Format atomic numbers
      if (extractedData.atomicNumbers?.length > 0) {
        const formattedAtoms = extractedData.atomicNumbers.map(a => 
          formatAtomicNotation(a.z, a.element, a.group)
        );
        parts.push(`**Dados atômicos:** ${formattedAtoms.join('; ')}`);
      }

      // Format molar masses
      if (extractedData.molarMasses?.length > 0) {
        const formattedMasses = extractedData.molarMasses.map(m => 
          `${m.element}: ${m.mass}`
        );
        parts.push(`**Massas molares:** ${formattedMasses.join('; ')}`);
      }

      // Format reaction conditions
      if (extractedData.reactionConditions?.length > 0) {
        parts.push(`**Condições de reação:** ${extractedData.reactionConditions.join('; ')}`);
      }

      // Format alternative options
      if (extractedData.alternativeOptions?.length > 0) {
        const formattedOptions = extractedData.alternativeOptions.map(opt => 
          `${opt.letter}) ${formatChemicalFormula(opt.content)}`
        );
        parts.push(`**Alternativas:**\n${formattedOptions.join('\n')}`);
      }

      formattedOutput = parts.join('\n\n');
    }

    extractedData.formattedOutput = formattedOutput;

    console.log('Extracted chemical data:', JSON.stringify(extractedData, null, 2));

    return new Response(
      JSON.stringify({
        success: true,
        questionId,
        extractedData,
        formattedOutput,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error extracting chemical data:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
