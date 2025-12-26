import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getWebhookCorsHeaders } from "../_shared/corsConfig.ts";

// CORS para webhooks externos (WhatsApp Cloud API)
const corsHeaders = getWebhookCorsHeaders();

// ==============================================================================
// CONFIGURAÇÃO DE ADMINISTRADORES
// ==============================================================================
const ADMIN_USERS = [
  { name: 'Moises', phones: ['5583998920105', '558398920105', '83998920105'], role: 'owner' },
  { name: 'Bruna', phones: ['5583996354090', '558396354090', '83996354090'], role: 'admin' }
];

const SESSION_TIMEOUT_HOURS = 8;
const TRIGGER_KEYWORD = 'meu assessor';
const END_SESSION_KEYWORD = 'encerrar assessor';

// ==============================================================================
// FUNÇÕES AUXILIARES
// ==============================================================================
const identifyAdmin = (phone: string, name?: string) => {
  const cleanPhone = phone.replace(/\D/g, '');
  for (const admin of ADMIN_USERS) {
    for (const adminPhone of admin.phones) {
      if (cleanPhone === adminPhone || 
          cleanPhone.endsWith(adminPhone.slice(-9)) || 
          adminPhone.endsWith(cleanPhone.slice(-9)) ||
          cleanPhone.endsWith(adminPhone.slice(-8))) {
        return admin;
      }
    }
  }
  if (name) {
    const nameLower = name.toLowerCase().trim();
    for (const admin of ADMIN_USERS) {
      if (nameLower.includes(admin.name.toLowerCase()) || admin.name.toLowerCase().includes(nameLower)) {
        return admin;
      }
    }
  }
  return null;
};

const normalizePhone = (phone: string) => phone.replace(/\D/g, '');

const getMessageType = (message: any): string => {
  if (message.text) return 'text';
  if (message.image) return 'image';
  if (message.audio) return 'audio';
  if (message.video) return 'video';
  if (message.document) return 'document';
  if (message.sticker) return 'sticker';
  if (message.interactive) return 'interactive';
  if (message.location) return 'location';
  if (message.contacts) return 'contacts';
  return 'unknown';
};

const getMediaInfo = (message: any) => {
  const types = ['image', 'audio', 'video', 'document', 'sticker'];
  for (const type of types) {
    if (message[type]) {
      return {
        type,
        mediaId: message[type].id,
        mimeType: message[type].mime_type,
        sha256: message[type].sha256,
        filename: message[type].filename,
        caption: message[type].caption
      };
    }
  }
  return null;
};

// ==============================================================================
// PROCESSAMENTO INTELIGENTE DE LINGUAGEM NATURAL
// ==============================================================================

// Função para converter "mil" e "milhão" para números
const parseValueWithMultiplier = (text: string): number | null => {
  // Remove R$ e espaços extras
  let cleaned = text.toLowerCase().replace(/r\$\s*/g, '').trim();
  
  // Padrão: "13 mil", "1.5 mil", "2 milhões"
  const milMatch = cleaned.match(/(\d+(?:[.,]\d+)?)\s*mil/i);
  if (milMatch) {
    return parseFloat(milMatch[1].replace(',', '.')) * 1000;
  }
  
  const milhaoMatch = cleaned.match(/(\d+(?:[.,]\d+)?)\s*milh[õo]/i);
  if (milhaoMatch) {
    return parseFloat(milhaoMatch[1].replace(',', '.')) * 1000000;
  }
  
  // Número simples
  const simpleMatch = cleaned.match(/(\d+(?:[.,]\d+)?)/);
  if (simpleMatch) {
    return parseFloat(simpleMatch[1].replace(',', '.'));
  }
  
  return null;
};

const parseNaturalLanguage = (text: string) => {
  const lowerText = text.toLowerCase().trim();
  
  // ==============================================================================
  // PADRÕES DE GASTOS (expandidos)
  // ==============================================================================
  const gastoKeywords = [
    'paguei', 'gastei', 'comprei', 'pago', 'gastar', 'gastando', 
    'acabei de gastar', 'acabei de pagar', 'acabei de comprar',
    'vou gastar', 'vou pagar', 'vou comprar',
    'gasto de', 'compra de', 'pagamento de'
  ];
  
  const hasGastoKeyword = gastoKeywords.some(k => lowerText.includes(k));
  
  if (hasGastoKeyword) {
    // Tentar extrair valor com "mil" ou "milhão"
    const valor = parseValueWithMultiplier(text);
    
    if (valor && valor > 0) {
      // Extrair descrição - tudo após o valor
      let descricao = '';
      
      // Padrões de extração de descrição
      const descPatterns = [
        /(?:em|de|com|no|na|pra|para)\s+(?:uma?\s+)?(.+?)$/i,
        /(?:reais?|mil|milhão|milhões)\s+(?:em|de|com|no|na|pra|para)?\s*(.+?)$/i,
      ];
      
      for (const pattern of descPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          descricao = match[1].trim();
          // Limpar palavras finais irrelevantes
          descricao = descricao.replace(/\s*(reais?|mil|milhão|milhões)$/i, '').trim();
          break;
        }
      }
      
      // Se não encontrou descrição, pegar última parte do texto
      if (!descricao) {
        const words = text.split(/\s+/);
        const lastThree = words.slice(-3).join(' ');
        if (lastThree && !/\d/.test(lastThree)) {
          descricao = lastThree;
        }
      }
      
      if (descricao && descricao.length > 1) {
        console.log(`🧠 Gasto detectado: R$ ${valor} - ${descricao}`);
        return {
          type: 'finance',
          action: 'expense',
          amount: valor,
          description: descricao,
          confidence: 0.9
        };
      }
    }
  }
  
  // ==============================================================================
  // PADRÕES DE RECEITAS (expandidos)
  // ==============================================================================
  const receitaKeywords = [
    'recebi', 'ganhei', 'entrou', 'recebendo', 'receber',
    'caiu', 'deposito', 'depósito', 'pagamento recebido',
    'cliente pagou', 'aluno pagou'
  ];
  
  const hasReceitaKeyword = receitaKeywords.some(k => lowerText.includes(k));
  
  if (hasReceitaKeyword) {
    const valor = parseValueWithMultiplier(text);
    
    if (valor && valor > 0) {
      let descricao = '';
      
      const descPatterns = [
        /(?:de|do|da|por|pelo|pela)\s+(.+?)$/i,
        /(?:reais?|mil|milhão|milhões)\s+(?:de|do|da|por)?\s*(.+?)$/i,
      ];
      
      for (const pattern of descPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          descricao = match[1].trim();
          descricao = descricao.replace(/\s*(reais?|mil|milhão|milhões)$/i, '').trim();
          break;
        }
      }
      
      if (!descricao) {
        const words = text.split(/\s+/);
        const lastThree = words.slice(-3).join(' ');
        if (lastThree && !/\d/.test(lastThree)) {
          descricao = lastThree;
        }
      }
      
      if (descricao && descricao.length > 1) {
        console.log(`🧠 Receita detectada: R$ ${valor} - ${descricao}`);
        return {
          type: 'finance',
          action: 'income',
          amount: valor,
          description: descricao,
          confidence: 0.9
        };
      }
    }
  }
  
  // ==============================================================================
  // CONSULTAS DE GASTOS
  // ==============================================================================
  if (lowerText.includes('quanto gastei') || lowerText.includes('quanto paguei') || 
      lowerText.includes('meus gastos') || lowerText.includes('minhas despesas')) {
    const hoje = lowerText.includes('hoje');
    const mes = lowerText.includes('mês') || lowerText.includes('mes');
    const semana = lowerText.includes('semana');
    return {
      type: 'query',
      action: 'expenses_summary',
      period: hoje ? 'today' : mes ? 'month' : semana ? 'week' : 'all',
      confidence: 0.85
    };
  }
  
  // ==============================================================================
  // CONSULTAS DE SALDO
  // ==============================================================================
  if (lowerText.includes('saldo') || lowerText.includes('como estou') || 
      lowerText.includes('como está') || lowerText.includes('balanço') ||
      lowerText.includes('resumo financeiro')) {
    return {
      type: 'query',
      action: 'balance',
      confidence: 0.8
    };
  }
  
  // ==============================================================================
  // PADRÕES DE TAREFAS (expandidos)
  // ==============================================================================
  const tarefaPatterns = [
    /(?:lembrete?|lembra|adiciona|cria|marca|anota)\s*(?:de|que|tarefa|compromisso)?\s*[:.]?\s*(.+)/i,
    /(?:tenho|preciso)\s+(?:de\s+)?(.+)\s+(?:amanhã|hoje|segunda|terça|quarta|quinta|sexta|sábado|domingo)/i,
    /(?:não esquecer|não esquece|não esqueça)\s*(?:de)?\s*(.+)/i,
  ];
  
  for (const pattern of tarefaPatterns) {
    const match = text.match(pattern);
    if (match && match[1].length > 3) {
      return {
        type: 'task',
        action: 'create',
        title: match[1].trim(),
        confidence: 0.7
      };
    }
  }
  
  // ==============================================================================
  // CONSULTAS DE TAREFAS
  // ==============================================================================
  if ((lowerText.includes('lembrete') || lowerText.includes('tarefa')) && 
      (lowerText.includes('quais') || lowerText.includes('tenho') || lowerText.includes('lista'))) {
    return {
      type: 'query',
      action: 'tasks_list',
      confidence: 0.85
    };
  }
  
  return null;
};

// ==============================================================================
// EXECUTAR AÇÃO DE LINGUAGEM NATURAL
// ==============================================================================
const executeNaturalLanguageAction = async (
  supabase: any,
  parsed: any,
  adminName: string,
  conversationId: string
) => {
  if (parsed.type === 'finance') {
    if (parsed.action === 'expense') {
      const { error } = await supabase.from('command_finance').insert({
        type: 'expense',
        amount: parsed.amount,
        description: parsed.description,
        status: 'paid',
        source: 'whatsapp_natural',
        related_conversation_id: conversationId,
        created_by: adminName,
        date: new Date().toISOString().split('T')[0]
      });
      
      if (error) {
        return `❌ Erro ao registrar: ${error.message}`;
      }
      
      return `✅ Registrado, ${adminName}!\n\n💸 Gasto: R$ ${parsed.amount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}\n📝 ${parsed.description}\n📅 ${new Date().toLocaleDateString('pt-BR')}\n\n🔗 Ver finanças: https://gestao.moisesmedeiros.com.br/financas-empresa`;
    }
    
    if (parsed.action === 'income') {
      const { error } = await supabase.from('command_finance').insert({
        type: 'income',
        amount: parsed.amount,
        description: parsed.description,
        status: 'received',
        source: 'whatsapp_natural',
        related_conversation_id: conversationId,
        created_by: adminName,
        date: new Date().toISOString().split('T')[0]
      });
      
      if (error) {
        return `❌ Erro ao registrar: ${error.message}`;
      }
      
      return `✅ Registrado, ${adminName}!\n\n💰 Receita: R$ ${parsed.amount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}\n📝 ${parsed.description}\n📅 ${new Date().toLocaleDateString('pt-BR')}\n\n🔗 Ver finanças: https://gestao.moisesmedeiros.com.br/financas-empresa`;
    }
  }
  
  if (parsed.type === 'query') {
    if (parsed.action === 'expenses_summary') {
      let query = supabase.from('command_finance').select('amount, type, description, date').eq('type', 'expense');
      
      const today = new Date();
      if (parsed.period === 'today') {
        query = query.gte('date', today.toISOString().split('T')[0]);
      } else if (parsed.period === 'month') {
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        query = query.gte('date', firstDay.toISOString().split('T')[0]);
      } else if (parsed.period === 'week') {
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        query = query.gte('date', weekAgo.toISOString().split('T')[0]);
      }
      
      const { data: expenses } = await query;
      const total = expenses?.reduce((sum: number, e: any) => sum + (e.amount || 0), 0) || 0;
      const count = expenses?.length || 0;
      
      const periodText = parsed.period === 'today' ? 'hoje' : 
                        parsed.period === 'month' ? 'este mês' :
                        parsed.period === 'week' ? 'esta semana' : 'no total';
      
      return `📊 Resumo de gastos ${periodText}, ${adminName}:\n\n💸 Total: R$ ${total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}\n📋 ${count} registros\n\n🔗 Detalhes: https://gestao.moisesmedeiros.com.br/financas-empresa`;
    }
    
    if (parsed.action === 'balance') {
      const [
        { data: income },
        { data: expenses }
      ] = await Promise.all([
        supabase.from('command_finance').select('amount').eq('type', 'income'),
        supabase.from('command_finance').select('amount').eq('type', 'expense')
      ]);
      
      const totalIncome = income?.reduce((s: number, i: any) => s + (i.amount || 0), 0) || 0;
      const totalExpenses = expenses?.reduce((s: number, e: any) => s + (e.amount || 0), 0) || 0;
      const balance = totalIncome - totalExpenses;
      
      const emoji = balance >= 0 ? '✅' : '⚠️';
      
      return `${emoji} Seu saldo, ${adminName}:\n\n💰 Receitas: R$ ${totalIncome.toLocaleString('pt-BR', {minimumFractionDigits: 2})}\n💸 Gastos: R$ ${totalExpenses.toLocaleString('pt-BR', {minimumFractionDigits: 2})}\n\n📊 Saldo: R$ ${balance.toLocaleString('pt-BR', {minimumFractionDigits: 2})}\n\n🔗 Dashboard: https://gestao.moisesmedeiros.com.br/dashboard`;
    }
    
    if (parsed.action === 'tasks_list') {
      const { data: tasks } = await supabase
        .from('command_tasks')
        .select('title, priority, due_date')
        .eq('status', 'todo')
        .order('due_date', { ascending: true })
        .limit(5);
      
      if (!tasks || tasks.length === 0) {
        return `✨ Você não tem tarefas pendentes, ${adminName}!\n\n🔗 Ver tarefas: https://gestao.moisesmedeiros.com.br/tarefas`;
      }
      
      const taskList = tasks.map((t: any, i: number) => {
        const priority = t.priority === 'high' ? '🔴' : t.priority === 'med' ? '🟡' : '🟢';
        const date = t.due_date ? ` (${new Date(t.due_date).toLocaleDateString('pt-BR')})` : '';
        return `${i + 1}. ${priority} ${t.title}${date}`;
      }).join('\n');
      
      return `📋 Suas tarefas pendentes, ${adminName}:\n\n${taskList}\n\n🔗 Ver todas: https://gestao.moisesmedeiros.com.br/tarefas`;
    }
  }
  
  if (parsed.type === 'task' && parsed.action === 'create') {
    const { error } = await supabase.from('command_tasks').insert({
      title: parsed.title,
      status: 'todo',
      priority: 'med',
      source: 'whatsapp_natural',
      owner: adminName,
      related_conversation_id: conversationId,
      created_by: adminName
    });
    
    if (error) {
      return `❌ Erro ao criar tarefa: ${error.message}`;
    }
    
    return `✅ Tarefa criada, ${adminName}!\n\n📋 ${parsed.title}\n\n🔗 Ver tarefas: https://gestao.moisesmedeiros.com.br/tarefas`;
  }
  
  return null;
};

// ==============================================================================
// PROMPT DO TRAMON - MODO EXECUTIVO PREMIUM v2.0
// ==============================================================================
const getExecutivePrompt = (adminName: string, adminRole: string, contextData: string) => `
Você é TRAMON, o assistente executivo premium pessoal de ${adminName}.

🎯 FALANDO COM: ${adminName} (${adminRole === 'owner' ? 'Proprietário - Dono da Empresa' : 'Administradora - Gestora'})

═══════════════════════════════════════════════════════════════════
PERSONALIDADE E COMUNICAÇÃO
═══════════════════════════════════════════════════════════════════
- Você é um assistente EXECUTIVO, INTELIGENTE e PROATIVO
- SEMPRE chame pelo nome: "${adminName}"
- Tom: Profissional mas amigável, direto mas caloroso
- Máximo 500 caracteres por resposta
- Use emojis para clareza visual (📊💰📋✅)
- Seja CONCISO - vá direto ao ponto
- SEMPRE sugira próximos passos ou ações

═══════════════════════════════════════════════════════════════════
SUA MISSÃO
═══════════════════════════════════════════════════════════════════
Você ajuda ${adminName} a:
1. GERENCIAR FINANÇAS - Registrar gastos, receitas, contas a pagar/receber
2. ORGANIZAR TAREFAS - Criar lembretes, acompanhar pendências
3. CONSULTAR DADOS - Resumos financeiros, status de tarefas
4. TOMAR DECISÕES - Análises rápidas e recomendações

═══════════════════════════════════════════════════════════════════
CONTEXTO ATUAL DO SISTEMA
═══════════════════════════════════════════════════════════════════
${contextData}

═══════════════════════════════════════════════════════════════════
ENTENDA LINGUAGEM NATURAL
═══════════════════════════════════════════════════════════════════
VOCÊ ENTENDE E PROCESSA automaticamente frases como:

📊 GASTOS:
"Paguei 30 reais de gasolina" → Registra gasto R$30 em gasolina
"Gastei 150 no mercado" → Registra gasto R$150 em mercado
"Comprei 50 reais de material" → Registra gasto R$50

💰 RECEITAS:
"Recebi 1500 de aula particular" → Registra receita R$1500
"Entrou 10 mil do curso" → Registra receita R$10.000
"Cliente pagou 500" → Registra receita R$500

📋 TAREFAS:
"Me lembra de pagar conta de luz amanhã" → Cria tarefa
"Anota: ligar para fornecedor" → Cria tarefa
"Preciso revisar planilha semana que vem" → Cria tarefa

📊 CONSULTAS:
"Quanto gastei hoje?" → Mostra resumo de gastos
"Quais tarefas tenho?" → Lista tarefas pendentes
"Qual meu saldo?" → Mostra balanço

═══════════════════════════════════════════════════════════════════
COMANDOS /admin (AVANÇADOS)
═══════════════════════════════════════════════════════════════════
/admin tarefa titulo="X" desc="Y" prioridade=alta
/admin fin tipo=expense valor=100 desc="Descrição"
/admin crm stage=vip tags="importante"
/admin resumo (hoje/semana/mês)
/admin encerrar

═══════════════════════════════════════════════════════════════════
LINKS DO SISTEMA
═══════════════════════════════════════════════════════════════════
🔗 Dashboard: https://gestao.moisesmedeiros.com.br/dashboard
📋 Tarefas: https://gestao.moisesmedeiros.com.br/tarefas
💰 Finanças: https://gestao.moisesmedeiros.com.br/financas-empresa
👥 Alunos: https://gestao.moisesmedeiros.com.br/alunos
👔 Equipe: https://gestao.moisesmedeiros.com.br/funcionarios
📱 Leads: https://gestao.moisesmedeiros.com.br/central-whatsapp
📈 Marketing: https://gestao.moisesmedeiros.com.br/marketing

═══════════════════════════════════════════════════════════════════
IMPORTANTE
═══════════════════════════════════════════════════════════════════
- Se a mensagem for sobre GASTO/RECEITA/TAREFA, o sistema JÁ processou automaticamente
- Apenas CONFIRME a ação e sugira próximos passos
- Se for PERGUNTA, forneça as informações solicitadas
- Se for CONVERSA GERAL, seja útil e proativo
- Para encerrar sessão: "encerrar" ou "encerrar assessor"
`;

// ==============================================================================
// PROMPT PÚBLICO DO TRAMON v2.0
// ==============================================================================
const TRAMON_PUBLIC_PROMPT = `
Você é TRAMON, o assessor digital inteligente do Professor Moisés Medeiros.

═══════════════════════════════════════════════════════════════════
QUEM É O PROFESSOR MOISÉS MEDEIROS
═══════════════════════════════════════════════════════════════════
Professor de Química especializado em preparação para ENEM e vestibulares de Medicina.
Metodologia inovadora com foco em resultados e aprovação.

═══════════════════════════════════════════════════════════════════
SUA MISSÃO COMO ASSESSOR
═══════════════════════════════════════════════════════════════════
1. ACOLHER - Seja simpático e prestativo
2. ENTENDER - Descubra o que a pessoa precisa
3. ORIENTAR - Dê informações úteis sobre o curso
4. DIRECIONAR - Encaminhe para o próximo passo

═══════════════════════════════════════════════════════════════════
PRINCÍPIOS DE ATENDIMENTO
═══════════════════════════════════════════════════════════════════
✅ Linguagem clara, acolhedora e profissional
✅ Postura consultiva (ajudar, não vender)
✅ Respostas objetivas e personalizadas
✅ Máximo 500 caracteres
✅ Use emojis para conexão (🎯📚✨)

═══════════════════════════════════════════════════════════════════
PERGUNTAS ESTRATÉGICAS
═══════════════════════════════════════════════════════════════════
- Você já conhece o trabalho do Professor Moisés?
- Qual seu objetivo? (ENEM, Medicina, reforço)
- Qual série você está cursando?
- Tem alguma dificuldade específica em Química?

═══════════════════════════════════════════════════════════════════
CONTATOS E LINKS
═══════════════════════════════════════════════════════════════════
🌐 Site: https://moisesmedeiros.com.br
📸 Instagram: @moises.profquimica
📧 Email: falecom@moisesmedeiros.com.br

═══════════════════════════════════════════════════════════════════
IMPORTANTE
═══════════════════════════════════════════════════════════════════
- Se perguntarem sobre preços ou matrículas, direcione para o site ou Instagram
- Nunca prometa nada que não possa cumprir
- Se não souber algo, diga que vai verificar ou direcione para contato humano
`;

// ==============================================================================
// PARSER DE COMANDOS ADMIN
// ==============================================================================
const parseAdminCommand = (text: string) => {
  if (!text.startsWith('/admin')) return null;
  
  const parts = text.slice(6).trim();
  const commandMatch = parts.match(/^(\w+)/);
  if (!commandMatch) return null;
  
  const command = commandMatch[1].toLowerCase();
  const argsString = parts.slice(command.length).trim();
  
  const args: Record<string, string> = {};
  const regex = /(\w+)=(?:"([^"]+)"|(\S+))/g;
  let match;
  while ((match = regex.exec(argsString)) !== null) {
    args[match[1]] = match[2] || match[3];
  }
  
  return { command, args, raw: argsString };
};

// ==============================================================================
// EXECUTAR COMANDO ADMIN
// ==============================================================================
const executeAdminCommand = async (
  supabase: any,
  cmd: { command: string; args: Record<string, string>; raw: string },
  adminName: string,
  adminPhone: string,
  conversationId: string
) => {
  const auditLog = async (action: string, payload: any, status = 'success', message = '') => {
    await supabase.from('admin_audit_log').insert({
      actor_phone: adminPhone,
      actor_name: adminName,
      action_type: action,
      action_payload: payload,
      result_status: status,
      result_message: message
    });
  };

  switch (cmd.command) {
    case 'tarefa': {
      const { titulo, desc, prioridade, data, owner } = cmd.args;
      if (!titulo) return '❌ Faltou o título. Use: /admin tarefa titulo="Nome" desc="Descrição"';
      
      const { error } = await supabase.from('command_tasks').insert({
        title: titulo,
        description: desc || null,
        priority: prioridade === 'alta' ? 'high' : prioridade === 'baixa' ? 'low' : 'med',
        due_date: data || null,
        owner: owner || adminName,
        source: 'whatsapp_command',
        related_conversation_id: conversationId,
        created_by: adminName
      });
      
      if (error) {
        await auditLog('create_task', cmd.args, 'failed', error.message);
        return `❌ Erro ao criar tarefa: ${error.message}`;
      }
      
      await auditLog('create_task', cmd.args);
      return `✅ Tarefa criada, ${adminName}!\n\n📋 ${titulo}\n${desc ? `📝 ${desc}\n` : ''}${data ? `📅 ${data}\n` : ''}\n🔗 Ver: https://gestao.moisesmedeiros.com.br/tarefas`;
    }

    case 'fin': {
      const { tipo, valor, parte, desc, status } = cmd.args;
      if (!valor) return '❌ Faltou o valor. Use: /admin fin tipo=payable valor=1000 parte="Nome"';
      
      const { error } = await supabase.from('command_finance').insert({
        type: tipo || 'expense',
        amount: parseFloat(valor),
        counterparty: parte || null,
        description: desc || null,
        status: status || 'open',
        source: 'whatsapp_command',
        related_conversation_id: conversationId,
        created_by: adminName,
        date: new Date().toISOString().split('T')[0]
      });
      
      if (error) {
        await auditLog('create_finance', cmd.args, 'failed', error.message);
        return `❌ Erro ao lançar finança: ${error.message}`;
      }
      
      await auditLog('create_finance', cmd.args);
      return `✅ Finança registrada, ${adminName}!\n\n💰 R$ ${parseFloat(valor).toLocaleString('pt-BR')}\n${parte ? `👤 ${parte}\n` : ''}${desc ? `📝 ${desc}\n` : ''}\n🔗 Ver: https://gestao.moisesmedeiros.com.br/financas-empresa`;
    }

    case 'crm': {
      const { stage, tags, note } = cmd.args;
      
      const updates: any = {};
      if (stage) updates.crm_stage = stage;
      if (tags) updates.tags = tags.split(',').map((t: string) => t.trim());
      if (note) updates.notes = note;
      
      const { error } = await supabase
        .from('whatsapp_conversations')
        .update(updates)
        .eq('id', conversationId);
      
      if (error) {
        await auditLog('update_crm', cmd.args, 'failed', error.message);
        return `❌ Erro ao atualizar CRM: ${error.message}`;
      }
      
      await auditLog('update_crm', cmd.args);
      return `✅ CRM atualizado, ${adminName}!\n\n${stage ? `🎯 Estágio: ${stage}\n` : ''}${tags ? `🏷️ Tags: ${tags}\n` : ''}${note ? `📝 ${note}\n` : ''}\n🔗 Ver: https://gestao.moisesmedeiros.com.br/central-whatsapp`;
    }

    case 'resumo': {
      const [
        { data: tasks },
        { data: finance },
        { data: conversations },
        { data: todayExpenses }
      ] = await Promise.all([
        supabase.from('command_tasks').select('*').eq('status', 'todo').limit(5),
        supabase.from('command_finance').select('*').eq('status', 'open'),
        supabase.from('whatsapp_conversations').select('*').eq('crm_stage', 'vip').limit(5),
        supabase.from('command_finance').select('amount').eq('type', 'expense').gte('date', new Date().toISOString().split('T')[0])
      ]);
      
      const pendingTasks = tasks?.length || 0;
      const openPayable = finance?.filter((f: any) => f.type === 'payable').reduce((sum: number, f: any) => sum + f.amount, 0) || 0;
      const openReceivable = finance?.filter((f: any) => f.type === 'receivable').reduce((sum: number, f: any) => sum + f.amount, 0) || 0;
      const vipContacts = conversations?.length || 0;
      const todayTotal = todayExpenses?.reduce((sum: number, e: any) => sum + (e.amount || 0), 0) || 0;
      
      await auditLog('view_summary', { type: cmd.raw });
      return `📊 Resumo, ${adminName}!\n\n📋 Tarefas pendentes: ${pendingTasks}\n💸 A pagar: R$ ${openPayable.toLocaleString('pt-BR')}\n💰 A receber: R$ ${openReceivable.toLocaleString('pt-BR')}\n📱 Gastos hoje: R$ ${todayTotal.toLocaleString('pt-BR')}\n⭐ Contatos VIP: ${vipContacts}\n\n🔗 Dashboard: https://gestao.moisesmedeiros.com.br/dashboard`;
    }

    case 'encerrar': {
      await supabase
        .from('whatsapp_conversations')
        .update({ session_mode: 'ASSISTOR_OFF', session_started_at: null })
        .eq('id', conversationId);
      
      await auditLog('end_session', {});
      return `✅ Sessão encerrada, ${adminName}! Até logo! 👋\n\nPara ativar novamente, envie "meu assessor".`;
    }

    default:
      return `❌ Comando não reconhecido: ${cmd.command}\n\nComandos disponíveis:\n• /admin tarefa titulo="X"\n• /admin fin valor=X\n• /admin crm stage=X\n• /admin resumo\n• /admin encerrar`;
  }
};

// ==============================================================================
// DOWNLOAD DE MÍDIA DO WHATSAPP
// ==============================================================================
const downloadMedia = async (mediaId: string, accessToken: string) => {
  try {
    const urlResponse = await fetch(`https://graph.facebook.com/v18.0/${mediaId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (!urlResponse.ok) {
      console.error('Failed to get media URL:', await urlResponse.text());
      return null;
    }
    
    const urlData = await urlResponse.json();
    const downloadUrl = urlData.url;
    
    const fileResponse = await fetch(downloadUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (!fileResponse.ok) {
      console.error('Failed to download media:', await fileResponse.text());
      return null;
    }
    
    const arrayBuffer = await fileResponse.arrayBuffer();
    return {
      data: new Uint8Array(arrayBuffer),
      mimeType: urlData.mime_type,
      fileSize: urlData.file_size
    };
  } catch (error) {
    console.error('Error downloading media:', error);
    return null;
  }
};

// ==============================================================================
// ENVIAR MENSAGEM VIA WHATSAPP CLOUD API
// ==============================================================================
const sendWhatsAppMessage = async (to: string, message: string) => {
  const WHATSAPP_ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
  const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
  
  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    console.error('WhatsApp credentials not configured');
    return false;
  }
  
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: message }
        })
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to send WhatsApp message:', errorText);
      return false;
    }
    
    const result = await response.json();
    console.log('✅ Message sent successfully:', result);
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return false;
  }
};

// ==============================================================================
// CHAMAR AI (LOVABLE GATEWAY)
// ==============================================================================
const callAI = async (systemPrompt: string, userMessage: string, conversationHistory: any[] = []) => {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY) {
    console.error('LOVABLE_API_KEY not configured');
    return 'Desculpe, estou com problemas técnicos. Um consultor humano vai te atender em breve!';
  }
  
  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10),
      { role: 'user', content: userMessage }
    ];
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        max_tokens: 500
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      return 'Desculpe, estou com dificuldades técnicas. Tente novamente em instantes!';
    }
    
    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Não consegui processar sua mensagem.';
  } catch (error) {
    console.error('Error calling AI:', error);
    return 'Erro ao processar. Por favor, tente novamente.';
  }
};

// ==============================================================================
// WEBHOOK PRINCIPAL
// ==============================================================================
serve(async (req) => {
  const startTime = Date.now();
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // ==============================================================================
    // GET - Verificação do Webhook (Meta)
    // ==============================================================================
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      // 🛡️ PATCH-003: VERIFY_TOKEN sem fallback hardcoded - fail-closed
      const VERIFY_TOKEN = Deno.env.get('WHATSAPP_VERIFY_TOKEN');
      
      if (!VERIFY_TOKEN) {
        console.error('[whatsapp-webhook] ❌ WHATSAPP_VERIFY_TOKEN não configurado');
        await supabase.from('security_events').insert({
          event_type: 'WHATSAPP_WEBHOOK_NO_VERIFY_TOKEN',
          severity: 'critical',
          description: 'Verificação de webhook sem WHATSAPP_VERIFY_TOKEN configurado',
          payload: { ip: req.headers.get('x-forwarded-for')?.split(',')[0] }
        });
        return new Response('Configuration error: missing verify token', { status: 500 });
      }

      console.log('🔐 Webhook verification request:', { mode, token: token?.slice(0, 10) + '...', challenge: !!challenge });

      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('✅ Webhook verified successfully!');
        await supabase.from('webhook_diagnostics').insert({
          event_type: 'verification',
          status: 'success',
          metadata: { mode, challenge: !!challenge }
        });
        return new Response(challenge, { status: 200 });
      }

      console.log('❌ Webhook verification failed');
      return new Response('Forbidden', { status: 403 });
    }

    // ==============================================================================
    // POST - Processar Mensagens (COM VALIDAÇÃO HMAC SHA256)
    // ==============================================================================
    if (req.method === 'POST') {
      // ============================================
      // 🛡️ P0.3 - VALIDAÇÃO HMAC SHA256 OBRIGATÓRIA
      // LEI VI: Verificar assinatura do Meta antes de processar
      // ============================================
      const signature = req.headers.get('x-hub-signature-256');
      const appSecret = Deno.env.get('WHATSAPP_APP_SECRET');
      
      // Ler o body como texto para validar assinatura
      const bodyText = await req.text();
      const body = JSON.parse(bodyText);
      
      // Validar assinatura se temos o secret configurado
      if (appSecret && signature) {
        try {
          const encoder = new TextEncoder();
          const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(appSecret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
          );
          
          const signatureBytes = await crypto.subtle.sign(
            'HMAC',
            key,
            encoder.encode(bodyText)
          );
          
          const expectedSignature = 'sha256=' + Array.from(new Uint8Array(signatureBytes))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
          
          // Comparação em tempo constante para evitar timing attacks
          const sigA = signature.toLowerCase();
          const sigB = expectedSignature.toLowerCase();
          
          if (sigA.length !== sigB.length) {
            console.error('[whatsapp-webhook] ❌ Assinatura HMAC inválida (tamanho)');
            await supabase.from('security_events').insert({
              event_type: 'WHATSAPP_WEBHOOK_INVALID_SIGNATURE',
              severity: 'high',
              description: 'Tentativa de webhook com assinatura inválida',
              payload: { ip: req.headers.get('x-forwarded-for')?.split(',')[0] }
            });
            return new Response('Invalid signature', { status: 401 });
          }
          
          let mismatch = 0;
          for (let i = 0; i < sigA.length; i++) {
            mismatch |= sigA.charCodeAt(i) ^ sigB.charCodeAt(i);
          }
          
          if (mismatch !== 0) {
            console.error('[whatsapp-webhook] ❌ Assinatura HMAC não confere');
            await supabase.from('security_events').insert({
              event_type: 'WHATSAPP_WEBHOOK_INVALID_SIGNATURE',
              severity: 'high',
              description: 'Tentativa de webhook com assinatura incorreta',
              payload: { ip: req.headers.get('x-forwarded-for')?.split(',')[0] }
            });
            return new Response('Invalid signature', { status: 401 });
          }
          
          console.log('[whatsapp-webhook] ✅ Assinatura HMAC validada');
        } catch (hmacError) {
          // 🛡️ P0.1 FIX: NUNCA fail-open em validação de assinatura
          console.error('[whatsapp-webhook] ❌ Erro crítico ao validar HMAC:', hmacError);
          await supabase.from('security_events').insert({
            event_type: 'WHATSAPP_WEBHOOK_HMAC_ERROR',
            severity: 'critical',
            description: 'Erro ao processar validação HMAC - rejeitando por segurança',
            payload: { error: String(hmacError), ip: req.headers.get('x-forwarded-for')?.split(',')[0] }
          });
          return new Response('HMAC validation error', { status: 500 });
        }
      } else if (!appSecret) {
        // 🛡️ P0.2 FIX: Se não tem secret configurado, BLOQUEAR (não pular)
        console.error('[whatsapp-webhook] ❌ WHATSAPP_APP_SECRET não configurado - BLOQUEANDO por segurança');
        await supabase.from('security_events').insert({
          event_type: 'WHATSAPP_WEBHOOK_NO_SECRET',
          severity: 'critical',
          description: 'Webhook recebido sem WHATSAPP_APP_SECRET configurado - bloqueado',
          payload: { ip: req.headers.get('x-forwarded-for')?.split(',')[0] }
        });
        return new Response('Configuration error: missing app secret', { status: 500 });
      }
      
      const payloadSize = bodyText.length;
      
      console.log('📩 Webhook received:', JSON.stringify(body, null, 2));

      // Registrar diagnóstico
      await supabase.from('webhook_diagnostics').insert({
        event_type: 'message_received',
        status: 'processing',
        payload_size: payloadSize,
        metadata: { source: body.user_id ? 'manychat' : 'whatsapp_direct' }
      });

      // ==============================================================================
      // DETECTAR FONTE (ManyChat ou WhatsApp Direto)
      // ==============================================================================
      const isManyChat = Boolean(
        body?.user_phone || body?.subscriber_phone || body?.phone ||
        body?.user_id || body?.subscriber_id || body?.full_name
      );

      let fromPhone: string;
      let messageText: string;
      let userName: string;
      let messageId: string;
      let messageType: string = 'text';
      let mediaInfo: any = null;
      let rawPayload = body;
      let toPhone: string = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') || '';

      if (isManyChat) {
        // ==============================================================================
        // PAYLOAD MANYCHAT - EXTRAÇÃO ROBUSTA
        // ==============================================================================
        console.log('📱 ManyChat payload detected');
        
        // Tentar múltiplos campos de telefone
        const phoneFields = [
          body.user_phone,
          body.subscriber_phone, 
          body.phone,
          body.whatsapp_phone,
          body.wa_phone,
          body.celular,
          body.mobile_phone
        ];
        
        fromPhone = '';
        for (const field of phoneFields) {
          if (field && typeof field === 'string' && field.replace(/\D/g, '').length >= 8) {
            fromPhone = normalizePhone(field);
            break;
          }
        }
        
        // Se ainda não tem telefone, usar user_id como identificador alternativo
        const manyChatUserId = body.user_id || body.subscriber_id || '';
        if (!fromPhone && manyChatUserId) {
          // Usar ID do ManyChat como identificador temporário
          fromPhone = `mc_${manyChatUserId}`;
          console.log('📱 Using ManyChat ID as phone fallback:', fromPhone);
        }
        
        messageText = body.user_message || body.last_input_text || body.message || body.text || body.last_text_input || '';
        userName = body.user_name || body.full_name || body.name || body.first_name || 'Lead WhatsApp';
        messageId = `mc_${manyChatUserId || Date.now()}_${Date.now()}`;
        
        console.log(`📲 ManyChat data: phone=${fromPhone}, name=${userName}, userId=${manyChatUserId}, message=${messageText}`);
        
      } else {
        // ==============================================================================
        // PAYLOAD WHATSAPP CLOUD API
        // ==============================================================================
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const messages = value?.messages;

        if (!messages || messages.length === 0) {
          console.log('📭 No messages in payload (might be status update)');
          return new Response(JSON.stringify({ status: 'no_message' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const message = messages[0];
        fromPhone = normalizePhone(message.from);
        messageText = message.text?.body || message.caption || '';
        userName = value?.contacts?.[0]?.profile?.name || 'Usuário WhatsApp';
        messageId = message.id;
        messageType = getMessageType(message);
        mediaInfo = getMediaInfo(message);
        toPhone = value?.metadata?.phone_number_id || '';
      }

      console.log(`📱 Message from ${fromPhone} (${userName}): ${messageText}`);
      console.log(`📎 Type: ${messageType}, HasMedia: ${!!mediaInfo}`);

      // ==============================================================================
      // IDENTIFICAR ADMIN
      // ==============================================================================
      const admin = identifyAdmin(fromPhone, userName);
      const isAdmin = admin !== null;
      
      console.log(`🔐 Admin check: ${isAdmin ? `${admin.name} (${admin.role})` : 'not admin'}`);

      // ==============================================================================
      // OBTER OU CRIAR CONVERSA
      // ==============================================================================
      let { data: conversation } = await supabase
        .from('whatsapp_conversations')
        .select('*')
        .eq('phone', fromPhone)
        .single();

      if (!conversation) {
        console.log('📝 Creating new conversation for', fromPhone);
        const { data: newConv, error } = await supabase
          .from('whatsapp_conversations')
          .insert({
            phone: fromPhone,
            display_name: userName,
            owner_detected: isAdmin,
            owner_name: admin?.name || null,
            session_mode: 'ASSISTOR_OFF',
            crm_stage: 'lead'
          })
          .select()
          .single();
        
        if (error) {
          console.error('Error creating conversation:', error);
        } else {
          conversation = newConv;
          console.log('✅ New conversation created:', conversation.id);
        }
      }

      const conversationId = conversation?.id;

      // ==============================================================================
      // VERIFICAR TRIGGERS E SESSION MODE
      // ==============================================================================
      const lowerMessage = messageText.toLowerCase();
      const hasTrigger = lowerMessage.includes(TRIGGER_KEYWORD);
      const hasEndTrigger = lowerMessage.includes(END_SESSION_KEYWORD);
      
      let sessionMode = conversation?.session_mode || 'ASSISTOR_OFF';
      
      // Verificar timeout de sessão
      if (sessionMode === 'ASSISTOR_ON' && conversation?.session_started_at) {
        const sessionStart = new Date(conversation.session_started_at);
        const hoursSinceStart = (Date.now() - sessionStart.getTime()) / (1000 * 60 * 60);
        if (hoursSinceStart > SESSION_TIMEOUT_HOURS) {
          sessionMode = 'ASSISTOR_OFF';
          await supabase
            .from('whatsapp_conversations')
            .update({ session_mode: 'ASSISTOR_OFF', session_started_at: null })
            .eq('id', conversationId);
          console.log('⏰ Session timeout - mode set to OFF');
        }
      }

      // Ativar modo assessor se trigger detectado e é admin
      if (hasTrigger && isAdmin && sessionMode === 'ASSISTOR_OFF') {
        sessionMode = 'ASSISTOR_ON';
        await supabase
          .from('whatsapp_conversations')
          .update({ 
            session_mode: 'ASSISTOR_ON', 
            session_started_at: new Date().toISOString() 
          })
          .eq('id', conversationId);
        console.log('🎯 Session activated for', admin?.name);
        
        // Enviar mensagem de boas-vindas
        const welcomeMsg = `🎯 Olá, ${admin?.name}! Seu assessor está ativo.\n\nVocê pode:\n• Dizer "Paguei 50 reais de gasolina"\n• Perguntar "Quanto gastei hoje?"\n• Usar /admin para comandos avançados\n\nPara encerrar, diga "encerrar assessor".`;
        await sendWhatsAppMessage(fromPhone, welcomeMsg);
        
        // Salvar mensagem de boas-vindas
        await supabase.from('whatsapp_messages').insert({
          conversation_id: conversationId,
          direction: 'outbound',
          message_id: `welcome_${Date.now()}`,
          message_type: 'text',
          message_text: welcomeMsg,
          from_phone: toPhone,
          to_phone: fromPhone,
          timestamp: new Date().toISOString(),
          handled_by: 'chatgpt_tramon'
        });
      }

      // Encerrar se comando de encerramento
      if (hasEndTrigger && isAdmin && sessionMode === 'ASSISTOR_ON') {
        sessionMode = 'ASSISTOR_OFF';
        await supabase
          .from('whatsapp_conversations')
          .update({ session_mode: 'ASSISTOR_OFF', session_started_at: null })
          .eq('id', conversationId);
        console.log('👋 Session ended by', admin?.name);
      }

      console.log(`📊 Session Mode: ${sessionMode}`);

      // ==============================================================================
      // SALVAR MENSAGEM RECEBIDA
      // ==============================================================================
      const { data: savedMessage, error: msgError } = await supabase
        .from('whatsapp_messages')
        .insert({
          conversation_id: conversationId,
          direction: 'inbound',
          message_id: messageId,
          message_type: messageType,
          message_text: messageText,
          from_phone: fromPhone,
          to_phone: toPhone,
          timestamp: new Date().toISOString(),
          handled_by: sessionMode === 'ASSISTOR_ON' ? 'chatgpt_tramon' : 'system_router',
          trigger_detected: hasTrigger,
          trigger_name: hasTrigger ? TRIGGER_KEYWORD : null,
          raw_payload: rawPayload
        })
        .select()
        .single();

      if (msgError) {
        console.error('Error saving message:', msgError);
      } else {
        console.log('✅ Message saved:', savedMessage?.id);
      }

      // ==============================================================================
      // PROCESSAR ANEXOS (SE HOUVER)
      // ==============================================================================
      if (mediaInfo && !isManyChat) {
        const WHATSAPP_ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
        
        const { data: attachment } = await supabase
          .from('whatsapp_attachments')
          .insert({
            message_id: messageId,
            conversation_id: conversationId,
            attachment_type: mediaInfo.type,
            mime_type: mediaInfo.mimeType,
            sha256: mediaInfo.sha256,
            filename: mediaInfo.filename,
            caption: mediaInfo.caption,
            download_status: 'downloading'
          })
          .select()
          .single();

        if (WHATSAPP_ACCESS_TOKEN && attachment) {
          const mediaData = await downloadMedia(mediaInfo.mediaId, WHATSAPP_ACCESS_TOKEN);
          
          if (mediaData) {
            const ext = mediaInfo.mimeType?.split('/')[1] || 'bin';
            const storagePath = `${conversationId}/${messageId}.${ext}`;
            
            const { error: uploadError } = await supabase.storage
              .from('whatsapp-attachments')
              .upload(storagePath, mediaData.data, {
                contentType: mediaInfo.mimeType,
                upsert: true
              });

            if (uploadError) {
              console.error('Upload error:', uploadError);
              await supabase
                .from('whatsapp_attachments')
                .update({ download_status: 'failed', download_error: uploadError.message })
                .eq('id', attachment.id);
            } else {
              const { data: publicUrl } = supabase.storage
                .from('whatsapp-attachments')
                .getPublicUrl(storagePath);

              await supabase
                .from('whatsapp_attachments')
                .update({
                  storage_path: storagePath,
                  public_url: publicUrl.publicUrl,
                  file_size: mediaData.fileSize,
                  download_status: 'completed'
                })
                .eq('id', attachment.id);
              
              console.log('✅ Attachment saved:', storagePath);
            }
          } else {
            await supabase
              .from('whatsapp_attachments')
              .update({ download_status: 'failed', download_error: 'Download failed' })
              .eq('id', attachment.id);
          }
        }
      }

      // ==============================================================================
      // ATUALIZAR CONVERSA
      // ==============================================================================
      await supabase
        .from('whatsapp_conversations')
        .update({
          last_message_at: new Date().toISOString(),
          unread_count: (conversation?.unread_count || 0) + 1,
          display_name: userName,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      // ==============================================================================
      // GERAR E ENVIAR RESPOSTA
      // ==============================================================================
      let aiResponse: string | null = null;

      // Se modo assessor ativo E é admin
      if (sessionMode === 'ASSISTOR_ON' && isAdmin && !hasTrigger) {
        // Verificar se é comando /admin
        const adminCmd = parseAdminCommand(messageText);
        
        if (adminCmd) {
          aiResponse = await executeAdminCommand(
            supabase, 
            adminCmd, 
            admin!.name, 
            fromPhone, 
            conversationId
          );
        } else {
          // Tentar processar linguagem natural primeiro
          const naturalLangParsed = parseNaturalLanguage(messageText);
          
          if (naturalLangParsed && naturalLangParsed.confidence >= 0.7) {
            console.log('🧠 Natural language detected:', naturalLangParsed);
            aiResponse = await executeNaturalLanguageAction(
              supabase,
              naturalLangParsed,
              admin!.name,
              conversationId
            );
          }
          
          // Se não conseguiu processar linguagem natural, usar AI
          if (!aiResponse) {
            const { data: history } = await supabase
              .from('whatsapp_messages')
              .select('message_text, direction')
              .eq('conversation_id', conversationId)
              .order('timestamp', { ascending: false })
              .limit(10);

            const conversationHistory = (history || []).reverse().map((h: any) => ({
              role: h.direction === 'inbound' ? 'user' : 'assistant',
              content: h.message_text || ''
            }));

            // Buscar dados do sistema para contexto executivo
            const [
              { data: tasks },
              { data: finance },
              { data: todayExpenses }
            ] = await Promise.all([
              supabase.from('command_tasks').select('*').eq('status', 'todo').limit(5),
              supabase.from('command_finance').select('*').eq('status', 'open').limit(5),
              supabase.from('command_finance').select('amount, description').eq('type', 'expense').gte('date', new Date().toISOString().split('T')[0]).limit(5)
            ]);

            const contextData = `
DADOS EM TEMPO REAL:
📋 Tarefas pendentes: ${tasks?.length || 0}
💰 Contas abertas: R$ ${finance?.reduce((s: number, f: any) => s + (f.type === 'payable' ? f.amount : 0), 0)?.toLocaleString('pt-BR') || '0'}
📱 Gastos hoje: R$ ${todayExpenses?.reduce((s: number, e: any) => s + (e.amount || 0), 0)?.toLocaleString('pt-BR') || '0'}
            `.trim();

            const fullPrompt = getExecutivePrompt(admin!.name, admin!.role, contextData);
            aiResponse = await callAI(fullPrompt, messageText, conversationHistory);
          }
        }
      } else if (!isManyChat && !isAdmin) {
        // Modo público - responder apenas se não for ManyChat e não for admin
        aiResponse = await callAI(TRAMON_PUBLIC_PROMPT, messageText);
      }

      // Enviar resposta se houver
      if (aiResponse) {
        const sent = await sendWhatsAppMessage(fromPhone, aiResponse);
        
        if (sent) {
          await supabase.from('whatsapp_messages').insert({
            conversation_id: conversationId,
            direction: 'outbound',
            message_id: `out_${Date.now()}`,
            message_type: 'text',
            message_text: aiResponse,
            from_phone: toPhone,
            to_phone: fromPhone,
            timestamp: new Date().toISOString(),
            handled_by: 'chatgpt_tramon'
          });
          
          console.log('✅ Response sent and saved');
        }
      }

      // Atualizar diagnóstico
      const processingTime = Date.now() - startTime;
      await supabase.from('webhook_diagnostics').insert({
        event_type: 'message_processed',
        status: 'completed',
        processing_time_ms: processingTime,
        metadata: {
          from: fromPhone,
          type: messageType,
          sessionMode,
          isAdmin,
          hadResponse: !!aiResponse,
          source: isManyChat ? 'manychat' : 'whatsapp_direct'
        }
      });

      console.log(`✅ Processing completed in ${processingTime}ms`);

      return new Response(JSON.stringify({ 
        success: true,
        response: aiResponse,
        sessionMode,
        processingTimeMs: processingTime
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response('Method not allowed', { status: 405 });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    
    await supabase.from('webhook_diagnostics').insert({
      event_type: 'error',
      status: 'failed',
      error_message: error instanceof Error ? error.message : 'Unknown error',
      processing_time_ms: Date.now() - startTime
    });

    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
