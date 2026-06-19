import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const clean = line.trim();
  if (clean && !clean.startsWith('#')) {
    const i = clean.indexOf('=');
    if (i > 0) { env[clean.slice(0, i).trim()] = clean.slice(i + 1).trim(); }
  }
});

const supabaseUrl = env.SUPABASE_URL;
const supabaseAnonKey = env.SUPABASE_ANON_KEY;

// Test inserting a resource using the UID of ashrithap2200
const testOwnerId = 'ee89c989-f7f7-4f9c-9acd-d106f04f0d53'; // from the screenshot

async function test() {
  console.log('Testing resource insert with ownerId:', testOwnerId);
  
  const resource = {
    resourceId: Math.floor(Date.now() % 2000000000),
    ownerId: testOwnerId,
    ownerName: 'Ashritha',
    title: 'Test Resource',
    description: 'Test description',
    category: 'Tools',
    quantity: '1',
    imageUrl: '',
    location: 'Saveetha',
    latitude: 13.0827,
    longitude: 80.2707,
    createdAt: new Date().toISOString(),
    status: 'Available'
  };
  
  const res = await fetch(`${supabaseUrl}/rest/v1/resources`, {
    method: 'POST',
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(resource)
  });
  
  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Response:', text);
  
  if (res.ok) {
    console.log('✅ Resource insert WORKS!');
    // Clean up test resource
    const del = await fetch(`${supabaseUrl}/rest/v1/resources?resourceId=eq.${resource.resourceId}`, {
      method: 'DELETE',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    console.log('Cleanup status:', del.status);
  } else {
    console.log('❌ Resource insert FAILED');
  }
}

test().catch(console.error);
