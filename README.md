# Ley 21.719 - Guía de Implementación

Guía interactiva para la implementación técnica de la Ley N° 21.719 de Protección de Datos Personales de Chile.

## Contenido

- **15 Artículos** de la ley organizados por categoría
- **11 Capacidades Tecnológicas** genéricas para implementar cumplimiento
- **60+ Conexiones** mapeadas entre artículos y capacidades
- **Referencias a controles** ISO 27001:2022, ISO 27701, NIST SP 800-53

## Vigencia de la Ley

**1 de diciembre de 2026**

---

## Requisitos

- Python 3.9+
- pip

## Ejecución Local (Desarrollo)

### 1. Crear entorno virtual

```bash
# Crear el entorno virtual
python -m venv venv

# Activar el entorno virtual
# En macOS/Linux:
source venv/bin/activate

# En Windows (PowerShell):
.\venv\Scripts\Activate.ps1

# En Windows (CMD):
venv\Scripts\activate.bat
```

### 2. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 3. Ejecutar servidor de desarrollo

```bash
python run.py
```

El sitio estará disponible en: **http://localhost:5000**

### 4. Desactivar el entorno virtual (cuando termines)

```bash
deactivate
```

### Alternativa: Servidor HTTP simple

Si solo necesitas servir archivos estáticos:

```bash
# Desde el directorio del proyecto
python -m http.server 8000
```

**Nota:** Esta opción no soporta las rutas de Flask, solo sirve archivos estáticos.

---

## Ejecución con Docker

### 1. Construir imagen

```bash
docker build -t ley21719-guia .
```

### 2. Ejecutar contenedor

```bash
docker run -p 8080:80 ley21719-guia
```

El sitio estará disponible en: **http://localhost:8080**

### Docker Compose (opcional)

```yaml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "8080:80"
    environment:
      - FLASK_DEBUG=false
```

```bash
docker-compose up -d
```

---

## Estructura del Proyecto

```
leyes-guia/
├── app/
│   └── templates/          # Templates Jinja2
│       ├── base.html       # Layout base
│       ├── index.html      # Página de inicio
│       ├── articulos.html  # Vista de artículos
│       ├── capacidades.html # Vista de capacidades
│       ├── matriz.html     # Matriz de cumplimiento
│       └── recursos.html   # Recursos y glosario
├── static/
│   ├── css/               # Estilos CSS
│   │   ├── base.css       # Variables y reset
│   │   ├── layout.css     # Grid y contenedores
│   │   ├── components.css # Componentes UI
│   │   └── pages.css      # Estilos por página
│   └── js/                # JavaScript
│       ├── main.js        # Funciones comunes
│       ├── articulos.js   # Vista de artículos
│       ├── capacidades.js # Vista de capacidades
│       └── matriz.js      # Matriz interactiva
├── data/                  # Datos JSON
│   ├── articulos.json     # 15 artículos de la ley
│   ├── capacidades.json   # 11 categorías tecnológicas
│   └── matriz.json        # Relaciones artículo-capacidad
├── run.py                 # Aplicación Flask
├── requirements.txt       # Dependencias Python
├── Dockerfile            # Imagen Docker
└── README.md             # Este archivo
```

---

## Niveles de Criticidad

| Nivel | Color | Significado |
|-------|-------|-------------|
| **Core** | Rojo | Imprescindible para cumplimiento |
| **Esencial** | Naranja | Altamente recomendado |
| **Complementaria** | Cyan | Valor agregado |

---

## Disclaimer

Este sitio web ofrece una interpretación y visualización de la Ley N° 21.719 sobre Protección de Datos Personales de Chile, con el objetivo de proporcionar una guía referencial sobre posibles implementaciones tecnológicas.

La información presentada tiene carácter meramente informativo y **no constituye asesoría legal**. No garantiza el cumplimiento de obligaciones legales o normativas.

Para implementaciones específicas, consulte con profesionales especializados en protección de datos y ciberseguridad.

---

## Fuentes

- [Texto de la Ley (BCN)](https://www.bcn.cl/leychile/navegar?idNorma=1209272)
- [ISO 27001:2022](https://www.iso.org/standard/27001)
- [ISO 27701](https://www.iso.org/standard/71670.html)
- [NIST SP 800-53](https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final)

---

*Versión 1.0 — Marzo 2026*
