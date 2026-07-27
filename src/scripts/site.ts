const root = document.documentElement;
const storedTheme = localStorage.getItem("theme");

if (storedTheme === "dark") {
  root.dataset.theme = "dark";
}

document.querySelectorAll<HTMLElement>("[data-theme-toggle]").forEach((button) => {
  button.addEventListener("click", () => {
    const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
    if (nextTheme === "dark") {
      root.dataset.theme = "dark";
    } else {
      delete root.dataset.theme;
    }
    localStorage.setItem("theme", nextTheme);
  });
});

document.querySelectorAll<HTMLButtonElement>("[data-menu-toggle]").forEach((button) => {
  button.addEventListener("click", () => {
    const open = document.body.classList.toggle("menu-open");
    button.setAttribute("aria-expanded", String(open));
  });
});

document.querySelectorAll<HTMLPreElement>(".prose pre").forEach((pre) => {
  const code = pre.querySelector("code");
  if (!code) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "copy-button";
  button.textContent = "复制";
  button.addEventListener("click", async () => {
    await navigator.clipboard.writeText(code.textContent ?? "");
    button.textContent = "已复制";
    window.setTimeout(() => {
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
