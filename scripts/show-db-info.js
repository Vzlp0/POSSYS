/**
 * Script to display database connection information
 * 
 * Usage:
 *   node scripts/show-db-info.js
 */

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

console.log('\n' + '='.repeat(60));
console.log('📊 SUPABASE DATABASE INFORMATION');
console.log('='.repeat(60));

if (supabaseUrl) {
  // Extract project reference from URL
  const urlMatch = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);
  const projectRef = urlMatch ? urlMatch[1] : 'unknown';
  
  console.log('\n✅ Supabase URL found:');
  console.log(`   ${supabaseUrl}`);
  console.log(`\n📝 Project Reference: ${projectRef}`);
  
  console.log('\n🔗 Database Connection Info:');
  console.log(`   Host: db.${projectRef}.supabase.co`);
  console.log(`   Port: 5432`);
  console.log(`   Database: postgres`);
  console.log(`   User: postgres`);
  console.log(`   Password: [Get from Supabase Dashboard > Settings > Database]`);
  
  console.log('\n🌐 Quick Links:');
  console.log(`   Dashboard: https://app.supabase.com/project/${projectRef}`);
  console.log(`   Table Editor: https://app.supabase.com/project/${projectRef}/editor`);
  console.log(`   SQL Editor: https://app.supabase.com/project/${projectRef}/sql`);
  console.log(`   Database Settings: https://app.supabase.com/project/${projectRef}/settings/database`);
  
  console.log('\n💡 To get your database password:');
  console.log('   1. Go to: https://app.supabase.com/project/' + projectRef + '/settings/database');
  console.log('   2. Look for "Database password" section');
  console.log('   3. Click "Reset database password" if needed');
  
} else {
  console.log('\n❌ No Supabase URL found!');
  console.log('\nPlease set VITE_SUPABASE_URL in your .env file:');
  console.log('   VITE_SUPABASE_URL=https://your-project.supabase.co');
  console.log('\nGet your URL from: https://app.supabase.com');
}

console.log('\n' + '='.repeat(60) + '\n');



