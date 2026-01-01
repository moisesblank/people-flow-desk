// ============================================
// 💬 FÓRUM MODAL CONTENT
// Comunidade de alunos - Lazy-loaded
// ============================================

import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, ThumbsUp, Clock, Users, TrendingUp, PlusCircle } from "lucide-react";

// Mock de tópicos do fórum
const MOCK_TOPICS = [
  { id: 1, title: "Dúvida sobre Estequiometria", author: "João S.", replies: 12, likes: 8, time: "2h atrás", category: "Química Geral" },
  { id: 2, title: "Como resolver questões de Eletroquímica?", author: "Maria L.", replies: 23, likes: 15, time: "5h atrás", category: "Físico-Química" },
  { id: 3, title: "Melhor forma de memorizar fórmulas", author: "Pedro A.", replies: 45, likes: 32, time: "1d atrás", category: "Dicas" },
  { id: 4, title: "Grupo de estudos para ENEM", author: "Ana C.", replies: 67, likes: 54, time: "2d atrás", category: "Comunidade" },
];

export const ForumModalContent = memo(function ForumModalContent() {
  return (
    <div className="space-y-6">
      {/* Header com stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-purple-500/20 bg-purple-500/5">
          <CardContent className="pt-4 text-center">
            <Users className="w-6 h-6 text-purple-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">1.2K</div>
            <div className="text-xs text-muted-foreground">Membros ativos</div>
          </CardContent>
        </Card>
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="pt-4 text-center">
            <MessageSquare className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">324</div>
            <div className="text-xs text-muted-foreground">Tópicos</div>
          </CardContent>
        </Card>
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="pt-4 text-center">
            <TrendingUp className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">89%</div>
            <div className="text-xs text-muted-foreground">Resolvidos</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Novo tópico */}
      <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
        <PlusCircle className="w-4 h-4 mr-2" />
        Criar novo tópico
      </Button>
      
      {/* Lista de tópicos */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
          Tópicos Recentes
        </h3>
        {MOCK_TOPICS.map((topic) => (
          <Card 
            key={topic.id} 
            className="hover:border-primary/30 transition-colors cursor-pointer"
          >
            <CardContent className="py-4">
              <div className="flex items-start gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                    {topic.author.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{topic.title}</h4>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{topic.author}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {topic.time}
                    </span>
                    <Badge variant="outline" className="text-[10px]">{topic.category}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    {topic.replies}
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-4 h-4" />
                    {topic.likes}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
});

export default ForumModalContent;
