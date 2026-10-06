// Ambient module declarations for virtual runtime modules.
// Astro v6 on Cloudflare exposes worker secrets/bindings via this module;
// it only exists inside the Workers runtime, so TypeScript needs a stub.
declare module "cloudflare:workers" {
  export const env: Record<string, string | undefined>;
}
