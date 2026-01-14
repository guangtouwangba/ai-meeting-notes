# Proposal: Implement Real-time Transcription

## Background
The current application only supports **post-recording transcription**, where the user must finish recording before the backend processes the audio file. The frontend contains experimental code for a WebSocket-based real-time transcription feature, but the backend implementation is missing.

## Problem
Users cannot see the transcription as they speak, which reduces the utility of the application for live meeting notes. The feedback loop is too slow.

## Solution
Implement a **Fully Local, High-Performance** transcription service using a Swift Sidecar integrated with **whisper.cpp**.
1.  **Audio Capture**: Swift Sidecar (`audio-bridge`) uses `ScreenCaptureKit` + `AVCaptureSession`.
2.  **Inference Engine**: Embed `whisper.cpp` directly into the Swift Sidecar for local inference on Apple Silicon (Metal accelerated).
3.  **Processing Pipeline**: Ring Buffer -> VAD (Voice Activity Detection) -> Whisper Inference -> Text Output.
4.  **Data Flow**: The Sidecar outputs **Transcription Events** (JSON text) to Electron (real-time display) and saves Audio for the backend (summarization).

## Impact
-   **Performance**: Utilizes M-series Neural Engine/GPU via Metal (whisper.cpp optimization).
-   **Privacy**: Zero audio data leaves the local machine (except for summarization optionality).
-   **Latency**: Reduced network latency by doing inference in the capture process itself.
