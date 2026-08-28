# Gemini Reflection Journal

A secure, user-authenticated reflection journal and conversational brainstorming partner powered by **Gemini 3.6 Flash** and **Google Cloud Firestore**.

---

## 🔒 Security Architecture & OWASP Alignment

| Threat Zone | Identified Attack Vector | Countermeasure & Security Invariant |
| :--- | :--- | :--- |
| **1. Input Surfaces** | Prompt injection, parameter tampering, payload overflow | Strict input schema validation, defensive payload sanitization, 2MB body limits, server-level JSON parsing before route execution. |
| **2. Planning & Reasoning** | System instruction bypass, jailbreaks via journal entries | Hardened system instructions treating user journal entries purely as passive reflection context; resilient fallback ladder (`gemini-3.6-flash` &rarr; `gemini-3.1-flash-lite` &rarr; `gemini-flash-latest` &rarr; `gemini-3.7-flash`). |
| **3. Tool Execution & APIs** | Unauthenticated callers triggering expensive endpoints; SSRF | Server-side API endpoints (`/api/gemini/chat`, `/api/gemini/summarize`) with zero client-side API key exposure. |
| **4. Memory & State** | Cross-tenant data leaks, orphaned writes, unauthorized document reads | Hardened Cloud Firestore Security Rules strictly scoped to `match /users/{userId}/entries/{entryId}` with `request.auth.uid == userId`; strict undefined-value stripping on writes. |
| **5. Inter-System Communication** | Plaintext token leakage, accidental API key exposure | Server-only `process.env.GEMINI_API_KEY` configuration via Google Cloud Secret Manager; HTTPS transport; sanitized headers. |

---

## 🗄️ Cloud Firestore Security Rules

Deploy the following owner-isolated rules in `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Top-level user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // User's private journal entries and conversations
      match /entries/{entryId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      // User's interaction logs and reflections
      match /interactions/{interactionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

---

## 🔑 Secret Management Setup (Google Cloud Secret Manager)

To store and access the `GEMINI_API_KEY` securely without hardcoding credentials:

```bash
# 1. Enable Secret Manager API
gcloud services enable secretmanager.googleapis.com

# 2. Create the GEMINI_API_KEY secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"

# 3. Add your Gemini API key payload
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 4. Grant your Cloud Run compute service account access to read the secret
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")

gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 🚀 Google Cloud Run Deployment Flow

### Prerequisites
1. Enable Google Cloud APIs:
```bash
gcloud services enable run.googleapis.com cloudbuild.googleapis.com firestore.googleapis.com secretmanager.googleapis.com
```

2. Deploy the application to Cloud Run:
```bash
gcloud run deploy gemini-reflection-journal \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --port 3000
```

### Mandatory Campaign Verification Label
Attach the campaign verification label to your deployed Cloud Run service:

```bash
gcloud run services update gemini-reflection-journal \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 🧪 Functional Walkthrough & Test Specifications

Every user interaction has a corresponding test specification below:

### Test Suite 1: Authentication & Landing View
- **TC-1.1: Unauthenticated Landing State**
  - *Action*: Navigate to `/` without active session.
  - *Expected Result*: Displays the landing page with "Sign In with Google" button, value proposition, and feature pillars. No private data is loaded.
- **TC-1.2: Security Specifications Modal**
  - *Action*: Click "Security Architecture" in Navbar or Landing page.
  - *Expected Result*: Opens modal displaying deployed Firestore rules, OWASP mitigations, and campaign verification label.
- **TC-1.3: Google Sign-In Flow**
  - *Action*: Click "Sign In with Google" and complete Google account selection.
  - *Expected Result*: Authenticates session, displays user profile in Navbar, loads user's private entries from `/users/{uid}/entries`, and transitions to the Journal Studio.

### Test Suite 2: Multi-Turn Reflection & Gemini Chat
- **TC-2.1: Inspiration Prompt Selection**
  - *Action*: On an empty reflection, click any suggested prompt chip (e.g., "Daily Gratitude & Meaning").
  - *Expected Result*: Prompt text populates the textarea composer.
- **TC-2.2: Send User Reflection Turn**
  - *Action*: Type a reflection and press `Enter` or click the Send button.
  - *Expected Result*: User message renders immediately, status indicates "Syncing to Firestore...", and message is persisted under `/users/{uid}/entries/{entryId}`.
- **TC-2.3: Gemini Multi-Turn Response**
  - *Action*: Wait for Gemini 3.6 Flash response.
  - *Expected Result*: Shows typing indicator, receives structured markdown reply with model badge (`gemini-3.6-flash` or fallback), and saves full conversation state to Firestore.
- **TC-2.4: Focus Mode Switching**
  - *Action*: Switch focus mode tabs (🌱 Deep Reflection, 💡 Brainstorming, ⚡ Action Items, 📋 Synthesis).
  - *Expected Result*: Active mode updates and subsequent prompts steer Gemini's instructions accordingly.

### Test Suite 3: Summarization, Persistence & History
- **TC-3.1: Executive Reflection Summarization**
  - *Action*: Click "Summarize Insights" after 2 or more turns.
  - *Expected Result*: Calls `/api/gemini/summarize`, generates core takeaways and action steps, updates Firestore document `summary` field, and opens the Summary Modal.
- **TC-3.2: Export Transcript & Markdown**
  - *Action*: Click "Export Markdown" or "Export Transcript".
  - *Expected Result*: Downloads structured `.md` file containing the complete reflection session, summary, and pinned geographic location coordinates.
- **TC-3.3: History Search & Filtering**
  - *Action*: Enter search keywords or toggle filter pills (All, Favorites, Places, Ideas, Actions).
  - *Expected Result*: Sidebar dynamically filters entries matching query or locations in real time.
- **TC-3.4: Favorite Toggle**
  - *Action*: Click the star icon on any entry card.
  - *Expected Result*: Toggles `isFavorite` flag and updates Firestore document in real time.
- **TC-3.5: Delete Reflection Session**
  - *Action*: Hover on entry, click trash icon, and confirm deletion in popover.
  - *Expected Result*: Permanently removes document from `/users/{uid}/entries/{entryId}` in Firestore.
- **TC-3.6: Sign Out Flow**
  - *Action*: Click Sign Out icon in Navbar.
  - *Expected Result*: Terminates Firebase session, clears local state, and returns to landing page.

### Test Suite 4: Location-Aware Reflections (Google Maps Integration)
- **TC-4.1: Pin Location to Reflection**
  - *Action*: In the Journal Editor, click "Pin Location" (or location badge).
  - *Expected Result*: Opens the interactive `LocationPickerModal` with search autocomplete and click-to-pin vector map.
- **TC-4.2: Location Search & Geocoding**
  - *Action*: Search for an address or place (e.g., "Golden Gate Park, San Francisco") and select a result.
  - *Expected Result*: Smoothly pans map to target coordinates, positions the Advanced Marker pin, and captures address details.
- **TC-4.3: Secure Coordinate Sanitization & Firestore Persistence**
  - *Action*: Click "Confirm & Attach Location".
  - *Expected Result*: Validates coordinate bounds (`-90 <= lat <= 90`, `-180 <= lng <= 180`), strips undefined values, persists to `/users/{uid}/entries/{entryId}`, and updates the header location badge.
- **TC-4.4: Global Atlas Map View**
  - *Action*: Click the "Atlas" button in the history sidebar or location filter.
  - *Expected Result*: Opens `EntriesMapViewModal` displaying all pinned reflections globally on an interactive Google Map with custom markers and reflection preview cards.

