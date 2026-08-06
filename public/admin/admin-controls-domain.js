(function (global) {
  function nextOptionIndex(current, key, count) {
    if (!Number.isInteger(count) || count <= 0) return -1;
    if (!Number.isInteger(current) || current < 0 || current >= count) {
      return key === "ArrowUp" || key === "End" ? count - 1 : 0;
    }
    if (key === "ArrowDown") return (current + 1) % count;
    if (key === "ArrowUp") return (current - 1 + count) % count;
    if (key === "Home") return 0;
    if (key === "End") return count - 1;
    return current;
  }

  function selectedOptionIndex(options, value) {
    if (!Array.isArray(options) || options.length === 0) return -1;
    var index = options.findIndex(function (option) {
      return String(option[0]) === String(value);
    });
    return index < 0 ? 0 : index;
  }

  global.DecapAdminControlsDomain = {
    nextOptionIndex: nextOptionIndex,
    selectedOptionIndex: selectedOptionIndex,
  };
})(window);
