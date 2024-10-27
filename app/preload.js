const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveFile: async () => {
    return await ipcRenderer.invoke('select-save-location');
  },
  saveTranscription: async (filePath, content) => {
    return await ipcRenderer.invoke('save-transcription', { filePath, content });
  }
});