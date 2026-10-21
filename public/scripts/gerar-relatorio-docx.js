// public/scripts/gerar-relatorio-docx.js
// Gera o arquivo RELATORIO_PROJETO_KEEP_KEYS.docx com formatação visual e técnica profissional.

const fs = require('fs');
const path = require('path');
const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    Table,
    TableRow,
    TableCell,
    WidthType,
    AlignmentType,
    BorderStyle,
    ShadingType,
    Header,
    Footer,
    PageNumber,
    NumberFormat
} = require('docx');

const CORES = {
    AZUL_PRIMARIO: '08469E',
    AZUL_ESCURO: '051D40',
    CIANO: '00A8B5',
    CINZA_ESCURO: '1C1C24',
    CINZA_TEXTO: '333333',
    CINZA_CLARO: 'F4F6F9',
    CINZA_BORDA: 'D0D7DE',
    BRANCO: 'FFFFFF',
    VERDE: '28A745',
    VERMELHO: 'CC0000'
};

function criarBordaSimples(cor = CORES.CINZA_BORDA, tamanho = 4) {
    return {
        top: { style: BorderStyle.SINGLE, size: tamanho, color: cor },
        bottom: { style: BorderStyle.SINGLE, size: tamanho, color: cor },
        left: { style: BorderStyle.SINGLE, size: tamanho, color: cor },
        right: { style: BorderStyle.SINGLE, size: tamanho, color: cor }
    };
}

function criarParagrafoTitulo1(texto) {
    return new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 360, after: 140 },
        children: [
            new TextRun({
                text: texto,
                bold: true,
                size: 32, // 16pt
                color: CORES.AZUL_PRIMARIO,
                font: 'Calibri'
            })
        ]
    });
}

function criarParagrafoTitulo2(texto) {
    return new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 260, after: 100 },
        children: [
            new TextRun({
                text: texto,
                bold: true,
                size: 26, // 13pt
                color: CORES.AZUL_ESCURO,
                font: 'Calibri'
            })
        ]
    });
}

function criarParagrafoTitulo3(texto) {
    return new Paragraph({
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 180, after: 80 },
        children: [
            new TextRun({
                text: texto,
                bold: true,
                size: 22, // 11pt
                color: CORES.CIANO,
                font: 'Calibri'
            })
        ]
    });
}

function criarParagrafoTexto(texto, bold = false) {
    return new Paragraph({
        spacing: { before: 60, after: 100, line: 276 },
        children: [
            new TextRun({
                text: texto,
                bold: bold,
                size: 22, // 11pt
                color: CORES.CINZA_TEXTO,
                font: 'Calibri'
            })
        ]
    });
}

function criarItemLista(titulo, descricao) {
    return new Paragraph({
        bullet: { level: 0 },
        spacing: { before: 40, after: 60, line: 260 },
        children: [
            new TextRun({
                text: titulo + ': ',
                bold: true,
                size: 22,
                color: CORES.CINZA_ESCURO,
                font: 'Calibri'
            }),
            new TextRun({
                text: descricao,
                bold: false,
                size: 22,
                color: CORES.CINZA_TEXTO,
                font: 'Calibri'
            })
        ]
    });
}

function criarCaixaDestaque(titulo, texto) {
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        shading: { type: ShadingType.CLEAR, fill: CORES.CINZA_CLARO },
                        borders: {
                            top: { style: BorderStyle.NONE },
                            bottom: { style: BorderStyle.NONE },
                            right: { style: BorderStyle.NONE },
                            left: { style: BorderStyle.SINGLE, size: 24, color: CORES.AZUL_PRIMARIO }
                        },
                        margins: { top: 140, bottom: 140, left: 180, right: 180 },
                        children: [
                            new Paragraph({
                                spacing: { after: 60 },
                                children: [
                                    new TextRun({
                                        text: '💡 ' + titulo,
                                        bold: true,
                                        size: 22,
                                        color: CORES.AZUL_PRIMARIO,
                                        font: 'Calibri'
                                    })
                                ]
                            }),
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: texto,
                                        size: 20,
                                        color: CORES.CINZA_TEXTO,
                                        font: 'Calibri'
                                    })
                                ]
                            })
                        ]
                    })
                ]
            })
        ]
    });
}

function criarTabelaResumo(cabecalhos, linhas) {
    const headerRow = new TableRow({
        tableHeader: true,
        children: cabecalhos.map(texto => new TableCell({
            shading: { type: ShadingType.CLEAR, fill: CORES.AZUL_PRIMARIO },
            borders: criarBordaSimples(CORES.AZUL_ESCURO),
            margins: { top: 100, bottom: 100, left: 120, right: 120 },
            children: [
                new Paragraph({
                    alignment: AlignmentType.LEFT,
                    children: [
                        new TextRun({
                            text: texto,
                            bold: true,
                            size: 20,
                            color: CORES.BRANCO,
                            font: 'Calibri'
                        })
                    ]
                })
            ]
        }))
    });

    const bodyRows = linhas.map((linha, idx) => new TableRow({
        children: linha.map(coluna => new TableCell({
            shading: { type: ShadingType.CLEAR, fill: idx % 2 === 0 ? CORES.BRANCO : CORES.CINZA_CLARO },
            borders: criarBordaSimples(CORES.CINZA_BORDA),
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: coluna,
                            size: 20,
                            color: CORES.CINZA_TEXTO,
                            font: 'Calibri'
                        })
                    ]
                })
            ]
        }))
    }));

    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [headerRow, ...bodyRows]
    });
}

async function gerarDocumento() {
    console.log('Construindo documento Word (.docx)...');

    const filhos = [
        // ==========================================
        // CAPA / CABEÇALHO INSTITUCIONAL
        // ==========================================
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 120 },
            children: [
                new TextRun({
                    text: 'FACULDADE DE TECNOLOGIA — CURSO SUPERIOR DE TECNOLOGIA',
                    bold: true,
                    size: 20,
                    color: '666666',
                    font: 'Calibri'
                })
            ]
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 40, after: 300 },
            children: [
                new TextRun({
                    text: 'ANÁLISE E DESENVOLVIMENTO DE SISTEMAS (ADS) — 2026',
                    bold: true,
                    size: 22,
                    color: CORES.AZUL_ESCURO,
                    font: 'Calibri'
                })
            ]
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 300, after: 160 },
            children: [
                new TextRun({
                    text: '🎮 RELATÓRIO TÉCNICO & GUIA DE APRESENTAÇÃO',
                    bold: true,
                    size: 38, // 19pt
                    color: CORES.AZUL_PRIMARIO,
                    font: 'Calibri'
                })
            ]
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 60, after: 400 },
            children: [
                new TextRun({
                    text: 'KEEP KEYS — PLATAFORMA E-COMMERCE DE LICENCIAMENTO DE JOGOS DIGITAIS',
                    bold: true,
                    size: 26,
                    color: CORES.CIANO,
                    font: 'Calibri'
                })
            ]
        }),

        // Tabela de Identificação da Equipe
        criarTabelaResumo(
            ['Integrante', 'Semestre', 'Papel no Projeto / Responsabilidade Técnica'],
            [
                ['Kelvin Leardini', '1º Semestre', 'Líder Técnico, Engenharia Front-End, Lógica JavaScript e Arquitetura'],
                ['Yago Bafume', '1º Semestre', 'Análise de Requisitos, Modelagem de Sistemas e Testes'],
                ['Victor Hugo', '1º Semestre', 'Análise de Sistemas, Fluxos de Usuário e Validação de Regras'],
                ['Gustavo Bernardes', '2º Semestre', 'Análise de Sistemas, Apoio Técnico e Revisão']
            ]
        ),

        new Paragraph({ spacing: { after: 200 }, children: [] }),

        // ==========================================
        // 1. INTRODUÇÃO E CONTEXTUALIZAÇÃO
        // ==========================================
        criarParagrafoTitulo1('1. Introdução e Contextualização do Projeto'),
        criarParagrafoTexto(
            'O projeto Keep Keys consiste em uma aplicação web de comércio eletrônico completa e imersiva voltada à venda e ao licenciamento de chaves (keys) de ativação digital de jogos para os três principais ecossistemas do mercado mundial de entretenimento eletrônico: PlayStation 5 (PS5), Xbox Series X|S e PC (Steam).'
        ),
        criarParagrafoTexto(
            'Projetado como trabalho integrador da disciplina de Front-End no curso de Análise e Desenvolvimento de Sistemas (ADS), o Keep Keys teve como premissa essencial demonstrar domínio aprofundado dos fundamentos de engenharia web. A loja foi construída utilizando Vanilla JavaScript (sem frameworks pesados na vitrine pública), garantindo renderização ultra rápida, total controle da árvore do DOM e fidelidade aos padrões modernos da W3C.'
        ),
        criarCaixaDestaque(
            'Objetivo Pedagógico do Projeto',
            'Comprovar na prática a capacidade da equipe de conceber, arquitetar e entregar uma aplicação e-commerce resiliente, com catálogo dinâmico de 37 títulos, fluxo completo de carrinho, autenticação com controle de acesso (RBAC), carteira virtual e painel de controle administrativo em Vue.js 3.'
        ),

        // ==========================================
        // 2. ARQUITETURA TÉCNICA E TECNOLOGIAS
        // ==========================================
        criarParagrafoTitulo1('2. Arquitetura de Software e Tecnologias Empregadas'),
        criarParagrafoTexto(
            'A arquitetura do Keep Keys adota uma separação rigorosa de responsabilidades entre apresentação, regras de negócio e persistência de dados:'
        ),
        criarItemLista('HTML5 Semântico', 'Uso estrito de tags semânticas (<header>, <nav>, <main>, <section>, <article>, <aside>, <dl>, <dt>, <dd>, <footer>) garantindo SEO otimizado e total compatibilidade com leitores de tela e acessibilidade (a11y).'),
        criarItemLista('CSS3 Moderno & Design System Dark Gamer', 'Estilização própria com paleta gamer profissional (#08469E, #00f2fe, #1c1c24, #23232c), layout adaptativo através de CSS Grid e Flexbox, tipografia moderna e responsividade total com Breakpoints mobile-first.'),
        criarItemLista('JavaScript ES6+ Vanilla (Core da Loja)', 'Manipulação avançada de DOM, funções assíncronas (async/await), Fetch API com cascata de contingência, gerenciamento de eventos e persistência no lado do cliente via Web Storage API (localStorage).'),
        criarItemLista('Vue.js 3 (Painel Administrativo)', 'Utilizado no módulo restrito de governança (/admin.html) para proporcionar reatividade instantânea, two-way data binding no formulário de cadastro e reatividade dinâmica nos cards de estatísticas.'),
        criarItemLista('Node.js & Express (Servidor e API REST)', 'Servidor web local servindo estáticos e fornecendo rotas RESTful (/api/jogos, /api/login, /api/cadastro) com persistência em arquivos físicos JSON.'),
        criarItemLista('Lucide Icons', 'Coleção completa de ícones em formato SVG vetorizado, garantindo estética visual refinada e carregamento leve sem o peso de fontes de ícones legadas.'),

        new Paragraph({ spacing: { after: 140 }, children: [] }),

        // ==========================================
        // 3. PASSO A PASSO DE TODAS AS TELAS E MÓDULOS
        // ==========================================
        criarParagrafoTitulo1('3. Especificação Detalhada de Telas e Módulos do Sistema'),
        criarParagrafoTexto(
            'A seguir, detalha-se cada página e subsistema construído no Keep Keys, estruturado para que a equipe possa apresentar ao professor cada funcionalidade com precisão:'
        ),

        criarParagrafoTitulo2('3.1. Página Inicial / Vitrine Principal (index.html)'),
        criarItemLista('Carrossel de Banners Clicáveis', 'Área de destaque rotativa com transição suave, controles manuais de avançar/voltar e imagens que funcionam como botões direcionando diretamente para as páginas individuais dos jogos promovidos.'),
        criarItemLista('Mecanismo de Busca em Tempo Real', 'Barra de pesquisa inteligente que reage ao evento de digitação (oninput), filtrando instantaneamente os cards de jogos exibidos na tela com transição CSS suave, sem exigir clique em botões nem recarregamento de página.'),
        criarItemLista('Grade de Jogos em Destaque', 'Vitrine renderizada dinamicamente a partir da base de dados, exibindo pôster, título, preço com formatação brasileira (R$) e botão de compra com feedback visual imediato.'),

        criarParagrafoTitulo2('3.2. Segmentação por Plataformas (PlayStation, Xbox e Steam)'),
        criarParagrafoTexto(
            'O catálogo foi estruturado com páginas dedicadas para cada grande ecossistema gamer, permitindo filtragem temática natural:'
        ),
        criarItemLista('PlayStation 5 (public/jogos/ps/ps.html)', 'Logotipo oficial da marca, banner temático azul e vitrine exclusiva de títulos como GTA VI, Ghost of Tsushima, Bloodborne, Marvel Spider-Man, The Last of Us Part I e Part II.'),
        criarItemLista('Xbox Series X|S (public/jogos/xbox/xbox.html)', 'Identidade visual verde Xbox, banners de Forza Horizon, Halo Infinite, Gears 5, Starfield, Senua Hellblade II e Microsoft Flight Simulator.'),
        criarItemLista('Steam / PC (public/jogos/steam/Steam.html)', 'Vitrine de jogos para computador com títulos como Warhammer 40k: Space Marine 2, Red Dead Redemption 2, EA Sports FC 27, Stray, Tekken 8 e The Isle.'),

        criarParagrafoTitulo2('3.3. Lançamentos e Pré-Vendas (public/lancamentos.html)'),
        criarParagrafoTexto(
            'Página com banners promocionais panorâmicos de alta resolução para os títulos mais esperados da indústria (GTA VI, EA SPORTS FC 27 e UFC 6), contendo botões de ação direta "RESERVE JÁ" que encaminham o consumidor para a página de aquisição antecipada.'
        ),

        criarParagrafoTitulo2('3.4. Sistema Avançado de Promoções (public/promocoes.html)'),
        criarParagrafoTexto(
            'Um dos módulos centrais aprimorados no projeto, focado na atração e conversão:'
        ),
        criarItemLista('Badges Dinâmicas de Desconto', 'Cálculo automatizado em tempo real da porcentagem de desconto com base no preço original (ex: -50%, -67%, -48%), exibido em selo vermelho no canto superior do pôster.'),
        criarItemLista('Preço Antigo Tachado', 'Formatação visual em vermelho riscado do valor anterior (ex: de R$ 299,90 por R$ 149,90), fornecendo transparência na economia obtida pelo consumidor.'),
        criarItemLista('Sincronização Bidirecional', 'O jogo em oferta aparece tanto na página da sua plataforma de origem quanto na aba geral de promoções, mantendo sempre o mesmo ID, mesmo link e mesmo preço sincronizado no carrinho.'),
        criarItemLista('Garantia Contra Páginas Vazias', 'Cards de contingência estáticos integrados no HTML garantem que a página nunca abra em branco, mesmo em conexões lentas ou ao abrir o arquivo via file:// sem servidor web.'),

        criarParagrafoTitulo2('3.5. As 37 Páginas Individuais de Jogos (public/jogos/**/*.html)'),
        criarParagrafoTexto(
            'Cada jogo possui uma página exclusiva, completa e com ficha técnica profissional que simula grandes plataformas como Steam e PlayStation Store:'
        ),
        criarItemLista('Hero Section & Compra', 'Pôster oficial, título do jogo, tag padronizada (PS5 - Mídia Digital, Xbox - Mídia Digital ou Steam - Mídia Digital), preço em destaque, botão de compra e botão de favoritos (coração).'),
        criarItemLista('Informações da Chave', 'Garantia de envio imediato por e-mail, indicação clara do código oficial de ativação (Steam, PSN ou Xbox Live) e garantia vitalícia contra bloqueios.'),
        criarItemLista('Avaliações da Crítica & Comunidade', 'Painel de autoridade exibindo o Metascore oficial do Metacritic (ex: 97 para GTA VI, 96 para Elden Ring), índice de aprovação da comunidade de jogadores e citações autênticas de veículos de imprensa (IGN, Voxel, The Enemy).'),
        criarItemLista('Ficha Técnica Completa', 'Gênero detalhado, estúdio desenvolvedor, publicadora, data de lançamento, plataformas compatíveis e suporte de idiomas (detalhando áudio original e legendas em Português do Brasil).'),
        criarItemLista('Requisitos de Sistema ou Hardware', 'Para jogos de PC: tabela com requisitos Mínimos e Recomendados (Sistema Operacional, Processador, Memória RAM, Placa de Vídeo, DirectX e Armazenamento). Para jogos de console: especificações de desempenho (4K dinâmico, 60 FPS, suporte a Ray Tracing e feedback háptico do controle).'),
        criarItemLista('Guia Passo a Passo de Ativação', 'Card lateral limpo com passos numerados explicando exatamente como resgatar o código na loja oficial da respectiva plataforma.'),

        criarParagrafoTitulo2('3.6. Sistema de Autenticação e Controle de Acesso (RBAC)'),
        criarItemLista('Modal Unificado de Login e Cadastro', 'Janela modal animada que permite ao usuário alternar entre login e cadastro de nova conta sem sair da página atual.'),
        criarItemLista('Controle Baseado em Papéis (Roles)', 'Diferenciação clara entre dois perfis: "Cliente VIP" (acesso a compras, biblioteca e carteira) e "Administrador" (acesso irrestrito ao painel de gestão).'),
        criarItemLista('Proteção de Ações', 'Tentativas de adicionar itens ao carrinho ou favoritar jogos sem estar autenticado abrem automaticamente o modal de login com alerta amigável.'),

        criarParagrafoTitulo2('3.7. Carrinho de Compras Interativo e Checkout'),
        criarItemLista('Gaveta do Carrinho (Drawer Modal)', 'Menu deslizante acessível pelo ícone no cabeçalho, exibindo foto, título e preço de cada item adicionado, contador badge em tempo real e botão de remoção rápida.'),
        criarItemLista('Cálculo em Padrão Brasileiro', 'Algoritmo de parsing monetário que converte valores em reais com pontuação brasileira, acumulando subtotais e totais sem erros de arredondamento.'),
        criarItemLista('Página de Checkout (checkout.html)', 'Resumo dos jogos selecionados, formulário de e-mail para envio da chave e escolha do método de pagamento (Carteira Digital, PIX ou Cartão de Crédito).'),

        criarParagrafoTitulo2('3.8. Economia Virtual e Carteira Digital (perfil.html)'),
        criarItemLista('Carteira Digital Keep Keys', 'Saldo virtual associado ao usuário exibido no cabeçalho de todas as páginas e no perfil.'),
        criarItemLista('Recarga Automática para Avaliação (Timer de 1 min)', 'Rotina JavaScript temporizada que verifica o tempo de sessão e injeta R$ 1.000,00 adicionais a cada 1 minuto de inatividade/uso, permitindo que o professor e avaliadores comprem jogos repetidamente sem esgotamento de saldo.'),
        criarItemLista('Biblioteca de Jogos Comprados', 'Após finalizar a compra, o sistema gera chaves de ativação digitais simuladas e arquiva o título na biblioteca do perfil do cliente.'),
        criarItemLista('Painel de Favoritos', 'Listagem de todos os jogos marcados pelo usuário com o ícone de coração, com atalho direto para aquisição.'),

        criarParagrafoTitulo2('3.9. Painel Administrativo de Gestão (admin.html + admin.js)'),
        criarParagrafoTexto(
            'Módulo de governança corporativa da loja construído em Vue.js 3:'
        ),
        criarItemLista('Dashboard com Métricas Reativas', 'Cards com contagem dinâmica de jogos: Total Cadastrado, PlayStation, Steam, Xbox e Promoções ativas.'),
        criarItemLista('Catálogo de Jogos com Filtros Rápidos', 'Filtros em abas com contadores em tempo real e barra de busca instantânea no catálogo.'),
        criarItemLista('Formulário Multi-Categorias (CRUD)', 'Permite cadastrar ou editar títulos marcando múltiplas categorias simultâneas (ex: PlayStation + Promoção, ou Steam + Destaque + Promoção).'),
        criarItemLista('Automação de Promoções no Cadastro', 'Watcher reativo que monitora o campo "Preço Antigo": ao digitar um valor, o sistema inclui automaticamente a categoria "Promoção" e sincroniza com a loja.'),

        criarParagrafoTitulo2('3.10. Páginas Institucionais (Sobre Nós e Suporte)'),
        criarItemLista('Sobre Nós (sobre.html)', 'Apresentação da empresa fictícia Keep Keys, missão, visão, compromisso com chaves 100% originais e garantia vitalícia.'),
        criarItemLista('Suporte & FAQ (suporte.html)', 'Central de atendimento com perguntas frequentes (prazos de envio imediato, como resgatar chaves, política de garantia e suporte ao cliente).'),

        new Paragraph({ spacing: { after: 140 }, children: [] }),

        // ==========================================
        // 4. DESAFIOS TÉCNICOS E SOLUÇÕES
        // ==========================================
        criarParagrafoTitulo1('4. Desafios de Engenharia Enfrentados e Soluções Adotadas'),
        criarParagrafoTexto(
            'Durante o ciclo de desenvolvimento, a equipe superou importantes desafios de integração e arquitetura:'
        ),

        criarParagrafoTitulo2('4.1. Conflito de Estilos Globais e Colapso de Layout Mobile'),
        criarParagrafoTexto(
            'Causa: O card de instruções de resgate da chave utilizava a tag <aside>. No CSS global, a regra aside formatava a barra lateral azul de navegação (280px fixos, 100vh de altura e alinhamento vertical). Isso fez com que o card interno fosse espremido em uma tira vertical azul e jogado para fora da tela em smartphones.'
        ),
        criarParagrafoTexto(
            'Solução: Aplicação de escopo estrito em style.css (body > aside e #aplicativo > aside), além da refatoração do card para <div class="card-detalhe-jogo card-resgate-jogo"> com CSS Grid responsivo minmax(0, 1.7fr) minmax(340px, 1fr).'
        ),

        criarParagrafoTitulo2('4.2. Duplicação de Entidades e Preços Inconsistentes em Promoções'),
        criarParagrafoTexto(
            'Causa: O modelo original permitia apenas uma categoria por jogo. Para colocar Elden Ring em promoção, criava-se uma cópia (promo-eldenring). Isso gerava duplicidade e fazia com que o jogo aparecesse com desconto em promoções, mas sem desconto na sua página de origem.'
        ),
        criarParagrafoTexto(
            'Solução: Reestruturação do banco JSON para suportar arrays de categorias (categorias: ["destaque", "steam", "promocao"]), remoção das entidades duplicadas e criação de formulário com caixas de seleção no painel administrativo.'
        ),

        criarParagrafoTitulo2('4.3. Padronização Rigorosa das Tags de Plataforma'),
        criarParagrafoTexto(
            'Causa: Títulos da Steam (como Battlefield 6, EA FC 27 e Tekken 8) continham a tag residual "PS4 · Mídia Digital" decorrente da clonagem inicial de templates.'
        ),
        criarParagrafoTexto(
            'Solução: Construção e execução do script atualizar-paginas-jogos.js que percorreu e unificou todas as 37 páginas com as tags oficiais: PS5 - Mídia Digital, Xbox - Mídia Digital e Steam - Mídia Digital.'
        ),

        new Paragraph({ spacing: { after: 140 }, children: [] }),

        // ==========================================
        // 5. ROTEIRO DE APRESENTAÇÃO ORAL PARA O PROFESSOR
        // ==========================================
        criarParagrafoTitulo1('5. Roteiro Prático para Apresentação Oral ao Professor'),
        criarParagrafoTexto(
            'Este roteiro foi estruturado para que Kelvin e os integrantes da equipe conduzam uma apresentação memorável e segura de 8 a 10 minutos:'
        ),

        criarParagrafoTitulo2('Passo 1: Introdução e Proposta de Valor (1 a 2 minutos)'),
        criarItemLista('O que falar', '"Olá professor! Nosso projeto é o Keep Keys, um e-commerce especializado na distribuição de licenças digitais para PS5, Xbox Series X|S e Steam. Nosso foco principal foi construir uma aplicação de alta fidelidade visual e técnica utilizando os pilares puros da web — HTML5 Semântico, CSS3 Moderno e Vanilla JavaScript — sem recorrer a frameworks pesados na vitrine, garantindo velocidade máxima e total domínio do código."'),

        criarParagrafoTitulo2('Passo 2: Demonstração da Experiência do Cliente (3 a 4 minutos)'),
        criarItemLista('Ação na tela', 'Abra http://localhost:3000 (ou o Live Server).'),
        criarItemLista('O que mostrar', '1) Mostre o carrossel rotativo e clique em um slide comprovando que ele abre a página do jogo correspondente.\n2) Digite na barra de busca (ex: "Spider" ou "Forza") e mostre a filtragem instantânea sem recarregar a tela.\n3) Entre na aba "Promoções" e aponte os descontos (ex: Red Dead Redemption 2 com -67% e preço antigo riscado em vermelho).\n4) Abra a página de um jogo (ex: Elden Ring ou GTA VI) e mostre a riqueza da ficha técnica: nota do Metacritic, requisitos mínimos de PC ou especificações de console, idiomas e guia de ativação da chave.'),

        criarParagrafoTitulo2('Passo 3: Demonstração do Fluxo de Compra e Carteira (2 minutos)'),
        criarItemLista('Ação na tela', 'Faça login no modal, adicione um jogo ao carrinho e abra a gaveta lateral.'),
        criarItemLista('O que mostrar', 'Mostre a gaveta fluida, o cálculo do total em reais, finalize no checkout usando o saldo da Carteira Digital e entre em perfil.html para mostrar a chave ativada na biblioteca do usuário.'),
        criarItemLista('Ponto alto', 'Comente com o professor: "Professor, para fins de demonstração acadêmica, programamos um temporizador na carteira virtual que adiciona R$ 1.000,00 automaticamente a cada minuto, para que a banca possa testar o checkout quantas vezes desejar!"'),

        criarParagrafoTitulo2('Passo 4: Demonstração do Painel Administrativo em Vue.js 3 (2 minutos)'),
        criarItemLista('Ação na tela', 'Acesse /admin.html logado como Administrador.'),
        criarItemLista('O que mostrar', '1) Destaque os cards de métricas reativas em tempo real.\n2) Edite um jogo do catálogo, digite um valor em "Preço Antigo" e mostre que a categoria "Promoção" é selecionada automaticamente pelo watcher.\n3) Salve e mostre que a alteração foi persistida e já reflete na loja.'),

        criarParagrafoTitulo2('Passo 5: Respostas para Possíveis Perguntas da Banca'),
        criarItemLista('Pergunta: "Por que não usaram React ou Angular na loja inteira?"', 'Resposta: "Optamos conscientemente pelo Vanilla JS na loja para exercitar a fundo a manipulação do DOM nativo, eventos assíncronos e o ciclo de vida do navegador. Reservamos o Vue.js 3 cirurgicamente para o painel administrativo, demonstrando que dominamos tanto o desenvolvimento nativo quanto bibliotecas reativas contemporâneas."'),
        criarItemLista('Pergunta: "Como os dados são persistidos?"', 'Resposta: "Utilizamos uma arquitetura híbrida: os dados da sessão ativa, carrinho e carteira ficam no LocalStorage do navegador, enquanto o catálogo principal e credenciais são sincronizados via API REST Node.js em arquivos físicos JSON (jogos.json), com espelhamento estático para garantir funcionamento mesmo offline."'),

        new Paragraph({ spacing: { after: 140 }, children: [] }),

        // ==========================================
        // 6. CONCLUSÃO
        // ==========================================
        criarParagrafoTitulo1('6. Conclusão'),
        criarParagrafoTexto(
            'O desenvolvimento do e-commerce Keep Keys representou uma experiência de aprendizado completa, abrangendo desde a concepção de requisitos e design de interfaces até a programação avançada em JavaScript, tratamento de responsividade e engenharia de software.'
        ),
        criarParagrafoTexto(
            'A aplicação entrega uma solução moderna, robusta, esteticamente refinada e totalmente alinhada às expectativas acadêmicas do curso de Análise e Desenvolvimento de Sistemas.'
        ),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 240 },
            children: [
                new TextRun({
                    text: 'Keep Keys © 2026 — Projeto Acadêmico ADS — Todos os direitos reservados.',
                    italic: true,
                    size: 18,
                    color: '888888',
                    font: 'Calibri'
                })
            ]
        })
    ];

    const doc = new Document({
        styles: {
            default: {
                document: {
                    run: {
                        font: 'Calibri',
                        size: 22,
                        color: CORES.CINZA_TEXTO
                    }
                }
            }
        },
        sections: [
            {
                properties: {
                    page: {
                        margin: {
                            top: 1440,    // 2.54 cm
                            bottom: 1440,
                            left: 1440,
                            right: 1440
                        }
                    }
                },
                headers: {
                    default: new Header({
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.RIGHT,
                                children: [
                                    new TextRun({
                                        text: 'Keep Keys E-commerce — Relatório de Projeto ADS 2026',
                                        size: 16,
                                        color: '999999',
                                        font: 'Calibri'
                                    })
                                ]
                            })
                        ]
                    })
                },
                footers: {
                    default: new Footer({
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [
                                    new TextRun({
                                        text: 'Página ',
                                        size: 18,
                                        color: '777777',
                                        font: 'Calibri'
                                    }),
                                    new TextRun({
                                        children: [PageNumber.CURRENT],
                                        size: 18,
                                        color: '777777',
                                        font: 'Calibri'
                                    }),
                                    new TextRun({
                                        text: ' de ',
                                        size: 18,
                                        color: '777777',
                                        font: 'Calibri'
                                    }),
                                    new TextRun({
                                        children: [PageNumber.TOTAL_PAGES],
                                        size: 18,
                                        color: '777777',
                                        font: 'Calibri'
                                    })
                                ]
                            })
                        ]
                    })
                },
                children: filhos
            }
        ]
    });

    const caminhoDocx = path.join(__dirname, '..', '..', 'RELATORIO_PROJETO_KEEP_KEYS.docx');
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(caminhoDocx, buffer);
    console.log(`Documento gerado com sucesso em: ${caminhoDocx} (${buffer.length} bytes)`);
}

gerarDocumento().catch(err => {
    console.error('Erro ao gerar documento:', err);
    process.exit(1);
});
