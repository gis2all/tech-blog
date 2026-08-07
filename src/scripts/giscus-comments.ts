const commentsRoot = document.querySelector<HTMLElement>("[data-giscus-comments]");
const html = document.documentElement;
let giscusLoaded = false;
let giscusFrame: HTMLIFrameElement | null = null;

function getGiscusTheme(): "light" | "dark" {
  return html.dataset.theme === "dark" ? "dark" : "light";
}

function setGiscusTheme() {
  if (!giscusLoaded) return;

  giscusFrame?.contentWindow?.postMessage(
    {
      giscus: {
        setConfig: {
          theme: getGiscusTheme(),
        },
      },
    },
    "https://giscus.app",
  );
}

function observeGiscusFrame() {
  const frame = commentsRoot?.querySelector<HTMLIFrameElement>("iframe.giscus-frame");

  if (!frame || frame === giscusFrame) return;

  giscusLoaded = false;
  giscusFrame = frame;
  frame.addEventListener("load", () => {
    giscusLoaded = true;
    setGiscusTheme();
  });
}

if (commentsRoot) {
  const themeObserver = new MutationObserver(setGiscusTheme);
  themeObserver.observe(html, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  const commentsObserver = new MutationObserver(observeGiscusFrame);
  commentsObserver.observe(commentsRoot, {
    childList: true,
    subtree: true,
  });

  observeGiscusFrame();
}
