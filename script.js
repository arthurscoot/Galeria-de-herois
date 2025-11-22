let dados = [];
const cardContainer = document.querySelector('.card-container');
const searchInput = document.querySelector('.search-input');
const roleFilter = document.getElementById('role-filter');

//////////////////////////////////////////////////////////////////////////////

//Carrega os dados no documento 
window.addEventListener('DOMContentLoaded', async () => {
    try {
        const resposta = await fetch("data.json");
        dados = await resposta.json();
        exibirCards(dados); // Exibe todos os cards ao carregar a página
    } catch (error) {
        console.error("Erro ao carregar os dados:", error);
        cardContainer.innerHTML = "<p>Não foi possível carregar os dados das linguagens.</p>";
    }
});
     
//////////////////////////////////////////////////////////////////////////////

searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        iniciarBusca();
    }
});

roleFilter.addEventListener('change', iniciarBusca);

function iniciarBusca() {
    const termoBusca = searchInput.value.trim().toLowerCase();
    const funcaoSelecionada = roleFilter.value.toLowerCase();

    let resultados = dados;

    // 1. Filtra por função (se não for "geral")
    if (funcaoSelecionada !== 'geral') {
        resultados = resultados.filter(dado => 
            dado.função.toLowerCase() === funcaoSelecionada
        );
    }

    // 2. Filtra pelo termo de busca (se houver algum)
    if (termoBusca) {
        resultados = resultados.filter(dado => 
            dado.nome.toLowerCase().includes(termoBusca)
        );
    }
    exibirCards(resultados);
}

//////////////////////////////////////////////////////////////////////////////

//Converte o link do vídeo do youtube par ser usado no site
function getYouTubeEmbedUrl(url) {
    if (!url) return null;
    let videoId;
    if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split('?')[0];
    } else if (url.includes('youtube.com/watch')) {
        const urlParams = new URLSearchParams(new URL(url).search);
        videoId = urlParams.get('v');
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : null;
}

//Abre a página de cada herói
function showHeroDetail(heroLink) {
    const heroData = dados.find(d => d.link === heroLink);
    if (!heroData) return;

    const mainContent = document.querySelector('main');
    const detailView = document.getElementById('hero-detail-view');
    
    const embedUrl = getYouTubeEmbedUrl(heroData.video);
    const videoId = embedUrl ? embedUrl.split('/embed/')[1].split('?')[0] : null;

    // Cria o HTML para o vídeo apenas se um link válido existir
    const videoHtml = videoId ? `
        <h3>Vídeo de Habilidades</h3>
        <div class="video-container" id="video-container">
            <img class="video-thumbnail" src="https://img.youtube.com/vi/${videoId}/hqdefault.jpg" alt="Thumbnail do vídeo de ${heroData.nome}">
            <div class="play-button"></div>
        </div>
    ` : '';

    // Preenche a view de detalhes com as informações do herói
    detailView.innerHTML = `
        <div class="hero-detail-content">
            <button id="back-to-list">← Voltar para a lista</button>
            <img class="hero-detail-image" src="images/full/full_${heroData.img}" alt="Imagem de ${heroData.nome}">
            <h1>${heroData.nome}</h1>
            <h2>${heroData.titulo}</h2>
            <p><strong>Função:</strong> ${heroData.função}</p>
            <p class="hero-info">${heroData.informação}</p>
            ${videoHtml}
        </div>
    `;

    // Esconde a lista de cards e mostra a tela de detalhes
    mainContent.classList.add('hidden');
    detailView.classList.remove('hidden');

    // Adiciona o evento ao botão de voltar
    document.getElementById('back-to-list').addEventListener('click', () => {
        mainContent.classList.remove('hidden');
        detailView.classList.add('hidden');
        // Limpa o conteúdo da view de detalhes para parar qualquer vídeo em reprodução
        detailView.innerHTML = '';
        history.pushState(null, '', window.location.pathname.split('/')[0] || '/'); // Volta a URL para a raiz
    });

    // Adiciona o evento de clique para carregar o vídeo
    if (videoId) {
        const videoContainer = document.getElementById('video-container');
        videoContainer.addEventListener('click', () => {
            videoContainer.innerHTML = `
                <iframe src="${embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            `;
        }, { once: true }); // O evento só dispara uma vez
    }
}

function exibirCards(dado) {
    cardContainer.innerHTML = ""; // Limpa os cards existentes pra não aparecer a mesma coisa colada varias vezes 

    if (dado.length === 0) {
        cardContainer.innerHTML = "<p class='no-results'>Nenhum herói encontrado.</p>";
        return;
    }
    dado.forEach(dado => {
        const cardElement = document.createElement('article');
        cardElement.className = `card role-${dado.função.toLowerCase()}`;
        cardElement.dataset.link = dado.link; // Guarda o link do herói para usar no clique

        cardElement.innerHTML = `
                <h2>${dado.nome}</h2>
                <p><strong>Título:</strong> ${dado.titulo}</p>
                <p><strong>Função:</strong> ${dado.função}</p>
                <br>
                <img class="card-image-hover" src="images/characters/${dado.img}" alt="Imagem de ${dado.nome}">
        `;

        // Adiciona o evento de clique no card inteiro
        cardElement.addEventListener('click', () => {
            const heroLink = cardElement.dataset.link;
            
            // Muda a URL na barra de endereço SEM recarregar a página
            history.pushState({ hero: heroLink }, `Detalhes de ${dado.nome}`, `/${heroLink}`);
            
            // Mostra a tela de detalhes do herói clicado
            showHeroDetail(heroLink);
        });

        cardContainer.appendChild(cardElement);
    });
}

//////////////////////////////////////////////////////////////////////////////
// Lógica para simular o hover durante a rolagem da página
//////////////////////////////////////////////////////////////////////////////

let lastMouseX = 0;
let lastMouseY = 0;
let currentlyHoveredCard = null;
let scrollTimeout;

// 1. Armazena a última posição do mouse
window.addEventListener('mousemove', (e) => {
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
});

// 2. Ouve o evento de rolagem no container principal
document.querySelector('main').addEventListener('scroll', () => {
    // Otimização: usa um timeout para não executar o código em excesso durante a rolagem
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        // 3. Pega o elemento que está sob o cursor
        const elementUnderMouse = document.elementFromPoint(lastMouseX, lastMouseY);

        // Remove o hover do card anterior se houver um
        if (currentlyHoveredCard) {
            currentlyHoveredCard.classList.remove('js-hover');
            currentlyHoveredCard = null;
        }

        // 4. Se o elemento for um card, adiciona a classe de hover
        if (elementUnderMouse && elementUnderMouse.closest('article.card')) {
            const card = elementUnderMouse.closest('article.card');
            card.classList.add('js-hover');
            currentlyHoveredCard = card;
        }
    }, 50); // Um pequeno delay para otimização
});

// Ouve os botões de voltar/avançar do navegador para navegar entre a lista e os detalhes
window.addEventListener('popstate', (event) => {
    // Se o estado do histórico tiver um herói, mostra os detalhes dele
    if (event.state && event.state.hero) {
        showHeroDetail(event.state.hero);
    } else {
        // Senão, mostra a lista principal de cards
        document.querySelector('main').classList.remove('hidden');
        document.getElementById('hero-detail-view').classList.add('hidden');
    }
});
