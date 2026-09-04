import fs from 'fs';

let appTsx = fs.readFileSync('src/App.tsx', 'utf8');

// Optimize Discord settings fetch to be concurrent
appTsx = appTsx.replace(
`    let enabledEvents: string[] = [];
    try {
      const settingsSnap = await getDoc(doc(db, 'settings', 'discord'));
      if (settingsSnap.exists()) {
        enabledEvents = settingsSnap.data().enabledEvents || [];
      }
    } catch (err) {
      console.warn('Could not fetch discord settings:', err);
    }

    // Call Backend Gemini Server Proxy (/api/gemini/chat)`,
`    let enabledEvents: string[] = [];
    try {
      // Allow the network request to hit the local cache first or run quickly
      const settingsSnap = await getDoc(doc(db, 'settings', 'discord'));
      if (settingsSnap.exists()) {
        enabledEvents = settingsSnap.data().enabledEvents || [];
      }
    } catch (err) {
      console.warn('Could not fetch discord settings:', err);
    }

    // Call Backend Gemini Server Proxy (/api/gemini/chat)`
);

// Actually, wait, let's just make the Discord settings fetch completely non-blocking by moving it to an effect or just ignoring the await and handling it in the server. 
// But the server expects it in the body.
// Let's just wrap it in a Promise.race to ensure it doesn't block for more than 50ms if it's slow.
appTsx = appTsx.replace(
`    let enabledEvents: string[] = [];
    try {
      const settingsSnap = await getDoc(doc(db, 'settings', 'discord'));
      if (settingsSnap.exists()) {
        enabledEvents = settingsSnap.data().enabledEvents || [];
      }
    } catch (err) {
      console.warn('Could not fetch discord settings:', err);
    }`,
`    let enabledEvents: string[] = [];
    try {
      const snap = await Promise.race([
        getDoc(doc(db, 'settings', 'discord')),
        new Promise((resolve) => setTimeout(() => resolve(null), 100))
      ]);
      if (snap && (snap as any).exists && (snap as any).exists()) {
        enabledEvents = (snap as any).data().enabledEvents || [];
      }
    } catch (err) {
      console.warn('Could not fetch discord settings:', err);
    }`
);

fs.writeFileSync('src/App.tsx', appTsx);
console.log("Patched App.tsx for discord fetch latency");
