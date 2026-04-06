/**
 * capacidades.js - Funcionalidad de la vista de capacidades
 * Ley 21.719 - Guía de Implementación
 * v2.1 — Con diagnóstico exhaustivo
 */

(function() {
    'use strict';

    console.log('[capacidades.js] ====== Script cargado ======');

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
            console.log('[capacidades.js] Fetching:', url);
            var response = await fetch(url);
            console.log('[capacidades.js] Response:', response.status, 'for', url);
            if (!response.ok) throw new Error('HTTP error! status: ' + response.status);
            var data = await response.json();
            console.log('[capacidades.js] JSON OK:', url);
            return data;
        } catch (error) {
            console.error('[capacidades.js] FETCH ERROR:', url, error.message);
            return null;
        }
    }

    // =========================================
    // Data store
    // =========================================
    
    var capacidadesData = null;
    var matrizData = null;
    var articulosData = null;
    var currentCapacity = null;

    // =========================================
    // Initialize
    // =========================================
    
    async function init() {
        try {
            console.log('[capacidades.js] >>> init() START');
            
            var results = await Promise.all([
                loadJSON('/data/capacidades.json'),
                loadJSON('/data/matriz.json'),
                loadJSON('/data/articulos.json')
            ]);
            
            capacidadesData = results[0];
            matrizData = results[1];
            articulosData = results[2];
            
            console.log('[capacidades.js] Data loaded:', {
                capacidades: capacidadesData ? capacidadesData.capacidades.length : 'FAILED',
                matriz: matrizData ? 'OK' : 'FAILED',
                articulos: articulosData ? articulosData.articulos.length : 'FAILED'
            });
            
            if (!capacidadesData) {
                console.error('[capacidades.js] FATAL: No data');
                return;
            }
            
            setupCapacityCards();
            setupDetailPanel();
            
            // Check hash navigation
            var hash = window.location.hash.slice(1);
            if (hash) {
                console.log('[capacidades.js] Hash found:', hash);
                var card = document.querySelector('[data-capacity="' + hash + '"]');
                if (card) {
                    setTimeout(function() {
                        openCapacityDetail(hash);
                        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 100);
                }
            }
            
            console.log('[capacidades.js] >>> init() COMPLETE');
        } catch (error) {
            console.error('[capacidades.js] FATAL ERROR:', error.message);
            console.error('[capacidades.js] Stack:', error.stack);
        }
    }

    // =========================================
    // Capacity cards
    // =========================================
    
    function setupCapacityCards() {
        var cards = document.querySelectorAll('.capacity-card');
        console.log('[capacidades.js] Cards found:', cards.length);
        
        cards.forEach(function(card) {
            card.addEventListener('click', function() {
                var capId = this.dataset.capacity;
                console.log('[capacidades.js] Card click:', capId);
                openCapacityDetail(capId);
            });
            
            card.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openCapacityDetail(this.dataset.capacity);
                }
            });
        });
    }

    // =========================================
    // Detail panel
    // =========================================
    
    function setupDetailPanel() {
        var detailPanel = document.getElementById('capacity-detail');
        var closeBtn = detailPanel ? detailPanel.querySelector('.capacity-detail__close') : null;
        
        if (closeBtn) {
            closeBtn.addEventListener('click', closeCapacityDetail);
        }
        
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && currentCapacity) {
                closeCapacityDetail();
            }
        });
    }
    
    function openCapacityDetail(capId) {
        try {
            console.log('[capacidades.js] openCapacityDetail:', capId);
            
            if (!capacidadesData || !capacidadesData.capacidades) {
                console.error('[capacidades.js] No data for detail');
                return;
            }
            
            var capacity = capacidadesData.capacidades.find(function(c) { return c.id === capId; });
            if (!capacity) {
                console.error('[capacidades.js] Capacity not found:', capId);
                return;
            }
            
            console.log('[capacidades.js] Found:', capacity.sigla, capacity.nombre);
            currentCapacity = capId;
            
            var panel = document.getElementById('capacity-detail');
            if (!panel) {
                console.error('[capacidades.js] Panel #capacity-detail not found');
                return;
            }
            
            // Update content
            document.getElementById('cap-detail-sigla').textContent = capacity.sigla;
            document.getElementById('cap-detail-name').textContent = capacity.nombre;
            document.getElementById('cap-detail-desc').textContent = capacity.descripcion;
            
            // Funcionalidades
            var funcList = document.getElementById('cap-detail-funcionalidades');
            if (funcList) {
                funcList.innerHTML = capacity.funcionalidades.map(function(f) { return '<li>' + escapeHTML(f) + '</li>'; }).join('');
            }
            
            // Vendors
            updateVendorExamples(capacity.ejemplosVendors);
            
            // Artículos relacionados
            updateRelatedArticles(capacity.sigla);
            
            // Controles
            updateCapacityControls(capacity.controles);
            
            // Show panel
            panel.hidden = false;
            panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
            history.replaceState(null, '', '#' + capId);
            
            // Highlight card
            document.querySelectorAll('.capacity-card').forEach(function(card) {
                card.classList.toggle('capacity-card--active', card.dataset.capacity === capId);
            });
            
            console.log('[capacidades.js] Detail panel opened OK');
        } catch (error) {
            console.error('[capacidades.js] ERROR in openCapacityDetail:', error.message);
            console.error('[capacidades.js] Stack:', error.stack);
        }
    }
    
    function updateVendorExamples(vendors) {
        var container = document.getElementById('cap-detail-vendors');
        if (!container) return;
        
        if (!vendors || vendors.length === 0) {
            container.innerHTML = '<p class="text-muted">Sin ejemplos de productos.</p>';
            return;
        }

        var html = '<div class="vendor-cards">';
        vendors.forEach(function(vendor) {
            if (typeof vendor === 'string') {
                html += '<div class="vendor-card vendor-card--simple"><p class="vendor-card__product">' + escapeHTML(vendor) + '</p></div>';
            } else {
                html += '<div class="vendor-card">';
                html += '<div class="vendor-card__header">';
                html += '<span class="vendor-card__product">' + escapeHTML(vendor.producto) + '</span>';
                html += '<span class="vendor-card__vendor">' + escapeHTML(vendor.vendor) + '</span>';
                html += '</div>';
                if (vendor.descripcion) html += '<p class="vendor-card__desc">' + escapeHTML(vendor.descripcion) + '</p>';
                if (vendor.relevanciaLegal) html += '<p class="vendor-card__legal"><strong>Relevancia legal:</strong> ' + escapeHTML(vendor.relevanciaLegal) + '</p>';
                html += '</div>';
            }
        });
        html += '</div>';
        container.innerHTML = html;
    }
    
    function closeCapacityDetail() {
        var panel = document.getElementById('capacity-detail');
        if (panel) panel.hidden = true;
        currentCapacity = null;
        history.replaceState(null, '', window.location.pathname);
        document.querySelectorAll('.capacity-card').forEach(function(card) {
            card.classList.remove('capacity-card--active');
        });
    }
    
    function updateRelatedArticles(sigla) {
        var container = document.getElementById('cap-detail-articulos');
        if (!container || !matrizData) return;
        
        var relaciones = matrizData.matriz.relaciones;
        var articles = { core: [], esencial: [], complementaria: [] };
        
        Object.keys(relaciones).forEach(function(artId) {
            var caps = relaciones[artId];
            if (caps[sigla]) {
                var nivel = caps[sigla].nivel;
                var artInfo = articulosData ? articulosData.articulos.find(function(a) { return a.id === artId; }) : null;
                if (articles[nivel]) {
                    articles[nivel].push({
                        id: artId,
                        numero: artInfo ? artInfo.numero : artId,
                        titulo: artInfo ? artInfo.titulo : ''
                    });
                }
            }
        });
        
        var html = '';
        
        ['core', 'esencial', 'complementaria'].forEach(function(nivel) {
            if (articles[nivel].length > 0) {
                var tagClass = nivel === 'esencial' ? 'essential' : nivel;
                var label = nivel.charAt(0).toUpperCase() + nivel.slice(1);
                html += '<div class="related-articles__group">';
                html += '<h4 class="related-articles__label"><span class="tag tag--' + tagClass + '">' + label + '</span> <span>(' + articles[nivel].length + ')</span></h4>';
                html += '<div class="related-articles__list">';
                articles[nivel].forEach(function(a) {
                    html += '<a href="/articulos#' + a.id + '" class="related-article">';
                    html += '<span class="related-article__number">' + escapeHTML(a.numero) + '</span>';
                    html += '<span class="related-article__title">' + escapeHTML(a.titulo) + '</span>';
                    html += '</a>';
                });
                html += '</div></div>';
            }
        });
        
        container.innerHTML = html || '<p class="text-muted">Sin artículos relacionados.</p>';
    }
    
    function updateCapacityControls(controles) {
        var container = document.getElementById('cap-detail-controles');
        if (!container) return;
        
        var html = '';
        
        ['iso27001', 'iso27701', 'nist'].forEach(function(framework) {
            if (controles[framework] && controles[framework].length > 0) {
                var titles = { iso27001: 'ISO 27001:2022', iso27701: 'ISO 27701', nist: 'NIST SP 800-53' };
                html += '<div class="control-block"><h4 class="control-block__title">' + titles[framework] + '</h4>';
                html += '<ul class="control-block__list">';
                controles[framework].forEach(function(c) {
                    html += '<li><strong>' + escapeHTML(c.codigo) + '</strong> <span>' + escapeHTML(c.descripcion) + '</span></li>';
                });
                html += '</ul></div>';
            }
        });
        
        container.innerHTML = html || '<p class="text-muted">No hay controles especificados.</p>';
    }

    // =========================================
    // Start
    // =========================================
    
    console.log('[capacidades.js] readyState:', document.readyState);
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
