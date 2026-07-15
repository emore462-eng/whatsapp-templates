// ==========================================================
// C15: Persistencia — todo el localStorage vive aquí
// ==========================================================
const CLAVE = "whatsapp-templates";
const CLAVE_FILTRO = "whatsapp-templates-filtro";
const CLAVE_VISITAS = "whatsapp-templates-visitas"; // Logro 2

function guardar() {
  // Plantillas: array de objetos → texto. Si no queda nada, borra la clave.
  state.plantillas.length === 0
    ? localStorage.removeItem(CLAVE)
    : localStorage.setItem(CLAVE, JSON.stringify(state.plantillas));

  // Filtro: ya es texto, no necesita JSON.stringify.
  localStorage.setItem(CLAVE_FILTRO, state.filtro ?? "");

  // HU4: indicador de estado
  const estado = document.getElementById("estado");
  if (estado) {
    estado.textContent = state.plantillas.length > 0 ? "Guardado ✓" : "Vacío";
  }
}

function cargar() {
  const guardado = localStorage.getItem(CLAVE);
  if (!guardado) return [];

  try {
    return JSON.parse(guardado); // texto → objeto
  } catch (error) {
    console.warn("Datos corruptos, empiezo de cero:", error);
    return [];
  }
}

// Logro 2: contador de veces que se abrió la app
function registrarVisita() {
  const visitas = Number(localStorage.getItem(CLAVE_VISITAS) ?? 0) + 1;
  localStorage.setItem(CLAVE_VISITAS, visitas);
  return visitas;
}