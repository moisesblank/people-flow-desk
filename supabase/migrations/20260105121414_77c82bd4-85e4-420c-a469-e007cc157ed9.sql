
-- Remove MICROs duplicados em Bioquímica (mantendo os com value em snake_case)
DELETE FROM public.question_taxonomy WHERE id = 'd7432dc9-fa09-4794-b270-5ce36d5557af'; -- Ácidos Nucleicos (duplicado)
DELETE FROM public.question_taxonomy WHERE id = '1fb9ce00-f965-4032-954c-f799de9ba0b6'; -- Carboidratos (duplicado)
DELETE FROM public.question_taxonomy WHERE id = '966f2f60-d513-400b-812a-48ed330f5d19'; -- Enzimas (duplicado)
DELETE FROM public.question_taxonomy WHERE id = '0d6529c9-8e77-429a-bfaf-c7ce60b82f17'; -- Lipídios (duplicado)
DELETE FROM public.question_taxonomy WHERE id = '87cf891f-5c0d-401c-ad4b-e21438336eef'; -- Metabolismo (duplicado)
DELETE FROM public.question_taxonomy WHERE id = '1228b07c-1c5c-4382-b790-eb0f7b339835'; -- Proteínas (duplicado)
DELETE FROM public.question_taxonomy WHERE id = 'ac6a2113-b95c-4e74-9434-7da6d059858b'; -- Vitaminas (duplicado)

-- Remove MICROs duplicados em Química Ambiental
DELETE FROM public.question_taxonomy WHERE id = 'c6aa647d-4819-47e7-9775-ba903e0e076c'; -- Camada de Ozônio (duplicado)
DELETE FROM public.question_taxonomy WHERE id = '5a7a6a90-04f2-4262-affb-9ba201af27d7'; -- Ciclos Biogeoquímicos (duplicado)
DELETE FROM public.question_taxonomy WHERE id = 'ffc08dd4-da04-44ff-84b6-41380c81d295'; -- Efeito Estufa (duplicado)
DELETE FROM public.question_taxonomy WHERE id = 'c9e8bbf3-b3bf-4bc4-95ca-8664e5c8c322'; -- Poluição Atmosférica (duplicado)

-- Atualizar labels para padronização nos que ficaram
UPDATE public.question_taxonomy SET label = 'Ácidos Nucleicos', position = 5 WHERE id = '587398f2-a2b3-4d8b-a310-e4c755456686';
UPDATE public.question_taxonomy SET label = 'Carboidratos', position = 2 WHERE id = '5f68cc55-af33-473a-9e3d-9dcbc226a642';
UPDATE public.question_taxonomy SET label = 'Enzimas', position = 3 WHERE id = 'ff7ec5c5-f76b-4bb0-a9d1-43bf274b825e';
UPDATE public.question_taxonomy SET label = 'Lipídios', position = 4 WHERE id = '09c6e730-261e-4d27-b564-a7a5a85d2fb6';
UPDATE public.question_taxonomy SET label = 'Metabolismo', position = 8 WHERE id = 'ebf4ef84-50c9-4c98-b9fc-601260531ade';
UPDATE public.question_taxonomy SET label = 'Proteínas', position = 1 WHERE id = 'f2bdf85d-8908-475d-9908-c48ea064ae40';
UPDATE public.question_taxonomy SET label = 'Vitaminas', position = 6 WHERE id = '9d31cea6-7b0d-4200-9406-1d24bf28c690';

-- Reordenar MICROs de Bioquímica
UPDATE public.question_taxonomy SET position = 1 WHERE id = 'f2bdf85d-8908-475d-9908-c48ea064ae40'; -- Proteínas
UPDATE public.question_taxonomy SET position = 2 WHERE id = '5f68cc55-af33-473a-9e3d-9dcbc226a642'; -- Carboidratos
UPDATE public.question_taxonomy SET position = 3 WHERE id = 'ff7ec5c5-f76b-4bb0-a9d1-43bf274b825e'; -- Enzimas
UPDATE public.question_taxonomy SET position = 4 WHERE id = '09c6e730-261e-4d27-b564-a7a5a85d2fb6'; -- Lipídios
UPDATE public.question_taxonomy SET position = 5 WHERE id = '587398f2-a2b3-4d8b-a310-e4c755456686'; -- Ácidos Nucleicos
UPDATE public.question_taxonomy SET position = 6 WHERE id = '9d31cea6-7b0d-4200-9406-1d24bf28c690'; -- Vitaminas
UPDATE public.question_taxonomy SET position = 7 WHERE id = '2df6966d-cdca-48ee-9d9b-10ad6c7dcdc6'; -- Sais Minerais
UPDATE public.question_taxonomy SET position = 8 WHERE id = 'ebf4ef84-50c9-4c98-b9fc-601260531ade'; -- Metabolismo
UPDATE public.question_taxonomy SET position = 9 WHERE id = '703e72a1-9826-4938-ad38-23dcde1258b6'; -- Respiração Celular
UPDATE public.question_taxonomy SET position = 10 WHERE id = 'be3b9a6f-7f57-468c-9de7-645158529f9c'; -- Fotossíntese
UPDATE public.question_taxonomy SET position = 11 WHERE id = '58ad3c85-4f0f-4293-916c-651ef4a77b2d'; -- Hormônios
UPDATE public.question_taxonomy SET position = 12 WHERE id = '4b6e713b-a97b-4836-a718-53c43a66904d'; -- Bioquímica das Membranas
UPDATE public.question_taxonomy SET position = 13 WHERE id = '517c57f8-c852-41ff-84f8-a72f3b4372ef'; -- Bioenergética
UPDATE public.question_taxonomy SET position = 14 WHERE id = '50c67e4a-7f75-4b7f-8aa2-2cbb93defdd9'; -- Aminoácidos

-- Reordenar MICROs de Química Ambiental (removendo duplicados)
UPDATE public.question_taxonomy SET position = 1 WHERE id = '35993116-b74a-485d-b7fb-9cf0102c43b6'; -- Água e Seu Ciclo
UPDATE public.question_taxonomy SET position = 2 WHERE id = 'd4b8bd90-77c0-4841-a174-2d7edbac0315'; -- Água e Seu Tratamento
UPDATE public.question_taxonomy SET position = 3 WHERE id = '8f8d453f-ef52-4cb7-8115-5446e87def1d'; -- Atmosfera
UPDATE public.question_taxonomy SET position = 4 WHERE id = '8e459af1-d07d-4012-9e46-160c7e00a419'; -- Camada de Ozônio
UPDATE public.question_taxonomy SET position = 5 WHERE id = 'eae4ec0e-e22b-48cb-acd8-07b0d684cc07'; -- Ciclos Biogeoquímicos
UPDATE public.question_taxonomy SET position = 6 WHERE id = '35c75acd-f255-4e39-994a-961908017185'; -- Chuva Ácida
UPDATE public.question_taxonomy SET position = 7 WHERE id = 'ceff5e69-5ae1-4148-a4cc-f7fc618574b1'; -- Contaminação Cidades
UPDATE public.question_taxonomy SET position = 8 WHERE id = '079a099d-87f5-47e7-b3ad-400a51448e5b'; -- Contaminação Solo
UPDATE public.question_taxonomy SET position = 9 WHERE id = 'b008902a-13dc-4985-b2c5-c10f5a642892'; -- Efeito Estufa
UPDATE public.question_taxonomy SET position = 10 WHERE id = '1a2dfa04-d3ea-4c52-8309-40019511bb8d'; -- Eutrofização
UPDATE public.question_taxonomy SET position = 11 WHERE id = 'cb9e7346-b831-4f3d-b99a-cdfed080485d'; -- Fontes Renováveis
UPDATE public.question_taxonomy SET position = 12 WHERE id = '8635bef8-e5c2-4f49-88cd-39a7f3057fa5'; -- Metais Pesados
UPDATE public.question_taxonomy SET position = 13 WHERE id = '6f9f120a-fb57-4407-8361-f9cec2199995'; -- Poluição Atmosférica
UPDATE public.question_taxonomy SET position = 14 WHERE id = '73cd9df9-213e-42b5-838f-022a0f7b4f2d'; -- Poluição Hídrica
UPDATE public.question_taxonomy SET position = 15 WHERE id = 'dd06500e-00ee-4b4d-b5fe-7c7503424740'; -- Qualidade da Água
UPDATE public.question_taxonomy SET position = 16 WHERE id = 'bbcabc60-8cad-4a7d-a93e-3fdae25e042e'; -- Química Verde
UPDATE public.question_taxonomy SET position = 17 WHERE id = '75a79e8e-91b5-4acf-a9df-2bdb273d741c'; -- Tratamento de Efluentes
UPDATE public.question_taxonomy SET position = 18 WHERE id = 'ffbfac41-a9b6-4c77-b634-03c93481d274'; -- Resíduos Sólidos
UPDATE public.question_taxonomy SET position = 19 WHERE id = '91e4ff0c-01b6-4ed6-8261-e4b459665932'; -- Química dos Agrotóxicos
UPDATE public.question_taxonomy SET position = 20 WHERE id = '97f7a84d-c4b8-4132-845e-b9bfd1374eef'; -- Sustentabilidade
UPDATE public.question_taxonomy SET position = 21 WHERE id = 'eb5068d4-d935-4e79-a99b-d83a6d60e5d7'; -- Mudanças Climáticas
UPDATE public.question_taxonomy SET position = 22 WHERE id = 'fac58a9f-917c-4ef6-882b-0222c9626738'; -- Radioatividade Ambiental
