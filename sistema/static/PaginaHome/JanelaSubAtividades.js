/* =========================================================
   JANELA DE SUB-ATIVIDADES  -  Página "Minhas notas"

   Abre ao SEGURAR uma nota da tabela (o "segurar" é
   detectado no CrudNotas.js) ou pelo atalho laranja
   dentro da janela de notas.

   ATENÇÃO: esta parte é só a ESTILIZAÇÃO (front-end).
   As sub-atividades ficam guardadas apenas enquanto a
   página está aberta. Para salvar no banco, falta criar
   no Django o modelo e as rotas; aí é só trocar o que
   está dentro de "guardarSubAtividade" e
   "removerSubAtividade" por um fetch (igual ao CrudNotas.js).
   ========================================================= */


/* { "idDaDisciplina-bimestre": [ { nome, valor, nota }, ... ] } */

const subAtividadesPorNota = {};

let chaveSubAberta = null;

let bimestreSubAberto = null;

let cliqueComecouNoFundoSub = false;


/* Valor de cada bimestre (se o CrudNotas.js já definiu, usa o dele) */

const VALOR_BIMESTRE_SUB =
    typeof VALOR_DOS_BIMESTRES !== "undefined"
        ? VALOR_DOS_BIMESTRES
        : { "1": 20, "2": 30, "3": 20, "4": 30 };


function numeroBonito(numero) {

    return Number(numero).toLocaleString("pt-BR", {
        maximumFractionDigits: 2
    });

}


/* =========================
   ABRIR E FECHAR
========================= */

function abrirJanelaSubAtividades(celula) {

    chaveSubAberta =
        celula.dataset.disciplina +
        "-" +
        celula.dataset.bimestre;

    bimestreSubAberto = celula.dataset.bimestre;

    document.getElementById("janela-sub-subtitulo").textContent =
        celula.dataset.nome +
        " · " +
        bimestreSubAberto +
        "º bimestre" +
        " (vale " +
        VALOR_BIMESTRE_SUB[bimestreSubAberto] +
        " pts)";

    document.getElementById("form-sub").reset();

    document.getElementById("form-sub-aviso").textContent = "";

    cliqueComecouNoFundoSub = false;

    document.getElementById("janela-sub-fundo").classList.add("aberta");

    document.body.style.overflow = "hidden";

    buscarSubAtividades(celula);
}


function fecharJanelaSubAtividades() {

    document.getElementById("janela-sub-fundo").classList.remove("aberta");

    document.body.style.overflow = "";

}


const fundoSub = document.getElementById("janela-sub-fundo");

fundoSub.addEventListener("pointerdown", evento => {

    cliqueComecouNoFundoSub = evento.target === fundoSub;

});

fundoSub.addEventListener("click", evento => {

    // Só fecha se o clique começou E terminou no fundo escuro.
    // (Assim, soltar o dedo depois de "segurar" não fecha a janela.)
    if (evento.target === fundoSub && cliqueComecouNoFundoSub) {
        fecharJanelaSubAtividades();
    }

});

document.addEventListener("keydown", evento => {

    if (evento.key === "Escape" && fundoSub.classList.contains("aberta")) {
        fecharJanelaSubAtividades();
    }

});

function buscarSubAtividades(celula) {

    const url =
        urlListarSubAtividades +
        "?atividade=" +
        encodeURIComponent(celula.dataset.atividade);

    fetch(url)

        .then(resposta => {

            if (!resposta.ok) {
                throw new Error(
                    "Não foi possível carregar as sub-atividades."
                );
            }

            return resposta.json();

        })

        .then(dados => {

            subAtividadesPorNota[chaveSubAberta] =
                dados.subatividades || [];

            desenharSubAtividades();

        })

        .catch(erro => {

            console.error(erro);

            subAtividadesPorNota[chaveSubAberta] = [];

            document.getElementById("form-sub-aviso").textContent =
                erro.message;

            desenharSubAtividades();

        });
}


/* =========================
   DESENHAR
========================= */

function desenharSubAtividades() {

    const lista = document.getElementById("sub-lista");

    const subAtividades = subAtividadesPorNota[chaveSubAberta];

    const maximo = VALOR_BIMESTRE_SUB[bimestreSubAberto];


    let totalValor = 0;

    let totalNota = 0;

    subAtividades.forEach(sub => {
        totalValor += sub.valor;
        totalNota += sub.nota;
    });


    // Quadrinhos de resumo
    document.getElementById("sub-distribuido").innerHTML =
        numeroBonito(totalValor) + " <small>/ " + maximo + "</small>";

    document.getElementById("sub-distribuido-preenchido").style.width =
        Math.min(totalValor / maximo * 100, 100) + "%";

    document.getElementById("sub-obtido").textContent = numeroBonito(totalNota);

    document.getElementById("sub-aproveitamento").textContent =
        totalValor > 0 ? Math.round(totalNota / totalValor * 100) + "%" : "–";


    // Lista
    lista.innerHTML = "";

    if (subAtividades.length === 0) {

        const vazio = document.createElement("p");

        vazio.className = "sub-lista-vazia";

        vazio.textContent =
            "Divida a nota deste bimestre em partes: provas, trabalhos, listas... " +
            "Cada parte tem um valor e a nota que você tirou.";

        lista.appendChild(vazio);

        return;

    }


    subAtividades.forEach((sub, posicao) => {

        const aproveitamento = sub.valor > 0 ? sub.nota / sub.valor : 0;


        const item = document.createElement("div");

        item.className = "sub-item";


        const info = document.createElement("div");

        const nome = document.createElement("span");

        nome.className = "sub-item-nome";

        nome.textContent = sub.nome;

        const barra = document.createElement("div");

        barra.className = "sub-item-barra";

        const preenchido = document.createElement("div");

        preenchido.className = "sub-item-barra-preenchida";

        if (aproveitamento < 0.6) {
            preenchido.classList.add("abaixo");
        }

        preenchido.style.width = Math.min(aproveitamento * 100, 100) + "%";

        barra.appendChild(preenchido);

        info.appendChild(nome);

        info.appendChild(barra);


        const nota = document.createElement("span");

        nota.className = "sub-item-nota";

        nota.innerHTML =
            "<strong>" + numeroBonito(sub.nota) + "</strong> / " + numeroBonito(sub.valor);


        const remover = document.createElement("button");

        remover.type = "button";

        remover.className = "botao-remover-sub";

        remover.title = "Remover " + sub.nome;

        remover.setAttribute("aria-label", "Remover " + sub.nome);

        remover.innerHTML = '<i data-lucide="x"></i>';

        remover.addEventListener("click", () => removerSubAtividade(posicao));


        item.appendChild(info);

        item.appendChild(nota);

        item.appendChild(remover);

        lista.appendChild(item);

    });


    if (window.lucide) {
        lucide.createIcons();
    }

}


/* =========================
   ADICIONAR / REMOVER
   (por enquanto só na tela)
========================= */

function guardarSubAtividade(subAtividade) {

    subAtividadesPorNota[chaveSubAberta].push(subAtividade);

}


function removerSubAtividade(posicao) {

    subAtividadesPorNota[chaveSubAberta].splice(posicao, 1);

    desenharSubAtividades();

}


document.getElementById("form-sub").addEventListener("submit", evento => {

    evento.preventDefault();


    const aviso = document.getElementById("form-sub-aviso");

    const nome = document.getElementById("sub-nome").value.trim();

    const valor = Number(document.getElementById("sub-valor").value);

    const nota = Number(document.getElementById("sub-nota").value);

    const maximo = VALOR_BIMESTRE_SUB[bimestreSubAberto];


    let jaDistribuido = 0;

    subAtividadesPorNota[chaveSubAberta].forEach(sub => {
        jaDistribuido += sub.valor;
    });


    if (!nome) {
        aviso.textContent = "Dê um nome para a sub-atividade.";
        return;
    }

    if (!(valor > 0)) {
        aviso.textContent = "Quanto vale essa atividade? Digite um número maior que 0.";
        return;
    }

    if (isNaN(nota) || nota < 0 || nota > valor) {
        aviso.textContent = "A nota tirada precisa estar entre 0 e " + numeroBonito(valor) + ".";
        return;
    }

    if (jaDistribuido + valor > maximo + 0.001) {
        aviso.textContent =
            "Este bimestre vale " + maximo + " pts. Ainda restam " +
            numeroBonito(Math.max(maximo - jaDistribuido, 0)) + " pts para dividir.";
        return;
    }


    aviso.textContent = "";

    guardarSubAtividade({
        nome: nome,
        valor: valor,
        nota: nota
    });

    evento.target.reset();

    desenharSubAtividades();

});
