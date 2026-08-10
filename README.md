# Rota Sensorial

Mapeamento colaborativo de locais quanto a critérios sensoriais (ruído, iluminação,
tempo de espera e existência de espaços de recolhimento), pensado para pessoas
autistas e neurodivergentes planejarem seus deslocamentos com mais autonomia.

Projeto desenvolvido para a disciplina **Projeto Integrador em Tecnologia da
Informação II** — UFMS Digital, 2026/2. Autor: Márcio Pinheiro de Lima.

## Como rodar

Este é um projeto front-end estático, sem necessidade de build ou instalação de
dependências (Vue.js é carregado via CDN diretamente no `index.html`).

1. Clone o repositório.
2. Abra `index.html` no navegador — ou, para evitar restrições de CORS do
   navegador com `localStorage`, sirva a pasta com um servidor simples:
   ```bash
   python3 -m http.server 8000
   ```
   e acesse `http://localhost:8000`.

Os dados de locais e avaliações ficam salvos no `localStorage` do navegador,
já que esta etapa do projeto ainda não inclui um backend (ver seção
"Próximos passos").

## Estrutura do projeto

```
rota-sensorial/
├── index.html      # estrutura HTML5 semântica da aplicação
├── css/style.css   # estilização responsiva, mobile-first
├── js/app.js       # lógica da aplicação (Vue 3, via CDN)
└── README.md
```

## Decisões técnicas do Módulo 2

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
- **Regras implementadas nesta entrega**: RF01 (cadastrar local), RF02 (avaliar
  local), RF03 (buscar por categoria/região), RF04 (destacar locais mais
  calmos na tela inicial), RF05 (avaliação anônima) e RNF04 (impedir envio de
  avaliação sem os três critérios preenchidos).

## Próximos passos

- Implementar a API de backend (Node.js/Express, conforme planejado no
  Módulo 1) e um banco de dados relacional, substituindo o `localStorage`.
- Validar a interface e o conjunto de requisitos com outras pessoas autistas
  e neurodivergentes (entrevistas semiestruturadas).
- Avaliar a implementação de um mapa interativo (RF06), hoje fora do escopo
  do MVP.

## Licença

Projeto acadêmico, UFMS Digital — 2026/2.
