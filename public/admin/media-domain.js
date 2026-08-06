(function () {
  "use strict";

  var RASTER = /\.(jpe?g|png|webp)$/i;
  var RETAINED = /\.(gif|svg|mp4)$/i;

  function extension(name) {
    var match = String(name || "").toLowerCase().match(/\.[^.]+$/);
    return match ? match[0] : "";
  }

  function validateFile(file, cover) {
    var errors = [];
    var ext = extension(file && file.name);
    var size = Number(file && file.size) || 0;

    if (!RASTER.test(ext) && !RETAINED.test(ext)) {
      errors.push("仅支持 JPEG、PNG、WebP、GIF、SVG 或 MP4");
      return errors;
    }
    if (cover && !RASTER.test(ext)) {
      errors.push("封面仅支持 JPEG、PNG 或 WebP 静态图片");
    }
    if (ext === ".svg" && size > 1024 * 1024) {
      errors.push("SVG 不能超过 1MB");
    }
    if (ext === ".gif" && size > 5 * 1024 * 1024) {
      errors.push("GIF 不能超过 5MB");
    }
    if (ext === ".mp4" && size > 10 * 1024 * 1024) {
      errors.push("MP4 不能超过 10MB");
    }
    return errors;
  }

  function targetExtension(file) {
    var ext = extension(file && file.name);
    return RASTER.test(ext) ? ".webp" : ext;
  }

  function nextFileName(existing, cover, ext) {
    var names = Array.isArray(existing) ? existing : [];
    if (cover) {
      if (names.indexOf("cover" + ext) === -1) return "cover" + ext;
      var coverIndex = 2;
      while (names.indexOf("cover-" + String(coverIndex).padStart(2, "0") + ext) !== -1) {
        coverIndex += 1;
      }
      return "cover-" + String(coverIndex).padStart(2, "0") + ext;
    }

    var index = 1;
    while (names.some(function (name) {
      return new RegExp("^image-" + String(index).padStart(2, "0") + "\\.", "i").test(name);
    })) {
      index += 1;
    }
    return "image-" + String(index).padStart(2, "0") + ext;
  }

  function fitDimensions(width, height, maxEdge) {
    var limit = maxEdge || 1600;
    var longest = Math.max(width, height);
    if (!longest || longest <= limit) return { width: width, height: height };
    var ratio = limit / longest;
    return {
      width: Math.max(1, Math.round(width * ratio)),
      height: Math.max(1, Math.round(height * ratio)),
    };
  }

  function isSafeSvg(source) {
    return !/<script\b|on\w+\s*=|javascript:|<foreignObject\b/i.test(String(source || ""));
  }

  function normalizeMediaReference(value) {
    var path = String(value || "").split(/[?#]/, 1)[0];
    try {
      return decodeURIComponent(path);
    } catch (_error) {
      return path;
    }
  }

  function classifyMedia(files, references) {
    var known = new Set((Array.isArray(references) ? references : []).map(normalizeMediaReference));
    return (Array.isArray(files) ? files : []).map(function (file) {
      var publicPath = "/" + String(file.path || "").replace(/^public\//, "");
      return { path: file.path, referenced: known.has(normalizeMediaReference(publicPath)) };
    });
  }

  function deletionPaths(files) {
    return (Array.isArray(files) ? files : [])
      .filter(function (file) { return file && file.referenced === false; })
      .map(function (file) { return String(file.path || ""); })
      .filter(Boolean);
  }

  function deletionSelectionState(files, selectedPaths) {
    var paths = deletionPaths(files);
    var selected = new Set(Array.isArray(selectedPaths) ? selectedPaths : []);
    var selectedCount = paths.reduce(function (count, path) {
      return count + (selected.has(path) ? 1 : 0);
    }, 0);
    return {
      paths: paths,
      checked: paths.length > 0 && selectedCount === paths.length,
      indeterminate: selectedCount > 0 && selectedCount < paths.length,
    };
  }

  function toggleDeletionSelection(selectedPaths, files, checked) {
    var selected = new Set(Array.isArray(selectedPaths) ? selectedPaths : []);
    deletionPaths(files).forEach(function (path) {
      if (checked) selected.add(path);
      else selected.delete(path);
    });
    return Array.from(selected);
  }

  function urlTitleSegment(title) {
    return Array.from(String(title || "").trim()).map(function (character) {
      var codePoint = character.codePointAt(0) || 0;
      return codePoint > 127 || /^[A-Za-z0-9._~-]$/.test(character)
        ? character
        : "%" + codePoint.toString(16).toUpperCase().padStart(2, "0");
    }).join("");
  }

  window.DecapMediaDomain = {
    validateFile: validateFile,
    targetExtension: targetExtension,
    nextFileName: nextFileName,
    fitDimensions: fitDimensions,
    isSafeSvg: isSafeSvg,
    classifyMedia: classifyMedia,
    normalizeMediaReference: normalizeMediaReference,
    deletionSelectionState: deletionSelectionState,
    toggleDeletionSelection: toggleDeletionSelection,
    urlTitleSegment: urlTitleSegment,
    isRaster: function (file) { return RASTER.test(extension(file && file.name)); },
  };
})();
