/// <reference types="vite/client" />

interface Window {
  electronAPI: {
    saveFile: () => Promise<string>;
    saveTranscription: (filePath: string, content: string) => Promise<boolean>;
  }
}