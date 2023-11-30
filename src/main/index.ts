import { BrowserWindow, Menu, MenuItemConstructorOptions, app, dialog, ipcMain, shell } from 'electron';
import { readFile, writeFile } from 'fs/promises';
import { basename, join } from 'path';

type MarkdownFile = {
  content?: string;
  filePath?: string;
};

const getCurrentFile = async (browserWindow: BrowserWindow) => {
  if (currentFile.filePath) return currentFile;
  if (!browserWindow) return;
  return showSaveDialog(browserWindow);
};

const setCurrentFile = (browserWindow: BrowserWindow, filePath: string, content: string) => {
  currentFile.filePath = filePath;
  currentFile.content = content;

  // app.addRecentDocument(filePath);
  browserWindow.setTitle(`${basename(filePath)} - ${app.name}`);
  browserWindow.setRepresentedFilename(filePath);
};

const hasChanges = (content: string) => {
  return content !== currentFile.content;
}

let currentFile: MarkdownFile = {
  content: '',
  filePath: undefined,
};

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.webContents.openDevTools({
    mode: 'detach',
  });
  return mainWindow;
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

const showOpenDialog = async (browserWindow: BrowserWindow) => {
  const result = await dialog.showOpenDialog(browserWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Markdown', extensions: ['md'] }]
  });

  if (result.canceled) return;

  const [filePath] = result.filePaths;
  openFile(browserWindow, filePath);
}

const openFile = async (browserWindow: BrowserWindow, filePath: string) => {
  const content = await readFile(filePath, 'utf-8');

  setCurrentFile(browserWindow, filePath, content);

  browserWindow.webContents.send('file-opened', content, filePath);
};

const showExportHtmlDialog = async (browserWindow: BrowserWindow, html: string) => {
  const result = await dialog.showSaveDialog(browserWindow, {
    title: 'Export HTML',
    defaultPath: app.getPath('documents'),
    filters: [{ name: 'HTML Files', extensions: ['html'] }]
  });

  if (result.canceled) return;

  const { filePath } = result;

  if (!filePath) return;

  exportHtml(html, filePath);
}

const exportHtml = async (html: string, filePath: string) => {
  await writeFile(filePath, html, { encoding: 'utf-8' });
};

ipcMain.on('show-open-dialog', (event) => {
  const browserWindow = BrowserWindow.fromWebContents(event.sender);
  if (!browserWindow) return;
  showOpenDialog(browserWindow);
});

ipcMain.on('show-export-html-dialog', async (event, html: string) => {
  const browserWindow = BrowserWindow.fromWebContents(event.sender);
  if (!browserWindow) return;
  showExportHtmlDialog(browserWindow, html);
});

ipcMain.handle('has-changes', (event, content: string) => {
  const browserWindow = BrowserWindow.fromWebContents(event.sender);
  const changed = hasChanges(content);
  browserWindow?.setDocumentEdited(changed);
  return changed;
});

const showSaveDialog = async (browserWindow: BrowserWindow) => {
  const result = await dialog.showSaveDialog(browserWindow, {
    title: 'Save Markdown',
    defaultPath: app.getPath('documents'),
    filters: [{ name: 'Markdown Files', extensions: ['md'] }]
  });

  if (result.canceled) return;

  const { filePath } = result;

  if (!filePath) return;

  return filePath;
}

const saveFile = async (browserWindow: BrowserWindow, content: string) => {
  const filePath = await getCurrentFile(browserWindow);

  if (!filePath) return;

  await writeFile(filePath, content, { encoding: 'utf-8' });
  setCurrentFile(browserWindow, filePath, content);
};

ipcMain.on('save-file', async (event, content: string) => {
  const browserWindow = BrowserWindow.fromWebContents(event.sender);
  if (!browserWindow) return;
  await saveFile(browserWindow, content);
});

ipcMain.on('show-in-folder', () => {
  if (!currentFile.filePath) return;

  shell.showItemInFolder(currentFile.filePath);
});

ipcMain.on('open-in-default-app', () => {
  if (!currentFile.filePath) return;

  shell.openPath(currentFile.filePath);
});

const template: MenuItemConstructorOptions[] = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Open',
        accelerator: 'CmdOrCtrl+O',
        click: () => {
          let browserWindow = BrowserWindow.getFocusedWindow();
          if (!browserWindow) browserWindow = createWindow();
          showOpenDialog(browserWindow);
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Show in Folder',
        accelerator: 'CmdOrCtrl+Shift+O',
        click: () => {
          let browserWindow = BrowserWindow.getFocusedWindow();
          if (!browserWindow) browserWindow = createWindow();
          if (!currentFile.filePath) return;
          shell.showItemInFolder(currentFile.filePath);
        }
      },
      {
        label: 'Open in Default Application',
        accelerator: 'CmdOrCtrl+Shift+P',
        click: () => {
          let browserWindow = BrowserWindow.getFocusedWindow();
          if (!browserWindow) browserWindow = createWindow();
          if (!currentFile.filePath) return;
          shell.openPath(currentFile.filePath);
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Quit',
        accelerator: 'CmdOrCtrl+Q',
        click: () => {
          app.quit();
        }
      }
    ]
  },
  {
    label: 'Edit',
    role: 'editMenu',
  },
];

if (process.platform === 'darwin') {
  template.unshift({
    label: app.name,
    role: 'appMenu'
  });
}

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
