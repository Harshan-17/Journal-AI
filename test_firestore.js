import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

async function test() {
  try {
    const configPath = './firebase-applet-config.json';
    const configData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);
    const app = initializeApp({
      projectId: config.projectId,
    });
    const db = getFirestore(app, config.firestoreDatabaseId);
    
    console.log("Fetching settings...");
    await db.collection('settings').doc('discord').get();
    console.log("Successfully fetched from Firestore.");
  } catch (err) {
    console.error("Firestore Error:", err);
  }
}
test();
