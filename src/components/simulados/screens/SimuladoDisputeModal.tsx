/**
 * 🎯 SIMULADOS — Modal de Contestação
 * Constituição SYNAPSE Ω v10.0
 * 
 * Permite ao aluno abrir contestação de forma estruturada.
 */

import React, { useState } from "react";
import { 
  FileQuestion, Send, AlertTriangle, 
  CheckCircle2, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRankingDispute } from "@/hooks/simulados/useSimuladoAudit";

interface SimuladoDisputeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  simuladoId: string;
  attemptId?: string;
  simuladoTitle: string;
}

type DisputeType = "score_error" | "invalidation_appeal" | "technical_issue";

export function SimuladoDisputeModal({
  open,
  onOpenChange,
  simuladoId,
  attemptId,
  simuladoTitle,
}: SimuladoDisputeModalProps) {
  const [disputeType, setDisputeType] = useState<DisputeType>("invalidation_appeal");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { openDispute } = useRankingDispute();

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error("Descreva o motivo da contestação");
      return;
    }

    setIsSubmitting(true);

    try {
      const disputeId = await openDispute(
        simuladoId,
        attemptId,
        disputeType,
        description,
        {
          simuladoTitle,
          submittedAt: new Date().toISOString(),
        } as Record<string, string | number | boolean | null>
      );

      if (disputeId) {
        setIsSuccess(true);
        toast.success("Contestação enviada!", {
          description: "Você receberá uma resposta em até 48 horas.",
        });
        
        // Fechar após 2 segundos
        setTimeout(() => {
          onOpenChange(false);
          setIsSuccess(false);
          setDescription("");
        }, 2000);
      } else {
        throw new Error("Falha ao criar contestação");
      }
    } catch (err) {
      toast.error("Erro ao enviar contestação", {
        description: err instanceof Error ? err.message : "Tente novamente",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Contestação Enviada!</h3>
            <p className="text-muted-foreground text-center">
              Nossa equipe analisará seu caso em até 48 horas.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileQuestion className="h-5 w-5 text-primary" />
            Contestar Resultado
          </DialogTitle>
          <DialogDescription>
            Simulado: <strong>{simuladoTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Tipo de contestação */}
          <div className="space-y-3">
            <Label>Tipo de contestação</Label>
            <RadioGroup
              value={disputeType}
              onValueChange={(v) => setDisputeType(v as DisputeType)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="invalidation_appeal" id="invalidation" />
                <Label htmlFor="invalidation" className="font-normal cursor-pointer">
                  Apelação de invalidação
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="score_error" id="score" />
                <Label htmlFor="score" className="font-normal cursor-pointer">
                  Erro na pontuação
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="technical_issue" id="technical" />
                <Label htmlFor="technical" className="font-normal cursor-pointer">
                  Problema técnico
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descreva o ocorrido</Label>
            <Textarea
              id="description"
              placeholder="Explique detalhadamente o que aconteceu..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              maxLength={1000}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/1000 caracteres
            </p>
          </div>

          {/* Aviso */}
          <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-lg text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-muted-foreground">
              Contestações falsas ou abusivas podem resultar em penalidades.
              Seja honesto e forneça detalhes precisos.
            </p>
          </div>
        </div>

        {/* Ações */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !description.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar Contestação
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
