// ============================================
// GRAND FINALE CTA - VERSÃO 2500
// Chamada épica final para conversão máxima
// ============================================

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Rocket, ArrowRight, Shield, Clock, Award, 
  CheckCircle, Star, Crown, Gift, Timer, Sparkles, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";

const benefits = [
  "Acesso vitalício a todo conteúdo",
  "Atualizações gratuitas para sempre",
  "Suporte 24/7 via WhatsApp + IA",
  "Garantia de 30 dias",
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
        if (seconds < 0) { seconds = 59; minutes--; }
        if (minutes < 0) { minutes = 59; hours--; }
        if (hours < 0) { hours = 23; }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center justify-center gap-4">
      {Object.entries(time).map(([key, value]) => (
        <div key={key} className="text-center">
          <motion.div
            className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-2xl shadow-red-500/40 border border-red-500/30"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <span className="text-3xl md:text-4xl font-black text-white">
              {value.toString().padStart(2, '0')}
            </span>
          </motion.div>
          <span className="text-xs text-gray-400 mt-2 block uppercase tracking-widest">
            {key === 'hours' ? 'Horas' : key === 'minutes' ? 'Min' : 'Seg'}
          </span>
        </div>
      ))}
    </div>
  );
};

export const EpicCTASection = () => {
  return (
    <section className="relative py-40 overflow-hidden">
      {/* Background épico */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-red-950/20 to-black" />
        
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(220, 38, 38, 0.25) 0%, transparent 60%)',
            filter: 'blur(100px)',
          }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
      </div>

      {/* Estrelas flutuantes */}
      {[...Array(40)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
          animate={{ y: [0, -25, 0], opacity: [0.2, 0.9, 0.2], scale: [1, 1.5, 1] }}
          transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
        >
          <Star className="w-3 h-3 text-amber-400/60" fill="currentColor" />
        </motion.div>
      ))}

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto text-center"
        >
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-amber-500/20 to-red-500/20 border border-amber-500/40 mb-10"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Crown className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-bold text-amber-400 tracking-wide">OFERTA ESPECIAL POR TEMPO LIMITADO</span>
            <Crown className="w-5 h-5 text-amber-400" />
          </motion.div>

          {/* Countdown */}
          <div className="mb-12">
            <p className="text-gray-400 mb-5 flex items-center justify-center gap-2">
              <Timer className="w-5 h-5 text-red-400" />
              Oferta expira em:
            </p>
            <CountdownTimer />
          </div>

          {/* Headline */}
          <motion.h2
            className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-8 leading-tight"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Sua{' '}
            <motion.span 
              className="bg-gradient-to-r from-red-500 via-amber-500 to-red-500 bg-clip-text text-transparent"
              animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
              style={{ backgroundSize: '200% 200%' }}
              transition={{ duration: 5, repeat: Infinity }}
            >
              Aprovação
            </motion.span>
            <br />Está a Um Clique
          </motion.h2>

          <motion.p className="text-xl text-gray-300 mb-14 max-w-3xl mx-auto">
            Junte-se a mais de <span className="text-red-400 font-bold">10.000 alunos aprovados</span> e transforme seu sonho em realidade.
          </motion.p>

          {/* Benefits grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-14 max-w-4xl mx-auto">
            {benefits.map((benefit, i) => (
              <motion.div
                key={benefit}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.05] border border-white/10 text-left"
              >
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span className="text-sm text-gray-300">{benefit}</span>
              </motion.div>
            ))}
          </div>

          {/* CTA Button épico */}
          <Link to="/auth">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="relative inline-block mb-10">
              <div className="absolute -inset-2 bg-gradient-to-r from-red-600 via-amber-500 to-red-600 rounded-2xl blur-lg opacity-70" />
              <Button
                size="lg"
                className="relative bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white border-0 shadow-2xl shadow-red-500/50 px-14 h-20 text-xl font-black rounded-2xl"
              >
                <Rocket className="w-6 h-6 mr-3 animate-bounce" />
                QUERO MINHA APROVAÇÃO
                <ArrowRight className="w-6 h-6 ml-3" />
              </Button>
            </motion.div>
          </Link>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2"><Shield className="w-5 h-5 text-green-400" /><span>Compra 100% Segura</span></div>
            <div className="flex items-center gap-2"><Clock className="w-5 h-5 text-blue-400" /><span>Acesso Imediato</span></div>
            <div className="flex items-center gap-2"><Award className="w-5 h-5 text-amber-400" /><span>Garantia de 30 Dias</span></div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
