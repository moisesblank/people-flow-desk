import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-hotmart-hottok, x-webhook-source",
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface WebhookPayload {
  source?: string;
  event?: string;
  data?: any;
  [key: string]: any;
}

// Parse Hotmart webhook
function parseHotmartPayload(payload: any) {
  const eventType = payload.event || payload.status || "unknown";
  const data = payload.data || payload;
  
  return {
    external_id: data.purchase?.transaction || data.transaction || `hotmart_${Date.now()}`,
    transaction_type: "sale",
    source: "hotmart",
    amount: Math.round((data.purchase?.price?.value || data.price || 0) * 100),
    currency: data.purchase?.price?.currency_code || "BRL",
    status: mapHotmartStatus(eventType),
    customer_name: data.buyer?.name || data.subscriber?.name || "",
    customer_email: data.buyer?.email || data.subscriber?.email || "",
    product_name: data.product?.name || data.prod_name || "",
    product_id: data.product?.id?.toString() || "",
    affiliate_code: data.affiliate?.affiliate_code || "",
    metadata: payload,
    cnpj_origem: data.producer?.document || "",
  };
}

// Parse Asaas webhook
function parseAsaasPayload(payload: any) {
  const eventType = payload.event || "unknown";
  const data = payload.payment || payload;
  
  return {
    external_id: data.id || `asaas_${Date.now()}`,
    transaction_type: "payment",
    source: "asaas",
    amount: Math.round((data.value || 0) * 100),
    currency: "BRL",
    status: mapAsaasStatus(eventType),
    customer_name: data.customer?.name || "",
    customer_email: data.customer?.email || "",
    product_name: data.description || "",
    product_id: data.externalReference || "",
    affiliate_code: "",
    metadata: payload,
    cnpj_origem: "",
  };
}

// Parse Make.com webhook
function parseMakePayload(payload: any) {
  return {
    external_id: payload.id || `make_${Date.now()}`,
    transaction_type: payload.type || "event",
    source: "make",
    amount: Math.round((payload.amount || 0) * 100),
    currency: payload.currency || "BRL",
    status: payload.status || "received",
    customer_name: payload.customer_name || "",
    customer_email: payload.customer_email || "",
    product_name: payload.product || "",
    product_id: payload.product_id || "",
    affiliate_code: payload.affiliate || "",
    metadata: payload,
    cnpj_origem: payload.cnpj || "",
  };
}

function mapHotmartStatus(event: string): string {
  const statusMap: Record<string, string> = {
    "PURCHASE_APPROVED": "approved",
    "PURCHASE_COMPLETE": "approved",
    "PURCHASE_BILLET_PRINTED": "pending",
    "PURCHASE_REFUNDED": "refunded",
    "PURCHASE_CHARGEBACK": "chargeback",
    "PURCHASE_CANCELED": "canceled",
    "purchase.approved": "approved",
    "purchase.completed": "approved",
    "purchase.refunded": "refunded",
    "approved": "approved",
    "refunded": "refunded",
  };
  return statusMap[event] || "pending";
}

function mapAsaasStatus(event: string): string {
  const statusMap: Record<string, string> = {
    "PAYMENT_RECEIVED": "approved",
    "PAYMENT_CONFIRMED": "approved",
    "PAYMENT_OVERDUE": "overdue",
    "PAYMENT_REFUNDED": "refunded",
    "PAYMENT_DELETED": "canceled",
    "PAYMENT_RESTORED": "pending",
  };
  return statusMap[event] || "pending";
}

async function processWebhook(payload: WebhookPayload, source: string) {
  console.log(`[SYNAPSE] Processing webhook from: ${source}`);
  console.log(`[SYNAPSE] Payload:`, JSON.stringify(payload));

  let transactionData;
  
  switch (source.toLowerCase()) {
    case "hotmart":
      transactionData = parseHotmartPayload(payload);
      break;
    case "asaas":
      transactionData = parseAsaasPayload(payload);
      break;
    case "make":
      transactionData = parseMakePayload(payload);
      break;
    default:
      transactionData = parseMakePayload(payload);
      transactionData.source = source || "unknown";
  }

  // Save to integration_events (raw data)
  const { error: eventError } = await supabase
    .from("integration_events")
    .insert({
      event_type: payload.event || "webhook_received",
      source: source,
      source_id: transactionData.external_id,
      payload: payload,
    });

  if (eventError) {
    console.error("[SYNAPSE] Error saving event:", eventError);
  }

  // Upsert transaction
  const { data: transaction, error: txError } = await supabase
    .from("synapse_transactions")
    .upsert(transactionData, { 
      onConflict: "external_id",
      ignoreDuplicates: false 
    })
    .select()
    .single();

  if (txError) {
    console.error("[SYNAPSE] Error saving transaction:", txError);
    throw txError;
  }

  console.log("[SYNAPSE] Transaction saved:", transaction);

  // Update daily metrics
  await updateDailyMetrics(transactionData);

  return transaction;
}

async function updateDailyMetrics(transaction: any) {
  const today = new Date().toISOString().split("T")[0];
  
  if (transaction.status === "approved") {
    // Update revenue metric
    const { data: existingMetric } = await supabase
      .from("synapse_metrics")
      .select("*")
      .eq("metric_name", "daily_revenue")
      .eq("category", transaction.source)
      .eq("reference_date", today)
      .single();

    const newValue = (existingMetric?.metric_value || 0) + transaction.amount;

    await supabase
      .from("synapse_metrics")
      .upsert({
        metric_name: "daily_revenue",
        category: transaction.source,
        metric_value: newValue,
        metric_unit: "cents",
        period: "daily",
        reference_date: today,
      }, { onConflict: "metric_name,category,reference_date" });

    // Update sales count
    const { data: salesMetric } = await supabase
      .from("synapse_metrics")
      .select("*")
      .eq("metric_name", "daily_sales_count")
      .eq("category", transaction.source)
      .eq("reference_date", today)
      .single();

    await supabase
      .from("synapse_metrics")
      .upsert({
        metric_name: "daily_sales_count",
        category: transaction.source,
        metric_value: (salesMetric?.metric_value || 0) + 1,
        metric_unit: "count",
        period: "daily",
        reference_date: today,
      }, { onConflict: "metric_name,category,reference_date" });
  }
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Determine source from headers or query params
    const url = new URL(req.url);
    let source = url.searchParams.get("source") || 
                 req.headers.get("x-webhook-source") || 
                 "unknown";

    // Auto-detect Hotmart
    if (req.headers.get("x-hotmart-hottok")) {
      source = "hotmart";
    }

    const payload: WebhookPayload = await req.json();
    
    // Auto-detect from payload
    if (payload.hottok || payload.prod_name) {
      source = "hotmart";
    } else if (payload.payment && payload.event?.startsWith("PAYMENT_")) {
      source = "asaas";
    }

    const transaction = await processWebhook(payload, source);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Webhook processed successfully",
        transaction_id: transaction?.id 
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error("[SYNAPSE] Webhook error:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }
};

serve(handler);
