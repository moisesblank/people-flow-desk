import { useState, useEffect, useCallback } from "react";
import { Calculator as CalculatorIcon, X, History, Trash2, Copy, Check } from "lucide-react";
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

interface HistoryItem {
  expression: string;
  result: string;
  timestamp: number;
}

const STORAGE_KEY = "calculator_history";

export function CalculatorButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 hover:bg-secondary"
          title="Calculadora"
        >
          <CalculatorIcon className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-4 py-3 border-b border-border bg-secondary/30">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <CalculatorIcon className="h-5 w-5 text-primary" />
            Calculadora Científica
          </DialogTitle>
        </DialogHeader>
        <CalculatorContent />
      </DialogContent>
    </Dialog>
  );
}

function CalculatorContent() {
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [memory, setMemory] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [isRadians, setIsRadians] = useState(true);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading calculator history:", e);
      }
    }
  }, []);

  // Save history to localStorage
  const saveHistory = useCallback((newHistory: HistoryItem[]) => {
    setHistory(newHistory);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
  }, []);

  const clearHistory = () => {
    saveHistory([]);
    toast.success("Histórico limpo");
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

  const handleNumber = (num: string) => {
    if (display === "0" || display === "Erro") {
      setDisplay(num);
    } else {
      setDisplay(display + num);
    }
    setExpression(expression + num);
  };

  const handleOperator = (op: string) => {
    if (display === "Erro") return;
    
    const displayOp = op === "*" ? "×" : op === "/" ? "÷" : op;
    setDisplay(display + displayOp);
    setExpression(expression + op);
  };

  const handleDecimal = () => {
    const parts = display.split(/[+\-×÷]/);
    const lastPart = parts[parts.length - 1];
    if (!lastPart.includes(".")) {
      setDisplay(display + ".");
      setExpression(expression + ".");
    }
  };

  const handleClear = () => {
    setDisplay("0");
    setExpression("");
  };

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
      setExpression(expression.slice(0, -1));
    } else {
      setDisplay("0");
      setExpression("");
    }
  };

  const handlePercent = () => {
    try {
      const value = eval(expression) / 100;
      setDisplay(String(value));
      setExpression(String(value));
    } catch {
      setDisplay("Erro");
    }
  };

  const handleToggleSign = () => {
    if (display !== "0" && display !== "Erro") {
      if (display.startsWith("-")) {
        setDisplay(display.slice(1));
        setExpression(expression.replace(/^-/, ""));
      } else {
        setDisplay("-" + display);
        setExpression("-" + expression);
      }
    }
  };

  const handleScientific = (func: string) => {
    try {
      const value = parseFloat(display) || eval(expression);
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
        case "sqrt":
          result = Math.sqrt(value);
          break;
        case "cbrt":
          result = Math.cbrt(value);
          break;
        case "log":
          result = Math.log10(value);
          break;
        case "ln":
          result = Math.log(value);
          break;
        case "exp":
          result = Math.exp(value);
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
          break;
        case "e":
          result = Math.E;
          break;
        default:
          result = value;
      }

      const formatted = formatResult(result);
      setDisplay(formatted);
      setExpression(formatted);
    } catch {
      setDisplay("Erro");
    }
  };

  const factorial = (n: number): number => {
    if (n < 0) return NaN;
    if (n === 0 || n === 1) return 1;
    if (n > 170) return Infinity;
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
  };

  const formatResult = (num: number): string => {
    if (!isFinite(num)) return "Erro";
    if (Math.abs(num) < 1e-10 && num !== 0) return num.toExponential(6);
    if (Math.abs(num) >= 1e10) return num.toExponential(6);
    const rounded = Math.round(num * 1e10) / 1e10;
    return String(rounded);
  };

  const handleEquals = () => {
    try {
      const sanitized = expression
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/\^/g, "**");
      
      const result = eval(sanitized);
      const formatted = formatResult(result);
      
      // Save to history
      const newItem: HistoryItem = {
        expression: display,
        result: formatted,
        timestamp: Date.now(),
      };
      saveHistory([newItem, ...history.slice(0, 49)]);

      setDisplay(formatted);
      setExpression(formatted);
    } catch {
      setDisplay("Erro");
      setExpression("");
    }
  };

  const handleMemory = (action: string) => {
    const value = parseFloat(display) || 0;
    switch (action) {
      case "MC":
        setMemory(0);
        toast.success("Memória limpa");
        break;
      case "MR":
        setDisplay(String(memory));
        setExpression(String(memory));
        break;
      case "M+":
        setMemory(memory + value);
        toast.success("Adicionado à memória");
        break;
      case "M-":
        setMemory(memory - value);
        toast.success("Subtraído da memória");
        break;
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    setDisplay(item.result);
    setExpression(item.result);
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") handleNumber(e.key);
      else if (e.key === "+") handleOperator("+");
      else if (e.key === "-") handleOperator("-");
      else if (e.key === "*") handleOperator("*");
      else if (e.key === "/") handleOperator("/");
      else if (e.key === ".") handleDecimal();
      else if (e.key === "Enter" || e.key === "=") handleEquals();
      else if (e.key === "Escape") handleClear();
      else if (e.key === "Backspace") handleBackspace();
      else if (e.key === "%") handlePercent();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [expression, display]);

  const CalcButton = ({ 
    children, 
    onClick, 
    variant = "default",
    className = "",
    span = 1
  }: { 
    children: React.ReactNode; 
    onClick: () => void; 
    variant?: "default" | "operator" | "function" | "equals" | "memory";
    className?: string;
    span?: number;
  }) => {
    const variants = {
      default: "bg-secondary hover:bg-secondary/80 text-foreground",
      operator: "bg-primary/20 hover:bg-primary/30 text-primary font-semibold",
      function: "bg-muted hover:bg-muted/80 text-muted-foreground text-xs",
      equals: "bg-primary hover:bg-primary/90 text-primary-foreground font-bold",
      memory: "bg-accent/50 hover:bg-accent/70 text-accent-foreground text-xs",
    };

    return (
      <button
        onClick={onClick}
        className={cn(
          "h-12 rounded-lg font-medium transition-all active:scale-95 flex items-center justify-center",
          variants[variant],
          span > 1 && "col-span-2",
          className
        )}
      >
        {children}
      </button>
    );
  };

  return (
    <Tabs defaultValue="calc" className="w-full">
      <TabsList className="w-full rounded-none border-b bg-transparent h-10">
        <TabsTrigger value="calc" className="flex-1 data-[state=active]:bg-secondary">
          <CalculatorIcon className="h-4 w-4 mr-2" />
          Calculadora
        </TabsTrigger>
        <TabsTrigger value="history" className="flex-1 data-[state=active]:bg-secondary">
          <History className="h-4 w-4 mr-2" />
          Histórico ({history.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="calc" className="mt-0 p-4">
        {/* Display */}
        <div className="bg-secondary/50 rounded-xl p-4 mb-4">
          <div className="text-right text-sm text-muted-foreground h-5 overflow-hidden">
            {expression.length > 30 ? "..." + expression.slice(-30) : expression || " "}
          </div>
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={copyToClipboard}
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
            <div className="text-right text-3xl font-bold tracking-tight overflow-hidden">
              {display.length > 12 ? display.slice(0, 12) + "..." : display}
            </div>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-3">
          <Button
            variant={isRadians ? "default" : "outline"}
            size="sm"
            className="flex-1 h-7 text-xs"
            onClick={() => setIsRadians(true)}
          >
            RAD
          </Button>
          <Button
            variant={!isRadians ? "default" : "outline"}
            size="sm"
            className="flex-1 h-7 text-xs"
            onClick={() => setIsRadians(false)}
          >
            DEG
          </Button>
        </div>

        {/* Memory Row */}
        <div className="grid grid-cols-4 gap-2 mb-2">
          <CalcButton variant="memory" onClick={() => handleMemory("MC")}>MC</CalcButton>
          <CalcButton variant="memory" onClick={() => handleMemory("MR")}>MR</CalcButton>
          <CalcButton variant="memory" onClick={() => handleMemory("M+")}>M+</CalcButton>
          <CalcButton variant="memory" onClick={() => handleMemory("M-")}>M-</CalcButton>
        </div>

        {/* Scientific Row 1 */}
        <div className="grid grid-cols-5 gap-2 mb-2">
          <CalcButton variant="function" onClick={() => handleScientific("sin")}>sin</CalcButton>
          <CalcButton variant="function" onClick={() => handleScientific("cos")}>cos</CalcButton>
          <CalcButton variant="function" onClick={() => handleScientific("tan")}>tan</CalcButton>
          <CalcButton variant="function" onClick={() => handleScientific("log")}>log</CalcButton>
          <CalcButton variant="function" onClick={() => handleScientific("ln")}>ln</CalcButton>
        </div>

        {/* Scientific Row 2 */}
        <div className="grid grid-cols-5 gap-2 mb-2">
          <CalcButton variant="function" onClick={() => handleScientific("sqrt")}>√</CalcButton>
          <CalcButton variant="function" onClick={() => handleScientific("pow2")}>x²</CalcButton>
          <CalcButton variant="function" onClick={() => handleScientific("pow3")}>x³</CalcButton>
          <CalcButton variant="function" onClick={() => handleScientific("pi")}>π</CalcButton>
          <CalcButton variant="function" onClick={() => handleScientific("e")}>e</CalcButton>
        </div>

        {/* Main Calculator */}
        <div className="grid grid-cols-4 gap-2">
          <CalcButton variant="function" onClick={handleClear}>AC</CalcButton>
          <CalcButton variant="function" onClick={handleToggleSign}>±</CalcButton>
          <CalcButton variant="function" onClick={handlePercent}>%</CalcButton>
          <CalcButton variant="operator" onClick={() => handleOperator("/")}>÷</CalcButton>

          <CalcButton onClick={() => handleNumber("7")}>7</CalcButton>
          <CalcButton onClick={() => handleNumber("8")}>8</CalcButton>
          <CalcButton onClick={() => handleNumber("9")}>9</CalcButton>
          <CalcButton variant="operator" onClick={() => handleOperator("*")}>×</CalcButton>

          <CalcButton onClick={() => handleNumber("4")}>4</CalcButton>
          <CalcButton onClick={() => handleNumber("5")}>5</CalcButton>
          <CalcButton onClick={() => handleNumber("6")}>6</CalcButton>
          <CalcButton variant="operator" onClick={() => handleOperator("-")}>−</CalcButton>

          <CalcButton onClick={() => handleNumber("1")}>1</CalcButton>
          <CalcButton onClick={() => handleNumber("2")}>2</CalcButton>
          <CalcButton onClick={() => handleNumber("3")}>3</CalcButton>
          <CalcButton variant="operator" onClick={() => handleOperator("+")}>+</CalcButton>

          <CalcButton onClick={() => handleNumber("0")} span={2}>0</CalcButton>
          <CalcButton onClick={handleDecimal}>.</CalcButton>
          <CalcButton variant="equals" onClick={handleEquals}>=</CalcButton>
        </div>
      </TabsContent>

      <TabsContent value="history" className="mt-0">
        <div className="p-2 border-b flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            {history.length} cálculos salvos
          </span>
          {history.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearHistory}>
              <Trash2 className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>
        <ScrollArea className="h-[380px]">
          {history.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum cálculo salvo</p>
              <p className="text-sm">Seus cálculos aparecerão aqui</p>
            </div>
          ) : (
            <div className="divide-y">
              {history.map((item, index) => (
                <button
                  key={index}
                  onClick={() => loadFromHistory(item)}
                  className="w-full p-3 text-left hover:bg-secondary/50 transition-colors"
                >
                  <div className="text-sm text-muted-foreground truncate">
                    {item.expression}
                  </div>
                  <div className="text-lg font-semibold text-primary">
                    = {item.result}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(item.timestamp).toLocaleString("pt-BR")}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
}
