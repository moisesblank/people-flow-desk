// ============================================
// FAQ SECTION - ANO 2300 FUTURISTA
// ============================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronDown, 
  Sparkles, 
  Brain, 
  Zap, 
  Shield,
  Clock,
  Smartphone,
  BookOpen,
  CreditCard,
  Calendar,
  Users,
  Award,
  MessageCircle,
  HelpCircle
} from "lucide-react";

interface FAQ {
  question: string;
  answer: string;
  icon: React.ReactNode;
  category: string;
}

const faqs: FAQ[] = [
  {
    question: "Teremos Black Friday?",
    answer: "Sim! Nossa Black Friday é épica. Oferecemos descontos de até 60% com condições exclusivas. Fique atento às nossas redes sociais para não perder!",
    icon: <Sparkles className="w-5 h-5" />,
    category: "Promoções"
  },
  {
    question: "A modalidade dos livros é exclusivamente correios?",
    answer: "Não! Oferecemos material 100% digital com acesso instantâneo. Os livros físicos são opcionais e enviados pelos correios para todo Brasil.",
    icon: <BookOpen className="w-5 h-5" />,
    category: "Material"
  },
  {
    question: "Ficou com alguma dúvida? Fale conosco!",
    answer: "Nossa equipe de suporte com IA está disponível 24/7! Resposta em até 72h no fórum e suporte via WhatsApp para alunos ativos.",
    icon: <MessageCircle className="w-5 h-5" />,
    category: "Suporte"
  },
  {
    question: "Existe alguma aula teste para assistir?",
    answer: "Sim! Temos aulas gratuitas no nosso canal do YouTube. Acesse youtube.com/@moisesmedeiros e confira a qualidade do nosso conteúdo.",
    icon: <Zap className="w-5 h-5" />,
    category: "Acesso"
  },
  {
    question: "Quais são as formas de pagamento?",
    answer: "Aceitamos PIX (desconto especial!), cartão de crédito em até 12x, boleto bancário e PayPal. Pagamento 100% seguro pela Hotmart.",
    icon: <CreditCard className="w-5 h-5" />,
    category: "Pagamento"
  },
  {
    question: "Como funciona nossa revisão?",
    answer: "Revisão intensiva com aulas ao vivo, simulados semanais, correção de redação e plantões de dúvidas. Sistema gamificado com ranking e premiações!",
    icon: <Brain className="w-5 h-5" />,
    category: "Metodologia"
  },
  {
    question: "Nosso diferencial?",
    answer: "Somos o curso de Química que MAIS APROVA em Medicina! IA personalizada, material exclusivo, monitoria 24h, aulas ao vivo e comunidade ativa.",
    icon: <Award className="w-5 h-5" />,
    category: "Diferencial"
  },
  {
    question: "Como funcionam os cursos?",
    answer: "Plataforma 100% online com videoaulas gravadas, PDFs, flashcards ANKI, simulados e aulas ao vivo. Acesso pelo computador, tablet ou celular.",
    icon: <BookOpen className="w-5 h-5" />,
    category: "Curso"
  },
  {
    question: "Informativo 2026",
    answer: "Para 2026 teremos: Aulas ao vivo semanais, material atualizado, nova plataforma com IA, simulados ENEM e intensivão pré-prova!",
    icon: <Calendar className="w-5 h-5" />,
    category: "Novidades"
  },
  {
    question: "Posso acessar pelo celular?",
    answer: "Sim! Nossa plataforma é 100% responsiva e otimizada para mobile. Estude de qualquer lugar, a qualquer hora!",
    icon: <Smartphone className="w-5 h-5" />,
    category: "Acesso"
  },
  {
    question: "O material é atualizado para 2026?",
    answer: "Sim! Todo material é atualizado anualmente seguindo a matriz do ENEM e os principais vestibulares. Você sempre terá conteúdo atual.",
    icon: <Shield className="w-5 h-5" />,
    category: "Material"
  },
  {
    question: "Serve para iniciantes ou só para quem já tem base?",
    answer: "Perfeito para TODOS os níveis! Temos desde o básico até questões avançadas de olimpíadas. A IA adapta o conteúdo ao seu nível.",
    icon: <Users className="w-5 h-5" />,
    category: "Nível"
  },
  {
    question: "Quando vou receber acesso ao curso?",
    answer: "IMEDIATO! Após confirmação do pagamento, você recebe o acesso instantaneamente por e-mail. No PIX é questão de segundos!",
    icon: <Clock className="w-5 h-5" />,
    category: "Acesso"
  },
  {
    question: "Por quanto tempo terei acesso ao curso?",
    answer: "Acesso VITALÍCIO ao conteúdo! Você pode estudar no seu ritmo, sem pressa. Todas as atualizações futuras inclusas.",
    icon: <Sparkles className="w-5 h-5" />,
    category: "Acesso"
  }
];

const FAQItem = ({ faq, index, isOpen, onToggle }: { 
  faq: FAQ; 
  index: number; 
  isOpen: boolean; 
  onToggle: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.05 }}
    viewport={{ once: true }}
    className="relative group"
  >
    {/* Glow Effect */}
    <div className={`absolute inset-0 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-blue-500/20 rounded-xl blur-xl transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`} />
    
    <div className={`relative overflow-hidden rounded-xl border transition-all duration-300 ${
      isOpen 
        ? 'border-pink-500/50 bg-black/80' 
        : 'border-white/10 bg-black/40 hover:border-pink-500/30'
    }`}>
      {/* Question Button */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className={`p-2 rounded-lg transition-all duration-300 ${
            isOpen 
              ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' 
              : 'bg-white/5 text-pink-400 group-hover:bg-pink-500/20'
          }`}>
            {faq.icon}
          </div>
          
          {/* Question Text */}
          <span className={`font-medium transition-colors duration-300 ${
            isOpen ? 'text-pink-400' : 'text-white group-hover:text-pink-300'
          }`}>
            {faq.question}
          </span>
        </div>
        
        {/* Arrow */}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className={`p-1 rounded-full transition-colors ${
            isOpen ? 'bg-pink-500/20 text-pink-400' : 'text-gray-400'
          }`}
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </button>
      
      {/* Answer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-6 pb-4">
              <div className="pt-2 border-t border-white/10">
                <p className="text-gray-300 leading-relaxed mt-3">
                  {faq.answer}
                </p>
                
                {/* Category Tag */}
                <div className="mt-3">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-300 border border-pink-500/30">
                    <Sparkles className="w-3 h-3" />
                    {faq.category}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </motion.div>
);

export const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="relative py-24 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-950 to-black" />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `linear-gradient(rgba(236,72,153,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.3) 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }} />

      {/* Floating Orbs */}
      <motion.div
        className="absolute top-20 left-10 w-64 h-64 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)', filter: 'blur(60px)' }}
        animate={{ y: [0, 30, 0], x: [0, 20, 0] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-72 h-72 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', filter: 'blur(60px)' }}
        animate={{ y: [0, -30, 0], x: [0, -20, 0] }}
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
          {/* Badge */}
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 mb-6"
          >
            <HelpCircle className="w-4 h-4 text-pink-400" />
            <span className="text-sm font-medium text-pink-300">Central de Ajuda IA</span>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          </motion.div>

          <h2 className="text-4xl md:text-6xl font-black mb-4">
            <span className="text-white">Perguntas </span>
            <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Frequentes
            </span>
          </h2>
          
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Respostas instantâneas para suas dúvidas. Nossa IA está pronta para ajudar 24/7!
          </p>
        </motion.div>

        {/* FAQ Grid */}
        <div className="max-w-4xl mx-auto space-y-3">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              faq={faq}
              index={index}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </div>

        {/* CTA Bottom */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <p className="text-gray-400 mb-4">Não encontrou sua dúvida?</p>
          <a
            href="https://wa.me/5584999999999"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold hover:scale-105 transition-transform shadow-lg shadow-green-500/30"
          >
            <MessageCircle className="w-5 h-5" />
            Fale com nosso Suporte IA
            <Sparkles className="w-4 h-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};
