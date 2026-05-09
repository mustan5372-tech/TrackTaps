from http.server import BaseHTTPRequestHandler
import json
import os
import httpx
import asyncio

async def get_ai_response(messages, context):
    api_key = os.getenv("OPENAI_API_KEY")
    subjects = context.get("subjects", [])
    last_msg = messages[-1]["content"].lower()

    # Local Intelligence
    if "skip" in last_msg:
        return "I'd recommend staying consistent! Skipping might drop your percentage."
    if "75%" in last_msg or "needed" in last_msg:
        return "You can calculate needed classes in the Insights tab, but generally, stay above 75%!"

    if not api_key:
        return "TrackTaps AI is active! Ask me about your attendance or schedule."

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}"},
                json={
                    "model": "gpt-3.5-turbo",
                    "messages": messages,
                    "temperature": 0.7
                },
                timeout=10.0
            )
            return response.json()["choices"][0]["message"]["content"]
    except:
        return "I'm having trouble with my external brain, but I'm here to help!"

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data)
        
        messages = data.get("messages", [])
        context = data.get("context", {})

        # Run async logic in sync handler
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        reply = loop.run_until_complete(get_ai_response(messages, context))
        loop.close()

        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({"reply": reply}).encode('utf-8'))

    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({"status": "online"}).encode('utf-8'))
