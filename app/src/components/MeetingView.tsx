import React, { useState, useEffect } from 'react';
import { Meeting } from '../types';
import AudioRecorder from './AudioRecorder';
import TranscriptionViewer from './TranscriptionViewer';

interface MeetingViewProps {
  meeting: Meeting | undefined;
  onUpdateMeeting: (meeting: Meeting) => void;
}

const MeetingView: React.FC<MeetingViewProps> = ({ meeting, onUpdateMeeting }) => {
  if (!meeting) {
    return <div className="p-4">请选择一个会议</div>;
  }

  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [notes, setNotes] = useState('');

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
      // 这里可以添加一个成功提示
    }
  };

  const handleTitleCancel = () => {
    setEditedTitle(meeting.title);
    setIsEditing(false);
  };

  const generateSummary = async () => {
    onUpdateMeeting({
      ...meeting,
      summary: "Meeting summary will be generated here using AI...",
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        {isEditing ? (
          <div className="flex items-center space-x-2 w-full">
            <input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="text-2xl font-bold flex-grow px-2 py-1 border rounded"
            />
            <button
              onClick={handleTitleSave}
              className="p-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              ✓
            </button>
            <button
              onClick={handleTitleCancel}
              className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold">{meeting.title}</h1>
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              ✎
            </button>
          </div>
        )}
      </div>

      <div className="mb-4">
        <div className="flex border-b">
          <button className="py-2 px-4 border-b-2 border-blue-500">录音</button>
          <button className="py-2 px-4">笔记</button>
          <button className="py-2 px-4">总结</button>
        </div>

        <div className="mt-4">
          <div className="space-y-4">
            <AudioRecorder onTranscriptionUpdate={handleTranscriptionUpdate} />
            <TranscriptionViewer transcription={meeting.transcription} />
          </div>

          <div className="hidden">
            <textarea
              value={meeting.notes}
              onChange={handleNotesChange}
              placeholder="在此添加会议笔记..."
              className="w-full h-96 p-2 border rounded resize-none"
            />
          </div>

          <div className="hidden space-y-4">
            <button 
              onClick={generateSummary}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              disabled={!meeting.transcription}
            >
              生成总结
            </button>
            {meeting.summary && (
              <div className="p-4 border rounded">
                <p>{meeting.summary}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingView;
