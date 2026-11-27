let _env: Record<string, string | undefined> = {};

export function setRequestEnv(env: Record<string, string | undefined>): void {
  _env = env;
}

export function env(key: string): string | undefined {
  return _env[key] ?? (typeof process !== "undefined" ? process.env?.[key] : undefined);
}
