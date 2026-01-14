// ============================================
// SEÇÃO CURSOS & TRILHAS - VERSÃO 2500
// Cards premium com efeitos holográficos
// 🏛️ LEI I: useQuantumReactivity aplicado
// ============================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  BookOpen, Clock, Users, Star, ArrowRight, 
  CheckCircle, Zap, Crown, Target,
  GraduationCap, Sparkles, Shield, Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuantumReactivity } from "@/hooks/useQuantumReactivity";

const courses = [
  {
    id: 'extensivo-fisico',
    title: 'Plano Extensivo',
    subtitle: '+ Todo o material físico do curso impresso',
    description: 'Acesso completo ao curso online + apostilas e materiais físicos impressos entregues na sua casa.',
    hours: '200+',
    students: '5.847',
    rating: 4.9,
    price: 'R$ 1.187,00',
    originalPrice: 'R$ 1.569,00',
    discount: '-24,37% OFF',
    discountValue: '-R$ 382,00',
    installments: 'até 6x sem juros',
    features: ['Aulas em 4K', 'Material Físico Impresso', 'Apostilas Exclusivas', 'Suporte 24/7 com IA', 'Acesso vitalício'],
    gradient: 'from-red-600 via-red-500 to-orange-500',
    glow: 'rgba(220, 38, 38, 0.4)',
    badge: 'Mais Popular',
    badgeGradient: 'from-amber-500 to-orange-500',
    icon: Target,
    externalLink: 'https://app.moisesmedeiros.com.br/cadastro-produto-fisico/',
  },
  {
    id: 'extensivo-digital',
    title: 'Plano Extensivo',
    subtitle: '+ Livros Digitais (NÃO PDF)',
    description: 'Acesso completo ao curso online + livros digitais interativos com experiência de leitura premium.',
    hours: '200+',
    students: '5.847',
    rating: 4.9,
    price: 'R$ 784,50',
    originalPrice: 'R$ 1.569,00',
    discount: '-50% OFF',
    discountValue: '-R$ 784,50',
    installments: 'até 6x sem juros',
    features: ['Aulas em 4K', 'Livros Digitais Interativos', 'Leitura Premium', 'Suporte 24/7 com IA', 'Acesso vitalício'],
    gradient: 'from-purple-600 via-purple-500 to-pink-500',
    glow: 'rgba(147, 51, 234, 0.4)',
    badge: 'Melhor Custo-Benefício',
    badgeGradient: 'from-purple-500 to-pink-500',
    icon: BookOpen,
    externalLink: 'https://app.moisesmedeiros.com.br/cadastro-produto-digital/',
  },
];

const CourseCard = ({ course, index }: { course: typeof courses[0]; index: number }) => {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = course.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.15, type: "spring", stiffness: 100 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group h-full"
    >
      {/* Glow effect épico */}
      <motion.div
        className="absolute -inset-2 rounded-3xl blur-2xl transition-all duration-500"
        style={{ background: course.glow }}
        animate={{
          opacity: isHovered ? 0.5 : 0.1,
          scale: isHovered ? 1.05 : 1,
        }}
      />

      <div className="relative h-full p-1 rounded-3xl bg-gradient-to-br from-white/20 to-white/5 overflow-hidden">
        {/* Card interno */}
        <div className="h-full p-7 rounded-[22px] bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-2xl overflow-hidden border border-white/5">
          
          {/* Badge flutuante */}
          <motion.div 
            className="absolute top-5 right-5 z-10"
            animate={{ y: isHovered ? -3 : 0 }}
          >
            <div className={`px-4 py-1.5 rounded-full bg-gradient-to-r ${course.badgeGradient} text-white text-xs font-bold shadow-lg`}>
              {course.badge}
            </div>
          </motion.div>

          {/* Desconto badge */}
          <motion.div 
            className="absolute top-5 left-5"
            animate={{ rotate: isHovered ? [-3, 3, -3] : 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="px-3 py-1.5 rounded-full bg-green-500 text-white text-xs font-bold shadow-lg">
              {course.discount}
            </div>
          </motion.div>

          {/* Conteúdo */}
          <div className="pt-14">
            {/* Ícone grande */}
            <motion.div
              className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br ${course.gradient} mb-6`}
              style={{ boxShadow: `0 15px 50px ${course.glow}` }}
              animate={{
                y: isHovered ? -5 : 0,
                rotate: isHovered ? [0, 5, -5, 0] : 0,
              }}
              transition={{ duration: 0.5 }}
            >
              <Icon className="w-10 h-10 text-white" />
            </motion.div>

            {/* Título e descrição */}
            <h3 className="text-2xl font-black text-white mb-1">{course.title}</h3>
            <p className="text-sm text-gray-400 mb-4">{course.subtitle}</p>
            <p className="text-gray-400 mb-6 line-clamp-2">{course.description}</p>

            {/* Stats do curso */}
            <div className="flex items-center gap-5 mb-6 text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <Clock className="w-4 h-4" />
                <span>{course.hours}h</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Users className="w-4 h-4" />
                <span>{course.students}</span>
              </div>
              <div className="flex items-center gap-2 text-amber-400">
                <Star className="w-4 h-4" fill="currentColor" />
                <span className="font-semibold">{course.rating}</span>
              </div>
            </div>

            {/* Features expandíveis */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 overflow-hidden"
                >
                  <div className="space-y-2.5 py-4 border-t border-white/10">
                    {course.features.map((feature, i) => (
                      <motion.div
                        key={feature}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-3 text-sm text-gray-300"
                      >
                        <div className={`p-0.5 rounded-full bg-gradient-to-r ${course.gradient}`}>
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                        {feature}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Preço */}
            <div className="mb-6">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Preço Oficial</p>
              <p className="text-sm text-gray-400 mb-2">
                DE <span className="line-through">{course.originalPrice}</span> POR:
              </p>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-black text-white">{course.price}</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-green-400 font-semibold text-sm">{course.discountValue}</span>
                <span className="text-green-400 font-semibold text-sm">{course.discount}</span>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                <span className="text-white font-semibold">({course.installments})</span>
              </p>
            </div>

            {/* CTA */}
            <a href={course.externalLink} target="_blank" rel="noopener noreferrer" className="block">
              <motion.div 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }}
              >
                <Button className={`w-full bg-gradient-to-r ${course.gradient} hover:opacity-90 text-white border-0 h-14 font-bold text-base rounded-xl shadow-lg`}>
                  Matricular Agora
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>
            </a>

            {/* Garantia */}
            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-500">
              <Shield className="w-4 h-4 text-green-400" />
              <span>Garantia de 7 dias ou seu dinheiro de volta</span>
            </div>
          </div>

          {/* Decoração holográfica */}
          <motion.div
            className="absolute -bottom-20 -right-20 w-48 h-48 rounded-full"
            style={{
              background: `radial-gradient(circle, ${course.glow} 0%, transparent 70%)`,
            }}
            animate={{
              scale: isHovered ? 1.8 : 1,
              opacity: isHovered ? 0.3 : 0.1,
            }}
            transition={{ duration: 0.5 }}
          />
          
          {/* Grid pattern */}
          <div 
            className="absolute inset-0 opacity-5 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
              backgroundSize: '24px 24px',
            }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export const CoursesSection = () => {
  const { shouldAnimate, gpuAnimationProps } = useQuantumReactivity();
  
  return (
    <section id="cursos" className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/10 to-transparent" />
        
        {/* Orbes de energia - apenas se animações habilitadas */}
        {shouldAnimate && (
          <>
            <motion.div
              className="absolute right-0 top-1/3 w-[600px] h-[600px] rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(147, 51, 234, 0.15) 0%, transparent 70%)',
                filter: 'blur(100px)',
              }}
              {...gpuAnimationProps.scaleIn}
            />
            <motion.div
              className="absolute left-0 bottom-1/4 w-[500px] h-[500px] rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(220, 38, 38, 0.1) 0%, transparent 70%)',
                filter: 'blur(100px)',
              }}
              {...gpuAnimationProps.scaleIn}
            />
          </>
        )}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <motion.div
            {...(shouldAnimate ? gpuAnimationProps.fadeUp : {})}
            viewport={{ once: true }}
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-purple-900/30 border border-purple-700/40 mb-8"
          >
            <motion.div
              animate={shouldAnimate ? { rotate: 360 } : undefined}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <GraduationCap className="w-5 h-5 text-purple-400" />
            </motion.div>
            <span className="text-sm font-bold text-purple-400 tracking-wide">ESCOLHA SEU CAMINHO PARA O SUCESSO</span>
          </motion.div>

          <motion.h2
            {...(shouldAnimate ? gpuAnimationProps.fadeUp : {})}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6"
          >
            Cursos & <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">Trilhas</span>
          </motion.h2>

          <motion.p
            {...(shouldAnimate ? gpuAnimationProps.fadeIn : {})}
            viewport={{ once: true }}
            className="text-lg text-gray-400 max-w-2xl mx-auto"
          >
            Escolha o curso ideal para o seu objetivo. Todos com garantia de 7 dias e acesso vitalício.
          </motion.p>
        </div>

        {/* Grid de cursos */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {courses.map((course, i) => (
            <CourseCard key={course.id} course={course} index={i} />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-20"
        >
          <p className="text-gray-400 mb-6 text-lg">Não sabe qual curso escolher?</p>
          <Link to="/auth">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button 
                variant="outline" 
                size="lg"
                className="border-2 border-purple-500/30 hover:border-purple-500/60 hover:bg-purple-500/10 rounded-xl px-8 h-14"
              >
                <Sparkles className="w-5 h-5 mr-2 text-purple-400" />
                Fazer Teste de Perfil Gratuito
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};
