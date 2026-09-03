import { onDocumentWritten } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import { defineSecret } from "firebase-functions/params";
import { GoogleGenAI } from "@google/genai";
// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();
// Define secrets (managed via Google Cloud Secret Manager)
const discordWebhookUrl = defineSecret("DISCORD_WEBHOOK_URL");
const geminiApiKey = defineSecret("GEMINI_API_KEY");
/**
 * Cloud Function: notifyOnJournalEntry
 * Triggers asynchronously when a new journal entry is created in Firestore.
 * Analyzes the entry via Gemini and sends a Discord notification if it matches enabled events.
 *
 * Resilience: Runs asynchronously and decoupled. Failures here (e.g. Discord outage)
 * will not affect the primary client-side or backend save operation.
 */
export const notifyOnJournalEntry = onDocumentWritten({
    document: "users/{userId}/entries/{entryId}",
    secrets: [discordWebhookUrl, geminiApiKey],
    region: "us-central1"
}, async (event) => {
    var _a, _b, _c;
    // Handle both creation and updates
    const snapshot = (_a = event.data) === null || _a === void 0 ? void 0 : _a.after;
    if (!snapshot || !snapshot.exists)
        return; // Ignore deletions
    const data = snapshot.data();
    const entryId = event.params.entryId;
    // To avoid spam, only process if a NEW user message was added
    const beforeData = (_c = (_b = event.data) === null || _b === void 0 ? void 0 : _b.before) === null || _c === void 0 ? void 0 : _c.data();
    const beforeMessages = Array.isArray(beforeData === null || beforeData === void 0 ? void 0 : beforeData.messages) ? beforeData.messages : [];
    const afterMessages = Array.isArray(data === null || data === void 0 ? void 0 : data.messages) ? data.messages : [];
    // Only proceed if a message was added
    if (afterMessages.length <= beforeMessages.length) {
        return;
    }
    // Only process if the newly added message is from the user (not the AI assistant)
    const latestMessage = afterMessages[afterMessages.length - 1];
    if (latestMessage.role !== 'user') {
        return;
    }
    console.log(`[DEBUG] notifyOnJournalEntry triggered for entry: ${entryId}, new user message detected.`);
    try {
        // Securely access the webhook URL from Secret Manager
        const webhookUrl = discordWebhookUrl.value();
        if (!webhookUrl) {
            console.warn("DISCORD_WEBHOOK_URL is not set or accessible.");
            return;
        }
        // Fetch Discord settings to check which events are enabled
        const settingsDoc = await db.collection("settings").doc("discord").get();
        const discordSettings = settingsDoc.exists ? settingsDoc.data() : { enabledEvents: [] };
        const enabledEvents = Array.isArray(discordSettings === null || discordSettings === void 0 ? void 0 : discordSettings.enabledEvents)
            ? discordSettings.enabledEvents
            : []; // Admin can configure this list ('milestone', 'achievement', 'reminder')
        if (enabledEvents.length === 0)
            return;
        // Extract text content from the LATEST user message
        const contentText = latestMessage.content || "";
        if (!contentText.trim()) {
            console.log(`[DEBUG] Entry ${entryId} has no extractable content. Exiting.`);
            return;
        }
        console.log(`[DEBUG] Extracted content length: ${contentText.length}. Requesting Gemini classification...`);
        console.log(`[DEBUG] Target event types enabled: ${enabledEvents.join(', ')}`);
        console.log(`[DEBUG] Journal text sent to Gemini (truncated to 150 chars): "${contentText.slice(0, 150)}..."`);
        // Initialize Gemini Client with Secret
        const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });
        const prompt = `Analyze the following journal entry and determine if it represents one of the following event types: ${enabledEvents.join(', ')}.
Respond with a JSON object containing a single key "eventType" whose value is the matched event type exactly as written above, or "none" if it does not clearly match any.

Journal Entry:
"""
${contentText.slice(0, 3000)}
"""`;
        // Classify the entry using Gemini Flash
        const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: prompt,
            config: {
                systemInstruction: 'You are a precise classifier. Always return valid JSON.',
                temperature: 0.1,
                responseMimeType: "application/json"
            }
        });
        const classificationText = response.text || "{}";
        let matchedEvent = "none";
        try {
            const parsed = JSON.parse(classificationText);
            if (parsed && typeof parsed.eventType === "string") {
                matchedEvent = parsed.eventType.trim().toLowerCase();
            }
        }
        catch (parseErr) {
            console.error(`[DEBUG] Failed to parse JSON from Gemini: ${classificationText}`, parseErr);
        }
        console.log(`[DEBUG] Gemini classification for entry ${entryId}: Identified Event => "${matchedEvent}"`);
        // Trigger notification if the classification matched an enabled event
        if (enabledEvents.includes(matchedEvent)) {
            console.log(`[DEBUG] Event "${matchedEvent}" is enabled. Dispatching to Discord webhook...`);
            // Sanitize the payload: metadata only, never send the private journal text
            const sanitizedPayload = {
                content: `Journal Gem ✦\nNew ${matchedEvent} detected.\n\nType: ${matchedEvent}\nDate: ${new Date().toLocaleDateString()}`
            };
            const res = await fetch(webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(sanitizedPayload),
            });
            if (!res.ok) {
                throw new Error(`Discord Webhook failed with status ${res.status}`);
            }
            console.log(`Notification sent successfully for entry ${entryId} (Event: ${matchedEvent})`);
        }
    }
    catch (err) {
        // Fail-safe catch ensures downstream API outage never crashes the core process.
        // This function executes entirely in the background, decoupled from the save flow.
        console.error("Failed to dispatch external notification:", err);
    }
});
//# sourceMappingURL=index.js.map