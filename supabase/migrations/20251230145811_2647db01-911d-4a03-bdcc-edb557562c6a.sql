-- Fix fn_is_beta_or_owner: usar apenas roles VÁLIDAS do enum app_role
-- Roles inválidas removidas: 'funcionario' (não existe no enum)
-- Conforme Constituição v10.0: Gestão = owner, admin, coordenacao, contabilidade, suporte, monitoria, marketing, afiliado
-- Alunos premium = beta

CREATE OR REPLACE FUNCTION public.fn_is_beta_or_owner()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN (
    public.fn_is_owner()
    OR EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN (
        'beta',                -- Aluno pagante
        'admin',               -- Administrador
        'coordenacao',         -- Coordenação
        'contabilidade',       -- Contabilidade
        'suporte',             -- Suporte
        'monitoria',           -- Monitoria
        'marketing',           -- Marketing
        'afiliado'             -- Afiliado
      )
    )
  );
END;
$function$;