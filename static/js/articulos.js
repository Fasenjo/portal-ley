/**
 * articulos.js - Funcionalidad de la vista de artículos
 * Ley 21.719 - Guía de Implementación
 */

(function() {
    'use strict';

    // =========================================
    // Local utilities (no dependencies)
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
            console.error('Error loading JSON:', error);
            return null;
        }
    }

    // =========================================
    // Data store
    // =========================================
    
    var articulosData = null;
    var currentArticle = 'art3';

    // =========================================
    // Initialize
    // =========================================
    
    async function init() {
        console.log('[articulos.js] Inicializando...');
        
        // Load articles data
        articulosData = await loadJSON('/data/articulos.json');
        
        if (!articulosData || !articulosData.articulos) {
            console.error('[articulos.js] Error: No se pudieron cargar los datos');
            showError('Error al cargar los datos de artículos.');
            return;
        }
        
        console.log('[articulos.js] Artículos cargados:', articulosData.articulos.length);
        
        // Setup event listeners
        setupFilters();
        setupArticleList();
        setupDetailTabs();
        
        // Load first article and show content
        loadArticle('art3');
        
        console.log('[articulos.js] Inicialización completa');
    }
    
    function showError(message) {
        var summaryEl = document.getElementById('detail-summary');
        if (summaryEl) {
            summaryEl.innerHTML = '<p class="error" style="color: #dc2626;">' + message + '</p>';
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
                
                var filter = this.dataset.filter;
                filterArticles(filter);
            });
        });
    }
    
    function filterArticles(filter) {
        var groups = document.querySelectorAll('.article-group');
        
        groups.forEach(function(group) {
            if (filter === 'todos' || group.dataset.category === filter) {
                group.style.display = '';
            } else {
                group.style.display = 'none';
            }
        });
    }

    // =========================================
    // Article list selection
    // =========================================
    
    function setupArticleList() {
        var articleItems = document.querySelectorAll('.article-item');
        console.log('[articulos.js] Artículos en sidebar:', articleItems.length);
        
        articleItems.forEach(function(item) {
            item.addEventListener('click', function() {
                articleItems.forEach(function(i) {
                    i.classList.remove('article-item--active');
                    i.setAttribute('aria-pressed', 'false');
                });
                this.classList.add('article-item--active');
                this.setAttribute('aria-pressed', 'true');
                
                var articleId = this.dataset.article;
                console.log('[articulos.js] Click en artículo:', articleId);
                loadArticle(articleId);
            });
        });
    }

    // =========================================
    // Detail tabs (Resumen, Texto Completo, Requisitos)
    // =========================================
    
    function setupDetailTabs() {
        var tabs = document.querySelectorAll('.detail-tab');
        console.log('[articulos.js] Tabs de detalle:', tabs.length);
        
        tabs.forEach(function(tab) {
            tab.addEventListener('click', function() {
                var tabName = this.dataset.tab;
                console.log('[articulos.js] Click en tab:', tabName);
                
                // Update active state on tabs
                tabs.forEach(function(t) {
                    t.classList.remove('detail-tab--active');
                    t.setAttribute('aria-selected', 'false');
                });
                this.classList.add('detail-tab--active');
                this.setAttribute('aria-selected', 'true');
                
                // Show corresponding panel
                showPanel(tabName);
            });
        });
    }
    
    function showPanel(panelName) {
        var panels = document.querySelectorAll('.content-panel');
        console.log('[articulos.js] Mostrando panel:', panelName, '- Total paneles:', panels.length);
        
        panels.forEach(function(panel) {
            var panelId = 'panel-' + panelName;
            if (panel.id === panelId) {
                panel.classList.add('content-panel--active');
                panel.style.display = 'block';
                console.log('[articulos.js] Panel activado:', panel.id);
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
        console.log('[articulos.js] Cargando artículo:', articleId);
        
        if (!articulosData || !articulosData.articulos) {
            console.error('[articulos.js] No hay datos de artículos');
            return;
        }
        
        var article = articulosData.articulos.find(function(a) {
            return a.id === articleId;
        });
        
        if (!article) {
            console.error('[articulos.js] Artículo no encontrado:', articleId);
            showError('Artículo no encontrado: ' + articleId);
            return;
        }
        
        console.log('[articulos.js] Artículo encontrado:', article.titulo);
        currentArticle = articleId;
        
        // Update header
        updateElement('detail-category', article.categoria);
        updateElement('detail-number', article.numero);
        updateElement('detail-title', article.titulo);
        
        // Update RESUMEN panel
        var summaryEl = document.getElementById('detail-summary');
        if (summaryEl) {
            var resumenHTML = '<p>' + escapeHTML(article.resumen) + '</p>';
            summaryEl.innerHTML = resumenHTML;
            console.log('[articulos.js] Resumen actualizado:', article.resumen.substring(0, 50) + '...');
        } else {
            console.error('[articulos.js] No se encontró #detail-summary');
        }
        
        // Update TEXTO COMPLETO panel
        var textoEl = document.getElementById('detail-texto');
        if (textoEl) {
            textoEl.innerHTML = '<div class="legal-text__content">' + article.textoCompleto + '</div>';
            console.log('[articulos.js] Texto completo actualizado');
        } else {
            console.error('[articulos.js] No se encontró #detail-texto');
        }
        
        // Update REQUISITOS TÉCNICOS panel
        updateTechnicalRequirements(article);
        
        // Update capacities section
        updateCapacities(article.capacidades);
        
        // Update controls section
        updateControls(article.controles);
        
        // Ensure summary tab is active and visible
        activateSummaryTab();
    }
    
    function updateElement(id, text) {
        var el = document.getElementById(id);
        if (el) {
            el.textContent = text;
        }
    }
    
    function activateSummaryTab() {
        // Activate summary tab
        var tabs = document.querySelectorAll('.detail-tab');
        tabs.forEach(function(t) {
            if (t.dataset.tab === 'resumen') {
                t.classList.add('detail-tab--active');
                t.setAttribute('aria-selected', 'true');
            } else {
                t.classList.remove('detail-tab--active');
                t.setAttribute('aria-selected', 'false');
            }
        });
        
        // Show summary panel
        showPanel('resumen');
    }
    
    function updateTechnicalRequirements(article) {
        var container = document.getElementById('detail-tecnico');
        if (!container) {
            console.error('[articulos.js] No se encontró #detail-tecnico');
            return;
        }
        
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
        console.log('[articulos.js] Requisitos técnicos actualizados');
    }
    
    function updateCapacities(capacidades) {
        var container = document.getElementById('detail-capacidades');
        if (!container) return;
        
        if (!capacidades || capacidades.length === 0) {
            container.innerHTML = '<p class="text-muted">Sin capacidades asociadas.</p>';
            return;
        }
        
        // Sort by criticality: CORE first, then ESSENTIAL, then COMPLEMENTARY
        var sorted = capacidades.slice().sort(function(a, b) {
            var order = { 'core': 0, 'essential': 1, 'complementary': 2 };
            var aLevel = a.criticidad.toLowerCase();
            var bLevel = b.criticidad.toLowerCase();
            var aOrder = order[aLevel] !== undefined ? order[aLevel] : 3;
            var bOrder = order[bLevel] !== undefined ? order[bLevel] : 3;
            return aOrder - bOrder;
        });
        
        var html = '';
        sorted.forEach(function(cap) {
            var level = cap.criticidad.toLowerCase();
            var levelDisplay = cap.criticidad.toUpperCase();
            
            html += '<a href="/capacidades#' + cap.sigla.toLowerCase() + '" ';
            html += 'class="capacity-tag capacity-tag--' + level + '" ';
            html += 'data-capacity="' + escapeHTML(cap.sigla) + '">';
            html += '<span class="capacity-tag__sigla">' + escapeHTML(cap.sigla) + '</span>';
            html += '<span class="tag tag--' + level + '">' + levelDisplay + '</span>';
            html += '</a>';
        });
        
        container.innerHTML = html;
    }
    
    function updateControls(controles) {
        var container = document.getElementById('detail-controles');
        if (!container) return;
        
        var html = '';
        
        // ISO 27001
        if (controles && controles.iso27001 && controles.iso27001.length > 0) {
            html += '<div class="control-block">';
            html += '<h4 class="control-block__title">ISO 27001:2022</h4>';
            html += '<div class="control-block__items">';
            controles.iso27001.forEach(function(c) {
                html += '<span class="control-code">' + escapeHTML(c) + '</span>';
            });
            html += '</div></div>';
        }
        
        // ISO 27701
        if (controles && controles.iso27701 && controles.iso27701.length > 0) {
            html += '<div class="control-block">';
            html += '<h4 class="control-block__title">ISO 27701</h4>';
            html += '<div class="control-block__items">';
            controles.iso27701.forEach(function(c) {
                html += '<span class="control-code">' + escapeHTML(c) + '</span>';
            });
            html += '</div></div>';
        }
        
        // NIST
        if (controles && controles.nist && controles.nist.length > 0) {
            html += '<div class="control-block">';
            html += '<h4 class="control-block__title">NIST SP 800-53</h4>';
            html += '<div class="control-block__items">';
            controles.nist.forEach(function(c) {
                html += '<span class="control-code">' + escapeHTML(c) + '</span>';
            });
            html += '</div></div>';
        }
        
        container.innerHTML = html || '<p class="text-muted">No hay controles de referencia especificados.</p>';
    }

    // =========================================
    // Start
    // =========================================
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
