// ============================================
// MOISÉS MEDEIROS - WordPress Webhook Receiver
// Recebe eventos do WordPress em tempo real
// ============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface WordPressEvent {
  event_type: 'user_registered' | 'user_login' | 'page_view' | 'form_submission' | 'woocommerce_order' | 'contact_form'
  user_email?: string
  user_name?: string
  user_ip?: string
  user_agent?: string
  page_url?: string
  referrer?: string
  event_data?: Record<string, unknown>
  timestamp?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Verificar secret para segurança
    const webhookSecret = req.headers.get('x-webhook-secret')
    const expectedSecret = Deno.env.get('WORDPRESS_WEBHOOK_SECRET') || 'moisesmedeiros2024'
    
    if (webhookSecret !== expectedSecret) {
      console.log('Invalid webhook secret')
      return new Response(
        JSON.stringify({ error: 'Invalid webhook secret' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json() as WordPressEvent
    console.log('WordPress event received:', body.event_type, body.user_email)

    // Inserir evento na tabela
    const { data: eventData, error: eventError } = await supabase
      .from('wordpress_events')
      .insert({
        event_type: body.event_type,
        event_data: body.event_data || {},
        user_email: body.user_email,
        user_name: body.user_name,
        user_ip: body.user_ip,
        user_agent: body.user_agent,
        page_url: body.page_url,
        referrer: body.referrer,
      })
      .select()
      .single()

    if (eventError) {
      console.error('Error inserting event:', eventError)
      throw eventError
    }

    // Atualizar métricas agregadas do dia
    const today = new Date().toISOString().split('T')[0]
    
    // Buscar métricas existentes
    const { data: existingMetrics } = await supabase
      .from('wordpress_metrics')
      .select('*')
      .eq('date', today)
      .single()

    if (existingMetrics) {
      // Atualizar métricas existentes
      const updates: Record<string, number> = {}
      
      if (body.event_type === 'user_registered') {
        updates.new_registrations = (existingMetrics.new_registrations || 0) + 1
        updates.total_users = (existingMetrics.total_users || 0) + 1
      } else if (body.event_type === 'user_login') {
        updates.active_users = (existingMetrics.active_users || 0) + 1
      } else if (body.event_type === 'page_view') {
        updates.page_views = (existingMetrics.page_views || 0) + 1
      }

      if (Object.keys(updates).length > 0) {
        await supabase
          .from('wordpress_metrics')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('date', today)
      }
    } else {
      // Criar novo registro de métricas
      const newMetrics: Record<string, unknown> = {
        date: today,
        new_registrations: body.event_type === 'user_registered' ? 1 : 0,
        active_users: body.event_type === 'user_login' ? 1 : 0,
        page_views: body.event_type === 'page_view' ? 1 : 0,
      }

      await supabase
        .from('wordpress_metrics')
        .insert(newMetrics)
    }

    console.log('WordPress event processed successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        event_id: eventData?.id,
        message: 'Event received and processed'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('WordPress webhook error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
