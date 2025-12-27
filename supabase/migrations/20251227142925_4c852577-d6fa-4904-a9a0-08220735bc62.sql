-- Security linter FIX (0014_extension_in_public): recriar pg_net fora do schema public
-- pg_net não suporta ALTER EXTENSION ... SET SCHEMA, então é necessário recriar.

CREATE SCHEMA IF NOT EXISTS extensions;

-- Recriar extensão no schema correto
DROP EXTENSION IF EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;