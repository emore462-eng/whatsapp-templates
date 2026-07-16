import { Template } from "./models/Template.js";
import { state, normalizarHashtag, contarPorHashtag, hashtagMasUsado, plantillasVisibles } from "./state.js";
import { guardar } from "./storage.js";

// ==========================================================
// Referencias al DOM
// ==========================================================
const lista = document.getElementById("listaPlantillas");
const selector = document.getElementById("selector");

const form = document.getElementById("form-plantilla");
const titulo = document.getElementById("titulo");
const hashtag = document.getElementById("hashtag");
const mensaje = document.getElementById("mensaje");
const btnGuardar = document.getElementById("btn-guardar");
const btnCancelar = document.getElementById("btn-cancelar");

const buscador = document.getElementById("buscador");
const ordenSelect = document.getElementById("orden");
const btnLimpiarFiltro = document.getElementById("btn-limpiar-filtro");
const btnVaciar = document.getElementById("btn-vaciar");
const estadoChip = document.getElementById("estado");

const salida = document.getElementById("mensaje-final");

// Modal (HU1 C16)
const modal = document.getElementById("modal");
const modalTexto = document.getElementById("modal-texto");
const modalCancelar = document.getElementById("modal-cancelar");
const modalConfirmar = document.getElementById("modal-confirmar");
let accionPendiente = null; // qué ejecutar si el usuario acepta

// ==========================================================
// Helpers de texto 
// ==========================================================
function recortarTexto(texto, limite = 60) {
  return texto.length > limite ? texto.slice(0, limite) + "…" : texto;
}

// ==========================================================
// Modal propio de confirmación
// ==========================================================
function pedirConfirmacion(mensajeTexto, accion) {
  modalTexto.textContent = mensajeTexto;
  accionPendiente = accion;
  modal.classList.remove("hidden");
}

function cerrarModal() {
  modal.classList.add("hidden");
  accionPendiente = null;
}

modalCancelar.addEventListener("click", cerrarModal);

modalConfirmar.addEventListener("click", function () {
  if (accionPendiente) accionPendiente();
  cerrarModal();
});

// Cerrar el modal al hacer clic en el fondo oscuro (no en el cuadro blanco)
modal.addEventListener("click", function (evento) {
  if (evento.target === modal) cerrarModal();
});

// ==========================================================
// Crear / eliminar / editar plantillas
// ==========================================================
function agregarPlantilla(tituloTexto, mensajeTexto, hashtagTexto) {
  const nueva = new Template(tituloTexto, mensajeTexto, hashtagTexto);
  state.plantillas.push(nueva);
}

function eliminarPlantilla(id) {
  pedirConfirmacion("¿Eliminar esta plantilla?", function () {
    state.plantillas = state.plantillas.filter(plantilla => plantilla.id !== id);
    render();
  });
}

function cargarEnFormulario(id) {
  const plantilla = state.plantillas.find(plantilla => plantilla.id === id);
  if (!plantilla) return;

  titulo.value = plantilla.titulo;
  mensaje.value = plantilla.mensaje;
  hashtag.value = plantilla.hashtag;
  state.editandoId = id;

  btnGuardar.textContent = "Guardar cambios";
  btnCancelar.classList.remove("hidden"); // Logro 1 (C14)
}

function cancelarEdicion() {
  state.editandoId = null;
  form.reset();
  btnGuardar.textContent = "Agregar plantilla";
  btnCancelar.classList.add("hidden");
}

// ==========================================================
// render() — limpia y redibuja TODO desde el estado
// ==========================================================
export function render() {
  const visibles = plantillasVisibles();
  lista.innerHTML = "";

  // Estados vacíos amigables
  if (visibles.length === 0) {
    const vacio = state.plantillas.length === 0
      ? "Aún no tienes plantillas. ¡Crea la primera!"
      : "No se encontraron plantillas con ese filtro.";

    lista.innerHTML = `
      <li class="sm:col-span-2 text-center py-10" style="color: var(--ink-soft);">
        <div class="text-4xl mb-2">📭</div>
        ${vacio}
      </li>`;
  } else {
    visibles.forEach(function (plantilla) {
      // JSON no guarda objetos Date: tras cargar desde localStorage, fecha es un string.
      const fechaTexto = new Date(plantilla.fecha).toLocaleDateString("es-PE");
      const cantidadCaracteres = plantilla.mensaje.length;       // Logro 1 (C13)
      const mensajeCorto = recortarTexto(plantilla.mensaje, 60); // Logro 2 (C13)

      const editadaTexto = plantilla.editadaEl
        ? `<span style="color: var(--ink-soft);"> · editada ${new Date(plantilla.editadaEl).toLocaleDateString("es-PE")}</span>`
        : "";

      const li = document.createElement("li");
      li.className = "tarjeta-plantilla p-4 rounded-xl";
      li.innerHTML = `
        <div class="flex items-start justify-between gap-2">
          <strong style="color: var(--ink);">${plantilla.titulo}</strong>
          <span class="text-xs shrink-0" style="color: var(--ink-soft);">${fechaTexto}${editadaTexto}</span>
        </div>
        <p class="text-sm mt-1" style="color: var(--ink-soft);">${mensajeCorto}</p>
        <div class="flex items-center justify-between mt-2">
          <span class="chip-hashtag inline-block text-xs px-2 py-0.5 rounded-full">${plantilla.hashtag}</span>
          <span class="text-xs" style="color: var(--ink-soft);">${cantidadCaracteres} caracteres</span>
        </div>
        <div class="flex gap-2 mt-3 pt-2" style="border-top: 1px solid var(--border);">
          <button class="btn-editar text-xs px-2.5 py-1 rounded-md transition" data-id="${plantilla.id}">Editar</button>
          <button class="btn-eliminar text-xs px-2.5 py-1 rounded-md transition" data-id="${plantilla.id}">Eliminar</button>
        </div>`;
      lista.appendChild(li);
    });
  }

  renderSelector();
  renderStats();
  guardar(); // el estado ya cambió, persístelo

  // Indicador de estado (vive en ui.js, storage.js solo persiste)
  estadoChip.textContent = state.plantillas.length > 0 ? "Guardado ✓" : "Vacío";
}

function renderSelector() {
  selector.innerHTML = state.plantillas
    .map((plantilla, indice) => `<option value="${indice}">${plantilla.titulo}</option>`)
    .join("");
}

function renderStats() {
  const total = state.plantillas.length;
  const porTag = contarPorHashtag(state.plantillas);

  const etiquetas = Object.entries(porTag)
    .map(([tag, cantidad]) =>
      `<span class="chip-hashtag text-xs px-2 py-0.5 rounded-full">${tag} · ${cantidad}</span>`)
    .join("");

  const top = hashtagMasUsado(porTag);
  const topTexto = top
    ? `<span class="text-xs font-medium" style="color: var(--rose-600);">🏆 Más usado: ${top[0]} (${top[1]})</span>`
    : "";

  document.getElementById("panel-stats").innerHTML = `
    <div class="flex items-center gap-2 flex-wrap">
      <span class="text-sm font-semibold" style="color: var(--ink);">${total} plantilla(s)</span>
      ${etiquetas}
    </div>
    ${topTexto ? `<div class="mt-1">${topTexto}</div>` : ""}`;
}

// ==========================================================
// Formulario (crear O editar, según state.editandoId)
// ==========================================================
form.addEventListener("submit", function (evento) {
  evento.preventDefault();

  const tituloTexto = titulo.value.trim();
  const mensajeTexto = mensaje.value.trim();

  if (tituloTexto.length === 0 || mensajeTexto.length === 0) {
    alert("Título y mensaje son obligatorios");
    return;
  }

  if (state.editandoId) {
    state.plantillas = state.plantillas.map(plantilla =>
      plantilla.id === state.editandoId
        ? {
            ...plantilla,
            titulo: tituloTexto,
            mensaje: mensajeTexto,
            hashtag: normalizarHashtag(hashtag.value),
            editadaEl: new Date() // Logro 3 (C15)
          }
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
// Delegación de eventos — UN listener para editar/eliminar
// ==========================================================
lista.addEventListener("click", function (evento) {
  const id = evento.target.dataset.id;
  if (!id) return;

  if (evento.target.classList.contains("btn-eliminar")) {
    eliminarPlantilla(id); // ahora pide confirmación con el modal (HU1 C16)
  }

  if (evento.target.classList.contains("btn-editar")) {
    cargarEnFormulario(id);
  }
});

// ==========================================================
// Buscador + limpiar filtro
// ==========================================================
buscador.addEventListener("input", function (evento) {
  state.filtro = evento.target.value;
  render();
});

btnLimpiarFiltro.addEventListener("click", function () {
  state.filtro = "";
  buscador.value = "";
  render();
});

// ==========================================================
// Ordenar la colección
// ==========================================================
ordenSelect.addEventListener("change", function (evento) {
  state.orden = evento.target.value; // el orden vive en el estado
  render();
});

// ==========================================================
// Vaciar todo  — ahora con confirmación 
// ==========================================================
btnVaciar.addEventListener("click", function () {
  pedirConfirmacion("Esto borrará TODAS tus plantillas. ¿Continuar?", function () {
    state.plantillas = [];
    render(); // render → guardar(); como queda vacío, guardar() borra la clave
  });
});

// ==========================================================
// Generador de mensaje final 
// ==========================================================
function generarMensajeFinal(plantilla, valorNombre, valorProducto) {
  return plantilla.mensaje
    .replaceAll("{nombre}", valorNombre || "")
    .replaceAll("{producto}", valorProducto || "");
}

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