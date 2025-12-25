
-- ============================================
-- MIGRAÇÃO: Consolidar RLS - receipt_ocr_extractions (13→4)
-- ============================================

-- Remover TODAS as políticas existentes
DROP POLICY IF EXISTS "Users can create OCR extractions" ON public.receipt_ocr_extractions;
DROP POLICY IF EXISTS "Users can update their own OCR extractions" ON public.receipt_ocr_extractions;
DROP POLICY IF EXISTS "Users can view their own OCR extractions" ON public.receipt_ocr_extractions;
DROP POLICY IF EXISTS "ocr_admin_manage_v4" ON public.receipt_ocr_extractions;
DROP POLICY IF EXISTS "ocr_delete" ON public.receipt_ocr_extractions;
DROP POLICY IF EXISTS "ocr_insert" ON public.receipt_ocr_extractions;
DROP POLICY IF EXISTS "ocr_select" ON public.receipt_ocr_extractions;
DROP POLICY IF EXISTS "ocr_update" ON public.receipt_ocr_extractions;
DROP POLICY IF EXISTS "ocr_user_own_data_v4" ON public.receipt_ocr_extractions;
DROP POLICY IF EXISTS "v16_receipt_delete" ON public.receipt_ocr_extractions;
DROP POLICY IF EXISTS "v16_receipt_insert" ON public.receipt_ocr_extractions;
DROP POLICY IF EXISTS "v16_receipt_select" ON public.receipt_ocr_extractions;
DROP POLICY IF EXISTS "v16_receipt_update" ON public.receipt_ocr_extractions;

-- Criar 4 políticas consolidadas
CREATE POLICY "ocr_select_v17" ON public.receipt_ocr_extractions
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR is_admin_or_owner(auth.uid()));

CREATE POLICY "ocr_insert_v17" ON public.receipt_ocr_extractions
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() OR is_admin_or_owner(auth.uid()));

CREATE POLICY "ocr_update_v17" ON public.receipt_ocr_extractions
FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR is_admin_or_owner(auth.uid()))
WITH CHECK (user_id = auth.uid() OR is_admin_or_owner(auth.uid()));

CREATE POLICY "ocr_delete_v17" ON public.receipt_ocr_extractions
FOR DELETE TO authenticated
USING (user_id = auth.uid() OR is_admin_or_owner(auth.uid()));
