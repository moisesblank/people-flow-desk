// ============================================
// 🛡️ BLOCO 5: REVOKE DEVICE - Revoga dispositivo E sessões associadas
// Garante que aparelho revogado = sessão invalidada imediatamente
// ============================================

import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/corsConfig.ts";

interface RevokeDeviceRequest {
  deviceId: string;
  reason?: string;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return handleCorsOptions(req);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 🔐 AUTENTICAÇÃO OBRIGATÓRIA
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'AUTH_REQUIRED' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'INVALID_TOKEN' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    const body = await req.json();
    
    // 🔐 AÇÃO: Security Lockdown (revogar TODOS os dispositivos)
    if (body.action === 'security_lockdown') {
      console.log(`[revoke-device] 🚨 SECURITY LOCKDOWN para usuário ${userId}...`);
      
      // Revogar TODOS os dispositivos
      const { data: revokedDevices, error: revokeAllError } = await supabase
        .from('user_devices')
        .update({
          is_active: false,
          deactivated_at: new Date().toISOString(),
          deactivated_by: userId,
          revoked_reason: 'security_lockdown',
        })
        .eq('user_id', userId)
        .eq('is_active', true)
        .select('id');
      
      const devicesRevoked = revokedDevices?.length || 0;
      
      // Revogar TODAS as sessões
      const { data: revokedSessions } = await supabase
        .from('active_sessions')
        .update({
          status: 'revoked',
          revoked_at: new Date().toISOString(),
          revoked_reason: 'security_lockdown',
        })
        .eq('user_id', userId)
        .eq('status', 'active')
        .select('id');
      
      const sessionsRevoked = revokedSessions?.length || 0;
      
      // Registrar evento de segurança
      await supabase.from('security_events').insert({
        user_id: userId,
        event_type: 'SECURITY_LOCKDOWN_TRIGGERED',
        severity: 'critical',
        description: `Lockdown de segurança: ${devicesRevoked} dispositivos e ${sessionsRevoked} sessões revogadas.`,
        metadata: {
          devices_revoked: devicesRevoked,
          sessions_revoked: sessionsRevoked,
          triggered_by: 'user_request',
        },
        ip_address: null,
      });
      
      console.log(`[revoke-device] ✅ LOCKDOWN completo: ${devicesRevoked} devices, ${sessionsRevoked} sessões`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          devicesRevoked,
          sessionsRevoked,
          message: 'Security lockdown executado com sucesso',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // 🔐 AÇÃO: Listar dispositivos
    if (body.action === 'list') {
      console.log(`[revoke-device] 📋 Listando dispositivos para usuário ${userId}...`);
      
      const { data: devices, error: listError } = await supabase
        .from('user_devices')
        .select('id, device_name, device_type, browser, os, last_seen_at, first_seen_at')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('last_seen_at', { ascending: false });
      
      if (listError) {
        console.error(`[revoke-device] ❌ Erro ao listar:`, listError);
        return new Response(
          JSON.stringify({ success: false, error: 'LIST_FAILED' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: true, devices: devices || [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { deviceId, reason = 'user_revoked' } = body;

    if (!deviceId) {
      return new Response(
        JSON.stringify({ success: false, error: 'DEVICE_ID_REQUIRED' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[revoke-device] 🔐 Revogando dispositivo ${deviceId} para usuário ${userId}...`);

    // 🔐 PASSO 1: Buscar device_fingerprint (hash) do dispositivo
    const { data: device, error: deviceError } = await supabase
      .from('user_devices')
      .select('id, device_fingerprint, device_name, user_id')
      .eq('id', deviceId)
      .eq('user_id', userId) // Só permite revogar próprios dispositivos
      .eq('is_active', true)
      .maybeSingle();

    if (deviceError || !device) {
      console.warn(`[revoke-device] ⚠️ Dispositivo não encontrado ou não pertence ao usuário`);
      return new Response(
        JSON.stringify({ success: false, error: 'DEVICE_NOT_FOUND' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const deviceHash = device.device_fingerprint;

    // 🔐 PASSO 2: Revogar dispositivo em user_devices
    const { error: updateError } = await supabase
      .from('user_devices')
      .update({
        is_active: false,
        deactivated_at: new Date().toISOString(),
        deactivated_by: userId,
        revoked_reason: reason, // 🔐 BLOCO 2: Campo obrigatório
      })
      .eq('id', deviceId);

    if (updateError) {
      console.error(`[revoke-device] ❌ Erro ao revogar dispositivo:`, updateError);
      
      // 🔐 BLOCO 2: Registrar evento de falha
      await supabase.from('security_events').insert({
        user_id: userId,
        event_type: 'DEVICE_REVOKE_FAILED',
        severity: 'error',
        description: `Falha ao revogar dispositivo "${device.device_name}": ${updateError.message}`,
        metadata: {
          device_id: deviceId,
          device_hash_prefix: deviceHash.slice(0, 16),
          error: updateError.message,
          reason,
        },
        ip_address: null,
      });
      
      return new Response(
        JSON.stringify({ success: false, error: 'REVOKE_FAILED' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 🔐 BLOCO 5: PASSO 3: Revogar TODAS as sessões com o mesmo device_hash
    const { data: revokedSessions, error: sessionError } = await supabase
      .from('active_sessions')
      .update({
        status: 'revoked',
        revoked_at: new Date().toISOString(),
        revoked_reason: `device_revoked:${reason}`,
      })
      .eq('user_id', userId)
      .eq('device_hash', deviceHash)
      .eq('status', 'active')
      .select('id');

    const sessionsRevoked = revokedSessions?.length || 0;
    console.log(`[revoke-device] 🔐 ${sessionsRevoked} sessões revogadas para device_hash ${deviceHash.slice(0, 16)}...`);

    // 🔐 PASSO 4: Gerar evento de segurança
    await supabase.from('security_events').insert({
      user_id: userId,
      event_type: 'DEVICE_REVOKED',
      severity: 'info',
      description: `Dispositivo "${device.device_name}" revogado. ${sessionsRevoked} sessões invalidadas.`,
      metadata: {
        device_id: deviceId,
        device_hash_prefix: deviceHash.slice(0, 16),
        sessions_revoked: sessionsRevoked,
        reason,
      },
      ip_address: null,
    });

    // 🔐 PASSO 5: Broadcast para logout imediato em abas abertas
    // Isso garante que o dispositivo revogado seja deslogado IMEDIATAMENTE
    const channel = supabase.channel(`user:${userId}`);
    await channel.send({
      type: 'broadcast',
      event: 'device-revoked',
      payload: {
        deviceId,
        deviceHash: deviceHash.slice(0, 16),
        reason,
      },
    });

    console.log(`[revoke-device] ✅ Dispositivo revogado com sucesso`);

    // 🔐 PASSO 6: Log de auditoria
    await supabase.from('audit_logs').insert({
      action: 'DEVICE_REVOKED',
      user_id: userId,
      table_name: 'user_devices',
      new_data: {
        device_id: deviceId,
        device_hash_prefix: deviceHash.slice(0, 16),
        sessions_revoked: sessionsRevoked,
        reason,
      },
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        deviceId,
        sessionsRevoked,
        message: 'Dispositivo e sessões revogados com sucesso',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[revoke-device] ❌ Erro:`, error);
    return new Response(
      JSON.stringify({ success: false, error: 'INTERNAL_ERROR' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
