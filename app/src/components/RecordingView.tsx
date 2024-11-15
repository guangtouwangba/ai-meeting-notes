import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import { useLocation, useNavigate } from 'react-router-dom';

interface RecordingViewProps {
  onBack: () => void;
}

interface MeetingData {
  title: string;
  primaryLanguage: string;
  supportedLanguages: string[];
  audioSource: string;
  aiSettings: {
    realTimeTranslation: boolean;
    speakerIdentification: boolean;
    technicalTermRecognition: boolean;
  };
}

const RecordingView: React.FC<RecordingViewProps> = ({ onBack }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const meetingData = location.state?.meetingData as MeetingData;

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [micLevel, setMicLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // 格式化时间的辅助函数
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return [hours, minutes, secs]
      .map(v => v < 10 ? "0" + v : v)
      .filter((v,i) => v !== "00" || i > 0)
      .join(":");
  };

  // 处理录音时间
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      // 设置音频可视化
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      // 创建 MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks(chunks => [...chunks, event.data]);
        }
      };

      // 开始录音
      mediaRecorder.start(1000); // 每秒收集一次数据
      setIsRecording(true);

      // 开始音频可视化
      const updateMicLevel = () => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
          setMicLevel(average);
          animationFrameRef.current = requestAnimationFrame(updateMicLevel);
        }
      };
      updateMicLevel();

    } catch (error) {
      console.error('Error starting recording:', error);
      setError('无法访问麦克风，请检查权限设置');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }

    // 停止所有音频处理
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    setIsRecording(false);
    setIsPaused(false);
  };

  const handlePause = () => {
    if (!isRecording) return;
    
    if (mediaRecorderRef.current) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
      } else {
        mediaRecorderRef.current.pause();
      }
    }
    setIsPaused(!isPaused);
  };

  const saveRecording = () => {
    if (audioChunks.length === 0) return;

    try {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const url = URL.createObjectURL(audioBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${meetingData?.title || 'recording'}_${new Date().toISOString()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error saving recording:', error);
      setError('保存录音失败，请重试');
    }
  };

  return (
    <div className="flex h-screen">
      {error && (
        <div className="absolute top-0 left-0 right-0 bg-red-100 border border-red-400 text-red-700 px-4 py-3">
          <strong className="font-bold">错误：</strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {/* 左侧控制栏 */}
      <div className="w-64 bg-gray-100 p-4">
        <div className="space-y-4">
          <button
            className="p-2 rounded-full hover:bg-gray-200 transition duration-200"
            onClick={onBack}
          >
            <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
          </button>
          <h2 className="text-lg font-semibold">录音控制：</h2>
          {meetingData && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-600">会议信息：</h3>
              <p className="text-sm">{meetingData.title}</p>
              <p className="text-sm">主要语言：{meetingData.primaryLanguage}</p>
              <p className="text-sm">音频源：{meetingData.audioSource}</p>
            </div>
          )}
          <button
            className={`w-full py-2 px-4 rounded-md text-white transition duration-200 ${
              isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
            }`}
            onClick={isRecording ? stopRecording : startRecording}
          >
            {isRecording ? "停止" : "开始"}
          </button>
          <button
            className={`w-full py-2 px-4 rounded-md transition duration-200 ${
              isRecording
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            onClick={handlePause}
            disabled={!isRecording}
          >
            {isPaused ? "继续" : "暂停"}
          </button>
          <button
            className={`w-full py-2 px-4 rounded-md transition duration-200 ${
              audioChunks.length > 0
                ? 'bg-purple-500 text-white hover:bg-purple-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            onClick={saveRecording}
            disabled={audioChunks.length === 0}
          >
            保存录音
          </button>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 p-8">
        <div className="space-y-8">
          <h1 className="text-3xl font-bold">
            {meetingData ? `录制: ${meetingData.title}` : '正在录音'}
          </h1>
          <div className="text-6xl font-bold text-center">
            {formatTime(recordingTime)}
          </div>
          <div>
            <p className="mb-2">麦克风输入：</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-green-500 h-2.5 rounded-full transition-all duration-100"
                style={{ width: `${(micLevel / 255) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordingView;
