// ============================================
// MOISÉS MEDEIROS v15.0 - Sistema Completo
// A) WordPress cria usuário → Registra LEAD (não cria aluno)
// B) Hotmart aprova compra → Cria ALUNO e converte lead
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hotmart-hottok, x-webhook-source',
};

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
    const webhookSource = req.headers.get("x-webhook-source") || payload.source || "";
    
    console.log("[v15] ====== WEBHOOK RECEBIDO ======");
    console.log("[v15] Source:", webhookSource);
    console.log("[v15] Payload:", JSON.stringify(payload).substring(0, 800));

    // ============================================
    // DETECTAR TIPO DE EVENTO
    // ============================================
    
    const isWordPressUserCreated = 
      webhookSource === "wordpress_automator" ||
      webhookSource === "wordpress_user_created" ||
      payload.event === "user_created" ||
      payload.type === "user_created" ||
      payload.trigger === "user_created";
    
    const isHotmartPurchase = 
      payload.event === "PURCHASE_APPROVED" ||
      payload.event === "PURCHASE_COMPLETE" ||
      payload.status === "approved" ||
      (payload.data?.purchase?.transaction && payload.data?.buyer?.email);

    console.log("[v15] WordPress User Created:", isWordPressUserCreated);
    console.log("[v15] Hotmart Purchase:", isHotmartPurchase);

    // ============================================
    // A) WORDPRESS - USUÁRIO CRIADO (APENAS LEAD)
    // NÃO CRIA ALUNO - APENAS REGISTRA
    // ============================================
    
    if (isWordPressUserCreated && !isHotmartPurchase) {
      console.log("[v15] 📝 Processando LEAD do WordPress...");
      
      const userEmail = payload.email || payload.user_email || "";
      const userName = payload.name || payload.display_name || payload.user_name || "";
      const adminEmail = payload.admin_email || payload.created_by || payload.admin || "Sistema";
      const createdAt = new Date().toISOString();
      
      if (!userEmail || !userEmail.includes("@")) {
        console.log("[v15] ❌ Email inválido para lead");
        return new Response(JSON.stringify({ 
          success: false, 
          message: "Email inválido" 
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      // Verificar se lead já existe
      const { data: existingLead } = await supabase
        .from("whatsapp_leads")
        .select("id, status")
        .eq("email", userEmail)
        .maybeSingle();
      
      if (existingLead) {
        console.log("[v15] ⚠️ Lead já existe:", existingLead.id);
        return new Response(JSON.stringify({ 
          success: true, 
          message: "Lead already exists",
          lead_id: existingLead.id
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      // CRIAR LEAD (NÃO ALUNO!)
      const { data: newLead, error: leadError } = await supabase
        .from("whatsapp_leads")
        .insert({
          name: userName || "Lead WordPress",
          email: userEmail,
          phone: payload.phone || payload.telefone || null,
          source: "wordpress_user_created",
          status: "aguardando_compra",
          notes: JSON.stringify({
            admin_criador: adminEmail,
            data_criacao: createdAt,
            origem: "WordPress - Usuário Criado",
            aguardando_hotmart: true
          }),
          created_at: createdAt,
          updated_at: createdAt,
        })
        .select()
        .single();
      
      if (leadError) {
        console.error("[v15] Erro ao criar lead:", leadError.message);
      } else {
        console.log("[v15] ✅ LEAD criado:", newLead.id);
      }
      
      // Registrar evento
      await supabase.from("integration_events").insert({
        event_type: "wordpress_user_created",
        source: "wordpress_automator",
        source_id: `wp_user_${Date.now()}`,
        payload: {
          user_email: userEmail,
          user_name: userName,
          admin_email: adminEmail,
          created_at: createdAt,
          action: "LEAD_CRIADO_AGUARDANDO_COMPRA"
        },
        processed: true,
        processed_at: createdAt,
      });
      
      // Notificar owner
      const { data: ownerRole } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "owner")
        .maybeSingle();
      
      if (ownerRole?.user_id) {
        await supabase.from("notifications").insert({
          user_id: ownerRole.user_id,
          title: "👤 Novo Lead WordPress",
          message: `${userName || userEmail}\nCriado por: ${adminEmail}\nAguardando compra Hotmart`,
          type: "info",
          action_url: "/alunos",
        });
      }
      
      console.log("[v15] ====== LEAD REGISTRADO (NÃO É ALUNO AINDA) ======");
      
      return new Response(JSON.stringify({ 
        success: true, 
        type: "lead_created",
        lead_id: newLead?.id,
        message: "Lead registrado - aguardando compra Hotmart",
        data: {
          email: userEmail,
          name: userName,
          admin: adminEmail,
          created_at: createdAt
        }
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    
    // ============================================
    // B) HOTMART - COMPRA APROVADA (CRIA ALUNO!)
    // ============================================
    
    if (isHotmartPurchase) {
      console.log("[v15] 💰 Processando COMPRA Hotmart...");
      
      // Extrair dados da estrutura Hotmart
      let buyerEmail = "";
      let buyerName = "";
      let buyerPhone = "";
      let transactionId = "";
      let purchaseValue = 0;
      let productName = "";
      
      // Estrutura Hotmart oficial
      if (payload.data?.buyer?.email) {
        buyerEmail = payload.data.buyer.email;
        buyerName = payload.data.buyer.name || "";
        buyerPhone = payload.data.buyer.checkout_phone || payload.data.buyer.phone || "";
        transactionId = payload.data.purchase?.transaction || "";
        purchaseValue = payload.data.purchase?.price?.value || payload.data.purchase?.value || 0;
        productName = payload.data.product?.name || "Curso Hotmart";
      }
      // Estrutura alternativa
      else if (payload.buyer?.email) {
        buyerEmail = payload.buyer.email;
        buyerName = payload.buyer.name || "";
        buyerPhone = payload.buyer.phone || "";
        transactionId = payload.purchase?.transaction || payload.transaction_id || "";
        purchaseValue = payload.purchase?.price?.value || payload.value || 0;
        productName = payload.product?.name || "Curso";
      }
      // Estrutura simples
      else if (payload.email) {
        buyerEmail = payload.email;
        buyerName = payload.name || "";
        buyerPhone = payload.phone || "";
        transactionId = payload.transaction_id || "";
        purchaseValue = payload.value || payload.valor || 0;
        productName = payload.product_name || "Curso";
      }
      
      if (!buyerEmail || !buyerEmail.includes("@")) {
        console.log("[v15] ❌ Email inválido para compra");
        return new Response(JSON.stringify({ 
          success: false, 
          message: "Email inválido" 
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      // Verificar duplicata
      if (transactionId) {
        const { data: existingTx } = await supabase
          .from("integration_events")
          .select("id")
          .eq("source_id", transactionId)
          .eq("event_type", "PURCHASE_APPROVED")
          .maybeSingle();
        
        if (existingTx) {
          console.log("[v15] ⚠️ Transação já processada");
          return new Response(JSON.stringify({ 
            success: true, 
            message: "Already processed" 
          }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
      }
      
      // Buscar lead existente (pode ter vindo do WordPress antes)
      const { data: existingLead } = await supabase
        .from("whatsapp_leads")
        .select("*")
        .eq("email", buyerEmail)
        .maybeSingle();
      
      let leadInfo = null;
      if (existingLead) {
        leadInfo = existingLead.notes ? JSON.parse(existingLead.notes) : {};
        console.log("[v15] 📋 Lead encontrado:", existingLead.id, "Admin:", leadInfo.admin_criador);
      }
      
      const purchaseDate = new Date().toISOString();
      
      // AGORA SIM - CRIAR ALUNO!
      const { data: aluno, error: alunoError } = await supabase
        .from("alunos")
        .upsert({
          nome: buyerName || existingLead?.name || "Aluno Hotmart",
          email: buyerEmail,
          telefone: buyerPhone || existingLead?.phone || null,
          status: "ativo",
          data_matricula: purchaseDate,
          valor_pago: purchaseValue,
          hotmart_transaction_id: transactionId || null,
          fonte: "Hotmart",
          observacoes: [
            `Produto: ${productName}`,
            existingLead ? `Lead criado por: ${leadInfo?.admin_criador || 'Sistema'}` : null,
            existingLead ? `Lead em: ${leadInfo?.data_criacao || 'N/A'}` : null,
            `Compra aprovada em: ${purchaseDate}`,
            `TX: ${transactionId}`
          ].filter(Boolean).join(' | '),
          updated_at: purchaseDate,
        }, {
          onConflict: "email",
          ignoreDuplicates: false
        })
        .select()
        .single();
      
      let alunoId = aluno?.id;
      
      if (alunoError) {
        console.log("[v15] Upsert falhou, buscando:", alunoError.message);
        const { data: existing } = await supabase
          .from("alunos")
          .select("id")
          .eq("email", buyerEmail)
          .maybeSingle();
        alunoId = existing?.id;
      }
      
      console.log("[v15] ✅ ALUNO CRIADO:", alunoId);
      
      // Atualizar lead para convertido
      if (existingLead) {
        await supabase
          .from("whatsapp_leads")
          .update({
            status: "convertido",
            notes: JSON.stringify({
              ...leadInfo,
              converted_at: purchaseDate,
              aluno_id: alunoId,
              transaction_id: transactionId,
              valor_pago: purchaseValue
            }),
            updated_at: purchaseDate,
          })
          .eq("id", existingLead.id);
        
        console.log("[v15] ✅ Lead convertido");
      }
      
      // Registrar receita
      if (purchaseValue > 0) {
        await supabase.from("entradas").insert({
          descricao: `Venda Hotmart - ${buyerName || buyerEmail} - ${productName}`,
          valor: purchaseValue,
          categoria: "Vendas",
          data: purchaseDate,
          fonte: "Hotmart",
          aluno_id: alunoId,
          transaction_id: transactionId || null,
        });
        console.log("[v15] ✅ Receita: R$", purchaseValue);
      }
      
      // Registrar evento
      await supabase.from("integration_events").insert({
        event_type: "PURCHASE_APPROVED",
        source: "hotmart",
        source_id: transactionId || `hotmart_${Date.now()}`,
        payload: {
          ...payload,
          lead_info: leadInfo,
          aluno_criado: true
        },
        processed: true,
        processed_at: purchaseDate,
      });
      
      // Notificar owner
      const { data: ownerRole } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "owner")
        .maybeSingle();
      
      if (ownerRole?.user_id) {
        await supabase.from("notifications").insert({
          user_id: ownerRole.user_id,
          title: "💰 VENDA HOTMART - ALUNO CRIADO!",
          message: [
            `${buyerName || buyerEmail}`,
            `R$ ${purchaseValue.toFixed(2)}`,
            productName,
            existingLead ? `Veio do lead criado por: ${leadInfo?.admin_criador}` : "Compra direta"
          ].join('\n'),
          type: "sale",
          action_url: "/alunos",
        });
      }
      
      console.log("[v15] ====== COMPRA PROCESSADA - ALUNO CRIADO ======");
      
      return new Response(JSON.stringify({ 
        success: true, 
        type: "purchase_approved",
        aluno_id: alunoId,
        had_lead: !!existingLead,
        message: "Compra aprovada - Aluno criado com sucesso"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    
    // ============================================
    // EVENTO DESCONHECIDO - APENAS REGISTRA
    // ============================================
    
    console.log("[v15] ⚠️ Evento não reconhecido - registrando");
    
    await supabase.from("integration_events").insert({
      event_type: payload.event || "unknown",
      source: webhookSource || "unknown",
      source_id: `unknown_${Date.now()}`,
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
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[v15] ❌ Erro:", errorMessage);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
