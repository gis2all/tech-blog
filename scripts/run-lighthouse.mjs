import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import * as chromeLauncher from "chrome-launcher";
import lighthouse from "lighthouse";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseUrl = "http://127.0.0.1:4321";
const budgets = JSON.parse(
  await readFile(path.join(root, "lighthouse-budgets.json"), "utf8"),
);

async function waitForServer(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const html = await response.text();
      if (!html.includes("/_astro/")) {
        throw new Error(
          `Port 4321 is occupied by a non-preview server (no /_astro/ assets). ` +
            `Stop the dev/preview server before running npm run perf.`,
        );
      }
      return;
    } catch (error) {
      if (error instanceof Error && error.message.includes("non-preview")) {
        throw error;
      }
      // server not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Preview server did not become ready at ${url}`);
}

async function startPreviewServer() {
  try {
    const probe = await fetch(baseUrl);
    if (probe.ok) return null;
  } catch {
    // start a fresh preview server
  }
  const child = spawn(
    process.execPath,
    [
      "node_modules/astro/bin/astro.mjs",
      "preview",
      "--host",
      "127.0.0.1",
      "--port",
      "4321",
    ],
    {
      cwd: root,
      stdio: "ignore",
      windowsHide: true,
    },
  );
  await waitForServer(baseUrl, 60000);
  return child;
}

async function firstArticleUrl() {
  const response = await fetch(baseUrl);
  const html = await response.text();
  const match = html.match(/href="(\/posts\/[^"]+)"/);
  if (!match) throw new Error("Could not find an article link on the homepage");
  return match[1];
}

function resolveChromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  return chromium.executablePath();
}

function metricSeconds(audit) {
  return Math.round((audit?.numericValue ?? 0) / 1000) / 1000;
}

function metricMs(audit) {
  return Math.round(audit?.numericValue ?? 0);
}

function byteWeightKb(audit) {
  return Math.round((audit?.numericValue ?? 0) / 1024);
}

function topResources(report, limit = 8) {
  const items = report.audits["network-requests"]?.details?.items ?? [];
  return items
    .filter((item) => item.resourceType !== "Document" || true)
    .sort((a, b) => (b.transferSize ?? 0) - (a.transferSize ?? 0))
    .slice(0, limit)
    .map(
      (item) =>
        `${Math.round((item.transferSize ?? 0) / 1024)}KB ${item.resourceType} ${item.url}`,
    );
}

async function auditRoute(port, url, label) {
  const config = {
    extends: "lighthouse:default",
    settings: {
      onlyCategories: ["performance"],
      formFactor: "desktop",
      screenEmulation: {
        mobile: false,
        width: 1440,
        height: 900,
        deviceScaleFactor: 1,
        disabled: false,
      },
      throttling: {
        rttMs: 40,
        throughputKbps: 10240,
        cpuSlowdownMultiplier: 1,
      },
      output: "json",
    },
  };
  const result = await lighthouse(url, { port, logLevel: "error" }, config);
  const report = result.lhr;
  const metrics = {
    performanceScore: Math.round((report.categories.performance?.score ?? 0) * 100),
    firstContentfulPaintMs: metricMs(report.audits["first-contentful-paint"]),
    largestContentfulPaintMs: metricMs(report.audits["largest-contentful-paint"]),
    totalBlockingTimeMs: metricMs(report.audits["total-blocking-time"]),
    cumulativeLayoutShift: metricSeconds(report.audits["cumulative-layout-shift"]),
    totalByteWeightKb: byteWeightKb(report.audits["total-byte-weight"]),
  };
  const limits = budgets.routes[label];
  const failures = [];
  const resources = topResources(report);
  for (const [key, limit] of Object.entries(limits)) {
    const actual = metrics[key];
    const lowerIsBetter = key !== "performanceScore";
    const violated = lowerIsBetter ? actual > limit : actual < limit;
    if (violated) {
      failures.push(
        lowerIsBetter
          ? `${key}: ${actual} exceeds budget ${limit}`
          : `${key}: ${actual} below budget ${limit}`,
      );
    }
  }
  console.log(
    `${label.padEnd(8)} score=${metrics.performanceScore} FCP=${metrics.firstContentfulPaintMs}ms ` +
      `LCP=${metrics.largestContentfulPaintMs}ms TBT=${metrics.totalBlockingTimeMs}ms ` +
      `CLS=${metrics.cumulativeLayoutShift} weight=${metrics.totalByteWeightKb}KB`,
  );
  for (const resource of resources) {
    console.log(`    ${resource}`);
  }
  return { metrics, failures };
}

let server = null;
let chrome = null;
try {
  server = await startPreviewServer();
  chrome = await chromeLauncher.launch({
    chromePath: resolveChromePath(),
    chromeFlags: [
      "--headless",
      "--no-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
    ],
  });

  const articleUrl = await firstArticleUrl();
  const results = [];
  results.push(await auditRoute(chrome.port, `${baseUrl}/`, "/"));
  results.push(await auditRoute(chrome.port, `${baseUrl}${articleUrl}`, "article"));

  const failures = results.flatMap((result) => result.failures);
  if (failures.length > 0) {
    console.error("Performance budget failures:");
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exitCode = 1;
  } else {
    console.log("All Lighthouse performance budgets passed.");
  }
} finally {
  if (server) {
    try {
      server.kill();
    } catch {
      // server already exited
    }
  }
  if (chrome) {
    try {
      await chrome.kill();
    } catch {
      // Windows may briefly lock the temporary Chrome profile directory.
    }
  }
}
