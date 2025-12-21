// ============================================
// PROFESSOR SECTION - MOISÉS MEDEIROS
// ============================================

import { motion } from "framer-motion";
import { 
  Award, 
  Users, 
  BookOpen, 
  Star, 
  Sparkles, 
  GraduationCap,
  Trophy,
  Target,
  Instagram,
  Youtube,
  Play
} from "lucide-react";

// Import professor image
import professorImage from "@/assets/professor-moises.jpg";

const achievements = [
  { icon: <GraduationCap className="w-5 h-5" />, label: "Químico UFRN", color: "pink" },
  { icon: <Trophy className="w-5 h-5" />, label: "+2.847 Aprovados", color: "purple" },
  { icon: <BookOpen className="w-5 h-5" />, label: "500h+ de Aulas", color: "blue" },
  { icon: <Star className="w-5 h-5" />, label: "4.9/5 Avaliação", color: "yellow" },
];

const stats = [
  { number: "10+", label: "Anos de Experiência" },
  { number: "50k+", label: "Seguidores" },
  { number: "1M+", label: "Views no YouTube" },
  { number: "#1", label: "Aprovação ENEM" },
];

export const ProfessorSection = () => {
  return (
    <section id="professor" className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-black to-slate-950" />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `radial-gradient(circle at center, rgba(236,72,153,0.3) 0%, transparent 50%)`,
      }} />

      {/* Animated Rings */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-pink-500/20"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-purple-500/10"
        animate={{ rotate: -360 }}
        transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Image */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/30 to-purple-500/30 rounded-3xl blur-3xl" />
            
            {/* Image Container */}
            <div className="relative rounded-3xl overflow-hidden border-2 border-white/10 bg-black/60">
              {/* Professor Image */}
              <div className="aspect-[4/5] relative">
                <img 
                  src={professorImage} 
                  alt="Prof. Moisés Medeiros" 
                  className="w-full h-full object-cover object-center"
                />
                
                {/* Overlay with name */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
                  <h3 className="text-2xl font-bold text-white mb-1">Prof. Moisés Medeiros</h3>
                  <p className="text-pink-400 font-medium">O professor que mais aprova em Química</p>
                </div>
              </div>

              {/* Badge */}
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ delay: 0.3 }}
                viewport={{ once: true }}
                className="absolute top-4 right-4 px-4 py-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm font-bold flex items-center gap-2"
              >
                <Star className="w-4 h-4" />
                TOP 1 ENEM
              </motion.div>
            </div>

            {/* Floating Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              viewport={{ once: true }}
              className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-4"
            >
              {achievements.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  viewport={{ once: true }}
                  className={`p-3 rounded-xl bg-black/90 border border-${item.color}-500/30 text-${item.color}-400 shadow-lg`}
                >
                  {item.icon}
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right - Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            {/* Badge */}
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30"
            >
              <Award className="w-4 h-4 text-pink-400" />
              <span className="text-sm font-medium text-pink-300">Seu Mentor</span>
            </motion.div>

            <h2 className="text-4xl md:text-5xl font-black">
              <span className="text-white">Prof. </span>
              <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                Moisés Medeiros
              </span>
            </h2>

            <p className="text-gray-400 text-lg leading-relaxed">
              Químico formado pela UFRN, professor há mais de 10 anos, especialista em preparação para ENEM e vestibulares de medicina. Criador da metodologia que mais aprova alunos em universidades federais do Brasil.
            </p>

            <p className="text-gray-400 text-lg leading-relaxed">
              Com uma abordagem didática única e uso de tecnologia de ponta, incluindo IA personalizada, 
              o Prof. Moisés já transformou a vida de mais de 2.847 alunos aprovados.
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 py-6">
              {stats.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-pink-500/30 transition-colors"
                >
                  <div className="text-3xl font-black bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                    {stat.number}
                  </div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Social Links */}
            <div className="flex gap-4 pt-4">
              <a
                href="https://www.instagram.com/moises.profaprova"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 text-pink-400 hover:bg-pink-500/30 transition-colors"
              >
                <Instagram className="w-5 h-5" />
                <span className="font-medium">Instagram</span>
              </a>
              <a
                href="https://www.youtube.com/@moisesmedeiros"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors"
              >
                <Youtube className="w-5 h-5" />
                <span className="font-medium">YouTube</span>
              </a>
            </div>

            {/* CTA */}
            <motion.a
              href="https://youtu.be/aOzCtPc7byY"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold hover:scale-105 transition-transform shadow-lg shadow-pink-500/30 mt-4"
            >
              <Play className="w-5 h-5" />
              Assistir Aula Grátis
              <Sparkles className="w-5 h-5" />
            </motion.a>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
