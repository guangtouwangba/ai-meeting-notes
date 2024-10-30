import React, { useRef, useState } from 'react';
import { transcribeAudio } from '../services/api';

interface AudioRecorderProps {
  onTranscriptionUpdate: (text: string) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onTranscriptionUpdate }) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const meetingData = useState<any>(null)[0]; // 修正为只获取状态值

  const startRecording = async () => {
    console.log('Meeting Data:', meetingData);
    try {
      console.log('meetingData:', meetingData);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mimeTypes = ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav'];
      let selectedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || '';
      
      mediaRecorderRef.current = new MediaRecorder(stream, selectedMimeType ? { mimeType: selectedMimeType } : undefined);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = async (e) => {
        chunksRef.current.push(e.data);
        if (mediaRecorderRef.current?.state === "inactive") {
          const audioBlob = new Blob(chunksRef.current, { type: selectedMimeType || 'audio/webm' });
          await handleTranscription(audioBlob);
          chunksRef.current = [];
        }
      };

      mediaRecorderRef.current.start(10000);
      setIsRecording(true);
      
      showToast("录音开始", `使用的音频格式: ${selectedMimeType || '默认'}`, "success");
    } catch (error) {
      console.error('开始录音时出错:', error);
      showToast("开始录音失败", `错误: ${error instanceof Error ? error.message : String(error)}`, "error");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      showToast("录音停止", "", "info");
    }
  };

  const handleTranscription = async (audioBlob: Blob) => {
    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      const transcription = await transcribeAudio(audioBlob, apiKey);
      onTranscriptionUpdate(transcription);
    } catch (error) {
      console.error('转录错误:', error);
      showToast("转录失败", `错误: ${error instanceof Error ? error.message : String(error)}`, "error");
    }
  };

  const showToast = (title: string, description: string, status: 'success' | 'error' | 'info') => {
    // 这里可以实现一个简单的 toast 通知
    console.log(`[${status.toUpperCase()}] ${title}: ${description}`);
  };

  return (
    <div className="flex space-x-4">
      <button
        className={`px-4 py-2 rounded-md text-white transition-colors duration-200 ${
          isRecording
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-green-500 hover:bg-green-600'
        }`}
        onClick={isRecording ? stopRecording : startRecording}
      >
        {isRecording ? "停止录音" : "开始录音"}
      </button>
    </div>
  );
};

export default AudioRecorder;
