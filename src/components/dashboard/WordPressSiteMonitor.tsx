import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { 
  Globe, 
  Users, 
  ShoppingCart, 
  BarChart3, 
  Activity,
  TrendingUp,
  Clock,
  User,
  Mail,
  Shield,
  RefreshCw,
  ExternalLink,
  Zap,
  Eye,
  DollarSign,
  Package,
  UserPlus,
  Wifi,
  Flame,
  GraduationCap,
  CreditCard,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface IntegrationEvent {
  id: string;
  event_type: string;
  source: string;
  payload: any;
  created_at: string;
  processed: boolean;
  source_id: string | null;
}

interface HotmartSale {
  id: string;
  transaction_id: string;
  buyer_name: string;
  buyer_email: string;
  product_name: string;
  value: number;
  status: string;
  created_at: string;
  affiliate_code?: string;
  offer_code?: string;
}

interface GoogleAnalyticsData {
  id: string;
  date: string;
  users: number;
  sessions: number;
  page_views: number;
  bounce_rate: number;
  avg_session_duration: number;
}

export function WordPressSiteMonitor() {
  const [events, setEvents] = useState<IntegrationEvent[]>([]);
  const [hotmartSales, setHotmartSales] = useState<HotmartSale[]>([]);
  const [analytics, setAnalytics] = useState<GoogleAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [monthRevenue, setMonthRevenue] = useState(0);

  const parseHotmartPayload = (payload: any): HotmartSale | null => {
    try {
      const data = payload.data || payload;
      const buyer = data.buyer || data.subscriber || {};
      const purchase = data.purchase || data;
      const product = data.product || {};
      
      return {
        id: payload.id || `hotmart_${Date.now()}`,
        transaction_id: purchase.transaction || data.transaction || '',
        buyer_name: buyer.name || buyer.first_name || 'Aluno Hotmart',
        buyer_email: buyer.email || '',
        product_name: product.name || data.prod_name || 'Curso',
        value: purchase.price?.value || purchase.value || data.price || 0,
        status: purchase.status || payload.event || 'COMPLETED',
        created_at: payload.creation_date ? new Date(payload.creation_date).toISOString() : new Date().toISOString(),
        affiliate_code: purchase.offer?.code || data.affiliate?.affiliate_code || undefined,
        offer_code: purchase.offer?.coupon_code || undefined
      };
    } catch (error) {
      console.error('Error parsing Hotmart payload:', error);
      return null;
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Buscar eventos de todas as fontes (Hotmart, WordPress, etc.)
      const { data: eventsData } = await supabase
        .from('integration_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      // Processar vendas Hotmart
      const hotmartEvents = (eventsData || []).filter(e => 
        e.source === 'hotmart' && 
        (e.event_type === 'PURCHASE_COMPLETE' || e.event_type === 'PURCHASE_APPROVED')
      );

      const sales = hotmartEvents
        .map(event => parseHotmartPayload(event.payload))
        .filter((sale): sale is HotmartSale => sale !== null);

      // Calcular receitas
      const today = new Date().toDateString();
      const thisMonth = new Date().getMonth();
      const thisYear = new Date().getFullYear();

      const todaySales = sales.filter(sale => {
        const saleDate = new Date(sale.created_at).toDateString();
        return saleDate === today;
      });

      const monthSales = sales.filter(sale => {
        const saleDate = new Date(sale.created_at);
        return saleDate.getMonth() === thisMonth && saleDate.getFullYear() === thisYear;
      });

      setTodayRevenue(todaySales.reduce((acc, sale) => acc + sale.value, 0));
      setMonthRevenue(monthSales.reduce((acc, sale) => acc + sale.value, 0));

      // Buscar métricas GA mais recentes
      const { data: gaData } = await supabase
        .from('google_analytics_metrics')
        .select('*')
        .order('date', { ascending: false })
        .limit(1)
        .single();

      setEvents(eventsData || []);
      setHotmartSales(sales);
      setAnalytics(gaData);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Realtime subscription para novos eventos
    const channel = supabase
      .channel('site-monitor-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'integration_events'
        },
        (payload) => {
          const newEvent = payload.new as IntegrationEvent;
          setEvents(prev => [newEvent, ...prev.slice(0, 49)]);
          
          // Se for venda Hotmart, adicionar à lista
          if (newEvent.source === 'hotmart' && 
              (newEvent.event_type === 'PURCHASE_COMPLETE' || newEvent.event_type === 'PURCHASE_APPROVED')) {
            const sale = parseHotmartPayload(newEvent.payload);
            if (sale) {
              setHotmartSales(prev => [sale, ...prev]);
              setTodayRevenue(prev => prev + sale.value);
              setMonthRevenue(prev => prev + sale.value);
              
              toast.success(`🎉 Nova venda Hotmart!`, {
                description: `${sale.buyer_name} - R$ ${sale.value.toFixed(2)} - ${sale.product_name.substring(0, 30)}...`
              });
            }
          } else if (newEvent.event_type === 'user_registered') {
            toast.success(`👤 Novo acesso criado no site!`, {
              description: `${newEvent.payload?.user_name || 'Novo usuário'} - ${newEvent.payload?.user_email || ''}`
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Calcular estatísticas
  const todayEvents = events.filter(e => {
    const eventDate = new Date(e.created_at).toDateString();
    return eventDate === new Date().toDateString();
  });

  const newUsersToday = todayEvents.filter(e => e.event_type === 'user_registered').length;
  const salesToday = hotmartSales.filter(sale => {
    const saleDate = new Date(sale.created_at).toDateString();
    return saleDate === new Date().toDateString();
  }).length;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getEventIcon = (type: string, source: string) => {
    if (source === 'hotmart') {
      return <Flame className="h-4 w-4 text-orange-500" />;
    }
    switch (type) {
      case 'user_registered': return <UserPlus className="h-4 w-4 text-blue-500" />;
      case 'PURCHASE_COMPLETE':
      case 'PURCHASE_APPROVED': return <CreditCard className="h-4 w-4 text-green-500" />;
      case 'user_login': return <User className="h-4 w-4 text-purple-500" />;
      default: return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getEventColor = (type: string, source: string) => {
    if (source === 'hotmart') {
      return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
    }
    switch (type) {
      case 'user_registered': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'PURCHASE_COMPLETE':
      case 'PURCHASE_APPROVED': return 'bg-green-500/10 text-green-500 border-green-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'COMPLETED' || status === 'PURCHASE_COMPLETE') {
      return <Badge className="bg-green-500/10 text-green-500 border-green-500/20"><CheckCircle2 className="h-3 w-3 mr-1" />Aprovado</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Meu Site & Vendas
            <Badge variant="outline" className="ml-2 text-xs bg-orange-500/10 text-orange-500 border-orange-500/20">
              <Flame className="h-3 w-3 mr-1" />
              Hotmart Ativo
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* Live Indicator */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-xs font-medium text-green-500">LIVE</span>
            </div>
            <Button variant="ghost" size="icon" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <a href="https://moisesmedeiros.com.br" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg bg-green-500/5 border border-green-500/10"
          >
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Vendas Hoje</span>
            </div>
            <p className="text-xl font-bold text-green-500">{formatCurrency(todayRevenue)}</p>
            <p className="text-xs text-muted-foreground">{salesToday} vendas</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/10"
          >
            <div className="flex items-center gap-2 mb-1">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-xs text-muted-foreground">Mês (Hotmart)</span>
            </div>
            <p className="text-xl font-bold text-orange-500">{formatCurrency(monthRevenue)}</p>
            <p className="text-xs text-muted-foreground">{hotmartSales.length} vendas</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10"
          >
            <div className="flex items-center gap-2 mb-1">
              <UserPlus className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Novos Acessos</span>
            </div>
            <p className="text-2xl font-bold text-blue-500">{newUsersToday}</p>
            <p className="text-xs text-muted-foreground">site hoje</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/10"
          >
            <div className="flex items-center gap-2 mb-1">
              <Eye className="h-4 w-4 text-purple-500" />
              <span className="text-xs text-muted-foreground">Sessões GA</span>
            </div>
            <p className="text-2xl font-bold text-purple-500">{analytics?.sessions || 0}</p>
            <p className="text-xs text-muted-foreground">Google Analytics</p>
          </motion.div>
        </div>

        <Tabs defaultValue="sales" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-4">
            <TabsTrigger value="sales" className="text-xs">
              <Flame className="h-3 w-3 mr-1" />
              Vendas Hotmart
            </TabsTrigger>
            <TabsTrigger value="users" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              Acessos Site
            </TabsTrigger>
            <TabsTrigger value="events" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              Todos Eventos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sales" className="mt-0">
            <ScrollArea className="h-[280px]">
              <AnimatePresence mode="popLayout">
                {hotmartSales.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Flame className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>Aguardando vendas Hotmart...</p>
                    <p className="text-xs mt-1">✅ Webhook configurado e funcionando</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {hotmartSales.map((sale, index) => (
                      <motion.div
                        key={sale.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.03 }}
                        className="p-3 border rounded-lg bg-green-500/5 border-green-500/10 hover:bg-green-500/10 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                            <GraduationCap className="h-5 w-5 text-orange-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-sm">{sale.buyer_name}</p>
                              {getStatusBadge(sale.status)}
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Mail className="h-3 w-3" />
                              {sale.buyer_email}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              📚 {sale.product_name.substring(0, 50)}...
                            </p>
                            {sale.offer_code && (
                              <Badge variant="outline" className="text-xs mt-1">
                                Cupom: {sale.offer_code}
                              </Badge>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-lg font-bold text-green-500">
                              {formatCurrency(sale.value)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(sale.created_at), { 
                                locale: ptBR, 
                                addSuffix: true 
                              })}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="users" className="mt-0">
            <ScrollArea className="h-[280px]">
              {events.filter(e => e.event_type === 'user_registered').length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>Nenhum novo acesso registrado</p>
                  <p className="text-xs mt-1">Configure o Automator para capturar novos usuários</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {events
                    .filter(e => e.event_type === 'user_registered')
                    .map((event, index) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-500" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {event.payload?.user_name || 'Novo Usuário'}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {event.payload?.user_email || 'email@exemplo.com'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(event.created_at), "dd/MM HH:mm")}
                            </p>
                            {event.payload?.event_data?.created_by && (
                              <div className="flex items-center gap-1 text-xs text-amber-500 mt-1">
                                <Shield className="h-3 w-3" />
                                <span>Criado por Admin</span>
                              </div>
                            )}
                            {event.payload?.event_data?.admin_email && (
                              <p className="text-xs text-amber-500">
                                {event.payload.event_data.admin_email}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="events" className="mt-0">
            <ScrollArea className="h-[280px]">
              <AnimatePresence mode="popLayout">
                {events.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Globe className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>Aguardando eventos...</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {events.slice(0, 20).map((event, index) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.03 }}
                        className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          {getEventIcon(event.event_type, event.source)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={`text-xs ${getEventColor(event.event_type, event.source)}`}>
                                {event.source}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {event.event_type}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(event.created_at), { 
                                  locale: ptBR, 
                                  addSuffix: true 
                                })}
                              </span>
                            </div>
                            {event.payload && (
                              <div className="mt-1 text-xs text-muted-foreground">
                                {event.payload.data?.buyer?.email && (
                                  <span className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {event.payload.data.buyer.email}
                                  </span>
                                )}
                                {event.payload.user_email && (
                                  <span className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {event.payload.user_email}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          {event.source_id && (
                            <Badge variant="outline" className="text-xs shrink-0">
                              {event.source_id.substring(0, 12)}...
                            </Badge>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Status Footer */}
        <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              <span>Hotmart Integrado</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              <span>WordPress Webhook</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Última atualização: {format(new Date(), "HH:mm:ss")}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
