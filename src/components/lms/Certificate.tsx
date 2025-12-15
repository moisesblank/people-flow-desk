// ============================================
// MOISÉS MEDEIROS v7.0 - CERTIFICATE GENERATOR
// Spider-Man Theme - Certificados com design premium
// ============================================

import { useRef } from "react";
import { motion } from "framer-motion";
import { Download, Award, Share2, CheckCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface CertificateProps {
  studentName: string;
  courseName: string;
  completionDate: string;
  totalHours: number;
  certificateId: string;
  instructorName?: string;
}

export function Certificate({
  studentName,
  courseName,
  completionDate,
  totalHours,
  certificateId,
  instructorName = "Prof. Moisés Medeiros",
}: CertificateProps) {
  const certificateRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    // Em produção, geraria PDF usando biblioteca como jsPDF ou html2canvas
    toast({
      title: "Download iniciado",
      description: "Seu certificado está sendo gerado em PDF...",
    });
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/certificado/${certificateId}`;
    
    if (navigator.share) {
      await navigator.share({
        title: `Certificado - ${courseName}`,
        text: `Confira meu certificado de conclusão do curso ${courseName}!`,
        url: shareUrl,
      });
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copiado!",
        description: "O link do certificado foi copiado para a área de transferência.",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Certificado Visual - Spider-Man Theme */}
      <motion.div
        ref={certificateRef}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-gradient-to-br from-background via-background to-primary/5 dark:from-slate-900 dark:to-slate-800 rounded-3xl p-8 md:p-12 border-4 border-primary/30 shadow-2xl overflow-hidden"
      >
        {/* Spider-Man Web Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-full" 
               style={{ 
                 backgroundImage: 'radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)',
                 backgroundSize: '30px 30px'
               }} 
          />
        </div>
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-primary/20 to-transparent rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-60 h-60 bg-gradient-to-tl from-spider-blue/20 to-transparent rounded-full translate-x-1/3 translate-y-1/3" />
        
        {/* Border Pattern */}
        <div className="absolute inset-4 border-2 border-primary/10 rounded-2xl pointer-events-none" />

        <div className="relative text-center space-y-6">
          {/* Logo/Badge - Spider-Man Style */}
          <div className="flex justify-center">
            <motion.div 
              className="p-4 rounded-full bg-gradient-spider shadow-lg relative"
              animate={{ 
                boxShadow: [
                  "0 0 20px hsl(var(--primary) / 0.3)",
                  "0 0 40px hsl(var(--primary) / 0.5)",
                  "0 0 20px hsl(var(--primary) / 0.3)"
                ]
              }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Award className="h-10 w-10 text-white" />
              <motion.div
                className="absolute -top-1 -right-1"
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ repeat: Infinity, duration: 3 }}
              >
                <Sparkles className="h-5 w-5 text-stats-gold" />
              </motion.div>
            </motion.div>
          </div>

          {/* Header */}
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary mb-2">
              Certificado de Conclusão
            </p>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-spider-blue to-primary bg-clip-text text-transparent">
              Moisés Medeiros
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Curso de Química para Vestibulares</p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 justify-center">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-primary/50" />
            <CheckCircle className="h-5 w-5 text-primary" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-primary/50" />
          </div>

          {/* Content */}
          <div className="space-y-4">
            <p className="text-muted-foreground">Certificamos que</p>
            <h2 className="text-2xl md:text-3xl font-bold text-primary">
              {studentName}
            </h2>
            <p className="text-muted-foreground">
              concluiu com êxito o curso
            </p>
            <h3 className="text-xl md:text-2xl font-semibold text-foreground">
              {courseName}
            </h3>
            <p className="text-sm text-muted-foreground">
              com carga horária de <span className="font-semibold">{totalHours} horas</span>
            </p>
          </div>

          {/* Date & Signature */}
          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <p className="text-xs text-muted-foreground">Data de conclusão</p>
              <p className="font-semibold text-foreground">{completionDate}</p>
            </div>
            
            <div className="text-center">
              <div className="w-40 border-b border-foreground/30 mb-2" />
              <p className="text-sm font-medium text-foreground">{instructorName}</p>
              <p className="text-xs text-muted-foreground">Instrutor</p>
            </div>
          </div>

          {/* Certificate ID */}
          <div className="pt-4">
            <p className="text-xs text-muted-foreground">
              ID do Certificado: <span className="font-mono">{certificateId}</span>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button onClick={handleDownload} className="gap-2">
          <Download className="h-4 w-4" />
          Baixar PDF
        </Button>
        <Button variant="outline" onClick={handleShare} className="gap-2">
          <Share2 className="h-4 w-4" />
          Compartilhar
        </Button>
      </div>
    </div>
  );
}
