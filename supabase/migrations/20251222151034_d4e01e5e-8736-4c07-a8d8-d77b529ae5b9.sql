-- ============================================
-- 🛡️ FORTALEZA DIGITAL ULTRA v2.0 - PARTE 5
-- Funções de Sessão, Cleanup e Triggers
-- ============================================

-- 5.11 FUNÇÃO: mark_webhook_processed - Marcar webhook como processado
CREATE OR REPLACE FUNCTION public.mark_webhook_processed(
    p_provider TEXT,
    p_event_id TEXT,
    p_status TEXT DEFAULT 'processed',
    p_response JSONB DEFAULT NULL,
    p_error TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.webhook_events
    SET 
        status = p_status,
        processed_at = CASE WHEN p_status = 'processed' THEN now() ELSE processed_at END,
        response = p_response,
        last_error = p_error,
        attempts = attempts + 1
    WHERE provider = p_provider AND event_id = p_event_id;
    
    RETURN FOUND;
END;
$$;

-- 5.12 FUNÇÃO: validate_session_v2 - Validar sessão ativa
CREATE OR REPLACE FUNCTION public.validate_session_v2(p_session_token UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session RECORD;
    v_now TIMESTAMPTZ := now();
BEGIN
    SELECT * INTO v_session
    FROM public.active_sessions
    WHERE session_token = p_session_token;
    
    IF v_session IS NULL THEN
        RETURN jsonb_build_object('valid', false, 'reason', 'session_not_found');
    END IF;
    
    IF v_session.status != 'active' THEN
        RETURN jsonb_build_object('valid', false, 'reason', 'session_' || v_session.status);
    END IF;
    
    IF v_session.expires_at < v_now THEN
        -- Marcar como expirada
        UPDATE public.active_sessions
        SET status = 'expired'
        WHERE id = v_session.id;
        
        RETURN jsonb_build_object('valid', false, 'reason', 'session_expired');
    END IF;
    
    -- Atualizar última atividade
    UPDATE public.active_sessions
    SET last_activity_at = v_now
    WHERE id = v_session.id;
    
    RETURN jsonb_build_object(
        'valid', true,
        'user_id', v_session.user_id,
        'device_hash', v_session.device_hash,
        'mfa_verified', v_session.mfa_verified,
        'expires_at', v_session.expires_at
    );
END;
$$;

-- 5.13 FUNÇÃO: revoke_other_sessions_v2 - Revogar outras sessões (single session)
CREATE OR REPLACE FUNCTION public.revoke_other_sessions_v2(
    p_user_id UUID,
    p_current_session_token UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE public.active_sessions
    SET 
        status = 'revoked',
        revoked_at = now(),
        revoked_reason = 'new_session_login'
    WHERE user_id = p_user_id
    AND session_token != p_current_session_token
    AND status = 'active';
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    IF v_count > 0 THEN
        -- Log evento de segurança usando função adaptada
        PERFORM public.log_security_event_v2(
            'session_revoked',
            p_user_id,
            NULL,
            NULL,
            30,
            jsonb_build_object('revoked_count', v_count, 'reason', 'new_login')
        );
    END IF;
    
    RETURN v_count;
END;
$$;

-- 5.14 FUNÇÃO: audit_rls_coverage - Auditar cobertura RLS
CREATE OR REPLACE FUNCTION public.audit_rls_coverage()
RETURNS TABLE (
    table_name TEXT,
    rls_enabled BOOLEAN,
    policy_count BIGINT,
    has_select_policy BOOLEAN,
    has_insert_policy BOOLEAN,
    has_update_policy BOOLEAN,
    has_delete_policy BOOLEAN,
    risk_level TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.tablename::TEXT,
        t.rowsecurity,
        COALESCE(p.policy_count, 0)::BIGINT,
        COALESCE(p.has_select, false),
        COALESCE(p.has_insert, false),
        COALESCE(p.has_update, false),
        COALESCE(p.has_delete, false),
        CASE 
            WHEN NOT t.rowsecurity THEN 'CRITICAL'
            WHEN COALESCE(p.policy_count, 0) = 0 THEN 'HIGH'
            WHEN NOT COALESCE(p.has_select, false) THEN 'MEDIUM'
            ELSE 'LOW'
        END::TEXT
    FROM pg_tables t
    LEFT JOIN (
        SELECT 
            pol.tablename,
            COUNT(*) as policy_count,
            BOOL_OR(pol.cmd = 'SELECT' OR pol.cmd = '*') as has_select,
            BOOL_OR(pol.cmd = 'INSERT' OR pol.cmd = '*') as has_insert,
            BOOL_OR(pol.cmd = 'UPDATE' OR pol.cmd = '*') as has_update,
            BOOL_OR(pol.cmd = 'DELETE' OR pol.cmd = '*') as has_delete
        FROM pg_policies pol
        WHERE pol.schemaname = 'public'
        GROUP BY pol.tablename
    ) p ON t.tablename = p.tablename
    WHERE t.schemaname = 'public'
    AND t.tablename NOT LIKE 'pg_%'
    AND t.tablename NOT LIKE '_prisma_%'
    ORDER BY 
        CASE 
            WHEN NOT t.rowsecurity THEN 1
            WHEN COALESCE(p.policy_count, 0) = 0 THEN 2
            ELSE 3
        END,
        t.tablename;
END;
$$;

-- ============================================
-- PARTE 6: FUNÇÕES DE CLEANUP
-- ============================================

-- 6.1 Limpar rate limits expirados
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    DELETE FROM public.rate_limit_state
    WHERE updated_at < now() - INTERVAL '1 day';
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

-- 6.2 Limpar sessões expiradas
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE public.active_sessions
    SET status = 'expired'
    WHERE status = 'active'
    AND expires_at < now();
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    -- Deletar sessões muito antigas
    DELETE FROM public.active_sessions
    WHERE created_at < now() - INTERVAL '30 days';
    
    RETURN v_count;
END;
$$;

-- 6.3 Limpar eventos de segurança resolvidos antigos
CREATE OR REPLACE FUNCTION public.cleanup_old_security_events()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    DELETE FROM public.security_events
    WHERE resolved = true
    AND resolved_at < now() - INTERVAL '90 days';
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

-- ============================================
-- PARTE 7: TRIGGERS DE AUDITORIA
-- ============================================

-- 7.1 Trigger para auditar mudanças em user_roles (ADAPTADO)
CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Nova role atribuída
        PERFORM public.log_security_audit(
            'role_granted',
            'security',
            'user_roles',
            NEW.id::TEXT,
            NULL,
            jsonb_build_object('user_id', NEW.user_id, 'role', NEW.role),
            'critical'
        );
        
        PERFORM public.log_security_event_v2(
            'role_changed',
            NEW.user_id,
            NULL,
            NULL,
            90,
            jsonb_build_object(
                'action', 'granted',
                'new_role', NEW.role,
                'changed_by', auth.uid()
            )
        );
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.role IS DISTINCT FROM NEW.role THEN
            PERFORM public.log_security_audit(
                'role_changed',
                'security',
                'user_roles',
                NEW.id::TEXT,
                jsonb_build_object('role', OLD.role),
                jsonb_build_object('role', NEW.role),
                'critical'
            );
            
            PERFORM public.log_security_event_v2(
                'role_changed',
                NEW.user_id,
                NULL,
                NULL,
                90,
                jsonb_build_object(
                    'old_role', OLD.role,
                    'new_role', NEW.role,
                    'changed_by', auth.uid()
                )
            );
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM public.log_security_audit(
            'role_revoked',
            'security',
            'user_roles',
            OLD.id::TEXT,
            jsonb_build_object('user_id', OLD.user_id, 'role', OLD.role),
            NULL,
            'critical'
        );
        
        PERFORM public.log_security_event_v2(
            'role_changed',
            OLD.user_id,
            NULL,
            NULL,
            90,
            jsonb_build_object(
                'action', 'revoked',
                'old_role', OLD.role,
                'changed_by', auth.uid()
            )
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trigger_audit_role_changes ON public.user_roles;
CREATE TRIGGER trigger_audit_role_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_role_changes();

-- ============================================
-- PARTE 8: COMENTÁRIOS DE DOCUMENTAÇÃO
-- ============================================

COMMENT ON TABLE public.security_audit_log IS '🛡️ Log de auditoria imutável - TODAS as ações críticas';
COMMENT ON TABLE public.security_events IS '🛡️ Eventos de segurança e anomalias detectadas';
COMMENT ON TABLE public.rate_limit_state IS '🛡️ Estado do rate limiting por endpoint';
COMMENT ON TABLE public.webhook_events IS '🛡️ Registro de webhooks para idempotência';
COMMENT ON TABLE public.content_access_log IS '🛡️ Logs de acesso a conteúdo protegido';
COMMENT ON TABLE public.active_sessions IS '🛡️ Sessões ativas do sistema';

COMMENT ON FUNCTION public.get_user_role_v2 IS '🛡️ Retorna o role do usuário atual (via user_roles)';
COMMENT ON FUNCTION public.is_beta_user IS '🛡️ Verifica se usuário é aluno beta';
COMMENT ON FUNCTION public.is_funcionario_user IS '🛡️ Verifica se usuário é funcionário';
COMMENT ON FUNCTION public.can_access_url IS '🛡️ Verifica permissão de acesso por URL';
COMMENT ON FUNCTION public.check_advanced_rate_limit IS '🛡️ Verificar e aplicar rate limiting avançado';
COMMENT ON FUNCTION public.log_security_event_v2 IS '🛡️ Registrar evento de segurança';
COMMENT ON FUNCTION public.log_security_audit IS '🛡️ Registrar evento de auditoria';
COMMENT ON FUNCTION public.audit_rls_coverage IS '🛡️ Auditar cobertura RLS em todas as tabelas';
COMMENT ON FUNCTION public.validate_session_v2 IS '🛡️ Validar sessão ativa';
COMMENT ON FUNCTION public.revoke_other_sessions_v2 IS '🛡️ Revogar outras sessões (single session)';
COMMENT ON FUNCTION public.cleanup_rate_limits IS '🛡️ Limpar rate limits expirados';
COMMENT ON FUNCTION public.cleanup_expired_sessions IS '🛡️ Limpar sessões expiradas';
COMMENT ON FUNCTION public.cleanup_old_security_events IS '🛡️ Limpar eventos de segurança antigos';