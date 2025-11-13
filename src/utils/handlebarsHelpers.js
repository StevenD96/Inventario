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
  }
};
