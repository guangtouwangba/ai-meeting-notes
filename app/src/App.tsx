import React, { useState, useEffect } from 'react';
import { ChakraProvider, Box } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import NewMeetingView from './components/NewMeetingView';
import RecordingView from './components/RecordingView';
import PlaybackView from './components/PlaybackView';
import { getMeetings, Meeting } from './services/api';
import AudioRecorder from './components/AudioRecorder';
import { createMeetingAPI } from './services/meetingService';
import MeetingView from './components/MeetingView';

// AppContent 组件接收 props
interface AppContentProps {
  onStartPlayback: (meeting: Meeting) => void;
  onViewMeeting: (meeting: Meeting) => void;
}

const AppContent: React.FC<AppContentProps> = ({ onStartPlayback, onViewMeeting }) => {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalMeetings, setTotalMeetings] = useState(0);
  const [pageSize] = useState(20);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateMeeting = () => {
    navigate('/new-meeting');
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async (page: number = currentPage) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getMeetings(page, pageSize);
      console.log('获取到的会议列表:', response);
      setMeetings(response.data);
      setTotalMeetings(response.total);
      setCurrentPage(response.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取会议列表失败');
      console.error('获取会议列表失败:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchMeetings(newPage);
  };

  // 使用传入的 onStartPlayback
  const handleStartPlayback = (meeting: Meeting) => {
    onStartPlayback(meeting);
    navigate('/playback');
  };

  const handleSaveMeeting = async (meetingData: any) => {
    try {
      await createMeetingAPI(meetingData);
      navigate('/');
      // 可选：重新获取会议列表
      // await fetchMeetings();
    } catch (error) {
      console.error('创建会议失败:', error);
      throw error; // 将错误抛回给 NewMeetingView 组件处理
    }
  };

  return (
    <ChakraProvider>
      <Box p={8}>
        <div className="max-w-4xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold mb-4">AI Meeting Assistant</h1>
            <button
              onClick={handleCreateMeeting}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              创建新会议
            </button>
          </header>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
              <strong className="font-bold">错误！</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-4">加载中...</div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold mb-4">最近会议：</h2>
              {meetings.length === 0 ? (
                <p className="text-gray-500">暂无会议记录</p>
              ) : (
                <ul className="space-y-3">
                  {meetings.map((meeting) => (
                    <li
                      key={meeting.id}
                      className="bg-white p-3 rounded shadow hover:bg-gray-50 transition duration-200 group"
                    >
                      <div className="flex justify-between items-center">
                        <span 
                          className="cursor-pointer"
                          onClick={() => onViewMeeting(meeting)}
                        >
                          {meeting.title} ({new Date(meeting.start_time).toLocaleDateString()})
                        </span>
                        <button
                          className="hidden group-hover:block bg-blue-500 text-white py-1 px-3 rounded hover:bg-blue-600 transition duration-200"
                          onClick={() => onStartPlayback(meeting)}
                        >
                          播放
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <a href="#" className="text-blue-500 hover:underline mt-2 inline-block">
                查看全部
              </a>
              {!isLoading && meetings.length > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between items-center">
                    <span>
                      共 {totalMeetings} 条记录，第 {currentPage} 页
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                      >
                        上一页
                      </button>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage * pageSize >= totalMeetings}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                      >
                        下一页
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Box>
    </ChakraProvider>
  );
};

// 包含路由逻辑的组件
const AppRoutes: React.FC = () => {
  const [currentMeeting, setCurrentMeeting] = useState<Meeting | null>(null);
  const navigate = useNavigate();

  const handleStartPlayback = (meeting: Meeting) => {
    setCurrentMeeting(meeting);
    navigate('/playback');
  };

  const handleViewMeeting = (meeting: Meeting) => {
    setCurrentMeeting(meeting);
    navigate('/meeting');
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleSaveMeeting = async (meetingData: any) => {
    try {
      await createMeetingAPI(meetingData);
      navigate('/');
    } catch (error) {
      console.error('创建会议失败:', error);
      throw error;
    }
  };

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          <AppContent 
            onStartPlayback={handleStartPlayback}
            onViewMeeting={handleViewMeeting}
          />
        } 
      />
      <Route 
        path="/meeting" 
        element={
          currentMeeting ? (
            <MeetingView
              meeting={currentMeeting}
              onBack={handleBack}
            />
          ) : (
            <Navigate to="/" replace />
          )
        } 
      />
      <Route 
        path="/new-meeting" 
        element={
          <NewMeetingView 
            onBack={handleBack} 
            onSave={handleSaveMeeting}
          />
        } 
      />
      <Route 
        path="/recording" 
        element={<RecordingView onBack={handleBack} />} 
      />
      <Route 
        path="/audio-recorder" 
        element={<AudioRecorder />} 
      />
      <Route 
        path="/playback" 
        element={
          currentMeeting ? (
            <PlaybackView
              meeting={currentMeeting}
              onBack={handleBack}
            />
          ) : (
            <Navigate to="/" replace />
          )
        } 
      />
      <Route 
        path="/meeting/:id"
        element={<MeetingView onBack={handleBack} />}
      />
    </Routes>
  );
};

// 主 App 组件
const App: React.FC = () => {
  return (
    <Router>
      <ChakraProvider>
        <AppRoutes />
      </ChakraProvider>
    </Router>
  );
};

export default App;
