# Custom Instructions & Directives

## 1. Google Maps Platform Security & Integration Directive
When integrating or interacting with Google Maps Platform APIs, SDKs, or services in this application:

### A. Zero Hardcoding & Secret Hygiene
- **Never Hardcode Credentials**: Under no circumstances should raw API keys, tokens, or service account secrets be written into client-side code, server files, or version control.
- **Environment & Secret Ingestion**:
  - Client-side Maps SDKs (`@vis.gl/react-google-maps`) must ingest keys strictly via `import.meta.env.VITE_GOOGLE_MAPS_API_KEY` or user runtime configuration.
  - Server-side REST endpoints and proxies must access keys via `process.env.GOOGLE_MAPS_API_KEY` or Google Cloud Secret Manager (`projects/{PROJECT_ID}/secrets/GOOGLE_MAPS_API_KEY/versions/latest`).
- **Maps Demo Key for Prototyping**:
  - For zero-cost prototyping without requiring billing setup or a dedicated Cloud project, developers can acquire a free Google Maps Demo Key from `https://mapsplatform.google.com/maps-demo-key?utm_campaign=gmp_mcp_codeassist_v1_aistudio`.
- **Production API Key Restrictions**:
  - Always enforce HTTP referrer restrictions on production keys (e.g., `https://*.run.app/*`, `https://your-domain.com/*`).
  - Restrict production keys strictly to authorized API scopes: *Maps JavaScript API*, *Places API (New)*, and *Geocoding API*.

### B. Modern SDK & Architectural Invariants
- **React Framework Standard**: Always use `@vis.gl/react-google-maps` for React implementations. Never use legacy packages such as `google-map-react` or `@react-google-maps/api`.
- **Mandatory Attribution ID**: All interactive `<Map>` components must specify `internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}`.
- **Advanced Marker Standard**: Render markers using `AdvancedMarkerElement` with a valid `mapId` (e.g. `mapId="DEMO_MAP_ID"` or Cloud-styled vector Map ID). Never use the deprecated `google.maps.Marker`.
- **Places & Geocoding Standards**: Use Places API (New) classes (`PlaceAutocompleteElement`, `fetchFields`) and backend server proxies for REST calls to prevent client-side CORS blocking.
- **Data Hygiene & Validation**: Validate coordinate bounds (`latitude: -90 to 90`, `longitude: -180 to 180`) and sanitize all location payloads (stripping `undefined` values) before persisting to Cloud Firestore.

---

## 2. Gemini AI Resilience & Fallback Protocol
- **Fallback Ladder**: Route all content generation requests through `generateContentWithFallback` traversing:
  1. `gemini-3.6-flash` (Primary)
  2. `gemini-3.1-flash-lite` (High-Availability Fallback)
  3. `gemini-flash-latest` (Dynamic Alias)
  4. `gemini-3.7-flash` (Deep Reasoning Fallback)
- **Top-Level Body Parsing**: Always mount body-parser/JSON middleware before defining API routes.

---

## 3. Cloud Firestore Security & Multi-Tenant Isolation
- **Owner-Bound Path Isolation**: All user-authored reflections, location pins, and interaction records must reside under `/users/{userId}/...` where `request.auth.uid == userId`.
- **Zero Insecure Defaults**: Reject `allow read, write: if true;` in security rules.

---

## 4. Frontend Design Taste Directives (Leonxlnx/taste-skill)
- **Design Read**: Prioritize contextual design reads before generating frontends. Infer page purpose, target audience, and visual aesthetic.
- **The Three Dials**:
  - `DESIGN_VARIANCE: 8` (1 = Perfect Symmetry, 10 = High Dynamic Variance)
  - `MOTION_INTENSITY: 6` (1 = Static, 10 = Cinematic Physics)
  - `VISUAL_DENSITY: 4` (1 = Airy / Gallery, 10 = Dense / Analytical)
- **Anti-AI-Slop Standard**: Eliminate generic AI defaults (purple-to-blue glow, identical 3-column card grids, centered hero over dark mesh, low-contrast text).
- **Typography Hierarchy**: Pair distinctive display fonts with clear, accessible body typography. Step ratios >= 1.25, line heights 1.5–1.7.
- **Motion & Interactions**: Isolate motion in client components using `motion/react`, honoring `prefers-reduced-motion`.

---

## 5. Output Formatting & Conversational Tone Directives
- **Zero Operational Metadata**: NEVER include operational metadata, labels, tags, counters, or technical headers in conversational AI output.
- **No Robotic Prefixes**: NEVER output text like "MOOD:", "FOCUS:", "Phase 1:", "Step 2:", or explicit analytical summaries in chat.
- **No System Status Injections**: NEVER inject timestamps, character limits, or system status updates into chat.
- **No Dashboard / Multi-Phase Structure**: Do not structure responses like a technical dashboard, formal business report, or numbered multi-phase project plan.
- **Natural Flowing Prose**: Write all conversational responses entirely in natural, flowing paragraphs with soft transitions. Separate distinct thoughts using simple line breaks—never rigid bulleted lists or numbered sequences.
- **Empathetic Human Confidant**: Responses must read like an intimate, private journal entry written by an empathetic confidant—organic, warm, and completely devoid of engineering or data-logging jargon.

