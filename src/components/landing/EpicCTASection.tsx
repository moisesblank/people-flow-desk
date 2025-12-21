// ============================================
// GRAND FINALE - CTA ÉPICO
// Chamada final para conversão máxima
// ============================================

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Rocket, ArrowRight, Shield, Clock, Award, 
  CheckCircle, Star, Zap, Crown, Gift,
  Timer, Sparkles, Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";

const benefits = [
  "Acesso vitalício a todo conteúdo",
  "Atualizações gratuitas para sempre",
  "Suporte 24/7 via WhatsApp",
  "Garantia de 30 dias ou seu dinheiro de volta",
  "Comunidade VIP exclusiva",
  "Certificado de conclusão",
];

const CountdownTimer = () => {
  const [time, setTime] = useState({ hours: 23, minutes: 59, seconds: 59 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(prev => {
        let { hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) {
          seconds = 59;
          minutes--;
        }
        if (minutes < 0) {
          minutes = 59;
          hours--;
        }
        if (hours < 0) {
          hours = 23;
        }
        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center justify-center gap-3">
      {Object.entries(time).map(([key, value]) => (
        <div key={key} className="text-center">
          <motion.div
            className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/30"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <span className="text-2xl md:text-3xl font-black text-white">
              {value.toString().padStart(2, '0')}
            </span>
          </motion.div>
          <span className="text-xs text-gray-400 mt-1 block uppercase tracking-wider">
            {key === 'hours' ? 'Horas' : key === 'minutes' ? 'Min' : 'Seg'}
          </span>
        </div>
      ))}
    </div>
  );
};

const FloatingElements = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Estrelas flutuantes */}
    {[...Array(30)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
        }}
        animate={{
          y: [0, -20, 0],
          opacity: [0.2, 0.8, 0.2],
          scale: [1, 1.5, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 3 + Math.random() * 2,
          repeat: Infinity,
          delay: Math.random() * 2,
        }}
      >
        <Star className="w-3 h-3 text-amber-400/50" fill="currentColor" />
      </motion.div>
    ))}

    {/* Linhas de energia */}
    <motion.div
      className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500 to-transparent"
      style={{ top: '20%' }}
      animate={{ opacity: [0, 0.5, 0], scaleX: [0.5, 1, 0.5] }}
      transition={{ duration: 4, repeat: Infinity }}
    />
    <motion.div
      className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent"
      style={{ top: '80%' }}
      animate={{ opacity: [0, 0.5, 0], scaleX: [0.5, 1, 0.5] }}
      transition={{ duration: 4, repeat: Infinity, delay: 2 }}
    />
  </div>
);

export const EpicCTASection = () => {
  const [showOffer, setShowOffer] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowOffer(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background épico */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-red-950/20 to-black" />
        
        {/* Orbe central */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(220, 38, 38, 0.3) 0%, rgba(220, 38, 38, 0.1) 40%, transparent 70%)',
            filter: 'blur(80px)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
      </div>

      <FloatingElements />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500/20 to-red-500/20 border border-amber-500/30 mb-8"
          >
            <Crown className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-bold text-amber-400 tracking-wide">OFERTA ESPECIAL POR TEMPO LIMITADO</span>
            <Crown className="w-5 h-5 text-amber-400" />
          </motion.div>

          {/* Countdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10"
          >
            <p className="text-gray-400 mb-4 flex items-center justify-center gap-2">
              <Timer className="w-4 h-4 text-red-400" />
              Oferta expira em:
            </p>
            <CountdownTimer />
          </motion.div>

          {/* Headline */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight"
          >
            Sua <span className="bg-gradient-to-r from-red-500 via-amber-500 to-red-500 bg-clip-text text-transparent">Aprovação</span>
            <br />
            Está a Um Clique
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto"
          >
            Junte-se a mais de 10.000 alunos aprovados e transforme seu sonho em realidade. 
            O melhor investimento da sua vida começa agora.
          </motion.p>

          {/* Benefits grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12 max-w-3xl mx-auto"
          >
            {benefits.map((benefit, i) => (
              <motion.div
                key={benefit}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-2 text-left p-3 rounded-xl bg-white/5 border border-white/10"
              >
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span className="text-sm text-gray-300">{benefit}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, type: "spring" }}
            className="mb-8"
          >
            <Link to="/auth">
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="relative inline-block"
              >
                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-red-600 via-amber-500 to-red-600 rounded-2xl blur-lg opacity-70 group-hover:opacity-100 transition-opacity" />
                
                <Button
                  size="lg"
                  className="relative bg-gradient-to-r from-red-600 via-red-500 to-red-600 hover:from-red-500 hover:to-red-500 text-white border-0 shadow-2xl shadow-red-500/40 px-12 h-20 text-xl font-black rounded-2xl"
                >
                  <Rocket className="w-6 h-6 mr-3 animate-bounce" />
                  QUERO MINHA APROVAÇÃO
                  <ArrowRight className="w-6 h-6 ml-3" />
                </Button>
              </motion.div>
            </Link>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-400" />
              <span>Compra 100% Segura</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <span>Acesso Imediato</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <span>Garantia de 30 Dias</span>
            </div>
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
            className="mt-12 flex items-center justify-center gap-4"
          >
            <div className="flex -space-x-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-purple-600 border-2 border-black flex items-center justify-center"
                >
                  <span className="text-xs font-bold text-white">
                    {String.fromCharCode(65 + i)}
                  </span>
                </div>
              ))}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4" fill="currentColor" />
                ))}
              </div>
              <p className="text-sm text-gray-400">
                +500 alunos se matricularam esta semana
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Floating offer popup */}
      <AnimatePresence>
        {showOffer && (
          <motion.div
            initial={{ opacity: 0, y: 100, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-4 left-1/2 z-50 w-full max-w-md px-4"
          >
            <div className="relative p-4 rounded-2xl bg-gradient-to-r from-red-900/95 to-purple-900/95 backdrop-blur-xl border border-red-500/30 shadow-2xl shadow-red-500/20">
              <button
                onClick={() => setShowOffer(false)}
                className="absolute top-2 right-2 text-gray-400 hover:text-white"
              >
                ×
              </button>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-red-500">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-bold">Bônus Exclusivo! 🎁</p>
                  <p className="text-sm text-gray-300">Matricule-se agora e ganhe 3 simulados grátis</p>
                </div>
                <Link to="/auth">
                  <Button size="sm" className="bg-white text-black hover:bg-gray-100">
                    Quero!
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
