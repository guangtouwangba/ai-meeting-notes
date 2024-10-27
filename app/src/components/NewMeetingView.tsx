import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/solid';

interface NewMeetingViewProps {
  onBack: () => void;
  onSave: (meetingData: any) => void;
  onStart: (meetingData: any) => void;
}

const NewMeetingView: React.FC<NewMeetingViewProps> = ({ onBack, onSave, onStart }) => {
  const [title, setTitle] = useState('');
  const [primaryLanguage, setPrimaryLanguage] = useState('English');
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>([]);
  const [audioSource, setAudioSource] = useState('internal');
  const [realTimeTranslation, setRealTimeTranslation] = useState(false);
  const [speakerIdentification, setSpeakerIdentification] = useState(false);
  const [technicalTermRecognition, setTechnicalTermRecognition] = useState(false);
  const [showOptionalDetails, setShowOptionalDetails] = useState(false);

  const languages = ['English', 'Spanish', 'Chinese', 'French', 'German', 'Japanese'];

  useEffect(() => {
    // Auto-save logic here
  }, [title, primaryLanguage, supportedLanguages, audioSource, realTimeTranslation, speakerIdentification, technicalTermRecognition]);

  const handleSave = () => {
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
    onSave(meetingData);
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
        <button onClick={handleSave} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600" title="保存会议设置">
          保存
        </button>
      </header>
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
              <label className="block text-sm font-medium text-gray-700">支持的语言</label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {languages.map(lang => (
                  <label key={lang} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={supportedLanguages.includes(lang)}
                      onChange={() => toggleSupportedLanguage(lang)}
                      className="form-checkbox h-5 w-5 text-blue-600"
                    />
                    <span className="ml-2">{lang}</span>
                  </label>
                ))}
              </div>
              <button type="button" className="mt-2 text-sm text-blue-500 hover:text-blue-600">
                + 添加更多语言
              </button>
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
            <div>
              <button
                type="button"
                onClick={() => setShowOptionalDetails(!showOptionalDetails)}
                className="text-blue-500 hover:text-blue-600"
              >
                {showOptionalDetails ? '- 隐藏可选会议详情' : '+ 添加日期、时间、参与者'}
              </button>
              {showOptionalDetails && (
                <div className="mt-2 space-y-4">
                  {/* 添加日期、时间和参与者的输入字段 */}
                </div>
              )}
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
