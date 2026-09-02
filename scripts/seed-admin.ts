/**
 * Seed admin user via Supabase Admin API
 *
 * Usage:
 *   npx tsx scripts/seed-admin.ts
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local (not committed to git).
 * Run once, then change password via login page.
 */

import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"

function loadEnv() {
  try {
    const env = readFileSync(".env.local", "utf-8")
    for (const line of env.split("\n")) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) continue
      const eqIdx = trimmed.indexOf("=")
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      const value = trimmed.slice(eqIdx + 1).trim()
      if (!process.env[key]) process.env[key] = value
    }
  } catch {
    // .env.local not found, rely on existing env
  }
}

loadEnv()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function seedAdmin() {
  const email = "admin@pakaikuota.id"
  const password = "admin123"

  console.log(`Creating admin user: ${email}`)

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error) {
    if (error.message.includes("already exists")) {
      console.log("Admin user already exists. Skipping creation.")
      return
    }
    throw error
  }

  console.log(`Auth user created: ${data.user.id}`)

  const { error: updateError } = await supabase
    .from("users")
    .update({ role: "super_admin" })
    .eq("id", data.user.id)

  if (updateError) {
    console.error("Failed to set role:", updateError.message)
    console.log("You may need to set the role manually in the database.")
  } else {
    console.log("Role set to: super_admin")
  }

  console.log("\nDone! Change the password after first login.")
}

seedAdmin().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})
