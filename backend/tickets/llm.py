import os, json, anthropic

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
    api_key = os.environ.get('LLM_API_KEY', '')
    if not api_key:
        return None
    try:
        client = anthropic.Anthropic(api_key=api_key)
        message = client.message.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=100,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": description}]
        )
        raw = message.content[0].text.strip()
        result = json.loads(raw)
        valid_cats = ["billing", "technical", "account", "general"]
        valid_pris = ["low", "medium", "high", "critical"]
        if result.get("category") in valid_cats and result.get("priority") in valid_pris:
            return result
    except Exception:
        pass
    return None
