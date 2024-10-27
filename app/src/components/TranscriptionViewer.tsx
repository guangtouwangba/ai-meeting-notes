import React from 'react';

interface TranscriptionViewerProps {
  transcription: string;
}

const TranscriptionViewer: React.FC<TranscriptionViewerProps> = ({ transcription }) => {
  return (
    <div className="w-full h-96 p-4 border border-gray-200 rounded-lg overflow-y-auto bg-white">
      <p className="text-gray-700">
        {transcription || "转录将在此处显示..."}
      </p>
    </div>
  );
};

export default TranscriptionViewer;
