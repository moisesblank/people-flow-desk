// 📊 TRAMON v8 - Widget de Relatórios Automáticos
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { 
  FileText, Calendar, Clock, Download, 
  RefreshCw, CheckCircle2, Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Relatorio {
  id: string;
  tipo: string;
  titulo: string;
  created_at: string;
}

const TIPO_CONFIG: Record<string, { label: string; icon: typeof Calendar; color: string }> = {
  diario: { label: "Diário", icon: Calendar, color: "bg-blue-500" },
  semanal: { label: "Semanal", icon: FileText, color: "bg-purple-500" },
  mensal: { label: "Mensal", icon: FileText, color: "bg-green-500" },
};

export function RelatoriosAutomaticosWidget() {
  const { toast } = useToast();
  const [relatorios, setRelatorios] = useState<Relatorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [autoReports, setAutoReports] = useState({ diario: true, semanal: true });

  useEffect(() => {
    fetchRelatorios();
  }, []);

  const fetchRelatorios = async () => {
    try {
      const { data, error } = await supabase
        .from('relatorios_gerados')
        .select('id, tipo, titulo, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRelatorios(data || []);
    } catch (error) {
      console.error('Error fetching relatorios:', error);
    } finally {
      setLoading(false);
    }
  };

  const gerarRelatorio = async (tipo: string) => {
    setGenerating(tipo);
    try {
      await supabase.functions.invoke('automacoes', {
        body: { tipo: tipo === 'diario' ? 'daily_report' : 'weekly_report' }
      });

      toast({ title: "✅ Relatório gerado", description: `Relatório ${tipo} criado!` });
      fetchRelatorios();
    } catch (error) {
      toast({ title: "❌ Erro", description: "Falha ao gerar relatório", variant: "destructive" });
    } finally {
      setGenerating(null);
    }
  };

  const getTipoConfig = (tipo: string) => TIPO_CONFIG[tipo] || TIPO_CONFIG.diario;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500">
              <FileText className="w-4 h-4 text-white" />
            </div>
            Relatórios
          </div>
          <Badge variant="outline" className="text-xs"><Sparkles className="w-3 h-3 mr-1" />Auto</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4 p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Switch checked={autoReports.diario} onCheckedChange={(c) => setAutoReports(p => ({ ...p, diario: c }))} />
            <span className="text-xs">Diário</span>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={autoReports.semanal} onCheckedChange={(c) => setAutoReports(p => ({ ...p, semanal: c }))} />
            <span className="text-xs">Semanal</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" disabled={!!generating} onClick={() => gerarRelatorio('diario')}>
            {generating === 'diario' ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : <Calendar className="w-3 h-3 mr-1" />}
            Gerar Diário
          </Button>
          <Button variant="outline" size="sm" className="flex-1" disabled={!!generating} onClick={() => gerarRelatorio('semanal')}>
            {generating === 'semanal' ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : <FileText className="w-3 h-3 mr-1" />}
            Gerar Semanal
          </Button>
        </div>

        <ScrollArea className="h-[150px]">
          {loading ? (
            <div className="flex items-center justify-center h-full"><RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : relatorios.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <FileText className="w-8 h-8 mb-2" /><span className="text-sm">Nenhum relatório</span>
            </div>
          ) : (
            <div className="space-y-2">
              {relatorios.map((r, i) => {
                const config = getTipoConfig(r.tipo);
                const Icon = config.icon;
                return (
                  <motion.div key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 p-2 rounded-lg bg-card/50 border border-border/50">
                    <div className={`w-8 h-8 rounded-lg ${config.color} flex items-center justify-center`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{r.titulo}</div>
                      <div className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: ptBR })}</div>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  </motion.div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
