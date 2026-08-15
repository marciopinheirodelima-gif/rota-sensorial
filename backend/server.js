// ============================================================
// Rota Sensorial — API (Express + SQLite)
// Módulo 3 — expõe as operações de manipulação de dados
// (inserção, consulta, atualização, remoção) para o front-end.
// ============================================================
const express = require("express");
const cors = require("cors");
const db = require("./db/database");

const app = express();
const PORTA = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const CATEGORIAS_VALIDAS = ["Mercado", "Praça", "Consultório", "Restaurante", "Loja", "Outro"];

// ------------------------------------------------------------
// GET /api/locais — CONSULTA
// Lista locais ativos com média dos critérios sensoriais e
// contagem de avaliações (JOIN + GROUP BY). Aceita ?q= para
// busca por nome, categoria ou endereço (RF03).
// ------------------------------------------------------------
app.get("/api/locais", (req, res) => {
  const termo = (req.query.q || "").trim().toLowerCase();

  let sql = `
    SELECT
      l.id, l.nome, l.endereco, l.categoria,
      ROUND(AVG(a.ruido), 2)        AS mediaRuido,
      ROUND(AVG(a.iluminacao), 2)   AS mediaIluminacao,
      ROUND(AVG(a.tempo_espera), 2) AS mediaTempoEspera,
      MAX(a.tem_recolhimento)       AS temRecolhimento,
      COUNT(a.id)                   AS totalAvaliacoes
    FROM locais l
    LEFT JOIN avaliacoes a ON a.local_id = l.id AND a.removido = 0
    WHERE l.removido = 0
  `;
  const params = [];

  if (termo) {
    sql += ` AND (LOWER(l.nome) LIKE ? OR LOWER(l.categoria) LIKE ? OR LOWER(l.endereco) LIKE ?)`;
    const like = `%${termo}%`;
    params.push(like, like, like);
  }

  sql += ` GROUP BY l.id ORDER BY mediaRuido IS NULL, mediaRuido ASC`;

  const locais = db.prepare(sql).all(...params);
  res.json(locais);
});

// ------------------------------------------------------------
// POST /api/locais — INSERÇÃO (RF01)
// ------------------------------------------------------------
app.post("/api/locais", (req, res) => {
  const { nome, endereco, categoria } = req.body;

  if (!nome?.trim() || !endereco?.trim() || !categoria?.trim()) {
    return res.status(400).json({ erro: "Preencha nome, endereço e categoria." });
  }
  if (!CATEGORIAS_VALIDAS.includes(categoria)) {
    return res.status(400).json({ erro: "Categoria inválida." });
  }

  const resultado = db
    .prepare("INSERT INTO locais (nome, endereco, categoria) VALUES (?, ?, ?)")
    .run(nome.trim(), endereco.trim(), categoria);

  const novoLocal = db.prepare("SELECT * FROM locais WHERE id = ?").get(resultado.lastInsertRowid);
  res.status(201).json(novoLocal);
});

// ------------------------------------------------------------
// PUT /api/locais/:id — ATUALIZAÇÃO
// ------------------------------------------------------------
app.put("/api/locais/:id", (req, res) => {
  const { id } = req.params;
  const { nome, endereco, categoria } = req.body;

  const local = db.prepare("SELECT * FROM locais WHERE id = ? AND removido = 0").get(id);
  if (!local) return res.status(404).json({ erro: "Local não encontrado." });

  if (!nome?.trim() || !endereco?.trim() || !categoria?.trim()) {
    return res.status(400).json({ erro: "Preencha nome, endereço e categoria." });
  }
  if (!CATEGORIAS_VALIDAS.includes(categoria)) {
    return res.status(400).json({ erro: "Categoria inválida." });
  }

  db.prepare(`
    UPDATE locais
    SET nome = ?, endereco = ?, categoria = ?, atualizado_em = datetime('now')
    WHERE id = ?
  `).run(nome.trim(), endereco.trim(), categoria, id);

  const atualizado = db.prepare("SELECT * FROM locais WHERE id = ?").get(id);
  res.json(atualizado);
});

// ------------------------------------------------------------
// DELETE /api/locais/:id — REMOÇÃO (soft delete)
// Segue a boa prática discutida em aula: marca como removido em
// vez de apagar, preservando o histórico de avaliações.
// ------------------------------------------------------------
app.delete("/api/locais/:id", (req, res) => {
  const { id } = req.params;
  const local = db.prepare("SELECT * FROM locais WHERE id = ? AND removido = 0").get(id);
  if (!local) return res.status(404).json({ erro: "Local não encontrado." });

  db.prepare("UPDATE locais SET removido = 1, atualizado_em = datetime('now') WHERE id = ?").run(id);
  res.status(204).send();
});

// ------------------------------------------------------------
// POST /api/locais/:id/avaliacoes — INSERÇÃO (RF02)
// RNF04: impede salvar avaliação sem os critérios preenchidos.
// ------------------------------------------------------------
app.post("/api/locais/:id/avaliacoes", (req, res) => {
  const { id } = req.params;
  const { ruido, iluminacao, tempoEspera, temRecolhimento, comentario, anonima } = req.body;

  const local = db.prepare("SELECT id FROM locais WHERE id = ? AND removido = 0").get(id);
  if (!local) return res.status(404).json({ erro: "Local não encontrado." });

  if (!ruido || !iluminacao || !tempoEspera) {
    return res.status(400).json({ erro: "Preencha os três critérios sensoriais antes de enviar." });
  }

  const resultado = db.prepare(`
    INSERT INTO avaliacoes (local_id, ruido, iluminacao, tempo_espera, tem_recolhimento, comentario, anonima)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, Number(ruido), Number(iluminacao), Number(tempoEspera), temRecolhimento ? 1 : 0, comentario || null, anonima ? 1 : 0);

  const novaAvaliacao = db.prepare("SELECT * FROM avaliacoes WHERE id = ?").get(resultado.lastInsertRowid);
  res.status(201).json(novaAvaliacao);
});

// ------------------------------------------------------------
// DELETE /api/avaliacoes/:id — REMOÇÃO (soft delete)
// ------------------------------------------------------------
app.delete("/api/avaliacoes/:id", (req, res) => {
  const { id } = req.params;
  const avaliacao = db.prepare("SELECT * FROM avaliacoes WHERE id = ? AND removido = 0").get(id);
  if (!avaliacao) return res.status(404).json({ erro: "Avaliação não encontrada." });

  db.prepare("UPDATE avaliacoes SET removido = 1 WHERE id = ?").run(id);
  res.status(204).send();
});

app.listen(PORTA, () => {
  console.log(`Rota Sensorial API rodando em http://localhost:${PORTA}`);
});
