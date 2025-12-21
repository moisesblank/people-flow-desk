
-- Recriar função check_beta_access com parâmetro _user_id para compatibilidade
DROP FUNCTION IF EXISTS public.check_beta_access(UUID);

CREATE OR REPLACE FUNCTION public.check_beta_access(_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_role public.app_role;
    v_expires_at TIMESTAMPTZ;
    v_days_remaining INT;
BEGIN
    SELECT role INTO v_role FROM public.user_roles WHERE user_id = _user_id LIMIT 1;
    SELECT access_expires_at INTO v_expires_at FROM public.profiles WHERE id = _user_id;
    
    IF v_role IN ('owner', 'admin') THEN
        RETURN json_build_object(
            'has_access', TRUE, 
            'is_unlimited', TRUE, 
            'is_staff', TRUE,
            'role', v_role::TEXT, 
            'days_remaining', NULL, 
            'expires_at', NULL,
            'reason', 'STAFF_ACCESS'
        );
    END IF;
    
    IF v_role = 'beta' THEN
        IF v_expires_at IS NULL OR v_expires_at > NOW() THEN
            v_days_remaining := CASE 
                WHEN v_expires_at IS NULL THEN NULL 
                ELSE GREATEST(0, EXTRACT(DAY FROM v_expires_at - NOW())::INT) 
            END;
            RETURN json_build_object(
                'has_access', TRUE, 
                'is_unlimited', v_expires_at IS NULL,
                'is_staff', FALSE,
                'role', 'beta', 
                'days_remaining', v_days_remaining, 
                'expires_at', v_expires_at,
                'reason', 'BETA_ACCESS'
            );
        ELSE
            RETURN json_build_object(
                'has_access', FALSE, 
                'is_unlimited', FALSE,
                'is_staff', FALSE,
                'role', 'beta_expired', 
                'days_remaining', 0, 
                'expires_at', v_expires_at,
                'reason', 'EXPIRED'
            );
        END IF;
    END IF;
    
    RETURN json_build_object(
        'has_access', FALSE, 
        'is_unlimited', FALSE,
        'is_staff', FALSE,
        'role', COALESCE(v_role::TEXT, 'aluno_gratuito'), 
        'days_remaining', 0, 
        'expires_at', NULL,
        'reason', 'NO_ACCESS'
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;
