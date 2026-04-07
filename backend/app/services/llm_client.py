import httpx
import json
import os

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

async def stream_llm_response(prompt: str):
    headers = {
        "Authorization": f"Bearer {os.environ.get('GROQ_API_KEY')}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": "llama3-8b-8192",
        "messages": [{"role": "user", "content": prompt}],
        "stream": True,
        "temperature": 0.2,
        "max_tokens": 768,
        "stop": ["User logs", "User:", "\n\nUser"],
    }

    async with httpx.AsyncClient(timeout=120) as client:
        async with client.stream(
            "POST",
            GROQ_API_URL,
            headers=headers,
            json=payload,
        ) as response:
            async for line in response.aiter_lines():
                if not line or line == "data: [DONE]":
                    continue
                if line.startswith("data: "):
                    line = line[len("data: "):]
                try:
                    data = json.loads(line)
                    token = data["choices"][0]["delta"].get("content", "")
                    if token:
                        yield token
                except (json.JSONDecodeError, KeyError):
                    continue