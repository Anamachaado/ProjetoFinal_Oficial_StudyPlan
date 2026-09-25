/**
 * StudyPlan - Script de Interatividade e Gráficos da Tela de Estatísticas
 * Integração com Chart.js e Sistema Preditivo (Pandas)
 */

document.addEventListener("DOMContentLoaded", () => {
    let meuGrafico = null;
    let disciplinaAtual = null;

    // Elementos da DOM
    const canvasElement = document.getElementById("graficoDesempenho");
    const tituloDisciplinaEl = document.getElementById("tituloDisciplina");
    const pontosValorEl = document.getElementById("pontosValor");
    const bimestresContainer = document.getElementById("bimestresGrid");
    const diagnosticoTextoEl = document.getElementById("diagnosticoTexto");
    const aproveitamentoPctEl = document.getElementById("aproveitamentoPct");
    const mediaImparEl = document.getElementById("mediaImpar");
    const mediaParEl = document.getElementById("mediaPar");
    const metaDestaqueEl = document.getElementById("metaDestaqueNum");

    // Verificar se os dados foram injetados pelo Django
    const dadosTodasDisciplinas = window.dadosDisciplinas || [];

    if (!dadosTodasDisciplinas || dadosTodasDisciplinas.length === 0) {
        console.warn("Nenhum dado de disciplina encontrado.");
        return;
    }

    // Inicializar com a primeira disciplina (ou Matemática se disponível)
    disciplinaAtual = dadosTodasDisciplinas.find(d => d.disciplina_nome.toLowerCase().includes("matem")) || dadosTodasDisciplinas[0];

    // =========================================================================
    // RENDERIZAR GRÁFICO COM CHART.JS (Estilo idêntico ao screenshot)
    // =========================================================================
    function inicializarGrafico(dados) {
        if (!canvasElement) return;

        const ctx = canvasElement.getContext("2d");

        // Notas reais do aluno por bimestre (1º a 4º)
        const notas = dados.notas_bimestres || [0, 0, 0, 0];
        const projecoes = dados.projecao_bimestres || notas;

        // Médias de referência (Ímpar = 12.0 ou 10.5, Par = 18.0 ou 16.5)
        const mediaImpar = dados.media_bim_impar || 12.0;
        const mediaPar = dados.media_bim_par || 18.0;

        // Linha de médias alternadas (Bimestres 1 e 3: média ímpar; 2 e 4: média par)
        const linhaMedias = [mediaImpar, mediaPar, mediaImpar, mediaPar];

        // Se houver projeção diferente das notas (bimestres pendentes), monta dataset preditivo
        const temPendencias = projecoes.some((p, idx) => p !== notas[idx]);
        const dadosLinhaPredicao = temPendencias ? projecoes : [null, null, null, null];

        const dadosGrafico = {
            labels: ["1º Bim", "2º Bim", "3º Bim", "4º Bim"],
            datasets: [
                {
                    label: "nota",
                    data: notas,
                    borderColor: "#1d63ff",
                    backgroundColor: "#1d63ff",
                    borderWidth: 3,
                    tension: 0.35, // Curvatura suave idêntica ao exemplo
                    pointRadius: 6,
                    pointHoverRadius: 9,
                    pointBackgroundColor: "#1d63ff",
                    pointBorderColor: "#ffffff",
                    pointBorderWidth: 2,
                    fill: false,
                    order: 1
                },
                {
                    label: "Média Bim Par",
                    data: [null, mediaPar, null, mediaPar],
                    borderColor: "#ef4444",
                    borderDash: [6, 6],
                    borderWidth: 1.8,
                    pointRadius: 0,
                    fill: false,
                    order: 3
                },
                {
                    label: "Média Bim Ímpar",
                    data: [mediaImpar, null, mediaImpar, null],
                    borderColor: "#f59e0b",
                    borderDash: [6, 6],
                    borderWidth: 1.8,
                    pointRadius: 0,
                    fill: false,
                    order: 4
                },
                {
                    label: "media",
                    data: linhaMedias,
                    borderColor: "#f59e0b",
                    borderDash: [4, 4],
                    borderWidth: 1.2,
                    pointRadius: 0,
                    fill: false,
                    order: 5
                }
            ]
        };

        // Adiciona dataset de previsão Pandas se houver bimestres futuros
        if (temPendencias) {
            dadosGrafico.datasets.push({
                label: "projeção (pandas)",
                data: dadosLinhaPredicao,
                borderColor: "#8b5cf6",
                borderDash: [5, 5],
                borderWidth: 2.5,
                pointRadius: 5,
                pointBackgroundColor: "#8b5cf6",
                pointBorderColor: "#ffffff",
                fill: false,
                order: 2
            });
        }

        const configuracoes = {
            type: "line",
            data: dadosGrafico,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: "index",
                },
                plugins: {
                    legend: {
                        display: false // Usamos a legenda HTML personalizada para combinar com o layout
                    },
                    tooltip: {
                        enabled: true,
                        backgroundColor: "#ffffff",
                        titleColor: "#0f172a",
                        bodyColor: "#1e293b",
                        borderColor: "#e2e8f0",
                        borderWidth: 1.5,
                        padding: 12,
                        cornerRadius: 8,
                        titleFont: { weight: "700", size: 14 },
                        bodyFont: { size: 13 },
                        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                        callbacks: {
                            title: function(items) {
                                return items[0].label;
                            },
                            label: function(context) {
                                const datasetLabel = context.dataset.label;
                                const val = context.parsed.y;
                                if (val === null || val === undefined) return null;

                                if (datasetLabel === "nota") {
                                    return `Nota : ${val.toFixed(1)} pontos`;
                                }
                                if (datasetLabel === "media") {
                                    return `Média : ${val.toFixed(1)} pontos`;
                                }
                                if (datasetLabel === "projeção (pandas)") {
                                    return `Previsão Pandas : ${val.toFixed(1)} pontos`;
                                }
                                return null;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        min: 0,
                        max: 30,
                        ticks: {
                            stepSize: 8,
                            values: [0, 8, 16, 30],
                            color: "#64748b",
                            font: { size: 12 }
                        },
                        grid: {
                            color: "#f1f5f9",
                            borderDash: [4, 4],
                            drawBorder: false
                        }
                    },
                    x: {
                        ticks: {
                            color: "#64748b",
                            font: { size: 13, weight: "600" }
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        };

        if (meuGrafico) {
            meuGrafico.destroy();
        }

        meuGrafico = new Chart(ctx, configuracoes);
    }

    // =========================================================================
    // ATUALIZAÇÃO COMPLETA DA INTERFACE (DISCIPLINA SELECIONADA)
    // =========================================================================
    function atualizarPainel(disciplina) {
        disciplinaAtual = disciplina;

        // 1. Título e Destaque de Pontos
        if (tituloDisciplinaEl) {
            tituloDisciplinaEl.textContent = disciplina.disciplina_nome;
        }

        if (pontosValorEl) {
            const total = disciplina.total_atual || 0.0;
            const meta = disciplina.meta_aprovacao || 60.0;
            pontosValorEl.textContent = `${total.toFixed(1)} / ${parseInt(meta)}`;

            if (total >= meta) {
                pontosValorEl.classList.remove("alerta");
            } else {
                pontosValorEl.classList.add("alerta");
            }
        }

        // 2. Atualizar Cards de Bimestre
        if (bimestresContainer && disciplina.cards_bimestres) {
            bimestresContainer.innerHTML = "";
            disciplina.cards_bimestres.forEach(card => {
                const cardEl = document.createElement("div");
                cardEl.className = "card-bimestre";

                const isAbaixo = card.status === "abaixo";
                const valorClasse = isAbaixo ? "bimestre-valor abaixo" : "bimestre-valor";

                let predicaoTag = "";
                if (card.is_predicao) {
                    predicaoTag = `<span class="tag-predicao">Previsão: ${card.projecao} pts</span>`;
                }

                cardEl.innerHTML = `
                    <div class="bimestre-rotulo">${card.titulo}</div>
                    <div class="${valorClasse}">${card.nota.toFixed(1)}</div>
                    <div class="bimestre-meta">/ ${card.max_pontos} pts</div>
                    ${predicaoTag}
                `;
                bimestresContainer.appendChild(cardEl);
            });
        }

        // 3. Atualizar Diagnóstico Preditivo (Pandas)
        if (diagnosticoTextoEl) {
            diagnosticoTextoEl.textContent = disciplina.diagnostico || "Acompanhamento regular de notas.";
        }

        if (aproveitamentoPctEl) {
            aproveitamentoPctEl.textContent = `${disciplina.taxa_aproveitamento_pct || 0}%`;
        }

        if (mediaImparEl) {
            mediaImparEl.textContent = `${disciplina.media_real_impar || disciplina.media_bim_impar} pts`;
        }

        if (mediaParEl) {
            mediaParEl.textContent = `${disciplina.media_real_par || disciplina.media_bim_par} pts`;
        }

        if (metaDestaqueEl) {
            const falta = disciplina.falta_para_60 || 0;
            metaDestaqueEl.textContent = falta > 0 ? `${falta.toFixed(1)} pts` : "Aprovado!";
        }

        // 4. Atualizar o gráfico
        inicializarGrafico(disciplina);
    }

    // =========================================================================
    // BOTÕES DE SELEÇÃO DE DISCIPLINA (TABS)
    // =========================================================================
    const tabs = document.querySelectorAll(".tab-disciplina");
    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("ativa"));
            tab.classList.add("ativa");

            const discId = tab.getAttribute("data-id");
            const discEncontrada = dadosTodasDisciplinas.find(d => String(d.disciplina_id) === String(discId));

            if (discEncontrada) {
                atualizarPainel(discEncontrada);
            }
        });
    });

    // =========================================================================
    // SELETOR DE ALUNOS (MODO COORDENADOR / ADMIN)
    // =========================================================================
    const seletorAlunoAdmin = document.getElementById("seletorAlunoAdmin");
    if (seletorAlunoAdmin) {
        seletorAlunoAdmin.addEventListener("change", (e) => {
            const alunoId = e.target.value;
            if (alunoId) {
                // Redireciona mantendo o aluno selecionado no parâmetro da URL
                const url = new URL(window.location.href);
                url.searchParams.set("aluno_id", alunoId);
                window.location.href = url.toString();
            }
        });
    }

    // =========================================================================
    // BOTÃO PARA ALTERNAR ENTRE FUNDO LARANJA E FUNDO CLARO
    // =========================================================================
    const btnTema = document.getElementById("btnAlternarTema");
    if (btnTema) {
        // Verificar preferência salva no LocalStorage
        const temaSalvo = localStorage.getItem("studyplan_tema");
        if (temaSalvo === "claro") {
            document.body.classList.add("tema-claro");
            btnTema.textContent = "🎨 Fundo Laranja";
        }

        btnTema.addEventListener("click", () => {
            document.body.classList.toggle("tema-claro");
            const ehClaro = document.body.classList.contains("tema-claro");
            btnTema.textContent = ehClaro ? "🎨 Fundo Laranja" : "⚪ Fundo Claro";
            localStorage.setItem("studyplan_tema", ehClaro ? "claro" : "laranja");
        });
    }

    // Render inicial
    atualizarPainel(disciplinaAtual);
});
