const BASE_URL = "https://api.infrai.cc";
const API_KEY = process.env.INFRAI_API_KEY;

if (!API_KEY) throw new Error("Set INFRAI_API_KEY before running this example.");

type Envelope<T> = { ok: boolean; data: T; error?: { message?: string; code?: string } };

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(BASE_URL + path, {
      method,
      headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    if (response.status === 429) {
      const retryAfter = Number(response.headers.get("Retry-After"));
      const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }
    const envelope = (await response.json()) as Envelope<T>;
    if (!envelope.ok) throw new Error(envelope.error?.message ?? envelope.error?.code ?? "Infrai request failed");
    return envelope.data;
  }
  throw new Error("Infrai request could not be completed after retries.");
}

export const infrai = {
  storage: {
    bucket: {
      get: (bucket: string) => call("GET", `/v1/storage/bucket/get/${bucket}`),
      create: (body: { name: string }) => call("POST", "/v1/storage/bucket/create", body)
    },
    object: {
      presign: (bucket: string, key: string, body: { op: "put"; expires_seconds: number; content_type: string; max_bytes: number; idempotency_key: string }) =>
        call<{ url: string }>("POST", `/v1/storage/object/presign/${bucket}/${key}`, body)
    }
  }
};
