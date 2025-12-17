// ============================================
// MOISÉS MEDEIROS v10.0 - Integrated Metrics Dashboard
// Dashboard futurista com métricas em tempo real
// ============================================

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Sparkles
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
  Bar
} from "recharts";
import { toast } from "sonner";

const CYBER_COLORS = {
  primary: "hsl(var(--primary))",
  accent: "#00ff88",
  warning: "#ff6b35",
  danger: "#ff3366",
  info: "#00d4ff",
  purple: "#9333ea",
  youtube: "#ff0000",
  instagram: "#e4405f",
  facebook: "#1877f2",
  tiktok: "#000000",
  hotmart: "#f04e23"
};

const PIE_COLORS = [CYBER_COLORS.youtube, CYBER_COLORS.instagram, CYBER_COLORS.facebook, CYBER_COLORS.tiktok];

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString("pt-BR");
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(cents / 100);
}

// Cyber Metric Card Component
function CyberMetricCard({
  title,
  value,
  change,
  icon: Icon,
  color,
  subtitle,
  isLive = false,
  delay = 0
}: {
  title: string;
  value: string | number;
  change?: number;
  icon: typeof Users;
  color: string;
  subtitle?: string;
  isLive?: boolean;
  delay?: number;
}) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      whileHover={{ scale: 1.02, y: -4 }}
      className="relative group"
    >
      <Card className="overflow-hidden border-border/30 bg-card/80 backdrop-blur-xl hover:border-primary/50 transition-all duration-500">
        {/* Glow effect */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none"
          style={{ background: `radial-gradient(circle at center, ${color}, transparent 70%)` }}
        />
        
        {/* Top accent line */}
        <div 
          className="h-1 w-full"
          style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
        />

        <CardContent className="p-4 relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  {title}
                </span>
                {isLive && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="flex items-center gap-1"
                  >
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-emerald-500 font-mono">LIVE</span>
                  </motion.div>
                )}
              </div>
              
              <motion.div
                className="text-2xl font-bold text-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key={String(value)}
              >
                {value}
              </motion.div>
              
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
              )}
              
              {change !== undefined && (
                <div className={`flex items-center gap-1 mt-2 text-xs ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                  {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  <span className="font-medium">{isPositive ? '+' : ''}{change.toFixed(1)}%</span>
                </div>
              )}
            </div>
            
            <motion.div
              className="p-3 rounded-xl"
              style={{ backgroundColor: `${color}15` }}
              whileHover={{ rotate: 5, scale: 1.1 }}
            >
              <Icon className="h-5 w-5" style={{ color }} />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Platform Card Component
function PlatformCard({
  platform,
  icon: Icon,
  color,
  followers,
  engagement,
  extra,
  onSync,
  isSyncing,
  delay = 0
}: {
  platform: string;
  icon: typeof Youtube;
  color: string;
  followers: number;
  engagement: number;
  extra?: { label: string; value: string | number }[];
  onSync: () => void;
  isSyncing: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="group"
    >
      <Card className="overflow-hidden border-border/30 bg-card/80 backdrop-blur-xl hover:border-primary/50 transition-all duration-300">
        <div className="h-1.5 w-full" style={{ background: color }} />
        
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.div
                className="p-2.5 rounded-xl"
                style={{ backgroundColor: `${color}20` }}
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <Icon className="h-6 w-6" style={{ color }} />
              </motion.div>
              <div>
                <h3 className="font-bold text-foreground">{platform}</h3>
                <p className="text-xs text-muted-foreground">Real-time sync</p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onSync}
              disabled={isSyncing}
              className="h-8 w-8"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground uppercase">Seguidores</span>
              </div>
              <p className="text-lg font-bold" style={{ color }}>{formatNumber(followers)}</p>
            </div>
            
            <div className="p-3 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground uppercase">Engajamento</span>
              </div>
              <p className="text-lg font-bold text-foreground">{engagement.toFixed(1)}%</p>
            </div>
          </div>

          {extra && extra.length > 0 && (
            <div className="mt-3 space-y-2">
              {extra.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Live Clock Component
function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-2 text-xs font-mono">
      <motion.div
        animate={{ opacity: [1, 0.5, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
        className="w-2 h-2 rounded-full bg-emerald-500"
      />
      <span className="text-muted-foreground">
        {time.toLocaleTimeString("pt-BR")}
      </span>
    </div>
  );
}

// Main Dashboard Component
export function IntegratedMetricsDashboard() {
  const { data, isLoading, syncYouTube, syncInstagram, syncFacebookAds, syncTikTok, syncAll, refetch } = useIntegratedMetrics();
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const handleSync = async (platform: string, syncFn: () => Promise<any>) => {
    setIsSyncing(platform);
    try {
      const result = await syncFn();
      if (result.error) {
        toast.error(`Erro ao sincronizar ${platform}`, { description: result.error.message });
      } else {
        toast.success(`${platform} sincronizado!`);
      }
    } catch (err: any) {
      toast.error(`Erro ao sincronizar ${platform}`);
    }
    setIsSyncing(null);
  };

  const handleSyncAll = async () => {
    setIsSyncing("all");
    try {
      await syncAll();
      toast.success("Todas as plataformas sincronizadas!");
    } catch (err) {
      toast.error("Erro ao sincronizar plataformas");
    }
    setIsSyncing(null);
  };

  // Prepare chart data
  const followersPieData = data ? [
    { name: "YouTube", value: data.youtube?.inscritos || 0, color: CYBER_COLORS.youtube },
    { name: "Instagram", value: data.instagram?.seguidores || 0, color: CYBER_COLORS.instagram },
    { name: "TikTok", value: data.tiktok?.seguidores || 0, color: CYBER_COLORS.tiktok }
  ] : [];

  const engagementRadarData = data ? [
    { platform: "YouTube", engagement: data.youtube?.engagement_rate || 0, fullMark: 10 },
    { platform: "Instagram", engagement: data.instagram?.engajamento_rate || 0, fullMark: 10 },
    { platform: "TikTok", engagement: data.tiktok?.engagement_rate || 0, fullMark: 10 },
    { platform: "FB Ads", engagement: (data.facebookAds.reduce((sum, fb) => sum + (fb.ctr || 0), 0) / Math.max(data.facebookAds.length, 1)) * 100, fullMark: 10 }
  ] : [];

  const facebookCampaignsData = data?.facebookAds.slice(0, 5).map(fb => ({
    name: fb.campanha_nome?.substring(0, 15) || "Campanha",
    roi: fb.roi || 0,
    investimento: fb.investimento || 0,
    receita: fb.receita || 0
  })) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Cpu className="h-12 w-12 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <motion.div
              animate={{ 
                boxShadow: ["0 0 20px hsl(var(--primary) / 0.3)", "0 0 40px hsl(var(--primary) / 0.6)", "0 0 20px hsl(var(--primary) / 0.3)"]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="p-2 rounded-lg bg-primary/20"
            >
              <Globe className="h-6 w-6 text-primary" />
            </motion.div>
            <h1 className="text-2xl font-bold text-foreground">
              Central de Métricas
            </h1>
            <Badge variant="outline" className="border-emerald-500/50 text-emerald-500">
              <Signal className="h-3 w-3 mr-1" />
              LIVE
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            Monitoramento integrado em tempo real • Todas as plataformas
          </p>
        </div>

        <div className="flex items-center gap-3">
          <LiveClock />
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncAll}
            disabled={isSyncing === "all"}
            className="border-primary/30 hover:border-primary"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing === "all" ? 'animate-spin' : ''}`} />
            Sincronizar Todas
          </Button>
        </div>
      </motion.div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <CyberMetricCard
          title="Total Seguidores"
          value={formatNumber(data?.totals.totalFollowers || 0)}
          change={8.5}
          icon={Users}
          color={CYBER_COLORS.accent}
          isLive
          delay={0}
        />
        <CyberMetricCard
          title="Alcance Total"
          value={formatNumber(data?.totals.totalReach || 0)}
          change={12.3}
          icon={Eye}
          color={CYBER_COLORS.info}
          delay={0.1}
        />
        <CyberMetricCard
          title="Engajamento Médio"
          value={`${(data?.totals.totalEngagement || 0).toFixed(1)}%`}
          change={2.1}
          icon={Activity}
          color={CYBER_COLORS.purple}
          delay={0.2}
        />
        <CyberMetricCard
          title="Investimento Ads"
          value={formatCurrency((data?.totals.totalInvestment || 0) * 100)}
          icon={Wallet}
          color={CYBER_COLORS.warning}
          delay={0.3}
        />
        <CyberMetricCard
          title="ROI Médio"
          value={`${(data?.totals.totalROI || 0).toFixed(0)}%`}
          change={data?.totals.totalROI}
          icon={Target}
          color={CYBER_COLORS.accent}
          delay={0.4}
        />
        <CyberMetricCard
          title="Receita Total"
          value={formatCurrency((data?.hotmart.totalReceita || 0) * 100)}
          change={15.8}
          icon={DollarSign}
          color="#22c55e"
          isLive
          delay={0.5}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-card/50 backdrop-blur-xl border border-border/30">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary/20">
            <BarChart3 className="h-4 w-4 mr-2" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="social" className="data-[state=active]:bg-primary/20">
            <Heart className="h-4 w-4 mr-2" />
            Redes Sociais
          </TabsTrigger>
          <TabsTrigger value="ads" className="data-[state=active]:bg-primary/20">
            <Target className="h-4 w-4 mr-2" />
            Facebook Ads
          </TabsTrigger>
          <TabsTrigger value="sales" className="data-[state=active]:bg-primary/20">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Vendas
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Followers Distribution */}
            <Card className="border-border/30 bg-card/80 backdrop-blur-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-primary" />
                  Distribuição de Seguidores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <RechartsPie>
                    <Pie
                      data={followersPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {followersPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => formatNumber(value)}
                    />
                  </RechartsPie>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-2">
                  {followersPieData.map((entry, i) => (
                    <div key={i} className="flex items-center gap-1 text-xs">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-muted-foreground">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Engagement Radar */}
            <Card className="border-border/30 bg-card/80 backdrop-blur-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Radar de Engajamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={engagementRadarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="platform" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8 }} />
                    <Radar
                      name="Engajamento"
                      dataKey="engagement"
                      stroke={CYBER_COLORS.primary}
                      fill={CYBER_COLORS.primary}
                      fillOpacity={0.3}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Facebook Ads ROI */}
            <Card className="border-border/30 bg-card/80 backdrop-blur-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  ROI por Campanha
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={facebookCampaignsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="roi" fill={CYBER_COLORS.accent} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Hotmart Section */}
          <Card className="border-border/30 bg-card/80 backdrop-blur-xl overflow-hidden">
            <div className="h-1 w-full" style={{ background: CYBER_COLORS.hotmart }} />
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" style={{ color: CYBER_COLORS.hotmart }} />
                Hotmart - Performance de Vendas
                <Badge variant="outline" className="ml-2 border-emerald-500/50 text-emerald-500">
                  <Zap className="h-3 w-3 mr-1" />
                  Integrado
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="p-4 rounded-xl bg-secondary/30 text-center">
                  <GraduationCap className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold text-foreground">{data?.hotmart.totalAlunos || 0}</p>
                  <p className="text-xs text-muted-foreground">Total Alunos</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/30 text-center">
                  <ShoppingCart className="h-6 w-6 mx-auto mb-2 text-emerald-500" />
                  <p className="text-2xl font-bold text-foreground">{data?.hotmart.totalVendas || 0}</p>
                  <p className="text-xs text-muted-foreground">Total Vendas</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/30 text-center">
                  <DollarSign className="h-6 w-6 mx-auto mb-2 text-emerald-500" />
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency((data?.hotmart.totalReceita || 0) * 100)}
                  </p>
                  <p className="text-xs text-muted-foreground">Receita Total</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/30 text-center">
                  <Wallet className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency((data?.hotmart.totalComissoes || 0) * 100)}
                  </p>
                  <p className="text-xs text-muted-foreground">Comissões</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-500/10 text-center border border-emerald-500/20">
                  <Sparkles className="h-6 w-6 mx-auto mb-2 text-emerald-500" />
                  <p className="text-2xl font-bold text-emerald-500">{data?.hotmart.vendasHoje || 0}</p>
                  <p className="text-xs text-muted-foreground">Vendas Hoje</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-500/10 text-center border border-emerald-500/20">
                  <TrendingUp className="h-6 w-6 mx-auto mb-2 text-emerald-500" />
                  <p className="text-2xl font-bold text-emerald-500">
                    {formatCurrency((data?.hotmart.receitaHoje || 0) * 100)}
                  </p>
                  <p className="text-xs text-muted-foreground">Receita Hoje</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Media Tab */}
        <TabsContent value="social" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <PlatformCard
              platform="YouTube"
              icon={Youtube}
              color={CYBER_COLORS.youtube}
              followers={data?.youtube?.inscritos || 0}
              engagement={data?.youtube?.engagement_rate || 0}
              extra={[
                { label: "Visualizações", value: formatNumber(data?.youtube?.visualizacoes_totais || 0) },
                { label: "Vídeos", value: data?.youtube?.total_videos || 0 }
              ]}
              onSync={() => handleSync("YouTube", syncYouTube)}
              isSyncing={isSyncing === "YouTube"}
              delay={0}
            />
            <PlatformCard
              platform="Instagram"
              icon={Instagram}
              color={CYBER_COLORS.instagram}
              followers={data?.instagram?.seguidores || 0}
              engagement={data?.instagram?.engajamento_rate || 0}
              extra={[
                { label: "Alcance", value: formatNumber(data?.instagram?.alcance || 0) },
                { label: "Impressões", value: formatNumber(data?.instagram?.impressoes || 0) }
              ]}
              onSync={() => handleSync("Instagram", syncInstagram)}
              isSyncing={isSyncing === "Instagram"}
              delay={0.1}
            />
            <PlatformCard
              platform="TikTok"
              icon={Video}
              color={CYBER_COLORS.tiktok}
              followers={data?.tiktok?.seguidores || 0}
              engagement={data?.tiktok?.engagement_rate || 0}
              extra={[
                { label: "Curtidas", value: formatNumber(data?.tiktok?.curtidas_totais || 0) },
                { label: "Vídeos", value: data?.tiktok?.total_videos || 0 }
              ]}
              onSync={() => handleSync("TikTok", syncTikTok)}
              isSyncing={isSyncing === "TikTok"}
              delay={0.2}
            />
            <PlatformCard
              platform="Facebook Ads"
              icon={Facebook}
              color={CYBER_COLORS.facebook}
              followers={data?.facebookAds.reduce((sum, fb) => sum + (fb.alcance || 0), 0) || 0}
              engagement={(data?.facebookAds.reduce((sum, fb) => sum + (fb.ctr || 0), 0) / Math.max(data?.facebookAds.length || 1, 1)) * 100}
              extra={[
                { label: "Campanhas", value: data?.facebookAds.length || 0 },
                { label: "ROI Médio", value: `${(data?.facebookAds.reduce((sum, fb) => sum + (fb.roi || 0), 0) / Math.max(data?.facebookAds.length || 1, 1)).toFixed(0)}%` }
              ]}
              onSync={() => handleSync("Facebook Ads", syncFacebookAds)}
              isSyncing={isSyncing === "Facebook Ads"}
              delay={0.3}
            />
          </div>
        </TabsContent>

        {/* Facebook Ads Tab */}
        <TabsContent value="ads" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Campaigns List */}
            <Card className="border-border/30 bg-card/80 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Facebook className="h-5 w-5 text-[#1877f2]" />
                  Campanhas Ativas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data?.facebookAds.map((campaign, i) => (
                  <motion.div
                    key={campaign.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-4 rounded-xl bg-secondary/30 border border-border/30"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-foreground">{campaign.campanha_nome || "Campanha"}</h4>
                        <p className="text-xs text-muted-foreground">ID: {campaign.campanha_id}</p>
                      </div>
                      <Badge variant={campaign.status === "active" ? "default" : "secondary"}>
                        {campaign.status || "active"}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div>
                        <p className="text-lg font-bold text-foreground">{formatNumber(campaign.impressoes || 0)}</p>
                        <p className="text-[10px] text-muted-foreground">Impressões</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-foreground">{formatNumber(campaign.cliques || 0)}</p>
                        <p className="text-[10px] text-muted-foreground">Cliques</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-foreground">{((campaign.ctr || 0) * 100).toFixed(2)}%</p>
                        <p className="text-[10px] text-muted-foreground">CTR</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-emerald-500">{(campaign.roi || 0).toFixed(0)}%</p>
                        <p className="text-[10px] text-muted-foreground">ROI</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-border/30 flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Investido: <span className="text-foreground font-medium">R$ {(campaign.investimento || 0).toFixed(2)}</span>
                      </span>
                      <span className="text-muted-foreground">
                        Receita: <span className="text-emerald-500 font-medium">R$ {(campaign.receita || 0).toFixed(2)}</span>
                      </span>
                    </div>
                  </motion.div>
                ))}
                
                {(!data?.facebookAds || data.facebookAds.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma campanha encontrada</p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={() => handleSync("Facebook Ads", syncFacebookAds)}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Sincronizar Campanhas
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ads Performance Chart */}
            <Card className="border-border/30 bg-card/80 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Performance por Campanha
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={facebookCampaignsData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} width={100} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="investimento" fill={CYBER_COLORS.warning} name="Investimento" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="receita" fill={CYBER_COLORS.accent} name="Receita" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sales Tab */}
        <TabsContent value="sales" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <CyberMetricCard
              title="Total Alunos"
              value={data?.hotmart.totalAlunos || 0}
              icon={GraduationCap}
              color={CYBER_COLORS.primary}
              isLive
            />
            <CyberMetricCard
              title="Total Vendas"
              value={data?.hotmart.totalVendas || 0}
              icon={ShoppingCart}
              color={CYBER_COLORS.accent}
            />
            <CyberMetricCard
              title="Receita Total"
              value={formatCurrency((data?.hotmart.totalReceita || 0) * 100)}
              icon={DollarSign}
              color="#22c55e"
              isLive
            />
            <CyberMetricCard
              title="Comissões Totais"
              value={formatCurrency((data?.hotmart.totalComissoes || 0) * 100)}
              icon={Wallet}
              color={CYBER_COLORS.warning}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border/30 bg-card/80 backdrop-blur-xl border-l-4 border-l-emerald-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-500" />
                  Vendas de Hoje
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-4xl font-bold text-emerald-500">{data?.hotmart.vendasHoje || 0}</p>
                    <p className="text-sm text-muted-foreground mt-2">Vendas</p>
                  </div>
                  <div className="text-center p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-4xl font-bold text-emerald-500">
                      {formatCurrency((data?.hotmart.receitaHoje || 0) * 100)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">Receita</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/80 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  Status das Integrações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: "Hotmart Webhook", status: "active", color: CYBER_COLORS.hotmart },
                  { name: "YouTube API", status: data?.youtube ? "active" : "pending", color: CYBER_COLORS.youtube },
                  { name: "Instagram API", status: data?.instagram ? "active" : "pending", color: CYBER_COLORS.instagram },
                  { name: "Facebook Ads", status: data?.facebookAds.length ? "active" : "pending", color: CYBER_COLORS.facebook },
                  { name: "TikTok", status: data?.tiktok ? "active" : "manual", color: CYBER_COLORS.tiktok }
                ].map((integration, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: integration.color }} />
                      <span className="text-sm font-medium text-foreground">{integration.name}</span>
                    </div>
                    <Badge variant={integration.status === "active" ? "default" : "secondary"}>
                      {integration.status === "active" ? "Ativo" : integration.status === "manual" ? "Manual" : "Pendente"}
                    </Badge>
                  </div>
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
