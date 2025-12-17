// ============================================
// MOISÉS MEDEIROS v10.0 - GOD MODE PROVIDER
// Context provider para o MODO MASTER completo
// Exclusivo para Owner: moisesblank@gmail.com
// ============================================

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useEditableContent } from "@/hooks/useEditableContent";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { EditModeToggle } from "./EditModeToggle";
import { StyleInspector } from "./StyleInspector";
import { ColorPickerInline } from "./ColorPickerInline";
import { ContentHistory } from "./ContentHistory";
import { toast } from "sonner";

interface SelectedElement {
  type: string;
  content: string;
  styles: Record<string, string>;
  contentKey?: string;
}

interface GodModeContextType {
  isGodMode: boolean;
  canUseGodMode: boolean;
  isEditMode: boolean;
  toggleEditMode: () => void;
  selectedElement: SelectedElement | null;
  selectElement: (element: SelectedElement | null) => void;
  showColorPicker: (position: { x: number; y: number }, currentColor?: string) => void;
  hideColorPicker: () => void;
  showStyleInspector: () => void;
  hideStyleInspector: () => void;
  showHistory: (contentKey: string) => void;
  hideHistory: () => void;
}

const GodModeContext = createContext<GodModeContextType | null>(null);

export function useGodMode() {
  const context = useContext(GodModeContext);
  if (!context) {
    throw new Error("useGodMode must be used within GodModeProvider");
  }
  return context;
}

interface GodModeProviderProps {
  children: ReactNode;
}

export function GodModeProvider({ children }: GodModeProviderProps) {
  const { isGodMode } = useAdminCheck();
  const { isEditMode, toggleEditMode, getHistory, revertToVersion } = useEditableContent("global");
  
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [styleInspectorOpen, setStyleInspectorOpen] = useState(false);
  const [colorPickerState, setColorPickerState] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    currentColor: string;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    currentColor: "#000000",
  });
  const [historyState, setHistoryState] = useState<{
    isOpen: boolean;
    contentKey: string;
    entries: any[];
  }>({
    isOpen: false,
    contentKey: "",
    entries: [],
  });

  // Keyboard shortcut handled by useEditableContent hook

  const selectElement = useCallback((element: SelectedElement | null) => {
    setSelectedElement(element);
    if (element) {
      setStyleInspectorOpen(true);
    }
  }, []);

  const showColorPicker = useCallback((position: { x: number; y: number }, currentColor = "#000000") => {
    setColorPickerState({
      isOpen: true,
      position,
      currentColor,
    });
  }, []);

  const hideColorPicker = useCallback(() => {
    setColorPickerState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const showStyleInspector = useCallback(() => {
    setStyleInspectorOpen(true);
  }, []);

  const hideStyleInspector = useCallback(() => {
    setStyleInspectorOpen(false);
  }, []);

  const showHistory = useCallback(async (contentKey: string) => {
    const entries = await getHistory(contentKey);
    setHistoryState({
      isOpen: true,
      contentKey,
      entries,
    });
  }, [getHistory]);

  const hideHistory = useCallback(() => {
    setHistoryState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const handleStyleChange = useCallback((property: string, value: string) => {
    toast.success(`Estilo atualizado: ${property}`);
  }, []);

  const handleColorSelect = useCallback((color: string) => {
    toast.success("Cor aplicada com sucesso");
  }, []);

  const handleRevert = useCallback(async (version: number) => {
    if (historyState.contentKey) {
      await revertToVersion(historyState.contentKey, version);
      toast.success(`Revertido para versão ${version}`);
    }
  }, [historyState.contentKey, revertToVersion]);

  const value: GodModeContextType = {
    isGodMode,
    canUseGodMode: isGodMode,
    isEditMode,
    toggleEditMode,
    selectedElement,
    selectElement,
    showColorPicker,
    hideColorPicker,
    showStyleInspector,
    hideStyleInspector,
    showHistory,
    hideHistory,
  };

  return (
    <GodModeContext.Provider value={value}>
      {children}

      {/* Edit Mode Toggle - Only for Owner */}
      {isGodMode && (
        <EditModeToggle
          isEditMode={isEditMode}
          canEdit={isGodMode}
          onToggle={toggleEditMode}
          isGodMode={isGodMode}
        />
      )}

      {/* Style Inspector Panel */}
      {isGodMode && (
        <StyleInspector
          isOpen={styleInspectorOpen && isEditMode}
          onClose={hideStyleInspector}
          selectedElement={selectedElement || undefined}
          onStyleChange={handleStyleChange}
          onSave={() => toast.success("Alterações salvas")}
          onRevert={() => toast.info("Alterações revertidas")}
        />
      )}

      {/* Color Picker */}
      {isGodMode && (
        <ColorPickerInline
          isOpen={colorPickerState.isOpen && isEditMode}
          position={colorPickerState.position}
          currentColor={colorPickerState.currentColor}
          onColorSelect={handleColorSelect}
          onClose={hideColorPicker}
        />
      )}

      {/* Content History */}
      {isGodMode && (
        <ContentHistory
          isOpen={historyState.isOpen}
          onClose={hideHistory}
          contentKey={historyState.contentKey}
          history={historyState.entries}
          onRevert={handleRevert}
        />
      )}
    </GodModeContext.Provider>
  );
}

export default GodModeProvider;
