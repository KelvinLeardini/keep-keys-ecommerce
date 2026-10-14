// scripts/atualizar-paginas-jogos.js
// Reaplica a seção de detalhes (Sobre, Ficha Técnica e Destaques) em todas as
// páginas individuais existentes, usando os dados salvos em dados/jogos.json.
// Uso: node scripts/atualizar-paginas-jogos.js

const fs = require('fs');
const path = require('path');
const { gerarSecaoDetalhes } = require('../utils/detalhesJogo');

const raiz = path.join(__dirname, '..');
const jogos = JSON.parse(fs.readFileSync(path.join(raiz, 'dados', 'jogos.json'), 'utf-8'));

// Páginas extras que reutilizam a ficha de outro jogo
const ALIASES = { '/jogos/ps/ea-sports-ufc-6.html': 'ps-ufc6' };

const REGEX_SECAO = /(?:<!--\s*Detalhes do Produto[^>]*-->\s*)?<section class="detalhes-produto-container">[\s\S]*?<\/section>\s*/;

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

    if (REGEX_SECAO.test(html)) {
        html = html.replace(REGEX_SECAO, secao + '\n        ');
    } else {
        html = html.replace(/<footer>/, secao + '\n        <footer>');
    }
    fs.writeFileSync(arquivo, html, 'utf-8');
    ok++;
});

console.log(`Páginas atualizadas: ${ok}`);

