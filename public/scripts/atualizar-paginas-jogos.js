// public/scripts/atualizar-paginas-jogos.js
// Reaplica a seção de detalhes (Sobre, Ficha Técnica e Destaques), os preços e
// as tags de plataforma corretas (PS5 - Mídia Digital, Xbox - Mídia Digital, Steam - Mídia Digital)
// em todas as páginas individuais existentes, usando os dados salvos em dados/jogos.json.
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
const REGEX_TAG_PLAT = /<span class="tag-plataforma">[\s\S]*?<\/span>/;
const REGEX_INFO_CHAVE = /<li>🔑[\s\S]*?<\/li>/;

const paginas = new Map();
jogos.forEach(j => {
    if (j.link && j.link.startsWith('/jogos/') && !paginas.has(j.link)) paginas.set(j.link, j);
});
Object.entries(ALIASES).forEach(([link, id]) => {
    const jogo = jogos.find(j => j.id === id);
    if (jogo) paginas.set(link, jogo);
});

function obterTagPlataformaEInfo(jogo, link) {
    const cats = Array.isArray(jogo.categorias) && jogo.categorias.length > 0 
        ? jogo.categorias.map(c => c.toLowerCase()) 
        : [(jogo.categoria || jogo.plataforma || 'geral').toLowerCase()];

    if (cats.includes('xbox') || link.includes('/xbox/')) {
        return {
            tagPlat: 'Xbox - Mídia Digital',
            infoChave: 'Código de resgate oficial Xbox Live / Microsoft Store'
        };
    }
    if (cats.includes('ps') || link.includes('/ps/') || jogo.id === 'destaque-onimusha') {
        return {
            tagPlat: 'PS5 - Mídia Digital',
            infoChave: 'Código de resgate oficial PlayStation Network (PSN)'
        };
    }
    // Steam / PC
    return {
        tagPlat: 'Steam - Mídia Digital',
        infoChave: 'Código de resgate oficial Steam'
    };
}

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

    // 3. Atualiza tag de plataforma e informações da chave
    const { tagPlat, infoChave } = obterTagPlataformaEInfo(jogo, link);
    if (REGEX_TAG_PLAT.test(html)) {
        html = html.replace(REGEX_TAG_PLAT, `<span class="tag-plataforma">${tagPlat}</span>`);
    }
    if (REGEX_INFO_CHAVE.test(html)) {
        html = html.replace(REGEX_INFO_CHAVE, `<li>🔑 ${infoChave}</li>`);
    }

    fs.writeFileSync(arquivo, html, 'utf-8');
    ok++;
});

console.log(`Páginas atualizadas com sucesso: ${ok}`);
