export async function readJson<T = any>(response: Response): Promise<T> {
  const text = await response.text();
  const contentType = response.headers.get('content-type') || '';

  if (!text) return {} as T;

  if (!contentType.includes('application/json')) {
    const preview = text.replace(/\s+/g, ' ').trim().slice(0, 180);
    throw new Error(`API ${response.url} returned ${contentType || 'unknown content type'}: ${preview}`);
  }

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    const preview = text.replace(/\s+/g, ' ').trim().slice(0, 180);
    throw new Error(`API ${response.url} returned invalid JSON: ${preview}`);
  }
}

export async function fetchJson<T = any>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  return readJson<T>(await fetch(input, {
    credentials: 'include',
    ...init,
  }));
}
