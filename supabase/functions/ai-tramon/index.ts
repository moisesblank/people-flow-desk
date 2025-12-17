// ============================================
// 🔮 TRAMON v6.0 ULTRA - FUSÃO DEFINITIVA
// SUPERINTELIGÊNCIA + ASSESSOR INTELIGENTE
// Combina: v5.0 + AJUDA11 (Meu Assessor)
// Modelo: Gemini 2.5 Pro (Multimodal + Vision)
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ========================================
// 📱 ASSESSORES OFICIAIS
// ========================================
const ASSESSORES = {
  moises: {
    nome: "Moisés Medeiros",
    telefones: ["558398920105", "5583998920105"],
    email: "moisesblank@gmail.com",
    cargo: "Proprietário/CEO"
  },
  bruna: {
    nome: "Bruna",
    telefones: ["558396354090", "5583996354090"],
    email: "",
    cargo: "Co-gestora"
  }
};

const OWNER_EMAIL = "moisesblank@gmail.com";

// ========================================
// 🧠 CACHE INTELIGENTE (OTIMIZAÇÃO)
// ========================================
const cacheInterpretacoes = new Map<string, any>();
const CACHE_TTL = 3600000; // 1 hora

function getCacheKey(texto: string): string {
  return texto.toLowerCase().trim().substring(0, 100);
}

// ========================================
// 📦 CATEGORIZAÇÃO AUTOMÁTICA
// ========================================
const CATEGORIAS_DESPESAS: Record<string, string[]> = {
  "Alimentação": ["comida", "restaurante", "lanche", "almoço", "jantar", "supermercado", "mercado", "padaria", "café", "pizza", "hamburguer", "delivery", "ifood"],
  "Transporte": ["gasolina", "uber", "taxi", "ônibus", "combustível", "pedágio", "estacionamento", "carro", "moto", "99", "passagem"],
  "Saúde": ["médico", "farmácia", "remédio", "consulta", "exame", "hospital", "dentista", "psicólogo", "academia", "plano de saúde"],
  "Educação": ["curso", "livro", "material escolar", "mensalidade", "faculdade", "escola", "apostila", "caneta", "caderno"],
  "Moradia": ["aluguel", "condomínio", "água", "luz", "energia", "internet", "gás", "iptu", "conserto", "reforma"],
  "Lazer": ["cinema", "show", "viagem", "entretenimento", "netflix", "spotify", "jogo", "festa", "bar", "balada"],
  "Vestuário": ["roupa", "sapato", "tênis", "camisa", "calça", "vestido", "bermuda", "chinelo"],
  "Tecnologia": ["celular", "computador", "notebook", "tablet", "eletrônico", "software", "app"],
};

function categorizarDespesa(descricao: string): string {
  const textoLower = descricao.toLowerCase();
  for (const [categoria, palavras] of Object.entries(CATEGORIAS_DESPESAS)) {
    if (palavras.some(p => textoLower.includes(p))) {
      return categoria;
    }
  }
  return "Outros";
}

// ========================================
// 📅 PROCESSAMENTO DE DATAS
// ========================================
function processarData(dataStr: string | undefined): string {
  if (!dataStr) return new Date().toISOString();
  
  const texto = dataStr.toLowerCase().trim();
  const agora = new Date();
  
  if (texto === "hoje" || texto === "now") {
    return agora.toISOString();
  }
  if (texto === "amanhã" || texto === "amanha") {
    agora.setDate(agora.getDate() + 1);
    return agora.toISOString();
  }
  if (texto === "ontem") {
    agora.setDate(agora.getDate() - 1);
    return agora.toISOString();
  }
  
  // Formato DD/MM/YYYY
  const partes = texto.split("/");
  if (partes.length === 3) {
    const [dia, mes, ano] = partes;
    return new Date(`${ano}-${mes}-${dia}`).toISOString();
  }
  
  return new Date().toISOString();
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
    const { messages, context, userId, image, isProgrammerMode, currentPage, tipo, audioUrl } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // ========================================
    // 🔐 VERIFICAÇÃO DE ACESSO PREMIUM
    // ========================================
    let hasAccess = false;
    let userRole = "unknown";
    let userEmail = "";
    let userName = "";

    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && userId) {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      userEmail = userData?.user?.email || "";
      userRole = roleData?.role || "employee";
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('nome')
        .eq('id', userId)
        .single();
      userName = profileData?.nome || userEmail.split('@')[0];
      
      const isOwner = userEmail === OWNER_EMAIL;
      hasAccess = isOwner || userRole === "owner" || userRole === "admin" || userRole === "coordenacao";
      
      console.log(`[TRAMON v6] User: ${userEmail}, Role: ${userRole}, Access: ${hasAccess}, HasImage: ${!!image}, ProgrammerMode: ${isProgrammerMode}`);
    }

    if (!hasAccess) {
      return new Response(JSON.stringify({ 
        error: "🔒 Acesso negado. TRAMON é exclusiva para Owner e Administradores.",
        code: "UNAUTHORIZED"
      }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ========================================
    // 📊 COLETA DE DADOS EM TEMPO REAL
    // ========================================
    let systemData: any = await coletarDadosSistema(supabase);

    // ========================================
    // 🎤 PRÉ-PROCESSAMENTO (ÁUDIO → TEXTO)
    // ========================================
    let textoProcessado = "";
    const ultimaMensagem = messages?.[messages.length - 1]?.content || "";
    
    if (tipo === "audio" && audioUrl) {
      console.log("[TRAMON v6] Processando áudio...");
      // Áudio será transcrito pelo frontend ou podemos usar Whisper via Lovable AI
      textoProcessado = ultimaMensagem;
    } else {
      textoProcessado = ultimaMensagem;
    }

    // ========================================
    // 🧠 DETECÇÃO DE COMANDO CRUD
    // ========================================
    const comandoCRUD = detectarComandoCRUD(textoProcessado);
    
    if (comandoCRUD && !isProgrammerMode) {
      console.log("[TRAMON v6] Comando CRUD detectado:", comandoCRUD);
      
      // Executar comando CRUD
      const resultadoCRUD = await executarComandoCRUD(supabase, comandoCRUD, userId);
      
      // Registrar log
      await registrarLogIA(supabase, {
        user_id: userId,
        comando: textoProcessado,
        tipo: tipo || "texto",
        acao: comandoCRUD.acao,
        entidade: comandoCRUD.entidade,
        resultado: resultadoCRUD.sucesso ? "sucesso" : "erro",
        tempo_processamento: Date.now() - startTime
      });
      
      // Retornar resposta direta sem streaming
      return new Response(JSON.stringify({
        sucesso: true,
        resposta: resultadoCRUD.resposta,
        dados: resultadoCRUD.dados,
        tempo_processamento: Date.now() - startTime,
        tipo: "crud"
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ========================================
    // 💻 MODO PROGRAMADOR (EXCLUSIVO OWNER)
    // ========================================
    const isOwner = userEmail === OWNER_EMAIL;
    let programmerModePrompt = "";
    
    if (isProgrammerMode && isOwner) {
      programmerModePrompt = `

## 💻 MODO PROGRAMADOR ATIVADO (EXCLUSIVO OWNER)

Você agora tem capacidade de GERAR CÓDIGO para modificar o site em tempo real.

**Página Atual:** \`${currentPage || '/'}\`

### INSTRUÇÕES PARA MODIFICAÇÕES:
1. Identifique o que o usuário quer modificar
2. Gere código específico (CSS/Tailwind/React)
3. Forneça instruções claras

### FORMATO DE RESPOSTA PARA CÓDIGO:
\`\`\`jsx
// Arquivo: src/pages/NomePagina.tsx
// Modificação: descrição
código aqui
\`\`\`

`;
    }

    // ========================================
    // 🔮 MEGA PROMPT v6.0 ULTRA
    // ========================================
    const formatCurrency = (value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    const formatPercent = (value: number) => `${value.toFixed(1)}%`;
    const formatDate = (date: Date) => date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const dataContext = `
## 📊 DADOS EM TEMPO REAL - ${formatDate(new Date())}

### 💰 FINANCEIRO
- **Receita Mensal:** ${formatCurrency(systemData.financial.totalIncome)}
- **Despesas:** ${formatCurrency(systemData.financial.totalExpenses)}
- **Lucro Líquido:** ${formatCurrency(systemData.financial.profit)} ${systemData.financial.profit > 0 ? '✅' : '🔴'}
- **Crescimento MoM:** ${formatPercent(systemData.financial.monthlyGrowth)}

### 👥 ALUNOS
- **Ativos:** ${systemData.students.active}/${systemData.students.total}
- **Retenção:** ${formatPercent(systemData.students.retention)}
- **Novos (30 dias):** ${systemData.students.newThisMonth}

### 👔 EQUIPE
- **Ativos:** ${systemData.employees.active}/${systemData.employees.total}

### ✅ TAREFAS
- **Pendentes:** ${systemData.tasks.pending} | **Alta Prioridade:** ${systemData.tasks.highPriority}
- **Atrasadas:** ${systemData.tasks.overdue} ${systemData.tasks.overdue > 0 ? '⚠️' : ''}
- **Taxa de Conclusão:** ${formatPercent(systemData.tasks.completionRate)}

### 📚 CURSOS
- **Publicados:** ${systemData.courses.published}/${systemData.courses.total}
- **Total de Alunos:** ${systemData.courses.totalStudents}

### 🤝 AFILIADOS
- **Ativos:** ${systemData.affiliates.active}/${systemData.affiliates.total}
- **Comissões:** ${formatCurrency(systemData.affiliates.totalCommission)}

### 💻 SISTEMA
- **Usuários Online:** ${systemData.system.activeUsers}
- **Versão:** TRAMON v6.0 ULTRA
`;

    const systemPrompt = `# 🔮 TRAMON v6.0 ULTRA - SUPERINTELIGÊNCIA + ASSESSOR
${programmerModePrompt}
## 🎯 IDENTIDADE CENTRAL
Você é **TRAMON** (Transformative Realtime Autonomous Management Operations Network), a fusão entre uma superinteligência empresarial e um assessor pessoal inteligente como o "Meu Assessor".

## 🧬 CAPACIDADES ULTRA (FUSÃO COMPLETA)

### 1. ASSESSOR INTELIGENTE (Precisão 99.9%)
- **Registrar despesas e receitas** via linguagem natural
- **Cadastrar alunos, funcionários, afiliados**
- **Criar tarefas e compromissos**
- **Consultar saldos, métricas, relatórios**
- **Categorização automática** de transações
- **Extração de entidades** (valores, datas, nomes, emails, telefones)

### 2. SUPERINTELIGÊNCIA EMPRESARIAL
- **Análises preditivas** em tempo real
- **Projeções financeiras** detalhadas
- **Planos estratégicos** personalizados
- **Alertas automáticos** de problemas

### 3. VISÃO COMPUTACIONAL
Quando receber uma imagem, analise:
- Screenshots → UX/UI e melhorias
- Gráficos → Interprete dados e tendências
- Notas fiscais → Extraia valores e categorize
- Documentos → Extraia informações estruturadas

### 4. MODO PROGRAMADOR (OWNER ONLY)
Se isProgrammerMode=true, gere código para modificações no site.

## 📋 PROTOCOLO DE RESPOSTA

### PARA COMANDOS SIMPLES (despesas, cadastros, tarefas):
✅ [Confirmação concisa da ação]
Exemplo: "✅ Despesa de R$ 50,00 registrada em Transporte"

### PARA CONSULTAS:
📊 [Resumo com números]
Exemplo: "📊 Você gastou R$ 150,00 hoje (3 despesas)"

### PARA ANÁLISES COMPLEXAS:
📊 [TÍTULO]

[Métricas-chave]

### 🎯 Análise
[Insights principais - máximo 5 bullets]

### ⚡ Ações Recomendadas
1. [Ação com prazo]
2. [Ação com prazo]

## 🚨 ALERTAS AUTOMÁTICOS
${systemData.tasks.highPriority > 5 ? '🔴 **CRÍTICO:** ' + systemData.tasks.highPriority + ' tarefas de alta prioridade!' : ''}
${systemData.tasks.overdue > 0 ? '⚠️ **ATENÇÃO:** ' + systemData.tasks.overdue + ' tarefas ATRASADAS!' : ''}
${systemData.students.atRisk > 0 ? '📉 **CHURN RISK:** ' + systemData.students.atRisk + ' alunos em risco!' : ''}
${systemData.financial.profit < 0 ? '🔴 **PREJUÍZO:** Operação negativa!' : ''}

## 👔 ASSESSORES
- **Moisés Medeiros** (CEO): +55 83 98920-0105 | moisesblank@gmail.com
- **Bruna** (Co-gestora): +55 83 96354-090

## 🎭 CONTEXTO
**Usuário:** ${userName}
**Cargo:** ${userRole.toUpperCase()}
**Email:** ${userEmail}

## 📊 DADOS DO SISTEMA
${dataContext}

## 🔐 PRINCÍPIOS
1. **Precisão 99.9%** - Como o Meu Assessor
2. **Respostas concisas** - Direto ao ponto
3. **Ação > Teoria** - Sempre conclua com ações
4. **Proatividade** - Antecipe necessidades`;

    // ========================================
    // 🚀 CHAMADA MULTIMODAL (GEMINI 2.5 PRO)
    // ========================================
    console.log("[TRAMON v6] Chamando Gemini 2.5 Pro...");

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
            {
              type: "text",
              text: `[IMAGEM ANEXADA - ANALISE DETALHADAMENTE]\n\n${lastUserMsg.content}`
            },
            {
              type: "image_url",
              image_url: { url: imageUrl }
            }
          ]
        };
      }
    }

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
      console.error("[TRAMON v6] Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit excedido. Aguarde um momento." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Erro no gateway de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("[TRAMON v6] Error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Erro desconhecido" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ========================================
// 📊 COLETA DE DADOS DO SISTEMA
// ========================================
async function coletarDadosSistema(supabase: any): Promise<any> {
  const systemData: any = {
    financial: { totalIncome: 0, totalExpenses: 0, profit: 0, monthlyGrowth: 0 },
    students: { active: 0, total: 0, retention: 0, newThisMonth: 0, atRisk: 0 },
    employees: { active: 0, total: 0 },
    tasks: { pending: 0, highPriority: 0, completed: 0, overdue: 0, completionRate: 0 },
    courses: { total: 0, published: 0, totalStudents: 0 },
    affiliates: { total: 0, active: 0, totalCommission: 0 },
    system: { activeUsers: 0 }
  };

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [
      entradasResult,
      gastosResult,
      alunosResult,
      employeesResult,
      tasksResult,
      coursesResult,
      affiliatesResult,
      profilesResult
    ] = await Promise.all([
      supabase.from('entradas').select('valor, data').gte('data', thirtyDaysAgo),
      supabase.from('gastos').select('valor, data').gte('data', thirtyDaysAgo),
      supabase.from('alunos').select('id, status, created_at'),
      supabase.from('employees').select('id, status'),
      supabase.from('calendar_tasks').select('id, is_completed, priority, task_date'),
      supabase.from('courses').select('id, is_published, total_students'),
      supabase.from('affiliates').select('id, status, total_comissao'),
      supabase.from('profiles').select('id, last_activity_at')
    ]);

    // Processar financeiro
    const entradas = entradasResult.data || [];
    const gastos = gastosResult.data || [];
    systemData.financial.totalIncome = entradas.reduce((sum: number, e: any) => sum + (e.valor || 0), 0);
    systemData.financial.totalExpenses = gastos.reduce((sum: number, g: any) => sum + (g.valor || 0), 0);
    systemData.financial.profit = systemData.financial.totalIncome - systemData.financial.totalExpenses;

    // Processar alunos
    const alunos = alunosResult.data || [];
    systemData.students.total = alunos.length;
    systemData.students.active = alunos.filter((a: any) => a.status === 'ativo').length;
    systemData.students.retention = systemData.students.total > 0 
      ? (systemData.students.active / systemData.students.total) * 100 : 0;
    systemData.students.newThisMonth = alunos.filter((a: any) => 
      a.created_at && new Date(a.created_at) >= new Date(thirtyDaysAgo)
    ).length;

    // Processar funcionários
    const employees = employeesResult.data || [];
    systemData.employees.total = employees.length;
    systemData.employees.active = employees.filter((e: any) => e.status === 'ativo').length;

    // Processar tarefas
    const tasks = tasksResult.data || [];
    const hoje = new Date().toISOString().split('T')[0];
    systemData.tasks.pending = tasks.filter((t: any) => !t.is_completed).length;
    systemData.tasks.completed = tasks.filter((t: any) => t.is_completed).length;
    systemData.tasks.highPriority = tasks.filter((t: any) => !t.is_completed && t.priority === 'high').length;
    systemData.tasks.overdue = tasks.filter((t: any) => !t.is_completed && t.task_date < hoje).length;
    systemData.tasks.completionRate = tasks.length > 0 
      ? (systemData.tasks.completed / tasks.length) * 100 : 0;

    // Processar cursos
    const courses = coursesResult.data || [];
    systemData.courses.total = courses.length;
    systemData.courses.published = courses.filter((c: any) => c.is_published).length;
    systemData.courses.totalStudents = courses.reduce((sum: number, c: any) => sum + (c.total_students || 0), 0);

    // Processar afiliados
    const affiliates = affiliatesResult.data || [];
    systemData.affiliates.total = affiliates.length;
    systemData.affiliates.active = affiliates.filter((a: any) => a.status === 'ativo').length;
    systemData.affiliates.totalCommission = affiliates.reduce((sum: number, a: any) => sum + (a.total_comissao || 0), 0);

    // Processar sistema
    const profiles = profilesResult.data || [];
    systemData.system.activeUsers = profiles.filter((p: any) => 
      p.last_activity_at && new Date(p.last_activity_at) > new Date(Date.now() - 15 * 60 * 1000)
    ).length;

  } catch (error) {
    console.log("[TRAMON v6] Erro ao coletar dados:", error);
  }

  return systemData;
}

// ========================================
// 🎯 DETECÇÃO DE COMANDO CRUD
// ========================================
function detectarComandoCRUD(texto: string): any | null {
  const textoLower = texto.toLowerCase().trim();
  
  // DESPESA
  const padroesDespesa = [
    /gastei\s+([\d.,]+)\s*(reais|r\$)?.*?(?:de|com|em|no|na)?\s*(.*)/i,
    /paguei\s+([\d.,]+)\s*(reais|r\$)?.*?(?:de|com|em|no|na)?\s*(.*)/i,
    /comprei\s+.*?(?:por|de)?\s*([\d.,]+)\s*(reais|r\$)?/i,
    /despesa\s+(?:de\s+)?([\d.,]+)\s*(reais|r\$)?.*?(?:de|com|em)?\s*(.*)/i,
  ];
  
  for (const padrao of padroesDespesa) {
    const match = textoLower.match(padrao);
    if (match) {
      const valor = parseFloat(match[1].replace(',', '.'));
      const descricao = match[3]?.trim() || "Despesa";
      const categoria = categorizarDespesa(texto);
      
      return {
        acao: "criar",
        entidade: "despesa",
        dados: {
          valor: valor,
          descricao: descricao,
          categoria: categoria,
          data: new Date().toISOString()
        }
      };
    }
  }
  
  // RECEITA
  const padroesReceita = [
    /recebi\s+([\d.,]+)\s*(reais|r\$)?.*?(?:de|com|por)?\s*(.*)/i,
    /entrou\s+([\d.,]+)\s*(reais|r\$)?.*?(?:de|com)?\s*(.*)/i,
    /ganhei\s+([\d.,]+)\s*(reais|r\$)?.*?(?:de|com)?\s*(.*)/i,
    /vendi\s+.*?(?:por|de)?\s*([\d.,]+)\s*(reais|r\$)?/i,
  ];
  
  for (const padrao of padroesReceita) {
    const match = textoLower.match(padrao);
    if (match) {
      const valor = parseFloat(match[1].replace(',', '.'));
      const descricao = match[3]?.trim() || "Receita";
      
      return {
        acao: "criar",
        entidade: "receita",
        dados: {
          valor: valor,
          descricao: descricao,
          categoria: "Vendas",
          data: new Date().toISOString()
        }
      };
    }
  }
  
  // ALUNO
  if (textoLower.includes("cadastrar aluno") || textoLower.includes("novo aluno")) {
    const nomeMatch = texto.match(/aluno\s+([A-Za-zÀ-ú\s]+?)(?:,|email|telefone|$)/i);
    const emailMatch = texto.match(/email\s+([^\s,]+)/i);
    const telefoneMatch = texto.match(/telefone\s+([\d\s()-]+)/i);
    
    if (nomeMatch) {
      return {
        acao: "criar",
        entidade: "aluno",
        dados: {
          nome: nomeMatch[1].trim(),
          email: emailMatch?.[1] || null,
          telefone: telefoneMatch?.[1] || null,
          status: "ativo"
        }
      };
    }
  }
  
  // TAREFA
  if (textoLower.includes("criar tarefa") || textoLower.includes("nova tarefa")) {
    const tituloMatch = texto.match(/tarefa[:\s]+(.+)/i);
    const prioridade = textoLower.includes("urgente") ? "high" : "medium";
    
    if (tituloMatch) {
      return {
        acao: "criar",
        entidade: "tarefa",
        dados: {
          titulo: tituloMatch[1].trim(),
          prioridade: prioridade,
          status: "pendente"
        }
      };
    }
  }
  
  // CONSULTAS
  if (textoLower.includes("quanto gastei")) {
    const periodo = textoLower.includes("hoje") ? "hoje" : 
                    textoLower.includes("mês") || textoLower.includes("mes") ? "mes" : "hoje";
    return {
      acao: "consultar",
      entidade: "despesa",
      filtros: { periodo }
    };
  }
  
  if (textoLower.includes("quanto recebi") || textoLower.includes("saldo")) {
    return {
      acao: "consultar",
      entidade: "receita",
      filtros: { periodo: "mes" }
    };
  }
  
  if (textoLower.includes("quantos alunos")) {
    return {
      acao: "consultar",
      entidade: "aluno",
      filtros: { status: "ativo" }
    };
  }
  
  return null;
}

// ========================================
// ⚡ EXECUTAR COMANDO CRUD
// ========================================
async function executarComandoCRUD(supabase: any, comando: any, userId: string): Promise<any> {
  const { acao, entidade, dados, filtros } = comando;
  
  try {
    console.log(`[CRUD] Executando ${acao} em ${entidade}...`);
    
    if (acao === "criar") {
      return await criarRegistro(supabase, entidade, dados, userId);
    }
    
    if (acao === "consultar") {
      return await consultarRegistros(supabase, entidade, filtros);
    }
    
    return { sucesso: false, resposta: "Ação não suportada" };
    
  } catch (error) {
    console.error("[CRUD] Erro:", error);
    return { 
      sucesso: false, 
      resposta: `❌ Erro ao executar: ${error instanceof Error ? error.message : "Erro desconhecido"}` 
    };
  }
}

// ========================================
// 📝 CRIAR REGISTRO
// ========================================
async function criarRegistro(supabase: any, entidade: string, dados: any, userId: string): Promise<any> {
  const agora = new Date().toISOString();
  
  if (entidade === "despesa") {
    const dadosInsert = {
      descricao: dados.descricao || "Despesa",
      valor: dados.valor,
      categoria: dados.categoria || "Outros",
      data: dados.data || agora,
      fonte: "IA TRAMON",
      created_by: userId,
      created_at: agora
    };
    
    const { data, error } = await supabase.from('gastos').insert(dadosInsert).select().single();
    
    if (error) throw error;
    
    return {
      sucesso: true,
      resposta: `✅ Despesa de R$ ${dados.valor.toFixed(2)} registrada em ${dados.categoria}`,
      dados: data
    };
  }
  
  if (entidade === "receita") {
    const dadosInsert = {
      descricao: dados.descricao || "Receita",
      valor: dados.valor,
      categoria: dados.categoria || "Vendas",
      data: dados.data || agora,
      fonte: "IA TRAMON",
      created_by: userId,
      created_at: agora
    };
    
    const { data, error } = await supabase.from('entradas').insert(dadosInsert).select().single();
    
    if (error) throw error;
    
    return {
      sucesso: true,
      resposta: `✅ Receita de R$ ${dados.valor.toFixed(2)} registrada em ${dados.categoria}`,
      dados: data
    };
  }
  
  if (entidade === "aluno") {
    const dadosInsert = {
      nome: dados.nome,
      email: dados.email,
      telefone: dados.telefone,
      status: "ativo",
      fonte: "IA TRAMON",
      data_matricula: agora,
      created_at: agora
    };
    
    const { data, error } = await supabase.from('alunos').insert(dadosInsert).select().single();
    
    if (error) throw error;
    
    return {
      sucesso: true,
      resposta: `✅ Aluno ${dados.nome} cadastrado com sucesso`,
      dados: data
    };
  }
  
  if (entidade === "tarefa") {
    const dadosInsert = {
      title: dados.titulo,
      priority: dados.prioridade || "medium",
      is_completed: false,
      task_date: dados.data || agora.split('T')[0],
      user_id: userId,
      created_at: agora
    };
    
    const { data, error } = await supabase.from('calendar_tasks').insert(dadosInsert).select().single();
    
    if (error) throw error;
    
    return {
      sucesso: true,
      resposta: `✅ Tarefa "${dados.titulo}" criada`,
      dados: data
    };
  }
  
  return { sucesso: false, resposta: "Entidade não suportada" };
}

// ========================================
// 🔍 CONSULTAR REGISTROS
// ========================================
async function consultarRegistros(supabase: any, entidade: string, filtros: any): Promise<any> {
  const hoje = new Date().toISOString().split('T')[0];
  const primeiroDiaMes = new Date();
  primeiroDiaMes.setDate(1);
  primeiroDiaMes.setHours(0, 0, 0, 0);
  
  if (entidade === "despesa") {
    let query = supabase.from('gastos').select('*');
    
    if (filtros?.periodo === "hoje") {
      query = query.gte('data', `${hoje}T00:00:00`).lte('data', `${hoje}T23:59:59`);
    } else if (filtros?.periodo === "mes") {
      query = query.gte('data', primeiroDiaMes.toISOString());
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    const total = data?.reduce((sum: number, d: any) => sum + (d.valor || 0), 0) || 0;
    const count = data?.length || 0;
    
    return {
      sucesso: true,
      resposta: `📊 Você gastou R$ ${total.toFixed(2)} (${count} despesa${count !== 1 ? 's' : ''})`,
      dados: data
    };
  }
  
  if (entidade === "receita") {
    let queryReceitas = supabase.from('entradas').select('*').gte('data', primeiroDiaMes.toISOString());
    let queryDespesas = supabase.from('gastos').select('*').gte('data', primeiroDiaMes.toISOString());
    
    const [receitasRes, despesasRes] = await Promise.all([queryReceitas, queryDespesas]);
    
    const totalReceitas = receitasRes.data?.reduce((sum: number, r: any) => sum + (r.valor || 0), 0) || 0;
    const totalDespesas = despesasRes.data?.reduce((sum: number, d: any) => sum + (d.valor || 0), 0) || 0;
    const saldo = totalReceitas - totalDespesas;
    
    return {
      sucesso: true,
      resposta: `💰 Receitas: R$ ${totalReceitas.toFixed(2)}\n💸 Despesas: R$ ${totalDespesas.toFixed(2)}\n📊 Saldo: R$ ${saldo.toFixed(2)}`,
      dados: { receitas: totalReceitas, despesas: totalDespesas, saldo }
    };
  }
  
  if (entidade === "aluno") {
    const { data, error } = await supabase.from('alunos').select('*').eq('status', 'ativo');
    
    if (error) throw error;
    
    return {
      sucesso: true,
      resposta: `👨‍🎓 Você tem ${data?.length || 0} aluno${data?.length !== 1 ? 's' : ''} ativo${data?.length !== 1 ? 's' : ''}`,
      dados: data
    };
  }
  
  return { sucesso: false, resposta: "Entidade não suportada para consulta" };
}

// ========================================
// 📝 REGISTRAR LOG DA IA
// ========================================
async function registrarLogIA(supabase: any, logData: any): Promise<void> {
  try {
    await supabase.from("tramon_conversations").insert({
      user_id: logData.user_id,
      role: "system",
      content: JSON.stringify(logData),
      source: "crud"
    });
  } catch (error) {
    console.error("[LOG] Erro ao registrar log:", error);
  }
}
