// ============================================
// NAVBAR FUTURISTA 2500 - ULTRA PREMIUM
// Com efeitos holográficos e animações épicas
// ============================================

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Menu, X, Rocket, Atom, Sparkles, ChevronRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoMoises from "@/assets/logo-moises-medeiros.png";

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { href: "#metodo", label: "Método", icon: Sparkles },
    { href: "#cursos", label: "Cursos", icon: Atom },
    { href: "#depoimentos", label: "Depoimentos", icon: Zap },
  ];

  return (
    <>
      <motion.nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
          scrolled 
            ? "bg-black/95 backdrop-blur-3xl border-b border-red-900/40 py-3 shadow-2xl shadow-black/50" 
            : "bg-transparent py-6"
        }`} 
        initial={{ y: -100, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, type: "spring" }}
      >
        {/* Linha de energia no topo quando scrolled */}
        {scrolled && (
          <motion.div
            className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5 }}
          />
        )}
        
        <div className="container mx-auto px-4 flex items-center justify-between">
          {/* Logo com efeitos */}
          <Link to="/">
            <motion.div 
              className="relative group"
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
            >
              {/* Glow atrás do logo */}
              <motion.div
                className="absolute -inset-4 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  background: 'radial-gradient(circle, rgba(220, 38, 38, 0.3) 0%, transparent 70%)',
                  filter: 'blur(15px)',
                }}
              />
              <motion.img 
                src={logoMoises} 
                alt="Moisés Medeiros" 
                className="h-11 md:h-13 relative z-10" 
                style={{
                  filter: scrolled 
                    ? 'drop-shadow(0 0 20px rgba(220, 38, 38, 0.4))' 
                    : 'drop-shadow(0 0 10px rgba(220, 38, 38, 0.2))',
                }}
              />
            </motion.div>
          </Link>
          
          {/* Links de navegação - Desktop */}
          <div className="hidden lg:flex items-center gap-12">
            {navLinks.map((link, i) => (
              <motion.a 
                key={link.href} 
                href={link.href} 
                className="relative group flex items-center gap-2 text-sm font-bold text-gray-300 hover:text-white transition-colors"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
              >
                <link.icon className="w-4 h-4 text-gray-500 group-hover:text-red-400 transition-colors" />
                <span>{link.label}</span>
                
                {/* Underline animada */}
                <motion.span 
                  className="absolute -bottom-1.5 left-0 h-0.5 bg-gradient-to-r from-red-600 via-amber-500 to-red-600 rounded-full"
                  initial={{ width: 0 }}
                  whileHover={{ width: '100%' }}
                  transition={{ duration: 0.3 }}
                />
              </motion.a>
            ))}
          </div>
          
          {/* Botões de ação - Desktop */}
          <div className="hidden lg:flex items-center gap-5">
            <Link to="/auth">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Button 
                  variant="ghost" 
                  className="text-gray-300 hover:text-white hover:bg-white/10 font-semibold"
                >
                  Área do Aluno
                </Button>
              </motion.div>
            </Link>
            
            <Link to="/auth">
              <motion.div 
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="relative group"
              >
                {/* Glow pulsante */}
                <motion.div
                  className="absolute -inset-1 bg-gradient-to-r from-red-600 to-amber-600 rounded-xl blur-lg opacity-50 group-hover:opacity-80 transition-opacity"
                  animate={{ opacity: [0.4, 0.7, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <Button className="relative bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white shadow-xl shadow-red-500/40 px-7 h-12 font-black rounded-xl border-0">
                  <Rocket className="w-5 h-5 mr-2" />
                  Matricule-se
                  <ChevronRight className="w-4 h-4 ml-1 opacity-70" />
                </Button>
              </motion.div>
            </Link>
          </div>
          
          {/* Botão do menu mobile */}
          <motion.button 
            className="lg:hidden p-3 text-white rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors" 
            onClick={() => setMobileOpen(!mobileOpen)}
            whileTap={{ scale: 0.9 }}
          >
            <AnimatePresence mode="wait">
              {mobileOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                >
                  <X className="w-7 h-7" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                >
                  <Menu className="w-7 h-7" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.nav>

      {/* Menu mobile épico */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-black/98 backdrop-blur-3xl pt-28 px-6 lg:hidden overflow-y-auto"
          >
            {/* Background effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div
                className="absolute left-1/4 top-1/4 w-[400px] h-[400px] rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(220, 38, 38, 0.2) 0%, transparent 70%)',
                  filter: 'blur(100px)',
                }}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{ duration: 6, repeat: Infinity }}
              />
            </div>
            
            <div className="relative z-10 flex flex-col gap-4">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="group flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-red-500/30 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-red-600/20 to-amber-600/20 border border-red-500/20">
                      <link.icon className="w-6 h-6 text-red-400" />
                    </div>
                    <span className="text-xl font-bold text-white">{link.label}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-red-400 transition-colors" />
                </motion.a>
              ))}
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-8 space-y-4"
              >
                <Link to="/auth" onClick={() => setMobileOpen(false)}>
                  <div className="relative">
                    <motion.div
                      className="absolute -inset-1 bg-gradient-to-r from-red-600 to-amber-600 rounded-2xl blur-lg opacity-60"
                      animate={{ opacity: [0.4, 0.7, 0.4] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <Button className="relative w-full bg-gradient-to-r from-red-700 to-red-600 text-white h-16 text-lg font-black rounded-2xl border-0">
                      <Rocket className="w-6 h-6 mr-3" />
                      Matricule-se Agora
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </Link>
                
                <Link to="/auth" onClick={() => setMobileOpen(false)}>
                  <Button 
                    variant="outline" 
                    className="w-full border-2 border-gray-700 hover:border-red-500/50 h-14 text-base font-semibold rounded-2xl bg-white/5"
                  >
                    Área do Aluno
                  </Button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
