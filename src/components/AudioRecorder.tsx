import React, { useRef, useState } from 'react';
import { Button, useToast, HStack } from '@chakra-ui/react';

interface AudioRecorderProps {
  onTranscriptionUpdate: (text: string) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onTranscriptionUpdate }) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const toast = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = async (e) => {
        chunksRef.current.push(e.data);
        if (chunksRef.current.length > 0) {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
          await transcribeAudio(audioBlob);
          chunksRef.current = [];
        }
      };

      mediaRecorderRef.current.start(10000);
      setIsRecording(true);
      
      toast({
        title: "Recording started",
        status: "success",
        duration: 2000,
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Failed to start recording",
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
        title: "Recording stopped",
        status: "info",
        duration: 2000,
      });
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('file', audioBlob);
      formData.append('model', 'whisper-1');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: formData,
      });

      const data = await response.json();
      onTranscriptionUpdate(data.text);
    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        title: "Transcription failed",
        status: "error",
        duration: 2000,
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