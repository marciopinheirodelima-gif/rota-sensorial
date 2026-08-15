-- ============================================================
-- Rota Sensorial — manipulação de dados (exemplos)
-- Módulo 3 — operações de inserção, consulta, atualização e
-- remoção exigidas pela atividade. Este arquivo documenta as
-- mesmas operações que a API em server.js executa via
-- better-sqlite3; pode também ser rodado manualmente com o
-- utilitário `sqlite3 rota_sensorial.db` para fins de teste.
-- ============================================================

-- ------------------------------------------------------------
-- 1) INSERÇÃO
-- ------------------------------------------------------------
INSERT INTO locais (nome, endereco, categoria)
VALUES ('Praça do Rádio', 'Centro, Campo Grande - MS', 'Praça');

INSERT INTO locais (nome, endereco, categoria)
VALUES ('Mercadão Municipal', 'Vila Cidade Morena, Campo Grande - MS', 'Mercado');

-- Avaliação vinculada ao primeiro local cadastrado (id 1),
-- sem usuário identificado (avaliação anônima, RF05):
INSERT INTO avaliacoes (local_id, usuario_id, ruido, iluminacao, tempo_espera, tem_recolhimento, comentario, anonima)
VALUES (1, NULL, 2, 2, 1, 1, 'Bem tranquila de manhã cedo.', 1);


-- ------------------------------------------------------------
-- 2) CONSULTA
-- ------------------------------------------------------------

-- Boa prática discutida na aula do Módulo 3: evitar "SELECT *"
-- e buscar apenas as colunas necessárias.
-- Lista de locais ativos com a média de cada critério sensorial
-- e o total de avaliações (JOIN + GROUP BY):
SELECT
  l.id,
  l.nome,
  l.endereco,
  l.categoria,
  ROUND(AVG(a.ruido), 2)         AS media_ruido,
  ROUND(AVG(a.iluminacao), 2)    AS media_iluminacao,
  ROUND(AVG(a.tempo_espera), 2)  AS media_tempo_espera,
  MAX(a.tem_recolhimento)        AS tem_recolhimento,
  COUNT(a.id)                    AS total_avaliacoes
FROM locais l
LEFT JOIN avaliacoes a
  ON a.local_id = l.id AND a.removido = 0
WHERE l.removido = 0
GROUP BY l.id
ORDER BY media_ruido IS NULL, media_ruido ASC;

-- Busca por categoria ou região (RF03):
SELECT id, nome, endereco, categoria
FROM locais
WHERE removido = 0
  AND (categoria LIKE '%mercado%' OR endereco LIKE '%Campo Grande%');


-- ------------------------------------------------------------
-- 3) ATUALIZAÇÃO
-- ------------------------------------------------------------

-- Corrigir o endereço de um local existente:
UPDATE locais
SET endereco = 'Rua 14 de Julho, Centro, Campo Grande - MS',
    atualizado_em = datetime('now')
WHERE id = 1;


-- ------------------------------------------------------------
-- 4) REMOÇÃO
-- ------------------------------------------------------------

-- Soft delete (recomendado nas aulas: marca como removido sem
-- apagar o histórico, já que outras avaliações podem depender
-- deste local):
UPDATE locais
SET removido = 1, atualizado_em = datetime('now')
WHERE id = 2;

-- Remoção definitiva (hard delete) — usada apenas quando não há
-- necessidade de manter histórico. Graças ao ON DELETE CASCADE
-- definido em schema.sql, remover um local também remove suas
-- avaliações associadas, preservando a integridade referencial:
-- DELETE FROM locais WHERE id = 2;
