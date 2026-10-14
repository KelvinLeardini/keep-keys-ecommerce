// 1. Importa o módulo 'express', que é o framework responsável por criar e gerenciar o servidor web
const express = require('express');

// 2. Importa o módulo 'path' (nativo do Node.js), usado para lidar com caminhos de pastas e arquivos no sistema
const path = require('path');

// 3. Inicializa a aplicação do Express chamando a função e armazenando na variável 'app'
const app = express();

// 4. Configura o Express para servir arquivos estáticos (HTML, CSS, JS, imagens)
// 'path.join(__dirname, 'public')' junta o caminho da pasta atual (__dirname) com a pasta 'public',
// fazendo com que tudo dentro de 'public' seja acessível direto na raiz do navegador
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para ler JSON no corpo das requisições e servir arquivos estáticos
app.use(express.json());

//---------------------------------------------------- API PARA BACKEND -------------------

const fs = require('fs');

const PORT = process.env.PORT || 3000;

// Middleware para ler JSON no corpo das requisições e servir arquivos estáticos
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Funções auxiliares para ler e salvar JSON
const lerArquivo = (caminho) => JSON.parse(fs.readFileSync(caminho, 'utf-8'));
const salvarArquivo = (caminho, dados) => fs.writeFileSync(caminho, JSON.stringify(dados, null, 2));

const caminhoUsuarios = path.join(__dirname, 'dados', 'usuarios.json');
const caminhoJogos = path.join(__dirname, 'dados', 'jogos.json');

// --- ROTA DE LOGIN COM ROLES ---
app.post('/api/login', (req, res) => {
    const { email, senha } = req.body;
    const usuarios = lerArquivo(caminhoUsuarios);

    const usuarioEncontrado = usuarios.find(u => u.email === email && u.senha === senha);

    if (usuarioEncontrado) {
        // Retorna os dados do usuário sem a senha, incluindo o tipo de acesso (role)
        const { senha, ...dadosUsuario } = usuarioEncontrado;
        return res.json({ sucesso: true, usuario: dadosUsuario });
    }

    return res.status(401).json({ sucesso: false, mensagem: 'E-mail ou senha inválidos' });
});

// --- ROTA DE CADASTRO ---
app.post('/api/cadastro', (req, res) => {
    const { nome, email, senha } = req.body;
    const usuarios = lerArquivo(caminhoUsuarios);

    const emailExiste = usuarios.find(u => u.email === email);
    if (emailExiste) {
        return res.status(400).json({ sucesso: false, mensagem: 'Este e-mail já está em uso.' });
    }

    const novoUsuario = {
        id: Date.now(), 
        nome,
        email,
        senha,
        role: 'cliente' 
    };

    usuarios.push(novoUsuario);
    salvarArquivo(caminhoUsuarios, usuarios);

    const { senha: _, ...dadosUsuario } = novoUsuario; 
    return res.status(201).json({ sucesso: true, usuario: dadosUsuario });
});

// --- GERADOR AUTOMÁTICO DE PÁGINAS INDIVIDUAIS DE JOGOS ---
function gerarSlug(texto) {
    return (texto || 'jogo')
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function obterCaminhoPagina(jogo) {
    const cat = (jogo.categoria || jogo.plataforma || 'outros').toLowerCase();
    let subpasta = cat;
    if (!['ps', 'xbox', 'steam'].includes(cat)) {
        subpasta = 'destaques';
    }
    const slug = gerarSlug(jogo.titulo);
    const nomeArquivo = `${slug}.html`;
    const pastaFisica = path.join(__dirname, 'public', 'jogos', subpasta);
    const caminhoFisico = path.join(pastaFisica, nomeArquivo);
    const linkPublico = `/jogos/${subpasta}/${nomeArquivo}`;
    return { pastaFisica, caminhoFisico, linkPublico };
}

function gerarHtmlPaginaJogo(jogo) {
    const cat = (jogo.categoria || jogo.plataforma || 'geral').toLowerCase();
    
    let tagPlat = 'Mídia Digital';
    let infoChave = 'Código de ativação oficial';

    if (cat === 'xbox') {
        tagPlat = 'Xbox Series X|S · Mídia Digital';
        infoChave = 'Código de resgate oficial Xbox Live / Microsoft Store';
    } else if (cat === 'ps') {
        tagPlat = 'PS5 / PS4 · Mídia Digital';
        infoChave = 'Código de resgate oficial PlayStation Network (PSN)';
    } else if (cat === 'steam') {
        tagPlat = 'PC · Mídia Digital';
        infoChave = 'Código de resgate oficial Steam';
    }

    const precoFormatado = jogo.preco.startsWith('R$') ? jogo.preco : `R$ ${jogo.preco}`;

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${jogo.titulo} - Keep Keys</title>
    <link rel="stylesheet" href="/css/style.css">
    <link rel="icon" href="/imagens/Logo-1.png" type="image/png">
</head>
<body>
    
    <aside>
        <div class="logo">
            <a href="/index.html" class="logo-link"><img src="/imagens/Logo-1.png" alt="logo da loja"></a>
        </div>

        <nav>
            <ul>
                <li><a href="/lancamentos.html">Lançamentos</a></li>
                <li><a href="/promocoes.html">Promoções</a></li>
                <hr class="divisoria">
                <li><a href="/jogos/ps/ps.html">Playstation</a></li>
                <li><a href="/jogos/xbox/xbox.html">Xbox</a></li>
                <li><a href="/jogos/steam/Steam.html">Steam</a></li>
            </ul>
        </nav>

        <div class="footer-redes">
            <div class="icones-redes">
                <a href="https://www.instagram.com/" aria-label="Instagram" target="_blank">
                    <svg class="lucide" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                        <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                    </svg>
                </a>
                <a href="https://www.facebook.com/" aria-label="Facebook" target="_blank">
                    <svg class="lucide" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                    </svg>
                </a>
            </div>
        </div>
    </aside>

    <!-- Modal de Login -->
    <div id="modal-login" class="modal-login">
        <div class="conteudo-modal">
            <span class="fechar-modal">&times;</span>
            <form id="form-login">
                <h2>Acessar Conta</h2>
                <input type="email" id="email" placeholder="Digite seu e-mail" required>
                <input type="password" id="senha" placeholder="Senha" required>
                <button type="submit">ENTRAR</button>
                <p style="text-align: center; margin-top: 15px; font-size: 0.9rem;">
                    Não tem uma conta? <a href="#" id="link-ir-cadastro" style="color: #ff0000;">Cadastre-se</a>
                </p>
            </form>
            <form id="form-cadastro" style="display: none;">
                <h2>Criar Nova Conta</h2>
                <input type="text" id="nome-cadastro" placeholder="Seu Nome" required>
                <input type="email" id="email-cadastro" placeholder="Seu E-mail" required>
                <input type="password" id="senha-cadastro" placeholder="Sua Senha" required>
                <button type="submit">CADASTRAR</button>
                <p style="text-align: center; margin-top: 15px; font-size: 0.9rem;">
                    Já tem uma conta? <a href="#" id="link-ir-login" style="color: #ff0000;">Faça login</a>
                </p>
            </form>
        </div>
    </div>

    <div class="site">
        <header>
            <button type="button" class="btn-hamburguer" id="btn-hamburguer" aria-label="Abrir Menu">
                <span></span><span></span><span></span>
            </button>

            <form action="#">
                <div class="buscar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input type="text" placeholder="Buscar jogos...">
                </div>
            </form>

            <div class="area-usuario">
                <div id="painel-usuario" class="painel-usuario" style="display: flex;">
                    <div id="carteira-saldo-header" class="carteira-saldo-header" title="Saldo disponível na Carteira Digital Keep Keys">
                        <i data-lucide="wallet"></i>
                        <span class="saldo-rotulo">Saldo:</span>
                        <span class="saldo-valor" id="valor-saldo-header">R$ 1.000,00</span>
                    </div>

                    <button type="button" id="btn-abrir-carrinho" class="btn-carrinho-icone" aria-label="Abrir Carrinho de Compras">
                        <i data-lucide="shopping-cart"></i>
                        <span id="contador-carrinho" class="contador-badge">0</span>
                    </button>

                    <div class="usuario-avatar-dropdown-container">
                        <button type="button" id="btn-avatar-header" class="btn-avatar-header" aria-label="Menu do Usuário" aria-haspopup="true" aria-expanded="false" title="Meu Perfil e Opções">
                            <img src="/imagens/avatar-gamer.svg" alt="Avatar do Gamer" class="img-avatar-header" id="header-avatar-img">
                            <span class="avatar-status-badge" id="header-avatar-badge" title="Online"></span>
                        </button>
                        <div id="dropdown-menu-avatar" class="dropdown-menu-avatar">
                            <div class="dropdown-usuario-topo">
                                <div class="dropdown-avatar-circulo">
                                    <img src="/imagens/avatar-gamer.svg" alt="Kelvin" id="dropdown-avatar-img">
                                </div>
                                <div class="dropdown-dados-usuario">
                                    <strong id="dropdown-nome-usuario">Kelvin</strong>
                                    <span id="dropdown-role-usuario" class="tag-categoria tag-ps">Cliente VIP</span>
                                </div>
                            </div>
                            <div class="dropdown-divisor"></div>
                            <a href="/perfil.html" class="dropdown-item">
                                <i data-lucide="user"></i>
                                <span>Meu Perfil</span>
                            </a>
                            <a href="/admin.html" id="dropdown-btn-admin" class="dropdown-item item-admin" style="display: none;">
                                <i data-lucide="shield"></i>
                                <span>Painel Admin</span>
                            </a>
                            <div class="dropdown-divisor"></div>
                            <button type="button" id="btn-sair-header" class="dropdown-item item-sair">
                                <i data-lucide="log-out"></i>
                                <span>Sair da Conta</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>

        <main class="blocos">
            <section class="bloco-1">
                <div class="jogo">
                    <img src="${jogo.imagem}" alt="${jogo.titulo}">
                </div>
            </section>

            <div class="coluna-direita">
                <div class="bloco-lateral">
                    <h2>${jogo.titulo}</h2>
                    <span class="tag-plataforma">${tagPlat}</span>
                    <h3 class="preco-jogo">${precoFormatado}</h3>

                    <div class="btns-jogo">
                        <button type="button" class="comprar-btn"><i data-lucide="shopping-cart"></i>COMPRAR AGORA</button>
                        <button type="button" class="desejo-btn" aria-label="Adicionar aos Favoritos"><i data-lucide="heart"></i></button>
                    </div>
                </div>

                <div class="bloco-lateral-2">
                    <h4>Informações da Chave:</h4>
                    <ul>
                        <li>⚡ Envio imediato por e-mail</li>
                        <li>🔑 ${infoChave}</li>
                        <li>🛡️ Garantia vitalícia contra bloqueios</li>
                    </ul>
                </div>
            </div>
        </main>

        <footer>
            <p>&copy; 2026 Keep Keys - Sua Loja Gamer. Todos os direitos reservados.</p>
            <ul>
                <li><a href="/suporte.html">Suporte</a></li>
                <li><a href="/sobre.html">Sobre Nós</a></li>
                <li><a href="/pagamentos.html">Pagamentos</a></li>
            </ul>
        </footer>
    </div>

    <!-- Modal / Gaveta do Carrinho de Compras -->
    <div id="modal-carrinho" class="modal-carrinho">
        <div class="conteudo-carrinho">
            <div class="cabecalho-carrinho">
                <h3><i data-lucide="shopping-bag"></i> Seu Carrinho</h3>
                <span id="fechar-carrinho" class="fechar-carrinho">&times;</span>
            </div>

            <div class="lista-itens-carrinho" id="lista-itens-carrinho"></div>

            <div class="rodape-carrinho">
                <div class="total-carrinho">
                    <span>Total:</span>
                    <strong id="valor-total-carrinho">R$ 0,00</strong>
                </div>
                <button type="button" class="btn-finalizar-compra">Finalizar Compra</button>
            </div>
        </div>
    </div>

    <!-- CDN do Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>
    <!-- Vincula o JavaScript principal -->
    <script src="/js/script.js"></script>
</body>
</html>`;
}

function salvarPaginaJogo(jogo) {
    const { pastaFisica, caminhoFisico, linkPublico } = obterCaminhoPagina(jogo);
    if (!fs.existsSync(pastaFisica)) {
        fs.mkdirSync(pastaFisica, { recursive: true });
    }
    const html = gerarHtmlPaginaJogo(jogo);
    fs.writeFileSync(caminhoFisico, html, 'utf-8');
    return linkPublico;
}

// --- ROTAS PARA OS JOGOS ---
app.get('/api/jogos', (req, res) => {
    const jogos = lerArquivo(caminhoJogos);
    res.json(jogos);
});

app.post('/api/jogos', (req, res) => {
    const jogos = lerArquivo(caminhoJogos);
    const dados = req.body;
    const categoria = dados.categoria || dados.plataforma || 'ps';
    const plataforma = dados.plataforma || dados.categoria || 'ps';
    const novoJogo = { 
        id: Date.now().toString(), 
        ...dados,
        categoria,
        plataforma
    };

    // Cria automaticamente a página individual do jogo se não tiver link manual
    try {
        const linkGerado = salvarPaginaJogo(novoJogo);
        novoJogo.link = novoJogo.link && novoJogo.link.trim() !== '' ? novoJogo.link : linkGerado;
    } catch (err) {
        console.error('Erro ao gerar página do jogo:', err);
    }

    jogos.push(novoJogo);
    salvarArquivo(caminhoJogos, jogos);
    res.status(201).json({ sucesso: true, jogo: novoJogo });
});

app.put('/api/jogos/:id', (req, res) => {
    const { id } = req.params;
    let jogos = lerArquivo(caminhoJogos);
    const index = jogos.findIndex(j => j.id === id);
    if (index === -1) {
        return res.status(404).json({ sucesso: false, mensagem: 'Jogo não encontrado' });
    }
    const categoria = req.body.categoria || req.body.plataforma || jogos[index].categoria;
    const plataforma = req.body.plataforma || req.body.categoria || jogos[index].plataforma;
    jogos[index] = { ...jogos[index], ...req.body, categoria, plataforma };

    try {
        const linkGerado = salvarPaginaJogo(jogos[index]);
        if (!jogos[index].link) jogos[index].link = linkGerado;
    } catch (err) {
        console.error('Erro ao atualizar página do jogo:', err);
    }

    salvarArquivo(caminhoJogos, jogos);
    res.json({ sucesso: true, jogo: jogos[index] });
});

app.delete('/api/jogos/:id', (req, res) => {
    const { id } = req.params;
    let jogos = lerArquivo(caminhoJogos);
    const jogo = jogos.find(j => j.id === id);
    if (jogo && jogo.link && jogo.link.startsWith('/jogos/')) {
        const caminhoArquivo = path.join(__dirname, 'public', jogo.link);
        if (fs.existsSync(caminhoArquivo)) {
            try { fs.unlinkSync(caminhoArquivo); } catch (e) { console.warn('Não foi possível remover arquivo:', e); }
        }
    }
    jogos = jogos.filter(j => j.id !== id);
    salvarArquivo(caminhoJogos, jogos);
    res.json({ sucesso: true });
});

module.exports = app;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Servidor Keep Keys rodando em http://localhost:${PORT}`);
    });
}

