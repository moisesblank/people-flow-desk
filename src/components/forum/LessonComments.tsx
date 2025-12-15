// ============================================
// MOISÉS MEDEIROS v8.0 - LESSON COMMENTS
// Sistema de Comentários/Fórum para Aulas
// Preparado para integração com plugin Jean
// ============================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageCircle, 
  Send, 
  ThumbsUp, 
  Reply, 
  Star,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: Date;
  likes: number;
  isLiked: boolean;
  isAnswered: boolean;
  replies: Comment[];
  timestamp?: number; // Em segundos - se o comentário for sobre um momento específico
}

interface LessonRating {
  lessonId: string;
  rating: number;
  comment?: string;
}

interface LessonCommentsProps {
  lessonId: string;
  lessonTitle: string;
  comments?: Comment[];
  onAddComment?: (content: string, timestamp?: number) => void;
  onReply?: (commentId: string, content: string) => void;
  onLike?: (commentId: string) => void;
  onRateLesson?: (rating: LessonRating) => void;
  currentVideoTime?: number;
  isEditMode?: boolean;
}

export function LessonComments({
  lessonId,
  lessonTitle,
  comments = [],
  onAddComment,
  onReply,
  onLike,
  onRateLesson,
  currentVideoTime,
  isEditMode = false
}: LessonCommentsProps) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [showAllComments, setShowAllComments] = useState(false);
  const [lessonRating, setLessonRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [hasRated, setHasRated] = useState(false);
  const [includeTimestamp, setIncludeTimestamp] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    
    const timestamp = includeTimestamp && currentVideoTime ? currentVideoTime : undefined;
    onAddComment?.(newComment.trim(), timestamp);
    setNewComment("");
    setIncludeTimestamp(false);
    
    toast({
      title: "Comentário enviado!",
      description: "Você receberá uma resposta em até 24h por e-mail.",
    });
  };

  const handleReply = (commentId: string) => {
    if (!replyContent.trim()) return;
    
    onReply?.(commentId, replyContent.trim());
    setReplyContent("");
    setReplyTo(null);
    
    toast({
      title: "Resposta enviada!",
    });
  };

  const handleRateLesson = () => {
    if (lessonRating === 0) {
      toast({
        title: "Selecione uma avaliação",
        description: "Clique nas estrelas para avaliar a aula.",
        variant: "destructive"
      });
      return;
    }

    onRateLesson?.({
      lessonId,
      rating: lessonRating,
      comment: ratingComment.trim() || undefined
    });

    setHasRated(true);
    toast({
      title: "Avaliação enviada!",
      description: "Obrigado por avaliar esta aula.",
    });
  };

  const visibleComments = showAllComments ? comments : comments.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Lesson Rating Section */}
      {!hasRated && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              Avalie esta Aula
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Star Rating */}
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                  key={star}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setLessonRating(star)}
                  className="focus:outline-none"
                >
                  <Star
                    className={cn(
                      "h-8 w-8 transition-colors",
                      star <= lessonRating
                        ? "fill-amber-500 text-amber-500"
                        : "text-muted-foreground/30 hover:text-amber-500/50"
                    )}
                  />
                </motion.button>
              ))}
              {lessonRating > 0 && (
                <span className="text-sm text-muted-foreground ml-2">
                  {lessonRating === 1 && "Ruim"}
                  {lessonRating === 2 && "Regular"}
                  {lessonRating === 3 && "Bom"}
                  {lessonRating === 4 && "Muito Bom"}
                  {lessonRating === 5 && "Excelente!"}
                </span>
              )}
            </div>

            {/* Optional Comment */}
            <Textarea
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              placeholder="Deixe um comentário sobre a aula (opcional)..."
              rows={2}
              className="resize-none"
            />

            <Button onClick={handleRateLesson} className="w-full sm:w-auto">
              <Star className="h-4 w-4 mr-2" />
              Enviar Avaliação
            </Button>
          </CardContent>
        </Card>
      )}

      {hasRated && (
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <p className="text-sm text-green-700 dark:text-green-400">
              Obrigado por avaliar esta aula!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Comments Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Dúvidas e Comentários
            {comments.length > 0 && (
              <Badge variant="secondary">{comments.length}</Badge>
            )}
          </CardTitle>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Respostas em até 24 horas por e-mail
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* New Comment Form */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback>
                  {user?.email?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escreva sua dúvida ou comentário..."
                  rows={3}
                  className="resize-none"
                />
                
                {/* Include Timestamp Option */}
                {currentVideoTime !== undefined && currentVideoTime > 0 && (
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeTimestamp}
                      onChange={(e) => setIncludeTimestamp(e.target.checked)}
                      className="rounded border-border"
                    />
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Vincular ao momento {formatTime(currentVideoTime)}
                    </span>
                  </label>
                )}
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button 
                onClick={handleSubmitComment}
                disabled={!newComment.trim()}
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar Comentário
              </Button>
            </div>
          </div>

          {/* Comments List */}
          {comments.length > 0 ? (
            <div className="space-y-4 pt-4 border-t">
              <AnimatePresence>
                {visibleComments.map((comment, index) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="space-y-3"
                  >
                    {/* Main Comment */}
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={comment.userAvatar} />
                        <AvatarFallback>{comment.userName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{comment.userName}</span>
                          {comment.timestamp !== undefined && (
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatTime(comment.timestamp)}
                            </Badge>
                          )}
                          {comment.isAnswered && (
                            <Badge className="bg-green-500/20 text-green-600 dark:text-green-400">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Respondido
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/90">{comment.content}</p>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => onLike?.(comment.id)}
                            className={cn(
                              "flex items-center gap-1 text-xs transition-colors",
                              comment.isLiked 
                                ? "text-primary" 
                                : "text-muted-foreground hover:text-primary"
                            )}
                          >
                            <ThumbsUp className={cn("h-3 w-3", comment.isLiked && "fill-current")} />
                            {comment.likes > 0 && comment.likes}
                          </button>
                          <button
                            onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Reply className="h-3 w-3" />
                            Responder
                          </button>
                        </div>

                        {/* Reply Form */}
                        <AnimatePresence>
                          {replyTo === comment.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="pl-4 border-l-2 border-primary/20 space-y-2"
                            >
                              <Textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="Escreva sua resposta..."
                                rows={2}
                                className="resize-none"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleReply(comment.id)}
                                  disabled={!replyContent.trim()}
                                >
                                  Responder
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setReplyTo(null)}
                                >
                                  Cancelar
                                </Button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Replies */}
                        {comment.replies.length > 0 && (
                          <div className="pl-4 border-l-2 border-muted space-y-3 mt-3">
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="flex items-start gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={reply.userAvatar} />
                                  <AvatarFallback>{reply.userName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">{reply.userName}</span>
                                    {reply.userName === "Prof. Moisés" && (
                                      <Badge className="bg-primary/20 text-primary text-xs">
                                        Professor
                                      </Badge>
                                    )}
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(reply.createdAt).toLocaleDateString('pt-BR')}
                                    </span>
                                  </div>
                                  <p className="text-sm text-foreground/90">{reply.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Show More Button */}
              {comments.length > 3 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowAllComments(!showAllComments)}
                >
                  {showAllComments ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-2" />
                      Mostrar menos
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-2" />
                      Ver mais {comments.length - 3} comentários
                    </>
                  )}
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Seja o primeiro a comentar!</p>
              <p className="text-sm">Tire suas dúvidas sobre a aula.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
