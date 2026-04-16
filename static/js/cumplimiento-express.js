/**
 * cumplimiento-express.js - Tarjetas interactivas con revelación animada
 * Ley 21.719 - Guía de Implementación
 * 
 * Funcionalidad:
 * - Carga datos de artículos desde JSON
 * - Maneja selección de tarjetas
 * - Anima la revelación de capacidades de izquierda a derecha
 */

(function() {
    'use strict';

    console.log('[cumplimiento-express.js] Script cargado');

    // =========================================
    // Configuración
    // =========================================
    
    var DATA_URL = '/data/articulos.json';
    var articulosData = null;
    var currentArticle = null;

    // =========================================
    // Utilidades
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
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return await response.json();
        } catch (error) {
            console.error('[cumplimiento-express.js] Error cargando JSON:', error);
            return null;
        }
    }

    // =========================================
    // Inicialización
    // =========================================

    async function init() {
        console.log('[cumplimiento-express.js] Inicializando...');
        
        // Verificar que existe la sección
        var section = document.querySelector('.cumplimiento-express');
        if (!section) {
            console.log('[cumplimiento-express.js] Sección no encontrada, saliendo');
            return;
        }

        // Cargar datos
        articulosData = await loadJSON(DATA_URL);
        if (!articulosData || !articulosData.articulos) {
            console.error('[cumplimiento-express.js] No se pudieron cargar artículos');
            return;
        }

        console.log('[cumplimiento-express.js] Artículos cargados:', articulosData.articulos.length);

        // Bindear eventos
        bindCardEvents();
        
        // Cargar primer artículo automáticamente después de un pequeño delay
        setTimeout(function() {
            var firstCard = document.querySelector('.express-card');
            if (firstCard) {
                var artId = firstCard.getAttribute('data-article');
                if (artId) selectArticle(artId);
            }
        }, 500);
    }

    // =========================================
    // Eventos
    // =========================================

    function bindCardEvents() {
        var cards = document.querySelectorAll('.express-card');
        
        cards.forEach(function(card) {
            card.addEventListener('click', function() {
                var artId = this.getAttribute('data-article');
                if (artId) selectArticle(artId);
            });

            // Soporte para teclado
            card.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    var artId = this.getAttribute('data-article');
                    if (artId) selectArticle(artId);
                }
            });
        });
    }

    // =========================================
    // Selección de artículo
    // =========================================

    function selectArticle(artId) {
        console.log('[cumplimiento-express.js] Seleccionando:', artId);

        // Evitar re-selección del mismo
        if (currentArticle === artId) return;
        currentArticle = artId;

        // Buscar artículo en datos
        var article = articulosData.articulos.find(function(a) {
            return a.id === artId;
        });

        if (!article) {
            console.error('[cumplimiento-express.js] Artículo no encontrado:', artId);
            return;
        }

        // Actualizar estado visual de tarjetas
        updateCardStates(artId);

        // Actualizar panel izquierdo (instantáneo)
        updateLeftPanel(article);

        // Actualizar panel derecho (con animación)
        updateRightPanel(article);
    }

    function updateCardStates(activeId) {
        var cards = document.querySelectorAll('.express-card');
        cards.forEach(function(card) {
            var isActive = card.getAttribute('data-article') === activeId;
            card.classList.toggle('express-card--active', isActive);
            card.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
    }

    // =========================================
    // Panel Izquierdo (Artículo)
    // =========================================

    function updateLeftPanel(article) {
        var leftPanel = document.getElementById('express-left');
        if (!leftPanel) return;

        leftPanel.innerHTML = [
            '<span class="express-detail__num">' + escapeHTML(article.numero) + '</span>',
            '<h3 class="express-detail__title">' + escapeHTML(article.titulo) + '</h3>',
            '<p class="express-detail__resumen">' + escapeHTML(article.resumen) + '</p>',
            '<a href="/articulos#' + article.id + '" class="express-detail__link">',
            '    Ver detalle completo <span aria-hidden="true">→</span>',
            '</a>'
        ].join('\n');
    }

    // =========================================
    // Panel Derecho (Capacidades con animación)
    // =========================================

    function updateRightPanel(article) {
        var rightPanel = document.getElementById('express-right');
        if (!rightPanel) return;

        // Clasificar capacidades por nivel
        var capacidades = article.capacidades || [];
        var core = capacidades.filter(function(c) { return c.criticidad === 'core'; });
        var esencial = capacidades.filter(function(c) { return c.criticidad === 'esencial'; });
        var complementaria = capacidades.filter(function(c) { return c.criticidad === 'complementaria'; });

        // Construir HTML
        var html = '<div class="reveal-container">';

        // Sección Core
        if (core.length > 0) {
            html += buildCapacitySection('Core', 'Imprescindibles', core, 'core');
        }

        // Sección Esencial
        if (esencial.length > 0) {
            html += buildCapacitySection('Esencial', 'Altamente recomendadas', esencial, 'esencial');
        }

        // Sección Complementaria
        if (complementaria.length > 0) {
            html += buildCapacitySection('Complementaria', 'Valor agregado', complementaria, 'complementaria');
        }

        html += '</div>';

        // Insertar contenido
        rightPanel.innerHTML = html;

        // Activar animación con delay escalonado
        requestAnimationFrame(function() {
            var sections = rightPanel.querySelectorAll('.reveal-section');
            sections.forEach(function(section, index) {
                setTimeout(function() {
                    section.classList.add('reveal-section--visible');
                }, index * 150);
            });
        });
    }

    function buildCapacitySection(title, subtitle, capacidades, nivel) {
        var html = '<div class="reveal-section">';
        
        // Título de sección
        html += '<h4 class="caps-section__title">' + escapeHTML(title) + ' — ' + escapeHTML(subtitle) + '</h4>';
        
        // Grid de badges
        html += '<div class="caps-grid">';
        capacidades.forEach(function(cap) {
            html += [
                '<a href="/capacidades#' + getSiglaId(cap.sigla) + '" ',
                '   class="cap-badge cap-badge--' + nivel + '" ',
                '   title="' + escapeHTML(cap.justificacion) + '">',
                '    <span class="cap-badge__sigla">' + escapeHTML(cap.sigla) + '</span>',
                '</a>'
            ].join('');
        });
        html += '</div>';

        // Mostrar primera justificación como ejemplo
        if (capacidades.length > 0) {
            var firstCap = capacidades[0];
            html += [
                '<div class="cap-justificacion cap-justificacion--' + nivel + '">',
                '    <strong>' + escapeHTML(firstCap.sigla) + ':</strong> ',
                '    ' + escapeHTML(firstCap.justificacion),
                '</div>'
            ].join('');
        }

        html += '</div>';
        return html;
    }

    // =========================================
    // Mapeo de siglas a IDs (para URLs)
    // =========================================

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

    function getSiglaId(sigla) {
        return siglaToId[sigla] || sigla.toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    // =========================================
    // Iniciar cuando DOM esté listo
    // =========================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
