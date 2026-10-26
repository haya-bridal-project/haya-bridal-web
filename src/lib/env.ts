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
      senderName: read("BREVO_SENDER_NAME") ?? "Haya Premium Bridal Rental",
    };
  },
  razorpay() {
    const v = requireAll(["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"]);
    return { keyId: v.RAZORPAY_KEY_ID, keySecret: v.RAZORPAY_KEY_SECRET };
  },
  razorpayWebhookSecret() {
    return requireAll(["RAZORPAY_WEBHOOK_SECRET"]).RAZORPAY_WEBHOOK_SECRET;
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
  razorpay: () => !!read("RAZORPAY_KEY_ID") && !!read("RAZORPAY_KEY_SECRET") && !!read("SUPABASE_SERVICE_ROLE_KEY"),
  razorpayWebhook: () => !!read("RAZORPAY_WEBHOOK_SECRET"),
};

export function integrationStatus() {
  return {
    supabase: isConfigured.supabase(),
    serviceRole: isConfigured.serviceRole(),
    cloudinary: isConfigured.cloudinary(),
    brevo: isConfigured.brevo(),
    razorpay: isConfigured.razorpay(),
    razorpayWebhook: isConfigured.razorpayWebhook(),
  };
}
