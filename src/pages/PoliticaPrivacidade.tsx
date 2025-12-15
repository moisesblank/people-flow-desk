// ============================================
// MOISES MEDEIROS v5.0 - POLÍTICA DE PRIVACIDADE
// Pilar 1: Segurança - Conformidade LGPD
// ============================================

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Lock, Eye, Database, Trash2, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PoliticaPrivacidade() {
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
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">Política de Privacidade</span>
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
                Política de Privacidade
              </h1>
              <p className="text-muted-foreground mb-8">
                Última atualização: 15 de dezembro de 2025
              </p>

              {/* LGPD Badge */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-stats-green/10 border border-stats-green/20 mb-8">
                <Shield className="h-8 w-8 text-stats-green" />
                <div>
                  <p className="font-semibold text-foreground">Conformidade com a LGPD</p>
                  <p className="text-sm text-muted-foreground">
                    Esta política está em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018)
                  </p>
                </div>
              </div>

              <section className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Database className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground m-0">1. Dados que Coletamos</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Coletamos os seguintes tipos de dados:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li><strong>Dados de identificação:</strong> nome, email, telefone</li>
                  <li><strong>Dados de acesso:</strong> logs de login, endereço IP, navegador utilizado</li>
                  <li><strong>Dados de uso:</strong> páginas acessadas, tempo de permanência, progresso nos cursos</li>
                  <li><strong>Dados de pagamento:</strong> processados por terceiros (Hotmart, Asaas)</li>
                </ul>
              </section>

              <section className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-stats-blue/10">
                    <Eye className="h-5 w-5 text-stats-blue" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground m-0">2. Como Usamos seus Dados</h2>
                </div>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Fornecer acesso aos cursos e conteúdos adquiridos</li>
                  <li>Personalizar sua experiência de aprendizado</li>
                  <li>Enviar comunicações relevantes sobre seu progresso</li>
                  <li>Melhorar nossos serviços e desenvolver novos recursos</li>
                  <li>Cumprir obrigações legais e regulatórias</li>
                </ul>
              </section>

              <section className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-stats-gold/10">
                    <Lock className="h-5 w-5 text-stats-gold" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground m-0">3. Segurança dos Dados</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Implementamos medidas técnicas e organizacionais para proteger seus dados:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Criptografia SSL/TLS em todas as transmissões</li>
                  <li>Autenticação segura com suporte a 2FA</li>
                  <li>Controle de acesso baseado em funções (RBAC)</li>
                  <li>Monitoramento contínuo de segurança</li>
                  <li>Backups regulares e criptografados</li>
                </ul>
              </section>

              <section className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-stats-purple/10">
                    <UserCheck className="h-5 w-5 text-stats-purple" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground m-0">4. Seus Direitos (LGPD)</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Você tem os seguintes direitos em relação aos seus dados pessoais:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li><strong>Confirmação e Acesso:</strong> saber se tratamos seus dados e acessá-los</li>
                  <li><strong>Correção:</strong> solicitar correção de dados incompletos ou inexatos</li>
                  <li><strong>Anonimização ou Eliminação:</strong> solicitar anonimização ou exclusão</li>
                  <li><strong>Portabilidade:</strong> receber seus dados em formato estruturado</li>
                  <li><strong>Revogação do Consentimento:</strong> retirar seu consentimento a qualquer momento</li>
                </ul>
              </section>

              <section className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <Trash2 className="h-5 w-5 text-destructive" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground m-0">5. Retenção e Exclusão</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Mantemos seus dados pelo tempo necessário para cumprir as finalidades descritas 
                  ou conforme exigido por lei. Após este período, os dados são anonimizados ou 
                  excluídos de forma segura. Você pode solicitar a exclusão de sua conta a qualquer 
                  momento através das configurações ou entrando em contato conosco.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-4">6. Cookies</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Utilizamos cookies para:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li><strong>Essenciais:</strong> funcionamento básico da plataforma</li>
                  <li><strong>Funcionais:</strong> lembrar suas preferências</li>
                  <li><strong>Analíticos:</strong> entender como você usa a plataforma</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Você pode gerenciar cookies através das configurações do seu navegador.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-4">7. Compartilhamento de Dados</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Podemos compartilhar seus dados com:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li><strong>Processadores de pagamento:</strong> Hotmart, Asaas (apenas dados necessários)</li>
                  <li><strong>Provedores de infraestrutura:</strong> serviços de hospedagem e banco de dados</li>
                  <li><strong>Autoridades legais:</strong> quando exigido por lei</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  <strong>Não vendemos</strong> seus dados pessoais a terceiros.
                </p>
              </section>

              <section className="p-6 rounded-xl bg-primary/5 border border-primary/20">
                <h2 className="text-xl font-semibold text-foreground mb-4">8. Contato do DPO</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Para exercer seus direitos ou esclarecer dúvidas sobre esta política, 
                  entre em contato com nosso Encarregado de Proteção de Dados:
                </p>
                <p className="text-foreground mt-2">
                  <strong>Email:</strong> privacidade@moisesmedeiros.com.br<br />
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
