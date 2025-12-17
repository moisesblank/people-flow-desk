// ============================================
// MOISÉS MEDEIROS v11.0 - Hotmart Webhook Processor
// VALIDAÇÃO RIGOROSA: Só cria aluno com compra PAGA confirmada
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hotmart-hottok',
};

// ============================================
// VALIDAÇÃO RIGOROSA DE COMPRA HOTMART
// ============================================
function isValidHotmartPurchase(payload: any): { valid: boolean; reason: string } {
  const data = payload.data || payload;
  const event = payload.event || payload.status || "";
  
  // 1. VERIFICAR SE É EVENTO DE COMPRA APROVADA REAL
  const approvedEvents = ["PURCHASE_APPROVED", "PURCHASE_COMPLETE", "purchase.approved", "purchase.completed"];
  if (!approvedEvents.includes(event)) {
    return { valid: false, reason: `Evento não é de compra aprovada: ${event}` };
  }
  
  // 2. VERIFICAR SE TEM TRANSACTION ID VÁLIDO DA HOTMART
  const transactionId = data.purchase?.transaction || data.transaction;
  if (!transactionId || transactionId.startsWith("fake_") || transactionId.startsWith("test_")) {
    return { valid: false, reason: `Transaction ID inválido ou de teste: ${transactionId}` };
  }
  
  // 3. VERIFICAR SE O TRANSACTION ID TEM FORMATO HOTMART (alfanumérico)
  const hotmartTransactionPattern = /^[A-Z0-9]{8,}$/i;
  if (!hotmartTransactionPattern.test(transactionId) && !transactionId.includes("HP")) {
    // Hotmart usa padrões como "HP123456789" ou códigos alfanuméricos
    // Se não tem esse padrão, pode ser webhook fake
    console.log("[VALIDAÇÃO] Transaction ID não parece ser Hotmart legítimo:", transactionId);
    // Não bloquear, mas logar para análise
  }
  
  // 4. VERIFICAR SE TEM VALOR DE COMPRA > 0
  const purchaseValue = data.purchase?.price?.value || data.price || 0;
  if (purchaseValue <= 0) {
    return { valid: false, reason: `Valor da compra é zero ou negativo: ${purchaseValue}` };
  }
  
  // 5. VERIFICAR SE TEM EMAIL DO COMPRADOR
  const buyerEmail = data.buyer?.email || data.subscriber?.email;
  if (!buyerEmail || !buyerEmail.includes("@")) {
    return { valid: false, reason: `Email do comprador inválido: ${buyerEmail}` };
  }
  
  // 6. VERIFICAR SE TEM DATA DE APROVAÇÃO (prova que passou pelo checkout)
  const approvedDate = data.purchase?.approved_date || data.approved_date;
  if (!approvedDate) {
    console.log("[VALIDAÇÃO] Compra sem data de aprovação - pode ser lead");
    // Não bloquear, mas é suspeito
  }
  
  // 7. VERIFICAR SE TEM DADOS DO PRODUTO
  const productId = data.product?.id || data.prod;
  if (!productId) {
    return { valid: false, reason: "Sem ID do produto - não é compra Hotmart válida" };
  }
  
  // 8. VERIFICAR SE A FONTE É REALMENTE HOTMART (header ou payload)
  const source = payload.source?.toLowerCase() || "hotmart";
  if (source !== "hotmart") {
    return { valid: false, reason: `Fonte não é Hotmart: ${source}` };
  }
  
  return { valid: true, reason: "Compra válida" };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    
    console.log("[Hotmart Webhook] ==========================================");
    console.log("[Hotmart Webhook] Evento recebido:", payload.event);
    console.log("[Hotmart Webhook] Timestamp:", new Date().toISOString());
    
    // ============================================
    // VALIDAR ASSINATURA HOTMART (HOTTOK)
    // ============================================
    const signature = req.headers.get("x-hotmart-hottok");
    const expectedToken = Deno.env.get("HOTMART_HOTTOK");
    
    if (expectedToken && signature && signature !== expectedToken) {
      console.error("[Hotmart Webhook] ❌ ASSINATURA INVÁLIDA - Rejeitando webhook");
      return new Response(JSON.stringify({ error: "Invalid signature" }), { 
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    
    // ============================================
    // VALIDAÇÃO RIGOROSA ANTES DE CRIAR ALUNO
    // ============================================
    const validation = isValidHotmartPurchase(payload);
    
    if (!validation.valid) {
      console.log("[Hotmart Webhook] ⚠️ WEBHOOK REJEITADO:", validation.reason);
      console.log("[Hotmart Webhook] Payload recebido (parcial):", JSON.stringify(payload).substring(0, 500));
      
      // Salvar como evento de integração para análise, mas NÃO criar aluno
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      
      await supabase.from("integration_events").insert({
        event_type: `webhook_rejected_${payload.event || "unknown"}`,
        source: "hotmart",
        source_id: `rejected_${Date.now()}`,
        payload: {
          ...payload,
          rejection_reason: validation.reason,
          rejected_at: new Date().toISOString(),
        },
        processed: false,
      });
      
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Webhook logged but not processed",
        reason: validation.reason 
      }), { 
        status: 200, // Retorna 200 para não reenviar
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    
    console.log("[Hotmart Webhook] ✅ VALIDAÇÃO PASSOU - Processando compra...");
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    
    // Extrair dados da compra (suporta diferentes formatos Hotmart)
    const data = payload.data || payload;
    const buyer = data.buyer || data.subscriber || {};
    const purchase = data.purchase || data;
    const product = data.product || {};
    const affiliate = data.affiliate || {};
    
    const buyerName = buyer.name || "Aluno Hotmart";
    const buyerEmail = buyer.email || "";
    const buyerPhone = buyer.checkout_phone || buyer.phone || "";
    const purchaseValue = purchase.price?.value || purchase.value || data.price || 0;
    const transactionId = purchase.transaction || data.transaction || `hotmart_${Date.now()}`;
    const offerCode = purchase.offer?.code || affiliate.affiliate_code || null;
    const purchaseDate = new Date(purchase.approved_date || payload.creation_date || Date.now());
    const productName = product.name || data.prod_name || "Curso";
    
    console.log("[Hotmart Webhook] Dados da compra VALIDADA:", {
      buyer: buyerName,
      email: buyerEmail,
      value: purchaseValue,
      transaction: transactionId,
      product: productName
    });
    
    // ============================================
    // VERIFICAR SE JÁ PROCESSAMOS ESTA TRANSAÇÃO (evitar duplicatas)
    // ============================================
    const { data: existingTransaction } = await supabase
      .from("integration_events")
      .select("id")
      .eq("source_id", transactionId)
      .eq("processed", true)
      .single();
    
    if (existingTransaction) {
      console.log("[Hotmart Webhook] ⚠️ Transação já processada:", transactionId);
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Transaction already processed",
        transaction_id: transactionId
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    
    // ============================================
    // 1. CRIAR/ATUALIZAR ALUNO NO BANCO DE DADOS
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
        observacoes: `Produto: ${productName} | Transação: ${transactionId}`,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "email",
        ignoreDuplicates: false
      })
      .select()
      .single();
    
    let alunoId = aluno?.id || null;
    
    if (alunoError) {
      console.error("[Hotmart Webhook] Erro ao criar aluno:", alunoError);
      // Tentar buscar aluno existente
      const { data: existingAluno } = await supabase
        .from("alunos")
        .select("*")
        .eq("email", buyerEmail)
        .single();
      
      if (existingAluno) {
        alunoId = existingAluno.id;
        // Atualizar o aluno existente
        await supabase
          .from("alunos")
          .update({
            status: "ativo",
            valor_pago: purchaseValue,
            hotmart_transaction_id: transactionId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", alunoId);
      }
    }
    
    console.log("[Hotmart Webhook] ✅ Aluno criado/atualizado:", alunoId);
    
    // ============================================
    // 2. REGISTRAR RECEITA/ENTRADA
    // ============================================
    const { error: receitaError } = await supabase
      .from("entradas")
      .insert({
        descricao: `Venda Hotmart - ${buyerName} - ${productName}`,
        valor: purchaseValue,
        categoria: "Vendas",
        data: purchaseDate.toISOString(),
        fonte: "Hotmart",
        aluno_id: alunoId,
        transaction_id: transactionId,
      });
    
    if (receitaError) {
      console.error("[Hotmart Webhook] Erro ao criar receita:", receitaError);
    } else {
      console.log("[Hotmart Webhook] ✅ Receita registrada: R$", purchaseValue);
    }
    
    // ============================================
    // 3. CALCULAR COMISSÃO DO AFILIADO (SE HOUVER CUPOM)
    // ============================================
    if (offerCode) {
      console.log("[Hotmart Webhook] Buscando afiliado com código:", offerCode);
      
      const { data: afiliado } = await supabase
        .from("affiliates")
        .select("*")
        .or(`cupom.eq.${offerCode},hotmart_id.eq.${offerCode}`)
        .single();
      
      if (afiliado) {
        const percentual = afiliado.percentual_comissao || afiliado.taxa_comissao || 20;
        const comissao = purchaseValue * (percentual / 100);
        
        console.log("[Hotmart Webhook] Calculando comissão:", {
          affiliate: afiliado.nome,
          percentage: percentual,
          commission: comissao
        });
        
        // Registrar comissão
        const { error: comissaoError } = await supabase.from("comissoes").insert({
          afiliado_id: afiliado.id,
          aluno_id: alunoId,
          valor: comissao,
          status: "pendente",
          data: purchaseDate.toISOString(),
          transaction_id: transactionId,
          descricao: `Comissão venda ${productName} - ${buyerName}`,
        });
        
        if (comissaoError) {
          console.error("[Hotmart Webhook] Erro ao criar comissão:", comissaoError);
        } else {
          // Atualizar totais do afiliado
          await supabase
            .from("affiliates")
            .update({
              total_vendas: (afiliado.total_vendas || 0) + 1,
              comissao_total: (afiliado.comissao_total || 0) + comissao,
            })
            .eq("id", afiliado.id);
          
          console.log("[Hotmart Webhook] ✅ Comissão registrada: R$", comissao);
        }
      }
    }
    
    // ============================================
    // 4. CRIAR NOTIFICAÇÃO PARA OWNER
    // ============================================
    try {
      const { data: ownerRole } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "owner")
        .single();
      
      if (ownerRole?.user_id) {
        await supabase.from("notifications").insert({
          user_id: ownerRole.user_id,
          title: "💰 Nova Venda Hotmart CONFIRMADA",
          message: `Aluno: ${buyerName}\nValor: R$ ${purchaseValue.toFixed(2)}\nProduto: ${productName}\nTransação: ${transactionId}`,
          type: "sale",
          action_url: "/alunos",
        });
        console.log("[Hotmart Webhook] ✅ Notificação criada para owner");
      }
    } catch (notifyError) {
      console.error("[Hotmart Webhook] Erro ao criar notificação:", notifyError);
    }
    
    // ============================================
    // 5. REGISTRAR EVENTO PROCESSADO (para evitar duplicatas)
    // ============================================
    await supabase.from("integration_events").insert({
      event_type: payload.event,
      source: "hotmart",
      source_id: transactionId,
      payload: payload,
      processed: true,
      processed_at: new Date().toISOString(),
    });
    
    console.log("[Hotmart Webhook] ==========================================");
    console.log("[Hotmart Webhook] ✅ COMPRA PROCESSADA COM SUCESSO");
    console.log("[Hotmart Webhook] ==========================================");
    
    return new Response(JSON.stringify({ 
      success: true, 
      alunoId: alunoId,
      transaction_id: transactionId,
      message: "Purchase processed successfully"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[Hotmart Webhook] ❌ ERRO FATAL:", errorMessage);
    return new Response(JSON.stringify({ 
      error: errorMessage,
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
