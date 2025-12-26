// ============================================
// 🚨 WEBHOOK-RECEIVER → DEPRECADO → 410 GONE
// FASE 2 LEI VI: Endpoint único = webhook-handler
// Use: /functions/v1/webhook-handler
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

  console.log('[webhook-receiver] 🚨 DEPRECATED - Endpoint desativado. Use webhook-handler.');
  
  return new Response(
    JSON.stringify({
      error: 'Este endpoint foi descontinuado',
      code: 'ENDPOINT_DEPRECATED',
      message: 'Por favor, atualize sua integração para usar o endpoint único: /functions/v1/webhook-handler',
      migration: {
        old_endpoint: '/functions/v1/webhook-receiver',
        new_endpoint: '/functions/v1/webhook-handler',
        documentation: 'https://docs.moisesmedeiros.com.br/webhooks'
      },
      timestamp: new Date().toISOString()
    }),
    { 
      status: 410,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-Deprecated-Since': '2025-12-25',
        'X-Migration-Target': '/functions/v1/webhook-handler'
      } 
    }
  );
});
