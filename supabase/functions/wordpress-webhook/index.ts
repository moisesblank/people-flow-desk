// ============================================
// MOISÉS MEDEIROS v10.0 - WordPress/WooCommerce Webhook
// Recebe eventos do WordPress, WooCommerce e Google Analytics
// ============================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getWebhookCorsHeaders } from "../_shared/corsConfig.ts";

// CORS para webhooks externos (WordPress/WooCommerce)
const corsHeaders = getWebhookCorsHeaders();

interface WordPressEvent {
  event_type: string;
  user_email?: string;
  user_name?: string;
  user_ip?: string;
  page_url?: string;
  event_data?: Record<string, unknown>;
}

interface WooCommerceOrder {
  id: string | number;
  order_key?: string;
  number?: string;
  status: string;
  currency: string;
  total: string | number;
  subtotal?: string | number;
  discount_total?: string | number;
  shipping_total?: string | number;
  tax_total?: string | number;
  payment_method?: string;
  payment_method_title?: string;
  billing?: {
    email?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  line_items?: Array<{
    name: string;
    quantity: number;
    total: string;
    product_id: number;
  }>;
  date_created?: string;
  date_paid?: string;
}

interface GoogleAnalyticsData {
  date: string;
  sessions?: number;
  users?: number;
  new_users?: number;
  page_views?: number;
  pages_per_session?: number;
  avg_session_duration?: number;
  bounce_rate?: number;
  organic_search?: number;
  direct?: number;
  social?: number;
  referral?: number;
  paid_search?: number;
  top_pages?: Array<{ page: string; views: number }>;
  devices?: Array<{ device: string; sessions: number }>;
  locations?: Array<{ country: string; sessions: number }>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify webhook secret
    const webhookSecret = req.headers.get('x-webhook-secret');
    const expectedSecret = Deno.env.get('WORDPRESS_WEBHOOK_SECRET') || 'moisesmedeiros2024';
    
    if (webhookSecret !== expectedSecret) {
      console.error('Invalid webhook secret');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const eventType = body.event_type || body.type || 'unknown';
    
    console.log('📥 Webhook received:', eventType, JSON.stringify(body).substring(0, 500));

    // ============================================
    // GOOGLE ANALYTICS DATA
    // ============================================
    if (eventType === 'google_analytics' || body.ga_data) {
      const gaData: GoogleAnalyticsData = body.ga_data || body;
      const today = new Date().toISOString().split('T')[0];
      
      const { error: gaError } = await supabase
        .from('google_analytics_metrics')
        .upsert({
          date: gaData.date || today,
          sessions: gaData.sessions || 0,
          users: gaData.users || 0,
          new_users: gaData.new_users || 0,
          page_views: gaData.page_views || 0,
          pages_per_session: gaData.pages_per_session || 0,
          avg_session_duration: gaData.avg_session_duration || 0,
          bounce_rate: gaData.bounce_rate || 0,
          organic_search: gaData.organic_search || 0,
          direct: gaData.direct || 0,
          social: gaData.social || 0,
          referral: gaData.referral || 0,
          paid_search: gaData.paid_search || 0,
          top_pages: gaData.top_pages || [],
          devices: gaData.devices || [],
          locations: gaData.locations || [],
          updated_at: new Date().toISOString()
        }, { onConflict: 'date' });

      if (gaError) {
        console.error('❌ Error saving GA data:', gaError);
      } else {
        console.log('✅ Google Analytics data saved successfully');
      }

      return new Response(
        JSON.stringify({ success: true, type: 'google_analytics' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // WOOCOMMERCE ORDER
    // ============================================
    if (eventType.startsWith('woocommerce') || body.order || body.line_items) {
      const order: WooCommerceOrder = body.order || body;
      const orderId = String(order.id || order.order_key || `woo_${Date.now()}`);
      
      // Save order
      const { error: orderError } = await supabase
        .from('woocommerce_orders')
        .upsert({
          order_id: orderId,
          order_number: order.number || orderId,
          status: order.status || 'pending',
          currency: order.currency || 'BRL',
          total: parseFloat(String(order.total)) || 0,
          subtotal: parseFloat(String(order.subtotal)) || 0,
          discount_total: parseFloat(String(order.discount_total)) || 0,
          shipping_total: parseFloat(String(order.shipping_total)) || 0,
          tax_total: parseFloat(String(order.tax_total)) || 0,
          payment_method: order.payment_method,
          payment_method_title: order.payment_method_title,
          customer_email: order.billing?.email,
          customer_name: order.billing ? `${order.billing.first_name || ''} ${order.billing.last_name || ''}`.trim() : null,
          customer_phone: order.billing?.phone,
          billing_city: order.billing?.city,
          billing_state: order.billing?.state,
          billing_country: order.billing?.country,
          items_count: order.line_items?.length || 0,
          products: order.line_items || [],
          date_created: order.date_created ? new Date(order.date_created).toISOString() : new Date().toISOString(),
          date_paid: order.date_paid ? new Date(order.date_paid).toISOString() : null,
          updated_at: new Date().toISOString()
        }, { onConflict: 'order_id' });

      if (orderError) {
        console.error('❌ Error saving WooCommerce order:', orderError);
      } else {
        console.log('✅ WooCommerce order saved:', orderId);
      }

      // Update daily metrics
      const today = new Date().toISOString().split('T')[0];
      const orderTotal = parseFloat(String(order.total)) || 0;
      
      // Get current metrics
      const { data: currentMetrics } = await supabase
        .from('woocommerce_daily_metrics')
        .select('*')
        .eq('date', today)
        .single();

      const newOrdersCount = (currentMetrics?.total_orders || 0) + 1;
      const newRevenue = (currentMetrics?.total_revenue || 0) + orderTotal;
      const newItemsSold = (currentMetrics?.items_sold || 0) + (order.line_items?.length || 0);
      const avgOrderValue = newRevenue / newOrdersCount;

      await supabase
        .from('woocommerce_daily_metrics')
        .upsert({
          date: today,
          total_orders: newOrdersCount,
          total_revenue: newRevenue,
          average_order_value: avgOrderValue,
          items_sold: newItemsSold,
          updated_at: new Date().toISOString()
        }, { onConflict: 'date' });

      // Also save as wordpress event
      await supabase.from('wordpress_events').insert({
        event_type: 'woocommerce_order',
        user_email: order.billing?.email,
        user_name: order.billing ? `${order.billing.first_name || ''} ${order.billing.last_name || ''}`.trim() : null,
        event_data: {
          order_id: orderId,
          total: orderTotal,
          status: order.status,
          items: order.line_items?.length || 0
        }
      });

      return new Response(
        JSON.stringify({ success: true, type: 'woocommerce_order', order_id: orderId }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // STANDARD WORDPRESS EVENTS
    // ============================================
    const wpEvent: WordPressEvent = body;
    
    // Insert WordPress event
    const { error: eventError } = await supabase
      .from('wordpress_events')
      .insert({
        event_type: eventType,
        user_email: wpEvent.user_email,
        user_name: wpEvent.user_name,
        user_ip: wpEvent.user_ip,
        page_url: wpEvent.page_url,
        event_data: wpEvent.event_data || {}
      });

    if (eventError) {
      console.error('❌ Error inserting event:', eventError);
      throw eventError;
    }

    console.log('✅ WordPress event saved:', eventType);

    // Update daily metrics
    const today = new Date().toISOString().split('T')[0];
    
    const { data: existingMetrics } = await supabase
      .from('wordpress_metrics')
      .select('*')
      .eq('date', today)
      .single();

    const updates: Record<string, number> = {
      total_users: existingMetrics?.total_users || 0,
      new_registrations: existingMetrics?.new_registrations || 0,
      active_users: existingMetrics?.active_users || 0,
      page_views: existingMetrics?.page_views || 0
    };

    switch (eventType) {
      case 'user_registered':
        updates.new_registrations += 1;
        updates.total_users += 1;
        break;
      case 'user_login':
        updates.active_users += 1;
        break;
      case 'page_view':
        updates.page_views += 1;
        break;
    }

    const { error: metricsError } = await supabase
      .from('wordpress_metrics')
      .upsert({
        date: today,
        ...updates,
        updated_at: new Date().toISOString()
      }, { onConflict: 'date' });

    if (metricsError) {
      console.error('❌ Error updating metrics:', metricsError);
    }

    return new Response(
      JSON.stringify({ success: true, type: eventType }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
