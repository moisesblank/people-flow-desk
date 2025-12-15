import { supabase } from "@/integrations/supabase/client";

interface SendEmailParams {
  to: string;
  type: "welcome" | "sale" | "reminder" | "custom";
  data?: Record<string, any>;
  subject?: string;
  html?: string;
}

export const useEmailNotifications = () => {
  const sendEmail = async (params: SendEmailParams) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-notification-email', {
        body: params,
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }
  };

  const sendWelcomeEmail = async (to: string, nome: string) => {
    return sendEmail({ to, type: 'welcome', data: { nome } });
  };

  const sendSaleNotification = async (to: string, saleData: {
    produto: string;
    valor: string;
    comprador: string;
    email: string;
  }) => {
    return sendEmail({ to, type: 'sale', data: saleData });
  };

  const sendReminderEmail = async (to: string, reminderData: {
    titulo: string;
    descricao?: string;
    data: string;
    hora?: string;
  }) => {
    return sendEmail({ to, type: 'reminder', data: reminderData });
  };

  const sendCustomEmail = async (to: string, customData: {
    subject: string;
    titulo?: string;
    mensagem?: string;
    html?: string;
  }) => {
    return sendEmail({ to, type: 'custom', data: customData });
  };

  return {
    sendEmail,
    sendWelcomeEmail,
    sendSaleNotification,
    sendReminderEmail,
    sendCustomEmail,
  };
};
