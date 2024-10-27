import React, { useState } from 'react';
import {
  ChakraProvider,
  Box,
  Flex,
  VStack,
  Heading,
  Button,
  List,
  ListItem,
  Text,
  Image,
} from '@chakra-ui/react';
import { Meeting } from './models/Meeting';
import { createMeeting, getMeetings } from './services/meetingService';
import RecordingView from './components/RecordingView';
import PlaybackView from './components/PlaybackView';

const App: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>(getMeetings());
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayback, setIsPlayback] = useState(false);
  const [currentMeeting, setCurrentMeeting] = useState<Meeting | null>(null);

  const handleCreateMeeting = () => {
    const newMeeting = createMeeting(meetings);
    setMeetings([...meetings, newMeeting]);
    setActiveMeetingId(newMeeting.id);
  };

  const handleStartRecording = () => {
    setIsRecording(true);
  };

  const handleBackFromRecording = () => {
    setIsRecording(false);
  };

  const handleStartPlayback = (meeting: Meeting) => {
    setCurrentMeeting(meeting);
    setIsPlayback(true);
  };

  const handleBackFromPlayback = () => {
    setIsPlayback(false);
    setCurrentMeeting(null);
  };

  return (
    <ChakraProvider>
      {isPlayback && currentMeeting ? (
        <PlaybackView
          onBack={handleBackFromPlayback}
          recordingTitle={currentMeeting.title}
          audioSrc={currentMeeting.audioUrl}
          transcription={currentMeeting.transcription}
        />
      ) : isRecording ? (
        <RecordingView onBack={handleBackFromRecording} />
      ) : (
        <Flex h="100vh">
          {/* 左侧边栏 */}
          <Box w="250px" bg="gray.100" p={4}>
            <VStack spacing={4} align="stretch">
              <Image src="/path/to/your/logo.png" alt="App Logo" />
              <Button onClick={handleCreateMeeting}>New Meeting</Button>
              <Button>Recordings</Button>
              <Button>Settings</Button>
            </VStack>
          </Box>

          {/* 主内容区域 */}
          <Box flex={1} p={8}>
            <VStack spacing={8} align="stretch">
              <Heading>Welcome to AI Meeting Assistant</Heading>
              
              <Box>
                <Text fontSize="xl" mb={4}>Quick Start:</Text>
                <Flex>
                  <Button colorScheme="blue" mr={4} onClick={handleStartRecording}>Start New Recording</Button>
                  <Button>Open Recent</Button>
                </Flex>
              </Box>

              <Box>
                <Text fontSize="xl" mb={4}>Recent Recordings:</Text>
                <List spacing={3}>
                  {meetings.slice(0, 3).map((meeting) => (
                    <ListItem key={meeting.id}>
                      {meeting.title} ({new Date(meeting.date).toLocaleDateString()}, Duration: N/A)
                    </ListItem>
                  ))}
                </List>
              </Box>
            </VStack>
          </Box>
        </Flex>
      )}
    </ChakraProvider>
  );
};

export default App;
