// public/scripts/atualizar-paginas-jogos.js
// Reaplica a seção de detalhes (Sobre, Ficha Técnica e Destaques) e os preços
// atualizados em todas as páginas individuais existentes, usando os dados salvos em dados/jogos.json.
// Uso: node public/scripts/atualizar-paginas-jogos.js

const fs = require('fs');
const path = require('path');
const { gerarSecaoDetalhes } = require('./detalhesJogo');

const raiz = path.join(__dirname, '..', '..');
const jogos = JSON.parse(fs.readFileSync(path.join(raiz, 'dados', 'jogos.json'), 'utf-8'));

// Páginas extras que reutilizam a ficha de outro jogo
const ALIASES = { '/jogos/ps/ea-sports-ufc-6.html': 'ps-ufc6' };

const REGEX_SECAO = /(?:<!--\s*Detalhes do Produto[^>]*-->\s*)?<section class="detalhes-produto-container">[\s\S]*?<\/section>\s*/;
const REGEX_PRECO = /<h3 class="preco-jogo">[\s\S]*?<\/h3>/;

const paginas = new Map();
jogos.forEach(j => {
    if (j.link && j.link.startsWith('/jogos/') && !paginas.has(j.link)) paginas.set(j.link, j);
});
Object.entries(ALIASES).forEach(([link, id]) => {
    const jogo = jogos.find(j => j.id === id);
    if (jogo) paginas.set(link, jogo);
});

let ok = 0;
paginas.forEach((jogo, link) => {
    const arquivo = path.join(raiz, 'public', link);
    if (!fs.existsSync(arquivo)) {
        console.warn('Página não encontrada:', link);
        return;
    }
    let html = fs.readFileSync(arquivo, 'utf-8');
    const secao = gerarSecaoDetalhes(jogo);

    // 1. Atualiza seção de detalhes técnicos
    if (REGEX_SECAO.test(html)) {
        html = html.replace(REGEX_SECAO, secao + '\n        ');
    } else {
        html = html.replace(/<footer>/, secao + '\n        <footer>');
    }

    // 2. Atualiza bloco de preço com suporte a preço antigo / promoção
    const precoFormatado = jogo.preco.startsWith('R$') ? jogo.preco : `R$ ${jogo.preco}`;
    const precoAntigoLimpo = jogo.precoAntigo ? String(jogo.precoAntigo).replace('R$', '').trim() : '';
    const precoAntigoHtml = precoAntigoLimpo !== ''
        ? `<span class="preco-antigo-destaque" style="text-decoration: line-through; color: #ff5555; font-size: 1.15rem; margin-right: 12px; font-weight: normal;">R$ ${precoAntigoLimpo}</span>`
        : '';
    const novoPrecoBloco = `<h3 class="preco-jogo">${precoAntigoHtml}<span class="preco-atual">${precoFormatado}</span></h3>`;

    if (REGEX_PRECO.test(html)) {
        html = html.replace(REGEX_PRECO, novoPrecoBloco);
    }

    fs.writeFileSync(arquivo, html, 'utf-8');
    ok++;
});

console.log(`Páginas atualizadas com sucesso: ${ok}`);
