/**
 * capacidades.js - Funcionalidad de la vista de capacidades
 * Ley 21.719 - Guía de Implementación
 */

(function() {
    'use strict';

    // =========================================
    // Data store
    // =========================================
    
    let capacidadesData = null;
    let matrizData = null;
    let articulosData = null;
    let currentCapacity = null;

    // =========================================
    // Initialize
    // =========================================
    
    async function init() {
        // Load data
        const [caps, matriz, arts] = await Promise.all([
            loadJSON('/data/capacidades.json'),
            loadJSON('/data/matriz.json'),
            loadJSON('/data/articulos.json')
        ]);
        
        capacidadesData = caps;
        matrizData = matriz;
        articulosData = arts;
        
        if (!capacidadesData) {
            console.error('Failed to load capacities data');
            return;
        }
        
        // Setup event listeners
        setupCapacityCards();
        setupDetailPanel();
        
        // Check for hash navigation
        const hash = window.location.hash.slice(1);
        if (hash) {
            const card = document.querySelector(`[data-capacity="${hash}"]`);
            if (card) {
                setTimeout(function() {
                    openCapacityDetail(hash);
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            }
        }
    }

    // =========================================
    // Capacity cards
    // =========================================
    
    function setupCapacityCards() {
        const cards = document.querySelectorAll('.capacity-card');
        
        cards.forEach(function(card) {
            card.addEventListener('click', function() {
                const capId = this.dataset.capacity;
                openCapacityDetail(capId);
            });
            
            card.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const capId = this.dataset.capacity;
                    openCapacityDetail(capId);
                }
            });
        });
    }

    // =========================================
    // Detail panel
    // =========================================
    
    function setupDetailPanel() {
        const detailPanel = document.getElementById('capacity-detail');
        const closeBtn = detailPanel?.querySelector('.capacity-detail__close');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', closeCapacityDetail);
        }
        
        // Close on escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && currentCapacity) {
                closeCapacityDetail();
            }
        });
    }
    
    function openCapacityDetail(capId) {
        if (!capacidadesData || !capacidadesData.capacidades) return;
        
        const capacity = capacidadesData.capacidades.find(c => c.id === capId);
        if (!capacity) {
            console.error('Capacity not found:', capId);
            return;
        }
        
        currentCapacity = capId;
        
        const panel = document.getElementById('capacity-detail');
        if (!panel) return;
        
        // Update content
        document.getElementById('cap-detail-sigla').textContent = capacity.sigla;
        document.getElementById('cap-detail-name').textContent = capacity.nombre;
        document.getElementById('cap-detail-desc').textContent = capacity.descripcion;
        
        // Funcionalidades
        const funcList = document.getElementById('cap-detail-funcionalidades');
        funcList.innerHTML = capacity.funcionalidades
            .map(f => `<li>${escapeHTML(f)}</li>`)
            .join('');
        
        // Ejemplos de Vendors
        updateVendorExamples(capacity.ejemplosVendors);
        
        // Artículos relacionados
        updateRelatedArticles(capacity.sigla);
        
        // Controles
        updateCapacityControls(capacity.controles);
        
        // Show panel
        panel.hidden = false;
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Update URL hash
        history.replaceState(null, '', '#' + capId);
        
        // Highlight card
        document.querySelectorAll('.capacity-card').forEach(function(card) {
            card.classList.toggle('capacity-card--active', card.dataset.capacity === capId);
        });
    }
    
    function updateVendorExamples(vendors) {
        const container = document.getElementById('cap-detail-vendors');
        if (!container) return;
        
        if (!vendors || vendors.length === 0) {
            container.innerHTML = '<p class="text-muted">Sin ejemplos de productos.</p>';
            return;
        }
        
        let html = '<ul class="vendor-list">';
        vendors.forEach(function(vendor) {
            html += '<li class="vendor-item">' + escapeHTML(vendor) + '</li>';
        });
        html += '</ul>';
        
        container.innerHTML = html;
    }
    
    function closeCapacityDetail() {
        const panel = document.getElementById('capacity-detail');
        if (panel) {
            panel.hidden = true;
        }
        
        currentCapacity = null;
        
        // Clear URL hash
        history.replaceState(null, '', window.location.pathname);
        
        // Remove highlight
        document.querySelectorAll('.capacity-card').forEach(function(card) {
            card.classList.remove('capacity-card--active');
        });
    }
    
    function updateRelatedArticles(sigla) {
        const container = document.getElementById('cap-detail-articulos');
        if (!container || !matrizData) return;
        
        const relaciones = matrizData.matriz.relaciones;
        const articles = { core: [], esencial: [], complementaria: [] };
        
        // Find all articles that use this capacity
        Object.entries(relaciones).forEach(function([artId, caps]) {
            if (caps[sigla]) {
                const nivel = caps[sigla].nivel;
                const artInfo = articulosData?.articulos?.find(a => a.id === artId);
                articles[nivel].push({
                    id: artId,
                    numero: artInfo?.numero || artId,
                    titulo: artInfo?.titulo || ''
                });
            }
        });
        
        let html = '';
        
        // Core articles
        if (articles.core.length > 0) {
            html += `
                <div class="related-articles__group">
                    <h4 class="related-articles__label">
                        <span class="tag tag--core">Core</span>
                        <span>(${articles.core.length})</span>
                    </h4>
                    <div class="related-articles__list">
                        ${articles.core.map(a => `
                            <a href="/articulos#${a.id}" class="related-article">
                                <span class="related-article__number">${escapeHTML(a.numero)}</span>
                                <span class="related-article__title">${escapeHTML(a.titulo)}</span>
                            </a>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        // Essential articles
        if (articles.esencial.length > 0) {
            html += `
                <div class="related-articles__group">
                    <h4 class="related-articles__label">
                        <span class="tag tag--essential">Esencial</span>
                        <span>(${articles.esencial.length})</span>
                    </h4>
                    <div class="related-articles__list">
                        ${articles.esencial.map(a => `
                            <a href="/articulos#${a.id}" class="related-article">
                                <span class="related-article__number">${escapeHTML(a.numero)}</span>
                                <span class="related-article__title">${escapeHTML(a.titulo)}</span>
                            </a>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        // Complementary articles
        if (articles.complementaria.length > 0) {
            html += `
                <div class="related-articles__group">
                    <h4 class="related-articles__label">
                        <span class="tag tag--complementary">Complementaria</span>
                        <span>(${articles.complementaria.length})</span>
                    </h4>
                    <div class="related-articles__list">
                        ${articles.complementaria.map(a => `
                            <a href="/articulos#${a.id}" class="related-article">
                                <span class="related-article__number">${escapeHTML(a.numero)}</span>
                                <span class="related-article__title">${escapeHTML(a.titulo)}</span>
                            </a>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        container.innerHTML = html || '<p class="text-muted">No hay artículos relacionados.</p>';
    }
    
    function updateCapacityControls(controles) {
        const container = document.getElementById('cap-detail-controles');
        if (!container) return;
        
        let html = '';
        
        // ISO 27001
        if (controles.iso27001 && controles.iso27001.length > 0) {
            html += `
                <div class="control-block">
                    <h4 class="control-block__title">ISO 27001:2022</h4>
                    <ul class="control-block__list">
                        ${controles.iso27001.map(c => `
                            <li>
                                <strong>${escapeHTML(c.codigo)}</strong>
                                <span>${escapeHTML(c.descripcion)}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }
        
        // ISO 27701
        if (controles.iso27701 && controles.iso27701.length > 0) {
            html += `
                <div class="control-block">
                    <h4 class="control-block__title">ISO 27701</h4>
                    <ul class="control-block__list">
                        ${controles.iso27701.map(c => `
                            <li>
                                <strong>${escapeHTML(c.codigo)}</strong>
                                <span>${escapeHTML(c.descripcion)}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }
        
        // NIST
        if (controles.nist && controles.nist.length > 0) {
            html += `
                <div class="control-block">
                    <h4 class="control-block__title">NIST SP 800-53</h4>
                    <ul class="control-block__list">
                        ${controles.nist.map(c => `
                            <li>
                                <strong>${escapeHTML(c.codigo)}</strong>
                                <span>${escapeHTML(c.descripcion)}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }
        
        container.innerHTML = html || '<p class="text-muted">No hay controles especificados.</p>';
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
