import React, { useState } from 'react';
import { generateSummary } from '../../services/api';

interface SummaryViewProps {
  transcript: string;
}

const SummaryView: React.FC<SummaryViewProps> = ({ transcript }) => {
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');

  const handleSummarize = async () => {
    if (!apiKey) {
      alert("Please enter OpenRouter API Key");
      return;
    }
    setLoading(true);
    try {
      const result = await generateSummary(transcript, apiKey);
      setSummary(result);
    } catch (e) {
      alert("Error generating summary: " + e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded shadow mt-4">
      <h2 className="text-xl font-bold mb-2">AI Summary</h2>

      <div className="mb-4">
        <label className="block text-sm font-bold mb-2">OpenRouter API Key:</label>
        <input
          type="password"
          className="border rounded w-full py-2 px-3"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-or-..."
        />
      </div>

      <button
        onClick={handleSummarize}
        disabled={loading || !transcript}
        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
      >
        {loading ? 'Generating...' : 'Generate Summary'}
      </button>

      {summary && (
        <div className="mt-4 p-4 bg-gray-50 rounded whitespace-pre-wrap">
          <h3 className="font-bold">Summary Result:</h3>
          {summary}
        </div>
      )}
    </div>
  );
};

export default SummaryView;
