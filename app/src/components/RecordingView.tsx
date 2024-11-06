import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import AudioRecorder from './AudioRecorder';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  initWebSocket, 
  startRecording, 
  stopRecording, 
  togglePauseRecording, 
  sendAudioData, 
  closeWebSocket 
} from '../services/api';

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

  // 如果没有会议数据，重定向回新建会议页面
  useEffect(() => {
    if (!meetingData) {
      navigate('/new-meeting');
    }
  }, [meetingData, navigate]);

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcription, setTranscription] = useState('');
  const [micLevel, setMicLevel] = useState(0);
  const [wsReady, setWsReady] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // 初始化 WebSocket 连接
  useEffect(() => {
    const connectWebSocket = async () => {
      try {
        await initWebSocket({
          onRecordingStarted: (data) => {
            console.log('Recording started:', data);
          },
          onAudioProcessed: (data) => {
            console.log('Audio processed:', data);
          },
          onRecordingStopped: (data) => {
            console.log('Recording stopped:', data);
          },
          onTranscriptionUpdate: (text) => {
            handleTranscriptionUpdate(text);
          }
        });
        setWsReady(true);
      } catch (error) {
        console.error('WebSocket connection failed:', error);
      }
    };

    connectWebSocket();

    return () => {
      closeWebSocket();
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  useEffect(() => {
    if (isRecording) {
      startMicrophoneVisualization();
    } else {
      stopMicrophoneVisualization();
    }
    return () => {
      stopMicrophoneVisualization();
    };
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return [hours, minutes, secs]
      .map(v => v < 10 ? "0" + v : v)
      .filter((v,i) => v !== "00" || i > 0)
      .join(":");
  };

  const startMicrophoneVisualization = async () => {
    try {
      console.log("startMicrophoneVisualization");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      const updateMicLevel = () => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
          setMicLevel(average);
        }
        animationFrameRef.current = requestAnimationFrame(updateMicLevel);
      };
      updateMicLevel();
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopMicrophoneVisualization = () => {
    console.log("stopMicrophoneVisualization");
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  };

  const handleStartStop = () => {
    console.log("handleStartStop");
    if (!wsReady) {
      console.error('WebSocket not ready');
      return;
    }

    if (!isRecording) {
      startRecording(meetingData);
    } else {
      stopRecording();
    }
    
    setIsRecording(!isRecording);
    setIsPaused(false);
  };

  const handlePause = () => {
    togglePauseRecording(isPaused);
    setIsPaused(!isPaused);
  };

  const handleTranscriptionUpdate = (text: string) => {
    setTranscription(prevTranscription => prevTranscription + ' ' + text);
  };

  return (
    <div className="flex h-screen">
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
            onClick={handleStartStop}
            disabled={!wsReady}
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
                className="bg-green-500 h-2.5 rounded-full"
                style={{ width: `${(micLevel / 255) * 100}%` }}
              ></div>
            </div>
          </div>
          <div>
            <p className="text-xl mb-2">实时转录：</p>
            <textarea
              value={transcription}
              readOnly
              className="w-full h-48 p-2 bg-gray-50 rounded-md resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordingView;
