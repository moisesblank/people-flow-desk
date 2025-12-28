// ============================================
// MOISÉS MEDEIROS v10.0 - RESEND EMAIL GATEWAY
// Gateway central para TODOS os emails via Resend
// 50,000 emails/mês - Transactional Pro
// ============================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { getCorsHeaders, handleCorsOptions } from "../_shared/corsConfig.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const FROM_EMAIL = Deno.env.get("RESEND_FROM") || "Prof. Moisés Medeiros <noreply@moisesmedeiros.com.br>";

// ============================================
// TIPOS DE EMAIL SUPORTADOS
// ============================================
type EmailType = 
  // 2FA / Segurança
  | "2fa_code" | "2fa_backup" | "security_alert" | "new_device"
  | "password_reset" | "password_changed"
  // Boas-vindas
  | "welcome" | "welcome_beta" | "welcome_premium" | "welcome_employee"
  // Compra/Pagamento
  | "purchase_confirmed" | "payment_success" | "payment_failed" | "refund_processed"
  | "subscription_created" | "subscription_renewed" | "subscription_canceled" | "subscription_expiring"
  // Acesso/Conta
  | "access_created" | "access_revoked" | "account_activated" | "account_deactivated"
  // Notificações
  | "task_reminder" | "calendar_reminder" | "weekly_report" | "monthly_report" | "notification"
  // Vencimentos
  | "payment_due" | "payment_overdue"
  // Curso/Conteúdo
  | "new_lesson" | "course_completed" | "certificate_ready" | "live_reminder"
  // Afiliados
  | "affiliate_welcome" | "affiliate_sale" | "affiliate_commission" | "affiliate_payment"
  // Marketing
  | "marketing" | "promotion" | "newsletter"
  // Custom
  | "custom";

interface EmailRequest {
  to: string | string[];
  type: EmailType;
  data?: Record<string, any>;
  // Opcionais para tipo "custom"
  subject?: string;
  html?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
}

interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: "resend";
}

// ============================================
// TEMPLATE BASE - CURSO MOISÉS MEDEIROS
// Design aprovado com cores da marca
// ============================================
const getBaseTemplate = (titulo: string, conteudo: string, botaoTexto?: string, botaoUrl?: string) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${titulo} — Curso Moisés Medeiros</title>
  <style>
    @media only screen and (max-width: 600px) {
      .main-container { padding: 16px !important; }
      .content-box { padding: 20px !important; }
      h1 { font-size: 20px !important; }
      .btn { padding: 12px 24px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#0a0a0f;color:#ffffff;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0f;">
    <tr>
      <td align="center" style="padding:24px;" class="main-container">
        <table role="presentation" width="100%" style="max-width:640px;" cellspacing="0" cellpadding="0">
          <tr>
            <td style="background:linear-gradient(180deg,#131318 0%,#0a0a0f 100%);border-radius:16px;padding:28px;border:1px solid #7D1128;" class="content-box">
              
              <!-- Header -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom:20px;">
                    <h1 style="margin:0;color:#E62B4A;font-size:24px;font-weight:700;">Curso Moisés Medeiros</h1>
                    <p style="margin:8px 0 0;color:#9aa0a6;font-size:13px;">${titulo}</p>
                  </td>
                </tr>
              </table>

              <!-- Content -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="color:#e6e6e6;line-height:1.7;font-size:14px;">
                    ${conteudo}
                  </td>
                </tr>
              </table>

              ${botaoTexto && botaoUrl ? `
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-top:24px;">
                    <a href="${botaoUrl}" class="btn" style="display:inline-block;background:linear-gradient(135deg,#E62B4A,#7D1128);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:14px;box-shadow:0 4px 15px rgba(230,43,74,0.3);">${botaoTexto}</a>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- Divider -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding:24px 0 18px;">
                    <hr style="border:none;border-top:1px solid #2a2a2f;margin:0;" />
                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="color:#9aa0a6;font-size:12px;line-height:1.6;">
                    <p style="margin:0 0 8px;"><strong style="color:#e6e6e6;">Prof. Moisés Medeiros Melo</strong></p>
                    <p style="margin:0 0 8px;">MM CURSO DE QUÍMICA LTDA | O curso que mais aprova e comprova!</p>
                    <p style="margin:0 0 8px;">
                      WhatsApp: <a href="https://wa.me/558396169222" style="color:#E62B4A;text-decoration:none;">+55 83 9616-9222</a>
                    </p>
                    <p style="margin:0 0 8px;">
                      <a href="https://www.moisesmedeiros.com.br" style="color:#E62B4A;text-decoration:none;">www.moisesmedeiros.com.br</a> | 
                      falemcom@moisesmedeiros.com.br
                    </p>
                    <p style="margin:12px 0 0;">
                      <a href="https://instagram.com/moises.profquimica" style="color:#E62B4A;text-decoration:none;">Instagram</a> • 
                      <a href="https://t.me/+KIur74un8Gg2ZWJh" style="color:#E62B4A;text-decoration:none;">Telegram</a> • 
                      <a href="https://www.youtube.com/@moises.profquimica" style="color:#E62B4A;text-decoration:none;">YouTube</a>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Copyright -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-top:18px;">
                    <p style="margin:0;color:#666;font-size:11px;">© ${new Date().getFullYear()} MM Curso de Química Ltda. Todos os direitos reservados.</p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// ============================================
// TEMPLATES DE EMAIL
// ============================================
const getEmailTemplate = (type: EmailType, data: Record<string, any> = {}): { subject: string; html: string } => {
  const templates: Record<string, { subject: string; html: string }> = {
    
    // ===== 2FA / SEGURANÇA =====
    "2fa_code": {
      subject: `🔐 [${data.code}] Código de Verificação - Prof. Moisés Medeiros`,
      html: getBaseTemplate(
        "Verificação em Duas Etapas",
        `
        <h2 style="margin:0 0 16px;font-size:18px;color:#ffffff;">Olá, ${data.nome || 'Usuário'}!</h2>
        <p style="margin:0 0 16px;">Seu código de verificação é:</p>
        <div style="background:#1a1a1f;border-radius:12px;padding:24px;margin:20px 0;text-align:center;">
          <p style="margin:0;color:#E62B4A;font-size:36px;font-weight:700;letter-spacing:8px;font-family:monospace;">${data.code}</p>
        </div>
        <p style="margin:0 0 12px;color:#ff9500;">⏱️ Este código expira em <strong>${data.expiracao || 5} minutos</strong>.</p>
        <p style="margin:0;color:#9aa0a6;font-size:13px;">⚠️ Nunca compartilhe este código com ninguém. Nossa equipe jamais solicitará seu código.</p>
        `
      ),
    },

    "2fa_backup": {
      subject: "🔑 Códigos de Backup - Prof. Moisés Medeiros",
      html: getBaseTemplate(
        "Códigos de Backup 2FA",
        `
        <h2 style="margin:0 0 16px;font-size:18px;color:#ffffff;">Códigos de Backup Gerados</h2>
        <p style="margin:0 0 16px;">Guarde estes códigos em um local seguro. Cada código só pode ser usado uma vez.</p>
        <div style="background:#1a1a1f;border-radius:8px;padding:16px;margin:16px 0;font-family:monospace;">
          ${(data.codes || []).map((c: string) => `<p style="margin:4px 0;color:#E62B4A;">${c}</p>`).join('')}
        </div>
        <p style="margin:0;color:#ff6b6b;">⚠️ Estes códigos não serão mostrados novamente!</p>
        `
      ),
    },

    "security_alert": {
      subject: "🚨 Alerta de Segurança - Prof. Moisés Medeiros",
      html: getBaseTemplate(
        "Alerta de Segurança",
        `
        <h2 style="margin:0 0 16px;font-size:18px;color:#ff6b6b;">⚠️ Atividade Suspeita Detectada</h2>
        <p style="margin:0 0 16px;">${data.mensagem || 'Detectamos uma atividade incomum em sua conta.'}</p>
        <div style="background:#1a1a1f;border-radius:8px;padding:16px;margin:16px 0;">
          ${data.ip ? `<p style="margin:0 0 8px;"><strong>IP:</strong> ${data.ip}</p>` : ''}
          ${data.dispositivo ? `<p style="margin:0 0 8px;"><strong>Dispositivo:</strong> ${data.dispositivo}</p>` : ''}
          ${data.localizacao ? `<p style="margin:0;"><strong>Localização:</strong> ${data.localizacao}</p>` : ''}
        </div>
        <p style="margin:0;">Se não foi você, altere sua senha imediatamente.</p>
        `,
        "Alterar Senha",
        "https://pro.moisesmedeiros.com.br/auth?reset=true"
      ),
    },

    "new_device": {
      subject: "📱 Novo Dispositivo Detectado - Prof. Moisés Medeiros",
      html: getBaseTemplate(
        "Novo Dispositivo",
        `
        <h2 style="margin:0 0 16px;font-size:18px;color:#ffffff;">Novo acesso detectado</h2>
        <p style="margin:0 0 16px;">Um novo dispositivo acessou sua conta:</p>
        <div style="background:#1a1a1f;border-radius:8px;padding:16px;margin:16px 0;">
          <p style="margin:0 0 8px;"><strong>📱 Dispositivo:</strong> ${data.dispositivo || 'Desconhecido'}</p>
          <p style="margin:0 0 8px;"><strong>🌍 Localização:</strong> ${data.localizacao || 'Desconhecida'}</p>
          <p style="margin:0;"><strong>🕐 Data/Hora:</strong> ${data.data || new Date().toLocaleString('pt-BR')}</p>
        </div>
        <p style="margin:0;color:#9aa0a6;">Se foi você, pode ignorar este email.</p>
        `
      ),
    },

    "password_reset": {
      subject: "🔐 Recuperação de Senha - Prof. Moisés Medeiros",
      html: getBaseTemplate(
        "Recuperação de Senha",
        `
        <h2 style="margin:0 0 16px;font-size:18px;color:#ffffff;">Olá, ${data.nome || 'Usuário'}!</h2>
        <p style="margin:0 0 16px;">Recebemos uma solicitação para redefinir sua senha.</p>
        <p style="margin:0 0 16px;color:#9aa0a6;font-size:13px;">⏱️ Este link expira em 1 hora.</p>
        <p style="margin:0;color:#9aa0a6;">Se você não solicitou, ignore este email.</p>
        `,
        "Redefinir Minha Senha",
        data.reset_link || "https://pro.moisesmedeiros.com.br/auth?reset=true"
      ),
    },

    "password_changed": {
      subject: "✅ Senha Alterada com Sucesso - Prof. Moisés Medeiros",
      html: getBaseTemplate(
        "Senha Alterada",
        `
        <h2 style="margin:0 0 16px;font-size:18px;color:#ffffff;">Olá, ${data.nome || 'Usuário'}!</h2>
        <p style="margin:0 0 16px;">Sua senha foi alterada com sucesso! ✅</p>
        <div style="background:#1a1a1f;border-radius:8px;padding:16px;margin:16px 0;">
          <p style="margin:0;"><strong>🕐 Data/Hora:</strong> ${data.data || new Date().toLocaleString('pt-BR')}</p>
        </div>
        <p style="margin:0;color:#ff6b6b;"><strong>⚠️ Se você NÃO alterou sua senha</strong>, entre em contato imediatamente!</p>
        `,
        "Acessar Sistema",
        "https://pro.moisesmedeiros.com.br/gestaofc"
      ),
    },

    // ===== BOAS-VINDAS =====
    "welcome": {
      subject: "🎉 Bem-vindo(a) ao Curso Moisés Medeiros!",
      html: getBaseTemplate(
        "Bem-vindo(a)!",
        `
        <h2 style="margin:0 0 16px;font-size:18px;color:#ffffff;">Olá, ${data.nome || 'Aluno(a)'}! 👋</h2>
        <p style="margin:0 0 16px;">Seja muito bem-vindo(a) ao Curso Moisés Medeiros! 🎓</p>
        <p style="margin:0 0 16px;">Você acaba de dar o primeiro passo rumo à sua aprovação. Estamos muito felizes em ter você conosco!</p>
        <p style="margin:0;">O curso que mais aprova e comprova está pronto para te levar ao topo! 🚀</p>
        `,
        "Acessar Plataforma",
        "https://pro.moisesmedeiros.com.br/alunos"
      ),
    },

    "welcome_beta": {
      subject: "🎉 Bem-vindo(a) ao Curso Premium - Prof. Moisés Medeiros!",
      html: getBaseTemplate(
        "Bem-vindo ao Premium!",
        `
        <h2 style="margin:0 0 16px;font-size:18px;color:#ffffff;">Olá, ${data.nome || 'Aluno(a)'}! 🌟</h2>
        <p style="margin:0 0 16px;">Parabéns pela decisão de investir no seu futuro! Você agora é um aluno Premium do Curso Moisés Medeiros!</p>
        <p style="margin:0 0 16px;">Seu acesso completo já está liberado, incluindo:</p>
        <ul style="margin:0 0 16px;padding-left:20px;color:#e6e6e6;">
          <li>📚 Todas as videoaulas</li>
          <li>📝 Materiais exclusivos</li>
          <li>🎯 Simulados ilimitados</li>
          <li>💬 Suporte prioritário</li>
        </ul>
        `,
        "Começar a Estudar",
        "https://pro.moisesmedeiros.com.br/alunos"
      ),
    },

    "welcome_premium": {
      subject: "⭐ Bem-vindo(a) ao Premium - Prof. Moisés Medeiros!",
      html: getBaseTemplate(
        "Acesso Premium Liberado!",
        `
        <h2 style="margin:0 0 16px;font-size:18px;color:#ffffff;">Parabéns, ${data.nome || 'Aluno(a)'}! 🏆</h2>
        <p style="margin:0 0 16px;">Seu acesso Premium está ativo! Agora você tem acesso completo a todo o conteúdo.</p>
        <div style="background:#1a1a1f;border-radius:8px;padding:16px;margin:16px 0;">
          <p style="margin:0 0 8px;"><strong>📅 Início:</strong> ${data.inicio || new Date().toLocaleDateString('pt-BR')}</p>
          <p style="margin:0;"><strong>📅 Validade:</strong> ${data.validade || '12 meses'}</p>
        </div>
        `,
        "Acessar Área Premium",
        "https://pro.moisesmedeiros.com.br/alunos"
      ),
    },

    "welcome_employee": {
      subject: "👊 Bem-vindo(a) à Equipe - Curso Moisés Medeiros!",
      html: getBaseTemplate(
        "Bem-vindo(a) à Equipe!",
        `
        <h2 style="margin:0 0 16px;font-size:18px;color:#ffffff;">Olá, ${data.nome || 'Colaborador(a)'}!</h2>
        <p style="margin:0 0 16px;">Seja muito bem-vindo(a) à equipe do Curso Moisés Medeiros! 👊📚</p>
        <p style="margin:0 0 16px;">Os dados de acesso e orientações iniciais já foram encaminhados via WhatsApp.</p>
        <p style="margin:0;">Vamos juntos manter — e elevar — o padrão. 💪🔥</p>
        `,
        "Acessar Sistema",
        "https://pro.moisesmedeiros.com.br/gestaofc"
      ),
    },

    // ===== COMPRA/PAGAMENTO =====
    "purchase_confirmed": {
      subject: "✅ Compra Confirmada - Prof. Moisés Medeiros!",
      html: getBaseTemplate(
        "Compra Confirmada!",
        `
        <h2 style="margin:0 0 16px;font-size:18px;color:#ffffff;">Parabéns, ${data.nome || 'Aluno(a)'}! 🎉</h2>
        <p style="margin:0 0 16px;">Sua compra foi confirmada com sucesso!</p>
        <div style="background:#1a1a1f;border-radius:8px;padding:16px;margin:16px 0;">
          <p style="margin:0 0 8px;"><strong>📦 Produto:</strong> ${data.produto || 'Curso Completo'}</p>
          <p style="margin:0 0 8px;"><strong>💰 Valor:</strong> R$ ${data.valor || '0,00'}</p>
          <p style="margin:0;"><strong>📅 Data:</strong> ${data.data || new Date().toLocaleDateString('pt-BR')}</p>
        </div>
        <p style="margin:0;">Seu acesso já está liberado! Bons estudos! 📚</p>
        `,
        "Acessar Curso",
        "https://pro.moisesmedeiros.com.br/alunos"
      ),
    },

    "payment_success": {
      subject: "💳 Pagamento Confirmado - Prof. Moisés Medeiros",
      html: getBaseTemplate(
        "Pagamento Confirmado",
        `
        <h2 style="margin:0 0 16px;font-size:18px;color:#ffffff;">Olá, ${data.nome || 'Aluno(a)'}!</h2>
        <p style="margin:0 0 16px;">Seu pagamento foi processado com sucesso! ✅</p>
        <div style="background:#1a1a1f;border-radius:8px;padding:16px;margin:16px 0;">
          <p style="margin:0 0 8px;"><strong>💰 Valor:</strong> R$ ${data.valor || '0,00'}</p>
          <p style="margin:0;"><strong>📅 Data:</strong> ${data.data || new Date().toLocaleDateString('pt-BR')}</p>
        </div>
        `
      ),
    },

    "payment_failed": {
      subject: "⚠️ Problema no Pagamento - Prof. Moisés Medeiros",
      html: getBaseTemplate(
        "Problema no Pagamento",
        `
        <h2 style="margin:0 0 16px;font-size:18px;color:#ff6b6b;">Atenção, ${data.nome || 'Aluno(a)'}!</h2>
        <p style="margin:0 0 16px;">Identificamos um problema com seu pagamento.</p>
        <p style="margin:0 0 16px;"><strong>Motivo:</strong> ${data.motivo || 'Pagamento não aprovado'}</p>
        <p style="margin:0;">Por favor, verifique seus dados de pagamento ou entre em contato conosco.</p>
        `,
        "Atualizar Pagamento",
        "https://pro.moisesmedeiros.com.br/alunos/pagamento"
      ),
    },

    "refund_processed": {
      subject: "💰 Reembolso Processado - Prof. Moisés Medeiros",
      html: getBaseTemplate(
        "Reembolso Realizado",
        `
        <h2 style="margin:0 0 16px;font-size:18px;color:#ffffff;">Olá, ${data.nome || 'Cliente'}!</h2>
        <p style="margin:0 0 16px;">Seu reembolso foi processado com sucesso.</p>
        <div style="background:#1a1a1f;border-radius:8px;padding:16px;margin:16px 0;">
          <p style="margin:0 0 8px;"><strong>💰 Valor:</strong> R$ ${data.valor || '0,00'}</p>
          <p style="margin:0;"><strong>📅 Prazo:</strong> ${data.prazo || '5-10 dias úteis'}</p>
        </div>
        `
      ),
    },

    // ===== ASSINATURAS =====
    "subscription_created": {
      subject: "✅ Assinatura Ativada - Prof. Moisés Medeiros",
      html: getBaseTemplate(
        "Assinatura Ativada",
        `
        <h2 style="margin:0 0 16px;font-size:18px;color:#ffffff;">Olá, ${data.nome || 'Assinante'}! 🎉</h2>
        <p style="margin:0 0 16px;">Sua assinatura foi ativada com sucesso!</p>
        <div style="background:#1a1a1f;border-radius:8px;padding:16px;margin:16px 0;">
          <p style="margin:0 0 8px;"><strong>📦 Plano:</strong> ${data.plano || 'Premium'}</p>
          <p style="margin:0;"><strong>📅 Próxima cobrança:</strong> ${data.proxima_cobranca || '30 dias'}</p>
        </div>
        `,
        "Acessar Plataforma",
        "https://pro.moisesmedeiros.com.br/alunos"
      ),
    },

    "subscription_renewed": {
      subject: "🔄 Assinatura Renovada - Prof. Moisés Medeiros",
      html: getBaseTemplate(
        "Assinatura Renovada",
        `
        <h2 style="margin:0 0 16px;font-size:18px;color:#ffffff;">Olá, ${data.nome || 'Assinante'}!</h2>
        <p style="margin:0 0 16px;">Sua assinatura foi renovada automaticamente. ✅</p>
        <div style="background:#1a1a1f;border-radius:8px;padding:16px;margin:16px 0;">
          <p style="margin:0 0 8px;"><strong>💰 Valor:</strong> R$ ${data.valor || '0,00'}</p>
          <p style="margin:0;"><strong>📅 Próxima renovação:</strong> ${data.proxima_renovacao || '30 dias'}</p>
        </div>
        `
      ),
    },

    "subscription_canceled": {
      subject: "❌ Assinatura Cancelada - Prof. Moisés Medeiros",
      html: getBaseTemplate(
        "Assinatura Cancelada",
        `
        <h2 style="margin:0 0 16px;font-size:18px;color:#ffffff;">Olá, ${data.nome || 'Assinante'}!</h2>
        <p style="margin:0 0 16px;">Sua assinatura foi cancelada conforme solicitado.</p>
        <p style="margin:0 0 16px;"><strong>Seu acesso permanece ativo até:</strong> ${data.acesso_ate || 'fim do período pago'}</p>
        <p style="margin:0;color:#9aa0a6;">Sentiremos sua falta! Volte quando quiser. 💙</p>
        `
      ),
    },

    "subscription_expiring": {
      subject: "⏰ Sua Assinatura Está Expirando - Prof. Moisés Medeiros",
      html: getBaseTemplate(
        "Assinatura Expirando",
        `
        <h2 style="margin:0 0 16px;font-size:18px;color:#ff9500;">Atenção, ${data.nome || 'Assinante'}!</h2>
        <p style="margin:0 0 16px;">Sua assinatura expira em <strong>${data.dias || '7'} dias</strong>.</p>
        <p style="margin:0;">Renove agora para não perder seu acesso!</p>
        `,
        "Renovar Assinatura",
        "https://pro.moisesmedeiros.com.br/alunos/assinatura"
      ),
    },

    // ===== NOTIFICAÇÕES =====
    "task_reminder": {
      subject: `⏰ Lembrete: ${data.titulo || 'Tarefa Pendente'}`,
      html: getBaseTemplate(
        "Lembrete de Tarefa",
        `
        <h2 style="margin:0 0 16px;font-size:18px;color:#ffffff;">${data.titulo || 'Tarefa Pendente'}</h2>
        ${data.descricao ? `<p style="margin:0 0 16px;">${data.descricao}</p>` : ''}
        <div style="background:#1a1a1f;border-radius:8px;padding:16px;margin:16px 0;text-align:center;">
          <p style="margin:0;color:#E62B4A;font-size:18px;font-weight:700;">
            📅 ${data.data || 'Hoje'} ${data.hora ? `às ${data.hora}` : ''}
          </p>
        </div>
        ${data.prioridade ? `<p style="margin:0;"><strong>Prioridade:</strong> ${data.prioridade}</p>` : ''}
        `,
        "Ver Calendário",
        "https://pro.moisesmedeiros.com.br/gestaofc/calendario"
      ),
    },

    "calendar_reminder": {
      subject: `📅 Evento: ${data.titulo || 'Lembrete'}`,
      html: getBaseTemplate(
        "Lembrete do Calendário",
        `
        <h2 style="margin:0 0 16px;font-size:18px;color:#ffffff;">${data.titulo || 'Evento'}</h2>
        <div style="background:#1a1a1f;border-radius:8px;padding:16px;margin:16px 0;">
          <p style="margin:0 0 8px;"><strong>📅 Data:</strong> ${data.data || 'Hoje'}</p>
          ${data.hora ? `<p style="margin:0;"><strong>🕐 Horário:</strong> ${data.hora}</p>` : ''}
        </div>
        `,
        "Ver Calendário",
        "https://pro.moisesmedeiros.com.br/gestaofc/calendario"
      ),
    },

    "notification": {
      subject: data.subject || "📢 Notificação - Prof. Moisés Medeiros",
      html: getBaseTemplate(
        data.titulo || "Notificação",
        `<p style="margin:0;">${data.mensagem || 'Você tem uma nova notificação.'}</p>`
      ),
    },

    // ===== VENDAS (notificação admin) =====
    "affiliate_sale": {
      subject: "💰 Nova Venda! - Curso Moisés Medeiros",
      html: getBaseTemplate(
        "Nova Venda Realizada!",
        `
        <h2 style="margin:0 0 16px;font-size:18px;color:#ffffff;">Parabéns! Nova venda confirmada 🎉</h2>
        <div style="background:#1a1a1f;border-radius:8px;padding:16px;margin:16px 0;">
          <p style="margin:0 0 8px;"><strong>📦 Produto:</strong> ${data.produto || 'Curso'}</p>
          <p style="margin:0 0 8px;"><strong>💰 Valor:</strong> R$ ${data.valor || '0,00'}</p>
          <p style="margin:0 0 8px;"><strong>👤 Comprador:</strong> ${data.comprador || 'N/A'}</p>
          <p style="margin:0;"><strong>📧 Email:</strong> ${data.email || 'N/A'}</p>
        </div>
        `,
        "Ver Dashboard",
        "https://pro.moisesmedeiros.com.br/gestaofc/dashboard"
      ),
    },

    // ===== AFILIADOS =====
    "affiliate_welcome": {
      subject: "🤝 Bem-vindo ao Programa de Afiliados - Prof. Moisés Medeiros!",
      html: getBaseTemplate(
        "Bem-vindo ao Programa de Afiliados!",
        `
        <h2 style="margin:0 0 16px;font-size:18px;color:#ffffff;">Olá, ${data.nome || 'Parceiro(a)'}! 🎉</h2>
        <p style="margin:0 0 16px;">Você agora faz parte do nosso programa de afiliados!</p>
        ${data.cupom ? `
        <div style="background:#1a1a1f;border-radius:8px;padding:16px;margin:16px 0;text-align:center;">
          <p style="margin:0 0 8px;color:#9aa0a6;font-size:12px;">SEU CUPOM EXCLUSIVO</p>
          <p style="margin:0;color:#E62B4A;font-size:24px;font-weight:700;letter-spacing:2px;">${data.cupom}</p>
        </div>
        ` : ''}
        <p style="margin:0;">Comece a divulgar e ganhar comissões!</p>
        `,
        "Acessar Painel",
        "https://pro.moisesmedeiros.com.br/gestaofc/afiliados"
      ),
    },

    "affiliate_commission": {
      subject: "💰 Nova Comissão Gerada! - Prof. Moisés Medeiros",
      html: getBaseTemplate(
        "Nova Comissão!",
        `
        <h2 style="margin:0 0 16px;font-size:18px;color:#ffffff;">Parabéns, ${data.nome || 'Parceiro(a)'}! 🎉</h2>
        <p style="margin:0 0 16px;">Você acabou de gerar uma nova comissão!</p>
        <div style="background:#1a1a1f;border-radius:8px;padding:16px;margin:16px 0;">
          <p style="margin:0 0 8px;"><strong>💰 Comissão:</strong> R$ ${data.comissao || '0,00'}</p>
          <p style="margin:0;"><strong>📦 Produto:</strong> ${data.produto || 'Curso'}</p>
        </div>
        `,
        "Ver Comissões",
        "https://pro.moisesmedeiros.com.br/gestaofc/afiliados"
      ),
    },

    "affiliate_payment": {
      subject: "💰 Pagamento de Comissão Realizado! - Prof. Moisés Medeiros",
      html: getBaseTemplate(
        "Pagamento de Comissão",
        `
        <h2 style="margin:0 0 16px;font-size:18px;color:#ffffff;">Olá, ${data.nome || 'Parceiro(a)'}!</h2>
        <p style="margin:0 0 16px;">Temos ótimas notícias! 🎉</p>
        <p style="margin:0 0 16px;">Acabamos de realizar o pagamento da sua comissão.</p>
        <div style="background:#1a1a1f;border-radius:8px;padding:16px;margin:16px 0;">
          <p style="margin:0 0 8px;"><strong>💵 Valor:</strong> R$ ${data.valor || '0,00'}</p>
          <p style="margin:0 0 8px;"><strong>📅 Data:</strong> ${data.data || new Date().toLocaleDateString('pt-BR')}</p>
          <p style="margin:0;"><strong>🏦 Método:</strong> ${data.metodo || 'PIX'}</p>
        </div>
        <p style="margin:0;">Continue com o excelente trabalho! 🚀</p>
        `,
        "Ver Histórico",
        "https://pro.moisesmedeiros.com.br/gestaofc/afiliados"
      ),
    },

    // ===== CURSOS =====
    "new_lesson": {
      subject: "📚 Nova Aula Disponível - Prof. Moisés Medeiros!",
      html: getBaseTemplate(
        "Nova Aula!",
        `
        <h2 style="margin:0 0 16px;font-size:18px;color:#ffffff;">Olá, ${data.nome || 'Aluno(a)'}!</h2>
        <p style="margin:0 0 16px;">Uma nova aula foi publicada! 🎬</p>
        <div style="background:#1a1a1f;border-radius:8px;padding:16px;margin:16px 0;">
          <p style="margin:0 0 8px;"><strong>📚 Curso:</strong> ${data.curso || 'Química'}</p>
          <p style="margin:0;"><strong>🎬 Aula:</strong> ${data.aula || 'Nova aula'}</p>
        </div>
        `,
        "Assistir Agora",
        data.link || "https://pro.moisesmedeiros.com.br/alunos"
      ),
    },

    "course_completed": {
      subject: "🎓 Parabéns! Curso Concluído - Prof. Moisés Medeiros",
      html: getBaseTemplate(
        "Curso Concluído!",
        `
        <h2 style="margin:0 0 16px;font-size:18px;color:#ffffff;">Parabéns, ${data.nome || 'Aluno(a)'}! 🏆</h2>
        <p style="margin:0 0 16px;">Você concluiu o curso <strong>${data.curso || 'Química'}</strong>!</p>
        <p style="margin:0;">Seu certificado já está disponível.</p>
        `,
        "Ver Certificado",
        "https://pro.moisesmedeiros.com.br/alunos/certificados"
      ),
    },

    "certificate_ready": {
      subject: "📜 Seu Certificado está Pronto! - Prof. Moisés Medeiros",
      html: getBaseTemplate(
        "Certificado Disponível",
        `
        <h2 style="margin:0 0 16px;font-size:18px;color:#ffffff;">Olá, ${data.nome || 'Aluno(a)'}!</h2>
        <p style="margin:0 0 16px;">Seu certificado do curso <strong>${data.curso || 'Química'}</strong> está pronto!</p>
        <div style="background:#1a1a1f;border-radius:8px;padding:16px;margin:16px 0;">
          <p style="margin:0;"><strong>📜 Código:</strong> ${data.codigo || 'N/A'}</p>
        </div>
        `,
        "Baixar Certificado",
        "https://pro.moisesmedeiros.com.br/alunos/certificados"
      ),
    },

    "live_reminder": {
      subject: "🔴 LIVE em breve! - Prof. Moisés Medeiros",
      html: getBaseTemplate(
        "Live Começando!",
        `
        <h2 style="margin:0 0 16px;font-size:18px;color:#ff6b6b;">🔴 LIVE em ${data.minutos || '30'} minutos!</h2>
        <p style="margin:0 0 16px;"><strong>${data.titulo || 'Aula ao vivo'}</strong></p>
        <p style="margin:0;">Não perca! Te esperamos lá!</p>
        `,
        "Acessar Live",
        data.link || "https://pro.moisesmedeiros.com.br/alunos/lives"
      ),
    },

    // ===== REPORTS =====
    "weekly_report": {
      subject: "📊 Relatório Semanal - Curso Moisés Medeiros",
      html: getBaseTemplate(
        "Relatório Semanal",
        `
        <h2 style="margin:0 0 16px;font-size:18px;color:#ffffff;">Resumo da Semana</h2>
        <div style="background:#1a1a1f;border-radius:8px;padding:16px;margin:16px 0;">
          ${data.metricas ? data.metricas.map((m: any) => `<p style="margin:0 0 8px;"><strong>${m.label}:</strong> ${m.valor}</p>`).join('') : '<p style="margin:0;">Sem dados</p>'}
        </div>
        `,
        "Ver Dashboard",
        "https://pro.moisesmedeiros.com.br/gestaofc/dashboard"
      ),
    },

    "monthly_report": {
      subject: "📊 Relatório Mensal - Curso Moisés Medeiros",
      html: getBaseTemplate(
        "Relatório Mensal",
        `
        <h2 style="margin:0 0 16px;font-size:18px;color:#ffffff;">Resumo do Mês</h2>
        <div style="background:#1a1a1f;border-radius:8px;padding:16px;margin:16px 0;">
          ${data.metricas ? data.metricas.map((m: any) => `<p style="margin:0 0 8px;"><strong>${m.label}:</strong> ${m.valor}</p>`).join('') : '<p style="margin:0;">Sem dados</p>'}
        </div>
        `,
        "Ver Dashboard",
        "https://pro.moisesmedeiros.com.br/gestaofc/dashboard"
      ),
    },

    // ===== VENCIMENTOS =====
    "payment_due": {
      subject: "⏰ Pagamento Próximo do Vencimento - Prof. Moisés Medeiros",
      html: getBaseTemplate(
        "Pagamento a Vencer",
        `
        <h2 style="margin:0 0 16px;font-size:18px;color:#ff9500;">Atenção, ${data.nome || 'Cliente'}!</h2>
        <p style="margin:0 0 16px;">Seu pagamento vence em <strong>${data.dias || '3'} dias</strong>.</p>
        <div style="background:#1a1a1f;border-radius:8px;padding:16px;margin:16px 0;">
          <p style="margin:0 0 8px;"><strong>💰 Valor:</strong> R$ ${data.valor || '0,00'}</p>
          <p style="margin:0;"><strong>📅 Vencimento:</strong> ${data.vencimento || 'Em breve'}</p>
        </div>
        `,
        "Pagar Agora",
        data.link_pagamento || "https://pro.moisesmedeiros.com.br/alunos/pagamento"
      ),
    },

    "payment_overdue": {
      subject: "🚨 Pagamento Atrasado - Prof. Moisés Medeiros",
      html: getBaseTemplate(
        "Pagamento em Atraso",
        `
        <h2 style="margin:0 0 16px;font-size:18px;color:#ff6b6b;">Atenção, ${data.nome || 'Cliente'}!</h2>
        <p style="margin:0 0 16px;">Seu pagamento está em atraso há <strong>${data.dias || 'alguns'} dias</strong>.</p>
        <p style="margin:0;">Regularize para manter seu acesso ativo.</p>
        `,
        "Regularizar Agora",
        data.link_pagamento || "https://pro.moisesmedeiros.com.br/alunos/pagamento"
      ),
    },

    // ===== ACESSO =====
    "access_created": {
      subject: "✅ Acesso Liberado - Prof. Moisés Medeiros",
      html: getBaseTemplate(
        "Acesso Liberado!",
        `
        <h2 style="margin:0 0 16px;font-size:18px;color:#ffffff;">Olá, ${data.nome || 'Usuário'}!</h2>
        <p style="margin:0 0 16px;">Seu acesso foi liberado com sucesso! ✅</p>
        ${data.produto ? `<p style="margin:0;"><strong>Produto:</strong> ${data.produto}</p>` : ''}
        `,
        "Acessar Agora",
        "https://pro.moisesmedeiros.com.br/alunos"
      ),
    },

    "access_revoked": {
      subject: "⚠️ Acesso Revogado - Prof. Moisés Medeiros",
      html: getBaseTemplate(
        "Acesso Revogado",
        `
        <h2 style="margin:0 0 16px;font-size:18px;color:#ff6b6b;">Olá, ${data.nome || 'Usuário'}!</h2>
        <p style="margin:0 0 16px;">Seu acesso foi revogado.</p>
        <p style="margin:0;"><strong>Motivo:</strong> ${data.motivo || 'Entre em contato para mais informações'}</p>
        `
      ),
    },

    "account_activated": {
      subject: "✅ Conta Ativada - Prof. Moisés Medeiros",
      html: getBaseTemplate(
        "Conta Ativada!",
        `
        <h2 style="margin:0 0 16px;font-size:18px;color:#ffffff;">Olá, ${data.nome || 'Usuário'}!</h2>
        <p style="margin:0 0 16px;">Sua conta foi ativada com sucesso! ✅</p>
        <p style="margin:0;">Agora você pode acessar todos os recursos.</p>
        `,
        "Acessar Conta",
        "https://pro.moisesmedeiros.com.br/auth"
      ),
    },

    "account_deactivated": {
      subject: "⚠️ Conta Desativada - Prof. Moisés Medeiros",
      html: getBaseTemplate(
        "Conta Desativada",
        `
        <h2 style="margin:0 0 16px;font-size:18px;color:#ff6b6b;">Olá, ${data.nome || 'Usuário'}!</h2>
        <p style="margin:0 0 16px;">Sua conta foi desativada.</p>
        <p style="margin:0;"><strong>Motivo:</strong> ${data.motivo || 'Entre em contato para mais informações'}</p>
        `
      ),
    },

    // ===== MARKETING =====
    "marketing": {
      subject: data.subject || "📢 Novidades - Prof. Moisés Medeiros",
      html: data.html || getBaseTemplate(
        data.titulo || "Novidades",
        `<div style="white-space:pre-wrap;">${data.mensagem || 'Confira as novidades!'}</div>`,
        data.cta_texto,
        data.cta_link
      ),
    },

    "promotion": {
      subject: data.subject || "🔥 Promoção Especial - Prof. Moisés Medeiros!",
      html: getBaseTemplate(
        data.titulo || "Promoção Especial!",
        `
        <h2 style="margin:0 0 16px;font-size:18px;color:#ffffff;">${data.titulo || 'Oferta Imperdível!'}</h2>
        <p style="margin:0 0 16px;">${data.mensagem || 'Aproveite essa oportunidade única!'}</p>
        ${data.desconto ? `
        <div style="background:#1a1a1f;border-radius:8px;padding:16px;margin:16px 0;text-align:center;">
          <p style="margin:0;color:#E62B4A;font-size:28px;font-weight:700;">${data.desconto}% OFF</p>
        </div>
        ` : ''}
        `,
        data.cta_texto || "Aproveitar",
        data.cta_link || "https://moisesmedeiros.com.br"
      ),
    },

    "newsletter": {
      subject: data.subject || "📰 Newsletter - Prof. Moisés Medeiros",
      html: data.html || getBaseTemplate(
        "Newsletter",
        `<div style="white-space:pre-wrap;">${data.conteudo || 'Confira as novidades da semana!'}</div>`
      ),
    },

    // ===== CUSTOM =====
    "custom": {
      subject: data.subject || "Notificação - Prof. Moisés Medeiros",
      html: data.html || getBaseTemplate(
        data.titulo || "Notificação",
        `<p style="margin:0;">${data.mensagem || 'Você tem uma nova notificação.'}</p>`,
        data.cta_texto,
        data.cta_link
      ),
    },
  };

  return templates[type] || templates.custom;
};

// ============================================
// HANDLER PRINCIPAL
// ============================================
const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

  try {
    const { to, type, data, subject, html, replyTo, cc, bcc }: EmailRequest = await req.json();

    if (!to) {
      return new Response(
        JSON.stringify({ success: false, error: "Destinatário (to) é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailType = type || "custom";
    const template = getEmailTemplate(emailType, data || {});
    
    // Permitir override de subject e html para emails customizados
    const finalSubject = subject || template.subject;
    const finalHtml = html || template.html;

    console.log(`[RESEND-GATEWAY] Enviando email tipo '${emailType}' para: ${Array.isArray(to) ? to.join(', ') : to}`);

    const emailPayload: any = {
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject: finalSubject,
      html: finalHtml,
    };

    if (replyTo) emailPayload.reply_to = replyTo;
    if (cc && cc.length > 0) emailPayload.cc = cc;
    if (bcc && bcc.length > 0) emailPayload.bcc = bcc;

    const response = await resend.emails.send(emailPayload);

    if (response.error) {
      console.error("[RESEND-GATEWAY] Erro:", response.error);
      throw new Error(response.error.message || "Erro ao enviar email");
    }

    console.log(`[RESEND-GATEWAY] ✅ Email enviado com sucesso! ID: ${response.data?.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: response.data?.id,
        provider: "resend"
      } as EmailResponse),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[RESEND-GATEWAY] Erro:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Erro interno",
        provider: "resend"
      } as EmailResponse),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
