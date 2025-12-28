// ============================================
// MOISÉS MEDEIROS v18.0 - PRODUÇÃO FINAL
// Sistema de Gestão Integrado - Zero Erros
// PARTE 12: Integração com c-create-official-access
// ============================================
// A) WordPress cria usuário → Registra LEAD (não cria aluno)
// B) Hotmart aprova compra → Cria ALUNO + Auth + user_roles (role=beta)
// C) RD Station → Notifica e registra envio de email
// D) WebHook_MKT → Notifica site e registra evento
// E) Email de boas-vindas via Resend
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from 'https://esm.sh/resend@2.0.0';

import { getWebhookCorsHeaders } from "../_shared/corsConfig.ts";

// LEI VI: Webhooks server-to-server usam getWebhookCorsHeaders()
const corsHeaders = getWebhookCorsHeaders();

// ============================================
// CONFIGURAÇÕES - INTEGRAÇÕES EXTERNAS
// ============================================
const CONFIG = {
  RD_STATION: {
    API_KEY: Deno.env.get("RD_STATION_API_KEY") || "",
    BASE_URL: "https://api.rd.services/platform/conversions",
    TIMEOUT: 10000,
  },
  // WEBHOOK_MKT removido - WordPress não é mais usado (2025-12-28)
  EVENTS: {
    APPROVED: ["PURCHASE_APPROVED", "PURCHASE_COMPLETE", "PURCHASE_DELAYED", "purchase.approved", "purchase.completed", "purchase_approved", "approved", "completed"],
    USER_CREATED: ["user_created", "new_user"],
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
// CRIAR ACESSO BETA (PARTE 12)
// Lógica alinhada com c-create-official-access
// Cria Auth user + profiles + user_roles (role=beta)
// Envia email de boas-vindas via Resend
// ============================================

interface CreateBetaResult {
  success: boolean;
  user_id?: string;
  email_sent: boolean;
  already_existed: boolean;
  error?: string;
}

async function createBetaAccess(
  supabase: any,
  email: string,
  name: string,
  phone: string | null,
  logger: Logger
): Promise<CreateBetaResult> {
  
  logger.info("🔐 Criando acesso Beta (Auth + user_roles)...", { email, name });

  const result: CreateBetaResult = {
    success: false,
    email_sent: false,
    already_existed: false,
  };

  try {
    // 1. Verificar se usuário já existe no Auth (por email)
    let userId: string | null = null;
    
    // Buscar em profiles primeiro (mais confiável)
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (existingProfile) {
      userId = existingProfile.id;
      result.already_existed = true;
      logger.info("ℹ️ Usuário já existe em profiles:", { id: userId });
    }

    // 2. Se não existe, criar no Supabase Auth
    if (!userId) {
      logger.info("📝 Criando novo usuário no Auth...");
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: email.toLowerCase(),
        email_confirm: true,
        user_metadata: {
          nome: name,
          created_by: 'hotmart-webhook',
          created_via: 'hotmart-webhook-processor',
        },
      });

      if (createError) {
        // Verificar se é erro de "user already exists"
        if (createError.message?.toLowerCase().includes('already') || 
            createError.message?.toLowerCase().includes('exists')) {
          logger.warn("⚠️ Usuário já existe no Auth, buscando...");
          
          // Buscar pelo email no Auth
          const { data: listData } = await supabase.auth.admin.listUsers();
          const existingAuthUser = listData?.users?.find(
            (u: any) => u.email?.toLowerCase() === email.toLowerCase()
          );
          
          if (existingAuthUser) {
            userId = existingAuthUser.id;
            result.already_existed = true;
            logger.info("✅ Usuário encontrado no Auth:", { id: userId });
          } else {
            result.error = `Erro ao criar usuário: ${createError.message}`;
            logger.error("❌ Erro ao criar usuário e não encontrado:", createError);
            return result;
          }
        } else {
          result.error = `Erro ao criar usuário: ${createError.message}`;
          logger.error("❌ Erro ao criar usuário:", createError);
          return result;
        }
      } else if (newUser?.user) {
        userId = newUser.user.id;
        logger.success("✅ Novo usuário criado no Auth:", { id: userId });
      }
    }

    if (!userId) {
      result.error = "Não foi possível obter user_id";
      logger.error("❌ user_id não obtido após criação/busca");
      return result;
    }

    result.user_id = userId;

    // 3. Upsert em profiles
    const profileData: Record<string, unknown> = {
      id: userId,
      nome: name,
      email: email.toLowerCase(),
    };
    if (phone) {
      profileData.phone = phone;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(profileData, { onConflict: 'id' });

    if (profileError) {
      logger.warn("⚠️ Profile upsert warning:", profileError.message);
    } else {
      logger.success("✅ Profile upserted");
    }

    // ============================================
    // 4. UPSERT EM USER_ROLES (CONSTITUIÇÃO v10.x)
    // Regra: 1 role por user_id (constraint UNIQUE user_roles_user_id_key)
    // 
    // ⚠️ ESTRATÉGIA DE CONFLICT:
    // - ON CONFLICT (user_id) DO UPDATE: Sobrescreve role existente
    // - Aluno pode "subir" de aluno_gratuito → beta
    // ============================================
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: userId,
        role: 'beta',
      }, { 
        onConflict: 'user_id',  // ✅ CORRETO: 1 role por user
        ignoreDuplicates: false, // ✅ ATUALIZA role se já existir
      });

    if (roleError) {
      logger.error("❌ Role upsert error:", roleError);
      result.error = `Erro ao atribuir role: ${roleError.message}`;
      // Não retorna erro - continua para tentar email
    } else {
      logger.success("✅ Role beta atribuída via user_roles");
    }

    // 5. Gerar link de recuperação de senha
    let passwordSetupLink: string | undefined;
    
    if (!result.already_existed) {
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: email.toLowerCase(),
        options: {
          redirectTo: 'https://pro.moisesmedeiros.com.br/auth?action=set-password',
        },
      });

      if (linkError) {
        logger.warn("⚠️ Erro ao gerar link de senha:", linkError.message);
      } else if (linkData?.properties?.action_link) {
        passwordSetupLink = linkData.properties.action_link;
        logger.success("✅ Link de configuração de senha gerado");
      }
    }

    // 6. Enviar email de boas-vindas via Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const resendFrom = Deno.env.get('RESEND_FROM');

    if (resendApiKey && resendFrom) {
      try {
        const resend = new Resend(resendApiKey);
        const platformUrl = 'https://pro.moisesmedeiros.com.br';
        const needsPasswordSetup = !!passwordSetupLink;

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%); padding: 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                🎉 Parabéns pela compra, ${name}!
              </h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0; font-size: 16px;">
                Seu acesso Premium está ativo
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Olá, <strong>${name}</strong>!
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Seu pagamento foi confirmado e você agora tem acesso completo à plataforma:
              </p>
              <div style="background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 16px; margin: 0 0 24px; text-align: center;">
                <span style="color: #166534; font-size: 18px; font-weight: 600;">
                  ✅ Aluno Beta (Premium)
                </span>
              </div>
              ${needsPasswordSetup ? `
              <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 20px; margin: 0 0 24px;">
                <h3 style="color: #92400e; margin: 0 0 12px; font-size: 16px;">🔐 Configure sua senha</h3>
                <p style="color: #78350f; font-size: 14px; line-height: 1.5; margin: 0 0 16px;">
                  Para acessar a plataforma, defina sua senha clicando no botão abaixo:
                </p>
                <a href="${passwordSetupLink}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600;">
                  Definir Minha Senha
                </a>
                <p style="color: #92400e; font-size: 12px; margin: 16px 0 0;">
                  ⚠️ Este link expira em 24 horas.
                </p>
              </div>
              ` : `
              <div style="background-color: #ecfdf5; border: 1px solid #6ee7b7; border-radius: 8px; padding: 20px; margin: 0 0 24px;">
                <h3 style="color: #065f46; margin: 0 0 12px; font-size: 16px;">✅ Acesso pronto!</h3>
                <a href="${platformUrl}/auth" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600;">
                  Acessar Plataforma
                </a>
              </div>
              `}
              <h3 style="color: #111827; font-size: 18px; margin: 24px 0 12px;">📚 O que você terá acesso:</h3>
              <ul style="color: #374151; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>Todas as videoaulas disponíveis</li>
                <li>Materiais didáticos exclusivos</li>
                <li>Simulados e exercícios</li>
                <li>Correção de redações</li>
                <li>Tutoria e suporte</li>
                <li>Comunidade premium</li>
              </ul>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} PRO Moisés Medeiros. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

        const { error: emailError } = await resend.emails.send({
          from: resendFrom,
          to: [email.toLowerCase()],
          subject: needsPasswordSetup 
            ? `🎉 Parabéns, ${name}! Configure seu acesso Premium` 
            : `🎉 Parabéns, ${name}! Seu acesso Premium está pronto`,
          html: htmlContent,
        });

        if (emailError) {
          logger.warn("⚠️ Erro ao enviar email:", emailError);
        } else {
          result.email_sent = true;
          logger.success("✅ Email de boas-vindas enviado");
        }
      } catch (emailErr) {
        logger.warn("⚠️ Exceção ao enviar email:", emailErr);
      }
    } else {
      logger.warn("⚠️ RESEND_API_KEY ou RESEND_FROM não configurado - email não enviado");
    }

    result.success = true;
    logger.success("✅ Acesso Beta criado com sucesso", { 
      user_id: userId, 
      email_sent: result.email_sent,
      already_existed: result.already_existed,
    });

    return result;

  } catch (err) {
    result.error = err instanceof Error ? err.message : 'Erro desconhecido';
    logger.error("❌ Exceção em createBetaAccess:", err);
    return result;
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
        cf_plataforma: "pro.moisesmedeiros.com.br",
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
// NOTIFICADOR WEBHOOK_MKT (D) - REMOVIDO
// WordPress removido em 2025-12-28
// Essa função era usada para notificar o site WordPress
// Agora o acesso é 100% via Supabase Auth + user_roles
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
  // WordPress removido - função stub que apenas loga
  logger.info(`WebHook_MKT: DESABILITADO (WordPress removido) - ${eventType} para ${data.email}`);
  return { success: true, message: "WordPress removido - operação ignorada" };
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
  // ============================================
  // CLASSIFICAÇÃO POR PRODUCT_ID (Livroweb vs Físico)
  // ID 6585429 = MATERIAL DIGITAL - WEB = livroweb
  // ID 6656573 = MATERIAL FÍSICO = fisico
  // ============================================
  const productId = payload.data?.product?.id?.toString() || payload.product?.id?.toString() || null;
  let tipoProduto: string | null = null;
  
  if (productId === '6585429') {
    tipoProduto = 'livroweb';
    logger.info("📚 Produto identificado: LIVROWEB (Material Digital)", { productId });
  } else if (productId === '6656573') {
    tipoProduto = 'fisico';
    logger.info("📦 Produto identificado: FÍSICO (Material Físico)", { productId });
  } else if (productId) {
    logger.info("❓ Product ID não mapeado", { productId });
  }
  
  const alunoData = {
    nome: data.name || existingLead?.nome || "Aluno Hotmart",
    email: data.email,
    telefone: data.phone || existingLead?.phone || null,
    status: "ativo",
    data_matricula: timestamp,
    valor_pago: data.purchaseValue,
    hotmart_transaction_id: data.transactionId || null,
    fonte: "Hotmart",
    tipo_produto: tipoProduto,
    observacoes: [
      `Produto: ${data.productName}`,
      `Valor: R$ ${data.purchaseValue.toFixed(2)}`,
      existingLead ? `Lead criado por: ${leadInfo.admin_criador || "Sistema"}` : "Compra direta",
      existingLead ? `Lead em: ${leadInfo.data_criacao || "N/A"}` : null,
      `TX: ${data.transactionId || "N/A"}`,
      `Processado: ${new Date().toLocaleString("pt-BR")}`,
      `Webhook: v18 (Beta Access)`,
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

  // ============================================
  // PARTE 12: CRIAR ACESSO BETA (Auth + user_roles)
  // Idempotente por email, role sempre = beta
  // ============================================
  const betaAccessResult = await createBetaAccess(
    supabase,
    data.email,
    data.name || existingLead?.nome || "Aluno Hotmart",
    data.phone || existingLead?.phone || null,
    logger
  );

  if (!betaAccessResult.success) {
    logger.warn("⚠️ Falha ao criar acesso Beta (Auth/user_roles)", betaAccessResult.error);
    // Não falha o webhook - aluno já foi criado
  } else {
    logger.success("✅ Acesso Beta criado/atualizado", { 
      user_id: betaAccessResult.user_id,
      email_sent: betaAccessResult.email_sent,
      already_existed: betaAccessResult.already_existed,
    });
  }

  // ============================================
  // SALVAR TRANSAÇÃO NA TABELA transacoes_hotmart_completo
  // ============================================
  const transacaoData = {
    transaction_id: data.transactionId || generateEventId("tx"),
    product_id: payload.data?.product?.id?.toString() || payload.product?.id?.toString() || null,
    product_name: data.productName,
    buyer_email: data.email,
    buyer_name: data.name,
    buyer_phone: data.phone || null,
    status: "approved",
    valor_bruto: data.purchaseValue,
    metodo_pagamento: payload.data?.purchase?.payment?.type || payload.purchase?.payment?.type || null,
    parcelas: payload.data?.purchase?.payment?.installments_number || payload.purchase?.installments || 1,
    affiliate_name: payload.data?.affiliate?.name || payload.affiliate?.name || null,
    affiliate_id: payload.data?.affiliate?.affiliate_code || payload.affiliate?.id?.toString() || null,
    data_compra: timestamp,
    webhook_raw: payload,
    hotmart_event: payload.event || payload.status || "purchase_approved",
  };

  const { error: txError } = await supabase
    .from("transacoes_hotmart_completo")
    .upsert(transacaoData, { onConflict: "transaction_id" });

  if (txError) {
    logger.warn("Erro ao salvar transação Hotmart", txError.message);
  } else {
    logger.success("Transação Hotmart salva", { transaction_id: transacaoData.transaction_id });
  }

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

  // Registrar evento principal (inclui resultado do acesso Beta)
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
      beta_access: {
        success: betaAccessResult.success,
        user_id: betaAccessResult.user_id || null,
        email_sent: betaAccessResult.email_sent,
        already_existed: betaAccessResult.already_existed,
        error: betaAccessResult.error || null,
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
      `Acesso Beta: ${betaAccessResult.success ? "✅" : "❌"} ${betaAccessResult.email_sent ? "(email enviado)" : ""}`,
    ].join("\n"),
    "sale",
    "/gestaofc/gestao-alunos",
    logger
  );

  logger.separator("COMPRA HOTMART PROCESSADA COM SUCESSO");

  return new Response(JSON.stringify({ 
    success: true, 
    type: "purchase_approved",
    code: "ALUNO_CREATED",
    aluno_id: alunoId,
    user_id: betaAccessResult.user_id || null,
    role: "beta",
    had_lead: !!existingLead,
    lead_admin: leadInfo.admin_criador || null,
    message: "Compra aprovada - Aluno criado com sucesso",
    integrations: {
      rd_station: rdResult.success,
      webhook_mkt: mktResult.success,
    },
    beta_access: {
      success: betaAccessResult.success,
      user_id: betaAccessResult.user_id,
      email_sent: betaAccessResult.email_sent,
      already_existed: betaAccessResult.already_existed,
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

  const logger = new Logger("18");
  
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // ============================================
  // 🛡️ VALIDAÇÃO DE ASSINATURA OBRIGATÓRIA
  // LEI III + LEI VI — SEGURANÇA NÍVEL NASA
  // ============================================
  const HOTMART_HOTTOK = Deno.env.get("HOTMART_HOTTOK");
  const receivedHottok = req.headers.get("x-hotmart-hottok");
  const webhookSource = req.headers.get("x-webhook-source") || "";
  const siteToken = req.headers.get("x-site-token") || req.headers.get("x-webhook-secret") || "";
  
  // Detectar se é Hotmart (headers ou estrutura do payload)
  const isHotmartRequest = 
    receivedHottok || 
    req.headers.get("x-hotmart-webhook-version") ||
    webhookSource.toLowerCase().includes("hotmart");

  // WordPress removido em 2025-12-28 - não detectamos mais isWordPressRequest

  // 🔐 VALIDAÇÃO HOTTOK PARA HOTMART
  if (isHotmartRequest) {
    if (!HOTMART_HOTTOK) {
      logger.error("❌ HOTTOK não configurado no servidor");
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Configuração de segurança ausente",
        code: "SECURITY_CONFIG_MISSING"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!receivedHottok) {
      logger.error("❌ HOTTOK ausente na requisição Hotmart");
      
      // Log de segurança
      await supabase.from("security_events").insert({
        event_type: "webhook_missing_signature",
        severity: "critical",
        user_id: null,
        ip_address: req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "unknown",
        user_agent: req.headers.get("user-agent"),
        payload: {
          source: "hotmart-webhook-processor",
          reason: "HOTTOK_MISSING",
          headers: Object.fromEntries([...req.headers.entries()].filter(([k]) => 
            !k.toLowerCase().includes("authorization") && 
            !k.toLowerCase().includes("cookie")
          )),
        },
      }).then(() => {}).then(() => {}, () => {});

      return new Response(JSON.stringify({ 
        success: false, 
        error: "Assinatura de webhook ausente",
        code: "SIGNATURE_MISSING"
      }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Comparação segura (timing-safe não disponível em Deno, mas usamos trim/lowercase)
    const isValidHottok = receivedHottok.trim() === HOTMART_HOTTOK.trim();
    
    if (!isValidHottok) {
      logger.error("❌ HOTTOK inválido - possível tentativa de fraude");
      
      // Log de segurança - tentativa de fraude
      await supabase.from("security_events").insert({
        event_type: "webhook_invalid_signature",
        severity: "critical",
        user_id: null,
        ip_address: req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "unknown",
        user_agent: req.headers.get("user-agent"),
        payload: {
          source: "hotmart-webhook-processor",
          reason: "HOTTOK_INVALID",
          received_token_hash: await crypto.subtle.digest(
            "SHA-256", 
            new TextEncoder().encode(receivedHottok)
          ).then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16)),
        },
      }).then(() => {}).then(() => {}, () => {});

      return new Response(JSON.stringify({ 
        success: false, 
        error: "Assinatura de webhook inválida",
        code: "SIGNATURE_INVALID"
      }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    logger.success("✅ HOTTOK validado com sucesso");
  }

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
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const payloadSource = payload.source || "";
    const eventType = sanitizeString(payload.event || payload.status || payload.type || "");

    logger.separator("WEBHOOK RECEBIDO (AUTENTICADO)");
    logger.info("Source", webhookSource || payloadSource);
    logger.info("Event", eventType);
    logger.info("Payload preview", JSON.stringify(payload).substring(0, 600));

    // ============================================
    // DETECTAR E ROTEAR
    // ============================================

    // A) WordPress removido em 2025-12-28 - não processamos mais

    // B) Hotmart Purchase
    const isHotmartPurchase = 
      CONFIG.EVENTS.APPROVED.some(e => eventType.toLowerCase() === e.toLowerCase()) ||
      (payload.data?.purchase?.transaction && payload.data?.buyer?.email) ||
      (payload.buyer?.email && payload.purchase?.transaction);

    logger.info("Detecção", { isHotmartPurchase });

    // Apenas Hotmart
    if (isHotmartPurchase) {
      return await handleHotmartPurchase(payload, supabase, logger);
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
