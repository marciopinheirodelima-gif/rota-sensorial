// ============================================================
// Rota Sensorial — inicialização do banco de dados (SQLite)
// ============================================================
const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

const DB_PATH = path.join(__dirname, "rota_sensorial.db");
const SCHEMA_PATH = path.join(__dirname, "schema.sql");

const db = new Database(DB_PATH);
db.pragma("foreign_keys = ON");

// Cria as tabelas (idempotente: usa IF NOT EXISTS) a partir do
// arquivo schema.sql, para manter uma única fonte de verdade
// entre o script SQL e a aplicação.
const schema = fs.readFileSync(SCHEMA_PATH, "utf-8");
db.exec(schema);

// Semeia alguns dados de exemplo apenas se o banco estiver vazio,
// para a interface não nascer sem nenhum conteúdo.
const { total } = db.prepare("SELECT COUNT(*) AS total FROM locais").get();
if (total === 0) {
  const inserirLocal = db.prepare(
    "INSERT INTO locais (nome, endereco, categoria) VALUES (?, ?, ?)"
  );
  const inserirAvaliacao = db.prepare(`
    INSERT INTO avaliacoes
      (local_id, ruido, iluminacao, tempo_espera, tem_recolhimento, comentario, anonima)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const transacao = db.transaction(() => {
    const praca = inserirLocal.run("Praça do Rádio", "Centro, Campo Grande - MS", "Praça");
    inserirLocal.run("Mercadão Municipal", "Vila Cidade Morena, Campo Grande - MS", "Mercado");
    inserirAvaliacao.run(praca.lastInsertRowid, 2, 2, 1, 1, "Bem tranquila de manhã cedo.", 1);
  });
  transacao();
}

module.exports = db;
