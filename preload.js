/**
 * Markdown for Mac — Preload Script
 *
 * @author  Albert Garcia Diaz
 * @created 2026-03-20
 * @description Secure contextBridge between the Electron main process and the
 *              renderer. Exposes a minimal, safe API via window.api.
 */
'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // File operations
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),

  // App
  getRecentFiles: () => ipcRenderer.invoke('app:recentFiles'),
  openExternal: (url) => ipcRenderer.invoke('app:openExternal', url),
  exportPDF: () => ipcRenderer.invoke('app:exportPDF'),

  // Find in page
  findInPage: (query, forward = true) => ipcRenderer.send('find:start', { query, forward }),
  stopFind: () => ipcRenderer.send('find:stop'),

  // Events from main process
  onFileOpened: (cb) => ipcRenderer.on('file:opened', cb),
  onMenuOpenFile: (cb) => ipcRenderer.on('menu:openFile', cb),
  onMenuOpenFolder: (cb) => ipcRenderer.on('menu:openFolder', cb),
  onMenuFind: (cb) => ipcRenderer.on('menu:find', cb),
  onMenuExportPDF: (cb) => ipcRenderer.on('menu:exportPDF', cb),
  onToggleSidebar: (cb) => ipcRenderer.on('menu:toggleSidebar', cb),
  onZoomIn: (cb) => ipcRenderer.on('menu:zoomIn', cb),
  onZoomOut: (cb) => ipcRenderer.on('menu:zoomOut', cb),
  onZoomReset: (cb) => ipcRenderer.on('menu:zoomReset', cb)
});
