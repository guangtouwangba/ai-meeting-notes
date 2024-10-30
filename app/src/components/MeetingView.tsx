import React from 'react';
import { Box, Heading, Text, Button, VStack, HStack } from '@chakra-ui/react';
import { Meeting } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface MeetingViewProps {
  meeting: Meeting;
  onBack: () => void;
}

const MeetingView: React.FC<MeetingViewProps> = ({ meeting, onBack }) => {
  const navigate = useNavigate();

  const handleStartRecording = () => {
    navigate('/recording');
  };

  return (
    <Box p={8}>
      <VStack align="stretch" spacing={6}>
        <HStack justify="space-between">
          <Button onClick={onBack} variant="outline">
            返回
          </Button>
          <Button colorScheme="blue" onClick={handleStartRecording}>
            开始录制
          </Button>
        </HStack>

        <Heading size="lg">{meeting.title}</Heading>

        <Box>
          <Text fontWeight="bold" mb={2}>会议详情：</Text>
          <Text>描述：{meeting.description || '无'}</Text>
          <Text>源语言：{meeting.source_lang}</Text>
          <Text>目标语言：{meeting.target_lang}</Text>
          <Text>开始时间：{new Date(meeting.start_time).toLocaleString()}</Text>
          <Text>结束时间：{new Date(meeting.end_time).toLocaleString()}</Text>
          <Text>发言人：{meeting.speaker || '未指定'}</Text>
        </Box>

        <Box>
          <Text fontWeight="bold" mb={2}>转录设置：</Text>
          <Text>实时翻译：{meeting.transcriber_settings.realTimeTranslation ? '是' : '否'}</Text>
          <Text>说话人识别：{meeting.transcriber_settings.speakerIdentification ? '是' : '否'}</Text>
          <Text>专业术语识别：{meeting.transcriber_settings.technicalTermRecognition ? '是' : '否'}</Text>
        </Box>
      </VStack>
    </Box>
  );
};

export default MeetingView;
