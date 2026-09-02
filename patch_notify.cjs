const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const importTarget = `import express, { Request, Response } from 'express';`;
const importReplacement = `import express, { Request, Response } from 'express';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const secretManagerClient = new SecretManagerServiceClient();

async function getSecret(secretName: string): Promise<string | null> {
  try {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || 'your-project-id';
    const name = \`projects/\${projectId}/secrets/\${secretName}/versions/latest\`;
    const [version] = await secretManagerClient.accessSecretVersion({ name });
    const payload = version.payload?.data?.toString();
    return payload || null;
  } catch (error) {
    console.error(\`Error fetching secret \${secretName}:\`, error);
    // Fallback to environment variable if Secret Manager fails (e.g. local dev)
    return process.env[secretName] || null;
  }
}`;

code = code.replace(importTarget, importReplacement);

const endpointCode = `
// External Notification Integration Endpoint
app.post('/api/notify', async (req: Request, res: Response): Promise<void> => {
  // Defensive Payload Ingestion (Null-Safe Destructuring)
  const data = (req.body && typeof req.body === 'object') ? req.body : {};
  const entryId = typeof data.entryId === 'string' ? data.entryId.trim() : 'Unknown';
  const title = typeof data.title === 'string' ? data.title.trim() : 'Untitled Entry';
  const mode = typeof data.mode === 'string' ? data.mode.trim() : 'reflect';

  // Input Validation
  if (!entryId || entryId === 'Unknown') {
    res.status(400).json({ error: 'Valid entryId is required for notification.' });
    return;
  }

  // Acknowledge request immediately to avoid blocking client/save transaction
  res.status(202).json({ message: 'Notification queued for processing.' });

  // Asynchronous Execution: Fire and forget
  (async () => {
    try {
      // Securely fetch webhook URL from Secret Manager (Zero Hardcoding)
      const webhookUrl = await getSecret('DISCORD_WEBHOOK_URL');
      
      if (!webhookUrl) {
        console.warn('Notification skipped: DISCORD_WEBHOOK_URL secret not found or accessible.');
        return;
      }

      // Payload Sanitization & Privacy (Obfuscate PII and sensitive content)
      const sanitizedPayload = {
        content: \`📝 **New Journal Entry Created**\\n**Mode**: \${mode}\\n**Title**: \${title.slice(0, 100)}\\n*(Content obfuscated for privacy)*\`
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
      
      console.log(\`Notification sent successfully for entry \${entryId}\`);
    } catch (err) {
      // Fail-safe catch ensures downstream API outage never crashes the core process
      console.error('Failed to dispatch external notification:', err);
    }
  })();
});
`;

code = code.replace(`app.get('/api/maps/config'`, endpointCode + `\napp.get('/api/maps/config'`);

fs.writeFileSync('server.ts', code);
console.log('patched');
