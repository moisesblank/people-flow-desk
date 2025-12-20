import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Wallet,
  Building2,
  RefreshCw,
  Download,
  Upload,
  FileText,
  Calendar,
  Clock,
  Zap,
  Activity,
  PieChart,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Filter,
  Search,
  Eye,
  Paperclip,
  ChevronRight,
  Sparkles,
  Globe,
  Store,
  Banknote,
  Receipt,
  Target,
  Flame,
  Crown,
  Star
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  ComposedChart,
  Line
} from "recharts";
import { format, startOfDay, startOfWeek, startOfMonth, startOfYear, subDays, subMonths, subYears } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type PeriodFilter = "hoje" | "semana" | "mes" | "ano" | "5anos" | "10anos" | "50anos" | "todos";

interface ReceitaSource {
  id: string;
  nome: string;
  icon: React.ReactNode;
  color: string;
  total: number;
  transacoes: number;
  status: "online" | "offline" | "syncing";
  ultimaSync: Date | null;
}

const COLORS = ["#EC4899", "#8B5CF6", "#10B981", "#F59E0B", "#3B82F6", "#EF4444"];

export default function ReceitasEmpresariais() {
  const [period, setPeriod] = useState<PeriodFilter>("mes");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSource, setSelectedSource] = useState<string>("todos");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Buscar entradas do banco
  const { data: entradas, refetch: refetchEntradas } = useQuery({
    queryKey: ["receitas-empresariais", period],
    queryFn: async () => {
      const dateRange = getDateRange(period);
      let query = supabase
        .from("entradas")
        .select("*")
        .order("data", { ascending: false });

      if (dateRange.start) {
        query = query.gte("data", dateRange.start.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000
  });

  // Buscar transações Hotmart
  const { data: transacoesHotmart } = useQuery({
    queryKey: ["transacoes-hotmart", period],
    queryFn: async () => {
      const dateRange = getDateRange(period);
      let query = supabase
        .from("transacoes_hotmart_completo")
        .select("*")
        .eq("status", "approved")
        .order("data_compra", { ascending: false });

      if (dateRange.start) {
        query = query.gte("data_compra", dateRange.start.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000
  });

  // Buscar gastos fixos e extras
  const { data: gastosFixos } = useQuery({
    queryKey: ["gastos-fixos-empresariais", period],
    queryFn: async () => {
      const dateRange = getDateRange(period);
      let query = supabase.from("company_fixed_expenses").select("*");
      
      if (dateRange.start) {
        const startDate = dateRange.start;
        query = query.gte("ano", startDate.getFullYear());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });

  const { data: gastosExtras } = useQuery({
    queryKey: ["gastos-extras-empresariais", period],
    queryFn: async () => {
      const dateRange = getDateRange(period);
      let query = supabase.from("company_extra_expenses").select("*");
      
      if (dateRange.start) {
        query = query.gte("data", dateRange.start.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });

  // Buscar arquivos associados
  const { data: arquivos } = useQuery({
    queryKey: ["arquivos-receitas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("arquivos_universal")
        .select("*")
        .eq("categoria", "receitas")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    }
  });

  function getDateRange(p: PeriodFilter) {
    const now = new Date();
    switch (p) {
      case "hoje":
        return { start: startOfDay(now), end: now };
      case "semana":
        return { start: startOfWeek(now, { locale: ptBR }), end: now };
      case "mes":
        return { start: startOfMonth(now), end: now };
      case "ano":
        return { start: startOfYear(now), end: now };
      case "5anos":
        return { start: subYears(now, 5), end: now };
      case "10anos":
        return { start: subYears(now, 10), end: now };
      case "50anos":
        return { start: subYears(now, 50), end: now };
      default:
        return { start: null, end: now };
    }
  }

  // Calcular totais
  const totalHotmart = transacoesHotmart?.reduce((acc, t) => acc + (t.valor_liquido || t.valor_bruto || 0), 0) || 0;
  const totalEntradas = entradas?.reduce((acc, e) => acc + (e.valor || 0), 0) || 0;
  const totalStone = 0; // Placeholder - será implementado com API real
  const totalAsaas = 0; // Placeholder - será implementado com API real
  const totalOutros = entradas?.filter(e => !e.fonte || e.fonte === "manual")?.reduce((acc, e) => acc + (e.valor || 0), 0) || 0;
  
  const totalReceitas = totalHotmart + totalEntradas;
  const totalGastosFixos = gastosFixos?.reduce((acc, g) => acc + (g.valor || 0), 0) || 0;
  const totalGastosExtras = gastosExtras?.reduce((acc, g) => acc + (g.valor || 0), 0) || 0;
  const totalGastos = totalGastosFixos + totalGastosExtras;
  const saldoFinal = totalReceitas - totalGastos;

  // Fontes de receita
  const receitaSources: ReceitaSource[] = [
    {
      id: "hotmart",
      nome: "Hotmart",
      icon: <Flame className="w-5 h-5" />,
      color: "#EC4899",
      total: totalHotmart,
      transacoes: transacoesHotmart?.length || 0,
      status: "online",
      ultimaSync: new Date()
    },
    {
      id: "stone",
      nome: "Stone",
      icon: <CreditCard className="w-5 h-5" />,
      color: "#10B981",
      total: totalStone,
      transacoes: 0,
      status: "offline",
      ultimaSync: null
    },
    {
      id: "asaas",
      nome: "Asaas",
      icon: <Banknote className="w-5 h-5" />,
      color: "#3B82F6",
      total: totalAsaas,
      transacoes: 0,
      status: "offline",
      ultimaSync: null
    },
    {
      id: "outros",
      nome: "Outros",
      icon: <Receipt className="w-5 h-5" />,
      color: "#F59E0B",
      total: totalOutros,
      transacoes: entradas?.filter(e => !e.fonte || e.fonte === "manual")?.length || 0,
      status: "online",
      ultimaSync: new Date()
    }
  ];

  // Dados REAIS para gráfico de área - agregados do banco
  const chartData = useMemo(() => {
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const anoAtual = new Date().getFullYear();
    
    return meses.map((mes, index) => {
      // Filtrar entradas por mês
      const entradasMes = entradas?.filter(e => {
        const dataEntrada = new Date(e.data || e.created_at);
        return dataEntrada.getMonth() === index && dataEntrada.getFullYear() === anoAtual;
      }) || [];
      
      // Filtrar transações Hotmart por mês
      const hotmartMes = transacoesHotmart?.filter(t => {
        const dataCompra = new Date(t.data_compra);
        return dataCompra.getMonth() === index && dataCompra.getFullYear() === anoAtual;
      }) || [];
      
      const totalHotmartMes = hotmartMes.reduce((acc, t) => acc + (t.valor_liquido || t.valor_bruto || 0), 0);
      const totalOutrosMes = entradasMes.filter(e => !e.fonte || e.fonte === 'manual').reduce((acc, e) => acc + (e.valor || 0), 0);
      
      return {
        name: mes,
        hotmart: totalHotmartMes / 100, // Converter de centavos para reais
        stone: 0, // Placeholder - integração pendente
        asaas: 0, // Placeholder - integração pendente
        outros: totalOutrosMes / 100
      };
    }).filter(d => d.hotmart > 0 || d.outros > 0); // Mostrar apenas meses com dados
  }, [entradas, transacoesHotmart]);

  // Dados para gráfico de pizza
  const pieData = receitaSources.map(s => ({
    name: s.nome,
    value: s.total,
    color: s.color
  })).filter(d => d.value > 0);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchEntradas();
      toast.success("Dados atualizados com sucesso!");
    } catch (error) {
      toast.error("Erro ao atualizar dados");
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  };

  const periodLabels: Record<PeriodFilter, string> = {
    hoje: "Hoje",
    semana: "Esta Semana",
    mes: "Este Mês",
    ano: "Este Ano",
    "5anos": "5 Anos",
    "10anos": "10 Anos",
    "50anos": "50 Anos",
    todos: "Todo Período"
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      {/* Header Futurista */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-pink-600/20 via-purple-600/20 to-blue-600/20 border border-pink-500/30 p-6"
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 shadow-lg shadow-pink-500/30">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
                Central de Receitas
                <Sparkles className="w-6 h-6 text-pink-400 animate-pulse" />
              </h1>
              <p className="text-muted-foreground">
                Monitoramento em tempo real de todas as fontes de receita
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="border-pink-500/30 hover:bg-pink-500/10"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Entrada
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Registrar Nova Entrada</DialogTitle>
                </DialogHeader>
                <NovaEntradaForm onSuccess={() => {
                  setIsAddModalOpen(false);
                  refetchEntradas();
                }} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Status das Integrações */}
        <div className="relative mt-6 flex flex-wrap gap-3">
          {receitaSources.map((source) => (
            <motion.div
              key={source.id}
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/50 border border-border/50"
            >
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{
                  backgroundColor: source.status === "online" ? "#10B981" : source.status === "syncing" ? "#F59E0B" : "#EF4444"
                }}
              />
              <span style={{ color: source.color }}>{source.icon}</span>
              <span className="text-sm font-medium">{source.nome}</span>
              <Badge variant="secondary" className="text-xs">
                {source.status === "online" ? "Conectado" : source.status === "syncing" ? "Sincronizando" : "Desconectado"}
              </Badge>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Filtros de Período */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(periodLabels) as PeriodFilter[]).map((p) => (
          <Button
            key={p}
            variant={period === p ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriod(p)}
            className={period === p ? "bg-pink-600 hover:bg-pink-700" : "border-border/50 hover:bg-pink-500/10"}
          >
            {periodLabels[p]}
          </Button>
        ))}
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Receitas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="relative overflow-hidden border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                Total Receitas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-500">{formatCurrency(totalReceitas)}</p>
              <div className="flex items-center gap-1 mt-2 text-sm text-green-400">
                <ArrowUpRight className="w-4 h-4" />
                <span>+12.5% vs período anterior</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Total Gastos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="relative overflow-hidden border-red-500/30 bg-gradient-to-br from-red-500/10 to-rose-500/5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-500" />
                Total Gastos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-500">{formatCurrency(totalGastos)}</p>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <span>Fixos: {formatCurrency(totalGastosFixos)}</span>
                <span>•</span>
                <span>Extras: {formatCurrency(totalGastosExtras)}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Saldo Final */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className={`relative overflow-hidden ${saldoFinal >= 0 ? "border-pink-500/30 bg-gradient-to-br from-pink-500/10 to-purple-500/5" : "border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-red-500/5"}`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Wallet className="w-4 h-4 text-pink-500" />
                Saldo Final
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${saldoFinal >= 0 ? "text-pink-500" : "text-orange-500"}`}>
                {formatCurrency(saldoFinal)}
              </p>
              <div className="mt-2">
                <Progress value={Math.min((totalReceitas / (totalGastos || 1)) * 100, 100)} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {((totalReceitas / (totalGastos || 1)) * 100).toFixed(1)}% de cobertura
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Transações */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="relative overflow-hidden border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-violet-500/5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-500" />
                Total Transações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-500">
                {receitaSources.reduce((acc, s) => acc + s.transacoes, 0)}
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                {receitaSources.slice(0, 3).map(s => (
                  <span key={s.id} style={{ color: s.color }}>{s.transacoes} {s.nome}</span>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Cards por Fonte de Receita */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {receitaSources.map((source, index) => (
          <motion.div
            key={source.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card
              className="relative overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300"
              style={{ borderColor: `${source.color}30` }}
            >
              <div
                className="absolute inset-0 opacity-10"
                style={{ background: `linear-gradient(135deg, ${source.color}20, transparent)` }}
              />
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span className="flex items-center gap-2" style={{ color: source.color }}>
                    {source.icon}
                    {source.nome}
                  </span>
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: source.status === "online" ? "#10B981" : source.status === "syncing" ? "#F59E0B" : "#EF4444"
                    }}
                  />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold" style={{ color: source.color }}>
                  {formatCurrency(source.total)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {source.transacoes} transações
                </p>
                {source.ultimaSync && (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Última sync: {format(source.ultimaSync, "HH:mm", { locale: ptBR })}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Área - Evolução */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2"
        >
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-pink-500" />
                Evolução das Receitas por Fonte
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `R$${v/1000}k`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend />
                    <Bar dataKey="hotmart" name="Hotmart" fill="#EC4899" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="stone" name="Stone" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="asaas" name="Asaas" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="outros" name="Outros" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="hotmart" stroke="#EC4899" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Gráfico de Pizza - Distribuição */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-purple-500" />
                Distribuição por Fonte
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={pieData.length > 0 ? pieData : [{ name: "Sem dados", value: 1, color: "#666" }]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {(pieData.length > 0 ? pieData : [{ name: "Sem dados", value: 1, color: "#666" }]).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabs de Conteúdo */}
      <Tabs defaultValue="transacoes" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="transacoes">Transações</TabsTrigger>
          <TabsTrigger value="arquivos">Arquivos</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="config">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="transacoes" className="space-y-4">
          {/* Barra de Busca e Filtros */}
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar transações..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedSource} onValueChange={setSelectedSource}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filtrar por fonte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas as Fontes</SelectItem>
                    <SelectItem value="hotmart">Hotmart</SelectItem>
                    <SelectItem value="stone">Stone</SelectItem>
                    <SelectItem value="asaas">Asaas</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="w-full md:w-auto">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Transações */}
          <Card className="border-border/50">
            <CardContent className="p-0">
              <ScrollArea className="h-96">
                <div className="divide-y divide-border/50">
                  {transacoesHotmart?.slice(0, 20).map((t, index) => (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * index }}
                      className="p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-pink-500/10">
                            <Flame className="w-4 h-4 text-pink-500" />
                          </div>
                          <div>
                            <p className="font-medium">{t.buyer_name || "Compra Hotmart"}</p>
                            <p className="text-sm text-muted-foreground">
                              {t.product_name} • {format(new Date(t.data_compra), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-500">{formatCurrency(t.valor_liquido || t.valor_bruto || 0)}</p>
                          <Badge variant="secondary" className="text-xs">{t.status}</Badge>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {entradas?.slice(0, 10).map((e, index) => (
                    <motion.div
                      key={e.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * (index + 20) }}
                      className="p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-yellow-500/10">
                            <Receipt className="w-4 h-4 text-yellow-500" />
                          </div>
                          <div>
                            <p className="font-medium">{e.descricao || "Entrada Manual"}</p>
                            <p className="text-sm text-muted-foreground">
                              {e.fonte || "Manual"} • {format(new Date(e.data), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-500">{formatCurrency(e.valor || 0)}</p>
                          <Badge variant="secondary" className="text-xs">{e.categoria || "Geral"}</Badge>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {(!transacoesHotmart?.length && !entradas?.length) && (
                    <div className="p-8 text-center text-muted-foreground">
                      <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma transação encontrada no período</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="arquivos" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  Arquivos e Documentos
                </span>
                <Button size="sm" variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {arquivos?.map((arquivo) => (
                    <motion.div
                      key={arquivo.id}
                      whileHover={{ scale: 1.02 }}
                      className="p-4 rounded-lg border border-border/50 hover:border-blue-500/30 transition-all cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                          <FileText className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{arquivo.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(arquivo.created_at || ""), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}

                  {!arquivos?.length && (
                    <div className="col-span-full p-8 text-center text-muted-foreground">
                      <Paperclip className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum arquivo encontrado</p>
                      <p className="text-sm">Faça upload de comprovantes, notas fiscais e outros documentos</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="w-4 h-4 text-green-500" />
                  Taxa de Conversão
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-500">4.8%</p>
                <p className="text-xs text-muted-foreground">+0.3% vs mês anterior</p>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Crown className="w-4 h-4 text-yellow-500" />
                  Ticket Médio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-yellow-500">
                  {formatCurrency(totalReceitas / Math.max(receitaSources.reduce((acc, s) => acc + s.transacoes, 0), 1))}
                </p>
                <p className="text-xs text-muted-foreground">Por transação</p>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Star className="w-4 h-4 text-purple-500" />
                  Margem de Lucro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-purple-500">
                  {totalReceitas > 0 ? ((saldoFinal / totalReceitas) * 100).toFixed(1) : 0}%
                </p>
                <p className="text-xs text-muted-foreground">Lucro líquido / Receita</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Configurar Integrações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {receitaSources.map((source) => (
                <div key={source.id} className="flex items-center justify-between p-4 rounded-lg border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${source.color}20` }}>
                      <span style={{ color: source.color }}>{source.icon}</span>
                    </div>
                    <div>
                      <p className="font-medium">{source.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        {source.status === "online" ? "Conectado e sincronizando" : "Aguardando configuração"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant={source.status === "online" ? "outline" : "default"}
                    size="sm"
                    className={source.status !== "online" ? "bg-gradient-to-r from-pink-600 to-purple-600" : ""}
                  >
                    {source.status === "online" ? "Configurado" : "Configurar"}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Componente de Formulário para Nova Entrada
function NovaEntradaForm({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    descricao: "",
    valor: "",
    data: format(new Date(), "yyyy-MM-dd"),
    fonte: "manual",
    categoria: "venda"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("entradas").insert({
        descricao: form.descricao,
        valor: parseFloat(form.valor),
        data: form.data,
        fonte: form.fonte,
        categoria: form.categoria
      });

      if (error) throw error;

      toast.success("Entrada registrada com sucesso!");
      onSuccess();
    } catch (error) {
      toast.error("Erro ao registrar entrada");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Descrição</Label>
        <Input
          value={form.descricao}
          onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          placeholder="Descrição da entrada"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Valor (R$)</Label>
          <Input
            type="number"
            step="0.01"
            value={form.valor}
            onChange={(e) => setForm({ ...form, valor: e.target.value })}
            placeholder="0,00"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Data</Label>
          <Input
            type="date"
            value={form.data}
            onChange={(e) => setForm({ ...form, data: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Fonte</Label>
          <Select value={form.fonte} onValueChange={(v) => setForm({ ...form, fonte: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="hotmart">Hotmart</SelectItem>
              <SelectItem value="stone">Stone</SelectItem>
              <SelectItem value="asaas">Asaas</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Categoria</Label>
          <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="venda">Venda Curso</SelectItem>
              <SelectItem value="consultoria">Consultoria</SelectItem>
              <SelectItem value="mentoria">Mentoria</SelectItem>
              <SelectItem value="patrocinio">Patrocínio</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" className="w-full bg-gradient-to-r from-pink-600 to-purple-600" disabled={loading}>
        {loading ? "Salvando..." : "Registrar Entrada"}
      </Button>
    </form>
  );
}
