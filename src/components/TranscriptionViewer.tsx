import React from 'react';
import { Box, Text } from '@chakra-ui/react';

interface TranscriptionViewerProps {
  transcription: string;
}

const TranscriptionViewer: React.FC<TranscriptionViewerProps> = ({ transcription }) => {
  return (
    <Box
      w="100%"
      h="400px"
      p={4}
      borderWidth={1}
      borderRadius="lg"
      overflowY="auto"
      bg="white"
    >
      <Text>{transcription || "Transcription will appear here..."}</Text>
    </Box>
  );
};

export default TranscriptionViewer;