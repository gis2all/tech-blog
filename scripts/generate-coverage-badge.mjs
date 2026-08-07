import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function getLineCoverage(summary) {
  const percentage = summary?.total?.lines?.pct;

  if (
    typeof percentage !== "number" ||
    !Number.isFinite(percentage) ||
    percentage < 0 ||
    percentage > 100
  ) {
    throw new Error("coverage summary does not contain a valid total.lines.pct value");
  }

  return percentage;
}

export function buildCoverageBadge(percentage) {
  const value = `${percentage}%`;
  const label = `coverage: ${value}`;
  const color = percentage >= 90 ? "#2ea44f" : percentage >= 80 ? "#dfb317" : "#d73a49";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="126" height="20" role="img" aria-label="${label}">
  <title>${label}</title>
  <rect width="70" height="20" fill="#555"/>
  <rect x="70" width="56" height="20" fill="${color}"/>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="35" y="14">coverage</text>
    <text x="98" y="14">${value}</text>
  </g>
</svg>
`;
}

export async function generateCoverageBadge(summaryPath, outputPath) {
  const summary = JSON.parse(await readFile(summaryPath, "utf8"));
  const badge = buildCoverageBadge(getLineCoverage(summary));

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, badge, "utf8");
}

const currentFile = fileURLToPath(import.meta.url);
const entryFile = process.argv[1] ? resolve(process.argv[1]) : "";

if (entryFile === currentFile) {
  const summaryPath = resolve(process.argv[2] ?? "coverage/coverage-summary.json");
  const outputPath = resolve(process.argv[3] ?? "coverage/badge.svg");

  await generateCoverageBadge(summaryPath, outputPath);
}
