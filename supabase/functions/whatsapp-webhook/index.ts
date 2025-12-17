import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Números autorizados (Owner e Admin)
const AUTHORIZED_PHONES = [
  '5583998920105',  // Owner - Moisés (principal)
  '558398920105',   // Owner - Moisés (alternativo)
  '5583996354090',  // Admin - Bruna Milena
  '558396354090',   // Admin - Bruna Milena (alternativo)
];
const OWNER_EMAIL = 'moisesblank@gmail.com';

// ==============================================================================
// PROMPT TRAMON - ASSESSOR DIGITAL GPT-5
// ==============================================================================
const TRAMON_SYSTEM_PROMPT = `
Você é **TRAMON**, a inteligência artificial oficial do **Curso Moisés Medeiros**, o ecossistema educacional de alta performance líder nacional em Química para ENEM e vestibulares, com foco em aprovação em Medicina e cursos altamente concorridos.

## MÉTODO DO CURSO (seus valores)

O Curso Moisés Medeiros é baseado em:
- ✅ **Profundidade conceitual** - Química de verdade, não decoreba
- ✅ **Didática estratégica** - Ensino que funciona para ENEM
- ✅ **Organização** - Sistema completo, não aulas soltas
- ✅ **Consistência** - Acompanhamento real do aluno
- ✅ **Resultados** - Aprovações em Medicina e cursos top

## SEU PAPEL

Você é um **assessor digital inteligente, estratégico e humano**, especializado em:
- 🎯 Orientar pessoas que buscam clareza, direção e tomada de decisão segura
- 🧠 Organizar o raciocínio do usuário antes de qualquer direcionamento
- 💡 Esclarecer dúvidas e reduzir inseguranças
- 🎓 Indicar caminhos de forma clara, simples e responsável

**SEU PAPEL NÃO É VENDER, MAS ASSESSORAR.**

## PRINCÍPIOS OBRIGATÓRIOS

✅ **Linguagem clara, humana e acessível** - Fale como um professor que se importa
✅ **Postura consultiva e orientadora** - Você é um conselheiro, não um vendedor
✅ **Tom acolhedor, seguro e profissional** - Transmita confiança sem arrogância
✅ **Respostas objetivas, sem excesso de marketing** - Vá direto ao ponto
✅ **Personalização total** - Cada resposta deve ser única para aquela pessoa

## COMO CONDUZIR A CONVERSA

**ETAPA 1: IDENTIFICAÇÃO (primeira mensagem)**
- Identifique se o usuário já conhece o Curso Moisés Medeiros ou está chegando agora
- Pergunte: "Você já conhece o Curso Moisés Medeiros ou está chegando agora?"

**ETAPA 2: ENTENDIMENTO (escuta ativa)**
- Entenda o motivo do contato:
  - ❓ Dúvida sobre química?
  - 🎯 Interesse em se preparar para ENEM/Medicina?
  - 🤔 Comparando cursos?
  - 😰 Insegurança sobre aprovação?
  - 📚 Procurando material específico?

**ETAPA 3: DIAGNÓSTICO (perguntas estratégicas)**

Faça perguntas APENAS quando necessário:

**Se o usuário quer se preparar para ENEM/Medicina:**
- "Qual curso você quer fazer?" (para personalizar a resposta)
- "Você está no ensino médio ou já terminou?" (para entender o contexto)
- "Já estuda química ou está começando do zero?" (para recomendar o caminho certo)

**Se o usuário tem dúvida de química:**
- "Qual o assunto específico?" (para ajudar diretamente)
- "É para ENEM, vestibular específico ou escola?" (para adequar a explicação)

**Se o usuário está comparando cursos:**
- "O que você mais valoriza em um curso de química?" (para destacar diferenciais)
- "Já conhece outros cursos? O que achou deles?" (para entender objeções)

**ETAPA 4: ORIENTAÇÃO (solução personalizada)**

Com base nas respostas, oriente de forma clara:

**Cenário 1: Usuário quer Medicina**
"Entendi! Medicina é um dos cursos mais concorridos do Brasil, e Química costuma ser decisiva no ENEM.

O Curso Moisés Medeiros foi criado EXATAMENTE para quem quer aprovação em Medicina. Nosso método é baseado em:

1. Profundidade conceitual - Você entende química de verdade, não decora fórmulas
2. Estratégia para ENEM - Foco nos assuntos que mais caem
3. Acompanhamento real - Não é só aula, é mentoria

Temos 4 turmas presenciais (Natal, João Pessoa, Campina Grande e Neo) e curso 100% online.

Qual formato faz mais sentido para você?"

**Cenário 2: Usuário tem dúvida de química**
"Legal! Vou te ajudar com [assunto].

[Explicação clara e didática do conceito, usando analogias se necessário]

Isso faz sentido para você? Quer que eu aprofunde em algum ponto?"

**Cenário 3: Usuário está comparando cursos**
"Entendo! É importante comparar antes de decidir.

O diferencial do Curso Moisés Medeiros é:

1. Professor Moisés - 15 anos de experiência, especialista em ENEM
2. Método comprovado - Centenas de aprovações em Medicina
3. Acompanhamento real - Você não fica perdido
4. Material completo - Teoria + exercícios + simulados

O que você mais valoriza em um curso de química?"

**ETAPA 5: DIRECIONAMENTO (próximos passos)**

Direcione APENAS quando fizer sentido:

**Se o usuário demonstrou interesse:**
"Perfeito! Vou te passar o link para conhecer melhor:

🔗 Site: https://moisesmedeiros.com.br
📱 Instagram: @moises.profquimica

Quer que eu te envie informações sobre valores e formas de pagamento?"

**Se o usuário ainda tem dúvidas:**
"Sem problemas! Estou aqui para esclarecer.

O que mais você gostaria de saber?"

**Se o usuário quer falar com humano:**
"Claro! Vou transferir você para um dos nossos consultores educacionais.

Ele vai te atender em até 2 horas (horário comercial).

Enquanto isso, pode dar uma olhada no nosso Instagram: @moises.profquimica"

## ADAPTAÇÃO AO PERFIL DO USUÁRIO

**Se o usuário demonstrar:**
- 😕 **Confusão** → Organize as informações de forma clara
- ❓ **Dúvida** → Esclareça com exemplos práticos
- 😰 **Insegurança** → Acolha e transmita confiança
- 🎯 **Interesse** → Oriente sobre próximos passos
- ⏰ **Pressa** → Seja direto e objetivo

## LIMITES CLAROS (o que NUNCA fazer)

❌ **NUNCA forçar vendas** - Você é consultor, não vendedor
❌ **NUNCA criar urgência artificial** - "Só hoje!", "Últimas vagas!" → NÃO
❌ **NUNCA prometer resultados irreais** - "Você vai passar em Medicina!" → NÃO
❌ **NUNCA inventar informações** - Se não sabe, diga "Vou verificar e te respondo"
❌ **NUNCA usar linguagem agressiva** - Seja sempre acolhedor

## INFORMAÇÕES DO CURSO (use quando necessário)

**PRODUTOS:**
1. **Curso Online Completo** - Acesso vitalício, todas as aulas, material completo
2. **Turmas Presenciais** - Natal, João Pessoa, Campina Grande, Neo
3. **Mentoria Individual** - Acompanhamento 1:1 com Prof. Moisés
4. **Material Didático** - Apostilas, listas, simulados

**DIFERENCIAIS:**
- ✅ Professor Moisés Medeiros - 15 anos de experiência
- ✅ Método comprovado - Centenas de aprovações
- ✅ Acompanhamento real - Não é só aula
- ✅ Foco em ENEM e Medicina
- ✅ Comunidade de alunos

**CONTATOS:**
- 🌐 Site: https://moisesmedeiros.com.br
- 📱 Instagram: @moises.profquimica
- 📧 Email: falecom@moisesmedeiros.com.br

## RESULTADO ESPERADO

Ao final da conversa, o usuário deve sentir que:
- ✅ Foi ouvido e compreendido
- ✅ Entendeu melhor sua situação
- ✅ Teve clareza sobre as opções
- ✅ Recebeu orientação honesta
- ✅ Confia no Curso Moisés Medeiros
`;

// ==============================================================================
// PROMPT DO ASSESSOR EXECUTIVO (para Owner/Admin via palavra-chave)
// ==============================================================================
const EXECUTIVE_ASSISTANT_PROMPT = `
Você é TRAMON, assistente executivo premium do Professor Moisés Medeiros.

Você está respondendo via WhatsApp - seja CONCISO e DIRETO.
Máximo 500 caracteres por resposta quando possível.
Use emojis para clareza visual.

COMANDOS RÁPIDOS QUE VOCÊ ENTENDE:
- "tarefas" ou "agenda" = listar tarefas
- "criar tarefa [texto]" = criar nova tarefa
- "finanças" ou "dinheiro" = resumo financeiro
- "alunos" = status dos alunos
- "funcionários" ou "equipe" = status da equipe
- "relatório" = resumo executivo completo
- "leads" = status dos leads do WhatsApp
- "marketing" = métricas de marketing

Responda de forma executiva e profissional.
`;

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // ==============================================================================
    // GET - Webhook verification (Meta)
    // ==============================================================================
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      const VERIFY_TOKEN = Deno.env.get('WHATSAPP_VERIFY_TOKEN') || 'tramon_moises_2024';

      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('✅ Webhook verified!');
        return new Response(challenge, { status: 200 });
      }

      return new Response('Forbidden', { status: 403 });
    }

    // ==============================================================================
    // POST - Processar mensagens (WhatsApp direto ou ManyChat)
    // ==============================================================================
    if (req.method === 'POST') {
      const body = await req.json();
      console.log('📩 Webhook received:', JSON.stringify(body, null, 2));

      // Detectar se é payload do ManyChat ou WhatsApp direto
      // ManyChat pode variar o formato: preferimos inferir por presença de telefone + identificador.
      const isManyChat = Boolean(
        body &&
          typeof body === 'object' &&
          (body.user_phone || body.subscriber_phone || body.phone) &&
          (body.user_id || body.subscriber_id || body.user_name || body.name)
      );

      let from: string;
      let messageText: string;
      let userName: string;
      let externalId: string | null = null;
      let source: string;

      const pickFirstString = (...values: unknown[]) => {
        for (const v of values) {
          if (typeof v === 'string' && v.trim()) return v.trim();
        }
        return '';
      };

      const extractManyChatMessage = (payload: any) => {
        const direct = pickFirstString(
          payload?.message,
          payload?.text,
          payload?.customer_feedback,
          payload?.fields?.customer_feedback,
          payload?.custom_fields?.customer_feedback,
          payload?.data?.customer_feedback
        );
        if (direct) return direct;

        // Alguns fluxos mandam o campo como objeto { value: "..." }
        const objVal =
          payload?.fields?.customer_feedback?.value ??
          payload?.custom_fields?.customer_feedback?.value ??
          payload?.data?.customer_feedback?.value;
        if (typeof objVal === 'string' && objVal.trim()) return objVal.trim();

        return '';
      };

      if (isManyChat) {
        // ==============================================================================
        // PAYLOAD DO MANYCHAT
        // ==============================================================================
        console.log('📱 ManyChat payload detected');
        from = pickFirstString(body.user_phone, body.subscriber_phone, body.phone).replace(/\D/g, '');
        messageText = extractManyChatMessage(body);
        userName = pickFirstString(body.user_name, body.name, 'Lead WhatsApp') || 'Lead WhatsApp';
        externalId = pickFirstString(body.user_id, body.subscriber_id) || null;
        source = 'whatsapp_manychat';

        console.log('🧩 ManyChat extracted:', {
          from,
          userName,
          externalId,
          hasMessage: Boolean(messageText),
        });
      } else {
        // ==============================================================================
        // PAYLOAD DO WHATSAPP CLOUD API (direto)
        // ==============================================================================
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const messages = value?.messages;

        if (!messages || messages.length === 0) {
          return new Response(JSON.stringify({ status: 'no_message' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const message = messages[0];
        from = message.from;
        messageText = message.text?.body || '';
        userName = value?.contacts?.[0]?.profile?.name || 'Usuário WhatsApp';
        source = 'whatsapp_direct';
      }

      console.log(`📱 Message from ${from} (${userName}): ${messageText}`);

      // ==============================================================================
      // VERIFICAR SE É OWNER/ADMIN COM PALAVRA-CHAVE "meu assessor"
      // ==============================================================================
      const isAuthorized = AUTHORIZED_PHONES.some(phone => 
        from === phone || from.includes(phone.slice(-9)) || phone.includes(from.slice(-9))
      );
      
      const isAssessorKeyword = messageText.toLowerCase().includes('meu assessor');
      const useExecutiveMode = isAuthorized && isAssessorKeyword;

      console.log(`🔐 Authorized: ${isAuthorized}, Assessor Mode: ${useExecutiveMode}`);

      // ==============================================================================
      // CONFIGURAR IA (GPT-5) via Lovable Gateway
      // ==============================================================================
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      
      if (!LOVABLE_API_KEY) {
        console.error('❌ LOVABLE_API_KEY not configured');
        return new Response(JSON.stringify({ 
          success: false,
          response: 'Desculpe, estou com problemas técnicos. Um consultor humano vai te atender em breve!' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      let systemPrompt = TRAMON_SYSTEM_PROMPT;
      let contextData = '';

      // Se for modo executivo, buscar dados do sistema
      if (useExecutiveMode) {
        console.log('🎯 Executive mode activated - fetching system data');
        
        const [
          { data: tasks },
          { data: income },
          { data: students },
          { data: employees },
          { data: leads },
          { data: marketing }
        ] = await Promise.all([
          supabase.from('calendar_tasks').select('*').order('task_date', { ascending: true }).limit(10),
          supabase.from('income').select('*').order('created_at', { ascending: false }).limit(10),
          supabase.from('profiles').select('*').limit(50),
          supabase.from('employees').select('*'),
          supabase.from('whatsapp_leads').select('*').order('last_contact', { ascending: false }).limit(20),
          supabase.from('marketing_campaigns').select('*').limit(10)
        ]);

        // Calcular métricas
        const totalIncome = income?.reduce((sum, i) => sum + (i.valor || 0), 0) || 0;
        const pendingTasks = tasks?.filter(t => !t.is_completed).length || 0;
        const newLeads = leads?.filter(l => l.status === 'novo').length || 0;
        const activeEmployees = employees?.filter(e => e.status === 'ativo').length || 0;

        contextData = `
DADOS DO SISTEMA EM TEMPO REAL:

📋 TAREFAS:
- Total: ${tasks?.length || 0}
- Pendentes: ${pendingTasks}
- Próximas: ${JSON.stringify(tasks?.slice(0, 5).map(t => ({ titulo: t.title, data: t.task_date })) || [])}

💰 FINANÇAS:
- Receita Total: R$ ${totalIncome.toLocaleString('pt-BR')}
- Últimas entradas: ${JSON.stringify(income?.slice(0, 3).map(i => ({ fonte: i.fonte, valor: i.valor })) || [])}

👥 EQUIPE:
- Funcionários ativos: ${activeEmployees}
- Total: ${employees?.length || 0}

🎯 LEADS WHATSAPP:
- Novos: ${newLeads}
- Total: ${leads?.length || 0}
- Status: ${JSON.stringify(leads?.slice(0, 5).map(l => ({ nome: l.name, status: l.status })) || [])}

📊 MARKETING:
- Campanhas: ${marketing?.length || 0}

📱 Você está falando pelo WhatsApp com o OWNER.
        `.trim();

        systemPrompt = EXECUTIVE_ASSISTANT_PROMPT + '\n\n' + contextData;
      }

      // ==============================================================================
      // BUSCAR HISTÓRICO DE CONVERSA (para contexto)
      // ==============================================================================
      let conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
      
      if (isManyChat && body.conversation_history) {
        conversationHistory = body.conversation_history;
      } else {
        // Buscar últimas mensagens do lead
        const { data: existingLead } = await supabase
          .from('whatsapp_leads')
          .select('id')
          .eq('phone', from)
          .single();

        if (existingLead) {
          const { data: history } = await supabase
            .from('whatsapp_conversation_history')
            .select('user_message, ai_response')
            .eq('lead_id', existingLead.id)
            .order('created_at', { ascending: false })
            .limit(5);

          if (history) {
            conversationHistory = history.reverse().flatMap(h => [
              { role: 'user' as const, content: h.user_message },
              { role: 'assistant' as const, content: h.ai_response }
            ]);
          }
        }
      }

      // Remover a palavra-chave "meu assessor" da mensagem para processamento
      const cleanMessage = messageText.replace(/meu assessor/gi, '').trim() || 'Olá!';

      // ==============================================================================
      // CHAMAR GPT-5 VIA LOVABLE AI GATEWAY
      // ==============================================================================
      const startTime = Date.now();
      
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversationHistory,
            { role: 'user', content: cleanMessage }
          ],
          temperature: 0.7,
          max_tokens: 800,
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('❌ AI Gateway error:', aiResponse.status, errorText);
        
        if (aiResponse.status === 429) {
          return new Response(JSON.stringify({ 
            success: false,
            response: 'Estou com muitas solicitações no momento. Tente novamente em alguns segundos!' 
          }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        return new Response(JSON.stringify({ 
          success: false,
          response: 'Desculpe, estou com problemas técnicos. Um consultor humano vai te atender em breve!' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const aiData = await aiResponse.json();
      const aiReply = aiData.choices?.[0]?.message?.content || 
        'Desculpe, não consegui processar sua mensagem. Um consultor humano vai te atender em breve!';
      
      const responseTime = Date.now() - startTime;
      console.log(`✅ AI response generated in ${responseTime}ms`);

      // ==============================================================================
      // SALVAR LEAD E CONVERSA NO BANCO (exceto Owner/Admin em modo executivo)
      // ==============================================================================
      if (!useExecutiveMode) {
        try {
          // Usar a função upsert_whatsapp_lead
          const { data: leadId, error: leadError } = await supabase.rpc('upsert_whatsapp_lead', {
            p_phone: from,
            p_name: userName,
            p_external_id: externalId,
            p_message: messageText,
            p_ai_response: aiReply,
            p_source: source
          });

          if (leadError) {
            console.error('❌ Error saving lead:', leadError);
          } else {
            console.log(`✅ Lead saved/updated: ${leadId}`);
          }
        } catch (dbError) {
          console.error('❌ Database error:', dbError);
        }
      } else {
        // Salvar na tabela tramon_conversations para histórico do owner
        const { data: ownerProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', OWNER_EMAIL)
          .single();

        if (ownerProfile) {
          await supabase.from('tramon_conversations').insert([
            { user_id: ownerProfile.id, role: 'user', content: messageText, source: 'whatsapp' },
            { user_id: ownerProfile.id, role: 'assistant', content: aiReply, source: 'whatsapp' }
          ]);
        }
      }

      // ==============================================================================
      // ENVIAR RESPOSTA DE VOLTA PARA O WHATSAPP (se não for ManyChat)
      // ==============================================================================
      if (!isManyChat) {
        const WHATSAPP_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
        const WHATSAPP_PHONE_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

        if (WHATSAPP_TOKEN && WHATSAPP_PHONE_ID) {
          try {
            const sendResult = await fetch(`https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`, {
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
            
            if (sendResult.ok) {
              console.log('✅ Response sent to WhatsApp');
            } else {
              const sendError = await sendResult.text();
              console.error('❌ WhatsApp send error:', sendError);
            }
          } catch (sendError) {
            console.error('❌ Error sending WhatsApp response:', sendError);
          }
        }
      }

      // ==============================================================================
      // RETORNAR RESPOSTA (para ManyChat usar)
      // ==============================================================================
      return new Response(JSON.stringify({ 
        success: true,
        response: aiReply,
        user_id: externalId || from,
        response_time_ms: responseTime
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response('Method not allowed', { status: 405 });
    
  } catch (error: unknown) {
    console.error('❌ Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage,
      response: 'Desculpe, estou com problemas técnicos. Um consultor humano vai te atender em breve!'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
