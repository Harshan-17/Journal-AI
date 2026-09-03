import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');

const asyncBlock = `
    // --- ASYNC CLASSIFICATION & NOTIFICATION ---
    (async () => {
      try {
        const latestUserMessage = messages.slice().reverse().find((m) => m.role === 'user');
        if (!latestUserMessage || !latestUserMessage.content.trim()) return;
        const contentText = latestUserMessage.content;

        // Fetch Discord settings
        if (!global.db) return;
        const settingsDoc = await global.db.collection('settings').doc('discord').get();
        const discordSettings = settingsDoc.exists ? settingsDoc.data() : { enabledEvents: [] };
        const enabledEvents = Array.isArray(discordSettings?.enabledEvents) ? discordSettings.enabledEvents : [];
        
        if (enabledEvents.length === 0) return;

        // Classify using Gemini
        const prompt = \`Analyze the following journal entry and determine if it represents one of the following event types: \${enabledEvents.join(', ')}.
Respond with a JSON object containing a single key "eventType" whose value is the matched event type exactly as written above, or "none" if it does not clearly match any.

Journal Entry:
"""\${contentText.slice(0, 3000)}"""\`;

        const classificationResponse = await generateContentWithFallback({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          systemInstruction: 'You are a precise classifier. Always return valid JSON.',
          temperature: 0.1,
          responseMimeType: 'application/json'
        });

        const classificationText = classificationResponse.text || "{}";
        let matchedEvent = "none";
        try {
          const parsed = JSON.parse(classificationText);
          if (parsed && typeof parsed.eventType === "string") {
            matchedEvent = parsed.eventType.trim().toLowerCase();
          }
        } catch (e) {
          console.error('[DEBUG] Failed to parse JSON from Gemini:', e);
        }

        console.log(\`[DEBUG] Chat Classification: Identified Event => "\${matchedEvent}"\`);

        if (enabledEvents.includes(matchedEvent)) {
          const webhookUrl = await getSecret('DISCORD_WEBHOOK_URL');
          if (!webhookUrl) return;

          const sanitizedPayload = {
            content: \`Journal Gem ✦\\nNew \${matchedEvent} detected.\\n\\nType: \${matchedEvent}\\nDate: \${new Date().toLocaleDateString()}\`
          };

          const res = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sanitizedPayload),
          });

          if (!res.ok) {
            console.error(\`Discord Webhook failed with status \${res.status}\`);
          } else {
            console.log(\`Notification sent successfully for event: \${matchedEvent}\`);
          }
        }
      } catch (err) {
        console.error('Failed to dispatch external notification from chat:', err);
      }
    })();
    // --- END ASYNC CLASSIFICATION ---
`;

code = code.replace(
  '    res.json({\n      reply: text,\n      modelUsed,\n      timestamp: new Date().toISOString(),\n    });',
  asyncBlock + '\n    res.json({\n      reply: text,\n      modelUsed,\n      timestamp: new Date().toISOString(),\n    });'
);

fs.writeFileSync('server.ts', code);
