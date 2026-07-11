/**
 * Script to reset all user passwords to a common password
 * 
 * Usage:
 *   node scripts/reset-all-passwords.js
 *   OR
 *   npm run reset-passwords
 * 
 * Requires:
 *   - VITE_SUPABASE_URL or SUPABASE_URL environment variable
 *   - SUPABASE_SERVICE_ROLE_KEY environment variable (from Supabase Dashboard > Settings > API)
 * 
 * You can set these in a .env file or as environment variables.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Simple .env file parser
function loadEnv() {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const envPath = join(__dirname, '..', '.env');
    const envFile = readFileSync(envPath, 'utf-8');
    const env = {};
    
    envFile.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        }
      }
    });
    
    return env;
  } catch (error) {
    return {};
  }
}

// Load environment variables
const env = loadEnv();
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing required environment variables!');
  console.error('Please set:');
  console.error('  - VITE_SUPABASE_URL or SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nGet your Service Role Key from:');
  console.error('  Supabase Dashboard > Settings > API > service_role key');
  process.exit(1);
}

// Create admin client with service role key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const NEW_PASSWORD = 'Add@123123';

async function resetAllPasswords() {
  try {
    console.log('🔍 Fetching all users...');
    
    // Get all users from auth.users
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      throw listError;
    }
    
    if (!users || users.length === 0) {
      console.log('ℹ️  No users found in the database.');
      return;
    }
    
    console.log(`📋 Found ${users.length} user(s)`);
    console.log('\n🔄 Resetting passwords...\n');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const user of users) {
      try {
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          user.id,
          { password: NEW_PASSWORD }
        );
        
        if (updateError) {
          console.error(`❌ Failed to reset password for ${user.email}: ${updateError.message}`);
          errorCount++;
        } else {
          console.log(`✅ Reset password for: ${user.email}`);
          successCount++;
        }
      } catch (error) {
        console.error(`❌ Error resetting password for ${user.email}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 Summary:');
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📝 New password: ${NEW_PASSWORD}`);
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
resetAllPasswords();

