# La Gerencia — Estructura del Proyecto

```
proyecto/
│
├── index/
│   ├── index.html      ← Página principal (solo HTML)
│   ├── style.css       ← Estilos del index
│   └── script.js       ← Animaciones del index
│
├── menu/
│   ├── menu.html       ← Página del menú (solo HTML)
│   ├── style.css       ← Estilos del menú
│   └── script.js       ← Animaciones del menú
│
└── imagenes/           ← Todas las imágenes del sitio
    ├── logo.png
    ├── pupusas.png
    ├── platos-fuertes.jpg
    ├── tacos.jpg
    ├── boquitas.jpg
    └── bebidas.jpg
```

## Rutas de imágenes
Desde `index/` y `menu/` las imágenes se referencian como `../imagenes/nombre.ext`

## Links entre páginas
- index → menú: `../menu/menu.html`
- menú → index: `../index/index.html`

© 2026 La Gerencia. Desarrollado por Willy.
