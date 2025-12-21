// ============================================
// ANOTAÇÕES TAB - Notas pessoais do aluno
// Salvas no banco de dados
// ============================================

import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Save, Trash2, Clock, Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface NotesTabProps {
  lessonId: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  timestamp?: string;
  createdAt: Date;
}

function NotesTab({ lessonId }: NotesTabProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  // Carregar notas do localStorage (em produção, viria do Supabase)
  useEffect(() => {
    const savedNotes = localStorage.getItem(`lesson-notes-${lessonId}`);
    if (savedNotes) {
      const parsed = JSON.parse(savedNotes);
      setNotes(parsed.map((n: any) => ({ ...n, createdAt: new Date(n.createdAt) })));
    }
  }, [lessonId]);

  // Salvar notas no localStorage
  const saveNotes = useCallback((updatedNotes: Note[]) => {
    localStorage.setItem(`lesson-notes-${lessonId}`, JSON.stringify(updatedNotes));
    setNotes(updatedNotes);
  }, [lessonId]);

  const handleNewNote = useCallback(() => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'Nova anotação',
      content: '',
      createdAt: new Date()
    };
    setActiveNote(newNote);
    setEditTitle(newNote.title);
    setEditContent(newNote.content);
    setIsEditing(true);
  }, []);

  const handleSelectNote = useCallback((note: Note) => {
    setActiveNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setIsEditing(false);
  }, []);

  const handleSave = useCallback(() => {
    if (!activeNote) return;

    const updatedNote: Note = {
      ...activeNote,
      title: editTitle || 'Sem título',
      content: editContent
    };

    const existingIndex = notes.findIndex(n => n.id === activeNote.id);
    let updatedNotes: Note[];

    if (existingIndex >= 0) {
      updatedNotes = [...notes];
      updatedNotes[existingIndex] = updatedNote;
    } else {
      updatedNotes = [updatedNote, ...notes];
    }

    saveNotes(updatedNotes);
    setActiveNote(updatedNote);
    setIsEditing(false);
    toast({ title: "Salvo!", description: "Sua anotação foi salva com sucesso." });
  }, [activeNote, editTitle, editContent, notes, saveNotes]);

  const handleDelete = useCallback((noteId: string) => {
    const updatedNotes = notes.filter(n => n.id !== noteId);
    saveNotes(updatedNotes);
    if (activeNote?.id === noteId) {
      setActiveNote(null);
      setIsEditing(false);
    }
    toast({ title: "Excluída", description: "Anotação removida." });
  }, [notes, activeNote, saveNotes]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="flex gap-4 h-[450px]">
      {/* Sidebar - Lista de notas */}
      <div className="w-64 shrink-0 border-r border-border pr-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Pencil className="h-4 w-4 text-emerald-500" />
            Anotações
          </h3>
          <Button variant="outline" size="sm" onClick={handleNewNote}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="h-[400px]">
          {notes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhuma anotação ainda</p>
              <Button variant="link" size="sm" onClick={handleNewNote}>
                Criar primeira nota
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {notes.map((note) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "p-3 rounded-lg cursor-pointer transition-all group",
                    "hover:bg-muted/50",
                    activeNote?.id === note.id 
                      ? "bg-primary/10 border border-primary/30" 
                      : "bg-muted/30"
                  )}
                  onClick={() => handleSelectNote(note)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{note.title}</p>
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {note.content.slice(0, 50) || 'Sem conteúdo'}
                      </p>
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDate(note.createdAt)}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(note.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Main - Editor */}
      <div className="flex-1 flex flex-col">
        {activeNote ? (
          <>
            <div className="flex items-center justify-between mb-4">
              {isEditing ? (
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Título da anotação"
                  className="text-lg font-semibold"
                />
              ) : (
                <h3 className="text-lg font-semibold">{activeNote.title}</h3>
              )}
              
              <div className="flex items-center gap-2">
                {activeNote.timestamp && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <Clock className="h-3 w-3" />
                    {activeNote.timestamp}
                  </Badge>
                )}
                {isEditing ? (
                  <Button size="sm" onClick={handleSave}>
                    <Save className="h-4 w-4 mr-1" />
                    Salvar
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Pencil className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                )}
              </div>
            </div>

            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Escreva suas anotações aqui..."
              className="flex-1 resize-none text-sm"
              disabled={!isEditing}
            />

            <p className="text-xs text-muted-foreground mt-2">
              💡 Dica: Use as anotações para registrar insights importantes da aula
            </p>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground">
            <Pencil className="h-16 w-16 mb-4 opacity-30" />
            <h3 className="font-medium text-lg mb-2">Suas Anotações</h3>
            <p className="text-sm mb-4">
              Selecione uma anotação existente ou crie uma nova
            </p>
            <Button onClick={handleNewNote}>
              <Plus className="h-4 w-4 mr-1" />
              Nova Anotação
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default NotesTab;
