// ============================================
// MOISÉS MEDEIROS v10.0 - ULTRA INTEGRATED METRICS DASHBOARD
// Dashboard futurista com métricas em tempo real
// Design cyberpunk com animações avançadas
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
  XCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIntegratedMetrics } from "@/hooks/useIntegratedMetrics";
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
        </TabsList>

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
      </Tabs>
    </div>
  );
}

export default IntegratedMetricsDashboard;
