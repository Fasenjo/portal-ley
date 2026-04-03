/**
 * matriz.js - Funcionalidad de la matriz de cumplimiento
 * Ley 21.719 - Guía de Implementación
 */

(function() {
    'use strict';

    // =========================================
    // Data store
    // =========================================
    
    let matrizData = null;
    let articulosData = null;
    let capacidadesData = null;

    // =========================================
    // Initialize
    // =========================================
    
    async function init() {
        // Load data
        const [matriz, arts, caps] = await Promise.all([
            loadJSON('/data/matriz.json'),
            loadJSON('/data/articulos.json'),
            loadJSON('/data/capacidades.json')
        ]);
        
        matrizData = matriz;
        articulosData = arts;
        capacidadesData = caps;
        
        if (!matrizData) {
            console.error('Failed to load matrix data');
            return;
        }
        
        // Setup event listeners
        setupFilters();
        setupCellInteraction();
        setupModal();
    }

    // =========================================
    // Filter buttons
    // =========================================
    
    function setupFilters() {
        const filters = document.querySelectorAll('.matrix-filter');
        
        filters.forEach(function(filter) {
            filter.addEventListener('click', function() {
                // Update active state
                filters.forEach(f => f.classList.remove('matrix-filter--active'));
                this.classList.add('matrix-filter--active');
                
                // Apply filter
                const filterType = this.dataset.filter;
                applyFilter(filterType);
            });
        });
    }
    
    function applyFilter(filterType) {
        const cells = document.querySelectorAll('.matrix__cell');
        
        cells.forEach(function(cell) {
            const level = cell.dataset.level;
            
            if (!level) {
                // Empty cell, always visible
                cell.classList.remove('matrix__cell--hidden');
                return;
            }
            
            let visible = false;
            
            switch (filterType) {
                case 'todos':
                    visible = true;
                    break;
                case 'core':
                    visible = level === 'core';
                    break;
                case 'core-essential':
                    visible = level === 'core' || level === 'esencial';
                    break;
            }
            
            cell.classList.toggle('matrix__cell--hidden', !visible);
        });
    }

    // =========================================
    // Cell interaction
    // =========================================
    
    function setupCellInteraction() {
        const cells = document.querySelectorAll('.matrix__cell[data-capacity]');
        
        cells.forEach(function(cell) {
            cell.addEventListener('click', function() {
                const row = this.closest('.matrix__row');
                const articleId = row?.dataset.article;
                const capacity = this.dataset.capacity;
                const level = this.dataset.level;
                
                if (articleId && capacity && level) {
                    openConnectionModal(articleId, capacity, level);
                }
            });
            
            // Make focusable
            cell.setAttribute('tabindex', '0');
            cell.setAttribute('role', 'button');
            
            cell.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.click();
                }
            });
        });
    }

    // =========================================
    // Connection modal
    // =========================================
    
    function setupModal() {
        const modal = document.getElementById('connection-modal');
        if (!modal) return;
        
        // Close handlers are setup in main.js
    }
    
    function openConnectionModal(articleId, capacity, level) {
        const modal = document.getElementById('connection-modal');
        if (!modal || !matrizData) return;
        
        // Get article info
        const article = articulosData?.articulos?.find(a => a.id === articleId);
        const cap = capacidadesData?.capacidades?.find(c => c.sigla === capacity);
        
        // Get justification from matrix data
        const relacion = matrizData.matriz.relaciones[articleId]?.[capacity];
        const justificacion = relacion?.justificacion || 'Sin justificación disponible.';
        
        // Update modal content
        document.getElementById('modal-article').textContent = article?.numero || articleId;
        document.getElementById('modal-capacity').textContent = capacity;
        
        // Level badge
        const levelEl = document.getElementById('modal-level');
        const levelLabel = matrizData.matriz?.leyenda?.[level]?.label || level;
        const levelDesc = matrizData.matriz?.leyenda?.[level]?.descripcion || '';
        
        levelEl.innerHTML = `
            <span class="tag tag--${level === 'esencial' ? 'essential' : level}">${levelLabel}</span>
            <span class="modal__level-desc">${escapeHTML(levelDesc)}</span>
        `;
        
        // Justification
        document.getElementById('modal-justification').textContent = justificacion;
        
        // Links
        const articleLink = document.getElementById('modal-link-article');
        const capacityLink = document.getElementById('modal-link-capacity');
        
        articleLink.href = `/articulos#${articleId}`;
        articleLink.textContent = `Ver ${article?.numero || 'artículo'}`;
        
        capacityLink.href = `/capacidades#${capacity.toLowerCase()}`;
        capacityLink.textContent = `Ver ${capacity}`;
        
        // Open modal
        openModal(modal);
    }

    // =========================================
    // Column/row hover highlights
    // =========================================
    
    (function setupHighlights() {
        const table = document.querySelector('.matrix');
        if (!table) return;
        
        // Highlight column on header hover
        const headers = table.querySelectorAll('thead th:not(.matrix__header--sticky)');
        headers.forEach(function(header, index) {
            header.addEventListener('mouseenter', function() {
                highlightColumn(index + 1, true);
            });
            header.addEventListener('mouseleave', function() {
                highlightColumn(index + 1, false);
            });
        });
        
        function highlightColumn(colIndex, highlight) {
            const rows = table.querySelectorAll('tbody tr');
            rows.forEach(function(row) {
                const cell = row.children[colIndex];
                if (cell) {
                    cell.classList.toggle('matrix__cell--highlight', highlight);
                }
            });
        }
    })();

    // =========================================
    // Start
    // =========================================
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
