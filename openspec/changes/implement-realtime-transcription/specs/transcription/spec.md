# Spec: Real-time Transcription Endpoint

## ADDED Requirements

### Requirement: WebSocket Endpoint
The system MUST provide a WebSocket endpoint for streaming audio.

#### Scenario: Successful Connection
-   **Given** the backend server is running.
-   **When** a client connects to `/ws/recording`.
-   **Then** the connection is accepted.

#### Scenario: Streaming Audio
-   **Given** an active WebSocket connection.
-   **When** the client sends binary audio chunks.
-   **Then** the server buffers the audio.
-   **And** periodically sends back JSON messages containing the transcribed text.

#### Scenario: Connection Close
-   **When** the client closes the connection.
-   **Then** the server cleans up temporary files associated with that session.

### Requirement: Audio Sidecar (Swift)
The system MUST use a native Swift executable to capture, process, and transcribe audio locally.

#### Scenario: Voice Activity Detection
-   **Given** the sidecar is running.
-   **When** the audio input is silent (RMS < Threshold).
-   **Then** the inference engine skips processing to save CPU.

#### Scenario: Local Inference
-   **Given** valid speech input.
-   **When** the buffer duration reaches the chunk size (e.g., 3s).
-   **Then** `whisper.cpp` processes the audio on the Metal backend.
-   **And** outputs the transcribed text to stdout.

#### Scenario: Permission Handling
-   **When** the sidecar is launched.
-   **Then** it checks for Screen Recording and Microphone permissions.
-   **And** exits with a specific error code if permissions are missing.

### Requirement: Frontend Control
The Electron app MUST manage the sidecar lifecycle.

#### Scenario: Start Recording
-   **When** the user clicks "Start Recording".
-   **Then** the app spawns the `audio-bridge` process.
-   **And** connects its own WebSocket to receive transcription updates.

#### Scenario: Stop Recording
-   **When** the user clicks "Stop".
-   **Then** the app sends a SIGTERM/SIGINT to the `audio-bridge` process.
