const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getLibrary: () => ipcRenderer.invoke('getLibrary'),
  onLibraryChanged: (cb) => ipcRenderer.on('library:changed', (_e, data) => cb(data)),
  addFolder: () => ipcRenderer.invoke('addFolder'),
  removeFolder: (folder) => ipcRenderer.invoke('removeFolder', folder),
  readFont: (file) => ipcRenderer.invoke('readFont', file),
  setActive: (files, on) => ipcRenderer.invoke('setActive', files, on),
  setFavorite: (family, on) => ipcRenderer.invoke('setFavorite', family, on),
  fontInfo: (file) => ipcRenderer.invoke('fontInfo', file),
  providers: {
    catalog: (id) => ipcRenderer.invoke('providers:catalog', id),
    setActive: (id, family, on) => ipcRenderer.invoke('providers:setActive', id, family, on),
  },
  window: {
    minimize: () => ipcRenderer.send('win:minimize'),
    toggleMaximize: () => ipcRenderer.send('win:toggleMaximize'),
    close: () => ipcRenderer.send('win:close'),
    isMaximized: () => ipcRenderer.invoke('win:isMaximized'),
    getBounds: () => ipcRenderer.invoke('win:getBounds'),
    setBounds: (b) => ipcRenderer.send('win:setBounds', b),
    onMaximized: (cb) => ipcRenderer.on('win:maximized', (_e, v) => cb(v)),
    onTrim: (cb) => ipcRenderer.on('win:trim', () => cb()),
  },
  getSettings: () => ipcRenderer.invoke('getSettings'),
  setSettings: (patch) => ipcRenderer.invoke('setSettings', patch),
  icons: {
    collections: () => ipcRenderer.invoke('icons:collections'),
    collection: (prefix) => ipcRenderer.invoke('icons:collection', prefix),
    search: (query) => ipcRenderer.invoke('icons:search', query),
    data: (prefix, names) => ipcRenderer.invoke('icons:data', prefix, names),
    download: (prefix) => ipcRenderer.invoke('icons:download', prefix),
    libraries: () => ipcRenderer.invoke('icons:libraries'),
    load: (prefix) => ipcRenderer.invoke('icons:load', prefix),
    remove: (prefix) => ipcRenderer.invoke('icons:remove', prefix),
    saveSvg: (name, svg) => ipcRenderer.invoke('icons:saveSvg', name, svg),
    favorites: () => ipcRenderer.invoke('iconFavorites'),
    setFavorite: (prefix, on) => ipcRenderer.invoke('setIconFavorite', prefix, on),
    startDrag: (name, svg) => ipcRenderer.send('icons:startDrag', name, svg),
    onProgress: (cb) => {
      const h = (_e, prefix, done, total) => cb(prefix, done, total);
      ipcRenderer.on('icons:progress', h);
      return () => ipcRenderer.removeListener('icons:progress', h);
    },
  },
});
