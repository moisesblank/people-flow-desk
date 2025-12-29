// ============================================
// 🛡️ BLOCO 1 FIX: REGISTER DEVICE SERVER-SIDE
// Device Hash gerado NO SERVIDOR com pepper secreto
// Cliente envia dados BRUTOS, servidor calcula hash final
// ============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { getCorsHeaders, handleCorsOptions } from "../_shared/corsConfig.ts";

// Interface para dados brutos do fingerprint (vindos do cliente)
interface FingerprintRawData {
  // Screen
  screenWidth: number;
  screenHeight: number;
  screenColorDepth: number;
  screenPixelRatio?: number;
  availWidth?: number;
  availHeight?: number;
  
  // Hardware
  hardwareConcurrency: number;
  deviceMemory: number | null;
  maxTouchPoints: number;
  
  // Browser
  userAgent: string;
  language: string;
  languages?: string[];
  platform: string;
  vendor?: string;
  cookiesEnabled?: boolean;
  doNotTrack?: string | null;
  
  // Timezone
  timezone: string;
  timezoneOffset: number;
  
  // WebGL (identificação de GPU - muito estável)
  webglVendor: string;
  webglRenderer: string;
  
  // Canvas hash (gerado no cliente, mas validado)
  canvasHash: string;
  
  // Audio fingerprint
  audioFingerprint?: string;
  
  // Plugins
  pluginsCount?: number;
  
  // Device classification
  deviceType: 'mobile' | 'tablet' | 'desktop';
  browser: string;
  os: string;
}

interface RegisterDeviceRequest {
  fingerprintData: FingerprintRawData;
  deviceName: string;
  deviceType: string;
  browser: string;
  os: string;
}

// ============================================
// FUNÇÕES DE VALIDAÇÃO E HASH
// ============================================

// Validar consistência do fingerprint (anti-spoof básico)
function validateFingerprintConsistency(data: FingerprintRawData): { valid: boolean; reason?: string } {
  // 1. Campos obrigatórios
  if (!data.screenWidth || !data.screenHeight) {
    return { valid: false, reason: 'MISSING_SCREEN_DATA' };
  }
  if (!data.hardwareConcurrency || data.hardwareConcurrency < 1) {
    return { valid: false, reason: 'INVALID_CPU_CORES' };
  }
  if (!data.timezone) {
    return { valid: false, reason: 'MISSING_TIMEZONE' };
  }
  if (!data.userAgent) {
    return { valid: false, reason: 'MISSING_USER_AGENT' };
  }
  if (!data.webglVendor || !data.webglRenderer) {
    return { valid: false, reason: 'MISSING_WEBGL_DATA' };
  }
  if (!data.canvasHash) {
    return { valid: false, reason: 'MISSING_CANVAS_HASH' };
  }
  
  // 2. Ranges plausíveis
  if (data.screenWidth < 320 || data.screenWidth > 7680) {
    return { valid: false, reason: 'INVALID_SCREEN_WIDTH' };
  }
  if (data.screenHeight < 240 || data.screenHeight > 4320) {
    return { valid: false, reason: 'INVALID_SCREEN_HEIGHT' };
  }
  if (data.hardwareConcurrency > 128) {
    return { valid: false, reason: 'INVALID_CPU_CORES_TOO_HIGH' };
  }
  if (data.deviceMemory !== null && (data.deviceMemory < 0.25 || data.deviceMemory > 512)) {
    return { valid: false, reason: 'INVALID_DEVICE_MEMORY' };
  }
  if (data.maxTouchPoints < 0 || data.maxTouchPoints > 20) {
    return { valid: false, reason: 'INVALID_TOUCH_POINTS' };
  }
  
  // 3. Consistência interna
  // Mobile/tablet deve ter touchPoints > 0 na maioria dos casos
  if (data.deviceType === 'mobile' && data.maxTouchPoints === 0) {
    // Não bloqueia, mas marca como suspeito (tratado no risk score)
  }
  
  // WebGL vendors conhecidos
  const knownVendors = ['google', 'intel', 'nvidia', 'amd', 'apple', 'arm', 'qualcomm', 'mesa', 'microsoft', 'unknown'];
  const vendorLower = data.webglVendor.toLowerCase();
  const hasKnownVendor = knownVendors.some(v => vendorLower.includes(v));
  if (!hasKnownVendor && vendorLower !== 'error') {
    // Vendor desconhecido - suspeito mas não bloqueia
  }
  
  return { valid: true };
}

// Gerar hash final NO SERVIDOR usando pepper secreto
async function generateServerDeviceHash(data: FingerprintRawData, pepper: string): Promise<string> {
  // Componentes estáveis para o hash (SEM IP, SEM webrtcIPs)
  const components = [
    // Screen (muito estável)
    `scr:${data.screenWidth}x${data.screenHeight}x${data.screenColorDepth}`,
    
    // Hardware (estável)
    `cpu:${data.hardwareConcurrency}`,
    `mem:${data.deviceMemory || 0}`,
    `touch:${data.maxTouchPoints}`,
    
    // Timezone (estável)
    `tz:${data.timezone}`,
    `tzo:${data.timezoneOffset}`,
    
    // Language (relativamente estável)
    `lang:${data.language}`,
    
    // Platform (estável)
    `plat:${data.platform}`,
    
    // WebGL - muito bom para identificar hardware (estável)
    `gl:${data.webglVendor}:${data.webglRenderer}`,
    
    // Canvas hash (validado, estável)
    `cv:${data.canvasHash}`,
    
    // Audio fingerprint se disponível
    `au:${data.audioFingerprint || 'none'}`,
    
    // 🔐 PEPPER SECRETO - garante que cliente não pode gerar o mesmo hash
    `pepper:${pepper}`,
  ];
  
  const rawString = components.join('|');
  
  // SHA-256 do conjunto
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(rawString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hash;
}

// Detectar fingerprint duplicado/clonado
async function detectSpoofOrClone(
  supabase: any,
  userId: string,
  deviceHash: string,
  fingerprintData: FingerprintRawData
): Promise<{ isSpoof: boolean; reason?: string }> {
  
  // 1. Verificar se este hash exato já está registrado para OUTRO usuário
  const { data: existingDevice } = await supabase
    .from('user_devices')
    .select('user_id, device_name')
    .eq('device_fingerprint', deviceHash)
    .neq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();
  
  if (existingDevice) {
    console.warn(`[register-device-server] 🚨 SPOOF DETECTADO: Hash ${deviceHash.slice(0, 16)}... já existe para outro usuário`);
    return { isSpoof: true, reason: 'HASH_BELONGS_TO_ANOTHER_USER' };
  }
  
  // 2. Verificar mudanças impossíveis (mesmo userId, mesmo device_id, mas hardware mudou drasticamente)
  const { data: userDevices } = await supabase
    .from('user_devices')
    .select('device_fingerprint, device_name, browser, os')
    .eq('user_id', userId)
    .eq('is_active', true);
  
  // Se o usuário já tem dispositivos, verificar se está tentando registrar um "clone"
  // (mesmo browser/OS mas fingerprint diferente - possível VM ou spoof)
  if (userDevices && userDevices.length >= 3) {
    const sameProfileDevices = userDevices.filter((d: any) => 
      d.browser === fingerprintData.browser && d.os === fingerprintData.os
    );
    
    if (sameProfileDevices.length >= 2) {
      // Muitos dispositivos com mesmo browser/OS = suspeito
      console.warn(`[register-device-server] ⚠️ Múltiplos dispositivos com mesmo browser/OS detectados`);
      // Não bloqueia, mas será contabilizado no limite
    }
  }
  
  return { isSpoof: false };
}

// ============================================
// HANDLER PRINCIPAL
// ============================================

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return handleCorsOptions(req);
  }

  try {
    // 🔐 OBTER PEPPER SECRETO
    const DEVICE_HASH_PEPPER = Deno.env.get('DEVICE_HASH_PEPPER');
    if (!DEVICE_HASH_PEPPER) {
      console.error('[register-device-server] ❌ DEVICE_HASH_PEPPER não configurado!');
      return new Response(
        JSON.stringify({ success: false, error: 'SERVER_CONFIG_ERROR' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 🔐 AUTENTICAÇÃO OBRIGATÓRIA - extrair userId do JWT
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
    const userEmail = user.email || '';

    // 🔐 FAIL-CLOSED: Fingerprint obrigatório
    const body: RegisterDeviceRequest = await req.json();
    const { fingerprintData, deviceName, deviceType, browser, os } = body;

    if (!fingerprintData) {
      console.warn(`[register-device-server] ❌ FAIL-CLOSED: fingerprintData não enviado`);
      return new Response(
        JSON.stringify({ success: false, error: 'FINGERPRINT_REQUIRED' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 🔐 VALIDAÇÃO DE CONSISTÊNCIA
    const validation = validateFingerprintConsistency(fingerprintData);
    if (!validation.valid) {
      console.warn(`[register-device-server] ❌ Fingerprint inválido: ${validation.reason}`);
      return new Response(
        JSON.stringify({ success: false, error: 'INVALID_FINGERPRINT', reason: validation.reason }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 🔐 GERAR HASH FINAL NO SERVIDOR (com pepper)
    const deviceHashFinal = await generateServerDeviceHash(fingerprintData, DEVICE_HASH_PEPPER);
    console.log(`[register-device-server] 🔐 Hash server-side gerado: ${deviceHashFinal.slice(0, 16)}...`);

    // 🔐 DETECÇÃO DE SPOOF/CLONE
    const spoofCheck = await detectSpoofOrClone(supabase, userId, deviceHashFinal, fingerprintData);
    if (spoofCheck.isSpoof) {
      console.error(`[register-device-server] 🚨 SPOOF BLOQUEADO: ${spoofCheck.reason}`);
      return new Response(
        JSON.stringify({ success: false, error: 'DEVICE_SPOOF_DETECTED', reason: spoofCheck.reason }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 🔐 VERIFICAR SE É OWNER (bypass de limite)
    const isOwner = userEmail.toLowerCase() === 'moisesblank@gmail.com';

    // Verificar se dispositivo já existe para este usuário
    const { data: existingDevice } = await supabase
      .from('user_devices')
      .select('id')
      .eq('user_id', userId)
      .eq('device_fingerprint', deviceHashFinal)
      .eq('is_active', true)
      .maybeSingle();

    if (existingDevice) {
      // Dispositivo já registrado - apenas atualizar last_seen
      await supabase
        .from('user_devices')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', existingDevice.id);
      
      console.log(`[register-device-server] ✅ Dispositivo existente atualizado`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          deviceId: existingDevice.id, 
          status: 'EXISTING_DEVICE',
          deviceHash: deviceHashFinal,
          isOwner 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Contar dispositivos ativos
    const { count: deviceCount } = await supabase
      .from('user_devices')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true);

    const currentCount = deviceCount || 0;

    // 🔐 VERIFICAR LIMITE DE 3 DISPOSITIVOS (exceto owner)
    if (!isOwner && currentCount >= 3) {
      // Buscar lista de dispositivos para o modal
      const { data: devices } = await supabase
        .from('user_devices')
        .select('id, device_name, device_type, browser, os, last_seen_at')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('last_seen_at', { ascending: false });

      console.warn(`[register-device-server] ⚠️ LIMITE EXCEDIDO: ${currentCount}/3 dispositivos`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'DEVICE_LIMIT_EXCEEDED',
          maxDevices: 3,
          currentCount,
          devices: devices || []
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 🔐 REGISTRAR NOVO DISPOSITIVO COM HASH SERVER-SIDE
    const { data: newDevice, error: insertError } = await supabase
      .from('user_devices')
      .insert({
        user_id: userId,
        device_fingerprint: deviceHashFinal, // Hash gerado no servidor!
        device_name: deviceName || `${browser} on ${os}`,
        device_type: deviceType || 'desktop',
        browser: browser || 'Unknown',
        os: os || 'Unknown',
        is_active: true,
        is_trusted: false,
        first_seen_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertError) {
      console.error(`[register-device-server] ❌ Erro ao inserir dispositivo:`, insertError);
      return new Response(
        JSON.stringify({ success: false, error: 'INSERT_FAILED' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log de auditoria
    await supabase.from('audit_logs').insert({
      action: 'DEVICE_REGISTERED_SERVER_SIDE',
      user_id: userId,
      table_name: 'user_devices',
      new_data: {
        device_id: newDevice.id,
        device_hash_prefix: deviceHashFinal.slice(0, 16),
        device_type: deviceType,
        browser,
        os,
        total_devices: currentCount + 1,
      }
    });

    console.log(`[register-device-server] ✅ NOVO dispositivo registrado (${currentCount + 1}/3): ${deviceHashFinal.slice(0, 16)}...`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        deviceId: newDevice.id, 
        status: 'NEW_DEVICE_REGISTERED',
        deviceHash: deviceHashFinal,
        deviceCount: currentCount + 1,
        isOwner 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[register-device-server] ❌ Erro:`, error);
    return new Response(
      JSON.stringify({ success: false, error: 'INTERNAL_ERROR' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
