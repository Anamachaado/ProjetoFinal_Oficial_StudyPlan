const disciplinasPorSerie = {};

let serieAtual = null;

let cursoAtual = null;

let disciplinasFormacaoGeral = [];


function goToStep2() {

    const cursoSelecionado = document.querySelector(
        'input[name="curso"]:checked'
    );

    if (!cursoSelecionado) {

        alert(
            "Por favor, selecione um curso!"
        );

        return;
    }

    if (
        cursoAtual !== null &&
        cursoAtual !== cursoSelecionado.value
    ) {

        for (const chave in disciplinasPorSerie) {
            delete disciplinasPorSerie[chave];
        }

        disciplinasFormacaoGeral = [];

        serieAtual = null;
    }

    cursoAtual = cursoSelecionado.value;

    document.getElementById("form-step-1")
        .classList.remove("active");

    document.getElementById("form-step-2")
        .classList.add("active");
}


function salvarDisciplinasDaSerie() {

    if (serieAtual === null) {
        return;
    }

    const disciplinasSelecionadas =
        document.querySelectorAll(
            'input[name="disciplinas"]:checked'
        );

    disciplinasPorSerie[serieAtual] =
        Array.from(disciplinasSelecionadas).map(
            function (disciplina) {

                return String(
                    disciplina.value
                );

            }
        );
}


function carregarDisciplinas() {

    const cursoSelecionado = document.querySelector(
        'input[name="curso"]:checked'
    );

    const novaSerie = document.querySelector(
        'input[name="serie"]:checked'
    );

    const lista =
        document.getElementById(
            "lista-disciplinas"
        );

    if (!cursoSelecionado || !novaSerie) {

        lista.innerHTML = "";

        return;
    }

    if (serieAtual !== null) {

        salvarDisciplinasDaSerie();

    }

    serieAtual = novaSerie.value;

    cursoAtual = cursoSelecionado.value;

    lista.innerHTML =
        "<p>Carregando disciplinas...</p>";

    fetch(
        `/disciplinas/?curso=${cursoAtual}&serie=${serieAtual}`
    )

        .then(function (response) {

            if (!response.ok) {

                throw new Error(
                    "Erro ao buscar disciplinas."
                );

            }

            return response.json();

        })

        .then(function (disciplinas) {

            lista.innerHTML = "";

            if (disciplinas.length === 0) {

                lista.innerHTML = `
                    <p>
                        Nenhuma disciplina encontrada
                        para esta série.
                    </p>
                `;

                return;
            }

            const disciplinasSalvas =
                disciplinasPorSerie[serieAtual] || [];

            disciplinas.forEach(
                function (disciplina) {

                    const idDisciplina =
                        String(disciplina.id);

                    const estaMarcada =
                        disciplinasSalvas.includes(
                            idDisciplina
                        );

                    lista.innerHTML += `
                        <label class="course-balloon">

                            <input
                                type="checkbox"
                                name="disciplinas"
                                value="${disciplina.id}"
                                ${estaMarcada ? "checked" : ""}
                                onchange="salvarDisciplinasDaSerie()"
                            >

                            <div class="balloon-content">

                                <span>
                                    ${disciplina.nome}
                                </span>

                            </div>

                        </label>
                    `;

                }
            );

        })

        .catch(function (error) {

            console.error(error);

            lista.innerHTML = "";

            alert(
                "Erro ao carregar as disciplinas."
            );

        });
}


function obterTodasAsDisciplinas() {

    const todasAsDisciplinas =
        new Set();

    Object.values(
        disciplinasPorSerie
    ).forEach(
        function (disciplinas) {

            disciplinas.forEach(
                function (disciplina) {

                    todasAsDisciplinas.add(
                        String(disciplina)
                    );

                }
            );

        }
    );

    return Array.from(
        todasAsDisciplinas
    );
}


function carregarFormacaoGeral() {

    const lista =
        document.getElementById(
            "lista-formacao-geral"
        );

    lista.innerHTML =
        "<p>Carregando disciplinas...</p>";

    fetch("/formacao-geral/")

        .then(function (response) {

            if (!response.ok) {

                throw new Error(
                    "Erro ao buscar disciplinas de formação geral."
                );

            }

            return response.json();

        })

        .then(function (disciplinas) {

            lista.innerHTML = "";

            if (disciplinas.length === 0) {

                lista.innerHTML = `
                    <p>
                        Nenhuma disciplina de formação geral encontrada.
                    </p>
                `;

                return;
            }

            disciplinas.forEach(
                function (disciplina) {

                    const idDisciplina =
                        String(disciplina.id);

                    const estaMarcada =
                        disciplinasFormacaoGeral.includes(
                            idDisciplina
                        );

                    lista.innerHTML += `
                        <label class="course-balloon">

                            <input
                                type="checkbox"
                                name="formacao_geral"
                                value="${disciplina.id}"
                                ${estaMarcada ? "checked" : ""}
                                onchange="salvarFormacaoGeral()"
                            >

                            <div class="balloon-content">

                                <span>
                                    ${disciplina.nome}
                                </span>

                            </div>

                        </label>
                    `;

                }
            );

        })

        .catch(function (error) {

            console.error(error);

            lista.innerHTML = "";

            alert(
                "Erro ao carregar as disciplinas de formação geral."
            );

        });
}


function salvarFormacaoGeral() {

    const selecionadas =
        document.querySelectorAll(
            'input[name="formacao_geral"]:checked'
        );

    disciplinasFormacaoGeral =
        Array.from(selecionadas).map(
            function (disciplina) {

                return String(
                    disciplina.value
                );

            }
        );
}


function goToStep3() {

    const cursoSelecionado =
        document.querySelector(
            'input[name="curso"]:checked'
        );

    const serieSelecionada =
        document.querySelector(
            'input[name="serie"]:checked'
        );

    salvarDisciplinasDaSerie();

    const todasAsDisciplinas =
        obterTodasAsDisciplinas();

    if (!cursoSelecionado) {

        alert(
            "Por favor, selecione um curso!"
        );

        return;
    }

    if (!serieSelecionada) {

        alert(
            "Por favor, selecione a sua série!"
        );

        return;
    }

    if (todasAsDisciplinas.length === 0) {

        alert(
            "Selecione pelo menos uma disciplina!"
        );

        return;
    }

    carregarFormacaoGeral();

    document.getElementById("form-step-2")
        .classList.remove("active");

    document.getElementById("form-step-3")
        .classList.add("active");
}


function goToStep1() {

    document.getElementById("form-step-2")
        .classList.remove("active");

    document.getElementById("form-step-1")
        .classList.add("active");
}


function goToStep2From3() {

    salvarFormacaoGeral();

    document.getElementById("form-step-3")
        .classList.remove("active");

    document.getElementById("form-step-2")
        .classList.add("active");

    carregarDisciplinas();
}


function finalizarCadastro() {

    const nome =
        document.getElementById(
            "nome-usuario"
        ).value;

    const email =
        document.getElementById(
            "email-usuario"
        ).value;

    const senha =
        document.getElementById(
            "senha-usuario"
        ).value;

    const cursoSelecionado =
        document.querySelector(
            'input[name="curso"]:checked'
        );

    const serieSelecionada =
        document.querySelector(
            'input[name="serie"]:checked'
        );

    salvarDisciplinasDaSerie();

    salvarFormacaoGeral();

    const todasAsDisciplinas =
        obterTodasAsDisciplinas();

    if (!cursoSelecionado) {

        alert(
            "Selecione um curso."
        );

        return;
    }

    if (!serieSelecionada) {

        alert(
            "Selecione uma série."
        );

        return;
    }

    if (
        todasAsDisciplinas.length === 0 &&
        disciplinasFormacaoGeral.length === 0
    ) {

        alert(
            "Selecione pelo menos uma disciplina."
        );

        return;
    }

    const formData =
        new FormData();

    formData.append(
        "nome",
        nome
    );

    formData.append(
        "email",
        email
    );

    formData.append(
        "senha",
        senha
    );

    formData.append(
        "curso",
        cursoSelecionado.value
    );

    formData.append(
        "serie",
        serieSelecionada.value
    );

    todasAsDisciplinas.forEach(
        function (disciplina) {

            formData.append(
                "disciplinas",
                disciplina
            );

        }
    );

    disciplinasFormacaoGeral.forEach(
        function (disciplina) {

            formData.append(
                "disciplinas",
                disciplina
            );

        }
    );

    fetch(
        "/cadastro/",
        {

            method: "POST",

            body: formData,

            headers: {
                "X-CSRFToken":
                    getCookie("csrftoken")
            }

        }
    )

        .then(function (response) {

            if (response.redirected) {

                window.location.href =
                    response.url;

            } else {

                return response.text()
                    .then(function () {

                        alert(
                            "Não foi possível concluir o cadastro."
                        );

                    });

            }

        })

        .catch(function (error) {

            console.error(error);

            alert(
                "Erro ao realizar o cadastro."
            );

        });
}


function getCookie(name) {

    let cookieValue = null;

    if (
        document.cookie &&
        document.cookie !== ""
    ) {

        const cookies =
            document.cookie.split(";");

        for (
            let cookie of cookies
        ) {

            cookie =
                cookie.trim();

            if (
                cookie.startsWith(
                    name + "="
                )
            ) {

                cookieValue =
                    decodeURIComponent(
                        cookie.substring(
                            name.length + 1
                        )
                    );

                break;
            }
        }
    }

    return cookieValue;
}