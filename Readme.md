# 📱 Gestor de Plantillas para WhatsApp

App para crear, guardar, editar, eliminar y reutilizar plantillas de mensajes de WhatsApp. El estado persiste en el navegador usando `localStorage` y `JSON`. El código está organizado en módulos ESM y la app cuenta con confirmaciones, estados vacíos amigables y ordenamiento.

## 🧩 Clase `Template`

Ubicada en `js/models/Template.js`. Representa una plantilla individual con propiedades:

- `id`: identificador único generado con `crypto.randomUUID()`, usado para saber sobre cuál plantilla actuar al editar o eliminar.
- `titulo`: nombre corto de la plantilla.
- `mensaje`: el texto, que puede incluir variables como `{nombre}` y `{producto}`.
- `hashtag`: etiqueta normalizada (siempre en minúsculas y con `#`).
- `fecha`: objeto `Date` creado automáticamente al instanciar la plantilla (`new Date()`), usado luego para mostrar la fecha de creación.
- `editadaEl`: fecha de la última edición (o `null` si nunca se editó).

Todas las plantillas creadas se guardan en `state.plantillas`, un arreglo que actúa como única fuente de verdad de la app.

## 🔤 Métodos de String utilizados

| Método | Dónde se usa | Para qué |
|---|---|---|
| `.trim()` | Al leer título, mensaje y hashtag del formulario | Elimina espacios sobrantes al inicio/final |
| `.toLowerCase()` | `normalizarHashtag()` y el buscador | Uniforma el hashtag a minúsculas y hace el filtro insensible a mayúsculas |
| `.startsWith()` | `normalizarHashtag()` | Verifica si el hashtag ya trae `#` antes de agregarlo |
| `.length` | Validación de campos y contador de caracteres  | Detecta campos vacíos y muestra cuántos caracteres tiene el mensaje |
| `.slice()` | `recortarTexto()` | Recorta mensajes largos en la tarjeta para mantener la rejilla pareja |
| `.replaceAll()` | `generarMensajeFinal()` | Sustituye `{nombre}` y `{producto}` por valores reales dentro del mensaje |
| `.includes()` | `plantillasVisibles()` | Filtra las plantillas cuyo hashtag coincide con el texto del buscador |
| `.localeCompare()` | `ordenar()` | Ordena alfabéticamente respetando tildes y mayúsculas |

## 📅 Objeto `Date`

`new Date()` se usa en el constructor de `Template` para registrar el momento exacto de creación. Luego, en `render()`, `.toLocaleDateString("es-PE")` convierte esa fecha en texto legible (ej. `29/6/2026`) para mostrarla en cada tarjeta.

## 🖱️ Delegación de eventos

Los botones "Editar" y "Eliminar" de cada tarjeta no tienen un listener propio. En su lugar, hay un único listener puesto en el contenedor padre (`<ul id="listaPlantillas">`):

Cuando el usuario hace clic en un botón, el evento se detecta en el `<ul>` gracias a que "burbujea" hacia arriba desde el elemento exacto donde ocurrió el clic (`event.target`). Ahí se revisa qué clase tiene ese elemento (para saber qué acción ejecutar) y qué `data-id` trae (para saber sobre qué plantilla actuar).

Esto es más eficiente que poner un listener por botón, porque las tarjetas se destruyen y se vuelven a crear cada vez que se llama a `render()`. Si el listener estuviera en cada botón, habría que volver a engancharlo en cada redibujado. Con la delegación, el listener vive en el `<ul>`, que nunca se destruye, así que funciona sin importar cuántas tarjetas haya.

## 📊 Función `contarPorHashtag`

Es una función pura: recibe el arreglo de plantillas y devuelve un objeto nuevo con el conteo, sin modificar nada externo (no toca `state` ni el DOM). Se usa en el panel de estadísticas (`renderStats()`) para mostrar el total de plantillas, cuántas hay por cada hashtag, y cuál es el hashtag más usado. Como `renderStats()` se llama dentro de `render()`, las estadísticas se recalculan solas cada vez que se agrega, edita o elimina una plantilla.

## 💾 Persistencia 

Toda la persistencia vive en `js/storage.js` (antes `persistence.js`, renombrado al modularizar). El estado se guarda bajo tres claves de `localStorage`:

- `whatsapp-templates`: guarda `state.plantillas` como texto, convertido con `JSON.stringify` antes de guardarse y reconstruido con `JSON.parse` al cargarlo.
- `whatsapp-templates-filtro`: guarda el texto del buscador (`state.filtro`) directamente, sin JSON, porque ya es un string y `localStorage` solo almacena texto.
- `whatsapp-templates-visitas` : cuenta cuántas veces se abrió la app.

La función `guardar()` se llama al final de `render()`, así que cualquier cambio de estado (agregar, editar, eliminar, filtrar, vaciar, ordenar) se persiste automáticamente, sin necesidad de un botón "Guardar". Cuando `state.plantillas` queda vacío, en vez de guardar `"[]"` se usa `removeItem` para dejar el almacenamiento realmente limpio.

La función `cargar()` se ejecuta una sola vez al iniciar `app.js`, antes del primer `render()`: lee el texto guardado con `getItem` y lo reconstruye con `JSON.parse`. Si no hay nada guardado, devuelve un array vacío usando un operador ternario.

### ¿Por qué `try/catch` al parsear?

`JSON.parse` lanza una excepción si el texto guardado en `localStorage` no es JSON válido (por ejemplo, si se edita a mano desde DevTools y queda corrupto, o si el navegador guarda datos dañados por algún motivo). Sin `try/catch`, ese error rompería toda la app justo al arrancar, dejando una pantalla en blanco sin ninguna forma de recuperarse.

Envolviendo el `JSON.parse` dentro de un `try/catch`, si la conversión falla se captura el error, se muestra un aviso en consola con `console.warn` para saber qué pasó, y la función devuelve una lista vacía en su lugar. Así la app siempre puede arrancar de forma segura, incluso si los datos guardados están dañados.

También hay que reconstruir las fechas manualmente: `JSON.stringify` convierte los objetos `Date` en texto, así que tras recargar la página, `plantilla.fecha` es un string. Por eso en `render()` se usa `new Date(plantilla.fecha)` antes de llamar a `.toLocaleDateString()`.

## 🧱 Arquitectura modular con ESM 

El código se reparte en cinco archivos que se comunican con `export`/`import`, en vez de depender de variables globales y del orden de los `<script>`:

| Archivo | Exporta | Responsabilidad |
|---|---|---|
| `js/models/Template.js` | `class Template` | El modelo de datos de una plantilla |
| `js/state.js` | `state`, `normalizarHashtag`, `contarPorHashtag`, `hashtagMasUsado`, `plantillasVisibles` | El estado y toda la lógica pura derivada de él (filtrado, orden, conteos) |
| `js/storage.js` | `CLAVE`, `CLAVE_FILTRO`, `CLAVE_VISITAS`, `guardar`, `cargar`, `registrarVisita` | Toda la comunicación con `localStorage` |
| `js/ui.js` | `render` | Todo lo que toca el DOM: dibujar tarjetas, el modal, los listeners de formulario, buscador, orden y botones |
| `js/app.js` | (nada) | Solo importa lo necesario y arranca la app: carga el estado guardado y llama a `render()` |

En `index.html` esto se activa con un único script:

```html
<script type="module" src="js/app.js"></script>
```

Con `type="module"`, cada archivo tiene su propio ámbito (no hay variables globales chocando entre sí) y el orden de carga ya no importa: los `import` arman el rompecabezas solos, resolviendo automáticamente las dependencias entre archivos.

⚠️ Los módulos ESM no funcionan abriendo `index.html` con doble clic (`file://`). Hay que usar un servidor local (extensión Live Server de VS Code, o `python -m http.server`). En GitHub Pages funcionan sin problema.

## 🖼️ Confirmaciones y estados vacíos 

- **Modal de confirmación**: eliminar una plantilla o vaciar toda la colección ya no usa el `confirm()` nativo del navegador; ahora aparece un modal propio (HTML + Tailwind) construido en `index.html` y controlado en `ui.js`. La acción a ejecutar si el usuario confirma se guarda temporalmente en la variable `accionPendiente`, lo que permite reutilizar el mismo modal para cualquier acción destructiva.
- **Estados vacíos**: `render()` distingue dos casos — no hay ninguna plantilla creada ("Aún no tienes plantillas. ¡Crea la primera!") y hay plantillas pero el filtro no encuentra ninguna ("No se encontraron plantillas con ese filtro") — mostrando un mensaje distinto en cada caso en vez de dejar la lista en blanco.

## 🔀 Ordenar la colección 

Un `<select id="orden">` permite elegir entre "Más recientes", "Más antiguas" y "Alfabético (A-Z)". El valor elegido se guarda en `state.orden`, y `plantillasVisibles()` (en `state.js`) aplica primero el filtro y luego el orden con `.sort()` y un comparador. Como `.sort()` muta el array, siempre se ordena sobre una copia (`[...plantillas]`), nunca sobre `state.plantillas` directamente, así que el estado nunca se muta directamente.

## 🌟 Logros implementados

**Laboratorio 13**
- ✅ **Logro 1**: cada tarjeta muestra la cantidad de caracteres del mensaje (`plantilla.mensaje.length`).
- ✅ **Logro 2**: si el mensaje es muy largo, la tarjeta lo muestra recortado con `.slice(0, 60) + "…"`; el mensaje completo (sin recortar) sigue usándose en el generador.
- ✅ **Logro 3**: el generador soporta dos variables, `{nombre}` y `{producto}`, encadenando dos llamadas a `.replaceAll()`.

**Laboratorio 14**
- ✅ **Logro 1**: botón "Cancelar" que aparece solo en modo edición; limpia el formulario y pone `state.editandoId = null`.
- ✅ **Logro 2**: el panel de estadísticas muestra el hashtag con más plantillas, calculado a partir de `contarPorHashtag()`.
- ✅ **Logro 3**: antes de eliminar una plantilla, se muestra una confirmación pidiendo aceptar la acción.

**Laboratorio 15**
- ✅ **Logro 1**: al arrancar la app, se imprime en consola `JSON.stringify(state.plantillas, null, 2)` con sangría, para ver los datos guardados de forma legible.
- ✅ **Logro 2**: la clave `whatsapp-templates-visitas` en `localStorage` guarda cuántas veces se abrió la app, incrementándose en cada carga.
- ✅ **Logro 3**: al editar una plantilla se guarda un campo `editadaEl` con la fecha de la última edición, mostrado junto a la fecha de creación en la tarjeta.

**Laboratorio 16**
- ✅ **Logro 1**: el modal de confirmación se cierra si el usuario hace clic en el fondo oscuro (fuera del cuadro blanco), sin necesidad de pulsar "Cancelar".
- ✅ **Logro 2**: el selector de orden incluye una tercera opción, "Alfabético (A-Z)", que ordena las plantillas por título con `.localeCompare()`.
- ✅ **Logro 3**: un botón ✕ junto al buscador limpia el filtro y vuelve a mostrar todas las plantillas al instante.

## 🎨 Diseño "Notitas · Rosa Pastel"

La interfaz dejó atrás la paleta nocturna y ahora usa una estética minimalista rosada pastel, pensada como una libreta de notitas digitales para enviar por WhatsApp. La base es un fondo blanco-blush (`#fbf3f6`) con dos halos difuminados muy sutiles (rosa y lavanda, `radial-gradient` + `blur`) como único acento ambiental, sin elementos animados de fondo. La tipografía combina `Fraunces` para los títulos (un serif con carácter, usado con moderación) con `Manrope` para el resto del texto.

El elemento distintivo de la página es el divisor "cosido" bajo el título (una fila de puntos rosa que imita una costura de tela) y el detalle de **washi tape** en la esquina superior de cada tarjeta (`.tarjeta-plantilla::before`), que alterna entre rosa y lavanda según la posición de la tarjeta. Las tarjetas usan fondo blanco, bordes suaves (`--border: #f0dde6`) y texto en tonos tinta/ciruela (`--ink`, `--ink-soft`), con buen contraste sobre fondo claro. Los hashtags se resaltan como chips rosados (`chip-hashtag`) y los botones principales usan un degradado rosa (`btn-rosa`).

Toda la paleta vive como variables CSS en `index.html` (`--rose-300`, `--rose-400`, `--rose-600`, `--lavender`, `--ink`, `--ink-soft`, `--border`), así que cualquier ajuste de color se hace en un solo lugar. Es un diseño propio, sin decoración de fondo animada (no hay `stars.js` en esta versión): la app (crear, editar, eliminar, filtrar, ordenar, persistir) funciona exactamente igual que antes, solo cambió la piel visual.

## 📁 Estructura del proyecto

```
whatsapp-templates/
├── index.html
├── whatsapp-logo.ico
├── Readme.md
└── js/
    ├── app.js
    ├── state.js
    ├── storage.js
    ├── ui.js
    └── models/
        └── Template.js
```

## 🚀 Despliegue

Publicado en GitHub Pages: https://emore462-eng.github.io/whatsapp-templates/