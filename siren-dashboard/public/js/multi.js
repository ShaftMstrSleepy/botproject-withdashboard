// public/js/multi.js
(function () {
  function enhance(select) {
    select.style.display = "none";

    const wrapper = document.createElement("div");
    wrapper.className = "mdrop";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "mdrop-toggle";
    button.textContent = getLabel(select);
    wrapper.appendChild(button);

    const panel = document.createElement("div");
    panel.className = "mdrop-panel";

    // Build checkbox list
    Array.from(select.options).forEach(opt => {
      const row = document.createElement("label");
      row.className = "mdrop-row";

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.value = opt.value;
      cb.checked = opt.selected;

      const span = document.createElement("span");
      span.textContent = opt.textContent;

      // ✅ Keep panel open when selecting
      cb.addEventListener("change", e => {
        e.stopPropagation();           // prevent click from closing panel
        opt.selected = cb.checked;
        button.textContent = getLabel(select);
      });

      row.appendChild(cb);
      row.appendChild(span);
      panel.appendChild(row);
    });

    wrapper.appendChild(panel);
    select.parentNode.insertBefore(wrapper, select.nextSibling);

    // Toggle open/close only when clicking the main button
    button.addEventListener("click", e => {
      e.stopPropagation();
      panel.classList.toggle("open");
    });

    // Close only when clicking outside the entire wrapper
    document.addEventListener("click", e => {
      if (!wrapper.contains(e.target)) {
        panel.classList.remove("open");
      }
    });
  }

  function getLabel(select) {
    const selected = Array.from(select.selectedOptions).map(o => o.textContent);
    if (!selected.length) return "Select channels…";
    if (selected.length <= 2) return selected.join(", ");
    return `${selected.length} selected`;
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("select.multi[multiple]").forEach(enhance);
  });
})();
