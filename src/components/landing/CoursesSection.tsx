// ============================================
// SEÇÃO CURSOS & TRILHAS
// Cards premium com hover effects
// ============================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  BookOpen, Clock, Users, Star, ArrowRight, 
  Play, CheckCircle, Zap, Crown, Target,
  GraduationCap, Award, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const courses = [
  {
    id: 'enem',
    title: 'ENEM Completo',
    subtitle: 'Química do Zero ao 1000',
    description: 'Domine toda a química do ENEM com aulas completas, exercícios resolvidos e simulados.',
    hours: '200+',
    students: '5.847',
    rating: 4.9,
    price: 'R$ 497',
    originalPrice: 'R$ 997',
    discount: '50% OFF',
    features: ['Aulas em HD', 'Material em PDF', 'Simulados', 'Suporte 24/7', 'Acesso vitalício'],
    color: 'from-red-600 to-red-700',
    glow: 'rgba(220, 38, 38, 0.3)',
    badge: 'Mais Popular',
    badgeColor: 'bg-amber-500',
  },
  {
    id: 'medicina',
    title: 'Medicina',
    subtitle: 'Foco Total em Aprovação',
    description: 'Preparação intensiva para vestibulares de medicina com conteúdo aprofundado.',
    hours: '300+',
    students: '3.421',
    rating: 4.9,
    price: 'R$ 697',
    originalPrice: 'R$ 1.297',
    discount: '46% OFF',
    features: ['Aulas avançadas', 'Questões de vestibular', 'Mentoria', 'Grupo VIP', 'Simulados semanais'],
    color: 'from-purple-600 to-purple-700',
    glow: 'rgba(147, 51, 234, 0.3)',
    badge: 'Premium',
    badgeColor: 'bg-purple-500',
  },
  {
    id: 'intensivo',
    title: 'Intensivão',
    subtitle: 'Revisão Final ENEM',
    description: 'Revisão completa de toda a química nos últimos meses antes do ENEM.',
    hours: '80+',
    students: '2.134',
    rating: 4.8,
    price: 'R$ 297',
    originalPrice: 'R$ 497',
    discount: '40% OFF',
    features: ['Foco em TRI', 'Resolução ao vivo', 'Resumos', 'Mapas mentais', 'Dicas de prova'],
    color: 'from-blue-600 to-blue-700',
    glow: 'rgba(37, 99, 235, 0.3)',
    badge: 'Rápido',
    badgeColor: 'bg-blue-500',
  },
];

const CourseCard = ({ course, index }: { course: typeof courses[0]; index: number }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.15 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group"
    >
      {/* Glow effect */}
      <motion.div
        className={`absolute -inset-1 bg-gradient-to-br ${course.color} rounded-3xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500`}
      />

      <div className="relative h-full p-6 rounded-3xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 backdrop-blur-xl overflow-hidden group-hover:border-white/20 transition-all">
        {/* Badge */}
        <div className="absolute top-4 right-4">
          <Badge className={`${course.badgeColor} text-white border-0`}>
            {course.badge}
          </Badge>
        </div>

        {/* Discount badge */}
        <div className="absolute top-4 left-4">
          <motion.div
            animate={{ rotate: [-5, 5, -5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="px-3 py-1 rounded-full bg-green-500 text-white text-xs font-bold"
          >
            {course.discount}
          </motion.div>
        </div>

        {/* Content */}
        <div className="pt-10">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${course.color} mb-6 shadow-lg`}
            style={{ boxShadow: `0 10px 40px ${course.glow}` }}
          >
            <BookOpen className="w-8 h-8 text-white" />
          </div>

          <h3 className="text-2xl font-black text-white mb-1">{course.title}</h3>
          <p className="text-sm text-gray-400 mb-4">{course.subtitle}</p>
          <p className="text-gray-400 mb-6 line-clamp-2">{course.description}</p>

          {/* Stats */}
          <div className="flex items-center gap-4 mb-6 text-sm">
            <div className="flex items-center gap-1.5 text-gray-400">
              <Clock className="w-4 h-4" />
              <span>{course.hours}h</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-400">
              <Users className="w-4 h-4" />
              <span>{course.students}</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-400">
              <Star className="w-4 h-4" fill="currentColor" />
              <span>{course.rating}</span>
            </div>
          </div>

          {/* Features */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 overflow-hidden"
              >
                <div className="space-y-2 py-4 border-t border-white/10">
                  {course.features.map((feature, i) => (
                    <motion.div
                      key={feature}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-2 text-sm text-gray-300"
                    >
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      {feature}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Price */}
          <div className="mb-6">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{course.price}</span>
              <span className="text-lg text-gray-500 line-through">{course.originalPrice}</span>
            </div>
            <p className="text-sm text-gray-400">ou 12x de R$ {(parseInt(course.price.replace(/\D/g, '')) / 12).toFixed(0)}</p>
          </div>

          {/* CTA */}
          <Link to="/auth">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button className={`w-full bg-gradient-to-r ${course.color} hover:opacity-90 text-white border-0 h-12 font-bold`}>
                Matricular Agora
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          </Link>
        </div>

        {/* Decorative elements */}
        <motion.div
          className={`absolute -bottom-20 -right-20 w-40 h-40 rounded-full bg-gradient-to-br ${course.color} opacity-10 blur-3xl`}
          animate={{
            scale: isHovered ? 1.5 : 1,
            opacity: isHovered ? 0.2 : 0.1,
          }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </motion.div>
  );
};

export const CoursesSection = () => {
  return (
    <section id="cursos" className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/10 to-transparent" />
        <motion.div
          className="absolute right-0 top-1/3 w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(147, 51, 234, 0.15) 0%, transparent 70%)',
            filter: 'blur(100px)',
          }}
          animate={{
            y: [0, 50, 0],
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-900/30 border border-purple-700/40 mb-6"
          >
            <GraduationCap className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-semibold text-purple-400">Escolha Seu Caminho</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-black text-white mb-6"
          >
            Cursos & <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">Trilhas</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-400 max-w-2xl mx-auto"
          >
            Escolha o curso ideal para o seu objetivo. Todos com garantia de 30 dias.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {courses.map((course, i) => (
            <CourseCard key={course.id} course={course} index={i} />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <p className="text-gray-400 mb-4">Não sabe qual escolher?</p>
          <Link to="/auth">
            <Button variant="outline" className="border-white/20 hover:border-red-500/50 hover:bg-white/5">
              <Sparkles className="w-4 h-4 mr-2" />
              Fazer Teste de Perfil Grátis
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};
