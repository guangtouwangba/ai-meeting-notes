import React, { useState } from 'react';
import { Box, Heading, Text, Button, VStack, HStack } from '@chakra-ui/react';
import { Meeting } from '../services/api';
import { useNavigate } from 'react-router-dom';
import AudioRecorder from './AudioRecorder';
import SummaryView from './Summary/SummaryView';

interface MeetingViewProps {
  meeting: Meeting;
  onBack: () => void;
}

const MeetingView: React.FC<MeetingViewProps> = ({ meeting, onBack }) => {
  const navigate = useNavigate();
  const [transcript, setTranscript] = useState<string>('');

  const handleTranscriptionUpdate = (newText: string) => {
    setTranscript(prev => prev + '\n' + newText);
  };

  return (
    <Box p={8}>
      <VStack align="stretch" spacing={6}>
        <HStack justify="space-between">
          <Button onClick={onBack} variant="outline">
            Back
          </Button>
        </HStack>

        <Heading size="lg">{meeting.title}</Heading>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded shadow">
             <Text fontWeight="bold" mb={4}>Real-time Transcription</Text>
             <AudioRecorder onTranscriptionUpdate={handleTranscriptionUpdate} />
             <div className="mt-4 p-4 bg-gray-50 rounded h-96 overflow-y-auto whitespace-pre-wrap border">
               {transcript || 'Waiting for audio...'}
             </div>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <SummaryView transcript={transcript} />
          </div>
        </div>
      </VStack>
    </Box>
  );
};

export default MeetingView;
