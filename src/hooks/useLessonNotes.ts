// ============================================
// HOOK: useLessonNotes - Gerenciamento de Anotações
// Salva anotações no localStorage (migrar para Supabase)
// Lei I: Cache otimizado | Lei II: Dados do usuário
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

export interface LessonNote {
  id: string;
  lessonId: string;
  userId?: string;
  title: string;
  content: string;
  timestamp?: string; // Para vincular ao momento do vídeo
  createdAt: Date;
  updatedAt: Date;
}

interface UseLessonNotesReturn {
  notes: LessonNote[];
  isLoading: boolean;
  createNote: (title: string, content: string, timestamp?: string) => LessonNote;
  updateNote: (noteId: string, updates: Partial<LessonNote>) => void;
  deleteNote: (noteId: string) => void;
  getNoteById: (noteId: string) => LessonNote | undefined;
}

export function useLessonNotes(lessonId: string): UseLessonNotesReturn {
  const { user } = useAuth();
  const [notes, setNotes] = useState<LessonNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const storageKey = `lesson-notes-${lessonId}-${user?.id || 'anonymous'}`;

  // Carregar notas do storage
  useEffect(() => {
    setIsLoading(true);
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setNotes(parsed.map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt),
          updatedAt: new Date(n.updatedAt)
        })));
      }
    } catch (error) {
      console.error('Erro ao carregar notas:', error);
    } finally {
      setIsLoading(false);
    }
  }, [storageKey]);

  // Salvar notas no storage
  const persistNotes = useCallback((updatedNotes: LessonNote[]) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedNotes));
      setNotes(updatedNotes);
    } catch (error) {
      console.error('Erro ao salvar notas:', error);
    }
  }, [storageKey]);

  const createNote = useCallback((title: string, content: string, timestamp?: string): LessonNote => {
    const now = new Date();
    const newNote: LessonNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      lessonId,
      userId: user?.id,
      title: title || 'Nova anotação',
      content,
      timestamp,
      createdAt: now,
      updatedAt: now
    };

    persistNotes([newNote, ...notes]);
    return newNote;
  }, [lessonId, user?.id, notes, persistNotes]);

  const updateNote = useCallback((noteId: string, updates: Partial<LessonNote>) => {
    const updatedNotes = notes.map(note => 
      note.id === noteId 
        ? { ...note, ...updates, updatedAt: new Date() }
        : note
    );
    persistNotes(updatedNotes);
  }, [notes, persistNotes]);

  const deleteNote = useCallback((noteId: string) => {
    const updatedNotes = notes.filter(note => note.id !== noteId);
    persistNotes(updatedNotes);
  }, [notes, persistNotes]);

  const getNoteById = useCallback((noteId: string) => {
    return notes.find(note => note.id === noteId);
  }, [notes]);

  return {
    notes,
    isLoading,
    createNote,
    updateNote,
    deleteNote,
    getNoteById
  };
}

export default useLessonNotes;
