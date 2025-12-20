import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign,
  Eye,
  MousePointer,
  Clock,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Download
} from "lucide-react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

const revenueData = [
  { month: "Jan", value: 45000 },
  { month: "Fev", value: 52000 },
  { month: "Mar", value: 48000 },
  { month: "Abr", value: 61000 },
  { month: "Mai", value: 55000 },
  { month: "Jun", value: 67000 },
  { month: "Jul", value: 72000 },
  { month: "Ago", value: 78000 },
  { month: "Set", value: 85000 },
  { month: "Out", value: 92000 },
  { month: "Nov", value: 98000 },
  { month: "Dez", value: 115000 },
];

const trafficData = [
  { source: "Orgânico", value: 45, color: "#22c55e" },
  { source: "Pago", value: 30, color: "#3b82f6" },
  { source: "Social", value: 15, color: "#a855f7" },
  { source: "Direto", value: 10, color: "#f59e0b" },
];

const conversionData = [
  { stage: "Visitantes", value: 10000 },
  { stage: "Leads", value: 2500 },
  { stage: "Oportunidades", value: 500 },
  { stage: "Vendas", value: 125 },
];

const kpis = [
  { label: "Faturamento Mensal", value: "R$ 115.000", change: "+18.4%", positive: true, icon: DollarSign },
  { label: "Alunos Ativos", value: "3.847", change: "+12.3%", positive: true, icon: Users },
  { label: "Taxa de Conversão", value: "4.8%", change: "+0.5%", positive: true, icon: Target },
  { label: "Ticket Médio", value: "R$ 897", change: "-2.1%", positive: false, icon: TrendingUp },
  { label: "CAC", value: "R$ 125", change: "-8.5%", positive: true, icon: MousePointer },
  { label: "LTV", value: "R$ 2.450", change: "+15.2%", positive: true, icon: Clock },
];

export default function Metricas() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
            <BarChart3 className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Métricas & Analytics</h1>
            <p className="text-muted-foreground">Moisés Medeiros - Curso de Química</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Últimos 30 dias
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </motion.div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi, index) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="border-border/50 hover:border-primary/30 transition-all hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{kpi.label}</p>
                    <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                    <div className="flex items-center gap-1 mt-2">
                      {kpi.positive ? (
                        <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-500" />
                      )}
                      <span className={kpi.positive ? "text-emerald-500" : "text-red-500"}>
                        {kpi.change}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-primary/10">
                    <kpi.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Evolução do Faturamento
            </CardTitle>
            <CardDescription>Receita mensal em 2024</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="#ffffff" tick={{ fill: "#ffffff", fontWeight: "bold" }} />
                <YAxis stroke="#ffffff" tick={{ fill: "#ffffff", fontWeight: "bold" }} tickFormatter={(v) => `R$${v/1000}k`} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "#ffffff",
                    fontWeight: "bold",
                  }}
                  labelStyle={{ color: "#ffffff", fontWeight: "bold" }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString()}`, "Faturamento"]}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--primary))" 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Traffic Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-500" />
              Fontes de Tráfego
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={trafficData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {trafficData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {trafficData.map((item) => (
                <div key={item.source} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm">{item.source} ({item.value}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-emerald-500" />
              Funil de Conversão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={conversionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="#ffffff" tick={{ fill: "#ffffff", fontWeight: "bold" }} />
                <YAxis type="category" dataKey="stage" stroke="#ffffff" tick={{ fill: "#ffffff", fontWeight: "bold" }} width={100} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "#ffffff",
                    fontWeight: "bold",
                  }}
                  labelStyle={{ color: "#ffffff", fontWeight: "bold" }}
                />
                <Bar 
                  dataKey="value" 
                  fill="hsl(var(--primary))" 
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
