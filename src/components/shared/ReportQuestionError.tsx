// ============================================
// COMPONENTE: ReportQuestionError
// Botão "Reportar erro" + Modal para alunos
// Visível em /alunos/questoes e /alunos/simulados
// ============================================

import { memo, useState } from "react";
import { AlertTriangle, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReportQuestionErrorProps {
  questionId: string;
  sourcePage: "questoes" | "simulados";
  simuladoId?: string;
  className?: string;
}

export const ReportQuestionError = memo(({
  questionId,
  sourcePage,
  simuladoId,
  className = "",
}: ReportQuestionErrorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!errorMessage.trim()) {
      toast.error("Por favor, descreva o erro encontrado.");
      return;
    }

    if (errorMessage.trim().length < 10) {
      toast.error("Descreva o erro com mais detalhes (mínimo 10 caracteres).");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Você precisa estar logado para reportar um erro.");
        return;
      }

      const { error } = await supabase
        .from("question_error_reports")
        .insert({
          question_id: questionId,
          user_id: user.id,
          user_name: user.user_metadata?.name || user.email?.split("@")[0] || "Aluno",
          user_email: user.email,
          error_message: errorMessage.trim(),
          source_page: sourcePage,
          simulado_id: simuladoId || null,
        });

      if (error) throw error;

      toast.success("Erro reportado com sucesso! Nossa equipe irá analisar.");
      setErrorMessage("");
      setIsOpen(false);
    } catch (error) {
      console.error("Erro ao reportar:", error);
      toast.error("Não foi possível enviar o reporte. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`
          text-xs text-red-500/70 hover:text-red-500 
          transition-colors cursor-pointer
          flex items-center gap-1
          mt-6 ml-1
          ${className}
        `}
      >
        <AlertTriangle className="h-3 w-3" />
        Reportar erro
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-background via-background to-red-500/5 border-red-500/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 rounded-full bg-red-500/20">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              Reportar Erro na Questão
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Encontrou um erro nesta questão? Descreva abaixo para que possamos corrigir.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="error-description" className="text-sm font-medium">
                Descreva o erro encontrado
              </Label>
              <Textarea
                id="error-description"
                placeholder="Ex: A alternativa B está marcada como correta, mas a resposta deveria ser a alternativa C porque..."
                value={errorMessage}
                onChange={(e) => setErrorMessage(e.target.value)}
                className="min-h-[120px] resize-none border-muted-foreground/30 focus:border-red-500/50"
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground text-right">
                {errorMessage.length}/1000 caracteres
              </p>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs text-amber-600 dark:text-amber-400">
                ⚠️ Reportes falsos ou abusivos podem resultar em suspensão da conta.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => setIsOpen(false)}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !errorMessage.trim()}
                className="flex-1 gap-2 bg-red-600 hover:bg-red-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Enviar Reporte
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});

ReportQuestionError.displayName = "ReportQuestionError";
