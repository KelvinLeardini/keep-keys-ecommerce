// public/scripts/detalhesJogo.js
// Gera a seção rica de detalhes individuais para cada jogo da Keep Keys.
// Atende a todos os requisitos solicitados:
// 1. Sinopse única
// 2. Requisitos de Sistema: Mínimos e Recomendados (para PC/Steam) e Especificações de Console (PS/Xbox)
// 3. Idiomas: Áudio (dublagem) e Legendas detalhados
// 4. Modos de Jogo: Singleplayer, Cooperativo, PvP, Cross-play, etc.
// 5. Idade Mínima / Classificação Indicativa Oficial (com selo e motivos)
// 6. Gênero do Jogo (tags e ficha)
// 7. Análises: Metacritic, Avaliação da Comunidade e Citações da Crítica

const path = require('path');
let dadosJogosIndividuais = {};
try {
    dadosJogosIndividuais = require(path.join(__dirname, '..', '..', 'dados', 'dadosJogosIndividuais.js'));
} catch (e) {
    try {
        dadosJogosIndividuais = require('../dadosJogosIndividuais.js');
    } catch (e2) {
        dadosJogosIndividuais = {};
    }
}

function esc(valor) {
    return String(valor == null ? '' : valor)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function paraLista(valor) {
    if (Array.isArray(valor)) return valor.map(v => String(v).trim()).filter(Boolean);
    if (typeof valor === 'string') return valor.split(/\r?\n|;/).map(v => v.trim()).filter(Boolean);
    return [];
}

const PLATAFORMAS = {
    ps: {
        nome: 'PlayStation',
        plataformas: 'PlayStation 5 / PlayStation 4',
        cliente: 'PlayStation Store',
        passo2: 'No console ou no app PlayStation, abra a <em>PlayStation Store</em> e selecione <em>"Resgatar códigos"</em>.'
    },
    xbox: {
        nome: 'Xbox',
        plataformas: 'Xbox Series X|S / Xbox One / PC',
        cliente: 'Microsoft Store',
        passo2: 'No console, abra a <em>Microsoft Store</em> e escolha <em>"Resgatar"</em> — ou acesse <em>redeem.microsoft.com</em>.'
    },
    steam: {
        nome: 'Steam',
        plataformas: 'PC (Steam / Windows)',
        cliente: 'Steam',
        passo2: 'No aplicativo Steam, clique no menu superior em <em>"Jogos"</em> e depois em <em>"Ativar um produto no Steam..."</em>.'
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
    const individual = (jogo.id && dadosJogosIndividuais[jogo.id]) || {};
    const det = { ...(jogo.detalhes || {}), ...individual };
    const plat = obterPlataforma(jogo, det);
    const titulo = esc(jogo.titulo);

    // Gêneros
    const generos = paraLista(det.generos || det.genero);
    const htmlGeneros = generos.length
        ? `<div class="tags-genero">${generos.map(g => `<span class="tag-genero">${esc(g)}</span>`).join('')}</div>`
        : '';

    // Sinopse
    const sinopse = paraLista(det.sinopse);
    const paragrafos = sinopse.length
        ? sinopse.map(p => `<p>${esc(p)}</p>`).join('\n                    ')
        : `<p>Adquira <strong>${titulo}</strong> com chave oficial, entrega instantânea e suporte completo.</p>`;

    // Análises e Recepção da Crítica
    const analises = det.analises || {};
    let htmlAnalises = '';
    if (analises.metacritic || analises.comunidade || analises.destaqueReview) {
        const metascore = analises.metacritic
            ? `<div class="badge-metacritic" title="Nota Metacritic">
                    <span class="metascore-numero">${esc(analises.metacritic)}</span>
                    <div class="metascore-texto">
                        <strong>Metascore</strong>
                        <span>${esc(analises.classificacaoCritica || 'Crítica Especializada')}</span>
                    </div>
               </div>`
            : '';

        const comunidade = analises.comunidade
            ? `<div class="badge-comunidade" title="Avaliação da Comunidade">
                    <i data-lucide="thumbs-up"></i>
                    <div>
                        <strong>Comunidade</strong>
                        <span style="display:block; font-size:0.75rem; color:#bbb;">${esc(analises.comunidade)}</span>
                    </div>
               </div>`
            : '';

        const review = analises.destaqueReview
            ? `<blockquote class="review-citacao">
                    "${esc(analises.destaqueReview.texto)}"
                    <cite>— ${esc(analises.destaqueReview.veiculo)} (${esc(analises.destaqueReview.nota)})</cite>
               </blockquote>`
            : '';

        htmlAnalises = `
                    <div class="bloco-analises-jogo">
                        <div class="analises-badges">
                            ${metascore}
                            ${comunidade}
                        </div>
                        ${review}
                    </div>`;
    }

    // Idiomas (Áudio e Legendas)
    let textoIdioma = '';
    if (det.idiomaAudio && det.idiomaLegendas) {
        textoIdioma = `<strong>Áudio:</strong> ${esc(det.idiomaAudio)}<br><strong>Legendas:</strong> ${esc(det.idiomaLegendas)}`;
    } else if (det.idioma) {
        textoIdioma = esc(det.idioma);
    } else {
        textoIdioma = 'Português (Brasil) — legendas e interface';
    }

    // Classificação Indicativa Oficial
    const classificacao = det.idadeMinima ? String(det.idadeMinima).toUpperCase() : (det.classificacao ? String(det.classificacao).toUpperCase() : '');
    const motivoClassificacao = det.motivoIdade ? `<span class="motivo-classificacao">${esc(det.motivoIdade)}</span>` : '';
    const htmlClassificacao = classificacao
        ? `<div class="classind-container"><span class="classind classind-${esc(classificacao.toLowerCase())}" aria-hidden="true">${esc(classificacao)}</span> <div><strong>${esc(CLASSIFICACOES[classificacao] || 'Classificação indicativa')}</strong>${motivoClassificacao}</div></div>`
        : '';

    // Itens da Ficha Técnica
    const ficha = [
        { icone: 'tag', rotulo: 'Gênero', valor: generos.length ? esc(generos.join(', ')) : '' },
        { icone: 'code-2', rotulo: 'Desenvolvedora', valor: esc(det.desenvolvedora) },
        { icone: 'building-2', rotulo: 'Publicadora', valor: esc(det.publicadora) },
        { icone: 'calendar', rotulo: 'Lançamento', valor: esc(det.lancamento) },
        { icone: 'monitor-smartphone', rotulo: 'Plataforma', valor: esc(det.plataformas || plat.plataformas) },
        { icone: 'languages', rotulo: 'Idiomas', valor: textoIdioma },
        { icone: 'users', rotulo: 'Modos de Jogo', valor: esc(det.modos) },
        { icone: 'key-round', rotulo: 'Tipo de Mídia', valor: `Chave Digital Oficial (${esc(plat.nome)})` },
        { icone: 'shield', rotulo: 'Classificação Indicativa', valor: htmlClassificacao }
    ].filter(item => item.valor);

    const htmlFicha = ficha.map(item => `
                        <div class="ficha-item">
                            <dt><i data-lucide="${item.icone}"></i> ${item.rotulo}</dt>
                            <dd>${item.valor}</dd>
                        </div>`).join('');

    // Requisitos de Sistema / Especificações Técnicas
    const req = det.requisitos || {};
    let htmlRequisitos = '';
    if (req.tipo === 'pc' && req.minimos && req.recomendados) {
        htmlRequisitos = `
                    <h3 class="titulo-secao-detalhe"><i data-lucide="cpu"></i> Requisitos de Sistema (PC / Steam)</h3>
                    <div class="tabela-requisitos-dupla">
                        <div class="coluna-requisitos-item">
                            <h4><i data-lucide="shield"></i> Requisitos Mínimos</h4>
                            <ul>
                                <li><strong>SO:</strong> ${esc(req.minimos.so)}</li>
                                <li><strong>Processador:</strong> ${esc(req.minimos.processador)}</li>
                                <li><strong>Memória:</strong> ${esc(req.minimos.memoria)}</li>
                                <li><strong>Placa de Vídeo:</strong> ${esc(req.minimos.placaVideo)}</li>
                                <li><strong>DirectX:</strong> ${esc(req.minimos.directx)}</li>
                                <li><strong>Armazenamento:</strong> ${esc(req.minimos.armazenamento)}</li>
                            </ul>
                        </div>
                        <div class="coluna-requisitos-item">
                            <h4><i data-lucide="zap"></i> Requisitos Recomendados</h4>
                            <ul>
                                <li><strong>SO:</strong> ${esc(req.recomendados.so)}</li>
                                <li><strong>Processador:</strong> ${esc(req.recomendados.processador)}</li>
                                <li><strong>Memória:</strong> ${esc(req.recomendados.memoria)}</li>
                                <li><strong>Placa de Vídeo:</strong> ${esc(req.recomendados.placaVideo)}</li>
                                <li><strong>DirectX:</strong> ${esc(req.recomendados.directx)}</li>
                                <li><strong>Armazenamento:</strong> ${esc(req.recomendados.armazenamento)}</li>
                            </ul>
                        </div>
                    </div>`;
    } else if (req.especificacoesConsole) {
        const esp = req.especificacoesConsole;
        htmlRequisitos = `
                    <h3 class="titulo-secao-detalhe"><i data-lucide="tv"></i> Especificações de Desempenho no Console</h3>
                    <div class="especificacoes-console-box">
                        <ul>
                            <li><strong>Resolução e Taxa de Quadros:</strong> ${esc(esp.resolucao)}</li>
                            <li><strong>Espaço em Disco:</strong> ${esc(esp.armazenamento)}</li>
                            <li><strong>Recursos Especiais:</strong> ${esc(esp.recursos)}</li>
                        </ul>
                    </div>`;
    } else if (det.armazenamento) {
        htmlRequisitos = `
                    <h3 class="titulo-secao-detalhe"><i data-lucide="hard-drive"></i> Armazenamento Necessário</h3>
                    <div class="especificacoes-console-box">
                        <ul>
                            <li><strong>Espaço em Disco:</strong> ${esc(det.armazenamento)}</li>
                        </ul>
                    </div>`;
    }

    // Destaques do Jogo
    const destaques = paraLista(det.destaques);
    const htmlDestaques = destaques.length ? `
                    <h3 class="titulo-secao-detalhe"><i data-lucide="star"></i> Destaques do Jogo</h3>
                    <ul class="lista-destaques">
                        ${destaques.map(d => `<li><i data-lucide="check-circle-2"></i><span>${esc(d)}</span></li>`).join('\n                        ')}
                    </ul>` : '';

    return `<!-- Detalhes do Produto: Sobre, Análises, Ficha Técnica, Requisitos e Destaques -->
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
                        <span>Chave 100% original e legítima</span>
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
                        <span>Mais de 1.500 clientes satisfeitos</span>
                    </div>
                </div>
            </div>

            <div class="grid-detalhes-jogo">
                <article class="card-detalhe-jogo">
                    <h3><i data-lucide="sparkles"></i> Sobre o Jogo</h3>
                    ${htmlGeneros}
                    ${paragrafos}

                    ${htmlAnalises}

                    <h3 class="titulo-secao-detalhe"><i data-lucide="file-text"></i> Ficha Técnica</h3>
                    <dl class="ficha-tecnica">${htmlFicha}
                    </dl>

                    ${htmlRequisitos}

                    ${htmlDestaques}
                </article>

                <aside class="card-detalhe-jogo" aria-label="Como resgatar sua chave">
                    <h3><i data-lucide="key"></i> Como Resgatar no ${esc(plat.nome)}</h3>
                    <div class="passos-ativacao">
                        <div class="passo-item">
                            <span class="passo-numero">1</span>
                            <div class="passo-texto">
                                <strong>Receba seu código</strong>
                                <p>Após a confirmação da compra, sua chave de ativação fica disponível instantaneamente na aba <em>"Jogos Comprados"</em> do seu perfil.</p>
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
                                <p>Insira a chave recebida, confirme o resgate e o jogo será vinculado permanentemente à sua biblioteca pessoal.</p>
                            </div>
                        </div>
                    </div>

                    <div class="aviso-compra-protegida">
                        <strong><i data-lucide="shield-alert"></i> Compra 100% Protegida</strong>
                        <p>Chaves autênticas adquiridas de distribuidoras autorizadas com garantia vitalícia contra revogações.</p>
                    </div>
                </aside>
            </div>
        </section>
`;
}

module.exports = { gerarSecaoDetalhes, esc };
