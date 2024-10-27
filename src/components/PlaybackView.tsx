import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  IconButton,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Progress,
  List,
  ListItem,
} from '@chakra-ui/react';
import { ArrowBackIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { FaPlay } from 'react-icons/fa/FaPlay';
import { FaPause } from 'react-icons/fa/FaPause';
import { FaStop } from 'react-icons/fa/FaStop';
import { PlayIcon, PauseIcon, StopIcon } from '@chakra-ui/icons';

interface PlaybackViewProps {
  onBack: () => void;
  recordingTitle: string;
  audioSrc: string;
  transcription: Array<{ time: number; speaker: string; text: string }>;
}

const PlaybackView: React.FC<PlaybackViewProps> = ({ onBack, recordingTitle, audioSrc, transcription }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [volume, setVolume] = useState(1);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.addEventListener('loadedmetadata', () => {
        setDuration(audioRef.current!.duration);
      });
      audioRef.current.addEventListener('timeupdate', () => {
        setCurrentTime(audioRef.current!.currentTime);
      });
    }
  }, []);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const handleSpeedChange = () => {
    const speeds = [1, 1.5, 2, 0.5];
    const nextSpeedIndex = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextSpeedIndex]);
    if (audioRef.current) {
      audioRef.current.playbackRate = speeds[nextSpeedIndex];
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleProgressChange = (newProgress: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = newProgress;
    }
  };

  const handleExportTranscription = () => {
    // 实现导出转录文本的逻辑
    console.log('Exporting transcription...');
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
          <Heading size="md">Playback Controls:</Heading>
          <HStack>
            <IconButton
              aria-label={isPlaying ? "Pause" : "Play"}
              icon={isPlaying ? <PauseIcon /> : <PlayIcon />}
              onClick={handlePlayPause}
            />
            <IconButton
              aria-label="Stop"
              icon={<StopIcon />}
              onClick={handleStop}
            />
          </HStack>
          <Button onClick={handleSpeedChange}>
            Speed: {playbackSpeed}x
          </Button>
          <Text>Volume:</Text>
          <Slider
            value={volume}
            onChange={handleVolumeChange}
            min={0}
            max={1}
            step={0.1}
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb />
          </Slider>
        </VStack>
      </Box>

      {/* 主内容区域 */}
      <Box flex={1} p={8}>
        <VStack spacing={8} align="stretch">
          <Heading>{recordingTitle}</Heading>
          <Text fontSize="2xl" fontWeight="bold">
            {formatTime(currentTime)} / {formatTime(duration)}
          </Text>
          <Slider
            value={currentTime}
            onChange={handleProgressChange}
            min={0}
            max={duration}
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb />
          </Slider>
          <Box>
            <Text fontSize="xl" mb={4}>Transcription:</Text>
            <List spacing={2}>
              {transcription.map((item, index) => (
                <ListItem key={index}>
                  {formatTime(item.time)} {item.speaker}: {item.text}
                </ListItem>
              ))}
            </List>
          </Box>
          <Button onClick={handleExportTranscription}>
            Export Transcription
          </Button>
        </VStack>
      </Box>
      <audio ref={audioRef} src={audioSrc} />
    </Flex>
  );
};

export default PlaybackView;
