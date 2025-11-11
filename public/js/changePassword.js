document.addEventListener("DOMContentLoaded", () => {
  const inputPass = document.getElementById("nueva_contrasena");
  const reqs = {
    length: document.getElementById("req-length"),
    uppercase: document.getElementById("req-uppercase"),
    number: document.getElementById("req-number"),
    special: document.getElementById("req-special")
  };

  inputPass.addEventListener("input", () => {
    const val = inputPass.value;

    const checks = {
      length: val.length >= 8,
      uppercase: /[A-Z]/.test(val),
      number: /[0-9]/.test(val),
      special: /[!@#$%^&*]/.test(val)
    };

    for (const key in checks) {
      const icon = reqs[key].querySelector("i");
      if (checks[key]) {
        icon.className = "bi bi-check-circle text-success";
      } else {
        icon.className = "bi bi-x-circle text-danger";
      }
    }
  });
});
