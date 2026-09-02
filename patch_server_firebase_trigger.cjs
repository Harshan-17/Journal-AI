const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetStr = `app.listen(PORT, "0.0.0.0", () => {
    console.log(\`Server running on http://localhost:\${PORT}\`);
  });`;

const replaceStr = `  // ==========================================
  // Firebase-Triggered Webhook Service
  // ==========================================
  // In a standard Cloud Run deployment, this would often be handled via Eventarc pushing to an HTTP endpoint.
  // For this environment, we implement a secure server-side listener using the Firebase Admin SDK
  // to natively trigger when a new document is written to the database.
  try {
    let isInitialLoad = true;
    getFirestore().collectionGroup('entries').onSnapshot((snapshot) => {
      if (isInitialLoad) {
        isInitialLoad = false;
        return;
      }
      
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const docData = change.doc.data();
          const entryId = change.doc.id;
          const title = typeof docData.title === 'string' ? docData.title : 'Untitled Entry';
          const mode = typeof docData.mode === 'string' ? docData.mode : 'reflect';
          
          try {
            // Securely fetch webhook URL from Secret Manager (Zero Hardcoding)
            const webhookUrl = await getSecret('DISCORD_WEBHOOK_URL');
            
            if (!webhookUrl) {
              console.warn('Firebase Trigger skipped: DISCORD_WEBHOOK_URL secret not found or accessible.');
              return;
            }

            // Payload Sanitization & Privacy (Obfuscate PII and sensitive content)
            const sanitizedPayload = {
              content: \`📝 **[Firebase Trigger] New Journal Entry Created**\\n**Mode**: \${mode}\\n**Title**: \${title.slice(0, 100)}\\n*(Content obfuscated for privacy)*\`
            };

            // Execute webhook POST
            const response = await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(sanitizedPayload),
            });

            if (!response.ok) {
              throw new Error(\`Webhook failed with status \${response.status}\`);
            }
            
            console.log(\`Firebase Trigger: Notification sent successfully for entry \${entryId}\`);
          } catch (err) {
            // Fail-safe catch ensures downstream API outage never crashes the core process
            console.error('Firebase Trigger failed to dispatch external notification:', err);
          }
        }
      });
    }, (error) => {
      console.error('Firebase Trigger listener error:', error);
    });
    console.log('[Firebase Trigger] Active and listening for new journal entries.');
  } catch (err) {
    console.error('[Firebase Trigger] Failed to initialize listener:', err);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(\`Server running on http://localhost:\${PORT}\`);
  });`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('server.ts', code);
console.log('patched server with trigger');
