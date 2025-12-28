// ============================================
// 📐 FORMULA ENGINE — Motor de Fórmulas Reativas
// Extraído do LiveSheetContext para Single Responsibility
// ============================================

export interface FormulaDefinition {
  id: string;
  name: string;
  dependencies: string[];
  compute: (deps: Record<string, number>) => number;
  category: 'financial' | 'kpi' | 'counter' | 'percentage' | 'projection';
}

// ===== FÓRMULAS DO SISTEMA =====
// Todas as fórmulas com dependências explícitas
export const SYSTEM_FORMULAS: FormulaDefinition[] = [
  // === FINANCEIRO ===
  {
    id: 'saldo_mes',
    name: 'Saldo do Mês',
    dependencies: ['receita_mes', 'despesa_mes'],
    compute: (deps) => deps.receita_mes - deps.despesa_mes,
    category: 'financial'
  },
  {
    id: 'lucro_liquido',
    name: 'Lucro Líquido',
    dependencies: ['receita_mes', 'despesa_pessoal', 'despesa_empresa'],
    compute: (deps) => deps.receita_mes - deps.despesa_pessoal - deps.despesa_empresa,
    category: 'financial'
  },
  {
    id: 'despesa_total',
    name: 'Despesa Total',
    dependencies: ['despesa_pessoal', 'despesa_empresa', 'despesa_fixa'],
    compute: (deps) => deps.despesa_pessoal + deps.despesa_empresa + (deps.despesa_fixa || 0),
    category: 'financial'
  },
  
  // === PERCENTUAIS (KPIs) ===
  {
    id: 'taxa_economia',
    name: 'Taxa de Economia',
    dependencies: ['receita_mes', 'saldo_mes'],
    compute: (deps) => deps.receita_mes > 0 ? (deps.saldo_mes / deps.receita_mes) * 100 : 0,
    category: 'percentage'
  },
  {
    id: 'margem_lucro',
    name: 'Margem de Lucro',
    dependencies: ['receita_mes', 'lucro_liquido'],
    compute: (deps) => deps.receita_mes > 0 ? (deps.lucro_liquido / deps.receita_mes) * 100 : 0,
    category: 'percentage'
  },
  {
    id: 'uso_orcamento',
    name: 'Uso do Orçamento',
    dependencies: ['receita_mes', 'despesa_total'],
    compute: (deps) => deps.receita_mes > 0 ? Math.min((deps.despesa_total / deps.receita_mes) * 100, 150) : 0,
    category: 'percentage'
  },
  {
    id: 'progresso_meta',
    name: 'Progresso da Meta',
    dependencies: ['receita_mes', 'meta_mensal'],
    compute: (deps) => deps.meta_mensal > 0 ? Math.min((deps.receita_mes / deps.meta_mensal) * 100, 100) : 0,
    category: 'percentage'
  },
  {
    id: 'taxa_conversao',
    name: 'Taxa de Conversão',
    dependencies: ['vendas_mes', 'leads_total'],
    compute: (deps) => deps.leads_total > 0 ? (deps.vendas_mes / deps.leads_total) * 100 : 0,
    category: 'percentage'
  },
  {
    id: 'taxa_conclusao_tarefas',
    name: 'Taxa de Conclusão',
    dependencies: ['tarefas_concluidas', 'tarefas_total'],
    compute: (deps) => deps.tarefas_total > 0 ? (deps.tarefas_concluidas / deps.tarefas_total) * 100 : 0,
    category: 'percentage'
  },
  
  // === PROJEÇÕES (baseadas em dados reais) ===
  {
    id: 'receita_projetada',
    name: 'Receita Projetada',
    dependencies: ['receita_mes', 'taxa_crescimento_receita'],
    compute: (deps) => deps.receita_mes * (1 + (deps.taxa_crescimento_receita || 0) / 100),
    category: 'projection'
  },
  {
    id: 'despesa_projetada',
    name: 'Despesa Projetada',
    dependencies: ['despesa_total', 'taxa_crescimento_despesa'],
    compute: (deps) => deps.despesa_total * (1 + (deps.taxa_crescimento_despesa || 0) / 100),
    category: 'projection'
  },
  {
    id: 'alunos_projetados',
    name: 'Alunos Projetados',
    dependencies: ['alunos_ativos', 'taxa_crescimento_alunos'],
    compute: (deps) => Math.round(deps.alunos_ativos * (1 + (deps.taxa_crescimento_alunos || 0) / 100)),
    category: 'projection'
  },
  
  // === KPIs DE NEGÓCIO ===
  {
    id: 'ltv',
    name: 'LTV (Lifetime Value)',
    dependencies: ['receita_por_aluno', 'tempo_medio_retencao'],
    compute: (deps) => deps.receita_por_aluno * deps.tempo_medio_retencao,
    category: 'kpi'
  },
  {
    id: 'cac',
    name: 'CAC (Custo Aquisição)',
    dependencies: ['despesa_marketing', 'novos_alunos_mes'],
    compute: (deps) => deps.novos_alunos_mes > 0 ? deps.despesa_marketing / deps.novos_alunos_mes : 0,
    category: 'kpi'
  },
  {
    id: 'roi_marketing',
    name: 'ROI de Marketing',
    dependencies: ['receita_mes', 'despesa_marketing'],
    compute: (deps) => deps.despesa_marketing > 0 ? ((deps.receita_mes - deps.despesa_marketing) / deps.despesa_marketing) * 100 : 0,
    category: 'kpi'
  },
  {
    id: 'churn_rate',
    name: 'Taxa de Churn',
    dependencies: ['alunos_cancelados', 'alunos_ativos'],
    compute: (deps) => deps.alunos_ativos > 0 ? (deps.alunos_cancelados / deps.alunos_ativos) * 100 : 0,
    category: 'kpi'
  },
  
  // === CONTADORES DERIVADOS ===
  {
    id: 'alunos_inativos',
    name: 'Alunos Inativos',
    dependencies: ['alunos_total', 'alunos_ativos'],
    compute: (deps) => Math.max(0, deps.alunos_total - deps.alunos_ativos),
    category: 'counter'
  },
  {
    id: 'tarefas_pendentes',
    name: 'Tarefas Pendentes',
    dependencies: ['tarefas_total', 'tarefas_concluidas'],
    compute: (deps) => Math.max(0, deps.tarefas_total - deps.tarefas_concluidas),
    category: 'counter'
  },
  {
    id: 'falta_para_meta',
    name: 'Falta para Meta',
    dependencies: ['meta_mensal', 'receita_mes'],
    compute: (deps) => Math.max(0, deps.meta_mensal - deps.receita_mes),
    category: 'financial'
  },
];

// ===== ORDENAÇÃO TOPOLÓGICA =====
export function buildDependencyGraph(formulas: FormulaDefinition[]) {
  const formulaMap = new Map(formulas.map(f => [f.id, f]));
  const dependencyGraph: Record<string, string[]> = {};
  const reverseDependencyGraph: Record<string, string[]> = {};
  
  formulas.forEach(formula => {
    dependencyGraph[formula.id] = formula.dependencies;
    
    formula.dependencies.forEach(dep => {
      if (!reverseDependencyGraph[dep]) {
        reverseDependencyGraph[dep] = [];
      }
      reverseDependencyGraph[dep].push(formula.id);
    });
  });
  
  return { formulaMap, dependencyGraph, reverseDependencyGraph };
}

// Kahn's Algorithm para ordenação topológica
export function topologicalSort(formulas: FormulaDefinition[]): FormulaDefinition[] {
  const inDegree: Record<string, number> = {};
  const adjacency: Record<string, string[]> = {};
  const formulaMap = new Map(formulas.map(f => [f.id, f]));
  
  // Inicializar
  formulas.forEach(f => {
    inDegree[f.id] = 0;
    adjacency[f.id] = [];
  });
  
  // Construir grafo
  formulas.forEach(f => {
    f.dependencies.forEach(dep => {
      if (formulaMap.has(dep)) {
        adjacency[dep].push(f.id);
        inDegree[f.id]++;
      }
    });
  });
  
  // BFS
  const queue: string[] = Object.entries(inDegree)
    .filter(([_, deg]) => deg === 0)
    .map(([id]) => id);
  
  const sorted: FormulaDefinition[] = [];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    const formula = formulaMap.get(current);
    if (formula) {
      sorted.push(formula);
    }
    
    adjacency[current]?.forEach(neighbor => {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) {
        queue.push(neighbor);
      }
    });
  }
  
  return sorted;
}

// ===== MOTOR DE CÁLCULO =====
export function computeFormulas(
  formulas: FormulaDefinition[],
  baseData: Record<string, number>
): Record<string, number> {
  const sortedFormulas = topologicalSort(formulas);
  const computed: Record<string, number> = { ...baseData };
  
  sortedFormulas.forEach(formula => {
    const deps: Record<string, number> = {};
    formula.dependencies.forEach(dep => {
      deps[dep] = computed[dep] ?? 0;
    });
    
    try {
      computed[formula.id] = formula.compute(deps);
    } catch (err) {
      console.warn(`[FormulaEngine] Erro ao calcular ${formula.id}:`, err);
      computed[formula.id] = 0;
    }
  });
  
  return computed;
}

// ===== RECOMPUTAR APENAS AFETADOS =====
export function recomputeAffected(
  changedKey: string,
  reverseDependencyGraph: Record<string, string[]>,
  formulaMap: Map<string, FormulaDefinition>,
  currentData: Record<string, number>
): Record<string, number> {
  const affected = new Set<string>();
  const queue = [changedKey];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    const dependents = reverseDependencyGraph[current] || [];
    
    dependents.forEach(dep => {
      if (!affected.has(dep)) {
        affected.add(dep);
        queue.push(dep);
      }
    });
  }
  
  const updates: Record<string, number> = {};
  
  affected.forEach(formulaId => {
    const formula = formulaMap.get(formulaId);
    if (formula) {
      const deps: Record<string, number> = {};
      formula.dependencies.forEach(dep => {
        deps[dep] = currentData[dep] ?? updates[dep] ?? 0;
      });
      
      try {
        updates[formulaId] = formula.compute(deps);
      } catch {
        updates[formulaId] = 0;
      }
    }
  });
  
  return updates;
}
