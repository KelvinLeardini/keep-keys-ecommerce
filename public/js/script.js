// /js/script.js - Scripts principais da loja Keep Keys

// Aguarda o HTML carregar completamente
document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializa ícones Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // 2. Inicializa o carrossel de banners
    inicializarCarrossel();

    // 3. Inicializa autenticação e modais de login / cadastro
    inicializarAutenticacao();

    // 4. Inicializa o menu hambúrguer para mobile
    inicializarMenuHamburguer();

    // 5. Inicializa o carrinho de compras
    inicializarCarrinho();
    atualizarContadorCarrinho();

    // 6. Carrega os jogos dinamicamente a partir do JSON / API
    carregarJogosDinamicos();

    // 7. Configura busca inicial e botões de compra
    configurarBusca();
    configurarBotoesComprar();
});

// ==========================================
//   CARREGAMENTO DINÂMICO DE JOGOS (JSON / API)
// ==========================================
async function carregarJogosDinamicos() {
    const containers = document.querySelectorAll('.grade-produtos[data-categoria]');
    if (containers.length === 0) return;

    try {
        let resposta;
        try {
            resposta = await fetch('/api/jogos');
        } catch {
            resposta = await fetch('/dados/jogos.json');
        }

        if (!resposta || !resposta.ok) {
            resposta = await fetch('/dados/jogos.json');
        }

        const todosJogos = await resposta.json();

        containers.forEach(container => {
            const categoriaAlvo = (container.dataset.categoria || '').toLowerCase().trim();

            const jogosFiltrados = todosJogos.filter(jogo => {
                const catJogo = (jogo.categoria || jogo.plataforma || '').toLowerCase().trim();
                return catJogo === categoriaAlvo;
            });

            if (jogosFiltrados.length === 0) {
                container.innerHTML = '<p style="color: #888; text-align: center; grid-column: 1 / -1; padding: 30px;">Nenhum jogo encontrado nesta categoria.</p>';
                return;
            }

            container.innerHTML = jogosFiltrados.map(jogo => {
                const precoFormatado = jogo.preco.startsWith('R$') ? jogo.preco : `R$ ${jogo.preco}`;
                const precoAntigoHtml = jogo.precoAntigo 
                    ? `<p style="color: #ff4444; text-decoration: line-through; font-size: 0.9rem; margin: 0;">R$ ${jogo.precoAntigo.replace('R$', '').trim()}</p>`
                    : '';

                const cardHtml = `
                    <article class="jogo-produtos">
                        <img src="${jogo.imagem}" alt="${jogo.titulo}" width="200px">
                        <h4>${jogo.titulo}</h4>
                        ${precoAntigoHtml}
                        <p>${precoFormatado}</p>
                        <button type="button"><i data-lucide="shopping-cart"></i>COMPRAR</button>
                    </article>
                `;

                if (jogo.link && jogo.link.trim() !== '') {
                    return `<a href="${jogo.link}">${cardHtml}</a>`;
                }
                return cardHtml;
            }).join('');
        });

        // Atualiza os ícones do Lucide nos novos cards gerados
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Reassocia eventos de compra e busca
        configurarBotoesComprar();
        configurarBusca();

    } catch (erro) {
        console.error('Erro ao carregar jogos dinâmicos:', erro);
    }
}

// ==========================================
//   SISTEMA DE BUSCA EM TEMPO REAL
// ==========================================
function configurarBusca() {
    const inputBusca = document.querySelector('.buscar input');
    if (!inputBusca) return;

    inputBusca.oninput = () => {
        const termoBusca = inputBusca.value.toLowerCase().trim();
        const cardsJogos = document.querySelectorAll('.jogo-produtos');

        cardsJogos.forEach(card => {
            const tituloEl = card.querySelector('h4');
            const tituloJogo = tituloEl ? tituloEl.textContent.toLowerCase() : '';

            if (tituloJogo.includes(termoBusca)) {
                card.style.display = '';
                setTimeout(() => card.classList.remove('escondido'), 10);
            } else {
                card.classList.add('escondido');
                setTimeout(() => {
                    if (card.classList.contains('escondido')) {
                        card.style.display = 'none';
                    }
                }, 300);
            }
        });
    };
}

// ==========================================
//   CARROSSEL DE BANNERS
// ==========================================
function inicializarCarrossel() {
    const slides = document.querySelectorAll('.carrocel-container .slide');
    const btnAnterior = document.querySelector('.btn-carrocel.anterior');
    const btnProximo = document.querySelector('.btn-carrocel.proximo');

    if (slides.length === 0) return;

    let slideAtual = 0;
    let temporizadorCarrocel;

    function mostrarSlide(indice) {
        if (indice >= slides.length) slideAtual = 0;
        else if (indice < 0) slideAtual = slides.length - 1;
        else slideAtual = indice;

        slides.forEach((slide, i) => {
            slide.classList.toggle('ativo', i === slideAtual);
        });
    }

    function proximoSlide() {
        mostrarSlide(slideAtual + 1);
    }

    function anteriorSlide() {
        mostrarSlide(slideAtual - 1);
    }

    function iniciarAutoPlay() {
        temporizadorCarrocel = setInterval(proximoSlide, 5000);
    }

    function reiniciarAutoPlay() {
        clearInterval(temporizadorCarrocel);
        iniciarAutoPlay();
    }

    if (btnProximo && btnAnterior) {
        btnProximo.addEventListener('click', () => {
            proximoSlide();
            reiniciarAutoPlay();
        });

        btnAnterior.addEventListener('click', () => {
            anteriorSlide();
            reiniciarAutoPlay();
        });
    }

    iniciarAutoPlay();
}

// ==========================================
//   AUTENTICAÇÃO (LOGIN, CADASTRO, ROLES)
// ==========================================
function inicializarAutenticacao() {
    const modal = document.getElementById('modal-login');
    const btnEntrar = document.getElementById('btn-entrar-header');
    const btnSair = document.getElementById('btn-sair-header');
    const painelUsuario = document.getElementById('painel-usuario');
    const btnFechar = document.querySelector('.fechar-modal');
    const formLogin = document.getElementById('form-login');

    const linkIrCadastro = document.getElementById('link-ir-cadastro');
    const linkIrLogin = document.getElementById('link-ir-login');
    const formCadastro = document.getElementById('form-cadastro');

    if (linkIrCadastro && formLogin && formCadastro) {
        linkIrCadastro.addEventListener('click', (e) => {
            e.preventDefault();
            formLogin.style.display = 'none';
            formCadastro.style.display = 'block';
        });
    }

    if (linkIrLogin && formLogin && formCadastro) {
        linkIrLogin.addEventListener('click', (e) => {
            e.preventDefault();
            formCadastro.style.display = 'none';
            formLogin.style.display = 'block';
        });
    }

    function atualizarEstadoLogin() {
        const estaLogado = localStorage.getItem('usuarioLogado') === 'true';
        const role = localStorage.getItem('usuarioRole');
        const nome = localStorage.getItem('usuarioNome') || 'Gamer';
        const btnAdmin = document.getElementById('btn-admin-header');
        const saudacaoEl = painelUsuario ? painelUsuario.querySelector('span strong') : null;

        if (saudacaoEl) {
            saudacaoEl.innerText = nome;
        }

        if (estaLogado) {
            if (btnEntrar) btnEntrar.style.setProperty('display', 'none', 'important');
            if (painelUsuario) painelUsuario.style.setProperty('display', 'flex', 'important');

            if (role === 'admin') {
                if (btnAdmin) btnAdmin.style.setProperty('display', 'inline-block', 'important');
            } else {
                if (btnAdmin) btnAdmin.style.setProperty('display', 'none', 'important');
            }
        } else {
            if (btnEntrar) btnEntrar.style.setProperty('display', 'inline-block', 'important');
            if (painelUsuario) painelUsuario.style.setProperty('display', 'none', 'important');
            if (btnAdmin) btnAdmin.style.setProperty('display', 'none', 'important');
        }
    }

    if (btnEntrar && modal) {
        btnEntrar.addEventListener('click', () => {
            modal.style.display = 'flex';
        });
    }

    if (btnSair) {
        btnSair.addEventListener('click', () => {
            localStorage.removeItem('usuarioLogado');
            localStorage.removeItem('usuarioRole');
            localStorage.removeItem('usuarioNome');
            atualizarEstadoLogin();
        });
    }

    if (btnFechar && modal) {
        btnFechar.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('email').value;
            const senhaInput = document.getElementById('senha').value;

            try {
                const resposta = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: emailInput, senha: senhaInput })
                });

                const dados = await resposta.json();

                if (dados.sucesso) {
                    localStorage.setItem('usuarioLogado', 'true');
                    localStorage.setItem('usuarioRole', dados.usuario.role);
                    localStorage.setItem('usuarioNome', dados.usuario.nome);

                    atualizarEstadoLogin();
                    modal.style.display = 'none';
                    formLogin.reset();
                } else {
                    alert(dados.mensagem);
                }
            } catch (erro) {
                console.error('Erro ao fazer login:', erro);
                alert('Não foi possível conectar ao servidor.');
            }
        });
    }

    if (formCadastro) {
        formCadastro.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nomeInput = document.getElementById('nome-cadastro').value;
            const emailInput = document.getElementById('email-cadastro').value;
            const senhaInput = document.getElementById('senha-cadastro').value;

            try {
                const resposta = await fetch('/api/cadastro', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome: nomeInput, email: emailInput, senha: senhaInput })
                });

                const dados = await resposta.json();

                if (dados.sucesso) {
                    alert('Conta criada com sucesso!');
                    localStorage.setItem('usuarioLogado', 'true');
                    localStorage.setItem('usuarioRole', dados.usuario.role);
                    localStorage.setItem('usuarioNome', dados.usuario.nome);

                    atualizarEstadoLogin();
                    modal.style.display = 'none';
                    formCadastro.reset();
                } else {
                    alert(dados.mensagem);
                }
            } catch (erro) {
                console.error('Erro no cadastro:', erro);
                alert('Não foi possível conectar ao servidor.');
            }
        });
    }

    atualizarEstadoLogin();
}

// ==========================================
//   MENU LATERAL MOBILE (HAMBÚRGUER)
// ==========================================
function inicializarMenuHamburguer() {
    const btnHamburguer = document.getElementById('btn-hamburguer');
    const menuLateral = document.querySelector('aside');

    if (btnHamburguer && menuLateral) {
        btnHamburguer.addEventListener('click', () => {
            menuLateral.classList.toggle('ativo');
        });
    }
}

// ==========================================
//   LÓGICA DO CARRINHO DE COMPRAS
// ==========================================
let carrinho = JSON.parse(localStorage.getItem('keepkeys_carrinho')) || [];

function inicializarCarrinho() {
    const modalCarrinho = document.getElementById('modal-carrinho');
    const btnAbrir = document.getElementById('btn-abrir-carrinho');
    const btnFechar = document.getElementById('fechar-carrinho');

    if (!modalCarrinho) return;

    modalCarrinho.style.display = 'none';
    modalCarrinho.classList.remove('ativo');

    if (btnAbrir) {
        btnAbrir.addEventListener('click', () => {
            renderizarCarrinho();
            modalCarrinho.style.display = 'flex';
            setTimeout(() => {
                modalCarrinho.classList.add('ativo');
            }, 10);
        });
    }

    const fecharCarrinhoAnimado = () => {
        modalCarrinho.classList.remove('ativo');
        setTimeout(() => {
            modalCarrinho.style.display = 'none';
        }, 350);
    };

    if (btnFechar) {
        btnFechar.addEventListener('click', fecharCarrinhoAnimado);
    }

    modalCarrinho.addEventListener('click', (e) => {
        if (e.target === modalCarrinho) {
            fecharCarrinhoAnimado();
        }
    });
}

function configurarBotoesComprar() {
    document.querySelectorAll('.jogo-produtos button').forEach((botao) => {
        botao.onclick = (evento) => {
            evento.stopPropagation();
            evento.preventDefault();

            const usuarioLogado = localStorage.getItem('usuarioLogado');

            if (!usuarioLogado) {
                alert('Você precisa estar logado para adicionar itens ao carrinho!');
                const modal = document.getElementById('modal-login');
                if (modal) modal.style.display = 'flex';
                return;
            }

            const card = botao.closest('.jogo-produtos');
            if (!card) return;

            const tituloEl = card.querySelector('h4');
            const precos = card.querySelectorAll('p');
            const precoEl = precos.length > 0 ? precos[precos.length - 1] : null;
            const imagemEl = card.querySelector('img');

            if (tituloEl && precoEl && imagemEl) {
                const produto = {
                    titulo: tituloEl.innerText.trim(),
                    preco: precoEl.innerText.trim(),
                    imagem: imagemEl.getAttribute('src')
                };

                adicionarAoCarrinho(produto);

                // Feedback visual de adicionado
                botao.textContent = 'ADICIONADO!';
                botao.classList.add('adicionado');

                setTimeout(() => {
                    botao.innerHTML = '<i data-lucide="shopping-cart"></i> COMPRAR';
                    botao.classList.remove('adicionado');
                    if (typeof lucide !== 'undefined') lucide.createIcons();
                }, 1500);
            }
        };
    });

    // Suporte aos botões de compra nas páginas individuais de jogos (.comprar-btn)
    document.querySelectorAll('.comprar-btn').forEach((botao) => {
        botao.onclick = (evento) => {
            evento.preventDefault();

            const usuarioLogado = localStorage.getItem('usuarioLogado');

            if (!usuarioLogado) {
                alert('Você precisa estar logado para adicionar itens ao carrinho!');
                const modal = document.getElementById('modal-login');
                if (modal) modal.style.display = 'flex';
                return;
            }

            const tituloEl = document.querySelector('.bloco-lateral h2');
            const precoEl = document.querySelector('.preco-jogo');
            const imagemEl = document.querySelector('.bloco-1 .jogo img') || document.querySelector('.jogo img');

            if (tituloEl && precoEl && imagemEl) {
                const produto = {
                    titulo: tituloEl.innerText.trim(),
                    preco: precoEl.innerText.trim(),
                    imagem: imagemEl.getAttribute('src')
                };

                adicionarAoCarrinho(produto);

                // Feedback visual de adicionado
                botao.innerHTML = '<i data-lucide="check"></i> ADICIONADO!';
                botao.style.backgroundColor = '#28a745';

                setTimeout(() => {
                    botao.innerHTML = '<i data-lucide="shopping-cart"></i> COMPRAR AGORA';
                    botao.style.backgroundColor = '';
                    if (typeof lucide !== 'undefined') lucide.createIcons();
                }, 1500);

                // Abre a gaveta do carrinho para visualização imediata
                const btnAbrir = document.getElementById('btn-abrir-carrinho');
                if (btnAbrir) btnAbrir.click();
            }
        };
    });
}

function adicionarAoCarrinho(produto) {
    carrinho.push(produto);
    salvarEAtualizar();
}

function removerDoCarrinho(index) {
    carrinho.splice(index, 1);
    salvarEAtualizar();
    renderizarCarrinho();
}

function salvarEAtualizar() {
    localStorage.setItem('keepkeys_carrinho', JSON.stringify(carrinho));
    atualizarContadorCarrinho();
}

function atualizarContadorCarrinho() {
    const contador = document.getElementById('contador-carrinho');
    if (contador) {
        contador.innerText = carrinho.length;
    }
}

function renderizarCarrinho() {
    const listaItens = document.getElementById('lista-itens-carrinho');
    const valorTotal = document.getElementById('valor-total-carrinho');

    if (!listaItens) return;

    listaItens.innerHTML = '';

    if (carrinho.length === 0) {
        listaItens.innerHTML = '<p style="text-align: center; color: #888; margin-top: 30px;">O seu carrinho está vazio.</p>';
        if (valorTotal) valorTotal.innerText = 'R$ 0,00';
        return;
    }

    let total = 0;

    carrinho.forEach((item, index) => {
        let precoNumerico = parseFloat(
            item.preco.replace('R$', '').replace('.', '').replace(',', '.').trim()
        ) || 0;

        total += precoNumerico;

        const divItem = document.createElement('div');
        divItem.className = 'item-carrinho';
        divItem.innerHTML = `
            <img src="${item.imagem}" alt="${item.titulo}">
            <div class="detalhes-item">
                <h4>${item.titulo}</h4>
                <p class="preco-item">${item.preco}</p>
            </div>
            <button type="button" class="btn-remover-item" onclick="removerDoCarrinho(${index})">
                <i data-lucide="trash-2"></i>
            </button>
        `;
        listaItens.appendChild(divItem);
    });

    if (valorTotal) {
        valorTotal.innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
    }

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}