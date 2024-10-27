import React, { useState } from 'react';
import { Meeting } from './models/Meeting';
import { createMeeting, getMeetings } from './services/meetingService';
import RecordingView from './components/RecordingView';
import PlaybackView from './components/PlaybackView';
import Sidebar from './components/Sidebar';
import { BellIcon, MicrophoneIcon, MagnifyingGlassIcon, UserCircleIcon } from '@heroicons/react/24/solid';
import NewMeetingView from './components/NewMeetingView';

const App: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>(getMeetings());
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayback, setIsPlayback] = useState(false);
  const [currentMeeting, setCurrentMeeting] = useState<Meeting | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewMeeting, setIsNewMeeting] = useState(false);

  const handleCreateMeeting = () => {
    setIsNewMeeting(true);
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

  const handleQuickRecord = () => {
    // Implement quick record functionality
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Implement search functionality
  };

  const handleSaveMeeting = (meetingData: any) => {
    // 实现保存会议数据的逻辑
    console.log('Saving meeting:', meetingData);
  };

  const handleStartMeeting = (meetingData: any) => {
    // 实现开始会议的逻辑
    console.log('Starting meeting:', meetingData);
    setIsRecording(true);
    setIsNewMeeting(false);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        meetings={meetings}
        activeMeetingId={activeMeetingId}
        onSelectMeeting={(id) => {
          const meeting = meetings.find(m => m.id === id);
          if (meeting) handleStartPlayback(meeting);
        }}
        onCreateMeeting={handleCreateMeeting}
      />
      <main className="flex-1 overflow-y-auto bg-gray-100">
        <div className="container mx-auto p-8">
          {/* <div className="flex justify-between items-center mb-8">
            <form onSubmit={handleSearch} className="flex-1 max-w-lg">
              <div className="relative">
                <input
                  type="text"
                  placeholder="搜索会议和录音..."
                  className="w-full pl-10 pr-4 py-2 rounded-full border focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </form>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleQuickRecord}
                className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600 transition duration-200"
                title="快速录音"
              >
                <MicrophoneIcon className="h-5 w-5" />
                <span>快速录音</span>
              </button>
              <button className="relative" title="通知">
                <BellIcon className="h-6 w-6 text-gray-600" />
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="relative" title="用户资料">
                <UserCircleIcon className="h-8 w-8 text-gray-600" />
              </button>
            </div>
          </div> */}

          {isNewMeeting ? (
            <NewMeetingView
              onBack={() => setIsNewMeeting(false)}
              onSave={handleSaveMeeting}
              onStart={handleStartMeeting}
            />
          ) : isPlayback && currentMeeting ? (
            <PlaybackView
              onBack={handleBackFromPlayback}
              recordingTitle={currentMeeting.title}
              audioSrc={currentMeeting.audioUrl}
              transcription={currentMeeting.transcription}
            />
          ) : isRecording ? (
            <RecordingView onBack={handleBackFromRecording} />
          ) : (
            <>
              <h1 className="text-3xl font-bold mb-8">AI 会议助手</h1>
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">快速操作：</h2>
                <div className="flex space-x-4">
                  <button
                    onClick={handleCreateMeeting}
                    className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-200"
                    title="创建新会议"
                  >
                    新建会议
                  </button>
                  <button
                    className="bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300 transition duration-200"
                    title="打开最近的录音"
                  >
                    打开最近
                  </button>
                </div>
              </div>
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">即将进行的会议：</h2>
                <ul className="space-y-3">
                  {meetings.slice(0, 2).map((meeting) => (
                    <li
                      key={meeting.id}
                      className="bg-white p-3 rounded shadow hover:bg-gray-50 transition duration-200 group"
                    >
                      <div className="flex justify-between items-center">
                        <span>{meeting.title} ({new Date(meeting.date).toLocaleDateString()}, {new Date(meeting.date).toLocaleTimeString()})</span>
                        <button
                          className="hidden group-hover:block bg-green-500 text-white py-1 px-3 rounded hover:bg-green-600 transition duration-200"
                          onClick={() => handleStartPlayback(meeting)}
                        >
                          ���始
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <a href="#" className="text-blue-500 hover:underline mt-2 inline-block">查看全部</a>
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-4">最近录音：</h2>
                <ul className="space-y-3">
                  {meetings.slice(0, 2).map((meeting) => (
                    <li
                      key={meeting.id}
                      className="bg-white p-3 rounded shadow hover:bg-gray-50 transition duration-200 group"
                    >
                      <div className="flex justify-between items-center">
                        <span>{meeting.title} ({new Date(meeting.date).toLocaleDateString()}, 时长：未知)</span>
                        <button
                          className="hidden group-hover:block bg-blue-500 text-white py-1 px-3 rounded hover:bg-blue-600 transition duration-200"
                          onClick={() => handleStartPlayback(meeting)}
                        >
                          播放
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <a href="#" className="text-blue-500 hover:underline mt-2 inline-block">查看全部</a>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
