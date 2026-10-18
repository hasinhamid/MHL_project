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


clean up the messy existing code.
use proper file tree
use npm depnedency ditch pnpm


all features
a dashboard a prompt space uses gemma 4 31b
where household or technical issues are explained ai automatically matches worker(home helper, key maker, plumber , electician etc) connect them to the nearest worker. then they can contact and come to the place and start working.
a manual marketplace for if already known which worker is needed

a section where someone can become a worker and earn money

make many demo data so that i can show the mvp to judge

existing ui is good use the existing ui

setup and build the whole app make it simple, clean dont over complicate. always take the simple route