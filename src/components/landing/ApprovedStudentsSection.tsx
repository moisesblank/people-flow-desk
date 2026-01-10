// ============================================
// ALUNOS APROVADOS SECTION - HALL DA FAMA
// ============================================

import { motion } from "framer-motion";
import { 
  GraduationCap, 
  Star, 
  Trophy, 
  Sparkles,
  Award,
  Target,
  Zap,
  Medal
} from "lucide-react";
import { SacredImage } from "@/components/performance/SacredImage";

// Import approved students image
import alunosImage from "@/assets/alunos-aprovados.jpg";

// Placeholder students data - você pode substituir depois
const approvedStudents = [
  {
    name: "Maria Silva",
    university: "MEDICINA - UFRN",
    position: "1º Lugar",
    avatar: null,
    year: 2024
  },
  {
    name: "João Pedro",
    university: "MEDICINA - UFRJ",
    position: "3º Lugar",
    avatar: null,
    year: 2024
  },
  {
    name: "Ana Carolina",
    university: "FARMÁCIA - USP",
    position: "1º Lugar",
    avatar: null,
    year: 2024
  },
  {
    name: "Lucas Oliveira",
    university: "MEDICINA - UFPE",
    position: "2º Lugar",
    avatar: null,
    year: 2023
  },
  {
    name: "Beatriz Santos",
    university: "MEDICINA - UFRN",
    position: "1º Lugar",
    avatar: null,
    year: 2023
  },
  {
    name: "Gabriel Costa",
    university: "ODONTO - UFPB",
    position: "1º Lugar",
    avatar: null,
    year: 2023
  },
  {
    name: "Juliana Lima",
    university: "MEDICINA - UFC",
    position: "4º Lugar",
    avatar: null,
    year: 2024
  },
  {
    name: "Pedro Henrique",
    university: "MEDICINA - UFRN",
    position: "2º Lugar",
    avatar: null,
    year: 2024
  }
];

const universities = [
  "UFRN", "USP", "UFRJ", "UFPE", "UFC", "UFPB", "UFBA", "UFMG"
];

export const ApprovedStudentsSection = () => {
  return (
    <section id="aprovados" className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-950 to-black" />
      
      {/* Confetti/Celebration Effect */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: ['#EC4899', '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B'][i % 5]
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 1, 0.3],
              scale: [1, 1.5, 1]
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
          />
        ))}
      </div>

      {/* Golden Glow */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.1) 0%, transparent 60%)', filter: 'blur(100px)' }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 10, repeat: Infinity }}
      />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 mb-6"
          >
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium text-yellow-300">Hall da Fama</span>
            <Medal className="w-4 h-4 text-yellow-400" />
          </motion.div>

          <h2 className="text-4xl md:text-6xl font-black mb-4">
            <span className="text-white">Nossos </span>
            <span className="bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent">
              Campeões
            </span>
          </h2>
          
          <p className="text-gray-400 max-w-3xl mx-auto text-lg">
            Alunos que confiaram no método e conquistaram seus sonhos. Você será o próximo!
          </p>
        </motion.div>

        {/* Stats Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <div className="flex flex-wrap justify-center gap-8">
            {[
              { number: "2.847+", label: "Aprovados", icon: <GraduationCap className="w-6 h-6" /> },
              { number: "98%", label: "Taxa de Aprovação", icon: <Target className="w-6 h-6" /> },
              { number: "47", label: "1º Lugares", icon: <Trophy className="w-6 h-6" /> },
              { number: "100+", label: "Universidades", icon: <Award className="w-6 h-6" /> }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30"
              >
                <div className="p-2 rounded-lg bg-yellow-500/20 text-yellow-400">
                  {stat.icon}
                </div>
                <div>
                  <div className="text-2xl font-black text-yellow-400">{stat.number}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Featured Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mb-12 max-w-4xl mx-auto"
        >
          <div className="relative rounded-3xl overflow-hidden border-2 border-yellow-500/30">
            <SacredImage 
              src={alunosImage} 
              alt="Alunos Aprovados" 
              className="w-full h-auto"
              objectFit="cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-center">
              <span className="px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold text-sm">
                🏆 Aprovados em Medicina nas melhores universidades do Brasil
              </span>
            </div>
          </div>
        </motion.div>

        {/* Students Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
          {approvedStudents.map((student, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              viewport={{ once: true }}
              className="group relative"
            >
              {/* Glow on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/30 to-pink-500/30 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative p-4 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl hover:border-yellow-500/50 transition-all duration-300">
                {/* Avatar Placeholder */}
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-pink-500/30 to-purple-500/30 border-2 border-white/20 flex items-center justify-center mb-3">
                  <GraduationCap className="w-8 h-8 text-white/60" />
                </div>
                
                {/* Position Badge */}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    student.position.includes('1º') 
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black' 
                      : 'bg-white/10 text-white'
                  }`}>
                    {student.position}
                  </span>
                </div>
                
                <h4 className="text-sm font-bold text-white text-center mb-1">{student.name}</h4>
                <p className="text-xs text-pink-400 text-center font-medium">{student.university}</p>
                <p className="text-xs text-gray-500 text-center mt-1">{student.year}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Universities Logos */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-gray-400 mb-6">Aprovações em:</p>
          <div className="flex flex-wrap justify-center gap-4">
            {universities.map((uni, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
                className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-gray-400 text-sm font-medium hover:border-pink-500/30 hover:text-pink-400 transition-colors"
              >
                {uni}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <a
            href="https://www.moisesmedeiros.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-10 py-5 rounded-full bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 text-white font-bold text-lg hover:scale-105 transition-transform shadow-2xl shadow-yellow-500/30"
          >
            <Trophy className="w-5 h-5" />
            Quero Ser o Próximo Aprovado
            <Sparkles className="w-5 h-5" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};
