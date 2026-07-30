/**
 * fetch() has no built-in timeout — a slow or dropped connection hangs the
 * awaiting caller forever with no error, which looks exactly like a frozen
 * app (the same failure mode that made web preview hang on SQLite init).
 * Every network call in this app that isn't behind the Firebase SDK's own
 * retry/timeout layer should go through this instead of raw fetch().
 */
export async function fetchWithTimeout(url: string, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("The request timed out. Check your connection and try again.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
