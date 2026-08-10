/* ============================================
   Rota Sensorial — lógica da aplicação (Vue 3)
   Implementa os requisitos definidos no
   relatório do Módulo 1 (RF01–RF05, RNF01–RNF04).
   Dados persistidos em localStorage: sem backend
   nesta etapa, mas o modelo de dados já reflete
   as três tabelas planejadas (locais, avaliacoes,
   usuarios), prontas para uma futura API.
   ============================================ */

const { createApp } = Vue;

const CHAVE_LOCAIS = "rota-sensorial:locais";
const CHAVE_AVALIACOES = "rota-sensorial:avaliacoes";

function carregar(chave, padrao) {
  try {
    const bruto = localStorage.getItem(chave);
    return bruto ? JSON.parse(bruto) : padrao;
  } catch (erro) {
    console.error("Não foi possível ler dados salvos:", erro);
    return padrao;
  }
}

function salvar(chave, valor) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch (erro) {
    console.error("Não foi possível salvar dados:", erro);
  }
}

// Alguns locais de exemplo, só para a interface não nascer vazia.
// Representam a tabela "locais" do modelo de dados do Módulo 1.
const LOCAIS_EXEMPLO = [
  { id: "loc-1", nome: "Praça do Rádio", endereco: "Centro, Campo Grande - MS", categoria: "Praça" },
  { id: "loc-2", nome: "Mercadão Municipal", endereco: "Vila Cidade Morena, Campo Grande - MS", categoria: "Mercado" },
];

const AVALIACOES_EXEMPLO = [
  {
    id: "av-1", localId: "loc-1",
    ruido: 2, iluminacao: 2, tempoEspera: 1,
    temRecolhimento: true, comentario: "Bem tranquila de manhã cedo.", anonima: false,
  },
];

const app = createApp({
  data() {
    return {
      locais: carregar(CHAVE_LOCAIS, LOCAIS_EXEMPLO),
      avaliacoes: carregar(CHAVE_AVALIACOES, AVALIACOES_EXEMPLO),

      termoBusca: "",

      categorias: ["Mercado", "Praça", "Consultório", "Restaurante", "Loja", "Outro"],

      mostrarCadastro: false,
      novoLocal: { nome: "", endereco: "", categoria: "" },
      erroCadastro: "",

      localEmAvaliacao: null,
      novaAvaliacao: this.avaliacaoEmBranco(),
      erroAvaliacao: "",

      criteriosAvaliacao: [
        { chave: "ruido", rotulo: "Nível de ruído", textos: ["Muito baixo", "Baixo", "Moderado", "Alto", "Muito alto"] },
        { chave: "iluminacao", rotulo: "Intensidade da luz", textos: ["Muito suave", "Suave", "Moderada", "Forte", "Muito forte"] },
        { chave: "tempoEspera", rotulo: "Tempo de espera", textos: ["Quase nenhum", "Curto", "Moderado", "Longo", "Muito longo"] },
      ],
    };
  },

  computed: {
    // RF03 — busca por categoria ou região (endereço)
    locaisFiltrados() {
      const termo = this.termoBusca.trim().toLowerCase();
      const lista = !termo
        ? this.locais
        : this.locais.filter(
            (l) =>
              l.categoria.toLowerCase().includes(termo) ||
              l.endereco.toLowerCase().includes(termo) ||
              l.nome.toLowerCase().includes(termo)
          );

      // RF04 — locais mais bem avaliados em destaque (só quando não há busca ativa)
      if (!termo) {
        return [...lista].sort((a, b) => {
          const mediaA = this.calcularMedia(a.id);
          const mediaB = this.calcularMedia(b.id);
          return mediaA - mediaB; // menor "intensidade sensorial" primeiro = mais calmo primeiro
        });
      }
      return lista;
    },

    mediasPorLocal() {
      const mapa = {};
      for (const local of this.locais) {
        const avals = this.avaliacoes.filter((a) => a.localId === local.id);
        if (!avals.length) continue;
        mapa[local.id] = {
          ruido: media(avals.map((a) => a.ruido)),
          iluminacao: media(avals.map((a) => a.iluminacao)),
          tempoEspera: media(avals.map((a) => a.tempoEspera)),
          temRecolhimento: avals.some((a) => a.temRecolhimento),
          total: avals.length,
        };
      }
      return mapa;
    },
  },

  methods: {
    avaliacaoEmBranco() {
      return {
        ruido: 3,
        iluminacao: 3,
        tempoEspera: 3,
        temRecolhimento: false,
        comentario: "",
        anonima: false,
      };
    },

    calcularMedia(localId) {
      const dados = this.mediasPorLocal[localId];
      if (!dados) return 3; // sem avaliação ainda, não prioriza nem penaliza
      return (dados.ruido + dados.iluminacao + dados.tempoEspera) / 3;
    },

    medidorLocal(localId) {
      const dados = this.mediasPorLocal[localId];
      if (!dados) return [];
      return this.criteriosAvaliacao.map((c) => {
        const valor = dados[c.chave];
        return {
          rotulo: c.rotulo,
          texto: c.textos[Math.round(valor) - 1],
          percentual: (valor / 5) * 100,
          classe: valor <= 2 ? "calmo" : valor <= 3.5 ? "moderado" : "intenso",
        };
      });
    },

    abrirCadastro() {
      this.mostrarCadastro = true;
      this.$nextTick(() => this.$refs.botaoCadastro?.scrollIntoView({ behavior: "smooth", block: "center" }));
    },

    // RF01 — cadastrar local
    cadastrarLocal() {
      this.erroCadastro = "";
      const { nome, endereco, categoria } = this.novoLocal;

      if (!nome || !endereco || !categoria) {
        this.erroCadastro = "Preencha nome, endereço e categoria para cadastrar o local.";
        return;
      }

      const local = {
        id: "loc-" + Date.now(),
        nome,
        endereco,
        categoria,
      };
      this.locais.push(local);
      salvar(CHAVE_LOCAIS, this.locais);

      this.novoLocal = { nome: "", endereco: "", categoria: "" };
      this.mostrarCadastro = false;
    },

    abrirAvaliacao(local) {
      this.localEmAvaliacao = local;
      this.novaAvaliacao = this.avaliacaoEmBranco();
      this.erroAvaliacao = "";
      this.$nextTick(() => this.$refs.painelAvaliacao?.scrollIntoView({ behavior: "smooth", block: "start" }));
    },

    fecharAvaliacao() {
      this.localEmAvaliacao = null;
      this.erroAvaliacao = "";
    },

    // RF02 — avaliar local existente · RNF04 — impede envio sem nota preenchida
    enviarAvaliacao() {
      this.erroAvaliacao = "";
      const { ruido, iluminacao, tempoEspera } = this.novaAvaliacao;

      if (!ruido || !iluminacao || !tempoEspera) {
        this.erroAvaliacao = "Preencha os três critérios sensoriais antes de enviar.";
        return;
      }

      const avaliacao = {
        id: "av-" + Date.now(),
        localId: this.localEmAvaliacao.id,
        ruido: Number(ruido),
        iluminacao: Number(iluminacao),
        tempoEspera: Number(tempoEspera),
        temRecolhimento: this.novaAvaliacao.temRecolhimento,
        comentario: this.novaAvaliacao.comentario,
        anonima: this.novaAvaliacao.anonima, // RF05 — avaliação anônima
      };

      this.avaliacoes.push(avaliacao);
      salvar(CHAVE_AVALIACOES, this.avaliacoes);

      this.fecharAvaliacao();
    },
  },
});

function media(lista) {
  return lista.reduce((soma, v) => soma + v, 0) / lista.length;
}

app.mount("#app");
