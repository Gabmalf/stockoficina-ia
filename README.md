# StockOficina

Sistema web para controlar el inventario de útiles de oficina en pequeñas empresas y oficinas.

## Problemática

El registro manual dificulta conocer las existencias, detectar faltantes a tiempo y mantener un control claro de las entradas y salidas. Esto puede causar inventarios desactualizados y reposiciones tardías.

## Objetivo

Desarrollar una aplicación web que permita al personal administrativo gestionar productos de oficina, controlar las existencias y reconocer los niveles bajos de stock.

## Usuario objetivo

Personal administrativo y responsables del inventario de pequeñas empresas y oficinas.

## Funcionalidades implementadas

- Dashboard con total de productos registrados, unidades disponibles y productos con stock bajo.
- Vista de alertas que identifica productos cuyas existencias son iguales o inferiores al mínimo; permite ir al producto en el inventario.
- Registro de productos con nombre, categoría, cantidad inicial, stock mínimo y descripción.
- Registro automático del movimiento **Inventario inicial** si la cantidad inicial es mayor que cero. La cantidad se establece una sola vez; una cantidad inicial de cero no crea movimiento.
- Edición y eliminación confirmada de productos.
- Registro de entradas y salidas, validando cantidades enteras positivas y evitando salidas superiores a las existencias.
- Historial completo de movimientos con producto, tipo, cantidad y fecha. El nombre queda guardado como referencia histórica, incluso después de editar o eliminar el producto.
- Búsqueda de productos por nombre y filtro por categoría.
- Navegación entre las vistas independientes **Resumen**, **Inventario** y **Movimientos**, con indicador visual y accesible de la sección activa. Los enlaces actualizan el fragmento de URL y no requieren rutas de servidor.
- Guardado local automático de productos y movimientos mediante `localStorage`.

## Tecnologías

- HTML5
- CSS3, con diseño responsive
- JavaScript puro
- `localStorage`

No se utilizan frameworks, dependencias externas ni backend. Los datos permanecen en el navegador y dispositivo donde se registran; no se sincronizan entre usuarios ni dispositivos. Si se borran los datos del navegador, el inventario local puede perderse.

## Estructura del proyecto

```text
StockOficina/
├── index.html
├── README.md
├── css/
│   └── styles.css
└── js/
    └── app.js
```

## Ejecución

1. Descarga o clona el repositorio.
2. Abre `index.html` en un navegador moderno.

No se requiere instalación de paquetes ni compilación. El proyecto contiene archivos estáticos y puede alojarse en servicios compatibles con sitios estáticos. **GitHub Pages aún no está configurado.**

## Uso de GitHub Copilot y decisiones del desarrollador

### Generación inicial

- **Solicitud:** crear este README a partir del contexto del proyecto, antes de escribir código.
- **Uso de Copilot:** se generó la documentación inicial en español. No se afirmó que las funcionalidades estuvieran implementadas en esa etapa.

### Desarrollo de la aplicación

- **Solicitud:** implementar la aplicación funcional con HTML, CSS y JavaScript, sin dependencias externas, con persistencia local y registro veraz de las comprobaciones.
- **Uso de Copilot:** se generaron la estructura HTML, los estilos y la lógica para productos, movimientos, dashboard, alertas, búsqueda, filtros y persistencia.
- **Decisiones técnicas:** los productos y movimientos se guardan juntos bajo una clave de `localStorage`. Se validan las cantidades como enteros, las entradas y salidas se guardan junto con el stock actualizado, y el contenido proporcionado por el usuario se representa como texto en el DOM. Se evita sobrescribir datos que no se puedan leer o validar. No se incorporaron productos ficticios.
- **Comprobaciones registradas:** se ejecutó `node --check js/app.js` y se usó el navegador integrado para verificar varios flujos manuales, incluidos productos, movimientos, búsqueda, filtros y persistencia. No se ejecutó una suite automatizada.

### Mejoras de inventario inicial y navegación

- **Solicitud:** registrar un movimiento inicial para productos con cantidad inicial positiva y separar el dashboard, el inventario y el historial en tres vistas.
- **Uso de Copilot:** se añadieron movimientos `inventario-inicial`, una lista de alertas enlazadas al inventario, navegación por hash y renderizado del historial completo. También se corrigió el comportamiento visual de elementos ocultos y se ajustó la navegación compacta para pantallas estrechas.
- **Decisiones técnicas:** el movimiento inicial documenta las unidades existentes sin volver a sumarlas al stock. Las altas con cantidad cero no crean un movimiento, y los datos históricos anteriores no se modifican retroactivamente. Cada movimiento conserva el nombre del producto al momento de registrarse. Las vistas se ocultan de forma independiente y el menú comunica la vista activa mediante `aria-current`.
- **Comprobaciones realizadas:** `node --check js/app.js` pasó. En el navegador integrado se registraron 10 unidades y se verificó stock 10 con movimiento inicial +10; una salida de 6 dejó stock 4 y creó el segundo movimiento. Se verificaron los indicadores, la alerta de mínimo, la persistencia tras recargar, las tres vistas independientes y el estado activo del menú. También se probaron cantidad inicial cero, entradas, rechazo de salidas inválidas, búsqueda, filtros, edición y eliminación con historial conservado. Los datos de prueba se aislaron; el valor previo de `localStorage` se restauró exactamente. No se ejecutó una suite automatizada ni se hizo una comprobación en varios dispositivos físicos.

## Estado de publicación

La configuración de GitHub Pages no forma parte de este proyecto todavía. La creación de un repositorio público y la publicación del código requieren autorización explícita.
