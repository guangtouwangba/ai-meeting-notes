import React from 'react';

interface PlaybackViewProps {
  onBack: () => void;
  recordingTitle: string;
  audioSrc: string;
  transcription: string;
}

const PlaybackView: React.FC<PlaybackViewProps> = ({ onBack, recordingTitle, audioSrc, transcription }) => {
    return (
        <div className="flex flex-col h-screen bg-gray-100">
            <header className="bg-white shadow-md p-4">
                <button onClick={onBack} className="text-blue-500 hover:text-blue-600">
                    &larr; 返回
                </button>
            </header>
            <main className="flex-1 p-8">
                <h1 className="text-2xl font-bold mb-4">{recordingTitle}</h1>
                <div className="bg-white shadow-md rounded-lg p-6">
                    <audio controls src={audioSrc} className="w-full mb-4" />
                    <h2 className="text-xl font-semibold mb-2">转录</h2>
                    <p className="whitespace-pre-wrap">{transcription}</p>
                </div>
            </main>
        </div>
    );
};

export default PlaybackView;
