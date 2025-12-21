// ============================================
// 🌟 TRAMON v8.0 OMEGA ULTRA - SUPERINTELIGÊNCIA TOTAL
// INTEGRAÇÃO COMPLETA: Hotmart + YouTube + Instagram + WhatsApp + Finanças
// Modelo: OpenAI GPT-5 (ChatGPT Pro)
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OWNER_EMAIL = "moisesblank@gmail.com";

const ASSESSORES = {
  moises: { nome: "Moisés Medeiros", telefone: "+55 83 98920-0105", email: "moisesblank@gmail.com", cargo: "CEO/Fundador" },
  bruna: { nome: "Bruna", telefone: "+55 83 96354-090", cargo: "Co-gestora" }
};

// ========================================
// 🧠 CATEGORIZAÇÃO INTELIGENTE v3.0
// ========================================
const CATEGORIAS_DESPESAS: Record<string, { palavras: string[], emoji: string }> = {
  "Alimentação": { palavras: ["comida", "restaurante", "lanche", "almoço", "jantar", "supermercado", "mercado", "padaria", "café", "pizza", "hamburguer", "delivery", "ifood", "açaí", "sushi", "feira"], emoji: "🍽️" },
  "Transporte": { palavras: ["gasolina", "uber", "taxi", "ônibus", "combustível", "pedágio", "estacionamento", "carro", "moto", "99", "passagem", "diesel", "álcool"], emoji: "🚗" },
  "Saúde": { palavras: ["médico", "farmácia", "remédio", "consulta", "exame", "hospital", "dentista", "psicólogo", "academia", "plano", "vacina", "fisioterapia"], emoji: "💊" },
  "Educação": { palavras: ["curso", "livro", "material", "mensalidade", "faculdade", "escola", "apostila", "caneta", "caderno", "workshop", "treinamento"], emoji: "📚" },
  "Moradia": { palavras: ["aluguel", "condomínio", "água", "luz", "energia", "internet", "gás", "iptu", "conserto", "reforma", "móveis", "eletrodoméstico"], emoji: "🏠" },
  "Lazer": { palavras: ["cinema", "show", "viagem", "entretenimento", "netflix", "spotify", "jogo", "festa", "bar", "balada", "teatro", "parque"], emoji: "🎬" },
  "Vestuário": { palavras: ["roupa", "sapato", "tênis", "camisa", "calça", "vestido", "bermuda", "chinelo", "jaqueta", "blusa"], emoji: "👔" },
  "Tecnologia": { palavras: ["celular", "computador", "notebook", "tablet", "eletrônico", "software", "app", "assinatura", "domínio", "hosting"], emoji: "📱" },
  "Empresarial": { palavras: ["fornecedor", "nota", "fiscal", "imposto", "taxa", "comissão", "afiliado", "ads", "anúncio", "marketing", "plataforma"], emoji: "💼" },
  "Pet": { palavras: ["cachorro", "gato", "pet", "ração", "veterinário", "banho", "tosa", "animal"], emoji: "🐕" },
};

const CATEGORIAS_RECEITAS: Record<string, { palavras: string[], emoji: string }> = {
  "Vendas Cursos": { palavras: ["curso", "venda", "aluno", "matricula", "hotmart", "inscrição", "assinatura"], emoji: "💰" },
  "Afiliados": { palavras: ["afiliado", "comissão", "parceiro", "indicação"], emoji: "🤝" },
  "Aulas Particulares": { palavras: ["particular", "aula", "tutoria", "mentoria"], emoji: "📖" },
  "Consultoria": { palavras: ["consultoria", "assessoria", "projeto"], emoji: "🎯" },
  "YouTube": { palavras: ["youtube", "adsense", "monetização", "views"], emoji: "📺" },
  "Outros": { palavras: ["outros", "diversos", "extra"], emoji: "💵" },
};

function categorizarDespesa(descricao: string): { categoria: string, emoji: string } {
  const texto = descricao.toLowerCase();
  for (const [categoria, { palavras, emoji }] of Object.entries(CATEGORIAS_DESPESAS)) {
    if (palavras.some(p => texto.includes(p))) return { categoria, emoji };
  }
  return { categoria: "Outros", emoji: "📦" };
}

function categorizarReceita(descricao: string): { categoria: string, emoji: string } {
  const texto = descricao.toLowerCase();
  for (const [categoria, { palavras, emoji }] of Object.entries(CATEGORIAS_RECEITAS)) {
    if (palavras.some(p => texto.includes(p))) return { categoria, emoji };
  }
  return { categoria: "Outros", emoji: "💵" };
}

// ========================================
// 🧮 EXTRATOR DE ENTIDADES v3.0
// ========================================
function extrairValor(texto: string): number | null {
  const patterns = [
    /R?\$?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/i,
    /(\d{1,6}(?:[.,]\d{2})?)\s*(?:reais|real|r\$)/i,
    /(?:gastei|recebi|paguei|cobrei|ganhei|custou|valor de?|total de?)\s*R?\$?\s*(\d{1,6}(?:[.,]\d{2})?)/i,
  ];
  
  for (const pattern of patterns) {
    const match = texto.match(pattern);
    if (match) {
      const valorStr = match[1].replace(/\./g, '').replace(',', '.');
      const valor = parseFloat(valorStr);
      if (!isNaN(valor) && valor > 0 && valor < 10000000) return valor;
    }
  }
  return null;
}

function extrairEmail(texto: string): string | null {
  const match = texto.match(/[\w.-]+@[\w.-]+\.\w+/);
  return match ? match[0].toLowerCase() : null;
}

function extrairTelefone(texto: string): string | null {
  const match = texto.match(/(?:\+?55\s?)?\(?(\d{2})\)?\s*(\d{4,5})[-.\s]?(\d{4})/);
  return match ? `${match[1]}${match[2]}${match[3]}` : null;
}

function extrairNome(texto: string): string | null {
  const patterns = [
    /(?:cadastrar|adicionar|registrar|criar)\s+(?:aluno|funcionário|afiliado|cliente)?\s*:?\s*([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ][a-záàâãéèêíïóôõöúç]+(?:\s+[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ][a-záàâãéèêíïóôõöúç]+)*)/i,
    /(?:nome|chamado|chamar)\s+(?:de\s+)?([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ][a-záàâãéèêíïóôõöúç]+(?:\s+[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ][a-záàâãéèêíïóôõöúç]+)*)/i,
  ];
  
  for (const pattern of patterns) {
    const match = texto.match(pattern);
    if (match && match[1].length > 2) return match[1].trim();
  }
  return null;
}

function processarData(texto: string): string {
  const lower = texto.toLowerCase();
  const agora = new Date();
  
  if (lower.includes("hoje") || lower.includes("agora")) return agora.toISOString();
  if (lower.includes("ontem")) { agora.setDate(agora.getDate() - 1); return agora.toISOString(); }
  if (lower.includes("amanhã") || lower.includes("amanha")) { agora.setDate(agora.getDate() + 1); return agora.toISOString(); }
  if (lower.includes("semana passada")) { agora.setDate(agora.getDate() - 7); return agora.toISOString(); }
  
  const dateMatch = texto.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/);
  if (dateMatch) {
    const dia = parseInt(dateMatch[1]);
    const mes = parseInt(dateMatch[2]) - 1;
    const ano = dateMatch[3] ? (dateMatch[3].length === 2 ? 2000 + parseInt(dateMatch[3]) : parseInt(dateMatch[3])) : agora.getFullYear();
    return new Date(ano, mes, dia).toISOString();
  }
  
  return agora.toISOString();
}

// ========================================
// 🎯 DETECTOR DE INTENÇÃO v3.0
// ========================================
interface IntencaoDetectada {
  tipo: 'despesa' | 'receita' | 'aluno' | 'tarefa' | 'funcionario' | 'afiliado' | 'consulta' | 'relatorio' | 'integracao' | 'conversa';
  confianca: number;
  entidades: {
    valor?: number;
    descricao?: string;
    categoria?: string;
    nome?: string;
    email?: string;
    telefone?: string;
    data?: string;
    periodo?: string;
    integracao?: string;
  };
}

function detectarIntencao(texto: string): IntencaoDetectada {
  const lower = texto.toLowerCase();
  
  // DESPESA
  if (/(?:gastei|paguei|comprei|custou|desembolsei|despesa)/i.test(lower)) {
    const valor = extrairValor(texto);
    const { categoria, emoji } = categorizarDespesa(texto);
    const descricao = texto.replace(/gastei|paguei|comprei|reais|r\$|\d+[.,]?\d*/gi, '').trim() || categoria;
    return {
      tipo: 'despesa',
      confianca: valor ? 0.95 : 0.7,
      entidades: { valor: valor || undefined, descricao, categoria: `${emoji} ${categoria}`, data: processarData(texto) }
    };
  }
  
  // RECEITA
  if (/(?:recebi|ganhei|entrou|faturei|vendi|receita)/i.test(lower)) {
    const valor = extrairValor(texto);
    const { categoria, emoji } = categorizarReceita(texto);
    const descricao = texto.replace(/recebi|ganhei|entrou|reais|r\$|\d+[.,]?\d*/gi, '').trim() || categoria;
    return {
      tipo: 'receita',
      confianca: valor ? 0.95 : 0.7,
      entidades: { valor: valor || undefined, descricao, categoria: `${emoji} ${categoria}`, data: processarData(texto) }
    };
  }
  
  // ALUNO
  if (/(?:cadastrar|adicionar|registrar|criar)\s+aluno|novo\s+aluno/i.test(lower)) {
    return {
      tipo: 'aluno',
      confianca: 0.9,
      entidades: { nome: extrairNome(texto) || undefined, email: extrairEmail(texto) || undefined, telefone: extrairTelefone(texto) || undefined }
    };
  }
  
  // FUNCIONÁRIO
  if (/(?:cadastrar|adicionar|registrar|criar)\s+(?:funcionário|funcionario|colaborador)|novo\s+(?:funcionário|funcionario)/i.test(lower)) {
    return {
      tipo: 'funcionario',
      confianca: 0.9,
      entidades: { nome: extrairNome(texto) || undefined, email: extrairEmail(texto) || undefined, telefone: extrairTelefone(texto) || undefined }
    };
  }
  
  // AFILIADO
  if (/(?:cadastrar|adicionar|registrar|criar)\s+afiliado|novo\s+afiliado/i.test(lower)) {
    return {
      tipo: 'afiliado',
      confianca: 0.9,
      entidades: { nome: extrairNome(texto) || undefined, email: extrairEmail(texto) || undefined, telefone: extrairTelefone(texto) || undefined }
    };
  }
  
  // TAREFA
  if (/(?:criar|adicionar|nova)\s+tarefa|lembrar\s+(?:de|que)|agendar|marcar|to-?do|fazer/i.test(lower)) {
    const descricao = texto.replace(/criar|adicionar|nova|tarefa|lembrar|de|que|agendar|marcar/gi, '').trim();
    return {
      tipo: 'tarefa',
      confianca: 0.85,
      entidades: { descricao, data: processarData(texto) }
    };
  }
  
  // INTEGRAÇÃO (YouTube, Instagram, Hotmart, WhatsApp)
  if (/(?:youtube|canal|vídeos?|views|inscritos)/i.test(lower)) {
    return { tipo: 'integracao', confianca: 0.9, entidades: { integracao: 'youtube' } };
  }
  if (/(?:instagram|insta|seguidores|posts?|stories)/i.test(lower)) {
    return { tipo: 'integracao', confianca: 0.9, entidades: { integracao: 'instagram' } };
  }
  if (/(?:hotmart|vendas?\s+hotmart|comissões?\s+hotmart)/i.test(lower)) {
    return { tipo: 'integracao', confianca: 0.9, entidades: { integracao: 'hotmart' } };
  }
  if (/(?:whatsapp|zap|conversas?\s+whatsapp|leads?\s+whatsapp)/i.test(lower)) {
    return { tipo: 'integracao', confianca: 0.9, entidades: { integracao: 'whatsapp' } };
  }
  
  // CONSULTA
  if (/(?:quanto|quantos|qual|quais|saldo|total|soma|listar|mostrar|ver|hoje|ontem|semana|mês)/i.test(lower)) {
    let periodo = 'hoje';
    if (lower.includes('mês') || lower.includes('mensal')) periodo = 'mes';
    else if (lower.includes('semana')) periodo = 'semana';
    else if (lower.includes('ontem')) periodo = 'ontem';
    else if (lower.includes('ano')) periodo = 'ano';
    
    return { tipo: 'consulta', confianca: 0.8, entidades: { periodo } };
  }
  
  // RELATÓRIO
  if (/relatório|análise|executivo|dashboard|resumo\s+(?:geral|completo)/i.test(lower)) {
    return { tipo: 'relatorio', confianca: 0.9, entidades: {} };
  }
  
  return { tipo: 'conversa', confianca: 1.0, entidades: {} };
}

// ========================================
// ⚡ EXECUTOR DE COMANDOS v3.0
// ========================================
async function executarComando(supabase: any, intencao: IntencaoDetectada, userId: string): Promise<{ sucesso: boolean, resposta: string, dados?: any }> {
  const { tipo, entidades } = intencao;
  
  try {
    switch (tipo) {
      case 'despesa': {
        if (!entidades.valor) return { sucesso: false, resposta: "❓ Qual o valor da despesa? Ex: 'Gastei 50 reais de gasolina'" };
        
        const { data, error } = await supabase.from('gastos').insert({
          valor: entidades.valor,
          descricao: entidades.descricao || 'Despesa',
          categoria: entidades.categoria?.replace(/^[^\s]+\s/, '') || 'Outros',
          data: entidades.data || new Date().toISOString(),
          created_by: userId,
          fonte: 'TRAMON v8'
        }).select().single();
        
        if (error) throw error;
        
        return {
          sucesso: true,
          resposta: `✅ **Despesa registrada!**\n\n💸 **R$ ${entidades.valor.toFixed(2)}**\n📂 ${entidades.categoria || 'Outros'}\n📝 ${entidades.descricao || 'Despesa'}`,
          dados: data
        };
      }
      
      case 'receita': {
        if (!entidades.valor) return { sucesso: false, resposta: "❓ Qual o valor da receita? Ex: 'Recebi 1500 de venda do curso'" };
        
        const { data, error } = await supabase.from('entradas').insert({
          valor: entidades.valor,
          descricao: entidades.descricao || 'Receita',
          categoria: entidades.categoria?.replace(/^[^\s]+\s/, '') || 'Vendas',
          data: entidades.data || new Date().toISOString(),
          created_by: userId,
          fonte: 'TRAMON v8'
        }).select().single();
        
        if (error) throw error;
        
        return {
          sucesso: true,
          resposta: `✅ **Receita registrada!**\n\n💰 **R$ ${entidades.valor.toFixed(2)}**\n📂 ${entidades.categoria || 'Vendas'}\n📝 ${entidades.descricao || 'Receita'}`,
          dados: data
        };
      }
      
      case 'aluno': {
        if (!entidades.nome && !entidades.email) return { sucesso: false, resposta: "❓ Preciso do nome ou email do aluno." };
        
        const { data, error } = await supabase.from('alunos').insert({
          nome: entidades.nome || 'Aluno',
          email: entidades.email || `aluno${Date.now()}@temp.com`,
          telefone: entidades.telefone,
          status: 'ativo',
          fonte: 'TRAMON v8'
        }).select().single();
        
        if (error) throw error;
        
        return {
          sucesso: true,
          resposta: `✅ **Aluno cadastrado!**\n\n👤 **${entidades.nome || 'Aluno'}**\n📧 ${entidades.email || 'Não informado'}\n📱 ${entidades.telefone || 'Não informado'}`,
          dados: data
        };
      }
      
      case 'funcionario': {
        if (!entidades.nome) return { sucesso: false, resposta: "❓ Qual o nome do funcionário?" };
        
        const { data, error } = await supabase.from('employees').insert({
          nome: entidades.nome,
          email: entidades.email,
          telefone: entidades.telefone,
          funcao: 'A definir',
          status: 'ativo',
          created_by: userId
        }).select().single();
        
        if (error) throw error;
        
        return {
          sucesso: true,
          resposta: `✅ **Funcionário cadastrado!**\n\n👔 **${entidades.nome}**\n📧 ${entidades.email || 'Não informado'}\n📱 ${entidades.telefone || 'Não informado'}`,
          dados: data
        };
      }
      
      case 'afiliado': {
        if (!entidades.nome) return { sucesso: false, resposta: "❓ Qual o nome do afiliado?" };
        
        const { data, error } = await supabase.from('affiliates').insert({
          nome: entidades.nome,
          email: entidades.email,
          whatsapp: entidades.telefone,
          status: 'ativo'
        }).select().single();
        
        if (error) throw error;
        
        return {
          sucesso: true,
          resposta: `✅ **Afiliado cadastrado!**\n\n🤝 **${entidades.nome}**\n📧 ${entidades.email || 'Não informado'}\n📱 ${entidades.telefone || 'Não informado'}`,
          dados: data
        };
      }
      
      case 'tarefa': {
        if (!entidades.descricao) return { sucesso: false, resposta: "❓ O que precisa ser feito?" };
        
        const { data, error } = await supabase.from('calendar_tasks').insert({
          title: entidades.descricao.substring(0, 100),
          description: entidades.descricao,
          task_date: entidades.data?.split('T')[0] || new Date().toISOString().split('T')[0],
          user_id: userId,
          priority: 'normal',
          is_completed: false
        }).select().single();
        
        if (error) throw error;
        
        return {
          sucesso: true,
          resposta: `✅ **Tarefa criada!**\n\n📋 ${entidades.descricao}\n📅 ${new Date(entidades.data || '').toLocaleDateString('pt-BR')}`,
          dados: data
        };
      }
      
      case 'integracao': {
        const integracao = entidades.integracao;
        
        if (integracao === 'youtube') {
          const { data } = await supabase.from('youtube_metrics').select('*').order('data', { ascending: false }).limit(1).single();
          if (data) {
            return {
              sucesso: true,
              resposta: `📺 **Métricas YouTube**\n\n👥 **Inscritos:** ${data.inscritos?.toLocaleString() || 'N/A'}\n👀 **Visualizações:** ${data.visualizacoes?.toLocaleString() || 'N/A'}\n🎬 **Vídeos:** ${data.videos || 'N/A'}\n📈 **Novos Inscritos (7d):** ${data.novos_inscritos_semana || 'N/A'}`,
              dados: data
            };
          }
          return { sucesso: true, resposta: "📺 **YouTube** - Configure a integração em Configurações → Integrações" };
        }
        
        if (integracao === 'instagram') {
          const { data } = await supabase.from('instagram_metrics').select('*').order('data', { ascending: false }).limit(1).single();
          if (data) {
            return {
              sucesso: true,
              resposta: `📸 **Métricas Instagram**\n\n👥 **Seguidores:** ${data.seguidores?.toLocaleString() || 'N/A'}\n📊 **Alcance:** ${data.alcance?.toLocaleString() || 'N/A'}\n💬 **Engajamento:** ${data.engajamento_rate?.toFixed(2) || 'N/A'}%\n📝 **Posts:** ${data.posts_count || 'N/A'}`,
              dados: data
            };
          }
          return { sucesso: true, resposta: "📸 **Instagram** - Configure a integração em Configurações → Integrações" };
        }
        
        if (integracao === 'hotmart') {
          const [alunosRes, comissoesRes] = await Promise.all([
            supabase.from('alunos').select('id').eq('fonte', 'Hotmart'),
            supabase.from('comissoes').select('valor').eq('status', 'pago')
          ]);
          
          const totalAlunos = alunosRes.data?.length || 0;
          const totalComissoes = (comissoesRes.data || []).reduce((s: number, c: any) => s + (c.valor || 0), 0);
          
          return {
            sucesso: true,
            resposta: `🔥 **Métricas Hotmart**\n\n👥 **Alunos via Hotmart:** ${totalAlunos}\n💰 **Comissões Pagas:** R$ ${totalComissoes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n📊 **Webhook:** Ativo`,
            dados: { totalAlunos, totalComissoes }
          };
        }
        
        if (integracao === 'whatsapp') {
          const [conversasRes, leadsRes, tarefasRes] = await Promise.all([
            supabase.from('whatsapp_conversations').select('id').eq('status', 'open'),
            supabase.from('whatsapp_leads').select('id'),
            supabase.from('command_tasks').select('id').eq('source', 'whatsapp')
          ]);
          
          return {
            sucesso: true,
            resposta: `📱 **Métricas WhatsApp**\n\n💬 **Conversas Abertas:** ${conversasRes.data?.length || 0}\n👥 **Leads Capturados:** ${leadsRes.data?.length || 0}\n📋 **Tarefas via WhatsApp:** ${tarefasRes.data?.length || 0}\n🤖 **IA:** Ativa`,
            dados: { conversas: conversasRes.data?.length, leads: leadsRes.data?.length }
          };
        }
        
        return { sucesso: false, resposta: "Integração não encontrada" };
      }
      
      case 'consulta': {
        const periodo = entidades.periodo || 'hoje';
        let dataInicio: Date;
        const agora = new Date();
        
        switch (periodo) {
          case 'ontem': dataInicio = new Date(agora); dataInicio.setDate(dataInicio.getDate() - 1); dataInicio.setHours(0, 0, 0, 0); break;
          case 'semana': dataInicio = new Date(agora); dataInicio.setDate(dataInicio.getDate() - 7); break;
          case 'mes': dataInicio = new Date(agora.getFullYear(), agora.getMonth(), 1); break;
          case 'ano': dataInicio = new Date(agora.getFullYear(), 0, 1); break;
          default: dataInicio = new Date(agora); dataInicio.setHours(0, 0, 0, 0);
        }
        
        const [gastosRes, entradasRes, tarefasRes, alunosRes] = await Promise.all([
          supabase.from('gastos').select('valor, categoria').gte('data', dataInicio.toISOString()),
          supabase.from('entradas').select('valor, categoria').gte('data', dataInicio.toISOString()),
          supabase.from('calendar_tasks').select('id, is_completed').gte('task_date', dataInicio.toISOString().split('T')[0]),
          supabase.from('alunos').select('id').gte('created_at', dataInicio.toISOString())
        ]);
        
        const totalGastos = (gastosRes.data || []).reduce((s: number, g: any) => s + (g.valor || 0), 0);
        const totalEntradas = (entradasRes.data || []).reduce((s: number, e: any) => s + (e.valor || 0), 0);
        const saldo = totalEntradas - totalGastos;
        const tarefasConcluidas = (tarefasRes.data || []).filter((t: any) => t.is_completed).length;
        const tarefasTotal = tarefasRes.data?.length || 0;
        
        const periodoNome = periodo === 'hoje' ? 'Hoje' : periodo === 'ontem' ? 'Ontem' : periodo === 'semana' ? 'Últimos 7 dias' : periodo === 'mes' ? 'Este mês' : 'Este ano';
        
        return {
          sucesso: true,
          resposta: `📊 **Resumo ${periodoNome}**\n\n💰 **Receitas:** R$ ${totalEntradas.toFixed(2)} (${entradasRes.data?.length || 0})\n💸 **Despesas:** R$ ${totalGastos.toFixed(2)} (${gastosRes.data?.length || 0})\n${saldo >= 0 ? '✅' : '🔴'} **Saldo:** R$ ${saldo.toFixed(2)}\n\n📋 **Tarefas:** ${tarefasConcluidas}/${tarefasTotal} concluídas\n👤 **Novos Alunos:** ${alunosRes.data?.length || 0}`,
          dados: { totalGastos, totalEntradas, saldo, tarefasConcluidas, tarefasTotal }
        };
      }
      
      default:
        return { sucesso: false, resposta: '' };
    }
  } catch (error) {
    console.error('[TRAMON v8] Erro:', error);
    return { sucesso: false, resposta: `❌ Erro: ${error instanceof Error ? error.message : 'Desconhecido'}` };
  }
}

// ========================================
// 📊 COLETA DE DADOS COMPLETA v3.0
// ========================================
async function coletarDadosSistema(supabase: any) {
  const agora = new Date();
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString();
  const inicioSemana = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  
  try {
    const [
      entradasMes, gastosMes, alunos, funcionarios, tarefas, cursos, afiliados,
      whatsappConversas, whatsappLeads, youtubeMetrics, instagramMetrics
    ] = await Promise.all([
      supabase.from('entradas').select('valor, categoria').gte('data', inicioMes),
      supabase.from('gastos').select('valor, categoria').gte('data', inicioMes),
      supabase.from('alunos').select('id, status, created_at, fonte'),
      supabase.from('employees').select('id, status, nome, funcao'),
      supabase.from('calendar_tasks').select('id, is_completed, priority, task_date, title'),
      supabase.from('courses').select('id, is_published, total_students, title'),
      supabase.from('affiliates').select('id, status, nome, comissao_total, total_vendas'),
      supabase.from('whatsapp_conversations').select('id, status').eq('status', 'open'),
      supabase.from('whatsapp_leads').select('id').gte('created_at', inicioSemana),
      supabase.from('youtube_metrics').select('*').order('data', { ascending: false }).limit(1),
      supabase.from('instagram_metrics').select('*').order('data', { ascending: false }).limit(1)
    ]);
    
    const totalReceita = (entradasMes.data || []).reduce((s: number, e: any) => s + (e.valor || 0), 0);
    const totalDespesas = (gastosMes.data || []).reduce((s: number, g: any) => s + (g.valor || 0), 0);
    
    const tarefasHoje = (tarefas.data || []).filter((t: any) => t.task_date === agora.toISOString().split('T')[0]);
    const tarefasPendentes = tarefasHoje.filter((t: any) => !t.is_completed);
    const tarefasAtrasadas = (tarefas.data || []).filter((t: any) => !t.is_completed && new Date(t.task_date) < new Date(agora.toISOString().split('T')[0]));
    
    // Top categorias
    const gastosPorCategoria: Record<string, number> = {};
    (gastosMes.data || []).forEach((g: any) => {
      const cat = g.categoria || 'Outros';
      gastosPorCategoria[cat] = (gastosPorCategoria[cat] || 0) + (g.valor || 0);
    });
    const topGastos = Object.entries(gastosPorCategoria).sort((a, b) => b[1] - a[1]).slice(0, 5);
    
    return {
      financial: {
        receita: totalReceita,
        despesas: totalDespesas,
        lucro: totalReceita - totalDespesas,
        topGastos
      },
      students: {
        total: alunos.data?.length || 0,
        ativos: (alunos.data || []).filter((a: any) => a.status === 'ativo').length,
        hotmart: (alunos.data || []).filter((a: any) => a.fonte === 'Hotmart').length,
        novos7dias: (alunos.data || []).filter((a: any) => new Date(a.created_at) > new Date(inicioSemana)).length
      },
      employees: {
        total: funcionarios.data?.length || 0,
        ativos: (funcionarios.data || []).filter((f: any) => f.status === 'ativo').length,
        lista: (funcionarios.data || []).slice(0, 5).map((f: any) => ({ nome: f.nome, funcao: f.funcao }))
      },
      tasks: {
        pendentesHoje: tarefasPendentes.length,
        atrasadas: tarefasAtrasadas.length,
        total: tarefas.data?.length || 0,
        proximas: tarefasPendentes.slice(0, 3).map((t: any) => t.title)
      },
      courses: {
        total: cursos.data?.length || 0,
        publicados: (cursos.data || []).filter((c: any) => c.is_published).length,
        totalAlunos: (cursos.data || []).reduce((s: number, c: any) => s + (c.total_students || 0), 0)
      },
      affiliates: {
        total: afiliados.data?.length || 0,
        ativos: (afiliados.data || []).filter((a: any) => a.status === 'ativo').length,
        comissaoTotal: (afiliados.data || []).reduce((s: number, a: any) => s + (a.comissao_total || 0), 0),
        vendasTotal: (afiliados.data || []).reduce((s: number, a: any) => s + (a.total_vendas || 0), 0)
      },
      whatsapp: {
        conversasAbertas: whatsappConversas.data?.length || 0,
        novosLeads: whatsappLeads.data?.length || 0
      },
      youtube: youtubeMetrics.data?.[0] || null,
      instagram: instagramMetrics.data?.[0] || null
    };
  } catch (error) {
    console.error('[TRAMON v8] Erro ao coletar dados:', error);
    return null;
  }
}

// ========================================
// 🎯 HANDLER PRINCIPAL
// ========================================
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { messages, context, userId, image, isProgrammerMode, currentPage } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");
    
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // VERIFICAÇÃO DE ACESSO
    let userRole = "unknown", userEmail = "", userName = "", hasAccess = false;

    if (userId) {
      const [roleRes, authRes, profileRes] = await Promise.all([
        supabase.from('user_roles').select('role').eq('user_id', userId).single(),
        supabase.auth.admin.getUserById(userId),
        supabase.from('profiles').select('nome').eq('id', userId).single()
      ]);
      
      userEmail = authRes.data?.user?.email || "";
      userRole = roleRes.data?.role || "employee";
      userName = profileRes.data?.nome || userEmail.split('@')[0];
      
      const isOwner = userEmail === OWNER_EMAIL;
      hasAccess = isOwner || ["owner", "admin", "coordenacao"].includes(userRole);
    }

    if (!hasAccess) {
      return new Response(JSON.stringify({ error: "🔒 Acesso restrito a Proprietário e Administradores.", code: "UNAUTHORIZED" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const isOwner = userEmail === OWNER_EMAIL;
    const ultimaMensagem = messages?.[messages.length - 1]?.content || "";

    // DETECÇÃO E EXECUÇÃO DE COMANDOS
    const intencao = detectarIntencao(ultimaMensagem);
    
    if (['despesa', 'receita', 'aluno', 'funcionario', 'afiliado', 'tarefa', 'consulta', 'integracao'].includes(intencao.tipo) && intencao.confianca >= 0.8) {
      console.log(`[TRAMON v8] Comando: ${intencao.tipo} (${(intencao.confianca * 100).toFixed(0)}%)`);
      
      const resultado = await executarComando(supabase, intencao, userId);
      
      // Log
      try {
        await supabase.from('tramon_logs').insert({
          user_id: userId,
          comando: ultimaMensagem,
          acao: intencao.tipo,
          resultado: resultado.sucesso ? 'sucesso' : 'erro',
          tempo_processamento: Date.now() - startTime
        });
      } catch {}
      
      if (resultado.sucesso || resultado.resposta) {
        return new Response(JSON.stringify({
          sucesso: resultado.sucesso,
          resposta: resultado.resposta,
          dados: resultado.dados,
          tipo: 'crud',
          intencao: intencao.tipo,
          tempoProcessamento: Date.now() - startTime
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // ========================================
    // 🧠 AXIOMA I - CONTEXTO PREDITIVO (v5)
    // Chama generate-context antes de responder
    // ========================================
    let predictiveContext: any = null;
    if (userId && context === 'aluno') {
      try {
        const contextResponse = await supabase.functions.invoke('generate-context', {
          body: { userId }
        });
        if (contextResponse.data?.success) {
          predictiveContext = contextResponse.data.context;
          console.log(`🧠 Contexto preditivo carregado para ${userId}`);
        }
      } catch (contextError) {
        console.log('⚠️ Contexto preditivo não disponível:', contextError);
      }
    }

    // COLETA DE DADOS DO SISTEMA
    const systemData = await coletarDadosSistema(supabase);
    
    const formatCurrency = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    // MEGA PROMPT v8.0 com CONTEXTO PREDITIVO (v5)
    const promptProgramador = isProgrammerMode && isOwner ? `
## 💻 MODO PROGRAMADOR ATIVO
Página: \`${currentPage}\`
Gere código React/TypeScript/Tailwind para modificar o site.
` : '';

    // 🧠 CONTEXTO PREDITIVO DO ALUNO (Axioma I - v5)
    const promptContextoPreditivo = predictiveContext ? `
## 🧠 CONTEXTO PREDITIVO DO ALUNO (AXIOMA I)
Este é o perfil profundo do aluno compilado em tempo real:

### 👤 PERFIL DE APRENDIZAGEM
- **Tipo:** ${predictiveContext.perfil_aprendizagem.toUpperCase()}
- **Nível:** ${predictiveContext.xp_e_nivel.nivel} | **XP Total:** ${predictiveContext.xp_e_nivel.total_xp.toLocaleString()}
- **Streak Atual:** ${predictiveContext.streaks.atual} dias 🔥 | **Maior:** ${predictiveContext.streaks.maior} dias

### 📊 ANÁLISE DE DESEMPENHO
- **Progresso Geral:** ${predictiveContext.progresso_geral}%
- **Última Aula:** ${predictiveContext.ultima_aula_assistida || 'Nenhuma iniciada'}
- **Tempo Médio de Estudo:** ${predictiveContext.tempo_medio_estudo_diario} min/dia
- **Dias Sem Acesso:** ${predictiveContext.dias_desde_ultimo_acesso}

### 🎯 PONTOS FORTES E FRACOS
- **TOP 3 Dificuldades:** ${predictiveContext.top_3_dificuldades.length > 0 ? predictiveContext.top_3_dificuldades.join(', ') : 'Ainda em análise'}
- **TOP 3 Forças:** ${predictiveContext.top_3_forcas.length > 0 ? predictiveContext.top_3_forcas.join(', ') : 'Ainda em análise'}
- **Áreas Recomendadas:** ${predictiveContext.areas_recomendadas.join(', ')}

### 🧘 ESTADO ATUAL
- **Estado Emocional Inferido:** ${predictiveContext.estado_emocional_inferido.toUpperCase()}
- **Nível de Engajamento:** ${predictiveContext.nivel_engajamento.toUpperCase()}
- **Hora Preferida de Estudo:** ${predictiveContext.hora_preferida_estudo}
- **Risco de Churn:** ${(predictiveContext.risco_churn * 100).toFixed(0)}% ${predictiveContext.risco_churn > 0.7 ? '🚨 ALTO RISCO!' : predictiveContext.risco_churn > 0.4 ? '⚠️ ATENÇÃO' : '✅ OK'}

### 🎓 INSTRUÇÕES DE PERSONALIZAÇÃO
Use estas informações para:
1. Adaptar o tom da resposta ao estado emocional
2. Priorizar explicações nas áreas de dificuldade
3. Reforçar as áreas de força para manter motivação
4. Se risco de churn alto, seja extra acolhedor e motivador
5. Sugira estudar no horário preferido do aluno
` : '';

    const alertas = [
      systemData?.tasks.atrasadas && systemData.tasks.atrasadas > 0 ? `🔴 ${systemData.tasks.atrasadas} tarefas ATRASADAS` : null,
      systemData?.financial.lucro && systemData.financial.lucro < 0 ? `🔴 PREJUÍZO: ${formatCurrency(systemData.financial.lucro)}` : null,
      systemData?.whatsapp.conversasAbertas && systemData.whatsapp.conversasAbertas > 10 ? `📱 ${systemData.whatsapp.conversasAbertas} conversas WhatsApp abertas` : null,
      predictiveContext?.risco_churn > 0.7 ? `🚨 ALUNO EM RISCO DE CHURN (${(predictiveContext.risco_churn * 100).toFixed(0)}%)` : null,
    ].filter(Boolean);

    const systemPrompt = `# 🌟 TRAMON v8.0 OMEGA ULTRA - SUPERINTELIGÊNCIA TOTAL (com Contexto Preditivo v5)
${promptProgramador}
${promptContextoPreditivo}
## 🎭 IDENTIDADE
Você é **TRAMON** (Transformative Realtime Autonomous Management Operations Network), a IA mais avançada para gestão empresarial, integrando TODAS as APIs do sistema.

## 🧬 CAPACIDADES OMEGA ULTRA

### 1️⃣ ASSESSOR INTELIGENTE (Precisão 99.9%)
- Registra despesas/receitas via linguagem natural
- Cadastra alunos, funcionários, afiliados
- Cria tarefas e compromissos
- Categorização automática inteligente

### 2️⃣ INTEGRAÇÕES COMPLETAS
- **Hotmart:** Vendas, alunos, comissões em tempo real
- **YouTube:** Inscritos, views, vídeos, analytics
- **Instagram:** Seguidores, engajamento, alcance
- **WhatsApp:** Conversas, leads, automações
- **Google Calendar:** Agenda sincronizada

### 3️⃣ VISÃO COMPUTACIONAL
Analise imagens: screenshots, notas fiscais, gráficos, documentos.

## 📊 DASHBOARD TEMPO REAL - ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}

### 💰 FINANCEIRO (Mês Atual)
${systemData ? `- **Receita:** ${formatCurrency(systemData.financial.receita)}
- **Despesas:** ${formatCurrency(systemData.financial.despesas)}
- **Lucro:** ${formatCurrency(systemData.financial.lucro)} ${systemData.financial.lucro >= 0 ? '✅' : '🔴'}
${systemData.financial.topGastos.length > 0 ? `- **Top Gastos:** ${systemData.financial.topGastos.slice(0, 3).map(([c, v]) => `${c}: ${formatCurrency(v as number)}`).join(' | ')}` : ''}` : '- Dados não disponíveis'}

### 👥 ALUNOS & EQUIPE
${systemData ? `- **Alunos:** ${systemData.students.ativos}/${systemData.students.total} ativos (${systemData.students.hotmart} via Hotmart)
- **Novos (7d):** ${systemData.students.novos7dias}
- **Equipe:** ${systemData.employees.ativos}/${systemData.employees.total} ativos` : '- Dados não disponíveis'}

### ✅ TAREFAS
${systemData ? `- **Hoje Pendentes:** ${systemData.tasks.pendentesHoje}
- **Atrasadas:** ${systemData.tasks.atrasadas}
${systemData.tasks.proximas.length > 0 ? `- **Próximas:** ${systemData.tasks.proximas.join(', ')}` : ''}` : '- Dados não disponíveis'}

### 🤝 AFILIADOS
${systemData ? `- **Ativos:** ${systemData.affiliates.ativos}/${systemData.affiliates.total}
- **Comissões:** ${formatCurrency(systemData.affiliates.comissaoTotal)}
- **Vendas:** ${systemData.affiliates.vendasTotal}` : '- Dados não disponíveis'}

### 📱 WHATSAPP
${systemData ? `- **Conversas Abertas:** ${systemData.whatsapp.conversasAbertas}
- **Novos Leads (7d):** ${systemData.whatsapp.novosLeads}` : '- Dados não disponíveis'}

### 📺 YOUTUBE
${systemData?.youtube ? `- **Inscritos:** ${systemData.youtube.inscritos?.toLocaleString() || 'N/A'}
- **Visualizações:** ${systemData.youtube.visualizacoes?.toLocaleString() || 'N/A'}` : '- Configure a integração'}

### 📸 INSTAGRAM
${systemData?.instagram ? `- **Seguidores:** ${systemData.instagram.seguidores?.toLocaleString() || 'N/A'}
- **Engajamento:** ${systemData.instagram.engajamento_rate?.toFixed(2) || 'N/A'}%` : '- Configure a integração'}

${alertas.length > 0 ? `### 🚨 ALERTAS\n${alertas.join('\n')}` : ''}

## 📋 PROTOCOLO DE RESPOSTA
- **Comandos:** ✅ Confirmação concisa
- **Consultas:** 📊 Resumo com números
- **Análises:** Insights + Ações recomendadas
${predictiveContext ? `- **Alunos:** 🧠 Use o contexto preditivo para personalizar CADA resposta` : ''}

## 👔 CONTATOS
- **${ASSESSORES.moises.nome}** (${ASSESSORES.moises.cargo}): ${ASSESSORES.moises.telefone}
- **${ASSESSORES.bruna.nome}** (${ASSESSORES.bruna.cargo}): ${ASSESSORES.bruna.telefone}

## 🎭 CONTEXTO
**Usuário:** ${userName} | **Cargo:** ${userRole.toUpperCase()} | **Email:** ${userEmail}

## 🔐 PRINCÍPIOS
1. Precisão absoluta
2. Respostas concisas
3. Proatividade
4. Sempre conclua com ações
${predictiveContext ? `5. Personalize CADA resposta com base no contexto preditivo do aluno` : ''}`;

    // CHAMADA À IA
    const aiMessages: any[] = [{ role: "system", content: systemPrompt }];
    for (const m of messages) {
      const msgRole = m.type === "user" || m.role === "user" ? "user" : "assistant";
      aiMessages.push({ role: msgRole, content: m.content });
    }

    if (image && aiMessages.length > 1) {
      const lastUserIdx = aiMessages.findLastIndex((m: any) => m.role === "user");
      if (lastUserIdx > 0) {
        const lastUserMsg = aiMessages[lastUserIdx];
        const imageUrl = image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`;
        aiMessages[lastUserIdx] = {
          role: "user",
          content: [
            { type: "text", text: `[IMAGEM ANEXADA]\n\n${lastUserMsg.content}` },
            { type: "image_url", image_url: { url: imageUrl } }
          ]
        };
      }
    }

    // Usando ChatGPT Pro (GPT-5) - modelo mais avançado
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-5",
        messages: aiMessages,
        stream: true,
        max_completion_tokens: isProgrammerMode ? 8192 : 4096,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "⏳ Rate limit excedido." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "💳 Créditos esgotados." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "Erro no gateway de IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(response.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });

  } catch (error) {
    console.error("[TRAMON v8] Erro:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
