/**
 * cumplimiento-express.js
 * Vista Rápida — Maneja la interacción de tarjetas y animación de revelación
 *
 * Funcionalidad:
 * - Carga datos de artículos desde /data/articulos.json
 * - Carga datos de capacidades desde /data/capacidades.json (para nombres completos)
 * - Maneja selección de tarjetas (click + keyboard)
 * - Anima la revelación de capacidades de izquierda a derecha
 *
 * Nota: los dots de cada tarjeta se generan dinámicamente desde el JSON
 * para garantizar coincidencia con los datos reales.
 */

(function () {
    'use strict';

    // ═══════════════════════════════════════
    // CONFIGURACIÓN
    // ═══════════════════════════════════════

    var ARTICULOS_URL = '/data/articulos.json';
    var CAPACIDADES_URL = '/data/capacidades.json';
    var articulosData = null;
    var capacidadesData = null;
    var currentArticle = null;

    // Mapeo de siglas con slash a IDs válidos para URLs
    var siglaToId = {
        'DLP/DCS': 'dlp',
        'IAM': 'iam',
        'DAM': 'dam',
        'ENC/TOK': 'enc',
        'PRM': 'prm',
        'GRC': 'grc',
        'RET/DEL': 'ret',
        'ECM': 'ecm',
        'DGV': 'dgv',
        'ETL/API': 'etl',
        'SIEM': 'siem'
    };

    // Fallback de nombres completos (si capacidades.json no carga o no tiene campo "nombre")
    var nombreFallback = {
        'DLP/DCS': 'Data Discovery, Classification & DLP',
        'IAM': 'Gestión de Identidades y Accesos',
        'DAM': 'Monitoreo y Auditoría de Bases de Datos',
        'ENC/TOK': 'Cifrado, Enmascaramiento y Tokenización',
        'PRM': 'Gestión de Derechos de Privacidad',
        'GRC': 'Gobierno, Riesgo y Cumplimiento',
        'RET/DEL': 'Retención y Eliminación de Datos',
        'ECM': 'Gestión Documental y Evidencias',
        'DGV': 'Gobierno de Datos y Catálogo',
        'ETL/API': 'Integración, APIs y Transferencia de Datos',
        'SIEM': 'Gestión de Eventos e Información de Seguridad'
    };

    // ═══════════════════════════════════════
    // UTILIDADES
    // ═══════════════════════════════════════

    function escapeHTML(str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function getSiglaId(sigla) {
        return siglaToId[sigla] || sigla.toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    /**
     * Devuelve el nombre completo/descriptivo de una capacidad por su sigla.
     * Primero busca en capacidades.json, luego en fallback, finalmente usa la sigla.
     */
    function getNombreCompleto(sigla) {
        if (capacidadesData && Array.isArray(capacidadesData.capacidades)) {
            var found = capacidadesData.capacidades.find(function (c) {
                return c.sigla === sigla;
            });
            if (found && found.nombre) return found.nombre;
        }
        return nombreFallback[sigla] || sigla;
    }

    async function loadJSON(url) {
        try {
            var response = await fetch(url);
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return await response.json();
        } catch (error) {
            console.error('[vista-rapida] Error cargando JSON:', error);
            return null;
        }
    }

    // ═══════════════════════════════════════
    // INICIALIZACIÓN
    // ═══════════════════════════════════════

    async function init() {
        var section = document.querySelector('.cumplimiento-express');
        if (!section) return;

        // Cargar ambos JSON en paralelo
        var results = await Promise.all([
            loadJSON(ARTICULOS_URL),
            loadJSON(CAPACIDADES_URL)
        ]);
        articulosData = results[0];
        capacidadesData = results[1];

        if (!articulosData || !articulosData.articulos) {
            console.error('[vista-rapida] No se pudieron cargar artículos');
            return;
        }

        console.log(
            '[vista-rapida] Inicializado con',
            articulosData.articulos.length,
            'artículos y',
            capacidadesData && capacidadesData.capacidades ? capacidadesData.capacidades.length : 0,
            'capacidades'
        );

        syncCardDotsFromData();
        bindCardEvents();

        // Seleccionar primer artículo automáticamente
        setTimeout(function () {
            var firstCard = document.querySelector('.express-card');
            if (firstCard) {
                var artId = firstCard.getAttribute('data-article');
                if (artId) selectArticle(artId);
            }
        }, 500);
    }

    // ═══════════════════════════════════════
    // SYNC DOTS (desde JSON)
    // ═══════════════════════════════════════

    function syncCardDotsFromData() {
        var cards = document.querySelectorAll('.express-card');
        cards.forEach(function (card) {
            var artId = card.getAttribute('data-article');
            if (!artId) return;

            var article = articulosData.articulos.find(function (a) {
                return a.id === artId;
            });
            if (!article || !Array.isArray(article.capacidades)) return;

            var dotsContainer = card.querySelector('.express-card__dots');
            if (!dotsContainer) return;

            var orden = ['core', 'esencial', 'complementaria'];
            var html = '';
            orden.forEach(function (nivel) {
                article.capacidades
                    .filter(function (c) { return c.criticidad === nivel; })
                    .forEach(function () {
                        html +=
                            '<span class="express-card__dot express-card__dot--' +
                            nivel +
                            '"></span>';
                    });
            });
            dotsContainer.innerHTML = html;
        });
    }

    // ═══════════════════════════════════════
    // EVENTOS
    // ═══════════════════════════════════════

    function bindCardEvents() {
        var cards = document.querySelectorAll('.express-card');

        cards.forEach(function (card) {
            card.addEventListener('click', function () {
                var artId = this.getAttribute('data-article');
                if (artId) selectArticle(artId);
            });

            card.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    var artId = this.getAttribute('data-article');
                    if (artId) selectArticle(artId);
                }
            });
        });
    }

    // ═══════════════════════════════════════
    // SELECCIÓN DE ARTÍCULO
    // ═══════════════════════════════════════

    function selectArticle(artId) {
        if (currentArticle === artId) return;
        currentArticle = artId;

        var article = articulosData.articulos.find(function (a) {
            return a.id === artId;
        });

        if (!article) {
            console.error('[vista-rapida] Artículo no encontrado:', artId);
            return;
        }

        updateCardStates(artId);
        updateLeftPanel(article);
        updateRightPanel(article);
    }

    function updateCardStates(activeId) {
        document.querySelectorAll('.express-card').forEach(function (card) {
            var isActive = card.getAttribute('data-article') === activeId;
            card.classList.toggle('express-card--active', isActive);
            card.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
    }

    // ═══════════════════════════════════════
    // PANEL IZQUIERDO
    // ═══════════════════════════════════════

    function updateLeftPanel(article) {
        var el = document.getElementById('express-left');
        if (!el) return;

        el.innerHTML = [
            '<span class="express-detail__num">' + escapeHTML(article.numero) + '</span>',
            '<h3 class="express-detail__title">' + escapeHTML(article.titulo) + '</h3>',
            '<p class="express-detail__resumen">' + escapeHTML(article.resumen) + '</p>',
            '<a href="/articulos#' + article.id + '" class="express-detail__link">',
            '    Ver detalle completo <span aria-hidden="true">→</span>',
            '</a>'
        ].join('\n');
    }

    // ═══════════════════════════════════════
    // PANEL DERECHO (con animación)
    // ═══════════════════════════════════════

    function updateRightPanel(article) {
        var el = document.getElementById('express-right');
        if (!el) return;

        var caps = article.capacidades || [];
        var core = caps.filter(function (c) { return c.criticidad === 'core'; });
        var esencial = caps.filter(function (c) { return c.criticidad === 'esencial'; });
        var complementaria = caps.filter(function (c) { return c.criticidad === 'complementaria'; });

        var html = '<div class="reveal-container">';

        if (core.length > 0) {
            html += buildSection('Core', 'Imprescindibles', core, 'core');
        }
        if (esencial.length > 0) {
            html += buildSection('Esencial', 'Altamente recomendadas', esencial, 'esencial');
        }
        if (complementaria.length > 0) {
            html += buildSection('Complementaria', 'Valor agregado', complementaria, 'complementaria');
        }

        html += '</div>';
        el.innerHTML = html;

        requestAnimationFrame(function () {
            var sections = el.querySelectorAll('.reveal-section');
            sections.forEach(function (section, i) {
                setTimeout(function () {
                    section.classList.add('reveal-section--visible');
                }, i * 150);
            });
        });
    }

    function buildSection(title, subtitle, capacidades, nivel) {
        var html = '<div class="reveal-section">';

        // Chips horizontales: solo el nombre completo
        html += '<div class="caps-chips">';
        capacidades.forEach(function (cap) {
            var nombreCompleto = getNombreCompleto(cap.sigla);
            html += '<a href="/capacidades#' + getSiglaId(cap.sigla) + '" ' +
                'class="cap-chip cap-chip--' + nivel + '" ' +
                'title="' + escapeHTML(cap.sigla) + ' — ' + escapeHTML(cap.justificacion) + '">' +
                escapeHTML(nombreCompleto) +
                '</a>';
        });
        html += '</div>';

        // Justificación expandida + vendors del primer elemento
        if (capacidades.length > 0) {
            var first = capacidades[0];
            var firstNombre = getNombreCompleto(first.sigla);
            var vendors = getVendorsForSigla(first.sigla);

            html += '<div class="cap-justificacion cap-justificacion--' + nivel + '">';
            html += '<strong>' + escapeHTML(firstNombre) + ':</strong> ';
            html += escapeHTML(first.justificacion);

            // Agregar ejemplos de productos si existen
            if (vendors.length > 0) {
                html += '<span class="cap-justificacion__vendors">';
                html += ' Ejemplos: ';
                html += vendors.map(function (v) {
                    return '<em>' + escapeHTML(v.producto) + '</em> (' + escapeHTML(v.vendor) + ')';
                }).join(', ');
                html += '.</span>';
            }

            html += '</div>';
        }

        html += '</div>';
        return html;
    }

    /**
     * Busca los vendors/productos de una capacidad por su sigla.
     * Retorna array de {producto, vendor, descripcion, relevanciaLegal}
     */
    function getVendorsForSigla(sigla) {
        if (!capacidadesData || !Array.isArray(capacidadesData.capacidades)) return [];

        var cap = capacidadesData.capacidades.find(function (c) {
            return c.sigla === sigla;
        });

        if (!cap || !Array.isArray(cap.ejemplosVendors)) return [];
        return cap.ejemplosVendors;
    }

    // ═══════════════════════════════════════
    // INICIAR
    // ═══════════════════════════════════════

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();