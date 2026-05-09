from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import json
import httpx
from typing import List, Optional, Dict

app = FastAPI()

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    context: Optional[Dict] = None

@app.get("/api/chat/health")
async def health():
    print("Health check pinged")
    return {"status": "online", "service": "TrackTaps AI"}

def calculate_needed_classes(attended, total, target=0.75):
    if total == 0: return 0
    current = attended / total
    if current >= target: return 0
    # Formula: (attended + x) / (total + x) = target
    # attended + x = target * total + target * x
    # x - target * x = target * total - attended
    # x(1 - target) = target * total - attended
    # x = (target * total - attended) / (1 - target)
    needed = (target * total - attended) / (1 - target)
    return max(0, int(needed + 0.99)) # Round up

def get_local_intelligence(message: str, context: Dict):
    msg = message.lower()
    subjects = context.get("subjects", [])
    
    # 1. Skip tomorrow logic
    if "skip" in msg:
        if not subjects: return "I don't see any subjects in your profile. Please add some so I can calculate your attendance!"
        # Find a subject with low attendance
        criticals = [s for s in subjects if (s.get("attended", 0) / max(s.get("total", 1), 1)) < 0.75]
        if criticals:
            s = criticals[0]
            return f"I wouldn't recommend skipping tomorrow. Your attendance in **{s['name']}** is already at {((s['attended']/s['total'])*100):.1f}%, which is below the 75% threshold."
        return "Your attendance looks great across all subjects! You can safely skip a class if needed, but stay consistent!"

    # 2. Classes needed logic
    if "needed" in msg or "75%" in msg:
        if not subjects: return "Add your subjects first, and I'll tell you exactly how many classes you need to reach 75%!"
        responses = []
        for s in subjects:
            pct = (s.get("attended", 0) / max(s.get("total", 1), 1))
            if pct < 0.75:
                needed = calculate_needed_classes(s['attended'], s['total'])
                responses.append(f"**{s['name']}**: Attend {needed} more classes.")
        if not responses: return "You are already above 75% in all subjects. Keep it up!"
        return "To reach 75% attendance, you need:\n" + "\n".join(responses)

    # 3. Critical subject logic
    if "critical" in msg or "lowest" in msg:
        if not subjects: return "Sync your data to see which subjects need attention."
        sorted_subs = sorted(subjects, key=lambda x: (x.get("attended", 0) / max(x.get("total", 1), 1)))
        lowest = sorted_subs[0]
        pct = (lowest['attended'] / max(lowest['total'], 1)) * 100
        return f"Your most critical subject is **{lowest['name']}** at {pct:.1f}%. You should prioritize attending this class."

    # 4. Schedule logic
    if "today" in msg or "schedule" in msg or "classes" in msg:
        timetable = context.get("timetable", [])
        if not timetable: return "Your timetable is empty. Add your classes in the Timetable section so I can help you stay on track!"
        # Simplified response
        return f"You have {len(timetable)} classes scheduled. Don't forget to mark your attendance after each one!"

    return None

@app.post("/api/chat")
async def chat(request: ChatRequest):
    print(f"Incoming message: {request.messages[-1].content}")
    
    context = request.context or {}
    last_message = request.messages[-1].content
    
    # Try Local Intelligence first
    local_reply = get_local_intelligence(last_message, context)
    if local_reply:
        print(f"Local intelligence hit: {local_reply[:50]}...")
        return {"reply": local_reply}

    # Fallback to AI (or Mock if no key)
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("No OpenAI Key - using smart fallback")
        return {"reply": "I'm currently in lightweight mode. I can help you calculate classes needed, check critical subjects, or advise on skipping tomorrow. Try asking 'Which subject is critical?'"}

    try:
        print("Calling OpenAI API...")
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}"},
                json={
                    "model": "gpt-3.5-turbo",
                    "messages": [
                        {"role": "system", "content": "You are TrackTaps AI. Concise, smart, student-focused."},
                        *[{"role": m.role, "content": m.content} for m in request.messages]
                    ],
                    "temperature": 0.7
                },
                timeout=15.0
            )
            data = response.json()
            reply = data["choices"][0]["message"]["content"]
            return {"reply": reply}
    except Exception as e:
        print(f"API Error: {str(e)}")
        return {"reply": "I'm having some trouble connecting to my external brain, but I can still help with calculations! Ask me about your 75% target."}
