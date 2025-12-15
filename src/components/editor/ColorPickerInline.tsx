// ============================================
// MOISÉS MEDEIROS v10.0 - COLOR PICKER INLINE
// Seletor de cores flutuante para MODO DEUS
// Exclusivo para Owner: moisesblank@gmail.com
// ============================================

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pipette, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ColorPickerInlineProps {
  isOpen: boolean;
  position: { x: number; y: number };
  currentColor?: string;
  onColorSelect: (color: string) => void;
  onClose: () => void;
}

const PRESET_COLORS = [
  // Spider-Man Theme
  { name: "Wine", value: "#8B1538", category: "primary" },
  { name: "Spider Blue", value: "#1e40af", category: "primary" },
  { name: "Purple", value: "#9333ea", category: "accent" },
  { name: "Pink", value: "#ec4899", category: "accent" },
  
  // Status
  { name: "Success", value: "#22c55e", category: "status" },
  { name: "Warning", value: "#f59e0b", category: "status" },
  { name: "Error", value: "#ef4444", category: "status" },
  { name: "Info", value: "#0ea5e9", category: "status" },
  
  // Neutrals
  { name: "White", value: "#ffffff", category: "neutral" },
  { name: "Light Gray", value: "#f1f5f9", category: "neutral" },
  { name: "Gray", value: "#64748b", category: "neutral" },
  { name: "Dark", value: "#1e293b", category: "neutral" },
  { name: "Black", value: "#000000", category: "neutral" },
  
  // Extended
  { name: "Gold", value: "#ca8a04", category: "extended" },
  { name: "Cyan", value: "#06b6d4", category: "extended" },
  { name: "Emerald", value: "#10b981", category: "extended" },
];

const RECENT_COLORS_KEY = "god-mode-recent-colors";

export function ColorPickerInline({
  isOpen,
  position,
  currentColor = "#000000",
  onColorSelect,
  onClose,
}: ColorPickerInlineProps) {
  const [customColor, setCustomColor] = useState(currentColor);
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Load recent colors from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_COLORS_KEY);
    if (stored) {
      try {
        setRecentColors(JSON.parse(stored));
      } catch {
        setRecentColors([]);
      }
    }
  }, []);

  // Save to recent colors
  const saveToRecent = (color: string) => {
    const updated = [color, ...recentColors.filter(c => c !== color)].slice(0, 8);
    setRecentColors(updated);
    localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(updated));
  };

  const handleColorSelect = (color: string) => {
    saveToRecent(color);
    onColorSelect(color);
    onClose();
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={pickerRef}
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          className="fixed z-[10000] bg-card/95 backdrop-blur-xl rounded-xl shadow-2xl border border-purple-500/30 p-4 w-64"
          style={{
            left: Math.min(position.x, window.innerWidth - 280),
            top: Math.min(position.y, window.innerHeight - 400),
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center">
                <Pipette className="h-3 w-3 text-white" />
              </div>
              <span className="text-sm font-medium">Cor</span>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
              <X className="h-3 w-3" />
            </Button>
          </div>

          {/* Current Color Preview */}
          <div className="flex items-center gap-2 mb-4 p-2 rounded-lg bg-muted/50">
            <div
              className="w-10 h-10 rounded-lg border-2 border-border"
              style={{ backgroundColor: customColor }}
            />
            <div className="flex-1">
              <Input
                type="text"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="h-8 text-xs font-mono"
                placeholder="#000000"
              />
            </div>
            <Button
              size="sm"
              className="h-8 w-8 p-0 bg-gradient-to-r from-purple-600 to-pink-500"
              onClick={() => handleColorSelect(customColor)}
            >
              <Check className="h-4 w-4" />
            </Button>
          </div>

          {/* Native Color Input */}
          <div className="mb-4">
            <input
              type="color"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              className="w-full h-8 rounded cursor-pointer"
            />
          </div>

          {/* Recent Colors */}
          {recentColors.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2">Recentes</p>
              <div className="flex flex-wrap gap-1">
                {recentColors.map((color, index) => (
                  <button
                    key={index}
                    onClick={() => handleColorSelect(color)}
                    className={cn(
                      "w-6 h-6 rounded-md border-2 transition-all hover:scale-110",
                      currentColor === color ? "border-purple-500 ring-2 ring-purple-500/30" : "border-border"
                    )}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Preset Colors */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Paleta Spider-Man</p>
            <div className="grid grid-cols-8 gap-1">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => handleColorSelect(color.value)}
                  className={cn(
                    "w-6 h-6 rounded-md border-2 transition-all hover:scale-110",
                    currentColor === color.value ? "border-purple-500 ring-2 ring-purple-500/30" : "border-border"
                  )}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Transparency option */}
          <button
            onClick={() => handleColorSelect("transparent")}
            className="w-full mt-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded transition-colors"
          >
            Transparente
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ColorPickerInline;
