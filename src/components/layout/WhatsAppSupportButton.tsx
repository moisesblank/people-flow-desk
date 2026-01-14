// ============================================
// WHATSAPP SUPPORT BUTTON — Estilo Netflix/Header
// Botão discreto ao lado do ThemeToggle para suporte
// Visível apenas em /alunos/*
// ============================================

import { memo, useState } from "react";
import { MessageCircle, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useLocation } from "react-router-dom";

const WHATSAPP_URL =
  "https://api.whatsapp.com/send?phone=5583996169222&text=Ol%C3%A1%2C%20estou%20dentro%20da%20plataforma%20e%20estou%20com%20d%C3%BAvidas%2C%20pode%20me%20ajudar%3F";

export const WhatsAppSupportButton = memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Exibir apenas em rotas /alunos/*
  const isAlunoRoute = location.pathname.startsWith("/alunos");
  if (!isAlunoRoute) return null;

  const handleOpenWhatsApp = () => {
    window.open(WHATSAPP_URL, "_blank", "noopener,noreferrer");
    setIsOpen(false);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="header-btn-glow micro-hover text-[#25D366] hover:text-[#25D366] hover:bg-[#25D366]/10"
        title="Suporte via WhatsApp"
      >
        <MessageCircle className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-background via-background to-[#25D366]/5 border-[#25D366]/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 rounded-full bg-[#25D366]/20">
                <MessageCircle className="h-5 w-5 text-[#25D366]" />
              </div>
              Suporte via WhatsApp
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Está com dúvidas? Nossa equipe está pronta para te ajudar!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20">
              <p className="text-sm text-foreground/80 mb-3">
                Ao clicar no botão abaixo, você será redirecionado para o WhatsApp 
                do nosso suporte com uma mensagem pré-definida.
              </p>
              <p className="text-xs text-muted-foreground">
                📱 Atendimento: Segunda a Sexta, 8h às 18h
              </p>
            </div>

            <Button
              onClick={handleOpenWhatsApp}
              className="w-full gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold py-6 text-base rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <MessageCircle className="h-5 w-5" />
              Abrir WhatsApp
              <ExternalLink className="h-4 w-4 ml-auto opacity-60" />
            </Button>

            <Button
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="w-full text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});

WhatsAppSupportButton.displayName = "WhatsAppSupportButton";
