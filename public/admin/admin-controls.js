(function (global) {
  var domain = global.DecapAdminControlsDomain;
  var document = global.document;
  var controlId = 0;
  var openControl = null;

  if (!document || !domain) return;

  function icon(name) {
    if (global.DecapAdminIcons && typeof global.DecapAdminIcons.create === "function") {
      return global.DecapAdminIcons.create(name);
    }
    var fallback = document.createElement("span");
    fallback.setAttribute("aria-hidden", "true");
    return fallback;
  }

  function optionButtons(control) {
    return Array.from(control.querySelectorAll(".cms-select__option"));
  }

  function close(control, restoreFocus) {
    if (!control) return;
    var trigger = control.querySelector(".cms-select__trigger");
    var listbox = control.querySelector(".cms-select__listbox");
    control.dataset.open = "false";
    trigger.setAttribute("aria-expanded", "false");
    listbox.hidden = true;
    if (openControl === control) openControl = null;
    if (restoreFocus) trigger.focus();
  }

  function focusOption(control, index) {
    var options = optionButtons(control);
    if (!options.length) return;
    var next = Math.max(0, Math.min(index, options.length - 1));
    options[next].focus();
  }

  function open(control, preferredIndex) {
    if (openControl && openControl !== control) close(openControl, false);
    var trigger = control.querySelector(".cms-select__trigger");
    var listbox = control.querySelector(".cms-select__listbox");
    control.dataset.open = "true";
    trigger.setAttribute("aria-expanded", "true");
    listbox.hidden = false;
    openControl = control;
    focusOption(control, preferredIndex);
  }

  function updateSelection(control, options, index, emitChange) {
    var nextIndex = index < 0 ? 0 : index;
    var selected = options[nextIndex];
    if (!selected) return;
    control.dataset.value = String(selected[0]);
    control.querySelector(".cms-select__value").textContent = selected[1];
    optionButtons(control).forEach(function (button, buttonIndex) {
      button.setAttribute("aria-selected", buttonIndex === nextIndex ? "true" : "false");
    });
    if (emitChange) control.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function createSelect(config) {
    var options = Array.isArray(config.options) ? config.options.slice() : [];
    var initialIndex = domain.selectedOptionIndex(options, config.value || options[0]?.[0]);
    var id = "cms-select-" + (++controlId);
    var control = document.createElement("div");
    var trigger = document.createElement("button");
    var value = document.createElement("span");
    var chevron = icon("chevron-down");
    var listbox = document.createElement("div");

    control.className = "cms-select";
    control.dataset.open = "false";
    trigger.type = "button";
    trigger.className = "cms-select__trigger";
    trigger.id = id + "-trigger";
    trigger.setAttribute("aria-label", config.label);
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-controls", id + "-listbox");
    value.className = "cms-select__value";
    chevron.classList.add("cms-select__chevron");
    trigger.append(value, chevron);

    listbox.className = "cms-select__listbox";
    listbox.id = id + "-listbox";
    listbox.setAttribute("role", "listbox");
    listbox.setAttribute("aria-labelledby", trigger.id);
    listbox.hidden = true;

    options.forEach(function (item, index) {
      var option = document.createElement("button");
      var label = document.createElement("span");
      var check = icon("check");
      option.type = "button";
      option.className = "cms-select__option";
      option.setAttribute("role", "option");
      option.setAttribute("aria-selected", index === initialIndex ? "true" : "false");
      option.dataset.value = String(item[0]);
      label.textContent = item[1];
      check.classList.add("cms-select__check");
      option.append(label, check);
      option.addEventListener("click", function () {
        updateSelection(control, options, index, true);
        close(control, true);
      });
      option.addEventListener("keydown", function (event) {
        var current = optionButtons(control).indexOf(option);
        if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
          event.preventDefault();
          focusOption(control, domain.nextOptionIndex(current, event.key, options.length));
        } else if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          updateSelection(control, options, current, true);
          close(control, true);
        } else if (event.key === "Escape") {
          event.preventDefault();
          close(control, true);
        } else if (event.key === "Tab") {
          close(control, false);
        }
      });
      listbox.appendChild(option);
    });

    trigger.addEventListener("click", function () {
      if (control.dataset.open === "true") close(control, false);
      else open(control, domain.selectedOptionIndex(options, control.value));
    });
    trigger.addEventListener("keydown", function (event) {
      if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        var current = domain.selectedOptionIndex(options, control.value);
        open(control, domain.nextOptionIndex(current, event.key, options.length));
      } else if (event.key === "Escape" && control.dataset.open === "true") {
        event.preventDefault();
        close(control, false);
      }
    });

    Object.defineProperty(control, "value", {
      get: function () { return control.dataset.value || ""; },
      set: function (nextValue) {
        updateSelection(control, options, domain.selectedOptionIndex(options, nextValue), false);
      },
    });

    control.append(trigger, listbox);
    updateSelection(control, options, initialIndex, false);
    return control;
  }

  document.addEventListener("pointerdown", function (event) {
    if (openControl && !openControl.contains(event.target)) close(openControl, false);
  });

  global.DecapAdminControls = {
    closeOpenSelect: function () { close(openControl, false); },
    createSelect: createSelect,
  };
})(window);
