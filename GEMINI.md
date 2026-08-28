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
