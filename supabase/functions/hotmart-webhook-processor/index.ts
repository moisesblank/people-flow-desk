// ============================================
// MOISÉS MEDEIROS v16.0 - Sistema Completo Integrado
// A) WordPress cria usuário → Registra LEAD
// B) Hotmart aprova compra → Cria ALUNO
// C) RD Station → Registra envio de email
// D) WebHook_MKT → Registra evento do site
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hotmart-hottok, x-webhook-source, x-site-token',
};

// Configurações RD Station e WebHook_MKT
const RD_STATION_API_KEY = "8b8f9f75b0596c30668b480a91a858c9";
const RD_STATION_URL = "https://api.rd.services/platform/conversions";
const WEBHOOK_MKT_URL = "https://app.moisesmedeiros.com.br/wp-json/webhook-mkt/v1/receive";
const WEBHOOK_MKT_TOKEN = "28U4H9bCv5MHoRS3uJmodKx0u17pgCwn";

// ============================================
// FUNÇÕES AUXILIARES DE INTEGRAÇÃO
// ============================================

async function notifyRDStation(email: string, name: string, eventType: string, supabase: any): Promise<boolean> {
  try {
    console.log("[v16] 📧 Notificando RD Station...");
    
    const rdPayload = {
      event_type: "CONVERSION",
      event_family: "CDP",
      payload: {
        conversion_identifier: eventType,
        email: email,
        name: name,
        cf_origem: "Gestao_Moises_Medeiros",
        cf_data_evento: new Date().toISOString(),
      }
    };
    
    const response = await fetch(`${RD_STATION_URL}?api_key=${RD_STATION_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rdPayload),
    });
    
    const responseText = await response.text();
    console.log("[v16] RD Station response:", response.status, responseText.substring(0, 200));
    
    // Registrar evento RD Station
    await supabase.from("integration_events").insert({
      event_type: "rd_station_notification",
      source: "rd_station",
      source_id: `rd_${Date.now()}`,
      payload: {
        sent_to: "rd_station",
        email: email,
        event_type: eventType,
        response_status: response.status,
        response_body: responseText.substring(0, 500),
        sent_at: new Date().toISOString()
      },
      processed: response.ok,
      processed_at: new Date().toISOString(),
    });
    
    return response.ok;
  } catch (error) {
    console.error("[v16] Erro RD Station:", error);
    return false;
  }
}

async function notifyWebhookMKT(data: any, eventType: string, supabase: any): Promise<boolean> {
  try {
    console.log("[v16] 🌐 Notificando WebHook_MKT do site...");
    
    const mktPayload = {
      event: eventType,
      email: data.email,
      name: data.name,
      phone: data.phone || "",
      source: "gestao_moises_medeiros",
      timestamp: new Date().toISOString(),
      data: data,
    };
    
    const response = await fetch(WEBHOOK_MKT_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-Site-Token": WEBHOOK_MKT_TOKEN,
        "Authorization": `Bearer ${WEBHOOK_MKT_TOKEN}`,
      },
      body: JSON.stringify(mktPayload),
    });
    
    const responseText = await response.text();
    console.log("[v16] WebHook_MKT response:", response.status, responseText.substring(0, 200));
    
    // Registrar evento WebHook_MKT
    await supabase.from("integration_events").insert({
      event_type: "webhook_mkt_notification",
      source: "webhook_mkt_site",
      source_id: `mkt_${Date.now()}`,
      payload: {
        sent_to: "webhook_mkt",
        email: data.email,
        event_type: eventType,
        response_status: response.status,
        response_body: responseText.substring(0, 500),
        sent_at: new Date().toISOString()
      },
      processed: response.ok,
      processed_at: new Date().toISOString(),
    });
    
    return response.ok;
  } catch (error) {
    console.error("[v16] Erro WebHook_MKT:", error);
    return false;
  }
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
    const webhookSource = req.headers.get("x-webhook-source") || payload.source || "";
    
    console.log("[v16] ====== WEBHOOK RECEBIDO ======");
    console.log("[v16] Source:", webhookSource);
    console.log("[v16] Payload:", JSON.stringify(payload).substring(0, 800));

    // ============================================
    // DETECTAR TIPO DE EVENTO
    // ============================================
    
    const isWordPressUserCreated = 
      webhookSource === "wordpress_automator" ||
      webhookSource === "wordpress_user_created" ||
      payload.event === "user_created" ||
      payload.type === "user_created";
    
    const isHotmartPurchase = 
      payload.event === "PURCHASE_APPROVED" ||
      payload.event === "PURCHASE_COMPLETE" ||
      payload.status === "approved" ||
      (payload.data?.purchase?.transaction && payload.data?.buyer?.email);
    
    const isRDStationEvent = 
      webhookSource === "rd_station" ||
      payload.source === "rd_station" ||
      payload.event_type === "CONVERSION";
    
    const isWebhookMKTEvent = 
      webhookSource === "webhook_mkt" ||
      payload.source === "webhook_mkt";

    // ============================================
    // C) RD STATION - EVENTO DE EMAIL
    // ============================================
    
    if (isRDStationEvent) {
      console.log("[v16] 📧 Evento RD Station recebido");
      
      const email = payload.leads?.[0]?.email || payload.email || "";
      const eventName = payload.event_type || payload.conversion_identifier || "rd_event";
      
      await supabase.from("integration_events").insert({
        event_type: "rd_station_received",
        source: "rd_station",
        source_id: `rd_recv_${Date.now()}`,
        payload: {
          email: email,
          event_name: eventName,
          full_payload: payload,
          received_at: new Date().toISOString(),
          status: "EMAIL_ENVIADO"
        },
        processed: true,
        processed_at: new Date().toISOString(),
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
          title: "📧 Email RD Station Enviado",
          message: `Para: ${email}\nEvento: ${eventName}`,
          type: "info",
          action_url: "/integracoes",
        });
      }
      
      return new Response(JSON.stringify({ 
        success: true, 
        type: "rd_station_event",
        message: "RD Station event registered"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    
    // ============================================
    // D) WEBHOOK_MKT - EVENTO DO SITE
    // ============================================
    
    if (isWebhookMKTEvent) {
      console.log("[v16] 🌐 Evento WebHook_MKT recebido");
      
      const email = payload.email || "";
      const eventName = payload.event || "mkt_event";
      
      await supabase.from("integration_events").insert({
        event_type: "webhook_mkt_received",
        source: "webhook_mkt_site",
        source_id: `mkt_recv_${Date.now()}`,
        payload: {
          email: email,
          event_name: eventName,
          full_payload: payload,
          received_at: new Date().toISOString(),
        },
        processed: true,
        processed_at: new Date().toISOString(),
      });
      
      return new Response(JSON.stringify({ 
        success: true, 
        type: "webhook_mkt_event",
        message: "WebHook_MKT event registered"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // ============================================
    // A) WORDPRESS - USUÁRIO CRIADO (APENAS LEAD)
    // ============================================
    
    if (isWordPressUserCreated && !isHotmartPurchase) {
      console.log("[v16] 📝 Processando LEAD do WordPress...");
      
      const userEmail = payload.email || payload.user_email || "";
      const userName = payload.name || payload.display_name || payload.user_name || "";
      const adminEmail = payload.admin_email || payload.created_by || payload.admin || "Sistema";
      const createdAt = new Date().toISOString();
      
      if (!userEmail || !userEmail.includes("@")) {
        return new Response(JSON.stringify({ success: false, message: "Email inválido" }), {
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
        return new Response(JSON.stringify({ 
          success: true, message: "Lead already exists", lead_id: existingLead.id
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      // CRIAR LEAD
      const { data: newLead } = await supabase
        .from("whatsapp_leads")
        .insert({
          name: userName || "Lead WordPress",
          email: userEmail,
          phone: payload.phone || null,
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
      
      // C) NOTIFICAR RD STATION
      const rdSuccess = await notifyRDStation(userEmail, userName, "lead_wordpress_criado", supabase);
      
      // D) NOTIFICAR WEBHOOK_MKT DO SITE
      const mktSuccess = await notifyWebhookMKT({ email: userEmail, name: userName }, "lead_criado", supabase);
      
      // Registrar evento completo
      await supabase.from("integration_events").insert({
        event_type: "wordpress_user_created",
        source: "wordpress_automator",
        source_id: `wp_user_${Date.now()}`,
        payload: {
          user_email: userEmail,
          user_name: userName,
          admin_email: adminEmail,
          created_at: createdAt,
          action: "LEAD_CRIADO",
          integrations: {
            rd_station: rdSuccess ? "NOTIFICADO" : "FALHOU",
            webhook_mkt: mktSuccess ? "NOTIFICADO" : "FALHOU"
          }
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
          message: `${userName || userEmail}\nAdmin: ${adminEmail}\nRD: ${rdSuccess ? '✅' : '❌'} | MKT: ${mktSuccess ? '✅' : '❌'}`,
          type: "info",
          action_url: "/alunos",
        });
      }
      
      return new Response(JSON.stringify({ 
        success: true, 
        type: "lead_created",
        lead_id: newLead?.id,
        integrations: { rd_station: rdSuccess, webhook_mkt: mktSuccess }
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    
    // ============================================
    // B) HOTMART - COMPRA APROVADA (CRIA ALUNO!)
    // ============================================
    
    if (isHotmartPurchase) {
      console.log("[v16] 💰 Processando COMPRA Hotmart...");
      
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
      } else if (payload.buyer?.email) {
        buyerEmail = payload.buyer.email;
        buyerName = payload.buyer.name || "";
        buyerPhone = payload.buyer.phone || "";
        transactionId = payload.purchase?.transaction || payload.transaction_id || "";
        purchaseValue = payload.purchase?.price?.value || payload.value || 0;
        productName = payload.product?.name || "Curso";
      } else if (payload.email) {
        buyerEmail = payload.email;
        buyerName = payload.name || "";
        buyerPhone = payload.phone || "";
        transactionId = payload.transaction_id || "";
        purchaseValue = payload.value || payload.valor || 0;
        productName = payload.product_name || "Curso";
      }
      
      if (!buyerEmail || !buyerEmail.includes("@")) {
        return new Response(JSON.stringify({ success: false, message: "Email inválido" }), {
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
          return new Response(JSON.stringify({ success: true, message: "Already processed" }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
      }
      
      // Buscar lead existente
      const { data: existingLead } = await supabase
        .from("whatsapp_leads")
        .select("*")
        .eq("email", buyerEmail)
        .maybeSingle();
      
      let leadInfo = existingLead?.notes ? JSON.parse(existingLead.notes) : {};
      const purchaseDate = new Date().toISOString();
      
      // CRIAR ALUNO
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
            existingLead ? `Lead por: ${leadInfo?.admin_criador}` : null,
            `TX: ${transactionId}`
          ].filter(Boolean).join(' | '),
          updated_at: purchaseDate,
        }, { onConflict: "email", ignoreDuplicates: false })
        .select()
        .single();
      
      let alunoId = aluno?.id;
      if (alunoError) {
        const { data: existing } = await supabase
          .from("alunos").select("id").eq("email", buyerEmail).maybeSingle();
        alunoId = existing?.id;
      }
      
      // Atualizar lead para convertido
      if (existingLead) {
        await supabase.from("whatsapp_leads").update({
          status: "convertido",
          notes: JSON.stringify({ ...leadInfo, converted_at: purchaseDate, aluno_id: alunoId }),
          updated_at: purchaseDate,
        }).eq("id", existingLead.id);
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
      }
      
      // C) NOTIFICAR RD STATION - COMPRA APROVADA
      const rdSuccess = await notifyRDStation(buyerEmail, buyerName, "compra_hotmart_aprovada", supabase);
      
      // D) NOTIFICAR WEBHOOK_MKT DO SITE
      const mktSuccess = await notifyWebhookMKT({ 
        email: buyerEmail, 
        name: buyerName,
        phone: buyerPhone,
        value: purchaseValue,
        product: productName,
        transaction: transactionId
      }, "compra_aprovada", supabase);
      
      // Registrar evento
      await supabase.from("integration_events").insert({
        event_type: "PURCHASE_APPROVED",
        source: "hotmart",
        source_id: transactionId || `hotmart_${Date.now()}`,
        payload: {
          ...payload,
          lead_info: leadInfo,
          aluno_criado: true,
          integrations: {
            rd_station: rdSuccess ? "NOTIFICADO" : "FALHOU",
            webhook_mkt: mktSuccess ? "NOTIFICADO" : "FALHOU"
          }
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
          title: "💰 VENDA HOTMART!",
          message: `${buyerName || buyerEmail}\nR$ ${purchaseValue.toFixed(2)}\n${productName}\nRD: ${rdSuccess ? '✅' : '❌'} | MKT: ${mktSuccess ? '✅' : '❌'}`,
          type: "sale",
          action_url: "/alunos",
        });
      }
      
      return new Response(JSON.stringify({ 
        success: true, 
        type: "purchase_approved",
        aluno_id: alunoId,
        integrations: { rd_station: rdSuccess, webhook_mkt: mktSuccess }
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    
    // ============================================
    // EVENTO DESCONHECIDO
    // ============================================
    
    await supabase.from("integration_events").insert({
      event_type: payload.event || "unknown",
      source: webhookSource || "unknown",
      source_id: `unknown_${Date.now()}`,
      payload: payload,
      processed: false,
    });
    
    return new Response(JSON.stringify({ success: true, message: "Event recorded" }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[v16] Erro:", errorMessage);
    
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
