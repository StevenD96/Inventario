export const handlebarsHelpers = {
  eq(a, b) {
    return a === b;
  },

  ifCond(v1, operator, v2, options) {
    switch (operator) {
      case "==": return v1 == v2 ? options.fn(this) : options.inverse(this);
      case "===": return v1 === v2 ? options.fn(this) : options.inverse(this);
      case "!=": return v1 != v2 ? options.fn(this) : options.inverse(this);
      case "!==": return v1 !== v2 ? options.fn(this) : options.inverse(this);
      case "<": return v1 < v2 ? options.fn(this) : options.inverse(this);
      case "<=": return v1 <= v2 ? options.fn(this) : options.inverse(this);
      case ">": return v1 > v2 ? options.fn(this) : options.inverse(this);
      case ">=": return v1 >= v2 ? options.fn(this) : options.inverse(this);
      case "&&": return (v1 && v2) ? options.fn(this) : options.inverse(this);
      case "||": return (v1 || v2) ? options.fn(this) : options.inverse(this);
      default: return options.inverse(this);
    }
  },

  add(a, b) {
    return a + b;
  },

  subtract(a, b) {
    return a - b;
  },

  range(start, end) {
    let arr = [];
    for (let i = start; i <= end; i++) {
      arr.push(i);
    }
    return arr;
  },

  
  //NUEVO HELPER PARA INVENTARIO (cantidad < 10)
  lt(a, b) {
    return a < b;
  },

  // ===============================
  //  NUEVOS HELPERS PARA BITÁCORA
  // ===============================

  opcionesMes(mesSeleccionado) {
    const meses = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    return meses
      .map((mes, index) => {
        const value = index + 1;
        const selected = value == mesSeleccionado ? "selected" : "";
        return `<option value="${value}" ${selected}>${mes}</option>`;
      })
      .join("");
  },

  opcionesAnio(anioSeleccionado) {
    const actual = new Date().getFullYear();
    let html = "";

    for (let a = actual; a >= actual - 5; a--) {
      const selected = a == anioSeleccionado ? "selected" : "";
      html += `<option value="${a}" ${selected}>${a}</option>`;
    }

    return html;
  },

  opcionesUsuarios(usuarios, seleccionado) {
    let html = `<option value="">Todos</option>`;
    if (!usuarios || !usuarios.length) return html;

    usuarios.forEach(u => {
      const selected = u.nombre_usuario === seleccionado ? "selected" : "";
      html += `<option value="${u.nombre_usuario}" ${selected}>${u.nombre_usuario}</option>`;
    });

    return html;
  },

  opcionesModulo(moduloSel) {
    const modulos = ["Login","Usuarios", "Tubería", "Inventario", "Reportes", "Sistema"];

    return modulos
      .map(m => {
        const selected = m === moduloSel ? "selected" : "";
        return `<option value="${m}" ${selected}>${m}</option>`;
      })
      .join("");
  }
};



