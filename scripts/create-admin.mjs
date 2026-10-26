/**
 * Haya Bridal — Admin Account Provisioning Script
 * Usage: node --env-file=.env.local scripts/create-admin.mjs <email> <password>
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log("Usage: node --env-file=.env.local scripts/create-admin.mjs <email> <password>");
  console.log("Example: node --env-file=.env.local scripts/create-admin.mjs admin@hayabridal.com SecurePass123!");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log(`\nConnecting to Supabase at: ${url}`);
  console.log(`Provisioning admin user: ${email}...`);

  // 1. Check if user already exists
  const { data: userList, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("Failed to list users:", listError.message);
    process.exit(1);
  }

  let user = userList.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  if (!user) {
    console.log("Creating new authenticated user...");
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Haya Head of Operations" },
    });

    if (createError) {
      console.error("Error creating user:", createError.message);
      process.exit(1);
    }
    user = newUser.user;
    console.log(`Created user with ID: ${user.id}`);
  } else {
    console.log(`User already exists with ID: ${user.id}`);
    // Update password if specified
    await supabase.auth.admin.updateUserById(user.id, { password, email_confirm: true });
    console.log("Updated password & confirmed email.");
  }

  // 2. Grant admin role in public.admin_users
  const { error: adminError } = await supabase.from("admin_users").upsert(
    {
      user_id: user.id,
      role: "owner",
    },
    { onConflict: "user_id" }
  );

  if (adminError) {
    console.error("Error adding to admin_users table:", adminError.message);
    console.log("\nNote: Make sure you have run the database migration first in the Supabase Dashboard SQL Editor!");
    console.log("Migration file: supabase/migrations/20261026000001_haya_schema.sql");
    process.exit(1);
  }

  console.log(`\nSUCCESS: ${email} is now an authorized 'owner' administrator!`);
  console.log("You can now log in at: http://localhost:3000/admin/login\n");
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
