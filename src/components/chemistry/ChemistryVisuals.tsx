// ============================================
// MOISÉS MEDEIROS v7.0 - ELEMENTOS DE QUÍMICA
// Visuais temáticos para todo o sistema
// ============================================

import { motion } from "framer-motion";
import { 
  Atom, 
  FlaskConical, 
  FlaskRound,
  TestTube, 
  Beaker,
  Microscope,
  Sparkles,
  Zap,
  BrainCircuit
} from "lucide-react";

// Átomo animado
export function AnimatedAtom({ size = 60, className = "" }: { size?: number; className?: string }) {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {/* Núcleo */}
      <motion.div
        className="absolute top-1/2 left-1/2 w-3 h-3 bg-primary rounded-full"
        style={{ transform: "translate(-50%, -50%)" }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      {/* Órbitas */}
      {[0, 60, 120].map((rotation, i) => (
        <motion.div
          key={i}
          className="absolute inset-0 border border-primary/40 rounded-full"
          style={{ 
            transform: `rotateZ(${rotation}deg) rotateX(60deg)`,
            transformStyle: "preserve-3d"
          }}
          animate={{ rotateZ: [rotation, rotation + 360] }}
          transition={{ duration: 4 + i, repeat: Infinity, ease: "linear" }}
        >
          <motion.div
            className="absolute w-2 h-2 bg-[hsl(var(--stats-blue))] rounded-full"
            style={{ top: "-4px", left: "50%", transform: "translateX(-50%)" }}
          />
        </motion.div>
      ))}
    </div>
  );
}

// Molécula H2O animada
export function WaterMolecule({ size = 80, className = "" }: { size?: number; className?: string }) {
  return (
    <motion.div 
      className={`relative flex items-center gap-1 ${className}`}
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 3, repeat: Infinity }}
    >
      {/* H */}
      <motion.div 
        className="w-6 h-6 rounded-full bg-[hsl(var(--stats-blue))] flex items-center justify-center text-xs font-bold text-white"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        H
      </motion.div>
      {/* Ligação */}
      <div className="w-3 h-0.5 bg-muted-foreground/50" />
      {/* O */}
      <motion.div 
        className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-white"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
      >
        O
      </motion.div>
      {/* Ligação */}
      <div className="w-3 h-0.5 bg-muted-foreground/50" />
      {/* H */}
      <motion.div 
        className="w-6 h-6 rounded-full bg-[hsl(var(--stats-blue))] flex items-center justify-center text-xs font-bold text-white"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
      >
        H
      </motion.div>
    </motion.div>
  );
}

// Erlenmeyer borbulhando
export function BubblingFlask({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <FlaskConical className="h-16 w-16 text-primary" />
      {/* Bolhas */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-[hsl(var(--stats-green))]/50"
          style={{ 
            left: `${40 + Math.random() * 20}%`, 
            bottom: "30%"
          }}
          animate={{
            y: [-10, -40],
            opacity: [1, 0],
            scale: [0.5, 1.2]
          }}
          transition={{
            duration: 1.5 + Math.random(),
            repeat: Infinity,
            delay: i * 0.3
          }}
        />
      ))}
    </div>
  );
}

// Tabela Periódica Mini
export function MiniPeriodicTable({ className = "" }: { className?: string }) {
  const elements = [
    { symbol: "H", number: 1, name: "Hidrogênio", color: "bg-[hsl(var(--stats-blue))]" },
    { symbol: "C", number: 6, name: "Carbono", color: "bg-muted-foreground" },
    { symbol: "N", number: 7, name: "Nitrogênio", color: "bg-[hsl(var(--stats-blue))]" },
    { symbol: "O", number: 8, name: "Oxigênio", color: "bg-primary" },
    { symbol: "Na", number: 11, name: "Sódio", color: "bg-[hsl(var(--stats-gold))]" },
    { symbol: "Fe", number: 26, name: "Ferro", color: "bg-[hsl(var(--stats-purple))]" },
  ];

  return (
    <div className={`grid grid-cols-3 gap-2 ${className}`}>
      {elements.map((el, i) => (
        <motion.div
          key={el.symbol}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1 }}
          whileHover={{ scale: 1.1, zIndex: 10 }}
          className={`relative p-2 rounded-lg ${el.color}/20 border border-${el.color}/30 cursor-pointer group`}
        >
          <span className="absolute top-1 left-1 text-[8px] text-muted-foreground">
            {el.number}
          </span>
          <p className="text-lg font-bold text-center text-foreground">{el.symbol}</p>
          <p className="text-[8px] text-center text-muted-foreground truncate">{el.name}</p>
        </motion.div>
      ))}
    </div>
  );
}

// Fórmula Química Animada
export function ChemicalFormula({ 
  formula, 
  className = "" 
}: { 
  formula: string; 
  className?: string 
}) {
  // Parse simples de fórmulas (H2O, CO2, etc)
  const parts = formula.split(/(\d+)/).filter(Boolean);
  
  return (
    <motion.div 
      className={`flex items-baseline font-mono text-xl ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {parts.map((part, i) => {
        const isNumber = /^\d+$/.test(part);
        return (
          <motion.span
            key={i}
            className={isNumber ? "text-sm text-primary" : "text-foreground font-bold"}
            initial={{ y: isNumber ? 10 : 0 }}
            animate={{ y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            {part}
          </motion.span>
        );
      })}
    </motion.div>
  );
}

// Reação Química Animada
export function ChemicalReaction({ 
  reactants, 
  products,
  className = ""
}: { 
  reactants: string[]; 
  products: string[];
  className?: string;
}) {
  return (
    <motion.div 
      className={`flex items-center gap-3 p-4 rounded-xl bg-secondary/30 ${className}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      {reactants.map((r, i) => (
        <span key={`r-${i}`} className="flex items-center">
          <ChemicalFormula formula={r} />
          {i < reactants.length - 1 && (
            <span className="mx-2 text-muted-foreground">+</span>
          )}
        </span>
      ))}
      
      <motion.div
        animate={{ x: [0, 5, 0] }}
        transition={{ duration: 1, repeat: Infinity }}
        className="mx-4"
      >
        <Zap className="h-5 w-5 text-[hsl(var(--stats-gold))]" />
      </motion.div>
      
      {products.map((p, i) => (
        <span key={`p-${i}`} className="flex items-center">
          <ChemicalFormula formula={p} />
          {i < products.length - 1 && (
            <span className="mx-2 text-muted-foreground">+</span>
          )}
        </span>
      ))}
    </motion.div>
  );
}

// Card de Dica Química
export function ChemistryTip({ 
  title, 
  content, 
  icon: Icon = FlaskConical 
}: { 
  title: string; 
  content: string; 
  icon?: any;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20"
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0 p-2 rounded-xl bg-primary/20">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h4 className="font-semibold text-foreground mb-1">{title}</h4>
          <p className="text-sm text-muted-foreground">{content}</p>
        </div>
      </div>
      <Sparkles className="absolute top-2 right-2 h-4 w-4 text-primary/30" />
    </motion.div>
  );
}

// DNA Helix
export function DNAHelix({ className = "" }: { className?: string }) {
  return (
    <motion.div className={`relative h-20 w-12 ${className}`}>
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-full flex justify-between items-center"
          style={{ top: `${i * 12}%` }}
          animate={{
            rotateY: [0, 360],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "linear",
            delay: i * 0.1
          }}
        >
          <div className="w-2 h-2 rounded-full bg-primary" />
          <div className="h-0.5 flex-1 bg-muted-foreground/30" />
          <div className="w-2 h-2 rounded-full bg-[hsl(var(--stats-blue))]" />
        </motion.div>
      ))}
    </motion.div>
  );
}

// Loading com Tema de Química
export function ChemistryLoader({ text = "Carregando..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Atom className="h-12 w-12 text-primary" />
        </motion.div>
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/20"
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </div>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

// Ícones de Equipamentos de Laboratório
export function LabEquipmentIcons() {
  const equipment = [
    { icon: FlaskConical, label: "Erlenmeyer" },
    { icon: FlaskRound, label: "Balão" },
    { icon: TestTube, label: "Tubo de Ensaio" },
    { icon: Beaker, label: "Béquer" },
    { icon: Microscope, label: "Microscópio" },
  ];

  return (
    <div className="flex items-center gap-4">
      {equipment.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          whileHover={{ y: -5, scale: 1.1 }}
          className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-secondary/50 cursor-pointer"
        >
          <item.icon className="h-6 w-6 text-primary" />
          <span className="text-[10px] text-muted-foreground">{item.label}</span>
        </motion.div>
      ))}
    </div>
  );
}
