// ============================================
// MOISÉS MEDEIROS - API FAST v1.0
// Edge Function otimizada com cache em memória
// LEI VI COMPLIANCE: CORS Allowlist
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsOptions, isOriginAllowed, corsBlockedResponse } from "../_shared/corsConfig.ts";

// Cache em memória
const cache = new Map<string, { data: unknown; ts: number }>()
const CACHE_TTL = 60000 // 1 minuto

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsOptions(req);
  }

  const origin = req.headers.get("Origin");
  if (!isOriginAllowed(origin)) {
    return corsBlockedResponse(origin);
  }

  const corsHeaders = getCorsHeaders(req);

  const url = new URL(req.url)
  const path = url.pathname.replace('/api-fast', '')
  const startTime = Date.now()

  console.log(`[api-fast] Request: ${req.method} ${path}`)

  try {
    // Verificar cache
    const cacheKey = `${req.method}:${path}`
    const cached = cache.get(cacheKey)
    
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      console.log(`[api-fast] Cache HIT: ${cacheKey}`)
      return new Response(JSON.stringify({
        ...cached.data as object,
        _cache: true,
        _latency: Date.now() - startTime
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' }
      })
    }

    // Criar cliente Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    let data: unknown

    // Roteamento
    switch (path) {
      case '/dashboard':
      case '/dashboard-stats': {
        const { data: mvStats, error: mvError } = await supabase
          .from('mv_dashboard_stats_v2')
          .select('*')
          .single()

        if (!mvError && mvStats) {
          data = mvStats
        } else {
          const { data: cachedStats } = await supabase.rpc('get_cached_dashboard_stats')
          data = cachedStats || {
            alunos_ativos: 0,
            funcionarios_ativos: 0,
            afiliados_ativos: 0,
            receita_mes: 0,
            despesa_mes: 0,
            vendas_mes: 0,
            tarefas_hoje: 0,
            usuarios_online: 0
          }
        }
        break
      }

      case '/alunos': {
        const limit = url.searchParams.get('limit') || '100'
        const status = url.searchParams.get('status')
        
        let query = supabase
          .from('alunos')
          .select('id, nome, email, status, created_at, valor_pago')
          .order('created_at', { ascending: false })
          .limit(parseInt(limit))

        if (status) {
          query = query.eq('status', status)
        }

        const { data: alunos, error } = await query

        if (error) throw error
        data = { alunos, total: alunos?.length || 0 }
        break
      }

      case '/entradas': {
        const limit = url.searchParams.get('limit') || '50'
        const mes = url.searchParams.get('mes')

        let query = supabase
          .from('entradas')
          .select('id, descricao, valor, data, categoria, created_at')
          .order('created_at', { ascending: false })
          .limit(parseInt(limit))

        if (mes) {
          const startDate = `${mes}-01`
          const endDate = `${mes}-31`
          query = query.gte('data', startDate).lte('data', endDate)
        }

        const { data: entradas, error } = await query

        if (error) throw error
        
        const total = entradas?.reduce((sum, e) => sum + (e.valor || 0), 0) || 0
        data = { entradas, total, count: entradas?.length || 0 }
        break
      }

      case '/vendas-hotmart': {
        const limit = url.searchParams.get('limit') || '50'
        
        const { data: vendas, error } = await supabase
          .from('transacoes_hotmart_completo')
          .select('id, buyer_name, buyer_email, product_name, valor_bruto, status, data_compra')
          .in('status', ['approved', 'purchase_approved', 'purchase_complete'])
          .order('data_compra', { ascending: false })
          .limit(parseInt(limit))

        if (error) throw error
        
        const totalVendas = vendas?.reduce((sum, v) => sum + (v.valor_bruto || 0), 0) || 0
        data = { vendas, total: totalVendas, count: vendas?.length || 0 }
        break
      }

      case '/funcionarios': {
        const { data: funcionarios, error } = await supabase
          .from('employees')
          .select('id, nome, funcao, setor, status, email')
          .eq('status', 'ativo')
          .order('nome')

        if (error) throw error
        data = { funcionarios, total: funcionarios?.length || 0 }
        break
      }

      case '/tarefas-hoje': {
        const { data: tarefas, error } = await supabase
          .from('calendar_tasks')
          .select('id, title, description, is_completed, priority, task_time')
          .eq('task_date', new Date().toISOString().split('T')[0])
          .order('task_time', { ascending: true })

        if (error) throw error
        
        const completadas = tarefas?.filter(t => t.is_completed).length || 0
        data = { 
          tarefas, 
          total: tarefas?.length || 0, 
          completadas,
          pendentes: (tarefas?.length || 0) - completadas
        }
        break
      }

      case '/health': {
        data = { 
          status: 'ok', 
          timestamp: new Date().toISOString(),
          uptime: performance.now(),
          cache_size: cache.size
        }
        break
      }

      case '/refresh-stats': {
        await supabase.rpc('refresh_dashboard_stats')
        data = { refreshed: true, timestamp: new Date().toISOString() }
        cache.delete('GET:/dashboard')
        cache.delete('GET:/dashboard-stats')
        break
      }

      // TEMPORÁRIO: Reset senha de teste - REMOVER APÓS USO
      case '/reset-test-password': {
        const key = url.searchParams.get('key')
        if (key !== 'RESET_2025_OWNER') {
          return new Response(
            JSON.stringify({ error: 'Chave inválida' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        const targetUserId = 'facb59d5-4100-4034-8397-6da251390cea'
        const newPassword = 'Eocomando32!!!'
        
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          targetUserId,
          { password: newPassword }
        )
        
        if (updateError) {
          data = { error: updateError.message }
        } else {
          data = { 
            success: true, 
            message: 'Senha resetada!',
            credentials: {
              email: 'testedomoisa@gmail.com',
              password: newPassword
            }
          }
        }
        break
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Endpoint não encontrado', path }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    // Salvar no cache (exceto health e refresh)
    if (!path.includes('health') && !path.includes('refresh')) {
      cache.set(cacheKey, { data, ts: Date.now() })
    }

    const latency = Date.now() - startTime
    console.log(`[api-fast] Response: ${path} - ${latency}ms`)

    return new Response(
      JSON.stringify({
        ...(data as object),
        _cache: false,
        _latency: latency
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-Cache': 'MISS',
          'X-Response-Time': `${latency}ms`
        }
      }
    )

  } catch (error) {
    console.error('[api-fast] Error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro interno',
        path,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
