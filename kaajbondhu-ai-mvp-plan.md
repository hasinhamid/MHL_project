# KaajBondhu AI — MVP implementation plan

Date: 2026-10-18  
Workspace: `/home/hasinhamid/Documents/MHL_project`  
Primary requirements: `todo.md`; supporting specification: `readme.md`  
Status: Planning complete; implementation starts after switching out of Plan mode.

## 1. Goal and approach

Deliver a simple, polished demo that preserves the existing UI and lets a user:

1. Describe a household problem in Bangla, Banglish, or English.
2. Receive a structured recommendation and find suitable local workers.
3. Browse workers directly through a marketplace.
4. Save a service request and access worker contact details.
5. Register as a worker and appear in the demo worker pool.

Use React + TypeScript + Vite, Tailwind CSS, shadcn/ui, Lucide React, React Router, Fetch, Python + FastAPI, Pydantic, and an OpenAI-compatible inference API. Use npm with a committed `package-lock.json`. Keep service requests in browser local storage and provider data in local JSON.

## 2. Findings from the existing implementation

- The current application lives in `kaaj-bondhu-ai-development/` and uses Next.js with pnpm configuration.
- `app/page.tsx` combines navigation, chat, marketplace, booking, worker registration, data types, API calls, and fallback logic.
- The existing green/cream UI, typography, spacing, cards, and layouts provide the design baseline.
- `backend/main.py` combines schemas, inference, provider matching, and worker-registration storage.
- Ten seed professionals exist, but home helpers and provider contact details are missing.
- Registration saves pending applications without adding them to the marketplace worker pool.
- Frontend requests time out after 3.5 seconds, while model inference can wait 20 seconds.
- Frontend and backend independently simulate AI responses; errors can look like successful live inference.
- The model default is `gamma-4-31b`, which differs from the requested “Gemma 4 31b.” The provider/model has not been confirmed.
- Area matching uses substring comparisons and may label unrelated workers as nearby.
- The mobile menu button has no navigation behavior; views are state switches instead of routes.
- Local-storage parsing is unguarded, and request IDs use a short timestamp suffix.
- Git currently reports the application and requirement documents as untracked. Preserve existing work throughout migration; do not use destructive cleanup commands.
- Existing `STATUS.md` contains earlier verification claims. Recheck the migrated application rather than treating those claims as current results.

## 3. Working decisions and one external dependency

### Defaults for implementation

- Treat Home as the dashboard: existing hero/prompt panel, service shortcuts, local-worker entry point, and a small recent-requests summary using actual local data.
- Ask users to select a Dhaka neighborhood. Share the selection across the assistant and marketplace and remember it locally.
- Interpret nearby as service-area coverage and explicitly mapped neighboring areas. Do not display invented distances or claim GPS-level nearest matching.
- Use deterministic backend ranking after the AI identifies the trade. Provider names, fees, and availability always come from stored records.
- Seed 15 fictional professionals across seven trades and multiple Dhaka neighborhoods. This satisfies the specified 10–15 range while broadening demo coverage.
- Make successful registrations immediately discoverable as unverified demo listings. This fulfills the requested worker-pool journey without introducing an admin-review workflow.
- Keep customer service requests browser-local. Confirmation means saved in this demo; direct contact is a separate action. Do not imply delivery, acceptance, dispatch, or payment processing.
- Add no authentication, database, payment system, maps service, real-time tracking, or deployment infrastructure for this MVP.

### Confirm before live inference integration

Obtain the intended model provider, exact model ID for “Gemma 4 31b,” OpenAI-compatible base URL, and a backend-only API key. The spelling in the existing code is not evidence of a valid model identifier. Do not silently substitute a different model or assume OpenAI hosts it.

Use `AI_BASE_URL`, `AI_MODEL`, and `AI_API_KEY` for configuration. Independently complete the app and explicit demo mode while waiting for these values. A live inference check remains an acceptance dependency, not something a mocked response can satisfy.

## 4. Target project structure

Migrate the existing application into the requested `kaajbondhu-ai/` directory, verifying migrated content before removing superseded files.

```text
MHL_project/
├── todo.md
├── readme.md
└── kaajbondhu-ai/
    ├── README.md
    ├── .gitignore
    ├── frontend/
    │   ├── package.json
    │   ├── package-lock.json
    │   ├── index.html
    │   ├── vite.config.ts
    │   ├── tsconfig.json
    │   ├── components.json
    │   ├── .env.example
    │   ├── public/
    │   └── src/
    │       ├── components/
    │       │   ├── AppLayout.tsx
    │       │   ├── ChatAssistant.tsx
    │       │   ├── AreaSelector.tsx
    │       │   ├── ProviderCard.tsx
    │       │   ├── RequestForm.tsx
    │       │   └── ui/
    │       ├── pages/
    │       │   ├── Home.tsx
    │       │   ├── Marketplace.tsx
    │       │   ├── MyRequests.tsx
    │       │   └── WorkWithUs.tsx
    │       ├── lib/
    │       │   ├── api.ts
    │       │   ├── storage.ts
    │       │   └── utils.ts
    │       ├── types.ts
    │       ├── App.tsx
    │       ├── main.tsx
    │       └── index.css
    └── backend/
        ├── main.py
        ├── ai_service.py
        ├── schemas.py
        ├── provider_service.py
        ├── providers.json
        ├── areas.json
        ├── registered_workers.json   # runtime-generated; ignored by Git
        ├── requirements.txt
        ├── .env.example
        └── tests/
```

Keep React state close to its owner. Share area, requests, and navigation-sensitive assistant state through the app shell and ordinary props; introduce context only if actual component nesting warrants it.

## 5. Implementation phases

### Phase 1 — Preserve the design and migrate the foundation

- [ ] Inventory source/assets and capture the existing desktop/mobile appearance when runnable.
- [ ] Move reusable markup, CSS, icons, and shadcn components into Vite without redesigning them.
- [ ] Configure TypeScript aliases, Tailwind, React Router, and shadcn paths for the new layout.
- [ ] Replace Next-specific metadata with `index.html` metadata; migrate public assets and replace `NEXT_PUBLIC_API_URL` with `VITE_API_URL`.
- [ ] Add npm scripts for `dev`, `build`, `preview`, and `typecheck`; generate `package-lock.json` using compatible dependencies.
- [ ] Remove superseded Next.js/analytics dependencies, pnpm configuration, and old scaffolding after checking migration completeness. Investigate root-level `node_modules` before deciding whether it is obsolete.
- [ ] Add routes `/`, `/marketplace`, `/requests`, and `/work-with-us`, a usable mobile menu, active links, and an unknown-route fallback.
- [ ] Confirm the UI renders and the initial production build passes.

### Phase 2 — Define contracts and complete provider data

- [ ] Extract Pydantic request/response models into `schemas.py`, with corresponding frontend types.
- [ ] Standardize trade IDs: `plumber`, `electrician`, `locksmith`, `carpenter`, `ac_technician`, `appliance_repair`, and `home_helper`; use `other` only for unsupported assistant results.
- [ ] Map old trade names during migration and retain existing provider IDs where possible.
- [ ] Define providers with ID, name, trade, service areas, fee range, experience, availability, optional contact phone, and demo/source metadata.
- [ ] Expand seed data to 15 workers, including two per trade and an additional plumber. Include varied areas, fees, experience, and availability.
- [ ] Use labeled fictional contact placeholders for seeds; only enable actual call links for intentionally supplied demo contact numbers or user-registered numbers.
- [ ] Define supported areas and explicit neighboring-area relationships in `areas.json`.
- [ ] Load and validate seed records plus registered workers through `provider_service.py`.

### Phase 3 — Reliable assistant and local matching

- [ ] Move inference into `ai_service.py`; use the OpenAI Python SDK against the confirmed compatible endpoint.
- [ ] Load backend environment configuration and document it in `.env.example`; keep credentials outside frontend variables.
- [ ] Validate user/assistant history roles and bounded message/history sizes. Preserve conversation context for clarification replies.
- [ ] Return intent, summary, supported trade, urgency, confidence, optional follow-up question, and optional hazard warning. Ask one clarification at a time and respond in the user's language where practical.
- [ ] Use the provider-supported structured-output/JSON mode and validate the result with Pydantic. Handle malformed JSON and provider errors explicitly.
- [ ] Make demo inference an explicit backend setting (`AI_MODE=demo|live`) and expose response source to the UI. Remove duplicated frontend classification and provider fixtures.
- [ ] In live mode, show a useful retryable error on inference failure; in demo mode, clearly label simulated responses and support the scripted multilingual examples.
- [ ] Align timeout budgets, for example a 25-second backend inference limit and 35-second frontend assistant timeout, with SDK retries disabled or included in that budget.
- [ ] Filter workers by trade, then rank exact service-area coverage, mapped adjacent-area coverage, availability, experience, and stable ID as tie-breaker.
- [ ] Return up to three assistant matches, with truthful match reasons. Present out-of-area records only as explicitly labeled alternatives.
- [ ] Refetch matches when the selected area changes; ignore or cancel stale fetch results.

### Phase 4 — Dashboard and manual marketplace

- [ ] Extract the current prompt/conversation UI into `ChatAssistant.tsx` and retain the existing recommendation-card design.
- [ ] Display distinct clarification, recommendation, unsupported, loading, retry, and empty-match states.
- [ ] Finish the Home dashboard using existing visual patterns and real request counts.
- [ ] Add a visible shared neighborhood selector and service-category shortcuts.
- [ ] Complete marketplace filtering by name, trade, area, and availability using the same stored provider records and ranking rules.
- [ ] Ensure the directory can return all 15 seed records plus new registrations; remove the current hard-coded 15-result ceiling for directory browsing.
- [ ] Reuse provider cards and request actions across assistant results and marketplace.
- [ ] Keep availability labels accurate and disable booking for unavailable workers while allowing their details to be viewed.

### Phase 5 — Service requests and direct contact

- [ ] Extract `RequestForm.tsx` with selected provider, customer name/phone, service area/address, problem summary, and optional note.
- [ ] Prefill area and assistant summary when available. Validate trimmed required fields and reasonable Bangladesh phone formats.
- [ ] Generate collision-resistant IDs using `crypto.randomUUID()`; store timestamps, provider snapshot, summary, address, note, and `Pending` status.
- [ ] Centralize persistence in `storage.ts`, handle corrupt/unavailable storage, and avoid reporting success if saving fails.
- [ ] Preserve/migrate valid entries from the current `kaajbondhu-requests` key and handle old records missing new fields.
- [ ] Show request confirmation, My Requests, and dashboard counts consistently after saving and refreshing.
- [ ] Offer a `tel:` contact action when a usable provider number exists. Explain the local-demo request status accurately.
- [ ] Use the existing UI library's accessible dialog behavior for booking and confirmation: labels, keyboard access, focus management, and close controls.

### Phase 6 — Worker registration joins the pool

- [ ] Preserve “Work with us” in desktop and mobile navigation.
- [ ] Validate name, phone, supported trade, supported service areas, experience, and ordered nonnegative fee range on both frontend and backend.
- [ ] Persist registrations separately from seed data and immediately return a provider-compatible demo listing.
- [ ] Include registrations in subsequent marketplace and assistant queries without requiring a backend restart.
- [ ] Replace pending-review copy with accurate demo-listing confirmation and a marketplace link.
- [ ] Use atomic JSON writes and a process-local write lock for the documented single-process demo server; handle write failures without false success.
- [ ] Invalidate/reload directory results after registration and demonstrate finding the new worker by category and area.

### Phase 7 — Verify, clean up, and prepare the judge demo

- [ ] Run frontend type checking and production build, then confirm the npm lockfile is reproducible with `npm ci`.
- [ ] Add focused backend checks for multilingual assistant contracts using mocked inference, malformed model output, timeout errors, exact/adjacent/unknown-area ranking, trade filtering, registration validation/persistence, and worker discoverability. Use temporary test storage.
- [ ] Smoke-test browser routes, back/forward navigation, mobile menu, follow-up context, area changes, marketplace filters, registration, request confirmation, and persistence after refresh.
- [ ] Exercise backend-offline errors, empty results, corrupt local storage, and a slow assistant response.
- [ ] Compare desktop/mobile visuals to the original design; fix overflow, keyboard/focus behavior, and contrast issues caused by migration.
- [ ] Run a real structured inference request against the confirmed model when credentials are available. Record any remaining external blocker explicitly.
- [ ] Update README and status documentation with accurate setup, environment variables, commands, demo limitations, and verification results.
- [ ] Finish cleanup only after the migrated source and assets are verified; preserve requirement documents and unrelated user work.

## 6. API contract outline

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health` | Backend availability and configured inference mode, without secrets |
| `GET /api/areas` | Supported neighborhoods for selection and registration |
| `POST /api/assistant` | Message + bounded conversation history → validated assistant result and source mode |
| `GET /api/providers?trade=&area=&available=&limit=` | Full directory or ranked, limited recommendations |
| `POST /api/workers` | Validate and persist a demo worker; return the discoverable provider record |

Use consistent FastAPI validation/error responses and readable frontend messages. Service-request persistence stays in the browser, so a separate request API is unnecessary for the chosen MVP design.

## 7. Definition of done and demo script

1. Start FastAPI and the Vite frontend with documented commands; clean installation and build work with npm.
2. Open the existing-style dashboard on desktop and mobile and choose Dhanmondi.
3. Describe a leaking tap in Banglish; see the summary, plumber recommendation, and correctly ranked local records.
4. Demonstrate a clarification reply and an electrical-hazard warning; show Bangla and English examples too.
5. Select an available provider, save a request, refresh, and find it under My Requests with the same ID and Pending status.
6. Browse the marketplace without AI, change trade/area filters, and open the same booking flow.
7. Register a home helper, find that worker in the marketplace, restart the backend, and confirm the listing persists.
8. Demonstrate a contact action using an intentionally configured demo number, with seed contacts clearly fictional.
9. Show a clear error/retry state when the backend is unavailable and distinguish explicit demo inference from live inference.

Suggested execution order: foundation → data/contracts → assistant/matching → dashboard/marketplace → requests/contact → worker registration → verification/documentation. Complete and check each usable slice before moving on.

## 8. Handoff

This document is the saved implementation plan. No application files were changed during planning. After switching to an implementation-capable agent, use this plan to begin Phase 1 and continue through the acceptance checks. Confirm the model provider/ID before claiming live Gemma integration is complete.