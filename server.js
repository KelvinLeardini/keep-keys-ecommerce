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
    salvarArquivo(caminhoJogos, jogos);
    res.json({ sucesso: true, jogo: jogos[index] });
});

app.delete('/api/jogos/:id', (req, res) => {
    const { id } = req.params;
    let jogos = lerArquivo(caminhoJogos);
    jogos = jogos.filter(j => j.id !== id);
    salvarArquivo(caminhoJogos, jogos);
    res.json({ sucesso: true });
});

app.listen(PORT, () => {
    console.log(`Servidor Keep Keys rodando em http://localhost:${PORT}`);
});

