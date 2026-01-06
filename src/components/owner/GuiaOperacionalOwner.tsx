// ============================================
// 📘 GUIA OPERACIONAL - EXCLUSIVO OWNER
// Constituição SYNAPSE Ω v10.x
// Como se comunicar corretamente com a IA
// ============================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  MessageSquare, 
  Shield, 
  Zap, 
  AlertTriangle,
  Check,
  X,
  Copy,
  ChevronRight,
  Target,
  Code,
  FileText,
  Users,
  Lock,
  Lightbulb,
  Terminal,
  Layers,
  Eye,
  Hammer,
  Search,
  RefreshCw,
  Map,
  PlusCircle,
  Settings,
  CheckCircle2,
  XCircle,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ============================================
// TIPOS
// ============================================

interface TipoPedido {
  id: string;
  nome: string;
  descricao: string;
  icon: React.ElementType;
  cor: string;
  exemplo: string;
  quandoUsar: string[];
}

interface TermoUsar {
  termo: string;
  descricao: string;
  correto: boolean;
}

interface Trava {
  nome: string;
  descricao: string;
  exemplo?: string;
}

interface AreaSistema {
  path: string;
  nome: string;
  roles: string[];
  descricao: string;
}

interface NivelRisco {
  nivel: string;
  cor: string;
  descricao: string;
  exemplos: string[];
}

// ============================================
// DADOS
// ============================================

const TIPOS_PEDIDOS: TipoPedido[] = [
  {
    id: "corrigir",
    nome: "CORRIGIR",
    descricao: "Consertar algo que está quebrado ou funcionando incorretamente",
    icon: Hammer,
    cor: "text-red-400 bg-red-500/10 border-red-500/30",
    exemplo: `[CORRIGIR] em /gestaofc:
O botão 'Salvar' não está funcionando na tela de cadastro de alunos.
Console mostra erro: "Cannot read property 'id' of undefined"`,
    quandoUsar: [
      "Bug ou erro no sistema",
      "Comportamento incorreto",
      "Funcionalidade que parou de funcionar",
      "Mensagem de erro aparecendo"
    ]
  },
  {
    id: "auditar",
    nome: "AUDITAR",
    descricao: "Verificar se algo está configurado/funcionando corretamente",
    icon: Search,
    cor: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    exemplo: `[AUDITAR]:
Verifique se a tabela 'alunos' tem RLS ativo e se as policies 
estão corretas para a role 'suporte'.`,
    quandoUsar: [
      "Verificar configuração de segurança",
      "Confirmar permissões de acesso",
      "Checar integridade de dados",
      "Revisar RLS e policies"
    ]
  },
  {
    id: "estender",
    nome: "ESTENDER",
    descricao: "Adicionar funcionalidade nova SEM alterar o que já existe",
    icon: PlusCircle,
    cor: "text-green-400 bg-green-500/10 border-green-500/30",
    exemplo: `[ESTENDER] [RISCO BAIXO] em /gestaofc:
Adicionar campo 'WhatsApp' no formulário de cadastro de aluno.
Manter todos os campos existentes, apenas adicionar o novo.`,
    quandoUsar: [
      "Novo campo em formulário existente",
      "Nova coluna em tabela existente",
      "Novo botão/ação em tela existente",
      "Funcionalidade adicional compatível"
    ]
  },
  {
    id: "validar",
    nome: "VALIDAR",
    descricao: "Testar se algo funciona como esperado",
    icon: CheckCircle2,
    cor: "text-purple-400 bg-purple-500/10 border-purple-500/30",
    exemplo: `[VALIDAR]:
Confirme se um usuário com role 'monitoria' consegue acessar 
/gestaofc/redacoes mas NÃO consegue acessar /gestaofc/financeiro.`,
    quandoUsar: [
      "Testar permissões de acesso",
      "Verificar fluxo de usuário",
      "Confirmar que regra está funcionando",
      "Checar isolamento entre áreas"
    ]
  },
  {
    id: "mapear",
    nome: "MAPEAR",
    descricao: "Listar, documentar ou visualizar elementos do sistema",
    icon: Map,
    cor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
    exemplo: `[MAPEAR]:
Liste todas as rotas de /gestaofc com as roles que têm 
permissão de acesso a cada uma.`,
    quandoUsar: [
      "Listar rotas/páginas",
      "Documentar estrutura",
      "Visualizar permissões",
      "Inventariar recursos"
    ]
  },
  {
    id: "criar",
    nome: "CRIAR",
    descricao: "Algo totalmente novo (REQUER mais detalhes)",
    icon: Zap,
    cor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    exemplo: `[CRIAR] em /gestaofc:
- O que: Painel de métricas de WhatsApp
- Onde: /gestaofc/whatsapp/metricas
- Quem acessa: owner, admin, suporte
- Usa tabelas: whatsapp_conversations (existente)
- Cria role nova: NÃO
- Depende de: Nada
- Risco: BAIXO`,
    quandoUsar: [
      "Nova página/tela",
      "Novo componente complexo",
      "Nova integração",
      "Novo módulo do sistema"
    ]
  }
];

const TERMOS: TermoUsar[] = [
  { termo: "role", descricao: "suporte, admin, beta, owner...", correto: true },
  { termo: "tipo de usuário", descricao: "Genérico demais", correto: false },
  { termo: "tabela", descricao: "alunos, user_roles, profiles...", correto: true },
  { termo: "banco / dados", descricao: "Genérico demais", correto: false },
  { termo: "RLS / policy", descricao: "Regra de segurança no banco", correto: true },
  { termo: "permissão", descricao: "Pode ser ambíguo", correto: false },
  { termo: "/gestaofc, /alunos", descricao: "Caminho específico", correto: true },
  { termo: "área do sistema", descricao: "Vago, qual área?", correto: false },
  { termo: "PATCH-ONLY", descricao: "Mudanças incrementais", correto: true },
  { termo: "refatore tudo", descricao: "Viola a Constituição", correto: false },
  { termo: "Edge Function", descricao: "Função backend específica", correto: true },
  { termo: "API", descricao: "Genérico demais", correto: false },
  { termo: "owner, admin, suporte", descricao: "Roles da Constituição", correto: true },
  { termo: "funcionário, employee", descricao: "DEPRECATED - não usar", correto: false },
];

const TRAVAS: Trava[] = [
  { 
    nome: "NÃO REFATORAR", 
    descricao: "Manter código existente intacto, fazer apenas a mudança pedida",
    exemplo: "NÃO REFATORAR: Não altere a estrutura do componente, apenas corrija o bug"
  },
  { 
    nome: "NÃO CRIAR ROLES", 
    descricao: "Usar apenas roles da Constituição v10.x",
    exemplo: "NÃO CRIAR ROLES: Use apenas owner, admin, suporte, monitoria..."
  },
  { 
    nome: "NÃO CRIAR TABELAS", 
    descricao: "Usar apenas tabelas existentes no banco",
    exemplo: "NÃO CRIAR TABELAS: Use dados da tabela alunos existente"
  },
  { 
    nome: "NÃO SUGERIR ALTERNATIVAS", 
    descricao: "Fazer exatamente o que foi pedido",
    exemplo: "NÃO SUGERIR ALTERNATIVAS: Execute conforme especificado"
  },
  { 
    nome: "SEM SUPOSIÇÕES", 
    descricao: "Se faltar informação, PERGUNTE antes de executar",
    exemplo: "SEM SUPOSIÇÕES: Se algo não estiver claro, pergunte antes"
  },
  { 
    nome: "PATCH-ONLY", 
    descricao: "Mudanças mínimas e incrementais",
    exemplo: "PATCH-ONLY: Altere apenas as linhas necessárias"
  },
];

const AREAS_SISTEMA: AreaSistema[] = [
  {
    path: "/gestaofc",
    nome: "Gestão (Funcionários)",
    roles: ["owner", "admin", "coordenacao", "contabilidade", "suporte", "monitoria", "marketing", "afiliado"],
    descricao: "Área interna para quem TRABALHA na empresa"
  },
  {
    path: "/alunos/dashboard",
    nome: "Portal do Aluno",
    roles: ["owner", "beta", "aluno_gratuito"],
    descricao: "Área para quem ESTUDA na plataforma"
  },
  {
    path: "/comunidade",
    nome: "Comunidade",
    roles: ["owner", "beta", "aluno_gratuito"],
    descricao: "Fórum e interação entre alunos"
  },
  {
    path: "/auth",
    nome: "Autenticação",
    roles: ["*"],
    descricao: "Login único centralizado (NUNCA redirecionar aqui após login!)"
  },
];

const NIVEIS_RISCO: NivelRisco[] = [
  {
    nivel: "SEM RISCO",
    cor: "text-green-400 bg-green-500/10",
    descricao: "Mudanças visuais, texto, estilo",
    exemplos: ["Alterar cor de botão", "Corrigir texto", "Ajustar espaçamento"]
  },
  {
    nivel: "RISCO BAIXO",
    cor: "text-blue-400 bg-blue-500/10",
    descricao: "Novo campo ou componente simples",
    exemplos: ["Adicionar campo em form", "Novo botão", "Nova coluna em lista"]
  },
  {
    nivel: "RISCO MÉDIO",
    cor: "text-amber-400 bg-amber-500/10",
    descricao: "Nova página ou componente complexo",
    exemplos: ["Nova página completa", "Nova integração", "Novo fluxo"]
  },
  {
    nivel: "RISCO CRÍTICO",
    cor: "text-red-400 bg-red-500/10",
    descricao: "Afeta auth, roles, RLS, pagamentos",
    exemplos: ["Alterar permissões", "Mexer em RLS", "Alterar login", "Alterar roles"]
  },
];

const TEMPLATE_UNIVERSAL = `[TIPO: CORRIGIR | ESTENDER | CRIAR | AUDITAR | VALIDAR | MAPEAR]
[RISCO: SEM RISCO | BAIXO | MÉDIO | CRÍTICO]

📍 ÁREA: /gestaofc | /alunos | /comunidade | /auth

📋 DESCRIÇÃO:
[O que você quer, em 1-2 frases]

📊 DETALHES:
- Componente/Página: [nome ou URL]
- Tabelas envolvidas: [nomes]
- Roles afetadas: [lista]

🚫 TRAVAS:
- [ ] NÃO REFATORAR
- [ ] NÃO CRIAR ROLES
- [ ] NÃO CRIAR TABELAS
- [ ] PATCH-ONLY
- [ ] SEM SUPOSIÇÕES

📎 CONTEXTO EXTRA:
[Print, erro, log - se tiver]`;

// ============================================
// COMPONENTES AUXILIARES
// ============================================

function CopyButton({ text }: { text: string }) {
  const { toast } = useToast();
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: "Template copiado para a área de transferência" });
  };
  
  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleCopy}
      className="gap-2 text-muted-foreground hover:text-foreground"
    >
      <Copy className="h-4 w-4" />
      Copiar
    </Button>
  );
}

function CodeBlock({ code, title }: { code: string; title?: string }) {
  return (
    <div className="relative">
      {title && (
        <div className="flex items-center justify-between px-4 py-2 bg-muted/50 rounded-t-lg border border-b-0 border-border">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          <CopyButton text={code} />
        </div>
      )}
      <pre className={cn(
        "p-4 bg-secondary/50 text-sm overflow-x-auto font-mono",
        title ? "rounded-b-lg border border-t-0" : "rounded-lg border"
      )}>
        <code className="text-foreground">{code}</code>
      </pre>
    </div>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function GuiaOperacionalOwner() {
  const [activeTab, setActiveTab] = useState("tipos");
  const [expandedTipo, setExpandedTipo] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6 border-primary/20"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                OWNER ONLY
              </Badge>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30">
                CONSTITUIÇÃO v10.x
              </Badge>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Guia Operacional de Comunicação
            </h2>
            <p className="text-muted-foreground">
              Como pedir coisas corretamente para a IA sem gerar ambiguidade, respeitando 
              <span className="text-primary font-medium"> PATCH-ONLY</span>, 
              <span className="text-primary font-medium"> ZERO REGRESSÃO</span> e a Constituição.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 h-auto gap-1 p-1">
          <TabsTrigger value="tipos" className="gap-2 py-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Tipos</span>
          </TabsTrigger>
          <TabsTrigger value="termos" className="gap-2 py-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Termos</span>
          </TabsTrigger>
          <TabsTrigger value="areas" className="gap-2 py-2">
            <Layers className="h-4 w-4" />
            <span className="hidden sm:inline">Áreas</span>
          </TabsTrigger>
          <TabsTrigger value="riscos" className="gap-2 py-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Riscos</span>
          </TabsTrigger>
          <TabsTrigger value="travas" className="gap-2 py-2">
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline">Travas</span>
          </TabsTrigger>
          <TabsTrigger value="template" className="gap-2 py-2">
            <Terminal className="h-4 w-4" />
            <span className="hidden sm:inline">Template</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB: Tipos de Pedidos */}
        <TabsContent value="tipos" className="space-y-4">
          <div className="grid gap-4">
            {TIPOS_PEDIDOS.map((tipo) => (
              <motion.div
                key={tipo.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "glass-card rounded-xl border transition-all cursor-pointer",
                  expandedTipo === tipo.id ? "border-primary/50" : "border-border hover:border-primary/30"
                )}
                onClick={() => setExpandedTipo(expandedTipo === tipo.id ? null : tipo.id)}
              >
                <div className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-2 rounded-lg", tipo.cor)}>
                      <tipo.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-foreground">{tipo.nome}</h3>
                        <ChevronRight className={cn(
                          "h-4 w-4 text-muted-foreground transition-transform",
                          expandedTipo === tipo.id && "rotate-90"
                        )} />
                      </div>
                      <p className="text-sm text-muted-foreground">{tipo.descricao}</p>
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {expandedTipo === tipo.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <Separator className="my-4" />
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">
                              Quando usar:
                            </h4>
                            <ul className="grid gap-1.5">
                              {tipo.quandoUsar.map((item, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm">
                                  <Check className="h-3 w-3 text-green-400" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <CodeBlock code={tipo.exemplo} title="Exemplo de pedido:" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* TAB: Termos */}
        <TabsContent value="termos" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Termos Corretos vs Incorretos
              </CardTitle>
              <CardDescription>
                Use os termos corretos para evitar ambiguidade na comunicação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {TERMOS.map((termo, index) => (
                  <div 
                    key={index}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border",
                      termo.correto 
                        ? "bg-green-500/5 border-green-500/20" 
                        : "bg-red-500/5 border-red-500/20"
                    )}
                  >
                    {termo.correto ? (
                      <Check className="h-4 w-4 text-green-400 shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-red-400 shrink-0" />
                    )}
                    <code className={cn(
                      "font-mono text-sm font-medium px-2 py-0.5 rounded",
                      termo.correto ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                    )}>
                      {termo.termo}
                    </code>
                    <span className="text-sm text-muted-foreground">
                      {termo.descricao}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Áreas do Sistema */}
        <TabsContent value="areas" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                Áreas Isoladas do Sistema
              </CardTitle>
              <CardDescription>
                Cada área é um bloco isolado. Sempre indique a área afetada no pedido.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {AREAS_SISTEMA.map((area, index) => (
                <div 
                  key={index}
                  className="p-4 rounded-xl bg-secondary/30 border border-border"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <code className="font-mono text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded">
                      {area.path}
                    </code>
                    <span className="font-medium text-foreground">{area.nome}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{area.descricao}</p>
                  <div className="flex flex-wrap gap-1">
                    {area.roles.map((role) => (
                      <Badge 
                        key={role} 
                        variant="outline" 
                        className="text-xs"
                      >
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
              
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
                <div className="flex items-center gap-2 text-destructive mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">REGRA CRÍTICA</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  <strong>GESTÃO e ALUNOS não vazam acesso entre si.</strong> Sem bypass por URL, 
                  refresh ou deep link. Segurança é server-side (RLS + RBAC).
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Níveis de Risco */}
        <TabsContent value="riscos" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                Níveis de Risco
              </CardTitle>
              <CardDescription>
                Sempre indique o nível de risco do seu pedido para eu saber se devo parar e perguntar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {NIVEIS_RISCO.map((risco, index) => (
                <div 
                  key={index}
                  className="p-4 rounded-xl bg-secondary/30 border border-border"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className={risco.cor}>
                      {risco.nivel}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{risco.descricao}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {risco.exemplos.map((ex, i) => (
                      <span 
                        key={i}
                        className="text-xs bg-muted px-2 py-1 rounded"
                      >
                        {ex}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Travas */}
        <TabsContent value="travas" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Travas de Segurança
              </CardTitle>
              <CardDescription>
                Use essas travas para me bloquear de fazer coisas que você NÃO quer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {TRAVAS.map((trava, index) => (
                <div 
                  key={index}
                  className="p-4 rounded-xl bg-secondary/30 border border-border"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-amber-400" />
                    <code className="font-mono text-sm font-bold text-amber-400">
                      {trava.nome}
                    </code>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{trava.descricao}</p>
                  {trava.exemplo && (
                    <p className="text-xs text-muted-foreground/70 italic">
                      Ex: "{trava.exemplo}"
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Template Universal */}
        <TabsContent value="template" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5 text-primary" />
                Template Universal
              </CardTitle>
              <CardDescription>
                Copie e use este template para fazer qualquer pedido de forma estruturada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock code={TEMPLATE_UNIVERSAL} title="Template para copiar:" />
              
              <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <Lightbulb className="h-4 w-4" />
                  <span className="font-medium">Dica</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Se não souber classificar seu pedido, comece assim:
                </p>
                <p className="text-sm text-foreground mt-2 italic">
                  "Quero fazer X. Me ajude a formular o pedido corretamente antes de executar."
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Quick Reference Card */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Referência Rápida
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">SEMPRE INCLUIR:</h4>
                  <ul className="space-y-1">
                    {["TIPO (Corrigir, Estender...)", "ÁREA (/gestaofc, /alunos...)", "RISCO (Baixo, Médio...)", "TRAVAS relevantes"].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="h-3 w-3 text-green-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">NUNCA FAZER:</h4>
                  <ul className="space-y-1">
                    {["Pedir refatoração geral", "Criar roles novas", "Ignorar áreas isoladas", "Assumir que eu sei o contexto"].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <X className="h-3 w-3 text-red-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
