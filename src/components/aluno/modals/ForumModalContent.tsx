// ============================================
// 💬 FÓRUM MODAL CONTENT
// Comunidade de alunos - 100% DADOS REAIS
// ============================================

import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Users, PlusCircle } from "lucide-react";

export const ForumModalContent = memo(function ForumModalContent() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Mensagem para comunidade */}
      <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Comunidade</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Acesse a comunidade para interagir com outros alunos, tirar dúvidas e compartilhar conhecimento.
            </p>
            <Button 
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              onClick={() => navigate('/comunidade')}
            >
              <Users className="w-4 h-4 mr-2" />
              Ir para Comunidade
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

export default ForumModalContent;
