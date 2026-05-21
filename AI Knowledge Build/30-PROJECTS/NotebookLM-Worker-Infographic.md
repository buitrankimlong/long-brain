---
tags: [project, notebooklm-worker-infographic]
status: hoan-thanh
started: 2026-05-20
stack: [Python, Flask, asyncio, threading, NotebookLM API, Pillow]
github: https://github.com/buitrankimlong/Projects/tree/main/03-ai-automation/notebooklm-worker
updated: 2026-05-20
---

# NotebookLM-Worker-Infographic

## Mo ta
Flask async job queue cho infographic generation: nhận data + prompt → background thread tạo infographic → trả base64 image. API key auth.

## Stack
- Python
- Flask
- asyncio
- threading
- NotebookLM API
- Pillow

## Quyet dinh quan trong
1) In-memory job store (dict). 2) Background thread cho heavy processing. 3) API key auth via X-API-Key header. 4) Base64 encode output image.

## Source Code

server.py:
```python
"""NotebookLM Flask Server — async job queue with background processing."""
import asyncio, base64, os, threading, uuid
from flask import Flask, jsonify, request
from create_infographic import create_infographic

API_KEY = os.environ["API_KEY"]
app = Flask(__name__)
jobs = {}  # {job_id: {status, name, image_base64, error}}

def process_job(job_id, data, prompt, name):
    output_path = asyncio.run(create_infographic(data, prompt, name))
    with open(output_path, "rb") as f:
        jobs[job_id]["image_base64"] = base64.b64encode(f.read()).decode()
    jobs[job_id]["status"] = "done"

@app.route("/generate", methods=["POST"])
def generate():
    if request.headers.get("X-API-Key") != API_KEY:
        return jsonify({"error": "Unauthorized"}), 401
    job_id = str(uuid.uuid4())[:8]
    jobs[job_id] = {"status": "processing"}
    threading.Thread(target=process_job, args=(job_id, data, prompt, name)).start()
    return jsonify({"job_id": job_id})
```

## GitHub
https://github.com/buitrankimlong/Projects/tree/main/03-ai-automation/notebooklm-worker

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]
