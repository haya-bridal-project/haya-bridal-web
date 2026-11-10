import "server-only";

/**
 * Server-side configuration access. Values are read at point of use so the
 * app can run (with clearly disabled features) when an integration is not yet
 * configured. Secrets never leave this module.
 */

function read(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim().length > 0 ? v.trim() : undefined;
}

export class ConfigError extends Error {
  constructor(public readonly missing: string[]) {
    super(`Missing configuration: ${missing.join(", ")}`);
    this.name = "ConfigError";
  }
}

function requireAll(names: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  const missing: string[] = [];
  for (const n of names) {
    const v = read(n);
    if (!v) missing.push(n);
    else out[n] = v;
  }
  if (missing.length) {
    if (process.env.NODE_ENV !== "production") {
      console.error(`[config] ${missing.join(", ")} not set`);
    }
    throw new ConfigError(missing);
  }
  return out;
}

export const env = {
  supabase() {
    const v = requireAll(["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"]);
    return { url: v.NEXT_PUBLIC_SUPABASE_URL, key: v.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY };
  },
  serviceRoleKey() {
    return requireAll(["SUPABASE_SERVICE_ROLE_KEY"]).SUPABASE_SERVICE_ROLE_KEY;
  },
  cloudinary() {
    const v = requireAll(["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"]);
    return {
      cloudName: v.CLOUDINARY_CLOUD_NAME,
      apiKey: v.CLOUDINARY_API_KEY,
      apiSecret: v.CLOUDINARY_API_SECRET,
      folder: read("CLOUDINARY_UPLOAD_FOLDER") ?? "haya",
    };
  },
  brevo() {
    const v = requireAll(["BREVO_API_KEY", "BREVO_SENDER_EMAIL"]);
    return {
      apiKey: v.BREVO_API_KEY,
      senderEmail: v.BREVO_SENDER_EMAIL,
      senderName: read("BREVO_SENDER_NAME") ?? "Haya Bridal Couture",
    };
  },
  cashfree() {
    const v = requireAll(["CASHFREE_APP_ID", "CASHFREE_SECRET_KEY"]);
    const rawEnv = read("CASHFREE_ENV")?.toLowerCase();
    const mode: "sandbox" | "production" =
      rawEnv === "production" || (!rawEnv && !v.CASHFREE_APP_ID.startsWith("TEST"))
        ? "production"
        : "sandbox";
    return { appId: v.CASHFREE_APP_ID, secretKey: v.CASHFREE_SECRET_KEY, mode };
  },
  cashfreeWebhookSecret() {
    return read("CASHFREE_WEBHOOK_SECRET") ?? requireAll(["CASHFREE_SECRET_KEY"]).CASHFREE_SECRET_KEY;
  },
  siteUrl() {
    return (read("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000").replace(/\/$/, "");
  },
};

export const isConfigured = {
  supabase: () => !!read("NEXT_PUBLIC_SUPABASE_URL") && !!read("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
  serviceRole: () => !!read("SUPABASE_SERVICE_ROLE_KEY"),
  cloudinary: () => !!read("CLOUDINARY_CLOUD_NAME") && !!read("CLOUDINARY_API_KEY") && !!read("CLOUDINARY_API_SECRET"),
  brevo: () => !!read("BREVO_API_KEY") && !!read("BREVO_SENDER_EMAIL"),
  cashfree: () => !!read("CASHFREE_APP_ID") && !!read("CASHFREE_SECRET_KEY") && !!read("SUPABASE_SERVICE_ROLE_KEY"),
  cashfreeWebhook: () => !!read("CASHFREE_WEBHOOK_SECRET") || !!read("CASHFREE_SECRET_KEY"),
};

export function integrationStatus() {
  return {
    supabase: isConfigured.supabase(),
    serviceRole: isConfigured.serviceRole(),
    cloudinary: isConfigured.cloudinary(),
    brevo: isConfigured.brevo(),
    cashfree: isConfigured.cashfree(),
    cashfreeWebhook: isConfigured.cashfreeWebhook(),
  };
}
