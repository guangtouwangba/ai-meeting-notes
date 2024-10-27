import React, { useRef, useState } from 'react';
import { Button, useToast, HStack } from '@chakra-ui/react';
import { transcribeAudio } from '../services/api'; // 导入 transcribeAudio 函数

interface AudioRecorderProps {
  onTranscriptionUpdate: (text: string) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onTranscriptionUpdate }) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const toast = useToast();

  const convertToWav = async (audioBlob: Blob): Promise<Blob> => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const numberOfChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length * numberOfChannels * 2;
    const buffer = new ArrayBuffer(44 + length);
    const view = new DataView(buffer);
    
    // WAV 文件头
    writeUTFBytes(view, 0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeUTFBytes(view, 8, 'WAVE');
    writeUTFBytes(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, audioBuffer.sampleRate, true);
    view.setUint32(28, audioBuffer.sampleRate * 2 * numberOfChannels, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeUTFBytes(view, 36, 'data');
    view.setUint32(40, length, true);
  
    const data = new Float32Array(audioBuffer.length * numberOfChannels);
    let offset = 0;
    for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
      data.set(audioBuffer.getChannelData(i), offset);
      offset += audioBuffer.length;
    }
  
    floatTo16BitPCM(view, 44, data);
  
    return new Blob([buffer], { type: 'audio/wav' });
  };
  
  const writeUTFBytes = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  const floatTo16BitPCM = (output: DataView, offset: number, input: Float32Array) => {
    for (let i = 0; i < input.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // 检查支持的音频格式
      const mimeTypes = [
        'audio/webm',
        'audio/mp4',
        'audio/ogg',
        'audio/wav'
      ];
      
      let selectedMimeType = '';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }
      
      if (!selectedMimeType) {
        console.warn('No supported mime types found. Using default.');
      }
      
      mediaRecorderRef.current = new MediaRecorder(stream, selectedMimeType ? { mimeType: selectedMimeType } : undefined);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = async (e) => {
        chunksRef.current.push(e.data);
        if (mediaRecorderRef.current?.state === "inactive") {
          const audioBlob = new Blob(chunksRef.current, { type: selectedMimeType || 'audio/webm' });
          await transcribeAudio(audioBlob);
          chunksRef.current = [];
        }
      };

      mediaRecorderRef.current.start(10000); // 每10秒触发一次ondataavailable事件
      setIsRecording(true);
      
      toast({
        title: "录音开始",
        description: `使用的音频格式: ${selectedMimeType || '默认'}`,
        status: "success",
        duration: 2000,
      });
    } catch (error) {
      console.error('开始录音时出错:', error);
      toast({
        title: "开始录音失败",
        description: `错误: ${error instanceof Error ? error.message : String(error)}`,
        status: "error",
        duration: 2000,
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      toast({
        title: "录音停止",
        status: "info",
        duration: 2000,
      });
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      console.log('Original audio blob type:', audioBlob.type);
      console.log('Original audio blob size:', audioBlob.size);

      const apiKey = import.meta.env.VITE_OPENAI_API_KEY; // 获取 API 密钥
      const transcription = await transcribeAudio(audioBlob, apiKey); // 调用新的 transcribeAudio 函数
      console.log('Transcription result:', transcription);
      onTranscriptionUpdate(transcription);
    } catch (error) {
      console.error('详细的转录错误:', error);
      if (error instanceof Error) {
        console.error('错误消息:', error.message);
        console.error('错误堆栈:', error.stack);
      }
      toast({
        title: "转录失败",
        description: `错误: ${error instanceof Error ? error.message : String(error)}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <HStack spacing={4}>
      <Button
        colorScheme={isRecording ? "red" : "green"}
        onClick={isRecording ? stopRecording : startRecording}
      >
        {isRecording ? "Stop Recording" : "Start Recording"}
      </Button>
    </HStack>
  );
};

export default AudioRecorder;
