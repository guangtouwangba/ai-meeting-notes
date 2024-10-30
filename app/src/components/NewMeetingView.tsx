import React, { useState } from 'react';
import { ArrowLeftIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/solid';
import { createMeeting } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface NewMeetingViewProps {
  onBack: () => void;
  onSave: (meetingData: any) => void;
}

const NewMeetingView: React.FC<NewMeetingViewProps> = ({ onBack, onSave }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [primaryLanguage, setPrimaryLanguage] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>([]);
  const [audioSource, setAudioSource] = useState('');
  const [speaker, setSpeaker] = useState('');
  
  const [realTimeTranslation, setRealTimeTranslation] = useState(false);
  const [speakerIdentification, setSpeakerIdentification] = useState(false);
  const [technicalTermRecognition, setTechnicalTermRecognition] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const languages = ['English', 'Spanish', 'Chinese', 'French', 'German', 'Japanese'];

  const navigate = useNavigate();

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    const meetingData = {
      title,
      description,
      target_lang: targetLanguage || 'en',
      source_lang: primaryLanguage || 'en',
      start_time: new Date().toISOString(),
      end_time: new Date().toISOString(),
      speaker,
      transcriber_settings: {
        realTimeTranslation,
        speakerIdentification,
        technicalTermRecognition,
      },
    };

    console.log('meetingData:', meetingData);

    try {
      await onSave(meetingData);
      navigate('/');
    } catch (error) {
      console.error('保存失败:', error);
      setError(error instanceof Error ? error.message : '保存失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStart = () => {
    const meetingData = {
      title,
      primaryLanguage,
      supportedLanguages,
      audioSource,
      aiSettings: {
        realTimeTranslation,
        speakerIdentification,
        technicalTermRecognition,
      },
    };
    onStart(meetingData);
  };

  const onStart = (meetingData: any) => {
    console.log('onStart:', meetingData);
    // 跳转至录音页面，并携带参数
    navigate('/recording', { state: { meetingData } });
  };

  const toggleSupportedLanguage = (lang: string) => {
    setSupportedLanguages(prev => 
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-white shadow-md p-4 flex justify-between items-center">
        <button onClick={onBack} className="text-blue-500 hover:text-blue-600 flex items-center" title="返回仪表板">
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          返回
        </button>
        <h1 className="text-2xl font-bold">新建 AI 辅助会议</h1>
        <button 
          onClick={handleSave} 
          className={`bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isLoading}
        >
          {isLoading ? '保存中...' : '保存'}
        </button>
      </header>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">错误！</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <button onClick={handleStart} className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition duration-200">
              使用当前设置开始
            </button>
          </div>
          <form className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">会议标题</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="未命名会议"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="primaryLanguage" className="block text-sm font-medium text-gray-700">主要语言</label>
              <select
                id="primaryLanguage"
                value={primaryLanguage}
                onChange={(e) => setPrimaryLanguage(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                {languages.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="targetLanguage" className="block text-sm font-medium text-gray-700">目标语言</label>
              <select
                id="targetLanguage"
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                {languages.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="audioSource" className="block text-sm font-medium text-gray-700">音频源</label>
              <select
                id="audioSource"
                value={audioSource}
                onChange={(e) => setAudioSource(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="internal">内置麦克风</option>
                <option value="external">外置麦克风</option>
                <option value="system">系统音频</option>
              </select>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">AI 转录设置</h3>
              <div className="mt-2 space-y-2">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={realTimeTranslation}
                    onChange={(e) => setRealTimeTranslation(e.target.checked)}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                  <span className="ml-2">实时翻译</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={speakerIdentification}
                    onChange={(e) => setSpeakerIdentification(e.target.checked)}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                  <span className="ml-2">说话人识别</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={technicalTermRecognition}
                    onChange={(e) => setTechnicalTermRecognition(e.target.checked)}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                  <span className="ml-2">技术术语识别</span>
                </label>
              </div>
            </div>
          </form>
        </div>
      </main>
      <footer className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-end">
        <button
          onClick={handleStart}
          className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          开始 AI 辅助会议
        </button>
      </footer>
    </div>
  );
};

export default NewMeetingView;
