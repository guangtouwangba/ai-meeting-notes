import { Meeting } from '../models/Meeting';

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

// 新增的函数，用于转录音频
export const transcribeAudio = async (audioBlob: Blob, apiKey: string): Promise<string> => {
  try {
    const wavBlob = await convertToWav(audioBlob);
    const formData = new FormData();
    formData.append('file', wavBlob, 'audio.wav');
    formData.append('model', 'whisper-1');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.text; // 返回转录文本
  } catch (error) {
    console.error('转录错误:', error);
    throw error; // 抛出错误以便在调用处处理
  }
};

// 辅助函数：将音频 Blob 转换为 WAV 格式
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
