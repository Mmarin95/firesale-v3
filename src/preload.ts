import { contextBridge, ipcRenderer } from "electron";
import Elements from "./renderer/elements";
import { renderMarkdown } from "./renderer/markdown";

ipcRenderer.on('file-opened', (_, content: string, filePath: string) => {
    Elements.MarkdownView.value = content;
    renderMarkdown(content)
});

contextBridge.exposeInMainWorld('api', {
    showOpenDialog: () => {
        ipcRenderer.send('show-open-dialog');
    },
    showExportHTMLDialog: (html: string) => {
        ipcRenderer.send('show-export-html-dialog', html);
    }
});
