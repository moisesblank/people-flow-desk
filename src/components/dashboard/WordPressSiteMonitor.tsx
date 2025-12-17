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
  MousePointer,
  ArrowUpRight,
  DollarSign,
  Package,
  UserPlus,
  Wifi
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface WordPressEvent {
  id: string;
  event_type: string;
  source: string;
  payload: any;
  created_at: string;
  processed: boolean;
}

interface WooCommerceOrder {
  id: string;
  order_number: string;
  status: string;
  total: number;
  customer_email: string;
  customer_name: string;
  created_at: string;
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
  const [events, setEvents] = useState<WordPressEvent[]>([]);
  const [orders, setOrders] = useState<WooCommerceOrder[]>([]);
  const [analytics, setAnalytics] = useState<GoogleAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Buscar eventos do WordPress
      const { data: eventsData } = await supabase
        .from('integration_events')
        .select('*')
        .in('source', ['wordpress', 'woocommerce'])
        .order('created_at', { ascending: false })
        .limit(20);

      // Buscar pedidos WooCommerce
      const { data: ordersData } = await supabase
        .from('woocommerce_orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      // Buscar métricas GA mais recentes
      const { data: gaData } = await supabase
        .from('google_analytics_metrics')
        .select('*')
        .order('date', { ascending: false })
        .limit(1)
        .single();

      setEvents(eventsData || []);
      setOrders(ordersData || []);
      setAnalytics(gaData);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Realtime subscription para eventos
    const channel = supabase
      .channel('site-monitor')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'integration_events'
        },
        (payload) => {
          const newEvent = payload.new as WordPressEvent;
          setEvents(prev => [newEvent, ...prev.slice(0, 19)]);
          
          // Notificação toast
          const icon = newEvent.event_type === 'woocommerce_order' ? '🛒' : '👤';
          toast.success(`${icon} Novo evento do site!`, {
            description: `${newEvent.event_type} - ${formatDistanceToNow(new Date(newEvent.created_at), { locale: ptBR, addSuffix: true })}`
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'woocommerce_orders'
        },
        (payload) => {
          const newOrder = payload.new as WooCommerceOrder;
          setOrders(prev => [newOrder, ...prev.slice(0, 9)]);
          
          toast.success(`🎉 Nova venda no site!`, {
            description: `R$ ${(newOrder.total / 100).toFixed(2)} - ${newOrder.customer_name}`
          });
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
  const ordersToday = todayEvents.filter(e => e.event_type === 'woocommerce_order').length;

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'user_registered': return <UserPlus className="h-4 w-4 text-blue-500" />;
      case 'woocommerce_order': return <ShoppingCart className="h-4 w-4 text-green-500" />;
      case 'user_login': return <User className="h-4 w-4 text-purple-500" />;
      case 'google_analytics': return <BarChart3 className="h-4 w-4 text-orange-500" />;
      default: return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'user_registered': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'woocommerce_order': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'user_login': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            moisesmedeiros.com.br
            <Badge variant="outline" className="ml-2 text-xs">
              <Wifi className="h-3 w-3 mr-1" />
              WordPress
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
            className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10"
          >
            <div className="flex items-center gap-2 mb-1">
              <UserPlus className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Novos Usuários</span>
            </div>
            <p className="text-2xl font-bold text-blue-500">{newUsersToday}</p>
            <p className="text-xs text-muted-foreground">hoje</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-3 rounded-lg bg-green-500/5 border border-green-500/10"
          >
            <div className="flex items-center gap-2 mb-1">
              <ShoppingCart className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Vendas</span>
            </div>
            <p className="text-2xl font-bold text-green-500">{ordersToday}</p>
            <p className="text-xs text-muted-foreground">hoje</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/10"
          >
            <div className="flex items-center gap-2 mb-1">
              <Eye className="h-4 w-4 text-orange-500" />
              <span className="text-xs text-muted-foreground">Sessões</span>
            </div>
            <p className="text-2xl font-bold text-orange-500">{analytics?.sessions || 0}</p>
            <p className="text-xs text-muted-foreground">GA4</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/10"
          >
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-purple-500" />
              <span className="text-xs text-muted-foreground">Total Eventos</span>
            </div>
            <p className="text-2xl font-bold text-purple-500">{events.length}</p>
            <p className="text-xs text-muted-foreground">sincronizados</p>
          </motion.div>
        </div>

        <Tabs defaultValue="events" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-4">
            <TabsTrigger value="events" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              Eventos Live
            </TabsTrigger>
            <TabsTrigger value="users" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              Novos Acessos
            </TabsTrigger>
            <TabsTrigger value="orders" className="text-xs">
              <ShoppingCart className="h-3 w-3 mr-1" />
              Vendas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="mt-0">
            <ScrollArea className="h-[280px]">
              <AnimatePresence mode="popLayout">
                {events.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Globe className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>Aguardando eventos do site...</p>
                    <p className="text-xs mt-1">Configure o Automator para ver dados aqui</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {events.map((event, index) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          {getEventIcon(event.event_type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={`text-xs ${getEventColor(event.event_type)}`}>
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
                                {event.payload.user_email && (
                                  <span className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {event.payload.user_email}
                                  </span>
                                )}
                                {event.payload.user_name && (
                                  <span className="block truncate">{event.payload.user_name}</span>
                                )}
                              </div>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {event.source}
                          </Badge>
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
                        className="p-3 border rounded-lg"
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
                              <div className="flex items-center gap-1 text-xs text-primary mt-1">
                                <Shield className="h-3 w-3" />
                                <span>Admin</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="orders" className="mt-0">
            <ScrollArea className="h-[280px]">
              {orders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma venda registrada</p>
                  <p className="text-xs mt-1">Configure o webhook do WooCommerce</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {orders.map((order, index) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-3 border rounded-lg bg-green-500/5 border-green-500/10"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                          <Package className="h-5 w-5 text-green-500" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            Pedido #{order.order_number}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.customer_name} • {order.customer_email}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-500">
                            R$ {(order.total / 100).toFixed(2)}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
