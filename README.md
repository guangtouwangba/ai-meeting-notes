# AI Meeting Notes (Local AI Meeting Assistant)

A secure, local-first meeting assistant that records, transcribes, and summarizes your meetings using advanced AI.

Built with **Electron** (Frontend) and **FastAPI** (Backend), this application leverages local AI models for privacy and powerful cloud APIs for advanced summarization.

## Key Features

*   **Local Transcription**: Uses OpenAI's **Whisper** model running locally on your machine. No audio data is sent to the cloud for transcription, ensuring privacy and zero transcription costs.
*   **AI Meeting Summaries**: Generates intelligent summaries, action items, and key topics using **OpenRouter** (defaulting to Google Gemini Pro 1.5).
*   **Meeting Management**: Record audio, view real-time transcripts (future update), and organize meeting notes.
*   **Cross-Platform Architecture**: Built on Electron, designed for extensibility.

## Tech Stack

### Frontend (`app/`)
*   **Framework**: Electron + React
*   **Build Tool**: Vite
*   **Styling**: Tailwind CSS + Chakra UI
*   **Language**: TypeScript

### Backend (`api/`)
*   **Framework**: FastAPI (Python)
*   **AI Models**:
    *   **Transcription**: `openai-whisper` (running locally)
    *   **Summarization**: `langchain` + `ChatOpenAI` (via OpenRouter)

## Prerequisites

*   **Node.js**: v16 or higher
*   **Python**: 3.8 or higher
*   **FFmpeg**: Required for audio processing by Whisper.
    *   **macOS**: `brew install ffmpeg`
    *   **Windows**: [Download FFmpeg](https://ffmpeg.org/download.html) and add to PATH.
    *   **Linux**: `sudo apt install ffmpeg`

## Installation & Setup

### 1. Backend Setup

The backend handles audio processing and AI interactions.

1.  Navigate to the `api` directory:
    ```bash
    cd api
    ```

2.  (Optional but recommended) Create a virtual environment:
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

3.  Install Python dependencies:
    ```bash
    pip install -r requirements.txt
    ```

4.  Start the backend server:
    ```bash
    python main.py
    ```
    The server will start on `http://0.0.0.0:8000`.

### 2. Frontend Setup

The frontend provides the user interface.

1.  Navigate to the `app` directory:
    ```bash
    cd app
    ```

2.  Install Node.js dependencies:
    ```bash
    npm install
    ```

3.  Start the Electron application in development mode:
    ```bash
    npm run electron-dev
    ```

## Usage

1.  **Start the Backend**: Ensure `python main.py` is running in a terminal.
2.  **Launch the App**: Run `npm run electron-dev` in the `app` folder.
3.  **Record a Meeting**:
    *   Click "New Meeting" or "Record" in the app.
    *   The app will capture audio.
4.  **Transcribe**:
    *   Once recording stops, the audio is processed locally using Whisper.
5.  **Summarize**:
    *   To generate a summary, you will need an **OpenRouter API Key**.
    *   Enter your key when prompted (or configure it in the settings if available).
    *   The app will send the transcript text (not audio) to OpenRouter to generate a summary using Gemini Pro 1.5.

## Configuration

*   **API Configuration**:
    *   The frontend defaults to connecting to `http://localhost:3000` (via proxy) or `http://localhost:8000` (direct).
    *   OpenRouter API Key is required for summarization.

## License

[MIT License](LICENSE)
