// ==========================================================

// HU1: Estado central — la única fuente de verdad de la app
// ==========================================================
const state = { plantillas: [] };

function agregarPlantilla(titulo, mensaje, hashtag) {
  const nueva = new Template(titulo, mensaje, hashtag);
  state.plantillas.push(nueva);
}

// ==========================================================
// HU3: Limpieza y normalización de texto
// ==========================================================
function normalizarHashtag(texto) {
  const limpio = texto.trim().toLowerCase();            // sin espacios, en minúscula
  return limpio.startsWith("#") ? limpio : "#" + limpio; // asegura el #
}

// ==========================================================
// Logro 2: recortar mensajes largos para que la tarjeta
// no rompa el layout de la rejilla
// ==========================================================
function recortarTexto(texto, limite = 60) {
  return texto.length > limite ? texto.slice(0, limite) + "…" : texto;
}

// ==========================================================
// HU2: render() — limpia y redibuja TODO desde el estado
// ==========================================================
const lista = document.getElementById("listaPlantillas");
const selector = document.getElementById("selector");

function render() {
  // 1. Pinta las tarjetas
  lista.innerHTML = ""; // limpia lo anterior
  state.plantillas.forEach(function (plantilla) {
    const fechaTexto = plantilla.fecha.toLocaleDateString("es-PE"); // Date → texto legible

    // Logro 1: contador de caracteres
    const cantidadCaracteres = plantilla.mensaje.length;

    // Logro 2: mensaje recortado solo para la vista de tarjeta
    const mensajeCorto = recortarTexto(plantilla.mensaje, 60);

    const li = document.createElement("li");
    li.className = "bg-white p-4 rounded-lg shadow";
    li.innerHTML = `
      <div class="flex items-start justify-between gap-2">
        <strong class="text-slate-800">${plantilla.titulo}</strong>
        <span class="text-xs text-slate-400 shrink-0">${fechaTexto}</span>
      </div>
      <p class="text-sm text-slate-600 mt-1">${mensajeCorto}</p>
      <div class="flex items-center justify-between mt-2">
        <span class="inline-block text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">${plantilla.hashtag}</span>
        <span class="text-xs text-slate-400">${cantidadCaracteres} caracteres</span>
      </div>`;
    lista.appendChild(li); // agrega un nodo por dato
  });

  // 2. Actualiza el <select> del generador (HU4)
  renderSelector();
}

function renderSelector() {
  selector.innerHTML = state.plantillas
    .map((plantilla, indice) => `<option value="${indice}">${plantilla.titulo}</option>`)
    .join("");
}

// ==========================================================
// HU2 + HU3: Conectar el formulario (validar → limpiar → agregar → render)
// ==========================================================
const form = document.getElementById("form-plantilla");
const titulo = document.getElementById("titulo");
const hashtag = document.getElementById("hashtag");
const mensaje = document.getElementById("mensaje");

form.addEventListener("submit", function (evento) {
  evento.preventDefault();

  const tituloTexto = titulo.value.trim();
  const mensajeTexto = mensaje.value.trim();

  if (tituloTexto.length === 0 || mensajeTexto.length === 0) {
    alert("Título y mensaje son obligatorios");
    return;
  }

  agregarPlantilla(tituloTexto, mensajeTexto, normalizarHashtag(hashtag.value));
  render();     // el estado cambió, redibujamos
  form.reset();
});

// ==========================================================
// HU4: Generador de mensaje final (sustitución de variables)
// Logro 3: soporta {nombre} y {producto} encadenando .replaceAll()
// ==========================================================
function generarMensajeFinal(plantilla, valorNombre, valorProducto) {
  return plantilla.mensaje
    .replaceAll("{nombre}", valorNombre || "")
    .replaceAll("{producto}", valorProducto || "");
}

const salida = document.getElementById("mensaje-final");

document.getElementById("btn-generar").addEventListener("click", function () {
  if (state.plantillas.length === 0) {
    alert("Primero agrega al menos una plantilla");
    return;
  }

  const plantilla = state.plantillas[Number(selector.value)];
  const nombre = document.getElementById("valorNombre").value.trim();
  const producto = document.getElementById("valorProducto").value.trim();

  salida.textContent = generarMensajeFinal(plantilla, nombre, producto);
});

document.getElementById("btn-copiar").addEventListener("click", function () {
  if (!salida.textContent) return;
  navigator.clipboard.writeText(salida.textContent);
});

// Primer render al cargar la página (lista y selector vacíos, pero consistentes)
render();