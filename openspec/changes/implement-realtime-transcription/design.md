# Design: Pseudo-Streaming Architecture

## Context
The `openai-whisper` model is designed for file-based transcription, not native streaming. To achieve real-time capability without switching to complex C++ bindings (unless necessary), we will use a buffering strategy.

## Architecture

### 1. WebSocket Protocol
-   **Endpoint**: `ws://localhost:8000/ws/recording`
-   **Client Messages**:
    -   `{"type": "config", "data": {...}}`: Optional configuration (model, language).
    -   `Binary Data`: Raw audio chunks (WebM/Opus or WAV).
-   **Server Messages**:
    -   `{"type": "transcription", "text": "Hello world..."}`: Incremental update.

### 2. Buffering Logic (Backend)
The backend `RealtimeManager` will:
1.  Receive binary chunks.
2.  Append them to a temporary file (e.g., `temp_stream_{session_id}.webm`).
3.  Every `N` seconds (e.g., 2s), trigger `transcriber.transcribe(temp_file)`.
4.  Return the *full* text or *new* text segment to the client.

### 3. Swift Sidecar (`audio-bridge`)
The core engine moving from Python to Swift/C++.
-   **Dependencies**: `whisper.cpp` (compiled as `libwhisper.a`).
-   **Components**:
    1.  `SystemAudioRecorder`: ScreenCaptureKit input.
    2.  `MicrophoneRecorder`: AVCaptureSession input.
    3.  `RingBuffer`: Thread-safe audio storage.
    4.  `VoiceActivityDetector` (VAD): Simple energy-based (RMS) detection to skip silence.
    5.  `WhisperTranscriber`: Wrapper around C-API `whisper_full`.
-   **Flow**:
    `[SCK/Mic] -> [Mixer] -> [RingBuffer] -> [VAD] -> [Whisper] -> [JSON Output]`
-   **Output**:
    -   `stdout`: JSON streams `{"type": "transcription", "text": "..."}` for Electron to read.
    -   `file`: Saves `.wav` recording for permanent storage.

### 4. Frontend Integration
-   Electron spawns `audio-bridge` using `child_process.spawn`.
-   Listens to `stdout` for real-time text updates.
-   Updates React state (`transcription` string).

## Trade-offs
-   **Latency**: There will be a 2-4 second delay (Buffer + Inference time). This is acceptable for a "Meeting Assistant" use case.
-   **Accuracy vs Speed**: We will use the `base` model for real-time (fast) and potentially re-run `large` model on the full file after recording ends for better accuracy.
