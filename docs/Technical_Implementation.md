# 技术实现文档: MacMeetingMind

## 1. 技术栈概览

为了满足高性能、低延迟和 macOS 原生体验的需求，本项目将采用以下技术栈：

- **开发语言**: Swift 5.10+
- **UI 框架**: SwiftUI (macOS 14.0+ target)
- **架构模式**: MVVM (Model-View-ViewModel) + Clean Architecture
- **音频采集**: `ScreenCaptureKit` (系统音频) + `AVFoundation` (麦克风)
- **ASR 引擎**: `whisper.cpp` (C++ Core, Swift Bindings)
    - 理由: 相比 CoreML 版本，whisper.cpp 更新更频繁，且易于量化模型，性能在 Apple Silicon 上表现优异。
- **LLM 客户端**: Swift `URLSession` 实现 HTTP 请求，对接 OpenRouter API。
- **数据存储**: `SwiftData` (首选) 或 `SQLite.swift`。
    - 理由: SwiftData 是 Apple 推荐的现代持久化框架，与 SwiftUI 结合紧密。

---

## 2. 系统架构

### 2.1 高层架构图

```mermaid
graph TD
    subgraph "Audio Capture Layer"
        Mic[Microphone Input]
        Sys[System Audio (ScreenCaptureKit)]
        Mixer[Audio Mixer / Buffer]
    end

    subgraph "Processing Layer"
        VAD[Voice Activity Detection]
        Whisper[Whisper.cpp Engine]
        LLM[OpenRouter Client]
    end

    subgraph "Data Layer"
        SwiftData[(Local Database)]
        Keychain[Keychain Services]
    end

    subgraph "UI Layer"
        MenuBar[Menu Bar Extra]
        FloatWin[Floating Caption Window]
        MainWin[Main App Window]
    end

    Mic --> Mixer
    Sys --> Mixer
    Mixer --> VAD
    VAD -- "Speech Detected" --> Whisper
    Whisper -- "Real-time Text" --> FloatWin
    Whisper -- "Final Text" --> SwiftData

    SwiftData -- "Full Transcript" --> LLM
    Keychain -- "API Key" --> LLM
    LLM -- "Summary" --> SwiftData

    SwiftData --> MainWin
```

### 2.2 模块划分

1.  **AudioEngine**: 负责音频流的采集、混合和预处理（重采样、VAD）。
2.  **Transcriber**: 封装 `whisper.cpp`，管理模型加载、推理循环和文本回调。
3.  **LLMService**: 管理 OpenRouter API 的通信，包括构建 Prompt、发送请求和解析响应。
4.  **Persistence**: 负责数据的 CRUD 操作，封装 SwiftData 上下文。
5.  **AppUI**: 包含所有视图逻辑，分为 MenuBar, FloatingWindow, MainWindow 三个子模块。

---

## 3. 关键功能实现细节

### 3.1 音频采集 (Audio Capture)

使用 `ScreenCaptureKit` 能够高效捕获系统音频，同时需要 `AVCaptureSession` 捕获麦克风。

**实现策略**:
1.  **权限申请**: 在 `Info.plist` 中添加 `NSMicrophoneUsageDescription`，并动态申请屏幕录制权限（macOS 需跳转系统设置）。
2.  **混合音频**:
    - 创建两个音频流：一个来自麦克风，一个来自 `SCStream` (ScreenCaptureKit)。
    - 将两个流的音频 Buffer 统一转换为 Whisper 需要的格式（通常是 16kHz, Mono, Float32）。
    - 简单混合：`Output = (Mic + System) / 2`，或者保留双声道，左声道麦克风，右声道系统音（便于后续说话人分离）。建议MVP阶段先做简单混合。

### 3.2 实时转写 (Real-time ASR)

集成 `whisper.cpp` 的 Swift 包 (如 `swift-whisper` 或直接集成源码)。

**流程**:
1.  **模型加载**: 应用启动时异步加载量化后的 GGML 模型文件（如 `ggml-base.en.bin` 或 `ggml-base.bin`）。
2.  **流式处理**:
    - 音频数据积累到一定长度（如 30ms 或 500ms）送入 VAD 检测。
    - 检测到语音后，将数据送入 Whisper 缓冲区。
    - 调用 Whisper 的流式接口（`whisper_full` 或类似），设置 `print_realtime` 或回调函数获取中间结果。
3.  **字幕更新**:
    - 中间结果（Partial Result）实时更新悬浮窗。
    - 确定结果（Confirmed Result）写入数据库。

### 3.3 AI 总结 (AI Summary)

**Prompt 设计**:
需要设计一套高效的 Prompt 模板。

```text
You are a professional meeting assistant.
Here is the transcript of a meeting:
{{TRANSCRIPT}}

Please summarize the meeting content structure as follows:
1. One-sentence summary
2. Key Topics (Bullet points)
3. Action Items (Who needs to do what)
4. Detailed Notes
```

**网络层**:
使用 `URLSession` 发送 POST 请求到 `https://openrouter.ai/api/v1/chat/completions`。
Header 需要包含 `Authorization: Bearer <USER_KEY>` 和 `HTTP-Referer`.

### 3.4 数据存储 (Storage)

使用 SwiftData 定义模型：

```swift
@Model
class Meeting {
    var id: UUID
    var title: String
    var startTime: Date
    var endTime: Date?
    var transcript: String // 全文
    var summary: String?   // AI 总结
    var actionItems: [String]?

    // ... relations
}
```

---

## 4. 安全性与隐私

### 4.1 Keychain 集成
API Key 属于敏感信息，**严禁**明文存储在 UserDefaults。
使用 `Security` 框架或第三方库（如 `KeychainAccess`）将 OpenRouter API Key 存入系统 Keychain。

### 4.2 沙盒 (Sandbox)
macOS App Store 发布必须开启沙盒。
- `com.apple.security.device.audio-input`: TRUE (麦克风)
- `com.apple.security.network.client`: TRUE (API 请求)
- **注意**: ScreenCaptureKit 在沙盒环境下可用，但需要用户明确授权。

---

## 5. 性能优化

- **模型量化**: 必须使用 CoreML 优化版或 Int8/Int5 quant 版本的 Whisper 模型，以降低内存占用和推理延迟。
- **后台处理**: 转写过程应放在后台线程（GCD `DispatchQueue.global(qos: .userInitiated)`），避免阻塞 UI 主线程。
- **内存管理**: 长时间会议可能导致音频 Buffer 堆积，需实现环形缓冲区或定期释放已处理的音频数据。
