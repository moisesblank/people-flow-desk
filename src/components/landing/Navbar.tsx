// ============================================
// NAVBAR FUTURISTA 2500 - ULTRA LITE
// Performance extrema para mobile/3G
// ============================================

import { useState, useEffect, memo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Menu, X, Rocket, Atom, Sparkles, Zap, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePerformance } from "@/hooks/usePerformance";
import { useQuantumReactivity } from "@/hooks/useQuantumReactivity";
import logoMoises from "@/assets/logo-moises-medeiros.png";

const navLinks = [
  { href: "#metodo", label: "Método", icon: Sparkles },
  { href: "#cursos", label: "Cursos", icon: Atom },
  { href: "#depoimentos", label: "Depoimentos", icon: Zap },
];

// Menu mobile otimizado
const MobileMenu = memo(({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void;
}) => (
  <AnimatePresence>
    {isOpen && (
      <>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/95 z-40"
          onClick={onClose}
        />
        
        {/* Menu */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "tween", duration: 0.25 }}
          className="fixed top-0 right-0 bottom-0 w-72 bg-black border-l border-red-900/30 z-50 p-6"
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="mt-12 space-y-6">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={onClose}
                className="flex items-center gap-3 text-lg font-bold text-gray-300 hover:text-white transition-colors"
              >
                <link.icon className="w-5 h-5 text-red-400" />
                {link.label}
              </a>
            ))}
            
            <div className="pt-6 border-t border-white/10 space-y-3">
              <Link to="/area-gratuita" onClick={onClose}>
                <Button variant="outline" className="w-full border-gray-700 hover:border-cyan-500/50 text-gray-300">
                  <Gift className="w-4 h-4 mr-2" />
                  Área Gratuita
                </Button>
              </Link>
              <Link to="/auth" onClick={onClose}>
                <Button className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white font-bold">
                  <Rocket className="w-4 h-4 mr-2" />
                  Área do Aluno
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
));

MobileMenu.displayName = "MobileMenu";

export const Navbar = memo(() => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { disableAnimations } = usePerformance();
  
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleMobile = useCallback(() => {
    setMobileOpen(prev => !prev);
  }, []);

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
  }, []);

  // Versão sem animações
  if (disableAnimations) {
    return (
      <>
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled 
            ? "bg-black/95 backdrop-blur-md border-b border-red-900/30 py-3" 
            : "bg-transparent py-4"
        }`}>
          <div className="container mx-auto px-4 flex items-center justify-between">
            <Link to="/">
              <img src={logoMoises} alt="Moisés Medeiros" width={115} height={48} className="h-10 md:h-12" decoding="async" />
            </Link>
            
            {/* Desktop */}
            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <a 
                  key={link.href} 
                  href={link.href} 
                  className="group nav-link-2300 flex items-center gap-2 text-sm font-bold text-gray-300 hover:text-white"
                >
                  <link.icon className="w-4 h-4 nav-icon-2300 text-gray-500" />
                  {link.label}
                </a>
              ))}
            </div>
            
            <div className="hidden lg:flex items-center gap-3">
              <Link to="/area-gratuita">
                <Button className="btn-cta-secondary-2300 text-foreground font-semibold rounded-lg">
                  <Gift className="w-4 h-4 mr-2" />
                  Área Gratuita
                </Button>
              </Link>
              <Link to="/auth">
                <Button className="btn-cta-2300 text-white font-bold rounded-lg">
                  <Rocket className="w-4 h-4 mr-2" />
                  Área do Aluno
                </Button>
              </Link>
            </div>
            
            {/* Mobile button */}
            <button 
              onClick={toggleMobile}
              className="lg:hidden p-2 text-gray-300"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </nav>
        
        <MobileMenu isOpen={mobileOpen} onClose={closeMobile} />
      </>
    );
  }

  return (
    <>
      <motion.nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled 
            ? "bg-black/95 backdrop-blur-md border-b border-red-900/30 py-3" 
            : "bg-transparent py-4 md:py-6"
        }`} 
        initial={{ y: -100, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/">
            <motion.img 
              src={logoMoises} 
              alt="Moisés Medeiros" 
              width={115}
              height={48}
              className="h-10 md:h-12"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              decoding="async"
              style={{
                filter: scrolled 
                  ? "drop-shadow(0 0 15px rgba(220, 38, 38, 0.3))" 
                  : "none",
              }}
            />
          </Link>
          
          {/* Links - Desktop */}
          <div className="hidden lg:flex items-center gap-10">
            {navLinks.map((link, i) => (
              <motion.a 
                key={link.href} 
                href={link.href} 
                className="group nav-link-2300 flex items-center gap-2 text-sm font-bold text-gray-300 hover:text-white"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
              >
                <link.icon className="w-4 h-4 nav-icon-2300 text-gray-500" />
                <span>{link.label}</span>
              </motion.a>
            ))}
          </div>
          
          {/* CTA - Desktop */}
          <motion.div 
            className="hidden lg:flex items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Link to="/area-gratuita">
              <Button className="btn-cta-secondary-2300 text-foreground font-semibold rounded-lg">
                <Gift className="w-4 h-4 mr-2" />
                Área Gratuita
              </Button>
            </Link>
            <Link to="/auth">
              <Button className="btn-cta-2300 text-white font-bold rounded-lg">
                <Rocket className="w-4 h-4 mr-2" />
                Área do Aluno
              </Button>
            </Link>
          </motion.div>
          
          {/* Mobile menu button */}
          <motion.button 
            onClick={toggleMobile}
            className="lg:hidden p-2 text-gray-300 hover:text-white"
            whileTap={{ scale: 0.9 }}
          >
            <Menu className="w-6 h-6" />
          </motion.button>
        </div>
      </motion.nav>
      
      <MobileMenu isOpen={mobileOpen} onClose={closeMobile} />
    </>
  );
});

Navbar.displayName = "Navbar";
