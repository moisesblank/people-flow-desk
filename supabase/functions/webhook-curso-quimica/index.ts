// ============================================
// 🛡️ P1.1 FIX: ENDPOINT LEGADO DESATIVADO
// Use hotmart-fast ou webhook-handler
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

  console.log('[webhook-curso-quimica] ⚠️ ENDPOINT LEGADO - Retornando 410 Gone');
  
  return new Response(
    JSON.stringify({
      error: 'Endpoint desativado',
      message: 'Este endpoint foi descontinuado. Use hotmart-fast ou webhook-handler.',
      migration: 'Configure seu webhook Hotmart para apontar para /functions/v1/hotmart-fast',
      status: 'gone'
    }),
    { 
      status: 410, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
});
