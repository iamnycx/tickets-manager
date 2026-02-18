import os, json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

SYSTEM_PROMPT = """You are a support ticket classifier. Given a ticket description,
retrun ONLY valid JSON with two keys:
- "category": one of ["billing", "technical", "account", "general"]
- "priority": one of ["low", "medium", "high", "critical"]

Rules:
- billing: payment, invoice, charge, refund, subscription
- technical: bug, error, crash, not working
- account: login, password, profile, access
- general: everything else
- critical: data loss, security breach, complete outage
- high: major feature broken, billing error
- medium: partial issues, workarounds exist
- low: cosmeti, minor inconveniences

Respond with ONLY the JSON object, no explanations or other text."""

def classify_ticket(description: str) -> dict | None:
    api_key = os.environ.get('LLM_API_KEY')
    if not api_key:
        return None
    try:
        client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=api_key
        )

        response = client.chat.completions.create(
            model="openrouter/aurora-alpha",
            messages= [
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT
                },
                {
                    "role": "user",
                    "content": description
                }
            ]
        )

        result = json.loads(response.choices[0].message.content)

        valid_cats = ["billing", "technical", "account", "general"]
        valid_pris = ["low", "medium", "high", "critical"]
        if result.get("category") in valid_cats and result.get("priority") in valid_pris:
            return result
    except Exception:
        pass
    return None
