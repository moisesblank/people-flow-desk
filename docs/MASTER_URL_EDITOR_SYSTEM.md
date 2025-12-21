# 🔗 Sistema de Edição de URLs/Destinos - MODO MASTER

## Visão Geral
O sistema permite ao Owner (moisesblank@gmail.com) editar o destino/URL de qualquer elemento clicável na plataforma em tempo real.

## Como Usar

### Método 1: Ctrl+Click
1. Ative o MODO MASTER (Ctrl+Shift+E)
2. Segure **Ctrl** e **clique** em qualquer link, botão, menu ou submenu
3. O editor de URL será aberto automaticamente
4. Escolha o tipo de link e configure o destino
5. Clique em "Salvar" ou pressione Ctrl+Enter

### Método 2: Menu de Contexto
1. Ative o MODO MASTER (Ctrl+Shift+E)
2. Clique com o **botão direito** em qualquer elemento
3. Selecione "Editar Destino" no menu
4. Configure o destino desejado

## Tipos de Links Suportados

| Tipo | Prefixo | Exemplo |
|------|---------|---------|
| **Link Interno** | `/` | `/dashboard`, `/alunos` |
| **Link Externo** | `https://` | `https://google.com` |
| **Âncora** | `#` | `#secao-contato` |
| **Email** | `mailto:` | `moisesblank@gmail.com` |
| **Telefone** | `tel:` | `+5511999999999` |
| **Arquivo** | (personalizado) | `/docs/manual.pdf` |

## Rotas Internas Disponíveis

- `/` - Home
- `/dashboard` - Dashboard
- `/alunos` - Alunos
- `/funcionarios` - Funcionários
- `/afiliados` - Afiliados
- `/financas-empresa` - Finanças Empresa
- `/financas-pessoais` - Finanças Pessoais
- `/marketing` - Marketing
- `/cursos` - Cursos
- `/tarefas` - Tarefas
- `/calendario` - Calendário
- `/configuracoes` - Configurações
- `/contabilidade` - Contabilidade
- `/ia-central` - IA Central
- `/webhooks` - Webhooks
- `/monitoramento` - Monitoramento
- `/dev` - Dev Area

## Opções Adicionais

- **Abrir em nova aba**: Toggle para configurar `target="_blank"`
- **Copiar URL**: Copia a URL final para a área de transferência
- **Restaurar Original**: Reverte para a URL original do elemento

## Atalhos de Teclado

| Atalho | Ação |
|--------|------|
| `Ctrl+Click` | Abrir editor de URL |
| `Ctrl+Enter` | Salvar URL |
| `Escape` | Cancelar edição |

## Persistência

Todas as alterações de URL são salvas na tabela `editable_content` do banco de dados com:
- `content_type: 'url'`
- Dados JSON contendo URL original, nova URL e configuração de target

## Arquivos Relacionados

- `src/components/admin/MasterURLEditor.tsx` - Componente principal
- `src/components/admin/MasterContextMenu.tsx` - Menu de contexto com opção "Editar Destino"
- `src/components/admin/MasterModeWrapper.tsx` - Wrapper que integra todos os componentes

## Segurança

- **Acesso exclusivo**: Apenas o Owner (moisesblank@gmail.com) pode editar URLs
- **Modo Master requerido**: O MODO MASTER deve estar ativo
- **Validação**: URLs são validadas antes de serem salvas

---

*Documentação atualizada em: 21/12/2025*
*Versão: SYNAPSE v16.0*
