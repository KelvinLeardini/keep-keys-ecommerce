// /js/admin.js - Controle do Painel Administrativo Keep Keys

const { createApp } = Vue;

createApp({
    data() {
        return {
            abaAtual: 'dashboard',          // 'dashboard' | 'jogos'
            filtroCategoria: 'todos',       // 'todos' | 'ps' | 'steam' | 'xbox' | 'destaque' | 'promocao'
            buscaAdmin: '',
            listaJogos: [],
            jogoEmEdicaoId: null,
            novoJogo: {
                titulo: '',
                preco: '',
                precoAntigo: '',
                imagem: '',
                categoria: 'ps',
                link: ''
            }
        };
    },
    computed: {
        jogosFiltrados() {
            return this.listaJogos.filter(jogo => {
                const catJogo = (jogo.categoria || jogo.plataforma || '').toLowerCase();
                const filtro = this.filtroCategoria.toLowerCase();
                const matchCategoria = (filtro === 'todos') || (catJogo === filtro);
                
                const matchBusca = !this.buscaAdmin || 
                    (jogo.titulo && jogo.titulo.toLowerCase().includes(this.buscaAdmin.toLowerCase().trim()));
                
                return matchCategoria && matchBusca;
            });
        },
        jogosRecentes() {
            return [...this.listaJogos].reverse().slice(0, 6);
        }
    },
    methods: {
        verificarAcesso() {
            const cargo = localStorage.getItem('usuarioRole');
            if (cargo !== 'admin') {
                window.location.href = '/index.html'; 
            }
        },
        mudarAba(aba) {
            this.abaAtual = aba;
            this.$nextTick(() => {
                if (typeof lucide !== 'undefined') lucide.createIcons();
            });
        },
        mudarFiltro(cat) {
            this.filtroCategoria = cat;
            this.$nextTick(() => {
                if (typeof lucide !== 'undefined') lucide.createIcons();
            });
        },
        contarJogos(categoria) {
            const catAlvo = categoria.toLowerCase();
            return this.listaJogos.filter(j => 
                (j.categoria && j.categoria.toLowerCase() === catAlvo) ||
                (j.plataforma && j.plataforma.toLowerCase() === catAlvo)
            ).length;
        },
        formatarPreco(valor) {
            if (!valor) return 'R$ 0,00';
            const vStr = String(valor).trim();
            return vStr.startsWith('R$') ? vStr : `R$ ${vStr}`;
        },
        labelCategoria(cat) {
            const map = {
                'ps': 'PlayStation',
                'steam': 'Steam',
                'xbox': 'Xbox',
                'destaque': 'Destaque',
                'promocao': 'Promoção'
            };
            return map[(cat || '').toLowerCase()] || cat || 'Geral';
        },
        async carregarJogos() {
            try {
                let resposta;
                try {
                    resposta = await fetch('/api/jogos');
                } catch {
                    resposta = await fetch('/dados/jogos.json');
                }
                if (!resposta.ok) {
                    resposta = await fetch('/dados/jogos.json');
                }
                this.listaJogos = await resposta.json();
            } catch (erro) {
                console.error('Erro ao carregar jogos:', erro);
            }
        },
        async salvarJogo() {
            const dadosJogo = {
                titulo: this.novoJogo.titulo.trim(),
                preco: this.novoJogo.preco.replace('R$', '').trim(),
                precoAntigo: this.novoJogo.precoAntigo ? this.novoJogo.precoAntigo.replace('R$', '').trim() : '',
                imagem: this.novoJogo.imagem.trim(),
                categoria: this.novoJogo.categoria,
                plataforma: this.novoJogo.categoria,
                link: this.novoJogo.link ? this.novoJogo.link.trim() : ''
            };

            if (this.jogoEmEdicaoId) {
                // Atualização (PUT)
                try {
                    const resposta = await fetch(`/api/jogos/${this.jogoEmEdicaoId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(dadosJogo)
                    });

                    if (resposta.ok) {
                        const index = this.listaJogos.findIndex(j => j.id === this.jogoEmEdicaoId);
                        if (index !== -1) {
                            this.listaJogos[index] = { ...this.listaJogos[index], ...dadosJogo };
                        }
                        alert('Jogo atualizado com sucesso!');
                        this.cancelarEdicao();
                    } else {
                        alert('Erro ao atualizar jogo no servidor.');
                    }
                } catch (erro) {
                    console.error('Erro ao atualizar jogo:', erro);
                    alert('Falha na comunicação com o servidor.');
                }
            } else {
                // Cadastro novo (POST)
                try {
                    const resposta = await fetch('/api/jogos', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(dadosJogo)
                    });

                    if (resposta.ok) {
                        const dados = await resposta.json();
                        this.listaJogos.push(dados.jogo);
                        this.resetarFormulario();
                        alert('Jogo cadastrado com sucesso!');
                    } else {
                        alert('Erro ao salvar jogo no servidor.');
                    }
                } catch (erro) {
                    console.error('Erro ao cadastrar jogo:', erro);
                    alert('Falha na comunicação com o servidor.');
                }
            }

            this.$nextTick(() => {
                if (typeof lucide !== 'undefined') lucide.createIcons();
            });
        },
        editarJogo(jogo) {
            this.jogoEmEdicaoId = jogo.id;
            this.novoJogo = {
                titulo: jogo.titulo || '',
                preco: jogo.preco || '',
                precoAntigo: jogo.precoAntigo || '',
                imagem: jogo.imagem || '',
                categoria: jogo.categoria || jogo.plataforma || 'ps',
                link: jogo.link || ''
            };
            this.abaAtual = 'jogos';
            // Rola suavemente até o formulário
            const formEl = document.querySelector('.admin-form');
            if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
        },
        cancelarEdicao() {
            this.jogoEmEdicaoId = null;
            this.resetarFormulario();
        },
        resetarFormulario() {
            this.novoJogo = {
                titulo: '',
                preco: '',
                precoAntigo: '',
                imagem: '',
                categoria: 'ps',
                link: ''
            };
        },
        async excluirJogo(id) {
            const jogo = this.listaJogos.find(j => j.id === id);
            const nome = jogo ? jogo.titulo : 'este jogo';
            if (confirm(`Tem certeza que deseja remover "${nome}" da loja?`)) {
                try {
                    const resposta = await fetch(`/api/jogos/${id}`, { method: 'DELETE' });
                    if (resposta.ok) {
                        this.listaJogos = this.listaJogos.filter(j => j.id !== id);
                        if (this.jogoEmEdicaoId === id) this.cancelarEdicao();
                    } else {
                        alert('Erro ao excluir jogo do servidor.');
                    }
                } catch (erro) {
                    console.error('Erro ao excluir jogo:', erro);
                    alert('Erro ao excluir jogo.');
                }
            }
        },
        sairDoPainel() {
            localStorage.removeItem('usuarioLogado');
            localStorage.removeItem('usuarioRole');
            localStorage.removeItem('usuarioNome');
            window.location.href = '/index.html';
        }
    },
    mounted() {
        this.verificarAcesso();
        this.carregarJogos();
    },
    updated() {
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}).mount('#aplicativo');