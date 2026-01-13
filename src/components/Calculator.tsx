import { useState, useEffect, useCallback, useRef, forwardRef } from "react";
import { 
  Calculator as CalculatorIcon, 
  History, 
  Trash2, 
  Copy, 
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  X,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useUserCalculatorPersistence, CalculatorHistoryItem } from "@/hooks/useUserCalculatorPersistence";

interface HistoryItem {
  expression: string;
  result: string;
  timestamp: number;
}

const STORAGE_KEY = "calculator_history_v2";
const MEMORY_KEY = "calculator_memory";

// ForwardRef wrapper para compatibilidade com TooltipTrigger/Radix
export interface CalculatorButtonProps extends React.ComponentPropsWithoutRef<typeof Button> {
  /** Permite passar classe/props para o botão gatilho da calculadora */
}

export const CalculatorButton = forwardRef<HTMLButtonElement, CalculatorButtonProps>(
  function CalculatorButton({ className, ...buttonProps }, ref) {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            ref={ref}
            variant="ghost"
            size="icon"
            title="Calculadora Científica"
            className={cn(
              "h-9 w-9 hover:bg-red-600/30 transition-all duration-200 group",
              className,
            )}
            {...buttonProps}
          >
            <CalculatorIcon className="h-5 w-5 text-red-600 group-hover:text-red-500 group-hover:scale-110 transition-all duration-300" />
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[480px] max-h-[90vh] p-0 gap-0 overflow-y-auto bg-gradient-to-b from-background to-background/95 border-primary/20">
          <DialogHeader className="px-4 py-3 border-b border-border/50 bg-gradient-to-r from-primary/10 via-transparent to-accent/10">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className="p-1.5 rounded-lg bg-primary/20">
                <CalculatorIcon className="h-5 w-5 text-primary" />
              </div>
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-bold">
                Calculadora Científica
              </span>
              <Sparkles className="h-4 w-4 text-yellow-500 animate-pulse" />
            </DialogTitle>
          </DialogHeader>
          <CalculatorContent />
        </DialogContent>
      </Dialog>
    );
  },
);
CalculatorButton.displayName = "CalculatorButton";

function CalculatorContent() {
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [memory, setMemory] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [isRadians, setIsRadians] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [openParens, setOpenParens] = useState(0);
  const displayRef = useRef<HTMLDivElement>(null);
  const [isLoadingBackend, setIsLoadingBackend] = useState(true);

  // Persistência backend (por aluno)
  const { loadFromBackend, saveToBackendDebounced } = useUserCalculatorPersistence();

  // Carregar do backend ao montar (prioriza backend; localStorage é fallback offline)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const payload = await loadFromBackend();
        if (!mounted) return;
        if (payload) {
          setHistory(payload.history as HistoryItem[]);
          setMemory(payload.memory);
          // Sincronizar localStorage como cache
          localStorage.setItem(STORAGE_KEY, JSON.stringify(payload.history));
          localStorage.setItem(MEMORY_KEY, String(payload.memory));
        }
      } catch (e) {
        console.warn("[Calculator] Falha ao carregar do backend, usando localStorage:", e);
        // Fallback localStorage
        const savedHistory = localStorage.getItem(STORAGE_KEY);
        const savedMemory = localStorage.getItem(MEMORY_KEY);
        if (savedHistory) {
          try {
            setHistory(JSON.parse(savedHistory));
          } catch {}
        }
        if (savedMemory) setMemory(parseFloat(savedMemory) || 0);
      } finally {
        if (mounted) setIsLoadingBackend(false);
      }
    })();
    return () => { mounted = false; };
  }, [loadFromBackend]);

  // Salvar histórico + memória no backend (debounced) + localStorage
  const saveHistory = useCallback((newHistory: HistoryItem[]) => {
    setHistory(newHistory);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    // Persistir no backend (debounce 500ms)
    saveToBackendDebounced({ history: newHistory as CalculatorHistoryItem[], memory });
  }, [memory, saveToBackendDebounced]);

  const saveMemory = useCallback((value: number) => {
    setMemory(value);
    localStorage.setItem(MEMORY_KEY, String(value));
    // Persistir no backend (debounce 500ms)
    saveToBackendDebounced({ history: history as CalculatorHistoryItem[], memory: value });
  }, [history, saveToBackendDebounced]);

  const clearHistory = () => {
    saveHistory([]);
    toast.success("Histórico limpo");
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(display);
      setCopied(true);
      toast.success("Copiado para a área de transferência!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  const animateResult = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleNumber = (num: string) => {
    if (lastResult && !expression.match(/[+\-×÷^(]$/)) {
      setDisplay(num);
      setExpression(num);
      setLastResult(null);
      return;
    }
    
    if (display === "0" && num !== "0") {
      setDisplay(num);
    } else if (display === "0" && num === "0") {
      return;
    } else if (display === "Erro" || display === "∞" || display === "NaN") {
      setDisplay(num);
      setExpression(num);
      return;
    } else {
      setDisplay(display + num);
    }
    setExpression(expression + num);
    setLastResult(null);
  };

  const handleOperator = (op: string) => {
    if (display === "Erro" || display === "NaN") return;
    
    // Prevent multiple operators
    if (expression.match(/[+\-×÷^]$/) && op !== "-") {
      setExpression(expression.slice(0, -1) + op);
      setDisplay(display.slice(0, -1) + op);
      return;
    }
    
    const displayOp = op === "*" ? "×" : op === "/" ? "÷" : op;
    setDisplay(display + displayOp);
    setExpression(expression + op);
    setLastResult(null);
  };

  const handleParenthesis = (paren: string) => {
    if (paren === "(") {
      if (display === "0" || display === "Erro") {
        setDisplay("(");
        setExpression("(");
      } else {
        // Auto-add multiplication before opening paren if needed
        const lastChar = expression.slice(-1);
        if (lastChar.match(/[0-9)]/) ) {
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

  const handleDecimal = () => {
    // Find the last number in the expression
    const parts = display.split(/[+\-×÷^()]/);
    const lastPart = parts[parts.length - 1];
    if (!lastPart.includes(".")) {
      if (lastPart === "" || display === "0" || display === "Erro") {
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
    setLastResult(null);
    setOpenParens(0);
  };

  const handleBackspace = () => {
    if (display.length > 1 && display !== "Erro") {
      const lastChar = display.slice(-1);
      if (lastChar === "(") setOpenParens(Math.max(0, openParens - 1));
      if (lastChar === ")") setOpenParens(openParens + 1);
      
      setDisplay(display.slice(0, -1));
      setExpression(expression.slice(0, -1));
    } else {
      setDisplay("0");
      setExpression("");
      setOpenParens(0);
    }
  };

  const handlePercent = () => {
    try {
      const value = safeEval(expression) / 100;
      const formatted = formatResult(value);
      setDisplay(formatted);
      setExpression(formatted);
      animateResult();
    } catch {
      setDisplay("Erro");
    }
  };

  const handleToggleSign = () => {
    if (display !== "0" && display !== "Erro") {
      try {
        const value = safeEval(expression);
        const negated = -value;
        const formatted = formatResult(negated);
        setDisplay(formatted);
        setExpression(formatted);
        animateResult();
      } catch {
        if (display.startsWith("-")) {
          setDisplay(display.slice(1));
          setExpression(expression.replace(/^-/, ""));
        } else {
          setDisplay("-" + display);
          setExpression("-" + expression);
        }
      }
    }
  };

  const safeEval = (expr: string): number => {
    // Sanitize and evaluate expression safely
    const sanitized = expr
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/\^/g, "**")
      .replace(/π/g, String(Math.PI))
      .replace(/e(?![x])/g, String(Math.E));
    
    // Check for valid expression
    if (!/^[\d+\-*/().e\s]+$/.test(sanitized.replace(/\*\*/g, "^"))) {
      throw new Error("Invalid expression");
    }
    
    return Function(`"use strict"; return (${sanitized})`)();
  };

  const factorial = (n: number): number => {
    if (n < 0) return NaN;
    if (!Number.isInteger(n)) return gamma(n + 1);
    if (n === 0 || n === 1) return 1;
    if (n > 170) return Infinity;
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
  };

  // Gamma function approximation for non-integer factorials
  const gamma = (z: number): number => {
    if (z < 0.5) {
      return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
    }
    z -= 1;
    const g = 7;
    const c = [
      0.99999999999980993,
      676.5203681218851,
      -1259.1392167224028,
      771.32342877765313,
      -176.61502916214059,
      12.507343278686905,
      -0.13857109526572012,
      9.9843695780195716e-6,
      1.5056327351493116e-7
    ];
    let x = c[0];
    for (let i = 1; i < g + 2; i++) {
      x += c[i] / (z + i);
    }
    const t = z + g + 0.5;
    return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
  };

  const handleScientific = (func: string) => {
    try {
      let value: number;
      
      try {
        value = safeEval(expression) || parseFloat(display);
      } catch {
        value = parseFloat(display);
      }
      
      if (isNaN(value) && func !== "pi" && func !== "e" && func !== "rand") {
        setDisplay("Erro");
        return;
      }

      let result: number;

      switch (func) {
        case "sin":
          result = isRadians ? Math.sin(value) : Math.sin(value * Math.PI / 180);
          break;
        case "cos":
          result = isRadians ? Math.cos(value) : Math.cos(value * Math.PI / 180);
          break;
        case "tan":
          result = isRadians ? Math.tan(value) : Math.tan(value * Math.PI / 180);
          break;
        case "asin":
          result = isRadians ? Math.asin(value) : Math.asin(value) * 180 / Math.PI;
          break;
        case "acos":
          result = isRadians ? Math.acos(value) : Math.acos(value) * 180 / Math.PI;
          break;
        case "atan":
          result = isRadians ? Math.atan(value) : Math.atan(value) * 180 / Math.PI;
          break;
        case "sinh":
          result = Math.sinh(value);
          break;
        case "cosh":
          result = Math.cosh(value);
          break;
        case "tanh":
          result = Math.tanh(value);
          break;
        case "asinh":
          result = Math.asinh(value);
          break;
        case "acosh":
          result = Math.acosh(value);
          break;
        case "atanh":
          result = Math.atanh(value);
          break;
        case "sqrt":
          result = Math.sqrt(value);
          break;
        case "cbrt":
          result = Math.cbrt(value);
          break;
        case "nthroot":
          // For now, just cube root
          result = Math.cbrt(value);
          break;
        case "log":
          result = Math.log10(value);
          break;
        case "log2":
          result = Math.log2(value);
          break;
        case "ln":
          result = Math.log(value);
          break;
        case "exp":
          result = Math.exp(value);
          break;
        case "10x":
          result = Math.pow(10, value);
          break;
        case "2x":
          result = Math.pow(2, value);
          break;
        case "pow2":
          result = Math.pow(value, 2);
          break;
        case "pow3":
          result = Math.pow(value, 3);
          break;
        case "1/x":
          result = 1 / value;
          break;
        case "abs":
          result = Math.abs(value);
          break;
        case "fact":
          result = factorial(value);
          break;
        case "pi":
          result = Math.PI;
          if (display !== "0" && display !== "Erro") {
            setDisplay(display + "π");
            setExpression(expression + String(Math.PI));
            return;
          }
          break;
        case "e":
          result = Math.E;
          if (display !== "0" && display !== "Erro") {
            setDisplay(display + "e");
            setExpression(expression + String(Math.E));
            return;
          }
          break;
        case "rand":
          result = Math.random();
          break;
        case "floor":
          result = Math.floor(value);
          break;
        case "ceil":
          result = Math.ceil(value);
          break;
        case "round":
          result = Math.round(value);
          break;
        case "phi":
          result = (1 + Math.sqrt(5)) / 2; // Golden ratio
          break;
        default:
          result = value;
      }

      const formatted = formatResult(result);
      setDisplay(formatted);
      setExpression(formatted);
      animateResult();
    } catch {
      setDisplay("Erro");
    }
  };

  const formatResult = (num: number): string => {
    if (!isFinite(num)) {
      if (num === Infinity) return "∞";
      if (num === -Infinity) return "-∞";
      return "NaN";
    }
    
    // Handle very small numbers
    if (Math.abs(num) < 1e-10 && num !== 0) {
      return num.toExponential(8);
    }
    
    // Handle very large numbers
    if (Math.abs(num) >= 1e12) {
      return num.toExponential(8);
    }
    
    // Round to prevent floating point errors
    const rounded = Math.round(num * 1e12) / 1e12;
    
    // Format with appropriate decimal places
    let str = String(rounded);
    if (str.includes(".") && str.split(".")[1].length > 10) {
      str = rounded.toFixed(10).replace(/\.?0+$/, "");
    }
    
    return str;
  };

  const handleEquals = () => {
    if (!expression) return;
    
    try {
      // Auto-close parentheses
      let finalExpr = expression;
      for (let i = 0; i < openParens; i++) {
        finalExpr += ")";
      }
      
      const result = safeEval(finalExpr);
      const formatted = formatResult(result);
      
      // Save to history
      const displayExpr = display + ")".repeat(openParens);
      const newItem: HistoryItem = {
        expression: displayExpr,
        result: formatted,
        timestamp: Date.now(),
      };
      saveHistory([newItem, ...history.slice(0, 99)]);

      setDisplay(formatted);
      setExpression(formatted);
      setLastResult(formatted);
      setOpenParens(0);
      animateResult();
    } catch (e) {
      console.error("Calculation error:", e);
      setDisplay("Erro");
      setExpression("");
      setOpenParens(0);
    }
  };

  const handlePower = () => {
    if (display === "Erro") return;
    setDisplay(display + "^");
    setExpression(expression + "^");
  };

  const handleMemory = (action: string) => {
    let value: number;
    try {
      value = safeEval(expression) || parseFloat(display);
    } catch {
      value = parseFloat(display) || 0;
    }
    
    switch (action) {
      case "MC":
        saveMemory(0);
        toast.success("Memória limpa", { duration: 1500 });
        break;
      case "MR":
        if (memory !== 0) {
          const memStr = formatResult(memory);
          if (display === "0" || display === "Erro") {
            setDisplay(memStr);
            setExpression(memStr);
          } else {
            setDisplay(display + memStr);
            setExpression(expression + memStr);
          }
        }
        break;
      case "M+":
        saveMemory(memory + value);
        toast.success(`M = ${formatResult(memory + value)}`, { duration: 1500 });
        break;
      case "M-":
        saveMemory(memory - value);
        toast.success(`M = ${formatResult(memory - value)}`, { duration: 1500 });
        break;
      case "MS":
        saveMemory(value);
        toast.success(`Salvo: ${formatResult(value)}`, { duration: 1500 });
        break;
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    setDisplay(item.result);
    setExpression(item.result);
    toast.success("Valor carregado", { duration: 1000 });
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default for calculator keys
      if (e.key.match(/^[0-9+\-*/().=]$/) || e.key === "Enter" || e.key === "Escape" || e.key === "Backspace") {
        e.preventDefault();
      }
      
      if (e.key >= "0" && e.key <= "9") handleNumber(e.key);
      else if (e.key === "+") handleOperator("+");
      else if (e.key === "-") handleOperator("-");
      else if (e.key === "*") handleOperator("*");
      else if (e.key === "/") handleOperator("/");
      else if (e.key === "^") handlePower();
      else if (e.key === ".") handleDecimal();
      else if (e.key === "(") handleParenthesis("(");
      else if (e.key === ")") handleParenthesis(")");
      else if (e.key === "Enter" || e.key === "=") handleEquals();
      else if (e.key === "Escape" || e.key === "c" || e.key === "C") handleClear();
      else if (e.key === "Backspace") handleBackspace();
      else if (e.key === "%") handlePercent();
      else if (e.key === "p") handleScientific("pi");
      else if (e.key === "e") handleScientific("e");
      else if (e.key === "s") handleScientific("sin");
      else if (e.key === "r") handleScientific("sqrt");
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [expression, display, openParens]);

  const CalcButton = ({ 
    children, 
    onClick, 
    variant = "default",
    className = "",
    span = 1,
    title = ""
  }: { 
    children: React.ReactNode; 
    onClick: () => void; 
    variant?: "default" | "operator" | "function" | "equals" | "memory" | "special";
    className?: string;
    span?: number;
    title?: string;
  }) => {
    const variants = {
      default: "bg-secondary/80 hover:bg-secondary text-foreground hover:scale-105",
      operator: "bg-primary/20 hover:bg-primary/30 text-primary font-bold hover:scale-105",
      function: "bg-muted/80 hover:bg-muted text-muted-foreground text-xs hover:text-foreground",
      equals: "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground font-bold hover:scale-105 shadow-lg shadow-primary/20",
      memory: "bg-accent/30 hover:bg-accent/50 text-accent-foreground text-xs font-medium",
      special: "bg-gradient-to-br from-primary/30 to-accent/30 hover:from-primary/40 hover:to-accent/40 text-foreground font-medium",
    };

    return (
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        title={title}
        className={cn(
          "h-11 rounded-xl font-medium transition-all duration-200 flex items-center justify-center shadow-sm",
          variants[variant],
          span > 1 && "col-span-2",
          className
        )}
      >
        {children}
      </motion.button>
    );
  };

  // Loading do backend
  if (isLoadingBackend) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-3 min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Carregando histórico...</span>
      </div>
    );
  }

  return (
    <Tabs defaultValue="calc" className="w-full">
      <TabsList className="w-full rounded-none border-b border-border/50 bg-transparent h-11">
        <TabsTrigger value="calc" className="flex-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
          <CalculatorIcon className="h-4 w-4 mr-2" />
          Calculadora
        </TabsTrigger>
        <TabsTrigger value="history" className="flex-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
          <History className="h-4 w-4 mr-2" />
          Histórico
          {history.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary/20 rounded-full">
              {history.length}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="calc" className="mt-0 p-3">
        {/* Display */}
        <motion.div 
          className="bg-gradient-to-br from-secondary/80 to-secondary/40 rounded-2xl p-4 mb-3 border border-border/30 shadow-inner"
          ref={displayRef}
        >
          <div className="text-right text-sm text-muted-foreground h-5 overflow-hidden font-mono">
            {expression.length > 35 ? "..." + expression.slice(-35) : expression || " "}
            {openParens > 0 && (
              <span className="text-primary animate-pulse">{")".repeat(openParens)}</span>
            )}
          </div>
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-primary/10"
                onClick={copyToClipboard}
                title="Copiar resultado"
              >
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
              {memory !== 0 && (
                <span className="text-xs px-2 py-1 bg-accent/30 rounded-md text-accent-foreground font-medium">
                  M
                </span>
              )}
            </div>
            <motion.div 
              className={cn(
                "text-right text-3xl font-bold tracking-tight overflow-hidden font-mono",
                isAnimating && "text-primary"
              )}
              animate={isAnimating ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 0.2 }}
            >
              {display.length > 14 ? (
                <span className="text-2xl">{display}</span>
              ) : display}
            </motion.div>
          </div>
        </motion.div>

        {/* Mode & Quick Actions */}
        <div className="flex gap-2 mb-2">
          <Button
            variant={isRadians ? "default" : "outline"}
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={() => setIsRadians(true)}
          >
            RAD
          </Button>
          <Button
            variant={!isRadians ? "default" : "outline"}
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={() => setIsRadians(false)}
          >
            DEG
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs px-3"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {showAdvanced ? "Menos" : "Mais"}
          </Button>
        </div>

        {/* Memory Row */}
        <div className="grid grid-cols-5 gap-1.5 mb-2">
          <CalcButton variant="memory" onClick={() => handleMemory("MC")} title="Limpar memória">MC</CalcButton>
          <CalcButton variant="memory" onClick={() => handleMemory("MR")} title="Recuperar memória">MR</CalcButton>
          <CalcButton variant="memory" onClick={() => handleMemory("M+")} title="Adicionar à memória">M+</CalcButton>
          <CalcButton variant="memory" onClick={() => handleMemory("M-")} title="Subtrair da memória">M-</CalcButton>
          <CalcButton variant="memory" onClick={() => handleMemory("MS")} title="Salvar na memória">MS</CalcButton>
        </div>

        {/* Scientific Functions */}
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {/* Trig Functions */}
              <div className="grid grid-cols-6 gap-1.5 mb-1.5">
                <CalcButton variant="function" onClick={() => handleScientific("sin")} title="Seno">sin</CalcButton>
                <CalcButton variant="function" onClick={() => handleScientific("cos")} title="Cosseno">cos</CalcButton>
                <CalcButton variant="function" onClick={() => handleScientific("tan")} title="Tangente">tan</CalcButton>
                <CalcButton variant="function" onClick={() => handleScientific("asin")} title="Arco seno">sin⁻¹</CalcButton>
                <CalcButton variant="function" onClick={() => handleScientific("acos")} title="Arco cosseno">cos⁻¹</CalcButton>
                <CalcButton variant="function" onClick={() => handleScientific("atan")} title="Arco tangente">tan⁻¹</CalcButton>
              </div>

              {/* Hyperbolic */}
              <div className="grid grid-cols-6 gap-1.5 mb-1.5">
                <CalcButton variant="function" onClick={() => handleScientific("sinh")} title="Seno hiperbólico">sinh</CalcButton>
                <CalcButton variant="function" onClick={() => handleScientific("cosh")} title="Cosseno hiperbólico">cosh</CalcButton>
                <CalcButton variant="function" onClick={() => handleScientific("tanh")} title="Tangente hiperbólica">tanh</CalcButton>
                <CalcButton variant="function" onClick={() => handleScientific("asinh")} title="Arco seno hip.">sinh⁻¹</CalcButton>
                <CalcButton variant="function" onClick={() => handleScientific("acosh")} title="Arco cosseno hip.">cosh⁻¹</CalcButton>
                <CalcButton variant="function" onClick={() => handleScientific("atanh")} title="Arco tangente hip.">tanh⁻¹</CalcButton>
              </div>

              {/* Log & Exp */}
              <div className="grid grid-cols-6 gap-1.5 mb-1.5">
                <CalcButton variant="function" onClick={() => handleScientific("log")} title="Logaritmo base 10">log</CalcButton>
                <CalcButton variant="function" onClick={() => handleScientific("log2")} title="Logaritmo base 2">log₂</CalcButton>
                <CalcButton variant="function" onClick={() => handleScientific("ln")} title="Logaritmo natural">ln</CalcButton>
                <CalcButton variant="function" onClick={() => handleScientific("exp")} title="e elevado a x">eˣ</CalcButton>
                <CalcButton variant="function" onClick={() => handleScientific("10x")} title="10 elevado a x">10ˣ</CalcButton>
                <CalcButton variant="function" onClick={() => handleScientific("2x")} title="2 elevado a x">2ˣ</CalcButton>
              </div>

              {/* Other Functions */}
              <div className="grid grid-cols-6 gap-1.5 mb-2">
                <CalcButton variant="function" onClick={() => handleScientific("fact")} title="Fatorial">n!</CalcButton>
                <CalcButton variant="function" onClick={() => handleScientific("abs")} title="Valor absoluto">|x|</CalcButton>
                <CalcButton variant="function" onClick={() => handleScientific("floor")} title="Arredondar para baixo">⌊x⌋</CalcButton>
                <CalcButton variant="function" onClick={() => handleScientific("ceil")} title="Arredondar para cima">⌈x⌉</CalcButton>
                <CalcButton variant="function" onClick={() => handleScientific("round")} title="Arredondar">round</CalcButton>
                <CalcButton variant="function" onClick={() => handleScientific("rand")} title="Número aleatório">rand</CalcButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Basic Scientific Row */}
        <div className="grid grid-cols-5 gap-1.5 mb-1.5">
          <CalcButton variant="function" onClick={() => handleScientific("sqrt")} title="Raiz quadrada">√x</CalcButton>
          <CalcButton variant="function" onClick={() => handleScientific("cbrt")} title="Raiz cúbica">³√x</CalcButton>
          <CalcButton variant="function" onClick={() => handleScientific("pow2")} title="Ao quadrado">x²</CalcButton>
          <CalcButton variant="function" onClick={() => handleScientific("pow3")} title="Ao cubo">x³</CalcButton>
          <CalcButton variant="function" onClick={handlePower} title="Potência">xʸ</CalcButton>
        </div>

        {/* Constants & Special */}
        <div className="grid grid-cols-5 gap-1.5 mb-2">
          <CalcButton variant="special" onClick={() => handleScientific("pi")} title="Pi">π</CalcButton>
          <CalcButton variant="special" onClick={() => handleScientific("e")} title="Número de Euler">e</CalcButton>
          <CalcButton variant="special" onClick={() => handleScientific("phi")} title="Proporção áurea">φ</CalcButton>
          <CalcButton variant="special" onClick={() => handleParenthesis("(")} title="Abrir parêntese">(</CalcButton>
          <CalcButton variant="special" onClick={() => handleParenthesis(")")} title="Fechar parêntese">)</CalcButton>
        </div>

        {/* Main Calculator Grid */}
        <div className="grid grid-cols-4 gap-1.5">
          <CalcButton variant="function" onClick={handleClear} title="Limpar tudo (Esc)">AC</CalcButton>
          <CalcButton variant="function" onClick={handleBackspace} title="Apagar (Backspace)">
            <X className="h-4 w-4" />
          </CalcButton>
          <CalcButton variant="function" onClick={handlePercent} title="Porcentagem">%</CalcButton>
          <CalcButton variant="operator" onClick={() => handleOperator("/")} title="Dividir (/)">÷</CalcButton>

          <CalcButton onClick={() => handleNumber("7")}>7</CalcButton>
          <CalcButton onClick={() => handleNumber("8")}>8</CalcButton>
          <CalcButton onClick={() => handleNumber("9")}>9</CalcButton>
          <CalcButton variant="operator" onClick={() => handleOperator("*")} title="Multiplicar (*)">×</CalcButton>

          <CalcButton onClick={() => handleNumber("4")}>4</CalcButton>
          <CalcButton onClick={() => handleNumber("5")}>5</CalcButton>
          <CalcButton onClick={() => handleNumber("6")}>6</CalcButton>
          <CalcButton variant="operator" onClick={() => handleOperator("-")} title="Subtrair (-)">−</CalcButton>

          <CalcButton onClick={() => handleNumber("1")}>1</CalcButton>
          <CalcButton onClick={() => handleNumber("2")}>2</CalcButton>
          <CalcButton onClick={() => handleNumber("3")}>3</CalcButton>
          <CalcButton variant="operator" onClick={() => handleOperator("+")} title="Somar (+)">+</CalcButton>

          <CalcButton onClick={handleToggleSign} title="Inverter sinal">±</CalcButton>
          <CalcButton onClick={() => handleNumber("0")}>0</CalcButton>
          <CalcButton onClick={handleDecimal} title="Decimal (.)">,</CalcButton>
          <CalcButton variant="equals" onClick={handleEquals} title="Calcular (Enter)">=</CalcButton>
        </div>

        {/* Keyboard hint */}
        <p className="text-xs text-muted-foreground text-center mt-3">
          💡 Use o teclado para calcular mais rápido
        </p>
      </TabsContent>

      <TabsContent value="history" className="mt-0">
        <div className="p-3 border-b border-border/50 flex justify-between items-center bg-secondary/20">
          <span className="text-sm text-muted-foreground">
            {history.length} cálculos salvos
          </span>
          {history.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearHistory} className="h-8 text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>
        <ScrollArea className="h-[420px]">
          {history.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
                <History className="h-8 w-8 opacity-50" />
              </div>
              <p className="font-medium">Nenhum cálculo salvo</p>
              <p className="text-sm mt-1">Seus cálculos aparecerão aqui automaticamente</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {history.map((item, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => loadFromHistory(item)}
                  className="w-full p-3 text-left hover:bg-secondary/50 transition-colors group"
                >
                  <div className="text-sm text-muted-foreground truncate font-mono group-hover:text-foreground transition-colors">
                    {item.expression}
                  </div>
                  <div className="text-xl font-bold text-primary mt-0.5 font-mono">
                    = {item.result}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                    <span>{new Date(item.timestamp).toLocaleDateString("pt-BR")}</span>
                    <span>•</span>
                    <span>{new Date(item.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
}
