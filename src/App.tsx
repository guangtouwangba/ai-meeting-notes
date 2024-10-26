import React, { useState } from 'react';
import { 
  ChakraProvider,
  Grid,
  GridItem,
  useToast
} from '@chakra-ui/react';
import Sidebar from './components/Sidebar';
import MeetingView from './components/MeetingView';
import { Meeting } from './types';

const App: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);
  const toast = useToast();

  const handleCreateMeeting = () => {
    const newMeeting: Meeting = {
      id: Date.now().toString(),
      title: `Meeting ${meetings.length + 1}`,
      date: new Date(),
      transcription: '',
      notes: '',
      audioUrl: null,
      summary: null
    };
    setMeetings([...meetings, newMeeting]);
    setActiveMeetingId(newMeeting.id);
  };

  const handleUpdateMeeting = (updatedMeeting: Meeting) => {
    setMeetings(meetings.map(m => 
      m.id === updatedMeeting.id ? updatedMeeting : m
    ));
  };

  const activeMeeting = meetings.find(m => m.id === activeMeetingId);

  return (
    <ChakraProvider>
      <Grid
        templateColumns="300px 1fr"
        h="100vh"
        gap={0}
      >
        <GridItem borderRight="1px" borderColor="gray.200" bg="gray.50">
          <Sidebar 
            meetings={meetings}
            activeMeetingId={activeMeetingId}
            onSelectMeeting={setActiveMeetingId}
            onCreateMeeting={handleCreateMeeting}
          />
        </GridItem>
        <GridItem overflow="auto">
          <MeetingView
            meeting={activeMeeting}
            onUpdateMeeting={handleUpdateMeeting}
          />
        </GridItem>
      </Grid>
    </ChakraProvider>
  );
};

export default App;