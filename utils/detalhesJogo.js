// utils/detalhesJogo.js
// Gera a seção de detalhes (Sobre, Ficha Técnica, Destaques e Resgate) de cada jogo
// a partir do objeto "detalhes" salvo em dados/jogos.json.
// Usado pelo gerador automático de páginas (server.js) e pelo script de atualização.

function esc(valor) {
    return String(valor == null ? '' : valor)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// Converte "texto; texto" ou array em array limpo
function paraLista(valor) {
    if (Array.isArray(valor)) return valor.map(v => String(v).trim()).filter(Boolean);
    if (typeof valor === 'string') return valor.split(/\r?\n|;/).map(v => v.trim()).filter(Boolean);
    return [];
}

const PLATAFORMAS = {
    ps: {
        nome: 'PlayStation',
        plataformas: 'PS5 / PS4',
        cliente: 'PlayStation Store',
        passo2: 'No console ou no app PlayStation, abra a <em>PlayStation Store</em> e selecione <em>"Resgatar códigos"</em>.'
    },
    xbox: {
        nome: 'Xbox',
        plataformas: 'Xbox Series X|S / Xbox One',
        cliente: 'Microsoft Store',
        passo2: 'No console, abra a <em>Microsoft Store</em> e escolha <em>"Resgatar"</em> — ou acesse <em>redeem.microsoft.com</em>.'
    },
    steam: {
        nome: 'Steam',
        plataformas: 'PC (Windows)',
        cliente: 'Steam',
        passo2: 'No aplicativo Steam, clique em <em>"Jogos"</em> e depois em <em>"Ativar um produto no Steam..."</em>.'
    }
};

const CLASSIFICACOES = {
    'L': 'Livre para todos os públicos',
    '10': 'Não recomendado para menores de 10 anos',
    '12': 'Não recomendado para menores de 12 anos',
    '14': 'Não recomendado para menores de 14 anos',
    '16': 'Não recomendado para menores de 16 anos',
    '18': 'Não recomendado para menores de 18 anos'
};

function obterPlataforma(jogo, det) {
    const chave = (det.resgate || jogo.categoria || jogo.plataforma || 'steam').toLowerCase();
    return PLATAFORMAS[chave] || PLATAFORMAS.steam;
}

function gerarSecaoDetalhes(jogo) {
    const det = jogo.detalhes || {};
    const plat = obterPlataforma(jogo, det);
    const titulo = esc(jogo.titulo);

    const generos = paraLista(det.genero);
    const sinopse = paraLista(det.sinopse);
    const destaques = paraLista(det.destaques);

    const paragrafos = sinopse.length
        ? sinopse.map(p => `<p>${esc(p)}</p>`).join('\n                    ')
        : `<p>Garanta <strong>${titulo}</strong> com entrega imediata e chave 100% original. Em breve publicaremos a descrição completa deste título.</p>`;

    const classificacao = det.classificacao ? String(det.classificacao).toUpperCase() : '';
    const htmlClassificacao = classificacao
        ? `<span class="classind classind-${esc(classificacao.toLowerCase())}" aria-hidden="true">${esc(classificacao)}</span> ${esc(CLASSIFICACOES[classificacao] || 'Classificação indicativa')}`
        : '';

    // Itens da ficha técnica (só exibe os que possuem valor)
    const ficha = [
        { icone: 'tag', rotulo: 'Gênero', valor: generos.length ? esc(generos.join(', ')) : '' },
        { icone: 'code-2', rotulo: 'Desenvolvedora', valor: esc(det.desenvolvedora) },
        { icone: 'building-2', rotulo: 'Publicadora', valor: esc(det.publicadora) },
        { icone: 'calendar', rotulo: 'Lançamento', valor: esc(det.lancamento) },
        { icone: 'monitor-smartphone', rotulo: 'Plataforma', valor: esc(det.plataformas || plat.plataformas) },
        { icone: 'languages', rotulo: 'Idioma', valor: esc(det.idioma || 'Português (BR) — legendas') },
        { icone: 'hard-drive', rotulo: 'Armazenamento', valor: esc(det.armazenamento) },
        { icone: 'users', rotulo: 'Modos de Jogo', valor: esc(det.modos) },
        { icone: 'key-round', rotulo: 'Tipo de Mídia', valor: `Digital (chave ${esc(plat.nome)})` },
        { icone: 'shield', rotulo: 'Classificação', valor: htmlClassificacao }
    ].filter(item => item.valor);

    const htmlFicha = ficha.map(item => `
                        <div class="ficha-item">
                            <dt><i data-lucide="${item.icone}"></i> ${item.rotulo}</dt>
                            <dd>${item.valor}</dd>
                        </div>`).join('');

    const htmlGeneros = generos.length
        ? `<div class="tags-genero">${generos.map(g => `<span class="tag-genero">${esc(g)}</span>`).join('')}</div>`
        : '';

    const htmlDestaques = destaques.length ? `
                    <h3 class="titulo-secao-detalhe"><i data-lucide="star"></i> Destaques do Jogo</h3>
                    <ul class="lista-destaques">
                        ${destaques.map(d => `<li><i data-lucide="check-circle-2"></i><span>${esc(d)}</span></li>`).join('\n                        ')}
                    </ul>` : '';

    return `<!-- Detalhes do Produto: Sobre, Ficha Técnica e Destaques -->
        <section class="detalhes-produto-container">
            <div class="secao-info-badges">
                <div class="info-badge-card">
                    <div class="badge-icone"><i data-lucide="zap"></i></div>
                    <div class="badge-texto">
                        <strong>Envio Instantâneo</strong>
                        <span>Chave entregue em segundos</span>
                    </div>
                </div>
                <div class="info-badge-card">
                    <div class="badge-icone"><i data-lucide="shield-check"></i></div>
                    <div class="badge-texto">
                        <strong>Garantia Vitalícia</strong>
                        <span>Chave 100% original</span>
                    </div>
                </div>
                <div class="info-badge-card">
                    <div class="badge-icone"><i data-lucide="headset"></i></div>
                    <div class="badge-texto">
                        <strong>Suporte Gamer 24/7</strong>
                        <span>Atendimento especializado</span>
                    </div>
                </div>
                <div class="info-badge-card">
                    <div class="badge-icone"><i data-lucide="award"></i></div>
                    <div class="badge-texto">
                        <strong>Avaliação 4.9/5</strong>
                        <span>Mais de 1.500 clientes</span>
                    </div>
                </div>
            </div>

            <div class="grid-detalhes-jogo">
                <article class="card-detalhe-jogo">
                    <h3><i data-lucide="sparkles"></i> Sobre o Jogo</h3>
                    ${htmlGeneros}
                    ${paragrafos}

                    <h3 class="titulo-secao-detalhe"><i data-lucide="file-text"></i> Ficha Técnica</h3>
                    <dl class="ficha-tecnica">${htmlFicha}
                    </dl>
                    ${htmlDestaques}
                </article>

                <aside class="card-detalhe-jogo" aria-label="Como resgatar sua chave">
                    <h3><i data-lucide="key"></i> Como Resgatar no ${esc(plat.nome)}</h3>
                    <div class="passos-ativacao">
                        <div class="passo-item">
                            <span class="passo-numero">1</span>
                            <div class="passo-texto">
                                <strong>Receba seu código</strong>
                                <p>Após a confirmação da compra, sua chave fica disponível na aba <em>"Jogos Comprados"</em> do seu perfil.</p>
                            </div>
                        </div>
                        <div class="passo-item">
                            <span class="passo-numero">2</span>
                            <div class="passo-texto">
                                <strong>Acesse a ${esc(plat.cliente)}</strong>
                                <p>${plat.passo2}</p>
                            </div>
                        </div>
                        <div class="passo-item">
                            <span class="passo-numero">3</span>
                            <div class="passo-texto">
                                <strong>Ative e jogue</strong>
                                <p>Digite o código recebido, confirme o resgate e o jogo será adicionado permanentemente à sua biblioteca.</p>
                            </div>
                        </div>
                    </div>

                    <div class="aviso-compra-protegida">
                        <strong><i data-lucide="shield-alert"></i> Compra 100% Protegida</strong>
                        <p>Chaves adquiridas de distribuidoras oficiais, com garantia vitalícia contra revogações.</p>
                    </div>
                </aside>
            </div>
        </section>
`;
}

module.exports = { gerarSecaoDetalhes, esc };

