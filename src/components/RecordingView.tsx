import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Progress,
  IconButton,
  Textarea,
} from '@chakra-ui/react';
import { ArrowBackIcon, ChevronDownIcon } from '@chakra-ui/icons';
import AudioRecorder from './AudioRecorder';

interface RecordingViewProps {
  onBack: () => void;
}

const RecordingView: React.FC<RecordingViewProps> = ({ onBack }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcription, setTranscription] = useState('');
  const [micLevel, setMicLevel] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

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
        requestAnimationFrame(updateMicLevel);
      };
      updateMicLevel();
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopMicrophoneVisualization = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  const handleStartStop = () => {
    setIsRecording(!isRecording);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleTranscriptionUpdate = (text: string) => {
    setTranscription(prevTranscription => prevTranscription + ' ' + text);
  };

  return (
    <Flex h="100vh">
      {/* 左侧控制栏 */}
      <Box w="250px" bg="gray.100" p={4}>
        <VStack spacing={4} align="stretch">
          <IconButton
            aria-label="Back"
            icon={<ArrowBackIcon />}
            onClick={onBack}
          />
          <Heading size="md">Recording Controls:</Heading>
          <Button
            size="lg"
            onClick={handleStartStop}
            colorScheme={isRecording ? "red" : "green"}
          >
            {isRecording ? "Stop" : "Start"}
          </Button>
          <Button
            size="lg"
            onClick={handlePause}
            isDisabled={!isRecording}
          >
            {isPaused ? "Resume" : "Pause"}
          </Button>
        </VStack>
      </Box>

      {/* 主内容区域 */}
      <Box flex={1} p={8}>
        <VStack spacing={8} align="stretch">
          <Heading>Recording in Progress</Heading>
          <Text fontSize="6xl" fontWeight="bold" textAlign="center">
            {formatTime(recordingTime)}
          </Text>
          <Box>
            <Text mb={2}>Microphone Input Level:</Text>
            <Progress value={micLevel} max={255} size="lg" colorScheme="green" />
          </Box>
          <Box>
            <Text mb={2} fontSize="xl">Live Transcription:</Text>
            <Textarea
              value={transcription}
              readOnly
              minHeight="200px"
              fontSize="lg"
              bg="gray.50"
            />
          </Box>
        </VStack>
      </Box>
    </Flex>
  );
};

export default RecordingView;
