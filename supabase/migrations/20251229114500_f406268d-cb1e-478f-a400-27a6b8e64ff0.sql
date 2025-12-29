-- P2-008: Adicionar policy para password_reset_tokens
-- Tabela tem RLS habilitado mas sem policies

-- Policy: Apenas o próprio usuário pode ver/criar seus tokens
CREATE POLICY "Users can manage own reset tokens"
ON public.password_reset_tokens
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Sistema pode gerenciar (para cleanup)
CREATE POLICY "Service role can manage all tokens"
ON public.password_reset_tokens
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);