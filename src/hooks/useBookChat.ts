// ============================================
// 🌌 HOOK: useBookChat — Chat Sincronizado em Tempo Real
// ANO 2300 — LIVRO WEB COM IA TRAMON
// ============================================

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ============================================
// TIPOS
// ============================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  pageNumber?: number;
  chapterTitle?: string;
  createdAt: string;
  isLoading?: boolean;
  contentReference?: { selectedText?: string };
}

export interface ChatThread {
  id: string;
  bookId: string;
  initialPage?: number;
  initialChapter?: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface UseBookChatReturn {
  /** Mensagens do chat */
  messages: ChatMessage[];
  /** Thread atual */
  thread: ChatThread | null;
  /** Se está carregando */
  isLoading: boolean;
  /** Se está enviando mensagem */
  isSending: boolean;
  /** Enviar mensagem */
  sendMessage: (message: string, options?: {
    pageNumber?: number;
    chapterTitle?: string;
    selectedText?: string;
  }) => Promise<void>;
  /** Carregar histórico */
  loadHistory: (threadId?: string) => Promise<void>;
  /** Criar nova thread */
  newThread: () => void;
  /** Lista de threads */
  threads: ChatThread[];
  /** Carregar lista de threads */
  loadThreads: () => Promise<void>;
}

// ============================================
// HOOK PRINCIPAL
// ============================================

export function useBookChat(bookId: string): UseBookChatReturn {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [thread, setThread] = useState<ChatThread | null>(null);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Carregar threads do livro
  const loadThreads = useCallback(async () => {
    if (!user?.id || !bookId) return;

    try {
      const { data } = await supabase
        .from('book_chat_threads')
        .select('*')
        .eq('book_id', bookId)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(20);

      if (data) {
        setThreads(data.map(t => ({
          id: t.id,
          bookId: t.book_id,
          initialPage: t.initial_page,
          initialChapter: t.initial_chapter,
          messageCount: t.message_count || 0,
          createdAt: t.created_at,
          updatedAt: t.updated_at,
        })));
      }
    } catch (err) {
      console.error('[BookChat] Erro ao carregar threads:', err);
    }
  }, [bookId, user?.id]);

  // Carregar histórico de uma thread
  const loadHistory = useCallback(async (threadId?: string) => {
    if (!user?.id || !bookId) return;

    const targetThreadId = threadId || thread?.id;
    if (!targetThreadId) return;

    setIsLoading(true);

    try {
      const { data } = await supabase
        .from('book_chat_messages')
        .select('*')
        .eq('thread_id', targetThreadId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (data) {
        setMessages(data.map(m => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          pageNumber: m.page_number,
          chapterTitle: m.chapter_title,
          createdAt: m.created_at,
          contentReference: m.content_reference as { selectedText?: string } | undefined,
        })));
      }
    } catch (err) {
      console.error('[BookChat] Erro ao carregar histórico:', err);
    } finally {
      setIsLoading(false);
    }
  }, [bookId, user?.id, thread?.id]);

  // Enviar mensagem
  const sendMessage = useCallback(async (
    message: string,
    options?: {
      pageNumber?: number;
      chapterTitle?: string;
      selectedText?: string;
    }
  ) => {
    if (!user?.id || !bookId || !message.trim()) return;

    setIsSending(true);

    // Adicionar mensagem do usuário otimisticamente
    const tempUserMsgId = `temp-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: tempUserMsgId,
      role: 'user',
      content: message,
      pageNumber: options?.pageNumber,
      chapterTitle: options?.chapterTitle,
      createdAt: new Date().toISOString(),
      contentReference: options?.selectedText ? { selectedText: options.selectedText } : undefined,
    };
    
    setMessages(prev => [...prev, userMessage]);

    // Adicionar placeholder de loading para resposta
    const tempAssistantMsgId = `temp-assistant-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: tempAssistantMsgId,
      role: 'assistant',
      content: '',
      pageNumber: options?.pageNumber,
      chapterTitle: options?.chapterTitle,
      createdAt: new Date().toISOString(),
      isLoading: true,
    }]);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('Não autenticado');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/book-chat-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          bookId,
          threadId: thread?.id,
          message,
          pageNumber: options?.pageNumber,
          chapterTitle: options?.chapterTitle,
          selectedText: options?.selectedText,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao enviar mensagem');
      }

      // Atualizar thread se criada
      if (result.threadId && !thread?.id) {
        setThread({
          id: result.threadId,
          bookId,
          initialPage: options?.pageNumber,
          initialChapter: options?.chapterTitle,
          messageCount: 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      // Substituir placeholder pela resposta real
      setMessages(prev => prev.map(m => 
        m.id === tempAssistantMsgId
          ? {
              id: result.messageId || tempAssistantMsgId,
              role: 'assistant' as const,
              content: result.message,
              pageNumber: options?.pageNumber,
              chapterTitle: options?.chapterTitle,
              createdAt: new Date().toISOString(),
              isLoading: false,
            }
          : m
      ));

    } catch (err) {
      console.error('[BookChat] Erro ao enviar:', err);
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar mensagem');
      
      // Remover placeholder em caso de erro
      setMessages(prev => prev.filter(m => m.id !== tempAssistantMsgId));
    } finally {
      setIsSending(false);
    }
  }, [bookId, user?.id, thread?.id]);

  // Nova thread
  const newThread = useCallback(() => {
    setThread(null);
    setMessages([]);
  }, []);

  // Subscrição realtime para novas mensagens
  useEffect(() => {
    if (!thread?.id) return;

    subscriptionRef.current = supabase
      .channel(`book-chat-${thread.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'book_chat_messages',
          filter: `thread_id=eq.${thread.id}`,
        },
        (payload) => {
          const newMsg = payload.new as any;
          
          // Evitar duplicatas (mensagens que já adicionamos)
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            if (prev.some(m => m.id.startsWith('temp-') && m.role === newMsg.role)) {
              // Substituir temp message
              return prev.map(m => 
                m.id.startsWith('temp-') && m.role === newMsg.role
                  ? {
                      id: newMsg.id,
                      role: newMsg.role,
                      content: newMsg.content,
                      pageNumber: newMsg.page_number,
                      chapterTitle: newMsg.chapter_title,
                      createdAt: newMsg.created_at,
                      contentReference: newMsg.content_reference,
                    }
                  : m
              );
            }
            return [...prev, {
              id: newMsg.id,
              role: newMsg.role,
              content: newMsg.content,
              pageNumber: newMsg.page_number,
              chapterTitle: newMsg.chapter_title,
              createdAt: newMsg.created_at,
              contentReference: newMsg.content_reference,
            }];
          });
        }
      )
      .subscribe();

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [thread?.id]);

  // Carregar threads ao montar
  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  return {
    messages,
    thread,
    isLoading,
    isSending,
    sendMessage,
    loadHistory,
    newThread,
    threads,
    loadThreads,
  };
}

export default useBookChat;
