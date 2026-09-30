/** Wrap page data-loading so a down/misconfigured database renders a
 *  clear error card instead of a stack trace. */
export async function safe<T>(fn: () => Promise<T>): Promise<{ data: T | null; down: boolean }> {
  try {
    return { data: await fn(), down: false };
  } catch {
    return { data: null, down: true };
  }
}
