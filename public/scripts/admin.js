// /scripts/admin.js - Controle do Painel Administrativo Keep Keys

const { createApp } = Vue;

createApp({
    data() {
        return {
            abaAtual: 'dashboard',          // 'dashboard' | 'jogos'
            filtroCategoria: 'todos',       // 'todos' | 'ps' | 'steam' | 'xbox' | 'destaque' | 'promocao'
            buscaAdmin: '',
            listaJogos: [],
            jogoEmEdicaoId: null,
            menuAvatarAberto: false,
            novoJogo: {
                titulo: '',
                preco: '',
                precoAntigo: '',
                imagem: '',
                categoria: 'ps',
                categorias: ['ps'],
                link: ''
            }
        };
    },
    watch: {
        'novoJogo.precoAntigo'(novoValor) {
            if (novoValor && String(novoValor).trim() !== '') {
                if (!this.novoJogo.categorias.includes('promocao')) {
                    this.novoJogo.categorias.push('promocao');
                }
            }
        }
    },
    computed: {
        jogosFiltrados() {
            return this.listaJogos.filter(jogo => {
                const categorias = this.obterCategoriasJogo(jogo).map(c => c.toLowerCase());
                const filtro = this.filtroCategoria.toLowerCase();
                const matchCategoria = (filtro === 'todos') || categorias.includes(filtro);
                
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
        obterCategoriasJogo(jogo) {
            let cats = Array.isArray(jogo.categorias) && jogo.categorias.length > 0
                ? [...jogo.categorias]
                : [(jogo.categoria || jogo.plataforma || 'ps')];

            const temDesconto = Boolean(
                jogo.precoAntigo && 
                String(jogo.precoAntigo).trim() !== '' && 
                String(jogo.precoAntigo).trim() !== '0'
            );

            if (temDesconto && !cats.includes('promocao')) {
                cats.push('promocao');
            }
            return cats;
        },
        contarJogos(categoria) {
            const catAlvo = categoria.toLowerCase();
            return this.listaJogos.filter(j => {
                const cats = this.obterCategoriasJogo(j).map(c => c.toLowerCase());
                return cats.includes(catAlvo);
            }).length;
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
        alternarCategoriaNovoJogo(cat) {
            const idx = this.novoJogo.categorias.indexOf(cat);
            if (idx === -1) {
                this.novoJogo.categorias.push(cat);
            } else {
                if (this.novoJogo.categorias.length > 1) {
                    this.novoJogo.categorias.splice(idx, 1);
                } else {
                    alert('O jogo deve pertencer a pelo menos uma categoria!');
                }
            }
        },
        async carregarJogos() {
            try {
                const endpoints = [
                    '/api/jogos',
                    '/dados/jogos.json',
                    '../dados/jogos.json',
                    '../../dados/jogos.json',
                    './dados/jogos.json',
                    '/public/dados/jogos.json'
                ];

                for (const url of endpoints) {
                    try {
                        const resposta = await fetch(url);
                        if (resposta && resposta.ok) {
                            const dados = await resposta.json();
                            if (Array.isArray(dados) && dados.length > 0) {
                                this.listaJogos = dados;
                                break;
                            }
                        }
                    } catch (e) {}
                }
            } catch (erro) {
                console.error('Erro ao carregar jogos:', erro);
            }
        },
        async salvarJogo() {
            let cats = [...(this.novoJogo.categorias || [])];
            if (cats.length === 0) cats = ['ps'];

            // Se digitou preço antigo, garante que esteja na categoria de promoção
            if (this.novoJogo.precoAntigo && String(this.novoJogo.precoAntigo).trim() !== '') {
                if (!cats.includes('promocao')) cats.push('promocao');
            }

            const catPrincipal = cats.find(c => c !== 'promocao') || cats[0] || 'ps';

            const dadosJogo = {
                titulo: this.novoJogo.titulo.trim(),
                preco: this.novoJogo.preco.replace('R$', '').trim(),
                precoAntigo: this.novoJogo.precoAntigo ? this.novoJogo.precoAntigo.replace('R$', '').trim() : '',
                imagem: this.novoJogo.imagem.trim(),
                categoria: catPrincipal,
                plataforma: catPrincipal,
                categorias: cats,
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
                        // Fallback local se o servidor Express não estiver rodando
                        const index = this.listaJogos.findIndex(j => j.id === this.jogoEmEdicaoId);
                        if (index !== -1) {
                            this.listaJogos[index] = { ...this.listaJogos[index], ...dadosJogo };
                        }
                        alert('Jogo atualizado localmente!');
                        this.cancelarEdicao();
                    }
                } catch (erro) {
                    console.error('Erro ao atualizar jogo:', erro);
                    const index = this.listaJogos.findIndex(j => j.id === this.jogoEmEdicaoId);
                    if (index !== -1) {
                        this.listaJogos[index] = { ...this.listaJogos[index], ...dadosJogo };
                    }
                    alert('Jogo atualizado localmente!');
                    this.cancelarEdicao();
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
                        const novoObj = { id: 'jogo-' + Date.now(), ...dadosJogo };
                        this.listaJogos.push(novoObj);
                        this.resetarFormulario();
                        alert('Jogo cadastrado localmente!');
                    }
                } catch (erro) {
                    console.error('Erro ao cadastrar jogo:', erro);
                    const novoObj = { id: 'jogo-' + Date.now(), ...dadosJogo };
                    this.listaJogos.push(novoObj);
                    this.resetarFormulario();
                    alert('Jogo cadastrado localmente!');
                }
            }

            this.$nextTick(() => {
                if (typeof lucide !== 'undefined') lucide.createIcons();
            });
        },
        editarJogo(jogo) {
            this.jogoEmEdicaoId = jogo.id;
            const cats = this.obterCategoriasJogo(jogo);

            this.novoJogo = {
                titulo: jogo.titulo || '',
                preco: jogo.preco || '',
                precoAntigo: jogo.precoAntigo || '',
                imagem: jogo.imagem || '',
                categoria: cats[0] || 'ps',
                categorias: cats,
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
                categorias: ['ps'],
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
                        this.listaJogos = this.listaJogos.filter(j => j.id !== id);
                        if (this.jogoEmEdicaoId === id) this.cancelarEdicao();
                    }
                } catch (erro) {
                    console.error('Erro ao excluir jogo:', erro);
                    this.listaJogos = this.listaJogos.filter(j => j.id !== id);
                    if (this.jogoEmEdicaoId === id) this.cancelarEdicao();
                }
            }
        },
        toggleMenuAvatar() {
            this.menuAvatarAberto = !this.menuAvatarAberto;
            if (this.menuAvatarAberto) {
                this.$nextTick(() => {
                    if (typeof lucide !== 'undefined') lucide.createIcons();
                });
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
        
        // Controle de clique fora do avatar
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.usuario-avatar-dropdown-container')) {
                this.menuAvatarAberto = false;
            }
        });

        // Suporte ao menu hambúrguer no painel admin para celulares
        const btnHamburguer = document.getElementById('btn-hamburguer');
        const menuLateral = document.querySelector('aside');
        if (btnHamburguer && menuLateral) {
            let overlay = document.querySelector('.menu-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'menu-overlay';
                overlay.setAttribute('aria-hidden', 'true');
                document.body.appendChild(overlay);
            }

            const fecharMenuAdmin = () => {
                menuLateral.classList.remove('ativo');
                overlay.classList.remove('ativo');
                btnHamburguer.setAttribute('aria-expanded', 'false');
            };

            btnHamburguer.addEventListener('click', (e) => {
                e.stopPropagation();
                const ativo = menuLateral.classList.toggle('ativo');
                overlay.classList.toggle('ativo', ativo);
                btnHamburguer.setAttribute('aria-expanded', ativo ? 'true' : 'false');
            });

            overlay.addEventListener('click', fecharMenuAdmin);
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && menuLateral.classList.contains('ativo')) {
                    fecharMenuAdmin();
                }
            });
        }
    },
    updated() {
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}).mount('#aplicativo');