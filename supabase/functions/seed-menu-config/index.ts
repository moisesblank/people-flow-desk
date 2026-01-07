// ============================================
// SEED MENU CONFIG - Edge Function
// Popula menu_groups e menu_items com os menus hardcoded
// Executar apenas uma vez ou quando banco estiver vazio
// ============================================

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Menu de Gestão - Grupos e Itens
const gestaoMenuData = [
  {
    group_key: "principal",
    group_label: "Principal",
    group_icon: "Brain",
    group_color: "from-primary/80",
    sort_order: 0,
    is_system: true,
    items: [
      { item_key: "central-comando", item_label: "Central de Comando", item_url: "/gestaofc", item_icon: "Brain", item_area: "dashboard", sort_order: 0 },
      { item_key: "dashboard-executivo", item_label: "Dashboard Executivo", item_url: "/gestaofc/dashboard-executivo", item_icon: "Gauge", item_area: "dashboard-executivo", sort_order: 1 },
      { item_key: "tarefas", item_label: "Tarefas", item_url: "/gestaofc/tarefas", item_icon: "ClipboardCheck", item_area: "tarefas", sort_order: 2 },
      { item_key: "integracoes", item_label: "Integrações", item_url: "/gestaofc/integracoes", item_icon: "Link2", item_area: "integracoes", sort_order: 3 },
      { item_key: "calendario", item_label: "Calendário", item_url: "/gestaofc/calendario", item_icon: "Calendar", item_area: "calendario", sort_order: 4 },
      { item_key: "area-professor", item_label: "Área Professor", item_url: "/gestaofc/area-professor", item_icon: "ClipboardCheck", item_area: "area-professor", sort_order: 5 },
    ],
  },
  {
    group_key: "empresas",
    group_label: "EMPRESAS",
    group_icon: "Building2",
    group_color: "from-purple-600/80",
    sort_order: 1,
    is_system: true,
    items: [
      { item_key: "central-financeira", item_label: "Central Financeira", item_url: "/gestaofc/financas-empresa", item_icon: "Wallet", item_area: "financas-empresa", item_badge: "CENTRAL", sort_order: 0 },
      { item_key: "receitas", item_label: "Receitas", item_url: "/gestaofc/empresas/receitas", item_icon: "TrendingUp", item_area: "receitas-empresariais", item_badge: "LIVE", sort_order: 1 },
      { item_key: "contabilidade", item_label: "Contabilidade", item_url: "/gestaofc/contabilidade", item_icon: "Calculator", item_area: "contabilidade", sort_order: 2 },
      { item_key: "rh", item_label: "Funcionários (RH)", item_url: "/gestaofc/empresas/rh", item_icon: "Users", item_area: "rh-funcionarios", sort_order: 3 },
      { item_key: "arquivos-empresariais", item_label: "Arquivos Empresariais", item_url: "/gestaofc/empresas/arquivos", item_icon: "FolderOpen", item_area: "arquivos-empresariais", sort_order: 4 },
    ],
  },
  {
    group_key: "marketing",
    group_label: "Marketing & Lançamento",
    group_icon: "Megaphone",
    group_color: "from-orange-600/80",
    sort_order: 2,
    is_system: true,
    items: [
      { item_key: "central-metricas", item_label: "Central de Métricas", item_url: "/gestaofc/central-metricas", item_icon: "Activity", item_area: "metricas", item_badge: "LIVE", sort_order: 0 },
      { item_key: "marketing", item_label: "Marketing", item_url: "/gestaofc/marketing", item_icon: "Megaphone", item_area: "marketing", sort_order: 1 },
      { item_key: "lancamento", item_label: "Lançamento", item_url: "/gestaofc/lancamento", item_icon: "Rocket", item_area: "lancamento", sort_order: 2 },
      { item_key: "metricas", item_label: "Métricas", item_url: "/gestaofc/metricas", item_icon: "BarChart3", item_area: "metricas", sort_order: 3 },
      { item_key: "arquivos", item_label: "Arquivos", item_url: "/gestaofc/arquivos", item_icon: "FolderOpen", item_area: "arquivos", sort_order: 4 },
    ],
  },
  {
    group_key: "aulas",
    group_label: "Aulas & Turmas",
    group_icon: "GraduationCap",
    group_color: "from-blue-600/80",
    sort_order: 3,
    is_system: true,
    items: [
      { item_key: "planejamento-aula", item_label: "Planejamento de Aula", item_url: "/gestaofc/planejamento-aula", item_icon: "PenTool", item_area: "planejamento-aula", sort_order: 0 },
      { item_key: "turmas-online", item_label: "Turmas Online", item_url: "/gestaofc/turmas-online", item_icon: "Monitor", item_area: "turmas-online", sort_order: 1 },
      { item_key: "turmas-presenciais", item_label: "Turmas Presenciais", item_url: "/gestaofc/turmas-presenciais", item_icon: "MapPin", item_area: "turmas-presenciais", sort_order: 2 },
      { item_key: "simulados", item_label: "Simulados", item_url: "/gestaofc/simulados", item_icon: "Brain", item_area: "simulados", sort_order: 3 },
    ],
  },
  {
    group_key: "negocios",
    group_label: "Negócios",
    group_icon: "Briefcase",
    group_color: "from-purple-600/80",
    sort_order: 4,
    is_system: true,
    items: [
      { item_key: "cursos", item_label: "Cursos", item_url: "/gestaofc/cursos", item_icon: "PlayCircle", item_area: "cursos", sort_order: 0 },
      { item_key: "afiliados", item_label: "Afiliados", item_url: "/gestaofc/afiliados", item_icon: "Handshake", item_area: "afiliados", sort_order: 1 },
      { item_key: "gestao-alunos", item_label: "Gestão Alunos", item_url: "/gestaofc/gestao-alunos", item_icon: "GraduationCap", item_area: "alunos", sort_order: 2 },
      { item_key: "portal-aluno", item_label: "Portal Aluno", item_url: "/gestaofc/portal-aluno", item_icon: "UserCheck", item_area: "portal-aluno", sort_order: 3 },
      { item_key: "relatorios", item_label: "Relatórios", item_url: "/gestaofc/relatorios", item_icon: "FileText", item_area: "relatorios", sort_order: 4 },
      { item_key: "guia", item_label: "Guia", item_url: "/gestaofc/guia", item_icon: "BookOpen", item_area: "guia", sort_order: 5 },
    ],
  },
  {
    group_key: "site",
    group_label: "Site",
    group_icon: "Globe",
    group_color: "from-cyan-600/80",
    sort_order: 5,
    is_system: true,
    items: [
      { item_key: "gestao-site", item_label: "Gestão Site", item_url: "/gestaofc/gestao-site", item_icon: "Globe", item_area: "gestao-site", sort_order: 0 },
      { item_key: "site-programador", item_label: "Site/Programador", item_url: "/gestaofc/site-programador", item_icon: "Code", item_area: "site-programador", sort_order: 1 },
      { item_key: "laboratorio", item_label: "Laboratório", item_url: "/gestaofc/laboratorio", item_icon: "Zap", item_area: "laboratorio", sort_order: 2 },
    ],
  },
  {
    group_key: "pessoal",
    group_label: "Vida Pessoal",
    group_icon: "Heart",
    group_color: "from-pink-600/80",
    sort_order: 6,
    is_system: false,
    items: [
      { item_key: "pessoal", item_label: "Pessoal", item_url: "/gestaofc/pessoal", item_icon: "User", item_area: "pessoal", sort_order: 0 },
      { item_key: "vida-pessoal", item_label: "Vida Pessoal", item_url: "/gestaofc/vida-pessoal", item_icon: "Heart", item_area: "vida-pessoal", sort_order: 1 },
    ],
  },
  {
    group_key: "admin",
    group_label: "Administração",
    group_icon: "Shield",
    group_color: "from-slate-600/80",
    sort_order: 7,
    is_system: true,
    items: [
      { item_key: "permissoes", item_label: "Permissões", item_url: "/gestaofc/permissoes", item_icon: "Shield", item_area: "permissoes", sort_order: 0 },
      { item_key: "configuracoes", item_label: "Configurações", item_url: "/gestaofc/configuracoes", item_icon: "Settings", item_area: "configuracoes", sort_order: 1 },
    ],
  },
  {
    group_key: "owner",
    group_label: "Modo Master",
    group_icon: "Crown",
    group_color: "from-purple-600/80 via-pink-600/80",
    sort_order: 8,
    is_system: true,
    items: [
      { item_key: "monitoramento", item_label: "Monitoramento", item_url: "/gestaofc/monitoramento", item_icon: "Activity", item_area: "monitoramento", item_badge: "MASTER", sort_order: 0 },
      { item_key: "central-whatsapp", item_label: "Central WhatsApp", item_url: "/gestaofc/central-whatsapp", item_icon: "MessageSquareText", item_area: "central-whatsapp", item_badge: "LIVE", sort_order: 1 },
      { item_key: "diagnostico-whatsapp", item_label: "Diagnóstico WhatsApp", item_url: "/gestaofc/diagnostico-whatsapp", item_icon: "Stethoscope", item_area: "diagnostico-whatsapp", sort_order: 2 },
      { item_key: "auditoria-acessos", item_label: "Auditoria Acessos", item_url: "/gestaofc/auditoria-acessos", item_icon: "Shield", item_area: "auditoria-acessos", item_badge: "AUDIT", sort_order: 3 },
      { item_key: "central-monitoramento", item_label: "Central Monitoramento", item_url: "/gestaofc/central-monitoramento", item_icon: "Activity", item_area: "central-monitoramento", item_badge: "REAL-TIME", sort_order: 4 },
      { item_key: "central-ias", item_label: "Central IAs", item_url: "/gestaofc/central-ias", item_icon: "Brain", item_area: "central-ias", item_badge: "AI", sort_order: 5 },
    ],
  },
];

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verificar autorização
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authorization required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar se é owner
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verificar se é owner pelo role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!roleData || roleData.role !== "owner") {
      return new Response(JSON.stringify({ error: "Owner only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verificar se já existe dados
    const { data: existingGroups } = await supabase
      .from("menu_groups")
      .select("id")
      .limit(1);

    const { forceReseed } = await req.json().catch(() => ({ forceReseed: false }));

    if (existingGroups && existingGroups.length > 0 && !forceReseed) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Menu já está populado. Use forceReseed: true para repopular." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Se forceReseed, limpar dados existentes
    if (forceReseed) {
      await supabase.from("menu_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("menu_groups").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    }

    // Inserir grupos e itens
    let totalGroups = 0;
    let totalItems = 0;

    for (const groupData of gestaoMenuData) {
      const { items, ...groupFields } = groupData;
      
      // Inserir grupo
      const { data: insertedGroup, error: groupError } = await supabase
        .from("menu_groups")
        .insert(groupFields)
        .select()
        .single();

      if (groupError) {
        console.error("Erro ao inserir grupo:", groupError);
        continue;
      }

      totalGroups++;

      // Inserir itens do grupo
      for (const item of items) {
        const { error: itemError } = await supabase
          .from("menu_items")
          .insert({
            ...item,
            group_id: insertedGroup.id,
            allowed_roles: ["owner", "admin"],
            is_system: true,
          });

        if (itemError) {
          console.error("Erro ao inserir item:", itemError);
        } else {
          totalItems++;
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: `Seed completo: ${totalGroups} grupos e ${totalItems} itens criados`,
      totalGroups,
      totalItems,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Erro no seed:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
