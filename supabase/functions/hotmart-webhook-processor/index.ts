import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hotmart-hottok',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    
    console.log("[Hotmart Webhook Processor] Received event:", payload.event);
    
    // Validar assinatura do Hotmart
    const signature = req.headers.get("x-hotmart-hottok");
    const expectedToken = Deno.env.get("HOTMART_HOTTOK") || Deno.env.get("HOTMART_WEBHOOK_TOKEN") || "tramon_moises_2024";
    
    if (signature && signature !== expectedToken) {
      console.error("[Hotmart Webhook Processor] Invalid signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), { 
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    
    // Processar apenas PURCHASE_APPROVED e PURCHASE_COMPLETE
    const validEvents = ["PURCHASE_APPROVED", "PURCHASE_COMPLETE", "purchase.approved", "purchase.completed"];
    if (!validEvents.includes(payload.event)) {
      console.log("[Hotmart Webhook Processor] Event ignored:", payload.event);
      return new Response(JSON.stringify({ message: "Event ignored" }), { 
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    
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
    
    console.log("[Hotmart Webhook Processor] Processing purchase:", {
      buyer: buyerName,
      email: buyerEmail,
      value: purchaseValue,
      transaction: transactionId,
      offerCode: offerCode,
      product: productName
    });
    
    // 1. CRIAR/ATUALIZAR ALUNO NO BANCO DE DADOS
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
        observacoes: `Produto: ${productName}`,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "email",
        ignoreDuplicates: false
      })
      .select()
      .single();
    
    if (alunoError) {
      console.error("[Hotmart Webhook Processor] Error creating student:", alunoError);
      // Tentar buscar aluno existente
      const { data: existingAluno } = await supabase
        .from("alunos")
        .select("*")
        .eq("email", buyerEmail)
        .single();
      
      if (!existingAluno) {
        throw alunoError;
      }
    }
    
    const alunoId = aluno?.id || null;
    console.log("[Hotmart Webhook Processor] Student created/updated:", alunoId);
    
    // 2. REGISTRAR RECEITA/ENTRADA
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
      console.error("[Hotmart Webhook Processor] Error creating revenue:", receitaError);
    } else {
      console.log("[Hotmart Webhook Processor] Revenue registered: R$", purchaseValue);
    }
    
    // 3. CALCULAR COMISSÃO DO AFILIADO (SE HOUVER CUPOM)
    if (offerCode) {
      console.log("[Hotmart Webhook Processor] Looking for affiliate with code:", offerCode);
      
      const { data: afiliado } = await supabase
        .from("affiliates")
        .select("*")
        .or(`cupom.eq.${offerCode},hotmart_id.eq.${offerCode}`)
        .single();
      
      if (afiliado) {
        const percentual = afiliado.percentual_comissao || afiliado.taxa_comissao || 20;
        const comissao = purchaseValue * (percentual / 100);
        
        console.log("[Hotmart Webhook Processor] Calculating commission:", {
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
          console.error("[Hotmart Webhook Processor] Error creating commission:", comissaoError);
        } else {
          // Atualizar totais do afiliado
          await supabase
            .from("affiliates")
            .update({
              total_vendas: (afiliado.total_vendas || 0) + 1,
              comissao_total: (afiliado.comissao_total || 0) + comissao,
            })
            .eq("id", afiliado.id);
          
          console.log("[Hotmart Webhook Processor] Affiliate commission registered: R$", comissao);
        }
      } else {
        console.log("[Hotmart Webhook Processor] Affiliate not found for code:", offerCode);
      }
    }
    
    // 4. CRIAR NOTIFICAÇÃO PARA OWNER
    try {
      await supabase.from("notifications").insert({
        user_id: (await supabase.from("user_roles").select("user_id").eq("role", "owner").single()).data?.user_id,
        title: "💰 Nova Venda Hotmart",
        message: `Aluno: ${buyerName}\nValor: R$ ${purchaseValue.toFixed(2)}\nProduto: ${productName}`,
        type: "sale",
        action_url: "/alunos",
      });
      console.log("[Hotmart Webhook Processor] Owner notification created");
    } catch (notifyError) {
      console.error("[Hotmart Webhook Processor] Error creating notification:", notifyError);
    }
    
    // 5. Registrar evento no log
    await supabase.from("integration_events").insert({
      event_type: payload.event,
      source: "hotmart",
      source_id: transactionId,
      payload: payload,
      processed: true,
      processed_at: new Date().toISOString(),
    });
    
    console.log("[Hotmart Webhook Processor] ✅ Purchase processed successfully");
    
    return new Response(JSON.stringify({ 
      success: true, 
      alunoId: alunoId,
      message: "Purchase processed successfully"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[Hotmart Webhook Processor] Fatal error:", errorMessage);
    return new Response(JSON.stringify({ 
      error: errorMessage,
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
