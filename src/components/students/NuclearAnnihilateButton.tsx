// ============================================
// ☢️ NUCLEAR ANNIHILATE BUTTON — OWNER ONLY
// Botão de aniquilação total de alunos
// CONSTITUIÇÃO v10.4 — P0 CRÍTICO
// ============================================

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Skull, AlertTriangle, Loader2, ShieldAlert, Lock, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useServerOwnerCheck } from "@/hooks/useServerOwnerCheck";

// ============================================
// OWNER EMAIL FALLBACK (CONSTITUIÇÃO v10.4)
// ============================================
const OWNER_EMAIL = "moisesblank@gmail.com";

// ============================================
// CONSTANTS
// ============================================

const CONFIRMATION_PHRASE = "DELETE ALL STUDENTS";
const NUCLEAR_SECRET = "MATRIX-OMEGA-DESTROY-2026";

// ============================================
// TYPES
// ============================================

interface AnnihilationResult {
  success: boolean;
  totalDeleted: number;
  tablesAffected: string[];
  executionTimestamp: string;
  ownerId: string;
  errors: string[];
  message?: string;
}

// ============================================
// COMPONENT
// ============================================

export function NuclearAnnihilateButton() {
  const { isOwner: isOwnerFromHook, isLoading: isCheckingOwner } = useServerOwnerCheck();
  
  // Estados do fluxo de confirmação
  const [step, setStep] = useState<'closed' | 'warning' | 'phrase' | 'secret' | 'executing' | 'complete'>('closed');
  const [confirmPhrase, setConfirmPhrase] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [result, setResult] = useState<AnnihilationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // FALLBACK: Verificar email diretamente (CONSTITUIÇÃO v10.4)
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchUserEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email?.toLowerCase() || null);
    };
    fetchUserEmail();
  }, []);
  
  // Owner = hook OR email fallback
  const isOwner = isOwnerFromHook || (userEmail === OWNER_EMAIL.toLowerCase());

  // Reset do estado
  const resetState = useCallback(() => {
    setStep('closed');
    setConfirmPhrase("");
    setSecretKey("");
    setResult(null);
    setError(null);
  }, []);

  // Handler do botão principal
  const handleOpenWarning = useCallback(() => {
    if (!isOwner) {
      toast.error("Acesso negado", {
        description: "Apenas o OWNER pode executar esta operação."
      });
      return;
    }
    setStep('warning');
  }, [isOwner]);

  // Avançar para step de frase
  const handleProceedToPhrase = useCallback(() => {
    setStep('phrase');
  }, []);

  // Validar frase e avançar para secret
  const handleValidatePhrase = useCallback(() => {
    if (confirmPhrase !== CONFIRMATION_PHRASE) {
      toast.error("Frase incorreta", {
        description: `Digite exatamente: ${CONFIRMATION_PHRASE}`
      });
      return;
    }
    setStep('secret');
  }, [confirmPhrase]);

  // Executar aniquilação
  const handleExecuteAnnihilation = useCallback(async () => {
    const normalizedSecret = secretKey.trim();
    if (normalizedSecret !== NUCLEAR_SECRET) {
      toast.error("Chave de autorização inválida");
      return;
    }

    setStep('executing');
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Sessão não encontrada");
      }

      const { data, error: fnError } = await supabase.functions.invoke('nuclear-annihilate-students', {
        body: {
          confirmationPhrase: CONFIRMATION_PHRASE,
          secretKey: normalizedSecret,
        },
        headers: {
          'x-nuclear-auth-key': normalizedSecret,
        },
      });

      if (fnError) {
        throw new Error(fnError.message || "Erro na execução");
      }

      if (data?.success) {
        setResult(data);
        setStep('complete');
        toast.success("☢️ Aniquilação concluída", {
          description: `${data.totalDeleted} usuários deletados`
        });
      } else {
        throw new Error(data?.error || "Operação falhou");
      }
    } catch (err: any) {
      console.error("Nuclear annihilation error:", err);
      setError(err.message || "Erro desconhecido");
      setStep('warning');
      toast.error("Falha na aniquilação", {
        description: err.message
      });
    }
  }, [secretKey]);

  // FALLBACK IMEDIATO: Se email do Owner, mostrar mesmo durante loading
  const isOwnerByEmail = userEmail === OWNER_EMAIL.toLowerCase();
  
  // Não renderizar se não for owner e não estiver carregando (evita flash)
  // MAS: Se é Owner por email, mostrar imediatamente
  if (!isOwnerByEmail && (isCheckingOwner || !isOwner)) {
    return null;
  }

  return (
    <>
      {/* BOTÃO NUCLEAR */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpenWarning}
        className="border-red-600/50 text-red-500 hover:bg-red-600/20 hover:text-red-400 hover:border-red-500 gap-2"
      >
        <Skull className="h-4 w-4" />
        <span className="hidden md:inline">ANIQUILAR TODOS</span>
      </Button>

      {/* MODAL DE CONFIRMAÇÃO */}
      <Dialog open={step !== 'closed'} onOpenChange={(open) => !open && resetState()}>
        <DialogContent className="max-w-lg border-red-500/30 bg-background/95 backdrop-blur-xl">
          <AnimatePresence mode="wait">
            {/* STEP 1: WARNING */}
            {step === 'warning' && (
              <motion.div
                key="warning"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <DialogHeader className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 ring-2 ring-red-500/50">
                    <AlertTriangle className="h-8 w-8 text-red-500 animate-pulse" />
                  </div>
                  <DialogTitle className="text-2xl text-red-500">
                    ☢️ OPERAÇÃO NUCLEAR
                  </DialogTitle>
                  <DialogDescription className="text-base">
                    Esta ação irá <strong className="text-red-400">DELETAR PERMANENTEMENTE</strong> todos os usuários com role de ALUNO do sistema.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 rounded-lg border border-red-500/30 bg-red-500/5 p-4">
                  <h4 className="font-semibold text-red-400 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4" />
                    O que será deletado:
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Todos os usuários com roles: beta, aluno_gratuito, aluno_presencial, beta_expira</li>
                    <li>Sessões ativas e dispositivos registrados</li>
                    <li>Progresso de aulas e gamificação (XP, badges)</li>
                    <li>Progresso de leitura do Livro Web</li>
                    <li>Logs de acesso e histórico</li>
                    <li>Registros da tabela alunos</li>
                    <li>Contas auth.users correspondentes</li>
                  </ul>
                </div>

                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-400">
                  ⚠️ Esta ação é <strong>IRREVERSÍVEL</strong>. Não há rollback.
                </div>

                {error && (
                  <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
                    Erro anterior: {error}
                  </div>
                )}

                <DialogFooter className="flex gap-3 sm:justify-center">
                  <Button variant="outline" onClick={resetState}>
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleProceedToPhrase}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Entendo os riscos, continuar
                  </Button>
                </DialogFooter>
              </motion.div>
            )}

            {/* STEP 2: CONFIRMATION PHRASE */}
            {step === 'phrase' && (
              <motion.div
                key="phrase"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <DialogHeader className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20 ring-2 ring-amber-500/50">
                    <Lock className="h-8 w-8 text-amber-500" />
                  </div>
                  <DialogTitle className="text-xl">
                    Confirmação de Segurança
                  </DialogTitle>
                  <DialogDescription>
                    Digite a frase de confirmação exatamente como mostrado abaixo:
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-center">
                    <code className="text-lg font-mono font-bold text-amber-400">
                      {CONFIRMATION_PHRASE}
                    </code>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPhrase">Digite a frase:</Label>
                    <Input
                      id="confirmPhrase"
                      value={confirmPhrase}
                      onChange={(e) => setConfirmPhrase(e.target.value.toUpperCase())}
                      placeholder="DELETE ALL STUDENTS"
                      className="font-mono text-center border-red-500/30 focus:border-red-500"
                    />
                  </div>
                </div>

                <DialogFooter className="flex gap-3 sm:justify-center">
                  <Button variant="outline" onClick={() => setStep('warning')}>
                    Voltar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleValidatePhrase}
                    disabled={confirmPhrase !== CONFIRMATION_PHRASE}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Confirmar Frase
                  </Button>
                </DialogFooter>
              </motion.div>
            )}

            {/* STEP 3: SECRET KEY */}
            {step === 'secret' && (
              <motion.div
                key="secret"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <DialogHeader className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-600/20 ring-2 ring-red-600/50">
                    <Skull className="h-8 w-8 text-red-500" />
                  </div>
                  <DialogTitle className="text-xl text-red-500">
                    Autorização Final
                  </DialogTitle>
                  <DialogDescription>
                    Digite a chave secreta de autorização nuclear:
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="secretKey">Chave de Autorização:</Label>
                    <Input
                      id="secretKey"
                      type="password"
                      value={secretKey}
                      onChange={(e) => setSecretKey(e.target.value)}
                      placeholder="••••••••••••••••"
                      className="font-mono text-center border-red-500/30 focus:border-red-500"
                    />
                  </div>

                  <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-400 text-center">
                    🔐 Esta é a última etapa. Após confirmar, a operação será executada imediatamente.
                  </div>
                </div>

                <DialogFooter className="flex gap-3 sm:justify-center">
                  <Button variant="outline" onClick={() => setStep('phrase')}>
                    Voltar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleExecuteAnnihilation}
                    disabled={!secretKey}
                    className="bg-red-600 hover:bg-red-700 gap-2"
                  >
                    <Skull className="h-4 w-4" />
                    EXECUTAR ANIQUILAÇÃO
                  </Button>
                </DialogFooter>
              </motion.div>
            )}

            {/* STEP 4: EXECUTING */}
            {step === 'executing' && (
              <motion.div
                key="executing"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 text-center space-y-6"
              >
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-500/20 ring-4 ring-red-500/50">
                  <Loader2 className="h-10 w-10 text-red-500 animate-spin" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-red-500">☢️ ANIQUILANDO...</h3>
                  <p className="text-muted-foreground mt-2">
                    Deletando todos os usuários com role de aluno...
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-4">
                    Não feche esta janela.
                  </p>
                </div>
              </motion.div>
            )}

            {/* STEP 5: COMPLETE */}
            {step === 'complete' && result && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <DialogHeader className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 ring-2 ring-emerald-500/50">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                  </div>
                  <DialogTitle className="text-xl text-emerald-500">
                    ☢️ Aniquilação Concluída
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 text-center">
                      <div className="text-3xl font-bold text-emerald-400">
                        {result.totalDeleted}
                      </div>
                      <div className="text-xs text-muted-foreground">Usuários Deletados</div>
                    </div>
                    <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4 text-center">
                      <div className="text-3xl font-bold text-blue-400">
                        {result.tablesAffected.length}
                      </div>
                      <div className="text-xs text-muted-foreground">Tabelas Afetadas</div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-muted/30 bg-muted/5 p-3">
                    <h4 className="text-sm font-semibold mb-2">Tabelas processadas:</h4>
                    <div className="flex flex-wrap gap-1">
                      {result.tablesAffected.map((table) => (
                        <span
                          key={table}
                          className="px-2 py-0.5 text-xs rounded bg-muted/30 text-muted-foreground"
                        >
                          {table}
                        </span>
                      ))}
                    </div>
                  </div>

                  {result.errors.length > 0 && (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                      <h4 className="text-sm font-semibold text-amber-400 flex items-center gap-2 mb-2">
                        <XCircle className="h-4 w-4" />
                        Erros ({result.errors.length}):
                      </h4>
                      <ul className="text-xs text-muted-foreground space-y-1 max-h-24 overflow-y-auto">
                        {result.errors.slice(0, 5).map((err, i) => (
                          <li key={i} className="truncate">{err}</li>
                        ))}
                        {result.errors.length > 5 && (
                          <li className="text-amber-400">+{result.errors.length - 5} mais...</li>
                        )}
                      </ul>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground text-center">
                    Executado em: {new Date(result.executionTimestamp).toLocaleString('pt-BR')}
                  </div>
                </div>

                <DialogFooter className="sm:justify-center">
                  <Button onClick={resetState}>
                    Fechar
                  </Button>
                </DialogFooter>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default NuclearAnnihilateButton;
