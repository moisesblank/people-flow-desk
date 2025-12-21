// ============================================
// NAVBAR FUTURISTA 2500
// ============================================

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Menu, X, Rocket, Atom } from "lucide-react";
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
    { href: "#metodo", label: "Método" },
    { href: "#cursos", label: "Cursos" },
    { href: "#depoimentos", label: "Depoimentos" },
  ];

  return (
    <>
      <motion.nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled 
            ? "bg-black/90 backdrop-blur-2xl border-b border-red-900/30 py-3" 
            : "bg-transparent py-6"
        }`} 
        initial={{ y: -100 }} 
        animate={{ y: 0 }}
      >
        <div className="container mx-auto px-4 flex items-center justify-between">
          <Link to="/">
            <motion.img 
              src={logoMoises} 
              alt="Moisés Medeiros" 
              className="h-10 md:h-12" 
              whileHover={{ scale: 1.05 }} 
            />
          </Link>
          
          <div className="hidden lg:flex items-center gap-10">
            {navLinks.map(link => (
              <a 
                key={link.href} 
                href={link.href} 
                className="text-sm font-semibold text-gray-300 hover:text-white transition-colors relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-red-600 to-amber-500 group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </div>
          
          <div className="hidden lg:flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost" className="text-gray-300 hover:text-white">
                Área do Aluno
              </Button>
            </Link>
            <Link to="/auth">
              <motion.div whileHover={{ scale: 1.05 }}>
                <Button className="bg-gradient-to-r from-red-700 to-red-600 text-white shadow-lg shadow-red-500/30 px-6 font-bold">
                  <Rocket className="w-4 h-4 mr-2" />
                  Matricule-se
                </Button>
              </motion.div>
            </Link>
          </div>
          
          <button 
            className="lg:hidden p-2 text-white" 
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-black/95 backdrop-blur-xl pt-24 px-6 lg:hidden"
          >
            <div className="flex flex-col gap-6">
              {navLinks.map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-2xl font-bold text-white"
                >
                  {link.label}
                </a>
              ))}
              <Link to="/auth" onClick={() => setMobileOpen(false)}>
                <Button className="w-full bg-gradient-to-r from-red-700 to-red-600 text-white h-14 text-lg font-bold mt-6">
                  <Rocket className="w-5 h-5 mr-2" />
                  Matricule-se
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
