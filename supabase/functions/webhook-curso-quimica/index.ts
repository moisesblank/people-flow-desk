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

// Security: Get webhook secrets from environment
const HOTMART_HOTTOK = Deno.env.get("HOTMART_HOTTOK");

// Rate limiting configuration
const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMIT_MAX_REQUESTS = 100;

interface WebhookPayload {
  source?: string;
  event?: string;
  data?: any;
  [key: string]: any;
}

// Security: Sanitize payload for logging (remove PII)
function sanitizePayloadForLog(payload: any): any {
  const sensitiveFields = ['email', 'customer_email', 'buyer', 'subscriber', 'customer', 'phone', 'document', 'cpf', 'address'];
  const sanitized = { ...payload };
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      if (typeof sanitized[field] === 'object') {
        sanitized[field] = '[REDACTED]';
      } else if (typeof sanitized[field] === 'string' && sanitized[field].includes('@')) {
        sanitized[field] = '[EMAIL_REDACTED]';
      }
    }
  }
  
  if (sanitized.data && typeof sanitized.data === 'object') {
    sanitized.data = sanitizePayloadForLog(sanitized.data);
  }
  
  return sanitized;
}

// Security: Rate limiting check
async function checkRateLimit(source: string, ipAddress: string): Promise<{ allowed: boolean; remaining: number }> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_SECONDS * 1000).toISOString();
  
  try {
    const { data: existing } = await supabase
      .from("webhook_rate_limits")
      .select("*")
      .eq("source", source)
      .eq("ip_address", ipAddress)
      .gte("window_start", windowStart)
      .single();

    if (existing) {
      if (existing.request_count >= RATE_LIMIT_MAX_REQUESTS) {
        return { allowed: false, remaining: 0 };
      }
      
      await supabase
        .from("webhook_rate_limits")
        .update({ 
          request_count: existing.request_count + 1,
          updated_at: new Date().toISOString()
        })
        .eq("id", existing.id);
      
      return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - existing.request_count - 1 };
    } else {
      await supabase
        .from("webhook_rate_limits")
        .insert({
          source,
          ip_address: ipAddress,
          request_count: 1,
          window_start: new Date().toISOString()
        });
      
      return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
    }
  } catch (error) {
    console.error("[CURSO-QUIMICA] Rate limit check error:", error);
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS };
  }
}

// Security: Log to audit_logs table
async function logAuditEvent(
  action: string, 
  details: {
    table_name?: string;
    record_id?: string;
    old_data?: any;
    new_data?: any;
    ip_address?: string;
    user_agent?: string;
    metadata?: any;
  }
) {
  try {
    await supabase.from("audit_logs").insert({
      action,
      table_name: details.table_name,
      record_id: details.record_id,
      old_data: details.old_data,
      new_data: details.new_data ? sanitizePayloadForLog(details.new_data) : null,
      ip_address: details.ip_address,
      user_agent: details.user_agent,
      metadata: details.metadata,
    });
  } catch (error) {
    console.error("[CURSO-QUIMICA] Failed to log audit event:", error);
  }
}

// Security: Verify Hotmart webhook signature
function verifyHotmartSignature(request: Request, hottok: string | null): boolean {
  if (!HOTMART_HOTTOK) {
    console.warn("[CURSO-QUIMICA] HOTMART_HOTTOK not configured - skipping signature verification");
    return true;
  }
  
  if (!hottok) {
    console.error("[CURSO-QUIMICA] Missing x-hotmart-hottok header");
    return false;
  }
  
  return hottok === HOTMART_HOTTOK;
}

// Security: Log security events
async function logSecurityEvent(eventType: string, details: Record<string, any>) {
  try {
    await supabase.from("integration_events").insert({
      event_type: `security_${eventType}`,
      source: "webhook-curso-quimica",
      source_id: `security_${Date.now()}`,
      payload: {
        ...details,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[CURSO-QUIMICA] Failed to log security event:", error);
  }
}

// =============================================================================
// AJUDA15: CRIAR ALUNO E ENTRADA AUTOMATICAMENTE
// =============================================================================
async function createStudentAndRevenue(payload: any) {
  const data = payload.data || payload;
  
  // Extrair dados do comprador
  const buyerName = data.buyer?.name || data.subscriber?.name || "Nome não informado";
  const buyerEmail = data.buyer?.email || data.subscriber?.email || "";
  const buyerPhone = data.buyer?.checkout_phone || data.buyer?.phone || "";
  const purchaseValue = data.purchase?.price?.value || data.price || 0;
  const transactionId = data.purchase?.transaction || data.transaction || `hotmart_${Date.now()}`;
  const offerCode = data.purchase?.offer?.code || data.affiliate?.affiliate_code || null;
  const purchaseDate = new Date(data.purchase?.approved_date || payload.creation_date || new Date());
  
  console.log("[AJUDA15] Criando aluno e receita:", { buyerName, buyerEmail, purchaseValue, transactionId });
  
  let alunoId = null;
  
  // 1. CRIAR/ATUALIZAR ALUNO
  if (buyerEmail) {
    try {
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
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "email",
          ignoreDuplicates: false
        })
        .select()
        .single();
      
      if (alunoError) {
        console.error("[AJUDA15] Erro ao criar aluno:", alunoError);
      } else {
        alunoId = aluno?.id;
        console.log("[AJUDA15] ✅ Aluno criado/atualizado:", alunoId);
      }
    } catch (err) {
      console.error("[AJUDA15] Exceção ao criar aluno:", err);
    }
  }
  
  // 2. REGISTRAR RECEITA NA TABELA ENTRADAS
  try {
    const { error: receitaError } = await supabase
      .from("entradas")
      .insert({
        descricao: `Venda Hotmart - ${buyerName}`,
        valor: purchaseValue,
        categoria: "Vendas",
        data: purchaseDate.toISOString(),
        fonte: "Hotmart",
        aluno_id: alunoId,
        transaction_id: transactionId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    
    if (receitaError) {
      console.error("[AJUDA15] Erro ao criar receita:", receitaError);
    } else {
      console.log("[AJUDA15] ✅ Receita registrada: R$", purchaseValue);
    }
  } catch (err) {
    console.error("[AJUDA15] Exceção ao criar receita:", err);
  }
  
  // 3. CALCULAR COMISSÃO SE HOUVER CUPOM/AFILIADO
  if (offerCode) {
    try {
      const { data: afiliado } = await supabase
        .from("affiliates")
        .select("*")
        .eq("cupom", offerCode)
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
          created_at: new Date().toISOString(),
        });
        
        console.log("[AJUDA15] ✅ Comissão registrada para afiliado:", afiliado.nome, "Valor:", comissao);
      }
    } catch (err) {
      console.error("[AJUDA15] Erro ao processar comissão:", err);
    }
  }
  
  return { alunoId, purchaseValue };
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

async function processWebhook(payload: WebhookPayload, source: string, ipAddress: string, userAgent: string) {
  console.log(`[CURSO-QUIMICA] Processing webhook from: ${source}`);
  console.log(`[CURSO-QUIMICA] Payload (sanitized):`, JSON.stringify(sanitizePayloadForLog(payload)));

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

  // Save to integration_events
  const { error: eventError } = await supabase
    .from("integration_events")
    .insert({
      event_type: payload.event || "webhook_received",
      source: source,
      source_id: transactionData.external_id,
      payload: payload,
    });

  if (eventError) {
    console.error("[CURSO-QUIMICA] Error saving event:", eventError);
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
    console.error("[CURSO-QUIMICA] Error saving transaction:", txError);
    throw txError;
  }

  // =============================================================================
  // AJUDA15: SE FOR VENDA APROVADA, CRIAR ALUNO E RECEITA
  // =============================================================================
  const approvedEvents = ["PURCHASE_APPROVED", "PURCHASE_COMPLETE", "purchase.approved", "purchase.completed"];
  const eventType = payload.event || payload.status || "";
  
  if (source.toLowerCase() === "hotmart" && approvedEvents.includes(eventType)) {
    console.log("[AJUDA15] Venda aprovada detectada! Criando aluno e receita...");
    await createStudentAndRevenue(payload);
  }

  // Log audit event
  await logAuditEvent("webhook_transaction_created", {
    table_name: "synapse_transactions",
    record_id: transaction?.id,
    new_data: transactionData,
    ip_address: ipAddress,
    user_agent: userAgent,
    metadata: {
      source,
      event_type: payload.event,
      status: transactionData.status,
    }
  });

  console.log("[CURSO-QUIMICA] Transaction saved with ID:", transaction?.id);

  // Update daily metrics
  await updateDailyMetrics(transactionData);

  return transaction;
}

async function updateDailyMetrics(transaction: any) {
  const today = new Date().toISOString().split("T")[0];
  
  if (transaction.status === "approved") {
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                   req.headers.get("cf-connecting-ip") || 
                   "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";

  try {
    const url = new URL(req.url);
    let source = url.searchParams.get("source") || 
                 req.headers.get("x-webhook-source") || 
                 "unknown";

    const hottok = req.headers.get("x-hotmart-hottok");
    
    if (hottok) {
      source = "hotmart";
    }

    // Rate limiting
    const rateLimit = await checkRateLimit(source, clientIP);
    if (!rateLimit.allowed) {
      await logAuditEvent("rate_limit_exceeded", {
        ip_address: clientIP,
        user_agent: userAgent,
        metadata: { source }
      });
      
      await logSecurityEvent("rate_limit_exceeded", {
        source,
        ip: clientIP,
      });
      
      return new Response(
        JSON.stringify({ success: false, error: "Rate limit exceeded" }),
        { 
          status: 429, 
          headers: { 
            "Content-Type": "application/json",
            "X-RateLimit-Remaining": "0",
            "Retry-After": String(RATE_LIMIT_WINDOW_SECONDS),
            ...corsHeaders 
          } 
        }
      );
    }

    // Verify webhook signatures
    if (source === "hotmart") {
      if (!verifyHotmartSignature(req, hottok)) {
        await logAuditEvent("invalid_webhook_signature", {
          ip_address: clientIP,
          user_agent: userAgent,
          metadata: { source: "hotmart", reason: "Invalid or missing hottok" }
        });
        
        await logSecurityEvent("invalid_signature", {
          source: "hotmart",
          ip: clientIP,
          reason: "Invalid or missing hottok",
        });
        
        return new Response(
          JSON.stringify({ success: false, error: "Invalid webhook signature" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    const payload: WebhookPayload = await req.json();
    
    if (payload.hottok || payload.prod_name) {
      source = "hotmart";
    }

    const transaction = await processWebhook(payload, source, clientIP, userAgent);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Webhook processed successfully",
        transaction_id: transaction?.id 
      }),
      { 
        status: 200, 
        headers: { 
          "Content-Type": "application/json",
          "X-RateLimit-Remaining": String(rateLimit.remaining),
          ...corsHeaders 
        } 
      }
    );

  } catch (error: any) {
    console.error("[CURSO-QUIMICA] Webhook error:", error.message);
    
    await logAuditEvent("webhook_error", {
      ip_address: clientIP,
      user_agent: userAgent,
      metadata: { error: error.message }
    });
    
    await logSecurityEvent("webhook_error", {
      ip: clientIP,
      error: error.message,
    });
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Processing failed"
      }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }
};

serve(handler);