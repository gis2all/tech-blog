import decapServer from "decap-server/dist/middlewares.js";
import express from "express";

const port = Number(process.env.PORT || "4322");
const host = process.env.BIND_HOST || "127.0.0.1";

const app = express();

// Root health endpoint so Playwright's webServer readiness check (which
// requires a 2xx response) can reuse an already-running local backend.
app.get("/", (_request, response) => {
  response.json({ ok: true, service: "decap-cms-local-backend" });
});

await decapServer.registerLocalFs(app, {
  logLevel: process.env.LOG_LEVEL || "info",
});

app.listen(port, host, () => {
  console.log(`Decap CMS Proxy Server listening on ${host}:${port}`);
});
