// src/utils/fechas.js
// Convierte una fecha UTC proveniente de MySQL al formato local de Costa Rica
export function formatearFechaCostaRica(fecha) {
  if (!fecha) return "";

  // MySQL retorna el timestamp como objeto Date en UTC
  const date = new Date(fecha);

  // Opciones de formato para Costa Rica (UTC-6, sin horario de verano)
  return date.toLocaleString("es-CR", {
    timeZone: "America/Costa_Rica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
}