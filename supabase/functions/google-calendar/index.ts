import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface CalendarRequest {
  action: 'auth_url' | 'exchange_token' | 'list_events' | 'create_event' | 'sync_tasks';
  code?: string;
  accessToken?: string;
  refreshToken?: string;
  userId?: string;
  event?: {
    summary: string;
    description?: string;
    start: string;
    end: string;
    reminders?: boolean;
  };
  redirectUri?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      throw new Error('Google OAuth credentials not configured');
    }

    const { action, code, accessToken, refreshToken, userId, event, redirectUri }: CalendarRequest = await req.json();
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    switch (action) {
      case 'auth_url': {
        // Gerar URL de autorização OAuth
        const scopes = [
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/calendar.events'
        ];
        
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${GOOGLE_CLIENT_ID}` +
          `&redirect_uri=${encodeURIComponent(redirectUri || 'https://moisesmedeiros.com.br/calendario')}` +
          `&response_type=code` +
          `&scope=${encodeURIComponent(scopes.join(' '))}` +
          `&access_type=offline` +
          `&prompt=consent`;

        return new Response(JSON.stringify({ success: true, authUrl }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'exchange_token': {
        // Trocar código por tokens
        if (!code) throw new Error('Authorization code is required');

        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            code,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri || 'https://moisesmedeiros.com.br/calendario',
          }),
        });

        const tokens = await tokenResponse.json();
        
        if (tokens.error) {
          throw new Error(tokens.error_description || tokens.error);
        }

        console.log('Tokens obtained successfully');

        // Salvar tokens no banco (criptografado em produção)
        if (userId) {
          await supabase.from('system_settings').upsert({
            setting_key: `google_calendar_tokens_${userId}`,
            setting_value: tokens,
            setting_type: 'json',
            is_public: false,
          });
        }

        return new Response(JSON.stringify({ 
          success: true, 
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresIn: tokens.expires_in
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'list_events': {
        if (!accessToken) throw new Error('Access token is required');

        const now = new Date().toISOString();
        const oneMonthLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        const eventsResponse = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
          `timeMin=${encodeURIComponent(now)}` +
          `&timeMax=${encodeURIComponent(oneMonthLater)}` +
          `&singleEvents=true` +
          `&orderBy=startTime`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        const events = await eventsResponse.json();
        
        if (events.error) {
          throw new Error(events.error.message);
        }

        return new Response(JSON.stringify({ success: true, events: events.items }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'create_event': {
        if (!accessToken || !event) throw new Error('Access token and event are required');

        const eventBody = {
          summary: event.summary,
          description: event.description,
          start: {
            dateTime: event.start,
            timeZone: 'America/Sao_Paulo',
          },
          end: {
            dateTime: event.end,
            timeZone: 'America/Sao_Paulo',
          },
          reminders: event.reminders !== false ? {
            useDefault: false,
            overrides: [
              { method: 'email', minutes: 60 },
              { method: 'popup', minutes: 10 },
            ],
          } : { useDefault: true },
        };

        const createResponse = await fetch(
          'https://www.googleapis.com/calendar/v3/calendars/primary/events',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventBody),
          }
        );

        const createdEvent = await createResponse.json();
        
        if (createdEvent.error) {
          throw new Error(createdEvent.error.message);
        }

        console.log('Event created:', createdEvent.id);

        return new Response(JSON.stringify({ success: true, event: createdEvent }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'sync_tasks': {
        // Sincronizar tarefas do calendário interno com Google Calendar
        if (!accessToken || !userId) throw new Error('Access token and userId are required');

        // Buscar tarefas pendentes do usuário
        const { data: tasks, error: tasksError } = await supabase
          .from('calendar_tasks')
          .select('*')
          .eq('user_id', userId)
          .eq('is_completed', false)
          .gte('task_date', new Date().toISOString().split('T')[0]);

        if (tasksError) throw tasksError;

        const syncedEvents = [];
        
        for (const task of tasks || []) {
          const startDateTime = `${task.task_date}T${task.task_time || '09:00:00'}`;
          const endDate = new Date(startDateTime);
          endDate.setHours(endDate.getHours() + 1);

          const eventBody = {
            summary: task.title,
            description: task.description || '',
            start: {
              dateTime: startDateTime,
              timeZone: 'America/Sao_Paulo',
            },
            end: {
              dateTime: endDate.toISOString(),
              timeZone: 'America/Sao_Paulo',
            },
          };

          const createResponse = await fetch(
            'https://www.googleapis.com/calendar/v3/calendars/primary/events',
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(eventBody),
            }
          );

          const createdEvent = await createResponse.json();
          if (!createdEvent.error) {
            syncedEvents.push(createdEvent);
          }
        }

        console.log(`Synced ${syncedEvents.length} events to Google Calendar`);

        return new Response(JSON.stringify({ 
          success: true, 
          syncedCount: syncedEvents.length,
          events: syncedEvents 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error('Invalid action');
    }
  } catch (error: any) {
    console.error('Error in google-calendar function:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
