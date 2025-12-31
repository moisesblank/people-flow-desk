// ============================================
// AI TRAMON AVATAR - Avatar Interativo da IA
// Componente de interface para o assistente TRAMON
// ============================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Sparkles, MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AITramonAvatarProps {
  className?: string;
  expanded?: boolean;
  onToggle?: () => void;
  lessonContext?: string;
}

export function AITramonAvatar({
  className,
  expanded: controlledExpanded,
  onToggle,
  lessonContext,
}: AITramonAvatarProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const expanded = controlledExpanded ?? internalExpanded;
  const handleToggle = onToggle ?? (() => setInternalExpanded(!internalExpanded));

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;
    
    setIsLoading(true);
    // Simulate AI response
    await new Promise(r => setTimeout(r, 1500));
    setMessage("");
    setIsLoading(false);
  };

  return (
    <motion.div
      className={cn("relative", className)}
      initial={false}
      animate={{ width: expanded ? "100%" : "auto" }}
    >
      <AnimatePresence mode="wait">
        {!expanded ? (
          // Compact Avatar Mode
          <motion.div
            key="compact"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <Card 
              className="cursor-pointer hover:shadow-lg transition-all border-primary/30 bg-gradient-to-br from-primary/10 to-background"
              onClick={handleToggle}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <motion.div
                  className="relative"
                  animate={{ 
                    boxShadow: ["0 0 0 0 rgba(var(--primary), 0.4)", "0 0 0 10px rgba(var(--primary), 0)", "0 0 0 0 rgba(var(--primary), 0)"]
                  }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                    <Bot className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <motion.div
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-background"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                </motion.div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary">TRAMON</span>
                    <Badge className="bg-primary/20 text-primary text-[10px] border-primary/30">
                      <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                      v8
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">IA Assistente</p>
                </div>
                
                <MessageCircle className="h-5 w-5 text-primary" />
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          // Expanded Chat Mode
          <motion.div
            key="expanded"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-background">
              <CardContent className="p-4 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-primary">TRAMON</span>
                        <Badge className="bg-primary/20 text-primary text-[10px]">v8</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Como posso ajudar?</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleToggle}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Context Badge */}
                {lessonContext && (
                  <Badge variant="outline" className="text-xs">
                    Contexto: {lessonContext}
                  </Badge>
                )}

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2">
                  {[
                    "Explique este conceito",
                    "Dê um exemplo prático",
                    "Quais exercícios fazer?",
                    "Resuma a aula",
                  ].map((action) => (
                    <Button
                      key={action}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => setMessage(action)}
                    >
                      {action}
                    </Button>
                  ))}
                </div>

                {/* Input */}
                <div className="flex gap-2">
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Digite sua dúvida..."
                    rows={2}
                    className="resize-none flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  <Button 
                    onClick={handleSend}
                    disabled={!message.trim() || isLoading}
                    className="self-end"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
