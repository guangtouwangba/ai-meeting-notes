import whisper
import os
import asyncio

class Transcriber:
    def __init__(self):
        # Using "base" model for speed/memory balance in a dev env.
        # In prod, let user select model.
        self.model_name = "base"
        self.model = None

    def load_model(self):
        if self.model is None:
            print(f"Loading Whisper model: {self.model_name}")
            self.model = whisper.load_model(self.model_name)
            print("Model loaded.")

    async def transcribe(self, file_path: str):
        if self.model is None:
            self.load_model()

        # Whisper is blocking, run in executor
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, self.model.transcribe, file_path)
        return result["text"]

transcriber = Transcriber()
