export async function apiGet<T>(path: string, params?: Record<string, string | undefined>): Promise<T> {
  const query = params
    ? "?" +
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v as string)}`)
        .join("&")
    : "";
  const res = await fetch(`/campaign-dashboard0-v2-4/api${path}${query}`);
  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status}`);
  }
  return res.json();
}

export async function apiPost<T, B>(path: string, body: B): Promise<T> {
  const res = await fetch(`/campaign-dashboard0-v2-4/api${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status}`);
  }
  return res.json();
}
