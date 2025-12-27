import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { Resend } from "https://esm.sh/resend@2.0.0";

import { getCorsHeaders, handleCorsOptions } from "../_shared/corsConfig.ts";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');

interface TaskReminderRequest {
  action: 'create_event' | 'send_reminder' | 'sync_all' | 'check_reminders';
  taskId?: string;
  task?: {
    id: string;
    title: string;
    description: string | null;
    task_date: string;
    task_time: string | null;
    priority: string;
    category: string;
    reminder_enabled: boolean;
    user_id: string;
  };
  userId?: string;
  email?: string;
  accessToken?: string;
}

// Helpers de data/hora (evita bug de "dia anterior" por fuso)
function parseYMD(dateStr: string): { y: number; m: number; d: number } {
  const [y, m, d] = dateStr.split('-').map((n) => Number(n));
  return { y, m, d };
}

function formatYMD_UTC(y: number, m: number, d: number): string {
  const mm = String(m).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  return `${y}-${mm}-${dd}`;
}

function addHoursToDateTime(dateStr: string, timeStr: string, hoursToAdd: number): { date: string; time: string } {
  const [hh, min] = timeStr.split(':').map((n) => Number(n));
  const totalMinutes = hh * 60 + min + hoursToAdd * 60;
  const daysToAdd = Math.floor(totalMinutes / 1440);
  const minsInDay = ((totalMinutes % 1440) + 1440) % 1440;
  const newH = Math.floor(minsInDay / 60);
  const newM = minsInDay % 60;

  const { y, m, d } = parseYMD(dateStr);
  const base = new Date(Date.UTC(y, m - 1, d));
  base.setUTCDate(base.getUTCDate() + daysToAdd);

  const outDate = formatYMD_UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, base.getUTCDate());
  const outTime = `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;

  return { date: outDate, time: outTime };
}

// Função para criar evento no Google Calendar
async function createGoogleCalendarEvent(
  accessToken: string,
  task: TaskReminderRequest['task']
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  if (!task) return { success: false, error: 'Task is required' };

  const startTime = task.task_time || '09:00';
  const startDateTime = `${task.task_date}T${startTime}:00`;
  const end = addHoursToDateTime(task.task_date, startTime, 1);
  const endDateTime = `${end.date}T${end.time}:00`;

  // Mapear prioridade para cor do evento
  const colorMap: Record<string, string> = {
    urgent: '11', // Vermelho
    high: '5', // Amarelo
    normal: '9', // Azul
    low: '8', // Cinza
  };

  const eventBody = {
    summary: `📌 ${task.title}`,
    description: `${task.description || ''}\n\nCategoria: ${task.category}\nPrioridade: ${task.priority}\n\nCriado via Plataforma Moisés Medeiros`,
    start: {
      dateTime: startDateTime,
      timeZone: 'America/Sao_Paulo',
    },
    end: {
      dateTime: endDateTime,
      timeZone: 'America/Sao_Paulo',
    },
    colorId: colorMap[task.priority] || '9',
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 60 },
        { method: 'popup', minutes: 30 },
        { method: 'popup', minutes: 10 },
      ],
    },
  };

  try {
    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventBody),
      }
    );

    const result = await response.json();

    if (result.error) {
      console.error('Google Calendar error:', result.error);
      return { success: false, error: result.error.message };
    }

    console.log('Event created in Google Calendar:', result.id);
    return { success: true, eventId: result.id };
  } catch (error: any) {
    console.error('Error creating Google Calendar event:', error);
    return { success: false, error: error.message };
  }
}

// Função para enviar email de lembrete
async function sendReminderEmail(
  email: string,
  task: TaskReminderRequest['task']
): Promise<{ success: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    console.log('RESEND_API_KEY not configured, skipping email');
    return { success: false, error: 'Email service not configured' };
  }

  if (!task) return { success: false, error: 'Task is required' };

  const resend = new Resend(RESEND_API_KEY);
  
  const priorityEmoji = {
    'urgent': '🔴 URGENTE',
    'high': '🟡 Alta',
    'normal': '🔵 Normal',
    'low': '⚪ Baixa',
  }[task.priority] || task.priority;

  const { y, m, d } = parseYMD(task.task_date);
  const formattedDate = new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  });

  const formattedTime = task.task_time || 'Horário não definido';

  try {
    const result = await resend.emails.send({
      from: Deno.env.get("RESEND_FROM") || 'Plataforma Moisés Medeiros <falecom@moisesmedeiros.com.br>',
      to: [email],
      subject: `📌 Nova Tarefa: ${task.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #fff; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%); border-radius: 16px; padding: 32px; border: 1px solid rgba(212, 175, 55, 0.2); }
            .header { text-align: center; margin-bottom: 24px; }
            .logo { font-size: 24px; font-weight: bold; color: #d4af37; }
            .title { font-size: 28px; font-weight: bold; color: #fff; margin: 16px 0; }
            .priority { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; margin: 8px 0; }
            .urgent { background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid #ef4444; }
            .high { background: rgba(234, 179, 8, 0.2); color: #eab308; border: 1px solid #eab308; }
            .normal { background: rgba(59, 130, 246, 0.2); color: #3b82f6; border: 1px solid #3b82f6; }
            .low { background: rgba(156, 163, 175, 0.2); color: #9ca3af; border: 1px solid #9ca3af; }
            .details { background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); }
            .detail-row:last-child { border-bottom: none; }
            .detail-label { color: #9ca3af; font-size: 14px; }
            .detail-value { color: #fff; font-weight: 500; }
            .description { background: rgba(212, 175, 55, 0.1); border-left: 4px solid #d4af37; padding: 16px; margin: 20px 0; border-radius: 8px; }
            .footer { text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.1); }
            .footer p { color: #6b7280; font-size: 12px; }
            .cta { display: inline-block; background: linear-gradient(135deg, #d4af37, #b8860b); color: #000; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">⚗️ Plataforma Moisés Medeiros</div>
              <h1 class="title">${task.title}</h1>
              <span class="priority ${task.priority}">${priorityEmoji}</span>
            </div>
            
            <div class="details">
              <div class="detail-row">
                <span class="detail-label">📅 Data</span>
                <span class="detail-value">${formattedDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">⏰ Horário</span>
                <span class="detail-value">${formattedTime}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">📂 Categoria</span>
                <span class="detail-value">${task.category}</span>
              </div>
            </div>
            
            ${task.description ? `
              <div class="description">
                <strong>📝 Descrição:</strong><br>
                ${task.description}
              </div>
            ` : ''}
            
            <div style="text-align: center;">
              <a href="https://pro.moisesmedeiros.com.br/gestaofc/calendario" class="cta">
                Ver no Calendário
              </a>
            </div>
            
            <div class="footer">
              <p>Este lembrete foi criado automaticamente pela sua plataforma de gestão.</p>
              <p>© 2024 Moisés Medeiros - Todos os direitos reservados</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log('Reminder email sent:', result);
    return { success: true };
  } catch (error: any) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}

// Função para renovar token do Google (se expirado)
async function refreshGoogleToken(refreshToken: string): Promise<string | null> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) return null;

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const tokens = await response.json();
    if (tokens.access_token) {
      return tokens.access_token;
    }
    return null;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

const handler = async (req: Request): Promise<Response> => {
  // LEI VI: CORS dinâmico via allowlist centralizado
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return handleCorsOptions(req);
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { action, task, taskId, userId, email, accessToken }: TaskReminderRequest = await req.json();

    console.log('Task reminder action:', action);

    switch (action) {
      case 'create_event': {
        // Criar evento no Google Calendar e enviar email
        if (!task) {
          throw new Error('Task is required');
        }

        const results: { google?: any; email?: any } = {};
        
        // Tentar criar no Google Calendar
        if (accessToken) {
          results.google = await createGoogleCalendarEvent(accessToken, task);
          
          // Se falhar, pode ser token expirado - tentar buscar refresh token
          if (!results.google.success) {
            // Buscar tokens salvos
            const { data: settings } = await supabase
              .from('system_settings')
              .select('setting_value')
              .eq('setting_key', `google_calendar_tokens_${task.user_id}`)
              .single();

            if (settings?.setting_value?.refresh_token) {
              const newAccessToken = await refreshGoogleToken(settings.setting_value.refresh_token);
              if (newAccessToken) {
                results.google = await createGoogleCalendarEvent(newAccessToken, task);
              }
            }
          }
        }

        // Enviar email de lembrete se habilitado
        if (task.reminder_enabled && email) {
          results.email = await sendReminderEmail(email, task);
        }

        // Atualizar tarefa com google_event_id se criado
        if (results.google?.eventId) {
          await supabase
            .from('calendar_tasks')
            .update({ 
              reminder_email: email,
              updated_at: new Date().toISOString() 
            })
            .eq('id', task.id);
        }

        return new Response(JSON.stringify({ 
          success: true, 
          results,
          message: 'Tarefa sincronizada com sucesso!'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'send_reminder': {
        // Enviar apenas email de lembrete
        if (!task || !email) {
          throw new Error('Task and email are required');
        }

        const result = await sendReminderEmail(email, task);
        
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'sync_all': {
        // Sincronizar todas as tarefas pendentes com Google Calendar
        if (!userId || !accessToken) {
          throw new Error('UserId and accessToken are required');
        }

        const { data: tasks, error: tasksError } = await supabase
          .from('calendar_tasks')
          .select('*')
          .eq('user_id', userId)
          .eq('is_completed', false)
          .gte('task_date', new Date().toISOString().split('T')[0]);

        if (tasksError) throw tasksError;

        const results = [];
        for (const t of tasks || []) {
          const result = await createGoogleCalendarEvent(accessToken, t);
          results.push({ taskId: t.id, ...result });
        }

        return new Response(JSON.stringify({ 
          success: true, 
          syncedCount: results.filter(r => r.success).length,
          results 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'check_reminders': {
        // Verificar tarefas que precisam de lembrete hoje/amanhã
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const { data: upcomingTasks, error } = await supabase
          .from('calendar_tasks')
          .select('*, profiles!calendar_tasks_user_id_fkey(email)')
          .eq('is_completed', false)
          .eq('reminder_enabled', true)
          .in('task_date', [today, tomorrow]);

        if (error) throw error;

        const results = [];
        for (const t of upcomingTasks || []) {
          if (t.profiles?.email) {
            const result = await sendReminderEmail(t.profiles.email, t);
            results.push({ taskId: t.id, ...result });
          }
        }

        return new Response(JSON.stringify({ 
          success: true, 
          remindersCount: results.filter(r => r.success).length,
          results 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error('Invalid action');
    }
  } catch (error: any) {
    console.error('Error in task-reminder function:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
