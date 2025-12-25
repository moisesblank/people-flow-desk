// ============================================
// 🛡️ P1.1 FIX: ENDPOINT LEGADO DESATIVADO
// Use secure-webhook-ultra
// Status: 410 Gone
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('[secure-webhook] ⚠️ ENDPOINT LEGADO - Retornando 410 Gone');
  
  return new Response(
    JSON.stringify({
      error: 'Endpoint desativado',
      message: 'Este endpoint foi descontinuado. Use secure-webhook-ultra.',
      migration: 'Configure seu webhook para apontar para /functions/v1/secure-webhook-ultra',
      status: 'gone'
    }),
    { 
      status: 410, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
});
