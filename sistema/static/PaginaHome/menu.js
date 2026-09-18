document.addEventListener("DOMContentLoaded", () => {

    const estruturaGeral = `
        <header>

            <button id="botao-menu" class="but-menu">
                ☰
            </button>

            <div class="texto">

                <h1>
                    Bem vindo, ${nomeUsuario}!
                </h1>

                <h2>
                    Curso: ${cursoUsuario}
                </h2>

            </div>

        </header>


        <div id="menu-lateral" class="Menu">


            <a href="${urlHome}" class="menu-link">
                Minhas notas
            </a>

            <a href="${urlPerfil}" class="menu-link">
                Meu Perfil
            </a>

            <a href="${urlTarefas}" class="menu-link">
                Tarefas
            </a>

            <a href="${urlDuvidas}" class="menu-link">
                Dúvidas
            </a>

            <a href="${urlEstatisticas}" class="menu-link">
                Estatísticas
            </a>

            <a href="${urlManual}" class="menu-link">
                Manual
            </a>

        </div>
    `;


    document.body.insertAdjacentHTML(
        'afterbegin',
        estruturaGeral
    );


    const botao = document.getElementById('botao-menu');

    const menu = document.getElementById('menu-lateral');


    botao.addEventListener('click', () => {

        menu.classList.toggle('aberto');

    });


    const paginaAtual = window.location.pathname;

    const linksMenu = document.querySelectorAll(".menu-link");


    linksMenu.forEach(link => {

        const endereco = new URL(
            link.href,
            window.location.origin
        ).pathname;


        if (paginaAtual === endereco) {

            link.classList.add("link-ativo");

        }

    });

});