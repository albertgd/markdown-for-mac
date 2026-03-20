/**
 * Markdown for Mac — Main Process
 *
 * @author  Albert Garcia Diaz
 * @created 2026-03-20
 * @description Electron main process. Handles window management, native menus,
 *              IPC communication, markdown rendering, and file associations.
 */
'use strict';

const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { marked } = require('marked');
const hljs = require('highlight.js');

// ─── Markdown Setup ──────────────────────────────────────────────────────────

function slugify(text) {
  return text
    .replace(/<[^>]*>/g, '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const renderer = new marked.Renderer();

renderer.heading = function (text, level) {
  const id = slugify(text);
  return `<h${level} id="${id}">${text}</h${level}>\n`;
};

renderer.link = function (href, title, text) {
  const titleAttr = title ? ` title="${title}"` : '';
  if (href && href.startsWith('http')) {
    return `<a href="${href}"${titleAttr} class="external-link" data-href="${href}">${text}</a>`;
  }
  return `<a href="${href}"${titleAttr}>${text}</a>`;
};

renderer.image = function (href, title, text) {
  const titleAttr = title ? ` title="${title}"` : '';
  const altAttr = text ? ` alt="${text}"` : '';
  return `<img src="${href}"${altAttr}${titleAttr} loading="lazy" />`;
};

marked.setOptions({
  renderer,
  gfm: true,
  breaks: false,
  mangle: false,
  headerIds: false,
  highlight(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
    }
    return hljs.highlightAuto(code).value;
  }
});

function generateTOC(content) {
  const tokens = marked.lexer(content);
  const toc = [];
  tokens.forEach(token => {
    if (token.type === 'heading') {
      toc.push({
        level: token.depth,
        text: token.text.replace(/<[^>]*>/g, ''),
        id: slugify(token.text)
      });
    }
  });
  return toc;
}

function resolveImagePaths(content, filePath) {
  const fileDir = path.dirname(filePath);
  return content.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    (match, alt, src) => {
      const cleanSrc = src.split(' ')[0]; // remove title part
      if (
        !cleanSrc.startsWith('http') &&
        !cleanSrc.startsWith('data:') &&
        !cleanSrc.startsWith('file:') &&
        !path.isAbsolute(cleanSrc)
      ) {
        const absPath = path.resolve(fileDir, cleanSrc).replace(/\\/g, '/');
        const rest = src.slice(cleanSrc.length);
        return `![${alt}](file://${absPath}${rest})`;
      }
      return match;
    }
  );
}

function renderFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const processed = resolveImagePaths(content, filePath);
  const html = marked.parse(processed);
  const toc = generateTOC(content);
  return { html, toc };
}

// ─── Recent Files ────────────────────────────────────────────────────────────

let recentFilesPath;

function getRecentFiles() {
  try {
    const raw = fs.readFileSync(recentFilesPath, 'utf8');
    return JSON.parse(raw).filter(f => {
      try { fs.accessSync(f); return true; } catch { return false; }
    });
  } catch {
    return [];
  }
}

function addRecentFile(filePath) {
  const recent = getRecentFiles().filter(f => f !== filePath);
  recent.unshift(filePath);
  try {
    fs.writeFileSync(recentFilesPath, JSON.stringify(recent.slice(0, 20)));
  } catch {}
  try { app.addRecentDocument(filePath); } catch {}
  buildMenu();
}

// ─── Window ──────────────────────────────────────────────────────────────────

let mainWindow;
let pendingFile = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 640,
    minHeight: 480,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 18 },
    backgroundColor: '#ffffff',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (pendingFile) {
      openFilePath(pendingFile);
      pendingFile = null;
    }
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

function openFilePath(filePath) {
  if (!mainWindow) return;
  try {
    const { html, toc } = renderFile(filePath);
    addRecentFile(filePath);
    mainWindow.setRepresentedFilename(filePath);
    mainWindow.setTitle(path.basename(filePath));
    mainWindow.webContents.send('file:opened', {
      path: filePath,
      name: path.basename(filePath),
      html,
      toc
    });
  } catch (err) {
    dialog.showErrorBox('Error opening file', err.message);
  }
}

// ─── IPC Handlers ────────────────────────────────────────────────────────────

ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Markdown', extensions: ['md', 'markdown', 'mdown', 'mkd', 'txt'] }]
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  const filePath = result.filePaths[0];
  try {
    const { html, toc } = renderFile(filePath);
    addRecentFile(filePath);
    mainWindow.setRepresentedFilename(filePath);
    mainWindow.setTitle(path.basename(filePath));
    return { path: filePath, name: path.basename(filePath), html, toc };
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle('dialog:openFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  const folderPath = result.filePaths[0];
  const files = getMarkdownFiles(folderPath);
  return { path: folderPath, name: path.basename(folderPath), files };
});

ipcMain.handle('fs:readFile', async (_event, filePath) => {
  try {
    const { html, toc } = renderFile(filePath);
    addRecentFile(filePath);
    mainWindow.setRepresentedFilename(filePath);
    mainWindow.setTitle(path.basename(filePath));
    return { path: filePath, name: path.basename(filePath), html, toc };
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle('app:recentFiles', () => getRecentFiles());

ipcMain.handle('app:openExternal', (_event, url) => {
  shell.openExternal(url);
});

ipcMain.handle('app:exportPDF', async () => {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [{ name: 'PDF', extensions: ['pdf'] }],
    defaultPath: 'document.pdf'
  });
  if (result.canceled) return { canceled: true };
  try {
    const data = await mainWindow.webContents.printToPDF({
      marginsType: 0,
      printBackground: true,
      pageSize: 'A4'
    });
    fs.writeFileSync(result.filePath, data);
    return { success: true, path: result.filePath };
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.on('find:start', (_event, { query, forward }) => {
  mainWindow?.webContents.findInPage(query, { forward: forward !== false });
});

ipcMain.on('find:stop', () => {
  mainWindow?.webContents.stopFindInPage('clearSelection');
});

// ─── File Tree ───────────────────────────────────────────────────────────────

function getMarkdownFiles(dirPath, depth = 0) {
  if (depth > 5) return [];
  const entries = [];
  try {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const item of items) {
      if (item.name.startsWith('.') || item.name === 'node_modules') continue;
      const fullPath = path.join(dirPath, item.name);
      if (item.isDirectory()) {
        const children = getMarkdownFiles(fullPath, depth + 1);
        if (children.length > 0) {
          entries.push({ name: item.name, path: fullPath, type: 'dir', children });
        }
      } else if (/\.(md|markdown|mdown|mkd)$/i.test(item.name)) {
        entries.push({ name: item.name, path: fullPath, type: 'file' });
      }
    }
  } catch {}
  return entries;
}

// ─── Menu ────────────────────────────────────────────────────────────────────

function buildMenu() {
  const recent = getRecentFiles();
  const recentSubmenu = recent.length === 0
    ? [{ label: 'No Recent Files', enabled: false }]
    : [
        ...recent.map(f => ({
          label: path.basename(f),
          sublabel: path.dirname(f),
          click: () => openFilePath(f)
        })),
        { type: 'separator' },
        {
          label: 'Clear Recent Files',
          click: () => {
            try { fs.writeFileSync(recentFilesPath, '[]'); } catch {}
            try { app.clearRecentDocuments(); } catch {}
            buildMenu();
          }
        }
      ];

  const template = [
    {
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'File',
      submenu: [
        {
          label: 'Open File…',
          accelerator: 'CmdOrCtrl+O',
          click: () => mainWindow?.webContents.send('menu:openFile')
        },
        {
          label: 'Open Folder…',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: () => mainWindow?.webContents.send('menu:openFolder')
        },
        { type: 'separator' },
        { label: 'Open Recent', submenu: recentSubmenu },
        { type: 'separator' },
        { label: 'Close Window', accelerator: 'CmdOrCtrl+W', role: 'close' },
        { type: 'separator' },
        {
          label: 'Print…',
          accelerator: 'CmdOrCtrl+P',
          click: () => mainWindow?.webContents.print()
        },
        {
          label: 'Export as PDF…',
          accelerator: 'CmdOrCtrl+Shift+E',
          click: () => mainWindow?.webContents.send('menu:exportPDF')
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
        { type: 'separator' },
        {
          label: 'Find…',
          accelerator: 'CmdOrCtrl+F',
          click: () => mainWindow?.webContents.send('menu:find')
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Sidebar',
          accelerator: 'CmdOrCtrl+\\',
          click: () => mainWindow?.webContents.send('menu:toggleSidebar')
        },
        { type: 'separator' },
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+=',
          click: () => mainWindow?.webContents.send('menu:zoomIn')
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => mainWindow?.webContents.send('menu:zoomOut')
        },
        {
          label: 'Reset Zoom',
          accelerator: 'CmdOrCtrl+0',
          click: () => mainWindow?.webContents.send('menu:zoomReset')
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'toggleDevTools' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ─── App Events ──────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  recentFilesPath = path.join(app.getPath('userData'), 'recent-files.json');

  // Handle file passed as CLI argument (e.g. electron . file.md)
  const cliFile = process.argv.slice(2).find(a => !a.startsWith('-') && /\.(md|markdown|mdown|mkd)$/i.test(a));
  if (cliFile) {
    pendingFile = path.resolve(cliFile);
  }

  buildMenu();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('open-file', (event, filePath) => {
  event.preventDefault();
  if (mainWindow?.webContents) {
    openFilePath(filePath);
  } else {
    pendingFile = filePath;
    if (app.isReady()) createWindow();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
