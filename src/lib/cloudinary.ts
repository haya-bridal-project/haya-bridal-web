import "server-only";
import crypto from "node:crypto";
import { env } from "@/lib/env";

/** Cloudinary signature: SHA-1 of sorted params joined with & plus the API secret. */
export function signParams(params: Record<string, string | number>, apiSecret: string) {
  const toSign = Object.keys(params)
    .filter((k) => params[k] !== "" && params[k] != null)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return crypto.createHash("sha1").update(toSign + apiSecret).digest("hex");
}

export const ASSET_ROLES = ["product", "collection", "hero", "banner", "logo"] as const;
export type AssetRole = (typeof ASSET_ROLES)[number];

export function createUploadSignature(role: AssetRole) {
  const cfg = env.cloudinary();
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `${cfg.folder}/${role}`;
  const params = { folder, timestamp };
  return {
    cloudName: cfg.cloudName,
    apiKey: cfg.apiKey,
    timestamp,
    folder,
    signature: signParams(params, cfg.apiSecret),
  };
}

export async function destroyAsset(publicId: string): Promise<{ ok: boolean; result?: string }> {
  const cfg = env.cloudinary();
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signParams({ public_id: publicId, timestamp }, cfg.apiSecret);
  const body = new URLSearchParams({ public_id: publicId, timestamp: String(timestamp), api_key: cfg.apiKey, signature });
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cfg.cloudName}/image/destroy`, { method: "POST", body });
  if (!res.ok) return { ok: false };
  const json = (await res.json()) as { result?: string };
  return { ok: json.result === "ok" || json.result === "not found", result: json.result };
}

export function isOwnCloudinaryUrl(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname === "res.cloudinary.com" && u.pathname.startsWith(`/${env.cloudinary().cloudName}/`);
  } catch {
    return false;
  }
}
