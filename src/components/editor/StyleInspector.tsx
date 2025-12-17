// ============================================
// MOISÉS MEDEIROS v10.0 - STYLE INSPECTOR
// Painel lateral para edição visual de estilos
// Exclusivo para Owner: moisesblank@gmail.com
// ============================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Type, 
  Palette, 
  Square, 
  Maximize2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Undo,
  Redo,
  Save,
  RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface StyleInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  selectedElement?: {
    type: string;
    content: string;
    styles: Record<string, string>;
  };
  onStyleChange?: (property: string, value: string) => void;
  onSave?: () => void;
  onRevert?: () => void;
}

const COLOR_PRESETS = [
  { name: "Primary", value: "hsl(345 80% 35%)" },
  { name: "Secondary", value: "hsl(220 60% 25%)" },
  { name: "Success", value: "hsl(142 71% 45%)" },
  { name: "Warning", value: "hsl(38 92% 50%)" },
  { name: "Destructive", value: "hsl(0 84% 60%)" },
  { name: "White", value: "#ffffff" },
  { name: "Black", value: "#000000" },
  { name: "Purple", value: "hsl(270 80% 55%)" },
];

const FONT_SIZES = ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px", "36px", "48px", "64px"];

export function StyleInspector({
  isOpen,
  onClose,
  selectedElement,
  onStyleChange,
  onSave,
  onRevert,
}: StyleInspectorProps) {
  const [activeTab, setActiveTab] = useState("typography");

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 320 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 320 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 h-full w-80 bg-card/95 backdrop-blur-xl shadow-2xl z-[9998] border-l border-purple-500/30"
        >
          {/* Header */}
          <div className="p-4 border-b border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center">
                  <Palette className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Style Inspector</h3>
                  <p className="text-xs text-muted-foreground">MODO MASTER</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto h-[calc(100%-180px)]">
            {selectedElement ? (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="typography" className="text-xs">
                    <Type className="h-3 w-3 mr-1" />
                    Texto
                  </TabsTrigger>
                  <TabsTrigger value="colors" className="text-xs">
                    <Palette className="h-3 w-3 mr-1" />
                    Cores
                  </TabsTrigger>
                  <TabsTrigger value="spacing" className="text-xs">
                    <Square className="h-3 w-3 mr-1" />
                    Espaço
                  </TabsTrigger>
                </TabsList>

                {/* Typography Tab */}
                <TabsContent value="typography" className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Tamanho da Fonte</Label>
                    <div className="grid grid-cols-4 gap-1">
                      {FONT_SIZES.slice(0, 8).map((size) => (
                        <button
                          key={size}
                          onClick={() => onStyleChange?.("fontSize", size)}
                          className={cn(
                            "px-2 py-1 text-xs rounded border transition-colors",
                            selectedElement.styles.fontSize === size
                              ? "bg-purple-500 text-white border-purple-500"
                              : "border-border hover:border-purple-500"
                          )}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Peso da Fonte</Label>
                    <div className="flex gap-1">
                      {["normal", "medium", "semibold", "bold"].map((weight) => (
                        <button
                          key={weight}
                          onClick={() => onStyleChange?.("fontWeight", weight)}
                          className={cn(
                            "flex-1 px-2 py-1 text-xs rounded border transition-colors capitalize",
                            selectedElement.styles.fontWeight === weight
                              ? "bg-purple-500 text-white border-purple-500"
                              : "border-border hover:border-purple-500"
                          )}
                        >
                          {weight}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Alinhamento</Label>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onStyleChange?.("textAlign", "left")}
                        className={cn(
                          selectedElement.styles.textAlign === "left" && "bg-purple-500/20 border-purple-500"
                        )}
                      >
                        <AlignLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onStyleChange?.("textAlign", "center")}
                        className={cn(
                          selectedElement.styles.textAlign === "center" && "bg-purple-500/20 border-purple-500"
                        )}
                      >
                        <AlignCenter className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onStyleChange?.("textAlign", "right")}
                        className={cn(
                          selectedElement.styles.textAlign === "right" && "bg-purple-500/20 border-purple-500"
                        )}
                      >
                        <AlignRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Estilo do Texto</Label>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onStyleChange?.("fontWeight", "bold")}
                      >
                        <Bold className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onStyleChange?.("fontStyle", "italic")}
                      >
                        <Italic className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onStyleChange?.("textDecoration", "underline")}
                      >
                        <Underline className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                {/* Colors Tab */}
                <TabsContent value="colors" className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Cor do Texto</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {COLOR_PRESETS.map((color) => (
                        <button
                          key={color.name}
                          onClick={() => onStyleChange?.("color", color.value)}
                          className="w-full aspect-square rounded-lg border-2 border-border hover:border-purple-500 transition-all hover:scale-110"
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>
                    <Input
                      type="text"
                      placeholder="Cor customizada (hex/hsl)"
                      className="mt-2 text-xs"
                      onChange={(e) => onStyleChange?.("color", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Cor de Fundo</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {COLOR_PRESETS.map((color) => (
                        <button
                          key={color.name}
                          onClick={() => onStyleChange?.("backgroundColor", color.value)}
                          className="w-full aspect-square rounded-lg border-2 border-border hover:border-purple-500 transition-all hover:scale-110"
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>
                    <Input
                      type="text"
                      placeholder="Cor de fundo customizada"
                      className="mt-2 text-xs"
                      onChange={(e) => onStyleChange?.("backgroundColor", e.target.value)}
                    />
                  </div>
                </TabsContent>

                {/* Spacing Tab */}
                <TabsContent value="spacing" className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Padding</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {["Top", "Right", "Bottom", "Left"].map((side) => (
                        <div key={side} className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-12">{side}</span>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="0"
                            className="h-8 text-xs"
                            onChange={(e) => onStyleChange?.(`padding${side}`, `${e.target.value}px`)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Margin</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {["Top", "Right", "Bottom", "Left"].map((side) => (
                        <div key={side} className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-12">{side}</span>
                          <Input
                            type="number"
                            min="-100"
                            max="100"
                            placeholder="0"
                            className="h-8 text-xs"
                            onChange={(e) => onStyleChange?.(`margin${side}`, `${e.target.value}px`)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Border Radius</Label>
                    <Slider
                      defaultValue={[0]}
                      max={50}
                      step={1}
                      onValueChange={(value) => onStyleChange?.("borderRadius", `${value[0]}px`)}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <Maximize2 className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-sm font-medium">Nenhum elemento selecionado</p>
                <p className="text-xs mt-1">Clique em um elemento editável para inspecionar</p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-purple-500/20 bg-card/95">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onRevert}
                className="flex-1"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reverter
              </Button>
              <Button
                size="sm"
                onClick={onSave}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400"
              >
                <Save className="h-4 w-4 mr-1" />
                Salvar
              </Button>
            </div>
            
            <div className="flex justify-center gap-2 mt-2">
              <Button variant="ghost" size="sm" className="h-7 px-2">
                <Undo className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 px-2">
                <Redo className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default StyleInspector;
