// ============================================
// MOISES MEDEIROS v5.0 - TERMOS DE USO
// Pilar 1: Segurança - Conformidade LGPD
// ============================================

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, FileText, Shield, AlertTriangle, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermosDeUso() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/site" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Voltar ao site</span>
            </Link>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">Termos de Uso</span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="premium-card p-8 md:p-12">
            <div className="prose prose-invert max-w-none">
              <h1 className="text-3xl font-bold text-foreground mb-2 hero-title">
                Termos de Uso
              </h1>
              <p className="text-muted-foreground mb-8">
                Última atualização: 15 de dezembro de 2025
              </p>

              <section className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Scale className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground m-0">1. Aceitação dos Termos</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Ao acessar e utilizar a plataforma Prof. Moisés Medeiros ("Plataforma"), você concorda 
                  em cumprir e estar vinculado a estes Termos de Uso. Se você não concordar com qualquer 
                  parte destes termos, não deverá utilizar nossa Plataforma.
                </p>
              </section>

              <section className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-stats-blue/10">
                    <Shield className="h-5 w-5 text-stats-blue" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground m-0">2. Descrição do Serviço</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  A Plataforma oferece:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Cursos preparatórios de Química para vestibulares de Medicina</li>
                  <li>Aulas ao vivo e gravadas</li>
                  <li>Materiais de estudo exclusivos</li>
                  <li>Sistema de gestão para administradores e funcionários</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-4">3. Cadastro e Conta</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Para utilizar determinados recursos da Plataforma, você deverá criar uma conta fornecendo 
                  informações precisas e completas. Você é responsável por:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Manter a confidencialidade de sua senha</li>
                  <li>Todas as atividades realizadas em sua conta</li>
                  <li>Notificar imediatamente qualquer uso não autorizado</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-4">4. Propriedade Intelectual</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Todo o conteúdo disponibilizado na Plataforma, incluindo mas não se limitando a textos, 
                  vídeos, imagens, logotipos e materiais didáticos, são de propriedade exclusiva do 
                  Prof. Moisés Medeiros ou seus licenciadores, protegidos por leis de direitos autorais.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-4">5. Uso Permitido</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Você concorda em:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Utilizar a Plataforma apenas para fins pessoais e educacionais</li>
                  <li>Não compartilhar, distribuir ou comercializar o conteúdo</li>
                  <li>Não tentar acessar áreas restritas sem autorização</li>
                  <li>Não utilizar bots, scrapers ou outros meios automatizados</li>
                </ul>
              </section>

              <section className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-stats-gold/10">
                    <AlertTriangle className="h-5 w-5 text-stats-gold" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground m-0">6. Limitação de Responsabilidade</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  A Plataforma é fornecida "como está". Não garantimos que o serviço será ininterrupto 
                  ou livre de erros. Em nenhuma circunstância seremos responsáveis por danos indiretos, 
                  incidentais ou consequenciais decorrentes do uso da Plataforma.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-4">7. Modificações</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Reservamo-nos o direito de modificar estes Termos a qualquer momento. As alterações 
                  entrarão em vigor imediatamente após sua publicação. O uso continuado da Plataforma 
                  após tais modificações constitui sua aceitação dos novos termos.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-4">8. Lei Aplicável</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Estes Termos são regidos pelas leis da República Federativa do Brasil. Qualquer 
                  disputa será resolvida nos tribunais competentes da cidade de São Paulo, SP.
                </p>
              </section>

              <section className="p-6 rounded-xl bg-primary/5 border border-primary/20">
                <h2 className="text-xl font-semibold text-foreground mb-4">9. Contato</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Para dúvidas sobre estes Termos de Uso, entre em contato:
                </p>
                <p className="text-foreground mt-2">
                  <strong>Email:</strong> contato@moisesmedeiros.com.br<br />
                  <strong>WhatsApp:</strong> (11) 99999-9999
                </p>
              </section>
            </div>

            <div className="mt-8 pt-8 border-t border-border/30 flex justify-center">
              <Link to="/site">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">
                  Voltar ao Site
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
