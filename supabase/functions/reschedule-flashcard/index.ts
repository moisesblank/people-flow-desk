// ============================================
// 🧠 FSRS v5 FLASHCARD RESCHEDULE
// Algoritmo de repetição espaçada avançado
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { getCorsHeaders, handleCorsOptions } from "../_shared/corsConfig.ts";

// Parâmetros FSRS v5 otimizados
const W = [
  0.4072, // w0 - initial stability for rating 1
  1.1829, // w1 - initial stability for rating 2  
  3.1262, // w2 - initial stability for rating 3
  15.4722, // w3 - initial stability for rating 4
  7.2102, // w4 - difficulty weight
  0.5316, // w5 - difficulty decay
  1.0651, // w6 - difficulty delta
  0.0046, // w7 - stability increase base
  1.5071, // w8 - stability increase factor
  0.1367, // w9 - stability power
  1.0461, // w10 - rating factor
  2.1199, // w11 - success stability bonus
  0.0263, // w12 - fail stability factor
  0.3502, // w13 - hard penalty
  1.4231, // w14 - easy bonus
  0.2195, // w15 - short term stability
  2.8237, // w16 - long term stability
];

// Rating: 1 = Again (esqueceu), 2 = Hard, 3 = Good, 4 = Easy
type Rating = 1 | 2 | 3 | 4;
type State = 'new' | 'learning' | 'review' | 'relearning';

interface FSRSParams {
  stability: number;
  difficulty: number;
  rating: Rating;
  state: State;
  elapsedDays: number;
}

// Calcula nova estabilidade baseada no FSRS v5
function calculateNewStability(params: FSRSParams): number {
  const { stability, difficulty, rating, state, elapsedDays } = params;

  // Para cards novos ou em aprendizado
  if (state === 'new' || state === 'learning') {
    return W[rating - 1]; // w0-w3 são estabilidades iniciais por rating
  }

  // Se esqueceu (rating 1), aplicar penalidade
  if (rating === 1) {
    // Fórmula de lapso do FSRS
    const newStability = W[12] * Math.pow(difficulty, -W[13]) * 
      (Math.pow(stability + 1, W[14]) - 1) * 
      Math.exp(W[15] * (1 - elapsedDays / stability));
    return Math.max(0.1, newStability);
  }

  // Recall bem-sucedido
  const retrievability = Math.pow(1 + elapsedDays / (9 * stability), -1);
  
  // Fator de dificuldade
  const difficultyFactor = Math.exp(W[7]) * (11 - difficulty);
  
  // Fator de estabilidade
  const stabilityFactor = Math.pow(stability, -W[9]);
  
  // Fator de rating
  const ratingFactor = Math.exp(W[10] * (rating - 3));
  
  // Fator de recuperabilidade
  const retrievabilityFactor = Math.exp(W[11] * (1 - retrievability));
  
  // Hard penalty ou Easy bonus
  let modFactor = 1;
  if (rating === 2) modFactor = W[13]; // Hard penalty
  if (rating === 4) modFactor = W[14]; // Easy bonus
  
  const stabilityIncrease = difficultyFactor * stabilityFactor * ratingFactor * retrievabilityFactor * modFactor;
  
  const newStability = stability * (1 + Math.exp(W[8]) * stabilityIncrease);
  
  return Math.max(0.1, newStability);
}

// Calcula nova dificuldade
function calculateNewDifficulty(currentDifficulty: number, rating: Rating): number {
  // Fórmula FSRS para atualização de dificuldade
  const delta = W[6] * (rating - 3);
  let newDifficulty = currentDifficulty - delta;
  
  // Clamp entre 1 e 10
  newDifficulty = Math.max(1, Math.min(10, newDifficulty));
  
  // Aplicar mean reversion
  const meanReversion = W[5];
  newDifficulty = meanReversion * 5 + (1 - meanReversion) * newDifficulty;
  
  return Math.max(1, Math.min(10, newDifficulty));
}

// Calcula próxima data de revisão
function calculateNextDue(stability: number): Date {
  const intervalDays = Math.max(1, Math.round(stability * 0.9)); // Fator de segurança
  const nextDue = new Date();
  nextDue.setDate(nextDue.getDate() + intervalDays);
  nextDue.setHours(3, 0, 0, 0); // Reset para meia-noite BRT
  return nextDue;
}

// Determina novo estado do card
function getNewState(currentState: State, rating: Rating): State {
  if (rating === 1) {
    return currentState === 'new' ? 'learning' : 'relearning';
  }
  if (currentState === 'new' || currentState === 'learning') {
    return rating >= 3 ? 'review' : 'learning';
  }
  return 'review';
}

serve(async (req) => {
  // LEI VI: CORS dinâmico via allowlist centralizado
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return handleCorsOptions(req);
  }

  console.log('[reschedule-flashcard] Iniciando...');

  try {
    const { 
      flashcardId, 
      rating, 
      currentStability = 1, 
      currentDifficulty = 5,
      currentState = 'new',
      elapsedDays = 0
    } = await req.json();

    if (!flashcardId || !rating || rating < 1 || rating > 4) {
      return new Response(
        JSON.stringify({ error: 'flashcardId e rating (1-4) são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar flashcard atual
    const { data: flashcard, error: fetchError } = await supabase
      .from('study_flashcards')
      .select('*')
      .eq('id', flashcardId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !flashcard) {
      console.error('[reschedule-flashcard] Flashcard não encontrado:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Flashcard não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calcular dias desde última revisão
    const lastReview = flashcard.last_review ? new Date(flashcard.last_review) : null;
    const actualElapsedDays = lastReview 
      ? Math.max(0, Math.floor((Date.now() - lastReview.getTime()) / (1000 * 60 * 60 * 24)))
      : elapsedDays;

    // Aplicar algoritmo FSRS
    const newStability = calculateNewStability({
      stability: currentStability || flashcard.stability || 1,
      difficulty: currentDifficulty || flashcard.difficulty || 5,
      rating: rating as Rating,
      state: (currentState || flashcard.state || 'new') as State,
      elapsedDays: actualElapsedDays,
    });

    const newDifficulty = calculateNewDifficulty(
      currentDifficulty || flashcard.difficulty || 5,
      rating as Rating
    );

    const newState = getNewState(
      (currentState || flashcard.state || 'new') as State,
      rating as Rating
    );

    const nextDue = calculateNextDue(newStability);
    const intervalDays = Math.max(1, Math.round(newStability * 0.9));

    // Atualizar flashcard
    const updateData: any = {
      stability: newStability,
      difficulty: newDifficulty,
      due: nextDue.toISOString(),
      state: newState,
      reps: (flashcard.reps || 0) + 1,
      last_review: new Date().toISOString(),
      last_interval: intervalDays,
    };

    // Incrementar lapses se esqueceu
    if (rating === 1) {
      updateData.lapses = (flashcard.lapses || 0) + 1;
    }

    const { error: updateError } = await supabase
      .from('study_flashcards')
      .update(updateData)
      .eq('id', flashcardId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('[reschedule-flashcard] Erro ao atualizar:', updateError);
      throw updateError;
    }

    console.log(`[reschedule-flashcard] Flashcard ${flashcardId} atualizado - Próxima revisão: ${nextDue.toISOString()}`);

    // Conceder XP por revisão
    const xpAmount = rating === 1 ? 2 : rating === 2 ? 5 : rating === 3 ? 10 : 15;
    
    try {
      await supabase.rpc('add_user_xp', {
        p_user_id: user.id,
        p_amount: xpAmount,
        p_source: 'flashcard_review',
        p_source_id: flashcardId,
        p_description: `Revisão de flashcard (rating: ${rating})`
      });
    } catch (xpError) {
      console.warn('[reschedule-flashcard] Erro ao conceder XP:', xpError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        nextDue: nextDue.toISOString(),
        intervalDays,
        newStability,
        newDifficulty,
        newState,
        xpEarned: xpAmount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[reschedule-flashcard] Erro:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
