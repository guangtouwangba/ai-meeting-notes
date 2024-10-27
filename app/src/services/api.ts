import { Meeting } from '../models/Meeting';

// 从环境变量或配置文件中获取后端 host
const API_HOST = import.meta.env.VITE_API_HOST || 'http://localhost:3000';

let meetingCount = 0; // 用于跟踪会议数量

export const fetchMeetings = (): Meeting[] => {
  // 这里可以添加从服务器获取会议的逻辑
  return []; // 返回一个空数组作为示例
};

export const createMeetingAPI = (meetings: Meeting[]): Meeting => {
  meetingCount = meetings.length + 1; // 更新会议数量
  const otherMeetingData = {
    title: `New Meeting ${meetingCount}`, // 动态生成标题
    date: new Date(), // 设置当前时间为会议日期
    participants: [], // 初始化参与者为空数组
  };
  return { id: new Date().toISOString(), ...otherMeetingData };
};

// 使用文件传输的转录接口
export const transcribeAudioFile = async (audioFile: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('audio', audioFile);

    const response = await fetch(`${API_HOST}/api/transcribe/file`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.transcription;
  } catch (error) {
    console.error('转录错误:', error);
    throw error;
  }
};

// 使用 blob 传输的转录接口
export const transcribeAudioBlob = async (audioBlob: Blob): Promise<string> => {
  try {
    const response = await fetch(`${API_HOST}/api/transcribe/blob`, {
      method: 'POST',
      body: audioBlob,
      headers: {
        'Content-Type': audioBlob.type,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.transcription;
  } catch (error) {
    console.error('转录错误:', error);
    throw error;
  }
};

// 实时转换字幕的接口
export const realTimeTranscribe = async (audioChunk: Blob): Promise<string> => {
  try {
    const response = await fetch(`${API_HOST}/api/transcribe/realtime`, {
      method: 'POST',
      body: audioChunk,
      headers: {
        'Content-Type': audioChunk.type,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.transcription;
  } catch (error) {
    console.error('实时转录错误:', error);
    throw error;
  }
};

// 保留原有的辅助函数，以防需要在客户端进行音频处理
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
