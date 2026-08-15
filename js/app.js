/* ============================================
   Rota Sensorial — lógica da aplicação (Vue 3)
   Módulo 3: os dados deixam de ficar apenas no
   localStorage e passam a ser lidos/gravados via
   API (Node.js/Express + SQLite), que implementa
   as operações de inserção, consulta, atualização
   e remoção sobre o banco de dados relacional.
   ============================================ */

const { createApp } = Vue;

const API_BASE = "http://localhost:3000/api";

async function chamarApi(caminho, opcoes = {}) {
  const resposta = await fetch(API_BASE + caminho, {
    headers: { "Content-Type": "application/json" },
    ...opcoes,
  });

  if (!resposta.ok) {
    let mensagem = "Não foi possível completar a operação.";
    try {
      const corpo = await resposta.json();
      mensagem = corpo.erro || mensagem;
    } catch (_) {}
    throw new Error(mensagem);
  }

  if (resposta.status === 204) return null;
  return resposta.json();
}

const app = createApp({
  data() {
    return {
      locais: [],
      carregando: true,
      erroConexao: "",

      termoBusca: "",
      buscaDebounce: null,

      categorias: ["Mercado", "Praça", "Consultório", "Restaurante", "Loja", "Outro"],

      mostrarCadastro: false,
      novoLocal: { nome: "", endereco: "", categoria: "" },
      erroCadastro: "",

      localEmEdicao: null,
      edicaoLocal: { nome: "", endereco: "", categoria: "" },
      erroEdicao: "",

      localEmAvaliacao: null,
      novaAvaliacao: this.avaliacaoEmBranco(),
      erroAvaliacao: "",
      enviandoAvaliacao: false,

      criteriosAvaliacao: [
        { chave: "ruido", rotulo: "Nível de ruído", textos: ["Muito baixo", "Baixo", "Moderado", "Alto", "Muito alto"] },
        { chave: "iluminacao", rotulo: "Intensidade da luz", textos: ["Muito suave", "Suave", "Moderada", "Forte", "Muito forte"] },
        { chave: "tempoEspera", rotulo: "Tempo de espera", textos: ["Quase nenhum", "Curto", "Moderado", "Longo", "Muito longo"] },
      ],
    };
  },

  computed: {
    locaisFiltrados() {
      return this.locais;
    },
  },

  mounted() {
    this.buscarLocais();
  },

  watch: {
    termoBusca() {
      clearTimeout(this.buscaDebounce);
      this.buscaDebounce = setTimeout(() => this.buscarLocais(), 300);
    },
  },

  methods: {
    avaliacaoEmBranco() {
      return { ruido: 3, iluminacao: 3, tempoEspera: 3, temRecolhimento: false, comentario: "", anonima: false };
    },

    // RF03 — busca por categoria/região · RF04 — locais mais calmos primeiro
    // (o filtro e a ordenação são resolvidos em SQL, na API)
    async buscarLocais() {
      this.carregando = true;
      this.erroConexao = "";
      try {
        const query = this.termoBusca.trim() ? `?q=${encodeURIComponent(this.termoBusca.trim())}` : "";
        this.locais = await chamarApi(`/locais${query}`);
      } catch (erro) {
        this.erroConexao = "Não foi possível conectar à API em " + API_BASE + ". Verifique se o backend está rodando (cd backend && npm start).";
      } finally {
        this.carregando = false;
      }
    },

    medidorLocal(local) {
      if (!local.totalAvaliacoes) return [];
      const valores = {
        ruido: local.mediaRuido,
        iluminacao: local.mediaIluminacao,
        tempoEspera: local.mediaTempoEspera,
      };
      return this.criteriosAvaliacao.map((c) => {
        const valor = valores[c.chave];
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

    // RF01 — cadastrar local (INSERT)
    async cadastrarLocal() {
      this.erroCadastro = "";
      const { nome, endereco, categoria } = this.novoLocal;
      if (!nome || !endereco || !categoria) {
        this.erroCadastro = "Preencha nome, endereço e categoria para cadastrar o local.";
        return;
      }
      try {
        await chamarApi("/locais", { method: "POST", body: JSON.stringify(this.novoLocal) });
        this.novoLocal = { nome: "", endereco: "", categoria: "" };
        this.mostrarCadastro = false;
        await this.buscarLocais();
      } catch (erro) {
        this.erroCadastro = erro.message;
      }
    },

    // Edição de local (UPDATE)
    abrirEdicao(local) {
      this.localEmEdicao = local;
      this.edicaoLocal = { nome: local.nome, endereco: local.endereco, categoria: local.categoria };
      this.erroEdicao = "";
    },

    fecharEdicao() {
      this.localEmEdicao = null;
      this.erroEdicao = "";
    },

    async salvarEdicao() {
      this.erroEdicao = "";
      const { nome, endereco, categoria } = this.edicaoLocal;
      if (!nome || !endereco || !categoria) {
        this.erroEdicao = "Preencha nome, endereço e categoria.";
        return;
      }
      try {
        await chamarApi(`/locais/${this.localEmEdicao.id}`, { method: "PUT", body: JSON.stringify(this.edicaoLocal) });
        this.fecharEdicao();
        await this.buscarLocais();
      } catch (erro) {
        this.erroEdicao = erro.message;
      }
    },

    // Remoção de local (DELETE — soft delete no backend)
    async removerLocal(local) {
      const confirmar = window.confirm(`Remover "${local.nome}"? As avaliações associadas deixarão de aparecer, mas o histórico é preservado no banco.`);
      if (!confirmar) return;
      try {
        await chamarApi(`/locais/${local.id}`, { method: "DELETE" });
        await this.buscarLocais();
      } catch (erro) {
        alert(erro.message);
      }
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

    // RF02 — avaliar local (INSERT) · RNF04 — validação client-side + server-side
    async enviarAvaliacao() {
      this.erroAvaliacao = "";
      const { ruido, iluminacao, tempoEspera } = this.novaAvaliacao;
      if (!ruido || !iluminacao || !tempoEspera) {
        this.erroAvaliacao = "Preencha os três critérios sensoriais antes de enviar.";
        return;
      }
      this.enviandoAvaliacao = true;
      try {
        await chamarApi(`/locais/${this.localEmAvaliacao.id}/avaliacoes`, {
          method: "POST",
          body: JSON.stringify(this.novaAvaliacao),
        });
        this.fecharAvaliacao();
        await this.buscarLocais();
      } catch (erro) {
        this.erroAvaliacao = erro.message;
      } finally {
        this.enviandoAvaliacao = false;
      }
    },
  },
});

app.mount("#app");
