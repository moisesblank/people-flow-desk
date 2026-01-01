// ============================================
// 🧩 MAPAS MENTAIS MODAL CONTENT
// Mapas mentais visuais - Lazy-loaded
// ============================================

import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Network, Search, Eye, Download, Star, Sparkles, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock de mapas mentais
const MOCK_MAPAS = [
  { id: 1, name: "Tabela Periódica Completa", category: "Química Geral", views: 2340, rating: 4.9, premium: true },
  { id: 2, name: "Funções Orgânicas", category: "Química Orgânica", views: 1890, rating: 4.8, premium: false },
  { id: 3, name: "Eletroquímica", category: "Físico-Química", views: 1456, rating: 4.7, premium: true },
  { id: 4, name: "Estequiometria", category: "Química Geral", views: 2100, rating: 4.6, premium: false },
  { id: 5, name: "Ligações Químicas", category: "Química Geral", views: 1780, rating: 4.8, premium: false },
  { id: 6, name: "Termoquímica", category: "Físico-Química", views: 1320, rating: 4.5, premium: true },
];

export const MapasMentaisModalContent = memo(function MapasMentaisModalContent() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar mapas mentais..." className="pl-10" />
        </div>
        <Button className="gap-2 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600">
          <Plus className="w-4 h-4" />
          Criar Mapa
        </Button>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-cyan-500/20 bg-cyan-500/5">
          <CardContent className="pt-4 text-center">
            <Network className="w-6 h-6 text-cyan-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">48</div>
            <div className="text-xs text-muted-foreground">Mapas disponíveis</div>
          </CardContent>
        </Card>
        <Card className="border-purple-500/20 bg-purple-500/5">
          <CardContent className="pt-4 text-center">
            <Sparkles className="w-6 h-6 text-purple-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">12</div>
            <div className="text-xs text-muted-foreground">Seus favoritos</div>
          </CardContent>
        </Card>
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="pt-4 text-center">
            <Download className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">8</div>
            <div className="text-xs text-muted-foreground">Baixados</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Grid de mapas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MOCK_MAPAS.map((mapa) => (
          <Card 
            key={mapa.id}
            className="group overflow-hidden hover:border-cyan-500/30 transition-all cursor-pointer"
          >
            {/* Preview */}
            <div className="relative aspect-[4/3] bg-gradient-to-br from-cyan-500/20 to-sky-500/20 flex items-center justify-center">
              <Network className="w-12 h-12 text-cyan-500/50" />
              {mapa.premium && (
                <Badge className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-black border-0">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button size="sm" variant="secondary" className="gap-1">
                  <Eye className="w-4 h-4" />
                  Ver
                </Button>
                <Button size="sm" variant="secondary" className="gap-1">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Info */}
            <CardContent className="p-4">
              <h4 className="font-medium line-clamp-1 mb-1">{mapa.name}</h4>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <Badge variant="outline">{mapa.category}</Badge>
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  {mapa.rating}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                <Eye className="w-3 h-3 inline mr-1" />
                {mapa.views.toLocaleString()} visualizações
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
});

export default MapasMentaisModalContent;
