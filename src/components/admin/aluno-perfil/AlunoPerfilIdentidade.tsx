// ============================================
// SEÇÃO: IDENTIDADE COMPLETA DO ALUNO
// ============================================

import { User, Mail, Phone, MapPin, Calendar, FileText, Globe, Camera } from "lucide-react";
import { FuturisticCard } from "@/components/ui/futuristic-card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AlunoIdentidadeProps {
  aluno: {
    id: string;
    nome: string;
    email: string;
    telefone?: string | null;
    cpf?: string | null;
    data_nascimento?: string | null;
    foto_url?: string | null;
    logradouro?: string | null;
    numero?: string | null;
    complemento?: string | null;
    bairro?: string | null;
    cidade?: string | null;
    estado?: string | null;
    cep?: string | null;
    status?: string | null;
    fonte?: string | null;
    observacoes?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
  profile?: {
    avatar_url?: string | null;
    bio?: string | null;
    phone?: string | null;
    learning_style?: string | null;
  } | null;
  role?: string | null;
}

export function AlunoPerfilIdentidade({ aluno, profile, role }: AlunoIdentidadeProps) {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return '-';
    try {
      return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return '-';
    }
  };

  const formatCPF = (cpf: string | null | undefined) => {
    if (!cpf) return '-';
    const cleaned = cpf.replace(/\D/g, '');
    if (cleaned.length !== 11) return cpf;
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
  };

  const formatPhone = (phone: string | null | undefined) => {
    if (!phone) return '-';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  const hasAddress = aluno.logradouro || aluno.cidade || aluno.estado;

  return (
    <FuturisticCard className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <User className="h-5 w-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-foreground">Identidade Completa</h3>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Avatar e Info Principal */}
        <div className="flex flex-col items-center gap-4 lg:w-48">
          <div className="relative">
            <Avatar className="h-32 w-32 border-4 border-blue-500/30">
              <AvatarImage src={aluno.foto_url || profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white text-2xl">
                {getInitials(aluno.nome)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 -right-2 bg-background rounded-full p-1.5 border border-blue-500/30">
              <Camera className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          
          <div className="text-center">
            <h4 className="font-semibold text-foreground">{aluno.nome}</h4>
            <p className="text-sm text-muted-foreground">{aluno.email}</p>
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {role && (
              <Badge className={
                ['beta', 'aluno_presencial', 'beta_expira'].includes(role) 
                  ? 'bg-yellow-500/20 text-yellow-400' 
                  : 'bg-green-500/20 text-green-400'
              }>
                {role === 'beta' ? '👑 Beta' : 
                 role === 'beta_expira' ? '⏳ Beta Expira' :
                 role === 'aluno_presencial' ? '🏫 Presencial' : '🆓 Gratuito'}
              </Badge>
            )}
            {aluno.status && (
              <Badge variant="outline" className={
                aluno.status === 'Ativo' ? 'border-emerald-500/50 text-emerald-400' :
                aluno.status === 'Concluído' ? 'border-purple-500/50 text-purple-400' :
                aluno.status === 'Pendente' ? 'border-yellow-500/50 text-yellow-400' :
                'border-red-500/50 text-red-400'
              }>
                {aluno.status}
              </Badge>
            )}
          </div>
        </div>

        {/* Dados Pessoais */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* Email */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <Mail className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-muted-foreground">Email</span>
            </div>
            <p className="text-sm font-medium text-foreground truncate">{aluno.email}</p>
          </div>

          {/* Telefone */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <Phone className="h-4 w-4 text-green-400" />
              <span className="text-xs text-muted-foreground">Telefone / WhatsApp</span>
            </div>
            <p className="text-sm font-medium text-foreground">{formatPhone(aluno.telefone || profile?.phone)}</p>
          </div>

          {/* CPF */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-purple-400" />
              <span className="text-xs text-muted-foreground">CPF</span>
            </div>
            <p className="text-sm font-medium text-foreground font-mono">{formatCPF(aluno.cpf)}</p>
          </div>

          {/* Data de Nascimento */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-orange-400" />
              <span className="text-xs text-muted-foreground">Data de Nascimento</span>
            </div>
            <p className="text-sm font-medium text-foreground">{formatDate(aluno.data_nascimento)}</p>
          </div>

          {/* Fonte */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <Globe className="h-4 w-4 text-cyan-400" />
              <span className="text-xs text-muted-foreground">Origem/Fonte</span>
            </div>
            <p className="text-sm font-medium text-foreground">{aluno.fonte || '-'}</p>
          </div>

          {/* Data de Cadastro */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-pink-400" />
              <span className="text-xs text-muted-foreground">Cadastrado em</span>
            </div>
            <p className="text-sm font-medium text-foreground">{formatDate(aluno.created_at)}</p>
          </div>
        </div>
      </div>

      {/* Endereço Completo */}
      {hasAddress && (
        <div className="mt-6 pt-6 border-t border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-4 w-4 text-red-400" />
            <span className="text-sm font-medium text-foreground">Endereço Completo</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
            <div className="p-2 rounded bg-muted/20">
              <span className="text-xs text-muted-foreground block">Logradouro</span>
              <span className="text-sm text-foreground">{aluno.logradouro || '-'}</span>
            </div>
            <div className="p-2 rounded bg-muted/20">
              <span className="text-xs text-muted-foreground block">Número</span>
              <span className="text-sm text-foreground">{aluno.numero || '-'}</span>
            </div>
            <div className="p-2 rounded bg-muted/20">
              <span className="text-xs text-muted-foreground block">Complemento</span>
              <span className="text-sm text-foreground">{aluno.complemento || '-'}</span>
            </div>
            <div className="p-2 rounded bg-muted/20">
              <span className="text-xs text-muted-foreground block">Bairro</span>
              <span className="text-sm text-foreground">{aluno.bairro || '-'}</span>
            </div>
            <div className="p-2 rounded bg-muted/20">
              <span className="text-xs text-muted-foreground block">Cidade/Estado</span>
              <span className="text-sm text-foreground">{aluno.cidade || '-'} / {aluno.estado || '-'}</span>
            </div>
            <div className="p-2 rounded bg-muted/20">
              <span className="text-xs text-muted-foreground block">CEP</span>
              <span className="text-sm text-foreground font-mono">{aluno.cep || '-'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Bio e Observações */}
      {(profile?.bio || aluno.observacoes) && (
        <div className="mt-6 pt-6 border-t border-border/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile?.bio && (
              <div className="p-4 rounded-lg bg-muted/20">
                <span className="text-xs text-muted-foreground block mb-2">Bio do Perfil</span>
                <p className="text-sm text-foreground">{profile.bio}</p>
              </div>
            )}
            {aluno.observacoes && (
              <div className="p-4 rounded-lg bg-muted/20">
                <span className="text-xs text-muted-foreground block mb-2">Observações Internas</span>
                <p className="text-sm text-foreground">{aluno.observacoes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </FuturisticCard>
  );
}
