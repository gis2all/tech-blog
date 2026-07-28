import type { FetchLike } from "./model.js";

const PROFILE_URL = "https://blog.csdn.net/DynastyRumble";
const MAX_ATTEMPTS = 3;
const MAX_HTML_REDIRECTS = 5;
const MANUAL_REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const DEFAULT_HEADERS = {
  accept: "text/html,application/xhtml+xml,image/avif,image/webp,*/*",
  "accept-language": "zh-CN,zh;q=0.9,en;q=0.6",
  referer: PROFILE_URL,
  "user-agent": "Mozilla/5.0 CSDN content migration for article owner",
};

export interface PublicFetchOptions {
  fetchImpl?: FetchLike;
  wait?: (milliseconds: number) => Promise<void>;
  timeoutMs?: number;
}

function requestHeaders(init: RequestInit | undefined): Headers {
  const headers = new Headers(DEFAULT_HEADERS);
  new Headers(init?.headers).forEach((value, name) => headers.set(name, value));
  return headers;
}

function requestSignal(signal: AbortSignal | null | undefined, timeoutMs: number): AbortSignal {
  const timeout = AbortSignal.timeout(timeoutMs);
  return signal ? AbortSignal.any([signal, timeout]) : timeout;
}

function retryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

export function createPublicFetch(options: PublicFetchOptions = {}): FetchLike {
  const fetchImpl = options.fetchImpl ?? fetch;
  const wait = options.wait ?? ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)));
  const timeoutMs = options.timeoutMs ?? 20_000;

  return async (input, init) => {
    let lastError: unknown;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      try {
        const response = await fetchImpl(input, {
          ...init,
          headers: requestHeaders(init),
          signal: requestSignal(init?.signal, timeoutMs),
        });
        const manualRedirect = init?.redirect === "manual"
          && MANUAL_REDIRECT_STATUSES.has(response.status);
        if (response.ok || manualRedirect || !retryableStatus(response.status)) return response;
        if (attempt === MAX_ATTEMPTS - 1) return response;
        await response.body?.cancel().catch(() => undefined);
      } catch (error) {
        lastError = error;
        if (attempt === MAX_ATTEMPTS - 1) throw error;
      }
      await wait(500 * 2 ** attempt);
    }
    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  };
}

function approvedCsdnHtmlUrl(value: string | URL): URL {
  const url = value instanceof URL ? new URL(value) : new URL(value);
  if (
    url.protocol !== "https:"
    || url.hostname.toLowerCase() !== "blog.csdn.net"
    || url.port
    || url.username
    || url.password
  ) {
    throw new Error(`Unapproved CSDN HTML URL: ${url}`);
  }
  return url;
}

export async function fetchCsdnHtml(fetchImpl: FetchLike, input: string | URL): Promise<Response> {
  let url = approvedCsdnHtmlUrl(input);
  for (let redirects = 0; redirects <= MAX_HTML_REDIRECTS; redirects += 1) {
    const response = await fetchImpl(url, { redirect: "manual" });
    if (!MANUAL_REDIRECT_STATUSES.has(response.status)) return response;
    await response.body?.cancel().catch(() => undefined);
    if (redirects === MAX_HTML_REDIRECTS) {
      throw new Error(`CSDN HTML redirect limit exceeded: ${input}`);
    }
    const location = response.headers.get("location");
    if (!location) throw new Error(`CSDN HTML redirect is missing Location: ${url}`);
    url = approvedCsdnHtmlUrl(new URL(location, url));
  }
  throw new Error(`CSDN HTML redirect limit exceeded: ${input}`);
}

export const publicFetch = createPublicFetch();
