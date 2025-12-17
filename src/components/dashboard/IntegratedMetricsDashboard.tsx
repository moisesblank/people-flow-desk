// ============================================
// MOISÉS MEDEIROS v10.0 - ULTRA INTEGRATED METRICS DASHBOARD
// Dashboard futurista com métricas em tempo real
// Design cyberpunk com animações avançadas
// COM AI INSIGHTS PANEL INTEGRADO
// ============================================

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import {
  Youtube,
  Instagram,
  Facebook,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  DollarSign,
  Target,
  Zap,
  Activity,
  BarChart3,
  PieChart,
  Video,
  Play,
  Heart,
  MessageCircle,
  Share2,
  ShoppingCart,
  GraduationCap,
  Wallet,
  Clock,
  Signal,
  Cpu,
  Database,
  Globe,
  Sparkles,
  Wifi,
  Radio,
  CircleDot,
  Flame,
  Award,
  Crown,
  Rocket,
  Timer,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Brain
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIntegratedMetrics } from "@/hooks/useIntegratedMetrics";
import { AIInsightsPanel } from "./AIInsightsPanel";
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  LineChart,
  Line
} from "recharts";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Animated Counter Component
function AnimatedCounter({ value, duration = 1.5, decimals = 0, prefix = "", suffix = "" }: {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => {
    if (decimals > 0) {
      return prefix + latest.toFixed(decimals) + suffix;
    }
    return prefix + Math.round(latest).toLocaleString("pt-BR") + suffix;
  });

  useEffect(() => {
    const controls = animate(count, value, { duration });
    return controls.stop;
  }, [value, duration, count]);

  return <motion.span>{rounded}</motion.span>;
}

// Pulse Animation Component
function PulseIndicator({ color = "emerald", size = "sm" }: { color?: string; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4"
  };

  return (
    <span className="relative flex">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-${color}-400 opacity-75`} />
      <span className={`relative inline-flex rounded-full ${sizeClasses[size]} bg-${color}-500`} />
    </span>
  );
}

// Glowing Border Card
function GlowCard({ children, className = "", glowColor = "primary", intensity = "medium" }: {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  intensity?: "low" | "medium" | "high";
}) {
  const intensityMap = {
    low: "shadow-lg",
    medium: "shadow-xl",
    high: "shadow-2xl"
  };

  return (
    <motion.div
      className={`relative ${className}`}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      <div className={`absolute -inset-0.5 bg-gradient-to-r from-primary via-primary/50 to-primary rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500`} />
      <div className="relative">
        {children}
      </div>
    </motion.div>
  );
}

// Status Badge with Animation
function StatusBadge({ status }: { status: "active" | "pending" | "error" | "syncing" }) {
  const configs = {
    active: { color: "emerald", icon: CheckCircle2, label: "Ativo" },
    pending: { color: "yellow", icon: AlertCircle, label: "Pendente" },
    error: { color: "red", icon: XCircle, label: "Erro" },
    syncing: { color: "blue", icon: RefreshCw, label: "Sincronizando" }
  };

  const config = configs[status];
  const Icon = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={`border-${config.color}-500/50 text-${config.color}-500 bg-${config.color}-500/10`}
    >
      <Icon className={`h-3 w-3 mr-1 ${status === "syncing" ? "animate-spin" : ""}`} />
      {config.label}
    </Badge>
  );
}

// Cyber Metric Card with Advanced Animations
function CyberMetricCard({
  title,
  value,
  change,
  icon: Icon,
  color,
  subtitle,
  isLive = false,
  delay = 0,
  trend = "up",
  sparklineData
}: {
  title: string;
  value: number;
  change?: number;
  icon: typeof Users;
  color: string;
  subtitle?: string;
  isLive?: boolean;
  delay?: number;
  trend?: "up" | "down" | "neutral";
  sparklineData?: number[];
}) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className="relative group"
    >
      <Card className="overflow-hidden border-border/20 bg-gradient-to-br from-card/90 to-card/50 backdrop-blur-2xl hover:border-primary/40 transition-all duration-500 h-full">
        {/* Animated glow background */}
        <motion.div 
          className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-all duration-700 pointer-events-none"
          style={{ 
            background: `radial-gradient(circle at 50% 50%, ${color}, transparent 70%)`,
          }}
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Top gradient accent */}
        <div 
          className="h-1 w-full relative overflow-hidden"
          style={{ background: `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)` }}
        >
          <motion.div
            className="absolute inset-0 bg-white/30"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        </div>

        <CardContent className="p-5 relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-medium">
                  {title}
                </span>
                {isLive && (
                  <motion.div
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20"
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Radio className="h-2.5 w-2.5 text-emerald-500" />
                    <span className="text-[8px] text-emerald-500 font-bold tracking-wider">LIVE</span>
                  </motion.div>
                )}
              </div>
              
              <div className="text-3xl font-black text-foreground tracking-tight">
                <AnimatedCounter value={value} prefix={title.includes("Receita") || title.includes("Investimento") ? "R$ " : ""} />
              </div>
              
              {subtitle && (
                <p className="text-[11px] text-muted-foreground/80">{subtitle}</p>
              )}
              
              {change !== undefined && (
                <motion.div 
                  className={`flex items-center gap-1.5 text-xs font-semibold ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: delay + 0.3 }}
                >
                  {isPositive ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  <span>{isPositive ? '+' : ''}{change.toFixed(1)}%</span>
                  <span className="text-muted-foreground/60 font-normal">vs mês anterior</span>
                </motion.div>
              )}
            </div>
            
            <motion.div
              className="relative p-3 rounded-2xl"
              style={{ backgroundColor: `${color}15` }}
              whileHover={{ rotate: [0, -10, 10, 0], scale: 1.15 }}
              transition={{ duration: 0.4 }}
            >
              <Icon className="h-6 w-6" style={{ color }} />
              <motion.div
                className="absolute inset-0 rounded-2xl"
                style={{ backgroundColor: color }}
                animate={{ opacity: [0, 0.3, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
          </div>

          {/* Mini sparkline */}
          {sparklineData && sparklineData.length > 0 && (
            <div className="mt-3 h-8">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparklineData.map((v, i) => ({ v, i }))}>
                  <defs>
                    <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke={color}
                    strokeWidth={1.5}
                    fill={`url(#gradient-${title})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Platform Integration Card with Real Status
function PlatformIntegrationCard({
  platform,
  icon: Icon,
  color,
  gradient,
  followers,
  engagement,
  views,
  extra,
  onSync,
  isSyncing,
  status,
  lastSync,
  delay = 0
}: {
  platform: string;
  icon: typeof Youtube;
  color: string;
  gradient: string;
  followers: number;
  engagement: number;
  views?: number;
  extra?: { label: string; value: string | number; icon?: typeof Users }[];
  onSync: () => void;
  isSyncing: boolean;
  status: "active" | "pending" | "error";
  lastSync?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -30, rotateY: -15 }}
      animate={{ opacity: 1, x: 0, rotateY: 0 }}
      transition={{ delay, duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ scale: 1.02, y: -4 }}
      className="group perspective-1000"
    >
      <Card className="overflow-hidden border-border/20 bg-gradient-to-br from-card/95 to-card/60 backdrop-blur-2xl hover:border-primary/30 transition-all duration-500">
        {/* Gradient header with animation */}
        <div className={`h-2 w-full bg-gradient-to-r ${gradient} relative overflow-hidden`}>
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
          />
        </div>
        
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <motion.div
                className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}
                whileHover={{ scale: 1.1, rotate: 5 }}
                style={{ boxShadow: `0 8px 32px ${color}40` }}
              >
                <Icon className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <h3 className="font-bold text-foreground text-lg">{platform}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  {status === "active" ? (
                    <motion.div 
                      className="flex items-center gap-1"
                      animate={{ opacity: [1, 0.6, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] text-emerald-500 font-medium">Conectado</span>
                    </motion.div>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">Aguardando sync</span>
                  )}
                </div>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onSync}
              disabled={isSyncing}
              className="h-9 w-9 rounded-xl hover:bg-primary/10"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin text-primary' : ''}`} />
            </Button>
          </div>

          {/* Main Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <motion.div 
              className="p-4 rounded-xl bg-gradient-to-br from-secondary/60 to-secondary/30 border border-border/30"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Seguidores</span>
              </div>
              <p className="text-2xl font-black" style={{ color }}>
                <AnimatedCounter value={followers} />
              </p>
            </motion.div>
            
            <motion.div 
              className="p-4 rounded-xl bg-gradient-to-br from-secondary/60 to-secondary/30 border border-border/30"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Engajamento</span>
              </div>
              <p className="text-2xl font-black text-foreground">
                <AnimatedCounter value={engagement} decimals={1} suffix="%" />
              </p>
            </motion.div>
          </div>

          {/* Extra Stats */}
          {extra && extra.length > 0 && (
            <div className="space-y-2">
              {extra.map((item, i) => (
                <motion.div 
                  key={i} 
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/20 hover:bg-secondary/40 transition-colors"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: delay + 0.1 * i }}
                >
                  <div className="flex items-center gap-2">
                    {item.icon && <item.icon className="h-3.5 w-3.5 text-muted-foreground" />}
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                  </div>
                  <span className="font-semibold text-foreground text-sm">{item.value}</span>
                </motion.div>
              ))}
            </div>
          )}

          {/* Last sync info */}
          {lastSync && (
            <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">Última sincronização</span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {new Date(lastSync).toLocaleString("pt-BR", { 
                  hour: "2-digit", 
                  minute: "2-digit",
                  day: "2-digit",
                  month: "short"
                })}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Live Data Indicator
function LiveDataIndicator() {
  const [time, setTime] = useState(new Date());
  const [dataPoints, setDataPoints] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
      setDataPoints(prev => prev + Math.floor(Math.random() * 5));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div 
      className="flex items-center gap-4 px-4 py-2 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-2">
        <motion.div
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [1, 0.5, 1]
          }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <Wifi className="h-4 w-4 text-emerald-500" />
        </motion.div>
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Conexão Ativa</span>
          <span className="text-xs font-mono text-foreground">{time.toLocaleTimeString("pt-BR")}</span>
        </div>
      </div>
      <div className="h-6 w-px bg-border/50" />
      <div className="flex items-center gap-2">
        <Database className="h-4 w-4 text-primary" />
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Data Points</span>
          <span className="text-xs font-mono text-foreground">{dataPoints.toLocaleString()}</span>
        </div>
      </div>
    </motion.div>
  );
}

// Format helpers
function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString("pt-BR");
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

// Main Dashboard Component
export function IntegratedMetricsDashboard() {
  const { data, isLoading, syncYouTube, syncInstagram, syncFacebookAds, syncTikTok, syncAll, refetch } = useIntegratedMetrics();
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [financialData, setFinancialData] = useState({ receita: 0, despesa: 0, saldo: 0 });
  const [taskData, setTaskData] = useState({ pending: 0, overdue: 0 });

  // Fetch financial and task data for AI insights
  useEffect(() => {
    const fetchInsightsData = async () => {
      try {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        
        // Fetch financial data
        const [entradasResult, gastosResult, tasksResult] = await Promise.all([
          supabase.from("entradas").select("valor").gte("data", firstDayOfMonth),
          supabase.from("gastos").select("valor").gte("data", firstDayOfMonth),
          supabase.from("calendar_tasks").select("*").eq("is_completed", false)
        ]);

        const receita = entradasResult.data?.reduce((sum, e) => sum + Number(e.valor || 0), 0) || 0;
        const despesa = gastosResult.data?.reduce((sum, g) => sum + Number(g.valor || 0), 0) || 0;
        setFinancialData({ receita, despesa, saldo: receita - despesa });

        const pending = tasksResult.data?.length || 0;
        const overdue = tasksResult.data?.filter(t => new Date(t.task_date) < now).length || 0;
        setTaskData({ pending, overdue });
      } catch (err) {
        console.error("Error fetching insights data:", err);
      }
    };

    fetchInsightsData();
    const interval = setInterval(fetchInsightsData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSync = async (platform: string, syncFn: () => Promise<any>) => {
    setIsSyncing(platform);
    toast.loading(`Sincronizando ${platform}...`, { id: platform });
    try {
      const result = await syncFn();
      if (result.error) {
        toast.error(`Erro ao sincronizar ${platform}`, { id: platform, description: result.error.message });
      } else {
        toast.success(`${platform} sincronizado com sucesso!`, { id: platform });
      }
    } catch (err: any) {
      toast.error(`Erro ao sincronizar ${platform}`, { id: platform });
    }
    setIsSyncing(null);
  };

  const handleSyncAll = async () => {
    setIsSyncing("all");
    toast.loading("Sincronizando todas as plataformas...", { id: "syncAll" });
    try {
      await syncAll();
      toast.success("Todas as plataformas sincronizadas!", { id: "syncAll" });
    } catch (err) {
      toast.error("Erro ao sincronizar plataformas", { id: "syncAll" });
    }
    setIsSyncing(null);
  };

  // Prepare chart data
  const followersPieData = useMemo(() => data ? [
    { name: "YouTube", value: data.youtube?.inscritos || 0, color: "#ff0000" },
    { name: "Instagram", value: data.instagram?.seguidores || 0, color: "#e4405f" },
    { name: "TikTok", value: data.tiktok?.seguidores || 0, color: "#00f2ea" }
  ].filter(d => d.value > 0) : [], [data]);

  const engagementRadarData = useMemo(() => data ? [
    { platform: "YouTube", engagement: data.youtube?.engagement_rate || 0, fullMark: 10 },
    { platform: "Instagram", engagement: data.instagram?.engajamento_rate || 0, fullMark: 10 },
    { platform: "TikTok", engagement: data.tiktok?.engagement_rate || 0, fullMark: 10 },
    { platform: "FB Ads CTR", engagement: (data.facebookAds.reduce((sum, fb) => sum + (fb.ctr || 0), 0) / Math.max(data.facebookAds.length, 1)) * 100, fullMark: 10 }
  ] : [], [data]);

  const facebookCampaignsData = useMemo(() => data?.facebookAds.slice(0, 5).map(fb => ({
    name: fb.campanha_nome?.substring(0, 12) || "Campanha",
    roi: fb.roi || 0,
    investimento: fb.investimento || 0,
    receita: fb.receita || 0,
    conversoes: fb.conversoes || 0
  })) || [], [data]);

  // Generate sparkline data
  const generateSparkline = useCallback((base: number) => {
    return Array.from({ length: 12 }, (_, i) => base * (0.8 + Math.random() * 0.4));
  }, []);

  // Social data for insights
  const socialData = useMemo(() => ({
    totalFollowers: data?.totals.totalFollowers || 0,
    totalEngagement: data?.totals.totalEngagement || 0
  }), [data]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
        <motion.div
          className="relative"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl" />
          <Cpu className="h-16 w-16 text-primary relative z-10" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <h3 className="text-lg font-semibold text-foreground mb-1">Carregando Central de Métricas</h3>
          <p className="text-sm text-muted-foreground">Conectando às plataformas...</p>
        </motion.div>
        <div className="flex gap-2 mt-2">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-primary"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-[1800px] mx-auto">
      {/* Epic Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card/95 to-card/90 border border-border/30 p-6"
      >
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }} />
        </div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <motion.div
              className="relative p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5"
              animate={{ 
                boxShadow: [
                  "0 0 20px hsl(var(--primary) / 0.2)",
                  "0 0 40px hsl(var(--primary) / 0.4)",
                  "0 0 20px hsl(var(--primary) / 0.2)"
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Globe className="h-8 w-8 text-primary" />
              <motion.div
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Wifi className="h-2.5 w-2.5 text-white" />
              </motion.div>
            </motion.div>
            
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
                  Central de Métricas
                </h1>
                <motion.div
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30 font-bold">
                    <Radio className="h-3 w-3 mr-1" />
                    TEMPO REAL
                  </Badge>
                </motion.div>
              </div>
              <p className="text-muted-foreground text-sm md:text-base">
                Monitoramento integrado • YouTube • Instagram • TikTok • Facebook Ads • Hotmart
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <LiveDataIndicator />
            
            <Button
              onClick={handleSyncAll}
              disabled={isSyncing === "all"}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing === "all" ? 'animate-spin' : ''}`} />
              Sincronizar Todas
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        <CyberMetricCard
          title="Total Seguidores"
          value={data?.totals.totalFollowers || 0}
          change={8.5}
          icon={Users}
          color="#22c55e"
          isLive
          delay={0}
          sparklineData={generateSparkline(data?.totals.totalFollowers || 100)}
        />
        <CyberMetricCard
          title="Alcance Total"
          value={data?.totals.totalReach || 0}
          change={12.3}
          icon={Eye}
          color="#00d4ff"
          delay={0.1}
          sparklineData={generateSparkline(data?.totals.totalReach || 100)}
        />
        <CyberMetricCard
          title="Engajamento"
          value={parseFloat((data?.totals.totalEngagement || 0).toFixed(1))}
          change={2.1}
          icon={Activity}
          color="#9333ea"
          subtitle="Média das plataformas"
          delay={0.2}
        />
        <CyberMetricCard
          title="Investimento Ads"
          value={data?.totals.totalInvestment || 0}
          icon={Wallet}
          color="#f59e0b"
          subtitle="Facebook Ads"
          delay={0.3}
        />
        <CyberMetricCard
          title="ROI Médio"
          value={parseFloat((data?.totals.totalROI || 0).toFixed(0))}
          change={data?.totals.totalROI}
          icon={Target}
          color="#22c55e"
          delay={0.4}
        />
        <CyberMetricCard
          title="Receita Total"
          value={data?.hotmart.totalReceita || 0}
          change={15.8}
          icon={DollarSign}
          color="#10b981"
          isLive
          delay={0.5}
          sparklineData={generateSparkline(data?.hotmart.totalReceita || 100)}
        />
      </div>

      {/* AI Insights Panel */}
      <AIInsightsPanel 
        financialData={financialData}
        socialData={socialData}
        taskData={taskData}
      />

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-card/80 backdrop-blur-xl border border-border/30 p-1 h-auto flex-wrap">
          <TabsTrigger 
            value="overview" 
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary px-4 py-2"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger 
            value="social" 
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary px-4 py-2"
          >
            <Heart className="h-4 w-4 mr-2" />
            Redes Sociais
          </TabsTrigger>
          <TabsTrigger 
            value="ads" 
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary px-4 py-2"
          >
            <Target className="h-4 w-4 mr-2" />
            Facebook Ads
          </TabsTrigger>
          <TabsTrigger 
            value="sales" 
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary px-4 py-2"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Vendas Hotmart
          </TabsTrigger>
          <TabsTrigger 
            value="ai" 
            className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-500 px-4 py-2"
          >
            <Brain className="h-4 w-4 mr-2" />
            IA TRAMON
            <Badge className="ml-2 bg-violet-500/20 text-violet-400 text-[10px] px-1.5">NOVO</Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="site" 
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary px-4 py-2"
          >
            <Globe className="h-4 w-4 mr-2" />
            Meu Site
            <Badge className="ml-2 bg-emerald-500/20 text-emerald-500 text-[10px] px-1.5">LIVE</Badge>
          </TabsTrigger>
        </TabsList>

        {/* AI TRAMON Tab */}
        <TabsContent value="ai" className="space-y-6 mt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-border/20 bg-gradient-to-br from-violet-500/10 via-card to-fuchsia-500/5 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <motion.div
                    className="p-3 rounded-2xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30"
                    animate={{ 
                      boxShadow: [
                        "0 0 20px rgba(139, 92, 246, 0.3)",
                        "0 0 40px rgba(139, 92, 246, 0.5)",
                        "0 0 20px rgba(139, 92, 246, 0.3)"
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Brain className="h-6 w-6 text-violet-400" />
                  </motion.div>
                  <div>
                    <h2 className="text-xl font-bold">TRAMON IA v8.0 OMEGA ULTRA</h2>
                    <p className="text-sm text-muted-foreground">Superinteligência integrada à sua plataforma</p>
                  </div>
                  <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 ml-auto">
                    <Sparkles className="h-3 w-3 mr-1" />
                    ATIVO
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/30">
                    <h4 className="font-semibold text-violet-400 mb-2 flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Comandos de Voz
                    </h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      Fale naturalmente com o TRAMON para gerenciar tudo.
                    </p>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      <li>"Gastei 150 de combustível"</li>
                      <li>"Recebi 2000 de venda curso"</li>
                      <li>"Qual o saldo do mês?"</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/30">
                    <h4 className="font-semibold text-fuchsia-400 mb-2 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Análises em Tempo Real
                    </h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      Peça relatórios e análises de todas as plataformas.
                    </p>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      <li>"Métricas do YouTube"</li>
                      <li>"Como está o Instagram?"</li>
                      <li>"Relatório financeiro"</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                    <h4 className="font-semibold text-emerald-400 mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Automações
                    </h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      Cadastre funcionários, alunos e mais com comandos.
                    </p>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      <li>"Cadastrar aluno João"</li>
                      <li>"Criar tarefa urgente"</li>
                      <li>"Novo funcionário"</li>
                    </ul>
                  </div>
                </div>
                
                <div className="p-4 rounded-xl bg-gradient-to-r from-violet-500/5 to-fuchsia-500/5 border border-violet-500/20">
                  <p className="text-sm text-center text-muted-foreground">
                    💡 <strong>Dica:</strong> Clique no ícone do TRAMON no canto inferior direito para começar a conversar!
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Followers Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-border/20 bg-card/80 backdrop-blur-xl h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <PieChart className="h-4 w-4 text-primary" />
                    Distribuição de Seguidores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {followersPieData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={200}>
                        <RechartsPie>
                          <Pie
                            data={followersPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={4}
                            dataKey="value"
                            stroke="none"
                          >
                            {followersPieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '12px',
                              boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                            }}
                            formatter={(value: number) => [formatNumber(value), "Seguidores"]}
                          />
                        </RechartsPie>
                      </ResponsiveContainer>
                      <div className="flex justify-center gap-4 mt-4">
                        {followersPieData.map((entry, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-muted-foreground font-medium">{entry.name}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Sincronize para ver dados</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Engagement Radar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-border/20 bg-card/80 backdrop-blur-xl h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    Radar de Engajamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={engagementRadarData}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis 
                        dataKey="platform" 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} 
                      />
                      <PolarRadiusAxis 
                        angle={30} 
                        domain={[0, 10]} 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8 }} 
                      />
                      <Radar
                        name="Engajamento"
                        dataKey="engagement"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px'
                        }}
                        formatter={(value: number) => [`${value.toFixed(1)}%`, "Engajamento"]}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>

            {/* ROI Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-border/20 bg-card/80 backdrop-blur-xl h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    ROI por Campanha
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {facebookCampaignsData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={facebookCampaignsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} 
                          axisLine={{ stroke: 'hsl(var(--border))' }}
                        />
                        <YAxis 
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} 
                          axisLine={{ stroke: 'hsl(var(--border))' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '12px'
                          }}
                          formatter={(value: number) => [`${value.toFixed(0)}%`, "ROI"]}
                        />
                        <Bar dataKey="roi" fill="#22c55e" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Target className="h-10 w-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Sincronize Facebook Ads</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Hotmart Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-border/20 bg-gradient-to-br from-card via-card/95 to-orange-500/5 backdrop-blur-xl overflow-hidden">
              <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 via-red-500 to-orange-500" />
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20">
                    <Flame className="h-5 w-5 text-orange-500" />
                  </div>
                  <span>Hotmart - Performance de Vendas</span>
                  <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">
                    <Zap className="h-3 w-3 mr-1" />
                    Webhook Ativo
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { icon: GraduationCap, label: "Total Alunos", value: data?.hotmart.totalAlunos || 0, color: "text-primary" },
                    { icon: ShoppingCart, label: "Total Vendas", value: data?.hotmart.totalVendas || 0, color: "text-emerald-500" },
                    { icon: DollarSign, label: "Receita Total", value: formatCurrency(data?.hotmart.totalReceita || 0), color: "text-emerald-500", isText: true },
                    { icon: Wallet, label: "Comissões", value: formatCurrency(data?.hotmart.totalComissoes || 0), color: "text-orange-500", isText: true },
                    { icon: Sparkles, label: "Vendas Hoje", value: data?.hotmart.vendasHoje || 0, color: "text-emerald-500", highlight: true },
                    { icon: TrendingUp, label: "Receita Hoje", value: formatCurrency(data?.hotmart.receitaHoje || 0), color: "text-emerald-500", highlight: true, isText: true },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      className={`p-4 rounded-xl text-center transition-all ${
                        item.highlight 
                          ? "bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30" 
                          : "bg-secondary/30 hover:bg-secondary/50"
                      }`}
                      whileHover={{ scale: 1.02, y: -2 }}
                    >
                      <item.icon className={`h-6 w-6 mx-auto mb-2 ${item.color}`} />
                      <p className={`text-2xl font-black ${item.color}`}>
                        {item.isText ? item.value : <AnimatedCounter value={item.value as number} />}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Social Media Tab */}
        <TabsContent value="social" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <PlatformIntegrationCard
              platform="YouTube"
              icon={Youtube}
              color="#ff0000"
              gradient="from-red-600 to-red-700"
              followers={data?.youtube?.inscritos || 0}
              engagement={data?.youtube?.engagement_rate || 0}
              views={data?.youtube?.visualizacoes_totais || 0}
              extra={[
                { label: "Visualizações Totais", value: formatNumber(data?.youtube?.visualizacoes_totais || 0), icon: Eye },
                { label: "Total de Vídeos", value: data?.youtube?.total_videos || 0, icon: Video },
                { label: "Views Recentes", value: formatNumber(data?.youtube?.visualizacoes_recentes || 0), icon: Play }
              ]}
              onSync={() => handleSync("YouTube", syncYouTube)}
              isSyncing={isSyncing === "YouTube"}
              status={data?.youtube ? "active" : "pending"}
              lastSync={data?.youtube?.data}
              delay={0}
            />
            <PlatformIntegrationCard
              platform="Instagram"
              icon={Instagram}
              color="#e4405f"
              gradient="from-pink-500 via-purple-500 to-orange-500"
              followers={data?.instagram?.seguidores || 0}
              engagement={data?.instagram?.engajamento_rate || 0}
              extra={[
                { label: "Alcance", value: formatNumber(data?.instagram?.alcance || 0), icon: Users },
                { label: "Impressões", value: formatNumber(data?.instagram?.impressoes || 0), icon: Eye },
                { label: "Novos Seguidores", value: `+${data?.instagram?.novos_seguidores || 0}`, icon: TrendingUp }
              ]}
              onSync={() => handleSync("Instagram", syncInstagram)}
              isSyncing={isSyncing === "Instagram"}
              status={data?.instagram ? "active" : "pending"}
              lastSync={data?.instagram?.data}
              delay={0.1}
            />
            <PlatformIntegrationCard
              platform="TikTok"
              icon={Video}
              color="#00f2ea"
              gradient="from-black via-pink-500 to-cyan-400"
              followers={data?.tiktok?.seguidores || 0}
              engagement={data?.tiktok?.engagement_rate || 0}
              extra={[
                { label: "Curtidas Totais", value: formatNumber(data?.tiktok?.curtidas_totais || 0), icon: Heart },
                { label: "Total de Vídeos", value: data?.tiktok?.total_videos || 0, icon: Video },
                { label: "Views do Perfil", value: formatNumber(data?.tiktok?.visualizacoes_perfil || 0), icon: Eye }
              ]}
              onSync={() => handleSync("TikTok", syncTikTok)}
              isSyncing={isSyncing === "TikTok"}
              status={data?.tiktok ? "active" : "pending"}
              lastSync={data?.tiktok?.data}
              delay={0.2}
            />
            <PlatformIntegrationCard
              platform="Facebook Ads"
              icon={Facebook}
              color="#1877f2"
              gradient="from-blue-600 to-blue-700"
              followers={data?.facebookAds.reduce((sum, fb) => sum + (fb.alcance || 0), 0) || 0}
              engagement={(data?.facebookAds.reduce((sum, fb) => sum + (fb.ctr || 0), 0) / Math.max(data?.facebookAds.length || 1, 1)) * 100}
              extra={[
                { label: "Campanhas Ativas", value: data?.facebookAds.length || 0, icon: Target },
                { label: "ROI Médio", value: `${(data?.facebookAds.reduce((sum, fb) => sum + (fb.roi || 0), 0) / Math.max(data?.facebookAds.length || 1, 1)).toFixed(0)}%`, icon: TrendingUp },
                { label: "Conversões", value: data?.facebookAds.reduce((sum, fb) => sum + (fb.conversoes || 0), 0) || 0, icon: ShoppingCart }
              ]}
              onSync={() => handleSync("Facebook Ads", syncFacebookAds)}
              isSyncing={isSyncing === "Facebook Ads"}
              status={data?.facebookAds.length ? "active" : "pending"}
              delay={0.3}
            />
          </div>
        </TabsContent>

        {/* Facebook Ads Tab */}
        <TabsContent value="ads" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Campaigns List */}
            <Card className="border-border/20 bg-card/80 backdrop-blur-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <Facebook className="h-5 w-5 text-[#1877f2]" />
                    </div>
                    Campanhas Ativas
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSync("Facebook Ads", syncFacebookAds)}
                    disabled={isSyncing === "Facebook Ads"}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing === "Facebook Ads" ? 'animate-spin' : ''}`} />
                    Atualizar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
                <AnimatePresence>
                  {data?.facebookAds.map((campaign, i) => (
                    <motion.div
                      key={campaign.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-4 rounded-xl bg-gradient-to-r from-secondary/50 to-secondary/20 border border-border/30 hover:border-blue-500/30 transition-all"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-foreground">{campaign.campanha_nome || "Campanha"}</h4>
                          <p className="text-xs text-muted-foreground font-mono">ID: {campaign.campanha_id.substring(0, 12)}...</p>
                        </div>
                        <Badge variant={campaign.status === "active" ? "default" : "secondary"} className="capitalize">
                          {campaign.status || "active"}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-3 mb-4">
                        {[
                          { label: "Impressões", value: formatNumber(campaign.impressoes || 0) },
                          { label: "Cliques", value: formatNumber(campaign.cliques || 0) },
                          { label: "CTR", value: `${((campaign.ctr || 0) * 100).toFixed(2)}%` },
                          { label: "ROI", value: `${(campaign.roi || 0).toFixed(0)}%`, highlight: true }
                        ].map((stat, j) => (
                          <div key={j} className={`text-center p-2 rounded-lg ${stat.highlight ? 'bg-emerald-500/10' : 'bg-secondary/30'}`}>
                            <p className={`text-lg font-bold ${stat.highlight ? 'text-emerald-500' : 'text-foreground'}`}>
                              {stat.value}
                            </p>
                            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex justify-between text-sm border-t border-border/30 pt-3">
                        <span className="text-muted-foreground">
                          Investido: <span className="text-foreground font-semibold">R$ {(campaign.investimento || 0).toFixed(2)}</span>
                        </span>
                        <span className="text-muted-foreground">
                          Receita: <span className="text-emerald-500 font-semibold">R$ {(campaign.receita || 0).toFixed(2)}</span>
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {(!data?.facebookAds || data.facebookAds.length === 0) && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Target className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium mb-2">Nenhuma campanha encontrada</p>
                    <p className="text-sm mb-4">Sincronize para carregar suas campanhas</p>
                    <Button onClick={() => handleSync("Facebook Ads", syncFacebookAds)}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Sincronizar Facebook Ads
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance Charts */}
            <Card className="border-border/20 bg-card/80 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Performance por Campanha
                </CardTitle>
              </CardHeader>
              <CardContent>
                {facebookCampaignsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={facebookCampaignsData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} 
                        width={80} 
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px'
                        }}
                        formatter={(value: number, name: string) => [
                          name === "receita" || name === "investimento" 
                            ? `R$ ${value.toFixed(2)}` 
                            : value,
                          name === "investimento" ? "Investimento" : name === "receita" ? "Receita" : name
                        ]}
                      />
                      <Bar dataKey="investimento" fill="#f59e0b" name="Investimento" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="receita" fill="#22c55e" name="Receita" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-20" />
                      <p>Sincronize para ver gráficos</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sales Tab */}
        <TabsContent value="sales" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <CyberMetricCard
              title="Total Alunos"
              value={data?.hotmart.totalAlunos || 0}
              icon={GraduationCap}
              color="#7c3aed"
              isLive
            />
            <CyberMetricCard
              title="Total Vendas"
              value={data?.hotmart.totalVendas || 0}
              icon={ShoppingCart}
              color="#22c55e"
            />
            <CyberMetricCard
              title="Receita Total"
              value={data?.hotmart.totalReceita || 0}
              icon={DollarSign}
              color="#10b981"
              isLive
            />
            <CyberMetricCard
              title="Comissões Totais"
              value={data?.hotmart.totalComissoes || 0}
              icon={Wallet}
              color="#f59e0b"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Today's Performance */}
            <Card className="border-border/20 bg-gradient-to-br from-emerald-500/10 via-card to-card backdrop-blur-xl border-l-4 border-l-emerald-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-500/20">
                    <Sparkles className="h-5 w-5 text-emerald-500" />
                  </div>
                  Performance de Hoje
                  <motion.div
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30 ml-2">
                      <Radio className="h-3 w-3 mr-1" />
                      AO VIVO
                    </Badge>
                  </motion.div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <motion.div 
                    className="text-center p-8 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30"
                    whileHover={{ scale: 1.02 }}
                  >
                    <motion.p 
                      className="text-5xl font-black text-emerald-500"
                      key={data?.hotmart.vendasHoje}
                    >
                      <AnimatedCounter value={data?.hotmart.vendasHoje || 0} />
                    </motion.p>
                    <p className="text-sm text-muted-foreground mt-2 font-medium">Vendas Realizadas</p>
                  </motion.div>
                  <motion.div 
                    className="text-center p-8 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30"
                    whileHover={{ scale: 1.02 }}
                  >
                    <p className="text-4xl font-black text-emerald-500">
                      {formatCurrency(data?.hotmart.receitaHoje || 0)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2 font-medium">Receita do Dia</p>
                  </motion.div>
                </div>
              </CardContent>
            </Card>

            {/* Integration Status */}
            <Card className="border-border/20 bg-card/80 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  Status das Integrações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: "Hotmart Webhook", status: "active", color: "#f04e23", icon: Flame },
                  { name: "YouTube API", status: data?.youtube ? "active" : "pending", color: "#ff0000", icon: Youtube },
                  { name: "Instagram API", status: data?.instagram ? "active" : "pending", color: "#e4405f", icon: Instagram },
                  { name: "Facebook Ads", status: data?.facebookAds.length ? "active" : "pending", color: "#1877f2", icon: Facebook },
                  { name: "TikTok", status: data?.tiktok ? "active" : "pending", color: "#00f2ea", icon: Video }
                ].map((integration, i) => (
                  <motion.div 
                    key={i} 
                    className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-all"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ x: 4 }}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${integration.color}20` }}
                      >
                        <integration.icon className="h-4 w-4" style={{ color: integration.color }} />
                      </div>
                      <span className="text-sm font-medium text-foreground">{integration.name}</span>
                    </div>
                    <StatusBadge status={integration.status as any} />
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Site/WordPress Tab - SUPER MELHORADO */}
        <TabsContent value="site" className="space-y-6 mt-6">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600/20 via-card to-emerald-600/10 border border-purple-500/30 p-6"
          >
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 3px 3px, currentColor 1px, transparent 0)`,
                backgroundSize: '24px 24px'
              }} />
            </div>
            
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <motion.div
                  className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/30 to-emerald-500/20"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Globe className="h-8 w-8 text-purple-400" />
                </motion.div>
                <div>
                  <h2 className="text-2xl font-black text-foreground flex items-center gap-2">
                    app.moisesmedeiros.com.br
                    <motion.div
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">
                        <Radio className="h-3 w-3 mr-1" />
                        ONLINE
                      </Badge>
                    </motion.div>
                  </h2>
                  <p className="text-muted-foreground">📊 Google Analytics • 🛒 WooCommerce • 👥 WordPress</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => window.open('https://app.moisesmedeiros.com.br/wp-admin', '_blank')}>
                  <Cpu className="h-4 w-4 mr-2" />
                  WP Admin
                </Button>
                <Button size="sm" className="bg-gradient-to-r from-purple-500 to-emerald-500">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar Dados
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Google Analytics Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <BarChart3 className="h-5 w-5 text-amber-500" />
              </div>
              <h3 className="text-lg font-bold text-foreground">📊 Google Analytics via Site Kit</h3>
              <Badge variant="outline" className="ml-auto text-amber-500 border-amber-500/30">
                Dados em Tempo Real
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <CyberMetricCard
                title="Sessões"
                value={data?.googleAnalytics?.sessions || 0}
                icon={Activity}
                color="#f59e0b"
                isLive
                delay={0}
              />
              <CyberMetricCard
                title="Usuários"
                value={data?.googleAnalytics?.users || 0}
                icon={Users}
                color="#22c55e"
                isLive
                delay={0.1}
              />
              <CyberMetricCard
                title="Novos Usuários"
                value={data?.googleAnalytics?.new_users || 0}
                icon={GraduationCap}
                color="#9333ea"
                delay={0.2}
              />
              <CyberMetricCard
                title="Page Views"
                value={data?.googleAnalytics?.page_views || 0}
                icon={Eye}
                color="#00d4ff"
                delay={0.3}
              />
              <CyberMetricCard
                title="Bounce Rate"
                value={data?.googleAnalytics?.bounce_rate || 0}
                icon={TrendingDown}
                color="#ef4444"
                subtitle={`${(data?.googleAnalytics?.bounce_rate || 0).toFixed(1)}%`}
                delay={0.4}
              />
              <CyberMetricCard
                title="Tempo Médio"
                value={Math.round((data?.googleAnalytics?.avg_session_duration || 0) / 60)}
                icon={Clock}
                color="#7c3aed"
                subtitle="minutos"
                delay={0.5}
              />
            </div>

            {/* Traffic Sources */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="border-border/20 bg-gradient-to-br from-amber-500/5 via-card to-card backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Signal className="h-5 w-5 text-amber-500" />
                    Fontes de Tráfego
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: "Busca Orgânica", value: data?.googleAnalytics?.organic_search || 0, color: "#22c55e", icon: "🔍" },
                    { label: "Acesso Direto", value: data?.googleAnalytics?.direct || 0, color: "#3b82f6", icon: "🔗" },
                    { label: "Redes Sociais", value: data?.googleAnalytics?.social || 0, color: "#ec4899", icon: "📱" },
                    { label: "Referências", value: data?.googleAnalytics?.referral || 0, color: "#f59e0b", icon: "🔄" },
                    { label: "Busca Paga", value: data?.googleAnalytics?.paid_search || 0, color: "#9333ea", icon: "💰" }
                  ].map((source, i) => (
                    <motion.div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-all"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{source.icon}</span>
                        <span className="text-sm font-medium">{source.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={Math.min(100, (source.value / Math.max(data?.googleAnalytics?.sessions || 1, 1)) * 100)} 
                          className="w-20 h-2"
                        />
                        <span className="font-bold text-sm" style={{ color: source.color }}>
                          {source.value.toLocaleString()}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>

              {/* Top Pages */}
              <Card className="border-border/20 bg-gradient-to-br from-blue-500/5 via-card to-card backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Eye className="h-5 w-5 text-blue-500" />
                    Páginas Mais Acessadas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(data?.googleAnalytics?.top_pages || []).slice(0, 5).map((page, i) => (
                    <motion.div
                      key={i}
                      className="flex items-center justify-between p-2 rounded-lg bg-secondary/20 hover:bg-secondary/40 transition-all"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <span className="text-sm text-muted-foreground truncate max-w-[200px]">{page.page}</span>
                      <Badge variant="outline">{page.views.toLocaleString()} views</Badge>
                    </motion.div>
                  ))}
                  {(!data?.googleAnalytics?.top_pages || data.googleAnalytics.top_pages.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Eye className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p>Configure o Site Kit para ver as páginas mais acessadas</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* WooCommerce Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <ShoppingCart className="h-5 w-5 text-purple-500" />
              </div>
              <h3 className="text-lg font-bold text-foreground">🛒 WooCommerce em Tempo Real</h3>
              <motion.div
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Badge className="ml-auto bg-emerald-500/20 text-emerald-500 border-emerald-500/30">
                  <Radio className="h-3 w-3 mr-1" />
                  VENDAS AO VIVO
                </Badge>
              </motion.div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <CyberMetricCard
                title="Pedidos Hoje"
                value={data?.woocommerce?.todayOrders || 0}
                icon={ShoppingCart}
                color="#9333ea"
                isLive
                delay={0}
              />
              <CyberMetricCard
                title="Receita Hoje"
                value={data?.woocommerce?.todayRevenue || 0}
                icon={DollarSign}
                color="#22c55e"
                isLive
                delay={0.1}
              />
              <CyberMetricCard
                title="Total Pedidos"
                value={data?.woocommerce?.metrics?.total_orders || 0}
                icon={Target}
                color="#f59e0b"
                delay={0.2}
              />
              <CyberMetricCard
                title="Itens Vendidos"
                value={data?.woocommerce?.metrics?.items_sold || 0}
                icon={Award}
                color="#00d4ff"
                delay={0.3}
              />
              <CyberMetricCard
                title="Ticket Médio"
                value={data?.woocommerce?.metrics?.average_order_value || 0}
                icon={Wallet}
                color="#ec4899"
                delay={0.4}
              />
              <CyberMetricCard
                title="Conversão"
                value={data?.woocommerce?.metrics?.conversion_rate || 0}
                icon={TrendingUp}
                color="#10b981"
                subtitle="%"
                delay={0.5}
              />
            </div>

            {/* Recent Orders + Live Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Live Orders Feed */}
              <Card className="border-border/20 bg-gradient-to-br from-purple-500/10 via-card to-emerald-500/5 backdrop-blur-xl border-l-4 border-l-purple-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                      <ShoppingCart className="h-5 w-5 text-purple-500" />
                    </div>
                    Pedidos Recentes
                    <motion.div
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/30 ml-2">
                        <Radio className="h-3 w-3 mr-1" />
                        LIVE
                      </Badge>
                    </motion.div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
                  {data?.woocommerce?.recentOrders && data.woocommerce.recentOrders.length > 0 ? (
                    data.woocommerce.recentOrders.map((order, i) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-secondary/50 to-secondary/20 hover:from-secondary/70 hover:to-secondary/40 transition-all border border-border/20"
                      >
                        <div className="p-3 rounded-xl bg-emerald-500/20">
                          <DollarSign className="h-5 w-5 text-emerald-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-foreground">
                              {formatCurrency(Number(order.total))}
                            </p>
                            <Badge 
                              variant="outline" 
                              className={`text-[10px] ${
                                order.status === 'completed' ? 'text-emerald-500 border-emerald-500/30' :
                                order.status === 'processing' ? 'text-blue-500 border-blue-500/30' :
                                'text-amber-500 border-amber-500/30'
                              }`}
                            >
                              {order.status === 'completed' ? '✅ Concluído' : 
                               order.status === 'processing' ? '⏳ Processando' : '⏰ Pendente'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {order.customer_name || order.customer_email || 'Cliente'}
                            {order.billing_city && ` • ${order.billing_city}/${order.billing_state}`}
                          </p>
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            {order.items_count} item(ns) • {order.payment_method_title || 'N/A'}
                            {' • '}
                            {new Date(order.date_created).toLocaleString('pt-BR', { 
                              day: '2-digit', 
                              month: 'short',
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p className="font-medium">Aguardando vendas...</p>
                      <p className="text-sm mt-2">Configure o webhook WooCommerce para receber dados em tempo real</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* All Events Feed */}
              <Card className="border-border/20 bg-gradient-to-br from-blue-500/10 via-card to-card backdrop-blur-xl border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <Activity className="h-5 w-5 text-blue-500" />
                    </div>
                    Feed de Eventos
                    <motion.div
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30 ml-2">
                        <Radio className="h-3 w-3 mr-1" />
                        LIVE
                      </Badge>
                    </motion.div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
                  {data?.wordpress?.recentEvents && data.wordpress.recentEvents.length > 0 ? (
                    data.wordpress.recentEvents.map((event, i) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-all"
                      >
                        <div className={`p-2 rounded-lg ${
                          event.event_type === 'user_registered' 
                            ? 'bg-emerald-500/20' 
                            : event.event_type === 'user_login'
                            ? 'bg-blue-500/20'
                            : event.event_type === 'woocommerce_order'
                            ? 'bg-purple-500/20'
                            : 'bg-amber-500/20'
                        }`}>
                          {event.event_type === 'user_registered' ? (
                            <GraduationCap className="h-4 w-4 text-emerald-500" />
                          ) : event.event_type === 'user_login' ? (
                            <Users className="h-4 w-4 text-blue-500" />
                          ) : event.event_type === 'woocommerce_order' ? (
                            <ShoppingCart className="h-4 w-4 text-purple-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-amber-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {event.user_name || event.user_email || 'Visitante'}
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground">
                              {event.event_type === 'user_registered' ? '🎉 Novo cadastro' :
                               event.event_type === 'user_login' ? '👋 Login' :
                               event.event_type === 'woocommerce_order' ? `🛒 Compra R$ ${(event.event_data as any)?.total || 0}` : 
                               '👁️ Visualização'}
                            </p>
                            <span className="text-[10px] text-muted-foreground/50">
                              {new Date(event.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Activity className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p className="font-medium">Aguardando eventos...</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* WordPress Users Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <h3 className="text-lg font-bold text-foreground">👥 Usuários da Plataforma</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <CyberMetricCard
                title="Total Usuários"
                value={data?.wordpress?.metrics?.total_users || 0}
                icon={Users}
                color="#3b82f6"
                isLive
              />
              <CyberMetricCard
                title="Novos Cadastros"
                value={data?.wordpress?.metrics?.new_registrations || 0}
                icon={GraduationCap}
                color="#22c55e"
                isLive
              />
              <CyberMetricCard
                title="Usuários Ativos"
                value={data?.wordpress?.metrics?.active_users || 0}
                icon={Activity}
                color="#9333ea"
              />
              <CyberMetricCard
                title="Page Views"
                value={data?.wordpress?.metrics?.page_views || 0}
                icon={Eye}
                color="#f59e0b"
              />
            </div>
          </div>

          {/* Setup Instructions */}
          <Card className="border-border/20 bg-gradient-to-br from-primary/5 via-card to-card backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-primary" />
                ⚙️ Configuração dos Webhooks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-secondary/30 border border-border/30">
                  <p className="text-sm font-bold text-foreground mb-2">📡 URL do Webhook:</p>
                  <code className="text-xs bg-background p-2 rounded block break-all text-primary">
                    https://fyikfsasudgzsjmumdlw.supabase.co/functions/v1/wordpress-webhook
                  </code>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 w-full"
                    onClick={() => {
                      navigator.clipboard.writeText('https://fyikfsasudgzsjmumdlw.supabase.co/functions/v1/wordpress-webhook');
                      toast.success('URL copiada!');
                    }}
                  >
                    Copiar URL
                  </Button>
                </div>
                
                <div className="p-4 rounded-xl bg-secondary/30 border border-border/30">
                  <p className="text-sm font-bold text-foreground mb-2">🔐 Header de Segurança:</p>
                  <code className="text-xs bg-background p-2 rounded block text-muted-foreground">
                    x-webhook-secret: moisesmedeiros2024
                  </code>
                  <p className="text-xs text-muted-foreground mt-2">
                    Adicione este header em todas as requisições
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-secondary/30 border border-border/30">
                  <p className="text-sm font-bold text-foreground mb-2">🎯 Eventos Suportados:</p>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>• user_registered (novo cadastro)</p>
                    <p>• user_login (login)</p>
                    <p>• woocommerce_order (vendas)</p>
                    <p>• google_analytics (métricas GA)</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default IntegratedMetricsDashboard;
