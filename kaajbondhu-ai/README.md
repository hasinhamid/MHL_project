# KaajBondhu AI

Describe your problem. Find the right professional.

A local-demo household services app for Bangladesh, preserving the original green/cream UI. Built with React, TypeScript, Vite, Tailwind, shadcn/Base UI, Lucide, React Router, FastAPI, Pydantic, and the OpenAI Python SDK.

## Run locally

Requires Node.js 22+ and Python 3.11+. Run the commands below from the repository root (`MHL_project`).

**Terminal 1 — API**

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r kaajbondhu-ai/backend/requirements.txt
cp kaajbondhu-ai/backend/.env.example kaajbondhu-ai/backend/.env
cd kaajbondhu-ai/backend
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

**Terminal 2 — frontend**

```bash
cd kaajbondhu-ai/frontend
npm ci
npm run dev
```

Open **http://127.0.0.1:5173**. API documentation: **http://127.0.0.1:8000/docs**.

The frontend defaults to the API above. To change it, copy `frontend/.env.example` to `frontend/.env`, change `VITE_API_URL`, and restart Vite. API CORS origins are configurable in `backend/.env`.

## API endpoints

| Endpoint | Behavior |
| --- | --- |
| `GET /api/health` | Availability and configured AI mode |
| `GET /api/areas` | Supported neighborhoods |
| `POST /api/assistant` | `{ message, history? }` → validated result with `source: demo\|live` |
| `GET /api/providers` | Directory, with optional `trade`, `area`, `available`, and `limit` filters |
| `POST /api/workers` | Validated registration → saved provider record (201) |

The assistant requests three ranked matches. Directory browsing includes all records. Use the interactive `/docs` page for complete schemas and validation constraints.

## AI configuration

The app defaults to **explicit demo mode**, with deterministic multilingual examples and no API key required. Every simulated response is labeled. This is useful for a repeatable judge demonstration.

For live inference, configure `backend/.env`:

```dotenv
AI_MODE=live
AI_BASE_URL=https://your-provider.example/v1
AI_MODEL=exact-provider-model-id
AI_API_KEY=your-key
AI_RESPONSE_FORMAT=json_object
```

The requested “Gemma 4 31b” provider and model ID still need confirmation. No model identifier is invented or silently substituted. The SDK supports an OpenAI-compatible provider; setting its base URL does not mean OpenAI hosts that model. Keep credentials in the backend only.

`AI_RESPONSE_FORMAT` accepts `json_object`, `json_schema`, or `none`. Use the mode supported by your provider; all answers still undergo Pydantic validation. Live failures show a retryable error, never a silent demo response. The backend model timeout is 25 seconds with no SDK retries; the frontend assistant timeout is 35 seconds.

## Features and data

- **Smart finder:** Bangla, Banglish, and English prompts; conversation follow-ups; structured trade recommendations; hazard guidance.
- **Local matching:** select a neighborhood; rank by exact service coverage, explicitly adjacent areas, availability, experience, and stable ID. This is area-based matching, not GPS distance.
- **Marketplace:** 15 fictional workers across seven trades, search, category filters, availability, and local/adjacent coverage filters. New registrations are included immediately.
- **Requests:** customer form, confirmation, and My Requests; stored only in browser local storage with UUIDs. Pending means saved, not accepted or dispatched. Contact the worker separately.
- **Work with us:** validated demo registration, durable local JSON persistence, discoverable listing, and a phone contact link. No account or review workflow is required for the local MVP.

### Storage

| Data | Location |
| --- | --- |
| Seed professionals | `backend/providers.json` |
| Neighborhood adjacency | `backend/areas.json` |
| New worker registrations | `backend/registered_workers.json` (generated, ignored by Git) |
| Service requests | Browser local storage: `kaajbondhu-requests` |
| Selected neighborhood | Browser local storage: `kaajbondhu-area` |

Worker writes use a lock and atomic file replacement. Run one API process for the local JSON store. `WORKERS_FILE` can override its path for isolated demos/tests. Duplicate phone + trade registrations are rejected. Optional worker notes are stored with the listing.

Seed workers have no dialable numbers because they are fictional. Register a worker with an intentionally chosen demo contact number to demonstrate the call link. Opening the link uses the device's dialer; the app does not place a call automatically.

Requests from the earlier app are migrated when readable, including old trade names. Browser storage is origin-specific: old requests on `localhost:3000` are not automatically accessible at `127.0.0.1:5173`. Corrupt records produce a notice; saving new requests backs up unreadable prior content before replacement. Storage failures prevent false success.

To reset a demo, clear the two local-storage keys in browser developer tools and, with the backend stopped, remove only the generated worker file if its contents are no longer needed. Seed records remain intact.

## Project layout

```text
frontend/
  src/
    components/      shared layout, assistant, worker cards, booking form, UI primitives
    pages/           Home, Marketplace, MyRequests, WorkWithUs
    lib/             Fetch client, browser storage, styling helpers
    types.ts         frontend contracts and trade labels
    App.tsx          routes and shared session state
backend/
  main.py            API routes and error handling
  schemas.py         Pydantic request/response contracts
  ai_service.py      live inference and explicit demo script
  provider_service.py  matching and registration persistence
  tests/             backend behavior and integration checks
```

## Checks

From the repository root:

```bash
.venv/bin/python -m unittest discover -s kaajbondhu-ai/backend/tests -v
cd kaajbondhu-ai/frontend
npm run typecheck
npm run build
npm run preview
```

Production preview is at `http://127.0.0.1:4173`; keep the API running. Use npm and `package-lock.json` for reproducible frontend installs.

## Judge walkthrough

1. Select **Dhanmondi** and try “Amar bathroom er tap theke pani porche.”
2. View the plumber recommendation and local-worker match explanations.
3. Request an available worker, save the form, refresh My Requests, and show the persisted Pending record.
4. Start a new conversation with “Something is broken,” then reply “The switch is sparking” to demonstrate clarification and hazard guidance.
5. Try “My AC is running but not cooling” and “ঘর পরিষ্কার করার জন্য সাহায্য দরকার।”
6. Browse the marketplace, filter services/availability, and change the neighborhood.
7. Register a home helper through **Work with us**, open the new listing, and show its contact action. Restart the API to demonstrate persistence.
8. Show that the mobile menu works and that failed API calls display a retry action.

See `STATUS.md` for implementation and verification results.
