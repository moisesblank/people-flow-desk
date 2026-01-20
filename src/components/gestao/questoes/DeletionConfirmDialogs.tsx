// ============================================
// DIALOGS DE CONFIRMAÇÃO DE EXCLUSÃO
// Extraído de GestaoQuestoes.tsx para otimização de build
// ============================================

import { Loader2, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DeletionStats {
  total: number;
  modoTreino: number;
  semGrupo: number;
  simulados: number;
}

// ============================================
// DIALOG: EXCLUSÃO INDIVIDUAL
// ============================================
interface SingleDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function SingleDeleteDialog({ open, onOpenChange, onConfirm }: SingleDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={() => onOpenChange(false)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Confirmar Exclusão
          </DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. A questão será permanentemente excluída do banco de dados.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir Questão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// DIALOG: ANIQUILAÇÃO TOTAL
// ============================================
interface AnnihilationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  totalQuestions: number;
  confirmText: string;
  onConfirmTextChange: (text: string) => void;
  checkbox: boolean;
  onCheckboxChange: (checked: boolean) => void;
  isDeleting: boolean;
}

export function AnnihilationDialog({
  open,
  onOpenChange,
  onConfirm,
  totalQuestions,
  confirmText,
  onConfirmTextChange,
  checkbox,
  onCheckboxChange,
  isDeleting,
}: AnnihilationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !isDeleting && onOpenChange(v)}>
      <DialogContent className="border-red-500/50 max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-500 text-xl">
            <AlertCircle className="h-6 w-6" />
            🔥 ANIQUILAÇÃO TOTAL
          </DialogTitle>
          <DialogDescription className="space-y-4 pt-4">
            <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-lg">
              <p className="text-red-400 font-bold text-lg mb-2">
                ⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL!
              </p>
              <p className="text-foreground">
                Você está prestes a excluir permanentemente <strong className="text-red-400">{totalQuestions} questões</strong>.
              </p>
            </div>
            
            <ul className="text-sm space-y-2 bg-muted/50 p-4 rounded-lg border">
              <li className="flex items-center gap-2">
                <span className="text-red-500">✗</span>
                Todas as questões serão removidas do sistema
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-500">✗</span>
                Todas as tentativas de resposta (question_attempts) serão excluídas
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-500">✗</span>
                Todas as respostas de quiz (quiz_answers) serão excluídas
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-500">✗</span>
                Estatísticas de desempenho serão invalidadas
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-500">✗</span>
                Esta ação NÃO pode ser revertida
              </li>
            </ul>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Digite <code className="bg-red-500/20 px-2 py-1 rounded text-red-400">CONFIRMAR EXCLUSÃO TOTAL</code> para continuar:
              </label>
              <Input 
                value={confirmText}
                onChange={(e) => onConfirmTextChange(e.target.value)}
                placeholder="CONFIRMAR EXCLUSÃO TOTAL"
                className="border-red-500/50 focus:border-red-500"
                disabled={isDeleting}
              />
            </div>

            <div className="flex items-start gap-3 bg-red-500/10 p-3 rounded-lg border border-red-500/30">
              <input 
                type="checkbox" 
                id="annihilation-confirm"
                checked={checkbox}
                onChange={(e) => onCheckboxChange(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-red-500"
                disabled={isDeleting}
              />
              <label htmlFor="annihilation-confirm" className="text-sm text-foreground">
                Eu entendo que esta ação excluirá <strong>PERMANENTEMENTE</strong> todas as questões e dados relacionados, 
                e que esta operação <strong>NÃO PODE SER DESFEITA</strong>.
              </label>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 mt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm}
            disabled={isDeleting || confirmText !== 'CONFIRMAR EXCLUSÃO TOTAL' || !checkbox}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ANIQUILANDO...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                CONFIRMAR EXCLUSÃO TOTAL
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// DIALOG: EXCLUSÃO MODO TREINO
// ============================================
interface TreinoDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  count: number;
  confirmText: string;
  onConfirmTextChange: (text: string) => void;
  isDeleting: boolean;
}

export function TreinoDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  count,
  confirmText,
  onConfirmTextChange,
  isDeleting,
}: TreinoDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !isDeleting && onOpenChange(v)}>
      <DialogContent className="border-purple-500/50 max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-purple-500 text-xl">
            <Trash2 className="h-6 w-6" />
            💪 Excluir Modo Treino
          </DialogTitle>
          <DialogDescription className="space-y-4 pt-4">
            <div className="bg-purple-500/20 border border-purple-500/50 p-4 rounded-lg">
              <p className="text-purple-400 font-bold text-lg mb-2">
                ⚠️ Esta ação remove apenas questões de TREINO
              </p>
              <p className="text-foreground">
                Você está prestes a excluir <strong className="text-purple-400">{count} questões</strong> do Modo Treino.
              </p>
            </div>
            
            <ul className="text-sm space-y-2 bg-muted/50 p-4 rounded-lg border">
              <li className="flex items-center gap-2">
                <span className="text-purple-500">✗</span>
                Questões com tag MODO_TREINO serão removidas
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Questões de SIMULADOS permanecerão intactas
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Questões sem grupo também permanecerão
              </li>
            </ul>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Digite <code className="bg-purple-500/20 px-2 py-1 rounded text-purple-400">EXCLUIR TREINO</code> para continuar:
              </label>
              <Input 
                value={confirmText}
                onChange={(e) => onConfirmTextChange(e.target.value)}
                placeholder="EXCLUIR TREINO"
                className="border-purple-500/50 focus-visible:ring-purple-500"
              />
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 mt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button 
            onClick={onConfirm}
            disabled={isDeleting || confirmText !== 'EXCLUIR TREINO'}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Modo Treino
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// DIALOG: EXCLUSÃO SEM GRUPO
// ============================================
interface SemGrupoDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  count: number;
  confirmText: string;
  onConfirmTextChange: (text: string) => void;
  isDeleting: boolean;
}

export function SemGrupoDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  count,
  confirmText,
  onConfirmTextChange,
  isDeleting,
}: SemGrupoDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !isDeleting && onOpenChange(v)}>
      <DialogContent className="border-gray-500/50 max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-400 text-xl">
            <Trash2 className="h-6 w-6" />
            🗑️ Excluir Sem Grupo
          </DialogTitle>
          <DialogDescription className="space-y-4 pt-4">
            <div className="bg-gray-500/20 border border-gray-500/50 p-4 rounded-lg">
              <p className="text-gray-400 font-bold text-lg mb-2">
                ⚠️ Esta ação remove questões SEM grupo definido
              </p>
              <p className="text-foreground">
                Você está prestes a excluir <strong className="text-gray-400">{count} questões</strong> que não possuem SIMULADOS nem MODO_TREINO.
              </p>
            </div>
            
            <ul className="text-sm space-y-2 bg-muted/50 p-4 rounded-lg border">
              <li className="flex items-center gap-2">
                <span className="text-gray-500">✗</span>
                Questões SEM tags SIMULADOS e MODO_TREINO serão removidas
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Questões de SIMULADOS permanecerão intactas
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Questões de MODO_TREINO permanecerão intactas
              </li>
            </ul>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Digite <code className="bg-gray-500/20 px-2 py-1 rounded text-gray-400">EXCLUIR SEM GRUPO</code> para continuar:
              </label>
              <Input 
                value={confirmText}
                onChange={(e) => onConfirmTextChange(e.target.value)}
                placeholder="EXCLUIR SEM GRUPO"
                className="border-gray-500/50 focus-visible:ring-gray-500"
              />
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 mt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button 
            onClick={onConfirm}
            disabled={isDeleting || confirmText !== 'EXCLUIR SEM GRUPO'}
            className="bg-gray-600 hover:bg-gray-700 text-white"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Sem Grupo
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// DIALOG: EXCLUSÃO SIMULADOS
// ============================================
interface SimuladosDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  count: number;
  confirmText: string;
  onConfirmTextChange: (text: string) => void;
  isDeleting: boolean;
}

export function SimuladosDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  count,
  confirmText,
  onConfirmTextChange,
  isDeleting,
}: SimuladosDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !isDeleting && onOpenChange(v)}>
      <DialogContent className="border-blue-500/50 max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-500 text-xl">
            <Trash2 className="h-6 w-6" />
            🎯 Excluir Simulados
          </DialogTitle>
          <DialogDescription className="space-y-4 pt-4">
            <div className="bg-blue-500/20 border border-blue-500/50 p-4 rounded-lg">
              <p className="text-blue-400 font-bold text-lg mb-2">
                ⚠️ Esta ação remove apenas questões de SIMULADOS
              </p>
              <p className="text-foreground">
                Você está prestes a excluir <strong className="text-blue-400">{count} questões</strong> de Simulados.
              </p>
            </div>
            
            <ul className="text-sm space-y-2 bg-muted/50 p-4 rounded-lg border">
              <li className="flex items-center gap-2">
                <span className="text-blue-500">✗</span>
                Questões com tag SIMULADOS serão removidas
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Questões de MODO_TREINO permanecerão intactas
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Questões sem grupo também permanecerão
              </li>
            </ul>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Digite <code className="bg-blue-500/20 px-2 py-1 rounded text-blue-400">EXCLUIR SIMULADOS</code> para continuar:
              </label>
              <Input 
                value={confirmText}
                onChange={(e) => onConfirmTextChange(e.target.value)}
                placeholder="EXCLUIR SIMULADOS"
                className="border-blue-500/50 focus-visible:ring-blue-500"
              />
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 mt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button 
            onClick={onConfirm}
            disabled={isDeleting || confirmText !== 'EXCLUIR SIMULADOS'}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Simulados
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
