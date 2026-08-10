// Install the repo-shipped tech-blog skill for Codex and Claude Code.
// Usage: npm run skill:install  (or: node scripts/install-skill.mjs)
import { cpSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "skills", "tech-blog");

const codexHome = process.env.CODEX_HOME || join(homedir(), ".codex");
const targets = [
  { name: "Codex", dir: join(codexHome, "skills", "tech-blog") },
  { name: "Claude Code (project)", dir: join(root, ".claude", "skills", "tech-blog") },
];

for (const target of targets) {
  mkdirSync(dirname(target.dir), { recursive: true });
  cpSync(source, target.dir, { recursive: true, force: true });
  console.log(`[ok] ${target.name}: ${target.dir}`);
}

console.log("Skill installed. Restart Codex sessions to pick it up.");
