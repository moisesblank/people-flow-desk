// ============================================
// MOISÉS MEDEIROS v12.0 - Hotmart Webhook Processor
// FLUXO CORRETO:
// 1. Aluno preenche formulário nas URLs → salva como LEAD
// 2. Aluno vai pra Hotmart e COMPRA → webhook cria ALUNO
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hotmart-hottok, x-webhook-source',
};

// ============================================
// VALIDAÇÃO: Só processa se for COMPRA REAL HOTMART
// ============================================
function isRealHotmartPurchase(payload: any): { valid: boolean; reason: string } {
  const data = payload.data || payload;
  const event = payload.event || payload.status || "";
  
  // 1. DEVE ser evento de compra aprovada
  const approvedEvents = ["PURCHASE_APPROVED", "PURCHASE_COMPLETE", "purchase.approved", "purchase.completed"];
  if (!approvedEvents.includes(event)) {
    return { valid: false, reason: `Evento não é compra: ${event}` };
  }
  
  // 2. DEVE ter transaction ID válido
  const transactionId = data.purchase?.transaction || data.transaction;
  if (!transactionId) {
    return { valid: false, reason: "Sem transaction ID" };
  }
  
  // 3. DEVE ter valor > 0
  const purchaseValue = data.purchase?.price?.value || data.price || 0;
  if (purchaseValue <= 0) {
    return { valid: false, reason: `Valor inválido: ${purchaseValue}` };
  }
  
  // 4. DEVE ter email
  const buyerEmail = data.buyer?.email || data.subscriber?.email;
  if (!buyerEmail || !buyerEmail.includes("@")) {
    return { valid: false, reason: "Email inválido" };
  }
  
  // 5. DEVE ter produto Hotmart
  const productId = data.product?.id || data.prod;
  if (!productId) {
    return { valid: false, reason: "Sem produto Hotmart" };
  }
  
  return { valid: true, reason: "OK" };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const webhookSource = req.headers.get("x-webhook-source") || "";
    
    console.log("[Hotmart] ==========================================");
    console.log("[Hotmart] Evento:", payload.event);
    console.log("[Hotmart] Source header:", webhookSource);
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    
    // ============================================
    // CASO 1: É LEAD/CADASTRO DO FORMULÁRIO (NÃO CRIAR ALUNO)
    // ============================================
    const isLeadWebhook = webhookSource === "wordpress_form" || 
                          webhookSource === "lead_capture" ||
                          payload.event === "lead_captured" ||
                          payload.event === "form_submitted" ||
                          payload.event === "user_registered" ||
                          payload.type === "lead";
    
    if (isLeadWebhook) {
      console.log("[Hotmart] ⚠️ É LEAD/CADASTRO - Salvando apenas como lead, NÃO criando aluno");
      
      const leadData = payload.data || payload;
      const leadEmail = leadData.email || leadData.buyer?.email || leadData.user_email || "";
      const leadName = leadData.name || leadData.buyer?.name || leadData.user_name || "Lead";
      const leadPhone = leadData.phone || leadData.buyer?.phone || leadData.telefone || "";
      const sourceUrl = leadData.source_url || leadData.page_url || payload.source_url || "";
      
      // Salvar como LEAD (não como aluno)
      const { error: leadError } = await supabase
        .from("whatsapp_leads")
        .upsert({
          name: leadName,
          phone: leadPhone,
          external_id: `lead_${Date.now()}`,
          source: sourceUrl.includes("fisico") ? "cadastro-produto-fisico" : 
                  sourceUrl.includes("digital") ? "cadastro-produto-digital" : "formulario_site",
          status: "aguardando_compra",
          last_message: `Lead capturado via formulário. Email: ${leadEmail}`,
          notes: JSON.stringify({
            email: leadEmail,
            source_url: sourceUrl,
            captured_at: new Date().toISOString(),
            awaiting_purchase: true
          }),
          updated_at: new Date().toISOString(),
        }, { onConflict: "phone" });
      
      // Também salvar no integration_events para rastreio
      await supabase.from("integration_events").insert({
        event_type: "lead_captured",
        source: "formulario_site",
        source_id: `lead_${leadEmail}_${Date.now()}`,
        payload: {
          email: leadEmail,
          name: leadName,
          phone: leadPhone,
          source_url: sourceUrl,
          captured_at: new Date().toISOString(),
          status: "aguardando_compra_hotmart"
        },
        processed: false, // Será true quando comprar
      });
      
      console.log("[Hotmart] ✅ Lead salvo - Aguardando compra na Hotmart");
      
      return new Response(JSON.stringify({ 
        success: true, 
        type: "lead",
        message: "Lead saved - awaiting Hotmart purchase"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    
    // ============================================
    // CASO 2: VALIDAR SE É COMPRA REAL HOTMART
    // ============================================
    const validation = isRealHotmartPurchase(payload);
    
    if (!validation.valid) {
      console.log("[Hotmart] ❌ NÃO É COMPRA VÁLIDA:", validation.reason);
      
      // Salvar para análise
      await supabase.from("integration_events").insert({
        event_type: `webhook_rejected_${payload.event || "unknown"}`,
        source: "hotmart",
        source_id: `rejected_${Date.now()}`,
        payload: { ...payload, rejection_reason: validation.reason },
        processed: false,
      });
      
      return new Response(JSON.stringify({ 
        success: false, 
        message: validation.reason 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    
    // ============================================
    // VALIDAR ASSINATURA HOTMART
    // ============================================
    const signature = req.headers.get("x-hotmart-hottok");
    const expectedToken = Deno.env.get("HOTMART_HOTTOK");
    
    if (expectedToken && signature && signature !== expectedToken) {
      console.error("[Hotmart] ❌ ASSINATURA INVÁLIDA");
      return new Response(JSON.stringify({ error: "Invalid signature" }), { 
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    
    console.log("[Hotmart] ✅ COMPRA VÁLIDA HOTMART - Processando...");
    
    // Extrair dados
    const data = payload.data || payload;
    const buyer = data.buyer || data.subscriber || {};
    const purchase = data.purchase || data;
    const product = data.product || {};
    const affiliate = data.affiliate || {};
    
    const buyerName = buyer.name || "Aluno Hotmart";
    const buyerEmail = buyer.email || "";
    const buyerPhone = buyer.checkout_phone || buyer.phone || "";
    const purchaseValue = purchase.price?.value || purchase.value || data.price || 0;
    const transactionId = purchase.transaction || data.transaction;
    const offerCode = purchase.offer?.code || affiliate.affiliate_code || null;
    const purchaseDate = new Date(purchase.approved_date || payload.creation_date || Date.now());
    const productName = product.name || data.prod_name || "Curso";
    
    // ============================================
    // VERIFICAR DUPLICATA
    // ============================================
    const { data: existingTx } = await supabase
      .from("integration_events")
      .select("id")
      .eq("source_id", transactionId)
      .eq("processed", true)
      .single();
    
    if (existingTx) {
      console.log("[Hotmart] ⚠️ Transação já processada:", transactionId);
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Already processed" 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    
    console.log("[Hotmart] Dados da compra:", {
      buyer: buyerName,
      email: buyerEmail,
      value: purchaseValue,
      transaction: transactionId
    });
    
    // ============================================
    // CRIAR ALUNO (AGORA SIM!)
    // ============================================
    const { data: aluno, error: alunoError } = await supabase
      .from("alunos")
      .upsert({
        nome: buyerName,
        email: buyerEmail,
        telefone: buyerPhone,
        status: "ativo",
        data_matricula: purchaseDate.toISOString(),
        valor_pago: purchaseValue,
        hotmart_transaction_id: transactionId,
        fonte: "Hotmart",
        observacoes: `Produto: ${productName} | Transação: ${transactionId} | COMPRA CONFIRMADA`,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "email",
        ignoreDuplicates: false
      })
      .select()
      .single();
    
    let alunoId = aluno?.id;
    
    if (alunoError) {
      console.error("[Hotmart] Erro ao criar aluno:", alunoError);
      const { data: existing } = await supabase
        .from("alunos")
        .select("id")
        .eq("email", buyerEmail)
        .single();
      alunoId = existing?.id;
    }
    
    console.log("[Hotmart] ✅ ALUNO CRIADO:", alunoId);
    
    // ============================================
    // REGISTRAR RECEITA
    // ============================================
    await supabase.from("entradas").insert({
      descricao: `Venda Hotmart - ${buyerName} - ${productName}`,
      valor: purchaseValue,
      categoria: "Vendas",
      data: purchaseDate.toISOString(),
      fonte: "Hotmart",
      aluno_id: alunoId,
      transaction_id: transactionId,
    });
    
    console.log("[Hotmart] ✅ Receita registrada: R$", purchaseValue);
    
    // ============================================
    // ATUALIZAR LEAD PARA "CONVERTIDO" (se existir)
    // ============================================
    await supabase
      .from("whatsapp_leads")
      .update({
        status: "convertido",
        notes: JSON.stringify({
          converted_at: new Date().toISOString(),
          aluno_id: alunoId,
          transaction_id: transactionId,
          purchase_value: purchaseValue
        }),
        updated_at: new Date().toISOString(),
      })
      .or(`phone.eq.${buyerPhone},name.ilike.%${buyerEmail.split('@')[0]}%`);
    
    // Atualizar integration_events do lead para "processed"
    await supabase
      .from("integration_events")
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq("event_type", "lead_captured")
      .ilike("source_id", `%${buyerEmail}%`);
    
    // ============================================
    // COMISSÃO AFILIADO
    // ============================================
    if (offerCode) {
      const { data: afiliado } = await supabase
        .from("affiliates")
        .select("*")
        .or(`cupom.eq.${offerCode},hotmart_id.eq.${offerCode}`)
        .single();
      
      if (afiliado) {
        const comissao = purchaseValue * ((afiliado.percentual_comissao || 20) / 100);
        await supabase.from("comissoes").insert({
          afiliado_id: afiliado.id,
          aluno_id: alunoId,
          valor: comissao,
          status: "pendente",
          data: purchaseDate.toISOString(),
          transaction_id: transactionId,
        });
        console.log("[Hotmart] ✅ Comissão:", comissao);
      }
    }
    
    // ============================================
    // NOTIFICAÇÃO OWNER
    // ============================================
    const { data: ownerRole } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "owner")
      .single();
    
    if (ownerRole?.user_id) {
      await supabase.from("notifications").insert({
        user_id: ownerRole.user_id,
        title: "💰 VENDA CONFIRMADA Hotmart",
        message: `Aluno: ${buyerName}\nValor: R$ ${purchaseValue.toFixed(2)}\nProduto: ${productName}`,
        type: "sale",
        action_url: "/alunos",
      });
    }
    
    // ============================================
    // REGISTRAR EVENTO PROCESSADO
    // ============================================
    await supabase.from("integration_events").insert({
      event_type: payload.event,
      source: "hotmart",
      source_id: transactionId,
      payload: payload,
      processed: true,
      processed_at: new Date().toISOString(),
    });
    
    console.log("[Hotmart] ==========================================");
    console.log("[Hotmart] ✅ COMPRA PROCESSADA COM SUCESSO!");
    console.log("[Hotmart] ==========================================");
    
    return new Response(JSON.stringify({ 
      success: true, 
      alunoId,
      transaction_id: transactionId,
      message: "Purchase processed - student created"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[Hotmart] ❌ ERRO:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
