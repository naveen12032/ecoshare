import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
  const cleanLine = line.trim();
  if (cleanLine && !cleanLine.startsWith('#')) {
    const parts = cleanLine.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      env[key] = val;
    }
  }
});

const supabaseUrl = env.SUPABASE_URL;
const supabaseAnonKey = env.SUPABASE_ANON_KEY;

// These are the UIDs from Supabase Auth screenshot
const authUsers = [
  { uid: 'c520962d-bd58-4c8c-8ffa-6b9842b53e7d', email: 'admin@ecocircle.com', displayName: 'Admin' },
  { uid: '8ad38a95-b924-42db-a540-3860330c28ee', email: 'admin2@ecocircle.com', displayName: 'Admin' },
  { uid: 'f0591750-c3b1-4c21-820f-f049d93ef481', email: 'admin3@ecocircle.com', displayName: 'Admin Three' },
  // ashrithap2200 already exists in users table
];

function checkIsAdmin(email) {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  return normalized === 'admin@gmail.com' || normalized === 'admin@ecocircle.com' || normalized === 'ashrithap2200.sse@saveetha.com';
}

async function syncUsers() {
  console.log('Syncing auth users to public users table...');
  
  for (const u of authUsers) {
    const isAdmin = checkIsAdmin(u.email);
    const profile = {
      uid: u.uid,
      email: u.email,
      displayName: u.displayName || 'EcoCircle Member',
      location: 'Community Center',
      role: isAdmin ? 'admin' : 'resident',
      approved: isAdmin ? true : false,
      status: isAdmin ? 'approved' : 'pending',
      savedResources: [],
      activeSessionId: null,
      createdAt: new Date().toISOString()
    };

    const res = await fetch(`${supabaseUrl}/rest/v1/users`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal,resolution=ignore-duplicates'
      },
      body: JSON.stringify(profile)
    });

    if (res.ok || res.status === 201 || res.status === 409) {
      console.log(`✅ Synced: ${u.email} (${isAdmin ? 'admin' : 'resident'})`);
    } else {
      const text = await res.text();
      console.error(`❌ Failed for ${u.email}: HTTP ${res.status} - ${text}`);
    }
  }
  
  // Verify
  const verifyRes = await fetch(`${supabaseUrl}/rest/v1/users?select=email,role,status`, {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`
    }
  });
  const users = await verifyRes.json();
  console.log('\nAll users in public table:');
  users.forEach(u => console.log(`  ${u.email} — ${u.role} (${u.status})`));
}

syncUsers();
