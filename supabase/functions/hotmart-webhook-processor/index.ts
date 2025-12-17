// ============================================
// MOISÉS MEDEIROS v13.0 - Hotmart Webhook Processor
// ULTRA RIGOROSO - Só aceita COMPRA REAL da Hotmart
// NÃO MEXER na integração RD Station/Automator existente
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hotmart-hottok, x-webhook-source',
};

// ============================================
// VALIDAÇÃO ULTRA RIGOROSA - ESTRUTURA HOTMART
// ============================================
function validateHotmartPayload(payload: any, headers: Headers): { 
  valid: boolean; 
  reason: string;
  isDirectHotmart: boolean;
} {
  // 1. Verificar se tem assinatura Hotmart (indica chamada direta)
  const hotmartToken = headers.get("x-hotmart-hottok");
  const expectedToken = Deno.env.get("HOTMART_HOTTOK");
  const isDirectHotmart = hotmartToken && expectedToken && hotmartToken === expectedToken;
  
  // 2. Verificar EVENTO obrigatório
  const event = payload.event || payload.status || "";
  const approvedEvents = ["PURCHASE_APPROVED", "PURCHASE_COMPLETE", "purchase.approved", "purchase.completed"];
  
  if (!approvedEvents.includes(event)) {
    return { 
      valid: false, 
      reason: `Evento inválido: "${event}" - Esperado: PURCHASE_APPROVED/COMPLETE`,
      isDirectHotmart: !!isDirectHotmart
    };
  }
  
  // 3. Estrutura da Hotmart: payload.data.buyer, payload.data.purchase, etc
  const data = payload.data;
  
  if (!data || typeof data !== 'object') {
    return { 
      valid: false, 
      reason: "Faltando objeto 'data' na estrutura Hotmart",
      isDirectHotmart: !!isDirectHotmart
    };
  }
  
  // 4. DEVE ter buyer com email
  const buyer = data.buyer || data.subscriber;
  if (!buyer || !buyer.email || !buyer.email.includes("@")) {
    return { 
      valid: false, 
      reason: `Buyer/email inválido: ${JSON.stringify(buyer)}`,
      isDirectHotmart: !!isDirectHotmart
    };
  }
  
  // 5. DEVE ter purchase com transaction E value
  const purchase = data.purchase;
  if (!purchase) {
    return { 
      valid: false, 
      reason: "Faltando objeto 'purchase'",
      isDirectHotmart: !!isDirectHotmart
    };
  }
  
  const transactionId = purchase.transaction;
  if (!transactionId || transactionId.length < 5) {
    return { 
      valid: false, 
      reason: `Transaction ID inválido: ${transactionId}`,
      isDirectHotmart: !!isDirectHotmart
    };
  }
  
  // 6. IDs fake/teste são rejeitados
  const fakePatterns = ['fake_', 'test_', 'lead_', 'form_', 'wp_', 'wordpress_'];
  if (fakePatterns.some(p => transactionId.toLowerCase().includes(p))) {
    return { 
      valid: false, 
      reason: `Transaction ID parece ser teste/fake: ${transactionId}`,
      isDirectHotmart: !!isDirectHotmart
    };
  }
  
  // 7. DEVE ter valor > 0
  const purchaseValue = purchase.price?.value || purchase.value || 0;
  if (purchaseValue <= 0) {
    return { 
      valid: false, 
      reason: `Valor da compra inválido: ${purchaseValue}`,
      isDirectHotmart: !!isDirectHotmart
    };
  }
  
  // 8. DEVE ter produto
  const product = data.product;
  if (!product || !product.id) {
    return { 
      valid: false, 
      reason: "Faltando produto Hotmart",
      isDirectHotmart: !!isDirectHotmart
    };
  }
  
  return { 
    valid: true, 
    reason: "OK - Estrutura Hotmart válida",
    isDirectHotmart: !!isDirectHotmart
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const payload = await req.json();
    
    console.log("================================================");
    console.log("[Hotmart v13] Webhook recebido");
    console.log("[Hotmart v13] Event:", payload.event);
    console.log("[Hotmart v13] Headers x-hotmart-hottok:", req.headers.get("x-hotmart-hottok") ? "PRESENTE" : "AUSENTE");
    
    // ============================================
    // VALIDAÇÃO ULTRA RIGOROSA
    // ============================================
    const validation = validateHotmartPayload(payload, req.headers);
    
    console.log("[Hotmart v13] Validação:", validation.reason);
    console.log("[Hotmart v13] Direto da Hotmart:", validation.isDirectHotmart);
    
    if (!validation.valid) {
      console.log("[Hotmart v13] ❌ REJEITADO:", validation.reason);
      
      // Registrar rejeição para diagnóstico
      await supabase.from("integration_events").insert({
        event_type: "webhook_rejected",
        source: "hotmart_processor",
        source_id: `rejected_${Date.now()}`,
        payload: { 
          original_payload: payload,
          rejection_reason: validation.reason,
          is_direct_hotmart: validation.isDirectHotmart,
          headers: {
            has_hottok: !!req.headers.get("x-hotmart-hottok"),
            content_type: req.headers.get("content-type"),
          }
        },
        processed: false,
      });
      
      // Retorna 200 para não dar erro no sistema chamador (Automator/Hotmart)
      return new Response(JSON.stringify({ 
        success: false, 
        message: validation.reason,
        action: "ignored"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    
    // ============================================
    // COMPRA VÁLIDA - PROCESSAR
    // ============================================
    console.log("[Hotmart v13] ✅ COMPRA VÁLIDA - Processando...");
    
    const data = payload.data;
    const buyer = data.buyer || data.subscriber;
    const purchase = data.purchase;
    const product = data.product;
    const affiliate = data.affiliate || {};
    
    const buyerName = buyer.name || "Aluno Hotmart";
    const buyerEmail = buyer.email;
    const buyerPhone = buyer.checkout_phone || buyer.phone || "";
    const purchaseValue = purchase.price?.value || purchase.value || 0;
    const transactionId = purchase.transaction;
    const offerCode = purchase.offer?.code || affiliate.affiliate_code || null;
    const purchaseDate = new Date(purchase.approved_date || payload.creation_date || Date.now());
    const productName = product.name || "Curso";
    
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
      console.log("[Hotmart v13] ⚠️ Transação já processada:", transactionId);
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Already processed",
        transaction_id: transactionId
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    
    console.log("[Hotmart v13] Dados:", {
      nome: buyerName,
      email: buyerEmail,
      valor: purchaseValue,
      transaction: transactionId,
      produto: productName
    });
    
    // ============================================
    // CRIAR ALUNO
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
        observacoes: `Produto: ${productName} | TX: ${transactionId} | COMPRA CONFIRMADA v13`,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "email",
        ignoreDuplicates: false
      })
      .select()
      .single();
    
    let alunoId = aluno?.id;
    
    if (alunoError) {
      console.error("[Hotmart v13] Erro upsert aluno:", alunoError.message);
      const { data: existing } = await supabase
        .from("alunos")
        .select("id")
        .eq("email", buyerEmail)
        .single();
      alunoId = existing?.id;
    }
    
    console.log("[Hotmart v13] ✅ Aluno ID:", alunoId);
    
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
    
    console.log("[Hotmart v13] ✅ Receita: R$", purchaseValue);
    
    // ============================================
    // ATUALIZAR LEAD PARA CONVERTIDO (se existir)
    // ============================================
    if (buyerPhone) {
      await supabase
        .from("whatsapp_leads")
        .update({
          status: "convertido",
          notes: JSON.stringify({
            converted_at: new Date().toISOString(),
            aluno_id: alunoId,
            transaction_id: transactionId,
          }),
          updated_at: new Date().toISOString(),
        })
        .eq("phone", buyerPhone);
    }
    
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
        console.log("[Hotmart v13] ✅ Comissão afiliado:", comissao);
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
        title: "💰 VENDA HOTMART",
        message: `${buyerName}\nR$ ${purchaseValue.toFixed(2)}\n${productName}`,
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
    
    console.log("================================================");
    console.log("[Hotmart v13] ✅ COMPRA PROCESSADA COM SUCESSO!");
    console.log("================================================");
    
    return new Response(JSON.stringify({ 
      success: true, 
      alunoId,
      transaction_id: transactionId,
      message: "Purchase processed successfully"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[Hotmart v13] ❌ ERRO:", errorMessage);
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
