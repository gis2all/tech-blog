const videos = Array.from(
  document.querySelectorAll<HTMLVideoElement>("video.article-animation[data-src]"),
);

function loadVideo(video: HTMLVideoElement) {
  const source = video.dataset.src;
  if (!source) return;

  video.src = source;
  delete video.dataset.src;
  video.load();
  void video.play().catch(() => {});
}

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;

        const video = entry.target as HTMLVideoElement;
        loadVideo(video);
        observer.unobserve(video);
      }
    },
    { rootMargin: "300px 0px" },
  );

  for (const video of videos) observer.observe(video);
} else {
  for (const video of videos) loadVideo(video);
}
