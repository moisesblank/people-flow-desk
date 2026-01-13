// ============================================
// 📐 PAINÉIS INLINE PARA MODO LEITURA
// Calculadora e Tabela Periódica integradas
// Substituem dialogs que falham em fullscreen
// ============================================

import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calculator as CalculatorIcon, 
  Atom, 
  X, 
  ChevronLeft,
  ChevronRight,
  Sparkles,
  History,
  Trash2,
  Copy,
  Check,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useUserCalculatorPersistence, CalculatorHistoryItem } from '@/hooks/useUserCalculatorPersistence';

// ============================================
// TIPOS
// ============================================

interface ToolPanelProps {
  isVisible: boolean;
  onToggle: () => void;
  side?: 'left' | 'right';
}

// ============================================
// CALCULADORA INLINE COMPACTA
// ============================================

interface HistoryItem {
  expression: string;
  result: string;
  timestamp: number;
}

const STORAGE_KEY = "calculator_history_v2";
const MEMORY_KEY = "calculator_memory";

// Safe eval function
function safeEval(expr: string): number {
  // Replace display operators with JS operators
  let jsExpr = expr
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/\^/g, "**")
    .replace(/π/g, String(Math.PI))
    .replace(/e(?![xp])/g, String(Math.E));
  
  // Handle scientific functions
  jsExpr = jsExpr
    .replace(/sin\(/g, "Math.sin(")
    .replace(/cos\(/g, "Math.cos(")
    .replace(/tan\(/g, "Math.tan(")
    .replace(/asin\(/g, "Math.asin(")
    .replace(/acos\(/g, "Math.acos(")
    .replace(/atan\(/g, "Math.atan(")
    .replace(/log\(/g, "Math.log10(")
    .replace(/ln\(/g, "Math.log(")
    .replace(/sqrt\(/g, "Math.sqrt(")
    .replace(/cbrt\(/g, "Math.cbrt(")
    .replace(/abs\(/g, "Math.abs(")
    .replace(/exp\(/g, "Math.exp(")
    .replace(/floor\(/g, "Math.floor(")
    .replace(/ceil\(/g, "Math.ceil(")
    .replace(/round\(/g, "Math.round(");
  
  // Factorial
  jsExpr = jsExpr.replace(/(\d+)!/g, (_, n) => {
    let result = 1;
    for (let i = 2; i <= parseInt(n); i++) result *= i;
    return String(result);
  });

  // eslint-disable-next-line no-new-func
  return new Function(`"use strict"; return (${jsExpr})`)();
}

export const CalculatorInlinePanel = memo(function CalculatorInlinePanel({
  isVisible,
  onToggle,
  side = 'right'
}: ToolPanelProps) {
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [memory, setMemory] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [isRadians, setIsRadians] = useState(true);
  const [openParens, setOpenParens] = useState(0);
  const [isLoadingBackend, setIsLoadingBackend] = useState(true);

  // Persistência backend
  const { loadFromBackend, saveToBackendDebounced } = useUserCalculatorPersistence();

  // Carregar do backend
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const payload = await loadFromBackend();
        if (!mounted) return;
        if (payload) {
          setHistory(payload.history as HistoryItem[]);
          setMemory(payload.memory);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(payload.history));
          localStorage.setItem(MEMORY_KEY, String(payload.memory));
        }
      } catch (e) {
        console.warn("[Calculator] Usando localStorage:", e);
        const savedHistory = localStorage.getItem(STORAGE_KEY);
        const savedMemory = localStorage.getItem(MEMORY_KEY);
        if (savedHistory) {
          try { setHistory(JSON.parse(savedHistory)); } catch {}
        }
        if (savedMemory) setMemory(parseFloat(savedMemory) || 0);
      } finally {
        if (mounted) setIsLoadingBackend(false);
      }
    })();
    return () => { mounted = false; };
  }, [loadFromBackend]);

  const saveHistory = useCallback((newHistory: HistoryItem[]) => {
    setHistory(newHistory);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    saveToBackendDebounced({ history: newHistory as CalculatorHistoryItem[], memory });
  }, [memory, saveToBackendDebounced]);

  const formatResult = (num: number): string => {
    if (!isFinite(num)) {
      if (num === Infinity) return "∞";
      if (num === -Infinity) return "-∞";
      return "NaN";
    }
    if (Math.abs(num) < 1e-10 && num !== 0) return num.toExponential(6);
    if (Math.abs(num) >= 1e12) return num.toExponential(6);
    const rounded = Math.round(num * 1e12) / 1e12;
    let str = String(rounded);
    if (str.includes(".") && str.split(".")[1].length > 8) {
      str = rounded.toFixed(8).replace(/\.?0+$/, "");
    }
    return str;
  };

  const handleNumber = (num: string) => {
    if (display === "0" && num !== "0") {
      setDisplay(num);
    } else if (display === "0" && num === "0") {
      return;
    } else if (display === "Erro" || display === "NaN") {
      setDisplay(num);
      setExpression(num);
      return;
    } else {
      setDisplay(display + num);
    }
    setExpression(expression + num);
  };

  const handleOperator = (op: string) => {
    if (display === "Erro") return;
    if (expression.match(/[+\-×÷^]$/) && op !== "-") {
      setExpression(expression.slice(0, -1) + op);
      setDisplay(display.slice(0, -1) + op);
      return;
    }
    const displayOp = op === "*" ? "×" : op === "/" ? "÷" : op;
    setDisplay(display + displayOp);
    setExpression(expression + op);
  };

  const handleDecimal = () => {
    const parts = display.split(/[+\-×÷^()]/);
    const lastPart = parts[parts.length - 1];
    if (!lastPart.includes(".")) {
      if (lastPart === "" || display === "0") {
        setDisplay("0.");
        setExpression(expression === "" ? "0." : expression + "0.");
      } else {
        setDisplay(display + ".");
        setExpression(expression + ".");
      }
    }
  };

  const handleClear = () => {
    setDisplay("0");
    setExpression("");
    setOpenParens(0);
  };

  const handleBackspace = () => {
    if (display.length > 1 && display !== "Erro") {
      setDisplay(display.slice(0, -1));
      setExpression(expression.slice(0, -1));
    } else {
      setDisplay("0");
      setExpression("");
    }
  };

  const handleEquals = () => {
    if (!expression) return;
    try {
      let finalExpr = expression;
      for (let i = 0; i < openParens; i++) finalExpr += ")";
      const result = safeEval(finalExpr);
      const formatted = formatResult(result);
      
      const newItem: HistoryItem = {
        expression: display,
        result: formatted,
        timestamp: Date.now(),
      };
      saveHistory([newItem, ...history.slice(0, 49)]);
      setDisplay(formatted);
      setExpression(formatted);
      setOpenParens(0);
    } catch {
      setDisplay("Erro");
      setExpression("");
    }
  };

  const handleParenthesis = (paren: string) => {
    if (paren === "(") {
      if (display === "0" || display === "Erro") {
        setDisplay("(");
        setExpression("(");
      } else {
        const lastChar = expression.slice(-1);
        if (lastChar.match(/[0-9)]/)) {
          setDisplay(display + "×(");
          setExpression(expression + "*(");
        } else {
          setDisplay(display + "(");
          setExpression(expression + "(");
        }
      }
      setOpenParens(openParens + 1);
    } else {
      if (openParens > 0) {
        setDisplay(display + ")");
        setExpression(expression + ")");
        setOpenParens(openParens - 1);
      }
    }
  };

  const handleScientific = (fn: string) => {
    const prefix = `${fn}(`;
    if (display === "0" || display === "Erro") {
      setDisplay(prefix);
      setExpression(prefix);
    } else {
      setDisplay(display + prefix);
      setExpression(expression + prefix);
    }
    setOpenParens(openParens + 1);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(display);
      setCopied(true);
      toast.success("Copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  const CalcButton = ({ 
    children, 
    onClick, 
    variant = "default",
    className = "",
  }: { 
    children: React.ReactNode; 
    onClick: () => void; 
    variant?: "default" | "operator" | "function" | "equals";
    className?: string;
  }) => {
    const variants = {
      default: "bg-slate-700/80 hover:bg-slate-600 text-white",
      operator: "bg-primary/30 hover:bg-primary/50 text-primary font-bold",
      function: "bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs",
      equals: "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 text-white font-bold",
    };

    return (
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={cn(
          "h-9 rounded-lg font-medium transition-all flex items-center justify-center",
          variants[variant],
          className
        )}
      >
        {children}
      </motion.button>
    );
  };

  if (!isVisible) {
    return (
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        onClick={onToggle}
        className="fixed top-4 left-4 z-[80] p-2 rounded-lg bg-blue-600/90 hover:bg-blue-500 text-white shadow-lg border border-blue-400/50"
        title="Abrir Calculadora"
      >
        <CalculatorIcon className="w-5 h-5" />
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -300, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed top-16 left-2 z-[80] w-72 bg-slate-900/95 backdrop-blur-xl border border-blue-500/30 rounded-xl shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-blue-600/30 to-cyan-600/30 border-b border-blue-500/20">
        <div className="flex items-center gap-2">
          <CalculatorIcon className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-semibold text-blue-300">Calculadora</span>
          <Sparkles className="w-3 h-3 text-yellow-400" />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-slate-400 hover:text-white hover:bg-slate-700"
          onClick={onToggle}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {isLoadingBackend ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
        </div>
      ) : (
        <div className="p-3 space-y-2">
          {/* Display */}
          <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700">
            <div className="text-xs text-slate-500 h-4 truncate">{expression || "0"}</div>
            <div className={cn(
              "text-2xl font-mono font-bold text-right transition-all truncate",
              display === "Erro" ? "text-red-400" : "text-white"
            )}>
              {display}
            </div>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-4 gap-1.5">
            {/* Row 1 - Functions */}
            <CalcButton onClick={() => handleScientific('sin')} variant="function">sin</CalcButton>
            <CalcButton onClick={() => handleScientific('cos')} variant="function">cos</CalcButton>
            <CalcButton onClick={() => handleScientific('tan')} variant="function">tan</CalcButton>
            <CalcButton onClick={() => handleScientific('sqrt')} variant="function">√</CalcButton>

            {/* Row 2 - Functions */}
            <CalcButton onClick={() => handleScientific('log')} variant="function">log</CalcButton>
            <CalcButton onClick={() => handleScientific('ln')} variant="function">ln</CalcButton>
            <CalcButton onClick={() => { setDisplay(display + "π"); setExpression(expression + "π"); }} variant="function">π</CalcButton>
            <CalcButton onClick={() => handleOperator("^")} variant="function">x^y</CalcButton>

            {/* Row 3 */}
            <CalcButton onClick={handleClear} variant="function">C</CalcButton>
            <CalcButton onClick={() => handleParenthesis("(")} variant="function">(</CalcButton>
            <CalcButton onClick={() => handleParenthesis(")")} variant="function">)</CalcButton>
            <CalcButton onClick={() => handleOperator("/")} variant="operator">÷</CalcButton>

            {/* Row 4 */}
            <CalcButton onClick={() => handleNumber("7")}>7</CalcButton>
            <CalcButton onClick={() => handleNumber("8")}>8</CalcButton>
            <CalcButton onClick={() => handleNumber("9")}>9</CalcButton>
            <CalcButton onClick={() => handleOperator("*")} variant="operator">×</CalcButton>

            {/* Row 5 */}
            <CalcButton onClick={() => handleNumber("4")}>4</CalcButton>
            <CalcButton onClick={() => handleNumber("5")}>5</CalcButton>
            <CalcButton onClick={() => handleNumber("6")}>6</CalcButton>
            <CalcButton onClick={() => handleOperator("-")} variant="operator">−</CalcButton>

            {/* Row 6 */}
            <CalcButton onClick={() => handleNumber("1")}>1</CalcButton>
            <CalcButton onClick={() => handleNumber("2")}>2</CalcButton>
            <CalcButton onClick={() => handleNumber("3")}>3</CalcButton>
            <CalcButton onClick={() => handleOperator("+")} variant="operator">+</CalcButton>

            {/* Row 7 */}
            <CalcButton onClick={() => handleNumber("0")} className="col-span-2">0</CalcButton>
            <CalcButton onClick={handleDecimal}>.</CalcButton>
            <CalcButton onClick={handleEquals} variant="equals">=</CalcButton>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 h-7 text-xs text-slate-400 hover:text-white"
              onClick={handleBackspace}
            >
              ← Apagar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-slate-400 hover:text-white"
              onClick={copyToClipboard}
            >
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
});

// ============================================
// TABELA PERIÓDICA INLINE COMPACTA
// ============================================

// Elementos principais para referência rápida
const elementosCompactos = [
  { n: 1, s: "H", nome: "Hidrogênio", cat: "nm", massa: "1.008" },
  { n: 2, s: "He", nome: "Hélio", cat: "gn", massa: "4.003" },
  { n: 3, s: "Li", nome: "Lítio", cat: "ma", massa: "6.941" },
  { n: 4, s: "Be", nome: "Berílio", cat: "mat", massa: "9.012" },
  { n: 5, s: "B", nome: "Boro", cat: "sm", massa: "10.81" },
  { n: 6, s: "C", nome: "Carbono", cat: "nm", massa: "12.01" },
  { n: 7, s: "N", nome: "Nitrogênio", cat: "nm", massa: "14.01" },
  { n: 8, s: "O", nome: "Oxigênio", cat: "nm", massa: "16.00" },
  { n: 9, s: "F", nome: "Flúor", cat: "hl", massa: "19.00" },
  { n: 10, s: "Ne", nome: "Neônio", cat: "gn", massa: "20.18" },
  { n: 11, s: "Na", nome: "Sódio", cat: "ma", massa: "22.99" },
  { n: 12, s: "Mg", nome: "Magnésio", cat: "mat", massa: "24.31" },
  { n: 13, s: "Al", nome: "Alumínio", cat: "mr", massa: "26.98" },
  { n: 14, s: "Si", nome: "Silício", cat: "sm", massa: "28.09" },
  { n: 15, s: "P", nome: "Fósforo", cat: "nm", massa: "30.97" },
  { n: 16, s: "S", nome: "Enxofre", cat: "nm", massa: "32.07" },
  { n: 17, s: "Cl", nome: "Cloro", cat: "hl", massa: "35.45" },
  { n: 18, s: "Ar", nome: "Argônio", cat: "gn", massa: "39.95" },
  { n: 19, s: "K", nome: "Potássio", cat: "ma", massa: "39.10" },
  { n: 20, s: "Ca", nome: "Cálcio", cat: "mat", massa: "40.08" },
  { n: 26, s: "Fe", nome: "Ferro", cat: "mt", massa: "55.85" },
  { n: 29, s: "Cu", nome: "Cobre", cat: "mt", massa: "63.55" },
  { n: 30, s: "Zn", nome: "Zinco", cat: "mt", massa: "65.38" },
  { n: 35, s: "Br", nome: "Bromo", cat: "hl", massa: "79.90" },
  { n: 47, s: "Ag", nome: "Prata", cat: "mt", massa: "107.9" },
  { n: 53, s: "I", nome: "Iodo", cat: "hl", massa: "126.9" },
  { n: 79, s: "Au", nome: "Ouro", cat: "mt", massa: "197.0" },
  { n: 80, s: "Hg", nome: "Mercúrio", cat: "mt", massa: "200.6" },
  { n: 82, s: "Pb", nome: "Chumbo", cat: "mr", massa: "207.2" },
];

const categoriaCores: Record<string, string> = {
  ma: "bg-red-500",      // Metal alcalino
  mat: "bg-orange-500",   // Metal alcalino-terroso
  mt: "bg-yellow-500",    // Metal de transição
  mr: "bg-emerald-500",   // Metal representativo
  nm: "bg-green-500",     // Não-metal
  sm: "bg-cyan-500",      // Semimetal
  hl: "bg-teal-500",      // Halogênio
  gn: "bg-purple-500",    // Gás nobre
};

const categoriaLabels: Record<string, string> = {
  ma: "Metal Alcalino",
  mat: "Alcalino-Terroso",
  mt: "Metal de Transição",
  mr: "Metal Representativo",
  nm: "Não-Metal",
  sm: "Semimetal",
  hl: "Halogênio",
  gn: "Gás Nobre",
};

export const PeriodicTableInlinePanel = memo(function PeriodicTableInlinePanel({
  isVisible,
  onToggle,
  side = 'left'
}: ToolPanelProps) {
  const [busca, setBusca] = useState("");
  const [elementoSelecionado, setElementoSelecionado] = useState<typeof elementosCompactos[0] | null>(null);

  const elementosFiltrados = elementosCompactos.filter(e =>
    e.nome.toLowerCase().includes(busca.toLowerCase()) ||
    e.s.toLowerCase().includes(busca.toLowerCase()) ||
    e.n.toString().includes(busca)
  );

  if (!isVisible) {
    return (
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        onClick={onToggle}
        className="fixed top-4 right-16 z-[80] p-2 rounded-lg bg-red-600/90 hover:bg-red-500 text-white shadow-lg border border-red-400/50"
        title="Abrir Tabela Periódica"
      >
        <Atom className="w-5 h-5" />
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed top-16 bottom-16 right-2 z-[80] w-80 bg-slate-900/95 backdrop-blur-xl border border-red-500/30 rounded-xl shadow-2xl overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-red-600/30 to-rose-600/30 border-b border-red-500/20 shrink-0">
        <div className="flex items-center gap-2">
          <Atom className="w-4 h-4 text-red-400" />
          <span className="text-sm font-semibold text-red-300">Tabela Periódica</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-slate-400 hover:text-white hover:bg-slate-700"
          onClick={onToggle}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="p-2 border-b border-slate-700/50 shrink-0">
        <input
          type="text"
          placeholder="Buscar elemento..."
          className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {/* Legend */}
      <div className="px-2 py-1.5 border-b border-slate-700/50 shrink-0">
        <div className="flex flex-wrap gap-1">
          {Object.entries(categoriaCores).slice(0, 4).map(([cat, cor]) => (
            <span key={cat} className={cn("px-1.5 py-0.5 rounded text-[9px] font-medium text-white", cor)}>
              {categoriaLabels[cat]?.split(' ')[0]}
            </span>
          ))}
        </div>
      </div>

      {/* Elements Grid */}
      <ScrollArea className="flex-1">
        <div className="p-2 grid grid-cols-5 gap-1">
          {elementosFiltrados.map((el) => (
            <motion.button
              key={el.n}
              whileHover={{ scale: 1.1, zIndex: 10 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setElementoSelecionado(elementoSelecionado?.n === el.n ? null : el)}
              className={cn(
                "p-1.5 rounded text-center text-white shadow transition-all relative",
                categoriaCores[el.cat] || "bg-gray-500",
                elementoSelecionado?.n === el.n && "ring-2 ring-white"
              )}
            >
              <div className="text-[8px] opacity-75">{el.n}</div>
              <div className="text-lg font-bold leading-tight">{el.s}</div>
            </motion.button>
          ))}
        </div>
      </ScrollArea>

      {/* Selected Element Details */}
      <AnimatePresence>
        {elementoSelecionado && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="p-3 bg-slate-800/90 border-t border-slate-700 shrink-0"
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                "w-14 h-14 rounded-lg flex flex-col items-center justify-center text-white shrink-0",
                categoriaCores[elementoSelecionado.cat]
              )}>
                <span className="text-[10px]">{elementoSelecionado.n}</span>
                <span className="text-xl font-bold">{elementoSelecionado.s}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-white truncate">{elementoSelecionado.nome}</h4>
                <p className="text-xs text-slate-400">{categoriaLabels[elementoSelecionado.cat]}</p>
                <p className="text-sm text-teal-400 font-mono mt-1">Massa: {elementoSelecionado.massa}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-slate-400 hover:text-white shrink-0"
                onClick={() => setElementoSelecionado(null)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

// ============================================
// CONTAINER PRINCIPAL
// ============================================

interface ReadingModeToolPanelsProps {
  isFullscreen: boolean;
}

export const ReadingModeToolPanels = memo(function ReadingModeToolPanels({
  isFullscreen
}: ReadingModeToolPanelsProps) {
  const [showCalculator, setShowCalculator] = useState(true);
  const [showPeriodicTable, setShowPeriodicTable] = useState(true);

  if (!isFullscreen) return null;

  return (
    <>
      <AnimatePresence>
        <CalculatorInlinePanel
          isVisible={showCalculator}
          onToggle={() => setShowCalculator(!showCalculator)}
          side="right"
        />
      </AnimatePresence>
      <AnimatePresence>
        <PeriodicTableInlinePanel
          isVisible={showPeriodicTable}
          onToggle={() => setShowPeriodicTable(!showPeriodicTable)}
          side="left"
        />
      </AnimatePresence>
    </>
  );
});

export default ReadingModeToolPanels;
