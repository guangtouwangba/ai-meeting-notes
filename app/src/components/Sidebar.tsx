import React from 'react';
import { Meeting } from '../types';
import { HomeIcon, CalendarIcon, MicrophoneIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

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
    <aside className="w-64 bg-white shadow-md flex flex-col h-full">
      <div className="p-4">
        <img src="/path/to/your/logo.png" alt="App Logo" className="mb-8" />
        <nav className="space-y-2">
          <button className="w-full flex items-center text-left py-2 px-4 rounded-md hover:bg-gray-100 transition duration-200" title="仪表盘">
            <HomeIcon className="h-5 w-5 mr-3" />
            仪表盘
          </button>
          <button className="w-full flex items-center text-left py-2 px-4 rounded-md hover:bg-gray-100 transition duration-200" title="查看所有会议">
            <CalendarIcon className="h-5 w-5 mr-3" />
            会议
          </button>
          <button className="w-full flex items-center text-left py-2 px-4 rounded-md hover:bg-gray-100 transition duration-200" title="查看所有录音">
            <MicrophoneIcon className="h-5 w-5 mr-3" />
            录音
          </button>
          <button className="w-full flex items-center text-left py-2 px-4 rounded-md hover:bg-gray-100 transition duration-200" title="调整应用设置">
            <Cog6ToothIcon className="h-5 w-5 mr-3" />
            设置
          </button>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
