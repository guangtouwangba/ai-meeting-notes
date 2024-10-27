import React, { useState, useEffect } from 'react';
import {
  VStack,
  HStack,
  Box,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Text,
  Textarea,
  IconButton,
  Input,
  useToast,
} from '@chakra-ui/react';
import { EditIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons';
import { Meeting } from '../types';
import AudioRecorder from './AudioRecorder';
import TranscriptionViewer from './TranscriptionViewer';

interface MeetingViewProps {
  meeting: Meeting | undefined;
  onUpdateMeeting: (meeting: Meeting) => void;
}

const MeetingView: React.FC<MeetingViewProps> = ({ meeting, onUpdateMeeting }) => {
  if (!meeting) {
    return <div>请选择一个会议</div>; // 或者返回一个加载状态
  }

  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [notes, setNotes] = useState('');
  const toast = useToast();

  useEffect(() => {
    if (meeting) {
      setEditedTitle(meeting.title);
      setNotes(meeting.notes);
    }
  }, [meeting]);

  const handleTranscriptionUpdate = (newText: string) => {
    onUpdateMeeting({
      ...meeting,
      transcription: meeting.transcription + ' ' + newText,
    });
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
    onUpdateMeeting({
      ...meeting,
      notes: e.target.value,
    });
  };

  const handleTitleSave = () => {
    if (editedTitle.trim()) {
      onUpdateMeeting({
        ...meeting,
        title: editedTitle.trim(),
      });
      setIsEditing(false);
      toast({
        title: "Title updated",
        status: "success",
        duration: 2000,
      });
    }
  };

  const handleTitleCancel = () => {
    setEditedTitle(meeting.title);
    setIsEditing(false);
  };

  const generateSummary = async () => {
    // Here you would typically call an API to generate the summary
    // For now, we'll just set a placeholder
    onUpdateMeeting({
      ...meeting,
      summary: "Meeting summary will be generated here using AI...",
    });
  };

  const handleStopTranscript = async () => {
    try {
      // 停止转录的逻辑
      // 例如，调用 API 或更新状态
    } catch (error) {
      console.error('停止转录时出错:', error);
      // 显示错误消息
    }
  };

  return (
    <Box p={6}>
      <HStack justify="space-between" mb={6} spacing={4}>
        {isEditing ? (
          <>
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              size="lg"
              fontSize="2xl"
              fontWeight="bold"
              width="auto"
              flex="1"
            />
            <HStack spacing={2}>
              <IconButton
                aria-label="Save title"
                icon={<CheckIcon />}
                colorScheme="green"
                onClick={handleTitleSave}
              />
              <IconButton
                aria-label="Cancel editing"
                icon={<CloseIcon />}
                colorScheme="red"
                onClick={handleTitleCancel}
              />
            </HStack>
          </>
        ) : (
          <>
            <Text fontSize="2xl" fontWeight="bold">
              {meeting.title}
            </Text>
            <IconButton
              aria-label="Edit meeting title"
              icon={<EditIcon />}
              onClick={() => setIsEditing(true)}
            />
          </>
        )}
      </HStack>

      <Tabs>
        <TabList>
          <Tab>Recording</Tab>
          <Tab>Notes</Tab>
          <Tab>Summary</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <VStack spacing={4} align="stretch">
              <AudioRecorder onTranscriptionUpdate={handleTranscriptionUpdate} />
              <TranscriptionViewer transcription={meeting.transcription} />
            </VStack>
          </TabPanel>

          <TabPanel>
            <VStack spacing={4} align="stretch">
              <Textarea
                value={meeting.notes}
                onChange={handleNotesChange}
                placeholder="Add your meeting notes here..."
                minH="400px"
              />
            </VStack>
          </TabPanel>

          <TabPanel>
            <VStack spacing={4} align="stretch">
              <Button 
                colorScheme="blue" 
                onClick={generateSummary}
                isDisabled={!meeting.transcription}
              >
                Generate Summary
              </Button>
              {meeting.summary && (
                <Box p={4} borderWidth={1} borderRadius="md">
                  <Text>{meeting.summary}</Text>
                </Box>
              )}
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default MeetingView;
