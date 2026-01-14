// ============================================
// 📄 MODO PROVA - PDF IMPRIMÍVEL + CARTÃO DIGITAL
// Year 2300 Cinematic Design
// XP: 0 | Source: 'modo_prova'
// ============================================

import { useState, useCallback, useMemo, useRef } from "react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { 
  FileText, CheckCircle2, XCircle, Trophy, Clock, 
  Target, Loader2, Send, RotateCcw, ChevronDown,
  Zap, Brain, ArrowUp, Printer, ClipboardList
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import QuestionEnunciado from "@/components/shared/QuestionEnunciado";
import QuestionResolution from "@/components/shared/QuestionResolution";
import { formatBancaHeader } from "@/lib/bancaNormalizer";
import jsPDF from "jspdf";

// ============================================
// TIPOS
// ============================================

interface QuestionOption {
  id: string;
  text: string;
  image_url?: string;
}

interface Question {
  id: string;
  question_text: string;
  question_type?: 'multiple_choice' | 'discursive' | 'outros';
  options: QuestionOption[];
  correct_answer: string;
  explanation?: string | null;
  difficulty: "facil" | "medio" | "dificil";
  banca?: string | null;
  ano?: number | null;
  points: number;
  macro?: string | null;
  micro?: string | null;
}

interface ModoProvaModalProps {
  open: boolean;
  onClose: () => void;
  questions: Question[];
  title?: string;
}

// ============================================
// CONSTANTS
// ============================================

const DIFFICULTY_COLORS = {
  facil: "bg-green-500/20 text-green-400 border-green-500/30",
  medio: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  dificil: "bg-red-500/20 text-red-400 border-red-500/30",
};

const DIFFICULTY_LABELS = {
  facil: "Fácil",
  medio: "Médio",
  dificil: "Difícil",
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function ModoProvaModal({ open, onClose, questions, title }: ModoProvaModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // State - 3 fases: 'pdf' -> 'responder' -> 'resultado'
  const [phase, setPhase] = useState<'pdf' | 'responder' | 'resultado'>('pdf');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showResolutions, setShowResolutions] = useState<Set<string>>(new Set());

  // Computed
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / questions.length) * 100;
  const correctCount = Object.values(results).filter(Boolean).length;
  const percentage = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

  // ============================================
  // GERAR PDF PARA IMPRESSÃO
  // ============================================
  const generateAndPrintPDF = useCallback(async () => {
    if (questions.length === 0) return;
    
    setIsGeneratingPdf(true);
    
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);
      let yPos = margin;
      
      // Header
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('MODO PROVA - PRO MOISÉS MEDEIROS', pageWidth / 2, yPos, { align: 'center' });
      yPos += 8;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${questions.length} questões • ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;
      
      // Linha separadora
      pdf.setDrawColor(100);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;
      
      // Questões
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        
        // Check page break
        if (yPos > pageHeight - 60) {
          pdf.addPage();
          yPos = margin;
        }
        
        // Número da questão
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        const headerText = q.banca && q.ano 
          ? `QUESTÃO ${i + 1} — ${q.banca} ${q.ano}`
          : `QUESTÃO ${i + 1}`;
        pdf.text(headerText, margin, yPos);
        yPos += 6;
        
        // Enunciado (simplificado - texto puro)
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        
        // Limpar HTML e quebrar linhas
        const cleanText = q.question_text
          .replace(/<[^>]*>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .trim();
        
        const lines = pdf.splitTextToSize(cleanText, contentWidth);
        
        for (const line of lines) {
          if (yPos > pageHeight - 30) {
            pdf.addPage();
            yPos = margin;
          }
          pdf.text(line, margin, yPos);
          yPos += 5;
        }
        yPos += 3;
        
        // Alternativas
        const letters = ['A', 'B', 'C', 'D', 'E'];
        for (let j = 0; j < q.options.length && j < 5; j++) {
          if (yPos > pageHeight - 20) {
            pdf.addPage();
            yPos = margin;
          }
          
          const optText = q.options[j].text
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .trim();
          
          const optLines = pdf.splitTextToSize(`(${letters[j]}) ${optText}`, contentWidth - 5);
          for (const line of optLines) {
            pdf.text(line, margin + 3, yPos);
            yPos += 5;
          }
        }
        
        yPos += 8;
      }
      
      // Página do Cartão de Respostas
      pdf.addPage();
      yPos = margin;
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('CARTÃO DE RESPOSTAS', pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Marque suas respostas abaixo:', margin, yPos);
      yPos += 10;
      
      // Grid de respostas
      const cellWidth = 30;
      const cellHeight = 12;
      const cols = 5;
      
      for (let i = 0; i < questions.length; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = margin + (col * (cellWidth + 5));
        const y = yPos + (row * (cellHeight + 8));
        
        if (y > pageHeight - 30) {
          pdf.addPage();
          yPos = margin;
        }
        
        // Número
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${i + 1}.`, x, y);
        
        // Opções A-E
        pdf.setFont('helvetica', 'normal');
        const opts = ['A', 'B', 'C', 'D', 'E'];
        for (let j = 0; j < opts.length; j++) {
          pdf.rect(x + 8 + (j * 8), y - 4, 6, 6);
          pdf.setFontSize(7);
          pdf.text(opts[j], x + 9.5 + (j * 8), y);
        }
        pdf.setFontSize(10);
      }
      
      // Abrir para impressão
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(pdfUrl, '_blank');
      
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
      
      toast.success('PDF gerado! Imprima e depois registre suas respostas.');
      
      // Avançar para fase de responder
      setPhase('responder');
      
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      toast.error('Erro ao gerar PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [questions]);

  // Handlers
  const handleSelectAnswer = useCallback((questionId: string, optionId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  }, []);

  const handleSubmitProva = useCallback(async () => {
    if (!user?.id || answeredCount === 0) return;
    
    setIsSubmitting(true);
    
    try {
      // Calcular resultados
      const newResults: Record<string, boolean> = {};
      const attempts = [];
      
      for (const q of questions) {
        const selectedAnswer = answers[q.id];
        if (selectedAnswer) {
          const isCorrect = selectedAnswer === q.correct_answer;
          newResults[q.id] = isCorrect;
          
          attempts.push({
            user_id: user.id,
            question_id: q.id,
            selected_answer: selectedAnswer,
            is_correct: isCorrect,
            xp_earned: 0, // Modo Prova = 0 XP
            source: 'modo_prova',
          });
        }
      }
      
      // Salvar no banco
      if (attempts.length > 0) {
        const { error } = await supabase
          .from('question_attempts')
          .insert(attempts);
        
        if (error) throw error;
      }
      
      setResults(newResults);
      setPhase('resultado');
      
      // Invalidar queries para atualizar métricas
      queryClient.invalidateQueries({ queryKey: ['student-question-attempts'] });
      queryClient.invalidateQueries({ queryKey: ['student-taxonomy-performance'] });
      queryClient.invalidateQueries({ queryKey: ['student-performance-stats'] });
      
      toast.success(`Prova finalizada! ${Object.values(newResults).filter(Boolean).length}/${attempts.length} acertos`);
      
    } catch (err) {
      console.error('Erro ao salvar prova:', err);
      toast.error('Erro ao salvar resultados');
    } finally {
      setIsSubmitting(false);
    }
  }, [user?.id, questions, answers, answeredCount, queryClient]);

  const handleReset = useCallback(() => {
    setPhase('pdf');
    setAnswers({});
    setResults({});
    setShowResolutions(new Set());
  }, []);

  const toggleResolution = useCallback((questionId: string) => {
    setShowResolutions(prev => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  }, []);

  const handleClose = useCallback(() => {
    handleReset();
    onClose();
  }, [handleReset, onClose]);

  const scrollToTop = useCallback(() => {
    const scrollArea = document.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollArea) {
      scrollArea.scrollTop = 0;
    }
  }, []);

  // Pular para fase responder (caso já tenha impresso)
  const handleSkipToPrint = useCallback(() => {
    setPhase('responder');
  }, []);

  if (questions.length === 0) return null;

  // ============================================
  // FASE 1: PDF - Gerar e Imprimir
  // ============================================
  if (phase === 'pdf') {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg p-0 gap-0 bg-gradient-to-b from-background via-background to-slate-900/50 border-cyan-500/30">
          <DialogHeader className="relative p-6 pb-4 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-950/30 via-background to-blue-950/30">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-500 rounded-xl blur-md opacity-40 animate-pulse" />
                <div className="relative p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
                  <FileText className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <DialogTitle className="text-xl font-black bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  📄 MODO PROVA
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {questions.length} questões selecionadas
                </p>
              </div>
            </div>
          </DialogHeader>
          
          <div className="p-6 space-y-6">
            {/* Instruções */}
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                <Printer className="h-5 w-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="font-semibold text-cyan-400">Passo 1: Imprimir</p>
                  <p className="text-sm text-muted-foreground">
                    Clique no botão abaixo para gerar o PDF da prova e imprimir.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <ClipboardList className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="font-semibold text-blue-400">Passo 2: Responder no papel</p>
                  <p className="text-sm text-muted-foreground">
                    Resolva a prova impressa marcando as alternativas no cartão de respostas.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="font-semibold text-green-400">Passo 3: Registrar aqui</p>
                  <p className="text-sm text-muted-foreground">
                    Após resolver, volte aqui e registre suas respostas para ver o resultado.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Ações */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={generateAndPrintPDF}
                disabled={isGeneratingPdf}
                size="lg"
                className="w-full gap-3 h-14 text-lg bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 hover:from-cyan-400 hover:via-blue-400 hover:to-cyan-400 text-white font-bold shadow-lg shadow-cyan-500/25"
              >
                {isGeneratingPdf ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Printer className="h-5 w-5" />
                )}
                GERAR PDF E IMPRIMIR
              </Button>
              
              <Button
                variant="ghost"
                onClick={handleSkipToPrint}
                className="text-muted-foreground hover:text-foreground"
              >
                Já imprimi, ir para o cartão de respostas →
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ============================================
  // FASE 2: RESPONDER - Cartão de Respostas Digital
  // ============================================
  if (phase === 'responder') {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col p-0 gap-0 bg-gradient-to-b from-background via-background to-slate-900/50 border-cyan-500/30">
          
          <DialogHeader className="relative p-4 pb-3 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-950/30 via-background to-blue-950/30">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
            
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500 rounded-xl blur-md opacity-40 animate-pulse" />
                  <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
                    <ClipboardList className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div>
                  <DialogTitle className="text-lg font-black bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
                    📝 CARTÃO DE RESPOSTAS
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground">
                    Registre as alternativas que você marcou na prova impressa
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <Target className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-bold text-blue-400">
                  {answeredCount}/{questions.length}
                </span>
              </div>
            </div>
            
            <div className="mt-3">
              <Progress value={progress} className="h-2 bg-slate-800" />
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 px-4 py-4">
            <div className="space-y-4 pb-24">
              {/* Info box */}
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <p className="text-sm text-amber-400">
                  <strong>💡 Dica:</strong> Marque abaixo exatamente o que você respondeu no papel. 
                  Ao clicar em "VERIFICAR RESPOSTAS", o sistema mostrará seu resultado e as resoluções.
                </p>
              </div>
              
              {/* Grid de questões simplificado */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {questions.map((q, index) => {
                  const selectedAnswer = answers[q.id];
                  const letters = ['A', 'B', 'C', 'D', 'E'];
                  
                  return (
                    <Card 
                      key={q.id} 
                      className={cn(
                        "p-4 transition-all",
                        selectedAnswer 
                          ? "border-cyan-500/50 bg-cyan-500/5" 
                          : "border-slate-700/50 bg-slate-900/30"
                      )}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold",
                          selectedAnswer 
                            ? "bg-cyan-500 text-white" 
                            : "bg-slate-700 text-slate-400"
                        )}>
                          {index + 1}
                        </div>
                        <span className="text-xs text-muted-foreground truncate flex-1">
                          {q.macro || 'Questão'}
                        </span>
                      </div>
                      
                      {/* Botões A-E */}
                      <div className="flex gap-1.5">
                        {q.options.slice(0, 5).map((opt, optIndex) => {
                          const letter = letters[optIndex];
                          const isSelected = selectedAnswer === opt.id;
                          
                          return (
                            <button
                              key={opt.id}
                              onClick={() => handleSelectAnswer(q.id, opt.id)}
                              className={cn(
                                "flex-1 h-10 rounded-lg font-bold text-sm transition-all",
                                isSelected
                                  ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30"
                                  : "bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 hover:text-slate-300 border border-slate-600/50"
                              )}
                            >
                              {letter}
                            </button>
                          );
                        })}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
          
          {/* Footer fixo */}
          <div className="sticky bottom-0 p-4 border-t border-cyan-500/20 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                {answeredCount} de {questions.length} respondidas
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPhase('pdf')}
                  className="gap-2 border-slate-600"
                >
                  <Printer className="h-4 w-4" />
                  Reimprimir
                </Button>
                
                <Button
                  onClick={handleSubmitProva}
                  disabled={answeredCount === 0 || isSubmitting}
                  className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold shadow-lg shadow-green-500/25"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  VERIFICAR RESPOSTAS
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ============================================
  // FASE 3: RESULTADO - Com resoluções
  // ============================================
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col p-0 gap-0 bg-gradient-to-b from-background via-background to-slate-900/50 border-cyan-500/30">
        
        <DialogHeader className="relative p-4 pb-3 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-950/30 via-background to-blue-950/30">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
          
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500 rounded-xl blur-md opacity-40 animate-pulse" />
                <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600">
                  <Trophy className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <DialogTitle className="text-lg font-black bg-gradient-to-r from-green-400 via-emerald-400 to-green-400 bg-clip-text text-transparent">
                  🏆 RESULTADO DA PROVA
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  {title || `${questions.length} questões • Sem XP`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30">
                <Target className="h-4 w-4 text-green-400" />
                <span className="text-sm font-bold text-green-400">
                  {correctCount}/{questions.length} ({percentage}%)
                </span>
              </div>
              
              <Badge 
                className={cn(
                  "text-sm font-bold px-3 py-1",
                  percentage >= 70 
                    ? "bg-green-500/20 text-green-400 border-green-500/30" 
                    : percentage >= 50 
                      ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                      : "bg-red-500/20 text-red-400 border-red-500/30"
                )}
              >
                {percentage >= 70 ? '🎯 Excelente!' : percentage >= 50 ? '📈 Bom!' : '📚 Continue estudando!'}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-4 py-4">
          <div className="space-y-6 pb-32">
            
            {questions.map((question, index) => {
              const selectedAnswer = answers[question.id];
              const isCorrect = results[question.id];
              const showResult = !!selectedAnswer;
              const isResolutionOpen = showResolutions.has(question.id);
              
              return (
                <div 
                  key={question.id}
                  className={cn(
                    "relative rounded-xl border transition-all duration-300",
                    showResult 
                      ? isCorrect 
                        ? "border-green-500/40 bg-gradient-to-br from-green-950/20 to-background" 
                        : "border-red-500/40 bg-gradient-to-br from-red-950/20 to-background"
                      : "border-slate-700/50 bg-slate-900/30"
                  )}
                >
                  {/* Question Number Badge */}
                  <div className="absolute -top-3 left-4">
                    <div className={cn(
                      "px-3 py-1 rounded-full text-sm font-black shadow-lg",
                      showResult
                        ? isCorrect
                          ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                          : "bg-gradient-to-r from-red-500 to-rose-500 text-white"
                        : "bg-gradient-to-r from-slate-600 to-slate-500 text-white"
                    )}>
                      {showResult && (
                        isCorrect 
                          ? <CheckCircle2 className="inline h-3.5 w-3.5 mr-1" />
                          : <XCircle className="inline h-3.5 w-3.5 mr-1" />
                      )}
                      Questão {index + 1}
                    </div>
                  </div>
                  
                  <div className="p-5 pt-6 space-y-4">
                    {/* Header da questão */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={DIFFICULTY_COLORS[question.difficulty]}>
                        {DIFFICULTY_LABELS[question.difficulty]}
                      </Badge>
                      {question.banca && (
                        <Badge variant="outline" className="bg-slate-800/50 border-slate-600/50">
                          {formatBancaHeader(question.banca, question.ano, '')}
                        </Badge>
                      )}
                      {question.macro && (
                        <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
                          {question.macro}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Enunciado */}
                    <div className="prose prose-invert prose-sm max-w-none">
                      <QuestionEnunciado 
                        questionText={question.question_text} 
                        banca={question.banca}
                        ano={question.ano}
                      />
                    </div>
                    
                    {/* Alternativas com resultado */}
                    <div className="space-y-2">
                      {question.options.map((option, optIndex) => {
                        const letter = String.fromCharCode(65 + optIndex);
                        const isSelected = selectedAnswer === option.id;
                        const isCorrectOption = option.id === question.correct_answer;
                        
                        return (
                          <div
                            key={option.id}
                            className={cn(
                              "flex items-start gap-3 p-3 rounded-lg border",
                              isCorrectOption
                                ? "border-green-500/50 bg-green-500/10"
                                : isSelected && !isCorrectOption
                                  ? "border-red-500/50 bg-red-500/10"
                                  : "border-slate-700/50 bg-slate-800/30"
                            )}
                          >
                            <div className="flex items-start gap-2 flex-1">
                              <span className={cn(
                                "font-bold text-sm min-w-[20px]",
                                isCorrectOption && "text-green-400",
                                isSelected && !isCorrectOption && "text-red-400"
                              )}>
                                {letter})
                              </span>
                              <span className="text-sm leading-relaxed">
                                {option.text}
                              </span>
                              {isCorrectOption && (
                                <CheckCircle2 className="h-4 w-4 text-green-400 ml-auto flex-shrink-0" />
                              )}
                              {isSelected && !isCorrectOption && (
                                <XCircle className="h-4 w-4 text-red-400 ml-auto flex-shrink-0" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Botão Ver Resolução */}
                    {question.explanation && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleResolution(question.id)}
                        className="w-full mt-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                      >
                        <ChevronDown className={cn(
                          "h-4 w-4 mr-2 transition-transform",
                          isResolutionOpen && "rotate-180"
                        )} />
                        {isResolutionOpen ? 'Ocultar Resolução' : 'Ver Resolução Comentada'}
                      </Button>
                    )}
                    
                    {/* Resolução Expandida */}
                    {isResolutionOpen && question.explanation && (
                      <div className="mt-4 p-4 rounded-lg bg-slate-800/50 border border-cyan-500/20">
                        <QuestionResolution resolutionText={question.explanation} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Cartão de resumo */}
            <Card className="p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-cyan-500/30 shadow-2xl shadow-cyan-500/10">
              <div className="flex flex-col gap-4">
                {/* Grid de respostas */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {questions.map((q, i) => {
                    const correct = results[q.id];
                    const answered = !!answers[q.id];
                    
                    return (
                      <div
                        key={q.id}
                        className={cn(
                          "w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold transition-all",
                          answered
                            ? correct
                              ? "bg-green-500 text-white"
                              : "bg-red-500 text-white"
                            : "bg-slate-700 text-slate-400"
                        )}
                      >
                        {i + 1}
                      </div>
                    );
                  })}
                </div>
                
                {/* Ações */}
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-bold">
                    ✅ {correctCount} acertos • ❌ {Object.keys(results).length - correctCount} erros
                  </span>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={scrollToTop}
                      className="gap-2 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                    >
                      <ArrowUp className="h-4 w-4" />
                      Voltar ao Topo
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleReset}
                      className="gap-2 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Nova Prova
                    </Button>
                    <Button
                      onClick={handleClose}
                      className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Concluir
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
