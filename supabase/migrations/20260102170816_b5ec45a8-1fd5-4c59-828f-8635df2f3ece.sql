-- ============================================================
-- CANONICAL SUBTHEMES for QUÍMICA GERAL
-- ============================================================

-- SUBTHEMES for Propriedades da Matéria (8403d88e-6dc8-4864-8915-8f7deffaebd3)
INSERT INTO question_taxonomy (label, value, level, parent_id, position, is_active) VALUES
('Propriedades Gerais da Matéria', 'propriedades_gerais_materia', 'subtema', '8403d88e-6dc8-4864-8915-8f7deffaebd3', 1, true),
('Propriedades Específicas', 'propriedades_especificas', 'subtema', '8403d88e-6dc8-4864-8915-8f7deffaebd3', 2, true),
('Estados Físicos da Matéria', 'estados_fisicos_materia', 'subtema', '8403d88e-6dc8-4864-8915-8f7deffaebd3', 3, true),
('Mudanças de Fase', 'mudancas_fase', 'subtema', '8403d88e-6dc8-4864-8915-8f7deffaebd3', 4, true),
('Diagramas de Fase', 'diagramas_fase', 'subtema', '8403d88e-6dc8-4864-8915-8f7deffaebd3', 5, true),
('Comportamento Anômalo da Água', 'comportamento_anomalo_agua', 'subtema', '8403d88e-6dc8-4864-8915-8f7deffaebd3', 6, true);

-- SUBTHEMES for Substâncias, Misturas e Fenômenos (0947385e-42a1-40b5-89c2-0b408c590280)
INSERT INTO question_taxonomy (label, value, level, parent_id, position, is_active) VALUES
('Substâncias', 'substancias', 'subtema', '0947385e-42a1-40b5-89c2-0b408c590280', 1, true),
('Misturas', 'misturas', 'subtema', '0947385e-42a1-40b5-89c2-0b408c590280', 2, true),
('Sistemas Materiais', 'sistemas_materiais', 'subtema', '0947385e-42a1-40b5-89c2-0b408c590280', 3, true),
('Fenômenos', 'fenomenos', 'subtema', '0947385e-42a1-40b5-89c2-0b408c590280', 4, true);

-- SUBTHEMES for Alotropia (33dfefad-8cb6-431c-932d-8a07dc028f73)
INSERT INTO question_taxonomy (label, value, level, parent_id, position, is_active) VALUES
('Alotropia do Carbono', 'alotropia_carbono', 'subtema', '33dfefad-8cb6-431c-932d-8a07dc028f73', 1, true),
('Alotropia do Oxigênio', 'alotropia_oxigenio', 'subtema', '33dfefad-8cb6-431c-932d-8a07dc028f73', 2, true),
('Alotropia do Enxofre', 'alotropia_enxofre', 'subtema', '33dfefad-8cb6-431c-932d-8a07dc028f73', 3, true),
('Alotropia do Fósforo', 'alotropia_fosforo', 'subtema', '33dfefad-8cb6-431c-932d-8a07dc028f73', 4, true);

-- SUBTHEMES for Separação de Misturas (d69737e0-c992-4846-8b3d-a636374352de)
INSERT INTO question_taxonomy (label, value, level, parent_id, position, is_active) VALUES
('Separação de Misturas Heterogêneas', 'separacao_heterogeneas', 'subtema', 'd69737e0-c992-4846-8b3d-a636374352de', 1, true),
('Separação de Misturas Homogêneas', 'separacao_homogeneas', 'subtema', 'd69737e0-c992-4846-8b3d-a636374352de', 2, true),
('Métodos Especiais', 'metodos_especiais', 'subtema', 'd69737e0-c992-4846-8b3d-a636374352de', 3, true);

-- SUBTHEMES for Tratamento de Água (1542d7ee-4bca-4a67-9012-88e6e382f52e)
INSERT INTO question_taxonomy (label, value, level, parent_id, position, is_active) VALUES
('Etapas do Tratamento de Água', 'etapas_tratamento_agua', 'subtema', '1542d7ee-4bca-4a67-9012-88e6e382f52e', 1, true),
('Etapas do Tratamento de Esgoto', 'etapas_tratamento_esgoto', 'subtema', '1542d7ee-4bca-4a67-9012-88e6e382f52e', 2, true);

-- SUBTHEMES for Combustíveis e Energia (f386965a-f943-42b4-9a97-d316da8116e0)
INSERT INTO question_taxonomy (label, value, level, parent_id, position, is_active) VALUES
('Petróleo', 'petroleo', 'subtema', 'f386965a-f943-42b4-9a97-d316da8116e0', 1, true),
('Combustíveis Líquidos', 'combustiveis_liquidos', 'subtema', 'f386965a-f943-42b4-9a97-d316da8116e0', 2, true),
('Combustíveis Gasosos', 'combustiveis_gasosos', 'subtema', 'f386965a-f943-42b4-9a97-d316da8116e0', 3, true),
('Combustíveis Sólidos e Alternativos', 'combustiveis_solidos_alternativos', 'subtema', 'f386965a-f943-42b4-9a97-d316da8116e0', 4, true);

-- SUBTHEMES for Modelos Atômicos (a196827f-4353-4ac5-9712-44123c624ab7)
INSERT INTO question_taxonomy (label, value, level, parent_id, position, is_active) VALUES
('Evolução dos Modelos Atômicos', 'evolucao_modelos_atomicos', 'subtema', 'a196827f-4353-4ac5-9712-44123c624ab7', 1, true);

-- SUBTHEMES for Distribuição Eletrônica (a372d864-79c5-4fc6-a9a5-13797aa24e09)
INSERT INTO question_taxonomy (label, value, level, parent_id, position, is_active) VALUES
('Princípios Fundamentais', 'principios_fundamentais', 'subtema', 'a372d864-79c5-4fc6-a9a5-13797aa24e09', 1, true),
('Estrutura Atômica', 'estrutura_atomica', 'subtema', 'a372d864-79c5-4fc6-a9a5-13797aa24e09', 2, true),
('Números Atômicos', 'numeros_atomicos', 'subtema', 'a372d864-79c5-4fc6-a9a5-13797aa24e09', 3, true),
('Física Moderna Aplicada à Atomística', 'fisica_moderna_atomistica', 'subtema', 'a372d864-79c5-4fc6-a9a5-13797aa24e09', 4, true),
('Configurações Eletrônicas', 'configuracoes_eletronicas', 'subtema', 'a372d864-79c5-4fc6-a9a5-13797aa24e09', 5, true);

-- SUBTHEMES for Propriedades Magnéticas (23e717f4-5f44-4e4b-a410-4bd2676a4aaa)
INSERT INTO question_taxonomy (label, value, level, parent_id, position, is_active) VALUES
('Paramagnetismo e Diamagnetismo', 'paramagnetismo_diamagnetismo', 'subtema', '23e717f4-5f44-4e4b-a410-4bd2676a4aaa', 1, true);

-- SUBTHEMES for Números Quânticos (13025798-827b-4fba-a7cb-c0b097dd48dc)
INSERT INTO question_taxonomy (label, value, level, parent_id, position, is_active) VALUES
('Subníveis e Orbitais', 'subniveis_orbitais', 'subtema', '13025798-827b-4fba-a7cb-c0b097dd48dc', 1, true);

-- SUBTHEMES for Características e Origem da Tabela (37fdd21a-770e-46f4-9f09-dc55cf4b2f30)
INSERT INTO question_taxonomy (label, value, level, parent_id, position, is_active) VALUES
('Organização da Tabela Periódica', 'organizacao_tabela_periodica', 'subtema', '37fdd21a-770e-46f4-9f09-dc55cf4b2f30', 1, true),
('Classificação dos Elementos', 'classificacao_elementos', 'subtema', '37fdd21a-770e-46f4-9f09-dc55cf4b2f30', 2, true),
('Famílias Especiais', 'familias_especiais', 'subtema', '37fdd21a-770e-46f4-9f09-dc55cf4b2f30', 3, true),
('Elementos Especiais', 'elementos_especiais', 'subtema', '37fdd21a-770e-46f4-9f09-dc55cf4b2f30', 4, true),
('Aspectos Físicos', 'aspectos_fisicos', 'subtema', '37fdd21a-770e-46f4-9f09-dc55cf4b2f30', 5, true);

-- SUBTHEMES for Propriedades Periódicas (ed875b8b-78ae-42c5-adba-114435138cae)
INSERT INTO question_taxonomy (label, value, level, parent_id, position, is_active) VALUES
('Raio Atômico', 'raio_atomico', 'subtema', 'ed875b8b-78ae-42c5-adba-114435138cae', 1, true),
('Energia de Ionização', 'energia_ionizacao', 'subtema', 'ed875b8b-78ae-42c5-adba-114435138cae', 2, true),
('Eletronegatividade', 'eletronegatividade', 'subtema', 'ed875b8b-78ae-42c5-adba-114435138cae', 3, true),
('Eletropositividade', 'eletropositividade', 'subtema', 'ed875b8b-78ae-42c5-adba-114435138cae', 4, true),
('Volume Atômico', 'volume_atomico', 'subtema', 'ed875b8b-78ae-42c5-adba-114435138cae', 5, true),
('Densidade', 'densidade', 'subtema', 'ed875b8b-78ae-42c5-adba-114435138cae', 6, true),
('Afinidade Eletrônica', 'afinidade_eletronica', 'subtema', 'ed875b8b-78ae-42c5-adba-114435138cae', 7, true);

-- SUBTHEMES for Propriedades Aperiódicas Específicas (36a43859-302f-4c69-a6db-4991a7c8e679)
INSERT INTO question_taxonomy (label, value, level, parent_id, position, is_active) VALUES
('Massa Atômica', 'massa_atomica', 'subtema', '36a43859-302f-4c69-a6db-4991a7c8e679', 1, true),
('Calor Específico', 'calor_especifico', 'subtema', '36a43859-302f-4c69-a6db-4991a7c8e679', 2, true),
('Índice de Refração', 'indice_refracao', 'subtema', '36a43859-302f-4c69-a6db-4991a7c8e679', 3, true);

-- SUBTHEMES for Características Gerais de Ligações (390894df-7156-4b30-9a4f-e303195ed442)
INSERT INTO question_taxonomy (label, value, level, parent_id, position, is_active) VALUES
('Fundamentos de Ligação', 'fundamentos_ligacao', 'subtema', '390894df-7156-4b30-9a4f-e303195ed442', 1, true),
('Forças Elétricas', 'forcas_eletricas', 'subtema', '390894df-7156-4b30-9a4f-e303195ed442', 2, true),
('Tipos de Interação', 'tipos_interacao', 'subtema', '390894df-7156-4b30-9a4f-e303195ed442', 3, true);

-- SUBTHEMES for Ligação Iônica (2d5c59bf-950b-4cc2-9af7-10120cb5659e)
INSERT INTO question_taxonomy (label, value, level, parent_id, position, is_active) VALUES
('Formação de Ligação Iônica', 'formacao_ligacao_ionica', 'subtema', '2d5c59bf-950b-4cc2-9af7-10120cb5659e', 1, true),
('Estrutura de Compostos Iônicos', 'estrutura_compostos_ionicos', 'subtema', '2d5c59bf-950b-4cc2-9af7-10120cb5659e', 2, true),
('Propriedades de Compostos Iônicos', 'propriedades_compostos_ionicos', 'subtema', '2d5c59bf-950b-4cc2-9af7-10120cb5659e', 3, true);

-- SUBTHEMES for Ligação Covalente (4765e279-31c4-4750-b70f-53670b1e82f2)
INSERT INTO question_taxonomy (label, value, level, parent_id, position, is_active) VALUES
('Formação de Ligação Covalente', 'formacao_ligacao_covalente', 'subtema', '4765e279-31c4-4750-b70f-53670b1e82f2', 1, true),
('Tipos de Ligação Covalente', 'tipos_ligacao_covalente', 'subtema', '4765e279-31c4-4750-b70f-53670b1e82f2', 2, true),
('Polaridade', 'polaridade', 'subtema', '4765e279-31c4-4750-b70f-53670b1e82f2', 3, true),
('Geometria Molecular', 'geometria_molecular', 'subtema', '4765e279-31c4-4750-b70f-53670b1e82f2', 4, true),
('Hibridização', 'hibridizacao', 'subtema', '4765e279-31c4-4750-b70f-53670b1e82f2', 5, true);

-- SUBTHEMES for Ligação Metálica (9c4ddce7-b3b0-434f-af9c-9c074bd8a9d2)
INSERT INTO question_taxonomy (label, value, level, parent_id, position, is_active) VALUES
('Modelo de Ligação Metálica', 'modelo_ligacao_metalica', 'subtema', '9c4ddce7-b3b0-434f-af9c-9c074bd8a9d2', 1, true),
('Propriedades dos Metais', 'propriedades_metais', 'subtema', '9c4ddce7-b3b0-434f-af9c-9c074bd8a9d2', 2, true),
('Ligas Metálicas', 'ligas_metalicas', 'subtema', '9c4ddce7-b3b0-434f-af9c-9c074bd8a9d2', 3, true);

-- SUBTHEMES for Forças Intermoleculares (699082ac-6468-40f4-b26a-965633863c12)
INSERT INTO question_taxonomy (label, value, level, parent_id, position, is_active) VALUES
('Interações Dipolo', 'interacoes_dipolo', 'subtema', '699082ac-6468-40f4-b26a-965633863c12', 1, true),
('Interações Especiais', 'interacoes_especiais', 'subtema', '699082ac-6468-40f4-b26a-965633863c12', 2, true),
('Consequências das Interações', 'consequencias_interacoes', 'subtema', '699082ac-6468-40f4-b26a-965633863c12', 3, true);

-- SUBTHEMES for Ácidos (cd70dcfb-caa7-469a-8f2d-eb4f954e2910)
INSERT INTO question_taxonomy (label, value, level, parent_id, position, is_active) VALUES
('Conceito de Ácido', 'conceito_acido', 'subtema', 'cd70dcfb-caa7-469a-8f2d-eb4f954e2910', 1, true),
('Propriedades dos Ácidos', 'propriedades_acidos', 'subtema', 'cd70dcfb-caa7-469a-8f2d-eb4f954e2910', 2, true),
('Classificação dos Ácidos', 'classificacao_acidos', 'subtema', 'cd70dcfb-caa7-469a-8f2d-eb4f954e2910', 3, true),
('Nomenclatura dos Ácidos', 'nomenclatura_acidos', 'subtema', 'cd70dcfb-caa7-469a-8f2d-eb4f954e2910', 4, true),
('Ácidos Importantes', 'acidos_importantes', 'subtema', 'cd70dcfb-caa7-469a-8f2d-eb4f954e2910', 5, true);

-- SUBTHEMES for Bases (ed63375c-a726-48e5-99be-32571ce1a08e)
INSERT INTO question_taxonomy (label, value, level, parent_id, position, is_active) VALUES
('Conceito de Base', 'conceito_base', 'subtema', 'ed63375c-a726-48e5-99be-32571ce1a08e', 1, true),
('Propriedades das Bases', 'propriedades_bases', 'subtema', 'ed63375c-a726-48e5-99be-32571ce1a08e', 2, true),
('Nomenclatura das Bases', 'nomenclatura_bases', 'subtema', 'ed63375c-a726-48e5-99be-32571ce1a08e', 3, true),
('Classificação das Bases', 'classificacao_bases', 'subtema', 'ed63375c-a726-48e5-99be-32571ce1a08e', 4, true),
('Escalas de pH', 'escalas_ph', 'subtema', 'ed63375c-a726-48e5-99be-32571ce1a08e', 5, true);

-- SUBTHEMES for Sais (ee17990b-be4e-4848-9d35-360553d5b144)
INSERT INTO question_taxonomy (label, value, level, parent_id, position, is_active) VALUES
('Formação de Sais', 'formacao_sais', 'subtema', 'ee17990b-be4e-4848-9d35-360553d5b144', 1, true),
('Classificação dos Sais', 'classificacao_sais', 'subtema', 'ee17990b-be4e-4848-9d35-360553d5b144', 2, true),
('Propriedades dos Sais', 'propriedades_sais', 'subtema', 'ee17990b-be4e-4848-9d35-360553d5b144', 3, true),
('Aplicações dos Sais', 'aplicacoes_sais', 'subtema', 'ee17990b-be4e-4848-9d35-360553d5b144', 4, true),
('Nomenclatura dos Sais', 'nomenclatura_sais', 'subtema', 'ee17990b-be4e-4848-9d35-360553d5b144', 5, true);

-- SUBTHEMES for Óxidos (404399a6-1db8-4d48-8ddd-9f50fc247909)
INSERT INTO question_taxonomy (label, value, level, parent_id, position, is_active) VALUES
('Classificação dos Óxidos', 'classificacao_oxidos', 'subtema', '404399a6-1db8-4d48-8ddd-9f50fc247909', 1, true),
('Nomenclatura dos Óxidos', 'nomenclatura_oxidos', 'subtema', '404399a6-1db8-4d48-8ddd-9f50fc247909', 2, true),
('Impactos Ambientais', 'impactos_ambientais_oxidos', 'subtema', '404399a6-1db8-4d48-8ddd-9f50fc247909', 3, true);

-- SUBTHEMES for Leis Ponderais (d75ad62b-d18f-4240-83a9-7ad13490f052)
INSERT INTO question_taxonomy (label, value, level, parent_id, position, is_active) VALUES
('Leis Químicas Fundamentais', 'leis_quimicas_fundamentais', 'subtema', 'd75ad62b-d18f-4240-83a9-7ad13490f052', 1, true);

-- SUBTHEMES for Cálculos (f1a9cca4-5902-4303-bd49-2f7b5586e850)
INSERT INTO question_taxonomy (label, value, level, parent_id, position, is_active) VALUES
('Quantidade de Substância', 'quantidade_substancia', 'subtema', 'f1a9cca4-5902-4303-bd49-2f7b5586e850', 1, true),
('Massa', 'massa_calculos', 'subtema', 'f1a9cca4-5902-4303-bd49-2f7b5586e850', 2, true),
('Volume', 'volume_calculos', 'subtema', 'f1a9cca4-5902-4303-bd49-2f7b5586e850', 3, true),
('Fórmulas Químicas', 'formulas_quimicas', 'subtema', 'f1a9cca4-5902-4303-bd49-2f7b5586e850', 4, true);

-- SUBTHEMES for Leis dos Gases (cdeb4874-71d2-49ab-b9bc-2061fe95323a)
INSERT INTO question_taxonomy (label, value, level, parent_id, position, is_active) VALUES
('Equação de Clapeyron', 'equacao_clapeyron', 'subtema', 'cdeb4874-71d2-49ab-b9bc-2061fe95323a', 1, true),
('Equação Geral dos Gases', 'equacao_geral_gases', 'subtema', 'cdeb4874-71d2-49ab-b9bc-2061fe95323a', 2, true),
('Misturas Gasosas', 'misturas_gasosas', 'subtema', 'cdeb4874-71d2-49ab-b9bc-2061fe95323a', 3, true);

-- SUBTHEMES for Difusão e Efusão (47306c2b-de27-447b-8587-380817769dbe)
INSERT INTO question_taxonomy (label, value, level, parent_id, position, is_active) VALUES
('Movimento dos Gases', 'movimento_gases', 'subtema', '47306c2b-de27-447b-8587-380817769dbe', 1, true),
('Relações Matemáticas', 'relacoes_matematicas_gases', 'subtema', '47306c2b-de27-447b-8587-380817769dbe', 2, true);