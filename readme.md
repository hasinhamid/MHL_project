## Running implementation

The Vite + FastAPI application is in [`kaajbondhu-ai/`](kaajbondhu-ai/README.md). See its README for npm setup, demo instructions, AI configuration, and checks.

The original specification follows.

file structure
kaajbondhu-ai/
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── ChatAssistant.tsx
│       │   ├── ProviderCard.tsx
│       │   └── RequestForm.tsx
│       ├── pages/
│       │   ├── Home.tsx
│       │   └── MyRequests.tsx
│       ├── lib/
│       │   └── api.ts
│       ├── App.tsx
│       └── main.tsx
└── backend/
    ├── main.py
    ├── ai_service.py
    ├── schemas.py
    ├── providers.json
    ├── requirements.txt
    └── .env.example





KaajBondhu AI — MVP Specification
4-hour build · React + FastAPI · AI-powered household service finder

1. Product overview
Product tagline: Describe your problem. Find the right professional.
KaajBondhu AI helps people in Bangladesh find the right household service professional. Users describe a problem in Bangla, Banglish, or English. The AI understands the problem, recommends the appropriate professional type, and displays matching professionals. The user can then request a service.
The app should feel like a polished, modern product—not a basic chatbot or a generic directory.
2. The 3 core features


Feature 1 — AI Problem Detective
- Accept text input in Bangla, Banglish, and English.
- Identify the problem and the appropriate service category.
- Ask one relevant follow-up question if important information is missing.
- Return a short problem summary, urgency level, and recommendation.
- Display safety warnings for obvious hazards.
  Tech: React chat UI · FastAPI · OpenAI API · Pydantic



Feature 2 — Smart Professional Matching
- Show the three best matching professionals for the recommended trade.
- Filter by service category and area.
- Prefer professionals marked as available.
- Display name, trade, area, estimated fee range, availability, and experience.
- Explain briefly why each professional matches.
  Tech: React cards · FastAPI · Python filtering and ranking · Local JSON data

Feature 3 — One-Click Service Request
- Let users choose a professional.
- Collect a name, phone number, service area/address, and optional note.
- Submit a service request.
- Show a confirmation screen with the selected professional and request status.
- Preserve requests during the demo using browser local storage or a simple backend store.
  Tech: React form · FastAPI · Pydantic · Browser local storage for MVP, or SQLite if backend persistence is desired

feature 4- let someone register as a wroker and get in the workers pool

3. Exact technology stack
Use only these technologies for the first version.
Layer	Technology	Purpose
Frontend	React + TypeScript + Vite	Build the web app
Styling	Tailwind CSS	Fast, consistent styling
UI components	shadcn/ui + Lucide React	Buttons, cards, dialogs, icons
Routing	React Router	Navigate between pages
Backend	Python + FastAPI	AI and service request API
AI	OpenAI API	Understand problems and return structured results
Validation	Pydantic	Validate AI output and API requests
Demo data	Local JSON file	Store 10–15 sample professionals
Request storage	Browser local storage	Keep requests during the demo
HTTP	Fetch API	Connect frontend to backend
Do not add: PostgreSQL, Neon, SQLAlchemy, Alembic, authentication, Redis, LangChain, vector databases, microservices, or deployment configuration.
For the fastest implementation, use browser local storage for the demo's service requests. If your agent can implement SQLite without slowing down the core workflow, backend persistence is an optional improvement.
4. Detailed feature and task breakdown
Feature 1: AI Problem Detective
Frontend tasks
- Create a chat-style interface with a message history.
- Include a text input, send button, loading indicator, and error state.
- Add example prompts users can click:
  - “Amar bathroom er tap theke pani porche.”
  - “Switch on korlei breaker pore jay.”
  - “My AC is running but not cooling.”
- Display the AI's response in a readable result card.
- Keep the conversation in React state during the session.
- If the AI needs clarification, display its question and let the user reply.
Tech: React, TypeScript, Tailwind CSS, shadcn/ui, Lucide React.
Backend tasks
Create POST /api/assistant accepting:
- message: current user message
- history: optional previous messages
Return a validated response containing:
- intent: clarification, recommendation, or unsupported
- problem_summary: short description of the problem
- recommended_trade: supported trade or other
- urgency: normal, urgent, or emergency
- confidence: model-estimated confidence from 0 to 1
- follow_up_question: optional question
- safety_warning: optional warning
Use the OpenAI API to generate structured output. Use Pydantic to validate it. The backend—not the frontend—should call the AI service.
Tech: FastAPI, OpenAI Python SDK, Pydantic, Python.
Supported trades
- Plumber
- Electrician
- Locksmith/key maker
- Carpenter
- AC technician
- Appliance repair technician
- Other/unsupported
Rules
- Reply in the user's language where practical.
- Ask only one follow-up question at a time.
- Do not invent facts or diagnose a problem with certainty.
- Never provide dangerous DIY instructions.
- For obvious electrical hazards, show an appropriate warning to stop using the affected equipment and seek qualified help.
- If the AI API fails, show a helpful error message rather than crashing.
Feature 2: Smart Professional Matching
Frontend tasks
- Show matching professional cards after a recommendation.
- Each card should include:
  - Name
  - Trade
  - Service area
  - Fee range
  - Experience
  - Availability
  - “Why this match?” explanation
  - “Request Service” button
- Show an empty state if no professional matches.
- Make the cards responsive for mobile and desktop.
Tech: React, TypeScript, Tailwind CSS, shadcn/ui.
Backend tasks
Create GET /api/providers?trade=plumber&area=Dhanmondi.
- Read providers from a local JSON file.
- Filter by trade.
- If an area is provided, prefer professionals serving that area.
- Prefer available professionals.
- Return no more than three matches for the main recommendation screen.
- Use a simple deterministic ranking function rather than machine learning.
Example ranking rules:
1. Matching trade is mandatory.
2. Professionals serving the requested area rank higher.
3. Available professionals rank higher than unavailable professionals.
4. Experience can be used as a tie-breaker.
The API should return the actual matching records from the JSON file. The AI should not invent provider names, fees, availability, or experience.
Tech: FastAPI, Python, JSON.
Sample provider record
{
  "id": "p001",
  "name": "Rahim Ahmed",
  "trade": "plumber",
  "areas": ["Dhanmondi", "Mohammadpur"],
  "fee_min": 300,
  "fee_max": 800,
  "experience_years": 5,
  "available": true
}


Seed 10–15 fictional professionals across several Dhaka neighborhoods. Clearly label them as demo professionals. Do not fabricate verified badges or real customer reviews.
Feature 3: One-Click Service Request
Frontend tasks
- Open a small modal or form when the user selects “Request Service.”
- Pre-fill the selected professional and recommended trade.
- Ask for:
  - Customer name
  - Phone number
  - Service area/address
  - Optional problem note
- Validate required fields.
- Show a loading state while submitting.
- Display a success screen with request details and a Pending status.
- Provide a simple “My Requests” section so the user can view submitted requests.
Tech: React, TypeScript, React Hook Form only if convenient; otherwise use a simple controlled form. Use browser local storage to save requests.
Backend tasks
Create POST /api/requests to validate and return a service request if backend persistence is being used.
A request should contain:
- Request ID
- Customer name and phone
- Provider ID
- Problem summary
- Service address/area
- Optional note
- Status
- Creation timestamp
If the app uses local storage, do not build an additional database solely for this feature. Store requests consistently in one place and restore them when the page refreshes.
Tech: FastAPI and Pydantic if using the backend; browser local storage for the quickest MVP.
Important: Do not claim that a professional has accepted the request unless an acceptance action actually occurs. The MVP only needs to submit the request and show its status.


add a "work with us" on topbar that would be used for new worker registration maintain the same ui, 

use user location info or ask for user loaction info for simplecity. and match the local or nearby worker. 

use gamma 4 31b for inferance and matching
