// ==========================================================
// Estado central — la única fuente de verdad de la app
// ==========================================================
export const state = {
  plantillas: [],
  editandoId: null,   // null = modo "crear" | id = modo "editar"
  filtro: "",          // texto del buscador 
  orden: "recientes"   // "recientes" | "antiguas" | "alfabetico" 
};

// ==========================================================
// Limpieza y normalización de texto 
// ==========================================================
export function normalizarHashtag(texto) {
  const limpio = texto.trim().toLowerCase();
  return limpio.startsWith("#") ? limpio : "#" + limpio;
}

// ==========================================================
// Datos derivados — función pura
// ==========================================================
export function contarPorHashtag(plantillas) {
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

// Hashtag más usado, a partir del mismo conteo puro
export function hashtagMasUsado(porTag) {
  const entradas = Object.entries(porTag);
  if (entradas.length === 0) return null;
  return entradas.reduce((mejor, actual) => (actual[1] > mejor[1] ? actual : mejor));
}

// ==========================================================
// Ordenar sin mutar el estado
// ==========================================================
function ordenar(plantillas) {
  const copia = [...plantillas]; // .sort() muta el array original: copiamos primero
  if (state.orden === "antiguas") {
    return copia.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  }
  // Orden alfabético, respetando tildes y mayúsculas
  if (state.orden === "alfabetico") {
    return copia.sort((a, b) => a.titulo.localeCompare(b.titulo));
  }
  return copia.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)); // "recientes" (por defecto)
}

// ==========================================================
// Filtrado y orden derivados del estado
// ==========================================================
export function plantillasVisibles() {
  const filtroTexto = (state.filtro ?? "").toLowerCase();
  const filtradas = filtroTexto === ""
    ? state.plantillas
    : state.plantillas.filter(plantilla => plantilla.hashtag.toLowerCase().includes(filtroTexto));
  return ordenar(filtradas); // primero filtra, luego ordena
}