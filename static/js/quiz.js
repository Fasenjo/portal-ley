/**
 * quiz.js - Quiz de Madurez en Protección de Datos Personales
 * Ley 21.719 - Guía de Implementación
 * v1.0
 *
 * Patrón: IIFE con var y funciones tradicionales
 * (consistente con articulos.js y capacidades.js)
 */

(function() {
    'use strict';

    // =========================================
    // Local utilities
    // =========================================

    function escapeHTML(str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    async function loadJSON(url) {
        try {
            var response = await fetch(url);
            if (!response.ok) {
                throw new Error('HTTP error! status: ' + response.status);
            }
            return await response.json();
        } catch (error) {
            console.error('[quiz.js] FETCH ERROR:', url, error.message);
            return null;
        }
    }

    // =========================================
    // Sigla-to-ID mapping (shared with articulos.js)
    // =========================================

    var siglaToId = {
        'DLP/DCS': 'dlp', 'IAM': 'iam', 'DAM': 'dam', 'ENC/TOK': 'enc',
        'PRM': 'prm', 'GRC': 'grc', 'RET/DEL': 'ret', 'ECM': 'ecm',
        'DGV': 'dgv', 'ETL/API': 'etl', 'SIEM': 'siem'
    };

    function getCapacityId(sigla) {
        return siglaToId[sigla] || sigla.toLowerCase();
    }

    // =========================================
    // State
    // =========================================

    var datosQuiz = null;
    var respuestas = {};
    var bloqueActual = 0;
    var quizIniciado = false;
    var chartInstance = null;

    // =========================================
    // DOM references
    // =========================================

    var els = {};

    function cacheDom() {
        els.welcome = document.getElementById('quiz-welcome');
        els.wizard = document.getElementById('quiz-wizard');
        els.results = document.getElementById('quiz-results');
        els.capsPreview = document.getElementById('quiz-caps-preview');
        els.btnComenzar = document.getElementById('btn-comenzar');
        els.progressSteps = document.getElementById('quiz-progress-steps');
        els.progressFill = document.getElementById('quiz-progress-fill');
        els.progressText = document.getElementById('quiz-progress-text');
        els.blockTitle = document.getElementById('quiz-block-title');
        els.questions = document.getElementById('quiz-questions');
        els.btnAnterior = document.getElementById('btn-anterior');
        els.btnSiguiente = document.getElementById('btn-siguiente');
        els.globalNumber = document.getElementById('quiz-global-number');
        els.globalLevel = document.getElementById('quiz-global-level');
        els.globalRecommendation = document.getElementById('quiz-global-recommendation');
        els.resultsDate = document.getElementById('quiz-results-date');
        els.capsDetail = document.getElementById('quiz-caps-detail');
        els.btnExportarPdf = document.getElementById('btn-exportar-pdf');
        els.btnReiniciar = document.getElementById('btn-reiniciar');
        els.radarCanvas = document.getElementById('quiz-radar-chart');
    }

    // =========================================
    // Initialize
    // =========================================

    async function init() {
        cacheDom();

        datosQuiz = await loadJSON('/data/quiz.json');

        if (!datosQuiz || !datosQuiz.preguntas) {
            showError('Error al cargar los datos del quiz.');
            return;
        }

        // Initialize responses
        datosQuiz.preguntas.forEach(function(p) {
            respuestas[p.id] = null;
        });

        renderBienvenida();
        setupEventListeners();
        setupBeforeUnload();
        setupNavInterception();
    }

    function showError(message) {
        var container = els.welcome || document.getElementById('quiz-welcome');
        if (container) {
            var body = container.querySelector('.quiz-welcome__body');
            if (body) {
                body.innerHTML = '<p style="color: var(--error); font-weight: 600; text-align: center; padding: var(--space-2xl);">' + escapeHTML(message) + '</p>';
            }
        }
    }

    // =========================================
    // Event listeners
    // =========================================

    function setupEventListeners() {
        els.btnComenzar.addEventListener('click', iniciarQuiz);
        els.btnAnterior.addEventListener('click', function() {
            if (bloqueActual > 0) {
                bloqueActual--;
                renderizarBloque(bloqueActual);
            }
        });
        els.btnSiguiente.addEventListener('click', function() {
            if (bloqueActual < datosQuiz.bloques.length - 1) {
                bloqueActual++;
                renderizarBloque(bloqueActual);
            } else {
                // Last block: calculate results
                var resultados = calcularResultados();
                mostrarResultados(resultados);
            }
        });
        els.btnExportarPdf.addEventListener('click', exportarPDF);
        els.btnReiniciar.addEventListener('click', reiniciar);
    }

    // =========================================
    // beforeunload + nav interception
    // =========================================

    function setupBeforeUnload() {
        window.addEventListener('beforeunload', function(e) {
            if (quizIniciado) {
                e.preventDefault();
                e.returnValue = '';
            }
        });
    }

    function setupNavInterception() {
        // Intercept internal nav links when quiz is in progress
        var navLinks = document.querySelectorAll('.nav__link, .mobile-nav__link, .header__brand');
        navLinks.forEach(function(link) {
            link.addEventListener('click', function(e) {
                if (quizIniciado) {
                    var confirmLeave = confirm('Tiene una evaluación en progreso. Si sale, perderá todas sus respuestas. ¿Desea continuar?');
                    if (!confirmLeave) {
                        e.preventDefault();
                    }
                }
            });
        });
    }

    // =========================================
    // Render: Welcome screen
    // =========================================

    function renderBienvenida() {
        // Render CAPs preview
        var html = '';
        datosQuiz.capacidades.forEach(function(cap) {
            html += '<div class="quiz-cap-preview">';
            html += '<span class="quiz-cap-preview__id">' + escapeHTML(cap.id) + '</span>';
            html += '<span class="quiz-cap-preview__name">' + escapeHTML(cap.nombreCorto) + '</span>';
            html += '</div>';
        });
        els.capsPreview.innerHTML = html;

        // Enable start button
        els.btnComenzar.disabled = false;
    }

    // =========================================
    // Start quiz
    // =========================================

    function iniciarQuiz() {
        quizIniciado = true;
        bloqueActual = 0;
        els.welcome.hidden = true;
        els.wizard.hidden = false;
        els.results.hidden = true;
        renderizarBloque(0);
    }

    // =========================================
    // Render: Block
    // =========================================

    function renderizarBloque(indice) {
        var bloque = datosQuiz.bloques[indice];
        var totalBloques = datosQuiz.bloques.length;

        // Update progress bar
        renderProgreso(indice);

        // Update title
        els.blockTitle.textContent = 'Bloque ' + (indice + 1) + ' de ' + totalBloques + ': ' + bloque.nombre;

        // Render questions
        var html = '';
        bloque.preguntas.forEach(function(preguntaId, qIndex) {
            var pregunta = datosQuiz.preguntas.find(function(p) { return p.id === preguntaId; });
            if (!pregunta) return;

            html += '<div class="quiz-question">';
            html += '<h3 class="quiz-question__text">';
            html += '<span class="quiz-question__number">' + (qIndex + 1) + '.</span> ';
            html += escapeHTML(pregunta.texto);
            html += '</h3>';
            html += '<div class="quiz-question__options" role="radiogroup" aria-label="' + escapeHTML(pregunta.texto) + '">';

            datosQuiz.escala.forEach(function(opcion) {
                var inputId = preguntaId + '_' + opcion.valor;
                var isChecked = respuestas[preguntaId] === opcion.valor;

                html += '<label class="quiz-option' + (isChecked ? ' quiz-option--selected' : '') + '" for="' + inputId + '">';
                html += '<input type="radio" class="quiz-option__input" ';
                html += 'id="' + inputId + '" ';
                html += 'name="' + preguntaId + '" ';
                html += 'value="' + opcion.valor + '"';
                if (isChecked) html += ' checked';
                html += '>';
                html += '<span class="quiz-option__marker">' + opcion.valor + '</span>';
                html += '<span class="quiz-option__content">';
                html += '<span class="quiz-option__label">' + escapeHTML(opcion.etiqueta) + '</span>';
                html += '<span class="quiz-option__desc">' + escapeHTML(opcion.descripcion) + '</span>';
                html += '</span>';
                html += '</label>';
            });

            html += '</div>';
            html += '</div>';
        });

        els.questions.innerHTML = html;

        // Attach change listeners to radios
        var radios = els.questions.querySelectorAll('input[type="radio"]');
        radios.forEach(function(radio) {
            radio.addEventListener('change', function() {
                guardarRespuesta(this.name, parseInt(this.value, 10));
                // Update visual selection
                var group = els.questions.querySelectorAll('label[for^="' + this.name + '_"]');
                group.forEach(function(label) {
                    label.classList.remove('quiz-option--selected');
                });
                this.closest('.quiz-option').classList.add('quiz-option--selected');
            });
        });

        // Update navigation buttons
        els.btnAnterior.hidden = (indice === 0);

        if (indice === totalBloques - 1) {
            els.btnSiguiente.textContent = 'Ver resultados';
        } else {
            els.btnSiguiente.textContent = 'Siguiente';
        }

        actualizarBotonSiguiente();

        // Scroll to top and focus
        window.scrollTo({ top: 0, behavior: 'smooth' });
        els.blockTitle.focus();
    }

    // =========================================
    // Render: Progress bar
    // =========================================

    function renderProgreso(indiceActual) {
        var totalBloques = datosQuiz.bloques.length;
        var html = '';

        datosQuiz.bloques.forEach(function(bloque, i) {
            var isCompleted = isBloqueCompleto(i);
            var isCurrent = (i === indiceActual);
            var isPending = (i > indiceActual && !isCompleted);

            var stepClass = 'quiz-progress__step';
            if (isCurrent) stepClass += ' quiz-progress__step--current';
            else if (isCompleted) stepClass += ' quiz-progress__step--completed';
            else stepClass += ' quiz-progress__step--pending';

            var clickable = isCompleted || isCurrent;

            html += '<li class="' + stepClass + '"';
            if (clickable) {
                html += ' tabindex="0" role="button" aria-label="Ir al bloque ' + (i + 1) + ': ' + escapeHTML(bloque.nombre) + '"';
                html += ' data-step="' + i + '"';
            } else {
                html += ' aria-disabled="true"';
            }
            html += '>';
            if (isCompleted && !isCurrent) {
                html += '<span class="quiz-progress__check" aria-hidden="true">&#10003;</span>';
            } else {
                html += '<span class="quiz-progress__num">' + (i + 1) + '</span>';
            }
            html += '<span class="quiz-progress__label">' + escapeHTML(bloque.nombre) + '</span>';
            html += '</li>';
        });

        els.progressSteps.innerHTML = html;

        // Click on completed steps
        var steps = els.progressSteps.querySelectorAll('[data-step]');
        steps.forEach(function(step) {
            step.addEventListener('click', function() {
                var target = parseInt(this.dataset.step, 10);
                if (isBloqueCompleto(target) || target === indiceActual) {
                    bloqueActual = target;
                    renderizarBloque(target);
                }
            });
            step.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.click();
                }
            });
        });

        // Update fill bar
        var completados = 0;
        for (var j = 0; j < totalBloques; j++) {
            if (isBloqueCompleto(j)) completados++;
        }
        var pct = Math.round((completados / totalBloques) * 100);
        els.progressFill.style.width = pct + '%';
        els.progressFill.setAttribute('aria-valuenow', pct);

        // Update text
        els.progressText.textContent = 'Paso ' + (indiceActual + 1) + ' de ' + totalBloques;
    }

    // =========================================
    // Save response
    // =========================================

    function guardarRespuesta(preguntaId, valor) {
        respuestas[preguntaId] = valor;
        actualizarBotonSiguiente();
    }

    function actualizarBotonSiguiente() {
        var completo = isBloqueCompleto(bloqueActual);
        els.btnSiguiente.disabled = !completo;
    }

    function isBloqueCompleto(indice) {
        var bloque = datosQuiz.bloques[indice];
        if (!bloque) return false;
        return bloque.preguntas.every(function(preguntaId) {
            return respuestas[preguntaId] !== null;
        });
    }

    // =========================================
    // Calculate results
    // =========================================

    function calcularResultados() {
        var resultadosCaps = {};

        datosQuiz.capacidades.forEach(function(cap) {
            var sumaAportes = 0;

            datosQuiz.preguntas.forEach(function(pregunta) {
                var contribucion = pregunta.contribuciones.find(function(c) {
                    return c.cap === cap.id;
                });
                if (contribucion && respuestas[pregunta.id] !== null) {
                    var aporte = (respuestas[pregunta.id] / 4) * (contribucion.peso / 100);
                    sumaAportes += aporte;
                }
            });

            var puntuacion = (sumaAportes / cap.divisor) * 100;
            puntuacion = Math.round(puntuacion * 10) / 10; // 1 decimal

            var rango = determinarRango(puntuacion);

            resultadosCaps[cap.id] = {
                puntuacion: puntuacion,
                nivel: rango.nivel,
                color: rango.color,
                recomendacion: rango.recomendacion,
                tecnologias: cap.tecnologiasRelacionadas,
                nombre: cap.nombre,
                nombreCorto: cap.nombreCorto
            };
        });

        // Global score
        var sumaPuntuaciones = 0;
        var count = 0;
        Object.keys(resultadosCaps).forEach(function(capId) {
            sumaPuntuaciones += resultadosCaps[capId].puntuacion;
            count++;
        });
        var puntuacionGlobal = Math.round((sumaPuntuaciones / count) * 10) / 10;
        var rangoGlobal = determinarRango(puntuacionGlobal);

        return {
            global: {
                puntuacion: puntuacionGlobal,
                nivel: rangoGlobal.nivel,
                color: rangoGlobal.color,
                recomendacion: rangoGlobal.recomendacion
            },
            caps: resultadosCaps
        };
    }

    function determinarRango(puntuacion) {
        // Sequential logic: ≤25 → Crítico, ≤50 → En desarrollo, ≤75 → Avanzado, ≤100 → Óptimo
        if (puntuacion <= 25) {
            return datosQuiz.rangos[0]; // Crítico
        } else if (puntuacion <= 50) {
            return datosQuiz.rangos[1]; // En desarrollo
        } else if (puntuacion <= 75) {
            return datosQuiz.rangos[2]; // Avanzado
        } else {
            return datosQuiz.rangos[3]; // Óptimo
        }
    }

    // =========================================
    // Show results
    // =========================================

    function mostrarResultados(resultados) {
        quizIniciado = false;

        els.wizard.hidden = true;
        els.results.hidden = false;

        // Date
        els.resultsDate.textContent = new Date().toLocaleDateString('es-CL', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        // Global score
        var globalColor = getCSSColor(resultados.global.nivel);
        els.globalNumber.textContent = resultados.global.puntuacion.toFixed(1);
        els.globalNumber.style.color = globalColor;
        els.globalLevel.textContent = resultados.global.nivel;
        els.globalLevel.style.color = globalColor;
        els.globalRecommendation.textContent = resultados.global.recomendacion;

        // Radar chart
        renderRadar(resultados);

        // CAP detail cards
        renderCapsDetail(resultados);

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // =========================================
    // CSS color helper (use project CSS vars)
    // =========================================

    function getCSSColor(nivel) {
        var styles = getComputedStyle(document.documentElement);
        switch (nivel) {
            case 'Crítico':
                return styles.getPropertyValue('--color-core').trim() || '#dc2626';
            case 'En desarrollo':
                return styles.getPropertyValue('--color-essential').trim() || '#f59e0b';
            case 'Avanzado':
                return styles.getPropertyValue('--warning').trim() || '#eab308';
            case 'Óptimo':
                return styles.getPropertyValue('--success').trim() || '#22c55e';
            default:
                return styles.getPropertyValue('--text-secondary').trim() || '#a0a0b0';
        }
    }

    // =========================================
    // Render: Radar chart
    // =========================================

    function renderRadar(resultados) {
        if (!window.Chart) {
            // Fallback if Chart.js didn't load
            var container = els.radarCanvas.parentElement;
            container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: var(--space-xl);">Gráfico no disponible (Chart.js no cargó)</p>';
            return;
        }

        if (chartInstance) {
            chartInstance.destroy();
        }

        var labels = [];
        var data = [];
        var bgColors = [];
        var borderColors = [];

        datosQuiz.capacidades.forEach(function(cap) {
            var capResult = resultados.caps[cap.id];
            labels.push(cap.nombreCorto);
            data.push(capResult.puntuacion);
            var color = getCSSColor(capResult.nivel);
            borderColors.push(color);
            bgColors.push(hexToRgba(color, 0.2));
        });

        var ctx = els.radarCanvas.getContext('2d');
        var accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#818cf8';
        var textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#a0a0b0';
        var gridColor = getComputedStyle(document.documentElement).getPropertyValue('--border-default').trim() || '#2d2d3d';

        chartInstance = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Puntuación (%)',
                    data: data,
                    backgroundColor: hexToRgba(accentColor, 0.15),
                    borderColor: accentColor,
                    borderWidth: 2,
                    pointBackgroundColor: borderColors,
                    pointBorderColor: borderColors,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    r: {
                        beginAtZero: true,
                        min: 0,
                        max: 100,
                        ticks: {
                            stepSize: 25,
                            color: textColor,
                            backdropColor: 'transparent',
                            font: { size: 11 }
                        },
                        grid: {
                            color: gridColor
                        },
                        angleLines: {
                            color: gridColor
                        },
                        pointLabels: {
                            color: textColor,
                            font: { size: 12, weight: '500' }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            title: function(items) {
                                var idx = items[0].dataIndex;
                                return datosQuiz.capacidades[idx].nombre;
                            },
                            label: function(item) {
                                return item.raw.toFixed(1) + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    function hexToRgba(hex, alpha) {
        // Handle both #RGB and #RRGGBB, and also CSS var fallbacks
        hex = hex.replace('#', '');
        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        var r = parseInt(hex.substring(0, 2), 16);
        var g = parseInt(hex.substring(2, 4), 16);
        var b = parseInt(hex.substring(4, 6), 16);
        if (isNaN(r)) return 'rgba(129, 140, 248, ' + alpha + ')'; // fallback accent
        return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
    }

    // =========================================
    // Render: CAP detail cards
    // =========================================

    function renderCapsDetail(resultados) {
        var html = '';

        datosQuiz.capacidades.forEach(function(cap) {
            var r = resultados.caps[cap.id];
            var color = getCSSColor(r.nivel);

            html += '<div class="quiz-cap-card">';
            html += '<div class="quiz-cap-card__header">';
            html += '<h3 class="quiz-cap-card__name">' + escapeHTML(cap.nombre) + '</h3>';
            html += '<span class="quiz-cap-card__score" style="color: ' + color + ';">' + r.puntuacion.toFixed(1) + '%</span>';
            html += '</div>';

            // Progress bar
            html += '<div class="quiz-cap-card__bar">';
            html += '<div class="quiz-cap-card__fill" style="width: ' + Math.min(r.puntuacion, 100) + '%; background-color: ' + color + ';"></div>';
            html += '</div>';

            html += '<span class="quiz-cap-card__level" style="color: ' + color + ';">' + escapeHTML(r.nivel) + '</span>';

            // Technology badges
            if (r.tecnologias && r.tecnologias.length > 0) {
                html += '<div class="quiz-cap-card__techs">';
                r.tecnologias.forEach(function(sigla) {
                    var capId = getCapacityId(sigla);
                    html += '<a href="/capacidades#' + capId + '" class="tag quiz-tech-badge">' + escapeHTML(sigla) + '</a>';
                });
                html += '</div>';
            }

            html += '</div>';
        });

        els.capsDetail.innerHTML = html;
    }

    // =========================================
    // Export PDF
    // =========================================

    function exportarPDF() {
        if (!window.html2canvas || !window.jspdf) {
            alert('Las bibliotecas de exportación no están disponibles. Verifique su conexión a internet.');
            return;
        }

        var btn = els.btnExportarPdf;
        var originalText = btn.textContent;
        btn.textContent = 'Generando PDF...';
        btn.disabled = true;

        var resultsEl = document.getElementById('quiz-results');

        html2canvas(resultsEl, {
            scale: 2,
            useCORS: true,
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim() || '#0f0f14',
            logging: false
        }).then(function(canvas) {
            var jsPDF = window.jspdf.jsPDF;
            var pdf = new jsPDF('p', 'mm', 'a4');

            var pageWidth = pdf.internal.pageSize.getWidth();
            var pageHeight = pdf.internal.pageSize.getHeight();
            var margin = 10;

            // Title
            pdf.setFontSize(16);
            pdf.setTextColor(50, 50, 50);
            pdf.text('Evaluación de Madurez - Ley 21.719', margin, 15);

            // Date
            pdf.setFontSize(10);
            pdf.setTextColor(120, 120, 120);
            pdf.text('Fecha: ' + new Date().toLocaleDateString('es-CL'), margin, 22);

            // Image
            var imgData = canvas.toDataURL('image/png');
            var imgWidth = pageWidth - (margin * 2);
            var imgHeight = (canvas.height * imgWidth) / canvas.width;

            // If image is taller than remaining page, scale down
            var maxImgHeight = pageHeight - 30;
            if (imgHeight > maxImgHeight) {
                var scaleFactor = maxImgHeight / imgHeight;
                imgHeight = maxImgHeight;
                imgWidth = imgWidth * scaleFactor;
            }

            pdf.addImage(imgData, 'PNG', margin, 28, imgWidth, imgHeight);
            pdf.save('evaluacion-madurez-ley21719.pdf');

            btn.textContent = originalText;
            btn.disabled = false;
        }).catch(function(error) {
            console.error('[quiz.js] PDF export error:', error);
            alert('Error al generar el PDF. Por favor intente nuevamente.');
            btn.textContent = originalText;
            btn.disabled = false;
        });
    }

    // =========================================
    // Reset
    // =========================================

    function reiniciar() {
        // Clear responses
        Object.keys(respuestas).forEach(function(key) {
            respuestas[key] = null;
        });

        bloqueActual = 0;
        quizIniciado = false;

        // Destroy chart
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }

        // Show welcome, hide others
        els.results.hidden = true;
        els.wizard.hidden = true;
        els.welcome.hidden = false;

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // =========================================
    // Boot
    // =========================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();