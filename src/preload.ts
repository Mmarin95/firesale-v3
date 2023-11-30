import { contextBridge, ipcRenderer } from "electron";
import Elements from "./renderer/elements";
import { renderMarkdown } from "./renderer/markdown";

ipcRenderer.on('file-opened', (_, content: string, filePath: string) => {
    Elements.MarkdownView.value = content;
    Elements.ShowFileButton.disabled = !filePath;
    Elements.OpenInDefaultApplicationButton.disabled = !filePath;
    renderMarkdown(content)
});

contextBridge.exposeInMainWorld('api', {
    showOpenDialog: () => {
        ipcRenderer.send('show-open-dialog');
    },
    showExportHTMLDialog: (html: string) => {
        ipcRenderer.send('show-export-html-dialog', html);
    },
    saveFile: async (content: string) => {
        ipcRenderer.send('save-file', content);
    },
    checkForUnsavedChanges: async (content: string) => {
        const result = await ipcRenderer.invoke('has-changes', content);
        return result;
    },
    showInFolder: async () => {
        ipcRenderer.send('show-in-folder');
    },
    openInDefaultApp: async () => {
        ipcRenderer.send('open-in-default-app');
    }
});
