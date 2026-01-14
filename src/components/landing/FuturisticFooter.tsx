// ============================================
// FOOTER FUTURISTA COMPLETO 2500
// GPU-ONLY animations via useQuantumReactivity
// ============================================

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Youtube, Instagram, Phone, Mail, MapPin, 
  Heart, ExternalLink, Shield, Award, Zap,
  Atom, Sparkles, Star, ChevronRight, Globe
} from "lucide-react";
import logoMoises from "@/assets/logo-moises-medeiros.png";
import { useQuantumReactivity } from "@/hooks/useQuantumReactivity";
import { SacredImage } from "@/components/performance/SacredImage";

const footerLinks = {
  cursos: [
    { label: 'ENEM Completo', href: '/auth' },
    { label: 'Medicina', href: '/auth' },
    { label: 'Intensivão', href: '/auth' },
    { label: 'Simulados', href: '/auth' },
    { label: 'Aulas Grátis', href: '/auth' },
  ],
  suporte: [
    { label: 'Central de Ajuda', href: '#' },
    { label: 'FAQ', href: '#' },
    { label: 'WhatsApp', href: 'https://wa.me/5500000000000', external: true },
    { label: 'Contato', href: '#' },
    { label: 'Suporte IA', href: '#' },
  ],
  legal: [
    { label: 'Termos de Uso', href: '/termos-de-uso' },
    { label: 'Política de Privacidade', href: '/politica-privacidade' },
    { label: 'Política de Reembolso', href: '#' },
    { label: 'LGPD', href: '#' },
  ],
};

const socialLinks = [
  { icon: Youtube, href: 'https://youtube.com/@moisesmedeiros', label: 'YouTube', color: 'from-red-600 to-red-700', glow: 'rgba(220, 38, 38, 0.5)' },
  { icon: Instagram, href: 'https://instagram.com/moisesmedeiros', label: 'Instagram', color: 'from-pink-600 to-purple-600', glow: 'rgba(236, 72, 153, 0.5)' },
];

const trustBadges = [
  { icon: Shield, label: 'Site 100% Seguro', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  { icon: Award, label: 'Garantia de 7 dias', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  { icon: Zap, label: 'Acesso Imediato', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  { icon: Star, label: '4.9/5 Avaliações', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
];

export const FuturisticFooter = () => {
  const { gpuAnimationProps, shouldAnimate } = useQuantumReactivity();

  return (
    <footer className="relative pt-32 pb-10 overflow-hidden">
      {/* Background épico */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-gray-950 to-transparent" />
        
        {/* Grid holográfico */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(220, 38, 38, 0.4) 1px, transparent 1px),
              linear-gradient(90deg, rgba(220, 38, 38, 0.4) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
        
        {/* Orbes de energia - conditionally rendered */}
        {shouldAnimate && (
          <motion.div
            className="absolute left-1/4 bottom-1/4 w-[500px] h-[500px] rounded-full will-change-transform transform-gpu"
            style={{
              background: 'radial-gradient(circle, rgba(220, 38, 38, 0.1) 0%, transparent 70%)',
              filter: 'blur(100px)',
            }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{ duration: 10, repeat: Infinity }}
          />
        )}
        
        {/* Linha de energia no topo */}
        {shouldAnimate && (
          <motion.div 
            className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/60 to-transparent will-change-transform transform-gpu"
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        )}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Newsletter section - GPU-ONLY */}
        <motion.div
          {...gpuAnimationProps.fadeUp}
          className="max-w-3xl mx-auto text-center mb-20"
        >
          <motion.div
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-red-900/30 border border-red-700/40 mb-6 will-change-transform transform-gpu"
            whileHover={shouldAnimate ? { scale: 1.02 } : undefined}
          >
            {shouldAnimate && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <Atom className="w-5 h-5 text-red-400" />
              </motion.div>
            )}
            {!shouldAnimate && <Atom className="w-5 h-5 text-red-400" />}
            <span className="text-sm font-bold text-red-400 tracking-wide">O FUTURO DA QUÍMICA - ANO 2500</span>
          </motion.div>
          
          <h3 className="text-3xl md:text-4xl font-black text-white mb-4">
            Pronto para sua <span className="bg-gradient-to-r from-red-500 to-amber-500 bg-clip-text text-transparent">Aprovação</span>?
          </h3>
          <p className="text-gray-400 mb-8">
            Junte-se a mais de 10.000 alunos aprovados em Medicina
          </p>
          
          <Link to="/auth">
            <motion.div
              whileHover={shouldAnimate ? { scale: 1.03 } : undefined}
              whileTap={shouldAnimate ? { scale: 0.97 } : undefined}
              className="relative inline-block will-change-transform transform-gpu"
            >
              {shouldAnimate && (
                <motion.div
                  className="absolute -inset-1 bg-gradient-to-r from-red-600 to-amber-600 rounded-2xl blur-lg"
                  animate={{ opacity: [0.4, 0.7, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
              <button className="relative px-10 py-4 bg-gradient-to-r from-red-700 to-red-600 text-white font-black rounded-2xl flex items-center gap-3">
                <Sparkles className="w-5 h-5" />
                Começar Agora
                <ChevronRight className="w-5 h-5" />
              </button>
            </motion.div>
          </Link>
        </motion.div>
        
        {/* Main footer content */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 mb-16">
          {/* Brand column */}
          <div className="col-span-2 lg:col-span-2">
            {/* 🚀 OTIMIZAÇÃO: width/height explícitos para evitar CLS */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="h-14 mb-6 w-[134px]"
            >
              <SacredImage 
                src={logoMoises} 
                alt="Moisés Medeiros" 
                width={134}
                height={56}
                className="h-14 w-auto"
                priority
              />
            </motion.div>
            <p className="text-gray-400 mb-8 max-w-sm leading-relaxed">
              O curso de Química que mais aprova no Brasil. 
              Transformando sonhos em aprovações há mais de 15 anos com tecnologia do futuro.
            </p>
            
            {/* Social links épicos - GPU-ONLY */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={shouldAnimate ? { scale: 1.1, y: -3 } : undefined}
                  whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
                  className="relative group will-change-transform transform-gpu"
                >
                  <motion.div
                    className="absolute -inset-1 rounded-xl blur-lg opacity-0 group-hover:opacity-60 transition-opacity"
                    style={{ background: social.glow }}
                  />
                  <div className={`relative p-4 rounded-xl bg-gradient-to-br ${social.color} shadow-lg`}>
                    <social.icon className="w-6 h-6 text-white" />
                  </div>
                </motion.a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-black mb-6 text-lg">Cursos</h4>
            <ul className="space-y-4">
              {footerLinks.cursos.map((link) => (
                <motion.li 
                  key={link.label} 
                  whileHover={shouldAnimate ? { x: 5 } : undefined}
                  className="will-change-transform transform-gpu"
                >
                  <Link 
                    to={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group"
                  >
                    <ChevronRight className="w-3 h-3 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Suporte */}
          <div>
            <h4 className="text-white font-black mb-6 text-lg">Suporte</h4>
            <ul className="space-y-4">
              {footerLinks.suporte.map((link) => (
                <motion.li key={link.label} whileHover={{ x: 5 }}>
                  <a 
                    href={link.href}
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noopener noreferrer' : undefined}
                    className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group"
                  >
                    <ChevronRight className="w-3 h-3 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.label}
                    {link.external && <ExternalLink className="w-3 h-3 opacity-50" />}
                  </a>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-black mb-6 text-lg">Legal</h4>
            <ul className="space-y-4">
              {footerLinks.legal.map((link) => (
                <motion.li key={link.label} whileHover={{ x: 5 }}>
                  <Link 
                    to={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group"
                  >
                    <ChevronRight className="w-3 h-3 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact info com estilo */}
        <motion.div 
          className="flex flex-wrap items-center justify-center gap-8 mb-10 py-8 border-t border-white/10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <motion.a 
            href="mailto:contato@moisesmedeiros.com.br"
            className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors group"
            whileHover={{ scale: 1.02 }}
          >
            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 group-hover:bg-red-500/20 transition-colors">
              <Mail className="w-4 h-4 text-red-400" />
            </div>
            <span className="text-sm">contato@moisesmedeiros.com.br</span>
          </motion.a>
          
          <motion.a 
            href="https://wa.me/5500000000000"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors group"
            whileHover={{ scale: 1.02 }}
          >
            <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20 group-hover:bg-green-500/20 transition-colors">
              <Phone className="w-4 h-4 text-green-400" />
            </div>
            <span className="text-sm">WhatsApp</span>
          </motion.a>
          
          <div className="flex items-center gap-3 text-gray-400">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Globe className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-sm">Brasil</span>
          </div>
        </motion.div>

        {/* Trust badges épicos */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
          {trustBadges.map((badge, i) => (
            <motion.div
              key={badge.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.05, y: -2 }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${badge.bg} border ${badge.border}`}
            >
              <badge.icon className={`w-4 h-4 ${badge.color}`} />
              <span className="text-sm text-gray-300 font-medium">{badge.label}</span>
            </motion.div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-10 border-t border-white/10">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Moisés Medeiros. Todos os direitos reservados.
          </p>
        </div>

        {/* Empresas info */}
        <motion.div 
          className="text-center mt-10 pt-8 border-t border-white/5"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10">
            <Shield className="w-4 h-4 text-green-400" />
            <span className="text-xs text-gray-500">Empresas verificadas e regularizadas</span>
          </div>
          <div className="mt-4 space-y-1">
            <p className="text-xs text-gray-600">
              MMM CURSO DE QUÍMICA LTDA • CNPJ: 53.829.761/0001-17
            </p>
            <p className="text-xs text-gray-600">
              CURSO QUÍMICA MOISES MEDEIROS • CNPJ: 44.979.308/0001-04
            </p>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};
