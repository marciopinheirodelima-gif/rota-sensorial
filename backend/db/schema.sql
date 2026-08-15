-- ============================================================
-- Rota Sensorial — esquema do banco de dados (SQLite)
-- Módulo 3 — Modelagem e manipulação de banco de dados
--
-- Entidades: locais, avaliacoes, usuarios
-- Relacionamentos:
--   avaliacoes.local_id   -> locais.id     (N avaliações para 1 local)
--   avaliacoes.usuario_id -> usuarios.id   (N avaliações para 1 usuário, opcional)
-- ============================================================

PRAGMA foreign_keys = ON;

-- ------------------------------------------------------------
-- Entidade: usuarios
-- Perfil mínimo: permite avaliações anônimas (RF05), então
-- usuario_id em avaliacoes pode ser nulo.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  identificador  TEXT UNIQUE,                  -- ex.: e-mail ou apelido; opcional
  criado_em      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ------------------------------------------------------------
-- Entidade: locais
-- Representa um estabelecimento/ambiente cadastrado (RF01).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS locais (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  nome        TEXT NOT NULL,
  endereco    TEXT NOT NULL,
  categoria   TEXT NOT NULL CHECK (categoria IN (
                'Mercado', 'Praça', 'Consultório', 'Restaurante', 'Loja', 'Outro'
              )),
  removido    INTEGER NOT NULL DEFAULT 0,       -- soft delete (0 = ativo, 1 = removido)
  criado_em   TEXT NOT NULL DEFAULT (datetime('now')),
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ------------------------------------------------------------
-- Entidade: avaliacoes
-- Representa uma avaliação sensorial de um local (RF02).
-- Chave estrangeira garante integridade referencial: uma
-- avaliação sempre pertence a um local existente.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS avaliacoes (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  local_id         INTEGER NOT NULL,
  usuario_id       INTEGER,                     -- nulo quando a avaliação é anônima
  ruido            INTEGER NOT NULL CHECK (ruido BETWEEN 1 AND 5),
  iluminacao       INTEGER NOT NULL CHECK (iluminacao BETWEEN 1 AND 5),
  tempo_espera     INTEGER NOT NULL CHECK (tempo_espera BETWEEN 1 AND 5),
  tem_recolhimento INTEGER NOT NULL DEFAULT 0 CHECK (tem_recolhimento IN (0, 1)),
  comentario       TEXT,
  anonima          INTEGER NOT NULL DEFAULT 0 CHECK (anonima IN (0, 1)),
  removido         INTEGER NOT NULL DEFAULT 0,  -- soft delete
  criado_em        TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (local_id)   REFERENCES locais(id)   ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Índices para acelerar as consultas mais comuns (busca por local
-- e cálculo de médias) — RNF02, tempo de resposta da busca.
CREATE INDEX IF NOT EXISTS idx_avaliacoes_local_id ON avaliacoes(local_id);
CREATE INDEX IF NOT EXISTS idx_locais_categoria     ON locais(categoria);
