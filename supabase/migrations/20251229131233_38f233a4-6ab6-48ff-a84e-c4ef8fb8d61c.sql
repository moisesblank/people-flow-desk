-- ============================================
-- FIX: Marcar usuários existentes como onboarding_completed
-- Usuários que já trocaram senha (password_change_required = false)
-- são considerados como tendo completado onboarding
-- ============================================

-- Para usuários que já definiram senha (não são primeiro acesso)
UPDATE public.profiles
SET 
  onboarding_completed = true,
  platform_steps_completed = true,
  ui_theme_selected = true,
  trusted_device_registered = true,
  onboarding_completed_at = COALESCE(password_changed_at, NOW())
WHERE 
  password_change_required = false
  AND onboarding_completed = false;

-- Também marcar owner como completo (se existir)
UPDATE public.profiles
SET 
  onboarding_completed = true,
  platform_steps_completed = true,
  ui_theme_selected = true,
  trusted_device_registered = true
WHERE 
  email = 'moisesblank@gmail.com'
  AND onboarding_completed = false;