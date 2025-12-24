// ============================================
// MASTER PRO ULTRA v3.0 - API GATEWAY
// Edge Function otimizada com cache e rate limiting
// LEI VI COMPLIANCE: CORS Allowlist
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsOptions, isOriginAllowed, corsBlockedResponse } from "../_shared/corsConfig.ts";

// Cache em memória (TTL: 60 segundos)
const cache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_TTL = 60000 // 60 segundos

// Rate limiting em memória
const rateLimits = new Map<string, { count: number; timestamp: number }>()
const RATE_LIMIT = 100 // 100 requisições
const RATE_WINDOW = 60000 // por minuto

// Headers de segurança
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'",
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
}

// Função de rate limiting
function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimits.get(ip)
  
  if (!record || now - record.timestamp > RATE_WINDOW) {
    rateLimits.set(ip, { count: 1, timestamp: now })
    return true
  }
  
  if (record.count >= RATE_LIMIT) {
    return false
  }
  
  record.count++
  return true
}

// Função de cache
function getCached<T>(key: string): T | null {
  const cached = cache.get(key)
  if (!cached) return null
  
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    cache.delete(key)
    return null
  }
  
  return cached.data as T
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() })
  
  // Limpar cache antigo (máximo 1000 entradas)
  if (cache.size > 1000) {
    const oldest = Array.from(cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .slice(0, 100)
    
    oldest.forEach(([key]) => cache.delete(key))
  }
}

serve(async (req) => {
  const startTime = Date.now()
  
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsOptions(req);
  }

  const origin = req.headers.get("Origin");
  if (!isOriginAllowed(origin)) {
    return corsBlockedResponse(origin);
  }

  const corsHeaders = getCorsHeaders(req);
  
  // Rate limiting
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  if (!checkRateLimit(ip)) {
    return new Response(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: {
        ...securityHeaders,
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Retry-After': '60',
      },
    })
  }
  
  try {
    const url = new URL(req.url)
    const path = url.pathname.replace('/api-gateway', '')
    
    // Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    // ========================================
    // 🛡️ LEI VI - AUTENTICAÇÃO JWT OBRIGATÓRIA
    // Exceto para /health (healthcheck público)
    // ========================================
    if (path !== '/health') {
      const authHeader = req.headers.get('Authorization')
      if (!authHeader?.startsWith('Bearer ')) {
        console.log('[API-GATEWAY] ❌ BLOQUEADO: Sem token JWT')
        
        await supabase.from('security_events').insert({
          event_type: 'API_GATEWAY_UNAUTHORIZED',
          severity: 'warning',
          description: 'Tentativa de acesso ao API Gateway sem autenticação',
          payload: {
            path,
            ip,
            user_agent: req.headers.get('user-agent')?.substring(0, 255)
          }
        })
        
        return new Response(JSON.stringify({ error: 'Não autorizado' }), {
          status: 401,
          headers: { ...securityHeaders, ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error: authError } = await supabase.auth.getUser(token)
      
      if (authError || !user) {
        console.log('[API-GATEWAY] ❌ BLOQUEADO: Token JWT inválido')
        return new Response(JSON.stringify({ error: 'Token inválido' }), {
          status: 401,
          headers: { ...securityHeaders, ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      console.log(`[API-GATEWAY] ✅ Autenticado: ${user.email} - ${req.method} ${path}`)
    }
    
    let response: unknown
    
    switch (true) {
      case path === '/dashboard' && req.method === 'GET': {
        const cacheKey = 'dashboard-stats'
        const cached = getCached(cacheKey)
        
        if (cached) {
          response = cached
        } else {
          const { data, error } = await supabase.rpc('get_cached_dashboard_stats')
          
          if (error) throw error
          
          setCache(cacheKey, data)
          response = data
        }
        break
      }
      
      case path === '/alunos' && req.method === 'GET': {
        const page = parseInt(url.searchParams.get('page') || '1')
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)
        const offset = (page - 1) * limit
        
        const cacheKey = `alunos-${page}-${limit}`
        const cached = getCached(cacheKey)
        
        if (cached) {
          response = cached
        } else {
          const { data, error, count } = await supabase
            .from('alunos')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)
          
          if (error) throw error
          
          response = {
            data,
            pagination: {
              page,
              limit,
              total: count,
              totalPages: Math.ceil((count || 0) / limit)
            }
          }
          
          setCache(cacheKey, response)
        }
        break
      }
      
      case path === '/funcionarios' && req.method === 'GET': {
        const page = parseInt(url.searchParams.get('page') || '1')
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)
        const offset = (page - 1) * limit
        
        const { data, error, count } = await supabase
          .from('employees')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1)
        
        if (error) throw error
        
        response = {
          data,
          pagination: { page, limit, total: count, totalPages: Math.ceil((count || 0) / limit) }
        }
        break
      }
      
      case path === '/metrics/realtime' && req.method === 'GET': {
        const { data: onlineUsers } = await supabase
          .from('profiles')
          .select('id', { count: 'exact' })
          .eq('is_online', true)
        
        const { count: pendingTasks } = await supabase
          .from('calendar_tasks')
          .select('id', { count: 'exact' })
          .eq('task_date', new Date().toISOString().split('T')[0])
          .eq('is_completed', false)
        
        const { count: pendingWebhooks } = await supabase
          .from('webhooks_queue')
          .select('id', { count: 'exact' })
          .eq('status', 'pending')
        
        response = {
          usuarios_online: onlineUsers?.length || 0,
          tarefas_pendentes: pendingTasks || 0,
          webhooks_pendentes: pendingWebhooks || 0,
          timestamp: new Date().toISOString()
        }
        break
      }
      
      case path === '/cache/invalidate' && req.method === 'POST': {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...securityHeaders, ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        
        const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
        if (!user || user.email !== 'moisesblank@gmail.com') {
          return new Response(JSON.stringify({ error: 'Forbidden' }), {
            status: 403,
            headers: { ...securityHeaders, ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        
        cache.clear()
        response = { success: true, message: 'Cache invalidated' }
        break
      }
      
      case path === '/health' && req.method === 'GET': {
        response = {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          cache_size: cache.size
        }
        break
      }
      
      default:
        return new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404,
          headers: { ...securityHeaders, ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
    
    const duration = Date.now() - startTime
    console.log(`[API] ${req.method} ${path} - ${duration}ms`)
    
    return new Response(JSON.stringify(response), {
      headers: {
        ...securityHeaders,
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-Response-Time': `${duration}ms`,
      },
    })
    
  } catch (error: unknown) {
    const err = error as Error
    console.error('[API] Error:', err.message)
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: err.message 
    }), {
      status: 500,
      headers: { ...securityHeaders, ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
