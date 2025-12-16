import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OWNER_PHONE = '5583991462045';
const OWNER_EMAIL = 'moisesblank@gmail.com';

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // GET request - Webhook verification (Meta requires this)
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      // Verify token should match what you set in Meta Business Suite
      const VERIFY_TOKEN = Deno.env.get('WHATSAPP_VERIFY_TOKEN') || 'tramon_moises_2024';

      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('✅ Webhook verified!');
        return new Response(challenge, { status: 200 });
      }

      return new Response('Forbidden', { status: 403 });
    }

    // POST request - Incoming messages
    if (req.method === 'POST') {
      const body = await req.json();
      console.log('📩 WhatsApp Webhook received:', JSON.stringify(body, null, 2));

      // Extract message data from WhatsApp Cloud API format
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const messages = value?.messages;

      if (!messages || messages.length === 0) {
        // Status update or other non-message event
        return new Response(JSON.stringify({ status: 'no_message' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const message = messages[0];
      const from = message.from; // Phone number
      const messageText = message.text?.body || '';
      const messageType = message.type;
      const timestamp = message.timestamp;

      console.log(`📱 Message from ${from}: ${messageText}`);

      // Check if sender is authorized (owner or admin)
      const isOwner = from === OWNER_PHONE || from.includes('83991462045');
      
      if (!isOwner) {
        console.log('⚠️ Unauthorized sender:', from);
        return new Response(JSON.stringify({ status: 'unauthorized' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get owner user_id
      const { data: ownerProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', OWNER_EMAIL)
        .single();

      const userId = ownerProfile?.id;

      // Save message to database
      const { data: savedMessage, error: saveError } = await supabase
        .from('tramon_conversations')
        .insert({
          user_id: userId,
          role: 'user',
          content: messageText,
          source: 'whatsapp',
          metadata: {
            phone: from,
            message_id: message.id,
            timestamp: timestamp,
            type: messageType
          }
        })
        .select()
        .single();

      if (saveError) {
        console.error('Error saving message:', saveError);
      }

      // Process with TRAMON AI
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      
      if (!LOVABLE_API_KEY) {
        console.error('LOVABLE_API_KEY not configured');
        return new Response(JSON.stringify({ status: 'ai_not_configured' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get system context
      const [
        { data: tasks },
        { data: finances },
        { data: students },
        { data: employees }
      ] = await Promise.all([
        supabase.from('calendar_tasks').select('*').order('task_date', { ascending: true }).limit(10),
        supabase.from('income').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('profiles').select('*').limit(20),
        supabase.from('employees').select('*').limit(10)
      ]);

      const systemContext = `
DADOS DO SISTEMA EM TEMPO REAL:
- Tarefas próximas: ${tasks?.length || 0}
- Receitas registradas: ${finances?.length || 0}
- Total alunos: ${students?.length || 0}
- Funcionários: ${employees?.length || 0}

Tarefas: ${JSON.stringify(tasks?.slice(0, 5) || [])}
      `.trim();

      // Call AI
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openai/gpt-5',
          messages: [
            {
              role: 'system',
              content: `Você é TRAMON, assistente executivo premium do Professor Moisés Medeiros.
              
Você está respondendo via WhatsApp - seja CONCISO e DIRETO.
Máximo 300 caracteres por resposta quando possível.
Use emojis para clareza visual.

${systemContext}

COMANDOS RÁPIDOS QUE VOCÊ ENTENDE:
- "tarefas" ou "agenda" = listar tarefas
- "criar tarefa [texto]" = criar nova tarefa
- "finanças" ou "dinheiro" = resumo financeiro
- "alunos" = status dos alunos
- "relatório" = resumo executivo

Responda de forma executiva e profissional.`
            },
            { role: 'user', content: messageText }
          ],
          max_tokens: 500,
        }),
      });

      const aiData = await aiResponse.json();
      const aiReply = aiData.choices?.[0]?.message?.content || 'Desculpe, não consegui processar sua mensagem.';

      // Save AI response
      await supabase
        .from('tramon_conversations')
        .insert({
          user_id: userId,
          session_id: savedMessage?.session_id,
          role: 'assistant',
          content: aiReply,
          source: 'whatsapp',
          metadata: { in_reply_to: message.id }
        });

      // Send response back to WhatsApp (requires WhatsApp Business API token)
      const WHATSAPP_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
      const WHATSAPP_PHONE_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

      if (WHATSAPP_TOKEN && WHATSAPP_PHONE_ID) {
        try {
          await fetch(`https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: from,
              type: 'text',
              text: { body: aiReply }
            }),
          });
          console.log('✅ Response sent to WhatsApp');
        } catch (sendError) {
          console.error('Error sending WhatsApp response:', sendError);
        }
      }

      return new Response(JSON.stringify({ 
        status: 'processed',
        message_saved: !!savedMessage,
        ai_response: aiReply.substring(0, 100) + '...'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response('Method not allowed', { status: 405 });
    
  } catch (error: unknown) {
    console.error('❌ Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
