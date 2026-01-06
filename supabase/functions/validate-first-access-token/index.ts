// ============================================
// 🔐 validate-first-access-token
// Valida e consome token de primeiro acesso
// Token NUNCA expira até ser usado (CONSTITUIÇÃO v10.x)
// ============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidateTokenPayload {
  token: string;
  consume?: boolean; // Se true, marca como usado
}

interface ValidateTokenResponse {
  valid: boolean;
  user_id?: string;
  email?: string;
  nome?: string;
  role?: string;
  error?: string;
  already_used?: boolean;
  temp_password?: string; // Senha temporária para login automático
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('[validate-first-access-token] ========== REQUEST ==========');

  try {
    const payload: ValidateTokenPayload = await req.json();

    if (!payload.token || typeof payload.token !== 'string') {
      return new Response(
        JSON.stringify({ valid: false, error: 'Token inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Buscar token no banco
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('first_access_tokens')
      .select('*')
      .eq('token', payload.token)
      .maybeSingle();

    if (tokenError || !tokenData) {
      console.warn('[validate-first-access-token] Token not found:', payload.token.substring(0, 8) + '...');
      return new Response(
        JSON.stringify({ valid: false, error: 'Token não encontrado ou inválido' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se já foi usado
    if (tokenData.is_used) {
      console.log('[validate-first-access-token] Token already used:', tokenData.email);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Este link já foi utilizado. Faça login normalmente.',
          already_used: true,
          email: tokenData.email,
        }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[validate-first-access-token] ✅ Token válido para:', tokenData.email);

    // Se consume = true, marcar como usado e gerar senha temporária
    let tempPassword: string | undefined;
    
    if (payload.consume) {
      console.log('[validate-first-access-token] Consuming token...');
      
      // Marcar token como usado
      await supabaseAdmin
        .from('first_access_tokens')
        .update({ 
          is_used: true, 
          used_at: new Date().toISOString() 
        })
        .eq('id', tokenData.id);
      
      // Gerar senha temporária para auto-login
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
      tempPassword = Array.from(
        { length: 24 }, 
        () => chars[Math.floor(Math.random() * chars.length)]
      ).join('');
      
      // Atualizar senha do usuário para permitir auto-login
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        tokenData.user_id,
        { password: tempPassword }
      );
      
      if (updateError) {
        console.error('[validate-first-access-token] Failed to set temp password:', updateError);
      } else {
        console.log('[validate-first-access-token] ✅ Temp password set for auto-login');
      }
      
      // Garantir que password_change_required está true
      await supabaseAdmin
        .from('profiles')
        .update({ password_change_required: true })
        .eq('id', tokenData.user_id);
      
      console.log('[validate-first-access-token] ✅ Token consumed successfully');
    }

    const response: ValidateTokenResponse = {
      valid: true,
      user_id: tokenData.user_id,
      email: tokenData.email,
      nome: tokenData.metadata?.nome,
      role: tokenData.metadata?.role,
      temp_password: tempPassword,
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[validate-first-access-token] ❌ Error:', error);
    return new Response(
      JSON.stringify({ valid: false, error: 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
