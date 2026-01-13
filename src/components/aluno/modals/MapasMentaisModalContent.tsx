// ============================================
// 🧩 MAPAS MENTAIS MODAL CONTENT
// Mapas mentais visuais - 100% DADOS REAIS
// ============================================

import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Network } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const MapasMentaisModalContent = memo(function MapasMentaisModalContent() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Acesso aos mapas mentais */}
      <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-sky-500/5">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-500 flex items-center justify-center">
              <Network className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Mapas Mentais</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Visualize conceitos de forma clara e organize seu conhecimento com mapas mentais interativos.
            </p>
            <Button 
              className="bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600"
              onClick={() => navigate('/alunos/mapas-mentais')}
            >
              <Network className="w-4 h-4 mr-2" />
              Acessar Mapas Mentais
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

export default MapasMentaisModalContent;
