// ============================================
// FOOTER FUTURISTA COMPLETO
// Links, redes sociais, info legal
// ============================================

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Youtube, Instagram, Phone, Mail, MapPin, 
  Heart, ExternalLink, Shield, Award, Zap
} from "lucide-react";
import logoMoises from "@/assets/logo-moises-medeiros.png";

const footerLinks = {
  cursos: [
    { label: 'ENEM Completo', href: '/auth' },
    { label: 'Medicina', href: '/auth' },
    { label: 'Intensivão', href: '/auth' },
    { label: 'Simulados', href: '/auth' },
  ],
  suporte: [
    { label: 'Central de Ajuda', href: '#' },
    { label: 'FAQ', href: '#' },
    { label: 'WhatsApp', href: 'https://wa.me/5500000000000' },
    { label: 'Contato', href: '#' },
  ],
  legal: [
    { label: 'Termos de Uso', href: '/termos-de-uso' },
    { label: 'Política de Privacidade', href: '/politica-privacidade' },
    { label: 'Política de Reembolso', href: '#' },
  ],
};

const socialLinks = [
  { icon: Youtube, href: 'https://youtube.com/@moisesmedeiros', label: 'YouTube', color: 'hover:text-red-500' },
  { icon: Instagram, href: 'https://instagram.com/moisesmedeiros', label: 'Instagram', color: 'hover:text-pink-500' },
];

export const FuturisticFooter = () => {
  return (
    <footer className="relative pt-24 pb-8 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-gray-950 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
      </div>

      {/* Grid pattern */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(rgba(220, 38, 38, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(220, 38, 38, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        {/* Main footer content */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-16">
          {/* Brand column */}
          <div className="col-span-2 lg:col-span-2">
            <motion.img 
              src={logoMoises} 
              alt="Moisés Medeiros" 
              className="h-12 mb-6"
              whileHover={{ scale: 1.05 }}
            />
            <p className="text-gray-400 mb-6 max-w-sm">
              O curso de Química que mais aprova no Brasil. 
              Transformando sonhos em aprovações há mais de 15 anos.
            </p>
            
            {/* Social links */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 ${social.color} transition-colors`}
                >
                  <social.icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Cursos */}
          <div>
            <h4 className="text-white font-bold mb-4">Cursos</h4>
            <ul className="space-y-3">
              {footerLinks.cursos.map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Suporte */}
          <div>
            <h4 className="text-white font-bold mb-4">Suporte</h4>
            <ul className="space-y-3">
              {footerLinks.suporte.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href}
                    target={link.href.startsWith('http') ? '_blank' : undefined}
                    rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1"
                  >
                    {link.label}
                    {link.href.startsWith('http') && <ExternalLink className="w-3 h-3" />}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-bold mb-4">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact info */}
        <div className="flex flex-wrap items-center justify-center gap-6 mb-8 py-6 border-t border-white/10">
          <a 
            href="mailto:contato@moisesmedeiros.com.br"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
          >
            <Mail className="w-4 h-4" />
            contato@moisesmedeiros.com.br
          </a>
          <a 
            href="https://wa.me/5500000000000"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
          >
            <Phone className="w-4 h-4" />
            WhatsApp
          </a>
          <span className="flex items-center gap-2 text-gray-400 text-sm">
            <MapPin className="w-4 h-4" />
            Brasil
          </span>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 mb-8">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Shield className="w-4 h-4 text-green-400" />
            Site 100% Seguro
          </div>
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Award className="w-4 h-4 text-amber-400" />
            Garantia de 30 dias
          </div>
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Zap className="w-4 h-4 text-blue-400" />
            Acesso Imediato
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-white/10">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Moisés Medeiros. Todos os direitos reservados.
          </p>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            Feito com <Heart className="w-3 h-3 text-red-500" fill="currentColor" /> por Professor Moisés Medeiros
          </p>
        </div>

        {/* Empresas */}
        <div className="text-center mt-8 pt-8 border-t border-white/5">
          <p className="text-xs text-gray-600 mb-2">
            MMM CURSO DE QUÍMICA LTDA • CNPJ: 53.829.761/0001-17
          </p>
          <p className="text-xs text-gray-600">
            CURSO QUÍMICA MOISES MEDEIROS • CNPJ: 44.979.308/0001-04
          </p>
        </div>
      </div>
    </footer>
  );
};
