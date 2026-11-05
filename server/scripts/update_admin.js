/**
 * BEAR Admin Management CLI Tool
 * Safely updates admin password, email, and role in Supabase.
 *
 * Usage:
 *   node scripts/update_admin.mjs <email> <newPassword> [role]
 *
 * Example:
 *   node scripts/update_admin.mjs admin@bear.in "MyNewSecurePassword2026!" super_admin
 */

import { supabaseAdmin } from '../src/config/supabase.js';

const email = process.argv[2]?.trim().toLowerCase();
const newPassword = process.argv[3];
const newRole = process.argv[4]?.trim().toLowerCase();

if (!email || !newPassword) {
  console.log(`
Usage:
  node scripts/update_admin.mjs <email> <newPassword> [role]

Parameters:
  <email>        The existing admin email (e.g. admin@bear.in)
  <newPassword>  The new password to set (minimum 6 characters)
  [role]         Optional: 'admin' or 'super_admin' (default: keeps existing)

Example:
  node scripts/update_admin.mjs admin@bear.in "MyNewPass2026!" super_admin
`);
  process.exit(1);
}

if (newPassword.length < 6) {
  console.error('Error: Password must be at least 6 characters long.');
  process.exit(1);
}

async function main() {
  console.log(`Looking up admin account for: ${email}...`);

  // 1. Find user by email
  const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (listError) {
    console.error('Failed to list users from Supabase:', listError.message);
    process.exit(1);
  }

  const targetUser = users.find((u) => u.email?.toLowerCase() === email);

  if (!targetUser) {
    console.error(`Error: No user found with email "${email}".`);
    console.log('Available registered user emails:');
    users.slice(0, 10).forEach((u) => console.log(` - ${u.email} (ID: ${u.id})`));
    process.exit(1);
  }

  // 2. Update password
  const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    targetUser.id,
    { password: newPassword }
  );

  if (updateError) {
    console.error('Failed to update password:', updateError.message);
    process.exit(1);
  }

  console.log(`✓ Password updated successfully for ${email}!`);

  // 3. Update role in public.profiles if provided
  if (newRole) {
    if (!['admin', 'super_admin', 'customer'].includes(newRole)) {
      console.error(`Invalid role "${newRole}". Must be 'admin' or 'super_admin'.`);
      process.exit(1);
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ role: newRole })
      .eq('id', targetUser.id);

    if (profileError) {
      console.error('Failed to update role in profiles:', profileError.message);
      process.exit(1);
    }

    console.log(`✓ Role updated to "${newRole}" in public.profiles.`);
  }

  console.log('\nYou can now log in at http://localhost:5174 with your updated credentials.');
}

main().catch((err) => {
  console.error('Unexpected error:', err.message);
  process.exit(1);
});

