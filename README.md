# Rota Sensorial

Mapeamento colaborativo de locais quanto a critérios sensoriais (ruído,
iluminação, tempo de espera e existência de espaços de recolhimento),
pensado para pessoas autistas e neurodivergentes planejarem seus
deslocamentos com mais autonomia.

Projeto desenvolvido para a disciplina **Projeto Integrador em Tecnologia da
Informação II** — UFMS Digital, 2026/2. Autor: Márcio Pinheiro de Lima.

## Como rodar

O projeto tem duas partes: uma **API** (Node.js/Express + SQLite) e o
**front-end** (HTML/CSS/JS com Vue 3 via CDN). É preciso rodar as duas.

### 1. Backend (API + banco de dados)

```bash
cd backend
npm install
npm start
```

A API sobe em `http://localhost:3000`. Na primeira execução, o arquivo
`backend/db/rota_sensorial.db` é criado automaticamente a partir de
`backend/db/schema.sql`, já com dois locais de exemplo.

### 2. Front-end

Em outro terminal, na raiz do projeto:

```bash
python3 -m http.server 8000
```

e acesse `http://localhost:8000`. (Também funciona com a extensão Live
Server do VS Code, clicando com o botão direito em `index.html`.)

> O front-end espera a API em `http://localhost:3000/api` — se o backend
> não estiver rodando, a página mostra um aviso de conexão.

## Estrutura do projeto

```
rota-sensorial/
├── index.html          # estrutura HTML5 semântica da aplicação
├── css/style.css        # estilização responsiva, mobile-first
├── js/app.js             # lógica da aplicação (Vue 3, via CDN, consome a API)
├── backend/
│   ├── server.js          # API REST (Express) — CRUD completo
│   ├── package.json
│   └── db/
│       ├── schema.sql       # entidades, relacionamentos e restrições
│       ├── manipulacoes.sql # exemplos de INSERT/SELECT/UPDATE/DELETE
│       └── database.js      # inicializa o banco a partir do schema.sql
└── README.md
```

## Modelagem do banco de dados

Banco relacional **SQLite**, escolhido por não exigir instalação de
servidor separado — todo o banco é um único arquivo (`rota_sensorial.db`),
o que facilita rodar e avaliar o projeto em qualquer máquina. Três
entidades, com chaves estrangeiras garantindo integridade referencial:

- **locais** (`id`, `nome`, `endereco`, `categoria`, `removido`, `criado_em`, `atualizado_em`)
- **avaliacoes** (`id`, `local_id` → `locais.id`, `usuario_id` → `usuarios.id`, `ruido`, `iluminacao`, `tempo_espera`, `tem_recolhimento`, `comentario`, `anonima`, `removido`, `criado_em`)
- **usuarios** (`id`, `identificador`, `criado_em`)

Restrições aplicadas: `NOT NULL` nos campos obrigatórios, `CHECK` para
limitar `categoria` a valores válidos e as notas sensoriais à escala de
1 a 5, `FOREIGN KEY` com `ON DELETE CASCADE`/`ON DELETE SET NULL`, e um
campo `removido` para *soft delete* (o registro é marcado como removido
em vez de apagado, preservando o histórico — prática discutida nas
videoaulas do Módulo 3). O detalhamento completo está em
[`backend/db/schema.sql`](backend/db/schema.sql).

## Decisões técnicas do Módulo 2 (recapitulando)

- **Framework**: Vue.js 3, conforme indicado nas videoaulas do módulo. Optou-se
  pela versão via CDN (sem etapa de build) para manter a entrega simples e
  compatível com GitHub Pages sem configuração adicional.
- **HTML**: marcação semântica (`header`, `main`, `section`, `footer`), rótulos
  (`label`) associados a cada campo de formulário, `aria-label`/`aria-expanded`
  nos elementos interativos e um link de "pular para o conteúdo", visando
  acessibilidade de teclado e leitor de tela.
- **CSS responsivo**: abordagem mobile-first, com `media queries` em `640px`
  e `960px` ajustando a grade de locais de 1 para 2 e 3 colunas.
- **Baixo estímulo visual (RNF01)**: paleta de tons terrosos e dessaturados
  (sem branco puro nem cores vibrantes), tipografia
  [Atkinson Hyperlegible](https://brailleinstitute.org/freefont) — fonte
  desenvolvida especificamente para legibilidade e acessibilidade — e
  animações mínimas, respeitando `prefers-reduced-motion`.
- **Medidor sensorial**: em vez de estrelas ou notas numéricas isoladas, cada
  local exibe três barras (ruído, iluminação, tempo de espera) com uma escala
  de cor calma → intensa, tornando a informação sensorial mais legível de
  relance — elemento pensado especificamente para o propósito do app.

## Requisitos implementados

RF01 (cadastrar local), RF02 (avaliar local), RF03 (buscar por
categoria/região), RF04 (destacar locais mais calmos), RF05 (avaliação
anônima), RNF01 (baixo estímulo visual), RNF03 (acesso via navegador) e
RNF04 (impedir avaliação sem nota) — mais, a partir do Módulo 3, edição e
remoção (soft delete) de locais, cobrindo as quatro operações de
manipulação de dados exigidas (inserção, consulta, atualização, remoção).

## Controle de versão

O repositório segue o modelo de branch principal (`main`) estável, com
branches específicas por funcionalidade (ex.: `feature/banco-de-dados`),
integradas por *pull request*, e mensagens de commit semânticas (prefixos
como `feat:`, `fix:`, `docs:`), conforme praticado nas aulas do Módulo 3.

## Próximos passos

- Adicionar autenticação simples de usuários (hoje `usuarios` existe no
  esquema, mas ainda não há cadastro/login na interface).
- Validar a interface e o conjunto de requisitos com outras pessoas autistas
  e neurodivergentes (entrevistas semiestruturadas).
- Avaliar a implementação de um mapa interativo (RF06), hoje fora do escopo
  do MVP.
- Configurar integração contínua (GitHub Actions) para rodar verificações
  automáticas a cada push, conforme discutido nas aulas do Módulo 3.

## Licença

Projeto acadêmico, UFMS Digital — 2026/2.
