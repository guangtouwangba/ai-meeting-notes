import React from 'react';
import {
  VStack,
  Button,
  List,
  ListItem,
  Text,
  Box,
} from '@chakra-ui/react';
import { Meeting } from '../types';
import { formatDate } from '../utils/dateUtils';

interface SidebarProps {
  meetings: Meeting[];
  activeMeetingId: string | null;
  onSelectMeeting: (id: string) => void;
  onCreateMeeting: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  meetings,
  activeMeetingId,
  onSelectMeeting,
  onCreateMeeting,
}) => {
  return (
    <VStack h="100%" p={4} spacing={4} align="stretch">
      <Button
        colorScheme="blue"
        onClick={onCreateMeeting}
        size="lg"
        w="100%"
      >
        New Meeting
      </Button>

      <List spacing={2}>
        {meetings.map((meeting) => (
          <ListItem
            key={meeting.id}
            onClick={() => onSelectMeeting(meeting.id)}
            cursor="pointer"
            p={3}
            bg={activeMeetingId === meeting.id ? 'blue.50' : 'transparent'}
            borderRadius="md"
            _hover={{ bg: 'blue.50' }}
          >
            <Text fontWeight="bold" fontSize="md">
              {meeting.title}
            </Text>
            <Text fontSize="sm" color="gray.600">
              {formatDate(meeting.date)}
            </Text>
          </ListItem>
        ))}
      </List>
    </VStack>
  );
};

export default Sidebar;