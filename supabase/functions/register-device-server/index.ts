// ============================================
// 🛡️ BLOCO 1 FIX: REGISTER DEVICE SERVER-SIDE
// Device Hash gerado NO SERVIDOR com pepper secreto
// Cliente envia dados BRUTOS, servidor calcula hash final
// ============================================

import { createClient } from "npm:@supabase/supabase-js@2";
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
  fingerprintData: FingerprintRawData,
  userEmail: string,
  origin: string | null
): Promise<{ isSpoof: boolean; reason?: string }> {
  
  // 🔐 P0 FIX: BYPASS para OWNER via role (não email)
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();
  
  const isOwner = roleData?.role === 'owner';
  if (isOwner) {
    console.log(`[register-device-server] 👑 OWNER bypass: verificação de spoof ignorada`);
    return { isSpoof: false };
  }
  
  // 🔐 P0 FIX: BYPASS para ambiente de preview/testes (lovableproject.com)
  // Em ambiente de desenvolvimento, múltiplos usuários podem compartilhar o mesmo navegador
  const isPreviewEnvironment = origin?.includes('lovableproject.com') || origin?.includes('localhost');
  if (isPreviewEnvironment) {
    console.log(`[register-device-server] 🧪 Preview environment bypass: ${origin}`);
    // Em preview, se o hash pertence a outro usuário, apenas desativa o dispositivo antigo
    const { data: existingDevice } = await supabase
      .from('user_devices')
      .select('id, user_id, device_name')
      .eq('device_fingerprint', deviceHash)
      .neq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();
    
    if (existingDevice) {
      console.log(`[register-device-server] 🧪 Preview: Desativando dispositivo de outro usuário para permitir teste`);
      await supabase
        .from('user_devices')
        .update({ is_active: false })
        .eq('id', existingDevice.id);
    }
    return { isSpoof: false };
  }
  
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
    const origin = req.headers.get('origin');
    const spoofCheck = await detectSpoofOrClone(supabase, userId, deviceHashFinal, fingerprintData, userEmail, origin);
    if (spoofCheck.isSpoof) {
      console.error(`[register-device-server] 🚨 SPOOF BLOQUEADO: ${spoofCheck.reason}`);
      return new Response(
        JSON.stringify({ success: false, error: 'DEVICE_SPOOF_DETECTED', reason: spoofCheck.reason }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 🔐 VERIFICAR SE É OWNER via role (bypass de limite)
    // Re-usar a verificação feita em detectSpoofOrClone
    const { data: ownerRoleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();
    const isOwner = ownerRoleData?.role === 'owner';

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

    // 🔐 BLOCO 4: VERIFICAR LIMITE DE 3 DISPOSITIVOS (exceto owner)
    if (!isOwner && currentCount >= 3) {
      // Buscar lista de dispositivos para o modal
      const { data: devices } = await supabase
        .from('user_devices')
        .select('id, device_name, device_type, browser, os, last_seen_at, first_seen_at')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('last_seen_at', { ascending: true }); // Mais antigo primeiro = recomendado desconectar

      // ============================================
      // 🛡️ P1-4: AUTO-DESATIVAR DISPOSITIVO MAIS ANTIGO
      // Se limite excedido e não é same-type-replacement,
      // desativa automaticamente o dispositivo mais antigo
      // ============================================
      const oldestDevice = devices?.[0];
      if (oldestDevice) {
        console.log(`[register-device-server] 🔄 P1-4: Auto-desativando dispositivo mais antigo: ${oldestDevice.id}`);
        
        await supabase
          .from('user_devices')
          .update({ 
            is_active: false, 
            revoked_at: new Date().toISOString(),
            revoked_reason: 'AUTO_DEACTIVATED_ON_LIMIT_EXCEEDED'
          })
          .eq('id', oldestDevice.id);
        
        // Registrar evento de segurança
        await supabase.from('security_events').insert({
          user_id: userId,
          event_type: 'DEVICE_AUTO_DEACTIVATED',
          severity: 'warning',
          description: `Dispositivo mais antigo desativado automaticamente: ${oldestDevice.device_name}`,
          metadata: {
            deactivated_device_id: oldestDevice.id,
            deactivated_device_name: oldestDevice.device_name,
            new_device_type: deviceType,
            reason: 'LIMIT_EXCEEDED_AUTO_CLEANUP'
          },
          ip_address: null,
        });
        
        // Continuar com o registro do novo dispositivo (não retornar erro)
        // A lógica abaixo de registro será executada
      }

      console.warn(`[register-device-server] ⚠️ LIMITE EXCEDIDO: ${currentCount}/3 dispositivos`);
      
      // ============================================
      // 🛡️ BEYOND_THE_3_DEVICES: Verificar se é substituição do mesmo tipo
      // REGRA: Se usuário já tem 1 de cada tipo (Desktop, Mobile, Tablet)
      // e tenta adicionar um 4º do MESMO TIPO de um existente
      // ============================================
      const deviceTypes = (devices || []).map((d: any) => d.device_type);
      const currentDeviceType = deviceType || 'desktop';
      
      // Contar quantos tipos únicos o usuário tem
      const uniqueTypes = new Set(deviceTypes);
      const hasAllThreeTypes = uniqueTypes.has('desktop') && uniqueTypes.has('mobile') && uniqueTypes.has('tablet');
      
      // Verificar se o novo dispositivo é do mesmo tipo de um existente
      const existingSameTypeDevice = (devices || []).find((d: any) => d.device_type === currentDeviceType);
      
      // BEYOND_THE_3_DEVICES: Usuário tem exatamente 3 tipos diferentes E
      // o novo dispositivo é do mesmo tipo de um existente
      if (hasAllThreeTypes && existingSameTypeDevice) {
        console.log(`[register-device-server] 🔄 BEYOND_THE_3_DEVICES: ${currentDeviceType} → substituição permitida`);
        
        // Registrar evento de segurança
        try {
          await supabase.from('security_events').insert({
            user_id: userId,
            event_type: 'SAME_TYPE_REPLACEMENT_OFFERED',
            severity: 'info',
            description: `Oferecida substituição de ${currentDeviceType} por dispositivo do mesmo tipo`,
            metadata: {
              current_device_type: currentDeviceType,
              existing_device_id: existingSameTypeDevice.id,
              existing_device_name: existingSameTypeDevice.device_name,
              new_device_hash_prefix: deviceHashFinal.slice(0, 16),
            },
            ip_address: null,
          });
        } catch (securityEventError) {
          console.warn('[register-device-server] ⚠️ Falha ao registrar evento:', securityEventError);
        }
        
        // 🛡️ PAYLOAD ESPECÍFICO para SameTypeReplacementGate
        const sameTypePayload = {
          code: 'SAME_TYPE_REPLACEMENT_REQUIRED',
          message: `Substituição de ${currentDeviceType} disponível`,
          current_device_type: currentDeviceType,
          current_device: {
            device_type: currentDeviceType,
            os_name: os || 'Sistema',
            browser_name: browser || 'Navegador',
            label: deviceName || `${browser || 'Navegador'} • ${os || 'Sistema'}`,
          },
          existing_same_type_device: {
            device_id: existingSameTypeDevice.id,
            label: existingSameTypeDevice.device_name || `${existingSameTypeDevice.browser || 'Navegador'} • ${existingSameTypeDevice.os || 'Sistema'}`,
            device_type: existingSameTypeDevice.device_type,
            os_name: existingSameTypeDevice.os || 'Sistema',
            browser_name: existingSameTypeDevice.browser || 'Navegador',
            last_seen_at: existingSameTypeDevice.last_seen_at,
          },
          new_device_hash: deviceHashFinal,
        };
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'SAME_TYPE_REPLACEMENT_REQUIRED',
            ...sameTypePayload,
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // 🔐 BLOCO 4: GERAR EVENTO DE SEGURANÇA (OBRIGATÓRIO)
      try {
        await supabase.from('security_events').insert({
          user_id: userId,
          event_type: 'DEVICE_LIMIT_EXCEEDED',
          severity: 'warning',
          description: `Tentativa de registro de 4º dispositivo bloqueada. Total atual: ${currentCount}`,
          metadata: {
            current_count: currentCount,
            max_devices: 3,
            attempted_device: {
              device_type: deviceType,
              browser,
              os,
              device_hash_prefix: deviceHashFinal.slice(0, 16),
            },
            existing_devices: (devices || []).map((d: any) => ({
              id: d.id,
              name: d.device_name,
              type: d.device_type,
              last_seen: d.last_seen_at,
            })),
          },
          ip_address: null, // SEM IP conforme BLOCO 1
        });
        console.log('[register-device-server] 🔐 Evento de segurança registrado: DEVICE_LIMIT_EXCEEDED');
      } catch (securityEventError) {
        console.warn('[register-device-server] ⚠️ Falha ao registrar evento de segurança:', securityEventError);
      }

      // 🛡️ BLOCO 4: CONTRATO COMPLETO para DeviceLimitGate
      const gatePayload = {
        code: 'DEVICE_LIMIT_EXCEEDED',
        message: 'Limite de dispositivos atingido',
        max_devices: 3,
        current_devices: currentCount,
        action_required: 'REVOKE_ONE_DEVICE_TO_CONTINUE',
        // Dispositivo atual tentando entrar
        current_device: {
          device_type: deviceType || 'desktop',
          os_name: os || 'Sistema',
          browser_name: browser || 'Navegador',
          label: deviceName || `${browser || 'Navegador'} • ${os || 'Sistema'}`,
        },
        // Lista de dispositivos com is_recommended_to_disconnect
        devices: (devices || []).map((d: any, index: number) => ({
          device_id: d.id,
          label: d.device_name || `${d.browser || 'Navegador'} • ${d.os || 'Sistema'}`,
          device_type: d.device_type || 'desktop',
          os_name: d.os || 'Sistema',
          browser_name: d.browser || 'Navegador',
          last_seen_at: d.last_seen_at,
          first_seen_at: d.first_seen_at,
          // Primeiro da lista (mais antigo) é recomendado para desconectar
          is_recommended_to_disconnect: index === 0,
        })),
      };

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'DEVICE_LIMIT_EXCEEDED',
          ...gatePayload,
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

    // 🔐 BLOCO 6: LOG_DE_NOVO_APARELHO (OBRIGATÓRIO)
    // Registrar em security_events para monitoramento
    try {
      await supabase.from('security_events').insert({
        user_id: userId,
        event_type: 'NEW_DEVICE_REGISTERED',
        severity: 'info',
        description: `Novo dispositivo registrado: ${deviceName || browser + ' on ' + os}`,
        metadata: {
          device_id: newDevice.id,
          device_hash_prefix: deviceHashFinal.slice(0, 16),
          device_type: deviceType,
          browser,
          os,
          total_devices: currentCount + 1,
          max_devices: 3,
        },
        ip_address: null, // SEM IP conforme BLOCO 1
      });
      console.log('[register-device-server] 🔐 Evento de segurança registrado: NEW_DEVICE_REGISTERED');
    } catch (securityEventError) {
      console.warn('[register-device-server] ⚠️ Falha ao registrar evento de segurança:', securityEventError);
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
    
    // 🔐 PIECE 1: PROGRESSIVE AWARENESS RULES
    // Retornar aviso progressivo baseado na contagem
    let deviceNotice: { level: 'INFO' | 'WARNING' | 'HARD_WARNING' | null; message: string | null } = {
      level: null,
      message: null,
    };
    
    const newCount = currentCount + 1;
    
    if (newCount === 2) {
      deviceNotice = {
        level: 'INFO',
        message: 'Novo dispositivo detectado. Você agora tem 2 dispositivos registrados.',
      };
    } else if (newCount === 3) {
      deviceNotice = {
        level: 'HARD_WARNING',
        message: 'Este é seu último slot de dispositivo. Adicionar outro exigirá desconectar um existente.',
      };
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        deviceId: newDevice.id, 
        status: 'NEW_DEVICE_REGISTERED',
        deviceHash: deviceHashFinal,
        deviceCount: newCount,
        isOwner,
        // 🔐 PIECE 1: Aviso progressivo
        notice: deviceNotice,
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
