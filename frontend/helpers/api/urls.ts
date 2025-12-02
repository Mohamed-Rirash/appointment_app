const env = (() => {
  if (
    typeof globalThis === "object" &&
    globalThis !== null &&
    "process" in globalThis
  ) {
    const globalWithProcess = globalThis as typeof globalThis & {
      process: { env: Record<string, string | undefined> };
    };
    return globalWithProcess.process.env;
  }
  return {} as Record<string, string | undefined>;
})();

const getRawApiUrl = () => env.NEXT_PUBLIC_API_URL ?? env.API_URL ?? "";

const normalizeBase = (base: string) => base.replace(/\/?$/, "").replace(/\/\//g, "/");

export const getApiBaseUrl = () => normalizeBase(getRawApiUrl());

export const buildApiUrl = (path: string) => {
  const base = getApiBaseUrl();
  if (!base) {
    return path.startsWith("/") ? path : `/${path}`;
  }
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
};
