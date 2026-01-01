// ============================================
// 🤖 TUTORIA IA MODAL CONTENT
// Tutor inteligente 24h - Lazy-loaded
// ============================================

import { memo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Send, Sparkles, BookOpen, HelpCircle, Lightbulb, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const QUICK_PROMPTS = [
  { icon: HelpCircle, label: "Explicar conceito", prompt: "Explique o conceito de..." },
  { icon: BookOpen, label: "Resolver exercício", prompt: "Me ajude a resolver este exercício..." },
  { icon: Lightbulb, label: "Dica de estudo", prompt: "Qual a melhor forma de estudar..." },
];

export const TutoriaModalContent = memo(function TutoriaModalContent() {
  const [message, setMessage] = useState("");
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-teal-500/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                QUIMIA - Seu Tutor de Química
                <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">
                  <Sparkles className="w-3 h-3 mr-1" />
                  IA
                </Badge>
              </h3>
              <p className="text-sm text-muted-foreground">
                Disponível 24h para tirar suas dúvidas e explicar conceitos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Quick prompts */}
      <div className="grid grid-cols-3 gap-3">
        {QUICK_PROMPTS.map((prompt, idx) => (
          <Button
            key={idx}
            variant="outline"
            className="h-auto py-4 flex-col gap-2 hover:border-emerald-500/50 hover:bg-emerald-500/5"
            onClick={() => setMessage(prompt.prompt)}
          >
            <prompt.icon className="w-5 h-5 text-emerald-500" />
            <span className="text-xs">{prompt.label}</span>
          </Button>
        ))}
      </div>
      
      {/* Chat area */}
      <Card>
        <CardContent className="pt-6">
          <div className="min-h-[300px] flex flex-col justify-between">
            {/* Messages area */}
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <MessageCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Inicie uma conversa com a QUIMIA!<br />
                  <span className="text-sm">Pergunte sobre qualquer tema de Química</span>
                </p>
              </div>
            </div>
            
            {/* Input area */}
            <div className="flex gap-2 mt-4">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Digite sua dúvida sobre Química..."
                className="min-h-[60px] resize-none"
              />
              <Button 
                className="h-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                disabled={!message.trim()}
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

export default TutoriaModalContent;
