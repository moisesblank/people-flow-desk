// ============================================
// MOISÉS MEDEIROS v10.0 - RD STATION GATEWAY
// Gateway centralizado para envio de EMAIL e SMS via RD Station
// PLANO: RD Station Advanced (Email + SMS habilitado)
// ============================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Tipos de comunicação suportados e seus identificadores de conversão no RD Station
const CONVERSION_MAP: Record<string, string> = {
  // ===== EMAILS DE 2FA/SEGURANÇA =====
  "2fa_code": "codigo_2fa_autenticacao",
  "2fa_backup": "codigo_backup_2fa",
  "security_alert": "alerta_seguranca",
  "new_device": "novo_dispositivo_detectado",
  "password_reset": "reset_senha",
  "password_changed": "senha_alterada",
  
  // ===== EMAILS DE BOAS-VINDAS =====
  "welcome": "email_boas_vindas",
  "welcome_beta": "email_boas_vindas_beta",
  "welcome_premium": "email_boas_vindas_premium",
  "welcome_employee": "email_boas_vindas_funcionario",
  
  // ===== EMAILS DE COMPRA/PAGAMENTO =====
  "purchase_confirmed": "email_compra_confirmada",
  "payment_success": "email_pagamento_sucesso",
  "payment_failed": "email_pagamento_falhou",
  "refund_processed": "email_reembolso",
  "subscription_created": "assinatura_criada",
  "subscription_renewed": "assinatura_renovada",
  "subscription_canceled": "assinatura_cancelada",
  "subscription_expiring": "assinatura_expirando",
  
  // ===== EMAILS DE ACESSO/CONTA =====
  "access_created": "email_acesso_criado",
  "access_revoked": "email_acesso_revogado",
  "account_activated": "conta_ativada",
  "account_deactivated": "conta_desativada",
  
  // ===== EMAILS DE NOTIFICAÇÃO =====
  "task_reminder": "email_lembrete_tarefa",
  "calendar_reminder": "lembrete_calendario",
  "weekly_report": "email_relatorio_semanal",
  "monthly_report": "email_relatorio_mensal",
  "notification": "email_notificacao_geral",
  
  // ===== EMAILS DE VENCIMENTO =====
  "payment_due": "email_vencimento",
  "payment_overdue": "pagamento_atrasado",
  
  // ===== EMAILS DE CURSO/CONTEÚDO =====
  "new_lesson": "nova_aula_disponivel",
  "course_completed": "curso_concluido",
  "certificate_ready": "certificado_disponivel",
  "live_reminder": "lembrete_live",
  
  // ===== EMAILS DE AFILIADOS =====
  "affiliate_welcome": "afiliado_boas_vindas",
  "affiliate_sale": "afiliado_nova_venda",
  "affiliate_commission": "afiliado_comissao",
  
  // ===== EMAILS DE MARKETING =====
  "marketing": "email_marketing",
  "promotion": "email_promocao",
  "newsletter": "newsletter",
  
  // ===== SMS ESPECÍFICOS =====
  "sms_2fa": "sms_codigo_2fa",
  "sms_reminder": "sms_lembrete",
  "sms_notification": "sms_notificacao",
};

interface SendRequest {
  to: string;           // Email obrigatório
  phone?: string;       // Telefone para SMS (opcional)
  type: string;         // Tipo de mensagem (mapeia para conversion_identifier)
  subject?: string;     // Assunto do email
  message?: string;     // Mensagem para SMS
  data?: Record<string, any>; // Dados extras (campos personalizados cf_*)
  name?: string;        // Nome do destinatário
  sendEmail?: boolean;  // Enviar email (default: true)
  sendSMS?: boolean;    // Enviar SMS (default: false, exceto para 2fa)
}

interface RDStationPayload {
  event_type: string;
  event_family: string;
  payload: Record<string, any>;
}

// Formatar telefone para SMS (padrão brasileiro)
function formatPhoneForSMS(phone: string): string | null {
  if (!phone) return null;
  
  const numbersOnly = phone.replace(/\D/g, '');
  
  if (numbersOnly.length < 10) return null;
  
  if (numbersOnly.startsWith('55') && numbersOnly.length >= 12) {
    return numbersOnly;
  }
  
  const withoutZero = numbersOnly.startsWith('0') ? numbersOnly.substring(1) : numbersOnly;
  
  if (withoutZero.length >= 10 && withoutZero.length <= 11) {
    return `55${withoutZero}`;
  }
  
  return numbersOnly;
}

async function sendViaRDStation(
  email: string,
  phone: string | null,
  conversionIdentifier: string,
  name: string,
  extraData: Record<string, any>,
  sendEmail: boolean,
  sendSMS: boolean
): Promise<{ success: boolean; emailSent: boolean; smsSent: boolean; message: string; responseBody?: string }> {
  const rdApiKey = Deno.env.get("RD_STATION_API_KEY");
  
  if (!rdApiKey) {
    console.error("[RD-GATEWAY] RD_STATION_API_KEY não configurada");
    return { success: false, emailSent: false, smsSent: false, message: "RD Station API key não configurada" };
  }

  const formattedPhone = phone ? formatPhoneForSMS(phone) : null;

  const rdPayload: RDStationPayload = {
    event_type: "CONVERSION",
    event_family: "CDP",
    payload: {
      conversion_identifier: conversionIdentifier,
      email: email,
      name: name || "Lead",
      mobile_phone: sendSMS && formattedPhone ? formattedPhone : undefined,
      cf_origem: "plataforma_moises_medeiros",
      cf_data_evento: new Date().toISOString(),
      cf_plataforma: "pro.moisesmedeiros.com.br",
      cf_canal_envio: sendEmail && sendSMS ? "email_sms" : sendEmail ? "email" : "sms",
      ...extraData,
    }
  };

  // Remover campos undefined
  Object.keys(rdPayload.payload).forEach(key => {
    if (rdPayload.payload[key] === undefined) {
      delete rdPayload.payload[key];
    }
  });

  console.log(`[RD-GATEWAY] Enviando para ${email}${formattedPhone ? ` / SMS: ${formattedPhone}` : ''}`);
  console.log(`[RD-GATEWAY] Conversão: ${conversionIdentifier}`);
  console.log(`[RD-GATEWAY] Payload:`, JSON.stringify(rdPayload, null, 2));

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(
      `https://api.rd.services/platform/conversions?api_key=${rdApiKey}`,
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

    console.log(`[RD-GATEWAY] Response status: ${response.status}`);
    console.log(`[RD-GATEWAY] Response body: ${responseBody}`);

    if (response.ok || response.status === 200) {
      return { 
        success: true,
        emailSent: sendEmail,
        smsSent: sendSMS && !!formattedPhone,
        message: "Mensagem enviada via RD Station",
        responseBody 
      };
    } else {
      return { 
        success: false,
        emailSent: false,
        smsSent: false,
        message: `RD Station retornou status ${response.status}`,
        responseBody 
      };
    }
  } catch (error) {
    console.error("[RD-GATEWAY] Erro ao enviar:", error);
    return { 
      success: false,
      emailSent: false,
      smsSent: false,
      message: error instanceof Error ? error.message : "Erro desconhecido" 
    };
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ============================================
    // PROTEÇÃO: x-internal-secret OBRIGATÓRIO
    // ============================================
    const internalSecret = req.headers.get("x-internal-secret");
    const INTERNAL_SECRET = Deno.env.get("INTERNAL_SECRET");
    
    if (!INTERNAL_SECRET) {
      console.error("[RD-GATEWAY] ❌ INTERNAL_SECRET não configurado no servidor");
      return new Response(
        JSON.stringify({ success: false, error: "Configuração de segurança ausente" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!internalSecret || internalSecret !== INTERNAL_SECRET) {
      console.warn("[RD-GATEWAY] ❌ Chamada externa não autorizada");
      return new Response(
        JSON.stringify({ success: false, error: "Acesso não autorizado" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const requestData: SendRequest = await req.json();
    const { 
      to, 
      phone, 
      type, 
      subject, 
      message: smsMessage, 
      data, 
      name,
      sendEmail = true,
      sendSMS = false
    } = requestData;

    console.log(`[RD-GATEWAY] ========== REQUEST ==========`);
    console.log(`[RD-GATEWAY] To: ${to}`);
    console.log(`[RD-GATEWAY] Phone: ${phone || 'N/A'}`);
    console.log(`[RD-GATEWAY] Type: ${type}`);
    console.log(`[RD-GATEWAY] Subject: ${subject}`);
    console.log(`[RD-GATEWAY] Send Email: ${sendEmail}`);
    console.log(`[RD-GATEWAY] Send SMS: ${sendSMS}`);

    // Validar email
    if (!to || !to.includes("@")) {
      return new Response(
        JSON.stringify({ success: false, error: "Email inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validar tipo
    if (!type) {
      return new Response(
        JSON.stringify({ success: false, error: "Tipo de mensagem obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mapear para identificador de conversão do RD Station
    const conversionIdentifier = CONVERSION_MAP[type] || `email_${type}`;

    // Preparar dados extras
    const extraData: Record<string, any> = {
      cf_tipo_mensagem: type,
      cf_assunto: subject || "",
      cf_mensagem_sms: smsMessage || "",
      ...data,
    };

    // Enviar via RD Station
    const result = await sendViaRDStation(
      to, 
      phone || null, 
      conversionIdentifier, 
      name || "", 
      extraData,
      sendEmail,
      sendSMS
    );

    // Registrar evento no banco
    await supabaseAdmin.from("integration_events").insert({
      event_type: "rd_station_communication",
      source: "rd_gateway",
      source_id: `msg_${Date.now()}`,
      payload: {
        to,
        phone,
        type,
        conversion_identifier: conversionIdentifier,
        subject,
        send_email: sendEmail,
        send_sms: sendSMS,
        result_success: result.success,
        email_sent: result.emailSent,
        sms_sent: result.smsSent,
        result_message: result.message,
      },
      processed: result.success,
      error_message: result.success ? null : result.message,
    });

    if (result.success) {
      console.log(`[RD-GATEWAY] ✅ Mensagem enviada com sucesso`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: result.message,
          conversionIdentifier,
          channels: {
            email: result.emailSent,
            sms: result.smsSent
          }
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      console.error(`[RD-GATEWAY] ❌ Falha: ${result.message}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: result.message 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error: any) {
    console.error("[RD-GATEWAY] Erro geral:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
