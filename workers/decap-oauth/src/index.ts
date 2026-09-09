// Adapted from sterlingwes/decap-proxy
// (https://github.com/sterlingwes/decap-proxy).
//
// Decap CMS GitHub OAuth proxy for the self-hosted admin backend.
// Endpoints:
//   GET /auth     -> redirect to github.com/login/oauth/authorize
//   GET /callback -> exchange code, verify the user, post token back to opener
//   anything else -> "Hello 👋" (deployment health check)
//
// Security notes:
//   - Only the configured GitHub user (GITHUB_ALLOWED_USER, default "gis2all")
//     is allowed to sign in. The callback exchanges the code, fetches the
//     authenticated user, and rejects anyone else.
//   - By default the access token is posted to window.opener with targetOrigin
//     "*" so localhost and preview deployments can log in too. Set
//     DECAP_ALLOWED_ORIGINS (comma-separated) once you know the exact admin
//     origin(s) to narrow it; preview deployments must be listed there.

import { OAuthClient } from "./oauth";

interface Env {
  GITHUB_OAUTH_ID: string;
  GITHUB_OAUTH_SECRET: string;
  GITHUB_REPO_PRIVATE?: string;
  GITHUB_ALLOWED_USER?: string;
  DECAP_ALLOWED_ORIGINS?: string;
}

function randomHex(bytes: number): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const createOAuth = (env: Env) => {
  return new OAuthClient({
    id: env.GITHUB_OAUTH_ID,
    secret: env.GITHUB_OAUTH_SECRET,
    target: {
      tokenHost: "https://github.com",
      tokenPath: "/login/oauth/access_token",
      authorizePath: "/login/oauth/authorize",
    },
  });
};

const allowedOrigins = (env: Env): string[] => {
  const raw = env.DECAP_ALLOWED_ORIGINS?.trim();
  if (!raw) return ["*"];
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const postTarget = (env: Env): string => {
  const origins = allowedOrigins(env);
  return origins.includes("*") ? "*" : (origins[0] ?? "*");
};

const handleAuth = async (url: URL, env: Env) => {
  const provider = url.searchParams.get("provider");
  if (provider !== "github") {
    return new Response("Invalid provider", { status: 400 });
  }

  const repoIsPrivate =
    env.GITHUB_REPO_PRIVATE !== undefined && env.GITHUB_REPO_PRIVATE !== "0";
  const repoScope = repoIsPrivate ? "repo,user" : "public_repo,user";

  const oauth2 = createOAuth(env);
  const authorizationUri = oauth2.authorizeURL({
    redirect_uri: `https://${url.hostname}/callback?provider=github`,
    scope: repoScope,
    state: randomHex(4), // 4 bytes -> 8 hex chars
  });

  return new Response(null, { headers: { location: authorizationUri }, status: 301 });
};

const callbackScriptResponse = (status: string, payload: unknown, env: Env) => {
  const target = postTarget(env);
  return new Response(
    `
<html>
<head>
  <meta charset="utf-8" />
  <script>
    const target = ${JSON.stringify(target)};
    const receiveMessage = (message) => {
      window.opener.postMessage(
        'authorization:github:${status}:${JSON.stringify(payload)}',
        target
      );
      window.removeEventListener("message", receiveMessage, false);
    }
    window.addEventListener("message", receiveMessage, false);
    window.opener.postMessage("authorizing:github", target);
  </script>
  <body>
    <p>Authorizing Decap...</p>
  </body>
</head>
</html>
`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
};

const handleCallback = async (url: URL, env: Env) => {
  const provider = url.searchParams.get("provider");
  if (provider !== "github") {
    return new Response("Invalid provider", { status: 400 });
  }

  const code = url.searchParams.get("code");
  if (!code) {
    return new Response("Missing code", { status: 400 });
  }

  const oauth2 = createOAuth(env);
  const accessToken = await oauth2.getToken({
    code,
    redirect_uri: `https://${url.hostname}/callback?provider=github`,
  });

  const allowedUser = env.GITHUB_ALLOWED_USER ?? "gis2all";
  const userResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "User-Agent": "decap-oauth",
    },
  });

  if (!userResponse.ok) {
    return callbackScriptResponse(
      "error",
      { error: "无法验证 GitHub 账号，请重试" },
      env,
    );
  }

  const user = (await userResponse.json()) as { login?: string };
  if (user.login?.toLowerCase() !== allowedUser.toLowerCase()) {
    return callbackScriptResponse(
      "error",
      { error: `此账号（${user.login ?? "未知"}）无权登录后台，仅允许 ${allowedUser}` },
      env,
    );
  }

  return callbackScriptResponse("success", { token: accessToken }, env);
};

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/auth") {
      return handleAuth(url, env);
    }
    if (url.pathname === "/callback") {
      return handleCallback(url, env);
    }
    return new Response("Hello 👋");
  },
};
