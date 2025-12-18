// ============================================
// MOISÉS MEDEIROS v17.0 - PRODUÇÃO FINAL
// Sistema de Gestão Integrado - Zero Erros
// ============================================
// A) WordPress cria usuário → Registra LEAD (não cria aluno)
// B) Hotmart aprova compra → Cria ALUNO e converte lead
// C) RD Station → Notifica e registra envio de email
// D) WebHook_MKT → Notifica site e registra evento
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hotmart-hottok, x-webhook-source, x-site-token',
};

// ============================================
// CONFIGURAÇÕES - INTEGRAÇÕES EXTERNAS
// ============================================
const CONFIG = {
  RD_STATION: {
    API_KEY: "8b8f9f75b0596c30668b480a91a858c9",
    BASE_URL: "https://api.rd.services/platform/conversions",
    TIMEOUT: 10000,
  },
  WEBHOOK_MKT: {
    URL: "https://app.moisesmedeiros.com.br/wp-json/webhook-mkt/v1/receive",
    TOKEN: "28U4H9bCv5MHoRS3uJmodKx0u17pgCwn",
    TIMEOUT: 10000,
  },
  EVENTS: {
    APPROVED: ["PURCHASE_APPROVED", "PURCHASE_COMPLETE", "PURCHASE_DELAYED", "purchase.approved", "purchase.completed", "purchase_approved", "approved", "completed"],
    USER_CREATED: ["user_created", "wordpress_user_created", "new_user"],
  }
};

// ============================================
// UTILITÁRIOS
// ============================================

function sanitizeString(str: any): string {
  if (!str) return "";
  return String(str).trim();
}

function sanitizeEmail(email: any): string {
  const cleaned = sanitizeString(email).toLowerCase();
  if (!cleaned || !cleaned.includes("@") || !cleaned.includes(".")) return "";
  return cleaned;
}

function sanitizePhone(phone: any): string {
  if (!phone) return "";
  return String(phone).replace(/[^0-9+]/g, "");
}

function sanitizeNumber(num: any): number {
  if (typeof num === "number") return num;
  const parsed = parseFloat(String(num).replace(",", "."));
  return isNaN(parsed) ? 0 : parsed;
}

function generateEventId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

// ============================================
// LOGGER AVANÇADO
// ============================================

class Logger {
  private prefix: string;
  private startTime: number;

  constructor(version: string) {
    this.prefix = `[Gestão v${version}]`;
    this.startTime = Date.now();
  }

  info(message: string, data?: any) {
    const elapsed = Date.now() - this.startTime;
    console.log(`${this.prefix} [${elapsed}ms] ℹ️ ${message}`, data ? JSON.stringify(data).substring(0, 500) : "");
  }

  success(message: string, data?: any) {
    const elapsed = Date.now() - this.startTime;
    console.log(`${this.prefix} [${elapsed}ms] ✅ ${message}`, data ? JSON.stringify(data).substring(0, 300) : "");
  }

  warn(message: string, data?: any) {
    const elapsed = Date.now() - this.startTime;
    console.warn(`${this.prefix} [${elapsed}ms] ⚠️ ${message}`, data ? JSON.stringify(data).substring(0, 300) : "");
  }

  error(message: string, error?: any) {
    const elapsed = Date.now() - this.startTime;
    console.error(`${this.prefix} [${elapsed}ms] ❌ ${message}`, error instanceof Error ? error.message : error);
  }

  separator(title: string) {
    console.log(`\n${"=".repeat(50)}\n${this.prefix} ${title}\n${"=".repeat(50)}`);
  }
}

// ============================================
// NOTIFICADOR RD STATION (C)
// ============================================

async function notifyRDStation(
  email: string, 
  name: string, 
  conversionIdentifier: string,
  extraData: Record<string, any>,
  supabase: any,
  logger: Logger
): Promise<{ success: boolean; message: string }> {
  
  const eventId = generateEventId("rd");
  
  try {
    logger.info(`RD Station: Iniciando notificação para ${email}`);

    if (!email || !email.includes("@")) {
      logger.warn("RD Station: Email inválido, pulando notificação");
      return { success: false, message: "Email inválido" };
    }

    const rdPayload = {
      event_type: "CONVERSION",
      event_family: "CDP",
      payload: {
        conversion_identifier: conversionIdentifier,
        email: email,
        name: name || "Lead",
        cf_origem: "Gestao_Moises_Medeiros",
        cf_data_evento: getCurrentTimestamp(),
        cf_plataforma: "gestao.moisesmedeiros.com.br",
        ...extraData,
      }
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.RD_STATION.TIMEOUT);

    const response = await fetch(
      `${CONFIG.RD_STATION.BASE_URL}?api_key=${CONFIG.RD_STATION.API_KEY}`,
      {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(rdPayload),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    let responseBody = "";
    try {
      responseBody = await response.text();
    } catch (e) {
      responseBody = "Não foi possível ler resposta";
    }

    // Registrar evento no banco
    await supabase.from("integration_events").insert({
      event_type: "rd_station_notification",
      source: "rd_station",
      source_id: eventId,
      payload: {
        action: "NOTIFICACAO_ENVIADA",
        email: email,
        conversion_identifier: conversionIdentifier,
        response_status: response.status,
        response_ok: response.ok,
        response_body: responseBody.substring(0, 1000),
        sent_at: getCurrentTimestamp(),
        extra_data: extraData,
      },
      processed: response.ok,
      processed_at: getCurrentTimestamp(),
    });

    if (response.ok) {
      logger.success(`RD Station: Notificação enviada com sucesso (${response.status})`);
      return { success: true, message: "Enviado com sucesso" };
    } else {
      logger.warn(`RD Station: Resposta não-OK (${response.status})`, responseBody);
      return { success: false, message: `Status ${response.status}` };
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    logger.error("RD Station: Erro na notificação", error);

    // Registrar falha
    await supabase.from("integration_events").insert({
      event_type: "rd_station_error",
      source: "rd_station",
      source_id: eventId,
      payload: {
        action: "ERRO_NOTIFICACAO",
        email: email,
        error: errorMessage,
        timestamp: getCurrentTimestamp(),
      },
      processed: false,
    });

    return { success: false, message: errorMessage };
  }
}

// ============================================
// NOTIFICADOR WEBHOOK_MKT (D)
// ============================================

async function notifyWebhookMKT(
  data: {
    email: string;
    name: string;
    phone?: string;
    value?: number;
    product?: string;
    transaction?: string;
  },
  eventType: string,
  supabase: any,
  logger: Logger,
  meta?: Record<string, any>
): Promise<{ success: boolean; message: string }> {

  const eventId = generateEventId("mkt");

  try {
    logger.info(`WebHook_MKT: Iniciando notificação (${eventType})`);

    // Hard safety: NUNCA permitir Beta em eventos de cadastro/lead.
    // O único evento permitido para Beta é compra_aprovada.
    const safeMeta = { ...(meta || {}) } as Record<string, any>;
    if (eventType !== "compra_aprovada") {
      if (safeMeta.access_level?.toString().toLowerCase() === "beta" || safeMeta.group === "Beta") {
        logger.warn("WebHook_MKT: Meta Beta bloqueada em evento não-permitido", { eventType });
        safeMeta.access_level = "registered";
        safeMeta.group = "Registered";
        safeMeta._coerced_from_beta = true;
      }
    }

    const mktPayload: Record<string, any> = {
      event: eventType,
      email: data.email,
      name: data.name || "",
      phone: data.phone || "",
      value: data.value || 0,
      product: data.product || "",
      transaction: data.transaction || "",
      source: "gestao_moises_medeiros",
      platform: "gestao.moisesmedeiros.com.br",
      timestamp: getCurrentTimestamp(),

      // Compat: alguns plugins lêem no root, outros leem em meta
      access_level: safeMeta?.access_level,
      group: safeMeta?.group,

      // Compat extra para plugins (se suportarem)
      add_groups: safeMeta?.enforce?.add_groups,
      remove_groups: safeMeta?.enforce?.remove_groups,

      meta: Object.keys(safeMeta || {}).length ? safeMeta : undefined,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.WEBHOOK_MKT.TIMEOUT);

    const doRequest = async (mode: "primary" | "fallback") => {
      const url = mode === "primary"
        ? `${CONFIG.WEBHOOK_MKT.URL}?token=${encodeURIComponent(CONFIG.WEBHOOK_MKT.TOKEN)}`
        : CONFIG.WEBHOOK_MKT.URL;

      return await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          // Enviamos múltiplas variações para evitar mismatch de header no plugin do site
          "X-Site-Token": CONFIG.WEBHOOK_MKT.TOKEN,
          "X-Webhook-Token": CONFIG.WEBHOOK_MKT.TOKEN,
          "X-Auth-Token": CONFIG.WEBHOOK_MKT.TOKEN,
          "x-webhook-secret": CONFIG.WEBHOOK_MKT.TOKEN,
          "Authorization": `Bearer ${CONFIG.WEBHOOK_MKT.TOKEN}`,
        },
        body: JSON.stringify(mktPayload),
        signal: controller.signal,
      });
    };

    // 1) tentativa principal
    let response = await doRequest("primary");

    // 2) fallback apenas se for 401/403 (muito comum quando o site espera token em header específico)
    if (!response.ok && (response.status === 401 || response.status === 403)) {
      logger.warn("WebHook_MKT: 401/403; tentando fallback", { status: response.status });
      response = await doRequest("fallback");
    }

    clearTimeout(timeoutId);

    let responseBody = "";
    try {
      responseBody = await response.text();
    } catch {
      responseBody = "Não foi possível ler resposta";
    }

    // Registrar evento (inclui o payload enviado para auditoria/debug)
    await supabase.from("integration_events").insert({
      event_type: "webhook_mkt_notification",
      source: "webhook_mkt_site",
      source_id: eventId,
      payload: {
        action: "NOTIFICACAO_ENVIADA",
        event_type: eventType,
        email: data.email,
        sent_payload: {
          event: mktPayload.event,
          email: mktPayload.email,
          name: mktPayload.name,
          phone: mktPayload.phone ? "***" : "",
          value: mktPayload.value,
          product: mktPayload.product,
          transaction: mktPayload.transaction,
          access_level: mktPayload.access_level,
          group: mktPayload.group,
          add_groups: mktPayload.add_groups,
          remove_groups: mktPayload.remove_groups,
          meta: mktPayload.meta,
          timestamp: mktPayload.timestamp,
        },
        response_status: response.status,
        response_ok: response.ok,
        response_body: responseBody.substring(0, 2000),
        sent_at: getCurrentTimestamp(),
      },
      processed: response.ok,
      processed_at: getCurrentTimestamp(),
    });

    if (response.ok) {
      logger.success(`WebHook_MKT: Notificação enviada (${response.status})`);
      return { success: true, message: "Enviado com sucesso" };
    }

    logger.warn(`WebHook_MKT: Resposta não-OK (${response.status})`);
    // Se o site rejeitou, avisar owner para ação imediata (isso evita "Beta" por regras default)
    await notifyOwner(
      supabase,
      "⚠️ WebHook_MKT rejeitado",
      [
        `Evento: ${eventType}`,
        `Email: ${data.email}`,
        `Status: ${response.status}`,
        `Resposta: ${responseBody.substring(0, 500)}`,
      ].join("\n"),
      "warning",
      "/integracoes",
      logger
    );

    return { success: false, message: `Status ${response.status}` };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    logger.error("WebHook_MKT: Erro na notificação", error);

    await supabase.from("integration_events").insert({
      event_type: "webhook_mkt_error",
      source: "webhook_mkt_site",
      source_id: eventId,
      payload: {
        action: "ERRO_NOTIFICACAO",
        email: data.email,
        error: errorMessage,
        timestamp: getCurrentTimestamp(),
      },
      processed: false,
    });

    await notifyOwner(
      supabase,
      "❌ Erro ao notificar WebHook_MKT",
      [`Email: ${data.email}`, `Erro: ${errorMessage}`].join("\n"),
      "error",
      "/integracoes",
      logger
    );

    return { success: false, message: errorMessage };
  }
}

// ============================================
// NOTIFICAR OWNER
// ============================================

async function notifyOwner(
  supabase: any,
  title: string,
  message: string,
  type: string,
  actionUrl: string,
  logger: Logger
): Promise<void> {
  try {
    const { data: ownerRole } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "owner")
      .maybeSingle();

    if (ownerRole?.user_id) {
      await supabase.from("notifications").insert({
        user_id: ownerRole.user_id,
        title: title,
        message: message,
        type: type,
        action_url: actionUrl,
      });
      logger.info("Notificação enviada ao owner");
    }
  } catch (error) {
    logger.warn("Erro ao notificar owner", error);
  }
}

// ============================================
// EXTRATORES DE DADOS
// ============================================

interface ExtractedData {
  email: string;
  name: string;
  phone: string;
  adminEmail: string;
  transactionId: string;
  purchaseValue: number;
  productName: string;
  isValid: boolean;
  source: string;
}

function extractWordPressData(payload: any): ExtractedData {
  return {
    email: sanitizeEmail(payload.email || payload.user_email || payload.buyer?.email),
    name: sanitizeString(payload.name || payload.display_name || payload.user_name || payload.buyer?.name),
    phone: sanitizePhone(payload.phone || payload.telefone),
    adminEmail: sanitizeEmail(payload.admin_email || payload.created_by || payload.admin) || "Sistema",
    transactionId: "",
    purchaseValue: 0,
    productName: "",
    isValid: true,
    source: "wordpress",
  };
}

function extractHotmartData(payload: any): ExtractedData {
  // Estrutura oficial Hotmart: payload.data.buyer, payload.data.purchase, etc
  if (payload.data?.buyer?.email) {
    return {
      email: sanitizeEmail(payload.data.buyer.email),
      name: sanitizeString(payload.data.buyer.name),
      phone: sanitizePhone(payload.data.buyer.checkout_phone || payload.data.buyer.phone),
      adminEmail: "",
      transactionId: sanitizeString(payload.data.purchase?.transaction),
      purchaseValue: sanitizeNumber(payload.data.purchase?.price?.value || payload.data.purchase?.value),
      productName: sanitizeString(payload.data.product?.name) || "Curso Hotmart",
      isValid: true,
      source: "hotmart_oficial",
    };
  }
  
  // Estrutura Automator/alternativa
  if (payload.buyer?.email) {
    return {
      email: sanitizeEmail(payload.buyer.email),
      name: sanitizeString(payload.buyer.name),
      phone: sanitizePhone(payload.buyer.phone),
      adminEmail: "",
      transactionId: sanitizeString(payload.purchase?.transaction || payload.transaction_id),
      purchaseValue: sanitizeNumber(payload.purchase?.price?.value || payload.value),
      productName: sanitizeString(payload.product?.name) || "Curso",
      isValid: true,
      source: "hotmart_automator",
    };
  }
  
  // Estrutura simplificada
  if (payload.email) {
    return {
      email: sanitizeEmail(payload.email),
      name: sanitizeString(payload.name || payload.nome),
      phone: sanitizePhone(payload.phone || payload.telefone),
      adminEmail: "",
      transactionId: sanitizeString(payload.transaction_id || payload.transaction),
      purchaseValue: sanitizeNumber(payload.value || payload.valor),
      productName: sanitizeString(payload.product_name || payload.produto) || "Curso",
      isValid: true,
      source: "hotmart_simples",
    };
  }

  return {
    email: "",
    name: "",
    phone: "",
    adminEmail: "",
    transactionId: "",
    purchaseValue: 0,
    productName: "",
    isValid: false,
    source: "desconhecido",
  };
}

// ============================================
// HANDLERS PRINCIPAIS
// ============================================

async function handleWordPressUserCreated(
  payload: any,
  supabase: any,
  logger: Logger
): Promise<Response> {
  
  logger.separator("PROCESSANDO LEAD WORDPRESS (A)");
  
  const data = extractWordPressData(payload);
  const timestamp = getCurrentTimestamp();
  const eventId = generateEventId("wp_lead");

  logger.info("Dados extraídos", { 
    email: data.email, 
    name: data.name, 
    admin: data.adminEmail 
  });

  // Validar email
  if (!data.email) {
    logger.error("Email inválido ou ausente");
    
    await supabase.from("integration_events").insert({
      event_type: "wordpress_rejected",
      source: "wordpress",
      source_id: eventId,
      payload: { reason: "email_invalido", original: payload },
      processed: false,
    });

    return new Response(JSON.stringify({ 
      success: false, 
      error: "Email inválido",
      code: "INVALID_EMAIL"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // Verificar lead existente
  const { data: existingLead } = await supabase
    .from("whatsapp_leads")
    .select("id, status, email")
    .eq("email", data.email)
    .maybeSingle();

  if (existingLead) {
    logger.warn("Lead já existe", { id: existingLead.id, status: existingLead.status });

    // Mesmo assim, precisamos garantir que o site receba o evento de REGISTRO
    // (se a pessoa tentou cadastrar de novo, o WordPress NÃO pode promover para Beta aqui).
    const mktResult = await notifyWebhookMKT(
      { email: data.email, name: data.name, phone: data.phone },
      "lead_registered",
      supabase,
      logger,
      {
        access_level: "registered",
        group: "Registered",
        origin: "cadastro_wordpress",
        // instrução explícita (caso o plugin suporte) para REMOVER Beta e manter somente Registered
        enforce: { add_groups: ["Registered"], remove_groups: ["Beta"] },
      }
    );

    await supabase.from("integration_events").insert({
      event_type: "wordpress_lead_exists",
      source: "wordpress",
      source_id: eventId,
      payload: {
        email: data.email,
        name: data.name,
        lead_id: existingLead.id,
        lead_status: existingLead.status,
        webhook_mkt: mktResult.success ? "OK" : mktResult.message,
        action: "LEAD_JA_EXISTIA_MAS_REFORCAMOS_REGISTRO_NO_SITE",
      },
      processed: true,
      processed_at: timestamp,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Lead já cadastrado (registro reforçado no site)",
        lead_id: existingLead.id,
        code: "LEAD_EXISTS",
        integrations: { webhook_mkt: mktResult.success },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }

  // Criar lead (NÃO ALUNO!)
  // IMPORTANTE: status precisa respeitar o constraint do banco (whatsapp_leads_status_check)
  // Valores permitidos atualmente: novo | contatado | interessado | matriculado | perdido
  const leadData = {
    nome: data.name || "Lead WordPress",
    email: data.email,
    phone: data.phone || null,
    source: "wordpress_user_created",
    status: "novo",
    notes: JSON.stringify({
      admin_criador: data.adminEmail,
      data_criacao: timestamp,
      hora_criacao: new Date().toLocaleTimeString("pt-BR"),
      origem: "WordPress - Novo Usuário",
      aguardando_hotmart: true,
      versao_webhook: "v17",
    }),
    created_at: timestamp,
    updated_at: timestamp,
  };

  const { data: newLead, error: leadError } = await supabase
    .from("whatsapp_leads")
    .insert(leadData)
    .select()
    .single();

  if (leadError) {
    logger.error("Erro ao criar lead", leadError);
    
    await supabase.from("integration_events").insert({
      event_type: "wordpress_lead_error",
      source: "wordpress",
      source_id: eventId,
      payload: { error: leadError.message, data: leadData },
      processed: false,
    });

    return new Response(JSON.stringify({ 
      success: false, 
      error: "Erro ao criar lead",
      code: "DATABASE_ERROR"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  logger.success("Lead criado com sucesso", { id: newLead.id });

  // C) Notificar RD Station
  const rdResult = await notifyRDStation(
    data.email,
    data.name,
    "lead_wordpress_criado",
    { 
      cf_admin_criador: data.adminEmail,
      cf_tipo: "novo_lead",
    },
    supabase,
    logger
  );

  // D) Notificar WebHook_MKT
  // CRÍTICO: aqui é APENAS REGISTRO (sem acesso). Nunca pode virar Beta.
  // Trocamos o evento para não conflitar com gatilhos do WordPress e enviamos explicitamente o grupo desejado.
  const mktResult = await notifyWebhookMKT(
    { email: data.email, name: data.name, phone: data.phone },
    "lead_registered",
    supabase,
    logger,
    { access_level: "registered", group: "Registered", origin: "cadastro_wordpress" }
  );

  // Registrar evento principal
  await supabase.from("integration_events").insert({
    event_type: "wordpress_lead_created",
    source: "wordpress",
    source_id: eventId,
    payload: {
      lead_id: newLead.id,
      email: data.email,
      name: data.name,
      admin_email: data.adminEmail,
      created_at: timestamp,
      integrations: {
        rd_station: rdResult.success ? "OK" : rdResult.message,
        webhook_mkt: mktResult.success ? "OK" : mktResult.message,
      },
      action: "LEAD_CRIADO_AGUARDANDO_COMPRA_HOTMART",
    },
    processed: true,
    processed_at: timestamp,
  });

  // Notificar owner
  await notifyOwner(
    supabase,
    "👤 Novo Lead WordPress",
    [
      `Email: ${data.email}`,
      `Nome: ${data.name || "Não informado"}`,
      `Admin: ${data.adminEmail}`,
      `Data: ${new Date().toLocaleString("pt-BR")}`,
      `RD Station: ${rdResult.success ? "✅" : "❌"}`,
      `WebHook_MKT: ${mktResult.success ? "✅" : "❌"}`,
      "",
      "⏳ Aguardando compra na Hotmart",
    ].join("\n"),
    "info",
    "/alunos",
    logger
  );

  logger.separator("LEAD WORDPRESS PROCESSADO COM SUCESSO");

  return new Response(JSON.stringify({ 
    success: true, 
    type: "lead_created",
    code: "LEAD_CREATED",
    lead_id: newLead.id,
    message: "Lead registrado - aguardando compra Hotmart",
    integrations: {
      rd_station: rdResult.success,
      webhook_mkt: mktResult.success,
    },
    data: {
      email: data.email,
      name: data.name,
      admin: data.adminEmail,
      created_at: timestamp,
    }
  }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

async function handleHotmartPurchase(
  payload: any,
  supabase: any,
  logger: Logger
): Promise<Response> {
  
  logger.separator("PROCESSANDO COMPRA HOTMART (B)");
  
  const data = extractHotmartData(payload);
  const timestamp = getCurrentTimestamp();
  const eventId = generateEventId("hotmart");

  logger.info("Dados extraídos", {
    email: data.email,
    name: data.name,
    value: data.purchaseValue,
    transaction: data.transactionId,
    source: data.source,
  });

  // Validar email
  if (!data.email) {
    logger.error("Email inválido na compra");
    
    await supabase.from("integration_events").insert({
      event_type: "hotmart_rejected",
      source: "hotmart",
      source_id: eventId,
      payload: { reason: "email_invalido", original: payload },
      processed: false,
    });

    return new Response(JSON.stringify({ 
      success: false, 
      error: "Email inválido",
      code: "INVALID_EMAIL"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // Verificar duplicata por transaction_id
  if (data.transactionId) {
    const { data: existingTx } = await supabase
      .from("integration_events")
      .select("id")
      .eq("source_id", data.transactionId)
      .eq("event_type", "hotmart_purchase_processed")
      .maybeSingle();

    if (existingTx) {
      logger.warn("Transação já processada", { transaction: data.transactionId });
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Transação já processada",
        code: "ALREADY_PROCESSED"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
  }

  // Buscar lead existente (WordPress)
  const { data: existingLead } = await supabase
    .from("whatsapp_leads")
    .select("*")
    .eq("email", data.email)
    .maybeSingle();

  let leadInfo: any = {};
  if (existingLead?.notes) {
    try {
      leadInfo = JSON.parse(existingLead.notes);
    } catch (e) {
      leadInfo = {};
    }
  }

  logger.info("Lead encontrado?", { 
    found: !!existingLead, 
    admin: leadInfo.admin_criador 
  });

  // CRIAR ALUNO (AGORA SIM!)
  const alunoData = {
    nome: data.name || existingLead?.nome || "Aluno Hotmart",
    email: data.email,
    telefone: data.phone || existingLead?.phone || null,
    status: "ativo",
    data_matricula: timestamp,
    valor_pago: data.purchaseValue,
    hotmart_transaction_id: data.transactionId || null,
    fonte: "Hotmart",
    observacoes: [
      `Produto: ${data.productName}`,
      `Valor: R$ ${data.purchaseValue.toFixed(2)}`,
      existingLead ? `Lead criado por: ${leadInfo.admin_criador || "Sistema"}` : "Compra direta",
      existingLead ? `Lead em: ${leadInfo.data_criacao || "N/A"}` : null,
      `TX: ${data.transactionId || "N/A"}`,
      `Processado: ${new Date().toLocaleString("pt-BR")}`,
      `Webhook: v17`,
    ].filter(Boolean).join(" | "),
    updated_at: timestamp,
  };

  const { data: aluno, error: alunoError } = await supabase
    .from("alunos")
    .upsert(alunoData, { onConflict: "email", ignoreDuplicates: false })
    .select()
    .single();

  let alunoId = aluno?.id;

  if (alunoError) {
    logger.warn("Erro no upsert, buscando existente", alunoError.message);
    const { data: existing } = await supabase
      .from("alunos")
      .select("id")
      .eq("email", data.email)
      .maybeSingle();
    alunoId = existing?.id;
  }

  if (!alunoId) {
    logger.error("Falha ao criar/encontrar aluno");
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: "Erro ao criar aluno",
      code: "DATABASE_ERROR"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  logger.success("Aluno criado/atualizado", { id: alunoId });

  // Atualizar lead para matriculado
  // IMPORTANTE: status precisa respeitar o constraint do banco
  if (existingLead) {
    await supabase
      .from("whatsapp_leads")
      .update({
        status: "matriculado",
        notes: JSON.stringify({
          ...leadInfo,
          converted_at: timestamp,
          aluno_id: alunoId,
          transaction_id: data.transactionId,
          valor_pago: data.purchaseValue,
          produto: data.productName,
        }),
        updated_at: timestamp,
      })
      .eq("id", existingLead.id);

    logger.success("Lead convertido para aluno");
  }

  // Registrar receita
  if (data.purchaseValue > 0) {
    const { error: entradaError } = await supabase.from("entradas").insert({
      descricao: `Venda Hotmart - ${data.name || data.email} - ${data.productName}`,
      valor: data.purchaseValue,
      categoria: "Vendas",
      data: timestamp,
      fonte: "Hotmart",
      aluno_id: alunoId,
      transaction_id: data.transactionId || null,
    });

    if (entradaError) {
      logger.warn("Erro ao registrar entrada", entradaError.message);
    } else {
      logger.success("Receita registrada", { valor: data.purchaseValue });
    }
  }

  // C) Notificar RD Station - COMPRA APROVADA
  const rdResult = await notifyRDStation(
    data.email,
    data.name,
    "compra_hotmart_aprovada",
    {
      cf_valor: data.purchaseValue,
      cf_produto: data.productName,
      cf_transaction_id: data.transactionId,
      cf_tipo: "compra_aprovada",
    },
    supabase,
    logger
  );

  // D) Notificar WebHook_MKT
  // Aqui SIM é aluno (compra aprovada) → pode virar Beta/Ativo no WordPress.
  const mktResult = await notifyWebhookMKT(
    {
      email: data.email,
      name: data.name,
      phone: data.phone,
      value: data.purchaseValue,
      product: data.productName,
      transaction: data.transactionId,
    },
    "compra_aprovada",
    supabase,
    logger,
    { access_level: "beta", group: "Beta", origin: "hotmart_approved" }
  );

  // Registrar evento principal
  await supabase.from("integration_events").insert({
    event_type: "hotmart_purchase_processed",
    source: "hotmart",
    source_id: data.transactionId || eventId,
    payload: {
      aluno_id: alunoId,
      email: data.email,
      name: data.name,
      value: data.purchaseValue,
      product: data.productName,
      transaction: data.transactionId,
      had_lead: !!existingLead,
      lead_admin: leadInfo.admin_criador || null,
      lead_created_at: leadInfo.data_criacao || null,
      processed_at: timestamp,
      integrations: {
        rd_station: rdResult.success ? "OK" : rdResult.message,
        webhook_mkt: mktResult.success ? "OK" : mktResult.message,
      },
      action: "ALUNO_CRIADO_COMPRA_APROVADA",
    },
    processed: true,
    processed_at: timestamp,
  });

  // Notificar owner
  await notifyOwner(
    supabase,
    "💰 VENDA HOTMART - ALUNO CRIADO!",
    [
      `📧 ${data.email}`,
      `👤 ${data.name || "Nome não informado"}`,
      `💵 R$ ${data.purchaseValue.toFixed(2)}`,
      `📦 ${data.productName}`,
      `🔗 TX: ${data.transactionId || "N/A"}`,
      "",
      existingLead 
        ? `📋 Veio do lead criado por: ${leadInfo.admin_criador || "Sistema"}`
        : "🆕 Compra direta (sem lead prévio)",
      "",
      `RD Station: ${rdResult.success ? "✅" : "❌"}`,
      `WebHook_MKT: ${mktResult.success ? "✅" : "❌"}`,
    ].join("\n"),
    "sale",
    "/alunos",
    logger
  );

  logger.separator("COMPRA HOTMART PROCESSADA COM SUCESSO");

  return new Response(JSON.stringify({ 
    success: true, 
    type: "purchase_approved",
    code: "ALUNO_CREATED",
    aluno_id: alunoId,
    had_lead: !!existingLead,
    lead_admin: leadInfo.admin_criador || null,
    message: "Compra aprovada - Aluno criado com sucesso",
    integrations: {
      rd_station: rdResult.success,
      webhook_mkt: mktResult.success,
    },
    data: {
      email: data.email,
      name: data.name,
      value: data.purchaseValue,
      product: data.productName,
      transaction: data.transactionId,
    }
  }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

// ============================================
// HANDLER PRINCIPAL
// ============================================

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const logger = new Logger("17");
  
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // Ler payload
    let payload: any;
    try {
      payload = await req.json();
    } catch (e) {
      logger.error("Payload JSON inválido", e);
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Payload inválido",
        code: "INVALID_JSON"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const webhookSource = req.headers.get("x-webhook-source") || payload.source || "";
    const eventType = sanitizeString(payload.event || payload.status || payload.type || "");

    logger.separator("WEBHOOK RECEBIDO");
    logger.info("Source", webhookSource);
    logger.info("Event", eventType);
    logger.info("Payload preview", JSON.stringify(payload).substring(0, 600));

    // ============================================
    // DETECTAR E ROTEAR
    // ============================================

    // A) WordPress User Created
    const isWordPressUser = 
      webhookSource.includes("wordpress") ||
      CONFIG.EVENTS.USER_CREATED.some(e => eventType.toLowerCase().includes(e));

    // B) Hotmart Purchase
    const isHotmartPurchase = 
      CONFIG.EVENTS.APPROVED.some(e => eventType.toLowerCase() === e.toLowerCase()) ||
      (payload.data?.purchase?.transaction && payload.data?.buyer?.email) ||
      (payload.buyer?.email && payload.purchase?.transaction);

    logger.info("Detecção", { isWordPressUser, isHotmartPurchase });

    // Prioridade: Hotmart > WordPress
    if (isHotmartPurchase) {
      return await handleHotmartPurchase(payload, supabase, logger);
    }

    if (isWordPressUser) {
      return await handleWordPressUserCreated(payload, supabase, logger);
    }

    // ============================================
    // EVENTO DESCONHECIDO - REGISTRAR
    // ============================================
    
    logger.warn("Evento não reconhecido, registrando para análise");

    await supabase.from("integration_events").insert({
      event_type: eventType || "unknown",
      source: webhookSource || "unknown",
      source_id: generateEventId("unknown"),
      payload: payload,
      processed: false,
    });

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Evento registrado para análise",
      code: "EVENT_RECORDED"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    logger.error("ERRO CRÍTICO", error);

    // Registrar erro
    try {
      await supabase.from("integration_events").insert({
        event_type: "webhook_critical_error",
        source: "system",
        source_id: generateEventId("error"),
        payload: { error: errorMessage, stack: error instanceof Error ? error.stack : null },
        processed: false,
      });
    } catch (e) {
      logger.error("Falha ao registrar erro", e);
    }

    // SEMPRE retorna 200 para não quebrar integrações externas
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage,
      code: "INTERNAL_ERROR"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
