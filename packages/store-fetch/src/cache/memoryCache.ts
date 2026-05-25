export class MemoryCache<T> {
  private values = new Map<string, { value: T; expiresAt: number }>();

  get(key: string): T | undefined {
    const entry = this.values.get(key);
    if (!entry || entry.expiresAt < Date.now()) return undefined;
    return entry.value;
  }

  set(key: string, value: T, ttlMs = 1000 * 60 * 60): void {
    this.values.set(key, { value, expiresAt: Date.now() + ttlMs });
  }
}
