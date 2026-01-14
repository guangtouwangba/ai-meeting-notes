# Tasks

- [ ] Install `python-multipart` or check if `fastapi` websockets require `websockets` lib <!-- id: 0 -->
- [ ] Create `api/services/realtime.py` with buffering logic <!-- id: 1 -->
- [ ] Add `/ws/recording` endpoint to `api/main.py` <!-- id: 2 -->
- [ ] Create `native/audio-bridge` directory and `Package.swift` <!-- id: 7 -->
- [ ] Add `whisper.cpp` submodule and compile `libwhisper.a` <!-- id: 12 -->
- [ ] Implement `WhisperTranscriber.swift` with C-Bridging <!-- id: 13 -->
- [ ] Implement `VoiceActivityDetector.swift` <!-- id: 14 -->
- [ ] Implement `SystemAudioRecorder.swift` using ScreenCaptureKit <!-- id: 8 -->
- [ ] Implement `main.swift` to coordinate Capture -> VAD -> Inference <!-- id: 9 -->
- [ ] Update `app/src/electron/main.ts` to spawn sidecar and pipe stdout <!-- id: 10 -->
- [ ] Update `Makefile` to build `libwhisper.a` and the Swift tool <!-- id: 11 -->
- [ ] Test with `make start-backend` and manual frontend usage <!-- id: 5 -->
