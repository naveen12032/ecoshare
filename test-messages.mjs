import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const i = line.indexOf('=');
  if (i > 0 && !line.trim().startsWith('#')) {
    env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
});

const BASE = env.SUPABASE_URL;
const KEY  = env.SUPABASE_ANON_KEY;
const headers = { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' };

async function get(path) {
  const r = await fetch(`${BASE}/rest/v1/${path}`, { headers });
  return { status: r.status, body: await r.json() };
}

async function post(path, data) {
  const r = await fetch(`${BASE}/rest/v1/${path}`, { method: 'POST', headers, body: JSON.stringify(data) });
  const text = await r.text();
  return { status: r.status, body: text };
}

async function run() {
  const userId = 'ee89c989-f7f7-4f9c-9acd-d106f04f0d53'; // Ashritha

  console.log('=== Testing messages table ===');

  // 1. List existing chats
  const chats = await get('chats?select=chatId,participants&limit=3');
  console.log('Chats (status', chats.status, '):', JSON.stringify(chats.body).slice(0, 500));

  if (chats.body && chats.body.length > 0) {
    const chatId = chats.body[0].chatId;
    console.log('\nTrying message insert into chatId:', chatId);

    const msg = {
      chatId,
      senderId: userId,
      senderName: 'Ashritha',
      content: 'test message',
      createdAt: new Date().toISOString()
    };

    const result = await post('messages', msg);
    console.log('Message insert status:', result.status);
    console.log('Response:', result.body.slice(0, 500));

    if (result.status === 201) console.log('✅ Message insert WORKS!');
    else console.log('❌ Message insert FAILED');
  } else {
    console.log('\nNo chats found. Testing direct message insert with fake chatId...');
    const msg = {
      chatId: 'test_chat_' + Date.now(),
      senderId: userId,
      senderName: 'Ashritha',
      content: 'test message',
      createdAt: new Date().toISOString()
    };
    const result = await post('messages', msg);
    console.log('Message insert status:', result.status);
    console.log('Response:', result.body.slice(0, 500));
  }

  // 2. Check if messages table exists at all
  const msgs = await get('messages?limit=1');
  console.log('\nMessages table select status:', msgs.status, JSON.stringify(msgs.body).slice(0, 300));
}

run().catch(console.error);
