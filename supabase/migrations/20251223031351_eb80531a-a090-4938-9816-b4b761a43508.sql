-- =====================================================
-- FORTALEZA DIGITAL - CORREÇÃO DE POLICIES PERMISSIVAS
-- Controle C011: Deny-by-default
-- =====================================================

-- DROP policies permissivas em tabelas de closures (dados sensíveis de fechamento)
DROP POLICY IF EXISTS "Allow all on personal_monthly_closures" ON public.personal_monthly_closures;
DROP POLICY IF EXISTS "Allow all on personal_yearly_closures" ON public.personal_yearly_closures;
DROP POLICY IF EXISTS "Allow all on entradas_monthly_closures" ON public.entradas_monthly_closures;
DROP POLICY IF EXISTS "Allow all on entradas_yearly_closures" ON public.entradas_yearly_closures;
DROP POLICY IF EXISTS "Allow all on contas_pagar_monthly_closures" ON public.contas_pagar_monthly_closures;
DROP POLICY IF EXISTS "Allow all on contas_pagar_yearly_closures" ON public.contas_pagar_yearly_closures;
DROP POLICY IF EXISTS "Allow all on contas_receber_monthly_closures" ON public.contas_receber_monthly_closures;
DROP POLICY IF EXISTS "Allow all on contas_receber_yearly_closures" ON public.contas_receber_yearly_closures;
DROP POLICY IF EXISTS "Allow all on comissoes_monthly_closures" ON public.comissoes_monthly_closures;
DROP POLICY IF EXISTS "Allow all on comissoes_yearly_closures" ON public.comissoes_yearly_closures;
DROP POLICY IF EXISTS "Allow all on contabilidade_monthly_closures" ON public.contabilidade_monthly_closures;
DROP POLICY IF EXISTS "Allow all on contabilidade_yearly_closures" ON public.contabilidade_yearly_closures;
DROP POLICY IF EXISTS "Allow all on hotmart_monthly_closures" ON public.hotmart_monthly_closures;
DROP POLICY IF EXISTS "Allow all on hotmart_yearly_closures" ON public.hotmart_yearly_closures;
DROP POLICY IF EXISTS "Allow all on folha_monthly_closures" ON public.folha_monthly_closures;
DROP POLICY IF EXISTS "Allow all on folha_yearly_closures" ON public.folha_yearly_closures;

-- Criar policies restritivas para closures (somente owner/admin)
CREATE POLICY "closures_read_owner" ON public.personal_monthly_closures FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'moisesblank@gmail.com'));
CREATE POLICY "closures_write_owner" ON public.personal_monthly_closures FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'moisesblank@gmail.com'));

CREATE POLICY "closures_read_owner" ON public.personal_yearly_closures FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'moisesblank@gmail.com'));
CREATE POLICY "closures_write_owner" ON public.personal_yearly_closures FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'moisesblank@gmail.com'));

CREATE POLICY "closures_read_owner" ON public.entradas_monthly_closures FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'moisesblank@gmail.com'));
CREATE POLICY "closures_write_owner" ON public.entradas_monthly_closures FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'moisesblank@gmail.com'));

CREATE POLICY "closures_read_owner" ON public.entradas_yearly_closures FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'moisesblank@gmail.com'));
CREATE POLICY "closures_write_owner" ON public.entradas_yearly_closures FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'moisesblank@gmail.com'));

CREATE POLICY "closures_read_owner" ON public.contas_pagar_monthly_closures FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'moisesblank@gmail.com'));
CREATE POLICY "closures_write_owner" ON public.contas_pagar_monthly_closures FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'moisesblank@gmail.com'));

CREATE POLICY "closures_read_owner" ON public.contas_pagar_yearly_closures FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'moisesblank@gmail.com'));
CREATE POLICY "closures_write_owner" ON public.contas_pagar_yearly_closures FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'moisesblank@gmail.com'));

CREATE POLICY "closures_read_owner" ON public.contas_receber_monthly_closures FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'moisesblank@gmail.com'));
CREATE POLICY "closures_write_owner" ON public.contas_receber_monthly_closures FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'moisesblank@gmail.com'));

CREATE POLICY "closures_read_owner" ON public.contas_receber_yearly_closures FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'moisesblank@gmail.com'));
CREATE POLICY "closures_write_owner" ON public.contas_receber_yearly_closures FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'moisesblank@gmail.com'));

CREATE POLICY "closures_read_owner" ON public.comissoes_monthly_closures FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'moisesblank@gmail.com'));
CREATE POLICY "closures_write_owner" ON public.comissoes_monthly_closures FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'moisesblank@gmail.com'));

CREATE POLICY "closures_read_owner" ON public.comissoes_yearly_closures FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'moisesblank@gmail.com'));
CREATE POLICY "closures_write_owner" ON public.comissoes_yearly_closures FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'moisesblank@gmail.com'));

CREATE POLICY "closures_read_owner" ON public.contabilidade_monthly_closures FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'moisesblank@gmail.com'));
CREATE POLICY "closures_write_owner" ON public.contabilidade_monthly_closures FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'moisesblank@gmail.com'));

CREATE POLICY "closures_read_owner" ON public.contabilidade_yearly_closures FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'moisesblank@gmail.com'));
CREATE POLICY "closures_write_owner" ON public.contabilidade_yearly_closures FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'moisesblank@gmail.com'));

CREATE POLICY "closures_read_owner" ON public.hotmart_monthly_closures FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'moisesblank@gmail.com'));
CREATE POLICY "closures_write_owner" ON public.hotmart_monthly_closures FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'moisesblank@gmail.com'));

CREATE POLICY "closures_read_owner" ON public.hotmart_yearly_closures FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'moisesblank@gmail.com'));
CREATE POLICY "closures_write_owner" ON public.hotmart_yearly_closures FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'moisesblank@gmail.com'));

CREATE POLICY "closures_read_owner" ON public.folha_monthly_closures FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'moisesblank@gmail.com'));
CREATE POLICY "closures_write_owner" ON public.folha_monthly_closures FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'moisesblank@gmail.com'));

CREATE POLICY "closures_read_owner" ON public.folha_yearly_closures FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'moisesblank@gmail.com'));
CREATE POLICY "closures_write_owner" ON public.folha_yearly_closures FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'moisesblank@gmail.com'));

-- Comentário de auditoria
COMMENT ON POLICY "closures_read_owner" ON public.personal_monthly_closures IS 'FORTALEZA DIGITAL C011: Deny-by-default - apenas owner';