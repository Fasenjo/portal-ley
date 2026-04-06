/**
 * articulos.js - Funcionalidad de la vista de artículos
 * Ley 21.719 - Guía de Implementación
 * v2.1 — Con diagnóstico exhaustivo
 */

(function() {
    'use strict';

    console.log('[articulos.js] ====== Script cargado ======');

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
            console.log('[articulos.js] Fetching:', url);
            var response = await fetch(url);
            console.log('[articulos.js] Response:', response.status, response.statusText, 'for', url);
            if (!response.ok) {
                throw new Error('HTTP error! status: ' + response.status);
            }
            var data = await response.json();
            console.log('[articulos.js] JSON OK:', url, typeof data);
            return data;
        } catch (error) {
            console.error('[articulos.js] FETCH ERROR:', url, error.message);
            return null;
        }
    }

    // =========================================
    // Sigla-to-ID mapping
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
    // Data store
    // =========================================
    
    var articulosData = null;
    var capacidadesData = null;
    var currentArticle = 'art3';

    // =========================================
    // Initialize
    // =========================================
    
    async function init() {
        try {
            console.log('[articulos.js] >>> init() START');
            
            articulosData = await loadJSON('/data/articulos.json');
            
            if (!articulosData || !articulosData.articulos) {
                console.error('[articulos.js] FATAL: No se pudieron cargar artículos');
                showError('Error al cargar los datos de artículos.');
                return;
            }
            
            console.log('[articulos.js] Artículos OK:', articulosData.articulos.length);
            
            capacidadesData = await loadJSON('/data/capacidades.json');
            console.log('[articulos.js] Capacidades:', capacidadesData ? 'OK' : 'FAILED');
            
            console.log('[articulos.js] Configurando UI...');
            setupFilters();
            setupArticleList();
            setupDetailTabs();
            
            console.log('[articulos.js] Llamando loadArticle(art3)...');
            loadArticle('art3');
            
            console.log('[articulos.js] >>> init() COMPLETE');
        } catch (error) {
            console.error('[articulos.js] FATAL ERROR en init():', error.message);
            console.error('[articulos.js] Stack:', error.stack);
            showError('Error fatal: ' + error.message);
        }
    }
    
    function showError(message) {
        var summaryEl = document.getElementById('detail-summary');
        if (summaryEl) {
            summaryEl.innerHTML = '<p style="color: #dc2626; font-weight: bold;">' + message + '</p>';
        }
    }

    // =========================================
    // Filter tabs
    // =========================================
    
    function setupFilters() {
        var filterTabs = document.querySelectorAll('.filter-tab');
        filterTabs.forEach(function(tab) {
            tab.addEventListener('click', function() {
                filterTabs.forEach(function(t) {
                    t.classList.remove('filter-tab--active');
                    t.setAttribute('aria-selected', 'false');
                });
                this.classList.add('filter-tab--active');
                this.setAttribute('aria-selected', 'true');
                filterArticles(this.dataset.filter);
            });
        });
    }
    
    function filterArticles(filter) {
        document.querySelectorAll('.article-group').forEach(function(group) {
            group.style.display = (filter === 'todos' || group.dataset.category === filter) ? '' : 'none';
        });
    }

    // =========================================
    // Article list selection
    // =========================================
    
    function setupArticleList() {
        var articleItems = document.querySelectorAll('.article-item');
        console.log('[articulos.js] Sidebar items:', articleItems.length);
        
        articleItems.forEach(function(item) {
            item.addEventListener('click', function() {
                articleItems.forEach(function(i) {
                    i.classList.remove('article-item--active');
                    i.setAttribute('aria-pressed', 'false');
                });
                this.classList.add('article-item--active');
                this.setAttribute('aria-pressed', 'true');
                loadArticle(this.dataset.article);
            });
        });
    }

    // =========================================
    // Detail tabs
    // =========================================
    
    function setupDetailTabs() {
        var tabs = document.querySelectorAll('.detail-tab');
        console.log('[articulos.js] Tabs:', tabs.length);
        
        tabs.forEach(function(tab) {
            tab.addEventListener('click', function() {
                var tabName = this.dataset.tab;
                tabs.forEach(function(t) {
                    t.classList.remove('detail-tab--active');
                    t.setAttribute('aria-selected', 'false');
                });
                this.classList.add('detail-tab--active');
                this.setAttribute('aria-selected', 'true');
                showPanel(tabName);
            });
        });
    }
    
    function showPanel(panelName) {
        document.querySelectorAll('.content-panel').forEach(function(panel) {
            if (panel.id === 'panel-' + panelName) {
                panel.classList.add('content-panel--active');
                panel.style.display = 'block';
            } else {
                panel.classList.remove('content-panel--active');
                panel.style.display = 'none';
            }
        });
    }

    // =========================================
    // Load article content
    // =========================================
    
    function loadArticle(articleId) {
        try {
            console.log('[articulos.js] loadArticle(' + articleId + ')');
            
            if (!articulosData || !articulosData.articulos) {
                console.error('[articulos.js] No hay datos');
                return;
            }
            
            var article = articulosData.articulos.find(function(a) { return a.id === articleId; });
            
            if (!article) {
                console.error('[articulos.js] No encontrado:', articleId);
                showError('Artículo no encontrado: ' + articleId);
                return;
            }
            
            console.log('[articulos.js] Encontrado:', article.titulo);
            currentArticle = articleId;
            
            // Header
            updateElement('detail-category', article.categoria);
            updateElement('detail-number', article.numero);
            updateElement('detail-title', article.titulo);
            console.log('[articulos.js] Header OK');
            
            // Resumen
            var summaryEl = document.getElementById('detail-summary');
            if (summaryEl) {
                summaryEl.innerHTML = '<p>' + escapeHTML(article.resumen) + '</p>';
                console.log('[articulos.js] Resumen OK');
            }
            
            // Texto completo
            var textoEl = document.getElementById('detail-texto');
            if (textoEl) {
                textoEl.innerHTML = '<div class="legal-text__content">' + article.textoCompleto + '</div>';
                console.log('[articulos.js] Texto OK');
            }
            
            // Requisitos técnicos
            updateTechnicalRequirements(article);
            console.log('[articulos.js] Requisitos OK');
            
            // Tecnologías
            updateTechnologyExamples(article);
            console.log('[articulos.js] Tecnologías OK');
            
            // Capacidades
            updateCapacities(article.capacidades);
            console.log('[articulos.js] Capacidades OK');
            
            // Controles
            updateControls(article.controles);
            console.log('[articulos.js] Controles OK');
            
            // Activar tab resumen
            activateSummaryTab();
            console.log('[articulos.js] loadArticle COMPLETE');
            
        } catch (error) {
            console.error('[articulos.js] ERROR en loadArticle:', error.message);
            console.error('[articulos.js] Stack:', error.stack);
            showError('Error: ' + error.message);
        }
    }
    
    function updateElement(id, text) {
        var el = document.getElementById(id);
        if (el) el.textContent = text;
    }
    
    function activateSummaryTab() {
        document.querySelectorAll('.detail-tab').forEach(function(t) {
            if (t.dataset.tab === 'resumen') {
                t.classList.add('detail-tab--active');
                t.setAttribute('aria-selected', 'true');
            } else {
                t.classList.remove('detail-tab--active');
                t.setAttribute('aria-selected', 'false');
            }
        });
        showPanel('resumen');
    }
    
    function updateTechnicalRequirements(article) {
        var container = document.getElementById('detail-tecnico');
        if (!container) return;
        
        var html = '<div class="requirements">';
        html += '<h4 class="requirements__heading">Requisitos por Capacidad</h4>';
        html += '<div class="requirements__list">';
        
        if (article.capacidades && article.capacidades.length > 0) {
            article.capacidades.forEach(function(cap) {
                var levelClass = cap.criticidad.toLowerCase();
                html += '<div class="requirement-item">';
                html += '<span class="requirement-item__sigla">' + escapeHTML(cap.sigla) + '</span>';
                html += '<span class="tag tag--' + levelClass + '">' + escapeHTML(cap.criticidad.toUpperCase()) + '</span>';
                html += '<p class="requirement-item__justification">' + escapeHTML(cap.justificacion) + '</p>';
                html += '</div>';
            });
        } else {
            html += '<p class="text-muted">Sin requisitos técnicos especificados.</p>';
        }
        
        html += '</div></div>';
        container.innerHTML = html;
    }

    // =========================================
    // Technology Examples tab
    // =========================================

    function updateTechnologyExamples(article) {
        var container = document.getElementById('detail-tecnologias');
        if (!container) return;

        if (!capacidadesData || !capacidadesData.capacidades || !article.capacidades) {
            container.innerHTML = '<p class="text-muted">No hay ejemplos de tecnologías disponibles.</p>';
            return;
        }

        var html = '<div class="tech-examples">';

        article.capacidades.forEach(function(artCap) {
            var capData = capacidadesData.capacidades.find(function(c) {
                return c.sigla === artCap.sigla;
            });

            if (!capData || !capData.ejemplosVendors || capData.ejemplosVendors.length === 0) return;

            var levelClass = artCap.criticidad.toLowerCase();
            var capId = getCapacityId(artCap.sigla);

            html += '<div class="tech-examples__group">';
            html += '<div class="tech-examples__header">';
            html += '<a href="/capacidades#' + capId + '" class="tech-examples__cap-link">';
            html += '<span class="tech-examples__sigla">' + escapeHTML(artCap.sigla) + '</span>';
            html += '<span class="tech-examples__name">' + escapeHTML(capData.nombre) + '</span>';
            html += '</a>';
            html += '<span class="tag tag--' + levelClass + '">' + escapeHTML(artCap.criticidad.toUpperCase()) + '</span>';
            html += '</div>';

            html += '<div class="tech-examples__vendors">';
            capData.ejemplosVendors.forEach(function(vendor) {
                if (typeof vendor === 'string') {
                    html += '<div class="vendor-card"><p class="vendor-card__product">' + escapeHTML(vendor) + '</p></div>';
                } else {
                    html += '<div class="vendor-card">';
                    html += '<div class="vendor-card__header">';
                    html += '<span class="vendor-card__product">' + escapeHTML(vendor.producto) + '</span>';
                    html += '<span class="vendor-card__vendor">' + escapeHTML(vendor.vendor) + '</span>';
                    html += '</div>';
                    if (vendor.descripcion) {
                        html += '<p class="vendor-card__desc">' + escapeHTML(vendor.descripcion) + '</p>';
                    }
                    if (vendor.relevanciaLegal) {
                        html += '<p class="vendor-card__legal"><strong>Relevancia legal:</strong> ' + escapeHTML(vendor.relevanciaLegal) + '</p>';
                    }
                    html += '</div>';
                }
            });
            html += '</div></div>';
        });

        html += '</div>';
        container.innerHTML = html;
    }
    
    function updateCapacities(capacidades) {
        var container = document.getElementById('detail-capacidades');
        if (!container) return;
        
        if (!capacidades || capacidades.length === 0) {
            container.innerHTML = '<p class="text-muted">Sin capacidades asociadas.</p>';
            return;
        }
        
        var sorted = capacidades.slice().sort(function(a, b) {
            var order = { 'core': 0, 'esencial': 1, 'complementaria': 2 };
            return (order[a.criticidad.toLowerCase()] || 3) - (order[b.criticidad.toLowerCase()] || 3);
        });
        
        var html = '';
        sorted.forEach(function(cap) {
            var level = cap.criticidad.toLowerCase();
            var capId = getCapacityId(cap.sigla);
            html += '<a href="/capacidades#' + capId + '" class="capacity-tag capacity-tag--' + level + '" data-capacity="' + escapeHTML(cap.sigla) + '">';
            html += '<span class="capacity-tag__sigla">' + escapeHTML(cap.sigla) + '</span>';
            html += '<span class="tag tag--' + level + '">' + escapeHTML(cap.criticidad.toUpperCase()) + '</span>';
            html += '</a>';
        });
        
        container.innerHTML = html;
    }
    
    function updateControls(controles) {
        var container = document.getElementById('detail-controles');
        if (!container) return;
        
        var html = '';
        
        if (controles && controles.iso27001 && controles.iso27001.length > 0) {
            html += '<div class="control-block"><h4 class="control-block__title">ISO 27001:2022</h4><div class="control-block__items">';
            controles.iso27001.forEach(function(c) { html += '<span class="control-code">' + escapeHTML(c) + '</span>'; });
            html += '</div></div>';
        }
        
        if (controles && controles.iso27701 && controles.iso27701.length > 0) {
            html += '<div class="control-block"><h4 class="control-block__title">ISO 27701</h4><div class="control-block__items">';
            controles.iso27701.forEach(function(c) { html += '<span class="control-code">' + escapeHTML(c) + '</span>'; });
            html += '</div></div>';
        }
        
        if (controles && controles.nist && controles.nist.length > 0) {
            html += '<div class="control-block"><h4 class="control-block__title">NIST SP 800-53</h4><div class="control-block__items">';
            controles.nist.forEach(function(c) { html += '<span class="control-code">' + escapeHTML(c) + '</span>'; });
            html += '</div></div>';
        }
        
        container.innerHTML = html || '<p class="text-muted">No hay controles de referencia especificados.</p>';
    }

    // =========================================
    // Start
    // =========================================
    
    console.log('[articulos.js] readyState:', document.readyState);
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
