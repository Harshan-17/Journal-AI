import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp({ projectId: config.projectId });
const db = getFirestore(app, config.firestoreDatabaseId);
async function run() {
  const users = await db.collection('users').get();
  console.log('Firestore users count:', users.size);
  const authUsers = await getAuth().listUsers();
  console.log('Auth users count:', authUsers.users.length);
}
run().catch(console.error);
