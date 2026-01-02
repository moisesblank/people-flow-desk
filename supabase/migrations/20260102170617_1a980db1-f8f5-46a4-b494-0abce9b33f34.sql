-- ============================================================
-- CANONICAL THEMES for QUÍMICA GERAL
-- ============================================================

-- THEMES for MICRO 1: Introdução à Química Inorgânica (e456130b-e1c3-4ef4-99ee-38505b4f69df)
INSERT INTO question_taxonomy (label, value, level, parent_id, position, is_active) VALUES
('Propriedades da Matéria', 'propriedades_materia', 'tema', 'e456130b-e1c3-4ef4-99ee-38505b4f69df', 1, true),
('Substâncias, Misturas e Fenômenos', 'substancias_misturas_fenomenos', 'tema', 'e456130b-e1c3-4ef4-99ee-38505b4f69df', 2, true),
('Alotropia', 'alotropia', 'tema', 'e456130b-e1c3-4ef4-99ee-38505b4f69df', 3, true),
('Separação de Misturas', 'separacao_misturas', 'tema', 'e456130b-e1c3-4ef4-99ee-38505b4f69df', 4, true),
('Tratamento de Água', 'tratamento_agua', 'tema', 'e456130b-e1c3-4ef4-99ee-38505b4f69df', 5, true),
('Combustíveis e Energia', 'combustiveis_energia', 'tema', 'e456130b-e1c3-4ef4-99ee-38505b4f69df', 6, true);

-- THEMES for MICRO 2: Atomística (b6a76939-6d69-4dd1-9291-b7aec235f8cd)
INSERT INTO question_taxonomy (label, value, level, parent_id, position, is_active) VALUES
('Modelos Atômicos', 'modelos_atomicos', 'tema', 'b6a76939-6d69-4dd1-9291-b7aec235f8cd', 1, true),
('Distribuição Eletrônica', 'distribuicao_eletronica', 'tema', 'b6a76939-6d69-4dd1-9291-b7aec235f8cd', 2, true),
('Propriedades Magnéticas', 'propriedades_magneticas', 'tema', 'b6a76939-6d69-4dd1-9291-b7aec235f8cd', 3, true),
('Números Quânticos', 'numeros_quanticos', 'tema', 'b6a76939-6d69-4dd1-9291-b7aec235f8cd', 4, true);

-- THEMES for MICRO 3: Tabela Periódica (7017b7b2-0d9c-4650-819b-9444377511c0)
INSERT INTO question_taxonomy (label, value, level, parent_id, position, is_active) VALUES
('Características e Origem da Tabela Periódica', 'caracteristicas_origem_tabela', 'tema', '7017b7b2-0d9c-4650-819b-9444377511c0', 1, true),
('Propriedades Periódicas e Aperiódicas', 'propriedades_periodicas_aperiodicas', 'tema', '7017b7b2-0d9c-4650-819b-9444377511c0', 2, true),
('Propriedades Aperiódicas Específicas', 'propriedades_aperiodicas_especificas', 'tema', '7017b7b2-0d9c-4650-819b-9444377511c0', 3, true);

-- THEMES for MICRO 4: Número de Oxidação (cf7cc993-e821-4071-b338-65d2bedb986e)
INSERT INTO question_taxonomy (label, value, level, parent_id, position, is_active) VALUES
('Conceito de NOX', 'conceito_nox', 'tema', 'cf7cc993-e821-4071-b338-65d2bedb986e', 1, true),
('Regras de Determinação', 'regras_determinacao', 'tema', 'cf7cc993-e821-4071-b338-65d2bedb986e', 2, true),
('Processos Químicos', 'processos_quimicos_nox', 'tema', 'cf7cc993-e821-4071-b338-65d2bedb986e', 3, true),
('Agentes Químicos', 'agentes_quimicos', 'tema', 'cf7cc993-e821-4071-b338-65d2bedb986e', 4, true),
('NOX em Química Orgânica', 'nox_quimica_organica', 'tema', 'cf7cc993-e821-4071-b338-65d2bedb986e', 5, true);

-- THEMES for MICRO 5: Ligações Químicas (b12b1331-7f95-4355-83eb-4aae1d3c7ca5)
INSERT INTO question_taxonomy (label, value, level, parent_id, position, is_active) VALUES
('Características Gerais', 'caracteristicas_gerais_ligacoes', 'tema', 'b12b1331-7f95-4355-83eb-4aae1d3c7ca5', 1, true),
('Ligação Iônica', 'ligacao_ionica', 'tema', 'b12b1331-7f95-4355-83eb-4aae1d3c7ca5', 2, true),
('Ligação Covalente', 'ligacao_covalente', 'tema', 'b12b1331-7f95-4355-83eb-4aae1d3c7ca5', 3, true),
('Ligação Metálica', 'ligacao_metalica', 'tema', 'b12b1331-7f95-4355-83eb-4aae1d3c7ca5', 4, true),
('Forças Intermoleculares', 'forcas_intermoleculares', 'tema', 'b12b1331-7f95-4355-83eb-4aae1d3c7ca5', 5, true);

-- THEMES for MICRO 6: Funções Inorgânicas (915b96da-d4bc-4ec3-a9b2-da48aa820d78)
INSERT INTO question_taxonomy (label, value, level, parent_id, position, is_active) VALUES
('Ácidos', 'acidos', 'tema', '915b96da-d4bc-4ec3-a9b2-da48aa820d78', 1, true),
('Bases', 'bases', 'tema', '915b96da-d4bc-4ec3-a9b2-da48aa820d78', 2, true),
('Sais', 'sais', 'tema', '915b96da-d4bc-4ec3-a9b2-da48aa820d78', 3, true),
('Óxidos', 'oxidos', 'tema', '915b96da-d4bc-4ec3-a9b2-da48aa820d78', 4, true);

-- THEMES for MICRO 7: Teorias Ácido-Base (ec6ae1e2-94f0-4ee0-bbf9-92d809624312)
INSERT INTO question_taxonomy (label, value, level, parent_id, position, is_active) VALUES
('Teorias Clássicas', 'teorias_classicas', 'tema', 'ec6ae1e2-94f0-4ee0-bbf9-92d809624312', 1, true),
('Teoria Moderna', 'teoria_moderna', 'tema', 'ec6ae1e2-94f0-4ee0-bbf9-92d809624312', 2, true);

-- THEMES for MICRO 8: Reações Inorgânicas (27234a8f-4084-4501-887f-7fbc47614594)
INSERT INTO question_taxonomy (label, value, level, parent_id, position, is_active) VALUES
('Adição', 'adicao_inorganica', 'tema', '27234a8f-4084-4501-887f-7fbc47614594', 1, true),
('Decomposição', 'decomposicao', 'tema', '27234a8f-4084-4501-887f-7fbc47614594', 2, true),
('Substituição', 'substituicao_inorganica', 'tema', '27234a8f-4084-4501-887f-7fbc47614594', 3, true),
('Dupla Troca', 'dupla_troca', 'tema', '27234a8f-4084-4501-887f-7fbc47614594', 4, true);

-- THEMES for MICRO 9: Cálculos Químicos (97d7b9ea-5727-4323-9016-a0b24a04bf32)
INSERT INTO question_taxonomy (label, value, level, parent_id, position, is_active) VALUES
('Leis Ponderais', 'leis_ponderais', 'tema', '97d7b9ea-5727-4323-9016-a0b24a04bf32', 1, true),
('Cálculos', 'calculos_gerais', 'tema', '97d7b9ea-5727-4323-9016-a0b24a04bf32', 2, true);

-- THEMES for MICRO 10: Estequiometria (bccfadfc-81b3-4477-9a6b-82afe82a9873)
INSERT INTO question_taxonomy (label, value, level, parent_id, position, is_active) VALUES
('Relações Quantitativas (Regra de Três)', 'relacoes_quantitativas_regra_tres', 'tema', 'bccfadfc-81b3-4477-9a6b-82afe82a9873', 1, true),
('Pureza', 'pureza', 'tema', 'bccfadfc-81b3-4477-9a6b-82afe82a9873', 2, true),
('Rendimento', 'rendimento', 'tema', 'bccfadfc-81b3-4477-9a6b-82afe82a9873', 3, true),
('Reagentes Limitantes e em Excesso', 'reagentes_limitantes_excesso', 'tema', 'bccfadfc-81b3-4477-9a6b-82afe82a9873', 4, true),
('Reações Consecutivas', 'reacoes_consecutivas', 'tema', 'bccfadfc-81b3-4477-9a6b-82afe82a9873', 5, true);

-- THEMES for MICRO 11: Gases (41e9a67e-0595-412b-86c5-af4ffbafc691)
INSERT INTO question_taxonomy (label, value, level, parent_id, position, is_active) VALUES
('Características dos Gases', 'caracteristicas_gases', 'tema', '41e9a67e-0595-412b-86c5-af4ffbafc691', 1, true),
('Leis dos Gases', 'leis_gases', 'tema', '41e9a67e-0595-412b-86c5-af4ffbafc691', 2, true),
('Difusão e Efusão', 'difusao_efusao', 'tema', '41e9a67e-0595-412b-86c5-af4ffbafc691', 3, true);