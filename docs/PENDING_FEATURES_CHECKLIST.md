# 📋 CHECKLIST DE FEATURES PENDENTES PÓS-DEPLOY
**Data de Criação:** 2026-01-15  
**Status do Build:** ⏳ Aguardando resolução do timeout  
**Última Atualização:** Sessão atual

---

## 🔴 CRÍTICAS (Últimas 12 horas) - PRIORIDADE P0

### 1. Modo Prova (Simulado Impresso Digital)
- **Rota:** `/alunos/questoes`
- **Componente:** Botão "📄 Modo Prova" ao lado de "Criar Questões"
- [ ] Botão visível com contagem de questões filtradas
- [ ] Fase 1: Geração de PDF para impressão funciona
- [ ] Fase 2: Cartão de Respostas Digital funciona
- [ ] Fase 3: Resultados e Resoluções exibe corretamente
- [ ] PDF tem header com logo "MOISÉS MEDEIROS"
- [ ] Responsivo em mobile/tablet/desktop
- [ ] Dados salvos em `question_attempts` com `source: modo_prova`
- [ ] XP = 0 (não concede pontos)

### 2. Cache e Versionamento Seletivo
- **Hook:** `useCacheManager.tsx`
- [ ] Limpeza apenas de prefixos `cache_*`
- [ ] Keys protegidas intactas (`matriz_*`, `sb-*`, `mfa_*`)
- [ ] Sessão não é perdida após atualização de versão

### 3. Question History Integration
- [ ] Histórico de tentativas renderiza corretamente
- [ ] Vinculação com `quiz_questions` funcional

### 4. Code Splitting Standard
- [ ] Lazy loading de rotas funcionando
- [ ] Suspense boundaries ativos

### 5. Dogma Supremo v11.0 Update
- [ ] Validação de sessão a cada 30s
- [ ] Broadcast `user-deleted` funciona
- [ ] Owner imune a restrições

---

## 🟠 IMPORTANTES (Últimas 24 horas) - PRIORIDADE P1

### 6. MFA Channels Restriction
- [ ] 2FA exigido para dispositivos novos
- [ ] `mfa_verified` atualizado na sessão

### 7. Session Integrity Verification
- [ ] `validate_session_epoch` RPC funciona
- [ ] Epoch divergente força logout

### 8. Video Progress Status Logic
- **Rota:** `/alunos/planejamento`
- [ ] Vídeos pendentes mostram duração restante
- [ ] Vídeos concluídos mostram "Concluída" + ícone verde

### 9. Unified Video Grid Standard
- **Rota:** `/alunos/cursos`
- [ ] Grid contínuo sem separação por séries
- [ ] Responsivo (2-7 colunas)
- [ ] Animações CSS-only (transform-gpu)

### 10. Auto-Expand & Click-to-Load
- **Rota:** `/alunos/cursos`
- [ ] Primeiro módulo expande automaticamente
- [ ] Vídeos só carregam após clique manual

### 11. Planning Forum & Observations
- **Rota:** `/alunos/planejamento`
- [ ] Fórum e observações com Realtime
- [ ] Sync instantâneo de comentários

### 12. Dashboard/Sidebar Roles
- [ ] Sidebar adapta por role (gestão vs aluno)
- [ ] Métricas corretas por tipo de usuário

### 13. Planejamento Canonical Terms
- [ ] Terminologia unificada (Hub, Cronograma, etc.)

### 14. Simulados Mode Selection
- **Rota:** `/alunos/simulados`
- [ ] Seleção entre modos funciona
- [ ] Navegação correta pós-seleção

---

## 🟡 RECENTES (2-3 dias) - PRIORIDADE P2

### 15. Unified Device Fingerprinting v3.0
- [ ] Hash de dispositivo com pepper do servidor
- [ ] Paridade sessão ↔ `user_devices`
- [ ] Same Type Replacement funciona

### 16. Ranking 2300 Cinematic
- **Rota:** `/alunos/ranking`
- [ ] Pódio 3D holográfico renderiza
- [ ] Performance com 5K usuários
- [ ] XP reflete simulados em tempo real

### 17. Simulados Player Resilience
- [ ] Guards e spinners funcionam
- [ ] Erros exibem códigos (`QST_NOT_FOUND`, etc.)
- [ ] Navegação Anterior/Próximo/Finalizar

### 18. Simulados Unified Engine v2300
- [ ] RLS `questions_select_v19` funciona
- [ ] RPC `finish_simulado_attempt` processa corretamente
- [ ] Error notebook salvo via trigger

### 19. Universal Material Viewer
- [ ] Materiais renderizam com proteção
- [ ] `useContentSecurityGuard` ativo

### 20. Web Books Engine & Security
- [ ] Livros web carregam
- [ ] Proteção anti-pirataria ativa
- [ ] Anotações e bookmarks funcionam

### 21. PDF Reading Mode Fabric.js v6
- [ ] Canvas funciona para anotações
- [ ] Performance estável

### 22. ProtectedPDFViewerV2 Sovereign
- [ ] Watermark renderiza (nome + email + timestamp)
- [ ] Proteções de conteúdo ativas

---

## 🟢 PROVAVELMENTE PUBLICADAS (4+ dias) - VERIFICAÇÃO RÁPIDA

### 23. Anti-Black-Screen Fail-Safe
- [ ] Aplicação carrega sem tela preta
- [ ] Sem Service Workers registrados

### 24. Universal Plain Text Rendering
- [ ] Textos renderizam corretamente
- [ ] Sem caracteres bugados

### 25. Module Progress Engine
- [ ] Progresso de módulos salva
- [ ] Barra de progresso atualiza

### 26. Password Change Enforcement v3.2
- [ ] `password_change_required` força troca
- [ ] Flag `matriz_password_change_pending` bloqueia navegação

### 27. Temporal Truth & Resolution
- [ ] Datas/horários corretos (timezone)

### 28. Final Verification Gate
- [ ] Gate final de verificação funciona

---

## ⚡ PERFORMANCE — 29 ANIMAÇÕES INFINITAS REMOVIDAS (AUTOMÁTICO)

**Status:** ✅ Aplicado automaticamente após build normalizar  
**Impacto:** CPU/GPU significativamente mais leves em `/alunos/*`

### Substituições Antes × Depois:

| Componente | Antes (Animado) | Depois (Estático) | Visual |
|------------|-----------------|-------------------|--------|
| **Orbes de fundo** (SimuladoRunningScreen) | 3× `animate-pulse` pulsando | Blur estático com opacidade | ✅ Mesmo efeito, sem CPU |
| **Timer crítico** (SimuladoTimerBar) | `animate-pulse` + `animate-bounce` | Fundo vermelho sólido | ✅ Cor destaca urgência |
| **Timer crítico** (SimuladoTimer) | `animate-pulse` + `animate-bounce` | Fundo vermelho/âmbar sólido | ✅ Cor destaca urgência |
| **Dots de loading** (LoadingState) | 3 bolinhas quicando | Opacidade gradativa (0.4→0.6→0.8) | ✅ Indica "pensando" |
| **Dots da IA** (TutoriaChat) | 3 bolinhas quicando | Opacidade gradativa | ✅ Mesmo padrão |
| **Overlay suspensão** (SecurityBlackoutOverlay) | Círculo `animate-ping` + `animate-pulse` | Círculo amarelo estático | ✅ Cor chama atenção |
| **PulseIndicator** (Dashboard) | `animate-ping` ondas infinitas | Bolinha sólida verde | ✅ Cor indica "live" |
| **Troféus pódio** (AlunoRanking) | `rotate: [0,10,-10,0]` infinito | Troféu estático | ✅ Destaque por cor |
| **Pódio 3D** (AlunoRanking) | `y: [0,-5,0]` flutuando | Pódio fixo | ✅ 3D estático |
| **HUD Simulado** (AlunoSimulados) | `simulado-scan 4s infinite` | Estático | ✅ Grid visual mantido |
| **Dashboard Owner** (OwnerStudentDashboard) | `animate-pulse` + `animate-float` | Estático | ✅ Cards fixos |
| **CSS Dashboard** (dashboard-2300.css) | 6× keyframes infinite | Todos removidos | ✅ Gradientes estáticos |
| **CSS Sanctum** (sanctum.css) | `sanctum-watermark-drift 60s` | Estático | ✅ Watermark fixo |
| **UltraCommandCenter** | 4× `animate-pulse`/`bounce` | Estático | ✅ UI limpa |
| **AITutorAlertWidget** | 5× `animate-ping`/`pulse`/`bounce` | Estático | ✅ Alerta por cor |
| **AlunoUniversalDashboard** | `animate-pulse` + `animate-ping` loading | Estático | ✅ Skeleton padrão |
| **AlunoDesempenho** | `animate-ping` badge "tempo real" | Estático verde | ✅ Cor indica status |

### Verificação pelo Aluno:
- **Automático:** Alunos verão mudanças assim que o build normalizar
- **Não requer ação:** Cache limpo automaticamente pelo `useCacheManager`
- **Backward compatible:** Visual mantido, apenas movimento removido

### Arquivos Modificados:
```
src/components/simulados/screens/SimuladoRunningScreen.tsx
src/components/simulados/widgets/SimuladoTimerBar.tsx
src/components/simulados/widgets/SimuladoTimer.tsx
src/components/LoadingState.tsx
src/components/tutoria/TutoriaChat.tsx
src/components/security/SecurityBlackoutOverlay.tsx
src/components/dashboard/metrics/PulseIndicator.tsx
src/pages/aluno/AlunoRanking.tsx
src/pages/aluno/AlunoSimulados.tsx
src/pages/aluno/OwnerStudentDashboard.tsx
src/pages/aluno/AlunoUniversalDashboard.tsx
src/pages/aluno/AlunoDesempenho.tsx
src/components/aluno/UltraCommandCenter.tsx
src/components/aluno/questoes/AITutorAlertWidget.tsx
src/styles/dashboard-2300.css
src/styles/sanctum.css
```

---

## 🧪 TESTE DE PRODUÇÃO RÁPIDO

Após o deploy, execute em ordem:

```
1. https://pro.moisesmedeiros.com.br
   → Carrega sem tela preta? ✓/✗

2. /auth
   → Login funciona? ✓/✗

3. /alunos/dashboard
   → Dashboard carrega com métricas? ✓/✗

4. /alunos/questoes
   → Botão "📄 Modo Prova" visível? ✓/✗
   → Contagem de questões aparece? ✓/✗

5. /alunos/ranking
   → Pódio 3D renderiza? ✓/✗

6. /alunos/planejamento
   → Vídeos mostram progresso? ✓/✗

7. /gestaofc (como Owner)
   → Acesso completo? ✓/✗
```

---

## 📝 NOTAS

- **Build Timeout:** Problema de infraestrutura Lovable, não de código
- **Backup:** Manter backup local até confirmar deploy
- **Contato Suporte:** Acompanhar email/chat para previsão de resolução

---

**Assinatura:** SYNAPSE Ω v10.4  
**Projeto:** PRO.MOISESMEDEIROS.COM.BR
