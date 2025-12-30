import httpx
import json

LLAMA_SERVER_URL = "http://localhost:8080/completion"

async def stream_llm_response(prompt: str):
    payload = {
        "prompt": prompt,
        "n_predict": 256,
        "temperature": 0.2,
        "stop": ["</s>"]
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
                yield line
