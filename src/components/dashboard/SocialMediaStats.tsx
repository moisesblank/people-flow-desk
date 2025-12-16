// ============================================
// MOISÉS MEDEIROS v10.0 - Social Media Stats Widget
// Métricas de redes sociais em tempo real
// Com links para perfis e atualização automática
// ============================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Instagram,
  Youtube,
  Facebook,
  RefreshCw,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  Video,
  Edit3,
  Check,
  X,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from "@/components/ui/dialog";
import { useSocialMediaStats, SocialMediaMetric } from "@/hooks/useSocialMediaStats";

const platformConfig: Record<string, {
  icon: typeof Instagram;
  color: string;
  gradient: string;
  label: string;
}> = {
  instagram: {
    icon: Instagram,
    color: "text-pink-500",
    gradient: "from-pink-500 via-purple-500 to-orange-500",
    label: "Instagram"
  },
  youtube: {
    icon: Youtube,
    color: "text-red-500",
    gradient: "from-red-600 to-red-700",
    label: "YouTube"
  },
  facebook: {
    icon: Facebook,
    color: "text-blue-500",
    gradient: "from-blue-600 to-blue-700",
    label: "Facebook"
  },
  tiktok: {
    icon: Video,
    color: "text-foreground",
    gradient: "from-black via-pink-500 to-cyan-400",
    label: "TikTok"
  }
};

interface EditModalProps {
  metric: SocialMediaMetric | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (platform: string, data: Partial<SocialMediaMetric>) => Promise<void>;
}

function EditModal({ metric, isOpen, onClose, onSave }: EditModalProps) {
  const [followers, setFollowers] = useState(metric?.followers?.toString() || "0");
  const [engagement, setEngagement] = useState(metric?.engagement_rate?.toString() || "0");
  const [growth, setGrowth] = useState(metric?.growth_rate?.toString() || "0");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!metric) return;
    setIsSaving(true);
    
    await onSave(metric.platform, {
      followers: parseInt(followers) || 0,
      engagement_rate: parseFloat(engagement) || 0,
      growth_rate: parseFloat(growth) || 0
    });
    
    setIsSaving(false);
    onClose();
  };

  if (!metric) return null;

  const config = platformConfig[metric.platform] || platformConfig.instagram;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <config.icon className={`h-5 w-5 ${config.color}`} />
            Editar {config.label}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Seguidores</label>
            <Input
              type="number"
              value={followers}
              onChange={(e) => setFollowers(e.target.value)}
              placeholder="Ex: 125400"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Taxa de Engajamento (%)</label>
            <Input
              type="number"
              step="0.1"
              value={engagement}
              onChange={(e) => setEngagement(e.target.value)}
              placeholder="Ex: 4.8"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Crescimento (%)</label>
            <Input
              type="number"
              step="0.1"
              value={growth}
              onChange={(e) => setGrowth(e.target.value)}
              placeholder="Ex: 12.5"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SocialCard({ 
  metric, 
  formatNumber, 
  onEdit,
  onRefresh,
  isRefreshing
}: { 
  metric: SocialMediaMetric;
  formatNumber: (n: number) => string;
  onEdit: (metric: SocialMediaMetric) => void;
  onRefresh: (platform: string) => void;
  isRefreshing: boolean;
}) {
  const config = platformConfig[metric.platform] || platformConfig.instagram;
  const Icon = config.icon;
  const isPositiveGrowth = metric.growth_rate >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="group"
    >
      <Card className="overflow-hidden border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5">
        {/* Gradient Header */}
        <div className={`h-2 bg-gradient-to-r ${config.gradient}`} />
        
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.div 
                className={`p-2.5 rounded-xl bg-gradient-to-br ${config.gradient}`}
                whileHover={{ rotate: 5, scale: 1.1 }}
              >
                <Icon className="h-5 w-5 text-white" />
              </motion.div>
              <div>
                <span className="font-semibold text-foreground">{config.label}</span>
                <p className="text-xs text-muted-foreground">@{metric.username}</p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {metric.is_auto_fetch && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => onRefresh(metric.platform)}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => onEdit(metric)}
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              {metric.profile_url && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  asChild
                >
                  <a href={metric.profile_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="space-y-3">
            {/* Followers */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Seguidores</span>
              </div>
              <span className="text-lg font-bold text-foreground">
                {formatNumber(metric.followers || metric.subscribers || 0)}
              </span>
            </div>

            {/* Growth */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
              <div className="flex items-center gap-2">
                {isPositiveGrowth ? (
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm text-muted-foreground">Crescimento</span>
              </div>
              <Badge 
                variant="secondary" 
                className={isPositiveGrowth ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"}
              >
                {isPositiveGrowth ? "+" : ""}{metric.growth_rate?.toFixed(1) || 0}%
              </Badge>
            </div>

            {/* Engagement */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Engajamento</span>
              </div>
              <span className="font-semibold text-foreground">
                {metric.engagement_rate?.toFixed(1) || 0}%
              </span>
            </div>

            {/* YouTube specific - Views */}
            {metric.platform === 'youtube' && metric.views_count > 0 && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Visualizações</span>
                </div>
                <span className="font-semibold text-foreground">
                  {formatNumber(metric.views_count)}
                </span>
              </div>
            )}
          </div>

          {/* Last Updated */}
          {metric.last_fetched_at && (
            <p className="text-[10px] text-muted-foreground text-center mt-3">
              Atualizado: {new Date(metric.last_fetched_at).toLocaleString('pt-BR')}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function SocialMediaStats() {
  const { 
    metrics, 
    isLoading, 
    isFetching, 
    refreshStats, 
    updateMetric,
    formatNumber 
  } = useSocialMediaStats();
  
  const [editingMetric, setEditingMetric] = useState<SocialMediaMetric | null>(null);

  const handleEdit = (metric: SocialMediaMetric) => {
    setEditingMetric(metric);
  };

  const handleSave = async (platform: string, data: Partial<SocialMediaMetric>) => {
    await updateMetric(platform, data);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="overflow-hidden">
            <div className="h-2 bg-muted animate-pulse" />
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-10 bg-muted animate-pulse rounded-lg" />
                <div className="h-10 bg-muted animate-pulse rounded-lg" />
                <div className="h-10 bg-muted animate-pulse rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Ordenar: instagram, youtube, facebook, tiktok
  const orderedPlatforms = ['instagram', 'youtube', 'facebook', 'tiktok'];
  const sortedMetrics = [...metrics].sort((a, b) => {
    return orderedPlatforms.indexOf(a.platform) - orderedPlatforms.indexOf(b.platform);
  });

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Redes Sociais</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refreshStats()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          {isFetching ? 'Atualizando...' : 'Atualizar Todas'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatePresence>
          {sortedMetrics.map((metric, index) => (
            <motion.div
              key={metric.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <SocialCard
                metric={metric}
                formatNumber={formatNumber}
                onEdit={handleEdit}
                onRefresh={refreshStats}
                isRefreshing={isFetching}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <EditModal
        metric={editingMetric}
        isOpen={!!editingMetric}
        onClose={() => setEditingMetric(null)}
        onSave={handleSave}
      />
    </>
  );
}

export default SocialMediaStats;
