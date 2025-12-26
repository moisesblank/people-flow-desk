import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/hooks/useAuth';

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime: string };
  end: { dateTime: string };
  htmlLink?: string;
}

export const useGoogleCalendar = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const { user } = useAuth();

  const getAuthUrl = async (redirectUri?: string): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('google-calendar', {
        body: { 
          action: 'auth_url', 
          redirectUri: redirectUri || `${window.location.origin}/calendario` 
        },
      });

      if (fnError) throw fnError;
      if (!data.success) throw new Error(data.error);

      return data.authUrl;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const exchangeToken = async (code: string, redirectUri?: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('google-calendar', {
        body: { 
          action: 'exchange_token', 
          code, 
          userId: user?.id,
          redirectUri: redirectUri || `${window.location.origin}/calendario`
        },
      });

      if (fnError) throw fnError;
      if (!data.success) throw new Error(data.error);

      setAccessToken(data.accessToken);
      // Armazenar no localStorage para persistência
      localStorage.setItem('google_calendar_token', data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem('google_calendar_refresh_token', data.refreshToken);
      }

      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const listEvents = async (): Promise<CalendarEvent[]> => {
    setLoading(true);
    setError(null);
    try {
      const token = accessToken || localStorage.getItem('google_calendar_token');
      if (!token) throw new Error('Not authenticated with Google Calendar');

      const { data, error: fnError } = await supabase.functions.invoke('google-calendar', {
        body: { action: 'list_events', accessToken: token },
      });

      if (fnError) throw fnError;
      if (!data.success) throw new Error(data.error);

      return data.events || [];
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async (event: {
    summary: string;
    description?: string;
    start: string;
    end: string;
    reminders?: boolean;
  }): Promise<CalendarEvent | null> => {
    setLoading(true);
    setError(null);
    try {
      const token = accessToken || localStorage.getItem('google_calendar_token');
      if (!token) throw new Error('Not authenticated with Google Calendar');

      const { data, error: fnError } = await supabase.functions.invoke('google-calendar', {
        body: { action: 'create_event', accessToken: token, event },
      });

      if (fnError) throw fnError;
      if (!data.success) throw new Error(data.error);

      return data.event;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const syncTasks = async (): Promise<number> => {
    setLoading(true);
    setError(null);
    try {
      const token = accessToken || localStorage.getItem('google_calendar_token');
      if (!token) throw new Error('Not authenticated with Google Calendar');

      const { data, error: fnError } = await supabase.functions.invoke('google-calendar', {
        body: { action: 'sync_tasks', accessToken: token, userId: user?.id },
      });

      if (fnError) throw fnError;
      if (!data.success) throw new Error(data.error);

      return data.syncedCount || 0;
    } catch (err: any) {
      setError(err.message);
      return 0;
    } finally {
      setLoading(false);
    }
  };

  const isConnected = (): boolean => {
    return !!(accessToken || localStorage.getItem('google_calendar_token'));
  };

  const disconnect = () => {
    setAccessToken(null);
    localStorage.removeItem('google_calendar_token');
    localStorage.removeItem('google_calendar_refresh_token');
  };

  return {
    loading,
    error,
    isConnected: isConnected(),
    getAuthUrl,
    exchangeToken,
    listEvents,
    createEvent,
    syncTasks,
    disconnect,
  };
};
