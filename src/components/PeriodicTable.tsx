import { useState, useCallback, forwardRef } from "react";
import { Atom, X, ExternalLink, Beaker, FlaskConical, Zap, ArrowRight, Sparkles, Info, Search, MousePointer } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// Element data structure
interface Element {
  number: number;
  symbol: string;
  name: string;
  namePt: string;
  mass: number | string;
  category: string;
  phase: string;
  density?: number;
  melt?: number;
  boil?: number;
  electronegativity?: number;
  electronConfig: string;
  oxidationStates: string;
  discoveredBy?: string;
  yearDiscovered?: number | string;
  appearance?: string;
  summary: string;
  group: number;
  period: number;
}

// Complete periodic table data (118 elements) - Updated with your style
const elements: Element[] = [
  // Period 1
  { number: 1, symbol: "H", name: "Hydrogen", namePt: "hidrogênio", mass: 1, category: "nonmetal", phase: "Gas", density: 0.00008988, melt: 14.01, boil: 20.28, electronegativity: 2.20, electronConfig: "1s¹", oxidationStates: "-1, +1", discoveredBy: "Henry Cavendish", yearDiscovered: 1766, summary: "O hidrogênio é o elemento mais simples e abundante do universo.", group: 1, period: 1 },
  { number: 2, symbol: "He", name: "Helium", namePt: "hélio", mass: 4, category: "noble-gas", phase: "Gas", density: 0.0001785, melt: 0.95, boil: 4.22, electronConfig: "1s²", oxidationStates: "0", discoveredBy: "Pierre Janssen", yearDiscovered: 1868, summary: "O hélio é o segundo elemento mais abundante do universo.", group: 18, period: 1 },
  
  // Period 2
  { number: 3, symbol: "Li", name: "Lithium", namePt: "lítio", mass: 7, category: "alkali-metal", phase: "Solid", density: 0.534, melt: 453.69, boil: 1560, electronegativity: 0.98, electronConfig: "[He] 2s¹", oxidationStates: "+1", summary: "O lítio é o metal mais leve. Usado em baterias.", group: 1, period: 2 },
  { number: 4, symbol: "Be", name: "Beryllium", namePt: "berílio", mass: 9, category: "alkaline-earth", phase: "Solid", density: 1.85, melt: 1560, boil: 2742, electronegativity: 1.57, electronConfig: "[He] 2s²", oxidationStates: "+2", summary: "O berílio é um metal alcalino-terroso raro.", group: 2, period: 2 },
  { number: 5, symbol: "B", name: "Boron", namePt: "boro", mass: 11, category: "metalloid", phase: "Solid", density: 2.34, melt: 2349, boil: 4200, electronegativity: 2.04, electronConfig: "[He] 2s² 2p¹", oxidationStates: "+3", summary: "O boro é um metaloide usado em fibra de vidro.", group: 13, period: 2 },
  { number: 6, symbol: "C", name: "Carbon", namePt: "carbono", mass: 12, category: "nonmetal", phase: "Solid", density: 2.267, melt: 3823, boil: 4098, electronegativity: 2.55, electronConfig: "[He] 2s² 2p²", oxidationStates: "-4, +4", summary: "O carbono é a base da vida orgânica.", group: 14, period: 2 },
  { number: 7, symbol: "N", name: "Nitrogen", namePt: "nitrogênio", mass: 14, category: "nonmetal", phase: "Gas", density: 0.0012506, melt: 63.15, boil: 77.36, electronegativity: 3.04, electronConfig: "[He] 2s² 2p³", oxidationStates: "-3, +5", summary: "O nitrogênio compõe 78% da atmosfera.", group: 15, period: 2 },
  { number: 8, symbol: "O", name: "Oxygen", namePt: "oxigênio", mass: 16, category: "nonmetal", phase: "Gas", density: 0.001429, melt: 54.36, boil: 90.20, electronegativity: 3.44, electronConfig: "[He] 2s² 2p⁴", oxidationStates: "-2", summary: "O oxigênio é essencial para a respiração.", group: 16, period: 2 },
  { number: 9, symbol: "F", name: "Fluorine", namePt: "flúor", mass: 19, category: "halogen", phase: "Gas", density: 0.001696, melt: 53.53, boil: 85.03, electronegativity: 3.98, electronConfig: "[He] 2s² 2p⁵", oxidationStates: "-1", summary: "O flúor é o elemento mais eletronegativo.", group: 17, period: 2 },
  { number: 10, symbol: "Ne", name: "Neon", namePt: "neônio", mass: 20, category: "noble-gas", phase: "Gas", density: 0.0008999, melt: 24.56, boil: 27.07, electronConfig: "[He] 2s² 2p⁶", oxidationStates: "0", summary: "O neônio é famoso por suas luzes.", group: 18, period: 2 },
  
  // Period 3
  { number: 11, symbol: "Na", name: "Sodium", namePt: "sódio", mass: 23, category: "alkali-metal", phase: "Solid", density: 0.971, melt: 370.87, boil: 1156, electronegativity: 0.93, electronConfig: "[Ne] 3s¹", oxidationStates: "+1", summary: "O sódio é essencial para a vida. Componente do sal (NaCl).", group: 1, period: 3 },
  { number: 12, symbol: "Mg", name: "Magnesium", namePt: "magnésio", mass: 24, category: "alkaline-earth", phase: "Solid", density: 1.738, melt: 923, boil: 1363, electronegativity: 1.31, electronConfig: "[Ne] 3s²", oxidationStates: "+2", summary: "O magnésio é essencial para a vida.", group: 2, period: 3 },
  { number: 13, symbol: "Al", name: "Aluminum", namePt: "alumínio", mass: 27, category: "post-transition", phase: "Solid", density: 2.698, melt: 933.47, boil: 2792, electronegativity: 1.61, electronConfig: "[Ne] 3s² 3p¹", oxidationStates: "+3", summary: "O alumínio é o metal mais abundante na crosta terrestre.", group: 13, period: 3 },
  { number: 14, symbol: "Si", name: "Silicon", namePt: "silício", mass: 28, category: "metalloid", phase: "Solid", density: 2.3296, melt: 1687, boil: 3538, electronegativity: 1.90, electronConfig: "[Ne] 3s² 3p²", oxidationStates: "+4, -4", summary: "O silício é a base da eletrônica moderna.", group: 14, period: 3 },
  { number: 15, symbol: "P", name: "Phosphorus", namePt: "fósforo", mass: 31, category: "nonmetal", phase: "Solid", density: 1.82, melt: 317.30, boil: 553.65, electronegativity: 2.19, electronConfig: "[Ne] 3s² 3p³", oxidationStates: "-3, +3, +5", summary: "O fósforo é essencial para a vida (DNA, ATP).", group: 15, period: 3 },
  { number: 16, symbol: "S", name: "Sulfur", namePt: "enxofre", mass: 32, category: "nonmetal", phase: "Solid", density: 2.067, melt: 388.36, boil: 717.87, electronegativity: 2.58, electronConfig: "[Ne] 3s² 3p⁴", oxidationStates: "-2, +4, +6", summary: "O enxofre é essencial para a vida.", group: 16, period: 3 },
  { number: 17, symbol: "Cl", name: "Chlorine", namePt: "cloro", mass: 35.5, category: "halogen", phase: "Gas", density: 0.003214, melt: 171.65, boil: 239.11, electronegativity: 3.16, electronConfig: "[Ne] 3s² 3p⁵", oxidationStates: "-1, +1, +5, +7", summary: "O cloro é usado na purificação de água.", group: 17, period: 3 },
  { number: 18, symbol: "Ar", name: "Argon", namePt: "argônio", mass: 40, category: "noble-gas", phase: "Gas", density: 0.0017837, melt: 83.80, boil: 87.30, electronConfig: "[Ne] 3s² 3p⁶", oxidationStates: "0", summary: "O argônio é o terceiro gás mais abundante na atmosfera.", group: 18, period: 3 },
  
  // Period 4
  { number: 19, symbol: "K", name: "Potassium", namePt: "potássio", mass: 39, category: "alkali-metal", phase: "Solid", density: 0.862, melt: 336.53, boil: 1032, electronegativity: 0.82, electronConfig: "[Ar] 4s¹", oxidationStates: "+1", summary: "O potássio é essencial para nervos e músculos.", group: 1, period: 4 },
  { number: 20, symbol: "Ca", name: "Calcium", namePt: "cálcio", mass: 40, category: "alkaline-earth", phase: "Solid", density: 1.54, melt: 1115, boil: 1757, electronegativity: 1.00, electronConfig: "[Ar] 4s²", oxidationStates: "+2", summary: "O cálcio é essencial para ossos e dentes.", group: 2, period: 4 },
  { number: 21, symbol: "Sc", name: "Scandium", namePt: "escândio", mass: 45, category: "transition-metal", phase: "Solid", density: 2.989, melt: 1814, boil: 3109, electronegativity: 1.36, electronConfig: "[Ar] 3d¹ 4s²", oxidationStates: "+3", summary: "O escândio é usado em ligas de alumínio.", group: 3, period: 4 },
  { number: 22, symbol: "Ti", name: "Titanium", namePt: "titânio", mass: 48, category: "transition-metal", phase: "Solid", density: 4.54, melt: 1941, boil: 3560, electronegativity: 1.54, electronConfig: "[Ar] 3d² 4s²", oxidationStates: "+4", summary: "O titânio é forte, leve e resistente à corrosão.", group: 4, period: 4 },
  { number: 23, symbol: "V", name: "Vanadium", namePt: "vanádio", mass: 51, category: "transition-metal", phase: "Solid", density: 6.11, melt: 2183, boil: 3680, electronegativity: 1.63, electronConfig: "[Ar] 3d³ 4s²", oxidationStates: "+5", summary: "O vanádio é usado em ligas de aço.", group: 5, period: 4 },
  { number: 24, symbol: "Cr", name: "Chromium", namePt: "cromo", mass: 52, category: "transition-metal", phase: "Solid", density: 7.15, melt: 2180, boil: 2944, electronegativity: 1.66, electronConfig: "[Ar] 3d⁵ 4s¹", oxidationStates: "+3, +6", summary: "O cromo é usado em aço inoxidável e cromagem.", group: 6, period: 4 },
  { number: 25, symbol: "Mn", name: "Manganese", namePt: "manganês", mass: 55, category: "transition-metal", phase: "Solid", density: 7.44, melt: 1519, boil: 2334, electronegativity: 1.55, electronConfig: "[Ar] 3d⁵ 4s²", oxidationStates: "+2, +4, +7", summary: "O manganês é essencial para aço e baterias.", group: 7, period: 4 },
  { number: 26, symbol: "Fe", name: "Iron", namePt: "ferro", mass: 56, category: "transition-metal", phase: "Solid", density: 7.874, melt: 1811, boil: 3134, electronegativity: 1.83, electronConfig: "[Ar] 3d⁶ 4s²", oxidationStates: "+2, +3", summary: "O ferro é o metal mais utilizado.", group: 8, period: 4 },
  { number: 27, symbol: "Co", name: "Cobalt", namePt: "cobalto", mass: 59, category: "transition-metal", phase: "Solid", density: 8.86, melt: 1768, boil: 3200, electronegativity: 1.88, electronConfig: "[Ar] 3d⁷ 4s²", oxidationStates: "+2, +3", summary: "O cobalto é usado em baterias de íon-lítio.", group: 9, period: 4 },
  { number: 28, symbol: "Ni", name: "Nickel", namePt: "níquel", mass: 59, category: "transition-metal", phase: "Solid", density: 8.912, melt: 1728, boil: 3186, electronegativity: 1.91, electronConfig: "[Ar] 3d⁸ 4s²", oxidationStates: "+2", summary: "O níquel é usado em aço inoxidável e moedas.", group: 10, period: 4 },
  { number: 29, symbol: "Cu", name: "Copper", namePt: "cobre", mass: 63.5, category: "transition-metal", phase: "Solid", density: 8.96, melt: 1357.77, boil: 2835, electronegativity: 1.90, electronConfig: "[Ar] 3d¹⁰ 4s¹", oxidationStates: "+1, +2", summary: "O cobre é excelente condutor elétrico.", group: 11, period: 4 },
  { number: 30, symbol: "Zn", name: "Zinc", namePt: "zinco", mass: 65, category: "transition-metal", phase: "Solid", density: 7.134, melt: 692.68, boil: 1180, electronegativity: 1.65, electronConfig: "[Ar] 3d¹⁰ 4s²", oxidationStates: "+2", summary: "O zinco é usado em galvanização e pilhas.", group: 12, period: 4 },
  { number: 31, symbol: "Ga", name: "Gallium", namePt: "gálio", mass: 70, category: "post-transition", phase: "Solid", density: 5.907, melt: 302.91, boil: 2477, electronegativity: 1.81, electronConfig: "[Ar] 3d¹⁰ 4s² 4p¹", oxidationStates: "+3", summary: "O gálio derrete na mão (29,76°C).", group: 13, period: 4 },
  { number: 32, symbol: "Ge", name: "Germanium", namePt: "germânio", mass: 73, category: "metalloid", phase: "Solid", density: 5.323, melt: 1211.40, boil: 3106, electronegativity: 2.01, electronConfig: "[Ar] 3d¹⁰ 4s² 4p²", oxidationStates: "+4", summary: "O germânio é um semicondutor.", group: 14, period: 4 },
  { number: 33, symbol: "As", name: "Arsenic", namePt: "arsênio", mass: 75, category: "metalloid", phase: "Solid", density: 5.776, melt: 1090, boil: 887, electronegativity: 2.18, electronConfig: "[Ar] 3d¹⁰ 4s² 4p³", oxidationStates: "-3, +3, +5", summary: "O arsênio é um metaloide tóxico.", group: 15, period: 4 },
  { number: 34, symbol: "Se", name: "Selenium", namePt: "selênio", mass: 78, category: "nonmetal", phase: "Solid", density: 4.809, melt: 494, boil: 958, electronegativity: 2.55, electronConfig: "[Ar] 3d¹⁰ 4s² 4p⁴", oxidationStates: "-2, +4, +6", summary: "O selênio é um micronutriente essencial.", group: 16, period: 4 },
  { number: 35, symbol: "Br", name: "Bromine", namePt: "bromo", mass: 80, category: "halogen", phase: "Liquid", density: 3.122, melt: 265.95, boil: 332, electronegativity: 2.96, electronConfig: "[Ar] 3d¹⁰ 4s² 4p⁵", oxidationStates: "-1, +1, +5", summary: "O bromo é líquido à temperatura ambiente.", group: 17, period: 4 },
  { number: 36, symbol: "Kr", name: "Krypton", namePt: "criptônio", mass: 84, category: "noble-gas", phase: "Gas", density: 0.003733, melt: 115.79, boil: 119.93, electronConfig: "[Ar] 3d¹⁰ 4s² 4p⁶", oxidationStates: "0", summary: "O criptônio é um gás nobre.", group: 18, period: 4 },
  
  // Period 5
  { number: 37, symbol: "Rb", name: "Rubidium", namePt: "rubídio", mass: 85.5, category: "alkali-metal", phase: "Solid", electronegativity: 0.82, electronConfig: "[Kr] 5s¹", oxidationStates: "+1", summary: "O rubídio é altamente reativo.", group: 1, period: 5 },
  { number: 38, symbol: "Sr", name: "Strontium", namePt: "estrôncio", mass: 88, category: "alkaline-earth", phase: "Solid", electronegativity: 0.95, electronConfig: "[Kr] 5s²", oxidationStates: "+2", summary: "O estrôncio produz chama vermelha.", group: 2, period: 5 },
  { number: 39, symbol: "Y", name: "Yttrium", namePt: "ítrio", mass: 89, category: "transition-metal", phase: "Solid", electronegativity: 1.22, electronConfig: "[Kr] 4d¹ 5s²", oxidationStates: "+3", summary: "O ítrio é usado em LEDs e lasers.", group: 3, period: 5 },
  { number: 40, symbol: "Zr", name: "Zirconium", namePt: "zircônio", mass: 91, category: "transition-metal", phase: "Solid", electronegativity: 1.33, electronConfig: "[Kr] 4d² 5s²", oxidationStates: "+4", summary: "O zircônio é resistente à corrosão.", group: 4, period: 5 },
  { number: 41, symbol: "Nb", name: "Niobium", namePt: "nióbio", mass: 93, category: "transition-metal", phase: "Solid", electronegativity: 1.6, electronConfig: "[Kr] 4d⁴ 5s¹", oxidationStates: "+5", summary: "O Brasil é o maior produtor de nióbio.", group: 5, period: 5 },
  { number: 42, symbol: "Mo", name: "Molybdenum", namePt: "molibdênio", mass: 96, category: "transition-metal", phase: "Solid", electronegativity: 2.16, electronConfig: "[Kr] 4d⁵ 5s¹", oxidationStates: "+6", summary: "O molibdênio é usado em ligas de aço.", group: 6, period: 5 },
  { number: 43, symbol: "Tc", name: "Technetium", namePt: "tecnécio", mass: "[98]", category: "transition-metal", phase: "Solid", electronegativity: 1.9, electronConfig: "[Kr] 4d⁵ 5s²", oxidationStates: "+7", summary: "O tecnécio é radioativo.", group: 7, period: 5 },
  { number: 44, symbol: "Ru", name: "Ruthenium", namePt: "rutênio", mass: 101, category: "transition-metal", phase: "Solid", electronegativity: 2.2, electronConfig: "[Kr] 4d⁷ 5s¹", oxidationStates: "+3, +4", summary: "O rutênio é usado em catalisadores.", group: 8, period: 5 },
  { number: 45, symbol: "Rh", name: "Rhodium", namePt: "ródio", mass: 103, category: "transition-metal", phase: "Solid", electronegativity: 2.28, electronConfig: "[Kr] 4d⁸ 5s¹", oxidationStates: "+3", summary: "O ródio é usado em catalisadores automotivos.", group: 9, period: 5 },
  { number: 46, symbol: "Pd", name: "Palladium", namePt: "paládio", mass: 106.5, category: "transition-metal", phase: "Solid", electronegativity: 2.20, electronConfig: "[Kr] 4d¹⁰", oxidationStates: "+2, +4", summary: "O paládio é usado em catalisadores.", group: 10, period: 5 },
  { number: 47, symbol: "Ag", name: "Silver", namePt: "prata", mass: 108, category: "transition-metal", phase: "Solid", electronegativity: 1.93, electronConfig: "[Kr] 4d¹⁰ 5s¹", oxidationStates: "+1", summary: "A prata é o melhor condutor de eletricidade.", group: 11, period: 5 },
  { number: 48, symbol: "Cd", name: "Cadmium", namePt: "cádmio", mass: 112.5, category: "transition-metal", phase: "Solid", electronegativity: 1.69, electronConfig: "[Kr] 4d¹⁰ 5s²", oxidationStates: "+2", summary: "O cádmio é usado em baterias.", group: 12, period: 5 },
  { number: 49, symbol: "In", name: "Indium", namePt: "índio", mass: 115, category: "post-transition", phase: "Solid", electronegativity: 1.78, electronConfig: "[Kr] 4d¹⁰ 5s² 5p¹", oxidationStates: "+3", summary: "O índio é usado em telas touchscreen.", group: 13, period: 5 },
  { number: 50, symbol: "Sn", name: "Tin", namePt: "estanho", mass: 119, category: "post-transition", phase: "Solid", electronegativity: 1.96, electronConfig: "[Kr] 4d¹⁰ 5s² 5p²", oxidationStates: "+2, +4", summary: "O estanho é usado em soldas.", group: 14, period: 5 },
  { number: 51, symbol: "Sb", name: "Antimony", namePt: "antimônio", mass: 122, category: "metalloid", phase: "Solid", electronegativity: 2.05, electronConfig: "[Kr] 4d¹⁰ 5s² 5p³", oxidationStates: "-3, +3, +5", summary: "O antimônio é usado em ligas e retardantes.", group: 15, period: 5 },
  { number: 52, symbol: "Te", name: "Tellurium", namePt: "telúrio", mass: 128, category: "metalloid", phase: "Solid", electronegativity: 2.1, electronConfig: "[Kr] 4d¹⁰ 5s² 5p⁴", oxidationStates: "-2, +4, +6", summary: "O telúrio é usado em células solares.", group: 16, period: 5 },
  { number: 53, symbol: "I", name: "Iodine", namePt: "iodo", mass: 127, category: "halogen", phase: "Solid", electronegativity: 2.66, electronConfig: "[Kr] 4d¹⁰ 5s² 5p⁵", oxidationStates: "-1, +1, +5, +7", summary: "O iodo é essencial para a tireoide.", group: 17, period: 5 },
  { number: 54, symbol: "Xe", name: "Xenon", namePt: "xenônio", mass: 132, category: "noble-gas", phase: "Gas", electronConfig: "[Kr] 4d¹⁰ 5s² 5p⁶", oxidationStates: "0, +2, +4, +6", summary: "O xenônio forma compostos mesmo sendo gás nobre.", group: 18, period: 5 },
  
  // Period 6
  { number: 55, symbol: "Cs", name: "Cesium", namePt: "césio", mass: 133, category: "alkali-metal", phase: "Solid", electronegativity: 0.79, electronConfig: "[Xe] 6s¹", oxidationStates: "+1", summary: "O césio é usado em relógios atômicos.", group: 1, period: 6 },
  { number: 56, symbol: "Ba", name: "Barium", namePt: "bário", mass: 137, category: "alkaline-earth", phase: "Solid", electronegativity: 0.89, electronConfig: "[Xe] 6s²", oxidationStates: "+2", summary: "O bário produz chama verde.", group: 2, period: 6 },
  // Lanthanides 57-71
  { number: 57, symbol: "La", name: "Lanthanum", namePt: "lantânio", mass: 138.91, category: "lanthanide", phase: "Solid", electronegativity: 1.1, electronConfig: "[Xe] 5d¹ 6s²", oxidationStates: "+3", summary: "O lantânio dá nome à série dos lantanídeos.", group: 3, period: 6 },
  { number: 58, symbol: "Ce", name: "Cerium", namePt: "cério", mass: 140.12, category: "lanthanide", phase: "Solid", electronegativity: 1.12, electronConfig: "[Xe] 4f¹ 5d¹ 6s²", oxidationStates: "+3, +4", summary: "O cério é o lantanídeo mais abundante.", group: 3, period: 6 },
  { number: 59, symbol: "Pr", name: "Praseodymium", namePt: "praseodímio", mass: 140.91, category: "lanthanide", phase: "Solid", electronegativity: 1.13, electronConfig: "[Xe] 4f³ 6s²", oxidationStates: "+3", summary: "O praseodímio é usado em imãs.", group: 3, period: 6 },
  { number: 60, symbol: "Nd", name: "Neodymium", namePt: "neodímio", mass: 144.24, category: "lanthanide", phase: "Solid", electronegativity: 1.14, electronConfig: "[Xe] 4f⁴ 6s²", oxidationStates: "+3", summary: "O neodímio é usado em imãs fortes.", group: 3, period: 6 },
  { number: 61, symbol: "Pm", name: "Promethium", namePt: "promécio", mass: "[145]", category: "lanthanide", phase: "Solid", electronConfig: "[Xe] 4f⁵ 6s²", oxidationStates: "+3", summary: "O promécio é radioativo.", group: 3, period: 6 },
  { number: 62, symbol: "Sm", name: "Samarium", namePt: "samário", mass: "150.36(2)", category: "lanthanide", phase: "Solid", electronegativity: 1.17, electronConfig: "[Xe] 4f⁶ 6s²", oxidationStates: "+2, +3", summary: "O samário é usado em imãs.", group: 3, period: 6 },
  { number: 63, symbol: "Eu", name: "Europium", namePt: "európio", mass: "151.96", category: "lanthanide", phase: "Solid", electronegativity: 1.2, electronConfig: "[Xe] 4f⁷ 6s²", oxidationStates: "+2, +3", summary: "O európio é usado em LEDs.", group: 3, period: 6 },
  { number: 64, symbol: "Gd", name: "Gadolinium", namePt: "gadolínio", mass: "157.25(3)", category: "lanthanide", phase: "Solid", electronegativity: 1.2, electronConfig: "[Xe] 4f⁷ 5d¹ 6s²", oxidationStates: "+3", summary: "O gadolínio é usado em ressonância magnética.", group: 3, period: 6 },
  { number: 65, symbol: "Tb", name: "Terbium", namePt: "térbio", mass: 158.93, category: "lanthanide", phase: "Solid", electronConfig: "[Xe] 4f⁹ 6s²", oxidationStates: "+3", summary: "O térbio é usado em lasers.", group: 3, period: 6 },
  { number: 66, symbol: "Dy", name: "Dysprosium", namePt: "disprósio", mass: 162.50, category: "lanthanide", phase: "Solid", electronegativity: 1.22, electronConfig: "[Xe] 4f¹⁰ 6s²", oxidationStates: "+3", summary: "O disprósio é usado em imãs de alta performance.", group: 3, period: 6 },
  { number: 67, symbol: "Ho", name: "Holmium", namePt: "hólmio", mass: 164.93, category: "lanthanide", phase: "Solid", electronegativity: 1.23, electronConfig: "[Xe] 4f¹¹ 6s²", oxidationStates: "+3", summary: "O hólmio tem o maior momento magnético.", group: 3, period: 6 },
  { number: 68, symbol: "Er", name: "Erbium", namePt: "érbio", mass: 167.26, category: "lanthanide", phase: "Solid", electronegativity: 1.24, electronConfig: "[Xe] 4f¹² 6s²", oxidationStates: "+3", summary: "O érbio é usado em fibra óptica.", group: 3, period: 6 },
  { number: 69, symbol: "Tm", name: "Thulium", namePt: "túlio", mass: 168.93, category: "lanthanide", phase: "Solid", electronegativity: 1.25, electronConfig: "[Xe] 4f¹³ 6s²", oxidationStates: "+3", summary: "O túlio é o lantanídeo mais raro.", group: 3, period: 6 },
  { number: 70, symbol: "Yb", name: "Ytterbium", namePt: "itérbio", mass: 173.05, category: "lanthanide", phase: "Solid", electronConfig: "[Xe] 4f¹⁴ 6s²", oxidationStates: "+2, +3", summary: "O itérbio é usado em metalurgia.", group: 3, period: 6 },
  { number: 71, symbol: "Lu", name: "Lutetium", namePt: "lutécio", mass: 174.97, category: "lanthanide", phase: "Solid", electronegativity: 1.27, electronConfig: "[Xe] 4f¹⁴ 5d¹ 6s²", oxidationStates: "+3", summary: "O lutécio é o último lantanídeo.", group: 3, period: 6 },
  // Continue period 6
  { number: 72, symbol: "Hf", name: "Hafnium", namePt: "háfnio", mass: 178.5, category: "transition-metal", phase: "Solid", electronegativity: 1.3, electronConfig: "[Xe] 4f¹⁴ 5d² 6s²", oxidationStates: "+4", summary: "O háfnio é usado em reatores nucleares.", group: 4, period: 6 },
  { number: 73, symbol: "Ta", name: "Tantalum", namePt: "tântalo", mass: 181, category: "transition-metal", phase: "Solid", electronegativity: 1.5, electronConfig: "[Xe] 4f¹⁴ 5d³ 6s²", oxidationStates: "+5", summary: "O tântalo é usado em capacitores eletrônicos.", group: 5, period: 6 },
  { number: 74, symbol: "W", name: "Tungsten", namePt: "tungstênio", mass: 184, category: "transition-metal", phase: "Solid", electronegativity: 2.36, electronConfig: "[Xe] 4f¹⁴ 5d⁴ 6s²", oxidationStates: "+6", summary: "O tungstênio tem o maior ponto de fusão.", group: 6, period: 6 },
  { number: 75, symbol: "Re", name: "Rhenium", namePt: "rênio", mass: 186, category: "transition-metal", phase: "Solid", electronegativity: 1.9, electronConfig: "[Xe] 4f¹⁴ 5d⁵ 6s²", oxidationStates: "+7", summary: "O rênio é usado em turbinas de avião.", group: 7, period: 6 },
  { number: 76, symbol: "Os", name: "Osmium", namePt: "ósmio", mass: 190, category: "transition-metal", phase: "Solid", electronegativity: 2.2, electronConfig: "[Xe] 4f¹⁴ 5d⁶ 6s²", oxidationStates: "+4, +8", summary: "O ósmio é o elemento mais denso.", group: 8, period: 6 },
  { number: 77, symbol: "Ir", name: "Iridium", namePt: "irídio", mass: 192, category: "transition-metal", phase: "Solid", electronegativity: 2.2, electronConfig: "[Xe] 4f¹⁴ 5d⁷ 6s²", oxidationStates: "+3, +4", summary: "O irídio é usado em velas de ignição.", group: 9, period: 6 },
  { number: 78, symbol: "Pt", name: "Platinum", namePt: "platina", mass: 195, category: "transition-metal", phase: "Solid", electronegativity: 2.28, electronConfig: "[Xe] 4f¹⁴ 5d⁹ 6s¹", oxidationStates: "+2, +4", summary: "A platina é usada em joias e catalisadores.", group: 10, period: 6 },
  { number: 79, symbol: "Au", name: "Gold", namePt: "ouro", mass: 197, category: "transition-metal", phase: "Solid", electronegativity: 2.54, electronConfig: "[Xe] 4f¹⁴ 5d¹⁰ 6s¹", oxidationStates: "+1, +3", summary: "O ouro é usado em joias e eletrônica.", group: 11, period: 6 },
  { number: 80, symbol: "Hg", name: "Mercury", namePt: "mercúrio", mass: 200.5, category: "transition-metal", phase: "Liquid", electronegativity: 2.0, electronConfig: "[Xe] 4f¹⁴ 5d¹⁰ 6s²", oxidationStates: "+1, +2", summary: "O mercúrio é líquido à temperatura ambiente.", group: 12, period: 6 },
  { number: 81, symbol: "Tl", name: "Thallium", namePt: "tálio", mass: 204, category: "post-transition", phase: "Solid", electronegativity: 1.62, electronConfig: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p¹", oxidationStates: "+1, +3", summary: "O tálio é extremamente tóxico.", group: 13, period: 6 },
  { number: 82, symbol: "Pb", name: "Lead", namePt: "chumbo", mass: 207, category: "post-transition", phase: "Solid", electronegativity: 2.33, electronConfig: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p²", oxidationStates: "+2, +4", summary: "O chumbo é usado em baterias.", group: 14, period: 6 },
  { number: 83, symbol: "Bi", name: "Bismuth", namePt: "bismuto", mass: 209, category: "post-transition", phase: "Solid", electronegativity: 2.02, electronConfig: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p³", oxidationStates: "+3, +5", summary: "O bismuto forma cristais coloridos.", group: 15, period: 6 },
  { number: 84, symbol: "Po", name: "Polonium", namePt: "polônio", mass: "[209]", category: "metalloid", phase: "Solid", electronegativity: 2.0, electronConfig: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁴", oxidationStates: "+2, +4", summary: "O polônio é altamente radioativo.", group: 16, period: 6 },
  { number: 85, symbol: "At", name: "Astatine", namePt: "astato", mass: "[210]", category: "halogen", phase: "Solid", electronegativity: 2.2, electronConfig: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁵", oxidationStates: "-1, +1", summary: "O astato é o halogênio mais raro.", group: 17, period: 6 },
  { number: 86, symbol: "Rn", name: "Radon", namePt: "radônio", mass: "[222]", category: "noble-gas", phase: "Gas", electronConfig: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁶", oxidationStates: "0", summary: "O radônio é um gás radioativo.", group: 18, period: 6 },
  
  // Period 7
  { number: 87, symbol: "Fr", name: "Francium", namePt: "frâncio", mass: "[223]", category: "alkali-metal", phase: "Solid", electronegativity: 0.7, electronConfig: "[Rn] 7s¹", oxidationStates: "+1", summary: "O frâncio é o metal alcalino mais raro.", group: 1, period: 7 },
  { number: 88, symbol: "Ra", name: "Radium", namePt: "rádio", mass: "[226]", category: "alkaline-earth", phase: "Solid", electronegativity: 0.9, electronConfig: "[Rn] 7s²", oxidationStates: "+2", summary: "O rádio foi descoberto por Marie Curie.", group: 2, period: 7 },
  // Actinides 89-103
  { number: 89, symbol: "Ac", name: "Actinium", namePt: "actínio", mass: "[227]", category: "actinide", phase: "Solid", electronegativity: 1.1, electronConfig: "[Rn] 6d¹ 7s²", oxidationStates: "+3", summary: "O actínio dá nome à série dos actinídeos.", group: 3, period: 7 },
  { number: 90, symbol: "Th", name: "Thorium", namePt: "tório", mass: 232.04, category: "actinide", phase: "Solid", electronegativity: 1.3, electronConfig: "[Rn] 6d² 7s²", oxidationStates: "+4", summary: "O tório pode ser usado como combustível nuclear.", group: 3, period: 7 },
  { number: 91, symbol: "Pa", name: "Protactinium", namePt: "protactínio", mass: 231.04, category: "actinide", phase: "Solid", electronegativity: 1.5, electronConfig: "[Rn] 5f² 6d¹ 7s²", oxidationStates: "+5", summary: "O protactínio é muito raro.", group: 3, period: 7 },
  { number: 92, symbol: "U", name: "Uranium", namePt: "urânio", mass: 238.03, category: "actinide", phase: "Solid", electronegativity: 1.38, electronConfig: "[Rn] 5f³ 6d¹ 7s²", oxidationStates: "+4, +6", summary: "O urânio é usado em reatores nucleares.", group: 3, period: 7 },
  { number: 93, symbol: "Np", name: "Neptunium", namePt: "netúnio", mass: "[237]", category: "actinide", phase: "Solid", electronegativity: 1.36, electronConfig: "[Rn] 5f⁴ 6d¹ 7s²", oxidationStates: "+5", summary: "O netúnio é um subproduto de reatores.", group: 3, period: 7 },
  { number: 94, symbol: "Pu", name: "Plutonium", namePt: "plutônio", mass: "[244]", category: "actinide", phase: "Solid", electronegativity: 1.28, electronConfig: "[Rn] 5f⁶ 7s²", oxidationStates: "+4, +6", summary: "O plutônio é usado em armas nucleares.", group: 3, period: 7 },
  { number: 95, symbol: "Am", name: "Americium", namePt: "amerício", mass: "[243]", category: "actinide", phase: "Solid", electronegativity: 1.3, electronConfig: "[Rn] 5f⁷ 7s²", oxidationStates: "+3", summary: "O amerício é usado em detectores de fumaça.", group: 3, period: 7 },
  { number: 96, symbol: "Cm", name: "Curium", namePt: "cúrio", mass: "[247]", category: "actinide", phase: "Solid", electronegativity: 1.3, electronConfig: "[Rn] 5f⁷ 6d¹ 7s²", oxidationStates: "+3", summary: "O cúrio foi nomeado em homenagem a Marie Curie.", group: 3, period: 7 },
  { number: 97, symbol: "Bk", name: "Berkelium", namePt: "berquélio", mass: "[247]", category: "actinide", phase: "Solid", electronegativity: 1.3, electronConfig: "[Rn] 5f⁹ 7s²", oxidationStates: "+3, +4", summary: "O berquélio foi produzido em Berkeley.", group: 3, period: 7 },
  { number: 98, symbol: "Cf", name: "Californium", namePt: "califórnio", mass: "[251]", category: "actinide", phase: "Solid", electronegativity: 1.3, electronConfig: "[Rn] 5f¹⁰ 7s²", oxidationStates: "+3", summary: "O califórnio é usado em análise de minérios.", group: 3, period: 7 },
  { number: 99, symbol: "Es", name: "Einsteinium", namePt: "einstênio", mass: "[252]", category: "actinide", phase: "Solid", electronConfig: "[Rn] 5f¹¹ 7s²", oxidationStates: "+3", summary: "O einstênio foi descoberto em testes nucleares.", group: 3, period: 7 },
  { number: 100, symbol: "Fm", name: "Fermium", namePt: "férmio", mass: "[257]", category: "actinide", phase: "Solid", electronConfig: "[Rn] 5f¹² 7s²", oxidationStates: "+3", summary: "O férmio foi nomeado em homenagem a Enrico Fermi.", group: 3, period: 7 },
  { number: 101, symbol: "Md", name: "Mendelevium", namePt: "mendelévio", mass: "[258]", category: "actinide", phase: "Solid", electronConfig: "[Rn] 5f¹³ 7s²", oxidationStates: "+3", summary: "O mendelévio foi nomeado em homenagem a Mendeleev.", group: 3, period: 7 },
  { number: 102, symbol: "No", name: "Nobelium", namePt: "nobélio", mass: "[259]", category: "actinide", phase: "Solid", electronConfig: "[Rn] 5f¹⁴ 7s²", oxidationStates: "+2, +3", summary: "O nobélio foi nomeado em homenagem a Alfred Nobel.", group: 3, period: 7 },
  { number: 103, symbol: "Lr", name: "Lawrencium", namePt: "laurêncio", mass: "[262]", category: "actinide", phase: "Solid", electronConfig: "[Rn] 5f¹⁴ 7s² 7p¹", oxidationStates: "+3", summary: "O laurêncio é o último actinídeo.", group: 3, period: 7 },
  // Continue period 7
  { number: 104, symbol: "Rf", name: "Rutherfordium", namePt: "rutherfórdio", mass: "[261]", category: "transition-metal", phase: "Solid", electronConfig: "[Rn] 5f¹⁴ 6d² 7s²", oxidationStates: "+4", summary: "O rutherfórdio é um elemento sintético.", group: 4, period: 7 },
  { number: 105, symbol: "Db", name: "Dubnium", namePt: "dúbnio", mass: "[262]", category: "transition-metal", phase: "Solid", electronConfig: "[Rn] 5f¹⁴ 6d³ 7s²", oxidationStates: "+5", summary: "O dúbnio foi nomeado em homenagem a Dubna.", group: 5, period: 7 },
  { number: 106, symbol: "Sg", name: "Seaborgium", namePt: "seabórgio", mass: "[269]", category: "transition-metal", phase: "Solid", electronConfig: "[Rn] 5f¹⁴ 6d⁴ 7s²", oxidationStates: "+6", summary: "O seabórgio foi nomeado em homenagem a Glenn Seaborg.", group: 6, period: 7 },
  { number: 107, symbol: "Bh", name: "Bohrium", namePt: "bóhrio", mass: "[270]", category: "transition-metal", phase: "Solid", electronConfig: "[Rn] 5f¹⁴ 6d⁵ 7s²", oxidationStates: "+7", summary: "O bóhrio foi nomeado em homenagem a Niels Bohr.", group: 7, period: 7 },
  { number: 108, symbol: "Hs", name: "Hassium", namePt: "hássio", mass: "[269]", category: "transition-metal", phase: "Solid", electronConfig: "[Rn] 5f¹⁴ 6d⁶ 7s²", oxidationStates: "+8", summary: "O hássio foi nomeado em homenagem a Hesse.", group: 8, period: 7 },
  { number: 109, symbol: "Mt", name: "Meitnerium", namePt: "meitnério", mass: "[278]", category: "transition-metal", phase: "Solid", electronConfig: "[Rn] 5f¹⁴ 6d⁷ 7s²", oxidationStates: "+9", summary: "O meitnério foi nomeado em homenagem a Lise Meitner.", group: 9, period: 7 },
  { number: 110, symbol: "Ds", name: "Darmstadtium", namePt: "darmstádtio", mass: "[281]", category: "transition-metal", phase: "Solid", electronConfig: "[Rn] 5f¹⁴ 6d⁸ 7s²", oxidationStates: "+8", summary: "O darmstádtio foi criado em Darmstadt.", group: 10, period: 7 },
  { number: 111, symbol: "Rg", name: "Roentgenium", namePt: "roentgênio", mass: "[281]", category: "transition-metal", phase: "Solid", electronConfig: "[Rn] 5f¹⁴ 6d⁹ 7s²", oxidationStates: "+3", summary: "O roentgênio foi nomeado em homenagem a Röntgen.", group: 11, period: 7 },
  { number: 112, symbol: "Cn", name: "Copernicium", namePt: "copernício", mass: "[285]", category: "transition-metal", phase: "Solid", electronConfig: "[Rn] 5f¹⁴ 6d¹⁰ 7s²", oxidationStates: "+2", summary: "O copernício foi nomeado em homenagem a Copérnico.", group: 12, period: 7 },
  { number: 113, symbol: "Nh", name: "Nihonium", namePt: "nihônio", mass: "[286]", category: "post-transition", phase: "Solid", electronConfig: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p¹", oxidationStates: "+1", summary: "O nihônio foi descoberto no Japão.", group: 13, period: 7 },
  { number: 114, symbol: "Fl", name: "Flerovium", namePt: "fleróvio", mass: "[289]", category: "post-transition", phase: "Solid", electronConfig: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p²", oxidationStates: "+2", summary: "O fleróvio é um elemento sintético.", group: 14, period: 7 },
  { number: 115, symbol: "Mc", name: "Moscovium", namePt: "moscóvio", mass: "[288]", category: "post-transition", phase: "Solid", electronConfig: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p³", oxidationStates: "+1, +3", summary: "O moscóvio foi nomeado em homenagem a Moscou.", group: 15, period: 7 },
  { number: 116, symbol: "Lv", name: "Livermorium", namePt: "livermório", mass: "[293]", category: "post-transition", phase: "Solid", electronConfig: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁴", oxidationStates: "+2, +4", summary: "O livermório foi nomeado em homenagem a Livermore.", group: 16, period: 7 },
  { number: 117, symbol: "Ts", name: "Tennessine", namePt: "tenessino", mass: "[294]", category: "halogen", phase: "Solid", electronConfig: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁵", oxidationStates: "-1, +1", summary: "O tenessino foi descoberto no Tennessee.", group: 17, period: 7 },
  { number: 118, symbol: "Og", name: "Oganesson", namePt: "oganessônio", mass: "[294]", category: "noble-gas", phase: "Solid", electronConfig: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁶", oxidationStates: "0", summary: "O oganessônio é o elemento mais pesado conhecido.", group: 18, period: 7 },
];

// Color scheme based on your images - matching Moises Medeiros style
const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  "alkali-metal": { bg: "bg-teal-500/90", text: "text-white", border: "border-teal-600" },
  "alkaline-earth": { bg: "bg-teal-400/90", text: "text-white", border: "border-teal-500" },
  "transition-metal": { bg: "bg-sky-400/90", text: "text-white", border: "border-sky-500" },
  "post-transition": { bg: "bg-teal-300/90", text: "text-slate-800", border: "border-teal-400" },
  "metalloid": { bg: "bg-amber-300/90", text: "text-slate-800", border: "border-amber-400" },
  "nonmetal": { bg: "bg-rose-300/90", text: "text-slate-800", border: "border-rose-400" },
  "halogen": { bg: "bg-rose-400/90", text: "text-white", border: "border-rose-500" },
  "noble-gas": { bg: "bg-violet-400/90", text: "text-white", border: "border-violet-500" },
  "lanthanide": { bg: "bg-pink-400/90", text: "text-white", border: "border-pink-500" },
  "actinide": { bg: "bg-rose-500/90", text: "text-white", border: "border-rose-600" },
};

const categoryNamesPt: Record<string, string> = {
  "alkali-metal": "Metais Alcalinos",
  "alkaline-earth": "Metais Alcalino-Terrosos",
  "transition-metal": "Metais de Transição",
  "post-transition": "Metais Representativos",
  "metalloid": "Semi-metais",
  "nonmetal": "Não-metais",
  "halogen": "Halogênios",
  "noble-gas": "Gases Nobres",
  "lanthanide": "Lantanídeos",
  "actinide": "Actinídeos",
};

// Anions data from your second image
const anionsData = {
  halogenios: [
    { formula: "F⁻", name: "Fluoreto" },
    { formula: "Cl⁻", name: "Cloreto" },
    { formula: "Br⁻", name: "Brometo" },
    { formula: "I⁻", name: "Iodeto" },
    { formula: "ClO⁻", name: "Hipoclorito" },
    { formula: "ClO₂⁻", name: "Clorito" },
    { formula: "ClO₃⁻", name: "Clorato" },
    { formula: "ClO₄⁻", name: "Perclorato" },
    { formula: "BrO⁻", name: "Hipobromito" },
    { formula: "BrO₃⁻", name: "Bromato" },
    { formula: "IO⁻", name: "Hipoiodito" },
    { formula: "IO₃⁻", name: "Iodato" },
    { formula: "IO₄⁻", name: "Periodato" },
  ],
  carbono: [
    { formula: "CN⁻", name: "Cianeto" },
    { formula: "CNO⁻", name: "Cianato" },
    { formula: "CNS⁻", name: "Tiocianato" },
    { formula: "C₂H₃O₂⁻", name: "Acetato" },
    { formula: "CO₃²⁻", name: "Carbonato" },
    { formula: "HCO⁻", name: "Formiato" },
    { formula: "C₂O₄²⁻", name: "Oxalato" },
    { formula: "[Fe(CN)₆]³⁻", name: "Ferricianeto" },
    { formula: "[Fe(CN)₆]⁴⁻", name: "Ferrocianeto" },
    { formula: "C⁴⁻", name: "Carbeto / Metaneto" },
    { formula: "C₂²⁻", name: "Carbeto / Acetileto" },
  ],
  nitrogenio: [
    { formula: "NO₂⁻", name: "Nitrito" },
    { formula: "NO₃⁻", name: "Nitrato" },
    { formula: "N₃⁻", name: "Azoteto / Azida" },
    { formula: "N³⁻", name: "Nitreto" },
  ],
  fosforo: [
    { formula: "PO₃³⁻", name: "Metafosfato" },
    { formula: "H₂PO₂⁻", name: "Hipofosfito" },
    { formula: "HPO₃²⁻", name: "Fosfito" },
    { formula: "PO₄³⁻", name: "Ortofosfato" },
    { formula: "P³⁻", name: "Fosfeto" },
    { formula: "P₂O₇⁴⁻", name: "Pirofosfato" },
    { formula: "P₂O⁴⁻", name: "Hipofosfato" },
  ],
  enxofre: [
    { formula: "S²⁻", name: "Sulfeto" },
    { formula: "SO₄²⁻", name: "Sulfato" },
    { formula: "SO₃²⁻", name: "Sulfito" },
    { formula: "S₂O₃²⁻", name: "Tiossulfato" },
    { formula: "S₂O₄²⁻", name: "Hipossulfito" },
    { formula: "S₂O₈²⁻", name: "Persulfato" },
    { formula: "S₄O₆²⁻", name: "Tetrationato" },
  ],
};

const nomenclaturas = [
  { formula: "H₂SO₄", name: "Ácido Sulfúrico", suffix: "ICO" },
  { formula: "H₂SO₃", name: "Ácido Sulfuroso", suffix: "OSO" },
  { formula: "H₂CO₃", name: "Ácido Carbônico", suffix: "ICO" },
  { formula: "HNO₃", name: "Ácido Nítrico", suffix: "ICO" },
  { formula: "CaCO₃", name: "Carbonato de Cálcio", suffix: "" },
  { formula: "NaHCO₃", name: "Bicarbonato de Sódio", suffix: "" },
];

const cationsVariaveis = [
  "Cu +1 e Cu +2",
  "Au +1 e Au +3",
  "Fe +2 e Fe +3",
  "Sn +2 e Sn +4",
  "Pb +2 e Pb +4",
];

// ForwardRef wrapper para compatibilidade com TooltipTrigger/Radix
export const PeriodicTableButton = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  (props, ref) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div ref={ref} {...props}>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 hover:bg-red-600/30 transition-all duration-200 group"
              title="Tabela Periódica"
            >
              <Atom className="h-5 w-5 text-red-600 group-hover:text-red-500 group-hover:scale-110 group-hover:rotate-180 transition-all duration-500" />
            </Button>
          </DialogTrigger>
          <DialogContent className="dark w-[98vw] max-w-[98vw] md:max-w-[95vw] lg:max-w-[1500px] h-[95vh] max-h-[95vh] p-0 gap-0 overflow-hidden bg-slate-900 text-slate-50 border-primary/30">
            <DialogHeader className="px-2 sm:px-4 py-2 sm:py-3 border-b border-border/50 bg-gradient-to-r from-teal-600 via-sky-600 to-violet-600">
              <DialogTitle className="flex items-center gap-2 sm:gap-3 text-sm sm:text-lg text-white">
                <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white/20 backdrop-blur shrink-0">
                  <Atom className="h-4 w-4 sm:h-6 sm:w-6" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-sm sm:text-xl truncate">CLASSIFICAÇÃO PERIÓDICA DOS ELEMENTOS</span>
                  <span className="text-[10px] sm:text-xs text-white/80 font-normal truncate">Moisés Medeiros • Curso de Química • IUPAC 2024</span>
                </div>
              </DialogTitle>
            </DialogHeader>
            <PeriodicTableContent />
          </DialogContent>
        </Dialog>
      </div>
    );
  }
);
PeriodicTableButton.displayName = 'PeriodicTableButton';

// Dados simplificados para a tabela interativa
interface ElementoInterativo {
  numero: number;
  simbolo: string;
  nome: string;
  massaAtomica: number;
  categoria: string;
  grupo: number;
  periodo: number;
  configuracaoEletronica: string;
  eletronegatividade?: number;
  pontoFusao?: number;
  pontoEbulicao?: number;
}

const elementosInterativos: ElementoInterativo[] = [
  { numero: 1, simbolo: "H", nome: "Hidrogênio", massaAtomica: 1.008, categoria: "nao-metal", grupo: 1, periodo: 1, configuracaoEletronica: "1s¹", eletronegatividade: 2.2, pontoFusao: -259, pontoEbulicao: -253 },
  { numero: 2, simbolo: "He", nome: "Hélio", massaAtomica: 4.003, categoria: "gas-nobre", grupo: 18, periodo: 1, configuracaoEletronica: "1s²", pontoFusao: -272, pontoEbulicao: -269 },
  { numero: 3, simbolo: "Li", nome: "Lítio", massaAtomica: 6.941, categoria: "metal-alcalino", grupo: 1, periodo: 2, configuracaoEletronica: "1s² 2s¹", eletronegatividade: 0.98, pontoFusao: 180, pontoEbulicao: 1342 },
  { numero: 4, simbolo: "Be", nome: "Berílio", massaAtomica: 9.012, categoria: "metal-alcalino-terroso", grupo: 2, periodo: 2, configuracaoEletronica: "1s² 2s²", eletronegatividade: 1.57, pontoFusao: 1287, pontoEbulicao: 2469 },
  { numero: 5, simbolo: "B", nome: "Boro", massaAtomica: 10.81, categoria: "semi-metal", grupo: 13, periodo: 2, configuracaoEletronica: "1s² 2s² 2p¹", eletronegatividade: 2.04, pontoFusao: 2076, pontoEbulicao: 3927 },
  { numero: 6, simbolo: "C", nome: "Carbono", massaAtomica: 12.011, categoria: "nao-metal", grupo: 14, periodo: 2, configuracaoEletronica: "1s² 2s² 2p²", eletronegatividade: 2.55, pontoFusao: 3550, pontoEbulicao: 4827 },
  { numero: 7, simbolo: "N", nome: "Nitrogênio", massaAtomica: 14.007, categoria: "nao-metal", grupo: 15, periodo: 2, configuracaoEletronica: "1s² 2s² 2p³", eletronegatividade: 3.04, pontoFusao: -210, pontoEbulicao: -196 },
  { numero: 8, simbolo: "O", nome: "Oxigênio", massaAtomica: 15.999, categoria: "nao-metal", grupo: 16, periodo: 2, configuracaoEletronica: "1s² 2s² 2p⁴", eletronegatividade: 3.44, pontoFusao: -218, pontoEbulicao: -183 },
  { numero: 9, simbolo: "F", nome: "Flúor", massaAtomica: 18.998, categoria: "halogenio", grupo: 17, periodo: 2, configuracaoEletronica: "1s² 2s² 2p⁵", eletronegatividade: 3.98, pontoFusao: -220, pontoEbulicao: -188 },
  { numero: 10, simbolo: "Ne", nome: "Neônio", massaAtomica: 20.180, categoria: "gas-nobre", grupo: 18, periodo: 2, configuracaoEletronica: "1s² 2s² 2p⁶", pontoFusao: -249, pontoEbulicao: -246 },
  { numero: 11, simbolo: "Na", nome: "Sódio", massaAtomica: 22.990, categoria: "metal-alcalino", grupo: 1, periodo: 3, configuracaoEletronica: "1s² 2s² 2p⁶ 3s¹", eletronegatividade: 0.93, pontoFusao: 98, pontoEbulicao: 883 },
  { numero: 12, simbolo: "Mg", nome: "Magnésio", massaAtomica: 24.305, categoria: "metal-alcalino-terroso", grupo: 2, periodo: 3, configuracaoEletronica: "1s² 2s² 2p⁶ 3s²", eletronegatividade: 1.31, pontoFusao: 650, pontoEbulicao: 1090 },
  { numero: 13, simbolo: "Al", nome: "Alumínio", massaAtomica: 26.982, categoria: "metal-representativo", grupo: 13, periodo: 3, configuracaoEletronica: "[Ne] 3s² 3p¹", eletronegatividade: 1.61, pontoFusao: 660, pontoEbulicao: 2519 },
  { numero: 14, simbolo: "Si", nome: "Silício", massaAtomica: 28.086, categoria: "semi-metal", grupo: 14, periodo: 3, configuracaoEletronica: "[Ne] 3s² 3p²", eletronegatividade: 1.90, pontoFusao: 1414, pontoEbulicao: 3265 },
  { numero: 17, simbolo: "Cl", nome: "Cloro", massaAtomica: 35.45, categoria: "halogenio", grupo: 17, periodo: 3, configuracaoEletronica: "[Ne] 3s² 3p⁵", eletronegatividade: 3.16, pontoFusao: -101, pontoEbulicao: -34 },
  { numero: 18, simbolo: "Ar", nome: "Argônio", massaAtomica: 39.948, categoria: "gas-nobre", grupo: 18, periodo: 3, configuracaoEletronica: "[Ne] 3s² 3p⁶", pontoFusao: -189, pontoEbulicao: -186 },
  { numero: 19, simbolo: "K", nome: "Potássio", massaAtomica: 39.098, categoria: "metal-alcalino", grupo: 1, periodo: 4, configuracaoEletronica: "[Ar] 4s¹", eletronegatividade: 0.82, pontoFusao: 64, pontoEbulicao: 759 },
  { numero: 20, simbolo: "Ca", nome: "Cálcio", massaAtomica: 40.078, categoria: "metal-alcalino-terroso", grupo: 2, periodo: 4, configuracaoEletronica: "[Ar] 4s²", eletronegatividade: 1.00, pontoFusao: 842, pontoEbulicao: 1484 },
  { numero: 26, simbolo: "Fe", nome: "Ferro", massaAtomica: 55.845, categoria: "metal-transicao", grupo: 8, periodo: 4, configuracaoEletronica: "[Ar] 3d⁶ 4s²", eletronegatividade: 1.83, pontoFusao: 1538, pontoEbulicao: 2862 },
  { numero: 29, simbolo: "Cu", nome: "Cobre", massaAtomica: 63.546, categoria: "metal-transicao", grupo: 11, periodo: 4, configuracaoEletronica: "[Ar] 3d¹⁰ 4s¹", eletronegatividade: 1.90, pontoFusao: 1085, pontoEbulicao: 2562 },
  { numero: 30, simbolo: "Zn", nome: "Zinco", massaAtomica: 65.38, categoria: "metal-transicao", grupo: 12, periodo: 4, configuracaoEletronica: "[Ar] 3d¹⁰ 4s²", eletronegatividade: 1.65, pontoFusao: 420, pontoEbulicao: 907 },
  { numero: 35, simbolo: "Br", nome: "Bromo", massaAtomica: 79.904, categoria: "halogenio", grupo: 17, periodo: 4, configuracaoEletronica: "[Ar] 3d¹⁰ 4s² 4p⁵", eletronegatividade: 2.96, pontoFusao: -7, pontoEbulicao: 59 },
  { numero: 47, simbolo: "Ag", nome: "Prata", massaAtomica: 107.87, categoria: "metal-transicao", grupo: 11, periodo: 5, configuracaoEletronica: "[Kr] 4d¹⁰ 5s¹", eletronegatividade: 1.93, pontoFusao: 962, pontoEbulicao: 2162 },
  { numero: 53, simbolo: "I", nome: "Iodo", massaAtomica: 126.90, categoria: "halogenio", grupo: 17, periodo: 5, configuracaoEletronica: "[Kr] 4d¹⁰ 5s² 5p⁵", eletronegatividade: 2.66, pontoFusao: 114, pontoEbulicao: 184 },
  { numero: 79, simbolo: "Au", nome: "Ouro", massaAtomica: 196.97, categoria: "metal-transicao", grupo: 11, periodo: 6, configuracaoEletronica: "[Xe] 4f¹⁴ 5d¹⁰ 6s¹", eletronegatividade: 2.54, pontoFusao: 1064, pontoEbulicao: 2856 },
  { numero: 80, simbolo: "Hg", nome: "Mercúrio", massaAtomica: 200.59, categoria: "metal-transicao", grupo: 12, periodo: 6, configuracaoEletronica: "[Xe] 4f¹⁴ 5d¹⁰ 6s²", eletronegatividade: 2.00, pontoFusao: -39, pontoEbulicao: 357 },
  { numero: 82, simbolo: "Pb", nome: "Chumbo", massaAtomica: 207.2, categoria: "metal-representativo", grupo: 14, periodo: 6, configuracaoEletronica: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p²", eletronegatividade: 2.33, pontoFusao: 327, pontoEbulicao: 1749 },
];

const categoriaInterativaCores: Record<string, string> = {
  "metal-alcalino": "bg-red-500",
  "metal-alcalino-terroso": "bg-orange-500",
  "metal-transicao": "bg-yellow-500",
  "metal-representativo": "bg-emerald-500",
  "nao-metal": "bg-green-500",
  "semi-metal": "bg-cyan-500",
  "halogenio": "bg-teal-500",
  "gas-nobre": "bg-purple-500",
};

function InteractiveTableContent() {
  const [busca, setBusca] = useState("");
  const [elementoSelecionado, setElementoSelecionado] = useState<ElementoInterativo | null>(null);

  const elementosFiltrados = elementosInterativos.filter(e =>
    e.nome.toLowerCase().includes(busca.toLowerCase()) ||
    e.simbolo.toLowerCase().includes(busca.toLowerCase()) ||
    e.numero.toString().includes(busca)
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-50">
            <Atom className="w-7 h-7 text-primary" />
            Tabela Periódica Interativa
          </h2>
          <p className="text-muted-foreground">Explore os elementos e suas propriedades</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text"
            placeholder="Buscar elemento..." 
            className="w-full pl-10 pr-4 py-2 rounded-lg border bg-slate-800 border-slate-700 text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      </div>

      {/* Grid de Elementos */}
      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-2">
        {elementosFiltrados.map((elemento) => (
          <motion.div
            key={elemento.numero}
            whileHover={{ scale: 1.1, zIndex: 10 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setElementoSelecionado(elemento)}
            className={cn(
              "cursor-pointer p-2 rounded-lg text-center text-white shadow-lg hover:shadow-xl transition-shadow relative",
              categoriaInterativaCores[elemento.categoria] || "bg-gray-500"
            )}
          >
            <div className="text-xs opacity-75">{elemento.numero}</div>
            <div className="text-2xl font-bold">{elemento.simbolo}</div>
            <div className="text-xs truncate">{elemento.nome}</div>
          </motion.div>
        ))}
      </div>

      {/* Legenda de Categorias */}
      <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
        <h3 className="font-semibold mb-3 text-slate-50">Legenda</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(categoriaInterativaCores).map(([categoria, cor]) => (
            <span key={categoria} className={cn("px-3 py-1.5 rounded-full text-xs font-semibold text-white", cor)}>
              {categoria.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
            </span>
          ))}
        </div>
      </div>

      {/* Modal de Detalhes do Elemento */}
      <AnimatePresence>
        {elementoSelecionado && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[100]"
            onClick={() => setElementoSelecionado(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 rounded-xl border border-slate-700 shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className={cn("p-4 text-white", categoriaInterativaCores[elementoSelecionado.categoria] || "bg-gray-500")}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm opacity-75">Número atômico: {elementoSelecionado.numero}</span>
                    <div className="text-4xl font-bold">{elementoSelecionado.simbolo}</div>
                    <div className="text-white/80">{elementoSelecionado.nome}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm opacity-75">Massa atômica</div>
                    <div className="text-2xl font-bold">{elementoSelecionado.massaAtomica}</div>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <h4 className="font-semibold mb-1 flex items-center gap-2 text-slate-50">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    Configuração Eletrônica
                  </h4>
                  <code className="bg-slate-800 px-2 py-1 rounded text-sm text-primary font-mono">
                    {elementoSelecionado.configuracaoEletronica}
                  </code>
                </div>

                <div className="grid grid-cols-2 gap-4 text-slate-50">
                  {elementoSelecionado.eletronegatividade && (
                    <div>
                      <span className="text-sm text-muted-foreground">Eletronegatividade</span>
                      <p className="font-semibold">{elementoSelecionado.eletronegatividade}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm text-muted-foreground">Grupo / Período</span>
                    <p className="font-semibold">{elementoSelecionado.grupo} / {elementoSelecionado.periodo}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-slate-50">
                  {elementoSelecionado.pontoFusao !== undefined && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-blue-500" />
                      <div>
                        <span className="text-xs text-muted-foreground">Ponto de Fusão</span>
                        <p className="font-semibold">{elementoSelecionado.pontoFusao}°C</p>
                      </div>
                    </div>
                  )}
                  {elementoSelecionado.pontoEbulicao !== undefined && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-red-500" />
                      <div>
                        <span className="text-xs text-muted-foreground">Ponto de Ebulição</span>
                        <p className="font-semibold">{elementoSelecionado.pontoEbulicao}°C</p>
                      </div>
                    </div>
                  )}
                </div>

                <Button className="w-full" onClick={() => setElementoSelecionado(null)}>
                  Fechar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PeriodicTableContent() {
  const [selectedElement, setSelectedElement] = useState<Element | null>(null);
  const [activeTab, setActiveTab] = useState("tabela");

  const ElementCell = ({ element }: { element: Element }) => {
    const colors = categoryColors[element.category] || categoryColors["nonmetal"];
    const isSelected = selectedElement?.number === element.number;

    return (
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: element.number * 0.002 }}
        whileHover={{ scale: 1.1, zIndex: 50 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setSelectedElement(element)}
        className={cn(
          "relative w-[28px] h-[28px] sm:w-[54px] sm:h-[54px] rounded border sm:border-2 transition-all duration-150 flex flex-col items-center justify-center cursor-pointer shadow-sm hover:shadow-lg",
          colors.bg,
          colors.border,
          isSelected && "ring-2 ring-offset-2 ring-primary shadow-xl scale-105"
        )}
        title={`${element.namePt} (${element.name})`}
      >
        <span className="text-[5px] sm:text-[9px] font-semibold absolute top-0 left-0.5 sm:top-0.5 sm:left-1 opacity-80">{element.number}</span>
        <span className={cn("text-[10px] sm:text-xl font-black leading-none", colors.text)}>{element.symbol}</span>
        <span className={cn("text-[4px] sm:text-[8px] font-medium truncate w-full text-center leading-tight capitalize hidden sm:block", colors.text === "text-white" ? "text-white/90" : "text-slate-700")}>
          {element.namePt}
        </span>
        <span className={cn("text-[4px] sm:text-[7px] opacity-70 hidden sm:block", colors.text === "text-white" ? "text-white/80" : "text-slate-600")}>
          {typeof element.mass === 'number' ? element.mass : element.mass}
        </span>
      </motion.button>
    );
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full overflow-hidden">
      <ScrollArea className="w-full shrink-0">
        <TabsList className="w-max min-w-full justify-start rounded-none border-b bg-background px-2 sm:px-4 py-0 h-10 sm:h-12">
          <TabsTrigger value="tabela" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
            <Atom className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Tabela Periódica</span>
            <span className="sm:hidden">Tabela</span>
          </TabsTrigger>
          <TabsTrigger value="anions" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
            <FlaskConical className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Tabela de Ânions</span>
            <span className="sm:hidden">Ânions</span>
          </TabsTrigger>
          <TabsTrigger value="propriedades" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
            <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Propriedades Periódicas</span>
            <span className="sm:hidden">Props.</span>
          </TabsTrigger>
          <TabsTrigger value="diagrama" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
            <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Diagrama de Linus Pauling</span>
            <span className="sm:hidden">Diagrama</span>
          </TabsTrigger>
          <TabsTrigger value="interativa" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
            <MousePointer className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Tabela Interativa</span>
            <span className="sm:hidden">Interativa</span>
          </TabsTrigger>
        </TabsList>
      </ScrollArea>

      <TabsContent value="tabela" className="flex-1 m-0 overflow-hidden">
        <ScrollArea className="h-full w-full">
          <div className="p-2 sm:p-4 flex gap-2 sm:gap-4 min-w-max">
            {/* Main Periodic Table */}
            <div className="flex-1">
              {/* Group numbers */}
              <div className="flex gap-0.5 mb-1 ml-[30px] sm:ml-[55px]">
                {Array.from({ length: 18 }, (_, i) => (
                  <div key={i} className="w-[28px] sm:w-[54px] text-center text-[8px] sm:text-xs font-bold text-muted-foreground">
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Main Table with Period numbers */}
              <div className="flex">
                <div className="flex flex-col gap-0.5 mr-0.5 sm:mr-1">
                  {Array.from({ length: 7 }, (_, i) => (
                    <div key={i} className="h-[28px] sm:h-[54px] w-[28px] sm:w-[50px] flex items-center justify-center text-[8px] sm:text-xs font-bold text-muted-foreground">
                      {i + 1}
                    </div>
                  ))}
                </div>

                <div 
                  className="grid gap-0.5"
                  style={{ 
                    gridTemplateColumns: "repeat(18, minmax(28px, 54px))",
                    gridTemplateRows: "repeat(7, minmax(28px, 54px))"
                  }}
                >
                  {elements.filter(e => e.category !== "lanthanide" && e.category !== "actinide").map(element => (
                    <div key={element.number} style={{ gridColumn: element.group, gridRow: element.period }}>
                      <ElementCell element={element} />
                    </div>
                  ))}
                  
                  {/* Lanthanide/Actinide references */}
                  <div 
                    className="w-[28px] h-[28px] sm:w-[54px] sm:h-[54px] flex items-center justify-center text-[6px] sm:text-xs font-bold bg-pink-900/50 rounded border sm:border-2 border-pink-400"
                    style={{ gridColumn: 3, gridRow: 6 }}
                  >
                    <span className="text-pink-300">57-71</span>
                  </div>
                  <div 
                    className="w-[28px] h-[28px] sm:w-[54px] sm:h-[54px] flex items-center justify-center text-[6px] sm:text-xs font-bold bg-rose-900/50 rounded border sm:border-2 border-rose-400"
                    style={{ gridColumn: 3, gridRow: 7 }}
                  >
                    <span className="text-rose-300">89-103</span>
                  </div>
                </div>
              </div>

              {/* Transition elements label */}
              <div className="flex items-center justify-center mt-2 sm:mt-4 mb-1 sm:mb-2">
                <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-0.5 sm:py-1 bg-sky-900/30 rounded-full border border-sky-300">
                  <div className="h-px w-4 sm:w-8 bg-sky-400" />
                  <span className="text-[8px] sm:text-sm font-bold text-sky-300">ELEMENTOS DE TRANSIÇÃO</span>
                  <div className="h-px w-4 sm:w-8 bg-sky-400" />
                </div>
              </div>

              {/* Lanthanides */}
              <div className="mt-2 sm:mt-4 ml-[30px] sm:ml-[55px]">
                <div className="text-[8px] sm:text-xs font-bold text-pink-400 mb-0.5 sm:mb-1">Lantanídeos (57-71)</div>
                <div className="flex gap-0.5">
                  {elements.filter(e => e.category === "lanthanide").map(element => (
                    <ElementCell key={element.number} element={element} />
                  ))}
                </div>
              </div>

              {/* Actinides */}
              <div className="mt-1 sm:mt-2 ml-[30px] sm:ml-[55px]">
                <div className="text-[8px] sm:text-xs font-bold text-rose-400 mb-0.5 sm:mb-1">Actinídeos (89-103)</div>
                <div className="flex gap-0.5">
                  {elements.filter(e => e.category === "actinide").map(element => (
                    <ElementCell key={element.number} element={element} />
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="mt-3 sm:mt-6 p-2 sm:p-4 bg-slate-800 rounded-lg border shadow-sm">
                <div className="flex flex-wrap gap-1.5 sm:gap-3 justify-center">
                  {Object.entries(categoryColors).map(([category, colors]) => (
                    <div
                      key={category}
                      className={cn(
                        "flex items-center gap-1 sm:gap-2 px-1.5 sm:px-3 py-0.5 sm:py-1.5 rounded-full border sm:border-2 transition-all",
                        colors.bg,
                        colors.border
                      )}
                    >
                      <span className={cn("text-[7px] sm:text-xs font-semibold", colors.text)}>
                        {categoryNamesPt[category]}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Element key - hidden on mobile */}
                <div className="hidden sm:flex mt-4 items-center justify-center gap-8">
                  <div className="flex items-center gap-4 p-3 bg-slate-700 rounded-lg">
                    <div className="w-16 h-16 bg-teal-500 rounded border-2 border-teal-600 flex flex-col items-center justify-center text-white relative">
                      <span className="text-[8px] font-bold absolute top-0.5 left-1">3</span>
                      <span className="text-2xl font-black">Li</span>
                      <span className="text-[7px]">lítio</span>
                      <span className="text-[6px]">7</span>
                    </div>
                    <div className="text-xs space-y-1">
                      <div className="flex items-center gap-2"><span className="font-bold">3</span> — número atômico</div>
                      <div className="flex items-center gap-2"><span className="font-bold">Li</span> — símbolo químico</div>
                      <div className="flex items-center gap-2"><span className="font-bold">lítio</span> — nome</div>
                      <div className="flex items-center gap-2"><span className="font-bold">7</span> — peso atômico</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Element Details Panel */}
            <AnimatePresence mode="wait">
              {selectedElement ? (
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  className="w-[340px] bg-slate-800 rounded-xl border shadow-lg p-4 flex-shrink-0 h-fit sticky top-4"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className={cn(
                        "text-7xl font-black",
                        categoryColors[selectedElement.category]?.text === "text-white" 
                          ? "text-primary" 
                          : categoryColors[selectedElement.category]?.text?.replace("text-", "text-")
                      )}>
                        {selectedElement.symbol}
                      </div>
                      <div className="text-2xl font-bold mt-1 capitalize">{selectedElement.namePt}</div>
                      <div className="text-sm text-muted-foreground">{selectedElement.name}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedElement(null)}
                      className="h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className={cn(
                    "inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold mb-4",
                    categoryColors[selectedElement.category]?.bg,
                    categoryColors[selectedElement.category]?.text,
                    "border-2",
                    categoryColors[selectedElement.category]?.border
                  )}>
                    {categoryNamesPt[selectedElement.category]}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-3 border border-primary/20">
                      <div className="text-xs text-muted-foreground">Número Atômico</div>
                      <div className="text-2xl font-black text-primary">{selectedElement.number}</div>
                    </div>
                    <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg p-3 border border-accent/20">
                      <div className="text-xs text-muted-foreground">Massa Atômica</div>
                      <div className="text-2xl font-black">{selectedElement.mass}</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-secondary/50 rounded-lg p-3">
                      <div className="text-xs text-muted-foreground mb-1">Configuração Eletrônica</div>
                      <div className="text-sm font-mono font-bold">{selectedElement.electronConfig}</div>
                    </div>

                    <div className="bg-secondary/50 rounded-lg p-3">
                      <div className="text-xs text-muted-foreground mb-1">Estados de Oxidação</div>
                      <div className="text-sm font-mono font-bold">{selectedElement.oxidationStates}</div>
                    </div>

                    {selectedElement.electronegativity && (
                      <div className="bg-secondary/50 rounded-lg p-3">
                        <div className="text-xs text-muted-foreground">Eletronegatividade (Pauling)</div>
                        <div className="text-lg font-bold">{selectedElement.electronegativity}</div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      {selectedElement.melt && (
                        <div className="bg-orange-500/10 rounded-lg p-2 border border-orange-500/20">
                          <div className="text-xs text-muted-foreground">P. Fusão</div>
                          <div className="text-sm font-bold text-orange-400">
                            {(selectedElement.melt - 273.15).toFixed(0)}°C
                          </div>
                        </div>
                      )}
                      {selectedElement.boil && (
                        <div className="bg-red-500/10 rounded-lg p-2 border border-red-500/20">
                          <div className="text-xs text-muted-foreground">P. Ebulição</div>
                          <div className="text-sm font-bold text-red-400">
                            {(selectedElement.boil - 273.15).toFixed(0)}°C
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg p-3 border border-primary/10">
                      <div className="text-xs text-muted-foreground mb-1">Sobre o elemento</div>
                      <div className="text-sm leading-relaxed">{selectedElement.summary}</div>
                    </div>

                    <a
                      href={`https://pubchem.ncbi.nlm.nih.gov/element/${selectedElement.number}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Ver mais no PubChem
                    </a>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-[340px] bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl border-2 border-dashed border-primary/20 p-6 flex flex-col items-center justify-center text-center flex-shrink-0 h-[400px]"
                >
                  <div className="p-4 rounded-full bg-primary/10 mb-4">
                    <Sparkles className="h-12 w-12 text-primary/50" />
                  </div>
                  <h3 className="font-bold text-lg text-foreground">Selecione um Elemento</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Clique em qualquer elemento da tabela para ver suas propriedades detalhadas
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="anions" className="flex-1 m-0">
        <ScrollArea className="h-[calc(95vh-120px)]">
          <div className="p-6">
            <h2 className="text-2xl font-black text-center mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              TABELA DE ÂNIONS
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Halogenios */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-3">
                  <h3 className="text-white font-bold text-lg">HALOGÊNIOS</h3>
                </div>
                <div className="p-4 space-y-2">
                  {anionsData.halogenios.map((anion, i) => (
                    <div key={i} className="flex justify-between items-center py-1.5 px-3 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors">
                      <span className="font-mono font-bold text-primary">{anion.formula}</span>
                      <span className="text-sm">{anion.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Carbono */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-4 py-3">
                  <h3 className="text-white font-bold text-lg">CARBONO</h3>
                </div>
                <div className="p-4 space-y-2">
                  {anionsData.carbono.map((anion, i) => (
                    <div key={i} className="flex justify-between items-center py-1.5 px-3 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors">
                      <span className="font-mono font-bold text-primary">{anion.formula}</span>
                      <span className="text-sm">{anion.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nitrogenio */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3">
                  <h3 className="text-white font-bold text-lg">NITROGÊNIO</h3>
                </div>
                <div className="p-4 space-y-2">
                  {anionsData.nitrogenio.map((anion, i) => (
                    <div key={i} className="flex justify-between items-center py-1.5 px-3 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors">
                      <span className="font-mono font-bold text-primary">{anion.formula}</span>
                      <span className="text-sm">{anion.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fosforo */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-3">
                  <h3 className="text-white font-bold text-lg">FÓSFORO</h3>
                </div>
                <div className="p-4 space-y-2">
                  {anionsData.fosforo.map((anion, i) => (
                    <div key={i} className="flex justify-between items-center py-1.5 px-3 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors">
                      <span className="font-mono font-bold text-primary">{anion.formula}</span>
                      <span className="text-sm">{anion.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Enxofre */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-4 py-3">
                  <h3 className="text-white font-bold text-lg">ENXOFRE</h3>
                </div>
                <div className="p-4 space-y-2">
                  {anionsData.enxofre.map((anion, i) => (
                    <div key={i} className="flex justify-between items-center py-1.5 px-3 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors">
                      <span className="font-mono font-bold text-primary">{anion.formula}</span>
                      <span className="text-sm">{anion.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cations Variáveis e Nomenclaturas */}
              <div className="space-y-4">
                {/* Cations Variáveis */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-red-600 to-rose-600 px-4 py-3">
                    <h3 className="text-white font-bold text-lg">CÁTIONS VARIÁVEIS</h3>
                  </div>
                  <div className="p-4 space-y-2">
                    {cationsVariaveis.map((cation, i) => (
                      <div key={i} className="py-1.5 px-3 bg-secondary/50 rounded-lg text-sm font-medium">
                        {cation}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Nomenclaturas */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-3">
                    <h3 className="text-white font-bold text-lg">PRINCIPAIS NOMENCLATURAS</h3>
                  </div>
                  <div className="p-4 space-y-2">
                    {nomenclaturas.map((item, i) => (
                      <div key={i} className="py-2 px-3 bg-secondary/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-primary">{item.formula}</span>
                          <span className="text-sm">=</span>
                          <span className="text-sm font-medium">
                            {item.name.split(item.suffix).map((part, j) => (
                              <span key={j}>
                                {part}
                                {j === 0 && item.suffix && <span className="text-red-500 font-bold">{item.suffix}</span>}
                              </span>
                            ))}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="propriedades" className="flex-1 m-0">
        <ScrollArea className="h-[calc(95vh-120px)]">
          <div className="p-6">
            <h2 className="text-2xl font-black text-center mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              PROPRIEDADES PERIÓDICAS
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Eletronegatividade */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-violet-500/20">
                    <Zap className="h-6 w-6 text-violet-600" />
                  </div>
                  <h3 className="text-lg font-bold">Eletronegatividade</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Tendência a ganhar elétrons. Caráter não metálico.
                </p>
                <div className="bg-gradient-to-r from-violet-100 to-violet-200 dark:from-violet-900/30 dark:to-violet-800/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">↑ Aumenta</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                  <div className="text-center my-2">
                    <span className="text-3xl font-black text-violet-600">F</span>
                    <div className="text-xs text-muted-foreground">Maior: Flúor</div>
                  </div>
                  <div className="text-xs text-center text-muted-foreground">
                    Gases nobres não entram
                  </div>
                </div>
              </div>

              {/* Eletropositividade */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-teal-500/20">
                    <Zap className="h-6 w-6 text-teal-600" />
                  </div>
                  <h3 className="text-lg font-bold">Eletropositividade</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Tendência a perder elétrons. Caráter metálico.
                </p>
                <div className="bg-gradient-to-r from-teal-100 to-teal-200 dark:from-teal-900/30 dark:to-teal-800/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">↓ Aumenta</span>
                    <ArrowRight className="h-4 w-4 rotate-90" />
                  </div>
                  <div className="text-center my-2">
                    <span className="text-3xl font-black text-teal-600">Fr</span>
                    <div className="text-xs text-muted-foreground">Maior: Frâncio</div>
                  </div>
                </div>
              </div>

              {/* Raio Atômico */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-amber-500/20">
                    <Atom className="h-6 w-6 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-bold">Raio Atômico</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Tamanho do átomo. Distância do núcleo à última camada.
                </p>
                <div className="bg-gradient-to-r from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 rounded-lg p-4">
                  <div className="text-center my-2">
                    <span className="text-3xl font-black text-amber-600">Cs</span>
                    <div className="text-xs text-muted-foreground">Maior: Césio</div>
                  </div>
                  <div className="text-xs text-center text-muted-foreground">
                    ↓ Aumenta na família, ← Aumenta no período
                  </div>
                </div>
              </div>

              {/* Potencial de Ionização */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-rose-500/20">
                    <Sparkles className="h-6 w-6 text-rose-600" />
                  </div>
                  <h3 className="text-lg font-bold">Potencial de Ionização</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Energia necessária para remover um elétron.
                </p>
                <div className="bg-gradient-to-r from-rose-100 to-rose-200 dark:from-rose-900/30 dark:to-rose-800/30 rounded-lg p-4">
                  <div className="text-center my-2">
                    <span className="text-3xl font-black text-rose-600">He</span>
                    <div className="text-xs text-muted-foreground">Maior PI: Hélio</div>
                  </div>
                </div>
              </div>

              {/* Afinidade Eletrônica */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-sky-500/20">
                    <FlaskConical className="h-6 w-6 text-sky-600" />
                  </div>
                  <h3 className="text-lg font-bold">Afinidade Eletrônica</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Energia liberada ao receber um elétron.
                </p>
                <div className="bg-gradient-to-r from-sky-100 to-sky-200 dark:from-sky-900/30 dark:to-sky-800/30 rounded-lg p-4">
                  <div className="text-center my-2">
                    <span className="text-3xl font-black text-sky-600">Cl</span>
                    <div className="text-xs text-muted-foreground">Maior afinidade: Cloro</div>
                  </div>
                  <div className="text-xs text-center text-muted-foreground">
                    Gases nobres não entram
                  </div>
                </div>
              </div>

              {/* Densidade */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-indigo-500/20">
                    <Info className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-bold">Densidade</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Relação massa/volume (d = m/v)
                </p>
                <div className="bg-gradient-to-r from-indigo-100 to-indigo-200 dark:from-indigo-900/30 dark:to-indigo-800/30 rounded-lg p-4">
                  <div className="text-center my-2">
                    <span className="text-3xl font-black text-indigo-600">Os</span>
                    <div className="text-xs text-muted-foreground">Maior: Ósmio (22,6 g/cm³)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="diagrama" className="flex-1 m-0">
        <ScrollArea className="h-[calc(95vh-120px)]">
          <div className="p-6">
            <h2 className="text-2xl font-black text-center mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              DIAGRAMA DE LINUS PAULING
            </h2>
            <p className="text-center text-muted-foreground mb-6">
              Distribuição Eletrônica em Subníveis de Energia
            </p>
            
            <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-xl border shadow-lg p-8">
              {/* Pauling Diagram */}
              <div className="relative">
                {/* Grid representation */}
                <div className="grid grid-cols-7 gap-4">
                  {/* Headers */}
                  <div className="text-center font-bold text-sm text-muted-foreground">n</div>
                  <div className="text-center font-bold text-primary">s</div>
                  <div className="text-center font-bold text-sky-500">p</div>
                  <div className="text-center font-bold text-amber-500">d</div>
                  <div className="text-center font-bold text-rose-500">f</div>
                  <div className="col-span-2 text-center font-bold text-sm text-muted-foreground">Elétrons</div>

                  {/* Row 1 */}
                  <div className="text-center font-bold">1</div>
                  <div className="bg-primary/20 rounded-lg p-2 text-center font-mono font-bold text-primary">1s²</div>
                  <div></div>
                  <div></div>
                  <div></div>
                  <div className="col-span-2 text-center text-sm">2</div>

                  {/* Row 2 */}
                  <div className="text-center font-bold">2</div>
                  <div className="bg-primary/20 rounded-lg p-2 text-center font-mono font-bold text-primary">2s²</div>
                  <div className="bg-sky-500/20 rounded-lg p-2 text-center font-mono font-bold text-sky-600">2p⁶</div>
                  <div></div>
                  <div></div>
                  <div className="col-span-2 text-center text-sm">8</div>

                  {/* Row 3 */}
                  <div className="text-center font-bold">3</div>
                  <div className="bg-primary/20 rounded-lg p-2 text-center font-mono font-bold text-primary">3s²</div>
                  <div className="bg-sky-500/20 rounded-lg p-2 text-center font-mono font-bold text-sky-600">3p⁶</div>
                  <div className="bg-amber-500/20 rounded-lg p-2 text-center font-mono font-bold text-amber-600">3d¹⁰</div>
                  <div></div>
                  <div className="col-span-2 text-center text-sm">18</div>

                  {/* Row 4 */}
                  <div className="text-center font-bold">4</div>
                  <div className="bg-primary/20 rounded-lg p-2 text-center font-mono font-bold text-primary">4s²</div>
                  <div className="bg-sky-500/20 rounded-lg p-2 text-center font-mono font-bold text-sky-600">4p⁶</div>
                  <div className="bg-amber-500/20 rounded-lg p-2 text-center font-mono font-bold text-amber-600">4d¹⁰</div>
                  <div className="bg-rose-500/20 rounded-lg p-2 text-center font-mono font-bold text-rose-600">4f¹⁴</div>
                  <div className="col-span-2 text-center text-sm">32</div>

                  {/* Row 5 */}
                  <div className="text-center font-bold">5</div>
                  <div className="bg-primary/20 rounded-lg p-2 text-center font-mono font-bold text-primary">5s²</div>
                  <div className="bg-sky-500/20 rounded-lg p-2 text-center font-mono font-bold text-sky-600">5p⁶</div>
                  <div className="bg-amber-500/20 rounded-lg p-2 text-center font-mono font-bold text-amber-600">5d¹⁰</div>
                  <div className="bg-rose-500/20 rounded-lg p-2 text-center font-mono font-bold text-rose-600">5f¹⁴</div>
                  <div className="col-span-2 text-center text-sm">32</div>

                  {/* Row 6 */}
                  <div className="text-center font-bold">6</div>
                  <div className="bg-primary/20 rounded-lg p-2 text-center font-mono font-bold text-primary">6s²</div>
                  <div className="bg-sky-500/20 rounded-lg p-2 text-center font-mono font-bold text-sky-600">6p⁶</div>
                  <div className="bg-amber-500/20 rounded-lg p-2 text-center font-mono font-bold text-amber-600">6d¹⁰</div>
                  <div></div>
                  <div className="col-span-2 text-center text-sm">32</div>

                  {/* Row 7 */}
                  <div className="text-center font-bold">7</div>
                  <div className="bg-primary/20 rounded-lg p-2 text-center font-mono font-bold text-primary">7s²</div>
                  <div className="bg-sky-500/20 rounded-lg p-2 text-center font-mono font-bold text-sky-600">7p⁶</div>
                  <div></div>
                  <div></div>
                  <div className="col-span-2 text-center text-sm">8</div>
                </div>

                {/* Arrow indication */}
                <div className="mt-8 p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border border-primary/20">
                  <h4 className="font-bold mb-2">Ordem de preenchimento (Regra de Aufbau):</h4>
                  <div className="font-mono text-sm leading-relaxed">
                    1s² → 2s² → 2p⁶ → 3s² → 3p⁶ → 4s² → 3d¹⁰ → 4p⁶ → 5s² → 4d¹⁰ → 5p⁶ → 6s² → 4f¹⁴ → 5d¹⁰ → 6p⁶ → 7s² → 5f¹⁴ → 6d¹⁰ → 7p⁶
                  </div>
                </div>

                {/* Legend */}
                <div className="mt-6 flex flex-wrap justify-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-primary/30"></div>
                    <span className="text-sm font-medium">s (2 elétrons)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-sky-500/30"></div>
                    <span className="text-sm font-medium">p (6 elétrons)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-amber-500/30"></div>
                    <span className="text-sm font-medium">d (10 elétrons)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-rose-500/30"></div>
                    <span className="text-sm font-medium">f (14 elétrons)</span>
                  </div>
                </div>

                {/* Info box */}
                <div className="mt-6 p-4 bg-secondary/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Nota:</strong> Na vida real, o preenchimento passa do 7º nível. Este diagrama representa a ordem energética crescente dos subníveis, não necessariamente a ordem numérica das camadas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="interativa" className="flex-1 m-0">
        <ScrollArea className="h-[calc(95vh-120px)]">
          <InteractiveTableContent />
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
}
