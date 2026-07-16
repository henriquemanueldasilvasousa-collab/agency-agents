export class TestClient {
  private cookies = new Map<string, string>();

  constructor(private readonly baseUrl: string) {}

  private cookieHeader(): string {
    return Array.from(this.cookies.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
  }

  private captureCookies(res: Response) {
    const setCookieHeaders = (res.headers as any as { getSetCookie?: () => string[] }).getSetCookie?.() ?? [];
    for (const header of setCookieHeaders) {
      const [pair] = header.split(";");
      const eqIndex = pair.indexOf("=");
      const name = pair.slice(0, eqIndex).trim();
      const value = pair.slice(eqIndex + 1).trim();
      this.cookies.set(name, value);
    }
  }

  clearCookies() {
    this.cookies.clear();
  }

  async request(
    method: string,
    path: string,
    options: { body?: any; origin?: string | null; headers?: Record<string, string> } = {}
  ): Promise<{ status: number; body: any; res: Response }> {
    const headers: Record<string, string> = { ...(options.headers ?? {}) };
    const cookieHeader = this.cookieHeader();
    if (cookieHeader) headers["Cookie"] = cookieHeader;

    let payload: string | undefined;
    if (options.body !== undefined) {
      headers["Content-Type"] = "application/json";
      payload = JSON.stringify(options.body);
    }

    if (options.origin !== null) {
      headers["Origin"] = options.origin ?? this.baseUrl;
    }

    const res = await fetch(`${this.baseUrl}${path}`, { method, headers, body: payload, redirect: "manual" });
    this.captureCookies(res);

    let body: any = null;
    const text = await res.text();
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    }

    return { status: res.status, body, res };
  }

  get(path: string, options?: { origin?: string | null; headers?: Record<string, string> }) {
    return this.request("GET", path, options);
  }

  post(path: string, body?: any, options?: { origin?: string | null; headers?: Record<string, string> }) {
    return this.request("POST", path, { ...options, body });
  }

  put(path: string, body?: any, options?: { origin?: string | null; headers?: Record<string, string> }) {
    return this.request("PUT", path, { ...options, body });
  }

  delete(path: string, options?: { origin?: string | null; headers?: Record<string, string> }) {
    return this.request("DELETE", path, options);
  }
}
