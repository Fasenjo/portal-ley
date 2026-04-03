#!/usr/bin/env python3
"""
Ley 21.719 - Guía de Implementación
Servidor Flask para desarrollo y producción
"""

import os
from flask import Flask, render_template, send_from_directory

# Create app
app = Flask(
    __name__,
    template_folder='app/templates',
    static_folder='static'
)

# Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-key-change-in-production')


# =========================================
# Routes
# =========================================

@app.route('/')
def index():
    """Home page"""
    return render_template('index.html', active_page='inicio')


@app.route('/articulos')
def articulos():
    """Articles view"""
    return render_template('articulos.html', active_page='articulos')


@app.route('/capacidades')
def capacidades():
    """Capacities view"""
    return render_template('capacidades.html', active_page='capacidades')


@app.route('/matriz')
def matriz():
    """Matrix view"""
    return render_template('matriz.html', active_page='matriz')


@app.route('/recursos')
def recursos():
    """Resources view"""
    return render_template('recursos.html', active_page='recursos')


@app.route('/test-articulos')
def test_articulos():
    """Test page for debugging"""
    return render_template('test-articulos.html')


# =========================================
# Static data endpoint
# =========================================

@app.route('/data/<path:filename>')
def serve_data(filename):
    """Serve JSON data files from /data directory"""
    return send_from_directory('data', filename)


# =========================================
# Error handlers
# =========================================

@app.errorhandler(404)
def page_not_found(e):
    """Handle 404 errors"""
    return render_template('base.html', 
                           active_page='', 
                           error='Página no encontrada'), 404


@app.errorhandler(500)
def internal_error(e):
    """Handle 500 errors"""
    return render_template('base.html', 
                           active_page='', 
                           error='Error interno del servidor'), 500


# =========================================
# Run
# =========================================

if __name__ == '__main__':
    # Development server
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'true').lower() == 'true'
    
    print(f"""
    ╔══════════════════════════════════════════════════════════╗
    ║  Ley 21.719 - Guía de Implementación                     ║
    ║  Servidor de desarrollo iniciado                          ║
    ║                                                           ║
    ║  URL: http://localhost:{port}                              ║
    ║  Debug: {debug}                                            ║
    ╚══════════════════════════════════════════════════════════╝
    """)
    
    app.run(host='0.0.0.0', port=port, debug=debug)
