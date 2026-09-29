// 向网页暴露最小的客户端信息（网页据此隐藏“下载客户端”入口、显示版本）
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('aliClient', {
  isClient: true,
  platform: process.platform,
  info: () => ipcRenderer.invoke('aliali:info'),
  about: () => ipcRenderer.send('aliali:about'),
});
