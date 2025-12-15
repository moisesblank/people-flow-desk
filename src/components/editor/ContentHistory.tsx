// ============================================
// MOISÉS MEDEIROS v10.0 - CONTENT HISTORY
// Histórico de versões do conteúdo editável
// Exclusivo para Owner: moisesblank@gmail.com
// ============================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  History, 
  X, 
  RotateCcw, 
  Clock, 
  User,
  ChevronRight,
  Check,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface HistoryEntry {
  id: string;
  content_key: string;
  old_value: string | null;
  new_value: string;
  changed_by: string | null;
  changed_at: string;
  version: number;
  user_agent?: string;
  ip_address?: string;
}

interface ContentHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  contentKey: string;
  history: HistoryEntry[];
  onRevert: (version: number) => void;
  isLoading?: boolean;
}

export function ContentHistory({
  isOpen,
  onClose,
  contentKey,
  history,
  onRevert,
  isLoading = false,
}: ContentHistoryProps) {
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [confirmRevert, setConfirmRevert] = useState<number | null>(null);

  const handleRevert = (version: number) => {
    if (confirmRevert === version) {
      onRevert(version);
      setConfirmRevert(null);
    } else {
      setConfirmRevert(version);
      // Reset after 3 seconds
      setTimeout(() => setConfirmRevert(null), 3000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 320 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 320 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 h-full w-96 bg-card/95 backdrop-blur-xl shadow-2xl z-[9997] border-l border-purple-500/30"
        >
          {/* Header */}
          <div className="p-4 border-b border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center">
                  <History className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Histórico de Versões</h3>
                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {contentKey}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <ScrollArea className="h-[calc(100%-80px)]">
            <div className="p-4 space-y-3">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-24 bg-muted/50 animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <History className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-sm font-medium">Nenhum histórico</p>
                  <p className="text-xs mt-1">As alterações serão registradas aqui</p>
                </div>
              ) : (
                history.map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "p-3 rounded-lg border transition-all cursor-pointer",
                      selectedVersion === entry.version
                        ? "border-purple-500 bg-purple-500/10"
                        : "border-border hover:border-purple-500/50 hover:bg-muted/50"
                    )}
                    onClick={() => setSelectedVersion(
                      selectedVersion === entry.version ? null : entry.version
                    )}
                  >
                    {/* Version Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          v{entry.version}
                        </Badge>
                        {index === 0 && (
                          <Badge className="text-xs bg-purple-500">Atual</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(entry.changed_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </div>
                    </div>

                    {/* Preview */}
                    <div className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {entry.new_value.slice(0, 100)}
                      {entry.new_value.length > 100 && "..."}
                    </div>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {selectedVersion === entry.version && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 pt-3 border-t border-border space-y-3"
                        >
                          {/* Timestamp */}
                          <div className="flex items-center gap-2 text-xs">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span>
                              {format(new Date(entry.changed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </span>
                          </div>

                          {/* Old vs New */}
                          {entry.old_value && (
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-destructive/80">Antes:</p>
                              <div className="p-2 rounded bg-destructive/10 text-xs line-clamp-3">
                                {entry.old_value}
                              </div>
                            </div>
                          )}
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-success/80">Depois:</p>
                            <div className="p-2 rounded bg-success/10 text-xs line-clamp-3">
                              {entry.new_value}
                            </div>
                          </div>

                          {/* Revert Button */}
                          {index > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              className={cn(
                                "w-full text-xs",
                                confirmRevert === entry.version && "border-warning text-warning"
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRevert(entry.version);
                              }}
                            >
                              {confirmRevert === entry.version ? (
                                <>
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Clique novamente para confirmar
                                </>
                              ) : (
                                <>
                                  <RotateCcw className="h-3 w-3 mr-1" />
                                  Reverter para esta versão
                                </>
                              )}
                            </Button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Expand indicator */}
                    <div className="flex justify-center mt-2">
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 text-muted-foreground transition-transform",
                          selectedVersion === entry.version && "rotate-90"
                        )}
                      />
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </ScrollArea>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ContentHistory;
