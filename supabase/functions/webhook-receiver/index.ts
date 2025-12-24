// ============================================
// TESTAMENTO DA SINGULARIDADE v5.0
// SISTEMA NERVOSO DIVINO - Receptor de Webhooks
// Recebe webhooks de Hotmart/Stripe e publica eventos
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getWebhookCorsHeaders } from "../_shared/corsConfig.ts";

// CORS para webhooks externos (permissivo para servidores)
const corsHeaders = getWebhookCorsHeaders();

interface WebhookPayload {
  source: "hotmart" | "stripe" | "manual";
  event_type: string;
  customer?: {
    email: string;
    name: string;
    phone?: string;
    cpf?: string;
  };
  transaction?: {
    id: string;
    status: string;
    amount: number;
    currency: string;
  };
  product?: {
    id: string;
    name: string;
  };
  subscription?: {
    id: string;
    status: string;
    plan?: string;
  };
  raw_payload?: Record<string, unknown>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const rawBody = await req.text();
    let payload: WebhookPayload;
    let source: "hotmart" | "stripe" | "manual" = "manual";

    // Detectar origem do webhook
    const hotmartToken = req.headers.get("x-hotmart-hottok");
    const stripeSignature = req.headers.get("stripe-signature");

    if (hotmartToken) {
      source = "hotmart";
      // Validar token Hotmart
      const expectedToken = Deno.env.get("HOTMART_HOTTOK");
      if (expectedToken && hotmartToken !== expectedToken) {
        console.error("❌ Token Hotmart inválido");
        return new Response(
          JSON.stringify({ error: "Invalid Hotmart token" }),
          { status: 401, headers: corsHeaders }
        );
      }

      const hotmartData = JSON.parse(rawBody);
      payload = parseHotmartPayload(hotmartData);
    } else if (stripeSignature) {
      source = "stripe";
      // TODO: Validar assinatura Stripe quando implementado
      const stripeData = JSON.parse(rawBody);
      payload = parseStripePayload(stripeData);
    } else {
      // Payload manual ou teste
      payload = JSON.parse(rawBody);
      source = payload.source || "manual";
    }

    // Mapear evento para o Sistema Nervoso
    const eventName = mapEventName(source, payload.event_type);
    
    if (!eventName) {
      console.log("⚠️ Evento não mapeado:", payload.event_type);
      return new Response(
        JSON.stringify({ success: true, message: "Event ignored" }),
        { headers: corsHeaders }
      );
    }

    // Publicar evento no Sistema Nervoso Divino
    const { data: eventData, error: eventError } = await supabaseAdmin.rpc("publish_event", {
      p_name: eventName,
      p_payload: JSON.parse(JSON.stringify({
        source,
        customer: payload.customer,
        transaction: payload.transaction,
        product: payload.product,
        subscription: payload.subscription,
        raw_payload: payload.raw_payload,
        received_at: new Date().toISOString(),
      })),
      p_entity_type: "webhook",
      p_entity_id: payload.transaction?.id || null,
    });

    if (eventError) {
      console.error("❌ Erro ao publicar evento:", eventError);
      throw eventError;
    }

    console.log(`✅ Evento ${eventName} publicado com ID: ${eventData}`);

    // Log para auditoria
    await supabaseAdmin.from("webhooks_queue").insert({
      source,
      event: payload.event_type,
      payload: payload.raw_payload || payload,
      status: "processed",
      processed_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        event_id: eventData,
        event_name: eventName 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("❌ Erro no webhook-receiver:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: corsHeaders }
    );
  }
});

// Parser para payloads Hotmart
function parseHotmartPayload(data: Record<string, unknown>): WebhookPayload {
  const buyer = data.buyer as Record<string, unknown> || {};
  const purchase = data.purchase as Record<string, unknown> || {};
  const product = data.product as Record<string, unknown> || {};
  const subscription = data.subscription as Record<string, unknown> || {};

  return {
    source: "hotmart",
    event_type: data.event as string || "UNKNOWN",
    customer: {
      email: (buyer.email as string || "").toLowerCase().trim(),
      name: buyer.name as string || "",
      phone: buyer.phone as string || buyer.checkout_phone as string || "",
      cpf: buyer.document as string || "",
    },
    transaction: {
      id: purchase.transaction as string || "",
      status: purchase.status as string || "",
      amount: (purchase.price as Record<string, unknown>)?.value as number || 0,
      currency: (purchase.price as Record<string, unknown>)?.currency_code as string || "BRL",
    },
    product: {
      id: String(product.id || ""),
      name: product.name as string || "",
    },
    subscription: (subscription as Record<string, unknown>).subscriber ? {
      id: (subscription as Record<string, unknown>).subscriber_code as string || "",
      status: (subscription as Record<string, unknown>).status as string || "",
      plan: ((subscription as Record<string, unknown>).plan as Record<string, unknown>)?.name as string || "",
    } : undefined,
    raw_payload: data,
  };
}

// Parser para payloads Stripe
function parseStripePayload(data: Record<string, unknown>): WebhookPayload {
  const eventObject = (data.data as Record<string, unknown>)?.object as Record<string, unknown> || {};
  const customer = eventObject.customer_details as Record<string, unknown> || {};

  return {
    source: "stripe",
    event_type: data.type as string || "UNKNOWN",
    customer: {
      email: (customer.email as string || "").toLowerCase().trim(),
      name: customer.name as string || "",
      phone: customer.phone as string || "",
    },
    transaction: {
      id: eventObject.id as string || "",
      status: eventObject.status as string || "",
      amount: (eventObject.amount_total as number || 0) / 100,
      currency: eventObject.currency as string || "brl",
    },
    raw_payload: data,
  };
}

// Mapeador de eventos para o Sistema Nervoso
function mapEventName(source: string, eventType: string): string | null {
  const eventMap: Record<string, string> = {
    // Hotmart
    "PURCHASE_APPROVED": "payment.succeeded",
    "PURCHASE_COMPLETE": "payment.succeeded",
    "PURCHASE_CANCELED": "payment.refunded",
    "PURCHASE_REFUNDED": "payment.refunded",
    "PURCHASE_CHARGEBACK": "payment.failed",
    "PURCHASE_PROTEST": "payment.failed",
    "SUBSCRIPTION_CANCELLATION": "access.revoked",
    // Stripe
    "checkout.session.completed": "payment.succeeded",
    "payment_intent.succeeded": "payment.succeeded",
    "payment_intent.payment_failed": "payment.failed",
    "customer.subscription.deleted": "access.revoked",
    "charge.refunded": "payment.refunded",
  };

  return eventMap[eventType] || null;
}
