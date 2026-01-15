import asyncio
import os
import uuid
from typing import Dict, Optional
from fastapi import WebSocket, WebSocketDisconnect
from api.services.transcription import transcriber

class RealtimeManager:
    def __init__(self):
        # Store active connections: {connection_id: {"socket": WebSocket, "file_path": str, "loop_task": Task}}
        self.active_connections: Dict[str, Dict] = {}
        # Directory for temporary audio files
        self.temp_dir = "temp_audio"
        os.makedirs(self.temp_dir, exist_ok=True)

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        connection_id = str(uuid.uuid4())

        # Unique file for this session
        file_path = os.path.join(self.temp_dir, f"stream_{connection_id}.webm")

        # Start the periodic transcription task
        task = asyncio.create_task(self._periodic_transcribe(connection_id, websocket, file_path))

        self.active_connections[connection_id] = {
            "socket": websocket,
            "file_path": file_path,
            "loop_task": task,
            "last_transcribed_size": 0
        }

        try:
            while True:
                # Receive message
                # It can be text (config) or binary (audio)
                message = await websocket.receive()

                if "bytes" in message:
                    # Append audio data to file
                    data = message["bytes"]
                    if data:
                        with open(file_path, "ab") as f:
                            f.write(data)

                elif "text" in message:
                    # Handle config or other text messages if needed
                    pass

        except WebSocketDisconnect:
            self.disconnect(connection_id)
        except Exception as e:
            print(f"Error in connection {connection_id}: {e}")
            self.disconnect(connection_id)

    def disconnect(self, connection_id: str):
        if connection_id in self.active_connections:
            conn_info = self.active_connections.pop(connection_id)

            # Cancel the transcription task
            task = conn_info.get("loop_task")
            if task:
                task.cancel()

            # Clean up file
            file_path = conn_info.get("file_path")
            if file_path and os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except Exception as e:
                    print(f"Error removing temp file {file_path}: {e}")

            print(f"Client {connection_id} disconnected")

    async def _periodic_transcribe(self, connection_id: str, websocket: WebSocket, file_path: str):
        """
        Periodically checks the file and runs transcription if new data is available.
        """
        try:
            while True:
                await asyncio.sleep(2)  # Transcribe every 2 seconds

                if not os.path.exists(file_path):
                    continue

                current_size = os.path.getsize(file_path)
                last_size = self.active_connections.get(connection_id, {}).get("last_transcribed_size", 0)

                # Only transcribe if there is data and it has grown (or just always transcribe for now to be safe)
                if current_size > 0:
                    # Note: Transcribing the growing file repeatedly is inefficient but simple for MVP.
                    # Whisper works best on context, so giving it the full file helps.

                    try:
                        # We might need to copy the file to avoid read/write conflicts if ffmpeg locks it?
                        # Usually appending and reading is okay on unix.

                        text = await transcriber.transcribe(file_path)

                        if text:
                            # Send update to client
                            await websocket.send_json({
                                "type": "transcription",
                                "text": text.strip()
                            })

                        # Update state
                        if connection_id in self.active_connections:
                            self.active_connections[connection_id]["last_transcribed_size"] = current_size

                    except Exception as e:
                        print(f"Transcription error for {connection_id}: {e}")

        except asyncio.CancelledError:
            pass

manager = RealtimeManager()
