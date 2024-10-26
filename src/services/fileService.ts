declare global {
  interface Window {
    electronAPI: {
      saveFile: () => Promise<string>;
      saveTranscription: (filePath: string, content: string) => Promise<boolean>;
    }
  }
}

export const saveTranscription = async (transcription: string): Promise<boolean> => {
  try {
    const savePath = await window.electronAPI.saveFile();
    if (!savePath) return false;

    const success = await window.electronAPI.saveTranscription(savePath, transcription);
    return success;
  } catch (error) {
    console.error('Error saving transcription:', error);
    return false;
  }
};