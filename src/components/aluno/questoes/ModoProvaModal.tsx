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
  // CABEÇALHO PADRÃO DO PDF (Leve, Cinza/Preto)
  // ============================================
  const addPdfHeader = useCallback((pdf: jsPDF, pageNum: number, totalPages: number) => {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 15;
    
    // Barra de cabeçalho cinza claro
    pdf.setFillColor(245, 245, 245);
    pdf.rect(0, 0, pageWidth, 18, 'F');
    
    // Borda inferior do cabeçalho
    pdf.setDrawColor(180, 180, 180);
    pdf.line(0, 18, pageWidth, 18);
    
    // Logo placeholder (texto estilizado para manter leve)
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(128, 0, 32); // Bordô/Marrom da logo
    pdf.text('MOISÉS MEDEIROS', margin, 11);
    
    // Slogan
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    pdf.text('Muito além da sala de aula!', pageWidth / 2, 11, { align: 'center' });
    
    // Data e paginação
    pdf.setFontSize(7);
    pdf.setTextColor(120, 120, 120);
    pdf.text(`${new Date().toLocaleDateString('pt-BR')} • Pág ${pageNum}/${totalPages}`, pageWidth - margin, 11, { align: 'right' });
    
    // Reset cor do texto
    pdf.setTextColor(0, 0, 0);
  }, []);

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
      const headerHeight = 22;
      const contentWidth = pageWidth - (margin * 2);
      
      // === PRIMEIRA PASSAGEM: Contar páginas ===
      let tempYPos = headerHeight + 5;
      let estimatedPages = 1;
      
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const cleanText = q.question_text
          .replace(/<[^>]*>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .trim();
        
        pdf.setFontSize(10);
        const lines = pdf.splitTextToSize(cleanText, contentWidth);
        const questionHeight = 6 + (lines.length * 5) + 3 + (q.options.length * 10) + 8;
        
        if (tempYPos + questionHeight > pageHeight - 20) {
          estimatedPages++;
          tempYPos = headerHeight + 5;
        }
        tempYPos += questionHeight;
      }
      estimatedPages++; // +1 para o cartão de respostas
      
      // === SEGUNDA PASSAGEM: Gerar PDF com cabeçalhos ===
      let currentPage = 1;
      let yPos = headerHeight + 5;
      
      // Cabeçalho da primeira página
      addPdfHeader(pdf, currentPage, estimatedPages);
      
      // Questões
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        
        // Check page break
        if (yPos > pageHeight - 60) {
          pdf.addPage();
          currentPage++;
          addPdfHeader(pdf, currentPage, estimatedPages);
          yPos = headerHeight + 5;
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
            currentPage++;
            addPdfHeader(pdf, currentPage, estimatedPages);
            yPos = headerHeight + 5;
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
            currentPage++;
            addPdfHeader(pdf, currentPage, estimatedPages);
            yPos = headerHeight + 5;
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
      currentPage++;
      addPdfHeader(pdf, currentPage, estimatedPages);
      yPos = headerHeight + 8;
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(60, 60, 60);
      pdf.text('CARTÃO DE RESPOSTAS', pageWidth / 2, yPos, { align: 'center' });
      yPos += 8;
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text(`${questions.length} questões • Marque suas respostas abaixo`, pageWidth / 2, yPos, { align: 'center' });
      pdf.setTextColor(0, 0, 0);
      yPos += 10;
      
      // Grid de respostas - Design limpo
      const cellWidth = 32;
      const cellHeight = 12;
      const cols = 5;
      let baseY = yPos;
      
      pdf.setDrawColor(200, 200, 200);
      
      for (let i = 0; i < questions.length; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = margin + (col * (cellWidth + 3));
        const y = baseY + (row * (cellHeight + 4));
        
        // Verificar se precisa de nova página
        if (y > pageHeight - 25) {
          pdf.addPage();
          currentPage++;
          addPdfHeader(pdf, currentPage, estimatedPages);
          baseY = headerHeight + 8;
          // Recalcular posição
          const newRow = Math.floor(i / cols);
          continue;
        }
        
        // Número da questão
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(80, 80, 80);
        pdf.text(`${i + 1}.`, x, y);
        
        // Caixas de opções A-E (estilo clean)
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        const opts = ['A', 'B', 'C', 'D', 'E'];
        for (let j = 0; j < opts.length; j++) {
          const boxX = x + 8 + (j * 7);
          pdf.setDrawColor(180, 180, 180);
          pdf.rect(boxX, y - 4, 5, 5);
          pdf.setFontSize(6);
          pdf.setTextColor(100, 100, 100);
          pdf.text(opts[j], boxX + 1.2, y - 0.3);
        }
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
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
        <DialogContent className="w-[95vw] max-w-lg p-0 gap-0 bg-gradient-to-b from-background via-background to-slate-900/50 border-cyan-500/30">
          <DialogHeader className="relative p-4 sm:p-6 pb-3 sm:pb-4 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-950/30 via-background to-blue-950/30">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
            
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-cyan-500 rounded-lg sm:rounded-xl blur-md opacity-40 animate-pulse" />
                <div className="relative p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-lg sm:text-xl font-black bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent truncate">
                  📄 MODO PROVA
                </DialogTitle>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                  {questions.length} questões selecionadas
                </p>
              </div>
            </div>
          </DialogHeader>
          
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Instruções */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                <Printer className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-0.5 sm:space-y-1 min-w-0">
                  <p className="font-semibold text-cyan-400 text-sm sm:text-base">Passo 1: Imprimir</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Clique no botão abaixo para gerar o PDF da prova e imprimir.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-0.5 sm:space-y-1 min-w-0">
                  <p className="font-semibold text-blue-400 text-sm sm:text-base">Passo 2: Responder no papel</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Resolva a prova impressa marcando as alternativas no cartão.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-0.5 sm:space-y-1 min-w-0">
                  <p className="font-semibold text-green-400 text-sm sm:text-base">Passo 3: Registrar aqui</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Após resolver, volte aqui e registre suas respostas.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Ações */}
            <div className="flex flex-col gap-2 sm:gap-3">
              <Button
                onClick={generateAndPrintPDF}
                disabled={isGeneratingPdf}
                size="lg"
                className="w-full gap-2 sm:gap-3 h-12 sm:h-14 text-base sm:text-lg bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 hover:from-cyan-400 hover:via-blue-400 hover:to-cyan-400 text-white font-bold shadow-lg shadow-cyan-500/25"
              >
                {isGeneratingPdf ? (
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                ) : (
                  <Printer className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
                <span className="truncate">GERAR PDF E IMPRIMIR</span>
              </Button>
              
              <Button
                variant="ghost"
                onClick={handleSkipToPrint}
                className="text-muted-foreground hover:text-foreground text-xs sm:text-sm"
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
        <DialogContent className="w-[98vw] sm:w-[95vw] max-w-4xl max-h-[95vh] overflow-hidden flex flex-col p-0 gap-0 bg-gradient-to-b from-background via-background to-slate-900/50 border-cyan-500/30">
          
          <DialogHeader className="relative p-3 sm:p-4 pb-2 sm:pb-3 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-950/30 via-background to-blue-950/30">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
            
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-blue-500 rounded-lg sm:rounded-xl blur-md opacity-40 animate-pulse" />
                  <div className="relative p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
                    <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-base sm:text-lg font-black bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent truncate">
                    📝 CARTÃO DE RESPOSTAS
                  </DialogTitle>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                    Registre as alternativas marcadas
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 flex-shrink-0">
                <Target className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400" />
                <span className="text-xs sm:text-sm font-bold text-blue-400">
                  {answeredCount}/{questions.length}
                </span>
              </div>
            </div>
            
            <div className="mt-2 sm:mt-3">
              <Progress value={progress} className="h-1.5 sm:h-2 bg-slate-800" />
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 px-2 sm:px-4 py-3 sm:py-4">
            <div className="space-y-3 sm:space-y-4 pb-20 sm:pb-24">
              {/* Info box */}
              <div className="p-3 sm:p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <p className="text-xs sm:text-sm text-amber-400">
                  <strong>💡 Dica:</strong> Marque abaixo exatamente o que você respondeu no papel.
                </p>
              </div>
              
              {/* Grid de questões simplificado - RESPONSIVO */}
              <div className="grid gap-2 sm:gap-3 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {questions.map((q, index) => {
                  const selectedAnswer = answers[q.id];
                  const letters = ['A', 'B', 'C', 'D', 'E'];
                  
                  return (
                    <Card 
                      key={q.id} 
                      className={cn(
                        "p-3 sm:p-4 transition-all",
                        selectedAnswer 
                          ? "border-cyan-500/50 bg-cyan-500/5" 
                          : "border-slate-700/50 bg-slate-900/30"
                      )}
                    >
                      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                        <div className={cn(
                          "w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0",
                          selectedAnswer 
                            ? "bg-cyan-500 text-white" 
                            : "bg-slate-700 text-slate-400"
                        )}>
                          {index + 1}
                        </div>
                        <span className="text-[10px] sm:text-xs text-muted-foreground truncate flex-1">
                          {q.macro || 'Questão'}
                        </span>
                      </div>
                      
                      {/* Botões A-E - Responsivo */}
                      <div className="flex gap-1 sm:gap-1.5">
                        {q.options.slice(0, 5).map((opt, optIndex) => {
                          const letter = letters[optIndex];
                          const isSelected = selectedAnswer === opt.id;
                          
                          return (
                            <button
                              key={opt.id}
                              onClick={() => handleSelectAnswer(q.id, opt.id)}
                              className={cn(
                                "flex-1 h-8 sm:h-10 rounded-md sm:rounded-lg font-bold text-xs sm:text-sm transition-all",
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
          
          {/* Footer fixo - RESPONSIVO */}
          <div className="sticky bottom-0 p-3 sm:p-4 border-t border-cyan-500/20 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
              <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                {answeredCount} de {questions.length} respondidas
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setPhase('pdf')}
                  size="sm"
                  className="gap-1.5 sm:gap-2 border-slate-600 text-xs sm:text-sm h-9 sm:h-10"
                >
                  <Printer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Reimprimir</span>
                </Button>
                
                <Button
                  onClick={handleSubmitProva}
                  disabled={answeredCount === 0 || isSubmitting}
                  size="sm"
                  className="gap-1.5 sm:gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold shadow-lg shadow-green-500/25 text-xs sm:text-sm h-9 sm:h-10"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  )}
                  <span className="truncate">VERIFICAR</span>
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
      <DialogContent className="w-[98vw] sm:w-[95vw] max-w-5xl max-h-[95vh] overflow-hidden flex flex-col p-0 gap-0 bg-gradient-to-b from-background via-background to-slate-900/50 border-cyan-500/30">
        
        <DialogHeader className="relative p-3 sm:p-4 pb-2 sm:pb-3 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-950/30 via-background to-blue-950/30">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-green-500 rounded-lg sm:rounded-xl blur-md opacity-40 animate-pulse" />
                <div className="relative p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-gradient-to-br from-green-500 to-emerald-600">
                  <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-base sm:text-lg font-black bg-gradient-to-r from-green-400 via-emerald-400 to-green-400 bg-clip-text text-transparent truncate">
                  🏆 RESULTADO DA PROVA
                </DialogTitle>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                  {title || `${questions.length} questões • Sem XP`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-green-500/10 border border-green-500/30">
                <Target className="h-3 w-3 sm:h-4 sm:w-4 text-green-400" />
                <span className="text-xs sm:text-sm font-bold text-green-400">
                  {correctCount}/{questions.length} ({percentage}%)
                </span>
              </div>
              
              <Badge 
                className={cn(
                  "text-[10px] sm:text-sm font-bold px-2 sm:px-3 py-0.5 sm:py-1",
                  percentage >= 70 
                    ? "bg-green-500/20 text-green-400 border-green-500/30" 
                    : percentage >= 50 
                      ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                      : "bg-red-500/20 text-red-400 border-red-500/30"
                )}
              >
                <span className="hidden xs:inline">
                  {percentage >= 70 ? '🎯 Excelente!' : percentage >= 50 ? '📈 Bom!' : '📚 Continue estudando!'}
                </span>
                <span className="xs:hidden">
                  {percentage >= 70 ? '🎯' : percentage >= 50 ? '📈' : '📚'}
                </span>
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-2 sm:px-4 py-3 sm:py-4">
          <div className="space-y-4 sm:space-y-6 pb-24 sm:pb-32">
            
            {questions.map((question, index) => {
              const selectedAnswer = answers[question.id];
              const isCorrect = results[question.id];
              const showResult = !!selectedAnswer;
              const isResolutionOpen = showResolutions.has(question.id);
              
              return (
                <div 
                  key={question.id}
                  className={cn(
                    "relative rounded-lg sm:rounded-xl border transition-all duration-300",
                    showResult 
                      ? isCorrect 
                        ? "border-green-500/40 bg-gradient-to-br from-green-950/20 to-background" 
                        : "border-red-500/40 bg-gradient-to-br from-red-950/20 to-background"
                      : "border-slate-700/50 bg-slate-900/30"
                  )}
                >
                  {/* Question Number Badge */}
                  <div className="absolute -top-2.5 sm:-top-3 left-3 sm:left-4">
                    <div className={cn(
                      "px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-black shadow-lg",
                      showResult
                        ? isCorrect
                          ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                          : "bg-gradient-to-r from-red-500 to-rose-500 text-white"
                        : "bg-gradient-to-r from-slate-600 to-slate-500 text-white"
                    )}>
                      {showResult && (
                        isCorrect 
                          ? <CheckCircle2 className="inline h-3 w-3 sm:h-3.5 sm:w-3.5 mr-0.5 sm:mr-1" />
                          : <XCircle className="inline h-3 w-3 sm:h-3.5 sm:w-3.5 mr-0.5 sm:mr-1" />
                      )}
                      <span className="hidden xs:inline">Questão </span>{index + 1}
                    </div>
                  </div>
                  
                  <div className="p-3 sm:p-5 pt-4 sm:pt-6 space-y-3 sm:space-y-4">
                    {/* Header da questão */}
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <Badge variant="outline" className={cn(DIFFICULTY_COLORS[question.difficulty], "text-[10px] sm:text-xs")}>
                        {DIFFICULTY_LABELS[question.difficulty]}
                      </Badge>
                      {question.banca && (
                        <Badge variant="outline" className="bg-slate-800/50 border-slate-600/50 text-[10px] sm:text-xs">
                          {formatBancaHeader(question.banca, question.ano, '')}
                        </Badge>
                      )}
                      {question.macro && (
                        <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-[10px] sm:text-xs hidden sm:inline-flex">
                          {question.macro}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Enunciado */}
                    <div className="prose prose-invert prose-sm max-w-none text-xs sm:text-sm">
                      <QuestionEnunciado 
                        questionText={question.question_text} 
                        banca={question.banca}
                        ano={question.ano}
                      />
                    </div>
                    
                    {/* Alternativas com resultado */}
                    <div className="space-y-1.5 sm:space-y-2">
                      {question.options.map((option, optIndex) => {
                        const letter = String.fromCharCode(65 + optIndex);
                        const isSelected = selectedAnswer === option.id;
                        const isCorrectOption = option.id === question.correct_answer;
                        
                        return (
                          <div
                            key={option.id}
                            className={cn(
                              "flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-md sm:rounded-lg border",
                              isCorrectOption
                                ? "border-green-500/50 bg-green-500/10"
                                : isSelected && !isCorrectOption
                                  ? "border-red-500/50 bg-red-500/10"
                                  : "border-slate-700/50 bg-slate-800/30"
                            )}
                          >
                            <div className="flex items-start gap-1.5 sm:gap-2 flex-1 min-w-0">
                              <span className={cn(
                                "font-bold text-xs sm:text-sm min-w-[16px] sm:min-w-[20px] flex-shrink-0",
                                isCorrectOption && "text-green-400",
                                isSelected && !isCorrectOption && "text-red-400"
                              )}>
                                {letter})
                              </span>
                              <span className="text-xs sm:text-sm leading-relaxed">
                                {option.text}
                              </span>
                              {isCorrectOption && (
                                <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-400 ml-auto flex-shrink-0" />
                              )}
                              {isSelected && !isCorrectOption && (
                                <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-400 ml-auto flex-shrink-0" />
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
                        className="w-full mt-1 sm:mt-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 text-xs sm:text-sm h-8 sm:h-9"
                      >
                        <ChevronDown className={cn(
                          "h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 transition-transform",
                          isResolutionOpen && "rotate-180"
                        )} />
                        {isResolutionOpen ? 'Ocultar' : 'Ver Resolução'}
                      </Button>
                    )}
                    
                    {/* Resolução Expandida */}
                    {isResolutionOpen && question.explanation && (
                      <div className="mt-3 sm:mt-4 p-3 sm:p-4 rounded-md sm:rounded-lg bg-slate-800/50 border border-cyan-500/20">
                        <QuestionResolution resolutionText={question.explanation} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Cartão de resumo - RESPONSIVO */}
            <Card className="p-3 sm:p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-cyan-500/30 shadow-2xl shadow-cyan-500/10">
              <div className="flex flex-col gap-3 sm:gap-4">
                {/* Grid de respostas */}
                <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center">
                  {questions.map((q, i) => {
                    const correct = results[q.id];
                    const answered = !!answers[q.id];
                    
                    return (
                      <div
                        key={q.id}
                        className={cn(
                          "w-7 h-7 sm:w-9 sm:h-9 rounded-md sm:rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold transition-all",
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
                
                {/* Ações - RESPONSIVO */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                  <span className="text-xs sm:text-sm font-bold text-center sm:text-left">
                    ✅ {correctCount} acertos • ❌ {Object.keys(results).length - correctCount} erros
                  </span>
                  
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
                    <Button
                      variant="outline"
                      onClick={scrollToTop}
                      size="sm"
                      className="gap-1.5 sm:gap-2 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 text-xs sm:text-sm h-8 sm:h-9"
                    >
                      <ArrowUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="hidden xs:inline">Voltar ao</span> Topo
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleReset}
                      size="sm"
                      className="gap-1.5 sm:gap-2 border-amber-500/30 text-amber-400 hover:bg-amber-500/10 text-xs sm:text-sm h-8 sm:h-9"
                    >
                      <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="hidden xs:inline">Nova Prova</span>
                      <span className="xs:hidden">Nova</span>
                    </Button>
                    <Button
                      onClick={handleClose}
                      size="sm"
                      className="gap-1.5 sm:gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold text-xs sm:text-sm h-8 sm:h-9"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
