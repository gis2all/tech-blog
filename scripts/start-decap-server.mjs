import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import cors from "cors";
import decapServer from "decap-server/dist/middlewares.js";
import express from "express";

const port = Number(process.env.PORT || "4322");
const host = process.env.BIND_HOST || "127.0.0.1";
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const app = express();

// Root health endpoint so Playwright's webServer readiness check (which
// requires a 2xx response) can reuse an already-running local backend.
app.get("/", (_request, response) => {
  response.json({ ok: true, service: "decap-cms-local-backend" });
});

// CORS must be applied before our short-circuit route (and before Decap's own
// middleware) so responses we return early also carry the allowed origin.
app.use(
  cors({ origin: process.env.ORIGIN || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/ }),
);
app.use(express.json());

// Decap's local backend throws (HTTP 500) when a requested media folder/file
// does not exist yet. The editor requests the collection media folder on open,
// so opening a post that has no uploaded media crashes the editor with
// "加载内容失败: Unknown error". Short-circuit those calls instead:
//   - getMedia: an absent folder is treated as an empty media library.
//   - getMediaFile: an absent file is reported as not found, not as a server error.
app.post("/api/v1", (request, response, next) => {
  const { action, params = {} } = request.body ?? {};

  if (action === "getMedia" && typeof params.mediaFolder === "string") {
    if (!existsSync(path.resolve(repoRoot, params.mediaFolder))) {
      return response.json([]);
    }
  }

  if (action === "getMediaFile" && typeof params.path === "string") {
    if (!existsSync(path.resolve(repoRoot, params.path))) {
      return response.status(404).json({ error: "Media file not found" });
    }
  }

  next();
});

await decapServer.registerLocalFs(app, {
  logLevel: process.env.LOG_LEVEL || "info",
});

app.listen(port, host, () => {
  console.log(`Decap CMS Proxy Server listening on ${host}:${port}`);
});
