import fs from 'fs';

let code = fs.readFileSync('functions/src/index.ts', 'utf8');

const regex = /const snapshot = event\.data;[\s\S]*?console\.log\(`\[DEBUG\] notifyOnJournalEntry triggered for entry: \${entryId}`\);/;

const newSnapshotLogic = `    // Handle both creation and updates
    const snapshot = event.data?.after;
    if (!snapshot || !snapshot.exists) return; // Ignore deletions
    
    const data = snapshot.data();
    const entryId = event.params.entryId;

    // To avoid spam, only process if a NEW user message was added
    const beforeData = event.data?.before?.data();
    const beforeMessages = Array.isArray(beforeData?.messages) ? beforeData.messages : [];
    const afterMessages = Array.isArray(data?.messages) ? data.messages : [];
    
    // Only proceed if a message was added
    if (afterMessages.length <= beforeMessages.length) {
      return;
    }
    
    // Only process if the newly added message is from the user (not the AI assistant)
    const latestMessage = afterMessages[afterMessages.length - 1];
    if (latestMessage.role !== 'user') {
      return;
    }
    
    console.log(\`[DEBUG] notifyOnJournalEntry triggered for entry: \${entryId}, new user message detected.\`);`;

code = code.replace(regex, newSnapshotLogic);

fs.writeFileSync('functions/src/index.ts', code);
