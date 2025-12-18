-- Corrigir coluna 'data' que não tem valor default
ALTER TABLE public.metricas_diarias 
ALTER COLUMN data SET DEFAULT CURRENT_DATE;

-- Também corrigir a função que incrementa métricas para usar data_referencia
CREATE OR REPLACE FUNCTION public.increment_metrica_diaria(p_data date, p_campo text, p_valor numeric)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Criar registro se não existir
  INSERT INTO public.metricas_diarias (data, data_referencia)
  VALUES (p_data, p_data)
  ON CONFLICT (data_referencia) DO NOTHING;

  -- Atualizar o campo específico
  EXECUTE format('UPDATE public.metricas_diarias SET %I = COALESCE(%I, 0) + $1 WHERE data_referencia = $2', p_campo, p_campo)
  USING p_valor, p_data;
END;
$function$;