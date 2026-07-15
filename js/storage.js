// ==========================================================
// Persistencia — todo el localStorage vive aquí
// ==========================================================
import { state } from "./state.js";

export const CLAVE = "whatsapp-templates";
export const CLAVE_FILTRO = "whatsapp-templates-filtro";
export const CLAVE_VISITAS = "whatsapp-templates-visitas";

export function guardar() {
    // Plantillas: array de objetos → texto. Si no queda nada, borra la clave.
  state.plantillas.length === 0
    ? localStorage.removeItem(CLAVE)
    : localStorage.setItem(CLAVE, JSON.stringify(state.plantillas));
    // Filtro: ya es texto, no necesita JSON.stringify.
  localStorage.setItem(CLAVE_FILTRO, state.filtro ?? "");
}

export function cargar() {
  const guardado = localStorage.getItem(CLAVE);
  if (!guardado) return [];
  try {
    return JSON.parse(guardado);
  } catch (error) {
    console.warn("Datos corruptos, empiezo de cero:", error);
    return [];
  }
}

// Contador de veces que se abrió la app
export function registrarVisita() {
  const visitas = Number(localStorage.getItem(CLAVE_VISITAS) ?? 0) + 1;
  localStorage.setItem(CLAVE_VISITAS, visitas);
  return visitas;
}