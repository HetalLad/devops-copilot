import httpx
import json

LLAMA_SERVER_URL = "http://localhost:8080/completion"

async def stream_llm_response(prompt: str):
    payload = {
        "prompt": prompt,
        "n_predict": 768,
        "temperature": 0.2,
        "repeat_penalty": 1.15,
        "stop": ["</s>", "User logs", "User:", "\n\nUser", "CONCLUSION:", "SUMMARY:"],
        "stream": True,
    }

    async with httpx.AsyncClient(timeout=None) as client:
        async with client.stream(
            "POST",
            LLAMA_SERVER_URL,
            json=payload,
            headers={"Content-Type": "application/json"},
        ) as response:
            async for line in response.aiter_lines():
                if not line:
                    continue
                # llama.cpp streams SSE: "data: {...}"
                if line.startswith("data: "):
                    line = line[len("data: "):]
                try:
                    data = json.loads(line)
                    token = data.get("content", "")
                    if token:
                        yield token
                except json.JSONDecodeError:
                    continue
