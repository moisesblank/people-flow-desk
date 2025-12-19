// ============================================
// MOISÉS MEDEIROS v11.0 - MASTER DUPLICATE BUTTON
// Botão Universal de Duplicação EXCLUSIVO para Owner
// Owner: moisesblank@gmail.com
// ============================================

import { useState } from 'react';
import { Copy, Loader2, Settings2, Check, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useMasterDuplication, DuplicableEntityType } from '@/hooks/useMasterDuplication';
import { useDuplicationClipboard } from '@/contexts/DuplicationClipboardContext';
import { cn } from '@/lib/utils';

interface MasterDuplicateButtonProps {
  entityType: DuplicableEntityType;
  entityId: string;
  entityName?: string;
  variant?: 'default' | 'ghost' | 'outline' | 'icon' | 'dropdown';
  size?: 'sm' | 'default' | 'lg' | 'icon';
  className?: string;
  onDuplicated?: (newId: string, newData?: Record<string, unknown>) => void;
  showAdvancedOptions?: boolean;
}

const ENTITY_LABELS: Record<DuplicableEntityType, string> = {
  course: 'Curso',
  lesson: 'Aula',
  module: 'Módulo',
  quiz: 'Quiz',
  task: 'Tarefa',
  calendar_task: 'Tarefa do Calendário',
  transaction: 'Transação',
  campaign: 'Campanha',
  automation: 'Automação',
  employee: 'Funcionário',
  affiliate: 'Afiliado',
  student: 'Aluno',
  document: 'Documento',
  category: 'Categoria',
  expense: 'Despesa',
  income: 'Receita',
  conta_pagar: 'Conta a Pagar',
  conta_receber: 'Conta a Receber',
  alerta: 'Alerta',
  contabilidade: 'Registro Contábil',
};

export function MasterDuplicateButton({
  entityType,
  entityId,
  entityName,
  variant = 'ghost',
  size = 'sm',
  className,
  onDuplicated,
  showAdvancedOptions = true,
}: MasterDuplicateButtonProps) {
  const { duplicateEntity, isDuplicating, isOwner } = useMasterDuplication();
  const { copyToClipboard } = useDuplicationClipboard();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [includeAttachments, setIncludeAttachments] = useState(true);
  const [includeRelatedItems, setIncludeRelatedItems] = useState(true);

  // NÃO RENDERIZA SE NÃO FOR OWNER
  if (!isOwner) {
    return null;
  }

  const handleQuickDuplicate = async () => {
    const result = await duplicateEntity(entityType, entityId, {
      includeAttachments: true,
      includeRelatedItems: true,
      insertAfterOriginal: true,
    });

    if (result.success && result.newId) {
      // Copiar para clipboard visual
      copyToClipboard({
        id: result.newId,
        entityType,
        entityName: result.originalName || entityName || ENTITY_LABELS[entityType],
        originalId: entityId,
        data: result.newData || {}
      });

      if (onDuplicated) {
        onDuplicated(result.newId, result.newData);
      }
    }
  };

  const handleAdvancedDuplicate = async () => {
    const result = await duplicateEntity(entityType, entityId, {
      newName: newName || undefined,
      includeAttachments,
      includeRelatedItems,
      insertAfterOriginal: true,
    });

    if (result.success && result.newId) {
      // Copiar para clipboard visual
      copyToClipboard({
        id: result.newId,
        entityType,
        entityName: newName || result.originalName || entityName || ENTITY_LABELS[entityType],
        originalId: entityId,
        data: result.newData || {}
      });

      setDialogOpen(false);
      setNewName('');
      if (onDuplicated) {
        onDuplicated(result.newId, result.newData);
      }
    }
  };

  // Variante dropdown para menus
  if (variant === 'dropdown') {
    return (
      <DropdownMenuItem
        onClick={handleQuickDuplicate}
        disabled={isDuplicating}
        className="cursor-pointer text-primary"
      >
        {isDuplicating ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Copy className="h-4 w-4 mr-2" />
        )}
        <span className="font-medium">🔮 Duplicar {ENTITY_LABELS[entityType]}</span>
      </DropdownMenuItem>
    );
  }

  // Variante icon para botões compactos
  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleQuickDuplicate}
        disabled={isDuplicating}
        className={cn("h-8 w-8 text-primary hover:text-primary hover:bg-primary/10", className)}
        title={`🔮 Duplicar ${ENTITY_LABELS[entityType]} (Master)`}
      >
        {isDuplicating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    );
  }

  // Com opções avançadas (Dialog)
  if (showAdvancedOptions) {
    return (
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={variant === 'default' ? 'default' : variant}
              size={size}
              disabled={isDuplicating}
              className={cn("text-primary border-primary/30 hover:bg-primary/10", className)}
            >
              {isDuplicating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              🔮 Duplicar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="border-primary/20">
            <DropdownMenuItem onClick={handleQuickDuplicate} className="text-primary">
              <Copy className="h-4 w-4 mr-2" />
              Duplicação Rápida
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DialogTrigger asChild>
              <DropdownMenuItem className="text-primary">
                <Settings2 className="h-4 w-4 mr-2" />
                Duplicação Avançada...
              </DropdownMenuItem>
            </DialogTrigger>
          </DropdownMenuContent>
        </DropdownMenu>

        <DialogContent className="sm:max-w-md border-primary/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <Copy className="h-5 w-5" />
              🔮 Duplicar {ENTITY_LABELS[entityType]}
            </DialogTitle>
            <DialogDescription>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                MODO MASTER - Owner Only
              </span>
              <br />
              Configure as opções para{' '}
              <span className="font-medium text-foreground">
                {entityName || 'este item'}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newName">Nome da cópia (opcional)</Label>
              <Input
                id="newName"
                placeholder={`${entityName || ENTITY_LABELS[entityType]} (Cópia)`}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="border-primary/20 focus:border-primary"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="space-y-0.5">
                  <Label>Incluir anexos</Label>
                  <p className="text-xs text-muted-foreground">
                    Duplicar todos os arquivos
                  </p>
                </div>
                <Switch
                  checked={includeAttachments}
                  onCheckedChange={setIncludeAttachments}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="space-y-0.5">
                  <Label>Incluir itens relacionados</Label>
                  <p className="text-xs text-muted-foreground">
                    Duplicar sub-itens e relações
                  </p>
                </div>
                <Switch
                  checked={includeRelatedItems}
                  onCheckedChange={setIncludeRelatedItems}
                />
              </div>

              <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <GripVertical className="h-4 w-4 text-primary" />
                <p className="text-xs text-muted-foreground">
                  O item duplicado aparecerá <strong>logo abaixo</strong> do original e pode ser arrastado
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAdvancedDuplicate}
              disabled={isDuplicating}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              {isDuplicating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Duplicando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Confirmar Duplicação
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Botão simples
  return (
    <Button
      variant={variant === 'default' ? 'default' : variant}
      size={size}
      onClick={handleQuickDuplicate}
      disabled={isDuplicating}
      className={cn("text-primary", className)}
    >
      {isDuplicating ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Copy className="h-4 w-4 mr-2" />
      )}
      🔮 Duplicar
    </Button>
  );
}

// Componente para usar em DropdownMenus existentes
export function MasterDuplicateMenuItem({
  entityType,
  entityId,
  onDuplicated,
}: {
  entityType: DuplicableEntityType;
  entityId: string;
  onDuplicated?: (newId: string, newData?: Record<string, unknown>) => void;
}) {
  return (
    <MasterDuplicateButton
      entityType={entityType}
      entityId={entityId}
      variant="dropdown"
      showAdvancedOptions={false}
      onDuplicated={onDuplicated}
    />
  );
}

// Componente de indicador de arrastar (para listas com drag-and-drop)
export function MasterDragHandle({ className }: { className?: string }) {
  const { isOwner } = useMasterDuplication();
  
  if (!isOwner) return null;
  
  return (
    <div className={cn("cursor-grab active:cursor-grabbing text-primary/60 hover:text-primary", className)}>
      <GripVertical className="h-4 w-4" />
    </div>
  );
}
