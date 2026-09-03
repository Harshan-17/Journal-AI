import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp({ projectId: config.projectId });
async function run() {
  try {
    const user = await getAuth().getUserByEmail('harshan1339a@gmail.com');
    console.log('User found:', user.uid);
  } catch(e) {
    console.error('Error fetching user:', e);
  }
}
run();
