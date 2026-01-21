const { app, BrowserWindow, ipcMain, dialog, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { autoUpdater } = require('electron-updater');
const compilerService = require('./compiler');

// Force App Identity for Windows Taskbar
app.name = "SIMATS Lab IDE";

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    frame: false, // Custom Title Bar
    icon: nativeImage.createFromPath(path.join(__dirname, 'assets', 'icon.ico')),
    backgroundColor: '#121212',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true
    }
  });

  const setupDonePath = path.join(app.getPath('userData'), '.setup_done');
  const isSetupDone = fs.existsSync(setupDonePath);

  if (!isSetupDone) {
    mainWindow.loadFile('setup.html');
  } else {
    mainWindow.loadFile('index.html');
  }
}

// --- Auto Updater Events ---
function sendStatusToWindow(text, status = 'info') {
  console.log(`[Update] ${text}`);
  if (mainWindow) {
    mainWindow.webContents.send('message', { text, status });
  }
}

autoUpdater.on('checking-for-update', () => {
  sendStatusToWindow('Checking for update...');
});

autoUpdater.on('update-available', (info) => {
  sendStatusToWindow('Update available! Downloading...', 'available');
});

autoUpdater.on('update-not-available', (info) => {
  sendStatusToWindow('Update not available.');
});

autoUpdater.on('error', (err) => {
  sendStatusToWindow('Error in auto-updater: ' + err, 'error');
});

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  console.log(`[Update] ${log_message}`);
  if (mainWindow) {
    mainWindow.webContents.send('download-progress', progressObj.percent);
  }
});

autoUpdater.on('update-downloaded', (info) => {
  sendStatusToWindow('Update downloaded; will install in 5 seconds', 'downloaded');

  // Wait 5 seconds then quit and install
  setTimeout(function () {
    autoUpdater.quitAndInstall();
  }, 5000);
});

app.whenReady().then(() => {
  if (process.platform === 'win32') {
    app.setAppUserModelId("SIMATS Lab IDE");
  }

  createWindow();

  // Check for updates AFTER app starts
  autoUpdater.checkForUpdatesAndNotify();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Window Control Handlers
ipcMain.handle('minimize-window', () => {
  mainWindow.minimize();
});

ipcMain.handle('maximize-window', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.handle('close-window', () => {
  mainWindow.close();
});

// File System Handlers
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  return result.filePaths[0];
});

ipcMain.handle('save-file-dialog', async (event, { defaultPath, title, extensions }) => {
  const filters = [];
  if (extensions && extensions.length > 0) {
    const nameMap = { 'c': 'C Source', 'cpp': 'C++ Source', 'java': 'Java Source', 'py': 'Python Source' };
    const name = nameMap[extensions[0]] || 'Source Files';
    filters.push({ name, extensions });
  }
  filters.push({ name: 'All Files', extensions: ['*'] });

  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath,
    title,
    filters
  });
  return result.filePath;
});

// IPC Handler
ipcMain.handle('run-code', async (event, { language, code }) => {
  console.log(`[Main] Request to run ${language}`);

  // Delegate to Compiler Service
  const result = await compilerService.run(language, code);

  console.log(`[Main] Finished ${language}. Out: ${result.stdout ? result.stdout.length : 0}b, Err: ${result.stderr ? result.stderr.length : 0}b`);

  return result;
});

// Setup Handlers
ipcMain.handle('check-compiler', async (event, command) => {
  return new Promise((resolve) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        resolve({ success: false, error: error.message });
      } else {
        resolve({ success: true, stdout });
      }
    });
  });
});

ipcMain.handle('setup-complete', async () => {
  const setupDonePath = path.join(app.getPath('userData'), '.setup_done');
  fs.writeFileSync(setupDonePath, 'true');

  // Reload the window with the main IDE
  mainWindow.loadFile('index.html');
});
