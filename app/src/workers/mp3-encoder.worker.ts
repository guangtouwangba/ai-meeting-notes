import lamejs from 'lamejs';

self.onmessage = async (e) => {
  try {
    const { audioBuffer, numberOfChannels, sampleRate } = e.data;

    // 创建 MP3 编码器
    const mp3Encoder = new lamejs.Mp3Encoder(numberOfChannels, sampleRate, 128);
    const mp3Data = [];

    // 处理每个通道
    const samples = new Int16Array(audioBuffer.length * numberOfChannels);
    let offset = 0;
    for (let i = 0; i < numberOfChannels; i++) {
      const channelData = audioBuffer[i];
      for (let j = 0; j < channelData.length; j++) {
        const sample = Math.max(-1, Math.min(1, channelData[j]));
        samples[offset++] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      }
    }

    const mp3buf = mp3Encoder.encodeBuffer(samples);
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }

    const end = mp3Encoder.flush();
    if (end.length > 0) {
      mp3Data.push(end);
    }

    // 发送编码后的数据回主线程
    self.postMessage({ success: true, data: mp3Data });
  } catch (error) {
    self.postMessage({ success: false, error: error.message });
  }
}; 