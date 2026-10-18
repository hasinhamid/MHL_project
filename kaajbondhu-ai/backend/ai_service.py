import os
import re

from openai import OpenAI

from schemas import AssistantRequest, AssistantResponse, AssistantResult, Trade


def ai_mode() -> str:
    mode = os.getenv("AI_MODE", "demo").strip().lower()
    if mode not in {"demo", "live"}:
        raise ValueError("AI_MODE must be demo or live")
    return mode


def demo_assistant(payload: AssistantRequest) -> AssistantResult:
    # This deterministic script is intentionally labeled demo, never live AI.
    previous = " ".join(turn.content for turn in payload.history if turn.role == "user")
    text = (previous + " " + payload.message).lower()
    bangla = bool(re.search(r"[\u0980-\u09ff]", text))
    banglish = not bangla and bool(re.search(r"\b(amar|pani|porche|korlei|pore|jay|lagbe|dorkar|chabi)\b", text))

    def language(english: str, bengali: str, transliterated: str) -> str:
        return bengali if bangla else transliterated if banglish else english

    patterns = [
        (Trade.electrician, r"\b(switch|breaker|spark\w*|electric\w*|wir(?:e|ing)|shock\w*)\b|বিদ্যুৎ|সুইচ|ব্রেকার|স্পার্ক|শক"),
        (Trade.plumber, r"\b(tap|pani|water|leak\w*|pipe|drain|plumb\w*)\b|পানি|কল|পাইপ|প্লাম্বার"),
        (Trade.ac_technician, r"\b(ac|air conditioner|cooling)\b|এসি|এয়ার কন্ডিশনার"),
        (Trade.locksmith, r"\b(lock\w*|key|keys|chabi)\b|চাবি|তালা"),
        (Trade.carpenter, r"\b(wood\w*|furniture|carpenter|chair|cabinet|door)\b|কাঠ|দরজা|আসবাব"),
        (Trade.appliance_repair, r"\b(fridge|refrigerator|washing machine|oven|appliance|fan)\b|ফ্রিজ|ওয়াশিং|পাখা"),
        (Trade.home_helper, r"\b(clean\w*|helper|housework|maid|cook\w*)\b|পরিষ্কার|গৃহকর্ম|রান্না"),
    ]
    # Prefer the newest message; use earlier user messages for short follow-up answers.
    trade = next((trade for trade, pattern in patterns if re.search(pattern, payload.message.lower())), None)
    if trade is None:
        trade = next((trade for trade, pattern in patterns if re.search(pattern, text)), None)
    hazardous = bool(re.search(r"spark|shock|smoke|fire|স্পার্ক|শক|ধোঁয়া|আগুন", text))
    warning = language(
        "Stop using the affected equipment. Keep away from exposed wiring and contact a qualified electrician. If there is fire or immediate danger, move to safety and call 999.",
        "আক্রান্ত যন্ত্র ব্যবহার বন্ধ করুন। খোলা তার থেকে দূরে থাকুন এবং দক্ষ ইলেকট্রিশিয়ানের সাহায্য নিন। আগুন বা তাৎক্ষণিক বিপদ হলে নিরাপদ স্থানে গিয়ে ৯৯৯-এ কল করুন।",
        "Affected equipment use bondho korun. Khola tar theke dure thakun, electrician dakun. Agun ba immediate danger hole nirapod jaygay giye 999 e call korun.",
    ) if trade == Trade.electrician or hazardous else None
    if trade is None:
        unsupported = bool(re.search(r"\b(stock|bitcoin|essay|weather|medical|doctor|software)\b|ডাক্তার", text))
        return AssistantResult(
            intent="unsupported" if unsupported else "clarification", recommended_trade="other",
            problem_summary=language("I can help with household services. Let's identify the right kind of help.", "আমি ঘরোয়া সেবার জন্য সঠিক কর্মী খুঁজতে সাহায্য করতে পারি।", "Ami household service er jonno thik worker khujte help korte pari."),
            urgency="emergency" if hazardous else "normal", confidence=0.3,
            follow_up_question=None if unsupported else language("Which appliance or part of your home needs help?", "আপনার ঘরের কোন যন্ত্র বা অংশে সাহায্য দরকার?", "Kon appliance ba ghorer kon jaygay help dorkar?"),
            safety_warning=warning,
        )
    labels = {
        Trade.plumber: ("plumbing", "পানির লাইন বা কল", "pani ba tap"),
        Trade.electrician: ("electrical", "বিদ্যুৎ", "electrical"),
        Trade.ac_technician: ("air conditioning", "এসি", "AC"),
        Trade.locksmith: ("lock or key", "তালা বা চাবি", "tala ba chabi"),
        Trade.carpenter: ("woodwork or furniture", "কাঠ বা আসবাব", "kath ba furniture"),
        Trade.appliance_repair: ("appliance repair", "গৃহস্থালি যন্ত্র মেরামত", "appliance repair"),
        Trade.home_helper: ("household help", "ঘরের কাজ", "ghorer kaj"),
    }
    en, bn, bl = labels[trade]
    return AssistantResult(
        intent="recommendation", recommended_trade=trade,
        problem_summary=language(f"This may be a {en} job. A professional can assess the work and confirm the price.", f"এটি {bn} সংক্রান্ত কাজ হতে পারে। একজন পেশাদার কাজ দেখে মূল্য নিশ্চিত করতে পারবেন।", f"Eta {bl} er kaj hote pare. Worker kaj dekhe price confirm korte parben."),
        urgency="emergency" if hazardous else "urgent" if trade == Trade.electrician else "normal",
        confidence=0.7, safety_warning=warning,
    )


def analyze(payload: AssistantRequest) -> AssistantResponse:
    mode = ai_mode()
    if mode == "demo":
        result = demo_assistant(payload)
    else:
        key, base_url, model = (os.getenv(name, "").strip() for name in ("AI_API_KEY", "AI_BASE_URL", "AI_MODEL"))
        if not all((key, base_url, model)):
            raise ValueError("Live AI requires AI_API_KEY, AI_BASE_URL, and AI_MODEL in backend/.env")
        schema = AssistantResult.model_json_schema()
        prompt = (
            "You are KaajBondhu, a household service assistant for Bangladesh. "
            "Understand Bangla, Banglish, and English; reply in the user's language. "
            "Identify the trade, not individual workers. Ask one short clarification when needed. "
            "Do not invent facts or claim a certain diagnosis. For electrical hazards, warn to stop use and seek qualified help; "
            "for immediate danger advise moving to safety and local emergency services (999). Never give dangerous DIY instructions. "
            "Return JSON matching this schema, with no markdown: " + str(schema)
        )
        output_format = os.getenv("AI_RESPONSE_FORMAT", "json_object")
        options = {}
        if output_format == "json_object":
            options["response_format"] = {"type": "json_object"}
        elif output_format == "json_schema":
            options["response_format"] = {"type": "json_schema", "json_schema": {"name": "assistant_result", "schema": schema}}
        elif output_format != "none":
            raise ValueError("AI_RESPONSE_FORMAT must be json_object, json_schema, or none")
        with OpenAI(api_key=key, base_url=base_url, timeout=25.0, max_retries=0) as client:
            response = client.chat.completions.create(
                model=model,
                messages=[{"role": "system", "content": prompt}]
                + [turn.model_dump() for turn in payload.history]
                + [{"role": "user", "content": payload.message}],
                **options,
            )
        result = AssistantResult.model_validate_json(response.choices[0].message.content or "")
    return AssistantResponse(**result.model_dump(), source=mode)
