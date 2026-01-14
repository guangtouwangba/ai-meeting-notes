from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from api.services.transcription import transcriber
from api.services.summary import generate_summary
import os
import aiofiles
import shutil

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    # Preload model? Maybe lazy load is better for memory in this env.
    pass

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    temp_filename = f"temp_{file.filename}"
    async with aiofiles.open(temp_filename, 'wb') as out_file:
        content = await file.read()
        await out_file.write(content)

    try:
        text = await transcriber.transcribe(temp_filename)
        return {"text": text}
    finally:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)

class SummaryRequest:
    text: str
    api_key: str
    model: str

@app.post("/summary")
async def summarize_text(
    text: str = Form(...),
    api_key: str = Form(...),
    model: str = Form("google/gemini-pro-1.5")
):
    try:
        summary = generate_summary(text, api_key, model)
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
