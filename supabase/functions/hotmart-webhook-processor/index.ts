// ============================================
// MOISÉS MEDEIROS v14.0 - Hotmart Webhook PASSIVO
// APENAS ESCUTA - NÃO INTERFERE EM NADA
// Processa apenas compras reais da Hotmart
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hotmart-hottok, x-webhook-source',
};

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const payload = await req.json();
    
    console.log("[Hotmart v14] ====== WEBHOOK RECEBIDO ======");
    console.log("[Hotmart v14] Payload recebido:", JSON.stringify(payload).substring(0, 500));
    
    // ============================================
    // EXTRAIR DADOS - FLEXÍVEL PARA MÚLTIPLAS FONTES
    // ============================================
    
    // Tentar extrair de estrutura Hotmart padrão
    let buyerEmail = "";
    let buyerName = "";
    let buyerPhone = "";
    let transactionId = "";
    let purchaseValue = 0;
    let productName = "";
    let eventType = payload.event || payload.status || "";
    
    // Estrutura Hotmart oficial: payload.data.buyer
    if (payload.data?.buyer?.email) {
      buyerEmail = payload.data.buyer.email;
      buyerName = payload.data.buyer.name || "";
      buyerPhone = payload.data.buyer.checkout_phone || payload.data.buyer.phone || "";
      transactionId = payload.data.purchase?.transaction || "";
      purchaseValue = payload.data.purchase?.price?.value || payload.data.purchase?.value || 0;
      productName = payload.data.product?.name || "Curso Hotmart";
    }
    // Estrutura alternativa: payload.buyer diretamente
    else if (payload.buyer?.email) {
      buyerEmail = payload.buyer.email;
      buyerName = payload.buyer.name || "";
      buyerPhone = payload.buyer.phone || "";
      transactionId = payload.purchase?.transaction || payload.transaction_id || "";
      purchaseValue = payload.purchase?.price?.value || payload.purchase?.value || payload.value || 0;
      productName = payload.product?.name || "Curso";
    }
    // Estrutura simples: email direto no payload
    else if (payload.email) {
      buyerEmail = payload.email;
      buyerName = payload.name || payload.nome || "";
      buyerPhone = payload.phone || payload.telefone || "";
      transactionId = payload.transaction_id || payload.transaction || "";
      purchaseValue = payload.value || payload.valor || 0;
      productName = payload.product_name || payload.produto || "Curso";
    }
    
    console.log("[Hotmart v14] Dados extraídos:", {
      email: buyerEmail,
      nome: buyerName,
      evento: eventType,
      transacao: transactionId,
      valor: purchaseValue
    });
    
    // ============================================
    // VALIDAÇÃO MÍNIMA - SÓ PRECISA DE EMAIL VÁLIDO
    // ============================================
    
    // Sem email? Apenas registra e sai
    if (!buyerEmail || !buyerEmail.includes("@")) {
      console.log("[Hotmart v14] ⚠️ Sem email válido - ignorando silenciosamente");
      
      await supabase.from("integration_events").insert({
        event_type: "webhook_ignored",
        source: "hotmart_v14",
        source_id: `ignored_${Date.now()}`,
        payload: payload,
        processed: false,
      });
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Received - no valid email"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    
    // Verificar se é evento de compra (flexível)
    const isApprovedEvent = [
      "PURCHASE_APPROVED", 
      "PURCHASE_COMPLETE", 
      "PURCHASE_DELAYED",
      "purchase.approved", 
      "purchase.completed",
      "purchase_approved",
      "approved",
      "completed"
    ].includes(eventType.toLowerCase ? eventType.toLowerCase() : eventType);
    
    // Se não for evento de compra E não tiver valor, ignora silenciosamente
    if (!isApprovedEvent && purchaseValue <= 0) {
      console.log("[Hotmart v14] ⚠️ Não é compra aprovada - apenas registrando");
      
      await supabase.from("integration_events").insert({
        event_type: eventType || "unknown",
        source: "hotmart_v14",
        source_id: `event_${Date.now()}`,
        payload: payload,
        processed: false,
      });
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Event recorded"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    
    // ============================================
    // VERIFICAR DUPLICATA
    // ============================================
    if (transactionId) {
      const { data: existingTx } = await supabase
        .from("integration_events")
        .select("id")
        .eq("source_id", transactionId)
        .eq("processed", true)
        .maybeSingle();
      
      if (existingTx) {
        console.log("[Hotmart v14] ⚠️ Transação já processada:", transactionId);
        return new Response(JSON.stringify({ 
          success: true, 
          message: "Already processed"
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }
    
    // ============================================
    // CRIAR/ATUALIZAR ALUNO
    // ============================================
    console.log("[Hotmart v14] ✅ Processando compra...");
    
    const { data: aluno, error: alunoError } = await supabase
      .from("alunos")
      .upsert({
        nome: buyerName || "Aluno Hotmart",
        email: buyerEmail,
        telefone: buyerPhone || null,
        status: "ativo",
        data_matricula: new Date().toISOString(),
        valor_pago: purchaseValue,
        hotmart_transaction_id: transactionId || null,
        fonte: "Hotmart",
        observacoes: `Produto: ${productName} | Compra processada em ${new Date().toLocaleString("pt-BR")}`,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "email",
        ignoreDuplicates: false
      })
      .select()
      .single();
    
    let alunoId = aluno?.id;
    
    if (alunoError) {
      console.log("[Hotmart v14] Upsert falhou, buscando existente:", alunoError.message);
      const { data: existing } = await supabase
        .from("alunos")
        .select("id")
        .eq("email", buyerEmail)
        .maybeSingle();
      alunoId = existing?.id;
    }
    
    console.log("[Hotmart v14] ✅ Aluno:", alunoId);
    
    // ============================================
    // REGISTRAR RECEITA (se valor > 0)
    // ============================================
    if (purchaseValue > 0) {
      await supabase.from("entradas").insert({
        descricao: `Venda Hotmart - ${buyerName || buyerEmail} - ${productName}`,
        valor: purchaseValue,
        categoria: "Vendas",
        data: new Date().toISOString(),
        fonte: "Hotmart",
        aluno_id: alunoId,
        transaction_id: transactionId || null,
      });
      
      console.log("[Hotmart v14] ✅ Receita registrada: R$", purchaseValue);
    }
    
    // ============================================
    // NOTIFICAÇÃO OWNER
    // ============================================
    const { data: ownerRole } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "owner")
      .maybeSingle();
    
    if (ownerRole?.user_id && purchaseValue > 0) {
      await supabase.from("notifications").insert({
        user_id: ownerRole.user_id,
        title: "💰 Nova Venda Hotmart",
        message: `${buyerName || buyerEmail}\nR$ ${purchaseValue.toFixed(2)}\n${productName}`,
        type: "sale",
        action_url: "/alunos",
      });
    }
    
    // ============================================
    // REGISTRAR EVENTO PROCESSADO
    // ============================================
    await supabase.from("integration_events").insert({
      event_type: eventType || "PURCHASE_APPROVED",
      source: "hotmart_v14",
      source_id: transactionId || `purchase_${Date.now()}`,
      payload: payload,
      processed: true,
      processed_at: new Date().toISOString(),
    });
    
    console.log("[Hotmart v14] ====== PROCESSADO COM SUCESSO ======");
    
    return new Response(JSON.stringify({ 
      success: true, 
      alunoId,
      message: "Purchase processed"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[Hotmart v14] Erro:", errorMessage);
    
    // SEMPRE retorna 200 para não quebrar nenhum fluxo externo
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
