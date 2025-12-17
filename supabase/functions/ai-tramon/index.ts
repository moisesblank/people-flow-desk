// ============================================
// 🌟 TRAMON v7.0 OMEGA - SUPERINTELIGÊNCIA DEFINITIVA
// A FUSÃO PERFEITA: IA + ASSESSOR + AUTOMAÇÃO
// Modelo: Gemini 2.5 Pro (Multimodal)
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ========================================
// 🎭 CONFIGURAÇÃO AVANÇADA
// ========================================
const OWNER_EMAIL = "moisesblank@gmail.com";

const ASSESSORES = {
  moises: { nome: "Moisés Medeiros", telefone: "+55 83 98920-0105", email: "moisesblank@gmail.com", cargo: "CEO/Fundador" },
  bruna: { nome: "Bruna", telefone: "+55 83 96354-090", cargo: "Co-gestora" }
};

// ========================================
// 🧠 CATEGORIZAÇÃO INTELIGENTE v2.0
// ========================================
const CATEGORIAS_DESPESAS: Record<string, { palavras: string[], emoji: string }> = {
  "🍽️ Alimentação": { palavras: ["comida", "restaurante", "lanche", "almoço", "jantar", "supermercado", "mercado", "padaria", "café", "pizza", "hamburguer", "delivery", "ifood", "açaí", "sushi"], emoji: "🍽️" },
  "🚗 Transporte": { palavras: ["gasolina", "uber", "taxi", "ônibus", "combustível", "pedágio", "estacionamento", "carro", "moto", "99", "passagem", "diesel", "álcool"], emoji: "🚗" },
  "💊 Saúde": { palavras: ["médico", "farmácia", "remédio", "consulta", "exame", "hospital", "dentista", "psicólogo", "academia", "plano", "vacina", "fisioterapia"], emoji: "💊" },
  "📚 Educação": { palavras: ["curso", "livro", "material", "mensalidade", "faculdade", "escola", "apostila", "caneta", "caderno", "workshop", "treinamento"], emoji: "📚" },
  "🏠 Moradia": { palavras: ["aluguel", "condomínio", "água", "luz", "energia", "internet", "gás", "iptu", "conserto", "reforma", "móveis", "eletrodoméstico"], emoji: "🏠" },
  "🎬 Lazer": { palavras: ["cinema", "show", "viagem", "entretenimento", "netflix", "spotify", "jogo", "festa", "bar", "balada", "teatro", "parque"], emoji: "🎬" },
  "👔 Vestuário": { palavras: ["roupa", "sapato", "tênis", "camisa", "calça", "vestido", "bermuda", "chinelo", "jaqueta", "blusa"], emoji: "👔" },
  "📱 Tecnologia": { palavras: ["celular", "computador", "notebook", "tablet", "eletrônico", "software", "app", "assinatura", "domínio", "hosting"], emoji: "📱" },
  "💼 Empresarial": { palavras: ["fornecedor", "nota", "fiscal", "imposto", "taxa", "comissão", "afiliado", "ads", "anúncio", "marketing", "plataforma"], emoji: "💼" },
};

const CATEGORIAS_RECEITAS: Record<string, { palavras: string[], emoji: string }> = {
  "💰 Vendas Cursos": { palavras: ["curso", "venda", "aluno", "matricula", "hotmart", "inscrição"], emoji: "💰" },
  "🤝 Afiliados": { palavras: ["afiliado", "comissão", "parceiro", "indicação"], emoji: "🤝" },
  "📖 Aulas Particulares": { palavras: ["particular", "aula", "tutoria", "mentoria"], emoji: "📖" },
  "🎯 Consultoria": { palavras: ["consultoria", "assessoria", "projeto"], emoji: "🎯" },
  "💵 Outros": { palavras: ["outros", "diversos", "extra"], emoji: "💵" },
};

function categorizarDespesa(descricao: string): { categoria: string, emoji: string } {
  const texto = descricao.toLowerCase();
  for (const [categoria, { palavras, emoji }] of Object.entries(CATEGORIAS_DESPESAS)) {
    if (palavras.some(p => texto.includes(p))) {
      return { categoria: categoria.replace(/^[^\s]+\s/, ''), emoji };
    }
  }
  return { categoria: "Outros", emoji: "📦" };
}

function categorizarReceita(descricao: string): { categoria: string, emoji: string } {
  const texto = descricao.toLowerCase();
  for (const [categoria, { palavras, emoji }] of Object.entries(CATEGORIAS_RECEITAS)) {
    if (palavras.some(p => texto.includes(p))) {
      return { categoria: categoria.replace(/^[^\s]+\s/, ''), emoji };
    }
  }
  return { categoria: "Outros", emoji: "💵" };
}

// ========================================
// 🧮 EXTRATOR DE ENTIDADES AVANÇADO
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
// 🎯 DETECTOR DE INTENÇÃO v2.0
// ========================================
interface IntencaoDetectada {
  tipo: 'despesa' | 'receita' | 'aluno' | 'tarefa' | 'consulta' | 'relatorio' | 'conversa';
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
  };
}

function detectarIntencao(texto: string): IntencaoDetectada {
  const lower = texto.toLowerCase();
  
  // DESPESA (prioridade alta)
  const padroesDespesa = [
    /(?:gastei|paguei|comprei|custou|desembolsei)/i,
    /despesa\s+(?:de|com)/i,
    /(?:pagamento|conta)\s+(?:de|do|da)/i,
  ];
  
  if (padroesDespesa.some(p => p.test(lower))) {
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
  const padroesReceita = [
    /(?:recebi|ganhei|entrou|faturei|vendi)/i,
    /receita\s+(?:de|com)/i,
    /(?:venda|entrada)\s+(?:de|do|da)/i,
  ];
  
  if (padroesReceita.some(p => p.test(lower))) {
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
  const padroesAluno = [
    /(?:cadastrar|adicionar|registrar|criar)\s+aluno/i,
    /novo\s+aluno/i,
    /aluno\s+(?:chamado|nome)/i,
  ];
  
  if (padroesAluno.some(p => p.test(lower))) {
    return {
      tipo: 'aluno',
      confianca: 0.9,
      entidades: { 
        nome: extrairNome(texto) || undefined,
        email: extrairEmail(texto) || undefined,
        telefone: extrairTelefone(texto) || undefined
      }
    };
  }
  
  // TAREFA
  const padroesTarefa = [
    /(?:criar|adicionar|nova)\s+tarefa/i,
    /lembrar\s+(?:de|que)/i,
    /(?:agendar|marcar)\s+/i,
    /to-?do|fazer/i,
  ];
  
  if (padroesTarefa.some(p => p.test(lower))) {
    const descricao = texto.replace(/criar|adicionar|nova|tarefa|lembrar|de|que|agendar|marcar/gi, '').trim();
    return {
      tipo: 'tarefa',
      confianca: 0.85,
      entidades: { descricao, data: processarData(texto) }
    };
  }
  
  // CONSULTA
  const padroesConsulta = [
    /(?:quanto|quantos|qual|quais)\s+/i,
    /(?:saldo|total|soma)\s+(?:de|do|da)?/i,
    /(?:listar|mostrar|ver)\s+/i,
    /(?:hoje|ontem|semana|mês)/i,
  ];
  
  if (padroesConsulta.some(p => p.test(lower))) {
    let periodo = 'hoje';
    if (lower.includes('mês') || lower.includes('mensal')) periodo = 'mes';
    else if (lower.includes('semana')) periodo = 'semana';
    else if (lower.includes('ontem')) periodo = 'ontem';
    else if (lower.includes('ano')) periodo = 'ano';
    
    return {
      tipo: 'consulta',
      confianca: 0.8,
      entidades: { periodo }
    };
  }
  
  // RELATÓRIO
  if (lower.includes('relatório') || lower.includes('análise') || lower.includes('executivo')) {
    return { tipo: 'relatorio', confianca: 0.9, entidades: {} };
  }
  
  // CONVERSA (fallback)
  return { tipo: 'conversa', confianca: 1.0, entidades: {} };
}

// ========================================
// ⚡ EXECUTOR DE COMANDOS v2.0
// ========================================
async function executarComando(supabase: any, intencao: IntencaoDetectada, userId: string): Promise<{ sucesso: boolean, resposta: string, dados?: any }> {
  const { tipo, entidades } = intencao;
  
  try {
    switch (tipo) {
      case 'despesa': {
        if (!entidades.valor) {
          return { sucesso: false, resposta: "❓ Qual o valor da despesa? Ex: 'Gastei 50 reais de gasolina'" };
        }
        
        const { data, error } = await supabase.from('gastos').insert({
          valor: entidades.valor,
          descricao: entidades.descricao || 'Despesa',
          categoria: entidades.categoria?.replace(/^[^\s]+\s/, '') || 'Outros',
          data: entidades.data || new Date().toISOString(),
          created_by: userId,
          fonte: 'TRAMON v7'
        }).select().single();
        
        if (error) throw error;
        
        return {
          sucesso: true,
          resposta: `✅ **Despesa registrada!**\n\n💸 **R$ ${entidades.valor.toFixed(2)}**\n📂 ${entidades.categoria || 'Outros'}\n📝 ${entidades.descricao || 'Despesa'}\n⏰ ${new Date(entidades.data || '').toLocaleDateString('pt-BR')}`,
          dados: data
        };
      }
      
      case 'receita': {
        if (!entidades.valor) {
          return { sucesso: false, resposta: "❓ Qual o valor da receita? Ex: 'Recebi 1500 de venda do curso'" };
        }
        
        const { data, error } = await supabase.from('entradas').insert({
          valor: entidades.valor,
          descricao: entidades.descricao || 'Receita',
          categoria: entidades.categoria?.replace(/^[^\s]+\s/, '') || 'Vendas',
          data: entidades.data || new Date().toISOString(),
          created_by: userId,
          fonte: 'TRAMON v7'
        }).select().single();
        
        if (error) throw error;
        
        return {
          sucesso: true,
          resposta: `✅ **Receita registrada!**\n\n💰 **R$ ${entidades.valor.toFixed(2)}**\n📂 ${entidades.categoria || 'Vendas'}\n📝 ${entidades.descricao || 'Receita'}`,
          dados: data
        };
      }
      
      case 'aluno': {
        if (!entidades.nome && !entidades.email) {
          return { sucesso: false, resposta: "❓ Preciso do nome ou email do aluno. Ex: 'Cadastrar aluno João Silva, email joao@email.com'" };
        }
        
        const { data, error } = await supabase.from('alunos').insert({
          nome: entidades.nome || 'Aluno',
          email: entidades.email || `aluno${Date.now()}@temp.com`,
          telefone: entidades.telefone,
          status: 'ativo',
          fonte: 'TRAMON v7'
        }).select().single();
        
        if (error) throw error;
        
        return {
          sucesso: true,
          resposta: `✅ **Aluno cadastrado!**\n\n👤 **${entidades.nome || 'Aluno'}**\n📧 ${entidades.email || 'Email não informado'}\n📱 ${entidades.telefone || 'Telefone não informado'}`,
          dados: data
        };
      }
      
      case 'tarefa': {
        if (!entidades.descricao) {
          return { sucesso: false, resposta: "❓ O que precisa ser feito? Ex: 'Criar tarefa: Revisar relatório financeiro'" };
        }
        
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
      
      case 'consulta': {
        const periodo = entidades.periodo || 'hoje';
        let dataInicio: Date;
        const agora = new Date();
        
        switch (periodo) {
          case 'ontem':
            dataInicio = new Date(agora);
            dataInicio.setDate(dataInicio.getDate() - 1);
            dataInicio.setHours(0, 0, 0, 0);
            break;
          case 'semana':
            dataInicio = new Date(agora);
            dataInicio.setDate(dataInicio.getDate() - 7);
            break;
          case 'mes':
            dataInicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
            break;
          case 'ano':
            dataInicio = new Date(agora.getFullYear(), 0, 1);
            break;
          default: // hoje
            dataInicio = new Date(agora);
            dataInicio.setHours(0, 0, 0, 0);
        }
        
        const [gastosRes, entradasRes] = await Promise.all([
          supabase.from('gastos').select('valor, categoria, descricao').gte('data', dataInicio.toISOString()),
          supabase.from('entradas').select('valor, categoria, descricao').gte('data', dataInicio.toISOString())
        ]);
        
        const totalGastos = (gastosRes.data || []).reduce((sum: number, g: any) => sum + (g.valor || 0), 0);
        const totalEntradas = (entradasRes.data || []).reduce((sum: number, e: any) => sum + (e.valor || 0), 0);
        const saldo = totalEntradas - totalGastos;
        
        const periodoNome = periodo === 'hoje' ? 'Hoje' : periodo === 'ontem' ? 'Ontem' : periodo === 'semana' ? 'Últimos 7 dias' : periodo === 'mes' ? 'Este mês' : 'Este ano';
        
        return {
          sucesso: true,
          resposta: `📊 **Resumo Financeiro - ${periodoNome}**\n\n💰 **Receitas:** R$ ${totalEntradas.toFixed(2)} (${entradasRes.data?.length || 0} registros)\n💸 **Despesas:** R$ ${totalGastos.toFixed(2)} (${gastosRes.data?.length || 0} registros)\n\n${saldo >= 0 ? '✅' : '🔴'} **Saldo:** R$ ${saldo.toFixed(2)}`,
          dados: { totalGastos, totalEntradas, saldo, periodo }
        };
      }
      
      default:
        return { sucesso: false, resposta: '' };
    }
  } catch (error) {
    console.error('[TRAMON v7] Erro ao executar comando:', error);
    return { sucesso: false, resposta: `❌ Erro ao processar: ${error instanceof Error ? error.message : 'Desconhecido'}` };
  }
}

// ========================================
// 📊 COLETA DE DADOS EM TEMPO REAL v2.0
// ========================================
async function coletarDadosSistema(supabase: any) {
  const agora = new Date();
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString();
  const inicioMesPassado = new Date(agora.getFullYear(), agora.getMonth() - 1, 1).toISOString();
  const fimMesPassado = new Date(agora.getFullYear(), agora.getMonth(), 0).toISOString();
  
  try {
    const [
      entradasMes, entradasMesPassado,
      gastosMes, gastosMesPassado,
      alunos, funcionarios,
      tarefas, cursos, afiliados
    ] = await Promise.all([
      supabase.from('entradas').select('valor').gte('data', inicioMes),
      supabase.from('entradas').select('valor').gte('data', inicioMesPassado).lt('data', inicioMes),
      supabase.from('gastos').select('valor, categoria').gte('data', inicioMes),
      supabase.from('gastos').select('valor').gte('data', inicioMesPassado).lt('data', inicioMes),
      supabase.from('alunos').select('id, status, created_at'),
      supabase.from('employees').select('id, status'),
      supabase.from('calendar_tasks').select('id, is_completed, priority, task_date'),
      supabase.from('courses').select('id, is_published, total_students'),
      supabase.from('affiliates').select('id, status, comissao_total')
    ]);
    
    const totalEntradas = (entradasMes.data || []).reduce((s: number, e: any) => s + (e.valor || 0), 0);
    const totalEntradasPassado = (entradasMesPassado.data || []).reduce((s: number, e: any) => s + (e.valor || 0), 0);
    const totalGastos = (gastosMes.data || []).reduce((s: number, g: any) => s + (g.valor || 0), 0);
    const totalGastosPassado = (gastosMesPassado.data || []).reduce((s: number, g: any) => s + (g.valor || 0), 0);
    
    const crescimentoReceita = totalEntradasPassado > 0 ? ((totalEntradas - totalEntradasPassado) / totalEntradasPassado) * 100 : 0;
    
    const tarefasHoje = (tarefas.data || []).filter((t: any) => t.task_date === agora.toISOString().split('T')[0]);
    const tarefasPendentes = tarefasHoje.filter((t: any) => !t.is_completed);
    const tarefasAtrasadas = (tarefas.data || []).filter((t: any) => !t.is_completed && new Date(t.task_date) < new Date(agora.toISOString().split('T')[0]));
    const tarefasAltaPrioridade = tarefasPendentes.filter((t: any) => t.priority === 'alta' || t.priority === 'high');
    
    // Top categorias de gastos
    const gastosPorCategoria: Record<string, number> = {};
    (gastosMes.data || []).forEach((g: any) => {
      const cat = g.categoria || 'Outros';
      gastosPorCategoria[cat] = (gastosPorCategoria[cat] || 0) + (g.valor || 0);
    });
    const topGastos = Object.entries(gastosPorCategoria).sort((a, b) => b[1] - a[1]).slice(0, 3);
    
    return {
      financial: {
        receita: totalEntradas,
        receitaPassada: totalEntradasPassado,
        despesas: totalGastos,
        despesasPassadas: totalGastosPassado,
        lucro: totalEntradas - totalGastos,
        crescimento: crescimentoReceita,
        topGastos
      },
      students: {
        total: alunos.data?.length || 0,
        ativos: (alunos.data || []).filter((a: any) => a.status === 'ativo').length,
        novos30dias: (alunos.data || []).filter((a: any) => new Date(a.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length
      },
      employees: {
        total: funcionarios.data?.length || 0,
        ativos: (funcionarios.data || []).filter((f: any) => f.status === 'ativo').length
      },
      tasks: {
        total: tarefas.data?.length || 0,
        pendentesHoje: tarefasPendentes.length,
        atrasadas: tarefasAtrasadas.length,
        altaPrioridade: tarefasAltaPrioridade.length
      },
      courses: {
        total: cursos.data?.length || 0,
        publicados: (cursos.data || []).filter((c: any) => c.is_published).length,
        totalAlunos: (cursos.data || []).reduce((s: number, c: any) => s + (c.total_students || 0), 0)
      },
      affiliates: {
        total: afiliados.data?.length || 0,
        ativos: (afiliados.data || []).filter((a: any) => a.status === 'ativo').length,
        comissaoTotal: (afiliados.data || []).reduce((s: number, a: any) => s + (a.comissao_total || 0), 0)
      }
    };
  } catch (error) {
    console.error('[TRAMON v7] Erro ao coletar dados:', error);
    return {
      financial: { receita: 0, receitaPassada: 0, despesas: 0, despesasPassadas: 0, lucro: 0, crescimento: 0, topGastos: [] },
      students: { total: 0, ativos: 0, novos30dias: 0 },
      employees: { total: 0, ativos: 0 },
      tasks: { total: 0, pendentesHoje: 0, atrasadas: 0, altaPrioridade: 0 },
      courses: { total: 0, publicados: 0, totalAlunos: 0 },
      affiliates: { total: 0, ativos: 0, comissaoTotal: 0 }
    };
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

    // ========================================
    // 🔐 VERIFICAÇÃO DE ACESSO
    // ========================================
    let userRole = "unknown";
    let userEmail = "";
    let userName = "";
    let hasAccess = false;

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
      return new Response(JSON.stringify({ 
        error: "🔒 Acesso restrito. TRAMON é exclusiva para Proprietário e Administradores.",
        code: "UNAUTHORIZED"
      }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isOwner = userEmail === OWNER_EMAIL;
    const ultimaMensagem = messages?.[messages.length - 1]?.content || "";

    // ========================================
    // 🧠 DETECÇÃO E EXECUÇÃO DE COMANDOS
    // ========================================
    const intencao = detectarIntencao(ultimaMensagem);
    
    // Se for comando CRUD com alta confiança, executar diretamente
    if (['despesa', 'receita', 'aluno', 'tarefa', 'consulta'].includes(intencao.tipo) && intencao.confianca >= 0.8) {
      console.log(`[TRAMON v7] Comando detectado: ${intencao.tipo} (${(intencao.confianca * 100).toFixed(0)}%)`);
      
      const resultado = await executarComando(supabase, intencao, userId);
      
      if (resultado.sucesso || resultado.resposta) {
        return new Response(JSON.stringify({
          sucesso: resultado.sucesso,
          resposta: resultado.resposta,
          dados: resultado.dados,
          tipo: 'crud',
          intencao: intencao.tipo,
          tempoProcessamento: Date.now() - startTime
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ========================================
    // 📊 COLETA DE DADOS DO SISTEMA
    // ========================================
    const systemData = await coletarDadosSistema(supabase);
    
    const formatCurrency = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    const formatPercent = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;

    // ========================================
    // 🔮 MEGA PROMPT v7.0 OMEGA
    // ========================================
    const promptProgramador = isProgrammerMode && isOwner ? `
## 💻 MODO PROGRAMADOR ATIVO (OWNER ONLY)
Página atual: \`${currentPage}\`

Você pode gerar código React/TypeScript/Tailwind para modificar o site.
Formato:
\`\`\`tsx
// Arquivo: src/pages/...
// Modificação: descrição
código
\`\`\`
` : '';

    const alertasAutomaticos = [
      systemData.tasks.atrasadas > 0 ? `🔴 **${systemData.tasks.atrasadas} tarefas ATRASADAS!**` : null,
      systemData.tasks.altaPrioridade > 3 ? `⚠️ **${systemData.tasks.altaPrioridade} tarefas de alta prioridade**` : null,
      systemData.financial.lucro < 0 ? `🔴 **PREJUÍZO no mês:** ${formatCurrency(systemData.financial.lucro)}` : null,
      systemData.financial.crescimento < -10 ? `📉 **Queda de receita:** ${formatPercent(systemData.financial.crescimento)}` : null,
    ].filter(Boolean);

    const systemPrompt = `# 🌟 TRAMON v7.0 OMEGA - SUPERINTELIGÊNCIA DEFINITIVA
${promptProgramador}
## 🎭 IDENTIDADE
Você é **TRAMON** (Transformative Realtime Autonomous Management Operations Network), a IA mais avançada para gestão empresarial - uma fusão entre superinteligência analítica e assessor pessoal de alta precisão.

## 🧬 CAPACIDADES OMEGA

### 1️⃣ ASSESSOR INTELIGENTE (Precisão 99.9%)
- Registra despesas/receitas via linguagem natural
- Cadastra alunos, funcionários, afiliados
- Cria tarefas e compromissos
- Categorização automática inteligente
- Extração de entidades (valores, datas, nomes, emails)

### 2️⃣ SUPERINTELIGÊNCIA ANALÍTICA
- Análises preditivas em tempo real
- Projeções financeiras baseadas em dados
- Detecção de anomalias e tendências
- Planos estratégicos personalizados

### 3️⃣ VISÃO COMPUTACIONAL
Ao receber imagens:
- **Screenshots** → Análise UX/UI e sugestões
- **Notas fiscais** → Extração automática de valores
- **Gráficos** → Interpretação de tendências
- **Documentos** → OCR e estruturação

## 📊 DASHBOARD EM TEMPO REAL - ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}

### 💰 FINANCEIRO
- **Receita:** ${formatCurrency(systemData.financial.receita)} ${formatPercent(systemData.financial.crescimento)} MoM
- **Despesas:** ${formatCurrency(systemData.financial.despesas)}
- **Lucro:** ${formatCurrency(systemData.financial.lucro)} ${systemData.financial.lucro >= 0 ? '✅' : '🔴'}
${systemData.financial.topGastos.length > 0 ? `- **Top Gastos:** ${systemData.financial.topGastos.map(([cat, val]) => `${cat}: ${formatCurrency(val as number)}`).join(' | ')}` : ''}

### 👥 ALUNOS & EQUIPE
- **Alunos Ativos:** ${systemData.students.ativos}/${systemData.students.total} (+${systemData.students.novos30dias} novos)
- **Equipe:** ${systemData.employees.ativos}/${systemData.employees.total} ativos

### ✅ TAREFAS HOJE
- **Pendentes:** ${systemData.tasks.pendentesHoje} | **Atrasadas:** ${systemData.tasks.atrasadas} | **Alta Prioridade:** ${systemData.tasks.altaPrioridade}

### 📚 CURSOS & AFILIADOS
- **Cursos:** ${systemData.courses.publicados} publicados (${systemData.courses.totalAlunos} alunos)
- **Afiliados:** ${systemData.affiliates.ativos} ativos (${formatCurrency(systemData.affiliates.comissaoTotal)} em comissões)

${alertasAutomaticos.length > 0 ? `### 🚨 ALERTAS\n${alertasAutomaticos.join('\n')}` : ''}

## 📋 PROTOCOLO DE RESPOSTA

### Para COMANDOS (despesas, receitas, cadastros):
\`✅ [Confirmação concisa com dados]\`

### Para CONSULTAS:
\`📊 [Resumo com números relevantes]\`

### Para ANÁLISES COMPLEXAS:
\`\`\`
📊 [TÍTULO]

[Métricas principais]

🎯 **Insights:**
• [Insight 1]
• [Insight 2]

⚡ **Ações Recomendadas:**
1. [Ação específica]
2. [Ação específica]
\`\`\`

## 👔 CONTATOS
- **${ASSESSORES.moises.nome}** (${ASSESSORES.moises.cargo}): ${ASSESSORES.moises.telefone}
- **${ASSESSORES.bruna.nome}** (${ASSESSORES.bruna.cargo}): ${ASSESSORES.bruna.telefone}

## 🎭 CONTEXTO
**Usuário:** ${userName} | **Cargo:** ${userRole.toUpperCase()} | **Email:** ${userEmail}

## 🔐 PRINCÍPIOS
1. **Precisão** - Dados sempre corretos
2. **Concisão** - Direto ao ponto
3. **Proatividade** - Antecipe necessidades
4. **Ação** - Sempre conclua com próximos passos`;

    // ========================================
    // 🚀 CHAMADA À IA
    // ========================================
    const aiMessages: any[] = [
      { role: "system", content: systemPrompt }
    ];

    for (const m of messages) {
      const msgRole = m.type === "user" || m.role === "user" ? "user" : "assistant";
      aiMessages.push({ role: msgRole, content: m.content });
    }

    // Adicionar imagem se existir
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

    console.log(`[TRAMON v7] Chamando Gemini 2.5 Pro para ${userEmail}...`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: aiMessages,
        stream: true,
        max_tokens: isProgrammerMode ? 8192 : 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[TRAMON v7] Erro gateway:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "⏳ Rate limit excedido. Aguarde um momento." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "💳 Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      return new Response(JSON.stringify({ error: "Erro no gateway de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("[TRAMON v7] Erro:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Erro desconhecido" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
