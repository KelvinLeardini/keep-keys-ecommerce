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

    // 5. Inicializa o carrinho de compras e checkout
    inicializarCarrinho();
    atualizarContadorCarrinho();
    configurarFinalizarCompra();

    // 6. Inicializa o sistema de carteira digital e timer de 1 minuto
    inicializarCarteiraDigital();

    // 7. Inicializa sistema de favoritos
    configurarBotaoFavorito();

    // 8. Se estiver na página de perfil, inicializa a lógica do perfil
    inicializarPaginaPerfil();

    // 9. Carrega os jogos dinamicamente a partir do JSON / API
    carregarJogosDinamicos();

    // 10. Configura busca inicial e botões de compra
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

                const linkDestino = (jogo.link && jogo.link.trim() !== '') ? jogo.link : '#';

                const cardHtml = `
                    <article class="jogo-produtos" onclick="if(event.target.tagName !== 'BUTTON' && !event.target.closest('button')) { window.location.href='${linkDestino}'; }">
                        <img src="${jogo.imagem}" alt="${jogo.titulo}" width="200px">
                        <h4>${jogo.titulo}</h4>
                        ${precoAntigoHtml}
                        <p>${precoFormatado}</p>
                        <button type="button"><i data-lucide="shopping-cart"></i>COMPRAR</button>
                    </article>
                `;

                if (linkDestino !== '#') {
                    return `<a href="${linkDestino}" class="link-card-jogo">${cardHtml}</a>`;
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
        const btnPerfil = document.getElementById('btn-perfil-header');
        const saudacaoEl = painelUsuario ? painelUsuario.querySelector('span strong') : null;

        if (saudacaoEl) {
            saudacaoEl.innerText = nome;
        }

        if (estaLogado) {
            if (btnEntrar) btnEntrar.style.setProperty('display', 'none', 'important');
            if (painelUsuario) painelUsuario.style.setProperty('display', 'flex', 'important');
            if (btnPerfil) btnPerfil.style.setProperty('display', 'inline-flex', 'important');

            if (role === 'admin') {
                if (btnAdmin) btnAdmin.style.setProperty('display', 'inline-block', 'important');
            } else {
                if (btnAdmin) btnAdmin.style.setProperty('display', 'none', 'important');
            }
        } else {
            if (btnEntrar) btnEntrar.style.setProperty('display', 'inline-block', 'important');
            if (painelUsuario) painelUsuario.style.setProperty('display', 'none', 'important');
            if (btnPerfil) btnPerfil.style.setProperty('display', 'none', 'important');
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
            if (window.location.pathname.includes('perfil.html') || window.location.pathname.includes('admin.html')) {
                window.location.href = '/index.html';
            }
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
                    localStorage.setItem('usuarioEmail', dados.usuario.email);

                    // Inicializa a carteira se ainda não tiver
                    obterSaldoCarteira();

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
                    localStorage.setItem('usuarioEmail', dados.usuario.email);

                    obterSaldoCarteira();
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
//   CARTEIRA DIGITAL & RESET DE 1 MINUTO
// ==========================================
const TEMPO_RESET_MS = 60000; // 1 minuto (60 segundos)

function obterSaldoCarteira() {
    let saldo = localStorage.getItem('keepkeys_saldo');
    let ultimoReset = localStorage.getItem('keepkeys_ultimo_reset');
    const agora = Date.now();

    if (saldo === null || ultimoReset === null) {
        saldo = 1000.00;
        ultimoReset = agora;
        localStorage.setItem('keepkeys_saldo', saldo.toFixed(2));
        localStorage.setItem('keepkeys_ultimo_reset', ultimoReset.toString());
    } else {
        saldo = parseFloat(saldo);
        ultimoReset = parseInt(ultimoReset, 10);

        // Se já passou 1 minuto ou mais desde o último reset, recarrega para R$ 1.000,00
        if (agora - ultimoReset >= TEMPO_RESET_MS) {
            saldo = 1000.00;
            ultimoReset = agora;
            localStorage.setItem('keepkeys_saldo', saldo.toFixed(2));
            localStorage.setItem('keepkeys_ultimo_reset', ultimoReset.toString());
        }
    }

    const decorrido = agora - ultimoReset;
    const restanteMs = Math.max(0, TEMPO_RESET_MS - decorrido);
    const segundosRestantes = Math.ceil(restanteMs / 1000);

    return {
        saldo: saldo,
        segundosRestantes: segundosRestantes
    };
}

function salvarSaldoCarteira(novoSaldo) {
    localStorage.setItem('keepkeys_saldo', parseFloat(novoSaldo).toFixed(2));
    // Define o momento a partir do qual correrá 1 minuto para o próximo reset
    localStorage.setItem('keepkeys_ultimo_reset', Date.now().toString());
}

function inicializarCarteiraDigital() {
    // Loop de contagem regressiva para atualizar a UI em tempo real
    setInterval(() => {
        const { saldo, segundosRestantes } = obterSaldoCarteira();

        const saldoEl = document.getElementById('carteira-saldo');
        const timerTextoEl = document.getElementById('carteira-timer-texto');

        if (saldoEl) {
            saldoEl.innerText = `R$ ${saldo.toFixed(2).replace('.', ',')}`;
        }

        if (timerTextoEl) {
            if (saldo >= 1000) {
                timerTextoEl.innerText = 'Carteira cheia (R$ 1.000,00)';
            } else {
                timerTextoEl.innerText = `Reset automático em: ${segundosRestantes}s`;
            }
        }
    }, 1000);

    const btnRecarregar = document.getElementById('btn-recarregar-carteira');
    if (btnRecarregar) {
        btnRecarregar.onclick = () => {
            salvarSaldoCarteira(1000.00);
            const saldoEl = document.getElementById('carteira-saldo');
            if (saldoEl) saldoEl.innerText = 'R$ 1.000,00';
            alert('🎉 Carteira recarregada com sucesso para R$ 1.000,00!');
        };
    }
}

// ==========================================
//   SISTEMA DE FAVORITOS (desejo-btn)
// ==========================================
function obterFavoritos() {
    return JSON.parse(localStorage.getItem('keepkeys_favoritos')) || [];
}

function salvarFavoritos(favoritos) {
    localStorage.setItem('keepkeys_favoritos', JSON.stringify(favoritos));
}

function configurarBotaoFavorito() {
    const botaoDesejo = document.querySelector('.desejo-btn');
    if (!botaoDesejo) return;

    const tituloEl = document.querySelector('.bloco-lateral h2');
    if (!tituloEl) return;

    const titulo = tituloEl.innerText.trim();
    const favoritos = obterFavoritos();
    const jaFavoritado = favoritos.some(f => f.titulo.toLowerCase() === titulo.toLowerCase());

    if (jaFavoritado) {
        botaoDesejo.classList.add('ativo');
    }

    botaoDesejo.onclick = (e) => {
        e.preventDefault();

        const estaLogado = localStorage.getItem('usuarioLogado') === 'true';
        if (!estaLogado) {
            alert('Você precisa estar logado para favoritar jogos!');
            const modal = document.getElementById('modal-login');
            if (modal) modal.style.display = 'flex';
            return;
        }

        let lista = obterFavoritos();
        const index = lista.findIndex(f => f.titulo.toLowerCase() === titulo.toLowerCase());

        if (index !== -1) {
            // Remove dos favoritos
            lista.splice(index, 1);
            salvarFavoritos(lista);
            botaoDesejo.classList.remove('ativo');
            alert(`"${titulo}" foi removido dos seus favoritos.`);
        } else {
            // Adiciona aos favoritos
            const precoEl = document.querySelector('.preco-jogo');
            const imagemEl = document.querySelector('.bloco-1 .jogo img') || document.querySelector('.jogo img');

            const item = {
                titulo: titulo,
                preco: precoEl ? precoEl.innerText.trim() : 'R$ 0,00',
                imagem: imagemEl ? imagemEl.getAttribute('src') : '',
                link: window.location.pathname
            };

            lista.push(item);
            salvarFavoritos(lista);
            botaoDesejo.classList.add('ativo');
            alert(`❤️ "${titulo}" foi adicionado aos seus favoritos!`);
        }
    };
}

// ==========================================
//   LÓGICA DO CARRINHO & FINALIZAR COMPRA
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

function configurarFinalizarCompra() {
    const botoesFinalizar = document.querySelectorAll('.btn-finalizar-compra');
    botoesFinalizar.forEach(botao => {
        botao.onclick = () => {
            const estaLogado = localStorage.getItem('usuarioLogado') === 'true';
            if (!estaLogado) {
                alert('Você precisa estar logado para finalizar a compra!');
                const modal = document.getElementById('modal-login');
                if (modal) modal.style.display = 'flex';
                return;
            }

            if (carrinho.length === 0) {
                alert('Seu carrinho está vazio! Adicione jogos antes de finalizar.');
                return;
            }

            // Calcula o valor total do carrinho
            let totalCompra = 0;
            carrinho.forEach(item => {
                let precoNumerico = parseFloat(
                    item.preco.replace('R$', '').replace('.', '').replace(',', '.').trim()
                ) || 0;
                totalCompra += precoNumerico;
            });

            // Verifica o saldo da carteira digital
            const { saldo } = obterSaldoCarteira();

            if (saldo < totalCompra) {
                alert(`⚠️ Saldo insuficiente na Carteira Digital!\n\nSaldo Atual: R$ ${saldo.toFixed(2).replace('.', ',')}\nTotal da Compra: R$ ${totalCompra.toFixed(2).replace('.', ',')}\n\nAguarde o reset automático de 1 minuto para receber mais R$ 1.000,00 ou recarregue no seu perfil!`);
                return;
            }

            // Desconta da carteira
            const novoSaldo = saldo - totalCompra;
            salvarSaldoCarteira(novoSaldo);

            // Gera e adiciona os jogos à biblioteca de comprados
            const comprados = JSON.parse(localStorage.getItem('keepkeys_jogos_comprados')) || [];
            const dataAgora = new Date().toLocaleString('pt-BR');

            carrinho.forEach(item => {
                const randomKey = `KEEP-${Math.random().toString(36).substring(2,6).toUpperCase()}-${Math.random().toString(36).substring(2,6).toUpperCase()}-${Math.random().toString(36).substring(2,6).toUpperCase()}`;
                comprados.unshift({
                    id: Date.now().toString() + Math.random().toString(36).substring(2,4),
                    titulo: item.titulo,
                    preco: item.preco,
                    imagem: item.imagem,
                    chave: randomKey,
                    dataCompra: dataAgora,
                    link: item.link || '#'
                });
            });

            localStorage.setItem('keepkeys_jogos_comprados', JSON.stringify(comprados));

            // Salva histórico de transação
            const transacoes = JSON.parse(localStorage.getItem('keepkeys_transacoes')) || [];
            transacoes.unshift({
                id: Date.now(),
                tipo: 'Compra',
                valor: totalCompra,
                itensQtd: carrinho.length,
                data: dataAgora
            });
            localStorage.setItem('keepkeys_transacoes', JSON.stringify(transacoes));

            // Limpa o carrinho
            carrinho = [];
            salvarEAtualizar();
            renderizarCarrinho();

            // Fecha o modal do carrinho
            const modalCarrinho = document.getElementById('modal-carrinho');
            if (modalCarrinho) modalCarrinho.style.display = 'none';

            alert(`🎉 Compra realizada com sucesso!\n\nValor debitado: R$ ${totalCompra.toFixed(2).replace('.', ',')}\nSaldo restante da carteira: R$ ${novoSaldo.toFixed(2).replace('.', ',')}\n(O saldo será resetado para R$ 1.000,00 em 1 minuto para você continuar testando)\n\nSeus jogos foram adicionados à sua biblioteca!`);

            // Redireciona para o perfil para ver os jogos comprados
            window.location.href = '/perfil.html';
        };
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
            const linkPai = card.closest('a');

            if (tituloEl && precoEl && imagemEl) {
                const produto = {
                    titulo: tituloEl.innerText.trim(),
                    preco: precoEl.innerText.trim(),
                    imagem: imagemEl.getAttribute('src'),
                    link: linkPai ? linkPai.getAttribute('href') : '#'
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
                    imagem: imagemEl.getAttribute('src'),
                    link: window.location.pathname
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

// ==========================================
//   LÓGICA DA PÁGINA DE PERFIL (perfil.html)
// ==========================================
function inicializarPaginaPerfil() {
    const containerPerfil = document.querySelector('.perfil-container');
    if (!containerPerfil) return;

    const estaLogado = localStorage.getItem('usuarioLogado') === 'true';
    if (!estaLogado) {
        alert('Faça login para acessar seu perfil!');
        window.location.href = '/index.html';
        return;
    }

    // Carrega dados do usuário
    const nome = localStorage.getItem('usuarioNome') || 'Gamer';
    const email = localStorage.getItem('usuarioEmail') || 'gamer@keepkeys.com';
    const role = localStorage.getItem('usuarioRole') || 'cliente';

    const perfilNomeEl = document.getElementById('perfil-nome');
    const perfilEmailEl = document.getElementById('perfil-email');
    const perfilCargoEl = document.getElementById('perfil-cargo');

    if (perfilNomeEl) perfilNomeEl.innerText = nome;
    if (perfilEmailEl) perfilEmailEl.innerText = email;
    if (perfilCargoEl) {
        perfilCargoEl.innerText = role === 'admin' ? 'Administrador' : 'Cliente VIP';
        perfilCargoEl.className = role === 'admin' ? 'tag-categoria tag-promocao' : 'tag-categoria tag-ps';
    }

    // Controle de Abas do Perfil
    const botoesAba = document.querySelectorAll('.aba-perfil-btn');
    const secoesAba = document.querySelectorAll('.perfil-secao-aba');

    botoesAba.forEach(btn => {
        btn.onclick = () => {
            const abaAlvo = btn.dataset.aba;

            botoesAba.forEach(b => b.classList.remove('ativa'));
            btn.classList.add('ativa');

            secoesAba.forEach(secao => {
                if (secao.id === `aba-${abaAlvo}`) {
                    secao.style.display = 'block';
                    secao.classList.add('ativa');
                } else {
                    secao.style.display = 'none';
                    secao.classList.remove('ativa');
                }
            });

            if (typeof lucide !== 'undefined') lucide.createIcons();
        };
    });

    // Renderiza as seções
    renderizarJogosComprados();
    renderizarJogosFavoritos();
    renderizarExtrato();
}

function renderizarJogosComprados() {
    const grade = document.getElementById('grade-jogos-comprados');
    const contador = document.getElementById('contador-comprados');
    if (!grade) return;

    const comprados = JSON.parse(localStorage.getItem('keepkeys_jogos_comprados')) || [];
    if (contador) contador.innerText = comprados.length;

    if (comprados.length === 0) {
        grade.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; color: #888; padding: 40px 20px;">
                <i data-lucide="gamepad-2" style="width: 48px; height: 48px; margin-bottom: 15px; opacity: 0.5;"></i>
                <h3>Você ainda não tem jogos comprados</h3>
                <p style="margin-top: 5px;">Use sua carteira digital para testar a simulação de compra em qualquer jogo da loja!</p>
                <a href="/index.html" class="btn-acao-primario" style="display: inline-flex; margin-top: 15px;">Ir para a Loja</a>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    grade.innerHTML = comprados.map(jogo => `
        <article class="card-jogo-comprado">
            <img src="${jogo.imagem}" alt="${jogo.titulo}">
            <div class="detalhes-comprado">
                <div>
                    <h4>${jogo.titulo}</h4>
                    <span class="data-compra-tag">Comprado em: ${jogo.dataCompra}</span>
                </div>
                
                <div class="box-chave-digital">
                    <code>${jogo.chave}</code>
                    <button type="button" class="btn-copiar-chave" onclick="copiarChave('${jogo.chave}', this)">
                        <i data-lucide="copy"></i> Copiar
                    </button>
                </div>

                <a href="${jogo.link}" class="btn-acessar-jogo">
                    <i data-lucide="play"></i> Acessar Jogo
                </a>
            </div>
        </article>
    `).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function copiarChave(chave, botao) {
    navigator.clipboard.writeText(chave).then(() => {
        const textoOriginal = botao.innerHTML;
        botao.innerHTML = '<i data-lucide="check"></i> Copiado!';
        botao.style.backgroundColor = '#28a745';
        setTimeout(() => {
            botao.innerHTML = textoOriginal;
            botao.style.backgroundColor = '';
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }, 1500);
    }).catch(() => {
        alert(`Chave de resgate: ${chave}`);
    });
}

function renderizarJogosFavoritos() {
    const grade = document.getElementById('grade-jogos-favoritos');
    const contador = document.getElementById('contador-favoritos');
    if (!grade) return;

    const favoritos = obterFavoritos();
    if (contador) contador.innerText = favoritos.length;

    if (favoritos.length === 0) {
        grade.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; color: #888; padding: 40px 20px;">
                <i data-lucide="heart" style="width: 48px; height: 48px; margin-bottom: 15px; opacity: 0.5;"></i>
                <h3>Nenhum jogo favoritado ainda</h3>
                <p style="margin-top: 5px;">Clique no ícone de coração nas páginas de jogos para salvá-los aqui!</p>
                <a href="/index.html" class="btn-acao-primario" style="display: inline-flex; margin-top: 15px;">Explorar Jogos</a>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    grade.innerHTML = favoritos.map((jogo, index) => `
        <article class="jogo-produtos">
            <img src="${jogo.imagem}" alt="${jogo.titulo}" width="200px">
            <h4>${jogo.titulo}</h4>
            <p>${jogo.preco}</p>
            <div style="display: flex; gap: 8px; width: 100%;">
                <button type="button" style="flex: 1;" onclick="adicionarFavoritoAoCarrinho(${index})">
                    <i data-lucide="shopping-cart"></i> COMPRAR
                </button>
                <button type="button" style="background-color: #333; padding: 0 12px;" onclick="removerFavoritoDoPerfil(${index})" title="Remover dos Favoritos">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        </article>
    `).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function adicionarFavoritoAoCarrinho(index) {
    const favoritos = obterFavoritos();
    const jogo = favoritos[index];
    if (jogo) {
        adicionarAoCarrinho(jogo);
        alert(`"${jogo.titulo}" adicionado ao carrinho!`);
        const btnAbrir = document.getElementById('btn-abrir-carrinho');
        if (btnAbrir) btnAbrir.click();
    }
}

function removerFavoritoDoPerfil(index) {
    const favoritos = obterFavoritos();
    favoritos.splice(index, 1);
    salvarFavoritos(favoritos);
    renderizarJogosFavoritos();
}

function renderizarExtrato() {
    const container = document.getElementById('tabela-extrato-container');
    if (!container) return;

    const transacoes = JSON.parse(localStorage.getItem('keepkeys_transacoes')) || [];

    if (transacoes.length === 0) {
        container.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">Nenhuma transação registrada até o momento.</p>';
        return;
    }

    container.innerHTML = `
        <table class="admin-tabela">
            <thead>
                <tr>
                    <th>Data</th>
                    <th>Tipo</th>
                    <th>Quantidade de Itens</th>
                    <th>Valor Debitado</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${transacoes.map(t => `
                    <tr>
                        <td>${t.data}</td>
                        <td><span class="tag-categoria tag-ps">${t.tipo}</span></td>
                        <td>${t.itensQtd} jogo(s)</td>
                        <td style="color: #ff4444; font-weight: bold;">- R$ ${t.valor.toFixed(2).replace('.', ',')}</td>
                        <td><span style="color: #28a745; font-weight: bold;">Aprovado</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}