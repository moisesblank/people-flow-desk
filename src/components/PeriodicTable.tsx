import { useState, useCallback } from "react";
import { Atom, X, ExternalLink, Beaker } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// Element data structure
interface Element {
  number: number;
  symbol: string;
  name: string;
  namePt: string;
  mass: number;
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

// Complete periodic table data (118 elements)
const elements: Element[] = [
  // Period 1
  { number: 1, symbol: "H", name: "Hydrogen", namePt: "Hidrogênio", mass: 1.008, category: "nonmetal", phase: "Gas", density: 0.00008988, melt: 14.01, boil: 20.28, electronegativity: 2.20, electronConfig: "1s¹", oxidationStates: "-1, +1", discoveredBy: "Henry Cavendish", yearDiscovered: 1766, appearance: "Gás incolor", summary: "O hidrogênio é o elemento químico mais simples e mais abundante do universo. Constitui cerca de 75% de toda a massa bariônica do universo.", group: 1, period: 1 },
  { number: 2, symbol: "He", name: "Helium", namePt: "Hélio", mass: 4.0026, category: "noble-gas", phase: "Gas", density: 0.0001785, melt: 0.95, boil: 4.22, electronegativity: undefined, electronConfig: "1s²", oxidationStates: "0", discoveredBy: "Pierre Janssen", yearDiscovered: 1868, appearance: "Gás incolor", summary: "O hélio é o segundo elemento mais abundante do universo. É um gás nobre inerte, monoatômico e incolor.", group: 18, period: 1 },
  
  // Period 2
  { number: 3, symbol: "Li", name: "Lithium", namePt: "Lítio", mass: 6.94, category: "alkali-metal", phase: "Solid", density: 0.534, melt: 453.69, boil: 1560, electronegativity: 0.98, electronConfig: "[He] 2s¹", oxidationStates: "+1", discoveredBy: "Johan August Arfwedson", yearDiscovered: 1817, appearance: "Metal branco-prateado", summary: "O lítio é o metal mais leve. Usado em baterias, cerâmicas e medicamentos.", group: 1, period: 2 },
  { number: 4, symbol: "Be", name: "Beryllium", namePt: "Berílio", mass: 9.0122, category: "alkaline-earth", phase: "Solid", density: 1.85, melt: 1560, boil: 2742, electronegativity: 1.57, electronConfig: "[He] 2s²", oxidationStates: "+2", discoveredBy: "Louis Nicolas Vauquelin", yearDiscovered: 1798, appearance: "Metal acinzentado", summary: "O berílio é um metal alcalino-terroso raro. Usado em ligas aeroespaciais.", group: 2, period: 2 },
  { number: 5, symbol: "B", name: "Boron", namePt: "Boro", mass: 10.81, category: "metalloid", phase: "Solid", density: 2.34, melt: 2349, boil: 4200, electronegativity: 2.04, electronConfig: "[He] 2s² 2p¹", oxidationStates: "+3", discoveredBy: "Joseph Louis Gay-Lussac", yearDiscovered: 1808, appearance: "Sólido preto/marrom", summary: "O boro é um metaloide. Usado em fibra de vidro e detergentes.", group: 13, period: 2 },
  { number: 6, symbol: "C", name: "Carbon", namePt: "Carbono", mass: 12.011, category: "nonmetal", phase: "Solid", density: 2.267, melt: 3823, boil: 4098, electronegativity: 2.55, electronConfig: "[He] 2s² 2p²", oxidationStates: "-4, -3, -2, -1, +1, +2, +3, +4", discoveredBy: "Conhecido desde a antiguidade", yearDiscovered: "Antiguidade", appearance: "Grafite/Diamante", summary: "O carbono é a base da vida orgânica. Forma mais compostos que qualquer outro elemento.", group: 14, period: 2 },
  { number: 7, symbol: "N", name: "Nitrogen", namePt: "Nitrogênio", mass: 14.007, category: "nonmetal", phase: "Gas", density: 0.0012506, melt: 63.15, boil: 77.36, electronegativity: 3.04, electronConfig: "[He] 2s² 2p³", oxidationStates: "-3, -2, -1, +1, +2, +3, +4, +5", discoveredBy: "Daniel Rutherford", yearDiscovered: 1772, appearance: "Gás incolor", summary: "O nitrogênio compõe 78% da atmosfera terrestre. Essencial para proteínas e DNA.", group: 15, period: 2 },
  { number: 8, symbol: "O", name: "Oxygen", namePt: "Oxigênio", mass: 15.999, category: "nonmetal", phase: "Gas", density: 0.001429, melt: 54.36, boil: 90.20, electronegativity: 3.44, electronConfig: "[He] 2s² 2p⁴", oxidationStates: "-2, -1, +1, +2", discoveredBy: "Carl Wilhelm Scheele", yearDiscovered: 1774, appearance: "Gás incolor", summary: "O oxigênio é essencial para a respiração. Compõe 21% da atmosfera terrestre.", group: 16, period: 2 },
  { number: 9, symbol: "F", name: "Fluorine", namePt: "Flúor", mass: 18.998, category: "halogen", phase: "Gas", density: 0.001696, melt: 53.53, boil: 85.03, electronegativity: 3.98, electronConfig: "[He] 2s² 2p⁵", oxidationStates: "-1", discoveredBy: "Henri Moissan", yearDiscovered: 1886, appearance: "Gás amarelo pálido", summary: "O flúor é o elemento mais eletronegativo. Usado em pasta de dentes e refrigerantes.", group: 17, period: 2 },
  { number: 10, symbol: "Ne", name: "Neon", namePt: "Neônio", mass: 20.180, category: "noble-gas", phase: "Gas", density: 0.0008999, melt: 24.56, boil: 27.07, electronegativity: undefined, electronConfig: "[He] 2s² 2p⁶", oxidationStates: "0", discoveredBy: "William Ramsay", yearDiscovered: 1898, appearance: "Gás incolor", summary: "O neônio é famoso por suas luzes de descarga alaranjadas. Gás nobre inerte.", group: 18, period: 2 },
  
  // Period 3
  { number: 11, symbol: "Na", name: "Sodium", namePt: "Sódio", mass: 22.990, category: "alkali-metal", phase: "Solid", density: 0.971, melt: 370.87, boil: 1156, electronegativity: 0.93, electronConfig: "[Ne] 3s¹", oxidationStates: "+1", discoveredBy: "Humphry Davy", yearDiscovered: 1807, appearance: "Metal prateado", summary: "O sódio é essencial para a vida. Componente do sal de cozinha (NaCl).", group: 1, period: 3 },
  { number: 12, symbol: "Mg", name: "Magnesium", namePt: "Magnésio", mass: 24.305, category: "alkaline-earth", phase: "Solid", density: 1.738, melt: 923, boil: 1363, electronegativity: 1.31, electronConfig: "[Ne] 3s²", oxidationStates: "+2", discoveredBy: "Joseph Black", yearDiscovered: 1755, appearance: "Metal cinza brilhante", summary: "O magnésio é essencial para a vida. Usado em ligas leves e pirotecnia.", group: 2, period: 3 },
  { number: 13, symbol: "Al", name: "Aluminum", namePt: "Alumínio", mass: 26.982, category: "post-transition", phase: "Solid", density: 2.698, melt: 933.47, boil: 2792, electronegativity: 1.61, electronConfig: "[Ne] 3s² 3p¹", oxidationStates: "+3", discoveredBy: "Hans Christian Ørsted", yearDiscovered: 1825, appearance: "Metal prateado", summary: "O alumínio é o metal mais abundante na crosta terrestre. Leve e resistente à corrosão.", group: 13, period: 3 },
  { number: 14, symbol: "Si", name: "Silicon", namePt: "Silício", mass: 28.085, category: "metalloid", phase: "Solid", density: 2.3296, melt: 1687, boil: 3538, electronegativity: 1.90, electronConfig: "[Ne] 3s² 3p²", oxidationStates: "-4, +2, +4", discoveredBy: "Jöns Jacob Berzelius", yearDiscovered: 1824, appearance: "Sólido cristalino cinza-azulado", summary: "O silício é a base da eletrônica moderna. Segundo elemento mais abundante na crosta.", group: 14, period: 3 },
  { number: 15, symbol: "P", name: "Phosphorus", namePt: "Fósforo", mass: 30.974, category: "nonmetal", phase: "Solid", density: 1.82, melt: 317.30, boil: 553.65, electronegativity: 2.19, electronConfig: "[Ne] 3s² 3p³", oxidationStates: "-3, +3, +5", discoveredBy: "Hennig Brand", yearDiscovered: 1669, appearance: "Branco/Vermelho/Preto", summary: "O fósforo é essencial para a vida (DNA, ATP). Usado em fertilizantes.", group: 15, period: 3 },
  { number: 16, symbol: "S", name: "Sulfur", namePt: "Enxofre", mass: 32.06, category: "nonmetal", phase: "Solid", density: 2.067, melt: 388.36, boil: 717.87, electronegativity: 2.58, electronConfig: "[Ne] 3s² 3p⁴", oxidationStates: "-2, +2, +4, +6", discoveredBy: "Conhecido desde a antiguidade", yearDiscovered: "Antiguidade", appearance: "Sólido amarelo", summary: "O enxofre é essencial para a vida. Usado em ácido sulfúrico e vulcanização.", group: 16, period: 3 },
  { number: 17, symbol: "Cl", name: "Chlorine", namePt: "Cloro", mass: 35.45, category: "halogen", phase: "Gas", density: 0.003214, melt: 171.65, boil: 239.11, electronegativity: 3.16, electronConfig: "[Ne] 3s² 3p⁵", oxidationStates: "-1, +1, +3, +5, +7", discoveredBy: "Carl Wilhelm Scheele", yearDiscovered: 1774, appearance: "Gás amarelo-esverdeado", summary: "O cloro é usado na purificação de água e em produtos de limpeza.", group: 17, period: 3 },
  { number: 18, symbol: "Ar", name: "Argon", namePt: "Argônio", mass: 39.948, category: "noble-gas", phase: "Gas", density: 0.0017837, melt: 83.80, boil: 87.30, electronegativity: undefined, electronConfig: "[Ne] 3s² 3p⁶", oxidationStates: "0", discoveredBy: "Lord Rayleigh", yearDiscovered: 1894, appearance: "Gás incolor", summary: "O argônio é o terceiro gás mais abundante na atmosfera (0,93%). Usado em soldas.", group: 18, period: 3 },
  
  // Period 4
  { number: 19, symbol: "K", name: "Potassium", namePt: "Potássio", mass: 39.098, category: "alkali-metal", phase: "Solid", density: 0.862, melt: 336.53, boil: 1032, electronegativity: 0.82, electronConfig: "[Ar] 4s¹", oxidationStates: "+1", discoveredBy: "Humphry Davy", yearDiscovered: 1807, appearance: "Metal prateado", summary: "O potássio é essencial para nervos e músculos. Usado em fertilizantes.", group: 1, period: 4 },
  { number: 20, symbol: "Ca", name: "Calcium", namePt: "Cálcio", mass: 40.078, category: "alkaline-earth", phase: "Solid", density: 1.54, melt: 1115, boil: 1757, electronegativity: 1.00, electronConfig: "[Ar] 4s²", oxidationStates: "+2", discoveredBy: "Humphry Davy", yearDiscovered: 1808, appearance: "Metal cinza-prateado", summary: "O cálcio é essencial para ossos e dentes. Usado em construção (cal, gesso).", group: 2, period: 4 },
  { number: 21, symbol: "Sc", name: "Scandium", namePt: "Escândio", mass: 44.956, category: "transition-metal", phase: "Solid", density: 2.989, melt: 1814, boil: 3109, electronegativity: 1.36, electronConfig: "[Ar] 3d¹ 4s²", oxidationStates: "+3", discoveredBy: "Lars Fredrik Nilson", yearDiscovered: 1879, appearance: "Metal prateado", summary: "O escândio é usado em ligas de alumínio para equipamentos esportivos.", group: 3, period: 4 },
  { number: 22, symbol: "Ti", name: "Titanium", namePt: "Titânio", mass: 47.867, category: "transition-metal", phase: "Solid", density: 4.54, melt: 1941, boil: 3560, electronegativity: 1.54, electronConfig: "[Ar] 3d² 4s²", oxidationStates: "+2, +3, +4", discoveredBy: "William Gregor", yearDiscovered: 1791, appearance: "Metal prateado", summary: "O titânio é forte, leve e resistente à corrosão. Usado em aviões e implantes.", group: 4, period: 4 },
  { number: 23, symbol: "V", name: "Vanadium", namePt: "Vanádio", mass: 50.942, category: "transition-metal", phase: "Solid", density: 6.11, melt: 2183, boil: 3680, electronegativity: 1.63, electronConfig: "[Ar] 3d³ 4s²", oxidationStates: "+2, +3, +4, +5", discoveredBy: "Andrés Manuel del Río", yearDiscovered: 1801, appearance: "Metal cinza-azulado", summary: "O vanádio é usado em ligas de aço e baterias de fluxo redox.", group: 5, period: 4 },
  { number: 24, symbol: "Cr", name: "Chromium", namePt: "Cromo", mass: 51.996, category: "transition-metal", phase: "Solid", density: 7.15, melt: 2180, boil: 2944, electronegativity: 1.66, electronConfig: "[Ar] 3d⁵ 4s¹", oxidationStates: "+2, +3, +6", discoveredBy: "Louis Nicolas Vauquelin", yearDiscovered: 1797, appearance: "Metal prateado brilhante", summary: "O cromo é usado em aço inoxidável e cromagem. Confere brilho e resistência.", group: 6, period: 4 },
  { number: 25, symbol: "Mn", name: "Manganese", namePt: "Manganês", mass: 54.938, category: "transition-metal", phase: "Solid", density: 7.44, melt: 1519, boil: 2334, electronegativity: 1.55, electronConfig: "[Ar] 3d⁵ 4s²", oxidationStates: "+2, +3, +4, +6, +7", discoveredBy: "Johan Gottlieb Gahn", yearDiscovered: 1774, appearance: "Metal cinza-prateado", summary: "O manganês é essencial para aço e baterias. Importante para enzimas.", group: 7, period: 4 },
  { number: 26, symbol: "Fe", name: "Iron", namePt: "Ferro", mass: 55.845, category: "transition-metal", phase: "Solid", density: 7.874, melt: 1811, boil: 3134, electronegativity: 1.83, electronConfig: "[Ar] 3d⁶ 4s²", oxidationStates: "+2, +3", discoveredBy: "Conhecido desde a antiguidade", yearDiscovered: "Antiguidade", appearance: "Metal cinza brilhante", summary: "O ferro é o metal mais utilizado. Essencial para hemoglobina e aço.", group: 8, period: 4 },
  { number: 27, symbol: "Co", name: "Cobalt", namePt: "Cobalto", mass: 58.933, category: "transition-metal", phase: "Solid", density: 8.86, melt: 1768, boil: 3200, electronegativity: 1.88, electronConfig: "[Ar] 3d⁷ 4s²", oxidationStates: "+2, +3", discoveredBy: "Georg Brandt", yearDiscovered: 1735, appearance: "Metal azul-prateado", summary: "O cobalto é usado em baterias de íon-lítio, ligas e pigmentos azuis.", group: 9, period: 4 },
  { number: 28, symbol: "Ni", name: "Nickel", namePt: "Níquel", mass: 58.693, category: "transition-metal", phase: "Solid", density: 8.912, melt: 1728, boil: 3186, electronegativity: 1.91, electronConfig: "[Ar] 3d⁸ 4s²", oxidationStates: "+2, +3", discoveredBy: "Axel Fredrik Cronstedt", yearDiscovered: 1751, appearance: "Metal prateado brilhante", summary: "O níquel é usado em aço inoxidável, moedas e baterias recarregáveis.", group: 10, period: 4 },
  { number: 29, symbol: "Cu", name: "Copper", namePt: "Cobre", mass: 63.546, category: "transition-metal", phase: "Solid", density: 8.96, melt: 1357.77, boil: 2835, electronegativity: 1.90, electronConfig: "[Ar] 3d¹⁰ 4s¹", oxidationStates: "+1, +2", discoveredBy: "Conhecido desde a antiguidade", yearDiscovered: "Antiguidade", appearance: "Metal avermelhado", summary: "O cobre é excelente condutor elétrico. Usado em fios, encanamentos e ligas.", group: 11, period: 4 },
  { number: 30, symbol: "Zn", name: "Zinc", namePt: "Zinco", mass: 65.38, category: "transition-metal", phase: "Solid", density: 7.134, melt: 692.68, boil: 1180, electronegativity: 1.65, electronConfig: "[Ar] 3d¹⁰ 4s²", oxidationStates: "+2", discoveredBy: "Conhecido desde a antiguidade", yearDiscovered: "Antiguidade", appearance: "Metal branco-azulado", summary: "O zinco é usado em galvanização, pilhas e suplementos nutricionais.", group: 12, period: 4 },
  { number: 31, symbol: "Ga", name: "Gallium", namePt: "Gálio", mass: 69.723, category: "post-transition", phase: "Solid", density: 5.907, melt: 302.91, boil: 2477, electronegativity: 1.81, electronConfig: "[Ar] 3d¹⁰ 4s² 4p¹", oxidationStates: "+3", discoveredBy: "Paul Emile Lecoq de Boisbaudran", yearDiscovered: 1875, appearance: "Metal prateado-azulado", summary: "O gálio derrete na mão (29,76°C). Usado em LEDs e semicondutores.", group: 13, period: 4 },
  { number: 32, symbol: "Ge", name: "Germanium", namePt: "Germânio", mass: 72.630, category: "metalloid", phase: "Solid", density: 5.323, melt: 1211.40, boil: 3106, electronegativity: 2.01, electronConfig: "[Ar] 3d¹⁰ 4s² 4p²", oxidationStates: "+2, +4", discoveredBy: "Clemens Winkler", yearDiscovered: 1886, appearance: "Sólido cinza brilhante", summary: "O germânio é um semicondutor. Usado em transistores e fibra óptica.", group: 14, period: 4 },
  { number: 33, symbol: "As", name: "Arsenic", namePt: "Arsênio", mass: 74.922, category: "metalloid", phase: "Solid", density: 5.776, melt: 1090, boil: 887, electronegativity: 2.18, electronConfig: "[Ar] 3d¹⁰ 4s² 4p³", oxidationStates: "-3, +3, +5", discoveredBy: "Albertus Magnus", yearDiscovered: 1250, appearance: "Sólido cinza metálico", summary: "O arsênio é um metaloide tóxico. Usado em pesticidas e semicondutores.", group: 15, period: 4 },
  { number: 34, symbol: "Se", name: "Selenium", namePt: "Selênio", mass: 78.971, category: "nonmetal", phase: "Solid", density: 4.809, melt: 494, boil: 958, electronegativity: 2.55, electronConfig: "[Ar] 3d¹⁰ 4s² 4p⁴", oxidationStates: "-2, +4, +6", discoveredBy: "Jöns Jacob Berzelius", yearDiscovered: 1817, appearance: "Várias formas alotrópicas", summary: "O selênio é um micronutriente essencial. Usado em células solares e eletrônica.", group: 16, period: 4 },
  { number: 35, symbol: "Br", name: "Bromine", namePt: "Bromo", mass: 79.904, category: "halogen", phase: "Liquid", density: 3.122, melt: 265.95, boil: 332, electronegativity: 2.96, electronConfig: "[Ar] 3d¹⁰ 4s² 4p⁵", oxidationStates: "-1, +1, +3, +5, +7", discoveredBy: "Antoine Jérôme Balard", yearDiscovered: 1826, appearance: "Líquido vermelho-marrom", summary: "O bromo é um dos dois elementos líquidos à temperatura ambiente. Usado em retardantes de chama.", group: 17, period: 4 },
  { number: 36, symbol: "Kr", name: "Krypton", namePt: "Criptônio", mass: 83.798, category: "noble-gas", phase: "Gas", density: 0.003733, melt: 115.79, boil: 119.93, electronegativity: 3.00, electronConfig: "[Ar] 3d¹⁰ 4s² 4p⁶", oxidationStates: "0, +2", discoveredBy: "William Ramsay", yearDiscovered: 1898, appearance: "Gás incolor", summary: "O criptônio é um gás nobre. Usado em lâmpadas e lasers.", group: 18, period: 4 },
  
  // Period 5
  { number: 37, symbol: "Rb", name: "Rubidium", namePt: "Rubídio", mass: 85.468, category: "alkali-metal", phase: "Solid", density: 1.532, melt: 312.46, boil: 961, electronegativity: 0.82, electronConfig: "[Kr] 5s¹", oxidationStates: "+1", discoveredBy: "Robert Bunsen", yearDiscovered: 1861, appearance: "Metal prateado", summary: "O rubídio é altamente reativo. Usado em células fotoelétricas e relógios atômicos.", group: 1, period: 5 },
  { number: 38, symbol: "Sr", name: "Strontium", namePt: "Estrôncio", mass: 87.62, category: "alkaline-earth", phase: "Solid", density: 2.64, melt: 1050, boil: 1655, electronegativity: 0.95, electronConfig: "[Kr] 5s²", oxidationStates: "+2", discoveredBy: "William Cruickshank", yearDiscovered: 1790, appearance: "Metal prateado-amarelado", summary: "O estrôncio produz chama vermelha em fogos de artifício.", group: 2, period: 5 },
  { number: 39, symbol: "Y", name: "Yttrium", namePt: "Ítrio", mass: 88.906, category: "transition-metal", phase: "Solid", density: 4.469, melt: 1799, boil: 3609, electronegativity: 1.22, electronConfig: "[Kr] 4d¹ 5s²", oxidationStates: "+3", discoveredBy: "Johan Gadolin", yearDiscovered: 1794, appearance: "Metal prateado", summary: "O ítrio é usado em LEDs, lasers e supercondutores.", group: 3, period: 5 },
  { number: 40, symbol: "Zr", name: "Zirconium", namePt: "Zircônio", mass: 91.224, category: "transition-metal", phase: "Solid", density: 6.506, melt: 2128, boil: 4682, electronegativity: 1.33, electronConfig: "[Kr] 4d² 5s²", oxidationStates: "+4", discoveredBy: "Martin Heinrich Klaproth", yearDiscovered: 1789, appearance: "Metal cinza-prateado", summary: "O zircônio é resistente à corrosão. Usado em reatores nucleares.", group: 4, period: 5 },
  { number: 41, symbol: "Nb", name: "Niobium", namePt: "Nióbio", mass: 92.906, category: "transition-metal", phase: "Solid", density: 8.57, melt: 2750, boil: 5017, electronegativity: 1.6, electronConfig: "[Kr] 4d⁴ 5s¹", oxidationStates: "+3, +5", discoveredBy: "Charles Hatchett", yearDiscovered: 1801, appearance: "Metal cinza brilhante", summary: "O Brasil é o maior produtor de nióbio. Usado em aços especiais e supercondutores.", group: 5, period: 5 },
  { number: 42, symbol: "Mo", name: "Molybdenum", namePt: "Molibdênio", mass: 95.95, category: "transition-metal", phase: "Solid", density: 10.22, melt: 2896, boil: 4912, electronegativity: 2.16, electronConfig: "[Kr] 4d⁵ 5s¹", oxidationStates: "+2, +3, +4, +5, +6", discoveredBy: "Carl Wilhelm Scheele", yearDiscovered: 1778, appearance: "Metal cinza-prateado", summary: "O molibdênio tem alto ponto de fusão. Usado em ligas e catalisadores.", group: 6, period: 5 },
  { number: 43, symbol: "Tc", name: "Technetium", namePt: "Tecnécio", mass: 98, category: "transition-metal", phase: "Solid", density: 11.5, melt: 2430, boil: 4538, electronegativity: 1.9, electronConfig: "[Kr] 4d⁵ 5s²", oxidationStates: "+4, +7", discoveredBy: "Emilio Segrè", yearDiscovered: 1937, appearance: "Metal cinza-prateado", summary: "O tecnécio foi o primeiro elemento produzido artificialmente. Usado em medicina nuclear.", group: 7, period: 5 },
  { number: 44, symbol: "Ru", name: "Ruthenium", namePt: "Rutênio", mass: 101.07, category: "transition-metal", phase: "Solid", density: 12.37, melt: 2607, boil: 4423, electronegativity: 2.2, electronConfig: "[Kr] 4d⁷ 5s¹", oxidationStates: "+2, +3, +4, +6, +8", discoveredBy: "Karl Ernst Claus", yearDiscovered: 1844, appearance: "Metal branco-prateado", summary: "O rutênio é um metal do grupo da platina. Usado em catalisadores e eletrônica.", group: 8, period: 5 },
  { number: 45, symbol: "Rh", name: "Rhodium", namePt: "Ródio", mass: 102.91, category: "transition-metal", phase: "Solid", density: 12.41, melt: 2237, boil: 3968, electronegativity: 2.28, electronConfig: "[Kr] 4d⁸ 5s¹", oxidationStates: "+3", discoveredBy: "William Hyde Wollaston", yearDiscovered: 1803, appearance: "Metal branco-prateado", summary: "O ródio é o metal mais caro. Usado em conversores catalíticos e joias.", group: 9, period: 5 },
  { number: 46, symbol: "Pd", name: "Palladium", namePt: "Paládio", mass: 106.42, category: "transition-metal", phase: "Solid", density: 12.02, melt: 1828.05, boil: 3236, electronegativity: 2.20, electronConfig: "[Kr] 4d¹⁰", oxidationStates: "+2, +4", discoveredBy: "William Hyde Wollaston", yearDiscovered: 1803, appearance: "Metal branco-prateado", summary: "O paládio absorve hidrogênio. Usado em conversores catalíticos e joias.", group: 10, period: 5 },
  { number: 47, symbol: "Ag", name: "Silver", namePt: "Prata", mass: 107.87, category: "transition-metal", phase: "Solid", density: 10.501, melt: 1234.93, boil: 2435, electronegativity: 1.93, electronConfig: "[Kr] 4d¹⁰ 5s¹", oxidationStates: "+1", discoveredBy: "Conhecido desde a antiguidade", yearDiscovered: "Antiguidade", appearance: "Metal branco brilhante", summary: "A prata é o melhor condutor de eletricidade. Usada em joias, moedas e eletrônica.", group: 11, period: 5 },
  { number: 48, symbol: "Cd", name: "Cadmium", namePt: "Cádmio", mass: 112.41, category: "transition-metal", phase: "Solid", density: 8.69, melt: 594.22, boil: 1040, electronegativity: 1.69, electronConfig: "[Kr] 4d¹⁰ 5s²", oxidationStates: "+2", discoveredBy: "Karl Samuel Leberecht Hermann", yearDiscovered: 1817, appearance: "Metal prateado-azulado", summary: "O cádmio é tóxico. Usado em baterias Ni-Cd e pigmentos.", group: 12, period: 5 },
  { number: 49, symbol: "In", name: "Indium", namePt: "Índio", mass: 114.82, category: "post-transition", phase: "Solid", density: 7.31, melt: 429.75, boil: 2345, electronegativity: 1.78, electronConfig: "[Kr] 4d¹⁰ 5s² 5p¹", oxidationStates: "+3", discoveredBy: "Ferdinand Reich", yearDiscovered: 1863, appearance: "Metal prateado brilhante", summary: "O índio é muito macio. Usado em telas de LCD e semicondutores.", group: 13, period: 5 },
  { number: 50, symbol: "Sn", name: "Tin", namePt: "Estanho", mass: 118.71, category: "post-transition", phase: "Solid", density: 7.287, melt: 505.08, boil: 2875, electronegativity: 1.96, electronConfig: "[Kr] 4d¹⁰ 5s² 5p²", oxidationStates: "+2, +4", discoveredBy: "Conhecido desde a antiguidade", yearDiscovered: "Antiguidade", appearance: "Metal prateado", summary: "O estanho é usado em soldas e revestimentos. Liga bronze = cobre + estanho.", group: 14, period: 5 },
  { number: 51, symbol: "Sb", name: "Antimony", namePt: "Antimônio", mass: 121.76, category: "metalloid", phase: "Solid", density: 6.685, melt: 903.78, boil: 1860, electronegativity: 2.05, electronConfig: "[Kr] 4d¹⁰ 5s² 5p³", oxidationStates: "-3, +3, +5", discoveredBy: "Conhecido desde a antiguidade", yearDiscovered: "Antiguidade", appearance: "Sólido prateado brilhante", summary: "O antimônio é usado em ligas e retardantes de chama.", group: 15, period: 5 },
  { number: 52, symbol: "Te", name: "Tellurium", namePt: "Telúrio", mass: 127.60, category: "metalloid", phase: "Solid", density: 6.232, melt: 722.66, boil: 1261, electronegativity: 2.1, electronConfig: "[Kr] 4d¹⁰ 5s² 5p⁴", oxidationStates: "-2, +4, +6", discoveredBy: "Franz-Joseph Müller von Reichenstein", yearDiscovered: 1783, appearance: "Sólido cinza-prateado", summary: "O telúrio é usado em células solares e ligas.", group: 16, period: 5 },
  { number: 53, symbol: "I", name: "Iodine", namePt: "Iodo", mass: 126.90, category: "halogen", phase: "Solid", density: 4.93, melt: 386.85, boil: 457.55, electronegativity: 2.66, electronConfig: "[Kr] 4d¹⁰ 5s² 5p⁵", oxidationStates: "-1, +1, +5, +7", discoveredBy: "Bernard Courtois", yearDiscovered: 1811, appearance: "Sólido violeta-escuro", summary: "O iodo é essencial para a tireoide. Usado em medicina e desinfetantes.", group: 17, period: 5 },
  { number: 54, symbol: "Xe", name: "Xenon", namePt: "Xenônio", mass: 131.29, category: "noble-gas", phase: "Gas", density: 0.005887, melt: 161.36, boil: 165.03, electronegativity: 2.60, electronConfig: "[Kr] 4d¹⁰ 5s² 5p⁶", oxidationStates: "0, +2, +4, +6, +8", discoveredBy: "William Ramsay", yearDiscovered: 1898, appearance: "Gás incolor", summary: "O xenônio pode formar compostos (raro para gás nobre). Usado em lâmpadas e anestesia.", group: 18, period: 5 },
  
  // Period 6
  { number: 55, symbol: "Cs", name: "Cesium", namePt: "Césio", mass: 132.91, category: "alkali-metal", phase: "Solid", density: 1.873, melt: 301.59, boil: 944, electronegativity: 0.79, electronConfig: "[Xe] 6s¹", oxidationStates: "+1", discoveredBy: "Robert Bunsen", yearDiscovered: 1860, appearance: "Metal dourado-prateado", summary: "O césio define o segundo no SI (relógio atômico). Reage violentamente com água.", group: 1, period: 6 },
  { number: 56, symbol: "Ba", name: "Barium", namePt: "Bário", mass: 137.33, category: "alkaline-earth", phase: "Solid", density: 3.594, melt: 1000, boil: 2170, electronegativity: 0.89, electronConfig: "[Xe] 6s²", oxidationStates: "+2", discoveredBy: "Carl Wilhelm Scheele", yearDiscovered: 1772, appearance: "Metal prateado", summary: "O bário produz chama verde. Usado em raios-X (sulfato de bário).", group: 2, period: 6 },
  
  // Lanthanides (57-71)
  { number: 57, symbol: "La", name: "Lanthanum", namePt: "Lantânio", mass: 138.91, category: "lanthanide", phase: "Solid", density: 6.145, melt: 1193, boil: 3737, electronegativity: 1.1, electronConfig: "[Xe] 5d¹ 6s²", oxidationStates: "+3", discoveredBy: "Carl Gustaf Mosander", yearDiscovered: 1839, appearance: "Metal prateado", summary: "O lantânio dá nome à série dos lantanídeos. Usado em catalisadores e baterias.", group: 3, period: 6 },
  { number: 58, symbol: "Ce", name: "Cerium", namePt: "Cério", mass: 140.12, category: "lanthanide", phase: "Solid", density: 6.77, melt: 1068, boil: 3716, electronegativity: 1.12, electronConfig: "[Xe] 4f¹ 5d¹ 6s²", oxidationStates: "+3, +4", discoveredBy: "Jöns Jacob Berzelius", yearDiscovered: 1803, appearance: "Metal prateado", summary: "O cério é o lantanídeo mais abundante. Usado em polimento de vidro e catalisadores.", group: 3, period: 6 },
  { number: 59, symbol: "Pr", name: "Praseodymium", namePt: "Praseodímio", mass: 140.91, category: "lanthanide", phase: "Solid", density: 6.773, melt: 1208, boil: 3793, electronegativity: 1.13, electronConfig: "[Xe] 4f³ 6s²", oxidationStates: "+3, +4", discoveredBy: "Carl Auer von Welsbach", yearDiscovered: 1885, appearance: "Metal prateado", summary: "O praseodímio é usado em ímãs, ligas e vidros coloridos.", group: 3, period: 6 },
  { number: 60, symbol: "Nd", name: "Neodymium", namePt: "Neodímio", mass: 144.24, category: "lanthanide", phase: "Solid", density: 7.007, melt: 1297, boil: 3347, electronegativity: 1.14, electronConfig: "[Xe] 4f⁴ 6s²", oxidationStates: "+3", discoveredBy: "Carl Auer von Welsbach", yearDiscovered: 1885, appearance: "Metal prateado", summary: "O neodímio forma ímãs muito fortes (Nd₂Fe₁₄B). Usado em motores elétricos.", group: 3, period: 6 },
  { number: 61, symbol: "Pm", name: "Promethium", namePt: "Promécio", mass: 145, category: "lanthanide", phase: "Solid", density: 7.26, melt: 1315, boil: 3273, electronegativity: 1.13, electronConfig: "[Xe] 4f⁵ 6s²", oxidationStates: "+3", discoveredBy: "Charles D. Coryell", yearDiscovered: 1945, appearance: "Metal prateado", summary: "O promécio é radioativo. Todos os isótopos são instáveis.", group: 3, period: 6 },
  { number: 62, symbol: "Sm", name: "Samarium", namePt: "Samário", mass: 150.36, category: "lanthanide", phase: "Solid", density: 7.52, melt: 1345, boil: 2067, electronegativity: 1.17, electronConfig: "[Xe] 4f⁶ 6s²", oxidationStates: "+2, +3", discoveredBy: "Paul Émile Lecoq de Boisbaudran", yearDiscovered: 1879, appearance: "Metal prateado", summary: "O samário é usado em ímãs (SmCo₅) e reatores nucleares.", group: 3, period: 6 },
  { number: 63, symbol: "Eu", name: "Europium", namePt: "Európio", mass: 151.96, category: "lanthanide", phase: "Solid", density: 5.243, melt: 1099, boil: 1802, electronegativity: 1.2, electronConfig: "[Xe] 4f⁷ 6s²", oxidationStates: "+2, +3", discoveredBy: "Eugène-Anatole Demarçay", yearDiscovered: 1901, appearance: "Metal prateado", summary: "O európio produz fósforos vermelhos em TVs e cédulas de segurança.", group: 3, period: 6 },
  { number: 64, symbol: "Gd", name: "Gadolinium", namePt: "Gadolínio", mass: 157.25, category: "lanthanide", phase: "Solid", density: 7.895, melt: 1585, boil: 3546, electronegativity: 1.2, electronConfig: "[Xe] 4f⁷ 5d¹ 6s²", oxidationStates: "+3", discoveredBy: "Jean Charles Galissard de Marignac", yearDiscovered: 1880, appearance: "Metal prateado", summary: "O gadolínio é usado em contraste para ressonância magnética.", group: 3, period: 6 },
  { number: 65, symbol: "Tb", name: "Terbium", namePt: "Térbio", mass: 158.93, category: "lanthanide", phase: "Solid", density: 8.229, melt: 1629, boil: 3503, electronegativity: 1.2, electronConfig: "[Xe] 4f⁹ 6s²", oxidationStates: "+3, +4", discoveredBy: "Carl Gustaf Mosander", yearDiscovered: 1843, appearance: "Metal prateado", summary: "O térbio produz fósforos verdes. Usado em dispositivos de estado sólido.", group: 3, period: 6 },
  { number: 66, symbol: "Dy", name: "Dysprosium", namePt: "Disprósio", mass: 162.50, category: "lanthanide", phase: "Solid", density: 8.55, melt: 1680, boil: 2840, electronegativity: 1.22, electronConfig: "[Xe] 4f¹⁰ 6s²", oxidationStates: "+3", discoveredBy: "Paul Émile Lecoq de Boisbaudran", yearDiscovered: 1886, appearance: "Metal prateado", summary: "O disprósio é usado em ímãs de neodímio e lasers.", group: 3, period: 6 },
  { number: 67, symbol: "Ho", name: "Holmium", namePt: "Hólmio", mass: 164.93, category: "lanthanide", phase: "Solid", density: 8.795, melt: 1734, boil: 2993, electronegativity: 1.23, electronConfig: "[Xe] 4f¹¹ 6s²", oxidationStates: "+3", discoveredBy: "Jacques-Louis Soret", yearDiscovered: 1878, appearance: "Metal prateado", summary: "O hólmio tem o maior momento magnético. Usado em lasers médicos.", group: 3, period: 6 },
  { number: 68, symbol: "Er", name: "Erbium", namePt: "Érbio", mass: 167.26, category: "lanthanide", phase: "Solid", density: 9.066, melt: 1802, boil: 3141, electronegativity: 1.24, electronConfig: "[Xe] 4f¹² 6s²", oxidationStates: "+3", discoveredBy: "Carl Gustaf Mosander", yearDiscovered: 1843, appearance: "Metal prateado", summary: "O érbio dá cor rosa ao vidro. Usado em amplificadores de fibra óptica.", group: 3, period: 6 },
  { number: 69, symbol: "Tm", name: "Thulium", namePt: "Túlio", mass: 168.93, category: "lanthanide", phase: "Solid", density: 9.321, melt: 1818, boil: 2223, electronegativity: 1.25, electronConfig: "[Xe] 4f¹³ 6s²", oxidationStates: "+2, +3", discoveredBy: "Per Teodor Cleve", yearDiscovered: 1879, appearance: "Metal prateado", summary: "O túlio é o lantanídeo mais raro. Usado em aparelhos de raios-X portáteis.", group: 3, period: 6 },
  { number: 70, symbol: "Yb", name: "Ytterbium", namePt: "Itérbio", mass: 173.05, category: "lanthanide", phase: "Solid", density: 6.965, melt: 1097, boil: 1469, electronegativity: 1.1, electronConfig: "[Xe] 4f¹⁴ 6s²", oxidationStates: "+2, +3", discoveredBy: "Jean Charles Galissard de Marignac", yearDiscovered: 1878, appearance: "Metal prateado", summary: "O itérbio é usado em relógios atômicos e lasers.", group: 3, period: 6 },
  { number: 71, symbol: "Lu", name: "Lutetium", namePt: "Lutécio", mass: 174.97, category: "lanthanide", phase: "Solid", density: 9.84, melt: 1925, boil: 3675, electronegativity: 1.27, electronConfig: "[Xe] 4f¹⁴ 5d¹ 6s²", oxidationStates: "+3", discoveredBy: "Georges Urbain", yearDiscovered: 1907, appearance: "Metal prateado", summary: "O lutécio é o lantanídeo mais denso e duro. Usado em catalisadores.", group: 3, period: 6 },
  
  // Continue Period 6
  { number: 72, symbol: "Hf", name: "Hafnium", namePt: "Háfnio", mass: 178.49, category: "transition-metal", phase: "Solid", density: 13.31, melt: 2506, boil: 4876, electronegativity: 1.3, electronConfig: "[Xe] 4f¹⁴ 5d² 6s²", oxidationStates: "+4", discoveredBy: "Dirk Coster", yearDiscovered: 1923, appearance: "Metal cinza-prateado", summary: "O háfnio é semelhante ao zircônio. Usado em barras de controle nuclear.", group: 4, period: 6 },
  { number: 73, symbol: "Ta", name: "Tantalum", namePt: "Tântalo", mass: 180.95, category: "transition-metal", phase: "Solid", density: 16.654, melt: 3290, boil: 5731, electronegativity: 1.5, electronConfig: "[Xe] 4f¹⁴ 5d³ 6s²", oxidationStates: "+5", discoveredBy: "Anders Gustaf Ekeberg", yearDiscovered: 1802, appearance: "Metal cinza-azulado", summary: "O tântalo é muito resistente à corrosão. Usado em capacitores e implantes.", group: 5, period: 6 },
  { number: 74, symbol: "W", name: "Tungsten", namePt: "Tungstênio", mass: 183.84, category: "transition-metal", phase: "Solid", density: 19.25, melt: 3695, boil: 5828, electronegativity: 2.36, electronConfig: "[Xe] 4f¹⁴ 5d⁴ 6s²", oxidationStates: "+2, +3, +4, +5, +6", discoveredBy: "Juan José Elhuyar", yearDiscovered: 1783, appearance: "Metal cinza-aço", summary: "O tungstênio tem o maior ponto de fusão (3422°C). Usado em filamentos e ferramentas.", group: 6, period: 6 },
  { number: 75, symbol: "Re", name: "Rhenium", namePt: "Rênio", mass: 186.21, category: "transition-metal", phase: "Solid", density: 21.02, melt: 3459, boil: 5869, electronegativity: 1.9, electronConfig: "[Xe] 4f¹⁴ 5d⁵ 6s²", oxidationStates: "+4, +6, +7", discoveredBy: "Masataka Ogawa", yearDiscovered: 1925, appearance: "Metal cinza-prateado", summary: "O rênio foi o último elemento estável descoberto. Usado em superligas.", group: 7, period: 6 },
  { number: 76, symbol: "Os", name: "Osmium", namePt: "Ósmio", mass: 190.23, category: "transition-metal", phase: "Solid", density: 22.59, melt: 3306, boil: 5285, electronegativity: 2.2, electronConfig: "[Xe] 4f¹⁴ 5d⁶ 6s²", oxidationStates: "+3, +4, +8", discoveredBy: "Smithson Tennant", yearDiscovered: 1803, appearance: "Metal azul-prateado", summary: "O ósmio é o elemento mais denso (22,59 g/cm³). OsO₄ é muito tóxico.", group: 8, period: 6 },
  { number: 77, symbol: "Ir", name: "Iridium", namePt: "Irídio", mass: 192.22, category: "transition-metal", phase: "Solid", density: 22.56, melt: 2719, boil: 4701, electronegativity: 2.20, electronConfig: "[Xe] 4f¹⁴ 5d⁷ 6s²", oxidationStates: "+3, +4", discoveredBy: "Smithson Tennant", yearDiscovered: 1803, appearance: "Metal branco-prateado", summary: "O irídio é o segundo elemento mais denso. Muito resistente à corrosão.", group: 9, period: 6 },
  { number: 78, symbol: "Pt", name: "Platinum", namePt: "Platina", mass: 195.08, category: "transition-metal", phase: "Solid", density: 21.45, melt: 2041.4, boil: 4098, electronegativity: 2.28, electronConfig: "[Xe] 4f¹⁴ 5d⁹ 6s¹", oxidationStates: "+2, +4", discoveredBy: "Antonio de Ulloa", yearDiscovered: 1735, appearance: "Metal branco-prateado", summary: "A platina é um metal precioso. Usada em joias, catalisadores e laboratórios.", group: 10, period: 6 },
  { number: 79, symbol: "Au", name: "Gold", namePt: "Ouro", mass: 196.97, category: "transition-metal", phase: "Solid", density: 19.282, melt: 1337.33, boil: 3129, electronegativity: 2.54, electronConfig: "[Xe] 4f¹⁴ 5d¹⁰ 6s¹", oxidationStates: "+1, +3", discoveredBy: "Conhecido desde a antiguidade", yearDiscovered: "Antiguidade", appearance: "Metal amarelo brilhante", summary: "O ouro é altamente valorizado. Excelente condutor, não oxida. Símbolo de riqueza.", group: 11, period: 6 },
  { number: 80, symbol: "Hg", name: "Mercury", namePt: "Mercúrio", mass: 200.59, category: "transition-metal", phase: "Liquid", density: 13.5336, melt: 234.32, boil: 629.88, electronegativity: 2.00, electronConfig: "[Xe] 4f¹⁴ 5d¹⁰ 6s²", oxidationStates: "+1, +2", discoveredBy: "Conhecido desde a antiguidade", yearDiscovered: "Antiguidade", appearance: "Metal líquido prateado", summary: "O mercúrio é líquido à temperatura ambiente. Tóxico. Usado em termômetros antigos.", group: 12, period: 6 },
  { number: 81, symbol: "Tl", name: "Thallium", namePt: "Tálio", mass: 204.38, category: "post-transition", phase: "Solid", density: 11.85, melt: 577, boil: 1746, electronegativity: 1.62, electronConfig: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p¹", oxidationStates: "+1, +3", discoveredBy: "William Crookes", yearDiscovered: 1861, appearance: "Metal cinza-prateado", summary: "O tálio é muito tóxico. Usado em semicondutores e células fotoelétricas.", group: 13, period: 6 },
  { number: 82, symbol: "Pb", name: "Lead", namePt: "Chumbo", mass: 207.2, category: "post-transition", phase: "Solid", density: 11.342, melt: 600.61, boil: 2022, electronegativity: 1.87, electronConfig: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p²", oxidationStates: "+2, +4", discoveredBy: "Conhecido desde a antiguidade", yearDiscovered: "Antiguidade", appearance: "Metal cinza-azulado", summary: "O chumbo é denso e macio. Tóxico. Usado em baterias e blindagem contra radiação.", group: 14, period: 6 },
  { number: 83, symbol: "Bi", name: "Bismuth", namePt: "Bismuto", mass: 208.98, category: "post-transition", phase: "Solid", density: 9.807, melt: 544.55, boil: 1837, electronegativity: 2.02, electronConfig: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p³", oxidationStates: "+3, +5", discoveredBy: "Claude François Geoffroy", yearDiscovered: 1753, appearance: "Metal branco-rosado", summary: "O bismuto forma cristais iridescentes. Usado em medicamentos e ligas de baixo ponto de fusão.", group: 15, period: 6 },
  { number: 84, symbol: "Po", name: "Polonium", namePt: "Polônio", mass: 209, category: "metalloid", phase: "Solid", density: 9.32, melt: 527, boil: 1235, electronegativity: 2.0, electronConfig: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁴", oxidationStates: "+2, +4", discoveredBy: "Marie Curie", yearDiscovered: 1898, appearance: "Metal prateado", summary: "O polônio é altamente radioativo e raro. Descoberto por Marie Curie.", group: 16, period: 6 },
  { number: 85, symbol: "At", name: "Astatine", namePt: "Astato", mass: 210, category: "halogen", phase: "Solid", density: 7, melt: 575, boil: 610, electronegativity: 2.2, electronConfig: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁵", oxidationStates: "-1, +1, +3, +5, +7", discoveredBy: "Dale R. Corson", yearDiscovered: 1940, appearance: "Provavelmente metálico", summary: "O astato é o halogênio mais raro. Altamente radioativo.", group: 17, period: 6 },
  { number: 86, symbol: "Rn", name: "Radon", namePt: "Radônio", mass: 222, category: "noble-gas", phase: "Gas", density: 0.00973, melt: 202, boil: 211.45, electronegativity: 2.2, electronConfig: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁶", oxidationStates: "0, +2", discoveredBy: "Friedrich Ernst Dorn", yearDiscovered: 1900, appearance: "Gás incolor", summary: "O radônio é radioativo e denso. Gás nobre que emana do solo em algumas regiões.", group: 18, period: 6 },
  
  // Period 7
  { number: 87, symbol: "Fr", name: "Francium", namePt: "Frâncio", mass: 223, category: "alkali-metal", phase: "Solid", density: 1.87, melt: 300, boil: 950, electronegativity: 0.7, electronConfig: "[Rn] 7s¹", oxidationStates: "+1", discoveredBy: "Marguerite Perey", yearDiscovered: 1939, appearance: "Desconhecido (radioativo)", summary: "O frâncio é o elemento mais raro na natureza. Altamente radioativo.", group: 1, period: 7 },
  { number: 88, symbol: "Ra", name: "Radium", namePt: "Rádio", mass: 226, category: "alkaline-earth", phase: "Solid", density: 5.5, melt: 973, boil: 2010, electronegativity: 0.9, electronConfig: "[Rn] 7s²", oxidationStates: "+2", discoveredBy: "Marie Curie", yearDiscovered: 1898, appearance: "Metal branco brilhante", summary: "O rádio foi descoberto por Marie e Pierre Curie. Brilha no escuro.", group: 2, period: 7 },
  
  // Actinides (89-103)
  { number: 89, symbol: "Ac", name: "Actinium", namePt: "Actínio", mass: 227, category: "actinide", phase: "Solid", density: 10.07, melt: 1323, boil: 3471, electronegativity: 1.1, electronConfig: "[Rn] 6d¹ 7s²", oxidationStates: "+3", discoveredBy: "Friedrich Oskar Giesel", yearDiscovered: 1899, appearance: "Metal prateado", summary: "O actínio dá nome à série dos actinídeos. Altamente radioativo.", group: 3, period: 7 },
  { number: 90, symbol: "Th", name: "Thorium", namePt: "Tório", mass: 232.04, category: "actinide", phase: "Solid", density: 11.72, melt: 2023, boil: 5061, electronegativity: 1.3, electronConfig: "[Rn] 6d² 7s²", oxidationStates: "+4", discoveredBy: "Jöns Jacob Berzelius", yearDiscovered: 1829, appearance: "Metal prateado", summary: "O tório pode ser usado como combustível nuclear. Mais abundante que urânio.", group: 3, period: 7 },
  { number: 91, symbol: "Pa", name: "Protactinium", namePt: "Protactínio", mass: 231.04, category: "actinide", phase: "Solid", density: 15.37, melt: 1841, boil: 4300, electronegativity: 1.5, electronConfig: "[Rn] 5f² 6d¹ 7s²", oxidationStates: "+4, +5", discoveredBy: "Kasimir Fajans", yearDiscovered: 1913, appearance: "Metal prateado", summary: "O protactínio é raro e radioativo. Precursor do actínio.", group: 3, period: 7 },
  { number: 92, symbol: "U", name: "Uranium", namePt: "Urânio", mass: 238.03, category: "actinide", phase: "Solid", density: 18.95, melt: 1405.3, boil: 4404, electronegativity: 1.38, electronConfig: "[Rn] 5f³ 6d¹ 7s²", oxidationStates: "+3, +4, +5, +6", discoveredBy: "Martin Heinrich Klaproth", yearDiscovered: 1789, appearance: "Metal cinza-prateado", summary: "O urânio é o principal combustível nuclear. U-235 é físsil.", group: 3, period: 7 },
  { number: 93, symbol: "Np", name: "Neptunium", namePt: "Netúnio", mass: 237, category: "actinide", phase: "Solid", density: 20.45, melt: 917, boil: 4175, electronegativity: 1.36, electronConfig: "[Rn] 5f⁴ 6d¹ 7s²", oxidationStates: "+3, +4, +5, +6, +7", discoveredBy: "Edwin McMillan", yearDiscovered: 1940, appearance: "Metal prateado", summary: "O netúnio foi o primeiro elemento transurânico sintetizado.", group: 3, period: 7 },
  { number: 94, symbol: "Pu", name: "Plutonium", namePt: "Plutônio", mass: 244, category: "actinide", phase: "Solid", density: 19.84, melt: 912.5, boil: 3505, electronegativity: 1.28, electronConfig: "[Rn] 5f⁶ 7s²", oxidationStates: "+3, +4, +5, +6, +7", discoveredBy: "Glenn T. Seaborg", yearDiscovered: 1940, appearance: "Metal prateado", summary: "O plutônio é usado em armas nucleares e sondas espaciais.", group: 3, period: 7 },
  { number: 95, symbol: "Am", name: "Americium", namePt: "Amerício", mass: 243, category: "actinide", phase: "Solid", density: 13.69, melt: 1449, boil: 2880, electronegativity: 1.3, electronConfig: "[Rn] 5f⁷ 7s²", oxidationStates: "+3, +4, +5, +6", discoveredBy: "Glenn T. Seaborg", yearDiscovered: 1944, appearance: "Metal prateado", summary: "O amerício é usado em detectores de fumaça domésticos.", group: 3, period: 7 },
  { number: 96, symbol: "Cm", name: "Curium", namePt: "Cúrio", mass: 247, category: "actinide", phase: "Solid", density: 13.51, melt: 1613, boil: 3383, electronegativity: 1.3, electronConfig: "[Rn] 5f⁷ 6d¹ 7s²", oxidationStates: "+3, +4", discoveredBy: "Glenn T. Seaborg", yearDiscovered: 1944, appearance: "Metal prateado", summary: "O cúrio foi nomeado em homenagem a Marie e Pierre Curie.", group: 3, period: 7 },
  { number: 97, symbol: "Bk", name: "Berkelium", namePt: "Berquélio", mass: 247, category: "actinide", phase: "Solid", density: 14.79, melt: 1259, boil: 2900, electronegativity: 1.3, electronConfig: "[Rn] 5f⁹ 7s²", oxidationStates: "+3, +4", discoveredBy: "Lawrence Berkeley National Laboratory", yearDiscovered: 1949, appearance: "Metal prateado", summary: "O berquélio foi nomeado em homenagem a Berkeley, Califórnia.", group: 3, period: 7 },
  { number: 98, symbol: "Cf", name: "Californium", namePt: "Califórnio", mass: 251, category: "actinide", phase: "Solid", density: 15.1, melt: 1173, boil: 1743, electronegativity: 1.3, electronConfig: "[Rn] 5f¹⁰ 7s²", oxidationStates: "+2, +3, +4", discoveredBy: "Lawrence Berkeley National Laboratory", yearDiscovered: 1950, appearance: "Metal prateado", summary: "O califórnio emite nêutrons. Usado em análise de materiais.", group: 3, period: 7 },
  { number: 99, symbol: "Es", name: "Einsteinium", namePt: "Einstênio", mass: 252, category: "actinide", phase: "Solid", density: 8.84, melt: 1133, boil: 1269, electronegativity: 1.3, electronConfig: "[Rn] 5f¹¹ 7s²", oxidationStates: "+2, +3", discoveredBy: "Lawrence Berkeley National Laboratory", yearDiscovered: 1952, appearance: "Desconhecido", summary: "O einstênio foi descoberto nos destroços da primeira bomba H.", group: 3, period: 7 },
  { number: 100, symbol: "Fm", name: "Fermium", namePt: "Férmio", mass: 257, category: "actinide", phase: "Solid", density: 9.7, melt: 1800, boil: undefined, electronegativity: 1.3, electronConfig: "[Rn] 5f¹² 7s²", oxidationStates: "+2, +3", discoveredBy: "Lawrence Berkeley National Laboratory", yearDiscovered: 1952, appearance: "Desconhecido", summary: "O férmio foi nomeado em homenagem a Enrico Fermi.", group: 3, period: 7 },
  { number: 101, symbol: "Md", name: "Mendelevium", namePt: "Mendelévio", mass: 258, category: "actinide", phase: "Solid", density: 10.3, melt: 1100, boil: undefined, electronegativity: 1.3, electronConfig: "[Rn] 5f¹³ 7s²", oxidationStates: "+2, +3", discoveredBy: "Lawrence Berkeley National Laboratory", yearDiscovered: 1955, appearance: "Desconhecido", summary: "O mendelévio foi nomeado em homenagem a Dmitri Mendeleev.", group: 3, period: 7 },
  { number: 102, symbol: "No", name: "Nobelium", namePt: "Nobélio", mass: 259, category: "actinide", phase: "Solid", density: 9.9, melt: 1100, boil: undefined, electronegativity: 1.3, electronConfig: "[Rn] 5f¹⁴ 7s²", oxidationStates: "+2, +3", discoveredBy: "Joint Institute for Nuclear Research", yearDiscovered: 1958, appearance: "Desconhecido", summary: "O nobélio foi nomeado em homenagem a Alfred Nobel.", group: 3, period: 7 },
  { number: 103, symbol: "Lr", name: "Lawrencium", namePt: "Laurêncio", mass: 262, category: "actinide", phase: "Solid", density: 15.6, melt: 1900, boil: undefined, electronegativity: 1.3, electronConfig: "[Rn] 5f¹⁴ 7s² 7p¹", oxidationStates: "+3", discoveredBy: "Lawrence Berkeley National Laboratory", yearDiscovered: 1961, appearance: "Desconhecido", summary: "O laurêncio foi nomeado em homenagem a Ernest Lawrence.", group: 3, period: 7 },
  
  // Continue Period 7 (transactinides)
  { number: 104, symbol: "Rf", name: "Rutherfordium", namePt: "Rutherfórdio", mass: 267, category: "transition-metal", phase: "Solid", density: 23.2, melt: 2400, boil: 5800, electronegativity: undefined, electronConfig: "[Rn] 5f¹⁴ 6d² 7s²", oxidationStates: "+4", discoveredBy: "Joint Institute for Nuclear Research", yearDiscovered: 1964, appearance: "Desconhecido", summary: "O rutherfórdio foi nomeado em homenagem a Ernest Rutherford.", group: 4, period: 7 },
  { number: 105, symbol: "Db", name: "Dubnium", namePt: "Dúbnio", mass: 268, category: "transition-metal", phase: "Solid", density: 29.3, melt: undefined, boil: undefined, electronegativity: undefined, electronConfig: "[Rn] 5f¹⁴ 6d³ 7s²", oxidationStates: "+5", discoveredBy: "Joint Institute for Nuclear Research", yearDiscovered: 1967, appearance: "Desconhecido", summary: "O dúbnio foi nomeado em homenagem a Dubna, Rússia.", group: 5, period: 7 },
  { number: 106, symbol: "Sg", name: "Seaborgium", namePt: "Seabórgio", mass: 269, category: "transition-metal", phase: "Solid", density: 35, melt: undefined, boil: undefined, electronegativity: undefined, electronConfig: "[Rn] 5f¹⁴ 6d⁴ 7s²", oxidationStates: "+6", discoveredBy: "Lawrence Berkeley National Laboratory", yearDiscovered: 1974, appearance: "Desconhecido", summary: "O seabórgio foi nomeado em homenagem a Glenn T. Seaborg.", group: 6, period: 7 },
  { number: 107, symbol: "Bh", name: "Bohrium", namePt: "Bóhrio", mass: 270, category: "transition-metal", phase: "Solid", density: 37.1, melt: undefined, boil: undefined, electronegativity: undefined, electronConfig: "[Rn] 5f¹⁴ 6d⁵ 7s²", oxidationStates: "+7", discoveredBy: "Gesellschaft für Schwerionenforschung", yearDiscovered: 1981, appearance: "Desconhecido", summary: "O bóhrio foi nomeado em homenagem a Niels Bohr.", group: 7, period: 7 },
  { number: 108, symbol: "Hs", name: "Hassium", namePt: "Hássio", mass: 277, category: "transition-metal", phase: "Solid", density: 40.7, melt: undefined, boil: undefined, electronegativity: undefined, electronConfig: "[Rn] 5f¹⁴ 6d⁶ 7s²", oxidationStates: "+8", discoveredBy: "Gesellschaft für Schwerionenforschung", yearDiscovered: 1984, appearance: "Desconhecido", summary: "O hássio foi nomeado em homenagem a Hesse, Alemanha.", group: 8, period: 7 },
  { number: 109, symbol: "Mt", name: "Meitnerium", namePt: "Meitnério", mass: 278, category: "transition-metal", phase: "Solid", density: 37.4, melt: undefined, boil: undefined, electronegativity: undefined, electronConfig: "[Rn] 5f¹⁴ 6d⁷ 7s²", oxidationStates: "+9", discoveredBy: "Gesellschaft für Schwerionenforschung", yearDiscovered: 1982, appearance: "Desconhecido", summary: "O meitnério foi nomeado em homenagem a Lise Meitner.", group: 9, period: 7 },
  { number: 110, symbol: "Ds", name: "Darmstadtium", namePt: "Darmstádio", mass: 281, category: "transition-metal", phase: "Solid", density: 34.8, melt: undefined, boil: undefined, electronegativity: undefined, electronConfig: "[Rn] 5f¹⁴ 6d⁸ 7s²", oxidationStates: "+8", discoveredBy: "Gesellschaft für Schwerionenforschung", yearDiscovered: 1994, appearance: "Desconhecido", summary: "O darmstádio foi nomeado em homenagem a Darmstadt, Alemanha.", group: 10, period: 7 },
  { number: 111, symbol: "Rg", name: "Roentgenium", namePt: "Roentgênio", mass: 282, category: "transition-metal", phase: "Solid", density: 28.7, melt: undefined, boil: undefined, electronegativity: undefined, electronConfig: "[Rn] 5f¹⁴ 6d⁹ 7s²", oxidationStates: "+3", discoveredBy: "Gesellschaft für Schwerionenforschung", yearDiscovered: 1994, appearance: "Desconhecido", summary: "O roentgênio foi nomeado em homenagem a Wilhelm Röntgen.", group: 11, period: 7 },
  { number: 112, symbol: "Cn", name: "Copernicium", namePt: "Copernício", mass: 285, category: "transition-metal", phase: "Liquid", density: 23.7, melt: undefined, boil: 357, electronegativity: undefined, electronConfig: "[Rn] 5f¹⁴ 6d¹⁰ 7s²", oxidationStates: "+2", discoveredBy: "Gesellschaft für Schwerionenforschung", yearDiscovered: 1996, appearance: "Desconhecido", summary: "O copernício foi nomeado em homenagem a Nicolau Copérnico.", group: 12, period: 7 },
  { number: 113, symbol: "Nh", name: "Nihonium", namePt: "Nihônio", mass: 286, category: "post-transition", phase: "Solid", density: 16, melt: 700, boil: 1400, electronegativity: undefined, electronConfig: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p¹", oxidationStates: "+1, +3", discoveredBy: "RIKEN", yearDiscovered: 2004, appearance: "Desconhecido", summary: "O nihônio foi nomeado em homenagem ao Japão (Nihon).", group: 13, period: 7 },
  { number: 114, symbol: "Fl", name: "Flerovium", namePt: "Fleróvio", mass: 289, category: "post-transition", phase: "Solid", density: 14, melt: undefined, boil: 210, electronegativity: undefined, electronConfig: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p²", oxidationStates: "+2, +4", discoveredBy: "Joint Institute for Nuclear Research", yearDiscovered: 1998, appearance: "Desconhecido", summary: "O fleróvio foi nomeado em homenagem a Georgy Flyorov.", group: 14, period: 7 },
  { number: 115, symbol: "Mc", name: "Moscovium", namePt: "Moscóvio", mass: 290, category: "post-transition", phase: "Solid", density: 13.5, melt: 700, boil: 1400, electronegativity: undefined, electronConfig: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p³", oxidationStates: "+1, +3", discoveredBy: "Joint Institute for Nuclear Research", yearDiscovered: 2003, appearance: "Desconhecido", summary: "O moscóvio foi nomeado em homenagem a Moscou.", group: 15, period: 7 },
  { number: 116, symbol: "Lv", name: "Livermorium", namePt: "Livermório", mass: 293, category: "post-transition", phase: "Solid", density: 12.9, melt: 709, boil: 1085, electronegativity: undefined, electronConfig: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁴", oxidationStates: "+2, +4", discoveredBy: "Joint Institute for Nuclear Research", yearDiscovered: 2000, appearance: "Desconhecido", summary: "O livermório foi nomeado em homenagem ao Laboratório Lawrence Livermore.", group: 16, period: 7 },
  { number: 117, symbol: "Ts", name: "Tennessine", namePt: "Tennesso", mass: 294, category: "halogen", phase: "Solid", density: 7.2, melt: 723, boil: 883, electronegativity: undefined, electronConfig: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁵", oxidationStates: "-1, +1, +3, +5", discoveredBy: "Joint Institute for Nuclear Research", yearDiscovered: 2010, appearance: "Desconhecido", summary: "O tennesso foi nomeado em homenagem ao Tennessee, EUA.", group: 17, period: 7 },
  { number: 118, symbol: "Og", name: "Oganesson", namePt: "Oganessônio", mass: 294, category: "noble-gas", phase: "Solid", density: 4.9, melt: undefined, boil: 350, electronegativity: undefined, electronConfig: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁶", oxidationStates: "0, +2, +4", discoveredBy: "Joint Institute for Nuclear Research", yearDiscovered: 2002, appearance: "Desconhecido", summary: "O oganessônio foi nomeado em homenagem a Yuri Oganessian. É o elemento mais pesado conhecido.", group: 18, period: 7 },
];

// Category colors
const categoryColors: Record<string, { bg: string; border: string; text: string }> = {
  "alkali-metal": { bg: "bg-red-500/30", border: "border-red-500", text: "text-red-400" },
  "alkaline-earth": { bg: "bg-orange-500/30", border: "border-orange-500", text: "text-orange-400" },
  "transition-metal": { bg: "bg-yellow-500/30", border: "border-yellow-500", text: "text-yellow-400" },
  "post-transition": { bg: "bg-green-500/30", border: "border-green-500", text: "text-green-400" },
  "metalloid": { bg: "bg-teal-500/30", border: "border-teal-500", text: "text-teal-400" },
  "nonmetal": { bg: "bg-cyan-500/30", border: "border-cyan-500", text: "text-cyan-400" },
  "halogen": { bg: "bg-blue-500/30", border: "border-blue-500", text: "text-blue-400" },
  "noble-gas": { bg: "bg-purple-500/30", border: "border-purple-500", text: "text-purple-400" },
  "lanthanide": { bg: "bg-pink-500/30", border: "border-pink-500", text: "text-pink-400" },
  "actinide": { bg: "bg-rose-500/30", border: "border-rose-500", text: "text-rose-400" },
};

const categoryNamesPt: Record<string, string> = {
  "alkali-metal": "Metal Alcalino",
  "alkaline-earth": "Metal Alcalino-Terroso",
  "transition-metal": "Metal de Transição",
  "post-transition": "Metal de Pós-Transição",
  "metalloid": "Metaloide",
  "nonmetal": "Não-Metal",
  "halogen": "Halogênio",
  "noble-gas": "Gás Nobre",
  "lanthanide": "Lantanídeo",
  "actinide": "Actinídeo",
};

const phaseIcons: Record<string, string> = {
  "Solid": "�ite",
  "Liquid": "💧",
  "Gas": "💨",
};

export function PeriodicTableButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 hover:bg-primary/10 hover:text-primary transition-all duration-200 group"
          title="Tabela Periódica"
        >
          <Atom className="h-5 w-5 group-hover:scale-110 group-hover:rotate-180 transition-all duration-500" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[98vw] w-[1400px] max-h-[95vh] p-0 gap-0 overflow-hidden bg-gradient-to-br from-background via-background to-background/95 border-primary/30">
        <DialogHeader className="px-4 py-2 border-b border-border/50 bg-gradient-to-r from-primary/10 via-transparent to-accent/10">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="p-1.5 rounded-lg bg-primary/20 animate-pulse">
              <Atom className="h-5 w-5 text-primary" />
            </div>
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-bold">
              Tabela Periódica dos Elementos
            </span>
            <span className="text-xs text-muted-foreground ml-2">IUPAC 2024</span>
          </DialogTitle>
        </DialogHeader>
        <PeriodicTableContent />
      </DialogContent>
    </Dialog>
  );
}

function PeriodicTableContent() {
  const [selectedElement, setSelectedElement] = useState<Element | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const getGridPosition = (element: Element) => {
    // Handle lanthanides and actinides separately
    if (element.category === "lanthanide") {
      return { gridColumn: element.number - 54, gridRow: 9 };
    }
    if (element.category === "actinide") {
      return { gridColumn: element.number - 86, gridRow: 10 };
    }
    return { gridColumn: element.group, gridRow: element.period };
  };

  const ElementCell = ({ element }: { element: Element }) => {
    const colors = categoryColors[element.category] || categoryColors["nonmetal"];
    const isHovered = hoveredCategory === element.category;
    const isSelected = selectedElement?.number === element.number;

    return (
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: element.number * 0.003 }}
        whileHover={{ scale: 1.15, zIndex: 50 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setSelectedElement(element)}
        onMouseEnter={() => setHoveredCategory(element.category)}
        onMouseLeave={() => setHoveredCategory(null)}
        className={cn(
          "relative w-[52px] h-[52px] rounded-lg border-2 transition-all duration-200 flex flex-col items-center justify-center p-0.5 cursor-pointer",
          colors.bg,
          colors.border,
          isHovered && "ring-2 ring-white/30",
          isSelected && "ring-2 ring-primary shadow-lg shadow-primary/50"
        )}
        style={getGridPosition(element)}
        title={`${element.namePt} (${element.name})`}
      >
        <span className="text-[9px] text-muted-foreground absolute top-0.5 left-1">{element.number}</span>
        <span className={cn("text-lg font-bold", colors.text)}>{element.symbol}</span>
        <span className="text-[8px] text-muted-foreground truncate w-full text-center leading-tight">{element.namePt}</span>
        <span className="text-[7px] text-muted-foreground/70">{element.mass.toFixed(2)}</span>
      </motion.button>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4">
        <div className="flex gap-4">
          {/* Periodic Table Grid */}
          <div className="flex-1 min-w-0">
            {/* Main Table */}
            <div 
              className="grid gap-0.5 mb-4"
              style={{ 
                gridTemplateColumns: "repeat(18, 52px)",
                gridTemplateRows: "repeat(7, 52px)"
              }}
            >
              {elements.filter(e => e.category !== "lanthanide" && e.category !== "actinide").map(element => (
                <ElementCell key={element.number} element={element} />
              ))}
              
              {/* Lanthanide/Actinide placeholder */}
              <div 
                className="col-span-1 row-span-1 flex items-center justify-center text-xs text-muted-foreground"
                style={{ gridColumn: 3, gridRow: 6 }}
              >
                <span className="text-pink-400">57-71</span>
              </div>
              <div 
                className="col-span-1 row-span-1 flex items-center justify-center text-xs text-muted-foreground"
                style={{ gridColumn: 3, gridRow: 7 }}
              >
                <span className="text-rose-400">89-103</span>
              </div>
            </div>

            {/* Lanthanides */}
            <div className="mb-2">
              <div className="text-xs text-pink-400 mb-1 ml-2">Lantanídeos</div>
              <div className="grid gap-0.5" style={{ gridTemplateColumns: "repeat(15, 52px)" }}>
                {elements.filter(e => e.category === "lanthanide").map(element => (
                  <ElementCell key={element.number} element={element} />
                ))}
              </div>
            </div>

            {/* Actinides */}
            <div>
              <div className="text-xs text-rose-400 mb-1 ml-2">Actinídeos</div>
              <div className="grid gap-0.5" style={{ gridTemplateColumns: "repeat(15, 52px)" }}>
                {elements.filter(e => e.category === "actinide").map(element => (
                  <ElementCell key={element.number} element={element} />
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-2">
              {Object.entries(categoryColors).map(([category, colors]) => (
                <div
                  key={category}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-md border transition-all cursor-pointer",
                    colors.bg,
                    colors.border,
                    hoveredCategory === category && "ring-2 ring-white/30 scale-105"
                  )}
                  onMouseEnter={() => setHoveredCategory(category)}
                  onMouseLeave={() => setHoveredCategory(null)}
                >
                  <span className={cn("text-xs font-medium", colors.text)}>
                    {categoryNamesPt[category]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Element Details Panel */}
          <AnimatePresence mode="wait">
            {selectedElement && (
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                className="w-[320px] bg-secondary/30 rounded-xl border border-border/50 p-4 flex-shrink-0"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className={cn(
                      "text-6xl font-bold",
                      categoryColors[selectedElement.category]?.text
                    )}>
                      {selectedElement.symbol}
                    </div>
                    <div className="text-xl font-semibold mt-1">{selectedElement.namePt}</div>
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
                  "inline-flex items-center px-2 py-1 rounded-md text-xs mb-4",
                  categoryColors[selectedElement.category]?.bg,
                  categoryColors[selectedElement.category]?.border,
                  "border"
                )}>
                  {categoryNamesPt[selectedElement.category]}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-background/50 rounded-lg p-2">
                    <div className="text-xs text-muted-foreground">Número Atômico</div>
                    <div className="text-lg font-bold text-primary">{selectedElement.number}</div>
                  </div>
                  <div className="bg-background/50 rounded-lg p-2">
                    <div className="text-xs text-muted-foreground">Massa Atômica</div>
                    <div className="text-lg font-bold">{selectedElement.mass.toFixed(4)}</div>
                  </div>
                  <div className="bg-background/50 rounded-lg p-2">
                    <div className="text-xs text-muted-foreground">Estado Físico (25°C)</div>
                    <div className="text-lg font-bold flex items-center gap-1">
                      {selectedElement.phase === "Solid" && "�ite"}
                      {selectedElement.phase === "Liquid" && "💧"}
                      {selectedElement.phase === "Gas" && "💨"}
                      <span className="text-sm">{selectedElement.phase === "Solid" ? "Sólido" : selectedElement.phase === "Liquid" ? "Líquido" : "Gás"}</span>
                    </div>
                  </div>
                  {selectedElement.electronegativity && (
                    <div className="bg-background/50 rounded-lg p-2">
                      <div className="text-xs text-muted-foreground">Eletronegatividade</div>
                      <div className="text-lg font-bold">{selectedElement.electronegativity}</div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="bg-background/50 rounded-lg p-2">
                    <div className="text-xs text-muted-foreground mb-1">Configuração Eletrônica</div>
                    <div className="text-sm font-mono">{selectedElement.electronConfig}</div>
                  </div>

                  <div className="bg-background/50 rounded-lg p-2">
                    <div className="text-xs text-muted-foreground mb-1">Estados de Oxidação</div>
                    <div className="text-sm font-mono">{selectedElement.oxidationStates}</div>
                  </div>

                  {(selectedElement.melt || selectedElement.boil) && (
                    <div className="grid grid-cols-2 gap-2">
                      {selectedElement.melt && (
                        <div className="bg-background/50 rounded-lg p-2">
                          <div className="text-xs text-muted-foreground">Ponto de Fusão</div>
                          <div className="text-sm font-bold">{selectedElement.melt} K</div>
                          <div className="text-xs text-muted-foreground">({(selectedElement.melt - 273.15).toFixed(1)}°C)</div>
                        </div>
                      )}
                      {selectedElement.boil && (
                        <div className="bg-background/50 rounded-lg p-2">
                          <div className="text-xs text-muted-foreground">Ponto de Ebulição</div>
                          <div className="text-sm font-bold">{selectedElement.boil} K</div>
                          <div className="text-xs text-muted-foreground">({(selectedElement.boil - 273.15).toFixed(1)}°C)</div>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedElement.density && (
                    <div className="bg-background/50 rounded-lg p-2">
                      <div className="text-xs text-muted-foreground">Densidade</div>
                      <div className="text-sm font-bold">{selectedElement.density} g/cm³</div>
                    </div>
                  )}

                  {selectedElement.discoveredBy && (
                    <div className="bg-background/50 rounded-lg p-2">
                      <div className="text-xs text-muted-foreground">Descoberto por</div>
                      <div className="text-sm">{selectedElement.discoveredBy}</div>
                      <div className="text-xs text-muted-foreground">({selectedElement.yearDiscovered})</div>
                    </div>
                  )}

                  <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg p-3 border border-primary/20">
                    <div className="text-xs text-muted-foreground mb-1">Sobre</div>
                    <div className="text-sm leading-relaxed">{selectedElement.summary}</div>
                  </div>

                  <a
                    href={`https://pubchem.ncbi.nlm.nih.gov/element/${selectedElement.number}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary text-sm transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Ver no PubChem
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty state when no element selected */}
          {!selectedElement && (
            <div className="w-[320px] bg-secondary/20 rounded-xl border border-dashed border-border/50 p-6 flex flex-col items-center justify-center text-center flex-shrink-0">
              <Beaker className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="font-semibold text-muted-foreground">Selecione um Elemento</h3>
              <p className="text-sm text-muted-foreground/70 mt-2">
                Clique em qualquer elemento da tabela para ver suas propriedades detalhadas
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
