// ============================================
// 🏛️ LEI VI + LEI III: VALIDATE DEVICE
// Edge function para validar dispositivo ANTES do login
// Calcula risk_score baseado em múltiplos fatores
// ============================================

import { createClient } from 'npm:@supabase/supabase-js@2';

import { getCorsHeaders, handleCorsOptions } from "../_shared/corsConfig.ts";

interface DeviceValidationRequest {
  fingerprint: string;
  fingerprintData?: Record<string, unknown>;
  userId?: string;
  email?: string;
  action: 'pre_login' | 'post_login' | 'validate' | 'register';
}

interface RiskFactor {
  name: string;
  points: number;
  description: string;
}

Deno.serve(async (req) => {
  // LEI VI: CORS dinâmico via allowlist centralizado
  const corsHeaders = getCorsHeaders(req);
  
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsOptions(req);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extrair headers do Cloudflare
    const cfConnectingIP = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const cfCountry = req.headers.get('cf-ipcountry') || 'unknown';
    const cfCity = req.headers.get('cf-ipcity') || 'unknown';
    const userAgent = req.headers.get('user-agent') || '';

    const body: DeviceValidationRequest = await req.json();
    const { fingerprint, fingerprintData, email, action } = body;
    
    // 🛡️ PATCH-004: userId NUNCA do body - sempre do JWT ou null
    let userId: string | undefined = undefined;
    
    // Para post_login/register: EXIGIR JWT e derivar userId do token
    if (action === 'post_login' || action === 'register') {
      const authHeader = req.headers.get('authorization');
      
      if (!authHeader) {
        console.warn(`[validate-device] POST_LOGIN/REGISTER sem Authorization - bloqueado`);
        return new Response(
          JSON.stringify({ 
            error: 'Authorization obrigatório para post_login/register',
            success: false
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Validar JWT e extrair userId do token (NUNCA do body)
      const token = authHeader.replace('Bearer ', '');
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
      const authClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });
      
      const { data: { user }, error: authError } = await authClient.auth.getUser(token);
      
      if (authError || !user) {
        console.error(`[validate-device] JWT inválido:`, authError);
        return new Response(
          JSON.stringify({ 
            error: 'JWT inválido ou expirado',
            success: false
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // 🛡️ CRÍTICO: userId vem do JWT, IGNORANDO body.userId
      userId = user.id;
      console.log(`[validate-device] Post-login/register: userId derivado do JWT (body.userId IGNORADO)`);
      
    } else {
      // Pre-login/validate: userId permanece undefined
      console.log(`[validate-device] Pre-login/validate: userId não aplicável`);
      
      // 🛡️ NOVA ESTRATÉGIA: Turnstile OPCIONAL no pre-login
      // Login normal flui SEM Turnstile - só exigido em eventos de risco
      const turnstileToken = (body as any).turnstileToken;
      console.log(`[validate-device] Pre-login: Turnstile ${turnstileToken ? 'presente' : 'ausente (ok - nova estratégia)'}`);
      
      // Se NÃO tem token, pular validação de Turnstile e continuar normalmente
      // A segurança é garantida por: fingerprint, IP, rate-limit, risk-score
      
      // 🛡️ FALLBACK/DEV BYPASS: Aceitar tokens especiais sem chamar Cloudflare
      const isFallbackToken = typeof turnstileToken === 'string' && turnstileToken.startsWith('FALLBACK_');
      const isDevBypassToken = typeof turnstileToken === 'string' && turnstileToken.startsWith('DEV_BYPASS_');
      
      if (isFallbackToken || isDevBypassToken) {
        const hostname = turnstileToken.split('_').pop() || '';
        // MONO-DOMÍNIO: gestao.* não existe mais
        const allowedHosts = [
          'pro.moisesmedeiros.com.br',
          'moisesmedeiros.com.br',
          'www.moisesmedeiros.com.br',
          'localhost',
          '127.0.0.1',
        ];
        
        const isAllowed = allowedHosts.some(h => hostname.includes(h)) ||
                          hostname.includes('lovableproject.com');
        
        if (!isAllowed) {
          console.warn(`[validate-device] Token especial rejeitado para hostname: ${hostname}`);
          return new Response(
            JSON.stringify({ error: 'Hostname não permitido', success: false }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // 🛡️ FALLBACK: Rate-limit agressivo (1/min por IP)
        if (isFallbackToken) {
          const { data: recentAttempts } = await supabase
            .from('api_rate_limits')
            .select('request_count')
            .eq('client_id', cfConnectingIP)
            .eq('endpoint', 'fallback-login')
            .gte('window_start', new Date(Date.now() - 60000).toISOString())
            .maybeSingle();
          
          if (recentAttempts && recentAttempts.request_count >= 1) {
            console.warn(`[validate-device] FALLBACK rate-limit excedido para IP: ${cfConnectingIP}`);
            return new Response(
              JSON.stringify({ 
                error: 'Muitas tentativas. Aguarde 1 minuto.',
                retryAfter: 60,
                success: false 
              }),
              { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          // Registrar tentativa
          await supabase.from('api_rate_limits').upsert({
            client_id: cfConnectingIP,
            endpoint: 'fallback-login',
            request_count: 1,
            window_start: new Date().toISOString(),
          }, { onConflict: 'client_id,endpoint' });
          
          console.warn(`[validate-device] ⚠️ FALLBACK aceito para: ${hostname} (rate-limit 1/min)`);
        } else {
          console.warn(`[validate-device] ⚠️ DEV BYPASS aceito para: ${hostname}`);
        }
      } else if (turnstileToken) {
        // Validar Turnstile via API (token normal) - MAS É OPCIONAL
        // Se falhar, apenas logar e continuar (não bloquear)
        const TURNSTILE_SECRET = Deno.env.get('CLOUDFLARE_TURNSTILE_SECRET_KEY');
        if (TURNSTILE_SECRET && turnstileToken) {
          try {
            const turnstileResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: `secret=${TURNSTILE_SECRET}&response=${turnstileToken}&remoteip=${cfConnectingIP}`,
            });
            const turnstileResult = await turnstileResponse.json();
            if (!turnstileResult.success) {
              // ✅ P0 FIX: Turnstile é OPCIONAL no pre-login
              // Se falhar, apenas logar e continuar (não bloquear o fluxo)
              console.warn(`[validate-device] Turnstile falhou (ignorando - opcional): ${JSON.stringify(turnstileResult)}`);
              // NÃO retornar 403 - apenas continuar
            } else {
              console.log(`[validate-device] Turnstile validado com sucesso`);
            }
          } catch (turnstileError) {
            console.warn(`[validate-device] Erro ao validar Turnstile (ignorando):`, turnstileError);
          }
        }
      }
      // Se não tem turnstileToken, continuar normalmente (Turnstile é opcional)
    } // Fecha o else do pre-login/validate

    if (!fingerprint) {
      return new Response(
        JSON.stringify({ error: 'Fingerprint é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[validate-device] Action: ${action}, IP: ${cfConnectingIP}, Country: ${cfCountry}`);

    // Calcular risk_score
    const riskFactors: RiskFactor[] = [];
    let riskScore = 0;

    // ============================================
    // FATORES DE RISCO
    // ============================================

    // 1. Verificar user-agent suspeito
    if (!userAgent || userAgent.trim() === '') {
      riskScore += 30;
      riskFactors.push({ name: 'empty_user_agent', points: 30, description: 'User-Agent vazio' });
    } else if (/bot|crawler|spider|scraper|curl|wget/i.test(userAgent)) {
      riskScore += 25;
      riskFactors.push({ name: 'bot_user_agent', points: 25, description: 'User-Agent parece bot' });
    }

    // 2. Verificar ferramentas de ataque conhecidas
    const attackTools = ['sqlmap', 'nikto', 'masscan', 'nmap', 'gobuster', 'dirbuster', 'wpscan', 'nuclei', 'httpx'];
    for (const tool of attackTools) {
      if (userAgent.toLowerCase().includes(tool)) {
        riskScore += 100;
        riskFactors.push({ name: 'attack_tool', points: 100, description: `Ferramenta de ataque: ${tool}` });
        break;
      }
    }

    // 3. Se temos userId, verificar histórico do dispositivo
    let deviceData = null;
    let isNewDevice = true;
    let countryChanged = false;
    let rapidChange = false;

  if (userId) {
      // Chamar RPC para calcular risk_score no banco (retorna JSONB)
      const { data: riskData, error: riskError } = await supabase.rpc('calculate_device_risk_score', {
        p_user_id: userId,
        p_device_hash: fingerprint,
        p_ip: cfConnectingIP,
        p_country: cfCountry,
        p_user_agent: userAgent,
      });

      if (!riskError && riskData) {
        // riskData é JSONB com risk_score, is_new_device, country_changed, rapid_change, reasons
        riskScore += riskData.risk_score || 0;
        isNewDevice = riskData.is_new_device ?? true;
        countryChanged = riskData.country_changed ?? false;
        rapidChange = riskData.rapid_change ?? false;

        if (riskData.reasons && Array.isArray(riskData.reasons)) {
          for (const reason of riskData.reasons) {
            riskFactors.push({
              name: reason.reason,
              points: reason.points,
              description: reason.reason.replace(/_/g, ' '),
            });
          }
        }

        // Pegar dados do dispositivo diretamente da resposta
        deviceData = {
          trust_score: riskData.device_trust_score,
          is_trusted: riskData.device_is_trusted,
          is_blocked: riskData.device_is_blocked,
        };
      } else {
        // Se erro na RPC, buscar dados do dispositivo diretamente
        const { data: device } = await supabase
          .from('device_trust_scores')
          .select('trust_score, is_trusted, is_blocked, total_sessions')
          .eq('user_id', userId)
          .eq('device_hash', fingerprint)
          .single();

        if (device) {
          deviceData = device;
        }
      }
    }

    // 4. Verificar fingerprint data por anomalias
    if (fingerprintData) {
      // Sem suporte a WebGL = possível VM ou sandbox
      if (fingerprintData.webglVendor === 'unknown' || fingerprintData.webglRenderer === 'unknown') {
        riskScore += 15;
        riskFactors.push({ name: 'no_webgl', points: 15, description: 'Sem suporte WebGL (possível VM)' });
      }

      // Memória muito baixa = possível emulador
      if (fingerprintData.deviceMemory && Number(fingerprintData.deviceMemory) < 2) {
        riskScore += 10;
        riskFactors.push({ name: 'low_memory', points: 10, description: 'Memória muito baixa' });
      }

      // 🔐 BLOCO 1 FIX: REMOVIDO webrtcIPs como vetor de análise
      // WebRTC pode expor IPs locais/públicos - não usamos mais como sinal
      // Isso também elimina dependência de IP no fingerprint
      // (Código removido: verificação de webrtcIPs)
    }

    // 5. Verificar IP na lista de bloqueio
    const { data: blockedIP } = await supabase
      .from('blocked_ips')
      .select('id')
      .eq('ip_address', cfConnectingIP)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .single();

    if (blockedIP) {
      riskScore = 100;
      riskFactors.push({ name: 'blocked_ip', points: 100, description: 'IP bloqueado' });
    }

    // ============================================
    // DETERMINAR AÇÃO
    // ============================================

    // Limitar risk_score a 100
    riskScore = Math.min(100, riskScore);

    let recommendedAction: 'allow' | 'monitor' | 'challenge' | 'block';
    let requiresChallenge = false;
    let message = '';

    if (riskScore >= 80) {
      recommendedAction = 'block';
      message = 'Acesso bloqueado por motivos de segurança';
    } else if (riskScore >= 50) {
      recommendedAction = 'challenge';
      requiresChallenge = true;
      message = 'Verificação adicional necessária';
    } else if (riskScore >= 30) {
      recommendedAction = 'monitor';
      message = 'Acesso permitido com monitoramento';
    } else {
      recommendedAction = 'allow';
      message = 'Acesso permitido';
    }

    // ============================================
    // REGISTRAR DISPOSITIVO (se action = register ou post_login)
    // ============================================

    if ((action === 'register' || action === 'post_login') && userId) {
      // Extrair info do browser/os do fingerprintData
      const browserInfo = fingerprintData?.browser as string || 'Unknown';
      const osInfo = fingerprintData?.os as string || 'Unknown';
      const deviceType = fingerprintData?.deviceType as string || 'desktop';

      const { data: registerResult, error: registerError } = await supabase.rpc('register_device_trust', {
        p_user_id: userId,
        p_device_hash: fingerprint,
        p_device_name: `${browserInfo} on ${osInfo}`,
        p_device_type: deviceType,
        p_browser: browserInfo,
        p_os: osInfo,
        p_fingerprint: fingerprintData || {},
        p_ip: cfConnectingIP,
        p_country: cfCountry,
        p_city: cfCity,
      });

      if (registerError) {
        console.error('[validate-device] Erro ao registrar dispositivo:', registerError);
      } else {
        console.log('[validate-device] Dispositivo registrado:', registerResult);
      }
    }

    // ============================================
    // LOGAR EVENTO SUSPEITO SE NECESSÁRIO
    // ============================================

    if (riskScore >= 50 && userId) {
      const severity = riskScore >= 80 ? 'critical' : riskScore >= 60 ? 'high' : 'medium';
      
      await supabase.rpc('log_suspicious_device_event', {
        p_user_id: userId,
        p_device_hash: fingerprint,
        p_event_type: rapidChange ? 'rapid_location_change' : countryChanged ? 'country_change' : 'high_risk_score',
        p_severity: severity,
        p_description: `Risk score: ${riskScore}. Fatores: ${riskFactors.map(f => f.name).join(', ')}`,
        p_metadata: { riskScore, riskFactors, fingerprintData },
        p_ip: cfConnectingIP,
        p_country: cfCountry,
        p_user_agent: userAgent,
        p_action_taken: recommendedAction,
      });

      // Alertar admin se crítico
      if (severity === 'critical' || severity === 'high') {
        // Chamar edge function para notificar admin com INTERNAL_SECRET
        try {
          const internalSecret = Deno.env.get('INTERNAL_SECRET');
          await fetch(`${supabaseUrl}/functions/v1/notify-suspicious-device`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-internal-secret': internalSecret || '',
            },
            body: JSON.stringify({
              userId,
              userEmail: email,
              riskScore,
              factors: riskFactors,
              deviceHash: fingerprint,
              ip: cfConnectingIP,
              country: cfCountry,
              city: cfCity,
              action: recommendedAction,
              timestamp: new Date().toISOString(),
            }),
          });
          console.log('[validate-device] ✅ Notificação enviada para admin');
        } catch (notifyError) {
          console.error('[validate-device] Erro ao notificar admin:', notifyError);
        }
      }
    }

    // ============================================
    // RESPOSTA
    // ============================================

    const response = {
      success: true,
      riskScore,
      action: recommendedAction,
      requiresChallenge,
      message,
      isNewDevice,
      countryChanged,
      rapidChange,
      factors: riskFactors.map(f => ({ name: f.name, description: f.description })),
      device: deviceData ? {
        trustScore: deviceData.trust_score,
        isTrusted: deviceData.is_trusted,
        isBlocked: deviceData.is_blocked,
        totalSessions: deviceData.total_sessions,
      } : null,
      meta: {
        ip: cfConnectingIP,
        country: cfCountry,
        timestamp: new Date().toISOString(),
      },
    };

    console.log(`[validate-device] Result: riskScore=${riskScore}, action=${recommendedAction}`);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[validate-device] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno na validação',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
