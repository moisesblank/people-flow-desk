// ============================================
// MODAL: COMPOSER DE EMAIL PARA ALUNO
// Envia email via Resend com layout padrão
// ============================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Send, X, Loader2, User, AtSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface StudentEmailComposerProps {
  isOpen: boolean;
  onClose: () => void;
  studentEmail: string;
  studentName: string;
}

export function StudentEmailComposer({
  isOpen,
  onClose,
  studentEmail,
  studentName,
}: StudentEmailComposerProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!subject.trim()) {
      toast.error("Preencha o assunto");
      return;
    }
    if (!body.trim()) {
      toast.error("Preencha a mensagem");
      return;
    }

    setIsSending(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-student-email", {
        body: {
          to: studentEmail,
          studentName,
          subject: subject.trim(),
          body: body.trim(),
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("Email enviado com sucesso!", {
          description: `Para: ${studentEmail}`,
        });
        setSubject("");
        setBody("");
        onClose();
      } else {
        throw new Error(data?.error || "Erro desconhecido");
      }
    } catch (error: any) {
      console.error("Erro ao enviar email:", error);
      toast.error("Erro ao enviar email", {
        description: error.message || "Tente novamente",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    if (!isSending) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] bg-background/95 backdrop-blur-xl border-blue-500/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5 text-blue-400" />
            Enviar Email para Aluno
          </DialogTitle>
          <DialogDescription>
            O email será enviado com o layout padrão da plataforma.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Destinatário */}
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
            <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <User className="h-5 w-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">{studentName}</p>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <AtSign className="h-3 w-3" />
                {studentEmail}
              </div>
            </div>
          </div>

          {/* Assunto */}
          <div className="space-y-2">
            <Label htmlFor="subject">Assunto</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: Informações sobre seu curso"
              className="bg-muted/30 border-border/50 focus:border-blue-500"
              disabled={isSending}
            />
          </div>

          {/* Mensagem */}
          <div className="space-y-2">
            <Label htmlFor="body">Mensagem</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Digite sua mensagem aqui..."
              className="min-h-[200px] bg-muted/30 border-border/50 focus:border-blue-500 resize-none"
              disabled={isSending}
            />
          </div>

          {/* Aviso sobre layout */}
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-muted-foreground">
            <p>
              ✨ O email será enviado com o layout visual padrão da plataforma,
              incluindo cabeçalho e rodapé profissional.
            </p>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/50 mt-4">
          <Button variant="outline" onClick={handleClose} disabled={isSending}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSend} disabled={isSending} className="bg-blue-600 hover:bg-blue-700">
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar Email
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
