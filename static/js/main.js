/**
 * main.js - Funcionalidades comunes del sitio
 * Ley 21.719 - Guía de Implementación
 */

(function() {
    'use strict';

    // =========================================
    // Mobile Navigation
    // =========================================
    
    const menuToggle = document.querySelector('.header__menu-toggle');
    const mobileNav = document.getElementById('mobile-nav');
    
    if (menuToggle && mobileNav) {
        menuToggle.addEventListener('click', function() {
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            
            this.setAttribute('aria-expanded', !isExpanded);
            mobileNav.hidden = isExpanded;
            
            // Toggle body scroll
            document.body.classList.toggle('nav-open', !isExpanded);
        });
        
        // Close on escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && !mobileNav.hidden) {
                menuToggle.setAttribute('aria-expanded', 'false');
                mobileNav.hidden = true;
                document.body.classList.remove('nav-open');
            }
        });
        
        // Close when clicking a link
        mobileNav.querySelectorAll('a').forEach(function(link) {
            link.addEventListener('click', function() {
                menuToggle.setAttribute('aria-expanded', 'false');
                mobileNav.hidden = true;
                document.body.classList.remove('nav-open');
            });
        });
    }

    // =========================================
    // Smooth scroll for anchor links
    // =========================================
    
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Set focus for accessibility
                target.setAttribute('tabindex', '-1');
                target.focus();
            }
        });
    });

    // =========================================
    // Active nav link highlighting
    // =========================================
    
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav__link').forEach(function(link) {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('nav__link--active');
        }
    });

    // =========================================
    // Utility: Load JSON data
    // =========================================
    
    window.loadJSON = async function(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error loading JSON:', error);
            return null;
        }
    };

    // =========================================
    // Utility: Create element with classes
    // =========================================
    
    window.createElement = function(tag, classes, content) {
        const el = document.createElement(tag);
        if (classes) {
            if (Array.isArray(classes)) {
                el.classList.add(...classes);
            } else {
                el.className = classes;
            }
        }
        if (content) {
            if (typeof content === 'string') {
                el.textContent = content;
            } else {
                el.appendChild(content);
            }
        }
        return el;
    };

    // =========================================
    // Utility: Escape HTML
    // =========================================
    
    window.escapeHTML = function(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    };

    // =========================================
    // Modal utilities
    // =========================================
    
    window.openModal = function(modal) {
        if (!modal) return;
        
        modal.hidden = false;
        document.body.classList.add('modal-open');
        
        // Focus first focusable element
        const focusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable) {
            focusable.focus();
        }
        
        // Trap focus
        modal.addEventListener('keydown', trapFocus);
    };
    
    window.closeModal = function(modal) {
        if (!modal) return;
        
        modal.hidden = true;
        document.body.classList.remove('modal-open');
        modal.removeEventListener('keydown', trapFocus);
    };
    
    function trapFocus(e) {
        if (e.key !== 'Tab') return;
        
        const modal = e.currentTarget;
        const focusables = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }

    // =========================================
    // Generic modal close handlers
    // =========================================
    
    document.querySelectorAll('.modal').forEach(function(modal) {
        // Close on overlay click
        const overlay = modal.querySelector('.modal__overlay');
        if (overlay) {
            overlay.addEventListener('click', function() {
                closeModal(modal);
            });
        }
        
        // Close on close button
        modal.querySelectorAll('[data-close]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                closeModal(modal);
            });
        });
        
        // Close on escape
        modal.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeModal(modal);
            }
        });
    });

    // =========================================
    // Criticality tag tooltip
    // =========================================
    
    const criticalityDescriptions = {
        'core': 'Imprescindible para cumplimiento. Sin esta capacidad, el artículo no puede implementarse.',
        'essential': 'Altamente recomendado. Mejora significativamente el cumplimiento y reduce riesgos.',
        'complementary': 'Valor agregado. Aporta eficiencia, trazabilidad o automatización adicional.'
    };
    
    document.querySelectorAll('.tag[class*="tag--"]').forEach(function(tag) {
        const type = tag.className.match(/tag--(\w+)/);
        if (type && criticalityDescriptions[type[1]]) {
            tag.setAttribute('title', criticalityDescriptions[type[1]]);
        }
    });

})();
