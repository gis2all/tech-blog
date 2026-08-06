const articleImages = document.querySelectorAll<HTMLImageElement>(".prose img");

let activeOverlay: HTMLDivElement | null = null;
let sourceImage: HTMLImageElement | null = null;

function closeImageLightbox(restoreFocus = true) {
  if (!activeOverlay) return;

  activeOverlay.remove();
  activeOverlay = null;
  document.body.classList.remove("article-image-lightbox-open");
  document.removeEventListener("keydown", handleImageLightboxKeydown);

  if (restoreFocus && sourceImage) sourceImage.focus();
  sourceImage = null;
}

function handleImageLightboxKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") closeImageLightbox();
}

function openImageLightbox(image: HTMLImageElement) {
  closeImageLightbox(false);
  sourceImage = image;

  const overlay = document.createElement("div");
  overlay.className = "article-image-lightbox";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", image.alt.trim() || "图片预览");

  const expandedImage = document.createElement("img");
  expandedImage.className = "article-image-lightbox__image";
  expandedImage.src = image.currentSrc || image.src;
  expandedImage.alt = image.alt;

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "article-image-lightbox__close";
  closeButton.setAttribute("aria-label", "关闭图片预览");
  closeButton.title = "关闭图片预览";
  closeButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>';
  closeButton.addEventListener("click", () => closeImageLightbox());

  overlay.append(expandedImage, closeButton);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeImageLightbox();
  });

  activeOverlay = overlay;
  document.body.classList.add("article-image-lightbox-open");
  document.addEventListener("keydown", handleImageLightboxKeydown);
  document.body.appendChild(overlay);
  closeButton.focus();
}

articleImages.forEach((image) => {
  if (image.closest("a")) return;

  image.classList.add("article-zoomable-image");
  image.tabIndex = 0;
  image.setAttribute("role", "button");
  image.setAttribute("aria-label", image.alt.trim() ? `放大图片：${image.alt.trim()}` : "放大图片");
  image.addEventListener("click", () => openImageLightbox(image));
  image.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openImageLightbox(image);
    }
  });
});
