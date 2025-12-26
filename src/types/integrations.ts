// ============================================
// TIPOS DE INTEGRAÇÕES EXTERNAS
// Centralizados por domínio
// ============================================

// ============================================
// WHATSAPP
// ============================================

export interface WhatsAppConversation {
  id: string;
  contact_name?: string;
  contact_phone: string;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
  status: 'active' | 'archived' | 'blocked';
  created_at: string;
}

export interface WhatsAppMessage {
  id: string;
  conversation_id: string;
  content: string;
  direction: 'inbound' | 'outbound';
  status: 'sent' | 'delivered' | 'read' | 'failed';
  message_type: 'text' | 'image' | 'audio' | 'document' | 'video';
  created_at: string;
}

export interface WhatsAppAttachment {
  id: string;
  message_id: string;
  filename?: string;
  mime_type?: string;
  file_size?: number;
  url: string;
  attachment_type: 'image' | 'audio' | 'document' | 'video';
  caption?: string;
}

export interface WhatsAppTask {
  id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string | null;
  owner: string | null;
  source: string;
  related_conversation_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppFinance {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string | null;
  counterparty: string | null;
  date: string | null;
  status: 'pending' | 'confirmed' | 'cancelled';
  source: string;
  related_conversation_id: string | null;
  created_at: string;
}

// ============================================
// YOUTUBE
// ============================================

export interface YouTubeChannelStats {
  subscriberCount: string;
  viewCount: string;
  videoCount: string;
  title: string;
  description: string;
  thumbnails: YouTubeThumbnails;
}

export interface YouTubeThumbnails {
  default?: { url: string; width: number; height: number };
  medium?: { url: string; width: number; height: number };
  high?: { url: string; width: number; height: number };
  standard?: { url: string; width: number; height: number };
  maxres?: { url: string; width: number; height: number };
}

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnails: YouTubeThumbnails;
  publishedAt: string;
  channelId?: string;
  channelTitle?: string;
  viewCount?: string;
  likeCount?: string;
  commentCount?: string;
  duration?: string;
}

// ============================================
// GOOGLE CALENDAR
// ============================================

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
  htmlLink?: string;
  location?: string;
  status?: 'confirmed' | 'tentative' | 'cancelled';
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }>;
}

// ============================================
// HOTMART
// ============================================

export interface HotmartTransaction {
  id: string;
  transaction_id: string;
  product_id: string;
  product_name: string;
  buyer_email: string;
  buyer_name: string;
  status: 'approved' | 'refunded' | 'cancelled' | 'dispute' | 'chargeback';
  payment_method: string;
  value: number;
  currency: string;
  purchase_date: string;
  affiliate_id?: string;
  affiliate_name?: string;
  commission_value?: number;
  created_at: string;
}

export interface HotmartSubscription {
  id: string;
  subscriber_email: string;
  subscriber_name: string;
  product_id: string;
  product_name: string;
  status: 'active' | 'cancelled' | 'past_due' | 'expired';
  start_date: string;
  end_date?: string;
  next_payment_date?: string;
  value: number;
}

export interface HotmartWebhookPayload {
  hottok: string;
  event: string;
  transaction: string;
  product_id: number;
  creation_date: number;
  data: {
    buyer: {
      email: string;
      name: string;
      phone?: string;
      document?: string;
    };
    purchase: {
      status: string;
      payment_method: string;
      price: {
        value: number;
        currency_code: string;
      };
    };
    subscription?: {
      status: string;
      plan: {
        id: number;
        name: string;
      };
    };
  };
}

// ============================================
// PANDA VIDEO
// ============================================

export interface PandaVideo {
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  duration: number;
  status: 'processing' | 'ready' | 'error';
  views: number;
  created_at: string;
  updated_at: string;
}

export interface PandaSignedUrl {
  url: string;
  expires_at: string;
  video_id: string;
}

// ============================================
// WORDPRESS
// ============================================

export interface WordPressUser {
  id: number;
  email: string;
  username: string;
  display_name?: string;
  roles: string[];
  meta?: Record<string, unknown>;
  registered_date: string;
}

export interface WordPressSyncResult {
  synced: number;
  errors: number;
  created: number;
  updated: number;
  skipped: number;
  details: Array<{
    email: string;
    status: 'created' | 'updated' | 'skipped' | 'error';
    message?: string;
  }>;
}
