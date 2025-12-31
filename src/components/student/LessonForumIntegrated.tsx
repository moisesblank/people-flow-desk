// ============================================
// LESSON FORUM INTEGRATED - Fórum de Dúvidas
// Componente de fórum integrado às aulas
// ============================================

import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  MessageCircle,
  Send,
  Pin,
  CheckCircle2,
  AlertCircle,
  ThumbsUp,
  Reply,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ForumReply {
  id: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: Date;
  isOfficial?: boolean;
  likes?: number;
}

interface ForumQuestion {
  id: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: Date;
  isPinned?: boolean;
  isAnswered?: boolean;
  replies: ForumReply[];
  likes?: number;
}

interface LessonForumIntegratedProps {
  lessonId: string;
  lessonTitle?: string;
  questions?: ForumQuestion[];
  userName?: string;
  onSubmitQuestion?: (content: string) => void;
  onSubmitReply?: (questionId: string, content: string) => void;
}

export function LessonForumIntegrated({
  lessonId,
  lessonTitle,
  questions: propQuestions,
  userName = "Aluno",
  onSubmitQuestion,
  onSubmitReply,
}: LessonForumIntegratedProps) {
  const [newQuestion, setNewQuestion] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  // Mock data ou dados reais
  const questions = propQuestions || [
    {
      id: "1",
      userName: "João Silva",
      content: "Professor, não entendi a parte sobre distribuição eletrônica. Pode explicar novamente?",
      createdAt: new Date(),
      isPinned: true,
      isAnswered: true,
      likes: 5,
      replies: [
        {
          id: "r1",
          userName: "Prof. Moisés Medeiros",
          content: "Claro, João! A distribuição eletrônica segue a regra de Aufbau. Os elétrons preenchem os orbitais em ordem crescente de energia: 1s, 2s, 2p, 3s, 3p, 4s, 3d...",
          createdAt: new Date(),
          isOfficial: true,
          likes: 12,
        },
      ],
    },
    {
      id: "2",
      userName: "Maria Santos",
      content: "Qual a diferença entre número atômico e número de massa?",
      createdAt: new Date(),
      isPinned: false,
      isAnswered: false,
      likes: 3,
      replies: [],
    },
  ];

  const pinnedCount = questions.filter(q => q.isPinned).length;

  const handleSubmitQuestion = () => {
    if (!newQuestion.trim()) return;
    onSubmitQuestion?.(newQuestion);
    setNewQuestion("");
  };

  const handleSubmitReply = (questionId: string) => {
    if (!replyContent.trim()) return;
    onSubmitReply?.(questionId, replyContent);
    setReplyContent("");
    setReplyingTo(null);
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Fórum de Dúvidas</CardTitle>
            <Badge variant="secondary" className="rounded-full">{questions.length}</Badge>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Respostas em até 24h
            </span>
            {pinnedCount > 0 && (
              <Badge variant="outline" className="text-green-500 border-green-500/30">
                <Pin className="h-3 w-3 mr-1" />
                {pinnedCount} fixada{pinnedCount > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Input de nova dúvida */}
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/20 text-primary">
              {userName?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Digite sua dúvida sobre esta aula..."
              rows={2}
              className="resize-none bg-muted/30 border-muted"
            />
            <div className="flex justify-end">
              <Button 
                onClick={handleSubmitQuestion}
                disabled={!newQuestion.trim()} 
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                Enviar Dúvida
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        {/* Lista de dúvidas */}
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-4 pr-2">
            {questions.map((question) => (
              <motion.div 
                key={question.id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg bg-muted/30 border space-y-3"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={question.userAvatar} />
                    <AvatarFallback className="bg-muted">
                      {question.userName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-medium">{question.userName}</span>
                      {question.isPinned && (
                        <Badge className="bg-green-500/20 text-green-500 text-xs border-green-500/30">
                          <Pin className="h-3 w-3 mr-1" />
                          Fixada
                        </Badge>
                      )}
                      {question.isAnswered && (
                        <Badge className="bg-blue-500/20 text-blue-500 text-xs border-blue-500/30">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Respondido
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {format(question.createdAt, "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-sm">{question.content}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <button className="text-xs text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors">
                        <ThumbsUp className="h-3 w-3" />
                        {question.likes || 0}
                      </button>
                      <button 
                        className="text-xs text-primary flex items-center gap-1 hover:underline"
                        onClick={() => setReplyingTo(replyingTo === question.id ? null : question.id)}
                      >
                        <Reply className="h-3 w-3" />
                        Responder
                      </button>
                    </div>
                  </div>
                </div>

                {/* Formulário de resposta */}
                {replyingTo === question.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="ml-12 mt-2"
                  >
                    <Textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Escreva sua resposta..."
                      rows={2}
                      className="resize-none text-sm"
                    />
                    <div className="flex gap-2 mt-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleSubmitReply(question.id)}
                        disabled={!replyContent.trim()}
                      >
                        Enviar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setReplyingTo(null)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Respostas */}
                {question.replies.map((reply) => (
                  <motion.div 
                    key={reply.id} 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="ml-12 pl-4 border-l-2 border-primary/30"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={reply.userAvatar} />
                        <AvatarFallback className={cn(
                          "text-xs",
                          reply.isOfficial 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted"
                        )}>
                          {reply.userName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{reply.userName}</span>
                          {reply.isOfficial && (
                            <>
                              <Badge variant="outline" className="text-primary border-primary/30 text-xs">
                                Professor
                              </Badge>
                              <Badge className="bg-green-500/20 text-green-500 text-xs border-green-500/30">
                                Resposta Oficial
                              </Badge>
                            </>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{reply.content}</p>
                        <button className="text-xs text-muted-foreground flex items-center gap-1 mt-1 hover:text-primary transition-colors">
                          <ThumbsUp className="h-3 w-3" />
                          {reply.likes || 0}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
