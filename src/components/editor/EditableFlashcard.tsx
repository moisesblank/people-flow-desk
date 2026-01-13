// ============================================
// MOISÉS MEDEIROS v8.0 - EDITABLE FLASHCARD
// Flashcard editável com frente e verso
// ============================================

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  RotateCcw, 
  Edit3, 
  Trash2, 
  Plus,
  Check,
  X,
  GripVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface FlashcardData {
  id: string;
  front: string;
  back: string;
  category?: string;
  difficulty?: "easy" | "medium" | "hard";
  // Suporte a imagens (v1.0)
  front_image_url?: string | null;
  back_image_url?: string | null;
}

interface EditableFlashcardProps {
  card: FlashcardData;
  isEditMode: boolean;
  canEdit: boolean;
  onSave?: (card: FlashcardData) => void;
  onDelete?: () => void;
  className?: string;
}

export function EditableFlashcard({
  card,
  isEditMode,
  canEdit,
  onSave,
  onDelete,
  className = ""
}: EditableFlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCard, setEditedCard] = useState(card);

  const handleSave = () => {
    onSave?.(editedCard);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedCard(card);
    setIsEditing(false);
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case "easy": return "bg-green-500/20 text-green-600 dark:text-green-400";
      case "medium": return "bg-amber-500/20 text-amber-600 dark:text-amber-400";
      case "hard": return "bg-red-500/20 text-red-600 dark:text-red-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  // Modo de edição do card
  if (isEditing && isEditMode && canEdit) {
    return (
      <Card className={cn("w-full max-w-sm", className)}>
        <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Frente do Card</label>
            <Textarea
              value={editedCard.front}
              onChange={(e) => setEditedCard({ ...editedCard, front: e.target.value })}
              placeholder="Pergunta ou conceito..."
              rows={3}
            />
          </div>
          {/* Imagem da Frente (v1.0) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Imagem da Frente (URL)</label>
            <Input
              value={editedCard.front_image_url || ""}
              onChange={(e) => setEditedCard({ ...editedCard, front_image_url: e.target.value || null })}
              placeholder="https://exemplo.com/imagem.png"
            />
            {editedCard.front_image_url && (
              <img src={editedCard.front_image_url} alt="Preview" className="h-16 w-auto rounded-md object-contain" />
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Verso do Card</label>
            <Textarea
              value={editedCard.back}
              onChange={(e) => setEditedCard({ ...editedCard, back: e.target.value })}
              placeholder="Resposta ou explicação..."
              rows={3}
            />
          </div>
          {/* Imagem do Verso (v1.0) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Imagem do Verso (URL)</label>
            <Input
              value={editedCard.back_image_url || ""}
              onChange={(e) => setEditedCard({ ...editedCard, back_image_url: e.target.value || null })}
              placeholder="https://exemplo.com/imagem.png"
            />
            {editedCard.back_image_url && (
              <img src={editedCard.back_image_url} alt="Preview" className="h-16 w-auto rounded-md object-contain" />
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Categoria</label>
            <Input
              value={editedCard.category || ""}
              onChange={(e) => setEditedCard({ ...editedCard, category: e.target.value })}
              placeholder="Ex: Química Orgânica"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Dificuldade</label>
            <div className="flex gap-2">
              {(["easy", "medium", "hard"] as const).map((diff) => (
                <Button
                  key={diff}
                  variant={editedCard.difficulty === diff ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEditedCard({ ...editedCard, difficulty: diff })}
                >
                  {diff === "easy" && "Fácil"}
                  {diff === "medium" && "Médio"}
                  {diff === "hard" && "Difícil"}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} className="flex-1">
              <Check className="h-4 w-4 mr-2" />
              Salvar
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("relative group", className)}>
      {/* Edit Controls */}
      {isEditMode && canEdit && (
        <div className="absolute -top-2 right-2 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6 bg-background/95"
            onClick={() => setIsEditing(true)}
          >
            <Edit3 className="h-3 w-3" />
          </Button>
          {onDelete && (
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6 bg-background/95 text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}

      {/* Flashcard with Flip Animation */}
      <div 
        className="perspective-1000 w-full max-w-sm cursor-pointer"
        onClick={() => !isEditMode && setIsFlipped(!isFlipped)}
      >
        <motion.div
          className="relative preserve-3d"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Front */}
          <Card 
            className={cn(
              "w-full min-h-[200px] backface-hidden",
              isEditMode && "border-dashed border-2 hover:border-primary/50"
            )}
            style={{ backfaceVisibility: "hidden" }}
          >
            <CardContent className="p-6 flex flex-col items-center justify-center h-full min-h-[200px]">
              {card.category && (
                <span className={cn(
                  "text-xs px-2 py-1 rounded-full mb-3",
                  getDifficultyColor(card.difficulty)
                )}>
                  {card.category}
                </span>
              )}
              {/* Imagem da Frente (v1.0) */}
              {card.front_image_url && (
                <img src={card.front_image_url} alt="Imagem da pergunta" className="max-h-20 w-auto rounded-md mb-2 object-contain" />
              )}
              <p className="text-lg font-medium text-center">{card.front}</p>
              <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
                <RotateCcw className="h-3 w-3" />
                Clique para virar
              </p>
            </CardContent>
          </Card>

          {/* Back */}
          <Card 
            className={cn(
              "w-full min-h-[200px] absolute inset-0 backface-hidden bg-primary/5",
              isEditMode && "border-dashed border-2"
            )}
            style={{ 
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)"
            }}
          >
            <CardContent className="p-6 flex flex-col items-center justify-center h-full min-h-[200px]">
              {/* Imagem do Verso (v1.0) */}
              {card.back_image_url && (
                <img src={card.back_image_url} alt="Imagem da resposta" className="max-h-20 w-auto rounded-md mb-2 object-contain" />
              )}
              <p className="text-lg text-center">{card.back}</p>
              <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
                <RotateCcw className="h-3 w-3" />
                Clique para voltar
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

// Componente para lista de flashcards editável
interface FlashcardListProps {
  cards: FlashcardData[];
  isEditMode: boolean;
  canEdit: boolean;
  onCardsChange?: (cards: FlashcardData[]) => void;
}

export function FlashcardList({
  cards,
  isEditMode,
  canEdit,
  onCardsChange
}: FlashcardListProps) {
  const handleSaveCard = (index: number, updatedCard: FlashcardData) => {
    const newCards = [...cards];
    newCards[index] = updatedCard;
    onCardsChange?.(newCards);
  };

  const handleDeleteCard = (index: number) => {
    const newCards = cards.filter((_, i) => i !== index);
    onCardsChange?.(newCards);
  };

  const handleAddCard = () => {
    const newCard: FlashcardData = {
      id: Date.now().toString(),
      front: "Nova pergunta...",
      back: "Nova resposta...",
      category: "",
      difficulty: "medium"
    };
    onCardsChange?.([...cards, newCard]);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, index) => (
          <EditableFlashcard
            key={card.id}
            card={card}
            isEditMode={isEditMode}
            canEdit={canEdit}
            onSave={(updated) => handleSaveCard(index, updated)}
            onDelete={() => handleDeleteCard(index)}
          />
        ))}
      </div>

      {/* Add New Card Button */}
      {isEditMode && canEdit && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            className="border-dashed border-2"
            onClick={handleAddCard}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Flashcard
          </Button>
        </div>
      )}
    </div>
  );
}
