// ============================================
// ⚡ REALTIME CORE — EXEMPLOS DE USO
// CONSTITUIÇÃO SYNAPSE Ω v10.x — PARTE 4
// ============================================
// ATENÇÃO: Este arquivo é apenas documentação
// NÃO está aplicado nas telas ainda (Parte 4)
// ============================================

/*
╔══════════════════════════════════════════════════════════════════╗
║               EXEMPLO 1: USO EM /alunos (Portal)                 ║
║     Filtra automaticamente por user_id do aluno logado           ║
╚══════════════════════════════════════════════════════════════════╝

```typescript
import { useRealtimeAlunos } from "@/hooks/useRealtimeCore";

function AlunoDashboard() {
  const { isConnected, state } = useRealtimeAlunos([
    {
      table: 'lesson_progress',
      event: 'UPDATE',
      onEvent: (payload) => {
        console.log('Progresso atualizado:', payload.new);
        // Atualizar UI local
      },
    },
    {
      table: 'user_gamification',
      event: '*',
      onEvent: (payload) => {
        console.log('Gamificação:', payload);
        // Atualizar XP, nível, etc.
      },
    },
  ]);

  return (
    <div>
      <span>Status: {isConnected ? '🟢' : '🔴'}</span>
      <span>Último evento: {state.lastEventAt?.toLocaleTimeString()}</span>
    </div>
  );
}
```

╔══════════════════════════════════════════════════════════════════╗
║          EXEMPLO 2: USO EM /gestaofc (Invalidation)              ║
║      Re-fetch paginado ao invés de stream de tabela inteira      ║
╚══════════════════════════════════════════════════════════════════╝

```typescript
import { useRealtimeGestao } from "@/hooks/useRealtimeCore";

function GestaoAlunos() {
  // Mapeia tabelas para queryKeys do React Query
  const { isConnected, state } = useRealtimeGestao({
    'alunos': ['alunos-list'],
    'usuarios_wordpress_sync': ['wp-users'],
    'user_roles': ['role-stats'],
  });

  // Quando houver INSERT/UPDATE/DELETE em 'alunos',
  // automaticamente invalida queryClient.invalidateQueries(['alunos-list'])
  // Resultado: React Query faz re-fetch paginado

  return (
    <div>
      <span>Realtime: {isConnected ? 'Conectado' : 'Desconectado'}</span>
    </div>
  );
}
```

╔══════════════════════════════════════════════════════════════════╗
║            EXEMPLO 3: USO MANUAL (Controle Total)                ║
║           Para casos especiais ou debugging                      ║
╚══════════════════════════════════════════════════════════════════╝

```typescript
import { RealtimeCore, filterByUserId } from "@/lib/realtime";

// Criar instância
const realtime = new RealtimeCore({
  channelName: 'minha-tela-custom',
  onStatusChange: (status) => console.log('Status:', status),
  onAnyEvent: (table, event, payload) => {
    console.log(`[${table}] ${event}:`, payload);
  },
});

// Adicionar subscriptions
realtime
  .addSubscription({
    table: 'alunos',
    event: 'INSERT',
    onEvent: (payload) => console.log('Novo aluno:', payload.new),
  })
  .addSubscription({
    table: 'lesson_progress',
    event: '*',
    filter: filterByUserId('uuid-do-usuario'),
    onEvent: (payload) => console.log('Progresso:', payload),
  });

// Conectar
realtime.connect();

// Verificar estado
console.log(realtime.getState());
// { status: 'connected', lastEventAt: Date, subscriptionCount: 2, channelName: 'minha-tela-custom' }

// CLEANUP (obrigatório!)
realtime.destroy();
```

╔══════════════════════════════════════════════════════════════════╗
║                    REGRAS DE ESCALA                              ║
╚══════════════════════════════════════════════════════════════════╝

/alunos (Portal do Estudante):
  ✅ SEMPRE usar filterByUserId(user.id)
  ✅ Assinar apenas tabelas relevantes (lesson_progress, user_gamification)
  ❌ NUNCA assinar tabela inteira sem filtro

/gestaofc (Área de Gestão):
  ✅ Usar modo invalidation (re-fetch paginado)
  ✅ Reagir com queryClient.invalidateQueries()
  ❌ NUNCA fazer stream de tabela grande (alunos, transacoes_hotmart)

╔══════════════════════════════════════════════════════════════════╗
║                    ARQUITETURA                                   ║
╚══════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────┐
│                      TELA (React Component)                      │
├─────────────────────────────────────────────────────────────────┤
│                          useRealtimeCore()                       │
│                    ou useRealtimeAlunos()                        │
│                    ou useRealtimeGestao()                        │
├─────────────────────────────────────────────────────────────────┤
│                        RealtimeCore                              │
│   ┌──────────┐   ┌──────────┐   ┌──────────┐                    │
│   │   Sub 1  │   │   Sub 2  │   │   Sub 3  │  (múltiplas subs)  │
│   └──────────┘   └──────────┘   └──────────┘                    │
├─────────────────────────────────────────────────────────────────┤
│                    Supabase Realtime Channel                     │
│                     (UM ÚNICO por tela)                          │
└─────────────────────────────────────────────────────────────────┘

*/

export {};
