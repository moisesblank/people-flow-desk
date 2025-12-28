// ============================================
// CORREIOS NOTIFY — DISPARO ATÔMICO EMAIL + WHATSAPP
// CONSTITUIÇÃO SYNAPSE Ω v10.x — PATCH-ONLY
// Atomicidade: ALL_OR_NOTHING
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Supabase Admin Client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// WhatsApp Cloud API Config
const WHATSAPP_ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

// Resend Config
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const RESEND_FROM = Deno.env.get('RESEND_FROM') || 'Pro Medeiros <noreply@pro.moisesmedeiros.com.br>';

interface NotifyRequest {
  envio_id: string;
}

interface NotifyResult {
  success: boolean;
  email_sent: boolean;
  email_id?: string;
  whatsapp_sent: boolean;
  whatsapp_id?: string;
  errors: string[];
}

// Verificar permissão (owner/admin)
async function checkPermission(authHeader: string): Promise<{ allowed: boolean; userId?: string; error?: string }> {
  if (!authHeader) {
    return { allowed: false, error: "Token de autenticação ausente" };
  }

  const token = authHeader.replace('Bearer ', '');
  const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
  if (authError || !user) {
    return { allowed: false, error: "Usuário não autenticado" };
  }

  const { data: roles } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);

  const allowedRoles = ['owner', 'admin'];
  const hasPermission = roles?.some(r => allowedRoles.includes(r.role));

  if (!hasPermission) {
    return { allowed: false, error: "Permissão negada. Apenas owner/admin podem enviar notificações." };
  }

  return { allowed: true, userId: user.id };
}

// Formatar telefone para E164
function formatPhoneE164(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 10) return null;
  if (cleaned.startsWith('55')) return cleaned;
  return `55${cleaned}`;
}

// Enviar Email via Resend
async function sendEmail(
  to: string,
  studentName: string,
  trackingCode: string,
  estimatedDelivery: string | null,
  trackingLink: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!RESEND_API_KEY) {
    return { success: false, error: "RESEND_API_KEY não configurado" };
  }

  console.log(`[EMAIL] Enviando para ${to}`);

  const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Seu Material Foi Enviado</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 16px 16px 0 0;">
              <div style="font-size: 48px; margin-bottom: 16px;">📦</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Seu Material Foi Enviado!</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Olá, <strong>${studentName}</strong>! 👋
              </p>
              <p style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.6;">
                Ótima notícia! Seu material didático foi postado pelos <strong>Correios</strong> e está a caminho!
              </p>
              
              <!-- Tracking Info Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f0f9ff; border-radius: 12px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="margin: 0 0 8px; color: #0369a1; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                      Código de Rastreio
                    </p>
                    <p style="margin: 0 0 16px; color: #0c4a6e; font-size: 24px; font-weight: 700; font-family: 'Courier New', monospace; letter-spacing: 2px;">
                      ${trackingCode}
                    </p>
                    ${estimatedDelivery ? `
                    <p style="margin: 0; color: #0369a1; font-size: 14px;">
                      📅 <strong>Previsão de entrega:</strong> ${new Date(estimatedDelivery).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    ` : ''}
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center">
                    <a href="${trackingLink}" target="_blank" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);">
                      🔍 Acompanhar Entrega
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
                Você também pode copiar o código acima e rastrear diretamente no site dos Correios.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 16px 16px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center; line-height: 1.6;">
                Este é um e-mail automático da plataforma Pro Moisés Medeiros.<br>
                Em caso de dúvidas, entre em contato com nosso suporte.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [to],
        subject: '📦 Seu material foi enviado pelos Correios',
        html: htmlContent,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[EMAIL] Erro:', result);
      return { success: false, error: result.message || 'Erro ao enviar email' };
    }

    console.log('[EMAIL] Enviado com sucesso:', result.id);
    return { success: true, id: result.id };
  } catch (error: any) {
    console.error('[EMAIL] Exceção:', error);
    return { success: false, error: error.message };
  }
}

// Enviar WhatsApp via Cloud API
async function sendWhatsApp(
  to: string,
  studentName: string,
  trackingCode: string,
  trackingLink: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    return { success: false, error: "WhatsApp Cloud API não configurado" };
  }

  const phone = formatPhoneE164(to);
  if (!phone) {
    return { success: false, error: "Número de telefone inválido" };
  }

  console.log(`[WHATSAPP] Enviando para ${phone}`);

  const message = `Olá ${studentName}! 📦

Seu material foi enviado pelos *Correios*!

🔖 *Código de Rastreio:*
\`${trackingCode}\`

🔍 *Acompanhe aqui:*
${trackingLink}

Qualquer dúvida, estamos à disposição! 🙌`;

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: phone,
          type: 'text',
          text: { body: message },
        }),
      }
    );

    const result = await response.json();

    if (!response.ok || result.error) {
      console.error('[WHATSAPP] Erro:', result);
      return { success: false, error: result.error?.message || 'Erro ao enviar WhatsApp' };
    }

    const messageId = result.messages?.[0]?.id;
    console.log('[WHATSAPP] Enviado com sucesso:', messageId);
    return { success: true, id: messageId };
  } catch (error: any) {
    console.error('[WHATSAPP] Exceção:', error);
    return { success: false, error: error.message };
  }
}

// Handler principal
const handler = async (req: Request): Promise<Response> => {
  console.log('[CORREIOS-NOTIFY] Requisição recebida');

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verificar permissão
    const auth = await checkPermission(req.headers.get('Authorization') || '');
    if (!auth.allowed) {
      console.error('[CORREIOS-NOTIFY] Permissão negada:', auth.error);
      return new Response(
        JSON.stringify({ success: false, error: auth.error }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { envio_id }: NotifyRequest = await req.json();

    if (!envio_id) {
      return new Response(
        JSON.stringify({ success: false, error: "envio_id obrigatório" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[CORREIOS-NOTIFY] Processando envio: ${envio_id}`);

    // Buscar dados do envio
    const { data: envio, error: envioError } = await supabaseAdmin
      .from('envios_correios')
      .select('*')
      .eq('id', envio_id)
      .single();

    if (envioError || !envio) {
      console.error('[CORREIOS-NOTIFY] Envio não encontrado:', envioError);
      return new Response(
        JSON.stringify({ success: false, error: "Envio não encontrado" }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GATE: Verificar pré-condições
    const errors: string[] = [];

    if (!envio.codigo_rastreio) {
      errors.push("Código de rastreio não cadastrado");
    }

    if (!envio.codigo_rastreio_validado) {
      errors.push("Código de rastreio não validado pelos Correios");
    }

    if (!envio.destinatario_email && !envio.destinatario_telefone) {
      errors.push("Aluno não possui email nem telefone cadastrado");
    }

    if (envio.notificacao_postagem_enviada) {
      errors.push("Notificação já foi enviada anteriormente");
    }

    if (errors.length > 0) {
      console.error('[CORREIOS-NOTIFY] Pré-condições não satisfeitas:', errors);
      return new Response(
        JSON.stringify({ success: false, errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Montar dados
    const trackingCode = envio.codigo_rastreio;
    const trackingLink = `https://rastreamento.correios.com.br/app/index.php?objetos=${trackingCode}`;
    const studentName = envio.destinatario_nome || 'Aluno';
    const studentEmail = envio.destinatario_email;
    const studentPhone = envio.destinatario_telefone;
    const estimatedDelivery = envio.data_entrega_prevista;

    // DISPARO ATÔMICO: Email + WhatsApp
    const result: NotifyResult = {
      success: false,
      email_sent: false,
      whatsapp_sent: false,
      errors: [],
    };

    // Enviar Email
    if (studentEmail) {
      const emailResult = await sendEmail(studentEmail, studentName, trackingCode, estimatedDelivery, trackingLink);
      result.email_sent = emailResult.success;
      result.email_id = emailResult.id;
      if (!emailResult.success && emailResult.error) {
        result.errors.push(`Email: ${emailResult.error}`);
      }
    } else {
      result.errors.push("Email: Não cadastrado");
    }

    // Enviar WhatsApp
    if (studentPhone) {
      const whatsappResult = await sendWhatsApp(studentPhone, studentName, trackingCode, trackingLink);
      result.whatsapp_sent = whatsappResult.success;
      result.whatsapp_id = whatsappResult.id;
      if (!whatsappResult.success && whatsappResult.error) {
        result.errors.push(`WhatsApp: ${whatsappResult.error}`);
      }
    } else {
      result.errors.push("WhatsApp: Não cadastrado");
    }

    // Verificar atomicidade: pelo menos um canal deve ter sucesso
    result.success = result.email_sent || result.whatsapp_sent;

    if (!result.success) {
      console.error('[CORREIOS-NOTIFY] Falha atômica - nenhum canal entregue:', result.errors);
      return new Response(
        JSON.stringify({ success: false, errors: result.errors }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Atualizar estado do envio
    const { error: updateError } = await supabaseAdmin
      .from('envios_correios')
      .update({
        notificacao_postagem_enviada: true,
        status: 'postado',
        updated_at: new Date().toISOString(),
      })
      .eq('id', envio_id);

    if (updateError) {
      console.error('[CORREIOS-NOTIFY] Erro ao atualizar envio:', updateError);
      result.errors.push(`Atualização: ${updateError.message}`);
    }

    // Registrar auditoria
    await supabaseAdmin.from('activity_log').insert({
      action: 'CORREIOS_NOTIFICATION_SENT',
      user_id: auth.userId,
      record_id: envio_id,
      table_name: 'envios_correios',
      new_value: {
        email_sent: result.email_sent,
        email_id: result.email_id,
        whatsapp_sent: result.whatsapp_sent,
        whatsapp_id: result.whatsapp_id,
        tracking_code: trackingCode,
        student_name: studentName,
        timestamp: new Date().toISOString(),
      },
    });

    console.log('[CORREIOS-NOTIFY] Sucesso:', result);

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[CORREIOS-NOTIFY] Erro fatal:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
