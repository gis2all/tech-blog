const root = document.documentElement;
const storedTheme = localStorage.getItem("theme");

if (storedTheme === "dark") {
  root.dataset.theme = "dark";
}

const themeButtons = document.querySelectorAll<HTMLButtonElement>("[data-theme-toggle]");

function setTheme(dark: boolean) {
  if (dark) {
    root.dataset.theme = "dark";
  } else {
    delete root.dataset.theme;
  }

  localStorage.setItem("theme", dark ? "dark" : "light");
  themeButtons.forEach((button) => {
    button.setAttribute("aria-label", dark ? "切换浅色模式" : "切换深色模式");
    const label = button.querySelector<HTMLElement>("[data-theme-label]");
    if (label) label.textContent = dark ? "浅色模式" : "深色模式";
  });
}

setTheme(root.dataset.theme === "dark");
themeButtons.forEach((button) => {
  button.addEventListener("click", () => setTheme(root.dataset.theme !== "dark"));
});

const menuButtons = document.querySelectorAll<HTMLButtonElement>("[data-menu-toggle]");
let menuOpener: HTMLButtonElement | null = null;

function setMenuOpen(open: boolean, restoreFocus = false) {
  const wasOpen = document.body.classList.contains("menu-open");
  document.body.classList.toggle("menu-open", open);
  menuButtons.forEach((button) => {
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? "关闭菜单" : "打开菜单");
  });

  if (!open && wasOpen && restoreFocus) menuOpener?.focus();
}

menuButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const open = !document.body.classList.contains("menu-open");
    if (open) menuOpener = button;
    setMenuOpen(open);
  });
});

document.querySelectorAll<HTMLElement>("[data-menu] a").forEach((link) => {
  link.addEventListener("click", () => setMenuOpen(false));
});

const tocPanel = document.querySelector<HTMLElement>("[data-toc-panel]");
const tocButtons = document.querySelectorAll<HTMLButtonElement>("[data-toc-toggle]");
const tocCloseButtons = document.querySelectorAll<HTMLButtonElement>("[data-toc-close]");
let tocOpener: HTMLButtonElement | null = null;

function setTocOpen(open: boolean, restoreFocus = false) {
  if (!tocPanel) return;

  const wasOpen = !tocPanel.hidden;
  tocPanel.hidden = !open;
  tocPanel.setAttribute("aria-hidden", String(!open));
  document.body.classList.toggle("toc-open", open);
  tocButtons.forEach((button) => {
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? "关闭文章目录" : "打开文章目录");
  });

  if (open) tocCloseButtons.item(0)?.focus();
  if (!open && wasOpen && restoreFocus) tocOpener?.focus();
}

tocButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const open = Boolean(tocPanel?.hidden);
    if (open) tocOpener = button;
    setTocOpen(open);
  });
});
tocCloseButtons.forEach((button) => {
  button.addEventListener("click", () => setTocOpen(false, true));
});
tocPanel?.addEventListener("click", (event) => {
  if (event.target === tocPanel) setTocOpen(false, true);
});
tocPanel?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setTocOpen(false, true));
});

function getFocusableElements(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Tab" && tocPanel && !tocPanel.hidden) {
    const focusable = getFocusableElements(tocPanel);
    const first = focusable.at(0);
    const last = focusable.at(-1);

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
    return;
  }

  if (event.key !== "Escape") return;
  if (tocPanel && !tocPanel.hidden) {
    setTocOpen(false, true);
    return;
  }
  if (document.body.classList.contains("menu-open")) {
    setMenuOpen(false, true);
  }
});

window.matchMedia("(min-width: 901px)").addEventListener("change", (event) => {
  if (!event.matches) return;
  const menuWasOpen = document.body.classList.contains("menu-open");
  const tocWasOpen = Boolean(tocPanel && !tocPanel.hidden);

  setMenuOpen(false);
  setTocOpen(false);

  if (menuWasOpen) {
    document.querySelector<HTMLAnchorElement>(".brand")?.focus();
  }
  if (tocWasOpen) {
    document.querySelector<HTMLAnchorElement>("[data-desktop-toc] a[href]")?.focus();
  }
});

document.querySelectorAll<HTMLPreElement>(".prose pre").forEach((pre) => {
  const code = pre.querySelector("code");
  if (!code) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "copy-button";
  button.setAttribute("aria-live", "polite");
  button.textContent = "复制";
  let resetTimer: number | undefined;
  button.addEventListener("click", async () => {
    window.clearTimeout(resetTimer);

    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(code.textContent ?? "");
      button.textContent = "已复制";
    } catch {
      button.textContent = "复制失败";
    }

    resetTimer = window.setTimeout(() => {
      button.textContent = "复制";
    }, 1200);
  });
  pre.append(button);
});

const readBar = document.querySelector<HTMLElement>("[data-read-bar]");
const readPercent = document.querySelector<HTMLElement>("[data-read-percent]");
const article = document.querySelector<HTMLElement>(".prose");

function updateReadProgress() {
  if (!readBar || !readPercent || !article) return;
  const rect = article.getBoundingClientRect();
  const total = Math.max(1, rect.height - window.innerHeight * 0.4);
  const read = Math.min(total, Math.max(0, -rect.top + window.innerHeight * 0.15));
  const percent = Math.round((read / total) * 100);
  readBar.style.width = `${percent}%`;
  readPercent.textContent = `${percent}%`;
}

updateReadProgress();
document.addEventListener("scroll", updateReadProgress, { passive: true });
window.addEventListener("resize", updateReadProgress);
