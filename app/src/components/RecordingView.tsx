import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import { useLocation } from 'react-router-dom';
import { 
  initWebSocket, 
  startRecording, 
  stopRecording, 
  sendAudioData,
  closeWebSocket,
  WebSocketHandlers 
} from '../services/api';

interface RecordingViewProps {
  onBack: () => void;
}

const RecordingView: React.FC<RecordingViewProps> = ({ onBack }) => {
  const location = useLocation();
  const meetingData = location.state?.meetingData;

  // 状态管理
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [volume, setVolume] = useState(0); // 添加音量状态

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const wsInitializedRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();

  // 初始化 WebSocket
  useEffect(() => {
    const initializeWebSocket = async () => {
      if (wsInitializedRef.current) return;

      const handlers: WebSocketHandlers = {
        onRecordingStarted: (data) => {
          console.log('Recording started:', data);
        },
        onAudioProcessed: (data) => {
          console.log('Audio processed:', data);
        },
        onTranscriptionUpdate: (text) => {
          setTranscription(prev => prev + ' ' + text);
        },
        onRecordingStopped: (data) => {
          console.log('Recording stopped:', data);
          setIsRecording(false);
        },
        onError: (error) => {
          console.error('WebSocket error:', error);
        }
      };

      try {
        await initWebSocket(handlers);
        wsInitializedRef.current = true;
      } catch (error) {
        console.error('Failed to initialize WebSocket:', error);
      }
    };

    initializeWebSocket();

    return () => {
      closeWebSocket();
      wsInitializedRef.current = false;
    };
  }, []);

  // 音量分析函数
  const analyzeVolume = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // 计算音量平均值
    const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
    setVolume(average);

    // 持续更新音量
    animationFrameRef.current = requestAnimationFrame(analyzeVolume);
  };

  // 开始录音
  const startMicrophoneRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // 创建 MediaRecorder
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'  // 指定格式
      });

      // 先发送开始录音的消息
      await startRecording(meetingData);  // 等待确认
      
      // 设置数据处理
      mediaRecorderRef.current.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          await sendAudioData(event.data);
        }
      };

      // 最后开始录音
      mediaRecorderRef.current.start(1000);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  // 停止录音
  const stopMicrophoneRecording = async () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        // 先通知服务器停止录音
        await stopRecording();
        
        // 等待最后一块数据发送完成
        mediaRecorderRef.current.addEventListener('dataavailable', async (event) => {
          if (event.data.size > 0) {
            await sendAudioData(event.data);
          }
        }, { once: true });

        // 停止录音
        mediaRecorderRef.current.stop();

        // 清理资源
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(track => track.stop());
        }
        
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }

        setIsRecording(false);
        setVolume(0);
      } catch (error) {
        console.error('Error stopping recording:', error);
      }
    }
  };

  // 清理函数
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handleStartStop = () => {
    if (isRecording) {
      stopMicrophoneRecording();
    } else {
      startMicrophoneRecording();
    }
  };

  return (
    <div className="flex h-screen">
      <div className="w-64 bg-gray-100 p-4">
        <div className="space-y-4">
          <button
            className="p-2 rounded-full hover:bg-gray-200 transition duration-200"
            onClick={onBack}
          >
            <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
          </button>
          <h2 className="text-lg font-semibold">录音控制：</h2>
          <button
            className={`w-full py-2 px-4 rounded-md text-white transition duration-200 ${
              isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
            }`}
            onClick={handleStartStop}
          >
            {isRecording ? "停止" : "开始"}
          </button>
          
          {/* 音量显示 */}
          {isRecording && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">当前音量</p>
              <div className="h-2 bg-gray-200 rounded">
                <div 
                  className="h-full bg-blue-500 rounded transition-all duration-100"
                  style={{ width: `${Math.min(100, (volume / 256) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 p-8">
        <div className="space-y-8">
          <h1 className="text-3xl font-bold">
            {meetingData ? `录制: ${meetingData.title}` : '正在录音'}
          </h1>
          <div>
            <p className="text-xl mb-2">实时转录：</p>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="whitespace-pre-wrap">{transcription || "等待转录..."}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordingView;