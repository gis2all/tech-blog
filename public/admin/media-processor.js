(function () {
  "use strict";

  function fileFromBlob(blob, originalName) {
    var basename = String(originalName || "image").replace(/\.[^.]+$/, "");
    return new File([blob], basename + ".webp", {
      type: "image/webp",
      lastModified: Date.now(),
    });
  }

  function canvasBlob(canvas, quality) {
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        if (blob) resolve(blob);
        else reject(new Error("浏览器无法生成 WebP 图片"));
      }, "image/webp", quality);
    });
  }

  async function processRaster(file) {
    var bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    var dimensions = DecapMediaDomain.fitDimensions(bitmap.width, bitmap.height, 1600);
    var compliant =
      file.type === "image/webp" &&
      dimensions.width === bitmap.width &&
      dimensions.height === bitmap.height &&
      file.size <= 500 * 1024;
    if (compliant) {
      bitmap.close();
      return file;
    }

    var canvas = document.createElement("canvas");
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    var context = canvas.getContext("2d", { alpha: true });
    if (!context) throw new Error("浏览器无法初始化图片压缩");
    context.drawImage(bitmap, 0, 0, dimensions.width, dimensions.height);
    bitmap.close();

    var qualities = [0.84, 0.76, 0.68, 0.60, 0.52, 0.44, 0.36];
    var blob = null;
    for (var index = 0; index < qualities.length; index += 1) {
      blob = await canvasBlob(canvas, qualities[index]);
      if (blob.size <= 500 * 1024) break;
    }
    if (!blob || blob.size > 5 * 1024 * 1024) {
      throw new Error("图片压缩后仍超过 5MB，请先缩小原图");
    }
    return fileFromBlob(blob, file.name);
  }

  async function processFile(file, cover) {
    var errors = DecapMediaDomain.validateFile(file, cover);
    if (errors.length) throw new Error(errors.join("\n"));
    if (DecapMediaDomain.isRaster(file)) return processRaster(file);
    if (/\.svg$/i.test(file.name)) {
      var source = await file.text();
      if (!DecapMediaDomain.isSafeSvg(source)) {
        throw new Error("SVG 包含脚本、事件处理器或不安全链接");
      }
    }
    return file;
  }

  window.DecapMediaProcessor = { processFile: processFile };
})();
