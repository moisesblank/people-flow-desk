// ============================================
// MOISÉS MEDEIROS v10.0 - MASTER DUPLICATE BUTTON
// Botão Universal de Duplicação para Owner
// ============================================

import { useState } from 'react';
import { Copy, Loader2, Settings2, Check } from 'lucide-react';
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
import { cn } from '@/lib/utils';

interface MasterDuplicateButtonProps {
  entityType: DuplicableEntityType;
  entityId: string;
  entityName?: string;
  variant?: 'default' | 'ghost' | 'outline' | 'icon' | 'dropdown';
  size?: 'sm' | 'default' | 'lg' | 'icon';
  className?: string;
  onDuplicated?: (newId: string) => void;
  showAdvancedOptions?: boolean;
}

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
  const { duplicateEntity, isDuplicating, canDuplicate } = useMasterDuplication();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [includeAttachments, setIncludeAttachments] = useState(true);
  const [includeRelatedItems, setIncludeRelatedItems] = useState(true);

  if (!canDuplicate) {
    return null;
  }

  const handleQuickDuplicate = async () => {
    const result = await duplicateEntity(entityType, entityId, {
      includeAttachments: true,
      includeRelatedItems: true,
    });

    if (result.success && result.newId && onDuplicated) {
      onDuplicated(result.newId);
    }
  };

  const handleAdvancedDuplicate = async () => {
    const result = await duplicateEntity(entityType, entityId, {
      newName: newName || undefined,
      includeAttachments,
      includeRelatedItems,
    });

    if (result.success && result.newId) {
      setDialogOpen(false);
      setNewName('');
      if (onDuplicated) {
        onDuplicated(result.newId);
      }
    }
  };

  const entityLabels: Record<DuplicableEntityType, string> = {
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
  };

  // Variante dropdown para menus
  if (variant === 'dropdown') {
    return (
      <DropdownMenuItem
        onClick={handleQuickDuplicate}
        disabled={isDuplicating}
        className="cursor-pointer"
      >
        {isDuplicating ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Copy className="h-4 w-4 mr-2" />
        )}
        Duplicar {entityLabels[entityType]}
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
        className={cn("h-8 w-8", className)}
        title={`Duplicar ${entityLabels[entityType]}`}
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
              className={className}
            >
              {isDuplicating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              Duplicar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleQuickDuplicate}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicação Rápida
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DialogTrigger asChild>
              <DropdownMenuItem>
                <Settings2 className="h-4 w-4 mr-2" />
                Duplicação Avançada...
              </DropdownMenuItem>
            </DialogTrigger>
          </DropdownMenuContent>
        </DropdownMenu>

        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Copy className="h-5 w-5 text-primary" />
              Duplicar {entityLabels[entityType]}
            </DialogTitle>
            <DialogDescription>
              Configure as opções de duplicação para{' '}
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
                placeholder={`${entityName || entityLabels[entityType]} (Cópia)`}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Incluir anexos</Label>
                  <p className="text-xs text-muted-foreground">
                    Duplicar todos os arquivos anexados
                  </p>
                </div>
                <Switch
                  checked={includeAttachments}
                  onCheckedChange={setIncludeAttachments}
                />
              </div>

              <div className="flex items-center justify-between">
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
              className="gap-2"
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
      className={className}
    >
      {isDuplicating ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Copy className="h-4 w-4 mr-2" />
      )}
      Duplicar
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
  onDuplicated?: (newId: string) => void;
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
