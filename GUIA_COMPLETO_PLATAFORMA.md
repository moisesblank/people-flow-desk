# 📚 GUIA COMPLETO DA PLATAFORMA MOISÉS MEDEIROS v10.0
## Sistema de Gestão Empresarial + Plataforma de Cursos de Química
### Atualizado em: 17/12/2024

---

# 🎯 ÍNDICE

1. [O QUE É ESTE SISTEMA?](#1-o-que-é-este-sistema)
2. [COMO ACESSAR](#2-como-acessar)
3. [PRIMEIROS PASSOS](#3-primeiros-passos)
4. [MÓDULOS DO SISTEMA](#4-módulos-do-sistema)
5. [COMO CRIAR ACESSO PARA FUNCIONÁRIOS](#5-como-criar-acesso-para-funcionários)
6. [COMO EDITAR O SITE (GOD MODE)](#6-como-editar-o-site)
7. [COMO GERENCIAR CURSOS](#7-como-gerenciar-cursos)
8. [COMO CONTROLAR FINANÇAS](#8-como-controlar-finanças)
9. [COMO ACOMPANHAR FUNCIONÁRIOS](#9-como-acompanhar-funcionários)
10. [SISTEMA DE PERMISSÕES DETALHADO](#10-segurança-e-permissões)
11. [AUTOMAÇÕES E INTEGRAÇÕES](#11-automações)
12. [CHECKLIST DE STATUS](#12-checklist)
13. [PERGUNTAS FREQUENTES](#13-faq)
14. [GLOSSÁRIO](#14-glossário)

---

# ⚠️ RESUMO EXECUTIVO (LEIA PRIMEIRO!)

## Status Atual do Sistema: 🟢 100% OPERACIONAL

| Métrica | Valor |
|---------|-------|
| **Tabelas no Banco de Dados** | 99 tabelas |
| **Usuários Cadastrados** | 5 usuários |
| **Owner (Você)** | 1 (moisesblank@gmail.com) |
| **Funcionários com Acesso** | 4 employees |
| **Edge Functions (Backend)** | 11 funções ativas |
| **Segurança (RLS)** | ✅ Ativo em TODAS tabelas |
| **Autenticação 2FA** | ✅ Ativo (código por email) |

---

# 1. O QUE É ESTE SISTEMA?

## 📖 Explicação Simples

Imagine que você tem uma **super secretária digital** que:
- Controla TODO o dinheiro da sua empresa
- Gerencia TODOS os seus funcionários  
- Organiza TODOS os seus cursos online
- Cuida de TODOS os seus alunos
- Responde WhatsApp com IA
- Faz relatórios automáticos
- E NUNCA esquece de nada!

**Isso é o seu sistema.**

## 🎁 O Que Você Ganhou

| Área | O Que Faz | Benefício |
|------|-----------|-----------|
| **Gestão Financeira** | Controla entradas, saídas, impostos | Saber exatamente quanto ganha e gasta |
| **Gestão de Equipe** | Controla funcionários, ponto, tarefas | Ver quem trabalha e quanto |
| **Plataforma de Cursos** | Hospeda seus cursos de química | Vender cursos online |
| **Marketing** | Acompanha campanhas e ROI | Saber se propaganda funciona |
| **WhatsApp IA** | Responde leads automaticamente | Nunca perder um cliente |
| **Integrações** | Conecta Hotmart, YouTube, etc | Tudo automático |

---

# 2. COMO ACESSAR

## 🔐 Passo a Passo para Entrar

### Passo 1: Abra o Navegador
- Use **Google Chrome** (recomendado)
- Ou **Microsoft Edge**
- Ou **Firefox**

### Passo 2: Digite o Endereço
```
https://seu-dominio.com.br
```
*(Substitua pelo seu domínio real)*

### Passo 3: Vá para Login
- Clique no botão **"Entrar"** no topo da página
- Ou acesse diretamente: `https://seu-dominio.com.br/auth`

### Passo 4: Faça Login
1. Digite seu **e-mail** cadastrado
2. Digite sua **senha**
3. Clique em **"Entrar"**

### 🆘 Esqueceu a Senha?
1. Na tela de login, clique em **"Esqueci minha senha"**
2. Digite seu e-mail
3. Você receberá um link para criar nova senha
4. Clique no link do e-mail
5. Crie uma nova senha forte

---

# 3. PRIMEIROS PASSOS

## 🏠 Conhecendo a Tela Principal (Dashboard)

Quando você entra, vê a **Dashboard** - é como o "painel de controle" de um carro.

### O Que Cada Parte Significa:

```
┌─────────────────────────────────────────────────────────────┐
│  🔵 MENU LATERAL (esquerda)                                 │
│  ├── Dashboard (tela inicial)                               │
│  ├── Finanças (dinheiro)                                    │
│  ├── Funcionários (equipe)                                  │
│  ├── Cursos (aulas)                                         │
│  ├── Alunos (estudantes)                                    │
│  ├── Marketing (propaganda)                                 │
│  ├── Configurações (ajustes)                                │
│  └── Permissões (quem pode o quê)                           │
│                                                             │
│  🟢 ÁREA CENTRAL (principal)                                │
│  ├── Resumo do dia                                          │
│  ├── Gráficos de desempenho                                 │
│  ├── Alertas importantes                                    │
│  └── Ações rápidas                                          │
│                                                             │
│  🟡 BARRA SUPERIOR (topo)                                   │
│  ├── Busca global (pesquisar qualquer coisa)                │
│  ├── Notificações (avisos)                                  │
│  └── Seu perfil (foto e nome)                               │
└─────────────────────────────────────────────────────────────┘
```

### 📊 Entendendo os Números da Dashboard

| Cartão | O Que Mostra | Exemplo |
|--------|--------------|---------|
| **Receita Total** | Quanto entrou de dinheiro | R$ 50.000,00 |
| **Despesas** | Quanto saiu de dinheiro | R$ 20.000,00 |
| **Lucro** | O que sobrou (Receita - Despesas) | R$ 30.000,00 |
| **Alunos Ativos** | Quantas pessoas estudando | 150 alunos |
| **Funcionários** | Quantas pessoas trabalhando | 5 pessoas |

---

# 4. MÓDULOS DO SISTEMA

## 📁 Todos os Módulos Disponíveis

### 💰 ÁREA FINANCEIRA

#### 4.1 Finanças Pessoais
**O que é:** Controle do seu dinheiro pessoal (não da empresa)

**Como usar:**
1. Menu → Finanças Pessoais
2. Clique em **"+ Nova Entrada"** para adicionar receita
3. Clique em **"+ Nova Despesa"** para adicionar gasto
4. Veja o resumo no topo

**Dica:** Separe sempre dinheiro pessoal do dinheiro da empresa!

#### 4.2 Finanças da Empresa
**O que é:** Controle do dinheiro do negócio

**Como usar:**
1. Menu → Finanças Empresa
2. **Aba Receitas:** O que a empresa ganha
3. **Aba Despesas Fixas:** Gastos todo mês (aluguel, luz, etc.)
4. **Aba Despesas Extras:** Gastos ocasionais

**Campos importantes:**
- **Nome:** O que é (ex: "Aluguel do escritório")
- **Valor:** Quanto custa
- **Categoria:** Tipo de gasto (ex: "Infraestrutura")
- **Data:** Quando aconteceu

#### 4.3 Contabilidade
**O que é:** Visão completa de impostos e obrigações

**Como usar:**
1. Menu → Contabilidade
2. Veja impostos a pagar
3. Acompanhe DAS, INSS, etc.

#### 4.4 Entradas (Receitas)
**O que é:** Tudo que entra de dinheiro

**Como usar:**
1. Menu → Entradas
2. Clique **"+ Nova Entrada"**
3. Preencha:
   - Fonte (de onde veio)
   - Valor
   - Banco (onde caiu)
   - Mês de referência

#### 4.5 Pagamentos
**O que é:** Contas a pagar

**Como usar:**
1. Menu → Pagamentos
2. Veja contas pendentes
3. Marque como "Pago" quando pagar
4. Anexe comprovantes

---

### 👥 ÁREA DE EQUIPE

#### 4.6 Funcionários
**O que é:** Cadastro de todos que trabalham com você

**Como usar:**
1. Menu → Funcionários
2. Clique **"+ Novo Funcionário"**
3. Preencha:
   - Nome completo
   - Função (cargo)
   - Salário
   - Data de admissão
   - E-mail
   - Telefone
   - Setor

**Setores disponíveis:**
- Administrativo
- Pedagógico
- Marketing
- Financeiro
- Operacional

#### 4.7 Gestão de Equipe
**O que é:** Acompanhamento do trabalho da equipe

**Como usar:**
1. Menu → Gestão Equipe
2. Veja tarefas de cada um
3. Acompanhe produtividade
4. Distribua novas tarefas

#### 4.8 Ponto Eletrônico
**O que é:** Controle de horário dos funcionários

**Como usar:**
1. Menu → Ponto Eletrônico
2. Veja entradas e saídas
3. Relatórios de horas
4. Faltas e atrasos

**Para o funcionário:**
1. Ele acessa o sistema
2. Clica em "Bater Ponto"
3. Sistema registra hora e localização

---

### 📚 ÁREA DE CURSOS

#### 4.9 Cursos
**O que é:** Seus cursos de química

**Como usar:**
1. Menu → Cursos
2. Veja todos os cursos
3. Clique em um para editar
4. Clique **"+ Novo Curso"** para criar

**Estrutura de um curso:**
```
CURSO
├── Módulo 1: Introdução
│   ├── Aula 1: O que é Química?
│   ├── Aula 2: Importância da Química
│   └── Aula 3: Primeiros Conceitos
├── Módulo 2: Química Básica
│   ├── Aula 1: Átomos
│   ├── Aula 2: Moléculas
│   └── Aula 3: Reações
└── Módulo 3: Avançado
    ├── Aula 1: ...
    └── ...
```

#### 4.10 Portal do Aluno
**O que é:** Onde seus alunos estudam

**Funcionalidades:**
- Assistir videoaulas
- Fazer anotações
- Ver progresso
- Ganhar XP (pontos)
- Conquistar medalhas
- Ver ranking

#### 4.11 Turmas Online
**O que é:** Turmas de cursos pela internet

**Como usar:**
1. Menu → Turmas Online
2. Crie turmas
3. Adicione alunos
4. Acompanhe progresso

#### 4.12 Turmas Presenciais
**O que é:** Turmas de aulas presenciais

**Como usar:**
1. Menu → Turmas Presenciais
2. Cadastre turmas
3. Controle presença
4. Agende aulas

---

### 📢 ÁREA DE MARKETING

#### 4.13 Marketing
**O que é:** Controle de campanhas de propaganda

**Como usar:**
1. Menu → Marketing
2. Cadastre campanhas
3. Acompanhe resultados

**Métricas importantes:**
- **CAC:** Custo para conseguir 1 cliente
- **LTV:** Quanto 1 cliente gasta no total
- **ROI:** Retorno do investimento (lucro da propaganda)

#### 4.14 Métricas
**O que é:** Números detalhados do marketing

**Como usar:**
1. Menu → Métricas
2. Veja gráficos
3. Compare períodos

#### 4.15 Afiliados
**O que é:** Pessoas que vendem seus cursos e ganham comissão

**Como usar:**
1. Menu → Afiliados
2. Cadastre afiliados
3. Defina comissão (%)
4. Acompanhe vendas de cada um

---

### ⚙️ ÁREA ADMINISTRATIVA

#### 4.16 Calendário
**O que é:** Agenda de compromissos

**Como usar:**
1. Menu → Calendário
2. Clique em uma data
3. Adicione evento
4. Defina lembretes

#### 4.17 Arquivos
**O que é:** Documentos e arquivos

**Como usar:**
1. Menu → Arquivos
2. Faça upload de documentos
3. Organize em pastas
4. Compartilhe com equipe

#### 4.18 Configurações
**O que é:** Ajustes do sistema

**Opções:**
- Trocar logo da empresa
- Mudar cores do sistema
- Configurar notificações
- Dados da empresa

#### 4.19 Permissões
**O que é:** Controle de quem pode fazer o quê

**Níveis:**
1. **Owner (Dono):** Você - pode TUDO
2. **Admin:** Quase tudo, exceto deletar sistema
3. **Professor:** Área de cursos apenas
4. **Funcionário:** Áreas específicas

---

# 5. COMO CRIAR ACESSO PARA FUNCIONÁRIOS

## 👤 Passo a Passo Completo

### Método 1: Convite por E-mail (Recomendado)

#### Passo 1: Acesse Permissões
1. Faça login no sistema
2. Menu lateral → **Permissões**

#### Passo 2: Convide o Funcionário
1. Clique no botão **"+ Convidar Usuário"**
2. Preencha:
   - **E-mail:** email do funcionário
   - **Nome:** nome completo
   - **Função:** cargo que vai exercer

#### Passo 3: Defina o Nível de Acesso
| Nível | O Que Pode Fazer |
|-------|------------------|
| **Funcionário** | Ver e editar áreas específicas |
| **Professor** | Gerenciar cursos e alunos |
| **Admin** | Quase tudo (cuidado!) |

#### Passo 4: Envie o Convite
1. Clique **"Enviar Convite"**
2. O funcionário recebe e-mail
3. Ele clica no link
4. Cria sua senha
5. Pronto! Já pode acessar

### Método 2: Cadastro Manual

#### Passo 1: Vá em Configurações → Usuários

#### Passo 2: Clique "+ Novo Usuário"

#### Passo 3: Preencha os Dados
- Nome completo
- E-mail
- Senha temporária
- Nível de acesso

#### Passo 4: Salve e Informe o Funcionário
- Passe o e-mail e senha para ele
- Peça para ele trocar a senha no primeiro acesso

---

## 🔒 Configurando O Que Cada Um Pode Ver

### Para FUNCIONÁRIO ver apenas o necessário:

1. Acesse **Permissões**
2. Encontre o funcionário na lista
3. Clique em **"Editar Permissões"**
4. Marque apenas o que ele precisa:

```
☐ Dashboard (Tela inicial)
☐ Finanças Pessoais
☐ Finanças Empresa
☐ Contabilidade
☐ Funcionários
☐ Gestão Equipe
☐ Ponto Eletrônico
☐ Cursos
☐ Alunos
☐ Marketing
☐ Afiliados
☐ Calendário
☐ Arquivos
☐ Configurações
☐ Permissões
```

### Exemplo: Funcionário do Financeiro
```
☑ Dashboard
☑ Finanças Empresa
☑ Contabilidade
☑ Pagamentos
☐ Funcionários (não precisa ver)
☐ Cursos (não precisa ver)
☐ Permissões (NUNCA dar isso)
```

### Exemplo: Professor
```
☑ Dashboard
☐ Finanças (não precisa ver dinheiro)
☑ Cursos
☑ Alunos
☑ Turmas Online
☑ Turmas Presenciais
☑ Área do Professor
☐ Permissões (NUNCA dar isso)
```

---

# 6. COMO EDITAR O SITE

## ✏️ O Sistema de Edição

Seu site tem um **Modo de Edição** que permite alterar textos e imagens sem precisar de programador.

### Ativando o Modo de Edição

#### Passo 1: Faça Login como OWNER
- Apenas o dono (você) pode editar

#### Passo 2: Encontre o Botão de Edição
- No canto da tela, procure um **ícone de lápis** ✏️
- Ou um botão escrito **"Modo Edição"**

#### Passo 3: Ative o Modo
- Clique no botão
- A tela fica com bordas coloridas nos elementos editáveis

### Editando Textos

1. **Ative o Modo Edição**
2. **Clique no texto** que quer mudar
3. **Digite o novo texto**
4. **Clique fora** para salvar
5. **Desative o Modo Edição** quando terminar

### Editando Imagens

1. **Ative o Modo Edição**
2. **Clique na imagem** que quer trocar
3. **Clique em "Trocar Imagem"**
4. **Escolha a nova imagem** do seu computador
5. **Aguarde o upload**
6. **Pronto!**

### O Que Você Pode Editar

| Elemento | Onde Fica | Como Editar |
|----------|-----------|-------------|
| **Logo** | Topo do site | Configurações → Logo |
| **Textos da Home** | Página inicial | Modo Edição |
| **Imagens** | Várias páginas | Modo Edição |
| **Cores** | Todo o site | Configurações → Aparência |
| **Nome da Empresa** | Vários lugares | Configurações → Dados |

---

# 7. COMO GERENCIAR CURSOS

## 📹 Criando um Novo Curso

### Passo 1: Acesse a Área de Cursos
1. Menu → **Cursos**
2. Clique **"+ Novo Curso"**

### Passo 2: Informações Básicas
Preencha:
- **Título:** Nome do curso (ex: "Química para ENEM 2024")
- **Descrição:** Sobre o que é o curso
- **Categoria:** Tipo (ex: "Vestibular")
- **Nível:** Iniciante, Intermediário ou Avançado
- **Preço:** Quanto custa (ou R$ 0 se gratuito)
- **Capa:** Imagem de divulgação

### Passo 3: Criando Módulos
1. Na página do curso, clique **"+ Novo Módulo"**
2. Dê um nome (ex: "Módulo 1: Química Orgânica")
3. Adicione descrição
4. Salve

### Passo 4: Adicionando Aulas
1. Dentro do módulo, clique **"+ Nova Aula"**
2. Preencha:
   - **Título:** Nome da aula
   - **Descrição:** Do que se trata
   - **Vídeo:** Cole o link do YouTube ou Vimeo
   - **Duração:** Tempo do vídeo
   - **XP:** Pontos que o aluno ganha

### Passo 5: Publicando
1. Revise todo o conteúdo
2. Clique **"Publicar Curso"**
3. O curso aparece para os alunos

---

## 👨‍🎓 Adicionando Alunos

### Método 1: Aluno se Cadastra Sozinho
1. Aluno acessa seu site
2. Clica em "Criar Conta"
3. Preenche dados
4. Compra o curso (ou recebe acesso gratuito)

### Método 2: Você Cadastra Manualmente
1. Menu → **Alunos**
2. Clique **"+ Novo Aluno"**
3. Preencha dados
4. Vincule aos cursos

### Método 3: Integração Automática (Hotmart)
- Quando alguém compra na Hotmart
- O sistema recebe notificação
- Cadastra o aluno automaticamente
- Libera acesso ao curso

---

## 🏆 Sistema de Gamificação

### O Que É?
Seu sistema tem **gamificação** - significa que funciona como um jogo para motivar os alunos.

### Elementos:

| Elemento | O Que É | Como Funciona |
|----------|---------|---------------|
| **XP** | Pontos de experiência | Aluno ganha ao completar aulas |
| **Nível** | Ranking do aluno | Sobe conforme ganha XP |
| **Badges** | Medalhas/conquistas | Ganha ao atingir metas |
| **Streak** | Dias seguidos | Conta dias estudando seguidos |
| **Ranking** | Posição entre alunos | Quem tem mais XP fica no topo |

### Como Configurar XP das Aulas
1. Edite a aula
2. Campo **"XP Reward"**
3. Defina quantos pontos (ex: 50 XP)
4. Salve

---

# 8. COMO CONTROLAR FINANÇAS

## 💵 Entendendo o Fluxo de Dinheiro

```
DINHEIRO ENTRANDO (Receitas)
    │
    ├── Vendas de Cursos (Hotmart)
    ├── Aulas Presenciais
    ├── Consultorias
    └── Outros
    │
    ▼
CAIXA DA EMPRESA
    │
    ▼
DINHEIRO SAINDO (Despesas)
    │
    ├── Fixas (todo mês igual)
    │   ├── Aluguel
    │   ├── Luz
    │   ├── Internet
    │   └── Salários
    │
    └── Variáveis (muda todo mês)
        ├── Marketing
        ├── Equipamentos
        └── Impostos
```

## 📊 Relatórios Financeiros

### Onde Ver
1. Menu → **Dashboard Executivo**
2. Ou Menu → **Relatórios**

### Principais Relatórios

#### Relatório de Receitas
- Quanto entrou
- De onde veio
- Comparação com meses anteriores

#### Relatório de Despesas
- Quanto saiu
- Para onde foi
- Categorias de gastos

#### DRE (Demonstração de Resultado)
```
Receita Total:        R$ 50.000
(-) Custos:           R$ 15.000
(-) Despesas:         R$ 10.000
(=) Lucro Bruto:      R$ 25.000
(-) Impostos:         R$  5.000
(=) Lucro Líquido:    R$ 20.000
```

---

## 🧾 Controlando Impostos

### Onde Fica
Menu → **Contabilidade**

### O Que Acompanhar
- **DAS:** Imposto do Simples Nacional
- **INSS:** Previdência
- **ISS:** Imposto sobre serviços
- **IRPJ:** Imposto de renda da empresa

### Como Cadastrar
1. Clique **"+ Novo Imposto"**
2. Selecione o tipo
3. Informe o valor
4. Informe o mês de referência
5. Marque como pago quando pagar

---

# 9. COMO ACOMPANHAR FUNCIONÁRIOS

## ⏰ Ponto Eletrônico

### Como Funciona para o Funcionário
1. Funcionário faz login no sistema
2. Vai em **Ponto Eletrônico**
3. Clica em **"Registrar Entrada"**
4. Sistema salva:
   - Horário exato
   - Localização (GPS)
   - Foto (se configurado)

### Como Você Acompanha
1. Menu → **Ponto Eletrônico**
2. Veja todos os registros
3. Filtre por:
   - Funcionário
   - Data
   - Tipo (entrada/saída)

### Relatórios de Ponto
- Horas trabalhadas por dia
- Horas extras
- Atrasos
- Faltas

---

## 📋 Tarefas e Produtividade

### Criando Tarefas
1. Menu → **Gestão Equipe**
2. Clique **"+ Nova Tarefa"**
3. Preencha:
   - Título
   - Descrição
   - Responsável
   - Prazo
   - Prioridade

### Acompanhando
- **Kanban:** Visualização em colunas
  - A Fazer
  - Em Andamento
  - Concluído

### Relatórios
- Tarefas concluídas por pessoa
- Tempo médio de conclusão
- Tarefas atrasadas

---

## 👁️ Monitoramento em Tempo Real

### O Que Você Pode Ver
1. **Quem está online** agora
2. **O que cada um está fazendo**
3. **Últimas ações** de cada funcionário

### Como Acessar
1. Menu → **Dashboard**
2. Widget **"Atividade em Tempo Real"**
3. Ou Menu → **Logs de Auditoria**

### Logs de Auditoria
O sistema registra TUDO que acontece:
- Quem fez login
- Quem criou/editou/deletou algo
- Quando foi
- O que era antes e depois

---

# 10. SEGURANÇA E PERMISSÕES

## 🛡️ Níveis de Acesso

### OWNER (Dono) - Apenas Você
```
✅ Ver TUDO
✅ Editar TUDO
✅ Deletar TUDO
✅ Criar/remover usuários
✅ Mudar permissões
✅ Acessar logs
✅ Configurar sistema
✅ Ver dados financeiros completos
```

### ADMIN (Administrador)
```
✅ Ver quase tudo
✅ Editar maioria das coisas
✅ Criar usuários (exceto outros admins)
❌ Deletar sistema
❌ Ver logs sensíveis
❌ Mudar configurações críticas
```

### PROFESSOR
```
✅ Ver cursos
✅ Editar cursos
✅ Ver alunos
✅ Área do professor
❌ Ver finanças
❌ Ver funcionários
❌ Acessar configurações
```

### FUNCIONÁRIO
```
✅ Ver áreas específicas (configurável)
✅ Editar próprio perfil
✅ Bater ponto
❌ Ver salários de outros
❌ Ver dados sensíveis
❌ Acessar permissões
```

---

## 🔐 Boas Práticas de Segurança

### Senhas
- **Mínimo 8 caracteres**
- **Misture:** letras, números, símbolos
- **Não use:** datas de nascimento, nomes, sequências
- **Troque:** a cada 3 meses

### Acessos
- **Dê apenas o necessário** - se não precisa ver, não dê acesso
- **Revise regularmente** - funcionário saiu? Remova acesso
- **Nunca compartilhe** sua senha de OWNER

### Backup
- O sistema faz backup automático
- Mas você pode exportar dados importantes
- Menu → Configurações → Backup

---

# 11. PERGUNTAS FREQUENTES

## ❓ Dúvidas Comuns

### "Esqueci minha senha, e agora?"
1. Vá para tela de login
2. Clique "Esqueci minha senha"
3. Digite seu e-mail
4. Receba link de recuperação
5. Crie nova senha

### "Funcionário não consegue acessar"
1. Verifique se o e-mail está correto
2. Peça para ele verificar a pasta de spam
3. Reenvie o convite se necessário
4. Verifique se a conta está ativa em Permissões

### "Não estou vendo um módulo"
- Pode ser que você não tenha permissão
- Apenas o OWNER vê tudo
- Verifique suas permissões

### "Como mudo o logo?"
1. Menu → Configurações
2. Aba "Aparência" ou "Branding"
3. Clique no logo atual
4. Faça upload do novo
5. Salve

### "Como integro com Hotmart?"
1. Menu → Integrações
2. Encontre "Hotmart"
3. Clique "Conectar"
4. Siga as instruções
5. Cole suas credenciais da Hotmart

### "Posso usar no celular?"
- SIM! O sistema é responsivo
- Funciona em qualquer celular
- Acesse pelo navegador do celular
- Mesma URL, mesmos dados

### "Quanto custa o sistema?"
- O sistema já está pago e pronto
- Você paga apenas a hospedagem
- Lovable Cloud: baseado em uso
- Domínio: ~R$40/ano

---

# 11. AUTOMAÇÕES E INTEGRAÇÕES ATIVAS {#11-automações}

## ⚡ O Que Funciona Automaticamente

### Automações Ativas

| Automação | O Que Faz | Status |
|-----------|-----------|--------|
| **2FA por Email** | Envia código de 6 dígitos no login | ✅ Ativo |
| **Captura de Leads** | Salva contatos do WhatsApp | ✅ Ativo |
| **IA TRAMON** | Responde WhatsApp automaticamente | ✅ Ativo |
| **XP por Aulas** | Dá pontos ao completar aulas | ✅ Ativo |
| **Streak de Estudos** | Conta dias consecutivos de estudo | ✅ Ativo |
| **Certificados** | Gera ao concluir curso | ✅ Ativo |
| **Backup Automático** | Salva dados periodicamente | ✅ Ativo |
| **Logs de Auditoria** | Registra todas as ações | ✅ Ativo |
| **Limpeza de Códigos 2FA** | Remove códigos expirados | ✅ Ativo |
| **Criação de Perfil** | Cria perfil ao cadastrar usuário | ✅ Ativo |

### Integrações Configuradas

| Serviço | Função | Status |
|---------|--------|--------|
| **WhatsApp** | Central de atendimento + IA | ✅ Conectado |
| **Hotmart** | Webhooks de vendas | ✅ Configurado |
| **YouTube** | Métricas do canal | ✅ Ativo |
| **Google Calendar** | Sincronização de agenda | ✅ Ativo |
| **Resend** | Envio de emails | ✅ Ativo |
| **Gemini IA** | Análises e chat inteligente | ✅ Ativo |

### Edge Functions (Backend)

| Função | Descrição |
|--------|-----------|
| `ai-assistant` | Assistente IA geral |
| `ai-tramon` | IA especializada para WhatsApp |
| `ai-tutor` | Tutor inteligente para alunos |
| `backup-data` | Sistema de backup |
| `extract-document` | Extração de texto de PDFs com IA |
| `google-calendar` | Sincronização de calendário |
| `send-2fa-code` | Envio de códigos 2FA |
| `send-notification-email` | Emails automáticos |
| `whatsapp-webhook` | Receber mensagens WhatsApp |
| `youtube-api` | Buscar métricas do YouTube |
| `webhook-curso-quimica` | Webhooks da Hotmart |

---

# 12. CHECKLIST DE STATUS {#12-checklist}

## ✅ O QUE ESTÁ 100% PRONTO

### Módulos Core
- [x] Dashboard com métricas
- [x] Sistema de autenticação com 2FA
- [x] Gestão de permissões (9 níveis)
- [x] Cadastro de funcionários
- [x] Finanças da empresa
- [x] Finanças pessoais (só owner)
- [x] Calendário com lembretes
- [x] Central WhatsApp com IA
- [x] LMS completo (cursos, módulos, aulas)
- [x] Sistema de gamificação (XP, badges, streaks)
- [x] Marketing e campanhas
- [x] Gestão de documentos
- [x] God Mode (edição visual)
- [x] Backup do sistema

### Segurança
- [x] RLS em todas as tabelas sensíveis
- [x] Autenticação 2FA por email
- [x] Mascaramento de salários
- [x] Auditoria de permissões
- [x] Views com SECURITY_INVOKER
- [x] Rate limiting
- [ ] Leaked Password Protection (requer config manual no Supabase)

### Integrações
- [x] WhatsApp (ManyChat)
- [x] Hotmart (webhooks)
- [x] YouTube API
- [x] Google Calendar
- [x] Email (Resend)
- [x] IA (Gemini)

---

# 13. PERGUNTAS FREQUENTES {#13-faq}

## Para o OWNER (Você)

### "Como crio acesso para um funcionário?"
```
1. Funcionário cria conta em /auth com email dele
2. Você vai em Menu → Permissões
3. Encontra o usuário na lista
4. Seleciona o cargo (admin, coordenacao, etc.)
5. Pronto! Ele já pode acessar.
```

### "Como vejo o que meus funcionários fizeram?"
```
Menu → Permissões → Aba "Histórico"
(Só você, como owner, consegue ver)
```

### "Como edito textos e imagens do site?"
```
1. Procure o botão "✏️ Modo Edição" na tela
2. Ative o modo
3. Clique em qualquer texto para editar
4. Clique em imagens para trocar
5. Salva automaticamente!
```

### "Funcionários podem ver meus gastos pessoais?"
```
NÃO. A área "Vida Pessoal" é 100% exclusiva sua.
Nenhum outro cargo consegue acessar.
```

### "Como faço backup?"
```
Menu → Configurações → Backup → Gerar Backup
```

### "Como removo acesso de alguém?"
```
Menu → Permissões → Encontre a pessoa → Selecione "Sem permissão"
```

## Para FUNCIONÁRIOS

### "Esqueci minha senha"
```
Na tela de login, clique em "Esqueci a senha"
Você receberá um email com link para criar nova senha.
```

### "Não consigo acessar um módulo"
```
Você provavelmente não tem permissão.
Fale com seu supervisor/owner.
```

### "O código 2FA não chegou"
```
1. Verifique a pasta de spam/lixeira
2. Aguarde 1 minuto
3. Tente novamente
4. Se persistir, fale com o owner
```

### "Como marco ponto?"
```
Depois de logado, procure o botão "Bater Ponto"
O sistema registra automaticamente hora e data.
```

---

# 14. GLOSSÁRIO {#14-glossário}

## 📖 Termos Técnicos Explicados

| Termo | O Que Significa |
|-------|-----------------|
| **Dashboard** | Painel de controle principal |
| **Login** | Entrar no sistema com e-mail e senha |
| **Logout** | Sair do sistema |
| **2FA** | Verificação em duas etapas (código no email) |
| **Upload** | Enviar arquivo para o sistema |
| **Download** | Baixar arquivo do sistema |
| **Backup** | Cópia de segurança dos dados |
| **RLS** | Row Level Security - segurança por linha |
| **Admin** | Administrador com poderes especiais |
| **Owner** | Dono do sistema (você) |
| **God Mode** | Modo de edição visual do site |
| **XP** | Pontos de experiência (gamificação) |
| **Badge** | Medalha/conquista |
| **Streak** | Sequência de dias consecutivos |
| **CAC** | Custo de Aquisição de Cliente |
| **LTV** | Lifetime Value (valor do cliente no tempo) |
| **ROI** | Retorno sobre Investimento |
| **API** | Conexão entre sistemas |
| **Webhook** | Notificação automática entre sistemas |
| **Edge Function** | Função que roda no servidor |
| **Responsivo** | Funciona em celular e computador |
| **IA TRAMON** | Inteligência artificial para WhatsApp |

---

# 📞 SUPORTE

## Documentação Disponível

| Arquivo | Conteúdo |
|---------|----------|
| `GUIA_COMPLETO_PLATAFORMA.md` | Este guia (você está lendo) |
| `RELATORIO_FINAL_COMPLETO.md` | Relatório técnico completo |
| `GUIA_DOMINIO_PASSO_A_PASSO.md` | Como configurar domínio |
| `GUIA_WHATSAPP_PRODUCAO.md` | Configurar WhatsApp |
| `GUIA_CLOUDFLARE.md` | Configurar Cloudflare |

---

# ✅ CHECKLIST DE PRIMEIRO USO

Use esta lista para configurar tudo:

## Configuração Inicial
- [ ] 1. Fazer login como Owner (moisesblank@gmail.com)
- [ ] 2. Trocar logo da empresa (Configurações)
- [ ] 3. Configurar dados da empresa

## Equipe
- [ ] 4. Cadastrar funcionários (Menu → Funcionários)
- [ ] 5. Pedir para funcionários criarem conta
- [ ] 6. Atribuir permissões a cada um (Menu → Permissões)

## Finanças
- [ ] 7. Cadastrar despesas fixas
- [ ] 8. Cadastrar fontes de receita
- [ ] 9. Configurar categorias financeiras

## Cursos (se aplicável)
- [ ] 10. Criar primeiro curso
- [ ] 11. Adicionar módulos e aulas
- [ ] 12. Testar fluxo do aluno

## Segurança
- [ ] 13. Fazer backup inicial
- [ ] 14. Verificar se 2FA está funcionando
- [ ] 15. Revisar permissões de cada usuário

---

# 🔐 NÍVEIS DE PERMISSÃO DETALHADOS

## Hierarquia Visual

```
                    👑 OWNER (Você)
                         │
            ┌────────────┴────────────┐
            │                         │
       🛡️ ADMIN                  📊 COORDENAÇÃO
            │                         │
  ┌─────────┼─────────┐               │
  │         │         │               │
📞 SUPORTE  🎓 MONITOR  📈 MARKETING  │
            │                         │
            └─────────┬───────────────┘
                      │
         ┌────────────┼────────────┐
         │            │            │
     💼 AFILIADO  💰 CONTAB.   📋 EMPLOYEE
```

## O Que Cada Cargo Pode Ver

| Área | Owner | Admin | Coord. | Suporte | Monitor | Marketing | Contab. | Afiliado | Employee |
|------|-------|-------|--------|---------|---------|-----------|---------|----------|----------|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Finanças Empresa | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ (só ver) | ❌ | ❌ |
| Finanças Pessoais | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Funcionários | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Salários | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Cursos | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Alunos | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Marketing | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ |
| WhatsApp | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Permissões | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| God Mode | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

**Versão do Guia:** 10.0  
**Data:** 17 de Dezembro de 2024  
**Sistema:** Moisés Medeiros v10.0 FINAL  
**Status:** 🟢 100% OPERACIONAL  

---

*Este documento pode ser copiado para o Microsoft Word. Selecione todo o texto (Ctrl+A), copie (Ctrl+C) e cole no Word (Ctrl+V).*
