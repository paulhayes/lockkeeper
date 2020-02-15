const url = require('url');
const path = require('path');

// 3rd party dependancies
const electron = require('electron');
const BrowserWindow = electron.BrowserWindow;
const ipc = electron.ipcMain;

const urlconsole = "console.htm";  // url for the console page

let conWindow;
let logBuffer = [];
let logLength = 250;    // No. of lines of console log to keep.


// Create the console log window
const createConsole = function() {
  if (conWindow) { conWindow.show(); return; }
  // Create the hidden console window
  conWindow = new BrowserWindow({
      title: "Lockkeeper Console",
      width: 800,
      height: 600,
      icon: path.join(__dirname, 'nodered.png'),
      autoHideMenuBar: true
  });
  conWindow.loadURL(url.format({
      pathname: path.join(__dirname, urlconsole),
      protocol: 'file:',
      slashes: true
  }))
  conWindow.webContents.on('did-finish-load', () => {
      conWindow.webContents.send('logBuff', logBuffer);
  });
  conWindow.on('closed', () => {
      conWindow = null;
  });
  //conWindow.webContents.openDevTools();

  return conWindow;
}

const logHandler = function() {
  return function(msg) {
      console.log(msg);
      
      var ts = (new Date(msg.timestamp)).toISOString();
      ts = ts.replace("Z"," ").replace("T"," ");
      var line = ts+" : "+msg.msg;
      logBuffer.push(line);
      if (conWindow) { conWindow.webContents.send('debugMsg', line); }
      if (logBuffer.length > logLength) { logBuffer.shift(); }
      
  }
}

const init = function(settings){
  ipc.on('clearLogBuffer', function(event, arg) { logBuffer = []; });

  let logging = {
      websock: {
          level: 'info',
          metrics: false,
          handler : logHandler      
      }
  };

  settings.logging = logging;
}

module.exports = {
  init,
  createConsole
}