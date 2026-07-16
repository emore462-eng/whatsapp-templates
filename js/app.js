// ==========================================================
// Estado central — la única fuente de verdad de la app
// ==========================================================
const state = {
  plantillas: [],
  editandoId: null,   // null = modo "crear" | id = modo "editar"
  filtro: ""          // texto del buscador (HU4)
};

function agregarPlantilla(titulo, mensaje, hashtag) {
  const nueva = new Template(titulo, mensaje, hashtag);
  state.plantillas.push(nueva);
}

// ==========================================================
// Eliminar — sin mutar, filtramos el array
// ==========================================================
function eliminarPlantilla(id) {
  state.plantillas = state.plantillas.filter(plantilla => plantilla.id !== id);
  render();
}

// ==========================================================
// Editar — carga los datos en el formulario
// ==========================================================
function cargarEnFormulario(id) {
  const plantilla = state.plantillas.find(plantilla => plantilla.id === id);
  if (!plantilla) return;

  titulo.value = plantilla.titulo;
  mensaje.value = plantilla.mensaje;
  hashtag.value = plantilla.hashtag;
  state.editandoId = id; // recordamos que estamos editando, no creando

  btnGuardar.textContent = "Guardar cambios";
  btnCancelar.classList.remove("hidden"); // Logro 1: aparece el botón cancelar
}

// Cancelar edición — limpia el formulario y vuelve a modo "crear"
function cancelarEdicion() {
  state.editandoId = null;
  form.reset();
  btnGuardar.textContent = "Agregar plantilla";
  btnCancelar.classList.add("hidden");
}

// ==========================================================
// Limpieza y normalización de texto 
// ==========================================================
function normalizarHashtag(texto) {
  const limpio = texto.trim().toLowerCase();
  return limpio.startsWith("#") ? limpio : "#" + limpio;
}

// Recortar mensajes largos en la tarjeta (Logro 2 de C13)
function recortarTexto(texto, limite = 60) {
  return texto.length > limite ? texto.slice(0, limite) + "…" : texto;
}

// ==========================================================
// Datos derivados — función pura
// ==========================================================
function contarPorHashtag(plantillas) {
  const conteo = {};
  plantillas.forEach(function (plantilla) {
    const elHashtag = plantilla.hashtag;
    if (conteo[elHashtag]) {
      conteo[elHashtag] = conteo[elHashtag] + 1;
    } else {
      conteo[elHashtag] = 1;
    }
  });
  return conteo;
}

// Logro 2 (C14): hashtag más usado, a partir del mismo conteo puro
function hashtagMasUsado(porTag) {
  const entradas = Object.entries(porTag);
  if (entradas.length === 0) return null;
  return entradas.reduce((mejor, actual) => (actual[1] > mejor[1] ? actual : mejor));
}

// ==========================================================
// HU4 (C14): filtrado derivado del estado (no muta state.plantillas)
// ==========================================================
function plantillasVisibles() {
  const filtroTexto = (state.filtro ?? "").toLowerCase();
  if (filtroTexto === "") return state.plantillas;
  return state.plantillas.filter(plantilla => plantilla.hashtag.toLowerCase().includes(filtroTexto));
}

// ==========================================================
// render() — limpia y redibuja TODO desde el estado
// ==========================================================
const lista = document.getElementById("listaPlantillas");
const selector = document.getElementById("selector");

function render() {
  // 1. Pinta las tarjetas visibles (respetando el filtro)
  lista.innerHTML = "";
  plantillasVisibles().forEach(function (plantilla) {
    const fechaTexto = plantilla.fecha.toLocaleDateString("es-PE");
    const cantidadCaracteres = plantilla.mensaje.length;     // Logro 1 de C13
    const mensajeCorto = recortarTexto(plantilla.mensaje, 60); // Logro 2 de C13

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
      </div>
      <div class="flex gap-2 mt-3 pt-2 border-t border-slate-100">
        <button class="btn-editar text-xs px-2.5 py-1 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition" data-id="${plantilla.id}">Editar</button>
        <button class="btn-eliminar text-xs px-2.5 py-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition" data-id="${plantilla.id}">Eliminar</button>
      </div>`;
    lista.appendChild(li);
  });

  // 2. Actualiza el <select> del generador
  renderSelector();

  // 3. Actualiza el panel de estadísticas
  renderStats();
}

function renderSelector() {
  selector.innerHTML = state.plantillas
    .map((plantilla, indice) => <option value="${indice}">${plantilla.titulo}</option>)
    .join("");
}

function renderStats() {
  const total = state.plantillas.length;
  const porTag = contarPorHashtag(state.plantillas);

  const etiquetas = Object.entries(porTag)
    .map(([hashtag, cantidad]) =>
      <span class="text-xs bg-white border border-slate-200 px-2 py-0.5 rounded-full">${hashtag} · ${cantidad}</span>)
    .join("");

  // Logro 2: hashtag más usado
  const top = hashtagMasUsado(porTag);
  const topTexto = top
    ? <span class="text-xs text-emerald-700 font-medium">🏆 Más usado: ${top[0]} (${top[1]})</span>
    : "";

  document.getElementById("panel-stats").innerHTML = `
    <div class="flex items-center gap-2 flex-wrap">
      <span class="text-sm font-semibold text-slate-700">${total} plantilla(s)</span>
      ${etiquetas}
    </div>
    ${topTexto ? <div class="mt-1">${topTexto}</div> : ""}`;
}

// ==========================================================
// Conectar el formulario (crear O editar, según state.editandoId)
// ==========================================================
const form = document.getElementById("form-plantilla");
const titulo = document.getElementById("titulo");
const hashtag = document.getElementById("hashtag");
const mensaje = document.getElementById("mensaje");
const btnGuardar = document.getElementById("btn-guardar");
const btnCancelar = document.getElementById("btn-cancelar");

form.addEventListener("submit", function (evento) {
  evento.preventDefault();

  const tituloTexto = titulo.value.trim();
  const mensajeTexto = mensaje.value.trim();

  if (tituloTexto.length === 0 || mensajeTexto.length === 0) {
    alert("Título y mensaje son obligatorios");
    return;
  }

  if (state.editandoId) {
    // HU2: actualiza solo esa plantilla, sin mutar el array original
    state.plantillas = state.plantillas.map(plantilla =>
      plantilla.id === state.editandoId
        ? { ...plantilla, titulo: tituloTexto, mensaje: mensajeTexto, hashtag: normalizarHashtag(hashtag.value) }
        : plantilla
    );
    state.editandoId = null;
    btnGuardar.textContent = "Agregar plantilla";
    btnCancelar.classList.add("hidden");
  } else {
    agregarPlantilla(tituloTexto, mensajeTexto, normalizarHashtag(hashtag.value));
  }

  render();
  form.reset();
});

btnCancelar.addEventListener("click", cancelarEdicion);

// ==========================================================
// Delegación de eventos — UN listener para todos los botones
// ==========================================================
lista.addEventListener("click", function (evento) {
  const id = evento.target.dataset.id;
  if (!id) return; // el clic no fue en un botón con data-id

  if (evento.target.classList.contains("btn-eliminar")) {
    // Logro 3 (C14): confirmar antes de borrar
    const confirmado = confirm("¿Seguro que quieres eliminar esta plantilla?");
    if (confirmado) eliminarPlantilla(id);
  }

  if (evento.target.classList.contains("btn-editar")) {
    cargarEnFormulario(id);
  }
});

// ==========================================================
// Buscador — filtra al instante mientras se escribe
// ==========================================================
document.getElementById("buscador").addEventListener("input", function (evento) {
  state.filtro = evento.target.value;
  render();
});

// ==========================================================
// Generador de mensaje final 
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

// Primer render al cargar la página
render();