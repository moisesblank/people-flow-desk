// ============================================
// MOISÉS MEDEIROS v10.0 - WHATSAPP SHARE
// FASE 10: Integração WhatsApp
// ============================================

import { useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Send, Copy, Check, Phone, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface WhatsAppShareProps {
  defaultMessage?: string;
  title?: string;
  variant?: "button" | "icon" | "floating";
  className?: string;
}

export function WhatsAppShare({ 
  defaultMessage = "", 
  title = "Compartilhar no WhatsApp",
  variant = "button",
  className = ""
}: WhatsAppShareProps) {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState(defaultMessage);
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const formatPhone = (value: string): string => {
    // Remove non-digits
    const digits = value.replace(/\D/g, "");
    
    // Format as Brazilian phone
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const getWhatsAppUrl = (includePhone: boolean = true): string => {
    const encodedMessage = encodeURIComponent(message);
    const cleanPhone = phone.replace(/\D/g, "");
    
    // Add Brazil country code if not present
    const fullPhone = cleanPhone.length === 11 ? `55${cleanPhone}` : cleanPhone;
    
    if (includePhone && fullPhone) {
      return `https://wa.me/${fullPhone}?text=${encodedMessage}`;
    }
    return `https://wa.me/?text=${encodedMessage}`;
  };

  const handleSend = () => {
    if (!message.trim()) {
      toast.error("Digite uma mensagem");
      return;
    }
    
    window.open(getWhatsAppUrl(), "_blank");
    toast.success("Abrindo WhatsApp...");
    setIsOpen(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getWhatsAppUrl(false));
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const quickMessages = [
    "Olá! Gostaria de mais informações sobre o Curso de Química.",
    "Oi! Vi seu curso e tenho interesse. Podemos conversar?",
    "Bom dia! Quero saber sobre as formas de pagamento do curso.",
    "Olá! Sou aluno e preciso de suporte.",
  ];

  const renderTrigger = () => {
    switch (variant) {
      case "icon":
        return (
          <Button variant="ghost" size="icon" className={className}>
            <MessageCircle className="h-5 w-5" />
          </Button>
        );
      case "floating":
        return (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-50 p-4 rounded-full bg-[#25D366] text-white shadow-lg hover:bg-[#128C7E] transition-colors ${className}`}
          >
            <MessageCircle className="h-6 w-6" />
          </motion.button>
        );
      default:
        return (
          <Button variant="outline" className={`gap-2 ${className}`}>
            <MessageCircle className="h-4 w-4" />
            {title}
          </Button>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {renderTrigger()}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#25D366]/20">
              <MessageCircle className="h-5 w-5 text-[#25D366]" />
            </div>
            WhatsApp
          </DialogTitle>
          <DialogDescription>
            Envie uma mensagem via WhatsApp
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Phone input */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Número (opcional)
            </Label>
            <Input
              id="phone"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="(11) 99999-9999"
              className="bg-secondary/50"
            />
            <p className="text-xs text-muted-foreground">
              Deixe em branco para escolher o contato no WhatsApp
            </p>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              rows={4}
              className="bg-secondary/50 resize-none"
            />
          </div>

          {/* Quick messages */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Mensagens rápidas:</Label>
            <div className="flex flex-wrap gap-2">
              {quickMessages.map((msg, index) => (
                <button
                  key={index}
                  onClick={() => setMessage(msg)}
                  className="text-xs px-2 py-1 rounded-full bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                >
                  {msg.slice(0, 30)}...
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={handleCopyLink}>
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copiar Link
              </>
            )}
          </Button>
          <Button 
            className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white"
            onClick={handleSend}
          >
            <Send className="h-4 w-4 mr-2" />
            Enviar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Quick share component without dialog
export function WhatsAppQuickShare({ 
  message, 
  phone,
  className = "" 
}: { 
  message: string; 
  phone?: string;
  className?: string;
}) {
  const handleShare = () => {
    const encodedMessage = encodeURIComponent(message);
    const cleanPhone = phone?.replace(/\D/g, "") || "";
    const fullPhone = cleanPhone.length === 11 ? `55${cleanPhone}` : cleanPhone;
    
    const url = fullPhone 
      ? `https://wa.me/${fullPhone}?text=${encodedMessage}`
      : `https://wa.me/?text=${encodedMessage}`;
    
    window.open(url, "_blank");
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      className={`gap-2 ${className}`}
    >
      <Share2 className="h-4 w-4" />
      WhatsApp
    </Button>
  );
}
