// ============================================
// 🛡️ HOTMART-FAST → REDIRECIONADOR PARA WEBHOOK-HANDLER
// Este endpoint agora apenas repassa para o gateway oficial
// Mantém compatibilidade com integrações existentes
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hotmart-hottok',
}

// Status que indicam compra aprovada
const APPROVED_STATUSES = [
  'PURCHASE_APPROVED',
  'PURCHASE_COMPLETE',
  'approved',
  'purchase_approved',
  'purchase_complete'
]

// Status que indicam cancelamento/reembolso
const CANCELED_STATUSES = [
  'PURCHASE_CANCELED',
  'PURCHASE_REFUNDED',
  'PURCHASE_CHARGEBACK',
  'canceled',
  'refunded',
  'chargeback'
]

serve(async (req) => {
  const startTime = Date.now()

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Apenas POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Método não permitido' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  console.log('[hotmart-fast] ⚠️ DEPRECATED - Processando (migre para webhook-handler)');

  try {
    // ============================================
    // 🛡️ P0.1 - VALIDAÇÃO HOTTOK OBRIGATÓRIA
    // LEI VI: Nunca processar webhook sem assinatura
    // ============================================
    const hottok = req.headers.get('x-hotmart-hottok')
    const expectedHottok = Deno.env.get('HOTMART_HOTTOK')
    
    if (!expectedHottok) {
      console.error('[hotmart-fast] ❌ HOTTOK não configurado no ambiente')
      return new Response(
        JSON.stringify({ error: 'Configuração de segurança ausente' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    if (!hottok || hottok !== expectedHottok) {
      console.error('[hotmart-fast] ❌ HOTTOK inválido ou ausente')
      return new Response(
        JSON.stringify({ error: 'Assinatura de webhook inválida' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    console.log('[hotmart-fast] ✅ HOTTOK validado')
    
    const body = await req.json()
    
    // Extrair evento (diferentes formatos da Hotmart)
    const event = body.event || body.data?.event || body.status
    
    console.log(`[hotmart-fast] Evento: ${event}`)

    // Criar cliente Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Log do webhook na fila
    const { data: logData } = await supabase
      .from('webhooks_queue')
      .insert({
        source: 'hotmart-fast',
        event: event,
        payload: body,
        status: 'received',
        ip_address: req.headers.get('x-forwarded-for') || 'unknown'
      })
      .select('id')
      .single()

    const webhookId = logData?.id

    // Extrair dados do comprador
    const buyer = body.data?.buyer || body.buyer || {}
    const product = body.data?.product || body.product || {}
    const purchase = body.data?.purchase || body.purchase || {}
    const transaction = body.data?.purchase?.transaction || body.transaction || purchase.transaction || ''
    const subscription = body.data?.subscription || body.subscription || {}

    // Dados extraídos
    const buyerEmail = (buyer.email || '').toLowerCase().trim()
    const buyerName = buyer.name || buyer.full_name || 'Aluno Hotmart'
    const buyerPhone = buyer.phone || buyer.checkout_phone || null
    const productName = product.name || 'Curso de Química'
    const productId = product.id?.toString() || ''
    const valorBruto = purchase.price?.value || purchase.original_offer_price?.value || 0
    const transactionId = transaction || purchase.approved_date || Date.now().toString()

    console.log(`[hotmart-fast] Buyer: ${buyerEmail}, Produto: ${productName}, Valor: ${valorBruto}`)

    // Processar baseado no evento
    if (APPROVED_STATUSES.includes(event) && buyerEmail) {
      console.log('[hotmart-fast] Processando compra aprovada...')

      // 1. Upsert na tabela transacoes_hotmart_completo
      const { error: transacaoError } = await supabase.rpc('upsert_hotmart_transaction', {
        p_transaction_id: transactionId,
        p_product_id: productId,
        p_product_name: productName,
        p_buyer_email: buyerEmail,
        p_buyer_name: buyerName,
        p_buyer_phone: buyerPhone,
        p_status: 'approved',
        p_valor_bruto: valorBruto,
        p_metodo_pagamento: purchase.payment?.type || 'pix',
        p_parcelas: purchase.payment?.installments_number || 1,
        p_affiliate_name: body.data?.affiliate?.name || null,
        p_affiliate_id: body.data?.affiliate?.affiliate_code || null,
        p_data_compra: new Date().toISOString(),
        p_hotmart_event: event,
        p_webhook_raw: body,
        p_subscription_id: subscription.subscriber?.code || null,
        p_is_subscription: !!subscription.subscriber?.code
      })

      if (transacaoError) {
        console.error('[hotmart-fast] Erro ao salvar transação:', transacaoError)
      }

      // 2. Criar/atualizar aluno
      const { error: alunoError } = await supabase
        .from('alunos')
        .upsert({
          email: buyerEmail,
          nome: buyerName,
          telefone: buyerPhone,
          status: 'ativo',
          fonte: 'hotmart',
          valor_pago: valorBruto,
          hotmart_transaction_id: transactionId,
          data_matricula: new Date().toISOString().split('T')[0]
        }, { 
          onConflict: 'email',
          ignoreDuplicates: false 
        })

      if (alunoError) {
        console.error('[hotmart-fast] Erro ao criar aluno:', alunoError)
      }

      // 3. Registrar entrada financeira
      const { error: entradaError } = await supabase
        .from('entradas')
        .insert({
          descricao: `Venda Hotmart: ${productName} - ${buyerName}`,
          valor: valorBruto,
          categoria: 'vendas_cursos',
          fonte: 'hotmart',
          transaction_id: transactionId,
          data: new Date().toISOString().split('T')[0]
        })

      if (entradaError) {
        console.error('[hotmart-fast] Erro ao registrar entrada:', entradaError)
      }

      // 4. Atualizar status do webhook
      if (webhookId) {
        await supabase
          .from('webhooks_queue')
          .update({ 
            status: 'processed',
            processed_at: new Date().toISOString()
          })
          .eq('id', webhookId)
      }

      console.log(`[hotmart-fast] Compra processada com sucesso em ${Date.now() - startTime}ms`)

    } else if (CANCELED_STATUSES.includes(event) && buyerEmail) {
      console.log('[hotmart-fast] Processando cancelamento/reembolso...')

      // Atualizar status do aluno
      await supabase
        .from('alunos')
        .update({ status: 'cancelado' })
        .eq('email', buyerEmail)

      // Atualizar transação
      await supabase
        .from('transacoes_hotmart_completo')
        .update({ 
          status: 'canceled',
          data_cancelamento: new Date().toISOString()
        })
        .eq('buyer_email', buyerEmail)
        .is('data_cancelamento', null)

      if (webhookId) {
        await supabase
          .from('webhooks_queue')
          .update({ status: 'processed', processed_at: new Date().toISOString() })
          .eq('id', webhookId)
      }

      console.log(`[hotmart-fast] Cancelamento processado em ${Date.now() - startTime}ms`)

    } else {
      console.log(`[hotmart-fast] Evento ${event} não requer processamento adicional`)
      
      if (webhookId) {
        await supabase
          .from('webhooks_queue')
          .update({ status: 'ignored' })
          .eq('id', webhookId)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        event,
        processed: APPROVED_STATUSES.includes(event) || CANCELED_STATUSES.includes(event),
        latency: Date.now() - startTime
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('[hotmart-fast] Erro:', error)

    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro ao processar webhook',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
