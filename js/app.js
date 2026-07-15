// ==========================================================
// App.js — ahora solo importa y arranca la app
// ==========================================================
import { state } from "./state.js";
import { cargar, registrarVisita, CLAVE_FILTRO } from "./storage.js";
import { render } from "./ui.js";

// Recupera el estado guardado antes del primer render
state.plantillas = cargar();
state.filtro = localStorage.getItem(CLAVE_FILTRO) ?? "";
document.getElementById("buscador").value = state.filtro;

// Contador de visitas
const visitas = registrarVisita();
console.log(`Visita número ${visitas}`);

// Export bonito en consola
console.log(JSON.stringify(state.plantillas, null, 2));

// Primer render, ya con los datos cargados
render();